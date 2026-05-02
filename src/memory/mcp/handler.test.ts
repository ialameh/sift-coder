import { describe, it, expect, beforeEach } from 'vitest';
import { dispatch, drain, TOOLS, type HandlerDeps } from './handler.js';
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

let mem: FakeMemoryClient;

beforeEach(() => {
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

  it('lists the five memory tools', async () => {
    const r = await dispatch({ jsonrpc: '2.0', id: 1, method: 'tools/list' }, { client: mem as unknown as MemoryClient });
    expect((r.result as { tools: unknown[] }).tools).toHaveLength(TOOLS.length);
  });

  it('forwards mem_search to the daemon and drains pending events first', async () => {
    mem.scripted.push({ ok: true, data: { processed: 0, errors: 0, pending: 0 } }); // drain RPC
    mem.scripted.push({ ok: true, data: { hits: [] } }); // search RPC
    const r = await dispatch(
      { jsonrpc: '2.0', id: 2, method: 'tools/call', params: { name: 'mem_search', arguments: { query: 'q', k: 3 } } },
      { client: mem as unknown as MemoryClient, drainBatch: 4 }
    );
    expect(r.error).toBeUndefined();
    expect(mem.calls[0]).toMatchObject({ kind: 'drain', batch: 4 });
    expect(mem.calls[1]).toMatchObject({ kind: 'search', query: 'q', k: 3 });
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

  it('mem_why routes to daemon RPC', async () => {
    mem.scripted.push({ ok: true, data: { edges: [{ id: 1 }] } });
    const r = await dispatch(
      { jsonrpc: '2.0', id: 50, method: 'tools/call', params: { name: 'mem_why', arguments: { kind: 'a', id: '1', depth: 3 } } },
      { client: mem as unknown as MemoryClient }
    );
    expect(r.error).toBeUndefined();
    expect(mem.calls[0]).toMatchObject({ kind: 'why', nodeKind: 'a', nodeId: '1', depth: 3 });
    const text = (r.result as { content: Array<{ text: string }> }).content[0]!.text;
    const body = JSON.parse(text);
    expect(body.data.edges).toHaveLength(1);
  });

  it('mem_why uses defaults when kind/id/depth are not given', async () => {
    mem.scripted.push({ ok: true, data: { edges: [] } });
    await dispatch(
      { jsonrpc: '2.0', id: 52, method: 'tools/call', params: { name: 'mem_why', arguments: {} } },
      { client: mem as unknown as MemoryClient }
    );
    expect(mem.calls[0]).toMatchObject({ kind: 'why', nodeKind: '', nodeId: '', depth: 4 });
  });

  it('mem_drain sends drain RPC to daemon', async () => {
    mem.scripted.push({ ok: true, data: { processed: 1, errors: 0, pending: 0, backend: 'gemini' } });
    const r = await dispatch(
      { jsonrpc: '2.0', id: 5, method: 'tools/call', params: { name: 'mem_drain', arguments: { batch: 1 } } },
      { client: mem as unknown as MemoryClient }
    );
    expect(r.error).toBeUndefined();
    expect(mem.calls[0]).toMatchObject({ kind: 'drain', batch: 1 });
    const text = (r.result as { content: Array<{ text: string }> }).content[0]!.text;
    const body = JSON.parse(text);
    expect(body.data.processed).toBe(1);
  });

  it('uses defaults when search args omit query/k and deps omit drainBatch', async () => {
    mem.scripted.push({ ok: true, data: { processed: 0, errors: 0, pending: 0 } }); // drain
    mem.scripted.push({ ok: true, data: { hits: [] } }); // search
    await dispatch(
      { jsonrpc: '2.0', id: 100, method: 'tools/call', params: { name: 'mem_search', arguments: {} } },
      { client: mem as unknown as MemoryClient }
    );
    expect(mem.calls[1]).toMatchObject({ kind: 'search', query: '', k: 5 });
  });

  it('uses defaults when mem_get omits ids and mem_drain omits batch', async () => {
    mem.scripted.push({ ok: true, data: { rows: [] } });
    await dispatch(
      { jsonrpc: '2.0', id: 101, method: 'tools/call', params: { name: 'mem_get', arguments: {} } },
      { client: mem as unknown as MemoryClient }
    );
    expect(mem.calls[0]).toMatchObject({ kind: 'get', ids: [] });

    mem.scripted.push({ ok: true, data: { processed: 0, errors: 0, pending: 0 } });
    const r = await dispatch(
      { jsonrpc: '2.0', id: 102, method: 'tools/call', params: { name: 'mem_drain', arguments: {} } },
      { client: mem as unknown as MemoryClient }
    );
    expect(r.error).toBeUndefined();
    expect(mem.calls[1]).toMatchObject({ kind: 'drain', batch: 16 });
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
  it('returns zero counts when daemon returns error', async () => {
    mem.scripted.push({ ok: false, error: 'no summarizer configured' });
    const r = await drain(mem as unknown as MemoryClient, 4);
    expect(r.processed).toBe(0);
    expect(r.errors).toBe(1);
    expect(r.firstError).toBe('no summarizer configured');
  });

  it('returns daemon counts on success', async () => {
    mem.scripted.push({ ok: true, data: { processed: 3, errors: 0, pending: 5 } });
    const r = await drain(mem as unknown as MemoryClient, 4);
    expect(r.processed).toBe(3);
    expect(r.pending).toBe(5);
  });

  it('returns zero counts when socket unreachable', async () => {
    const broken = { send: async () => { throw new Error('ENOENT'); } } as unknown as MemoryClient;
    const r = await drain(broken, 4);
    expect(r.processed).toBe(0);
    expect(r.errors).toBe(0);
  });

  it('omits firstError when there are zero errors', async () => {
    mem.scripted.push({ ok: true, data: { processed: 0, errors: 0, pending: 0 } });
    const r = await drain(mem as unknown as MemoryClient, 4);
    expect(r.firstError).toBeUndefined();
  });

  it('surfaces firstError from daemon response', async () => {
    mem.scripted.push({ ok: true, data: { processed: 0, errors: 2, pending: 0, firstError: 'rate limit exceeded' } });
    const r = await drain(mem as unknown as MemoryClient, 4);
    expect(r.errors).toBe(2);
    expect(r.firstError).toBe('rate limit exceeded');
  });
});
