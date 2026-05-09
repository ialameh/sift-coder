/**
 * End-to-end integration test:
 * Real better-sqlite3 + real Unix domain socket server + real MemoryClient.
 * Verifies capture → persist → search round-trips through the wire protocol.
 */
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { mkdtempSync, rmSync, existsSync, unlinkSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { Server } from 'node:net';
import Database from 'better-sqlite3';
import { Storage } from './storage/storage.js';
import { WAL } from './daemon/wal.js';

// Windows: net.createServer with a UDS path does not create a visible filesystem entry,
// so existsSync(socketPath) never returns true. Skip the entire e2e suite on Windows.
const SKIP_ON_WINDOWS = process.platform === 'win32';
import { startServer } from './daemon/server.js';
import { MemoryClient } from './client.js';

let dir: string;
let socketPath: string;
let dbPath: string;
let walPath: string;
let server: Server | null = null;
let db: Database.Database | null = null;
let wal: WAL | null = null;
let storage: Storage;

beforeEach(async () => {
  dir = mkdtempSync(join(tmpdir(), 'sift-e2e-'));
  socketPath = join(dir, 'mem.sock');
  dbPath = join(dir, 'db.sqlite');
  walPath = join(dir, 'wal.ndjson');
  db = new Database(dbPath);
  storage = await Storage.init(db);
});

afterEach(() => {
  if (server) try { server.close(); } catch { /* ignore */ }
  // WAL must be closed before rmSync — its open fd blocks rmdir on Windows.
  if (wal) try { wal.close(); } catch { /* ignore */ }
  if (db) try { db.close(); } catch { /* ignore */ }
  if (existsSync(socketPath)) try { unlinkSync(socketPath); } catch { /* ignore */ }
  wal = null;
  rmSync(dir, { recursive: true, force: true, maxRetries: 5, retryDelay: 100 });
});

describe.skipIf(SKIP_ON_WINDOWS)('memory daemon e2e', () => {
  it('captures an event, persists redacted payload, and exposes it via search', async () => {
    db = new Database(dbPath);
    const storage = await Storage.init(db);
    wal = new WAL(walPath);
    wal.open();

    server = startServer({ storage, wal, socketPath, cwd: dir });
    await waitFor(() => existsSync(socketPath));

    const client = new MemoryClient({ socketPath });
    const cap = await client.send<{ id: number }>({
      kind: 'capture',
      sessionId: 'sess-1',
      tool: 'Edit',
      payload: { file: '/x', token: 'AKIAABCDEFGHIJKLMNOP' },
    });
    expect(cap.ok).toBe(true);
    if (!cap.ok) return;
    expect(cap.data.id).toBe(1);

    const stored = db.prepare('SELECT payload_json FROM events WHERE id = ?').get(1) as { payload_json: string };
    expect(JSON.parse(stored.payload_json).token).toBe('[REDACTED:aws]');

    await storage.recordSummary({
      eventId: 1,
      ts: Date.now(),
      model: 'test',
      promptHash: 'p',
      text: 'edited /x with redacted credential',
      tokensIn: 1,
      tokensOut: 1,
      confidence: 0.9,
    });

    const search = await client.send<{ hits: Array<{ id: number; text: string }> }>({
      kind: 'search',
      query: 'redacted',
      k: 5,
    });
    expect(search.ok).toBe(true);
    if (!search.ok) return;
    expect(search.data.hits).toHaveLength(1);
    expect(search.data.hits[0]!.text).toContain('redacted');
  });

  it('persists capture frames to the WAL on disk', async () => {
    db = new Database(dbPath);
    const storage = await Storage.init(db);
    wal = new WAL(walPath);
    wal.open();
    server = startServer({ storage, wal, socketPath, cwd: dir });
    await waitFor(() => existsSync(socketPath));

    const client = new MemoryClient({ socketPath });
    await client.send({ kind: 'capture', sessionId: 's', tool: 'Bash', payload: { cmd: 'ls' } });

    const replay = WAL.replay(walPath);
    expect(replay).toHaveLength(1);
    expect(replay[0]!.tool).toBe('Bash');
  });

  it('serves the summaries RPC kind with the latest summaries first', async () => {
    db = new Database(dbPath);
    const storage = await Storage.init(db);
    wal = new WAL(walPath);
    wal.open();
    server = startServer({ storage, wal, socketPath, cwd: dir });
    await waitFor(() => existsSync(socketPath));

    for (let i = 0; i < 4; i++) {
      const eid = await storage.recordEvent({ ts: i, sessionId: 's', tool: 'R', payload: { i } });
      await storage.recordSummary({
        eventId: eid, ts: i, model: 'haiku', promptHash: 'p', text: `summary-${i}`,
        tokensIn: 1, tokensOut: 1, confidence: 0.9,
      });
    }
    const client = new MemoryClient({ socketPath });
    const r = await client.send<{ summaries: Array<{ id: number; text: string }> }>({
      kind: 'summaries',
      limit: 3,
    });
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(r.data.summaries).toHaveLength(3);
    expect(r.data.summaries[0]!.text).toBe('summary-3');
    expect(r.data.summaries[2]!.text).toBe('summary-1');
  });

  it('rejects unknown request kinds with an explicit error', async () => {
    db = new Database(dbPath);
    const storage = await Storage.init(db);
    wal = new WAL(walPath);
    wal.open();
    server = startServer({ storage, wal, socketPath, cwd: dir });
    await waitFor(() => existsSync(socketPath));

    const client = new MemoryClient({ socketPath });
    // Cast to bypass the request union; the daemon should still respond cleanly.
    const r = await client.send({ kind: 'definitely-not-a-kind' } as unknown as { kind: 'ping' });
    expect(r.ok).toBe(false);
    if (!r.ok) {
      expect(r.error).toContain('unknown request kind');
    }
  });

  it('replays WAL entries on Storage boot when the SQLite row is missing', async () => {
    // Write a frame directly to the WAL without persisting an event row, simulating a crash
    // between fsync and sqlite write.
    wal = new WAL(walPath);
    wal.open();
    wal.append({
      ts: 1234,
      sessionId: 'recovery-sess',
      tool: 'Recover',
      inputHash: 'abc',
      payload: { recovered: true },
    });
    wal.close();

    // Reopen storage and replay (mirroring daemon boot logic).
    const storage2 = await Storage.init(new Database(dbPath));
    const entries = WAL.replay(walPath);
    for (const entry of entries) {
      await storage2.ensureSession(entry.sessionId, dir, entry.ts);
      if (await storage2.hasEvent(entry.sessionId, entry.inputHash)) continue;
      await storage2.recordEvent({
        ts: entry.ts,
        sessionId: entry.sessionId,
        tool: entry.tool,
        payload: entry.payload,
      });
    }
    const counts = await storage2.counts();
    expect(counts.events).toBe(1);
    await storage2.close();
  });

  it('supports timeline retrieval over real summaries', async () => {
    db = new Database(dbPath);
    const storage = await Storage.init(db);
    wal = new WAL(walPath);
    wal.open();
    server = startServer({ storage, wal, socketPath, cwd: dir });
    await waitFor(() => existsSync(socketPath));

    for (let i = 0; i < 5; i++) {
      const eid = await storage.recordEvent({ ts: i, sessionId: 's', tool: 'R', payload: { i } });
      await storage.recordSummary({
        eventId: eid, ts: i, model: 'm', promptHash: 'p',
        text: `step-${i}`, tokensIn: null, tokensOut: null, confidence: null,
      });
    }
    const client = new MemoryClient({ socketPath });
    const r = await client.send<{ rows: Array<{ id: number }> }>({ kind: 'timeline', nearId: 3, window: 1 });
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(r.data.rows.map(x => x.id)).toEqual([2, 3, 4]);
  });
});

async function waitFor(pred: () => boolean, timeoutMs = 1000): Promise<void> {
  const start = Date.now();
  while (!pred()) {
    if (Date.now() - start > timeoutMs) throw new Error('waitFor: timeout');
    await new Promise(r => setTimeout(r, 10));
  }
}
