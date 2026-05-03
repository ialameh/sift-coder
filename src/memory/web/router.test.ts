import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import Database from 'better-sqlite3';
import { Storage } from '../storage/storage.js';
import { ProvenanceStore } from '../provenance.js';
import { DeterministicEmbedder } from '../embedder.js';
import { route, type WebRequest, type WebDeps } from './router.js';

let dir: string;
let db: Database.Database;
let storage: Storage;
let provenance: ProvenanceStore;
const embedder = new DeterministicEmbedder(64);

const TOKEN = 'test-token';

function deps(overrides: Partial<WebDeps> = {}): WebDeps {
  return {
    storage,
    embedder,
    provenance,
    authToken: TOKEN,
    backend: 'native',
    workspaceKey: 'abc12345',
    staticAsset: (name) => name === 'index.html'
      ? { body: Buffer.from('<html>'), type: 'text/html' }
      : null,
    ...overrides,
  };
}

function req(opts: Partial<WebRequest>): WebRequest {
  return {
    method: 'GET',
    path: '/api/health',
    query: {},
    authorization: 'Bearer ' + TOKEN,
    body: '',
    ...opts,
  };
}

beforeEach(() => {
  dir = mkdtempSync(join(tmpdir(), 'web-'));
  db = new Database(join(dir, 'd.sqlite'));
  storage = new Storage(db);
  provenance = new ProvenanceStore(storage);
});
afterEach(() => {
  db.close();
  rmSync(dir, { recursive: true, force: true });
});

describe('auth', () => {
  it('returns 401 when no token is provided to /api/*', async () => {
    const r = await route(req({ authorization: undefined }), deps());
    expect(r.status).toBe(401);
  });

  it('accepts the token via Bearer header', async () => {
    const r = await route(req({}), deps());
    expect(r.status).toBe(200);
  });

  it('accepts the token via ?token= query string', async () => {
    const r = await route(req({ authorization: undefined, query: { token: TOKEN } }), deps());
    expect(r.status).toBe(200);
  });

  it('rejects a wrong token', async () => {
    const r = await route(req({ authorization: 'Bearer wrong' }), deps());
    expect(r.status).toBe(401);
  });

  it('rejects an empty token even when bearer is present', async () => {
    const r = await route(req({ authorization: 'Bearer ' }), deps());
    expect(r.status).toBe(401);
  });
});

describe('GET /api/health', () => {
  it('returns backend, key, and counts', async () => {
    const r = await route(req({ path: '/api/health' }), deps());
    expect(r.status).toBe(200);
    const body = JSON.parse(String(r.body));
    expect(body.data.backend).toBe('native');
    expect(body.data.workspace).toBe('abc12345');
    expect(body.data.events).toBe(0);
  });
});

describe('GET /api/savings', () => {
  it('returns the savings report shape', async () => {
    const r = await route(req({ path: '/api/savings' }), deps());
    expect(r.status).toBe(200);
    const body = JSON.parse(String(r.body));
    expect(body.data.capture).toBeDefined();
    expect(body.data.drain).toBeDefined();
    expect(body.data.context).toBeDefined();
  });
});

describe('GET /api/events', () => {
  it('returns recent events with default limit', async () => {
    await storage.recordEvent({ ts: 1, sessionId: 's', tool: 'Read', payload: {} });
    await storage.recordEvent({ ts: 2, sessionId: 's', tool: 'Edit', payload: {} });
    const r = await route(req({ path: '/api/events' }), deps());
    expect(r.status).toBe(200);
    const body = JSON.parse(String(r.body));
    expect(body.data.events).toHaveLength(2);
  });

  it('honors the limit query param', async () => {
    for (let i = 0; i < 5; i++) await storage.recordEvent({ ts: i, sessionId: 's', tool: 'R', payload: {} });
    const r = await route(req({ path: '/api/events', query: { limit: '2' } }), deps());
    const body = JSON.parse(String(r.body));
    expect(body.data.events).toHaveLength(2);
  });

  it('falls back to default limit when limit is non-numeric', async () => {
    await storage.recordEvent({ ts: 1, sessionId: 's', tool: 'R', payload: {} });
    const r = await route(req({ path: '/api/events', query: { limit: 'oops' } }), deps());
    expect(r.status).toBe(200);
  });
});

