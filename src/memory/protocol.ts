/**
 * Wire protocol for SiftCoder memory daemon.
 * Length-prefixed JSON over Unix domain socket: 4-byte big-endian uint32 length, then UTF-8 JSON body.
 */

export type RequestKind =
  | 'capture'
  | 'search'
  | 'timeline'
  | 'get'
  | 'ping'
  | 'status'
  | 'shutdown'
  | 'backfill'
  | 'drain'
  | 'why'
  | 'summaries'
  | 'claim_for_summary'
  | 'record_summary'
  | 'release_summary'
  | 'cache_get'
  | 'cache_put'
  | 'prune'
  | 'retry_skipped'
  | 'pin'
  | 'unpin'
  | 'pinned'
  | 'doctor'
  | 'sweep_expired'
  | 'export'
  | 'import'
  | 'thread'
  | 'federate_search'
  | 'symbol_search'
  | 'stats';

export interface CaptureRequest {
  kind: 'capture';
  sessionId: string;
  tool: string;
  payload: unknown;
  ts?: number;
  /** Free-form provenance label: "claude-code", "cli", "vscode", "github", "slack", ... */
  source?: string;
  /** Optional TTL in ms. After `ts + ttlMs` the event (and its dependents) is auto-pruned. */
  ttlMs?: number;
}

export interface SearchRequest {
  kind: 'search';
  query: string;
  k?: number;
}

export interface TimelineRequest {
  kind: 'timeline';
  nearId: number;
  window?: number;
}

export interface GetRequest {
  kind: 'get';
  ids: number[];
}

export interface PingRequest {
  kind: 'ping';
}

export interface StatusRequest {
  kind: 'status';
}

export interface ShutdownRequest {
  kind: 'shutdown';
}

export interface BackfillRequest {
  kind: 'backfill';
  /** Source kind. Currently only 'transcripts'. */
  source?: 'transcripts';
  /** Optional cap on number of transcripts to scan (newest first). */
  limit?: number;
  /** Optional cap on frames per transcript. */
  perTranscriptLimit?: number;
  /** If true, scan only this workspace's encoded cwd. Defaults to true. */
  workspaceOnly?: boolean;
}

export interface DrainRequest {
  kind: 'drain';
  batch?: number;
}

export interface WhyRequest {
  kind: 'why';
  nodeKind: string;
  nodeId: string;
  depth?: number;
}

export interface SummariesRequest {
  kind: 'summaries';
  limit?: number;
}

/**
 * MCP-side drain support: lets the MCP server claim raw events, summarize them via the host's
 * `sampling/createMessage`, and write the summaries back. Daemon stays the storage source of
 * truth and never needs an API key when running inside Claude Code.
 */
export interface ClaimForSummaryRequest {
  kind: 'claim_for_summary';
  batch?: number;
}

export interface RecordSummaryRequest {
  kind: 'record_summary';
  eventId: number;
  model: string;
  promptHash: string;
  text: string;
  confidence: number | null;
  tokensIn: number | null;
  tokensOut: number | null;
  /** Optional embedding produced by the MCP-side caller (must match `embeddingDim` on this daemon). */
  embedding?: number[];
  ts?: number;
}

export interface ReleaseSummaryRequest {
  kind: 'release_summary';
  eventId: number;
  error: string;
  /** terminal=true marks the event `skipped` regardless of attempt count. */
  terminal?: boolean;
}

export interface CacheGetRequest {
  kind: 'cache_get';
  cacheKey: string;
}

export interface CachePutRequest {
  kind: 'cache_put';
  cacheKey: string;
  text: string;
  tokensIn: number | null;
  tokensOut: number | null;
  ts?: number;
}

export interface PruneRequest {
  kind: 'prune';
  /** Drop skipped events older than this many ms (default 7 days). */
  maxAgeMs?: number;
  /** If true, also drop superseded summaries. */
  superseded?: boolean;
}

export interface RetrySkippedRequest {
  kind: 'retry_skipped';
  /** Optional cap on how many to re-queue. */
  limit?: number;
}

export interface PinRequest {
  kind: 'pin';
  summaryId: number;
}

export interface UnpinRequest {
  kind: 'unpin';
  summaryId: number;
}

export interface PinnedRequest {
  kind: 'pinned';
  limit?: number;
}

export interface DoctorRequest {
  kind: 'doctor';
  /** When true, run repair routines (currently: vec0 backfill if drift > 0). */
  heal?: boolean;
}

