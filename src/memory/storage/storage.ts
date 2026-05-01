/**
 * Storage facade over better-sqlite3 + (optional) sqlite-vec.
 * Capture path is synchronous and crash-safe; embeddings + FTS rank are layered on top.
 */
import { createHash } from 'node:crypto';
import { CORE_DDL, MIGRATIONS, VEC_DDL } from './schema.js';

/**
 * FTS5 MATCH treats `-`, `+`, `"`, `(`, `)`, `*`, `:`, `^`, AND, OR, NOT, NEAR as operators.
 * User-typed queries with any of these blow up with `fts5: syntax error near "X"`. Reduce to
 * alphanumeric tokens (incl. underscore); strip the FTS5 keywords NEAR/AND/OR/NOT to avoid
 * accidental operator semantics; join with spaces for default AND-of-tokens behavior.
 */
const FTS5_KEYWORDS = new Set(['NEAR', 'AND', 'OR', 'NOT']);
export function sanitizeFtsQuery(q: string): string {
  const tokens = (q.match(/[A-Za-z0-9_]+/g) ?? []).filter(t => !FTS5_KEYWORDS.has(t.toUpperCase()));
  return tokens.join(' ');
}

export interface DBHandle {
  exec(sql: string): unknown;
  prepare(sql: string): {
    run(...params: unknown[]): { lastInsertRowid: number | bigint };
    get(...params: unknown[]): unknown;
    all(...params: unknown[]): unknown[];
  };
  loadExtension?(path: string): void;
  close?(): void;
}

export interface EventRow {
  id: number;
  ts: number;
  sessionId: string;
  tool: string;
  inputHash: string;
  payloadJson: string;
  status: string;
  tokensEst: number;
}

export interface SummaryRow {
  id: number;
  eventId: number;
  ts: number;
  model: string;
  promptHash: string;
  text: string;
  tokensIn: number | null;
  tokensOut: number | null;
  confidence: number | null;
}

export interface CaptureInput {
  ts: number;
  sessionId: string;
  tool: string;
  payload: unknown;
  tokensEst?: number;
}

export interface SearchHit {
  id: number;
  eventId: number;
  text: string;
  ts: number;
  score: number;
}

export interface StorageCounts {
  events: number;
  raw: number;
  summarized: number;
  skipped: number;
  summaries: number;
  embeddings: number;
  superseded: number;
}

export function hashInput(payload: unknown): string {
  const json = JSON.stringify(payload);
  return createHash('sha256').update(json).digest('hex');
}

export class Storage {
  readonly vecEnabled: boolean;

  constructor(private readonly db: DBHandle, opts: { vecExtensionPath?: string } = {}) {
    db.exec(CORE_DDL);
    for (const stmt of MIGRATIONS) {
      try { db.exec(stmt); } catch { /* migration already applied */ }
    }
    let vec = false;
    if (opts.vecExtensionPath && db.loadExtension) {
      try {
        db.loadExtension(opts.vecExtensionPath);
        db.exec(VEC_DDL);
        vec = true;
      } catch {
        vec = false;
      }
    }
    this.vecEnabled = vec;
  }

  ensureSession(sessionId: string, cwd: string, ts: number): void {
    this.db
      .prepare(
        'INSERT OR IGNORE INTO sessions (id, started_at, cwd) VALUES (?, ?, ?)'
      )
      .run(sessionId, ts, cwd);
  }

  hasEvent(sessionId: string, inputHash: string): boolean {
    const row = this.db
      .prepare('SELECT 1 AS x FROM events WHERE session_id = ? AND input_hash = ? LIMIT 1')
      .get(sessionId, inputHash) as Record<string, unknown> | undefined;
    return !!row;
  }

  recordEvent(input: CaptureInput): number {
    const inputHash = hashInput(input.payload);
    const result = this.db
      .prepare(
        'INSERT INTO events (ts, session_id, tool, input_hash, payload_json, tokens_est) VALUES (?, ?, ?, ?, ?, ?)'
      )
      .run(
        input.ts,
        input.sessionId,
        input.tool,
        inputHash,
        JSON.stringify(input.payload),
        input.tokensEst ?? 0
      );
    return Number(result.lastInsertRowid);
  }

