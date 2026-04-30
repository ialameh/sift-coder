import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import Database from 'better-sqlite3';
import { Storage } from './storage/storage.js';
import { DeterministicEmbedder } from './embedder.js';
import { evaluate } from './eval.js';

let dir: string;
let db: Database.Database;
let storage: Storage;
const e = new DeterministicEmbedder(256);

async function seed(text: string, id?: number): Promise<number> {
  const eid = storage.recordEvent({ ts: 1, sessionId: 's', tool: 'R', payload: {} });
  const sid = storage.recordSummary({
    eventId: eid, ts: id ?? Date.now(), model: 'm', promptHash: 'p',
    text, tokensIn: null, tokensOut: null, confidence: null,
  });
  const v = await e.embed(text);
  storage.putEmbedding(sid, v);
  return sid;
}

beforeEach(() => {
  dir = mkdtempSync(join(tmpdir(), 'eval-'));
  db = new Database(join(dir, 'd.sqlite'));
  storage = new Storage(db);
});

afterEach(() => {
  db.close();
  rmSync(dir, { recursive: true, force: true });
});

describe('evaluate', () => {
  it('reports recall@k and MRR over a golden set', async () => {
    const auth = await seed('user authentication login session token');
    await seed('database migration schema column');
    await seed('react component rendering hooks');

    const golden = [
      { query: 'authentication session', expectedIds: [auth] },
      { query: 'database schema',        expectedIds: [2] },
      { query: 'react hooks',            expectedIds: [3] },
    ];
    const report = await evaluate(storage, e, golden, 3, Date.now(), { decayTauMs: 1e15 });
    expect(report.k).toBe(3);
    expect(report.recallAtK).toBeGreaterThan(0);
    expect(report.mrr).toBeGreaterThan(0);
    expect(report.perQuery).toHaveLength(3);
  });

  it('returns zero metrics for an empty golden set', async () => {
    const report = await evaluate(storage, e, [], 5);
    expect(report.recallAtK).toBe(0);
    expect(report.mrr).toBe(0);
    expect(report.perQuery).toEqual([]);
  });

  it('handles golden items with no expected ids gracefully', async () => {
    await seed('anything');
    const report = await evaluate(storage, e, [{ query: 'anything', expectedIds: [] }], 5, Date.now(), { decayTauMs: 1e15 });
    expect(report.perQuery[0]!.recall).toBe(1);
  });

  it('records firstHitRank as null when no expected id is in the top k', async () => {
    await seed('alpha');
    const report = await evaluate(storage, e, [{ query: 'alpha', expectedIds: [999] }], 5, Date.now(), { decayTauMs: 1e15 });
    expect(report.perQuery[0]!.firstHitRank).toBeNull();
    expect(report.perQuery[0]!.recall).toBe(0);
  });

  it('runs without an embedder (BM25 path only)', async () => {
    const sid = await seed('lexical match candidate');
    const report = await evaluate(storage, null, [{ query: 'lexical match', expectedIds: [sid] }], 5, Date.now(), { decayTauMs: 1e15 });
    expect(report.recallAtK).toBe(1);
    expect(report.mrr).toBe(1);
  });
});
