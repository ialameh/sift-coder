import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import os from 'node:os';
import path from 'node:path';
import fs from 'node:fs/promises';
import fsSync from 'node:fs';
import { createRequire } from 'node:module';
import { backfillFromV2 } from './v2-import.js';
import { CORE_DDL } from '../storage/schema.js';

const require = createRequire(import.meta.url);

interface DbHandle {
  prepare(sql: string): {
    run(...params: unknown[]): { lastInsertRowid: number };
    all(): unknown[];
  };
  exec(sql: string): void;
  close(): void;
}

function makeV1Db(file: string): DbHandle {
  const Database = require('better-sqlite3') as new (file: string) => DbHandle;
  fsSync.mkdirSync(path.dirname(file), { recursive: true });
  const db = new Database(file);
  db.exec(CORE_DDL);
  return db;
}

function seed(db: DbHandle): { eventIds: number[]; summaryIds: number[] } {
  db.prepare(
    "INSERT INTO sessions (id, started_at, cwd) VALUES (?, ?, ?)",
  ).run('sess-1', 1700000000000, '/repo');

  const eventIds: number[] = [];
  for (let i = 0; i < 3; i++) {
    const r = db
      .prepare(
        "INSERT INTO events (ts, session_id, tool, input_hash, payload_json, status, tokens_est) VALUES (?, ?, ?, ?, ?, 'summarized', 10)",
      )
      .run(1700000000000 + i, 'sess-1', 'Read', `hash-${i}`, JSON.stringify({ i }));
    eventIds.push(r.lastInsertRowid);
  }

  const summaryIds: number[] = [];
  for (const eid of eventIds) {
    const r = db
      .prepare(
        "INSERT INTO summaries (event_id, ts, model, prompt_hash, text, tokens_in, tokens_out, confidence) VALUES (?, ?, 'haiku', 'p-hash', ?, 50, 20, 0.85)",
      )
      .run(eid, 1700000000000, `summary for ${eid}`);
    summaryIds.push(r.lastInsertRowid);
  }

  // edges
  db.prepare(
    "INSERT INTO provenance_edges (ts, from_kind, from_id, to_kind, to_id, edge_type, confidence, source) VALUES (?, ?, ?, ?, ?, ?, ?, 'siftcoder')",
  ).run(
    1700000000000,
    'summary',
    String(summaryIds[0]),
    'summary',
    String(summaryIds[1]),
    'derives_from',
    1.0,
  );

  // embedding for first summary
  db.prepare('INSERT INTO summary_embeddings (summary_id, dim, vec) VALUES (?, ?, ?)').run(
    summaryIds[0],
    4,
    Buffer.from(new Uint8Array([1, 2, 3, 4])),
  );

  return { eventIds, summaryIds };
}

function countV3(v3Db: string): { events: number; summaries: number; edges: number; embeddings: number; sessions: number } {
  const Database = require('better-sqlite3') as new (file: string) => DbHandle;
  const db = new Database(v3Db);
  try {
    return {
      events: (db.prepare('SELECT COUNT(*) as c FROM events').all()[0] as { c: number }).c,
      summaries: (db.prepare('SELECT COUNT(*) as c FROM summaries').all()[0] as { c: number }).c,
      edges: (db.prepare('SELECT COUNT(*) as c FROM provenance_edges').all()[0] as { c: number }).c,
      embeddings: (db.prepare('SELECT COUNT(*) as c FROM summary_embeddings').all()[0] as { c: number }).c,
      sessions: (db.prepare('SELECT COUNT(*) as c FROM sessions').all()[0] as { c: number }).c,
    };
  } finally {
    db.close();
  }
}

