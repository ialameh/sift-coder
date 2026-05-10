/**
 * Pure web router for the SiftCoder Memory HTTP bridge.
 *
 * No Node HTTP types in the public surface — takes a `WebRequest` shape and returns a
 * `WebResponse`. The HTTP bridge in daemon/http-bridge.ts adapts node:http to this. Keeps the
 * router 100% testable without spinning up a server.
 *
 * Routes:
 *   POST /                  legacy RPC: forwards to dispatch handler (for memory client compat)
 *   GET  /api/health        backend + key + counts
 *   GET  /api/savings       full savings report
 *   GET  /api/events?limit  recent events tail
 *   GET  /api/summaries?limit  recent summaries tail
 *   GET  /api/sessions?limit  list sessions with first/last/count
 *   POST /api/graph/subgraph { kind, id, maxDepth, direction, edgeType, maxEdges }
 *   GET  /api/graph/hubs?limit&kind  top-degree nodes
 *   POST /api/graph/path     { fromKind, fromId, toKind, toId, maxDepth }
 *   POST /api/search        { query, k }
 *   POST /api/timeline      { nearId, window }
 *   POST /api/get           { ids: number[] }
 *   POST /api/why           { kind, id, depth }
 *   POST /api/ab            { turns, k }
 *   GET  /                  index.html (web client SPA)
 *   GET  /app.js, /style.css static assets
 *
 * Auth: every /api route requires a Bearer token. Static assets (/, /app.js, /style.css) are
 * also gated so a browser opened with `?token=...` can pass the token through fetch headers.
 */
import { timingSafeEqual } from 'node:crypto';
import type { Storage } from '../storage/storage.js';
import type { Embedder } from '../embedder.js';
import type { ProvenanceStore, NodeRef } from '../provenance.js';
import type { Request, Response } from '../protocol.js';
import { computeSavings } from '../metrics.js';
import { hybridSearch } from '../retrieval.js';
import { AbHarness } from '../ab.js';

export interface WebRequest {
  method: string;
  path: string;
  query: Record<string, string>;
  authorization: string | undefined;
  body: string;
}

export interface WebResponse {
  status: number;
  headers: Record<string, string>;
  body: string | Buffer;
}

export interface WebDeps {
  storage: Storage;
  embedder: Embedder | null;
  provenance: ProvenanceStore | null;
  authToken: string;
  /** Optional handler for legacy `POST /` RPC endpoint. */
  rpc?: (req: Request) => Promise<Response>;
  /** Static asset reader; receives a logical path like 'index.html' and returns body or null. */
  staticAsset?: (name: string) => { body: Buffer; type: string } | null;
  backend: 'native' | 'wasm' | 'postgres' | 'sqlite-native' | 'sqlite-wasm';
  workspaceKey: string;
}

const STATIC_PATHS: Record<string, string> = {
  '/': 'index.html',
  '/app.js': 'app.js',
  '/style.css': 'style.css',
};

function json(status: number, body: unknown): WebResponse {
  return {
    status,
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(body),
  };
}

function unauthorized(): WebResponse {
  return json(401, { ok: false, error: 'unauthorized' });
}

function badRequest(message: string): WebResponse {
  return json(400, { ok: false, error: message });
}

function isAuthorized(req: WebRequest, token: string): boolean {
  const presented =
    (req.authorization ?? '').replace(/^Bearer\s+/i, '') ||
    req.query['token'] ||
    '';
  if (presented.length === 0 || presented.length !== token.length) return false;
  return timingSafeEqual(Buffer.from(presented), Buffer.from(token));
}

function parseBody<T>(raw: string): T | null {
  if (!raw) return null;
  try { return JSON.parse(raw) as T; } catch { return null; }
}

interface EventTailRow { id: number; ts: number; tool: string; status: string; session_id: string }
interface SummaryTailRow { id: number; ts: number; model: string; text: string; confidence: number | null }

async function eventTail(storage: Storage, limit: number): Promise<EventTailRow[]> {
  const rows = await storage.eventTail(limit);
  return rows.map(r => ({ id: r.id, ts: r.ts, tool: r.tool, status: r.status, session_id: r.sessionId }));
}

async function summaryTail(storage: Storage, limit: number): Promise<SummaryTailRow[]> {
  return await storage.summaryTail(limit) as SummaryTailRow[];
}