describe('GET /api/summaries', () => {
  it('returns recent summaries truncated to 240 chars', async () => {
    const eid = await storage.recordEvent({ ts: 1, sessionId: 's', tool: 'R', payload: {} });
    await storage.recordSummary({ eventId: eid, ts: 0, model: 'm', promptHash: 'p', text: 'x'.repeat(500), tokensIn: 1, tokensOut: 1, confidence: 0.9 });
    const r = await route(req({ path: '/api/summaries' }), deps());
    const body = JSON.parse(String(r.body));
    expect(body.data.summaries[0].text.length).toBeLessThanOrEqual(240);
  });

  it('honors the limit query param', async () => {
    const eid = await storage.recordEvent({ ts: 1, sessionId: 's', tool: 'R', payload: {} });
    for (let i = 0; i < 3; i++) {
      await storage.recordSummary({ eventId: eid, ts: i, model: 'm', promptHash: 'p', text: 't', tokensIn: 1, tokensOut: 1, confidence: 0.9 });
    }
    const r = await route(req({ path: '/api/summaries', query: { limit: '1' } }), deps());
    const body = JSON.parse(String(r.body));
    expect(body.data.summaries).toHaveLength(1);
  });

  it('falls back to default limit when limit is non-numeric', async () => {
    const r = await route(req({ path: '/api/summaries', query: { limit: 'oops' } }), deps());
    expect(r.status).toBe(200);
  });
});

describe('POST /api/search', () => {
  it('runs hybrid search and returns hits', async () => {
    const eid = await storage.recordEvent({ ts: 1, sessionId: 's', tool: 'R', payload: {} });
    await storage.recordSummary({ eventId: eid, ts: 0, model: 'm', promptHash: 'p', text: 'auth login session', tokensIn: 1, tokensOut: 1, confidence: 0.9 });
    const r = await route(req({ method: 'POST', path: '/api/search', body: JSON.stringify({ query: 'auth' }) }), deps());
    expect(r.status).toBe(200);
    const body = JSON.parse(String(r.body));
    expect(Array.isArray(body.data.hits)).toBe(true);
  });

  it('returns 400 when body is missing query', async () => {
    const r = await route(req({ method: 'POST', path: '/api/search', body: '{}' }), deps());
    expect(r.status).toBe(400);
  });

  it('returns 400 when body is invalid json', async () => {
    const r = await route(req({ method: 'POST', path: '/api/search', body: 'not-json' }), deps());
    expect(r.status).toBe(400);
  });
});

describe('POST /api/timeline', () => {
  it('returns chronological neighbors', async () => {
    const eid = await storage.recordEvent({ ts: 1, sessionId: 's', tool: 'R', payload: {} });
    for (let i = 0; i < 3; i++) {
      await storage.recordSummary({ eventId: eid, ts: i, model: 'm', promptHash: 'p', text: `s${i}`, tokensIn: 1, tokensOut: 1, confidence: 0.9 });
    }
    const r = await route(req({ method: 'POST', path: '/api/timeline', body: JSON.stringify({ nearId: 2, window: 1 }) }), deps());
    expect(r.status).toBe(200);
    const body = JSON.parse(String(r.body));
    expect(body.data.rows.length).toBeGreaterThanOrEqual(1);
  });

  it('returns 400 when nearId is missing or non-numeric', async () => {
    const r = await route(req({ method: 'POST', path: '/api/timeline', body: '{}' }), deps());
    expect(r.status).toBe(400);
  });
});

describe('POST /api/get', () => {
  it('returns rows for the requested ids', async () => {
    const eid = await storage.recordEvent({ ts: 1, sessionId: 's', tool: 'R', payload: {} });
    const sid = await storage.recordSummary({ eventId: eid, ts: 0, model: 'm', promptHash: 'p', text: 't', tokensIn: 1, tokensOut: 1, confidence: 0.9 });
    const r = await route(req({ method: 'POST', path: '/api/get', body: JSON.stringify({ ids: [sid] }) }), deps());
    const body = JSON.parse(String(r.body));
    expect(body.data.rows).toHaveLength(1);
  });

  it('returns 400 when ids is missing or not an array', async () => {
    const r = await route(req({ method: 'POST', path: '/api/get', body: '{}' }), deps());
    expect(r.status).toBe(400);
  });
});

describe('POST /api/why', () => {
  it('returns the trace from the provenance store', async () => {
    provenance.addEdge({ from: { kind: 'a', id: '1' }, to: { kind: 'b', id: '2' }, edgeType: 'causes' });
    const r = await route(req({ method: 'POST', path: '/api/why', body: JSON.stringify({ kind: 'a', id: '1' }) }), deps());
    const body = JSON.parse(String(r.body));
    expect(body.data.edges.length).toBeGreaterThan(0);
  });

  it('returns empty edges when no provenance store is configured', async () => {
    const r = await route(req({ method: 'POST', path: '/api/why', body: JSON.stringify({ kind: 'a', id: '1' }) }), deps({ provenance: null }));
    const body = JSON.parse(String(r.body));
    expect(body.data.edges).toEqual([]);
  });

  it('returns 400 when kind or id is missing', async () => {
    const r = await route(req({ method: 'POST', path: '/api/why', body: JSON.stringify({ kind: 'a' }) }), deps());
    expect(r.status).toBe(400);
  });
});

