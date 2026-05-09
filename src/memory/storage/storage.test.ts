import { describe, it, expect, beforeEach } from 'vitest';
import { Storage, hashInput, type DBHandle } from './storage.js';

interface PreparedStub {
  run: (...p: unknown[]) => Promise<{ lastInsertRowid: number }>;
  get: (...p: unknown[]) => Promise<unknown>;
  all: (...p: unknown[]) => Promise<unknown[]>;
}

class FakeDB implements DBHandle {
  public events: Array<Record<string, unknown>> = [];
  public summaries: Array<Record<string, unknown>> = [];
  public sessions: Array<Record<string, unknown>> = [];
  public cache = new Map<string, Record<string, unknown>>();
  public ftsRows: Array<{ id: number; text: string }> = [];
  public embeddings = new Map<number, { dim: number; vec: Buffer; ts: number }>();
  public supersedes: Array<{ newer_id: number; older_id: number; cosine: number; ts: number }> = [];
  public extensionLoaded = false;
  public ddlExec: string[] = [];
  public failExtension = false;
  private nextEventId = 1;
  private nextSummaryId = 1;

  exec(sql: string): Promise<unknown> {
    this.ddlExec.push(sql);
    // Sync exec for FakeDB - runs immediately and returns resolved Promise
    // This allows Storage.constructor (sync) to call it without await
    return Promise.resolve();
  }

  loadExtension(_p: string): void {
    if (this.failExtension) throw new Error('no extension');
    this.extensionLoaded = true;
  }

