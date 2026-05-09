import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import Database from 'better-sqlite3';
import { Storage } from '../storage/storage.js';
import { RegexSymbolExtractor } from '../symbols.js';
import { SymbolWorker } from './symbol-worker.js';

let dir: string;
let db: Database.Database;
let storage: Storage;

beforeEach(async () => {
  dir = mkdtempSync(join(tmpdir(), 'sym-'));
  db = new Database(join(dir, 'd.sqlite'));
  storage = await Storage.init(db);
});

afterEach(() => {
  try { db.close(); } catch { /* ignore */ }
  rmSync(dir, { recursive: true, force: true, maxRetries: 5, retryDelay: 100 });
});

describe('SymbolWorker', () => {
  it('annotates pending events whose payload references a code path', async () => {
    const eid = await storage.recordEvent({
      ts: 1, sessionId: 's', tool: 'Write',
      payload: { tool_input: { file_path: '/repo/auth.ts', content: 'export function login() {}\nexport class Auth {}' } },
    });
    expect(await storage.getEventSymbols(eid)).toBeNull();

    const worker = new SymbolWorker(storage, { syncExtractor: new RegexSymbolExtractor() });
    const r = await worker.tick();
    expect(r.scanned).toBe(1);
    expect(r.annotated).toBe(1);
    const symbols = await storage.getEventSymbols(eid);
    expect(symbols).toEqual(expect.arrayContaining(['function:login', 'class:Auth']));
  });

  it('marks non-code events as annotated with an empty array (no re-pickup)', async () => {
    const eid = await storage.recordEvent({
      ts: 1, sessionId: 's', tool: 'Bash',
      payload: { tool_input: { command: 'ls' } },
    });
    const worker = new SymbolWorker(storage, { syncExtractor: new RegexSymbolExtractor() });
    await worker.tick();
    expect(await storage.getEventSymbols(eid)).toEqual([]);
    // Second tick should not re-process the same event.
    const r = await worker.tick();
    expect(r.scanned).toBe(0);
  });

  it('uses async extractor when provided, overriding the sync one', async () => {
    await storage.recordEvent({
      ts: 1, sessionId: 's', tool: 'Write',
      payload: { tool_input: { file_path: '/x.ts', content: 'export function x() {}' } },
    });
    const asyncStub = {
      extract: async () => [{ kind: 'function' as const, name: 'fromCdg' }, { kind: 'class' as const, name: 'Async' }],
    };
    const worker = new SymbolWorker(storage, {
      syncExtractor: new RegexSymbolExtractor(),
      asyncExtractor: asyncStub,
    });
    await worker.tick();
    const all = await storage.eventsNeedingSymbols(10);
    expect(all).toHaveLength(0);
    const ev = await storage.getEvent(1);
    const sym = await storage.getEventSymbols(ev!.id);
    expect(sym).toEqual(['function:fromCdg', 'class:Async']);
  });

  it('fails open when the extractor throws (event still flagged as processed)', async () => {
    const eid = await storage.recordEvent({
      ts: 1, sessionId: 's', tool: 'Write',
      payload: { tool_input: { file_path: '/x.ts', content: 'export function x() {}' } },
    });
    const broken = { extract: async () => { throw new Error('cdg unavailable'); } };
    const worker = new SymbolWorker(storage, { asyncExtractor: broken });
    const r = await worker.tick();
    expect(r.skipped).toBe(1);
    expect(await storage.getEventSymbols(eid)).toEqual([]);
  });

  it('start / stop lifecycle is idempotent', () => {
    const w = new SymbolWorker(storage, { intervalMs: 99999 });
    w.start();
    expect(w.getState()).toBe('running');
    w.start();
    expect(w.getState()).toBe('running');
    w.stop();
    expect(w.getState()).toBe('stopped');
  });
});
