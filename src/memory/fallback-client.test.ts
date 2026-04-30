import { describe, it, expect } from 'vitest';
import { FallbackModelClient } from './fallback-client.js';
import type { ModelClient, ModelRequest, ModelResult } from './daemon/summarizer.js';

class StubClient implements ModelClient {
  calls = 0;
  constructor(private readonly impl: (req: ModelRequest) => Promise<ModelResult>) {}
  async generate(req: ModelRequest): Promise<ModelResult> {
    this.calls++;
    return this.impl(req);
  }
}

const REQ: ModelRequest = { model: 'm', system: '', user: 'u', maxTokens: 10 };

describe('FallbackModelClient', () => {
  it('returns the primary result when primary succeeds', async () => {
    const primary = new StubClient(async () => ({ text: 'P', tokensIn: 1, tokensOut: 1 }));
    const secondary = new StubClient(async () => ({ text: 'S', tokensIn: 1, tokensOut: 1 }));
    const r = await new FallbackModelClient(primary, secondary).generate(REQ);
    expect(r.text).toBe('P');
    expect(secondary.calls).toBe(0);
  });

  it('falls back to secondary on primary error', async () => {
    const primary = new StubClient(async () => { throw new Error('boom'); });
    const secondary = new StubClient(async () => ({ text: 'S', tokensIn: 1, tokensOut: 1 }));
    const r = await new FallbackModelClient(primary, secondary).generate(REQ);
    expect(r.text).toBe('S');
    expect(primary.calls).toBe(1);
    expect(secondary.calls).toBe(1);
  });

  it('invokes the onFallback callback with the primary error', async () => {
    const primary = new StubClient(async () => { throw new Error('upstream'); });
    const secondary = new StubClient(async () => ({ text: 'S', tokensIn: 1, tokensOut: 1 }));
    let captured: string | null = null;
    await new FallbackModelClient(primary, secondary, {
      onFallback: e => { captured = e.message; },
    }).generate(REQ);
    expect(captured).toBe('upstream');
  });

  it('after N consecutive failures, sticks to secondary for the configured window', async () => {
    let t = 1000;
    const now = () => t;
    const primary = new StubClient(async () => { throw new Error('boom'); });
    const secondary = new StubClient(async () => ({ text: 'S', tokensIn: 1, tokensOut: 1 }));
    const fb = new FallbackModelClient(primary, secondary, { failuresBeforeStick: 2, stickWindowMs: 100, now });
    await fb.generate(REQ);
    await fb.generate(REQ);
    expect(primary.calls).toBe(2);
    // Within sticky window: primary should NOT be tried.
    t = 1050;
    await fb.generate(REQ);
    expect(primary.calls).toBe(2);
    // After window: primary tried again.
    t = 2000;
    await fb.generate(REQ);
    expect(primary.calls).toBe(3);
  });

  it('resets the failure counter on a primary success', async () => {
    let t = 0;
    const now = () => t;
    let primaryFails = true;
    const primary = new StubClient(async () => {
      if (primaryFails) throw new Error('boom');
      return { text: 'P', tokensIn: 1, tokensOut: 1 };
    });
    const secondary = new StubClient(async () => ({ text: 'S', tokensIn: 1, tokensOut: 1 }));
    const fb = new FallbackModelClient(primary, secondary, { failuresBeforeStick: 3, stickWindowMs: 100, now });
    await fb.generate(REQ);
    await fb.generate(REQ);
    primaryFails = false;
    await fb.generate(REQ);
    primaryFails = true;
    // Counter reset; need 3 more failures to trigger sticky, not 1.
    await fb.generate(REQ);
    await fb.generate(REQ);
    // 4 fails total -> 4 fallback calls; secondary not yet sticky-pinned (need 3 since reset).
    expect(secondary.calls).toBe(4);
    expect(primary.calls).toBe(5); // 2 fail + 1 success + 2 fail
  });
});
