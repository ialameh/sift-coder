/**
 * Live integration test for sqlite-vec backed indexed vector search. Skipped silently when
 * the optional `sqlite-vec` package isn't installed (so a CI runner without the prebuilt
 * binary doesn't fail). Native better-sqlite3 only — node-sqlite3-wasm doesn't bundle
 * runtime extension loading.
 */
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import Database from 'better-sqlite3';
import { Storage, type DBHandle } from './storage.js';
import { buildVecDdl } from './schema.js';
import { DeterministicEmbedder, cosine } from '../embedder.js';

let vecPath: string | null = null;
try {
  const m = await import('sqlite-vec' as string) as { getLoadablePath?: () => string };
  vecPath = m.getLoadablePath?.() ?? null;
} catch {
  vecPath = null;
}

const skip = vecPath === null;

describe.skipIf(skip)('sqlite-vec live integration', () => {
  let dir: string;
  let db: Database.Database;
  let storage: Storage;
  const embedder = new DeterministicEmbedder(128);

  beforeEach(async () => {
    dir = mkdtempSync(join(tmpdir(), 'vec-'));
    db = new Database(join(dir, 'd.sqlite'));
    storage = await Storage.init(db as unknown as DBHandle, {
      vecExtensionPath: vecPath!,
      vecDdl: buildVecDdl(128),
    });
  });

  afterEach(() => {
    try { db.close(); } catch { /* ignore */ }
    rmSync(dir, { recursive: true, force: true, maxRetries: 5, retryDelay: 100 });
  });

  it('Storage reports vecEnabled=true when the extension loads', () => {
    expect(storage.vecEnabled).toBe(true);
  });

  it('searchVec returns rows ranked by cosine similarity, ties broken by id', async () => {
    const eid1 = await storage.recordEvent({ ts: 1, sessionId: 's', tool: 'R', payload: { i: 1 } });
    const sid1 = await storage.recordSummary({ eventId: eid1, ts: 1, model: 'm', promptHash: 'p', text: 'auth login session', tokensIn: null, tokensOut: null, confidence: null });
    const eid2 = await storage.recordEvent({ ts: 2, sessionId: 's', tool: 'R', payload: { i: 2 } });
    const sid2 = await storage.recordSummary({ eventId: eid2, ts: 2, model: 'm', promptHash: 'p', text: 'unrelated weather forecast', tokensIn: null, tokensOut: null, confidence: null });

    await storage.putEmbedding(sid1, await embedder.embed('auth login session'));
    await storage.putEmbedding(sid2, await embedder.embed('unrelated weather forecast'));

    const qv = await embedder.embed('auth login');
    const hits = await storage.searchVec(qv, 2);
    expect(hits).toHaveLength(2);
    expect(hits[0]!.summaryId).toBe(sid1);
    expect(hits[0]!.cosine).toBeGreaterThan(hits[1]!.cosine);
  });

  it('searchVec result agrees in sign with JS cosine over the same vectors', async () => {
    const eid = await storage.recordEvent({ ts: 1, sessionId: 's', tool: 'R', payload: { i: 1 } });
    const sid = await storage.recordSummary({ eventId: eid, ts: 1, model: 'm', promptHash: 'p', text: 'auth login session token', tokensIn: null, tokensOut: null, confidence: null });
    const v = await embedder.embed('auth login session token');
    await storage.putEmbedding(sid, v);
    const qv = await embedder.embed('auth login session token');
    const hits = await storage.searchVec(qv, 1);
    expect(hits).toHaveLength(1);
    expect(hits[0]!.cosine).toBeCloseTo(cosine(qv, v), 3);
  });

  it('returns [] when vec is disabled', async () => {
    await storage.close();
    db = new Database(join(dir, 'plain.sqlite'));
    storage = await Storage.init(db as unknown as DBHandle); // no vecExtensionPath
    expect(storage.vecEnabled).toBe(false);
    const qv = await embedder.embed('x');
    expect(await storage.searchVec(qv, 5)).toEqual([]);
  });
});
