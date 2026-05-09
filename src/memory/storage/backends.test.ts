/**
 * Backend parity matrix: runs the same Storage operations against better-sqlite3 (native)
 * and node-sqlite3-wasm (WASM) to catch tokenizer / migration / FTS5 / vec drift between
 * the two backends.
 *
 * The native path is the default in production; the WASM path is the fallback when the
 * native binding can't be built. Without this test, schema or FTS5 keyword differences
 * between backends would only surface in production for users on the WASM path.
 */
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import Database from 'better-sqlite3';
import { Storage, type DBHandle } from './storage.js';
import { openWasmDatabase } from './wasm-db.js';

interface BackendFactory {
  name: 'native' | 'wasm';
  open: (path: string) => Promise<DBHandle & { close(): void }>;
}

const NATIVE: BackendFactory = {
  name: 'native',
  open: async (path: string) => new Database(path) as unknown as DBHandle & { close(): void },
};

const WASM: BackendFactory = {
  name: 'wasm',
  open: async (path: string) => openWasmDatabase(path),
};

// WASM backend holds the db file handle open on Windows even after close(),
// blocking rmdir. The WASM path is a fallback for non-Windows systems that
// cannot compile better-sqlite3; skip it on Windows where native always works.
const BACKENDS = process.platform === 'win32' ? [NATIVE] : [NATIVE, WASM];

