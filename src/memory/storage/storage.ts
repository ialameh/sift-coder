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
  exec(sql: string): Promise<unknown>;
  prepare(sql: string): Promise<{
    run(...params: unknown[]): Promise<{ lastInsertRowid: number | bigint }>;
    get(...params: unknown[]): Promise<unknown>;
    all(...params: unknown[]): Promise<unknown[]>;
  }>;
  loadExtension?(path: string): void;
  close(): Promise<void>;
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

export interface StorageOptions {
  vecExtensionPath?: string;
  /** Override CORE_DDL — used by the PostgreSQL adapter to inject PG-specific DDL */
  coreDdl?: string;
  migrations?: ReadonlyArray<string>;
  vecDdl?: string;
}

/**
 * Storage — async factory for all backends (SQLite + PostgreSQL).
 *
 * Construction is private. Use `Storage.init(db, opts)` to create a ready Storage instance.
 * This ensures DDL runs exactly once per Storage lifetime, through the async init path.
 */
export class Storage {
  /** @internal */
  readonly vecEnabled: boolean;
  /**
   * In-process serialization for write-locked transactions (e.g. claimPending). A single Node
   * process holds one DB connection, so concurrent `BEGIN IMMEDIATE` on that connection collide
   * with SQLite's "cannot start a transaction within a transaction" error. This mutex chains
   * those callers so they execute one at a time. Cross-process concurrency is still serialized
   * by SQLite's own file locks.
   */
  private writeLock: Promise<void> = Promise.resolve();
  /** @internal */
  private constructor(
    private readonly db: DBHandle,
    vecEnabled: boolean
  ) {
    this.vecEnabled = vecEnabled;
  }

  private async withWriteLock<T>(fn: () => Promise<T>): Promise<T> {
    const previous = this.writeLock;
    let release!: () => void;
    this.writeLock = new Promise<void>(resolve => { release = resolve; });
    try {
      await previous;
      return await fn();
    } finally {
      release();
    }
  }

  /**
   * Async factory — initializes DDL, runs migrations, loads vec extension if available.
   * Returns a ready-to-use Storage instance.
   */
  static async init(db: DBHandle, opts: StorageOptions = {}): Promise<Storage> {
    const coreDdl = opts.coreDdl ?? CORE_DDL;
    const migrations = opts.migrations ?? MIGRATIONS;
    const vecDdl = opts.vecDdl ?? VEC_DDL;

    await db.exec(coreDdl);
    for (const stmt of migrations) {
      try { await db.exec(stmt); } catch { /* migration already applied */ }
    }
    let vec = false;
    if (opts.vecExtensionPath && db.loadExtension) {
      try {
        db.loadExtension(opts.vecExtensionPath);
        await db.exec(vecDdl);
        vec = true;
      } catch {
        vec = false;
      }
    }
    if (!vec && opts.coreDdl && opts.coreDdl !== CORE_DDL) {
      vec = true;
    }
    return new Storage(db, vec);
  }

  /**
   * Closes the underlying DB handle. After close(), the Storage instance is unusable.
   */
  close(): Promise<void> {
    return this.db.close();
  }

  async ensureSession(sessionId: string, cwd: string, ts: number): Promise<void> {
    await (await this.db.prepare(
      'INSERT OR IGNORE INTO sessions (id, started_at, cwd) VALUES (?, ?, ?)'
    )).run(sessionId, ts, cwd);
  }

  async hasEvent(sessionId: string, inputHash: string): Promise<boolean> {
    const row = await (await this.db.prepare(
      'SELECT 1 AS x FROM events WHERE session_id = ? AND input_hash = ? LIMIT 1'
    )).get(sessionId, inputHash) as Record<string, unknown> | undefined;
    return !!row;
  }

  async recordEvent(input: CaptureInput): Promise<number> {
    const inputHash = hashInput(input.payload);
    const result = await (await this.db.prepare(
      'INSERT INTO events (ts, session_id, tool, input_hash, payload_json, tokens_est) VALUES (?, ?, ?, ?, ?, ?)'
    )).run(
      input.ts,
      input.sessionId,
      input.tool,
      inputHash,
      JSON.stringify(input.payload),
      input.tokensEst ?? 0
    );
    return Number(result.lastInsertRowid);
  }