export interface SweepExpiredRequest {
  kind: 'sweep_expired';
  /** Optional cutoff timestamp; defaults to Date.now(). */
  now?: number;
}

/**
 * Streaming export: response data is `{ chunk: string, done: boolean }` — the daemon writes
 * one chunk per RPC call (caller iterates by issuing follow-up `export` requests with the
 * `cursor` returned in the previous `chunk`). Simpler all-in-one form supported via `all=true`.
 */
export interface ExportRequest {
  kind: 'export';
  /** When set, return the entire snapshot as a single `data: { ndjson: string }` blob. */
  all?: boolean;
}

export interface ImportRequest {
  kind: 'import';
  /** ndjson blob produced by `export`. */
  ndjson: string;
}

/**
 * Cross-session continuity. Given a session id, return other sessions whose events share
 * an `input_hash` with this one — i.e. "you've seen this exact input before, here's where".
 */
export interface ThreadRequest {
  kind: 'thread';
  sessionId: string;
  limit?: number;
}

/**
 * Cross-workspace federated search. Queries every workspace under ~/.siftcoder/workspaces
 * that has an opt-in `federate.consent` flag. Hits are tagged with the originating workspace
 * key so callers can show provenance ("[work/a1b2c3] handled the same migration last week").
 */
export interface FederateSearchRequest {
  kind: 'federate_search';
  query: string;
  k?: number;
  /** Filter — only query workspaces whose key starts with this prefix. */
  workspacePrefix?: string;
  /** Cap on the number of consented workspaces to query. */
  maxWorkspaces?: number;
}

/**
 * Symbol-based retrieval. Returns events whose extracted symbols (kind:name pairs written by
 * the SymbolWorker) match the query — exact match by `kind:name` or partial match on the name.
 */
export interface SymbolSearchRequest {
  kind: 'symbol_search';
  /** "function:login" for exact, or "login" to match any symbol whose name contains the term. */
  query: string;
  k?: number;
}

/**
 * Operational stats: drain throughput (events/min over the recent window), backlog ETA,
 * cache hit rate, top tools, top sessions. Strictly read-only; cheap.
 */
export interface StatsRequest {
  kind: 'stats';
  /** Window in ms for throughput calculation; defaults to 1 hour. */
  windowMs?: number;
}

export type Request =
  | CaptureRequest
  | SearchRequest
  | TimelineRequest
  | GetRequest
  | PingRequest
  | StatusRequest
  | ShutdownRequest
  | BackfillRequest
  | DrainRequest
  | WhyRequest
  | SummariesRequest
  | ClaimForSummaryRequest
  | RecordSummaryRequest
  | ReleaseSummaryRequest
  | CacheGetRequest
  | CachePutRequest
  | PruneRequest
  | RetrySkippedRequest
  | PinRequest
  | UnpinRequest
  | PinnedRequest
  | DoctorRequest
  | SweepExpiredRequest
  | ExportRequest
  | ImportRequest
  | ThreadRequest
  | FederateSearchRequest
  | SymbolSearchRequest
  | StatsRequest;

export interface OkResponse<T = unknown> {
  ok: true;
  data: T;
}

export interface ErrResponse {
  ok: false;
  error: string;
}

export type Response<T = unknown> = OkResponse<T> | ErrResponse;

const MAX_FRAME_BYTES = 16 * 1024 * 1024;

export function encodeFrame(message: unknown): Buffer {
  const body = Buffer.from(JSON.stringify(message), 'utf8');
  if (body.length > MAX_FRAME_BYTES) {
    throw new Error(`frame too large: ${body.length} > ${MAX_FRAME_BYTES}`);
  }
  const header = Buffer.alloc(4);
  header.writeUInt32BE(body.length, 0);
  return Buffer.concat([header, body]);
}

export class FrameDecoder {
  private buf: Buffer = Buffer.alloc(0);

  push(chunk: Buffer): unknown[] {
    this.buf = this.buf.length === 0 ? chunk : Buffer.concat([this.buf, chunk]);
    const out: unknown[] = [];
    while (this.buf.length >= 4) {
      const len = this.buf.readUInt32BE(0);
      if (len > MAX_FRAME_BYTES) {
        throw new Error(`frame too large: ${len} > ${MAX_FRAME_BYTES}`);
      }
      if (this.buf.length < 4 + len) break;
      const body = this.buf.subarray(4, 4 + len);
      out.push(JSON.parse(body.toString('utf8')));
      this.buf = this.buf.subarray(4 + len);
    }
    return out;
  }
}

export const MAX_FRAME = MAX_FRAME_BYTES;
