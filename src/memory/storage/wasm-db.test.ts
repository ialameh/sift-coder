import { describe, it, expect } from 'vitest';
import { wrap } from './wasm-db.js';

interface FakeStatement {
  run(args?: unknown[]): { lastInsertRowid: number | bigint };
  get(args?: unknown[]): unknown;
  all(args?: unknown[]): unknown[];
}

class FakeWasmDB {
  exec_sql: string[] = [];
  prepare_sql: string[] = [];
  recordedRun: Array<{ sql: string; args: unknown[] | undefined }> = [];
  recordedGet: Array<{ sql: string; args: unknown[] | undefined }> = [];
  recordedAll: Array<{ sql: string; args: unknown[] | undefined }> = [];
  closed = false;

  exec(sql: string): unknown { this.exec_sql.push(sql); return undefined; }

  prepare(sql: string): FakeStatement {
    this.prepare_sql.push(sql);
    const self = this;
    return {
      run(args?: unknown[]) { self.recordedRun.push({ sql, args }); return { lastInsertRowid: 7 }; },
      get(args?: unknown[]) { self.recordedGet.push({ sql, args }); return { ok: true, sql, args }; },
      all(args?: unknown[]) { self.recordedAll.push({ sql, args }); return [{ ok: true }]; },
    };
  }

  close() { this.closed = true; }
}

describe('wasm-db wrap()', () => {
  it('forwards exec calls verbatim', () => {
    const inner = new FakeWasmDB();
    const db = wrap(inner);
    db.exec('CREATE TABLE x (a)');
    expect(inner.exec_sql).toEqual(['CREATE TABLE x (a)']);
  });

  it('forwards close calls', () => {
    const inner = new FakeWasmDB();
    const db = wrap(inner);
    db.close();
    expect(inner.closed).toBe(true);
  });

  it('passes spread args as an array to underlying statement.run', () => {
    const inner = new FakeWasmDB();
    const stmt = wrap(inner).prepare('INSERT INTO t (a, b) VALUES (?, ?)');
    const r = stmt.run(1, 'two');
    expect(inner.recordedRun[0]?.args).toEqual([1, 'two']);
    expect(r.lastInsertRowid).toBe(7);
  });

  it('passes empty args as undefined when run is called with none', () => {
    const inner = new FakeWasmDB();
    wrap(inner).prepare('UPDATE t SET a = a + 1').run();
    expect(inner.recordedRun[0]?.args).toBeUndefined();
  });

  it('passes spread args as an array to underlying statement.get', () => {
    const inner = new FakeWasmDB();
    const stmt = wrap(inner).prepare('SELECT * FROM t WHERE a = ?');
    const row = stmt.get(42);
    expect(inner.recordedGet[0]?.args).toEqual([42]);
    expect(row).toMatchObject({ ok: true });
  });

  it('passes empty args as undefined when get is called with none', () => {
    const inner = new FakeWasmDB();
    wrap(inner).prepare('SELECT count(*) FROM t').get();
    expect(inner.recordedGet[0]?.args).toBeUndefined();
  });

  it('passes spread args as an array to underlying statement.all', () => {
    const inner = new FakeWasmDB();
    const stmt = wrap(inner).prepare('SELECT * FROM t WHERE a = ?');
    const rows = stmt.all(99);
    expect(inner.recordedAll[0]?.args).toEqual([99]);
    expect(rows).toEqual([{ ok: true }]);
  });

  it('passes empty args as undefined when all is called with none', () => {
    const inner = new FakeWasmDB();
    wrap(inner).prepare('SELECT * FROM t').all();
    expect(inner.recordedAll[0]?.args).toBeUndefined();
  });
});

import { openWasmDatabase } from './wasm-db.js';
import { Storage } from './storage.js';

describe('wasm-db live integration', () => {
  it('Storage runs end-to-end on a real WASM SQLite backend', async () => {
    const db = await openWasmDatabase(':memory:');
    const storage = new Storage(db);
    expect(storage.vecEnabled).toBe(false);
    storage.ensureSession('s', '/cwd', 1);
    const eid = storage.recordEvent({ ts: 1, sessionId: 's', tool: 'Read', payload: { x: 1 } });
    expect(eid).toBeGreaterThan(0);
    const sid = storage.recordSummary({
      eventId: eid, ts: 2, model: 'm', promptHash: 'p',
      text: 'hello world', tokensIn: 1, tokensOut: 1, confidence: 0.9,
    });
    expect(sid).toBeGreaterThan(0);
    const hits = storage.searchFts('hello', 5);
    expect(hits.length).toBeGreaterThan(0);
    db.close();
  });
});