  async getEvent(id: number): Promise<EventRow | null> {
    const row = await (await this.db.prepare(
      'SELECT id, ts, session_id, tool, input_hash, payload_json, status, tokens_est FROM events WHERE id = ?'
    )).get(id) as Record<string, unknown> | undefined;
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

  async markEventStatus(id: number, status: 'raw' | 'claimed' | 'summarized' | 'skipped'): Promise<void> {
    await (await this.db.prepare('UPDATE events SET status = ? WHERE id = ?')).run(status, id);
  }

  async pendingEvents(limit = 32): Promise<EventRow[]> {
    const rows = await (await this.db.prepare(
      "SELECT id, ts, session_id, tool, input_hash, payload_json, status, tokens_est FROM events WHERE status = 'raw' ORDER BY id ASC LIMIT ?"
    )).all(limit) as Record<string, unknown>[];
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

  /**
   * Atomically claim up to `limit` raw events, flipping their status to `claimed`. Concurrent
   * claimers will not see overlapping rows. Use `releaseClaimed` on retryable failure or
   * `markEventStatus` on success/terminal failure.
   *
   * Implemented as a write-locked transaction (BEGIN IMMEDIATE) so it works on every backend
   * regardless of UPDATE … RETURNING support.
   */
  async claimPending(limit = 32): Promise<EventRow[]> {
    return this.withWriteLock(async () => {
      await this.db.exec('BEGIN IMMEDIATE');
      try {
        const rows = await (await this.db.prepare(
          "SELECT id, ts, session_id, tool, input_hash, payload_json, status, tokens_est FROM events WHERE status = 'raw' ORDER BY id ASC LIMIT ?"
        )).all(limit) as Record<string, unknown>[];
        if (rows.length === 0) {
          await this.db.exec('COMMIT');
          return [];
        }
        const placeholders = rows.map(() => '?').join(',');
        const ids = rows.map(r => r['id'] as number);
        await (await this.db.prepare(
          `UPDATE events SET status = 'claimed' WHERE id IN (${placeholders})`
        )).run(...ids);
        await this.db.exec('COMMIT');
        return rows.map(r => ({
          id: r['id'] as number,
          ts: r['ts'] as number,
          sessionId: r['session_id'] as string,
          tool: r['tool'] as string,
          inputHash: r['input_hash'] as string,
          payloadJson: r['payload_json'] as string,
          status: 'claimed',
          tokensEst: (r['tokens_est'] as number | undefined) ?? 0,
        }));
      } catch (e) {
        try { await this.db.exec('ROLLBACK'); } catch { /* ignore */ }
        throw e;
      }
    });
  }

  /**
   * Return a claimed event to `raw` for retry. Increments attempts and stores the last error.
   * If `maxAttempts` is reached, mark as `skipped` instead so the queue doesn't loop forever.
   */
  async releaseClaimed(id: number, error: string, maxAttempts = 3): Promise<'released' | 'skipped'> {
    const row = await (await this.db.prepare(
      'SELECT attempts FROM events WHERE id = ?'
    )).get(id) as { attempts?: number } | undefined;
    const attempts = (row?.attempts ?? 0) + 1;
    if (attempts >= maxAttempts) {
      await (await this.db.prepare(
        "UPDATE events SET status = 'skipped', attempts = ?, last_error = ? WHERE id = ?"
      )).run(attempts, error, id);
      return 'skipped';
    }
    await (await this.db.prepare(
      "UPDATE events SET status = 'raw', attempts = ?, last_error = ? WHERE id = ?"
    )).run(attempts, error, id);
    return 'released';
  }

  async counts(): Promise<StorageCounts> {
    const c = async (sql: string): Promise<number> => {
      const row = await (await this.db.prepare(sql)).get() as { c?: number } | undefined;
      return row?.c ?? 0;
    };
    return {
      events: await c('SELECT count(*) AS c FROM events'),
      raw: await c("SELECT count(*) AS c FROM events WHERE status = 'raw'"),
      summarized: await c("SELECT count(*) AS c FROM events WHERE status = 'summarized'"),
      skipped: await c("SELECT count(*) AS c FROM events WHERE status = 'skipped'"),
      summaries: await c('SELECT count(*) AS c FROM summaries'),
      embeddings: await c('SELECT count(*) AS c FROM summary_embeddings'),
      superseded: await c('SELECT count(DISTINCT older_id) AS c FROM summary_supersedes'),
    };
  }

  /**
   * Insert one summary per event_id. If a summary already exists for this event_id (e.g. due to
   * a retried drain or a cache-hit re-run), return the existing id and leave the row untouched.
   * The UNIQUE INDEX on summaries(event_id) is the source of truth.
   */
  async recordSummary(s: Omit<SummaryRow, 'id'>): Promise<number> {
    const result = await (await this.db.prepare(
      `INSERT INTO summaries (event_id, ts, model, prompt_hash, text, tokens_in, tokens_out, confidence)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)
       ON CONFLICT(event_id) DO NOTHING`
    )).run(
      s.eventId,
      s.ts,
      s.model,
      s.promptHash,
      s.text,
      s.tokensIn,
      s.tokensOut,
      s.confidence
    );
    const inserted = Number(result.lastInsertRowid);
    if (inserted > 0) return inserted;
    const existing = await (await this.db.prepare(
      'SELECT id FROM summaries WHERE event_id = ?'
    )).get(s.eventId) as { id?: number } | undefined;
    return existing?.id ?? 0;
  }

  async getSummariesByIds(ids: number[]): Promise<SummaryRow[]> {
    if (ids.length === 0) return [];
    const placeholders = ids.map(() => '?').join(',');
    const rows = await (await this.db.prepare(
      `SELECT id, event_id, ts, model, prompt_hash, text, tokens_in, tokens_out, confidence FROM summaries WHERE id IN (${placeholders})`
    )).all(...ids) as Record<string, unknown>[];
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

  async searchFts(query: string, k = 5): Promise<SearchHit[]> {
    const safe = sanitizeFtsQuery(query);
    if (!safe) return [];
    const rows = await (await this.db.prepare(
      `SELECT s.id AS id, s.event_id AS event_id, s.text AS text, s.ts AS ts,
              bm25(summaries_fts) AS score
       FROM summaries_fts JOIN summaries s ON s.id = summaries_fts.rowid
       WHERE summaries_fts MATCH ?
       ORDER BY score ASC LIMIT ?`
    )).all(safe, k) as Record<string, unknown>[];
    return rows.map(r => ({
      id: r['id'] as number,
      eventId: r['event_id'] as number,
      text: r['text'] as string,
      ts: r['ts'] as number,
      score: r['score'] as number,
    }));
  }

  async recentSummaries(limit = 20): Promise<SummaryRow[]> {
    const rows = await (await this.db.prepare(
      `SELECT id, event_id, ts, model, prompt_hash, text, tokens_in, tokens_out, confidence
       FROM summaries
       ORDER BY id DESC
       LIMIT ?`
    )).all(limit) as Record<string, unknown>[];
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

  async timeline(nearId: number, window = 10): Promise<SummaryRow[]> {
    const rows = await (await this.db.prepare(
      `SELECT id, event_id, ts, model, prompt_hash, text, tokens_in, tokens_out, confidence
       FROM summaries
       WHERE id BETWEEN ? AND ?
       ORDER BY id ASC`
    )).all(nearId - window, nearId + window) as Record<string, unknown>[];
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

  async putEmbedding(summaryId: number, vec: Float32Array): Promise<void> {
    const buf = Buffer.from(vec.buffer, vec.byteOffset, vec.byteLength);
    await (await this.db.prepare(
      'INSERT OR REPLACE INTO summary_embeddings (summary_id, dim, vec) VALUES (?, ?, ?)'
    )).run(summaryId, vec.length, buf);
  }

  async getEmbedding(summaryId: number): Promise<Float32Array | null> {
    const row = await (await this.db.prepare(
      'SELECT dim, vec FROM summary_embeddings WHERE summary_id = ?'
    )).get(summaryId) as { dim: number; vec: Buffer } | undefined;
    if (!row) return null;
    return new Float32Array(row.vec.buffer, row.vec.byteOffset, row.dim);
  }

  async allEmbeddings(): Promise<Array<{ summaryId: number; vec: Float32Array; ts: number }>> {
    const rows = await (await this.db.prepare(
      `SELECT e.summary_id AS sid, e.dim AS dim, e.vec AS vec, s.ts AS ts
       FROM summary_embeddings e JOIN summaries s ON s.id = e.summary_id`
    )).all() as Array<{ sid: number; dim: number; vec: Buffer; ts: number }>;
    return rows.map(r => ({
      summaryId: r.sid,
      vec: new Float32Array(r.vec.buffer, r.vec.byteOffset, r.dim),
      ts: r.ts,
    }));
  }

  async recordSupersedes(newerId: number, olderId: number, cosineSim: number, ts: number): Promise<void> {
    await (await this.db.prepare(
      'INSERT OR IGNORE INTO summary_supersedes (newer_id, older_id, cosine, ts) VALUES (?, ?, ?, ?)'
    )).run(newerId, olderId, cosineSim, ts);
  }

  async supersededIds(): Promise<Set<number>> {
    const rows = await (await this.db.prepare(
      'SELECT older_id FROM summary_supersedes'
    )).all() as Array<{ older_id: number }>;
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

  async getCachedSummary(cacheKey: string): Promise<{ text: string; tokensIn: number | null; tokensOut: number | null } | null> {
    const row = await (await this.db.prepare(
      'SELECT text, tokens_in, tokens_out FROM summary_cache WHERE cache_key = ?'
    )).get(cacheKey) as Record<string, unknown> | undefined;
    if (!row) return null;
    return {
      text: row['text'] as string,
      tokensIn: (row['tokens_in'] as number | null) ?? null,
      tokensOut: (row['tokens_out'] as number | null) ?? null,
    };
  }

  async putCachedSummary(
    cacheKey: string,
    text: string,
    tokensIn: number | null,
    tokensOut: number | null,
    ts: number
  ): Promise<void> {
    await (await this.db.prepare(
      'INSERT OR REPLACE INTO summary_cache (cache_key, text, tokens_in, tokens_out, created_at) VALUES (?, ?, ?, ?, ?)'
    )).run(cacheKey, text, tokensIn, tokensOut, ts);
  }
}