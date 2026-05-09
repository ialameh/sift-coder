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
  /** Optional TTL in ms. When set, the event is auto-pruned after `ts + ttlMs`. */
  ttlMs?: number;
}

export interface SearchHit {
  id: number;
  eventId: number;
  text: string;
  ts: number;
  score: number;
  /** Originating tool from the source event, used by per-tool decay during retrieval scoring. */
  tool?: string;
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
    const expiresAt = input.ttlMs && input.ttlMs > 0 ? input.ts + input.ttlMs : null;
    // INSERT OR IGNORE keeps the existing row when (session_id, input_hash) collides — the
    // UNIQUE index added in this branch enforces dedup at the DB layer, eliminating the
    // SELECT-then-INSERT TOCTOU race that bit concurrent backfill + capture.
    const result = await (await this.db.prepare(
      'INSERT OR IGNORE INTO events (ts, session_id, tool, input_hash, payload_json, tokens_est, expires_at) VALUES (?, ?, ?, ?, ?, ?, ?)'
    )).run(
      input.ts,
      input.sessionId,
      input.tool,
      inputHash,
      JSON.stringify(input.payload),
      input.tokensEst ?? 0,
      expiresAt,
    );
    const inserted = Number(result.lastInsertRowid);
    if (inserted > 0) return inserted;
    // Conflict: return the existing row's id so callers see a stable handle either way.
    const row = await (await this.db.prepare(
      'SELECT id FROM events WHERE session_id = ? AND input_hash = ?'
    )).get(input.sessionId, inputHash) as { id?: number } | undefined;
    return row?.id ?? 0;
  }

  /**
   * Async symbol annotation pipeline. Capture writes events with `symbols_json IS NULL`; a
   * background worker pops pending rows, runs the symbol extractor, and `setEventSymbols`
   * commits the result. The hot path stays off the extractor entirely, so a slow CDG /
   * tree-sitter call can't block tool capture.
   */
  async eventsNeedingSymbols(limit = 32): Promise<EventRow[]> {
    const rows = await (await this.db.prepare(
      `SELECT id, ts, session_id, tool, input_hash, payload_json, status, tokens_est
       FROM events
       WHERE symbols_json IS NULL
       ORDER BY id DESC
       LIMIT ?`
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

  async setEventSymbols(eventId: number, symbols: string[]): Promise<void> {
    await (await this.db.prepare(
      'UPDATE events SET symbols_json = ? WHERE id = ?'
    )).run(JSON.stringify(symbols), eventId);
  }

  async getEventSymbols(eventId: number): Promise<string[] | null> {
    const row = await (await this.db.prepare(
      'SELECT symbols_json FROM events WHERE id = ?'
    )).get(eventId) as { symbols_json?: string | null } | undefined;
    if (!row || row.symbols_json == null) return null;
    try {
      const parsed = JSON.parse(row.symbols_json) as unknown;
      return Array.isArray(parsed) ? parsed.map(String) : [];
    } catch {
      return [];
    }
  }

  /**
   * Compact the store: drop stale summary_cache rows, drop dim-mismatched embeddings (when
   * an embedder swap leaves orphans the consolidator can't compare), rebuild the FTS index,
   * and VACUUM to reclaim disk. Returns counts so the caller can render a compact report.
   *
   * Cheap to run weekly. Cannot delete summarized events or summaries — those are first-class
   * data; use `prune` for that.
   */
  async compact(opts: { cacheMaxAgeMs?: number; expectedDim?: number } = {}): Promise<{
    cachePruned: number;
    embeddingsDropped: number;
    ftsRebuilt: boolean;
    vacuumed: boolean;
    sizeBefore: number | null;
    sizeAfter: number | null;
  }> {
    const cacheMaxAgeMs = opts.cacheMaxAgeMs ?? 30 * 24 * 60 * 60 * 1000;
    const cutoff = Date.now() - cacheMaxAgeMs;
    let cachePruned = 0;
    {
      const before = await this.countAll('summary_cache');
      await (await this.db.prepare('DELETE FROM summary_cache WHERE created_at < ?')).run(cutoff);
      const after = await this.countAll('summary_cache');
      cachePruned = Math.max(0, before - after);
    }

    let embeddingsDropped = 0;
    if (opts.expectedDim && opts.expectedDim > 0) {
      const before = await this.countAll('summary_embeddings');
      await (await this.db.prepare(
        'DELETE FROM summary_embeddings WHERE dim != ?'
      )).run(opts.expectedDim);
      const after = await this.countAll('summary_embeddings');
      embeddingsDropped = Math.max(0, before - after);
    }

    let ftsRebuilt = false;
    try {
      // FTS5 docs: rebuild via INSERT INTO fts(fts) VALUES('rebuild').
      await this.db.exec(`INSERT INTO summaries_fts(summaries_fts) VALUES('rebuild')`);
      ftsRebuilt = true;
    } catch { /* fts table may not exist on legacy DBs */ }

    let vacuumed = false;
    let sizeBefore: number | null = null;
    let sizeAfter: number | null = null;
    try {
      const sizeRow = await (await this.db.prepare(
        'SELECT page_count * page_size AS bytes FROM pragma_page_count(), pragma_page_size()'
      )).get() as { bytes?: number } | undefined;
      sizeBefore = sizeRow?.bytes ?? null;
      await this.db.exec('VACUUM');
      const after = await (await this.db.prepare(
        'SELECT page_count * page_size AS bytes FROM pragma_page_count(), pragma_page_size()'
      )).get() as { bytes?: number } | undefined;
      sizeAfter = after?.bytes ?? null;
      vacuumed = true;
    } catch { /* VACUUM can fail mid-transaction; non-fatal */ }

    return { cachePruned, embeddingsDropped, ftsRebuilt, vacuumed, sizeBefore, sizeAfter };
  }

  /**
   * Recurring-pattern detection. Returns input_hash buckets that recur across `minRepeats`+
   * events, with the spread of sessions and tools they came from. A signal of habitual
   * behaviour worth pinning or learning.
   */
  async patterns(minRepeats = 3, limit = 50): Promise<Array<{
    inputHash: string;
    occurrences: number;
    distinctSessions: number;
    tools: string[];
    firstTs: number;
    lastTs: number;
    sampleEventId: number;
  }>> {
    const rows = await (await this.db.prepare(
      `SELECT input_hash AS h,
              count(*) AS c,
              count(DISTINCT session_id) AS sessions,
              GROUP_CONCAT(DISTINCT tool) AS tools,
              min(ts) AS first_ts,
              max(ts) AS last_ts,
              max(id) AS sample_id
         FROM events
        GROUP BY input_hash
       HAVING count(*) >= ?
        ORDER BY c DESC
        LIMIT ?`
    )).all(minRepeats, limit) as Array<{
      h: string; c: number; sessions: number; tools: string;
      first_ts: number; last_ts: number; sample_id: number;
    }>;
    return rows.map(r => ({
      inputHash: r.h,
      occurrences: r.c,
      distinctSessions: r.sessions,
      tools: r.tools ? r.tools.split(',') : [],
      firstTs: r.first_ts,
      lastTs: r.last_ts,
      sampleEventId: r.sample_id,
    }));
  }

  /**
   * Concat a session's summaries into a single digest text. Returns the joined body plus
   * counts. Doesn't call a model — pure database materialization. Caller can re-summarize via
   * the model client if a tighter digest is wanted.
   */
  async sessionDigest(sessionId: string, limit = 50): Promise<{
    sessionId: string;
    summaryCount: number;
    eventCount: number;
    text: string;
    firstTs: number | null;
    lastTs: number | null;
  }> {
    const rows = await (await this.db.prepare(
      `SELECT s.id AS sid, s.text AS text, s.ts AS ts, s.confidence AS conf, e.tool AS tool
         FROM events e
         LEFT JOIN summaries s ON s.event_id = e.id
        WHERE e.session_id = ? AND s.id IS NOT NULL
        ORDER BY e.id DESC
        LIMIT ?`
    )).all(sessionId, limit) as Array<{ sid: number; text: string; ts: number; conf: number | null; tool: string }>;
    const eventCount = await this.scalar<number>(
      'SELECT count(*) AS c FROM events WHERE session_id = ?',
      sessionId,
    );
    if (rows.length === 0) {
      return { sessionId, summaryCount: 0, eventCount, text: '', firstTs: null, lastTs: null };
    }
    // Newest first per ORDER BY id DESC; reverse for chronological narration.
    const ordered = rows.slice().reverse();
    const lines = ordered.map(r => {
      const conf = r.conf == null ? '' : ` (${(r.conf * 100).toFixed(0)}%)`;
      return `[${r.tool}]${conf} ${r.text}`;
    });
    return {
      sessionId,
      summaryCount: rows.length,
      eventCount,
      text: lines.join('\n'),
      firstTs: ordered[0]!.ts,
      lastTs: ordered[ordered.length - 1]!.ts,
    };
  }

  /**
   * Auto-pin every summary whose event_id is part of a recurring input_hash bucket. One-shot
   * curation that follows from `mem_patterns`: "lock in everything I do habitually."
   * Returns the count pinned. Already-pinned summaries are unchanged.
   */
  async autoPinPatterns(minRepeats = 3): Promise<{ pinned: number; patternsConsidered: number }> {
    const patterns = await this.patterns(minRepeats, 1000);
    if (patterns.length === 0) return { pinned: 0, patternsConsidered: 0 };
    const hashes = patterns.map(p => p.inputHash);
    const placeholders = hashes.map(() => '?').join(',');
    // One UPDATE: pin every summary whose event's input_hash is in the pattern set, where
    // pinned_at is currently NULL (don't reset existing pin timestamps).
    const before = await this.scalar<number>(
      'SELECT count(*) AS c FROM summaries WHERE pinned_at IS NOT NULL'
    );
    await (await this.db.prepare(
      `UPDATE summaries
          SET pinned_at = ?
        WHERE pinned_at IS NULL
          AND event_id IN (
            SELECT id FROM events WHERE input_hash IN (${placeholders})
          )`
    )).run(Date.now(), ...hashes);
    const after = await this.scalar<number>(
      'SELECT count(*) AS c FROM summaries WHERE pinned_at IS NOT NULL'
    );
    return { pinned: Math.max(0, after - before), patternsConsidered: patterns.length };
  }

  /**
   * Point-in-time view: counts + recent summaries as they existed at `ts` (epoch ms).
   * Filters every table on `ts <= cutoff` so the result reflects the store state at that
   * instant, ignoring any rows added later.
   */
  async asOf(ts: number, limit = 20): Promise<{
    ts: string;
    counts: { events: number; summaries: number };
    summaries: Array<{ id: number; ts: string; model: string; text: string; confidence: number | null }>;
  }> {
    const events = await this.scalar<number>(
      'SELECT count(*) AS c FROM events WHERE ts <= ?', ts,
    );
    const summaries = await this.scalar<number>(
      'SELECT count(*) AS c FROM summaries WHERE ts <= ?', ts,
    );
    const rows = await (await this.db.prepare(
      `SELECT id, ts, model, substr(text, 1, 240) AS text, confidence
         FROM summaries WHERE ts <= ?
        ORDER BY id DESC LIMIT ?`
    )).all(ts, limit) as Array<{ id: number; ts: number; model: string; text: string; confidence: number | null }>;
    return {
      ts: new Date(ts).toISOString(),
      counts: { events, summaries },
      summaries: rows.map(r => ({
        id: r.id, ts: new Date(r.ts).toISOString(),
        model: r.model, text: r.text, confidence: r.confidence,
      })),
    };
  }

  /**
   * Replay a session's chronology: events in `id` order with their summaries (if any) joined
   * in. Used by `mem_replay` to reconstruct prior conversation context for an agent or human.
   */
  async replaySession(sessionId: string, limit = 200): Promise<Array<{
    eventId: number; ts: number; tool: string; status: string;
    payloadJson: string; symbols: string[];
    summary: { id: number; text: string; confidence: number | null } | null;
  }>> {
    const rows = await (await this.db.prepare(
      `SELECT e.id AS event_id, e.ts AS ts, e.tool AS tool, e.status AS status,
              e.payload_json AS payload_json, e.symbols_json AS sj,
              s.id AS summary_id, s.text AS s_text, s.confidence AS s_conf
         FROM events e
         LEFT JOIN summaries s ON s.event_id = e.id
        WHERE e.session_id = ?
        ORDER BY e.id ASC
        LIMIT ?`
    )).all(sessionId, limit) as Array<{
      event_id: number; ts: number; tool: string; status: string;
      payload_json: string; sj: string | null;
      summary_id: number | null; s_text: string | null; s_conf: number | null;
    }>;
    return rows.map(r => {
      let symbols: string[] = [];
      if (r.sj) {
        try { const p = JSON.parse(r.sj) as unknown; if (Array.isArray(p)) symbols = p.map(String); } catch { /* skip */ }
      }
      return {
        eventId: r.event_id,
        ts: r.ts,
        tool: r.tool,
        status: r.status,
        payloadJson: r.payload_json,
        symbols,
        summary: r.summary_id ? { id: r.summary_id, text: r.s_text ?? '', confidence: r.s_conf } : null,
      };
    });
  }

  /**
   * Symbol-based retrieval. Matches events whose `symbols_json` contains the query. Two
   * patterns supported:
   *   - `"kind:name"` (e.g. `"function:login"`) — exact match against an entry in the array.
   *   - bare term (e.g. `"login"`) — substring match against any entry's name half.
   * Joins through to summaries so callers get the rendered fact, not just the raw event.
   */
  async symbolSearch(query: string, k = 10): Promise<Array<{ summaryId: number | null; eventId: number; ts: number; tool: string; symbols: string[]; text: string | null }>> {
    const trimmed = query.trim();
    if (!trimmed) return [];
    // Use LIKE for both forms — SQLite's JSON1 isn't guaranteed across builds. The pattern
    // matches the JSON-encoded entry inside the symbols_json array.
    const needle = trimmed.includes(':') ? `%"${trimmed}"%` : `%:${trimmed}%`;
    const rows = await (await this.db.prepare(
      `SELECT e.id AS event_id, e.ts AS ts, e.tool AS tool, e.symbols_json AS sj,
              s.id AS summary_id, s.text AS text
         FROM events e
         LEFT JOIN summaries s ON s.event_id = e.id
        WHERE e.symbols_json LIKE ?
        ORDER BY e.id DESC
        LIMIT ?`
    )).all(needle, k) as Array<{
      event_id: number; ts: number; tool: string; sj: string | null;
      summary_id: number | null; text: string | null;
    }>;
    return rows.map(r => {
      let symbols: string[] = [];
      if (r.sj) {
        try { const parsed = JSON.parse(r.sj) as unknown; if (Array.isArray(parsed)) symbols = parsed.map(String); } catch { /* skip */ }
      }
      return {
        summaryId: r.summary_id,
        eventId: r.event_id,
        ts: r.ts,
        tool: r.tool,
        symbols,
        text: r.text,
      };
    });
  }

  /**
   * Operational stats: throughput, backlog, cache hit rate, top sessions, top tools. Single
   * batched read; cheap enough to be polled by a status dashboard.
   */
  async stats(windowMs: number = 60 * 60 * 1000): Promise<{
    counts: StorageCounts;
    throughput: { eventsPerMin: number; summariesPerMin: number; windowMs: number };
    backlog: { pending: number; etaSec: number | null };
    cacheHitRate: number;
    topTools: Array<{ tool: string; count: number }>;
    topSessions: Array<{ sessionId: string; events: number }>;
  }> {
    const counts = await this.counts();
    const since = Date.now() - windowMs;
    const eventsInWindow = await this.scalar<number>(
      'SELECT count(*) AS c FROM events WHERE ts >= ?',
      since,
    );
    const summariesInWindow = await this.scalar<number>(
      'SELECT count(*) AS c FROM summaries WHERE ts >= ?',
      since,
    );
    const minutes = Math.max(1, windowMs / 60_000);
    const eventsPerMin = eventsInWindow / minutes;
    const summariesPerMin = summariesInWindow / minutes;
    const etaSec = summariesPerMin > 0 ? Math.round((counts.raw / summariesPerMin) * 60) : null;
    const totalSummaries = counts.summaries;
    const sharedHashes = await this.countSharedInputHashes();
    const cacheHitRate = totalSummaries === 0 ? 0 : Math.min(1, sharedHashes / totalSummaries);
    const tools = await this.perToolCounts();
    const topTools = Object.entries(tools)
      .map(([tool, count]) => ({ tool, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);
    const topSessionsRows = await (await this.db.prepare(
      'SELECT session_id AS sid, count(*) AS c FROM events GROUP BY session_id ORDER BY c DESC LIMIT 10'
    )).all() as Array<{ sid: string; c: number }>;
    const topSessions = topSessionsRows.map(r => ({ sessionId: r.sid, events: r.c }));
    return {
      counts,
      throughput: { eventsPerMin, summariesPerMin, windowMs },
      backlog: { pending: counts.raw, etaSec },
      cacheHitRate,
      topTools,
      topSessions,
    };
  }

  /**
   * Cross-session continuity: find every other event that shares this event's `input_hash`
   * but lives in a different session. Used by the `mem_thread` tool to surface "you've seen
   * this exact input before, here's what happened then."
   */
  async relatedSessionsByInputHash(eventId: number): Promise<Array<{ sessionId: string; eventId: number; ts: number; tool: string }>> {
    const ev = await (await this.db.prepare(
      'SELECT input_hash, session_id FROM events WHERE id = ?'
    )).get(eventId) as { input_hash?: string; session_id?: string } | undefined;
    if (!ev?.input_hash) return [];
    const rows = await (await this.db.prepare(
      `SELECT id, session_id, ts, tool FROM events
        WHERE input_hash = ? AND session_id != ?
        ORDER BY ts DESC`
    )).all(ev.input_hash, ev.session_id) as Array<{ id: number; session_id: string; ts: number; tool: string }>;
    return rows.map(r => ({ sessionId: r.session_id, eventId: r.id, ts: r.ts, tool: r.tool }));
  }

  /**
   * Resolve a session to its thread: the set of (sessionId, hits) where each hit is an event
   * in another session that captured an identical input_hash. Sorted by hit count desc.
   */
  async sessionThread(sessionId: string, limit = 20): Promise<Array<{ sessionId: string; sharedEvents: number; lastTs: number }>> {
    const rows = await (await this.db.prepare(
      `SELECT b.session_id AS sid, count(*) AS c, max(b.ts) AS last_ts
         FROM events a
         JOIN events b ON b.input_hash = a.input_hash AND b.session_id != a.session_id
        WHERE a.session_id = ?
        GROUP BY b.session_id
        ORDER BY c DESC, last_ts DESC
        LIMIT ?`
    )).all(sessionId, limit) as Array<{ sid: string; c: number; last_ts: number }>;
    return rows.map(r => ({ sessionId: r.sid, sharedEvents: r.c, lastTs: r.last_ts }));
  }

  /**
   * Delete events whose `expires_at` is in the past. Cascades to summaries / embeddings via
   * the existing `ON DELETE CASCADE` foreign keys. Returns the number of events removed.
   */
  async sweepExpired(now: number = Date.now()): Promise<number> {
    const before = await this.scalar<number>(
      'SELECT count(*) AS c FROM events WHERE expires_at IS NOT NULL AND expires_at <= ?',
      now,
    );
    if (before === 0) return 0;
    await (await this.db.prepare(
      'DELETE FROM events WHERE expires_at IS NOT NULL AND expires_at <= ?'
    )).run(now);
    return before;
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
              e.tool AS tool,
              bm25(summaries_fts) AS score
       FROM summaries_fts
         JOIN summaries s ON s.id = summaries_fts.rowid
         LEFT JOIN events e ON e.id = s.event_id
       WHERE summaries_fts MATCH ?
       ORDER BY score ASC LIMIT ?`
    )).all(safe, k) as Record<string, unknown>[];
    return rows.map(r => ({
      id: r['id'] as number,
      eventId: r['event_id'] as number,
      text: r['text'] as string,
      ts: r['ts'] as number,
      score: r['score'] as number,
      tool: (r['tool'] as string | null) ?? undefined,
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

  /**
   * Look up the originating tool name for a list of summary ids in one query. Used by
   * vec-side retrieval to apply per-tool decay without re-fetching events one-by-one.
   */
  async toolsForSummaries(ids: number[]): Promise<Map<number, string>> {
    if (ids.length === 0) return new Map();
    const placeholders = ids.map(() => '?').join(',');
    const rows = await (await this.db.prepare(
      `SELECT s.id AS sid, e.tool AS tool
       FROM summaries s LEFT JOIN events e ON e.id = s.event_id
       WHERE s.id IN (${placeholders})`
    )).all(...ids) as Array<{ sid: number; tool: string | null }>;
    const map = new Map<number, string>();
    for (const r of rows) if (r.tool) map.set(r.sid, r.tool);
    return map;
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
    // When sqlite-vec is loaded, mirror the vector into the vec0 virtual table so MATCH
    // queries can use the indexed similarity scan instead of a JS-side cosine over every row.
    // vec0 enforces BigInt rowid binding — passing a regular Number trips its primary-key
    // type check at runtime even though the value is integral.
    if (this.vecEnabled) {
      try {
        await (await this.db.prepare(
          'INSERT OR REPLACE INTO summaries_vec (rowid, embedding) VALUES (?, ?)'
        )).run(BigInt(summaryId), buf);
      } catch { /* vec table may not exist on legacy DBs that pre-date this branch */ }
    }
  }

  /**
   * Backfill the vec0 virtual table from `summary_embeddings`. Used at daemon boot when
   * sqlite-vec was newly loaded against an existing DB whose summaries pre-date the vec
   * integration. No-op when `vecEnabled` is false. Returns the number of vectors copied.
   */
  async backfillVec(): Promise<number> {
    if (!this.vecEnabled) return 0;
    const rows = await (await this.db.prepare(
      `SELECT e.summary_id AS sid, e.vec AS vec FROM summary_embeddings e
        WHERE NOT EXISTS (SELECT 1 FROM summaries_vec v WHERE v.rowid = e.summary_id)`
    )).all() as Array<{ sid: number; vec: Buffer }>;
    let copied = 0;
    for (const r of rows) {
      try {
        await (await this.db.prepare(
          'INSERT OR REPLACE INTO summaries_vec (rowid, embedding) VALUES (?, ?)'
        )).run(BigInt(r.sid), r.vec);
        copied++;
      } catch { /* dim mismatch — skip silently; consolidator will catch up */ }
    }
    return copied;
  }

  /**
   * Vec0-backed nearest-neighbor search. Returns up to `k` summary ids ranked by cosine
   * distance ascending (i.e. most similar first). `cosine` field is converted from the
   * distance metric so callers can compare against the JS-side path.
   *
   * Only callable when `vecEnabled` is true; the caller should fall back to JS cosine over
   * `allEmbeddings()` otherwise.
   */
  async searchVec(qv: Float32Array, k: number): Promise<Array<{ summaryId: number; distance: number; cosine: number }>> {
    if (!this.vecEnabled) return [];
    const buf = Buffer.from(qv.buffer, qv.byteOffset, qv.byteLength);
    const rows = await (await this.db.prepare(
      `SELECT rowid AS sid, distance FROM summaries_vec WHERE embedding MATCH ? AND k = ? ORDER BY distance`
    )).all(buf, k) as Array<{ sid: number; distance: number }>;
    return rows.map(r => ({
      summaryId: r.sid,
      distance: r.distance,
      // sqlite-vec default metric is L2 over normalized vectors; cosine = 1 - dist^2/2.
      cosine: 1 - (r.distance * r.distance) / 2,
    }));
  }

  async getEmbedding(summaryId: number): Promise<Float32Array | null> {
    const row = await (await this.db.prepare(
      'SELECT dim, vec FROM summary_embeddings WHERE summary_id = ?'
    )).get(summaryId) as { dim: number; vec: Buffer } | undefined;
    if (!row) return null;
    return new Float32Array(row.vec.buffer, row.vec.byteOffset, row.dim);
  }

  async allEmbeddings(): Promise<Array<{ summaryId: number; vec: Float32Array; ts: number; tool: string | null }>> {
    const rows = await (await this.db.prepare(
      `SELECT e.summary_id AS sid, e.dim AS dim, e.vec AS vec, s.ts AS ts, ev.tool AS tool
       FROM summary_embeddings e
         JOIN summaries s ON s.id = e.summary_id
         LEFT JOIN events ev ON ev.id = s.event_id`
    )).all() as Array<{ sid: number; dim: number; vec: Buffer; ts: number; tool: string | null }>;
    return rows.map(r => ({
      summaryId: r.sid,
      vec: new Float32Array(r.vec.buffer, r.vec.byteOffset, r.dim),
      ts: r.ts,
      tool: r.tool,
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

  // ─── Pinning (curated long-term memory) ──────────────────────────────────────────────

  async pin(summaryId: number, ts: number = Date.now()): Promise<boolean> {
    await (await this.db.prepare(
      'UPDATE summaries SET pinned_at = ? WHERE id = ?'
    )).run(ts, summaryId);
    const row = await (await this.db.prepare(
      'SELECT pinned_at FROM summaries WHERE id = ?'
    )).get(summaryId) as { pinned_at?: number | null } | undefined;
    return !!row?.pinned_at;
  }

  async unpin(summaryId: number): Promise<boolean> {
    await (await this.db.prepare(
      'UPDATE summaries SET pinned_at = NULL WHERE id = ?'
    )).run(summaryId);
    return true;
  }

  async listPinned(limit = 100): Promise<SummaryRow[]> {
    const rows = await (await this.db.prepare(
      `SELECT id, event_id, ts, model, prompt_hash, text, tokens_in, tokens_out, confidence
       FROM summaries
       WHERE pinned_at IS NOT NULL
       ORDER BY pinned_at DESC
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

  async pinnedIds(): Promise<Set<number>> {
    const rows = await (await this.db.prepare(
      'SELECT id FROM summaries WHERE pinned_at IS NOT NULL'
    )).all() as Array<{ id: number }>;
    return new Set(rows.map(r => r.id));
  }

  // ─── Health check (mem doctor) ───────────────────────────────────────────────────────

  /**
   * Assemble a structured health report covering schema integrity, orphaned rows, vec0
   * cardinality drift, and counts. The CLI / MCP server renders this into a checklist;
   * the structured shape stays stable for programmatic consumers.
   */
  async doctor(): Promise<{
    integrity: 'ok' | string;
    orphanSummaries: number;
    orphanEmbeddings: number;
    orphanProvenance: number;
    vecCardinality: { embeddings: number; vec: number; drift: number };
    counts: StorageCounts;
    pinned: number;
  }> {
    let integrity: 'ok' | string = 'ok';
    try {
      const row = await (await this.db.prepare('PRAGMA integrity_check')).get() as { integrity_check?: string } | undefined;
      const v = row?.integrity_check ?? 'ok';
      integrity = v === 'ok' ? 'ok' : v;
    } catch (e) {
      integrity = (e as Error).message;
    }

    const orphanSummaries = await this.scalar<number>(
      'SELECT count(*) AS c FROM summaries s WHERE NOT EXISTS (SELECT 1 FROM events e WHERE e.id = s.event_id)'
    );
    const orphanEmbeddings = await this.scalar<number>(
      'SELECT count(*) AS c FROM summary_embeddings se WHERE NOT EXISTS (SELECT 1 FROM summaries s WHERE s.id = se.summary_id)'
    );
    const orphanProvenance = await this.scalar<number>(
      `SELECT count(*) AS c FROM provenance_edges p
        WHERE (p.from_kind = 'summary' AND NOT EXISTS (SELECT 1 FROM summaries s WHERE s.id = CAST(p.from_id AS INTEGER)))
           OR (p.to_kind   = 'summary' AND NOT EXISTS (SELECT 1 FROM summaries s WHERE s.id = CAST(p.to_id   AS INTEGER)))`
    );
    const embeddingsCount = await this.countAll('summary_embeddings');
    let vecCount = 0;
    if (this.vecEnabled) {
      try {
        vecCount = await this.scalar<number>('SELECT count(*) AS c FROM summaries_vec');
      } catch { /* table missing */ }
    }
    const drift = embeddingsCount - vecCount;
    const counts = await this.counts();
    const pinned = await this.scalar<number>(
      'SELECT count(*) AS c FROM summaries WHERE pinned_at IS NOT NULL'
    );
    return {
      integrity,
      orphanSummaries,
      orphanEmbeddings,
      orphanProvenance,
      vecCardinality: { embeddings: embeddingsCount, vec: vecCount, drift },
      counts,
      pinned,
    };
  }

  /** Internal helper: run a `SELECT count(*) AS c …` style query and return the count. */
  private async scalar<T extends number>(sql: string, ...params: unknown[]): Promise<T> {
    const row = await (await this.db.prepare(sql)).get(...params) as { c?: number } | undefined;
    return (row?.c ?? 0) as T;
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

  /**
   * Drop skipped events older than `maxAgeMs`. Returns the number of rows removed. Cascades to
   * any summaries / embeddings that referenced those events via FOREIGN KEY ON DELETE CASCADE.
   * Optionally also drops summaries that were marked superseded by the consolidator.
   */
  async prune(opts: { maxAgeMs?: number; superseded?: boolean } = {}): Promise<{ removedEvents: number; removedSummaries: number }> {
    const cutoff = Date.now() - (opts.maxAgeMs ?? 7 * 24 * 60 * 60 * 1000);
    const beforeEv = await this.countByStatus('skipped');
    await (await this.db.prepare(
      "DELETE FROM events WHERE status = 'skipped' AND ts < ?"
    )).run(cutoff);
    const afterEv = await this.countByStatus('skipped');
    const removedEvents = Math.max(0, beforeEv - afterEv);

    let removedSummaries = 0;
    if (opts.superseded) {
      const beforeSum = await this.countAll('summaries');
      await (await this.db.prepare(
        'DELETE FROM summaries WHERE id IN (SELECT older_id FROM summary_supersedes)'
      )).run();
      const afterSum = await this.countAll('summaries');
      removedSummaries = Math.max(0, beforeSum - afterSum);
    }
    return { removedEvents, removedSummaries };
  }

  /**
   * Re-queue skipped events as `raw` so a healthier backend can take another pass. Resets
   * the `attempts` counter. Returns the number of rows re-queued.
   */
  async retrySkipped(limit?: number): Promise<number> {
    const before = await this.countByStatus('skipped');
    if (limit !== undefined) {
      await (await this.db.prepare(
        "UPDATE events SET status = 'raw', attempts = 0, last_error = NULL WHERE id IN (SELECT id FROM events WHERE status = 'skipped' ORDER BY id ASC LIMIT ?)"
      )).run(limit);
    } else {
      await (await this.db.prepare(
        "UPDATE events SET status = 'raw', attempts = 0, last_error = NULL WHERE status = 'skipped'"
      )).run();
    }
    const after = await this.countByStatus('skipped');
    return Math.max(0, before - after);
  }

  /**
   * Claim a single specific event for summarization. Used by the MCP-side drain loop where
   * the MCP server iterates events one at a time around `sampling/createMessage`. Returns
   * `null` if the event was already processed by another claimer.
   */
  async claimEvent(id: number): Promise<EventRow | null> {
    return this.withWriteLock(async () => {
      await this.db.exec('BEGIN IMMEDIATE');
      try {
        const row = await (await this.db.prepare(
          "SELECT id, ts, session_id, tool, input_hash, payload_json, status, tokens_est FROM events WHERE id = ? AND status = 'raw'"
        )).get(id) as Record<string, unknown> | undefined;
        if (!row) {
          await this.db.exec('COMMIT');
          return null;
        }
        await (await this.db.prepare("UPDATE events SET status = 'claimed' WHERE id = ?")).run(id);
        await this.db.exec('COMMIT');
        return {
          id: row['id'] as number,
          ts: row['ts'] as number,
          sessionId: row['session_id'] as string,
          tool: row['tool'] as string,
          inputHash: row['input_hash'] as string,
          payloadJson: row['payload_json'] as string,
          status: 'claimed',
          tokensEst: (row['tokens_est'] as number | undefined) ?? 0,
        };
      } catch (e) {
        try { await this.db.exec('ROLLBACK'); } catch { /* ignore */ }
        throw e;
      }
    });
  }

  // ─── Typed read APIs (replace the legacy `(storage as unknown as {db}).db` hacks) ───────

  async recentEvents(limit: number): Promise<EventRow[]> {
    const rows = await (await this.db.prepare(
      `SELECT id, ts, session_id, tool, input_hash, payload_json, status, tokens_est
       FROM events ORDER BY id DESC LIMIT ?`
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

  async eventTail(limit: number): Promise<Array<{ id: number; ts: number; tool: string; status: string; sessionId: string }>> {
    const rows = await (await this.db.prepare(
      'SELECT id, ts, tool, status, session_id FROM events ORDER BY id DESC LIMIT ?'
    )).all(limit) as Array<{ id: number; ts: number; tool: string; status: string; session_id: string }>;
    return rows.map(r => ({ id: r.id, ts: r.ts, tool: r.tool, status: r.status, sessionId: r.session_id }));
  }

  async summaryTail(limit: number): Promise<Array<{ id: number; ts: number; model: string; text: string; confidence: number | null }>> {
    return await (await this.db.prepare(
      'SELECT id, ts, model, substr(text, 1, 240) AS text, confidence FROM summaries ORDER BY id DESC LIMIT ?'
    )).all(limit) as Array<{ id: number; ts: number; model: string; text: string; confidence: number | null }>;
  }

  async countByStatus(status: string): Promise<number> {
    const row = await (await this.db.prepare(
      'SELECT count(*) AS c FROM events WHERE status = ?'
    )).get(status) as { c?: number } | undefined;
    return row?.c ?? 0;
  }

  async sumNumber(sql: string): Promise<number> {
    const row = await (await this.db.prepare(sql)).get() as { n?: number | null } | undefined;
    return row?.n ?? 0;
  }

  async countAll(table: 'events' | 'summaries' | 'summary_cache' | 'summary_embeddings'): Promise<number> {
    const row = await (await this.db.prepare(`SELECT count(*) AS c FROM ${table}`)).get() as { c?: number } | undefined;
    return row?.c ?? 0;
  }

  async perToolCounts(): Promise<Record<string, number>> {
    const rows = await (await this.db.prepare(
      'SELECT tool, count(*) AS c FROM events GROUP BY tool ORDER BY c DESC'
    )).all() as Array<{ tool: string; c: number }>;
    const out: Record<string, number> = {};
    for (const r of rows) out[r.tool] = r.c;
    return out;
  }

  async countRedacted(): Promise<number> {
    const row = await (await this.db.prepare(
      "SELECT count(*) AS c FROM events WHERE payload_json LIKE '%REDACTED:%'"
    )).get() as { c?: number } | undefined;
    return row?.c ?? 0;
  }

  async countSharedInputHashes(): Promise<number> {
    const row = await (await this.db.prepare(
      `SELECT COUNT(*) AS c FROM (
         SELECT e.input_hash FROM events e
         JOIN summaries s ON s.event_id = e.id
         GROUP BY e.input_hash
         HAVING COUNT(*) > 1
       )`
    )).get() as { c?: number } | undefined;
    return row?.c ?? 0;
  }

  async countSupersededDistinct(): Promise<number> {
    const row = await (await this.db.prepare(
      'SELECT count(DISTINCT older_id) AS c FROM summary_supersedes'
    )).get() as { c?: number } | undefined;
    return row?.c ?? 0;
  }

  async sumSummaryTextChars(): Promise<number> {
    const row = await (await this.db.prepare(
      'SELECT sum(length(text) / 4) AS n FROM summaries'
    )).get() as { n?: number | null } | undefined;
    return row?.n ?? 0;
  }

  // ─── Export / import (ndjson snapshot) ────────────────────────────────────────────────

  /**
   * Yield ndjson-shaped records for every persistent table. Each record is `{ table, row }`.
   * Order is fixed (events → summaries → embeddings → supersedes → provenance_edges →
   * cache → sessions) so an importer can stream-load and trust referential integrity.
   *
   * Embeddings are emitted with `vec` as a base64 string for portability across machines.
   */
  async *exportRows(): AsyncIterable<{ table: string; row: Record<string, unknown> }> {
    const tables: Array<{ name: string; sql: string }> = [
      { name: 'sessions', sql: 'SELECT id, started_at, ended_at, cwd, meta_json FROM sessions' },
      { name: 'events', sql: 'SELECT id, ts, session_id, tool, input_hash, payload_json, status, tokens_est, expires_at, attempts, last_error FROM events' },
      { name: 'summaries', sql: 'SELECT id, event_id, ts, model, prompt_hash, text, tokens_in, tokens_out, confidence, pinned_at FROM summaries' },
      { name: 'summary_embeddings', sql: 'SELECT summary_id, dim, vec FROM summary_embeddings' },
      { name: 'summary_supersedes', sql: 'SELECT newer_id, older_id, cosine, ts FROM summary_supersedes' },
      { name: 'provenance_edges', sql: 'SELECT id, ts, from_kind, from_id, to_kind, to_id, edge_type, confidence, source, meta_json FROM provenance_edges' },
      { name: 'summary_cache', sql: 'SELECT cache_key, text, tokens_in, tokens_out, created_at FROM summary_cache' },
    ];
    for (const t of tables) {
      const rows = await (await this.db.prepare(t.sql)).all() as Array<Record<string, unknown>>;
      for (const r of rows) {
        if (r['vec'] instanceof Buffer) {
          r['vec'] = (r['vec'] as Buffer).toString('base64');
        }
        yield { table: t.name, row: r };
      }
    }
  }

  /**
   * Insert a row produced by `exportRows`. Uses `INSERT OR IGNORE` everywhere so re-importing
   * an overlapping snapshot is safe. Returns `'inserted'` when a new row landed, `'skipped'`
   * when the row already existed and the unique-key conflict ignored the insert.
   *
   * Detection of insert-vs-skip is via a count delta on the target table because better-sqlite3
   * preserves `lastInsertRowid` from a prior successful insert when a subsequent INSERT OR
   * IGNORE is ignored — making `lastInsertRowid > 0` an unreliable signal.
   */
  async importRow(table: string, row: Record<string, unknown>): Promise<'inserted' | 'skipped'> {
    let sql: string;
    let params: unknown[];
    let countTable: string = table;
    switch (table) {
      case 'sessions':
        sql = 'INSERT OR IGNORE INTO sessions (id, started_at, ended_at, cwd, meta_json) VALUES (?, ?, ?, ?, ?)';
        params = [row['id'], row['started_at'], row['ended_at'] ?? null, row['cwd'] ?? null, row['meta_json'] ?? null];
        break;
      case 'events':
        sql = 'INSERT OR IGNORE INTO events (id, ts, session_id, tool, input_hash, payload_json, status, tokens_est, expires_at, attempts, last_error) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)';
        params = [row['id'], row['ts'], row['session_id'], row['tool'], row['input_hash'], row['payload_json'], row['status'] ?? 'raw', row['tokens_est'] ?? 0, row['expires_at'] ?? null, row['attempts'] ?? 0, row['last_error'] ?? null];
        break;
      case 'summaries':
        sql = 'INSERT OR IGNORE INTO summaries (id, event_id, ts, model, prompt_hash, text, tokens_in, tokens_out, confidence, pinned_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)';
        params = [row['id'], row['event_id'], row['ts'], row['model'], row['prompt_hash'], row['text'], row['tokens_in'] ?? null, row['tokens_out'] ?? null, row['confidence'] ?? null, row['pinned_at'] ?? null];
        break;
      case 'summary_embeddings': {
        const vecB64 = typeof row['vec'] === 'string' ? row['vec'] : '';
        sql = 'INSERT OR IGNORE INTO summary_embeddings (summary_id, dim, vec) VALUES (?, ?, ?)';
        params = [row['summary_id'], row['dim'], Buffer.from(vecB64, 'base64')];
        break;
      }
      case 'summary_supersedes':
        sql = 'INSERT OR IGNORE INTO summary_supersedes (newer_id, older_id, cosine, ts) VALUES (?, ?, ?, ?)';
        params = [row['newer_id'], row['older_id'], row['cosine'], row['ts']];
        break;
      case 'provenance_edges':
        sql = 'INSERT OR IGNORE INTO provenance_edges (id, ts, from_kind, from_id, to_kind, to_id, edge_type, confidence, source, meta_json) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)';
        params = [row['id'], row['ts'], row['from_kind'], row['from_id'], row['to_kind'], row['to_id'], row['edge_type'], row['confidence'], row['source'], row['meta_json'] ?? null];
        break;
      case 'summary_cache':
        sql = 'INSERT OR IGNORE INTO summary_cache (cache_key, text, tokens_in, tokens_out, created_at) VALUES (?, ?, ?, ?, ?)';
        params = [row['cache_key'], row['text'], row['tokens_in'] ?? null, row['tokens_out'] ?? null, row['created_at']];
        break;
      default:
        return 'skipped';
    }
    const before = await this.scalar<number>(`SELECT count(*) AS c FROM ${countTable}`);
    await (await this.db.prepare(sql)).run(...params);
    const after = await this.scalar<number>(`SELECT count(*) AS c FROM ${countTable}`);
    return after > before ? 'inserted' : 'skipped';
  }

  // ─── Provenance graph (typed wrappers around provenance_edges) ─────────────────────────

  async addProvenanceEdge(input: {
    ts: number; fromKind: string; fromId: string; toKind: string; toId: string;
    edgeType: string; confidence: number; source: string; metaJson: string | null;
  }): Promise<number> {
    const result = await (await this.db.prepare(
      `INSERT INTO provenance_edges (ts, from_kind, from_id, to_kind, to_id, edge_type, confidence, source, meta_json)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`
    )).run(input.ts, input.fromKind, input.fromId, input.toKind, input.toId, input.edgeType, input.confidence, input.source, input.metaJson);
    return Number(result.lastInsertRowid);
  }

  async outgoingProvenance(fromKind: string, fromId: string, edgeType?: string): Promise<Array<Record<string, unknown>>> {
    if (edgeType) {
      return await (await this.db.prepare(
        `SELECT * FROM provenance_edges WHERE from_kind = ? AND from_id = ? AND edge_type = ? ORDER BY ts DESC`
      )).all(fromKind, fromId, edgeType) as Array<Record<string, unknown>>;
    }
    return await (await this.db.prepare(
      `SELECT * FROM provenance_edges WHERE from_kind = ? AND from_id = ? ORDER BY ts DESC`
    )).all(fromKind, fromId) as Array<Record<string, unknown>>;
  }

  async incomingProvenance(toKind: string, toId: string, edgeType?: string): Promise<Array<Record<string, unknown>>> {
    if (edgeType) {
      return await (await this.db.prepare(
        `SELECT * FROM provenance_edges WHERE to_kind = ? AND to_id = ? AND edge_type = ? ORDER BY ts DESC`
      )).all(toKind, toId, edgeType) as Array<Record<string, unknown>>;
    }
    return await (await this.db.prepare(
      `SELECT * FROM provenance_edges WHERE to_kind = ? AND to_id = ? ORDER BY ts DESC`
    )).all(toKind, toId) as Array<Record<string, unknown>>;
  }
}