describe('backfillFromV2', () => {
  let tmpHome: string;
  let v1Root: string;
  let savedHome: string | undefined;

  beforeEach(async () => {
    tmpHome = await fs.mkdtemp(path.join(os.tmpdir(), 'sc-bf-'));
    savedHome = process.env.HOME;
    process.env.HOME = tmpHome;
    v1Root = path.join(tmpHome, '.siftcoder');
  });

  afterEach(async () => {
    if (savedHome) process.env.HOME = savedHome;
    await fs.rm(tmpHome, { recursive: true, force: true });
  });

  it('returns error when v1 root missing', async () => {
    const r = await backfillFromV2({ v1Root: path.join(tmpHome, 'nonexistent') });
    expect(r.errors).toHaveLength(1);
    expect(r.errors[0].message).toMatch(/V1\/V2 root not found/);
  });

  it('returns error when no workspaces found', async () => {
    fsSync.mkdirSync(v1Root, { recursive: true });
    const r = await backfillFromV2({ v1Root });
    expect(r.errors).toHaveLength(1);
    expect(r.errors[0].message).toMatch(/No V1 workspaces found/);
  });

  it('dry-run counts without writing', async () => {
    const wsKey = 'abc123abc123';
    const v1Db = path.join(v1Root, 'workspaces', wsKey, 'memory.db');
    const db = makeV1Db(v1Db);
    seed(db);
    db.close();

    const r = await backfillFromV2({ v1Root, v3Ns: 'v3-test', dryRun: true });
    expect(r.dryRun).toBe(true);
    expect(r.workspaces).toHaveLength(1);
    expect(r.workspaces[0].events).toBe(3);
    expect(r.workspaces[0].summaries).toBe(3);
    expect(r.workspaces[0].edges).toBe(1);
    expect(r.workspaces[0].embeddings).toBe(1);

    const v3Db = path.join(tmpHome, '.siftcoder', 'v3-test', 'workspaces', wsKey, 'memory.db');
    expect(fsSync.existsSync(v3Db)).toBe(false);
  });

  it('migrates events, summaries, edges, embeddings, sessions', async () => {
    const wsKey = 'abc123abc123';
    const v1Db = path.join(v1Root, 'workspaces', wsKey, 'memory.db');
    const db = makeV1Db(v1Db);
    seed(db);
    db.close();

    const r = await backfillFromV2({ v1Root, v3Ns: 'v3-test', dryRun: false });
    expect(r.errors).toEqual([]);
    expect(r.workspaces).toHaveLength(1);
    expect(r.totals.events).toBe(3);
    expect(r.totals.summaries).toBe(3);
    expect(r.totals.edges).toBe(1);
    expect(r.totals.embeddings).toBe(1);
    expect(r.totals.sessions).toBe(1);

    const v3Db = path.join(tmpHome, '.siftcoder', 'v3-test', 'workspaces', wsKey, 'memory.db');
    const counts = countV3(v3Db);
    expect(counts.events).toBe(3);
    expect(counts.summaries).toBe(3);
    expect(counts.edges).toBe(1);
    expect(counts.embeddings).toBe(1);
    expect(counts.sessions).toBe(1);
  });

  it('is idempotent — second run skips dupes', async () => {
    const wsKey = 'abc123abc123';
    const v1Db = path.join(v1Root, 'workspaces', wsKey, 'memory.db');
    const db = makeV1Db(v1Db);
    seed(db);
    db.close();

    await backfillFromV2({ v1Root, v3Ns: 'v3-test' });
    const r2 = await backfillFromV2({ v1Root, v3Ns: 'v3-test' });
    expect(r2.workspaces[0].skipped.events).toBe(3);
    expect(r2.workspaces[0].skipped.summaries).toBe(3);
    expect(r2.workspaces[0].events).toBe(0);
    expect(r2.workspaces[0].summaries).toBe(0);
  });

  it('migrates only specified workspace when key provided', async () => {
    const k1 = 'aaaaaaaaaaaa';
    const k2 = 'bbbbbbbbbbbb';
    for (const k of [k1, k2]) {
      const db = makeV1Db(path.join(v1Root, 'workspaces', k, 'memory.db'));
      seed(db);
      db.close();
    }

    const r = await backfillFromV2({ v1Root, v3Ns: 'v3-test', workspaceKey: k1 });
    expect(r.workspaces).toHaveLength(1);
    expect(r.workspaces[0].workspaceKey).toBe(k1);
  });

  it('tags edges with migrated_from in meta', async () => {
    const wsKey = 'abc123abc123';
    const v1Db = path.join(v1Root, 'workspaces', wsKey, 'memory.db');
    const db = makeV1Db(v1Db);
    seed(db);
    db.close();

    await backfillFromV2({ v1Root, v3Ns: 'v3-test' });

    const v3Db = path.join(tmpHome, '.siftcoder', 'v3-test', 'workspaces', wsKey, 'memory.db');
    const Database = require('better-sqlite3') as new (file: string) => DbHandle;
    const v3 = new Database(v3Db);
    try {
      const rows = v3.prepare('SELECT meta_json FROM provenance_edges').all() as Array<{ meta_json: string }>;
      expect(rows[0].meta_json).toMatch(/migrated_from/);
      expect(JSON.parse(rows[0].meta_json).migrated_from).toBe('v2');
    } finally {
      v3.close();
    }
  });
});
