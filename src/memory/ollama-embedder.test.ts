import { describe, it, expect } from 'vitest';
import { OllamaEmbedder } from './ollama-embedder.js';

interface FakeResponse { ok: boolean; status: number; statusText: string; json: () => Promise<unknown>; }
function fakeFetch(impl: (req: { url: string; method?: string; body?: string; signal?: AbortSignal }) => Promise<FakeResponse>): typeof fetch {
  return (async (input: RequestInfo | URL, init?: RequestInit) => {
    return impl({
      url: String(input),
      method: init?.method,
      body: init?.body as string | undefined,
      signal: init?.signal as AbortSignal | undefined,
    });
  }) as unknown as typeof fetch;
}

describe('OllamaEmbedder.available', () => {
  it('returns true when daemon responds and model is loaded', async () => {
    const fetchImpl = fakeFetch(async () => ({
      ok: true, status: 200, statusText: 'OK',
      json: async () => ({ models: [{ name: 'nomic-embed-text:latest' }, { name: 'llama3.2:3b' }] }),
    }));
    expect(await OllamaEmbedder.available({ fetchImpl })).toBe(true);
  });

  it('returns false when model is not loaded', async () => {
    const fetchImpl = fakeFetch(async () => ({
      ok: true, status: 200, statusText: 'OK',
      json: async () => ({ models: [{ name: 'llama3.2:3b' }] }),
    }));
    expect(await OllamaEmbedder.available({ fetchImpl })).toBe(false);
  });

  it('honors a custom model when probing', async () => {
    const fetchImpl = fakeFetch(async () => ({
      ok: true, status: 200, statusText: 'OK',
      json: async () => ({ models: [{ name: 'mxbai-embed-large' }] }),
    }));
    expect(await OllamaEmbedder.available({ fetchImpl, model: 'mxbai-embed-large' })).toBe(true);
  });

  it('returns false on non-ok response', async () => {
    const fetchImpl = fakeFetch(async () => ({ ok: false, status: 500, statusText: 'Server Error', json: async () => ({}) }));
    expect(await OllamaEmbedder.available({ fetchImpl })).toBe(false);
  });

  it('returns false when daemon is unreachable', async () => {
    const fetchImpl = fakeFetch(async () => { throw new Error('ECONNREFUSED'); });
    expect(await OllamaEmbedder.available({ fetchImpl })).toBe(false);
  });

  it('handles missing models field gracefully', async () => {
    const fetchImpl = fakeFetch(async () => ({ ok: true, status: 200, statusText: 'OK', json: async () => ({}) }));
    expect(await OllamaEmbedder.available({ fetchImpl })).toBe(false);
  });

  it('handles entries without a name field', async () => {
    const fetchImpl = fakeFetch(async () => ({
      ok: true, status: 200, statusText: 'OK',
      json: async () => ({ models: [{}, { name: 'nomic-embed-text' }] }),
    }));
    expect(await OllamaEmbedder.available({ fetchImpl })).toBe(true);
  });
});

describe('OllamaEmbedder.embed', () => {
  it('posts to /api/embeddings with model + prompt', async () => {
    let captured: { url: string; body: string } | null = null;
    const e = new OllamaEmbedder({
      model: 'nomic-embed-text', dim: 4,
      fetchImpl: fakeFetch(async req => {
        captured = { url: req.url, body: req.body ?? '' };
        return { ok: true, status: 200, statusText: 'OK', json: async () => ({ embedding: [1, 0, 0, 0] }) };
      }),
    });
    const v = await e.embed('hello');
    expect(captured!.url).toBe('http://localhost:11434/api/embeddings');
    expect(JSON.parse(captured!.body)).toEqual({ model: 'nomic-embed-text', prompt: 'hello' });
    expect(v.length).toBe(4);
    // L2-normalized: [1,0,0,0] -> [1,0,0,0] (already unit)
    expect(Array.from(v)).toEqual([1, 0, 0, 0]);
  });

  it('L2-normalizes the response vector', async () => {
    const e = new OllamaEmbedder({
      dim: 3,
      fetchImpl: fakeFetch(async () => ({ ok: true, status: 200, statusText: 'OK', json: async () => ({ embedding: [3, 4, 0] }) })),
    });
    const v = await e.embed('x');
    // L2 norm of [3,4,0] = 5; normalized = [0.6, 0.8, 0]
    expect(Number(v[0]!.toFixed(2))).toBe(0.6);
    expect(Number(v[1]!.toFixed(2))).toBe(0.8);
  });

  it('returns a zero vector when daemon emits empty embedding (no crash)', async () => {
    const e = new OllamaEmbedder({
      dim: 5,
      fetchImpl: fakeFetch(async () => ({ ok: true, status: 200, statusText: 'OK', json: async () => ({}) })),
    });
    const v = await e.embed('x');
    expect(v.length).toBe(5);
    expect(Array.from(v)).toEqual([0, 0, 0, 0, 0]);
  });

  it('throws on non-OK response', async () => {
    const e = new OllamaEmbedder({
      fetchImpl: fakeFetch(async () => ({ ok: false, status: 503, statusText: 'unavailable', json: async () => ({}) })),
    });
    await expect(e.embed('x')).rejects.toThrow(/ollama embeddings 503/);
  });

  it('reads model + dim from env when no constructor override', async () => {
    const orig = { m: process.env['SIFTCODER_OLLAMA_EMBED_MODEL'], d: process.env['SIFTCODER_OLLAMA_EMBED_DIM'] };
    process.env['SIFTCODER_OLLAMA_EMBED_MODEL'] = 'mxbai-embed-large';
    process.env['SIFTCODER_OLLAMA_EMBED_DIM'] = '1024';
    try {
      let sentModel = '';
      const e = new OllamaEmbedder({
        fetchImpl: fakeFetch(async req => {
          sentModel = JSON.parse(req.body ?? '{}').model;
          return { ok: true, status: 200, statusText: 'OK', json: async () => ({ embedding: new Array(1024).fill(0) }) };
        }),
      });
      expect(e.dim).toBe(1024);
      await e.embed('x');
      expect(sentModel).toBe('mxbai-embed-large');
    } finally {
      if (orig.m === undefined) delete process.env['SIFTCODER_OLLAMA_EMBED_MODEL'];
      else process.env['SIFTCODER_OLLAMA_EMBED_MODEL'] = orig.m;
      if (orig.d === undefined) delete process.env['SIFTCODER_OLLAMA_EMBED_DIM'];
      else process.env['SIFTCODER_OLLAMA_EMBED_DIM'] = orig.d;
    }
  });

  it('strips trailing slashes from host', async () => {
    let seenUrl = '';
    const e = new OllamaEmbedder({
      host: 'http://localhost:11434/',
      fetchImpl: fakeFetch(async req => {
        seenUrl = req.url;
        return { ok: true, status: 200, statusText: 'OK', json: async () => ({ embedding: [1] }) };
      }),
    });
    await e.embed('x');
    expect(seenUrl).toBe('http://localhost:11434/api/embeddings');
  });
});