  getEvent(id: number): EventRow | null {
    const row = this.db
      .prepare(
        'SELECT id, ts, session_id, tool, input_hash, payload_json, status, tokens_est FROM events WHERE id = ?'
      )
      .get(id) as Record<string, unknown> | undefined;
    if (!row) return null;
    return {
      id: row['id'] as number,
      ts: row['ts'] as number,
      sessionId: row['session_id'] as string,
      tool: row['tool'] as string,
      inputHash: row['input_hash'] as string,
      payloadJson: row['payload_json'] as string,
      status: row['status'] as string,
      tokensEst: (row['tokens_est'] as number | undefined) ?? 0,
    };
  }

  markEventStatus(id: number, status: 'raw' | 'summarized' | 'skipped'): void {
    this.db.prepare('UPDATE events SET status = ? WHERE id = ?').run(status, id);
  }

  pendingEvents(limit = 32): EventRow[] {
    const rows = this.db
      .prepare(
        "SELECT id, ts, session_id, tool, input_hash, payload_json, status, tokens_est FROM events WHERE status = 'raw' ORDER BY id ASC LIMIT ?"
      )
      .all(limit) as Record<string, unknown>[];
    return rows.map(r => ({
      id: r['id'] as number,
      ts: r['ts'] as number,
      sessionId: r['session_id'] as string,
      tool: r['tool'] as string,
      inputHash: r['input_hash'] as string,
      payloadJson: r['payload_json'] as string,
      status: r['status'] as string,
      tokensEst: (r['tokens_est'] as number | undefined) ?? 0,
    }));
  }

  counts(): StorageCounts {
    const c = (sql: string): number => {
      const row = this.db.prepare(sql).get() as { c?: number } | undefined;
      return row?.c ?? 0;
    };
    return {
      events: c('SELECT count(*) AS c FROM events'),
      raw: c("SELECT count(*) AS c FROM events WHERE status = 'raw'"),
      summarized: c("SELECT count(*) AS c FROM events WHERE status = 'summarized'"),
      skipped: c("SELECT count(*) AS c FROM events WHERE status = 'skipped'"),
      summaries: c('SELECT count(*) AS c FROM summaries'),
      embeddings: c('SELECT count(*) AS c FROM summary_embeddings'),
      superseded: c('SELECT count(DISTINCT older_id) AS c FROM summary_supersedes'),
    };
  }

  recordSummary(s: Omit<SummaryRow, 'id'>): number {
    const result = this.db
      .prepare(
        'INSERT INTO summaries (event_id, ts, model, prompt_hash, text, tokens_in, tokens_out, confidence) VALUES (?, ?, ?, ?, ?, ?, ?, ?)'
      )
      .run(
        s.eventId,
        s.ts,
        s.model,
        s.promptHash,
        s.text,
        s.tokensIn,
        s.tokensOut,
        s.confidence
      );
    return Number(result.lastInsertRowid);
  }

  getSummariesByIds(ids: number[]): SummaryRow[] {
    if (ids.length === 0) return [];
    const placeholders = ids.map(() => '?').join(',');
    const rows = this.db
      .prepare(
        `SELECT id, event_id, ts, model, prompt_hash, text, tokens_in, tokens_out, confidence FROM summaries WHERE id IN (${placeholders})`
      )
      .all(...ids) as Record<string, unknown>[];
    return rows.map(r => ({
      id: r['id'] as number,
      eventId: r['event_id'] as number,
      ts: r['ts'] as number,
      model: r['model'] as string,
      promptHash: r['prompt_hash'] as string,
      text: r['text'] as string,
      tokensIn: (r['tokens_in'] as number | null) ?? null,
      tokensOut: (r['tokens_out'] as number | null) ?? null,
      confidence: (r['confidence'] as number | null) ?? null,
    }));
  }

  searchFts(query: string, k = 5): SearchHit[] {
    const safe = sanitizeFtsQuery(query);
    if (!safe) return [];
    const rows = this.db
      .prepare(
        `SELECT s.id AS id, s.event_id AS event_id, s.text AS text, s.ts AS ts,
                bm25(summaries_fts) AS score
         FROM summaries_fts JOIN summaries s ON s.id = summaries_fts.rowid
         WHERE summaries_fts MATCH ?
         ORDER BY score ASC LIMIT ?`
      )
      .all(safe, k) as Record<string, unknown>[];
    return rows.map(r => ({
      id: r['id'] as number,
      eventId: r['event_id'] as number,
      text: r['text'] as string,
      ts: r['ts'] as number,
      score: r['score'] as number,
    }));
  }

