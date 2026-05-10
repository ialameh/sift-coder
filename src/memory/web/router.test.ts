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

beforeEach(async () => {
  dir = mkdtempSync(join(tmpdir(), 'web-'));
  db = new Database(join(dir, 'd.sqlite'));
  storage = await Storage.init(db);
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

  it('rejects a token of mismatched length without leaking timing info', async () => {
    // Different length must short-circuit before timingSafeEqual to avoid throwing.
    const r = await route(req({ authorization: 'Bearer short' }), deps());
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

describe('new web endpoints (stats, doctor, pinned, symbol-search, thread, replay, pin/unpin)', () => {
  it('GET /api/stats returns counts + throughput', async () => {
    await storage.recordEvent({ ts: Date.now(), sessionId: 's', tool: 'Edit', payload: { i: 1 } });
    const r = await route(req({ path: '/api/stats' }), deps());
    expect(r.status).toBe(200);
    const body = JSON.parse(String(r.body));
    expect(body.data.counts.events).toBe(1);
    expect(body.data.throughput.eventsPerMin).toBeGreaterThan(0);
  });

  it('GET /api/doctor returns the health report', async () => {
    const r = await route(req({ path: '/api/doctor' }), deps());
    const body = JSON.parse(String(r.body));
    expect(body.data.integrity).toBe('ok');
  });

  it('GET /api/pinned lists pinned summaries', async () => {
    const eid = await storage.recordEvent({ ts: 1, sessionId: 's', tool: 'R', payload: { i: 1 } });
    const sid = await storage.recordSummary({ eventId: eid, ts: 1, model: 'm', promptHash: 'p', text: 't', tokensIn: null, tokensOut: null, confidence: null });
    await storage.pin(sid);
    const r = await route(req({ path: '/api/pinned' }), deps());
    const body = JSON.parse(String(r.body));
    expect(body.data.pinned).toHaveLength(1);
  });

  it('POST /api/symbol-search returns events by symbol', async () => {
    const eid = await storage.recordEvent({ ts: 1, sessionId: 's', tool: 'Edit', payload: { i: 1 } });
    await storage.setEventSymbols(eid, ['function:login']);
    const r = await route(req({ method: 'POST', path: '/api/symbol-search', body: JSON.stringify({ query: 'function:login' }) }), deps());
    const body = JSON.parse(String(r.body));
    expect(body.data.hits).toHaveLength(1);
  });

  it('POST /api/graph/subgraph returns nodes and edges around a seed', async () => {
    await provenance.addEdge({ from: { kind: 'n', id: 'a' }, to: { kind: 'n', id: 'b' }, edgeType: 'causes' });
    await provenance.addEdge({ from: { kind: 'n', id: 'b' }, to: { kind: 'n', id: 'c' }, edgeType: 'causes' });
    const r = await route(req({ method: 'POST', path: '/api/graph/subgraph', body: JSON.stringify({ kind: 'n', id: 'b', maxDepth: 1 }) }), deps());
    const body = JSON.parse(String(r.body));
    expect(body.data.nodes.length).toBeGreaterThanOrEqual(3);
    expect(body.data.edges).toHaveLength(2);
  });

  it('POST /api/graph/subgraph 400s on missing kind/id', async () => {
    const r = await route(req({ method: 'POST', path: '/api/graph/subgraph', body: '{}' }), deps());
    expect(r.status).toBe(400);
  });

  it('GET /api/patterns lists recurring input hashes', async () => {
    // Identical payload across distinct sessions → a pattern.
    for (const sid of ['a', 'b', 'c']) {
      await storage.recordEvent({ ts: 1, sessionId: sid, tool: 'Edit', payload: { x: 1 } });
    }
    const r = await route(req({ path: '/api/patterns', query: { min: '2' } }), deps());
    const body = JSON.parse(String(r.body));
    expect(body.data.patterns.length).toBeGreaterThan(0);
    expect(body.data.patterns[0].occurrences).toBeGreaterThanOrEqual(2);
    expect(body.data.patterns[0].distinctSessions).toBeGreaterThanOrEqual(2);
  });

  it('POST /api/session-digest concats summaries for a session', async () => {
    const eid = await storage.recordEvent({ ts: 1, sessionId: 'd', tool: 'Edit', payload: { x: 1 } });
    await storage.recordSummary({ eventId: eid, ts: 1, model: 'm', promptHash: 'p', text: 'fact one', tokensIn: null, tokensOut: null, confidence: null });
    const r = await route(req({ method: 'POST', path: '/api/session-digest', body: JSON.stringify({ sessionId: 'd' }) }), deps());
    const body = JSON.parse(String(r.body));
    expect(body.data.text).toContain('fact one');
  });

  it('POST /api/session-digest 400s on missing sessionId', async () => {
    const r = await route(req({ method: 'POST', path: '/api/session-digest', body: '{}' }), deps());
    expect(r.status).toBe(400);
  });

  it('GET /api/as-of returns snapshot at a timestamp', async () => {
    const eid = await storage.recordEvent({ ts: 100, sessionId: 's', tool: 'R', payload: {} });
    await storage.recordSummary({ eventId: eid, ts: 100, model: 'm', promptHash: 'p', text: 'old', tokensIn: null, tokensOut: null, confidence: null });
    const eid2 = await storage.recordEvent({ ts: 500, sessionId: 's', tool: 'R', payload: {} });
    await storage.recordSummary({ eventId: eid2, ts: 500, model: 'm', promptHash: 'p2', text: 'newer', tokensIn: null, tokensOut: null, confidence: null });
    const r = await route(req({ path: '/api/as-of', query: { ts: '300', limit: '10' } }), deps());
    const body = JSON.parse(String(r.body));
    expect(body.data.counts.events).toBe(1);
    expect(body.data.summaries[0].text).toBe('old');
  });

  it('GET /api/as-of 400s when ts is missing or invalid', async () => {
    const r = await route(req({ path: '/api/as-of' }), deps());
    expect(r.status).toBe(400);
  });

  it('POST /api/graph/path returns the shortest connecting edges', async () => {
    await provenance.addEdge({ from: { kind: 'n', id: 'a' }, to: { kind: 'n', id: 'b' }, edgeType: 'causes' });
    await provenance.addEdge({ from: { kind: 'n', id: 'b' }, to: { kind: 'n', id: 'c' }, edgeType: 'causes' });
    const r = await route(req({ method: 'POST', path: '/api/graph/path', body: JSON.stringify({ fromKind: 'n', fromId: 'a', toKind: 'n', toId: 'c' }) }), deps());
    const body = JSON.parse(String(r.body));
    expect(body.data.path).toHaveLength(2);
  });

  it('POST /api/graph/path returns null when no path exists', async () => {
    await provenance.addEdge({ from: { kind: 'n', id: 'a' }, to: { kind: 'n', id: 'b' }, edgeType: 'causes' });
    const r = await route(req({ method: 'POST', path: '/api/graph/path', body: JSON.stringify({ fromKind: 'n', fromId: 'a', toKind: 'n', toId: 'island' }) }), deps());
    const body = JSON.parse(String(r.body));
    expect(body.data.path).toBeNull();
  });

  it('POST /api/graph/path 400s on missing args', async () => {
    const r = await route(req({ method: 'POST', path: '/api/graph/path', body: '{}' }), deps());
    expect(r.status).toBe(400);
  });

  it('GET /api/graph/hubs returns top-degree nodes', async () => {
    for (let i = 0; i < 3; i++) {
      await provenance.addEdge({ from: { kind: 'file', id: 'h' }, to: { kind: 'file', id: 'leaf-' + i }, edgeType: 'imports' });
    }
    const r = await route(req({ path: '/api/graph/hubs', query: { limit: '5' } }), deps());
    const body = JSON.parse(String(r.body));
    expect(body.data.hubs[0].node.id).toBe('h');
    expect(body.data.hubs[0].degree).toBe(3);
  });

  it('GET /api/sessions lists sessions with counts', async () => {
    await storage.recordEvent({ ts: 1, sessionId: 'a', tool: 'R', payload: { i: 1 } });
    await storage.recordEvent({ ts: 2, sessionId: 'a', tool: 'R', payload: { i: 2 } });
    await storage.recordEvent({ ts: 3, sessionId: 'b', tool: 'Edit', payload: { i: 3 } });
    const r = await route(req({ path: '/api/sessions' }), deps());
    const body = JSON.parse(String(r.body));
    expect(body.data.sessions).toHaveLength(2);
    const a = body.data.sessions.find((s: { sessionId: string; eventCount: number }) => s.sessionId === 'a');
    expect(a.eventCount).toBe(2);
  });

  it('POST /api/thread returns related sessions', async () => {
    await storage.recordEvent({ ts: 1, sessionId: 's1', tool: 'R', payload: { same: true } });
    await storage.recordEvent({ ts: 2, sessionId: 's2', tool: 'R', payload: { same: true } });
    const r = await route(req({ method: 'POST', path: '/api/thread', body: JSON.stringify({ sessionId: 's1' }) }), deps());
    const body = JSON.parse(String(r.body));
    expect(body.data.sessions).toHaveLength(1);
  });

  it('POST /api/replay returns events in order', async () => {
    await storage.recordEvent({ ts: 1, sessionId: 'r', tool: 'Edit', payload: { i: 1 } });
    await storage.recordEvent({ ts: 2, sessionId: 'r', tool: 'Bash', payload: { i: 2 } });
    const r = await route(req({ method: 'POST', path: '/api/replay', body: JSON.stringify({ sessionId: 'r' }) }), deps());
    const body = JSON.parse(String(r.body));
    expect(body.data.events).toHaveLength(2);
  });

  it('POST /api/pin and /api/unpin round-trip', async () => {
    const eid = await storage.recordEvent({ ts: 1, sessionId: 's', tool: 'R', payload: { i: 1 } });
    const sid = await storage.recordSummary({ eventId: eid, ts: 1, model: 'm', promptHash: 'p', text: 't', tokensIn: null, tokensOut: null, confidence: null });
    const pinR = await route(req({ method: 'POST', path: '/api/pin', body: JSON.stringify({ summaryId: sid }) }), deps());
    expect(JSON.parse(String(pinR.body)).data.pinned).toBe(true);
    const unpinR = await route(req({ method: 'POST', path: '/api/unpin', body: JSON.stringify({ summaryId: sid }) }), deps());
    expect(JSON.parse(String(unpinR.body)).data.pinned).toBe(false);
  });

  it('rejects malformed bodies on each new endpoint', async () => {
    expect((await route(req({ method: 'POST', path: '/api/symbol-search', body: '{}' }), deps())).status).toBe(400);
    expect((await route(req({ method: 'POST', path: '/api/thread', body: '{}' }), deps())).status).toBe(400);
    expect((await route(req({ method: 'POST', path: '/api/replay', body: '{}' }), deps())).status).toBe(400);
    expect((await route(req({ method: 'POST', path: '/api/pin', body: '{}' }), deps())).status).toBe(400);
    expect((await route(req({ method: 'POST', path: '/api/unpin', body: '{}' }), deps())).status).toBe(400);
  });
});

describe('GET /api/events', () => {
  it('returns recent events with default limit', async () => {
    await storage.recordEvent({ ts: 1, sessionId: 's', tool: 'Read', payload: { i: 1 } });
    await storage.recordEvent({ ts: 2, sessionId: 's', tool: 'Edit', payload: { i: 2 } });
    const r = await route(req({ path: '/api/events' }), deps());
    expect(r.status).toBe(200);
    const body = JSON.parse(String(r.body));
    expect(body.data.events).toHaveLength(2);
  });

  it('honors the limit query param', async () => {
    for (let i = 0; i < 5; i++) await storage.recordEvent({ ts: i, sessionId: 's', tool: 'R', payload: { i } });
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
