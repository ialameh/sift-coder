import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { buildHandler } from './server.js';
import { Storage, type DBHandle } from '../storage/storage.js';
import { WAL } from './wal.js';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import type { ModelClient, ModelRequest, ModelResult } from './summarizer.js';
import { Summarizer } from './summarizer.js';

class FakeDB implements DBHandle {
  events: Array<Record<string, unknown>> = [];
  summaries: Array<Record<string, unknown>> = [];
  ftsRows: Array<{ id: number; text: string; ts: number; event_id: number }> = [];
  sessions: Array<Record<string, unknown>> = [];
  cache = new Map<string, unknown>();
  private nextEventId = 1;
  private nextSummaryId = 1;

  exec(): void { /* noop */ }
  loadExtension(): void { throw new Error('no'); }
  prepare(sql: string) {
    const stmt = sql.trim();
    if (stmt.startsWith('INSERT OR IGNORE INTO sessions')) {
      return {
        run: (id: unknown, ts: unknown, cwd: unknown) => {
          if (!this.sessions.find(s => s['id'] === id)) this.sessions.push({ id, started_at: ts, cwd });
          return { lastInsertRowid: 0 };
        },
        get: () => undefined, all: () => [],
      };
    }
    if (stmt.startsWith('INSERT INTO events')) {
      return {
        run: (ts: unknown, sid: unknown, tool: unknown, hash: unknown, payload: unknown) => {
          const id = this.nextEventId++;
          this.events.push({ id, ts, session_id: sid, tool, input_hash: hash, payload_json: payload, status: 'raw' });
          return { lastInsertRowid: id };
        },
        get: () => undefined, all: () => [],
      };
    }
    if (stmt.includes('summaries_fts MATCH')) {
      return {
        run: () => ({ lastInsertRowid: 0 }),
        get: () => undefined,
        all: (q: unknown, k: unknown) => this.ftsRows
          .filter(r => r.text.toLowerCase().includes(String(q).toLowerCase()))
          .slice(0, k as number)
          .map(r => ({ id: r.id, event_id: r.event_id, text: r.text, ts: r.ts, score: -1 })),
      };
    }
    if (stmt.includes('FROM summaries\n         WHERE id BETWEEN')) {
      return {
        run: () => ({ lastInsertRowid: 0 }),
        get: () => undefined,
        all: (lo: unknown, hi: unknown) => this.summaries.filter(s =>
          (s['id'] as number) >= (lo as number) && (s['id'] as number) <= (hi as number)),
      };
    }
    if (stmt.includes('FROM summaries WHERE id IN')) {
      return {
        run: () => ({ lastInsertRowid: 0 }),
        get: () => undefined,
        all: (...ids: unknown[]) => this.summaries.filter(s => ids.includes(s['id'])),
      };
    }
    if (stmt.startsWith('INSERT INTO summaries')) {
      return {
        run: (eid: unknown, ts: unknown, model: unknown, ph: unknown, text: unknown) => {
          const id = this.nextSummaryId++;
          this.summaries.push({ id, event_id: eid, ts, model, prompt_hash: ph, text });
          this.ftsRows.push({ id, text: text as string, ts: ts as number, event_id: eid as number });
          return { lastInsertRowid: id };
        },
        get: () => undefined, all: () => [],
      };
    }
    if (stmt.includes("WHERE status = 'raw'")) {
      return {
        run: () => ({ lastInsertRowid: 0 }),
        get: () => undefined,
        all: (limit: unknown) => this.events.filter(e => e['status'] === 'raw').slice(0, limit as number),
      };
    }
    if (stmt.startsWith('UPDATE events SET status')) {
      return {
        run: (status: unknown, id: unknown) => {
          const e = this.events.find(x => x['id'] === id);
          if (e) e['status'] = status;
          return { lastInsertRowid: 0 };
        },
        get: () => undefined, all: () => [],
      };
    }
    if (stmt.startsWith('SELECT text, tokens_in, tokens_out FROM summary_cache')) {
      return {
        run: () => ({ lastInsertRowid: 0 }),
        get: (k: unknown) => this.cache.get(k as string),
        all: () => [],
      };
    }
    if (stmt.startsWith('INSERT OR REPLACE INTO summary_cache')) {
      return {
        run: (k: unknown, t: unknown, ti: unknown, to: unknown) => {
          this.cache.set(k as string, { text: t as string, tokens_in: ti as number | null, tokens_out: to as number | null });
          return { lastInsertRowid: 0 };
        },
        get: () => undefined, all: () => [],
      };
    }
    if (stmt.startsWith('INSERT OR REPLACE INTO summary_embeddings')) {
      return {
        run: () => ({ lastInsertRowid: 0 }),
        get: () => undefined, all: () => [],
      };
    }
    return { run: () => ({ lastInsertRowid: 0 }), get: () => undefined, all: () => [] };
  }
}

