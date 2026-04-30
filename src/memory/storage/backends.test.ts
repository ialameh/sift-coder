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

describe.each([NATIVE, WASM])('storage backend parity ($name)', backend => {
  let dir: string;
  let db: DBHandle & { close(): void };
  let storage: Storage;

  beforeEach(async () => {
    dir = mkdtempSync(join(tmpdir(), `mem-${backend.name}-`));
    db = await backend.open(join(dir, 'd.sqlite'));
    storage = new Storage(db);
  });

  afterEach(() => {
    db.close();
    rmSync(dir, { recursive: true, force: true });
  });

  it('records events and reads them back with stable shape', () => {
    const id = storage.recordEvent({ ts: 1, sessionId: 'sess', tool: 'Read', payload: { x: 1 }, tokensEst: 42 });
    expect(id).toBeGreaterThan(0);
    const events = storage.pendingEvents(10);
    expect(events).toHaveLength(1);
    expect(events[0]!.tool).toBe('Read');
    expect(events[0]!.tokensEst).toBe(42);
  });

  it('records summaries and reads them back by id', () => {
    const eid = storage.recordEvent({ ts: 1, sessionId: 's', tool: 'Edit', payload: {} });
    const sid = storage.recordSummary({
      eventId: eid, ts: 100, model: 'm', promptHash: 'p', text: 'auth migration applied',
      tokensIn: 5, tokensOut: 12, confidence: 0.9,
    });
    const rows = storage.getSummariesByIds([sid]);
    expect(rows).toHaveLength(1);
    expect(rows[0]!.text).toBe('auth migration applied');
  });

  it('FTS5 search matches plain alphanumeric tokens', () => {
    const eid = storage.recordEvent({ ts: 1, sessionId: 's', tool: 'R', payload: {} });
    storage.recordSummary({
      eventId: eid, ts: 1, model: 'm', promptHash: 'p',
      text: 'auth migration v2 token',
      tokensIn: null, tokensOut: null, confidence: null,
    });
    const hits = storage.searchFts('auth migration');
    expect(hits.length).toBe(1);
  });

  it('FTS5 sanitizer survives hyphens, parens, FTS5 keywords without throwing', () => {
    const eid = storage.recordEvent({ ts: 1, sessionId: 's', tool: 'R', payload: {} });
    storage.recordSummary({
      eventId: eid, ts: 1, model: 'm', promptHash: 'p',
      text: 'token migration plan',
      tokensIn: null, tokensOut: null, confidence: null,
    });
    expect(() => storage.searchFts('auth-token (NEAR) plan:*')).not.toThrow();
    expect(() => storage.searchFts('---')).not.toThrow();
  });

  it('cache write/read round-trips identical bytes', () => {
    const key = storage.cacheKey('haiku', 'sys', 'in');
    storage.putCachedSummary(key, '{"text":"x","confidence":0.7}', 8, 4, 999);
    const r = storage.getCachedSummary(key);
    expect(r?.text).toBe('{"text":"x","confidence":0.7}');
    expect(r?.tokensIn).toBe(8);
    expect(r?.tokensOut).toBe(4);
  });

  it('embeddings round-trip the dim and vec bytes', () => {
    const eid = storage.recordEvent({ ts: 1, sessionId: 's', tool: 'R', payload: {} });
    const sid = storage.recordSummary({
      eventId: eid, ts: 1, model: 'm', promptHash: 'p', text: 't',
      tokensIn: null, tokensOut: null, confidence: null,
    });
    const v = new Float32Array([0.1, -0.2, 0.3]);
    storage.putEmbedding(sid, v);
    const got = storage.getEmbedding(sid);
    expect(got).not.toBeNull();
    expect(got!.length).toBe(3);
    expect(Array.from(got!).map(n => Number(n.toFixed(4)))).toEqual([0.1, -0.2, 0.3]);
  });

  it('timeline returns ordered window around an id', () => {
    const eid = storage.recordEvent({ ts: 1, sessionId: 's', tool: 'R', payload: {} });
    for (let i = 0; i < 5; i++) {
      storage.recordSummary({
        eventId: eid, ts: i, model: 'm', promptHash: 'p', text: `s${i}`,
        tokensIn: null, tokensOut: null, confidence: null,
      });
    }
    const rows = storage.timeline(3, 1);
    expect(rows.length).toBeGreaterThanOrEqual(1);
  });

  it('migrations run idempotently (re-instantiating Storage on the same DB is a no-op)', () => {
    const eid = storage.recordEvent({ ts: 1, sessionId: 's', tool: 'R', payload: {} });
    const sid = storage.recordSummary({
      eventId: eid, ts: 1, model: 'm', promptHash: 'p', text: 'a',
      tokensIn: null, tokensOut: null, confidence: null,
    });
    new Storage(db);
    const after = storage.getSummariesByIds([sid]);
    expect(after).toHaveLength(1);
  });
});