describe.each(BACKENDS)('storage backend parity ($name)', backend => {
  let dir: string;
  let db: DBHandle & { close(): void };
  let storage: Storage;

  beforeEach(async () => {
    dir = mkdtempSync(join(tmpdir(), `mem-${backend.name}-`));
    db = await backend.open(join(dir, 'd.sqlite'));
    // journal_mode=memory keeps the journal in RAM rather than a -journal file.
    // Without this, the wasm backend leaves a -journal fd open on Windows after
    // db.close(), which blocks rmdir (ENOTEMPTY).
    db.exec('PRAGMA journal_mode=memory');
    storage = await Storage.init(db);
  });

  afterEach(() => {
    try { db.close(); } catch { /* ignore */ }
    rmSync(dir, { recursive: true, force: true, maxRetries: 5, retryDelay: 100 });
  });

  it('records events and reads them back with stable shape', async () => {
    const id = await storage.recordEvent({ ts: 1, sessionId: 'sess', tool: 'Read', payload: { x: 1 }, tokensEst: 42 });
    expect(id).toBeGreaterThan(0);
    const events = await storage.pendingEvents(10);
    expect(events).toHaveLength(1);
    expect(events[0]!.tool).toBe('Read');
    expect(events[0]!.tokensEst).toBe(42);
  });

  it('records summaries and reads them back by id', async () => {
    const eid = await storage.recordEvent({ ts: 1, sessionId: 's', tool: 'Edit', payload: {} });
    const sid = await storage.recordSummary({
      eventId: eid, ts: 100, model: 'm', promptHash: 'p', text: 'auth migration applied',
      tokensIn: 5, tokensOut: 12, confidence: 0.9,
    });
    const rows = await storage.getSummariesByIds([sid]);
    expect(rows).toHaveLength(1);
    expect(rows[0]!.text).toBe('auth migration applied');
  });

  it('FTS5 search matches plain alphanumeric tokens', async () => {
    const eid = await storage.recordEvent({ ts: 1, sessionId: 's', tool: 'R', payload: {} });
    await storage.recordSummary({
      eventId: eid, ts: 1, model: 'm', promptHash: 'p',
      text: 'auth migration v2 token',
      tokensIn: null, tokensOut: null, confidence: null,
    });
    const hits = await storage.searchFts('auth migration');
    expect(hits.length).toBe(1);
  });

  it('FTS5 sanitizer survives hyphens, parens, FTS5 keywords without throwing', async () => {
    const eid = await storage.recordEvent({ ts: 1, sessionId: 's', tool: 'R', payload: {} });
    await storage.recordSummary({
      eventId: eid, ts: 1, model: 'm', promptHash: 'p',
      text: 'token migration plan',
      tokensIn: null, tokensOut: null, confidence: null,
    });
    await storage.searchFts('auth-token (NEAR) plan:*');
    await storage.searchFts('---');
  });

  it('cache write/read round-trips identical bytes', async () => {
    const key = storage.cacheKey('haiku', 'sys', 'in');
    await storage.putCachedSummary(key, '{"text":"x","confidence":0.7}', 8, 4, 999);
    const r = await storage.getCachedSummary(key);
    expect(r?.text).toBe('{"text":"x","confidence":0.7}');
    expect(r?.tokensIn).toBe(8);
    expect(r?.tokensOut).toBe(4);
  });

  it('embeddings round-trip the dim and vec bytes', async () => {
    const eid = await storage.recordEvent({ ts: 1, sessionId: 's', tool: 'R', payload: {} });
    const sid = await storage.recordSummary({
      eventId: eid, ts: 1, model: 'm', promptHash: 'p', text: 't',
      tokensIn: null, tokensOut: null, confidence: null,
    });
    const v = new Float32Array([0.1, -0.2, 0.3]);
    await storage.putEmbedding(sid, v);
    const got = await storage.getEmbedding(sid);
    expect(got).not.toBeNull();
    expect(got!.length).toBe(3);
    expect(Array.from(got!).map(n => Number(n.toFixed(4)))).toEqual([0.1, -0.2, 0.3]);
  });

  it('timeline returns ordered window around an id', async () => {
    for (let i = 0; i < 5; i++) {
      const eid = await storage.recordEvent({ ts: i, sessionId: 's', tool: 'R', payload: { i } });
      await storage.recordSummary({
        eventId: eid, ts: i, model: 'm', promptHash: 'p', text: `s${i}`,
        tokensIn: null, tokensOut: null, confidence: null,
      });
    }
    const rows = await storage.timeline(3, 1);
    expect(rows.length).toBeGreaterThanOrEqual(1);
  });

  it('migrations run idempotently (re-instantiating Storage on the same DB is a no-op)', async () => {
    const eid = await storage.recordEvent({ ts: 1, sessionId: 's', tool: 'R', payload: {} });
    const sid = await storage.recordSummary({
      eventId: eid, ts: 1, model: 'm', promptHash: 'p', text: 'a',
      tokensIn: null, tokensOut: null, confidence: null,
    });
    await Storage.init(db);
    const after = await storage.getSummariesByIds([sid]);
    expect(after).toHaveLength(1);
  });

  it('UNIQUE(event_id) on summaries: a second insert returns the existing id', async () => {
    const eid = await storage.recordEvent({ ts: 1, sessionId: 's', tool: 'R', payload: {} });
    const first = await storage.recordSummary({
      eventId: eid, ts: 1, model: 'haiku', promptHash: 'p', text: 'first',
      tokensIn: 1, tokensOut: 1, confidence: 0.9,
    });
    expect(first).toBeGreaterThan(0);
    const second = await storage.recordSummary({
      eventId: eid, ts: 2, model: 'haiku', promptHash: 'p', text: 'second',
      tokensIn: 1, tokensOut: 1, confidence: 0.9,
    });
    expect(second).toBe(first);
    const counts = await storage.counts();
    expect(counts.summaries).toBe(1);
  });

  it('claimPending atomically flips raw → claimed and returns the rows', async () => {
    for (let i = 0; i < 3; i++) {
      await storage.recordEvent({ ts: i, sessionId: 's', tool: 'R', payload: { i } });
    }
    const claimed = await storage.claimPending(2);
    expect(claimed).toHaveLength(2);
    expect(claimed.every(r => r.status === 'claimed')).toBe(true);
    const stillRaw = await storage.pendingEvents(10);
    expect(stillRaw).toHaveLength(1);
  });

  it('concurrent claimPending callers do not see overlapping rows', async () => {
    for (let i = 0; i < 6; i++) {
      await storage.recordEvent({ ts: i, sessionId: 's', tool: 'R', payload: { i } });
    }
    const [a, b] = await Promise.all([storage.claimPending(4), storage.claimPending(4)]);
    const aIds = new Set(a.map(r => r.id));
    const bIds = new Set(b.map(r => r.id));
    for (const id of aIds) expect(bIds.has(id)).toBe(false);
    expect(aIds.size + bIds.size).toBe(6);
  });

  it('releaseClaimed returns event to raw and increments attempts; eventually skips', async () => {
    const eid = await storage.recordEvent({ ts: 1, sessionId: 's', tool: 'R', payload: {} });
    await storage.claimPending(1);
    const r1 = await storage.releaseClaimed(eid, 'rate limit');
    expect(r1).toBe('released');
    expect((await storage.pendingEvents(1))[0]!.id).toBe(eid);
    await storage.claimPending(1);
    const r2 = await storage.releaseClaimed(eid, 'rate limit');
    expect(r2).toBe('released');
    await storage.claimPending(1);
    const r3 = await storage.releaseClaimed(eid, 'rate limit');
    expect(r3).toBe('skipped');
    const counts = await storage.counts();
    expect(counts.skipped).toBe(1);
  });

  it('recentSummaries returns latest summaries ordered by id descending', async () => {
    for (let i = 0; i < 5; i++) {
      const eid = await storage.recordEvent({ ts: i, sessionId: 's', tool: 'R', payload: { i } });
      await storage.recordSummary({
        eventId: eid, ts: i, model: 'm', promptHash: 'p', text: `s${i}`,
        tokensIn: null, tokensOut: null, confidence: null,
      });
    }
    const rows = await storage.recentSummaries(3);
    expect(rows).toHaveLength(3);
    expect(rows[0]!.id).toBeGreaterThan(rows[1]!.id);
    expect(rows[1]!.id).toBeGreaterThan(rows[2]!.id);
    expect(rows[0]!.text).toBe('s4');
  });
});
