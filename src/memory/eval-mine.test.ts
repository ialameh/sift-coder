import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import Database from 'better-sqlite3';
import { Storage } from './storage/storage.js';
import { DeterministicEmbedder } from './embedder.js';
import { mineGolden } from './eval-mine.js';

let dir: string;
let db: Database.Database;
let storage: Storage;
const e = new DeterministicEmbedder(128);

async function seed(text: string): Promise<number> {
  const eid = await storage.recordEvent({ ts: 1, sessionId: 's', tool: 'R', payload: {} });
  const sid = await storage.recordSummary({
    eventId: eid, ts: 0, model: 'm', promptHash: 'p', text,
    tokensIn: null, tokensOut: null, confidence: null,
  });
  await storage.putEmbedding(sid, await e.embed(text));
  return sid;
}

beforeEach(() => {
  dir = mkdtempSync(join(tmpdir(), 'mine-'));
  db = new Database(join(dir, 'd.sqlite'));
  storage = new Storage(db);
});

afterEach(() => {
  db.close();
  rmSync(dir, { recursive: true, force: true });
});

describe('mineGolden', () => {
  it('returns empty array when no embeddings exist', async () => {
    expect(await mineGolden(storage)).toEqual([]);
  });

  it('produces (query, [id]) pairs using top-IDF terms from each summary', async () => {
    const auth = await seed('user authentication login session token');
    const db = await seed('database migration schema column rename');
    const items = await mineGolden(storage, { termsPerQuery: 3 });
    expect(items).toHaveLength(2);
    const authItem = items.find(i => i.expectedIds[0] === auth)!;
    expect(authItem.query.split(' ')).toHaveLength(3);
    const dbItem = items.find(i => i.expectedIds[0] === db)!;
    expect(dbItem.query).toMatch(/migration|schema|database|rename/);
  });

  it('skips summaries below minSummaryTokens', async () => {
    await seed('hi');
    expect(await mineGolden(storage, { minSummaryTokens: 5 })).toEqual([]);
  });

  it('honors maxItems', async () => {
    for (let i = 0; i < 5; i++) await seed(`alpha beta gamma delta epsilon ${i}`);
    expect(await mineGolden(storage, { maxItems: 2 })).toHaveLength(2);
  });

  it('skips summaries whose informative tokens are all empty', async () => {
    const eid = await storage.recordEvent({ ts: 1, sessionId: 's', tool: 'R', payload: {} });
    const sid = await storage.recordSummary({
      eventId: eid, ts: 0, model: 'm', promptHash: 'p', text: 'the a of and or to',
      tokensIn: null, tokensOut: null, confidence: null,
    });
    await storage.putEmbedding(sid, await e.embed('the a of and or to'));
    const items = await mineGolden(storage, { minSummaryTokens: 0 });
    expect(items).toEqual([]);
  });
});