class FakeSummarizer implements ModelClient {
  scripted: ModelResult[] = [];
  shouldThrow = false;
  async generate(_req: ModelRequest): Promise<ModelResult> {
    if (this.shouldThrow) throw new Error('model error');
    return this.scripted.shift() ?? { text: '{"text":"x","confidence":0.9}', tokensIn: null, tokensOut: null };
  }
}

let db: FakeDB;
let storage: Storage;
let wal: WAL;
let walDir: string;
beforeEach(() => {
  db = new FakeDB();
  storage = new Storage(db);
  walDir = mkdtempSync(join(tmpdir(), 'srv-wal-'));
  wal = new WAL(join(walDir, 'wal.ndjson'));
  wal.open();
});
afterEach(() => {
  // Close the WAL fd before removing the directory — open handles block rmdir on Windows.
  try { wal.close(); } catch { /* already closed */ }
  try { rmSync(walDir, { recursive: true, force: true }); } catch { /* ignore */ }
});

describe('buildHandler', () => {
  it('responds to ping', async () => {
    const h = buildHandler({ storage, wal, cwd: '/x' });
    const r = await h({ kind: 'ping' });
    expect(r).toEqual({ ok: true, data: { pong: true } });
  });

  it('captures an event, redacting secrets and persisting an event id', async () => {
    const h = buildHandler({ storage, wal, cwd: '/x' });
    const r = await h({ kind: 'capture', sessionId: 's', tool: 'Read', payload: { token: 'AKIAABCDEFGHIJKLMNOP' } });
    expect(r.ok).toBe(true);
    expect(db.events).toHaveLength(1);
    expect(JSON.parse(db.events[0]!['payload_json'] as string).token).toBe('[REDACTED:aws]');
  });

  it('supplies its own ts when not provided', async () => {
    const h = buildHandler({ storage, wal, cwd: '/x' });
    const r = await h({ kind: 'capture', sessionId: 's', tool: 'Bash', payload: { cmd: 'ls' } });
    expect(r.ok).toBe(true);
    expect(typeof db.events[0]!['ts']).toBe('number');
  });

  it('returns search hits when summaries match', async () => {
    db.summaries.push({ id: 1, event_id: 1 });
    db.ftsRows.push({ id: 1, text: 'hello world', ts: 0, event_id: 1 });
    const h = buildHandler({ storage, wal, cwd: '/x' });
    const r = await h({ kind: 'search', query: 'hello' }) as { ok: true; data: { hits: unknown[] } };
    expect(r.ok).toBe(true);
    expect((r.data.hits as unknown[]).length).toBe(1);
  });

  it('uses default window when none provided', async () => {
    db.summaries.push({ id: 1, event_id: 1, ts: 1, model: 'm', prompt_hash: 'p', text: 't', tokens_in: null, tokens_out: null, confidence: null });
    const h = buildHandler({ storage, wal, cwd: '/x' });
    const r = await h({ kind: 'timeline', nearId: 1 }) as { ok: true; data: { rows: unknown[] } };
    expect(r.ok).toBe(true);
    expect(r.data.rows).toHaveLength(1);
  });

  it('uses default k when search is invoked without k', async () => {
    db.summaries.push({ id: 1, event_id: 1 });
    db.ftsRows.push({ id: 1, text: 'alpha', ts: 0, event_id: 1 });
    const h = buildHandler({ storage, wal, cwd: '/x' });
    const r = await h({ kind: 'search', query: 'alpha' }) as { ok: true; data: { hits: unknown[] } };
    expect(r.ok).toBe(true);
    expect(r.data.hits).toHaveLength(1);
  });

  it('returns timeline rows around a near id', async () => {
    db.summaries.push({ id: 1, event_id: 1, ts: 1, model: 'm', prompt_hash: 'p', text: 't1', tokens_in: null, tokens_out: null, confidence: null });
    db.summaries.push({ id: 2, event_id: 1, ts: 2, model: 'm', prompt_hash: 'p', text: 't2', tokens_in: null, tokens_out: null, confidence: null });
    const h = buildHandler({ storage, wal, cwd: '/x' });
    const r = await h({ kind: 'timeline', nearId: 1, window: 1 }) as { ok: true; data: { rows: unknown[] } };
    expect(r.ok).toBe(true);
    expect(r.data.rows).toHaveLength(2);
  });

  it('returns rows by id list via get', async () => {
    db.summaries.push({ id: 5, event_id: 1, ts: 1, model: 'm', prompt_hash: 'p', text: 'x', tokens_in: null, tokens_out: null, confidence: null });
    const h = buildHandler({ storage, wal, cwd: '/x' });
    const r = await h({ kind: 'get', ids: [5] }) as { ok: true; data: { rows: unknown[] } };
    expect(r.ok).toBe(true);
    expect(r.data.rows).toHaveLength(1);
  });

  it('invokes onShutdown for shutdown requests', async () => {
    let stopped = false;
    const h = buildHandler({ storage, wal, cwd: '/x', onShutdown: () => { stopped = true; } });
    const r = await h({ kind: 'shutdown' });
    expect(r.ok).toBe(true);
    expect(stopped).toBe(true);
  });

  it('handles shutdown without an onShutdown handler', async () => {
    const h = buildHandler({ storage, wal, cwd: '/x' });
    const r = await h({ kind: 'shutdown' });
    expect(r.ok).toBe(true);
  });

  it('returns ok:false when an error is thrown internally', async () => {
    const broken = {
      vecEnabled: false,
      ensureSession: () => { throw new Error('boom'); },
      recordEvent: () => 1,
    } as unknown as Storage;
    const h = buildHandler({ storage: broken, wal, cwd: '/x' });
    const r = await h({ kind: 'capture', sessionId: 's', tool: 'Read', payload: {} });
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.error).toBe('boom');
  });

  it('extracts code symbols from tool payloads when path looks like code', async () => {
    const h = buildHandler({ storage, wal, cwd: '/x' });
    const r = await h({
      kind: 'capture', sessionId: 's', tool: 'Write',
      payload: {
        tool_input: { file_path: '/repo/auth.ts', content: 'export function login() {}\nexport class Auth {}' },
      },
    });
    expect(r.ok).toBe(true);
    const stored = JSON.parse(db.events[0]!['payload_json'] as string) as { symbols?: string[] };
    expect(stored.symbols).toEqual(expect.arrayContaining(['function:login', 'class:Auth']));
  });

  it('skips symbol extraction for non-code paths', async () => {
    const h = buildHandler({ storage, wal, cwd: '/x' });
    await h({
      kind: 'capture', sessionId: 's', tool: 'Write',
      payload: { tool_input: { file_path: '/repo/README.md', content: 'function login() {}' } },
    });
    const stored = JSON.parse(db.events[0]!['payload_json'] as string) as { symbols?: string[] };
    expect(stored.symbols).toBeUndefined();
  });

  it('honors a null symbol extractor (extraction disabled)', async () => {
    const h = buildHandler({ storage, wal, cwd: '/x', symbols: null });
    await h({
      kind: 'capture', sessionId: 's', tool: 'Write',
      payload: { tool_input: { file_path: '/repo/auth.ts', content: 'export function x() {}' } },
    });
    const stored = JSON.parse(db.events[0]!['payload_json'] as string) as { symbols?: string[] };
    expect(stored.symbols).toBeUndefined();
  });

  it('falls back gracefully when payload has no tool_input', async () => {
    const h = buildHandler({ storage, wal, cwd: '/x' });
    const r = await h({ kind: 'capture', sessionId: 's', tool: 'Bash', payload: { cmd: 'ls' } });
    expect(r.ok).toBe(true);
  });

  it('falls back when tool_input has no recognizable code field', async () => {
    const h = buildHandler({ storage, wal, cwd: '/x' });
    const r = await h({
      kind: 'capture', sessionId: 's', tool: 'Write',
      payload: { tool_input: { file_path: '/x.ts' } },
    });
    expect(r.ok).toBe(true);
  });

  it('falls back when extracted code yields no symbols', async () => {
    const h = buildHandler({ storage, wal, cwd: '/x' });
    const r = await h({
      kind: 'capture', sessionId: 's', tool: 'Write',
      payload: { tool_input: { file_path: '/x.ts', content: 'const a = 1;' } },
    });
    expect(r.ok).toBe(true);
    const stored = JSON.parse(db.events[0]!['payload_json'] as string) as { symbols?: string[] };
    expect(stored.symbols).toBeUndefined();
  });

  it('uses asyncSymbols extractor when provided, overriding the sync extractor', async () => {
    const asyncStub = {
      async extract() {
        return [
          { kind: 'function' as const, name: 'fromCdg' },
          { kind: 'class' as const, name: 'Async' },
        ];
      },
    };
    const h = buildHandler({ storage, wal, cwd: '/x', asyncSymbols: asyncStub });
    await h({
      kind: 'capture', sessionId: 's', tool: 'Write',
      payload: { tool_input: { file_path: '/x.ts', content: 'export function x() {}' } },
    });
    const stored = JSON.parse(db.events[0]!['payload_json'] as string) as { symbols?: string[] };
    expect(stored.symbols).toEqual(['function:fromCdg', 'class:Async']);
  });

  it('asyncSymbols falls through when path is not code', async () => {
    let called = false;
    const asyncStub = {
      async extract() { called = true; return []; },
    };
    const h = buildHandler({ storage, wal, cwd: '/x', asyncSymbols: asyncStub });
    await h({
      kind: 'capture', sessionId: 's', tool: 'Write',
      payload: { tool_input: { file_path: '/README.md', content: 'function x() {}' } },
    });
    expect(called).toBe(false);
  });

  it('asyncSymbols returning [] leaves payload unannotated', async () => {
    const asyncStub = { async extract() { return []; } };
    const h = buildHandler({ storage, wal, cwd: '/x', asyncSymbols: asyncStub });
    await h({
      kind: 'capture', sessionId: 's', tool: 'Write',
      payload: { tool_input: { file_path: '/x.ts', content: 'export const a = 1' } },
    });
    const stored = JSON.parse(db.events[0]!['payload_json'] as string) as { symbols?: string[] };
    expect(stored.symbols).toBeUndefined();
  });

  it('extracts symbols when path is provided via tool_input.path', async () => {
    const h = buildHandler({ storage, wal, cwd: '/x' });
    await h({
      kind: 'capture', sessionId: 's', tool: 'Write',
      payload: { tool_input: { path: '/x.py', content: 'def f(): pass' } },
    });
    const stored = JSON.parse(db.events[0]!['payload_json'] as string) as { symbols?: string[] };
    expect(stored.symbols).toEqual(expect.arrayContaining(['function:f']));
  });

  it('extracts symbols when path is provided via tool_input.notebook_path', async () => {
    const h = buildHandler({ storage, wal, cwd: '/x' });
    await h({
      kind: 'capture', sessionId: 's', tool: 'Write',
      payload: { tool_input: { notebook_path: '/x.py', file_text: 'def g(): pass' } },
    });
    const stored = JSON.parse(db.events[0]!['payload_json'] as string) as { symbols?: string[] };
    expect(stored.symbols).toEqual(expect.arrayContaining(['function:g']));
  });

  it('handles a non-object payload without throwing', async () => {
    const h = buildHandler({ storage, wal, cwd: '/x' });
    const r = await h({ kind: 'capture', sessionId: 's', tool: 'Bash', payload: 'plain string' });
    expect(r.ok).toBe(true);
  });

  it('coerces non-Error throws into a string error', async () => {
    const broken = {
      vecEnabled: false,
      ensureSession: () => { throw 'plain'; },
      recordEvent: () => 1,
    } as unknown as Storage;
    const h = buildHandler({ storage: broken, wal, cwd: '/x' });
    const r = await h({ kind: 'capture', sessionId: 's', tool: 'Read', payload: {} });
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.error).toBe('plain');
  });

  it('drain returns ok:false when no summarizer is configured', async () => {
    const h = buildHandler({ storage, wal, cwd: '/x' });
    const r = await h({ kind: 'drain', batch: 4 });
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.error).toMatch(/no summarizer/);
  });

  it('drain processes pending events and returns counts', async () => {
    const client = new FakeSummarizer();
    const summarizer = new Summarizer(storage, client);
    const h = buildHandler({ storage, wal, cwd: '/x', summarizer, drainBackend: 'test' });
    await h({ kind: 'capture', sessionId: 's', tool: 'Read', payload: { x: 1 } });
    const r = await h({ kind: 'drain', batch: 4 }) as { ok: true; data: { processed: number; errors: number; backend: string } };
    expect(r.ok).toBe(true);
    expect(r.data.processed).toBe(1);
    expect(r.data.errors).toBe(0);
    expect(r.data.backend).toBe('test');
    expect(db.events[0]!['status']).toBe('summarized');
  });

  it('drain marks events skipped when summarizer throws', async () => {
    const client = new FakeSummarizer();
    client.shouldThrow = true;
    const summarizer = new Summarizer(storage, client);
    const h = buildHandler({ storage, wal, cwd: '/x', summarizer });
    await h({ kind: 'capture', sessionId: 's', tool: 'Read', payload: {} });
    const r = await h({ kind: 'drain', batch: 4 }) as { ok: true; data: { errors: number; firstError?: string } };
    expect(r.ok).toBe(true);
    expect(r.data.errors).toBe(1);
    expect(r.data.firstError).toBe('model error');
    expect(db.events[0]!['status']).toBe('skipped');
  });

  it('drain uses default batch when not specified', async () => {
    const client = new FakeSummarizer();
    const summarizer = new Summarizer(storage, client);
    const h = buildHandler({ storage, wal, cwd: '/x', summarizer, drainBatch: 2 });
    await h({ kind: 'drain' });
    expect(db.events).toHaveLength(0);
  });

  it('why returns empty edges when no provenance store', async () => {
    const h = buildHandler({ storage, wal, cwd: '/x' });
    const r = await h({ kind: 'why', nodeKind: 'summary', nodeId: '1' }) as { ok: true; data: { edges: unknown[] } };
    expect(r.ok).toBe(true);
    expect(r.data.edges).toEqual([]);
  });

  it('why returns edges from the provenance store', async () => {
    const fakeProv = {
      trace: (node: { kind: string; id: string }, depth: number) => {
        return depth > 0 ? [{ id: 1, from: node, to: { kind: 'b', id: '2' }, edgeType: 'causes' }] : [];
      },
    };
    const h = buildHandler({
      storage, wal, cwd: '/x',
      provenance: fakeProv as unknown as Parameters<typeof buildHandler>[0]['provenance'],
    });
    const r = await h({ kind: 'why', nodeKind: 'summary', nodeId: '1', depth: 2 }) as { ok: true; data: { edges: unknown[] } };
    expect(r.ok).toBe(true);
    expect(r.data.edges).toHaveLength(1);
  });
});