  prepare(sql: string): Promise<PreparedStub> {
    const stmt = sql.trim();
    if (stmt.startsWith('INSERT OR IGNORE INTO sessions')) {
      return Promise.resolve({
        run: (id, started, cwd) => {
          if (!this.sessions.find(s => s['id'] === id)) {
            this.sessions.push({ id, started_at: started, cwd });
          }
          return Promise.resolve({ lastInsertRowid: 0 });
        },
        get: () => Promise.resolve(undefined),
        all: () => Promise.resolve([]),
      });
    }
    if (stmt.startsWith('INSERT INTO events') || stmt.startsWith('INSERT OR IGNORE INTO events')) {
      return Promise.resolve({
        run: (ts, sid, tool, hash, payload) => {
          const id = this.nextEventId++;
          this.events.push({ id, ts, session_id: sid, tool, input_hash: hash, payload_json: payload, status: 'raw' });
          return Promise.resolve({ lastInsertRowid: id });
        },
        get: () => Promise.resolve(undefined),
        all: () => Promise.resolve([]),
      });
    }
    if (stmt.startsWith('SELECT id, ts, session_id, tool, input_hash, payload_json, status, tokens_est FROM events WHERE id')) {
      return Promise.resolve({
        run: () => Promise.resolve({ lastInsertRowid: 0 }),
        get: id => Promise.resolve(this.events.find(e => e['id'] === id)),
        all: () => Promise.resolve([]),
      });
    }
    if (stmt.startsWith('UPDATE events SET status')) {
      return Promise.resolve({
        run: (status, id) => {
          const e = this.events.find(x => x['id'] === id);
          if (e) e['status'] = status;
          return Promise.resolve({ lastInsertRowid: 0 });
        },
        get: () => Promise.resolve(undefined),
        all: () => Promise.resolve([]),
      });
    }
    if (stmt.includes("WHERE status = 'raw'")) {
      return Promise.resolve({
        run: () => Promise.resolve({ lastInsertRowid: 0 }),
        get: () => Promise.resolve(undefined),
        all: (limit: unknown) => Promise.resolve(this.events.filter(e => e['status'] === 'raw').slice(0, limit as number)),
      });
    }
    if (stmt.startsWith('INSERT INTO summaries')) {
      return Promise.resolve({
        run: (eventId, ts, model, ph, text, ti, to, conf) => {
          const id = this.nextSummaryId++;
          this.summaries.push({ id, event_id: eventId, ts, model, prompt_hash: ph, text, tokens_in: ti, tokens_out: to, confidence: conf });
          this.ftsRows.push({ id, text: text as string });
          return Promise.resolve({ lastInsertRowid: id });
        },
        get: () => Promise.resolve(undefined),
        all: () => Promise.resolve([]),
      });
    }
    if (stmt.includes('FROM summaries WHERE id IN')) {
      return Promise.resolve({
        run: () => Promise.resolve({ lastInsertRowid: 0 }),
        get: () => Promise.resolve(undefined),
        all: (...ids) => Promise.resolve(this.summaries.filter(s => (ids as number[]).includes(s['id'] as number))),
      });
    }
    if (stmt.includes('summaries_fts MATCH')) {
      return Promise.resolve({
        run: () => Promise.resolve({ lastInsertRowid: 0 }),
        get: () => Promise.resolve(undefined),
        all: (q: unknown, k: unknown) => Promise.resolve(
          this.ftsRows
            .filter(r => r.text.toLowerCase().includes(String(q).toLowerCase()))
            .slice(0, k as number)
            .map(r => {
              const s = this.summaries.find(x => x['id'] === r.id)!;
              return { id: r.id, event_id: s['event_id'], text: r.text, ts: s['ts'], score: -1 };
            })
        ),
      });
    }
    if (stmt.includes('FROM summaries') && stmt.includes('WHERE id BETWEEN')) {
      return Promise.resolve({
        run: () => Promise.resolve({ lastInsertRowid: 0 }),
        get: () => Promise.resolve(undefined),
        all: (lo: unknown, hi: unknown) => Promise.resolve(
          this.summaries.filter(s => (s['id'] as number) >= (lo as number) && (s['id'] as number) <= (hi as number))
        ),
      });
    }
    if (stmt.startsWith('INSERT OR REPLACE INTO summary_embeddings')) {
      return Promise.resolve({
        run: (sid: unknown, dim: unknown, vec: unknown) => {
          const summary = this.summaries.find(s => s['id'] === sid);
          this.embeddings.set(sid as number, {
            dim: dim as number,
            vec: vec as Buffer,
            ts: (summary?.['ts'] as number | undefined) ?? 0,
          });
          return Promise.resolve({ lastInsertRowid: 0 });
        },
        get: () => Promise.resolve(undefined),
        all: () => Promise.resolve([]),
      });
    }
    if (stmt.startsWith('SELECT dim, vec FROM summary_embeddings')) {
      return Promise.resolve({
        run: () => Promise.resolve({ lastInsertRowid: 0 }),
        get: (sid: unknown) => Promise.resolve(this.embeddings.get(sid as number)),
        all: () => Promise.resolve([]),
      });
    }
    if (stmt.includes('FROM summary_embeddings e')) {
      return Promise.resolve({
        run: () => Promise.resolve({ lastInsertRowid: 0 }),
        get: () => Promise.resolve(undefined),
        all: () => Promise.resolve(Array.from(this.embeddings.entries()).map(([sid, e]) => {
          const sum = this.summaries.find(s => s['id'] === sid);
          return { sid, dim: e.dim, vec: e.vec, ts: (sum?.['ts'] as number | undefined) ?? e.ts, tool: null };
        })),
      });
    }
    if (stmt.startsWith('INSERT OR IGNORE INTO summary_supersedes')) {
      return Promise.resolve({
        run: (newer: unknown, older: unknown, c: unknown, ts: unknown) => {
          if (!this.supersedes.find(x => x.newer_id === newer && x.older_id === older)) {
            this.supersedes.push({ newer_id: newer as number, older_id: older as number, cosine: c as number, ts: ts as number });
          }
          return Promise.resolve({ lastInsertRowid: 0 });
        },
        get: () => Promise.resolve(undefined),
        all: () => Promise.resolve([]),
      });
    }
    if (stmt.startsWith('SELECT older_id FROM summary_supersedes')) {
      return Promise.resolve({
        run: () => Promise.resolve({ lastInsertRowid: 0 }),
        get: () => Promise.resolve(undefined),
        all: () => Promise.resolve(this.supersedes.map(s => ({ older_id: s.older_id }))),
      });
    }
    if (stmt.startsWith('SELECT text, tokens_in, tokens_out FROM summary_cache')) {
      return Promise.resolve({
        run: () => Promise.resolve({ lastInsertRowid: 0 }),
        get: (key: unknown) => Promise.resolve(this.cache.get(key as string)),
        all: () => Promise.resolve([]),
      });
    }
    if (stmt.startsWith('INSERT OR REPLACE INTO summary_cache')) {
      return Promise.resolve({
        run: (key, text, ti, to, _ts) => {
          this.cache.set(key as string, { text, tokens_in: ti, tokens_out: to });
          return Promise.resolve({ lastInsertRowid: 0 });
        },
        get: () => Promise.resolve(undefined),
        all: () => Promise.resolve([]),
      });
    }
    throw new Error(`unhandled SQL: ${stmt.slice(0, 80)}`);
  }

