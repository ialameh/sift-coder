/**
 * Pure MCP request handler for SiftCoder memory.
 * Tools: mem_search, mem_timeline, mem_get, mem_drain.
 *
 * Each tool call optionally drains a small batch of pending (un-summarized) events through
 * sampling — the host LLM does the work, no plugin-side API key.
 *
 * stdio plumbing lives in server.ts; this file exposes a pure async dispatch function for unit tests.
 */
import type { MemoryClient } from '../client.js';
import type { Summarizer } from '../daemon/summarizer.js';
import type { Storage } from '../storage/storage.js';
import type { Embedder } from '../embedder.js';
import type { ProvenanceStore } from '../provenance.js';

export interface JsonRpcRequest {
  jsonrpc: '2.0';
  id?: number | string;
  method: string;
  params?: unknown;
}

export interface JsonRpcResponse {
  jsonrpc: '2.0';
  id?: number | string;
  result?: unknown;
  error?: { code: number; message: string };
}

export interface InitializeInfo {
  clientCaps: Record<string, unknown>;
  samplingAdvertised: boolean;
  clientInfo?: { name?: string; version?: string };
}

export interface HandlerDeps {
  client: MemoryClient;
  storage?: Storage | null;
  summarizer?: Summarizer | null;
  embedder?: Embedder | null;
  provenance?: ProvenanceStore | null;
  drainBatch?: number;
  /** Called once on `initialize` so the MCP server can log host capability advertisement. */
  onInitialize?: (info: InitializeInfo) => void;
}

export const TOOLS = [
  {
    name: 'mem_search',
    description: 'Hybrid (BM25 + vector) search over SiftCoder memory summaries. Returns top-k hits with ids. Drains a small backlog through host sampling.',
    inputSchema: {
      type: 'object',
      properties: { query: { type: 'string' }, k: { type: 'number', default: 5 } },
      required: ['query'],
    },
  },
  {
    name: 'mem_timeline',
    description: 'Chronological neighbors around a memory id.',
    inputSchema: {
      type: 'object',
      properties: { near_id: { type: 'number' }, window: { type: 'number', default: 10 } },
      required: ['near_id'],
    },
  },
  {
    name: 'mem_get',
    description: 'Fetch full summary rows by ids.',
    inputSchema: {
      type: 'object',
      properties: { ids: { type: 'array', items: { type: 'number' } } },
      required: ['ids'],
    },
  },
  {
    name: 'mem_drain',
    description: 'Force-drain pending captured events into summaries via host sampling. Returns counts.',
    inputSchema: {
      type: 'object',
      properties: { batch: { type: 'number', default: 16 } },
      required: [],
    },
  },
  {
    name: 'mem_why',
    description: 'Trace causal provenance from a memory node. Returns the chain of edges (causes, derives_from, calls, imports, ...) up to a configurable depth.',
    inputSchema: {
      type: 'object',
      properties: {
        kind: { type: 'string' },
        id: { type: 'string' },
        depth: { type: 'number', default: 4 },
      },
      required: ['kind', 'id'],
    },
  },
];

export interface DrainResult {
  processed: number;
  errors: number;
  pending: number;
  /** First error message, surfaced so the caller can diagnose host sampling problems. */
  firstError?: string;
}

export async function drain(deps: HandlerDeps, batch: number): Promise<DrainResult> {
  const { storage, summarizer, embedder } = deps;
  if (!storage || !summarizer) return { processed: 0, errors: 0, pending: 0 };
  const events = storage.pendingEvents(batch);
  let processed = 0;
  let errors = 0;
  let firstError: string | undefined;
  for (const ev of events) {
    try {
      const r = await summarizer.summarize(ev.id, ev.inputHash, ev.payloadJson, Date.now());
      if (embedder) {
        const v = await embedder.embed(r.text);
        storage.putEmbedding(r.id, v);
      }
      storage.markEventStatus(ev.id, 'summarized');
      processed++;
    } catch (e) {
      storage.markEventStatus(ev.id, 'skipped');
      errors++;
      if (firstError === undefined) firstError = (e as Error).message;
    }
  }
  const remaining = storage.pendingEvents(1).length;
  return firstError ? { processed, errors, pending: remaining, firstError } : { processed, errors, pending: remaining };
}

export async function dispatch(req: JsonRpcRequest, deps: HandlerDeps): Promise<JsonRpcResponse> {
  if (req.method === 'initialize') {
    const params = (req.params ?? {}) as { capabilities?: Record<string, unknown>; clientInfo?: { name?: string; version?: string } };
    const clientCaps = params.capabilities ?? {};
    const samplingAdvertised = 'sampling' in clientCaps;
    if (deps.onInitialize) deps.onInitialize({ clientCaps, samplingAdvertised, clientInfo: params.clientInfo });
    return {
      jsonrpc: '2.0',
      id: req.id,
      result: {
        protocolVersion: '2024-11-05',
        capabilities: { tools: {}, sampling: {} },
        serverInfo: { name: 'siftcoder-memory', version: '2.0.0' },
      },
    };
  }
  if (req.method === 'tools/list') {
    return { jsonrpc: '2.0', id: req.id, result: { tools: TOOLS } };
  }
  if (req.method === 'tools/call') {
    const params = req.params as { name?: string; arguments?: Record<string, unknown> } | undefined;
    const name = params?.name ?? '';
    const args = params?.arguments ?? {};
    try {
      switch (name) {
        case 'mem_search': {
          await drain(deps, deps.drainBatch ?? 4);
          const res = await deps.client.send({
            kind: 'search',
            query: String(args['query'] ?? ''),
            k: Number(args['k'] ?? 5),
          });
          return ok(req.id, res);
        }
        case 'mem_timeline': {
          const res = await deps.client.send({
            kind: 'timeline',
            nearId: Number(args['near_id']),
            window: Number(args['window'] ?? 10),
          });
          return ok(req.id, res);
        }
        case 'mem_get': {
          const res = await deps.client.send({
            kind: 'get',
            ids: (args['ids'] as number[]) ?? [],
          });
          return ok(req.id, res);
        }
        case 'mem_drain': {
          const r = await drain(deps, Number(args['batch'] ?? 16));
          return ok(req.id, { ok: true, data: r });
        }
        case 'mem_why': {
          if (!deps.provenance) return ok(req.id, { ok: true, data: { edges: [] } });
          const kind = String(args['kind'] ?? '');
          const id = String(args['id'] ?? '');
          const depth = Number(args['depth'] ?? 4);
          const edges = deps.provenance.trace({ kind, id }, depth);
          return ok(req.id, { ok: true, data: { edges } });
        }
        default:
          return { jsonrpc: '2.0', id: req.id, error: { code: -32601, message: `unknown tool: ${name}` } };
      }
    } catch (err) {
      return { jsonrpc: '2.0', id: req.id, error: { code: -32000, message: (err as Error).message } };
    }
  }
  return { jsonrpc: '2.0', id: req.id, error: { code: -32601, message: `method not found: ${req.method}` } };
}

function ok(id: number | string | undefined, body: unknown): JsonRpcResponse {
  return {
    jsonrpc: '2.0',
    ...(id !== undefined ? { id } : {}),
    result: { content: [{ type: 'text', text: JSON.stringify(body) }] },
  };
}
