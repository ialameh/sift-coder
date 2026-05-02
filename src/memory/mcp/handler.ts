/**
 * Pure MCP request handler for SiftCoder memory.
 * Tools: mem_search, mem_timeline, mem_get, mem_drain, mem_why.
 *
 * All tool calls route through the daemon socket — no direct DB access, no model clients.
 * The daemon owns drain logic and model client selection; upgrading the daemon is sufficient
 * to pick up new backends (Gemini, Ollama, etc.) without restarting Claude Code.
 *
 * stdio plumbing lives in server.ts; this file exposes a pure async dispatch function for unit tests.
 */
import type { MemoryClient } from '../client.js';

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
  drainBatch?: number;
  /** Called once on `initialize` so the MCP server can log host capability advertisement. */
  onInitialize?: (info: InitializeInfo) => void;
}

export const TOOLS = [
  {
    name: 'mem_search',
    description: 'Hybrid (BM25 + vector) search over SiftCoder memory summaries. Returns top-k hits with ids. Drains a small backlog in the background.',
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
    description: 'Force-drain pending captured events into summaries. Returns counts.',
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
  backend?: string;
  firstError?: string;
}

export async function drain(client: MemoryClient, batch: number): Promise<DrainResult> {
  try {
    const res = await client.send<{ processed: number; errors: number; pending: number; backend?: string; firstError?: string }>({
      kind: 'drain',
      batch,
    });
    if (!res.ok) return { processed: 0, errors: 1, pending: 0, firstError: res.error };
    return res.data;
  } catch {
    return { processed: 0, errors: 0, pending: 0 };
  }
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
          await drain(deps.client, deps.drainBatch ?? 4);
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
          const r = await drain(deps.client, Number(args['batch'] ?? 16));
          return ok(req.id, { ok: true, data: r });
        }
        case 'mem_why': {
          const res = await deps.client.send({
            kind: 'why',
            nodeKind: String(args['kind'] ?? ''),
            nodeId: String(args['id'] ?? ''),
            depth: Number(args['depth'] ?? 4),
          });
          return ok(req.id, res);
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