  timeline(nearId: number, window = 10): SummaryRow[] {
    const rows = this.db
      .prepare(
        `SELECT id, event_id, ts, model, prompt_hash, text, tokens_in, tokens_out, confidence
         FROM summaries
         WHERE id BETWEEN ? AND ?
         ORDER BY id ASC`
      )
      .all(nearId - window, nearId + window) as Record<string, unknown>[];
    return rows.map(r => ({
      id: r['id'] as number,
      eventId: r['event_id'] as number,
      ts: r['ts'] as number,
      model: r['model'] as string,
      promptHash: r['prompt_hash'] as string,
      text: r['text'] as string,
      tokensIn: (r['tokens_in'] as number | null) ?? null,
      tokensOut: (r['tokens_out'] as number | null) ?? null,
      confidence: (r['confidence'] as number | null) ?? null,
    }));
  }

  putEmbedding(summaryId: number, vec: Float32Array): void {
    const buf = Buffer.from(vec.buffer, vec.byteOffset, vec.byteLength);
    this.db
      .prepare('INSERT OR REPLACE INTO summary_embeddings (summary_id, dim, vec) VALUES (?, ?, ?)')
      .run(summaryId, vec.length, buf);
  }

  getEmbedding(summaryId: number): Float32Array | null {
    const row = this.db
      .prepare('SELECT dim, vec FROM summary_embeddings WHERE summary_id = ?')
      .get(summaryId) as { dim: number; vec: Buffer } | undefined;
    if (!row) return null;
    return new Float32Array(row.vec.buffer, row.vec.byteOffset, row.dim);
  }

  allEmbeddings(): Array<{ summaryId: number; vec: Float32Array; ts: number }> {
    const rows = this.db
      .prepare(
        `SELECT e.summary_id AS sid, e.dim AS dim, e.vec AS vec, s.ts AS ts
         FROM summary_embeddings e JOIN summaries s ON s.id = e.summary_id`
      )
      .all() as Array<{ sid: number; dim: number; vec: Buffer; ts: number }>;
    return rows.map(r => ({
      summaryId: r.sid,
      vec: new Float32Array(r.vec.buffer, r.vec.byteOffset, r.dim),
      ts: r.ts,
    }));
  }

  recordSupersedes(newerId: number, olderId: number, cosineSim: number, ts: number): void {
    this.db
      .prepare(
        'INSERT OR IGNORE INTO summary_supersedes (newer_id, older_id, cosine, ts) VALUES (?, ?, ?, ?)'
      )
      .run(newerId, olderId, cosineSim, ts);
  }

  supersededIds(): Set<number> {
    const rows = this.db
      .prepare('SELECT older_id FROM summary_supersedes')
      .all() as Array<{ older_id: number }>;
    return new Set(rows.map(r => r.older_id));
  }

  cacheKey(model: string, promptHash: string, inputHash: string): string {
    return createHash('sha256')
      .update(model)
      .update('|')
      .update(promptHash)
      .update('|')
      .update(inputHash)
      .digest('hex');
  }

  getCachedSummary(cacheKey: string): { text: string; tokensIn: number | null; tokensOut: number | null } | null {
    const row = this.db
      .prepare('SELECT text, tokens_in, tokens_out FROM summary_cache WHERE cache_key = ?')
      .get(cacheKey) as Record<string, unknown> | undefined;
    if (!row) return null;
    return {
      text: row['text'] as string,
      tokensIn: (row['tokens_in'] as number | null) ?? null,
      tokensOut: (row['tokens_out'] as number | null) ?? null,
    };
  }

  putCachedSummary(
    cacheKey: string,
    text: string,
    tokensIn: number | null,
    tokensOut: number | null,
    ts: number
  ): void {
    this.db
      .prepare(
        'INSERT OR REPLACE INTO summary_cache (cache_key, text, tokens_in, tokens_out, created_at) VALUES (?, ?, ?, ?, ?)'
      )
      .run(cacheKey, text, tokensIn, tokensOut, ts);
  }
}
