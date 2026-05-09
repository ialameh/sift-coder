import { describe, it, expect, beforeEach } from 'vitest';
import { dispatch, drain, drainViaSampling, TOOLS, type HandlerDeps } from './handler.js';
import type { MemoryClient } from '../client.js';
import type { Request, Response } from '../protocol.js';
import type { SamplingTransport, SamplingRequestParams, SamplingResponse } from './sampling-client.js';

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
    mem.scripted.push({ ok: true, data: { counts: { raw: 0 } } }); // status RPC for backlog probe
    mem.scripted.push({ ok: true, data: { processed: 0, errors: 0, pending: 0 } }); // drain RPC
    mem.scripted.push({ ok: true, data: { hits: [] } }); // search RPC
    const r = await dispatch(
      { jsonrpc: '2.0', id: 2, method: 'tools/call', params: { name: 'mem_search', arguments: { query: 'q', k: 3 } } },
      { client: mem as unknown as MemoryClient, drainBatch: 4 }
    );
    expect(r.error).toBeUndefined();
    expect(mem.calls.find(c => c.kind === 'drain')).toMatchObject({ kind: 'drain', batch: 4 });
    expect(mem.calls.find(c => c.kind === 'search')).toMatchObject({ kind: 'search', query: 'q', k: 3 });
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
    mem.scripted.push({ ok: true, data: { counts: { raw: 0 } } }); // status probe
    mem.scripted.push({ ok: true, data: { processed: 0, errors: 0, pending: 0 } }); // drain
    mem.scripted.push({ ok: true, data: { hits: [] } }); // search
    await dispatch(
      { jsonrpc: '2.0', id: 100, method: 'tools/call', params: { name: 'mem_search', arguments: {} } },
      { client: mem as unknown as MemoryClient }
    );
    expect(mem.calls.find(c => c.kind === 'search')).toMatchObject({ kind: 'search', query: '', k: 5 });
  });

  it('mem_search ramps drain batch when backlog is high', async () => {
    mem.scripted.push({ ok: true, data: { counts: { raw: 600 } } }); // huge backlog → batch=32
    mem.scripted.push({ ok: true, data: { processed: 0, errors: 0, pending: 600 } });
    mem.scripted.push({ ok: true, data: { hits: [] } });
    await dispatch(
      { jsonrpc: '2.0', id: 1, method: 'tools/call', params: { name: 'mem_search', arguments: { query: 'q' } } },
      { client: mem as unknown as MemoryClient, drainBatch: 4 }
    );
    const drainCall = mem.calls.find(c => c.kind === 'drain') as { batch: number };
    expect(drainCall.batch).toBe(32);
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

class FakeSamplingTransport implements SamplingTransport {
  scripted: Array<SamplingResponse | Error> = [];
  calls: SamplingRequestParams[] = [];
  async requestSampling(params: SamplingRequestParams): Promise<SamplingResponse> {
    this.calls.push(params);
    const next = this.scripted.shift();
    if (next instanceof Error) throw next;
    return next ?? { role: 'assistant', content: { type: 'text', text: '{"text":"summary","confidence":0.9}' } };
  }
}

describe('drainViaSampling', () => {
  it('claims events, summarizes via host sampling, records summaries', async () => {
    mem.scripted.push({ ok: true, data: { events: [
      { id: 1, ts: 1, sessionId: 's', tool: 'R', inputHash: 'h1', payloadJson: '{"x":1}', tokensEst: 10 },
      { id: 2, ts: 2, sessionId: 's', tool: 'R', inputHash: 'h2', payloadJson: '{"y":2}', tokensEst: 10 },
    ] }});
    mem.scripted.push({ ok: true, data: { cached: null } });
    mem.scripted.push({ ok: true, data: { ok: true } }); // cache_put
    mem.scripted.push({ ok: true, data: { id: 100 } }); // record_summary
    mem.scripted.push({ ok: true, data: { cached: null } });
    mem.scripted.push({ ok: true, data: { ok: true } });
    mem.scripted.push({ ok: true, data: { id: 101 } });

    const transport = new FakeSamplingTransport();
    transport.scripted.push({ role: 'assistant', content: { type: 'text', text: '{"text":"first","confidence":0.9}' } });
    transport.scripted.push({ role: 'assistant', content: { type: 'text', text: '{"text":"second","confidence":0.9}' } });

    const r = await drainViaSampling(mem as unknown as MemoryClient, transport, 2);
    expect(r.processed).toBe(2);
    expect(r.errors).toBe(0);
    expect(transport.calls).toHaveLength(2);
    const recordCalls = mem.calls.filter(c => c.kind === 'record_summary');
    expect(recordCalls).toHaveLength(2);
  });

  it('uses cached summary when available, skipping the host sampling call', async () => {
    mem.scripted.push({ ok: true, data: { events: [
      { id: 1, ts: 1, sessionId: 's', tool: 'R', inputHash: 'h1', payloadJson: '{}', tokensEst: 10 },
    ] }});
    mem.scripted.push({ ok: true, data: { cached: { text: '{"text":"cached","confidence":0.9}', tokensIn: 1, tokensOut: 1 } } });
    mem.scripted.push({ ok: true, data: { id: 1 } });

    const transport = new FakeSamplingTransport();
    const r = await drainViaSampling(mem as unknown as MemoryClient, transport, 1);
    expect(r.processed).toBe(1);
    expect(transport.calls).toHaveLength(0);
  });

  it('releases retryable host errors back to raw, marks parse errors terminal', async () => {
    mem.scripted.push({ ok: true, data: { events: [
      { id: 1, ts: 1, sessionId: 's', tool: 'R', inputHash: 'h1', payloadJson: '{}', tokensEst: 10 },
    ] }});
    mem.scripted.push({ ok: true, data: { cached: null } });
    mem.scripted.push({ ok: true, data: { status: 'released' } });

    const transport = new FakeSamplingTransport();
    transport.scripted.push(new Error('rate limit exceeded'));

    const r = await drainViaSampling(mem as unknown as MemoryClient, transport, 1);
    expect(r.processed).toBe(0);
    expect(r.errors).toBe(1);
    const release = mem.calls.find(c => c.kind === 'release_summary') as { terminal?: boolean };
    expect(release.terminal).toBe(false);
  });

  it('returns zero processed when no events are available', async () => {
    mem.scripted.push({ ok: true, data: { events: [] } });
    const transport = new FakeSamplingTransport();
    const r = await drainViaSampling(mem as unknown as MemoryClient, transport, 1);
    expect(r.processed).toBe(0);
    expect(r.errors).toBe(0);
  });
});

describe('mem_search routes drain through sampling when transport is provided', () => {
  it('uses sampling transport for drain in mem_search', async () => {
    // claim_for_summary returns no events to keep the test simple — verify the routing alone.
    mem.scripted.push({ ok: true, data: { events: [] } });
    mem.scripted.push({ ok: true, data: { hits: [] } });
    const transport = new FakeSamplingTransport();
    await dispatch(
      { jsonrpc: '2.0', id: 1, method: 'tools/call', params: { name: 'mem_search', arguments: { query: 'x' } } },
      { client: mem as unknown as MemoryClient, samplingTransport: transport },
    );
    expect(mem.calls.find(c => c.kind === 'claim_for_summary')).toBeTruthy();
    expect(mem.calls.find(c => c.kind === 'drain')).toBeUndefined();
  });
});

describe('ops MCP tools', () => {
  it('mem_pin forwards a pin RPC with the summary id', async () => {
    mem.scripted.push({ ok: true, data: { pinned: true, summaryId: 42 } });
    const r = await dispatch(
      { jsonrpc: '2.0', id: 1, method: 'tools/call', params: { name: 'mem_pin', arguments: { summary_id: 42 } } },
      { client: mem as unknown as MemoryClient },
    );
    expect(mem.calls.find(c => c.kind === 'pin' && c.summaryId === 42)).toBeTruthy();
    expect(r.result).toBeDefined();
  });

  it('mem_unpin forwards an unpin RPC', async () => {
    mem.scripted.push({ ok: true, data: { pinned: false, summaryId: 42 } });
    await dispatch(
      { jsonrpc: '2.0', id: 1, method: 'tools/call', params: { name: 'mem_unpin', arguments: { summary_id: 42 } } },
      { client: mem as unknown as MemoryClient },
    );
    expect(mem.calls.find(c => c.kind === 'unpin' && c.summaryId === 42)).toBeTruthy();
  });

  it('mem_pinned forwards a pinned RPC with the limit', async () => {
    mem.scripted.push({ ok: true, data: { pinned: [] } });
    await dispatch(
      { jsonrpc: '2.0', id: 1, method: 'tools/call', params: { name: 'mem_pinned', arguments: { limit: 5 } } },
      { client: mem as unknown as MemoryClient },
    );
    expect(mem.calls.find(c => c.kind === 'pinned' && c.limit === 5)).toBeTruthy();
  });

  it('mem_prune translates days → maxAgeMs', async () => {
    mem.scripted.push({ ok: true, data: { removedEvents: 0, removedSummaries: 0 } });
    await dispatch(
      { jsonrpc: '2.0', id: 1, method: 'tools/call', params: { name: 'mem_prune', arguments: { days: 14, superseded: true } } },
      { client: mem as unknown as MemoryClient },
    );
    const call = mem.calls.find(c => c.kind === 'prune');
    expect(call).toBeTruthy();
    expect((call as { maxAgeMs: number }).maxAgeMs).toBe(14 * 24 * 60 * 60 * 1000);
    expect((call as { superseded: boolean }).superseded).toBe(true);
  });

  it('mem_retry forwards a retry_skipped RPC', async () => {
    mem.scripted.push({ ok: true, data: { requeued: 3 } });
    await dispatch(
      { jsonrpc: '2.0', id: 1, method: 'tools/call', params: { name: 'mem_retry', arguments: { limit: 5 } } },
      { client: mem as unknown as MemoryClient },
    );
    expect(mem.calls.find(c => c.kind === 'retry_skipped' && c.limit === 5)).toBeTruthy();
  });

  it('mem_doctor forwards a doctor RPC', async () => {
    mem.scripted.push({ ok: true, data: { integrity: 'ok' } });
    await dispatch(
      { jsonrpc: '2.0', id: 1, method: 'tools/call', params: { name: 'mem_doctor', arguments: {} } },
      { client: mem as unknown as MemoryClient },
    );
    expect(mem.calls.find(c => c.kind === 'doctor')).toBeTruthy();
  });

  it('mem_federate_search forwards a federate_search RPC', async () => {
    mem.scripted.push({ ok: true, data: { hits: [] } });
    await dispatch(
      { jsonrpc: '2.0', id: 1, method: 'tools/call', params: { name: 'mem_federate_search', arguments: { query: 'auth', k: 3, workspace_prefix: 'work', max_workspaces: 5 } } },
      { client: mem as unknown as MemoryClient },
    );
    const call = mem.calls.find(c => c.kind === 'federate_search') as { query: string; k: number; workspacePrefix: string; maxWorkspaces: number };
    expect(call.query).toBe('auth');
    expect(call.k).toBe(3);
    expect(call.workspacePrefix).toBe('work');
    expect(call.maxWorkspaces).toBe(5);
  });

  it('mem_symbol_search forwards a symbol_search RPC', async () => {
    mem.scripted.push({ ok: true, data: { hits: [] } });
    await dispatch(
      { jsonrpc: '2.0', id: 1, method: 'tools/call', params: { name: 'mem_symbol_search', arguments: { query: 'function:login', k: 7 } } },
      { client: mem as unknown as MemoryClient },
    );
    const call = mem.calls.find(c => c.kind === 'symbol_search') as { query: string; k: number };
    expect(call.query).toBe('function:login');
    expect(call.k).toBe(7);
  });

  it('mem_compact forwards a compact RPC with cacheMaxAgeMs', async () => {
    mem.scripted.push({ ok: true, data: { cachePruned: 0 } });
    await dispatch(
      { jsonrpc: '2.0', id: 1, method: 'tools/call', params: { name: 'mem_compact', arguments: { cache_max_age_ms: 1000 } } },
      { client: mem as unknown as MemoryClient },
    );
    const call = mem.calls.find(c => c.kind === 'compact') as { cacheMaxAgeMs: number };
    expect(call.cacheMaxAgeMs).toBe(1000);
  });

  it('mem_patterns forwards a patterns RPC with thresholds', async () => {
    mem.scripted.push({ ok: true, data: { patterns: [] } });
    await dispatch(
      { jsonrpc: '2.0', id: 1, method: 'tools/call', params: { name: 'mem_patterns', arguments: { min_repeats: 5, limit: 20 } } },
      { client: mem as unknown as MemoryClient },
    );
    const call = mem.calls.find(c => c.kind === 'patterns') as { minRepeats: number; limit: number };
    expect(call.minRepeats).toBe(5);
    expect(call.limit).toBe(20);
  });

  it('mem_session_digest forwards a session_digest RPC', async () => {
    mem.scripted.push({ ok: true, data: { text: '' } });
    await dispatch(
      { jsonrpc: '2.0', id: 1, method: 'tools/call', params: { name: 'mem_session_digest', arguments: { session_id: 'abc', limit: 25 } } },
      { client: mem as unknown as MemoryClient },
    );
    const call = mem.calls.find(c => c.kind === 'session_digest') as { sessionId: string; limit: number };
    expect(call.sessionId).toBe('abc');
    expect(call.limit).toBe(25);
  });

  it('mem_auto_pin_patterns forwards an auto_pin_patterns RPC', async () => {
    mem.scripted.push({ ok: true, data: { pinned: 0, patternsConsidered: 0 } });
    await dispatch(
      { jsonrpc: '2.0', id: 1, method: 'tools/call', params: { name: 'mem_auto_pin_patterns', arguments: { min_repeats: 5 } } },
      { client: mem as unknown as MemoryClient },
    );
    const call = mem.calls.find(c => c.kind === 'auto_pin_patterns') as { minRepeats: number };
    expect(call.minRepeats).toBe(5);
  });

  it('mem_context_budget forwards a context_budget RPC with maxTokens', async () => {
    mem.scripted.push({ ok: true, data: { hits: [], tokensUsed: 0, tokensBudget: 4000 } });
    await dispatch(
      { jsonrpc: '2.0', id: 1, method: 'tools/call', params: { name: 'mem_context_budget', arguments: { query: 'auth', max_tokens: 2000, candidate_pool: 30 } } },
      { client: mem as unknown as MemoryClient },
    );
    const call = mem.calls.find(c => c.kind === 'context_budget') as { query: string; maxTokens: number; candidatePool: number };
    expect(call.query).toBe('auth');
    expect(call.maxTokens).toBe(2000);
    expect(call.candidatePool).toBe(30);
  });

  it('mem_replay forwards a replay RPC with the session id', async () => {
    mem.scripted.push({ ok: true, data: { events: [] } });
    await dispatch(
      { jsonrpc: '2.0', id: 1, method: 'tools/call', params: { name: 'mem_replay', arguments: { session_id: 'rep-1', limit: 50 } } },
      { client: mem as unknown as MemoryClient },
    );
    const call = mem.calls.find(c => c.kind === 'replay') as { sessionId: string; limit: number };
    expect(call.sessionId).toBe('rep-1');
    expect(call.limit).toBe(50);
  });

  it('mem_capture forwards a capture RPC with source=agent', async () => {
    mem.scripted.push({ ok: true, data: { id: 42 } });
    await dispatch(
      { jsonrpc: '2.0', id: 1, method: 'tools/call', params: { name: 'mem_capture', arguments: { session_id: 's', payload: { fact: 'x' }, ttl_ms: 60000 } } },
      { client: mem as unknown as MemoryClient },
    );
    const call = mem.calls.find(c => c.kind === 'capture') as { sessionId: string; tool: string; payload: { fact: string }; ttlMs: number; source: string };
    expect(call.sessionId).toBe('s');
    expect(call.tool).toBe('agent_capture');
    expect(call.payload.fact).toBe('x');
    expect(call.ttlMs).toBe(60000);
    expect(call.source).toBe('agent');
  });

  it('mem_stats forwards a stats RPC with windowMs', async () => {
    mem.scripted.push({ ok: true, data: { counts: { events: 0 } } });
    await dispatch(
      { jsonrpc: '2.0', id: 1, method: 'tools/call', params: { name: 'mem_stats', arguments: { window_ms: 60000 } } },
      { client: mem as unknown as MemoryClient },
    );
    const call = mem.calls.find(c => c.kind === 'stats') as { windowMs: number };
    expect(call.windowMs).toBe(60000);
  });

  it('mem_thread forwards a thread RPC with the session id', async () => {
    mem.scripted.push({ ok: true, data: { sessions: [] } });
    await dispatch(
      { jsonrpc: '2.0', id: 1, method: 'tools/call', params: { name: 'mem_thread', arguments: { session_id: 'abc-123', limit: 5 } } },
      { client: mem as unknown as MemoryClient },
    );
    const call = mem.calls.find(c => c.kind === 'thread');
    expect(call).toBeTruthy();
    expect((call as { sessionId: string }).sessionId).toBe('abc-123');
    expect((call as { limit: number }).limit).toBe(5);
  });

  it('tools/list exposes the full memory tool surface', async () => {
    const r = await dispatch({ jsonrpc: '2.0', id: 1, method: 'tools/list' }, { client: mem as unknown as MemoryClient });
    expect((r.result as { tools: unknown[] }).tools.length).toBeGreaterThanOrEqual(11);
  });
});
