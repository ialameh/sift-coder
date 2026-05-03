import { describe, it, expect, beforeEach, vi } from 'vitest';
import { Consolidator } from './consolidator.js';
import { Storage, type DBHandle } from '../storage/storage.js';
import { DeterministicEmbedder } from '../embedder.js';

class FakeDB implements DBHandle {
  embeddings = new Map<number, { dim: number; vec: Buffer; ts: number }>();
  summaries = new Map<number, { id: number; ts: number }>();
  supersedes: Array<{ newer_id: number; older_id: number; cosine: number }> = [];
  exec(): void { /* noop */ }
  loadExtension(): void { throw new Error('no'); }
  prepare(sql: string) {
    const stmt = sql.trim();
    if (stmt.includes('FROM summary_embeddings e JOIN summaries s')) {
      return {
        run: () => ({ lastInsertRowid: 0 }),
        get: () => undefined,
        all: () => Array.from(this.embeddings.entries()).map(([sid, e]) => ({ sid, dim: e.dim, vec: e.vec, ts: e.ts })),
      };
    }
    if (stmt.startsWith('SELECT older_id FROM summary_supersedes')) {
      return {
        run: () => ({ lastInsertRowid: 0 }),
        get: () => undefined,
        all: () => this.supersedes.map(s => ({ older_id: s.older_id })),
      };
    }
    if (stmt.startsWith('INSERT OR IGNORE INTO summary_supersedes')) {
      return {
        run: (newer: unknown, older: unknown, c: unknown) => {
          this.supersedes.push({ newer_id: newer as number, older_id: older as number, cosine: c as number });
          return { lastInsertRowid: 0 };
        },
        get: () => undefined,
        all: () => [],
      };
    }
    return { run: () => ({ lastInsertRowid: 0 }), get: () => undefined, all: () => [] };
  }
}

let db: FakeDB;
let storage: Storage;
const e = new DeterministicEmbedder(256);

async function addSummary(id: number, ts: number, text: string) {
  const v = await e.embed(text);
  db.embeddings.set(id, { dim: v.length, vec: Buffer.from(v.buffer, v.byteOffset, v.byteLength), ts });
}

beforeEach(() => {
  db = new FakeDB();
  storage = new Storage(db);
});

describe('Consolidator', () => {
  it('marks the older near-duplicate as superseded by the newer one', async () => {
    await addSummary(1, 100, 'auth login session');
    await addSummary(2, 200, 'auth login session');
    const c = new Consolidator(storage, { cosineThreshold: 0.99, minNewSinceLastRun: 0 });
    c.start();
    const r = await c.tick();
    c.stop();
    expect(r.pairsMarked).toBe(1);
    expect(db.supersedes[0]!.newer_id).toBe(2);
    expect(db.supersedes[0]!.older_id).toBe(1);
  });

  it('does nothing when fewer than minNewSinceLastRun summaries exist', async () => {
    const c = new Consolidator(storage, { minNewSinceLastRun: 100 });
    c.start();
    const r = await c.tick();
    c.stop();
    expect(r.pairsMarked).toBe(0);
  });

  it('returns no work when not running', async () => {
    const c = new Consolidator(storage);
    expect(await c.tick()).toEqual({ pairsMarked: 0, scanned: 0 });
  });

  it('start() is idempotent', () => {
    const c = new Consolidator(storage);
    c.start(); c.start();
    expect(c.getState()).toBe('running');
    c.stop();
  });

  it('stop() clears pending timer and marks state stopped', () => {
    const c = new Consolidator(storage);
    c.start(); c.stop();
    expect(c.getState()).toBe('stopped');
  });

  it('skips already-superseded summaries on subsequent runs', async () => {
    await addSummary(1, 100, 'auth login');
    await addSummary(2, 200, 'auth login');
    const c = new Consolidator(storage, { cosineThreshold: 0.99, minNewSinceLastRun: 0 });
    c.start();
    await c.tick();
    await addSummary(3, 300, 'completely unrelated database migration');
    const r2 = await c.tick();
    c.stop();
    expect(r2.pairsMarked).toBe(0);
  });

  it('respects a pair-comparison budget', async () => {
    for (let i = 1; i <= 20; i++) await addSummary(i, i, `text variant ${i}`);
    const c = new Consolidator(storage, { pairLimit: 5, minNewSinceLastRun: 0, cosineThreshold: 1.1 });
    c.start();
    const r = await c.tick();
    c.stop();
    expect(r.scanned).toBe(20);
    expect(r.pairsMarked).toBe(0);
  });

  it('does not mark unrelated summaries as duplicates', async () => {
    await addSummary(1, 100, 'auth login session');
    await addSummary(2, 200, 'database migration schema column');
    const c = new Consolidator(storage, { cosineThreshold: 0.95, minNewSinceLastRun: 0 });
    c.start();
    const r = await c.tick();
    c.stop();
    expect(r.pairsMarked).toBe(0);
  });

  it('handles a chain of three near-duplicates without re-marking already superseded items', async () => {
    await addSummary(1, 100, 'auth login session');
    await addSummary(2, 200, 'auth login session');
    await addSummary(3, 300, 'auth login session');
    const c = new Consolidator(storage, { cosineThreshold: 0.99, minNewSinceLastRun: 0 });
    c.start();
    const r = await c.tick();
    c.stop();
    expect(r.pairsMarked).toBeGreaterThanOrEqual(1);
    expect(db.supersedes.length).toBeGreaterThanOrEqual(1);
  });

  it('fires the scheduled timer callback', async () => {
    vi.useFakeTimers();
    const c = new Consolidator(storage, { intervalMs: 10, minNewSinceLastRun: 0 });
    c.start();
    vi.advanceTimersByTime(15);
    c.stop();
    vi.useRealTimers();
    expect(c.getState()).toBe('stopped');
  });

  it('stop() is safe before start()', () => {
    const c = new Consolidator(storage);
    expect(() => c.stop()).not.toThrow();
  });
});
