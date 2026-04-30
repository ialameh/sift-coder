import { describe, it, expect } from 'vitest';
import { CdgSymbolExtractor, AsyncFromSync, type FetchLike } from './cdg-adapter.js';
import { RegexSymbolExtractor, type AsyncSymbolExtractor, type SymbolHit } from './symbols.js';

function fetchOk(symbols: unknown): FetchLike {
  return async () => ({
    ok: true,
    status: 200,
    json: async () => ({ symbols }),
    text: async () => JSON.stringify({ symbols }),
  });
}

function fetchStatus(status: number): FetchLike {
  return async () => ({
    ok: false,
    status,
    json: async () => ({}),
    text: async () => '',
  });
}

const failing: AsyncSymbolExtractor = {
  async extract(): Promise<SymbolHit[]> { return [{ kind: 'function', name: 'fallback' }]; },
};

describe('CdgSymbolExtractor', () => {
  it('parses a normal CDG response into SymbolHits', async () => {
    const e = new CdgSymbolExtractor({
      baseUrl: 'http://x',
      fetchImpl: fetchOk([
        { kind: 'function', name: 'login' },
        { kind: 'class', name: 'Auth' },
      ]),
    });
    const out = await e.extract('code', { path: '/x.ts' });
    expect(out).toEqual([
      { kind: 'function', name: 'login' },
      { kind: 'class', name: 'Auth' },
    ]);
  });

  it('defaults kind to "function" when the field is missing or not a string', async () => {
    const e = new CdgSymbolExtractor({
      baseUrl: 'http://x',
      fetchImpl: fetchOk([
        { name: 'noKind' },
        { kind: 42, name: 'numericKind' },
      ]),
    });
    expect(await e.extract('code')).toEqual([
      { kind: 'function', name: 'noKind' },
      { kind: 'function', name: 'numericKind' },
    ]);
  });

  it('coerces unknown kind values to "function"', async () => {
    const e = new CdgSymbolExtractor({
      baseUrl: 'http://x',
      fetchImpl: fetchOk([{ kind: 'macro', name: 'f' }]),
    });
    const out = await e.extract('code');
    expect(out).toEqual([{ kind: 'function', name: 'f' }]);
  });

  it('skips entries without a name', async () => {
    const e = new CdgSymbolExtractor({
      baseUrl: 'http://x',
      fetchImpl: fetchOk([{ kind: 'function' }, { kind: 'function', name: '' }, { kind: 'function', name: 'ok' }]),
    });
    expect(await e.extract('code')).toEqual([{ kind: 'function', name: 'ok' }]);
  });

  it('skips non-object array entries', async () => {
    const e = new CdgSymbolExtractor({
      baseUrl: 'http://x',
      fetchImpl: fetchOk([null, 42, 'string']),
    });
    expect(await e.extract('code')).toEqual([]);
  });

  it('returns empty array when response shape is unexpected', async () => {
    const fetchImpl: FetchLike = async () => ({ ok: true, status: 200, json: async () => 'plain', text: async () => 'plain' });
    const e = new CdgSymbolExtractor({ baseUrl: 'http://x', fetchImpl });
    expect(await e.extract('code')).toEqual([]);
  });

  it('returns empty array when symbols field is not an array', async () => {
    const fetchImpl: FetchLike = async () => ({ ok: true, status: 200, json: async () => ({ symbols: 'oops' }), text: async () => '' });
    const e = new CdgSymbolExtractor({ baseUrl: 'http://x', fetchImpl });
    expect(await e.extract('code')).toEqual([]);
  });

  it('falls back when CDG returns a non-2xx status', async () => {
    const e = new CdgSymbolExtractor({ baseUrl: 'http://x', fetchImpl: fetchStatus(503), fallback: failing });
    expect(await e.extract('code')).toEqual([{ kind: 'function', name: 'fallback' }]);
  });

  it('aborts the request on timeout and falls back', async () => {
    const fetchImpl: FetchLike = async (_url, init) => {
      return new Promise((resolve, reject) => {
        init?.signal?.addEventListener('abort', () => reject(new Error('aborted')));
        setTimeout(() => resolve({ ok: true, status: 200, json: async () => ({ symbols: [] }), text: async () => '' }), 200);
      });
    };
    const e = new CdgSymbolExtractor({ baseUrl: 'http://x', timeoutMs: 5, fetchImpl, fallback: failing });
    expect(await e.extract('code')).toEqual([{ kind: 'function', name: 'fallback' }]);
  });

  it('falls back when fetch throws', async () => {
    const e = new CdgSymbolExtractor({
      baseUrl: 'http://x',
      fetchImpl: async () => { throw new Error('network'); },
      fallback: failing,
    });
    expect(await e.extract('code')).toEqual([{ kind: 'function', name: 'fallback' }]);
  });

  it('returns [] when fallback is null and fetch fails', async () => {
    const e = new CdgSymbolExtractor({
      baseUrl: 'http://x',
      fetchImpl: async () => { throw new Error('network'); },
      fallback: null,
    });
    expect(await e.extract('code')).toEqual([]);
  });

  it('honors maxSymbols by truncating results', async () => {
    const e = new CdgSymbolExtractor({
      baseUrl: 'http://x',
      fetchImpl: fetchOk(Array.from({ length: 50 }, (_, i) => ({ kind: 'function', name: `fn${i}` }))),
    });
    expect(await e.extract('code', { maxSymbols: 5 })).toHaveLength(5);
  });

  it('sends a Bearer Authorization header when token is set', async () => {
    let captured: Record<string, string> = {};
    const fetchImpl: FetchLike = async (_url, init) => {
      captured = init?.headers ?? {};
      return { ok: true, status: 200, json: async () => ({ symbols: [] }), text: async () => '' };
    };
    const e = new CdgSymbolExtractor({ baseUrl: 'http://x/', token: 'secret', fetchImpl });
    await e.extract('code');
    expect(captured['authorization']).toBe('Bearer secret');
  });

  it('omits Authorization when no token configured', async () => {
    let captured: Record<string, string> = {};
    const fetchImpl: FetchLike = async (_url, init) => {
      captured = init?.headers ?? {};
      return { ok: true, status: 200, json: async () => ({ symbols: [] }), text: async () => '' };
    };
    const e = new CdgSymbolExtractor({ baseUrl: 'http://x', fetchImpl });
    await e.extract('code');
    expect(captured['authorization']).toBeUndefined();
  });

  it('strips trailing slash on baseUrl and uses the configured endpoint', async () => {
    let calledUrl = '';
    const fetchImpl: FetchLike = async url => {
      calledUrl = url;
      return { ok: true, status: 200, json: async () => ({ symbols: [] }), text: async () => '' };
    };
    const e = new CdgSymbolExtractor({ baseUrl: 'http://x///', endpoint: '/v2/lookup', fetchImpl });
    await e.extract('code');
    expect(calledUrl).toBe('http://x/v2/lookup');
  });

  it('infers language from file extension', async () => {
    const captured: string[] = [];
    const fetchImpl: FetchLike = async (_url, init) => {
      captured.push(init?.body ?? '');
      return { ok: true, status: 200, json: async () => ({ symbols: [] }), text: async () => '' };
    };
    const e = new CdgSymbolExtractor({ baseUrl: 'http://x', fetchImpl });
    await e.extract('x', { path: '/a.ts' });
    await e.extract('x', { path: '/b.py' });
    await e.extract('x', { path: '/c.cls' });
    await e.extract('x', { path: '/d.unknown' });
    const langs = captured.map(b => JSON.parse(b).language);
    expect(langs).toEqual(['typescript', 'python', 'apex', undefined]);
  });

  it('infers js, rs, and go from path extensions', async () => {
    const captured: string[] = [];
    const fetchImpl: FetchLike = async (_url, init) => {
      captured.push(init?.body ?? '');
      return { ok: true, status: 200, json: async () => ({ symbols: [] }), text: async () => '' };
    };
    const e = new CdgSymbolExtractor({ baseUrl: 'http://x', fetchImpl });
    await e.extract('x', { path: '/a.js' });
    await e.extract('x', { path: '/b.rs' });
    await e.extract('x', { path: '/c.go' });
    const langs = captured.map(b => JSON.parse(b).language);
    expect(langs).toEqual(['javascript', 'rust', 'go']);
  });

  it('returns undefined language when path is missing', async () => {
    let body = '';
    const fetchImpl: FetchLike = async (_url, init) => {
      body = init?.body ?? '';
      return { ok: true, status: 200, json: async () => ({ symbols: [] }), text: async () => '' };
    };
    const e = new CdgSymbolExtractor({ baseUrl: 'http://x', fetchImpl });
    await e.extract('x');
    expect(JSON.parse(body).language).toBeUndefined();
  });

  it('uses an explicit language argument over the path-derived one', async () => {
    let body = '';
    const fetchImpl: FetchLike = async (_url, init) => {
      body = init?.body ?? '';
      return { ok: true, status: 200, json: async () => ({ symbols: [] }), text: async () => '' };
    };
    const e = new CdgSymbolExtractor({ baseUrl: 'http://x', fetchImpl });
    await e.extract('x', { path: '/a.ts', language: 'tsx' });
    expect(JSON.parse(body).language).toBe('tsx');
  });

  it('accepts a custom mapResponse function', async () => {
    const e = new CdgSymbolExtractor({
      baseUrl: 'http://x',
      fetchImpl: fetchOk([{ kind: 'X', name: 'Y' }]),
      mapResponse: () => [{ kind: 'class', name: 'Custom' }],
    });
    expect(await e.extract('code')).toEqual([{ kind: 'class', name: 'Custom' }]);
  });

  it('fromEnv returns null when SIFTCODER_CDG_URL is not set', () => {
    expect(CdgSymbolExtractor.fromEnv({})).toBeNull();
  });

  it('fromEnv constructs an extractor when URL is set', () => {
    const e = CdgSymbolExtractor.fromEnv({ SIFTCODER_CDG_URL: 'http://cdg', SIFTCODER_CDG_TOKEN: 't' });
    expect(e).toBeInstanceOf(CdgSymbolExtractor);
  });

  it('fromEnv reads from process.env when no env arg is passed', () => {
    const orig = process.env['SIFTCODER_CDG_URL'];
    process.env['SIFTCODER_CDG_URL'] = 'http://from-process';
    try {
      const e = CdgSymbolExtractor.fromEnv();
      expect(e).toBeInstanceOf(CdgSymbolExtractor);
    } finally {
      if (orig === undefined) delete process.env['SIFTCODER_CDG_URL'];
      else process.env['SIFTCODER_CDG_URL'] = orig;
    }
  });
});

describe('AsyncFromSync', () => {
  it('wraps a sync extractor as async', async () => {
    const sync = new RegexSymbolExtractor();
    const wrapper = new AsyncFromSync(sync);
    const out = await wrapper.extract('function login() {}');
    expect(out.find(h => h.name === 'login')).toBeTruthy();
  });

  it('passes options through unchanged', async () => {
    const sync = new RegexSymbolExtractor();
    const wrapper = new AsyncFromSync(sync);
    expect(await wrapper.extract('def f(): pass', { maxSymbols: 1 })).toHaveLength(1);
  });
});
