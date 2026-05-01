import { describe, it, expect } from 'vitest';
import { CdgEmbedder } from './cdg-embedder.js';
import type { FetchLike } from './cdg-adapter.js';
import type { Embedder } from './embedder.js';

function fetchOk(body: unknown): FetchLike {
  return async () => ({ ok: true, status: 200, json: async () => body, text: async () => '' });
}

const fallback: Embedder = {
  dim: 384,
  async embed() { const v = new Float32Array(384); v[0] = 1; return v; },
};

describe('CdgEmbedder', () => {
  it('parses a valid response and returns an L2-normalized vector', async () => {
    const e = new CdgEmbedder({ baseUrl: 'http://x', fetchImpl: fetchOk({ vector: [3, 4] }) });
    const v = await e.embed('hello');
    expect(Math.hypot(v[0]!, v[1]!)).toBeCloseTo(1, 5);
    expect(v[0]).toBeCloseTo(0.6, 5);
    expect(v[1]).toBeCloseTo(0.8, 5);
  });

  it('returns a zero vector for empty input', async () => {
    const e = new CdgEmbedder({ baseUrl: 'http://x', fetchImpl: fetchOk({ vector: [1, 2] }) });
    const v = await e.embed('   ');
    expect(Array.from(v).every(x => x === 0)).toBe(true);
    expect(v.length).toBe(384);
  });

  it('uses the fallback when CDG returns a non-2xx status', async () => {
    const fail: FetchLike = async () => ({ ok: false, status: 500, json: async () => ({}), text: async () => '' });
    const e = new CdgEmbedder({ baseUrl: 'http://x', fetchImpl: fail, fallback });
    const v = await e.embed('hello');
    expect(v[0]).toBe(1);
  });

  it('uses the fallback when fetch throws', async () => {
    const e = new CdgEmbedder({
      baseUrl: 'http://x',
      fetchImpl: async () => { throw new Error('network'); },
      fallback,
    });
    const v = await e.embed('hello');
    expect(v[0]).toBe(1);
  });

  it('returns a zero vector when no fallback is configured and fetch fails', async () => {
    const e = new CdgEmbedder({
      baseUrl: 'http://x',
      fetchImpl: async () => { throw new Error('boom'); },
      fallback: null,
    });
    const v = await e.embed('hello');
    expect(Array.from(v).every(x => x === 0)).toBe(true);
  });

  it('falls back when response body is not an object', async () => {
    const fetchImpl: FetchLike = async () => ({ ok: true, status: 200, json: async () => 'plain', text: async () => '' });
    const e = new CdgEmbedder({ baseUrl: 'http://x', fetchImpl, fallback });
    const v = await e.embed('hello');
    expect(v[0]).toBe(1);
  });

  it('falls back when vector field is missing or not an array', async () => {
    const e1 = new CdgEmbedder({ baseUrl: 'http://x', fetchImpl: fetchOk({ vector: 'oops' }), fallback });
    const e2 = new CdgEmbedder({ baseUrl: 'http://x', fetchImpl: fetchOk({}), fallback });
    expect((await e1.embed('h'))[0]).toBe(1);
    expect((await e2.embed('h'))[0]).toBe(1);
  });

  it('falls back when vector contains non-finite numbers', async () => {
    const e = new CdgEmbedder({ baseUrl: 'http://x', fetchImpl: fetchOk({ vector: [1, 'NaN'] }), fallback });
    const v = await e.embed('h');
    expect(v[0]).toBe(1);
  });

  it('falls back when vector is empty', async () => {
    const e = new CdgEmbedder({ baseUrl: 'http://x', fetchImpl: fetchOk({ vector: [] }), fallback });
    const v = await e.embed('h');
    expect(v[0]).toBe(1);
  });

  it('sends a Bearer Authorization header when token is set', async () => {
    let captured: Record<string, string> = {};
    const fetchImpl: FetchLike = async (_url, init) => {
      captured = init?.headers ?? {};
      return { ok: true, status: 200, json: async () => ({ vector: [1] }), text: async () => '' };
    };
    const e = new CdgEmbedder({ baseUrl: 'http://x', token: 'secret', fetchImpl });
    await e.embed('h');
    expect(captured['authorization']).toBe('Bearer secret');
  });

  it('omits Authorization when no token is configured', async () => {
    let captured: Record<string, string> = {};
    const fetchImpl: FetchLike = async (_url, init) => {
      captured = init?.headers ?? {};
      return { ok: true, status: 200, json: async () => ({ vector: [1] }), text: async () => '' };
    };
    const e = new CdgEmbedder({ baseUrl: 'http://x', fetchImpl });
    await e.embed('h');
    expect(captured['authorization']).toBeUndefined();
  });

  it('uses configured endpoint and strips trailing slashes from baseUrl', async () => {
    let calledUrl = '';
    const fetchImpl: FetchLike = async url => {
      calledUrl = url;
      return { ok: true, status: 200, json: async () => ({ vector: [1] }), text: async () => '' };
    };
    const e = new CdgEmbedder({ baseUrl: 'http://x///', endpoint: '/v2/vec', fetchImpl });
    await e.embed('h');
    expect(calledUrl).toBe('http://x/v2/vec');
  });

  it('aborts on timeout and falls back', async () => {
    const fetchImpl: FetchLike = async (_url, init) => {
      return new Promise((_resolve, reject) => {
        init?.signal?.addEventListener('abort', () => reject(new Error('aborted')));
      });
    };
    const e = new CdgEmbedder({ baseUrl: 'http://x', timeoutMs: 5, fetchImpl, fallback });
    const v = await e.embed('h');
    expect(v[0]).toBe(1);
  });

  it('accepts a custom mapResponse', async () => {
    const e = new CdgEmbedder({
      baseUrl: 'http://x',
      fetchImpl: fetchOk({ embeddings: [[1, 0]] }),
      mapResponse: body => {
        const arr = (body as { embeddings: number[][] }).embeddings[0];
        return Float32Array.from(arr!);
      },
    });
    const v = await e.embed('h');
    expect(v[0]).toBeCloseTo(1, 5);
  });

  it('exposes the configured dim', () => {
    expect(new CdgEmbedder({ baseUrl: 'http://x', dim: 768 }).dim).toBe(768);
  });

  it('fromEnv returns null when SIFTCODER_CDG_URL is not set', () => {
    expect(CdgEmbedder.fromEnv({})).toBeNull();
  });

  it('fromEnv constructs an embedder when URL is set', () => {
    const e = CdgEmbedder.fromEnv({ SIFTCODER_CDG_URL: 'http://cdg', SIFTCODER_CDG_TOKEN: 't' });
    expect(e).toBeInstanceOf(CdgEmbedder);
  });

  it('fromEnv defaults to process.env when no env arg is given', () => {
    const orig = process.env['SIFTCODER_CDG_URL'];
    process.env['SIFTCODER_CDG_URL'] = 'http://from-process';
    try {
      const e = CdgEmbedder.fromEnv();
      expect(e).toBeInstanceOf(CdgEmbedder);
    } finally {
      if (orig === undefined) delete process.env['SIFTCODER_CDG_URL'];
      else process.env['SIFTCODER_CDG_URL'] = orig;
    }
  });
});
