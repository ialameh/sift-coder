import { describe, it, expect, beforeEach } from 'vitest';
import { dispatch, drain, TOOLS, type HandlerDeps } from './handler.js';
import { Storage, type DBHandle } from '../storage/storage.js';
import { Summarizer, type ModelClient, type ModelRequest, type ModelResult } from '../daemon/summarizer.js';
import { DeterministicEmbedder } from '../embedder.js';
import type { MemoryClient } from '../client.js';
import type { Request, Response } from '../protocol.js';

class FakeMemoryClient {
  scripted: Response[] = [];
  calls: Request[] = [];
  async send(req: Request): Promise<Response> {
    this.calls.push(req);
    return this.scripted.shift() ?? { ok: true, data: {} };
  }
  async capture(): Promise<void> { /* unused */ }
}

class FakeSampler implements ModelClient {
  scripted: ModelResult[] = [];
  async generate(_req: ModelRequest): Promise<ModelResult> {
    return this.scripted.shift() ?? { text: '{"text":"x","confidence":0.9}', tokensIn: null, tokensOut: null };
  }
}

class FakeDB implements DBHandle {
  events: Array<Record<string, unknown>> = [];
  cache = new Map<string, { text: string; tokens_in: number | null; tokens_out: number | null }>();
  embeddings = new Map<number, { dim: number; vec: Buffer }>();
  private nextEventId = 1;
  private nextSummaryId = 1;
  exec(): void { /* noop */ }
  loadExtension(): void { throw new Error('no'); }
  prepare(sql: string) {
    const stmt = sql.trim();
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
    if (stmt.includes("WHERE status = 'raw'")) {
      return {
        run: () => ({ lastInsertRowid: 0 }),
        get: () => undefined,
        all: (limit: unknown) => this.events.filter(e => e['status'] === 'raw').slice(0, limit as number),
      };
    }
    if (stmt.startsWith('SELECT text, tokens_in, tokens_out FROM summary_cache')) {
      return {
        run: () => ({ lastInsertRowid: 0 }), get: (k: unknown) => this.cache.get(k as string), all: () => [],
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
    if (stmt.startsWith('INSERT INTO summaries')) {
      return {
        run: () => ({ lastInsertRowid: this.nextSummaryId++ }),
        get: () => undefined, all: () => [],
      };
    }
    if (stmt.startsWith('INSERT OR REPLACE INTO summary_embeddings')) {
      return {
        run: (sid: unknown, dim: unknown, vec: unknown) => {
          this.embeddings.set(sid as number, { dim: dim as number, vec: vec as Buffer });
          return { lastInsertRowid: 0 };
        },
        get: () => undefined, all: () => [],
      };
    }
    return { run: () => ({ lastInsertRowid: 0 }), get: () => undefined, all: () => [] };
  }
}

let db: FakeDB;
let storage: Storage;
let sampler: FakeSampler;
let summarizer: Summarizer;
let mem: FakeMemoryClient;

beforeEach(() => {
  db = new FakeDB();
  storage = new Storage(db);
  sampler = new FakeSampler();
  summarizer = new Summarizer(storage, sampler);
  mem = new FakeMemoryClient();
});

describe('dispatch', () => {
  it('returns server capabilities on initialize', async () => {
    const r = await dispatch({ jsonrpc: '2.0', id: 1, method: 'initialize' }, { client: mem as unknown as MemoryClient });
    const result = r.result as { capabilities: { sampling: unknown } };
    expect(result.capabilities.sampling).toBeDefined();
  });

  it('invokes onInitialize with the host capability advertisement', async () => {
    let captured: { samplingAdvertised: boolean; clientCaps: Record<string, unknown> } | null = null;
    await dispatch(
      { jsonrpc: '2.0', id: 1, method: 'initialize', params: { capabilities: { sampling: {} }, clientInfo: { name: 'claude-code', version: '2.1.124' } } },
      { client: mem as unknown as MemoryClient, onInitialize: i => { captured = i; } },
    );
    expect(captured).not.toBeNull();
    expect(captured!.samplingAdvertised).toBe(true);
    expect('sampling' in captured!.clientCaps).toBe(true);
  });

  it('marks sampling as NOT advertised when host omits it from capabilities', async () => {
    let captured: { samplingAdvertised: boolean } | null = null;
    await dispatch(
      { jsonrpc: '2.0', id: 1, method: 'initialize', params: { capabilities: { tools: {} } } },
      { client: mem as unknown as MemoryClient, onInitialize: i => { captured = i; } },
    );
    expect(captured!.samplingAdvertised).toBe(false);
  });

  it('handles initialize without params gracefully', async () => {
    let captured: { samplingAdvertised: boolean } | null = null;
    await dispatch(
      { jsonrpc: '2.0', id: 1, method: 'initialize' },
      { client: mem as unknown as MemoryClient, onInitialize: i => { captured = i; } },
    );
    expect(captured!.samplingAdvertised).toBe(false);
  });

  it('lists the four memory tools', async () => {
    const r = await dispatch({ jsonrpc: '2.0', id: 1, method: 'tools/list' }, { client: mem as unknown as MemoryClient });
    expect((r.result as { tools: unknown[] }).tools).toHaveLength(TOOLS.length);
  });

  it('forwards mem_search to the daemon and drains pending events first', async () => {
    storage.recordEvent({ ts: 1, sessionId: 's', tool: 'R', payload: { x: 1 } });
    mem.scripted.push({ ok: true, data: { hits: [] } });
    const r = await dispatch(
      { jsonrpc: '2.0', id: 2, method: 'tools/call', params: { name: 'mem_search', arguments: { query: 'q', k: 3 } } },
      { client: mem as unknown as MemoryClient, storage, summarizer, drainBatch: 4 }
    );
    expect(r.error).toBeUndefined();
    expect(mem.calls[0]).toMatchObject({ kind: 'search', query: 'q', k: 3 });
    expect(db.events[0]!['status']).toBe('summarized');
  });

  it('forwards mem_timeline params', async () => {
    mem.scripted.push({ ok: true, data: { rows: [] } });
    const r = await dispatch(
      { jsonrpc: '2.0', id: 3, method: 'tools/call', params: { name: 'mem_timeline', arguments: { near_id: 7 } } },
      { client: mem as unknown as MemoryClient }
    );
    expect(r.error).toBeUndefined();
    expect(mem.calls[0]).toMatchObject({ kind: 'timeline', nearId: 7, window: 10 });
  });

  it('forwards mem_get params', async () => {
    mem.scripted.push({ ok: true, data: { rows: [] } });
    await dispatch(
      { jsonrpc: '2.0', id: 4, method: 'tools/call', params: { name: 'mem_get', arguments: { ids: [1, 2] } } },
      { client: mem as unknown as MemoryClient }
    );
    expect(mem.calls[0]).toMatchObject({ kind: 'get', ids: [1, 2] });
  });

  it('mem_why returns the trace from the provenance store', async () => {
    const fakeProv = {
      trace: () => [
        { id: 1, ts: 0, from: { kind: 'a', id: '1' }, to: { kind: 'b', id: '2' }, edgeType: 'causes', confidence: 1, source: 'siftcoder', meta: null },
      ],
    };
    const r = await dispatch(
      { jsonrpc: '2.0', id: 50, method: 'tools/call', params: { name: 'mem_why', arguments: { kind: 'a', id: '1', depth: 3 } } },
      { client: mem as unknown as MemoryClient, provenance: fakeProv as unknown as Parameters<typeof dispatch>[1]['provenance'] }
    );
    expect(r.error).toBeUndefined();
    const text = (r.result as { content: Array<{ text: string }> }).content[0]!.text;
    const body = JSON.parse(text);
    expect(body.data.edges).toHaveLength(1);
  });

  it('mem_why uses defaults when kind/id/depth are not given', async () => {
    const calls: Array<{ node: { kind: string; id: string }; depth: number }> = [];
    const fakeProv = {
      trace: (node: { kind: string; id: string }, depth: number) => {
        calls.push({ node, depth });
        return [];
      },
    };
    await dispatch(
      { jsonrpc: '2.0', id: 52, method: 'tools/call', params: { name: 'mem_why', arguments: {} } },
      { client: mem as unknown as MemoryClient, provenance: fakeProv as unknown as Parameters<typeof dispatch>[1]['provenance'] }
    );
    expect(calls[0]).toEqual({ node: { kind: '', id: '' }, depth: 4 });
  });

  it('mem_why returns an empty trace when no provenance store is available', async () => {
    const r = await dispatch(
      { jsonrpc: '2.0', id: 51, method: 'tools/call', params: { name: 'mem_why', arguments: { kind: 'a', id: '1' } } },
      { client: mem as unknown as MemoryClient }
    );
    const body = JSON.parse((r.result as { content: Array<{ text: string }> }).content[0]!.text);
    expect(body.data.edges).toEqual([]);
  });

  it('mem_drain returns processed/error/pending counts', async () => {
    storage.recordEvent({ ts: 1, sessionId: 's', tool: 'R', payload: { x: 1 } });
    storage.recordEvent({ ts: 2, sessionId: 's', tool: 'R', payload: { y: 2 } });
    const r = await dispatch(
      { jsonrpc: '2.0', id: 5, method: 'tools/call', params: { name: 'mem_drain', arguments: { batch: 1 } } },
      { client: mem as unknown as MemoryClient, storage, summarizer, embedder: new DeterministicEmbedder(64) }
    );
    expect(r.error).toBeUndefined();
    const text = (r.result as { content: Array<{ text: string }> }).content[0]!.text;
    const body = JSON.parse(text);
    expect(body.data.processed).toBe(1);
  });

  it('uses defaults when search args omit query/k and deps omit drainBatch', async () => {
    mem.scripted.push({ ok: true, data: { hits: [] } });
    await dispatch(
      { jsonrpc: '2.0', id: 100, method: 'tools/call', params: { name: 'mem_search', arguments: {} } },
      { client: mem as unknown as MemoryClient }
    );
    expect(mem.calls[0]).toMatchObject({ kind: 'search', query: '', k: 5 });
  });

  it('uses defaults when mem_get omits ids and mem_drain omits batch', async () => {
    mem.scripted.push({ ok: true, data: { rows: [] } });
    await dispatch(
      { jsonrpc: '2.0', id: 101, method: 'tools/call', params: { name: 'mem_get', arguments: {} } },
      { client: mem as unknown as MemoryClient }
    );
    expect(mem.calls[0]).toMatchObject({ kind: 'get', ids: [] });

    const r = await dispatch(
      { jsonrpc: '2.0', id: 102, method: 'tools/call', params: { name: 'mem_drain', arguments: {} } },
      { client: mem as unknown as MemoryClient }
    );
    expect(r.error).toBeUndefined();
  });

  it('returns an error for unknown tools', async () => {
    const r = await dispatch(
      { jsonrpc: '2.0', id: 6, method: 'tools/call', params: { name: 'unknown' } },
      { client: mem as unknown as MemoryClient }
    );
    expect(r.error?.code).toBe(-32601);
  });

  it('returns an error for unknown methods', async () => {
    const r = await dispatch({ jsonrpc: '2.0', id: 7, method: 'foo' }, { client: mem as unknown as MemoryClient });
    expect(r.error?.code).toBe(-32601);
  });

  it('coerces thrown errors during a tool call into JSON-RPC errors', async () => {
    const broken = { send: async () => { throw new Error('boom'); } } as unknown as MemoryClient;
    const r = await dispatch(
      { jsonrpc: '2.0', id: 8, method: 'tools/call', params: { name: 'mem_get', arguments: { ids: [1] } } },
      { client: broken }
    );
    expect(r.error?.code).toBe(-32000);
    expect(r.error?.message).toBe('boom');
  });

  it('handles tools/call with no params and no arguments', async () => {
    const r = await dispatch(
      { jsonrpc: '2.0', id: 9, method: 'tools/call' },
      { client: mem as unknown as MemoryClient }
    );
    expect(r.error?.code).toBe(-32601);
  });

  it('omits id when the request has none', async () => {
    const r = await dispatch({ jsonrpc: '2.0', method: 'tools/list' }, { client: mem as unknown as MemoryClient });
    expect(r.id).toBeUndefined();
  });

  it('omits id when a tools/call request has none', async () => {
    mem.scripted.push({ ok: true, data: { rows: [] } });
    const r = await dispatch(
      { jsonrpc: '2.0', method: 'tools/call', params: { name: 'mem_get', arguments: { ids: [1] } } },
      { client: mem as unknown as MemoryClient }
    );
    expect(r.id).toBeUndefined();
  });
});

describe('drain', () => {
  it('returns zero counts when storage or summarizer is missing', async () => {
    expect(await drain({ client: mem as unknown as MemoryClient }, 4)).toEqual({ processed: 0, errors: 0, pending: 0 });
    expect(await drain({ client: mem as unknown as MemoryClient, storage }, 4)).toEqual({ processed: 0, errors: 0, pending: 0 });
  });

  it('marks events skipped on summarizer errors', async () => {
    storage.recordEvent({ ts: 1, sessionId: 's', tool: 'R', payload: {} });
    sampler.scripted = [];
    const broken = new Summarizer(storage, {
      generate: async () => { throw new Error('rate'); },
    });
    const r = await drain({ client: mem as unknown as MemoryClient, storage, summarizer: broken }, 4);
    expect(r.errors).toBe(1);
    expect(db.events[0]!['status']).toBe('skipped');
  });

  it('surfaces the first error message via firstError so callers can diagnose host issues', async () => {
    storage.recordEvent({ ts: 1, sessionId: 's', tool: 'R', payload: {} });
    storage.recordEvent({ ts: 2, sessionId: 's', tool: 'R', payload: {} });
    sampler.scripted = [];
    const broken = new Summarizer(storage, {
      generate: async () => { throw new Error('sampling/createMessage failed: method not found (code -32601)'); },
    });
    const r = await drain({ client: mem as unknown as MemoryClient, storage, summarizer: broken }, 4);
    expect(r.errors).toBe(2);
    expect(r.firstError).toBe('sampling/createMessage failed: method not found (code -32601)');
  });

  it('omits firstError when there are zero errors', async () => {
    const r = await drain({ client: mem as unknown as MemoryClient, storage, summarizer }, 4);
    expect(r.firstError).toBeUndefined();
  });
});
