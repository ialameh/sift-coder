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
import type { SamplingTransport } from './sampling-client.js';
import { createHash } from 'node:crypto';

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
  /**
   * When the host advertises `sampling`, MCP-side drain orchestrates summarization via
   * `sampling/createMessage` rather than asking the daemon to call an external API. The host
   * pays for the LLM call under its own credentials, so the plugin needs no API key.
   */
  samplingTransport?: SamplingTransport | null;
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
  {
    name: 'mem_pin',
    description: 'Mark a summary as user-curated. Pinned summaries are exempt from supersede + decay; use to lock in important facts (decisions, gotchas, configuration values) that should always surface in search.',
    inputSchema: {
      type: 'object',
      properties: { summary_id: { type: 'number' } },
      required: ['summary_id'],
    },
  },
  {
    name: 'mem_unpin',
    description: 'Remove the curation mark from a previously pinned summary.',
    inputSchema: {
      type: 'object',
      properties: { summary_id: { type: 'number' } },
      required: ['summary_id'],
    },
  },
  {
    name: 'mem_pinned',
    description: 'List the most-recently pinned summaries.',
    inputSchema: {
      type: 'object',
      properties: { limit: { type: 'number', default: 100 } },
      required: [],
    },
  },
  {
    name: 'mem_prune',
    description: 'Drop old skipped events (default >7 days) and optionally consolidator-superseded summaries. Returns counts of removed rows.',
    inputSchema: {
      type: 'object',
      properties: {
        days: { type: 'number', default: 7 },
        superseded: { type: 'boolean', default: false },
      },
      required: [],
    },
  },
  {
    name: 'mem_retry',
    description: 'Re-queue events whose drain previously hit a non-retryable error. Useful after a quota outage or backend swap.',
    inputSchema: {
      type: 'object',
      properties: { limit: { type: 'number' } },
      required: [],
    },
  },
  {
    name: 'mem_doctor',
    description: 'Health check over the memory store: integrity, orphan summaries / embeddings, vec0 cardinality drift, counts. Returns a structured report. Pass `heal: true` to repair vec0 drift in place.',
    inputSchema: {
      type: 'object',
      properties: { heal: { type: 'boolean', default: false } },
      required: [],
    },
  },
  {
    name: 'mem_export',
    description: 'Snapshot the entire memory store as ndjson. Returns the snapshot inline plus a record count. Use to migrate or back up.',
    inputSchema: { type: 'object', properties: {}, required: [] },
  },
  {
    name: 'mem_import',
    description: 'Load an ndjson snapshot produced by mem_export. Idempotent — INSERT OR IGNORE everywhere; safe to re-import overlapping data.',
    inputSchema: {
      type: 'object',
      properties: { ndjson: { type: 'string' } },
      required: ['ndjson'],
    },
  },
  {
    name: 'mem_sweep_expired',
    description: 'Delete events whose TTL has passed (cascades to summaries, embeddings, provenance). Returns the number of events removed.',
    inputSchema: { type: 'object', properties: {}, required: [] },
  },
  {
    name: 'mem_thread',
    description: 'Cross-session continuity: given a session id, return other sessions whose events share an input_hash — i.e. "you have seen this exact input before, here is where". Useful when an agent recognizes a familiar prompt or tool call and wants to surface the prior outcome.',
    inputSchema: {
      type: 'object',
      properties: {
        session_id: { type: 'string' },
        limit: { type: 'number', default: 20 },
      },
      required: ['session_id'],
    },
  },
  {
    name: 'mem_federate_search',
    description: 'Cross-workspace federated search: queries every consented workspace under ~/.siftcoder/workspaces (those with a federate.consent flag) and merges the hits. Each hit is tagged with the originating workspace key for provenance.',
    inputSchema: {
      type: 'object',
      properties: {
        query: { type: 'string' },
        k: { type: 'number', default: 5 },
        workspace_prefix: { type: 'string' },
        max_workspaces: { type: 'number' },
      },
      required: ['query'],
    },
  },
  {
    name: 'mem_symbol_search',
    description: 'Find events by extracted code symbol. Pass "kind:name" (e.g. "function:login") for an exact match, or just a bare term to substring-match any symbol name. Returns events along with the joined summary text when available.',
    inputSchema: {
      type: 'object',
      properties: {
        query: { type: 'string' },
        k: { type: 'number', default: 10 },
      },
      required: ['query'],
    },
  },
  {
    name: 'mem_stats',
    description: 'Operational stats: capture/drain throughput over a window, pending backlog with drain ETA, cache hit rate, top tools, top sessions. Cheap to call; suitable for a status dashboard.',
    inputSchema: {
      type: 'object',
      properties: { window_ms: { type: 'number', default: 3600000 } },
      required: [],
    },
  },
  {
    name: 'mem_replay',
    description: 'Replay a session: events in chronological order with their summaries joined in. Use to reconstruct what the agent saw earlier, audit a prior decision, or feed long-context recall.',
    inputSchema: {
      type: 'object',
      properties: {
        session_id: { type: 'string' },
        limit: { type: 'number', default: 200 },
      },
      required: ['session_id'],
    },
  },
  {
    name: 'mem_capture',
    description: 'Push a fact into the memory store directly. Use when the agent has a durable observation it wants to keep (a decision, a confirmed fact, a gotcha). The payload is redacted then stored. Optional `ttl_ms` makes it ephemeral.',
    inputSchema: {
      type: 'object',
      properties: {
        session_id: { type: 'string' },
        tool: { type: 'string', default: 'agent_capture' },
        payload: {},
        ttl_ms: { type: 'number' },
      },
      required: ['session_id', 'payload'],
    },
  },
  {
    name: 'mem_context_budget',
    description: 'Greedy fill against a token budget: hybrid-search for `query`, then return the highest-scoring summaries whose cumulative token count fits under `max_tokens`. Use to assemble a memory-context block sized to a model input window.',
    inputSchema: {
      type: 'object',
      properties: {
        query: { type: 'string' },
        max_tokens: { type: 'number', default: 4000 },
        candidate_pool: { type: 'number', default: 50 },
      },
      required: ['query', 'max_tokens'],
    },
  },
  {
    name: 'mem_compact',
    description: 'Storage hygiene: drop stale summary_cache rows, drop dim-mismatched embeddings, rebuild FTS index, VACUUM. Cheap to run weekly; reclaims disk lost to row deletions.',
    inputSchema: {
      type: 'object',
      properties: { cache_max_age_ms: { type: 'number', default: 2592000000 } },
      required: [],
    },
  },
  {
    name: 'mem_patterns',
    description: 'Detect recurring patterns: inputs whose hash repeats across many sessions. Useful for surfacing habitual behaviour, auto-pin candidates, or workflow suggestions.',
    inputSchema: {
      type: 'object',
      properties: {
        min_repeats: { type: 'number', default: 3 },
        limit: { type: 'number', default: 50 },
      },
      required: [],
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

const MCP_DRAIN_SYSTEM = `You compress tool-call observations into one-sentence durable memories for a coding assistant.
Output JSON only: {"text": string, "confidence": number 0..1}.
- text: <= 240 chars, concrete, contains the key fact (file path, function name, decision, error message).
- confidence: how useful this will be to recall later. 0 = trivial/no signal, 1 = critical decision or unique knowledge.
Skip fluff. No pronouns. No hedging.`;

const MCP_DRAIN_PROMPT_HASH = createHash('sha256').update(MCP_DRAIN_SYSTEM).digest('hex');
const MCP_DRAIN_MODEL = 'mcp-sampling';

function parseSamplingOutput(raw: string): { text: string; confidence: number } {
  const stripped = raw.replace(/^\s*```(?:json)?\s*/i, '').replace(/\s*```\s*$/i, '').trim();
  const start = stripped.indexOf('{');
  const end = stripped.lastIndexOf('}');
  if (start >= 0 && end > start) {
    try {
      const obj = JSON.parse(stripped.slice(start, end + 1)) as { text?: unknown; confidence?: unknown };
      const text = typeof obj.text === 'string' ? obj.text : stripped;
      const conf = typeof obj.confidence === 'number' ? Math.max(0, Math.min(1, obj.confidence)) : 0.5;
      return { text, confidence: conf };
    } catch { /* fall through */ }
  }
  return { text: stripped, confidence: 0.5 };
}

function isRetryableHostError(message: string): boolean {
  const m = message.toLowerCase();
  return /(rate.?limit|429|5\d\d|timeout|overloaded|temporarily|unavailable)/.test(m);
}

interface ClaimedEvent {
  id: number;
  inputHash: string;
  payloadJson: string;
}

/**
 * MCP-side drain: claim events from the daemon, summarize via host `sampling/createMessage`,
 * write summaries back. Returns counts compatible with the daemon-side drain shape so callers
 * (mem_search, mem_drain) can swap implementations without caring which path ran.
 */
export async function drainViaSampling(
  client: MemoryClient,
  transport: SamplingTransport,
  batch: number,
): Promise<DrainResult> {
  let processed = 0;
  let errors = 0;
  let firstError: string | undefined;
  const claim = await client.send<{ events: ClaimedEvent[] }>({ kind: 'claim_for_summary', batch });
  if (!claim.ok || claim.data.events.length === 0) {
    return { processed, errors, pending: 0, backend: 'mcp-sampling' };
  }
  for (const ev of claim.data.events) {
    const cacheKey = createHash('sha256')
      .update(MCP_DRAIN_MODEL).update('|')
      .update(MCP_DRAIN_PROMPT_HASH).update('|')
      .update(ev.inputHash)
      .digest('hex');
    let text: string;
    let confidence: number;
    let tokensIn: number | null = null;
    let tokensOut: number | null = null;
    try {
      const cached = await client.send<{ cached: { text: string; tokensIn: number | null; tokensOut: number | null } | null }>({
        kind: 'cache_get', cacheKey,
      });
      if (cached.ok && cached.data.cached) {
        const parsed = parseSamplingOutput(cached.data.cached.text);
        text = parsed.text;
        confidence = parsed.confidence;
        tokensIn = cached.data.cached.tokensIn;
        tokensOut = cached.data.cached.tokensOut;
      } else {
        const res = await transport.requestSampling({
          messages: [{ role: 'user', content: { type: 'text', text: ev.payloadJson } }],
          systemPrompt: MCP_DRAIN_SYSTEM,
          maxTokens: 512,
          temperature: 0,
        });
        const raw = res.content?.text ?? '';
        const parsed = parseSamplingOutput(raw);
        text = parsed.text;
        confidence = parsed.confidence;
        await client.send({
          kind: 'cache_put', cacheKey, text: raw, tokensIn: null, tokensOut: null,
        });
      }
      await client.send({
        kind: 'record_summary',
        eventId: ev.id,
        model: MCP_DRAIN_MODEL,
        promptHash: MCP_DRAIN_PROMPT_HASH,
        text,
        confidence,
        tokensIn,
        tokensOut,
      });
      processed++;
    } catch (e) {
      const msg = (e as Error).message;
      if (firstError === undefined) firstError = msg;
      await client.send({
        kind: 'release_summary',
        eventId: ev.id,
        error: msg,
        terminal: !isRetryableHostError(msg),
      });
      errors++;
    }
  }
  return firstError
    ? { processed, errors, pending: 0, backend: 'mcp-sampling', firstError }
    : { processed, errors, pending: 0, backend: 'mcp-sampling' };
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
          // Eager drain: scale batch with current backlog so a busy queue gets caught up
          // proportionally to how far behind it is. The default 4 is fine for a clean store
          // but lets a 500-event backlog take 125 search-triggered drains to clear at the
          // base rate. Bump to 8 / 16 / 32 above thresholds.
          const baseBatch = deps.drainBatch ?? 4;
          let batch = baseBatch;
          try {
            const status = await deps.client.send<{ counts: { raw: number } }>({ kind: 'status' });
            if (status.ok) {
              const raw = status.data.counts.raw;
              if (raw > 500) batch = Math.max(baseBatch, 32);
              else if (raw > 200) batch = Math.max(baseBatch, 16);
              else if (raw > 50) batch = Math.max(baseBatch, 8);
            }
          } catch { /* fall through to base batch */ }
          if (deps.samplingTransport) {
            await drainViaSampling(deps.client, deps.samplingTransport, batch);
          } else {
            await drain(deps.client, batch);
          }
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
          const batch = Number(args['batch'] ?? 16);
          const r = deps.samplingTransport
            ? await drainViaSampling(deps.client, deps.samplingTransport, batch)
            : await drain(deps.client, batch);
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
        case 'mem_pin': {
          const res = await deps.client.send({ kind: 'pin', summaryId: Number(args['summary_id']) });
          return ok(req.id, res);
        }
        case 'mem_unpin': {
          const res = await deps.client.send({ kind: 'unpin', summaryId: Number(args['summary_id']) });
          return ok(req.id, res);
        }
        case 'mem_pinned': {
          const res = await deps.client.send({ kind: 'pinned', limit: Number(args['limit'] ?? 100) });
          return ok(req.id, res);
        }
        case 'mem_prune': {
          const days = Number(args['days'] ?? 7);
          const res = await deps.client.send({
            kind: 'prune',
            maxAgeMs: days * 24 * 60 * 60 * 1000,
            superseded: Boolean(args['superseded']),
          });
          return ok(req.id, res);
        }
        case 'mem_retry': {
          const limit = args['limit'] !== undefined ? Number(args['limit']) : undefined;
          const res = await deps.client.send({ kind: 'retry_skipped', limit });
          return ok(req.id, res);
        }
        case 'mem_doctor': {
          const res = await deps.client.send({ kind: 'doctor', heal: Boolean(args['heal']) });
          return ok(req.id, res);
        }
        case 'mem_export': {
          const res = await deps.client.send({ kind: 'export', all: true });
          return ok(req.id, res);
        }
        case 'mem_import': {
          const res = await deps.client.send({ kind: 'import', ndjson: String(args['ndjson'] ?? '') });
          return ok(req.id, res);
        }
        case 'mem_sweep_expired': {
          const res = await deps.client.send({ kind: 'sweep_expired' });
          return ok(req.id, res);
        }
        case 'mem_thread': {
          const res = await deps.client.send({
            kind: 'thread',
            sessionId: String(args['session_id'] ?? ''),
            limit: Number(args['limit'] ?? 20),
          });
          return ok(req.id, res);
        }
        case 'mem_federate_search': {
          const res = await deps.client.send({
            kind: 'federate_search',
            query: String(args['query'] ?? ''),
            k: Number(args['k'] ?? 5),
            workspacePrefix: typeof args['workspace_prefix'] === 'string' ? args['workspace_prefix'] : undefined,
            maxWorkspaces: args['max_workspaces'] !== undefined ? Number(args['max_workspaces']) : undefined,
          });
          return ok(req.id, res);
        }
        case 'mem_symbol_search': {
          const res = await deps.client.send({
            kind: 'symbol_search',
            query: String(args['query'] ?? ''),
            k: Number(args['k'] ?? 10),
          });
          return ok(req.id, res);
        }
        case 'mem_stats': {
          const res = await deps.client.send({
            kind: 'stats',
            windowMs: args['window_ms'] !== undefined ? Number(args['window_ms']) : undefined,
          });
          return ok(req.id, res);
        }
        case 'mem_replay': {
          const res = await deps.client.send({
            kind: 'replay',
            sessionId: String(args['session_id'] ?? ''),
            limit: Number(args['limit'] ?? 200),
          });
          return ok(req.id, res);
        }
        case 'mem_capture': {
          const res = await deps.client.send({
            kind: 'capture',
            sessionId: String(args['session_id'] ?? ''),
            tool: typeof args['tool'] === 'string' ? args['tool'] : 'agent_capture',
            payload: args['payload'] ?? {},
            ttlMs: args['ttl_ms'] !== undefined ? Number(args['ttl_ms']) : undefined,
            source: 'agent',
          });
          return ok(req.id, res);
        }
        case 'mem_context_budget': {
          const res = await deps.client.send({
            kind: 'context_budget',
            query: String(args['query'] ?? ''),
            maxTokens: Number(args['max_tokens'] ?? 4000),
            candidatePool: args['candidate_pool'] !== undefined ? Number(args['candidate_pool']) : undefined,
          });
          return ok(req.id, res);
        }
        case 'mem_compact': {
          const res = await deps.client.send({
            kind: 'compact',
            cacheMaxAgeMs: args['cache_max_age_ms'] !== undefined ? Number(args['cache_max_age_ms']) : undefined,
          });
          return ok(req.id, res);
        }
        case 'mem_patterns': {
          const res = await deps.client.send({
            kind: 'patterns',
            minRepeats: args['min_repeats'] !== undefined ? Number(args['min_repeats']) : undefined,
            limit: args['limit'] !== undefined ? Number(args['limit']) : undefined,
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
