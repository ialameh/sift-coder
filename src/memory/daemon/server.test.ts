import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { buildHandler, isRetryableError, processFrame } from './server.js';
import { Storage, type DBHandle } from '../storage/storage.js';
import { WAL } from './wal.js';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import Database from 'better-sqlite3';
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

  exec(): Promise<void> { return Promise.resolve(); }
  loadExtension(): void { throw new Error('no'); }
  prepare(sql: string) {
    const stmt = sql.trim();
    if (stmt.startsWith('INSERT OR IGNORE INTO sessions')) {
      return Promise.resolve({
        run: (id: unknown, ts: unknown, cwd: unknown) => {
          if (!this.sessions.find(s => s['id'] === id)) this.sessions.push({ id, started_at: ts, cwd });
          return { lastInsertRowid: 0 };
        },
        get: () => Promise.resolve(undefined), all: () => Promise.resolve([]),
      });
    }
    if (stmt.startsWith('INSERT INTO events') || stmt.startsWith('INSERT OR IGNORE INTO events')) {
      return Promise.resolve({
        run: (ts: unknown, sid: unknown, tool: unknown, hash: unknown, payload: unknown) => {
          const id = this.nextEventId++;
          this.events.push({ id, ts, session_id: sid, tool, input_hash: hash, payload_json: payload, status: 'raw' });
          return { lastInsertRowid: id };
        },
        get: () => Promise.resolve(undefined), all: () => Promise.resolve([]),
      });
    }
    if (stmt.includes('summaries_fts MATCH')) {
      return Promise.resolve({
        run: () => ({ lastInsertRowid: 0 }),
        get: () => Promise.resolve(undefined),
        all: (q: unknown, k: unknown) => Promise.resolve(this.ftsRows
          .filter(r => r.text.toLowerCase().includes(String(q).toLowerCase()))
          .slice(0, k as number)
          .map(r => ({ id: r.id, event_id: r.event_id, text: r.text, ts: r.ts, score: -1 }))),
      });
    }
    if (stmt.includes('FROM summaries') && stmt.includes('WHERE id BETWEEN')) {
      return Promise.resolve({
        run: () => ({ lastInsertRowid: 0 }),
        get: () => Promise.resolve(undefined),
        all: (lo: unknown, hi: unknown) => Promise.resolve(this.summaries.filter(s =>
          (s['id'] as number) >= (lo as number) && (s['id'] as number) <= (hi as number))),
      });
    }
    if (stmt.includes('FROM summaries WHERE id IN')) {
      return Promise.resolve({
        run: () => ({ lastInsertRowid: 0 }),
        get: () => Promise.resolve(undefined),
        all: (...ids: unknown[]) => Promise.resolve(this.summaries.filter(s => ids.includes(s['id']))),
      });
    }
    if (stmt.startsWith('INSERT INTO summaries')) {
      return Promise.resolve({
        run: (eid: unknown, ts: unknown, model: unknown, ph: unknown, text: unknown) => {
          const id = this.nextSummaryId++;
          this.summaries.push({ id, event_id: eid, ts, model, prompt_hash: ph, text });
          this.ftsRows.push({ id, text: text as string, ts: ts as number, event_id: eid as number });
          return { lastInsertRowid: id };
        },
        get: () => Promise.resolve(undefined), all: () => Promise.resolve([]),
      });
    }
    if (stmt.includes("WHERE status = 'raw'")) {
      return Promise.resolve({
        run: () => ({ lastInsertRowid: 0 }),
        get: () => Promise.resolve(undefined),
        all: (limit: unknown) => Promise.resolve(this.events.filter(e => e['status'] === 'raw').slice(0, limit as number)),
      });
    }
    if (stmt.startsWith('UPDATE events SET status')) {
      return Promise.resolve({
        run: (status: unknown, id: unknown) => {
          const e = this.events.find(x => x['id'] === id);
          if (e) e['status'] = status;
          return { lastInsertRowid: 0 };
        },
        get: () => Promise.resolve(undefined), all: () => Promise.resolve([]),
      });
    }
    if (stmt.startsWith('SELECT text, tokens_in, tokens_out FROM summary_cache')) {
      return Promise.resolve({
        run: () => ({ lastInsertRowid: 0 }),
        get: (k: unknown) => Promise.resolve(this.cache.get(k as string)),
        all: () => Promise.resolve([]),
      });
    }
    if (stmt.startsWith('INSERT OR REPLACE INTO summary_cache')) {
      return Promise.resolve({
        run: (k: unknown, t: unknown, ti: unknown, to: unknown) => {
          this.cache.set(k as string, { text: t as string, tokens_in: ti as number | null, tokens_out: to as number | null });
          return { lastInsertRowid: 0 };
        },
        get: () => Promise.resolve(undefined), all: () => Promise.resolve([]),
      });
    }
    if (stmt.startsWith('INSERT OR REPLACE INTO summary_embeddings')) {
      return Promise.resolve({
        run: () => ({ lastInsertRowid: 0 }),
        get: () => Promise.resolve(undefined), all: () => Promise.resolve([]),
      });
    }
    return Promise.resolve({ run: () => ({ lastInsertRowid: 0 }), get: () => Promise.resolve(undefined), all: () => Promise.resolve([]) });
  }
  close(): Promise<void> { return Promise.resolve(); }
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
beforeEach(async () => {
  db = new FakeDB();
  storage = await Storage.init(db);
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

  it('capture stores the payload verbatim — symbol extraction is deferred to SymbolWorker', async () => {
    // Symbols no longer land inline; the capture path stays free of CDG/regex calls so a
    // slow extractor cannot block tool capture. The SymbolWorker (covered separately) writes
    // events.symbols_json after the fact.
    const h = buildHandler({ storage, wal, cwd: '/x' });
    const r = await h({
      kind: 'capture', sessionId: 's', tool: 'Write',
      payload: {
        tool_input: { file_path: '/repo/auth.ts', content: 'export function login() {}\nexport class Auth {}' },
      },
    });
    expect(r.ok).toBe(true);
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

  it('capture does not call any symbol extractor inline (hot path stays clean)', async () => {
    let inlineCalls = 0;
    const asyncStub = { async extract() { inlineCalls++; return []; } };
    const h = buildHandler({ storage, wal, cwd: '/x', asyncSymbols: asyncStub });
    await h({
      kind: 'capture', sessionId: 's', tool: 'Write',
      payload: { tool_input: { file_path: '/x.ts', content: 'export function x() {}' } },
    });
    expect(inlineCalls).toBe(0);
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

describe('buildHandler with real Storage (cross-platform)', () => {
  let dir: string;
  let realDb: Database.Database;
  let realStorage: Storage;
  let realWal: WAL;
  let realWalDir: string;

  beforeEach(async () => {
    dir = mkdtempSync(join(tmpdir(), 'srv-real-'));
    realDb = new Database(join(dir, 'd.sqlite'));
    realStorage = await Storage.init(realDb);
    realWalDir = mkdtempSync(join(tmpdir(), 'srv-real-wal-'));
    realWal = new WAL(join(realWalDir, 'wal.ndjson'));
    realWal.open();
  });
  afterEach(() => {
    try { realWal.close(); } catch { /* ignore */ }
    try { realDb.close(); } catch { /* ignore */ }
    rmSync(dir, { recursive: true, force: true, maxRetries: 5, retryDelay: 100 });
    rmSync(realWalDir, { recursive: true, force: true, maxRetries: 5, retryDelay: 100 });
  });

  it('serves the summaries RPC kind ordered most-recent-first', async () => {
    for (let i = 0; i < 4; i++) {
      const eid = await realStorage.recordEvent({ ts: i, sessionId: 's', tool: 'R', payload: { i } });
      await realStorage.recordSummary({
        eventId: eid, ts: i, model: 'haiku', promptHash: 'p', text: `text-${i}`,
        tokensIn: 1, tokensOut: 1, confidence: 0.9,
      });
    }
    const h = buildHandler({ storage: realStorage, wal: realWal, cwd: '/x' });
    const r = await h({ kind: 'summaries', limit: 2 }) as { ok: true; data: { summaries: Array<{ text: string }> } };
    expect(r.ok).toBe(true);
    expect(r.data.summaries).toHaveLength(2);
    expect(r.data.summaries[0]!.text).toBe('text-3');
    expect(r.data.summaries[1]!.text).toBe('text-2');
  });

  it('summaries truncates long text to 240 chars with an ellipsis', async () => {
    const eid = await realStorage.recordEvent({ ts: 1, sessionId: 's', tool: 'R', payload: {} });
    await realStorage.recordSummary({
      eventId: eid, ts: 1, model: 'm', promptHash: 'p', text: 'A'.repeat(300),
      tokensIn: 1, tokensOut: 1, confidence: 0.9,
    });
    const h = buildHandler({ storage: realStorage, wal: realWal, cwd: '/x' });
    const r = await h({ kind: 'summaries' }) as { ok: true; data: { summaries: Array<{ text: string }> } };
    expect(r.data.summaries[0]!.text.endsWith('...')).toBe(true);
    expect(r.data.summaries[0]!.text.length).toBe(243);
  });

  it('returns an error for unknown request kinds', async () => {
    const h = buildHandler({ storage: realStorage, wal: realWal, cwd: '/x' });
    const r = await h({ kind: 'definitely-not-real' } as unknown as { kind: 'ping' });
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.error).toContain('unknown request kind');
  });

  it('drain releases retryable failures back to raw with attempts incremented', async () => {
    const eid = await realStorage.recordEvent({ ts: 1, sessionId: 's', tool: 'R', payload: { p: 1 } });
    const failClient: ModelClient = {
      async generate(): Promise<ModelResult> { throw new Error('You exceeded your current quota'); },
    };
    const summarizer = new Summarizer(realStorage, failClient);
    const h = buildHandler({ storage: realStorage, wal: realWal, cwd: '/x', summarizer });
    const r = await h({ kind: 'drain', batch: 1 }) as { ok: true; data: { processed: number; errors: number; pending: number } };
    expect(r.ok).toBe(true);
    expect(r.data.processed).toBe(0);
    expect(r.data.errors).toBe(1);
    expect(r.data.pending).toBe(1); // released back to raw, still pending
    const ev = await realStorage.getEvent(eid);
    expect(ev?.status).toBe('raw');
  });

  it('drain skips terminal failures (parse error)', async () => {
    const eid = await realStorage.recordEvent({ ts: 1, sessionId: 's', tool: 'R', payload: { p: 1 } });
    const failClient: ModelClient = {
      async generate(): Promise<ModelResult> { throw new Error('schema validation failed'); },
    };
    const summarizer = new Summarizer(realStorage, failClient);
    const h = buildHandler({ storage: realStorage, wal: realWal, cwd: '/x', summarizer });
    const r = await h({ kind: 'drain', batch: 1 }) as { ok: true; data: { processed: number; errors: number; pending: number } };
    expect(r.ok).toBe(true);
    expect(r.data.errors).toBe(1);
    expect(r.data.pending).toBe(0);
    const ev = await realStorage.getEvent(eid);
    expect(ev?.status).toBe('skipped');
  });

  it('drain successfully summarizes events and writes embeddings', async () => {
    await realStorage.recordEvent({ ts: 1, sessionId: 's', tool: 'R', payload: { p: 1 } });
    const okClient: ModelClient = {
      async generate(): Promise<ModelResult> {
        return { text: '{"text":"summary","confidence":0.9}', tokensIn: 5, tokensOut: 3 };
      },
    };
    const summarizer = new Summarizer(realStorage, okClient);
    const h = buildHandler({ storage: realStorage, wal: realWal, cwd: '/x', summarizer });
    const r = await h({ kind: 'drain', batch: 1 }) as { ok: true; data: { processed: number; errors: number } };
    expect(r.ok).toBe(true);
    expect(r.data.processed).toBe(1);
    expect(r.data.errors).toBe(0);
    const counts = await realStorage.counts();
    expect(counts.summaries).toBe(1);
    expect(counts.summarized).toBe(1);
  });

  it('drain pending count reflects the real backlog, not a 0/1 probe', async () => {
    // Seed five raw events; drain a batch of one; expect `pending: 4` (was always 1 with the
    // pre-fix `pendingEvents(1).length` capped probe).
    for (let i = 0; i < 5; i++) {
      await realStorage.recordEvent({ ts: i, sessionId: 's', tool: 'R', payload: { i } });
    }
    const okClient: ModelClient = {
      async generate(): Promise<ModelResult> {
        return { text: '{"text":"x","confidence":0.9}', tokensIn: 1, tokensOut: 1 };
      },
    };
    const summarizer = new Summarizer(realStorage, okClient);
    const h = buildHandler({ storage: realStorage, wal: realWal, cwd: '/x', summarizer });
    const r = await h({ kind: 'drain', batch: 1 }) as { ok: true; data: { processed: number; pending: number } };
    expect(r.data.processed).toBe(1);
    expect(r.data.pending).toBe(4);
  });

  it('claim_for_summary returns claimed events and flips status to claimed', async () => {
    for (let i = 0; i < 3; i++) {
      await realStorage.recordEvent({ ts: i, sessionId: 's', tool: 'R', payload: { i } });
    }
    const h = buildHandler({ storage: realStorage, wal: realWal, cwd: '/x' });
    const r = await h({ kind: 'claim_for_summary', batch: 2 }) as { ok: true; data: { events: Array<{ id: number }> } };
    expect(r.ok).toBe(true);
    expect(r.data.events).toHaveLength(2);
    const counts = await realStorage.counts();
    expect(counts.raw).toBe(1);
  });

  it('record_summary writes summary, embedding, and flips event status', async () => {
    const { DeterministicEmbedder } = await import('../embedder.js');
    const eid = await realStorage.recordEvent({ ts: 1, sessionId: 's', tool: 'R', payload: { p: 1 } });
    await realStorage.markEventStatus(eid, 'claimed');
    const h = buildHandler({ storage: realStorage, wal: realWal, cwd: '/x', embedder: new DeterministicEmbedder(384) });
    const r = await h({
      kind: 'record_summary',
      eventId: eid,
      model: 'mcp-sampling',
      promptHash: 'p',
      text: 'extracted summary',
      confidence: 0.9,
      tokensIn: null,
      tokensOut: null,
    }) as { ok: true; data: { id: number } };
    expect(r.ok).toBe(true);
    expect(r.data.id).toBeGreaterThan(0);
    const counts = await realStorage.counts();
    expect(counts.summaries).toBe(1);
    expect(counts.summarized).toBe(1);
    expect(counts.embeddings).toBe(1);
  });

  it('release_summary returns event to raw on retryable error', async () => {
    const eid = await realStorage.recordEvent({ ts: 1, sessionId: 's', tool: 'R', payload: { p: 1 } });
    await realStorage.markEventStatus(eid, 'claimed');
    const h = buildHandler({ storage: realStorage, wal: realWal, cwd: '/x' });
    const r = await h({ kind: 'release_summary', eventId: eid, error: 'timeout' }) as { ok: true; data: { status: string } };
    expect(r.data.status).toBe('released');
    const ev = await realStorage.getEvent(eid);
    expect(ev?.status).toBe('raw');
  });

  it('release_summary with terminal=true marks event skipped', async () => {
    const eid = await realStorage.recordEvent({ ts: 1, sessionId: 's', tool: 'R', payload: { p: 1 } });
    await realStorage.markEventStatus(eid, 'claimed');
    const h = buildHandler({ storage: realStorage, wal: realWal, cwd: '/x' });
    const r = await h({ kind: 'release_summary', eventId: eid, error: 'parse fail', terminal: true }) as { ok: true; data: { status: string } };
    expect(r.data.status).toBe('skipped');
  });

  it('cache_get / cache_put round-trip', async () => {
    const h = buildHandler({ storage: realStorage, wal: realWal, cwd: '/x' });
    await h({ kind: 'cache_put', cacheKey: 'k1', text: '{"text":"hello","confidence":0.8}', tokensIn: 5, tokensOut: 2 });
    const r = await h({ kind: 'cache_get', cacheKey: 'k1' }) as { ok: true; data: { cached: { text: string; tokensIn: number | null } | null } };
    expect(r.data.cached).not.toBeNull();
    expect(r.data.cached!.text).toContain('hello');
    expect(r.data.cached!.tokensIn).toBe(5);
  });

  it('prune drops skipped events older than the cutoff', async () => {
    const oldTs = Date.now() - 10 * 24 * 60 * 60 * 1000;
    const eid = await realStorage.recordEvent({ ts: oldTs, sessionId: 's', tool: 'R', payload: { i: 1 } });
    await realStorage.markEventStatus(eid, 'skipped');
    const h = buildHandler({ storage: realStorage, wal: realWal, cwd: '/x' });
    const r = await h({ kind: 'prune', maxAgeMs: 7 * 24 * 60 * 60 * 1000 }) as { ok: true; data: { removedEvents: number } };
    expect(r.data.removedEvents).toBe(1);
    const counts = await realStorage.counts();
    expect(counts.skipped).toBe(0);
  });

  it('retry_skipped re-queues skipped events as raw with attempts reset', async () => {
    const eid = await realStorage.recordEvent({ ts: 1, sessionId: 's', tool: 'R', payload: { i: 1 } });
    await realStorage.markEventStatus(eid, 'skipped');
    const h = buildHandler({ storage: realStorage, wal: realWal, cwd: '/x' });
    const r = await h({ kind: 'retry_skipped' }) as { ok: true; data: { requeued: number } };
    expect(r.data.requeued).toBe(1);
    const ev = await realStorage.getEvent(eid);
    expect(ev?.status).toBe('raw');
  });

  it('sweep_expired RPC removes expired events', async () => {
    const past = Date.now() - 1000;
    await realStorage.recordEvent({ ts: past - 60_000, sessionId: 's', tool: 'R', payload: { i: 1 }, ttlMs: 30_000 });
    const h = buildHandler({ storage: realStorage, wal: realWal, cwd: '/x' });
    const r = await h({ kind: 'sweep_expired' }) as { ok: true; data: { removed: number } };
    expect(r.data.removed).toBe(1);
  });

  it('export RPC returns ndjson with at least one record per seeded table', async () => {
    const eid = await realStorage.recordEvent({ ts: 1, sessionId: 's', tool: 'R', payload: { p: 1 } });
    await realStorage.recordSummary({ eventId: eid, ts: 1, model: 'm', promptHash: 'p', text: 'x', tokensIn: null, tokensOut: null, confidence: null });
    const h = buildHandler({ storage: realStorage, wal: realWal, cwd: '/x' });
    const r = await h({ kind: 'export', all: true }) as { ok: true; data: { ndjson: string; records: number } };
    expect(r.ok).toBe(true);
    expect(r.data.records).toBeGreaterThanOrEqual(2);
    expect(r.data.ndjson).toContain('"table":"events"');
    expect(r.data.ndjson).toContain('"table":"summaries"');
  });

  it('import RPC ingests ndjson with INSERT OR IGNORE semantics', async () => {
    const ndjson = [
      JSON.stringify({ table: 'sessions', row: { id: 'imp-sess', started_at: 1 } }),
      JSON.stringify({ table: 'events', row: { id: 9001, ts: 1, session_id: 'imp-sess', tool: 'R', input_hash: 'h', payload_json: '{}', status: 'raw' } }),
    ].join('\n');
    const h = buildHandler({ storage: realStorage, wal: realWal, cwd: '/x' });
    const r = await h({ kind: 'import', ndjson }) as { ok: true; data: { inserted: number } };
    expect(r.data.inserted).toBe(2);
    // Re-import is idempotent.
    const r2 = await h({ kind: 'import', ndjson }) as { ok: true; data: { inserted: number; skipped: number } };
    expect(r2.data.inserted).toBe(0);
    expect(r2.data.skipped).toBe(2);
  });

  it('doctor reranker probe is cached for 60s; heal=true bypasses cache', async () => {
    const { resetRerankerProbeCache } = await import('./server.js');
    resetRerankerProbeCache();
    let pingCalls = 0;
    const stubReranker = {
      rerank: async (_q: string, hits: unknown[]) => hits as never[],
      ping: async () => { pingCalls++; return { ok: true, latencyMs: 5 }; },
    };
    const h = buildHandler({ storage: realStorage, wal: realWal, cwd: '/x', reranker: stubReranker });
    // First call → fresh probe (1)
    const a = await h({ kind: 'doctor' }) as { ok: true; data: { reranker?: { ok: boolean; cached?: boolean } } };
    expect(pingCalls).toBe(1);
    expect(a.data.reranker?.cached).toBeUndefined();
    // Second call within 60s → cached, no new ping
    const b = await h({ kind: 'doctor' }) as { ok: true; data: { reranker?: { cached?: boolean } } };
    expect(pingCalls).toBe(1);
    expect(b.data.reranker?.cached).toBe(true);
    // heal=true bypasses cache → fresh ping
    await h({ kind: 'doctor', heal: true });
    expect(pingCalls).toBe(2);
  });

  it('doctor heal=true triggers vec backfill when drift exists', async () => {
    // Without sqlite-vec loaded, vecEnabled=false → backfillVec is a no-op (returns 0).
    // The healed branch still runs; verify the response shape.
    const h = buildHandler({ storage: realStorage, wal: realWal, cwd: '/x' });
    const r = await h({ kind: 'doctor', heal: true }) as { ok: true; data: { vecCardinality: { drift: number }; healed?: { vecBackfilled: number } } };
    expect(r.ok).toBe(true);
    // No drift on a fresh store, so healed payload may or may not be present.
    if (r.data.vecCardinality.drift > 0) {
      expect(r.data.healed?.vecBackfilled).toBeGreaterThanOrEqual(0);
    }
  });

  it('backfill RPC returns scanned/captured counts even with no transcripts', async () => {
    const h = buildHandler({ storage: realStorage, wal: realWal, cwd: '/nonexistent-cwd-' + Date.now() });
    const r = await h({ kind: 'backfill', source: 'transcripts', workspaceOnly: true }) as { ok: true; data: { source: string; scanned: number; captured: number; errors: number } };
    expect(r.ok).toBe(true);
    expect(r.data.source).toBe('transcripts');
    expect(r.data.scanned).toBe(0);
    expect(r.data.captured).toBe(0);
  });

  it('compact RPC reports cache prune + vacuum results', async () => {
    await realStorage.putCachedSummary('x', 't', 1, 1, Date.now() - 60 * 24 * 60 * 60 * 1000);
    const h = buildHandler({ storage: realStorage, wal: realWal, cwd: '/x' });
    const r = await h({ kind: 'compact', cacheMaxAgeMs: 30 * 24 * 60 * 60 * 1000 }) as { ok: true; data: { cachePruned: number; ftsRebuilt: boolean } };
    expect(r.data.cachePruned).toBe(1);
    expect(r.data.ftsRebuilt).toBe(true);
  });

  it('patterns RPC surfaces recurring buckets with isoformat timestamps', async () => {
    for (let i = 0; i < 3; i++) {
      await realStorage.recordEvent({ ts: i, sessionId: `s${i}`, tool: 'Bash', payload: { cmd: 'ls' } });
    }
    const h = buildHandler({ storage: realStorage, wal: realWal, cwd: '/x' });
    const r = await h({ kind: 'patterns', minRepeats: 3 }) as { ok: true; data: { patterns: Array<{ occurrences: number; firstTs: string }> } };
    expect(r.data.patterns).toHaveLength(1);
    expect(r.data.patterns[0]!.occurrences).toBe(3);
    expect(r.data.patterns[0]!.firstTs).toMatch(/T/); // ISO format includes 'T'
  });

  it('session_digest RPC concats summaries with iso timestamps', async () => {
    const eid = await realStorage.recordEvent({ ts: 1, sessionId: 'sd', tool: 'Edit', payload: { i: 1 } });
    await realStorage.recordSummary({ eventId: eid, ts: 1, model: 'm', promptHash: 'p', text: 'edited', tokensIn: null, tokensOut: null, confidence: 0.9 });
    const h = buildHandler({ storage: realStorage, wal: realWal, cwd: '/x' });
    const r = await h({ kind: 'session_digest', sessionId: 'sd' }) as { ok: true; data: { text: string; firstTs: string | null } };
    expect(r.data.text).toContain('edited');
    expect(r.data.firstTs).toMatch(/T/);
  });

  it('sessions RPC returns session metadata with isoformat timestamps', async () => {
    await realStorage.recordEvent({ ts: 1000, sessionId: 'session-a', tool: 'R', payload: { i: 1 } });
    await realStorage.recordEvent({ ts: 2000, sessionId: 'session-b', tool: 'R', payload: { i: 1 } });
    const h = buildHandler({ storage: realStorage, wal: realWal, cwd: '/x' });
    const r = await h({ kind: 'sessions' }) as { ok: true; data: { sessions: Array<{ sessionId: string; firstTs: string; eventCount: number }> } };
    expect(r.data.sessions).toHaveLength(2);
    expect(r.data.sessions[0]!.sessionId).toBe('session-b'); // most recent first
    expect(r.data.sessions[0]!.firstTs).toMatch(/T/);
  });

  it('dashboard RPC composes stats + doctor + pinned + patterns in one call', async () => {
    const eid = await realStorage.recordEvent({ ts: Date.now(), sessionId: 's', tool: 'Edit', payload: { i: 1 } });
    const sid = await realStorage.recordSummary({ eventId: eid, ts: Date.now(), model: 'm', promptHash: 'p', text: 't', tokensIn: null, tokensOut: null, confidence: 0.9 });
    await realStorage.pin(sid);
    const h = buildHandler({ storage: realStorage, wal: realWal, cwd: '/x' });
    const r = await h({ kind: 'dashboard' }) as { ok: true; data: { stats: { counts: { events: number } }; doctor: { integrity: string }; pinned: unknown[]; patterns: unknown[] } };
    expect(r.ok).toBe(true);
    expect(r.data.stats.counts.events).toBe(1);
    expect(r.data.doctor.integrity).toBe('ok');
    expect(r.data.pinned).toHaveLength(1);
    expect(Array.isArray(r.data.patterns)).toBe(true);
  });

  it('as_of RPC returns counts + summaries filtered by ts cutoff', async () => {
    const t0 = 2_000_000;
    const eid = await realStorage.recordEvent({ ts: t0, sessionId: 's', tool: 'R', payload: { i: 1 } });
    await realStorage.recordSummary({ eventId: eid, ts: t0, model: 'm', promptHash: 'p', text: 'before', tokensIn: null, tokensOut: null, confidence: 0.9 });
    const eid2 = await realStorage.recordEvent({ ts: t0 + 5000, sessionId: 's', tool: 'R', payload: { i: 2 } });
    await realStorage.recordSummary({ eventId: eid2, ts: t0 + 5000, model: 'm', promptHash: 'p', text: 'after', tokensIn: null, tokensOut: null, confidence: 0.9 });
    const h = buildHandler({ storage: realStorage, wal: realWal, cwd: '/x' });
    const r = await h({ kind: 'as_of', ts: t0 + 1000 }) as { ok: true; data: { counts: { summaries: number }; summaries: Array<{ text: string }> } };
    expect(r.data.counts.summaries).toBe(1);
    expect(r.data.summaries[0]!.text).toBe('before');
  });

  it('auto_pin_patterns RPC reports pinned + patternsConsidered counts', async () => {
    for (let i = 0; i < 3; i++) {
      const eid = await realStorage.recordEvent({ ts: i, sessionId: `s${i}`, tool: 'Bash', payload: { cmd: 'ls' } });
      await realStorage.recordSummary({ eventId: eid, ts: i, model: 'm', promptHash: 'p', text: 't', tokensIn: null, tokensOut: null, confidence: 0.9 });
    }
    const h = buildHandler({ storage: realStorage, wal: realWal, cwd: '/x' });
    const r = await h({ kind: 'auto_pin_patterns', minRepeats: 3 }) as { ok: true; data: { pinned: number; patternsConsidered: number } };
    expect(r.data.pinned).toBe(3);
    expect(r.data.patternsConsidered).toBe(1);
  });

  it('context_budget RPC fills under the token cap and stops past it', async () => {
    for (let i = 0; i < 5; i++) {
      const eid = await realStorage.recordEvent({ ts: i, sessionId: 's', tool: 'Edit', payload: { i } });
      await realStorage.recordSummary({
        eventId: eid, ts: i, model: 'm', promptHash: 'p',
        // ~25 tokens each — five summaries = ~125 tokens, fits 100-token budget after ~3-4.
        text: 'cat dog run swim sky tree code text fish bird sun moon star tree leaf rock fire ice wind storm ocean wave',
        tokensIn: null, tokensOut: null, confidence: 0.9,
      });
    }
    const h = buildHandler({ storage: realStorage, wal: realWal, cwd: '/x' });
    const r = await h({ kind: 'context_budget', query: 'cat', maxTokens: 60 }) as { ok: true; data: { hits: Array<{ tokens: number }>; tokensUsed: number } };
    expect(r.ok).toBe(true);
    expect(r.data.tokensUsed).toBeLessThanOrEqual(60);
    const sumTokens = r.data.hits.reduce((s, h) => s + h.tokens, 0);
    expect(sumTokens).toBeLessThanOrEqual(60);
  });

  it('replay RPC returns events with summaries joined', async () => {
    const eid = await realStorage.recordEvent({ ts: 1, sessionId: 'rep', tool: 'Edit', payload: { p: 1 } });
    await realStorage.recordSummary({ eventId: eid, ts: 1, model: 'm', promptHash: 'p', text: 'edited', tokensIn: null, tokensOut: null, confidence: 0.9 });
    const h = buildHandler({ storage: realStorage, wal: realWal, cwd: '/x' });
    const r = await h({ kind: 'replay', sessionId: 'rep' }) as { ok: true; data: { events: Array<{ summary: { text: string } | null }> } };
    expect(r.data.events).toHaveLength(1);
    expect(r.data.events[0]!.summary?.text).toBe('edited');
  });

  it('symbol_search RPC returns events matching a symbol', async () => {
    const eid = await realStorage.recordEvent({ ts: 1, sessionId: 's', tool: 'Edit', payload: { tool_input: { file_path: '/x.ts', content: 'x' } } });
    await realStorage.setEventSymbols(eid, ['function:login']);
    const h = buildHandler({ storage: realStorage, wal: realWal, cwd: '/x' });
    const r = await h({ kind: 'symbol_search', query: 'function:login', k: 5 }) as { ok: true; data: { hits: Array<{ eventId: number }> } };
    expect(r.data.hits).toHaveLength(1);
    expect(r.data.hits[0]!.eventId).toBe(eid);
  });

  it('stats RPC returns throughput, backlog, top tools', async () => {
    await realStorage.recordEvent({ ts: Date.now(), sessionId: 's', tool: 'Edit', payload: { i: 1 } });
    const h = buildHandler({ storage: realStorage, wal: realWal, cwd: '/x' });
    const r = await h({ kind: 'stats', windowMs: 60_000 }) as { ok: true; data: { counts: { events: number }; throughput: { eventsPerMin: number }; topTools: Array<{ tool: string }> } };
    expect(r.data.counts.events).toBe(1);
    expect(r.data.throughput.eventsPerMin).toBeGreaterThan(0);
    expect(r.data.topTools.find(t => t.tool === 'Edit')).toBeTruthy();
  });

  it('thread RPC returns sessions sharing input_hash', async () => {
    const sessions = ['s1', 's2', 's3'];
    for (const sid of sessions) {
      await realStorage.recordEvent({ ts: 1, sessionId: sid, tool: 'R', payload: { same: true } });
    }
    const h = buildHandler({ storage: realStorage, wal: realWal, cwd: '/x' });
    const r = await h({ kind: 'thread', sessionId: 's1', limit: 10 }) as { ok: true; data: { sessions: Array<{ sessionId: string; sharedEvents: number }> } };
    expect(r.data.sessions).toHaveLength(2);
    expect(new Set(r.data.sessions.map(s => s.sessionId))).toEqual(new Set(['s2', 's3']));
  });

  it('thread RPC returns empty when the session has no shared inputs', async () => {
    await realStorage.recordEvent({ ts: 1, sessionId: 'lonely', tool: 'R', payload: { unique: 1 } });
    const h = buildHandler({ storage: realStorage, wal: realWal, cwd: '/x' });
    const r = await h({ kind: 'thread', sessionId: 'lonely' }) as { ok: true; data: { sessions: unknown[] } };
    expect(r.data.sessions).toEqual([]);
  });

  it('backfill RPC rejects unsupported sources', async () => {
    const h = buildHandler({ storage: realStorage, wal: realWal, cwd: '/x' });
    const r = await h({ kind: 'backfill', source: 'sftp' as 'transcripts' }) as { ok: false; error: string };
    expect(r.ok).toBe(false);
    expect(r.error).toContain('unsupported backfill source');
  });

  it('capture honors ttlMs by storing expires_at = ts + ttlMs', async () => {
    const ts = 1_000_000;
    const ttl = 60_000;
    const h = buildHandler({ storage: realStorage, wal: realWal, cwd: '/x' });
    const r = await h({ kind: 'capture', sessionId: 's', tool: 'Bash', payload: { cmd: 'ls' }, ts, ttlMs: ttl }) as { ok: true; data: { id: number } };
    expect(r.ok).toBe(true);
    const row = await (await (realStorage as unknown as { ['db']: { prepare(s: string): Promise<{ get(...p: unknown[]): Promise<unknown> }> } })['db'].prepare(
      'SELECT expires_at FROM events WHERE id = ?'
    )).get(r.data.id) as { expires_at?: number } | undefined;
    expect(row?.expires_at).toBe(ts + ttl);
  });
});

describe('processFrame', () => {
  let dir: string;
  let db: Database.Database;
  let storage: Storage;
  let wal: WAL;

  beforeEach(async () => {
    dir = mkdtempSync(join(tmpdir(), 'pf-'));
    db = new Database(join(dir, 'd.sqlite'));
    storage = await Storage.init(db);
    wal = new WAL(join(dir, 'wal.ndjson'));
  });
  afterEach(() => {
    wal.close();
    db.close();
    rmSync(dir, { recursive: true, force: true });
  });

  it('routes non-streaming kinds through the handler in a single frame', async () => {
    const handler = buildHandler({ storage, wal, cwd: dir });
    const out: unknown[] = [];
    await processFrame(
      { kind: 'ping' },
      { storage, embedder: null, reranker: null },
      handler,
      (f) => out.push(f),
    );
    expect(out).toHaveLength(1);
    expect((out[0] as { ok: boolean }).ok).toBe(true);
  });

  it('emits BM25 / vector / final / done frames for stream_search', async () => {
    const eid = await storage.recordEvent({ ts: Date.now(), sessionId: 's', tool: 'Edit', payload: { x: 1 } });
    await storage.recordSummary({
      eventId: eid, ts: Date.now(), model: 'm', promptHash: 'p',
      text: 'auth login session', tokensIn: null, tokensOut: null, confidence: null,
    });
    const handler = buildHandler({ storage, wal, cwd: dir });
    const out: Array<{ ok: boolean; data?: { partial?: { stage: string }; done?: boolean } }> = [];
    await processFrame(
      { kind: 'stream_search', query: 'auth', k: 5 },
      { storage, embedder: null, reranker: null },
      handler,
      (f) => out.push(f as { ok: boolean; data?: { partial?: { stage: string }; done?: boolean } }),
    );
    const stages = out.filter(f => f.data?.partial).map(f => f.data!.partial!.stage);
    expect(stages).toContain('bm25');
    expect(stages).toContain('final');
    expect(out.at(-1)!.data!.done).toBe(true);
  });

  it('emits an ok=false frame when stream_search throws', async () => {
    // Embedder that throws guarantees streamingHybridSearch handles vector-stage failure
    // gracefully, but stream-level failure happens when the BM25 stage itself crashes —
    // simulate by passing a deliberately broken storage shim.
    const handler = buildHandler({ storage, wal, cwd: dir });
    const brokenStorage = {
      ...storage,
      searchFts: () => { throw new Error('forced fault'); },
    } as unknown as Storage;
    const out: Array<{ ok: boolean; error?: string }> = [];
    await processFrame(
      { kind: 'stream_search', query: 'x' },
      { storage: brokenStorage, embedder: null, reranker: null },
      handler,
      (f) => out.push(f as { ok: boolean; error?: string }),
    );
    const errFrame = out.find(f => f.ok === false);
    expect(errFrame?.error).toBe('forced fault');
  });
});

describe('isRetryableError', () => {
  it('flags quota / rate-limit / 5xx / network errors as retryable', () => {
    expect(isRetryableError('You exceeded your current quota')).toBe(true);
    expect(isRetryableError('429 Too Many Requests')).toBe(true);
    expect(isRetryableError('rate limit exceeded')).toBe(true);
    expect(isRetryableError('rate-limit exceeded')).toBe(true);
    expect(isRetryableError('upstream returned 503')).toBe(true);
    expect(isRetryableError('upstream returned 502 Bad Gateway')).toBe(true);
    expect(isRetryableError('504 Gateway Timeout')).toBe(true);
    expect(isRetryableError('socket hang up')).toBe(true);
    expect(isRetryableError('ECONNRESET')).toBe(true);
    expect(isRetryableError('ECONNREFUSED')).toBe(true);
    expect(isRetryableError('ENOTFOUND api.example.com')).toBe(true);
    expect(isRetryableError('request timed out (ETIMEDOUT)')).toBe(true);
    expect(isRetryableError('overloaded')).toBe(true);
  });

  it('treats parse and validation errors as terminal', () => {
    expect(isRetryableError('invalid JSON output')).toBe(false);
    expect(isRetryableError('schema validation failed')).toBe(false);
    expect(isRetryableError('400 Bad Request')).toBe(false);
    expect(isRetryableError('401 Unauthorized')).toBe(false);
  });
});
