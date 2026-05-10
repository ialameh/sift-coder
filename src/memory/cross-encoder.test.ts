import { describe, it, expect } from 'vitest';
import { HttpCrossEncoder, crossEncoderToReranker, loadCrossEncoderFromEnv, type FetchLike, type CrossEncoder } from './cross-encoder.js';
import type { HybridHit } from './retrieval.js';

function fetchOk(body: unknown): FetchLike {
  return async () => ({ ok: true, status: 200, json: async () => body });
}
function fetchStatus(status: number): FetchLike {
  return async () => ({ ok: false, status, json: async () => ({}) });
}

describe('HttpCrossEncoder.score', () => {
  it('returns [] for empty docs without making a request', async () => {
    let called = 0;
    const fetchImpl: FetchLike = async () => { called++; return { ok: true, status: 200, json: async () => ({}) }; };
    const ce = new HttpCrossEncoder({ baseUrl: 'http://x', fetchImpl });
    expect(await ce.score('q', [])).toEqual([]);
    expect(called).toBe(0);
  });

  it('parses Jina/TEI { scores } shape in document order', async () => {
    const ce = new HttpCrossEncoder({ baseUrl: 'http://x', fetchImpl: fetchOk({ scores: [0.9, 0.1, 0.5] }) });
    expect(await ce.score('q', ['a', 'b', 'c'])).toEqual([0.9, 0.1, 0.5]);
  });

  it('parses Cohere { results } shape into a dense score array', async () => {
    const ce = new HttpCrossEncoder({
      baseUrl: 'http://x',
      fetchImpl: fetchOk({ results: [{ index: 2, relevance_score: 0.95 }, { index: 0, relevance_score: 0.4 }] }),
    });
    const scores = await ce.score('q', ['a', 'b', 'c']);
    expect(scores[0]).toBe(0.4);
    expect(scores[2]).toBe(0.95);
    expect(scores[1]).toBe(-Infinity); // omitted by Cohere when below threshold
  });

  it('throws on non-2xx so the adapter can fall back', async () => {
    const ce = new HttpCrossEncoder({ baseUrl: 'http://x', fetchImpl: fetchStatus(500) });
    await expect(ce.score('q', ['a'])).rejects.toThrow('cross-encoder: HTTP 500');
  });

  it('throws on malformed response body', async () => {
    const ce = new HttpCrossEncoder({ baseUrl: 'http://x', fetchImpl: fetchOk({ unexpected: true }) });
    await expect(ce.score('q', ['a'])).rejects.toThrow(/missing/);
  });

  it('sends Authorization header when token is set', async () => {
    let captured: Record<string, string> | undefined;
    const fetchImpl: FetchLike = async (_url, init) => {
      captured = init?.headers;
      return { ok: true, status: 200, json: async () => ({ scores: [1] }) };
    };
    const ce = new HttpCrossEncoder({ baseUrl: 'http://x', token: 't', fetchImpl });
    await ce.score('q', ['a']);
    expect(captured?.['authorization']).toBe('Bearer t');
  });
});

describe('crossEncoderToReranker', () => {
  function makeHit(id: number, text: string, score: number): HybridHit {
    return { id, eventId: id, text, ts: 0, score };
  }

  it('reorders hits by reranker score descending', async () => {
    const ce: CrossEncoder = { score: async () => [0.1, 0.9, 0.5] };
    const reranker = crossEncoderToReranker(ce);
    const hits = [makeHit(1, 'a', 0.5), makeHit(2, 'b', 0.5), makeHit(3, 'c', 0.5)];
    const result = await reranker.rerank('q', hits);
    expect(result.map(h => h.id)).toEqual([2, 3, 1]);
    expect(result[0]!.score).toBe(0.9);
  });

  it('breaks reranker-score ties by original score', async () => {
    const ce: CrossEncoder = { score: async () => [0.5, 0.5] };
    const reranker = crossEncoderToReranker(ce);
    const hits = [makeHit(1, 'a', 0.2), makeHit(2, 'b', 0.8)];
    const result = await reranker.rerank('q', hits);
    expect(result.map(h => h.id)).toEqual([2, 1]);
  });

  it('falls back to original order when scoring throws', async () => {
    const ce: CrossEncoder = { score: async () => { throw new Error('boom'); } };
    const reranker = crossEncoderToReranker(ce);
    const hits = [makeHit(1, 'a', 0.1), makeHit(2, 'b', 0.9)];
    const result = await reranker.rerank('q', hits);
    expect(result.map(h => h.id)).toEqual([1, 2]); // unchanged on failure
  });

  it('returns an empty list as-is without calling the scorer', async () => {
    let called = 0;
    const ce: CrossEncoder = { score: async () => { called++; return []; } };
    const reranker = crossEncoderToReranker(ce);
    expect(await reranker.rerank('q', [])).toEqual([]);
    expect(called).toBe(0);
  });
});

describe('crossEncoderToReranker.ping', () => {
  it('reports ok with latency on a successful score call', async () => {
    const ce: CrossEncoder = { score: async () => [0.5] };
    const reranker = crossEncoderToReranker(ce);
    const probe = await reranker.ping!();
    expect(probe.ok).toBe(true);
    expect(probe.latencyMs).toBeGreaterThanOrEqual(0);
  });

  it('reports ok=false with error message when scoring throws', async () => {
    const ce: CrossEncoder = { score: async () => { throw new Error('connection refused'); } };
    const reranker = crossEncoderToReranker(ce);
    const probe = await reranker.ping!();
    expect(probe.ok).toBe(false);
    expect(probe.error).toBe('connection refused');
  });
});

describe('loadCrossEncoderFromEnv', () => {
  it('returns null when SIFTCODER_RERANKER_URL is unset', () => {
    expect(loadCrossEncoderFromEnv({})).toBeNull();
  });

  it('returns an HttpCrossEncoder when the URL is set', () => {
    const ce = loadCrossEncoderFromEnv({ SIFTCODER_RERANKER_URL: 'http://x' });
    expect(ce).toBeInstanceOf(HttpCrossEncoder);
  });
});