  close(): Promise<void> {
    return Promise.resolve();
  }
}

let db: FakeDB;
let storage: Storage;
beforeEach(async () => {
  db = new FakeDB();
  storage = await Storage.init(db);
});

describe('Storage construction', () => {
  it('runs core DDL on construction', () => {
    expect(db.ddlExec.length).toBeGreaterThan(0);
    expect(storage.vecEnabled).toBe(false);
  });

  it('loads vec extension when path provided and load succeeds', async () => {
    const fresh = new FakeDB();
    const s = await Storage.init(fresh, { vecExtensionPath: '/some/path.so' });
    expect(s.vecEnabled).toBe(true);
    expect(fresh.extensionLoaded).toBe(true);
  });

  it('disables vec when load throws', async () => {
    const fresh = new FakeDB();
    fresh.failExtension = true;
    const s = await Storage.init(fresh, { vecExtensionPath: '/missing.so' });
    expect(s.vecEnabled).toBe(false);
  });
});

describe('hashInput', () => {
  it('returns the same hex hash for equal payloads', () => {
    expect(hashInput({ a: 1 })).toBe(hashInput({ a: 1 }));
  });
  it('returns a different hash for different payloads', () => {
    expect(hashInput({ a: 1 })).not.toBe(hashInput({ a: 2 }));
  });
});

describe('events + sessions', () => {
  it('records sessions idempotently', async () => {
    await storage.ensureSession('s1', '/cwd', 1);
    await storage.ensureSession('s1', '/cwd', 2);
    expect(db.sessions.length).toBe(1);
  });

  it('records events and reads them back', async () => {
    const id = await storage.recordEvent({ ts: 10, sessionId: 's1', tool: 'Read', payload: { path: '/x' } });
    const ev = await storage.getEvent(id);
    expect(ev!.id).toBe(id);
    expect(ev!.tool).toBe('Read');
    expect(ev!.status).toBe('raw');
  });

  it('returns null when getEvent finds no row', async () => {
    expect(await storage.getEvent(999)).toBeNull();
  });

  it('marks event status', async () => {
    const id = await storage.recordEvent({ ts: 1, sessionId: 's', tool: 'Bash', payload: {} });
    await storage.markEventStatus(id, 'summarized');
    expect((await storage.getEvent(id)!).status).toBe('summarized');
  });

  it('returns pending events filtered by status', async () => {
    const a = await storage.recordEvent({ ts: 1, sessionId: 's', tool: 'Bash', payload: {} });
    await storage.recordEvent({ ts: 2, sessionId: 's', tool: 'Bash', payload: {} });
    await storage.markEventStatus(a, 'summarized');
    const pending = await storage.pendingEvents();
    expect(pending.map(p => p.status)).toEqual(['raw']);
  });
});