describe('POST /api/ab', () => {
  it('runs A/B harness with default args when body is empty', async () => {
    const r = await route(req({ method: 'POST', path: '/api/ab', body: '' }), deps());
    expect(r.status).toBe(200);
    const body = JSON.parse(String(r.body));
    expect(body.data.k).toBeDefined();
  });

  it('honors body turns/k overrides', async () => {
    await storage.recordEvent({ ts: 1, sessionId: 's', tool: 'R', payload: { x: 1 }, tokensEst: 50 });
    const r = await route(req({ method: 'POST', path: '/api/ab', body: JSON.stringify({ turns: 1, k: 2 }) }), deps());
    const body = JSON.parse(String(r.body));
    expect(body.data.k).toBe(2);
  });
});

describe('static assets', () => {
  it('serves a 200 with HTML when token is valid', async () => {
    const r = await route(req({ method: 'GET', path: '/' }), deps());
    expect(r.status).toBe(200);
    expect(r.headers['content-type']).toBe('text/html');
  });

  it('rewrites asset URLs in the index.html shell to carry the auth token', async () => {
    const html = '<html><head><link rel="stylesheet" href="/style.css" /></head><body><script src="/app.js"></script></body></html>';
    const r = await route(req({ method: 'GET', path: '/' }), deps({
      staticAsset: () => ({ body: Buffer.from(html), type: 'text/html' }),
    }));
    expect(r.status).toBe(200);
    expect(String(r.body)).toContain(`href="/style.css?token=${encodeURIComponent(TOKEN)}"`);
    expect(String(r.body)).toContain(`src="/app.js?token=${encodeURIComponent(TOKEN)}"`);
  });

  it('returns 204 for /favicon.ico without requiring auth', async () => {
    const r = await route(req({ method: 'GET', path: '/favicon.ico', authorization: undefined }), deps());
    expect(r.status).toBe(204);
  });

  it('serves /app.js bytes verbatim without rewriting', async () => {
    const body = Buffer.from('console.log("hi");');
    const r = await route(req({ method: 'GET', path: '/app.js' }), deps({
      staticAsset: () => ({ body, type: 'application/javascript' }),
    }));
    expect(r.status).toBe(200);
    expect(r.body).toBe(body);
  });

  it('returns 401 for static assets without a token', async () => {
    const r = await route(req({ method: 'GET', path: '/', authorization: undefined }), deps());
    expect(r.status).toBe(401);
  });

  it('returns 404 when the asset is not found', async () => {
    const r = await route(req({ method: 'GET', path: '/' }), deps({ staticAsset: () => null }));
    expect(r.status).toBe(404);
  });

  it('skips static handling when no staticAsset reader is configured', async () => {
    const r = await route(req({ method: 'GET', path: '/' }), deps({ staticAsset: undefined }));
    expect(r.status).toBe(404);
  });
});

describe('legacy POST / RPC', () => {
  it('forwards parsed body to the rpc handler', async () => {
    const calls: unknown[] = [];
    const rpc = async (b: unknown) => { calls.push(b); return { ok: true, data: { received: true } } as const; };
    const r = await route(
      req({ method: 'POST', path: '/', body: JSON.stringify({ kind: 'ping' }) }),
      deps({ rpc }),
    );
    expect(r.status).toBe(200);
    expect(calls).toEqual([{ kind: 'ping' }]);
  });

  it('returns 400 on invalid json body', async () => {
    const r = await route(
      req({ method: 'POST', path: '/', body: 'not-json' }),
      deps({ rpc: async () => ({ ok: true, data: {} }) }),
    );
    expect(r.status).toBe(400);
  });

  it('falls through to 404 when no rpc handler is configured', async () => {
    const r = await route(req({ method: 'POST', path: '/', body: '{}' }), deps());
    expect(r.status).toBe(404);
  });

  it('returns 401 on POST / when token is missing', async () => {
    const r = await route(
      req({ method: 'POST', path: '/', body: '{}', authorization: undefined }),
      deps({ rpc: async () => ({ ok: true, data: {} }) }),
    );
    expect(r.status).toBe(401);
  });
});

describe('default body shapes', () => {
  it('POST /api/timeline uses default window when none provided', async () => {
    const eid = await storage.recordEvent({ ts: 1, sessionId: 's', tool: 'R', payload: {} });
    await storage.recordSummary({ eventId: eid, ts: 0, model: 'm', promptHash: 'p', text: 't', tokensIn: 1, tokensOut: 1, confidence: 0.9 });
    const r = await route(req({ method: 'POST', path: '/api/timeline', body: JSON.stringify({ nearId: 1 }) }), deps());
    expect(r.status).toBe(200);
  });
});

describe('unknown routes', () => {
  it('returns 404 for unrecognised paths under /api/', async () => {
    const r = await route(req({ path: '/api/unknown' }), deps());
    expect(r.status).toBe(404);
  });

  it('returns 404 for arbitrary paths without auth check', async () => {
    const r = await route(req({ method: 'PUT', path: '/something', authorization: undefined }), deps());
    expect(r.status).toBe(404);
  });
});