export async function route(req: WebRequest, deps: WebDeps): Promise<WebResponse> {
  // Browsers request /favicon.ico unconditionalally and without our auth token. Reply 204 so the
  // network panel stops complaining instead of a misleading 404 / 401.
  if (req.method === 'GET' && req.path === '/favicon.ico') {
    return { status: 204, headers: {}, body: '' };
  }

  // Static assets — gate behind auth too so a publicly-exposed bridge does not leak the SPA.
  if (req.method === 'GET' && STATIC_PATHS[req.path] && deps.staticAsset) {
    if (!isAuthorized(req, deps.authToken)) return unauthorized();
    const asset = deps.staticAsset(STATIC_PATHS[req.path]!);
    if (!asset) return json(404, { ok: false, error: 'not found' });
    // For the SPA shell, rewrite asset URLs to carry the same auth token. Browsers don't
    // forward the original `?token=` query when fetching <link>/<script> at root paths, so
    // without rewriting they 401. Token already lives in the URL the user opened — no extra
    // exposure.
    if (req.path === '/') {
      const tok = encodeURIComponent(deps.authToken);
      const html = asset.body.toString('utf8')
        .replace(/href="\/style\.css"/g, `href="/style.css?token=${tok}"`)
        .replace(/src="\/app\.js"/g, `src="/app.js?token=${tok}"`);
      return { status: 200, headers: { 'content-type': asset.type }, body: html };
    }
    return { status: 200, headers: { 'content-type': asset.type }, body: asset.body };
  }

  // Legacy RPC endpoint — kept for the existing MemoryClient over HTTP path.
  if (req.method === 'POST' && req.path === '/' && deps.rpc) {
    if (!isAuthorized(req, deps.authToken)) return unauthorized();
    const body = parseBody<Request>(req.body);
    if (!body) return badRequest('invalid json');
    const result = await deps.rpc(body);
    return json(200, result);
  }

  if (!req.path.startsWith('/api/')) return json(404, { ok: false, error: 'not found' });
  if (!isAuthorized(req, deps.authToken)) return unauthorized();

  if (req.method === 'GET' && req.path === '/api/health') {
    return json(200, {
      ok: true,
      data: {
        backend: deps.backend,
        workspace: deps.workspaceKey,
        events: await deps.storage.countAll('events'),
        summaries: await deps.storage.countAll('summaries'),
        embeddings: await deps.storage.countAll('summary_embeddings'),
        superseded: await deps.storage.countSupersededDistinct(),
      },
    });
  }

  if (req.method === 'GET' && req.path === '/api/savings') {
    return json(200, { ok: true, data: await computeSavings(deps.storage) });
  }

  if (req.method === 'GET' && req.path === '/api/events') {
    const limit = parseInt(req.query['limit'] ?? '50', 10) || 50;
    return json(200, { ok: true, data: { events: await eventTail(deps.storage, limit) } });
  }

  if (req.method === 'GET' && req.path === '/api/summaries') {
    const limit = parseInt(req.query['limit'] ?? '50', 10) || 50;
    return json(200, { ok: true, data: { summaries: await summaryTail(deps.storage, limit) } });
  }

  if (req.method === 'POST' && req.path === '/api/search') {
    const body = parseBody<{ query: string; k?: number }>(req.body);
    if (!body || typeof body.query !== 'string') return badRequest('query required');
    const hits = await hybridSearch(deps.storage, deps.embedder, body.query, Date.now(), { k: body.k ?? 5 });
    return json(200, { ok: true, data: { hits } });
  }

  if (req.method === 'POST' && req.path === '/api/timeline') {
    const body = parseBody<{ nearId: number; window?: number }>(req.body);
    if (!body || !Number.isFinite(body.nearId)) return badRequest('nearId required');
    const rows = await deps.storage.timeline(body.nearId, body.window ?? 10);
    return json(200, { ok: true, data: { rows } });
  }

  if (req.method === 'POST' && req.path === '/api/get') {
    const body = parseBody<{ ids: number[] }>(req.body);
    if (!body || !Array.isArray(body.ids)) return badRequest('ids[] required');
    const rows = await deps.storage.getSummariesByIds(body.ids);
    return json(200, { ok: true, data: { rows } });
  }

  if (req.method === 'POST' && req.path === '/api/why') {
    const body = parseBody<{ kind: string; id: string; depth?: number }>(req.body);
    if (!body || typeof body.kind !== 'string' || typeof body.id !== 'string') {
      return badRequest('kind and id required');
    }
    if (!deps.provenance) return json(200, { ok: true, data: { edges: [] } });
    const node: NodeRef = { kind: body.kind, id: body.id };
    return json(200, { ok: true, data: { edges: await deps.provenance.trace(node, body.depth ?? 4) } });
  }

  if (req.method === 'POST' && req.path === '/api/ab') {
    const body = parseBody<{ turns?: number; k?: number }>(req.body);
    const harness = new AbHarness(deps.storage, deps.embedder);
    const report = await harness.run({ turns: body?.turns ?? 100, memoryK: body?.k ?? 5 });
    return json(200, { ok: true, data: report });
  }

  if (req.method === 'GET' && req.path === '/api/stats') {
    const windowMs = parseInt(req.query['window_ms'] ?? '3600000', 10) || 3600000;
    return json(200, { ok: true, data: await deps.storage.stats(windowMs) });
  }

  if (req.method === 'GET' && req.path === '/api/doctor') {
    return json(200, { ok: true, data: await deps.storage.doctor() });
  }

  if (req.method === 'GET' && req.path === '/api/pinned') {
    const limit = parseInt(req.query['limit'] ?? '100', 10) || 100;
    return json(200, { ok: true, data: { pinned: await deps.storage.listPinned(limit) } });
  }

  if (req.method === 'POST' && req.path === '/api/symbol-search') {
    const body = parseBody<{ query: string; k?: number }>(req.body);
    if (!body || typeof body.query !== 'string') return badRequest('query required');
    return json(200, { ok: true, data: { hits: await deps.storage.symbolSearch(body.query, body.k ?? 10) } });
  }

  if (req.method === 'GET' && req.path === '/api/sessions') {
    const limit = parseInt(req.query['limit'] ?? '50', 10) || 50;
    return json(200, { ok: true, data: { sessions: await deps.storage.listSessions(limit) } });
  }

  if (req.method === 'POST' && req.path === '/api/thread') {
    const body = parseBody<{ sessionId: string; limit?: number }>(req.body);
    if (!body || typeof body.sessionId !== 'string') return badRequest('sessionId required');
    return json(200, { ok: true, data: { sessions: await deps.storage.sessionThread(body.sessionId, body.limit ?? 20) } });
  }

  if (req.method === 'POST' && req.path === '/api/replay') {
    const body = parseBody<{ sessionId: string; limit?: number }>(req.body);
    if (!body || typeof body.sessionId !== 'string') return badRequest('sessionId required');
    return json(200, { ok: true, data: { events: await deps.storage.replaySession(body.sessionId, body.limit ?? 200) } });
  }

  if (req.method === 'POST' && req.path === '/api/pin') {
    const body = parseBody<{ summaryId: number }>(req.body);
    if (!body || !Number.isFinite(body.summaryId)) return badRequest('summaryId required');
    return json(200, { ok: true, data: { pinned: await deps.storage.pin(body.summaryId), summaryId: body.summaryId } });
  }

  if (req.method === 'POST' && req.path === '/api/graph/subgraph') {
    const body = parseBody<{ kind: string; id: string; maxDepth?: number; direction?: 'out' | 'in' | 'both'; edgeType?: string; maxEdges?: number }>(req.body);
    if (!body || typeof body.kind !== 'string' || typeof body.id !== 'string') {
      return badRequest('kind and id required');
    }
    if (!deps.provenance) return json(200, { ok: true, data: { nodes: [], edges: [] } });
    const direction = body.direction === 'in' || body.direction === 'out' ? body.direction : 'both';
    const result = await deps.provenance.subgraph(
      { kind: body.kind, id: body.id },
      {
        maxDepth: body.maxDepth,
        direction,
        edgeType: body.edgeType as never,
        maxEdges: body.maxEdges,
      },
    );
    return json(200, { ok: true, data: result });
  }

  if (req.method === 'POST' && req.path === '/api/graph/path') {
    const body = parseBody<{ fromKind: string; fromId: string; toKind: string; toId: string; maxDepth?: number }>(req.body);
    if (!body || typeof body.fromKind !== 'string' || typeof body.fromId !== 'string' || typeof body.toKind !== 'string' || typeof body.toId !== 'string') {
      return badRequest('fromKind, fromId, toKind, toId required');
    }
    if (!deps.provenance) return json(200, { ok: true, data: { path: null } });
    const path = await deps.provenance.shortestPath(
      { kind: body.fromKind, id: body.fromId },
      { kind: body.toKind, id: body.toId },
      body.maxDepth ?? 6,
    );
    return json(200, { ok: true, data: { path } });
  }

  if (req.method === 'GET' && req.path === '/api/graph/hubs') {
    const limit = parseInt(req.query['limit'] ?? '20', 10) || 20;
    const kind = req.query['kind'];
    if (!deps.provenance) return json(200, { ok: true, data: { hubs: [] } });
    return json(200, { ok: true, data: { hubs: await deps.provenance.topHubs(limit, kind || undefined) } });
  }

  if (req.method === 'POST' && req.path === '/api/unpin') {
    const body = parseBody<{ summaryId: number }>(req.body);
    if (!body || !Number.isFinite(body.summaryId)) return badRequest('summaryId required');
    await deps.storage.unpin(body.summaryId);
    return json(200, { ok: true, data: { pinned: false, summaryId: body.summaryId } });
  }

  return json(404, { ok: false, error: 'not found' });
}