describe('summaries', () => {
  it('records summaries and fetches them by id', async () => {
    const eid = await storage.recordEvent({ ts: 1, sessionId: 's', tool: 'Read', payload: {} });
    const sid = await storage.recordSummary({
      eventId: eid, ts: 2, model: 'claude-haiku-4-5', promptHash: 'p',
      text: 'hello world', tokensIn: 10, tokensOut: 5, confidence: 0.7,
    });
    const got = await storage.getSummariesByIds([sid]);
    expect(got).toHaveLength(1);
    expect(got[0]!.text).toBe('hello world');
  });

  it('returns empty array when getSummariesByIds called with no ids', async () => {
    expect(await storage.getSummariesByIds([])).toEqual([]);
  });

  it('searchFts returns matching summaries by lexical query', async () => {
    const eid = await storage.recordEvent({ ts: 1, sessionId: 's', tool: 'R', payload: {} });
    await storage.recordSummary({ eventId: eid, ts: 2, model: 'm', promptHash: 'p', text: 'auth migration', tokensIn: null, tokensOut: null, confidence: null });
    await storage.recordSummary({ eventId: eid, ts: 3, model: 'm', promptHash: 'p', text: 'unrelated', tokensIn: null, tokensOut: null, confidence: null });
    const hits = await storage.searchFts('auth');
    expect(hits.length).toBe(1);
    expect(hits[0]!.text).toBe('auth migration');
  });

  it('searchFts handles FTS5-special characters without raising syntax errors', async () => {
    const eid = await storage.recordEvent({ ts: 1, sessionId: 's', tool: 'R', payload: {} });
    await storage.recordSummary({ eventId: eid, ts: 2, model: 'm', promptHash: 'p', text: 'auth token migration', tokensIn: null, tokensOut: null, confidence: null });
    expect(() => storage.searchFts('auth-token (NEAR) migration:*')).not.toThrow();
    const hits = await storage.searchFts('auth-token migration');
    expect(hits.length).toBe(1);
  });

  it('searchFts returns [] when query has no matchable tokens', async () => {
    const eid = await storage.recordEvent({ ts: 1, sessionId: 's', tool: 'R', payload: {} });
    await storage.recordSummary({ eventId: eid, ts: 2, model: 'm', promptHash: 'p', text: 'irrelevant', tokensIn: null, tokensOut: null, confidence: null });
    expect(await storage.searchFts('---')).toEqual([]);
    expect(await storage.searchFts('  ')).toEqual([]);
    expect(await storage.searchFts('')).toEqual([]);
  });

  it('timeline returns rows in a window around an id', async () => {
    const eid = await storage.recordEvent({ ts: 1, sessionId: 's', tool: 'R', payload: {} });
    for (let i = 0; i < 3; i++) {
      await storage.recordSummary({ eventId: eid, ts: i, model: 'm', promptHash: 'p', text: `t${i}`, tokensIn: null, tokensOut: null, confidence: null });
    }
    const rows = await storage.timeline(2, 1);
    expect(rows.map(r => r.id)).toEqual([1, 2, 3]);
  });
});

describe('summary cache', () => {
  it('returns null on cache miss', async () => {
    const k = storage.cacheKey('m', 'p', 'i');
    expect(await storage.getCachedSummary(k)).toBeNull();
  });

  it('round-trips cached summaries', async () => {
    const k = storage.cacheKey('m', 'p', 'i');
    await storage.putCachedSummary(k, 'hello', 1, 2, 100);
    const got = await storage.getCachedSummary(k);
    expect(got).toEqual({ text: 'hello', tokensIn: 1, tokensOut: 2 });
  });

  it('cacheKey is deterministic and varies with inputs', () => {
    expect(storage.cacheKey('m', 'p', 'i')).toBe(storage.cacheKey('m', 'p', 'i'));
    expect(storage.cacheKey('m', 'p', 'i')).not.toBe(storage.cacheKey('m', 'p', 'j'));
  });

  it('round-trips embeddings as raw blobs', async () => {
    const eid = await storage.recordEvent({ ts: 1, sessionId: 's', tool: 'R', payload: {} });
    const sid = await storage.recordSummary({ eventId: eid, ts: 2, model: 'm', promptHash: 'p', text: 't', tokensIn: null, tokensOut: null, confidence: null });
    const v = Float32Array.from([0.1, -0.2, 0.3]);
    await storage.putEmbedding(sid, v);
    const got = await storage.getEmbedding(sid);
    expect(got).not.toBeNull();
    expect(Array.from(got!)).toEqual([
      Math.fround(0.1), Math.fround(-0.2), Math.fround(0.3),
    ]);
  });

  it('returns null for missing embeddings', async () => {
    expect(await storage.getEmbedding(999)).toBeNull();
  });

  it('lists all embeddings joined with summary timestamps', async () => {
    const eid = await storage.recordEvent({ ts: 1, sessionId: 's', tool: 'R', payload: {} });
    const sid = await storage.recordSummary({ eventId: eid, ts: 99, model: 'm', promptHash: 'p', text: 't', tokensIn: null, tokensOut: null, confidence: null });
    await storage.putEmbedding(sid, Float32Array.from([1, 0]));
    const all = await storage.allEmbeddings();
    expect(all).toHaveLength(1);
    expect(all[0]!.ts).toBe(99);
  });

  it('records and lists supersedes pairs', async () => {
    await storage.recordSupersedes(2, 1, 0.97, 100);
    await storage.recordSupersedes(2, 1, 0.97, 100);
    expect(await storage.supersededIds()).toEqual(new Set([1]));
  });

  it('coalesces null token counts coming back from the cache', async () => {
    const k = storage.cacheKey('m', 'p', 'i');
    db.cache.set(k, { text: 'hi', tokens_in: null, tokens_out: null });
    expect(await storage.getCachedSummary(k)).toEqual({ text: 'hi', tokensIn: null, tokensOut: null });
  });
});
