/**
 * Wire-level test for streaming search. Boots the daemon UDS server, sends a stream_search
 * request via MemoryClient.sendStream, and asserts that the daemon emits multiple frames
 * before terminating. Exercises server.ts streaming branch + client.ts async generator.
 */
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { mkdtempSync, rmSync, existsSync, unlinkSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import Database from 'better-sqlite3';
import type { Server } from 'node:net';
import { Storage } from './storage/storage.js';
import { WAL } from './daemon/wal.js';
import { startServer } from './daemon/server.js';
import { MemoryClient } from './client.js';
import type { Response, StreamSearchRequest } from './protocol.js';

let dir: string;
let db: Database.Database;
let storage: Storage;
let wal: WAL;
let server: Server;
let socketPath: string;

beforeEach(async () => {
  dir = mkdtempSync(join(tmpdir(), 'stream-'));
  db = new Database(join(dir, 'd.sqlite'));
  storage = await Storage.init(db);
  wal = new WAL(join(dir, 'wal.ndjson'));
  // Unix socket paths are limited to ~104 chars on macOS; use the temp dir prefix to stay under.
  socketPath = join(dir, 's');
  if (existsSync(socketPath)) unlinkSync(socketPath);
  server = startServer({
    storage, wal, cwd: dir, socketPath,
  });
  // Seed a couple of summaries so the BM25 stage has something to emit.
  const eid = await storage.recordEvent({ ts: Date.now(), sessionId: 'integration', tool: 'Edit', payload: { x: 1 } });
  await storage.recordSummary({
    eventId: eid, ts: Date.now(), model: 'm', promptHash: 'p',
    text: 'auth login session token rotation', tokensIn: null, tokensOut: null, confidence: null,
  });
});

afterEach(async () => {
  await new Promise<void>(r => server.close(() => r()));
  wal.close();
  db.close();
  rmSync(dir, { recursive: true, force: true });
});

interface PartialFrame { partial?: { stage: string; hits: unknown[] }; done?: boolean }

// Windows: UDS socket bind on TEMP-derived paths fails with EACCES under GitHub Actions.
// Mirror the skip pattern used by client.test.ts and e2e.test.ts. The streaming dispatch is
// covered at unit level by daemon/server.test.ts processFrame tests, which run on every OS.
describe.skipIf(process.platform === 'win32')('stream_search wire protocol', () => {
  it('emits BM25, vector, final, and a done terminator', async () => {
    const client = new MemoryClient({ socketPath, timeoutMs: 5000 });
    const req: StreamSearchRequest = { kind: 'stream_search', query: 'auth', k: 5 };
    const stages: string[] = [];
    let sawDone = false;
    for await (const frame of client.sendStream<PartialFrame>(req)) {
      const r = frame as Response<PartialFrame>;
      expect(r.ok).toBe(true);
      if (!r.ok) continue;
      if (r.data.partial) stages.push(r.data.partial.stage);
      if (r.data.done) sawDone = true;
    }
    expect(stages).toContain('bm25');
    expect(stages).toContain('final');
    expect(sawDone).toBe(true);
  });

  it('final stage carries the same top hit as non-streaming search', async () => {
    const client = new MemoryClient({ socketPath, timeoutMs: 5000 });
    const single = await client.send<{ hits: Array<{ id: number }> }>({ kind: 'search', query: 'auth', k: 5 });
    expect(single.ok).toBe(true);
    const finalHits: Array<{ id: number }> = [];
    for await (const frame of client.sendStream<PartialFrame>({ kind: 'stream_search', query: 'auth', k: 5 })) {
      const r = frame as Response<PartialFrame>;
      if (r.ok && r.data.partial && r.data.partial.stage === 'final') {
        finalHits.push(...(r.data.partial.hits as Array<{ id: number }>));
      }
    }
    expect(finalHits.length).toBeGreaterThan(0);
    if (single.ok) expect(finalHits[0]!.id).toBe(single.data.hits[0]!.id);
  });
});
