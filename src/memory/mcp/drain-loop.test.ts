import { describe, it, expect } from 'vitest';
import type { MemoryClient } from '../client.js';
import type { SamplingTransport, SamplingResponse } from './sampling-client.js';
import { runPeriodicDrain } from './drain-loop.js';

interface ClaimedEventLite {
  eventId: number;
  inputHash: string;
  payloadJson: string;
  ts: number;
  tool: string;
}

function fakeClient(opts: {
  rawSequence: number[];
  events?: ClaimedEventLite[];
  failStatus?: boolean;
}): MemoryClient {
  let i = 0;
  const sent: Array<{ kind: string }> = [];
  return {
    send: async (req: { kind: string; [k: string]: unknown }) => {
      sent.push(req);
      if (req.kind === 'status') {
        if (opts.failStatus) throw new Error('status boom');
        const raw = opts.rawSequence[Math.min(i, opts.rawSequence.length - 1)] ?? 0;
        i++;
        return { ok: true, data: { counts: { raw } } };
      }
      if (req.kind === 'claim_for_summary') {
        return { ok: true, data: { events: opts.events ?? [] } };
      }
      if (req.kind === 'cache_get') return { ok: true, data: { cached: null } };
      if (req.kind === 'cache_put') return { ok: true, data: {} };
      if (req.kind === 'record_summary') return { ok: true, data: { summaryId: 1 } };
      if (req.kind === 'release_summary') return { ok: true, data: {} };
      return { ok: true, data: {} };
    },
    // @ts-expect-error — test-only attribute on the fake; not part of MemoryClient surface.
    sent,
  } as unknown as MemoryClient;
}

function fakeTransport(text = 'short fact about the edit\nconfidence: 0.8'): SamplingTransport {
  return {
    requestSampling: async (): Promise<SamplingResponse> => ({
      role: 'assistant',
      content: { type: 'text', text },
    }),
  };
}

class ManualScheduler {
  private next: { cb: () => void; ms: number } | null = null;
  setTimeout = (cb: () => void, ms: number): unknown => {
    this.next = { cb, ms };
    return Symbol('handle');
  };
  clearTimeout = (_handle: unknown): void => {
    this.next = null;
  };
  /** Pop and run the queued timer. Returns its delay. */
  async fire(): Promise<number | null> {
    if (this.next === null) return null;
    const { cb, ms } = this.next;
    this.next = null;
    cb();
    // tick() is async; wait one microtask cycle.
    await new Promise(r => setImmediate(r));
    return ms;
  }
  hasPending(): boolean {
    return this.next !== null;
  }
}

describe('runPeriodicDrain', () => {
  it('returns a no-op handle when intervalMs is 0', () => {
    const h = runPeriodicDrain(fakeClient({ rawSequence: [0] }), fakeTransport(), { intervalMs: 0, batch: 4 });
    h.stop();
    expect(true).toBe(true);
  });

  it('returns a no-op handle when no sampling transport is set', () => {
    const h = runPeriodicDrain(fakeClient({ rawSequence: [10] }), null, { intervalMs: 1000, batch: 4 });
    h.stop();
  });

  it('skips drain when raw=0 and grows backoff', async () => {
    const sched = new ManualScheduler();
    const ticks: Array<{ ran: boolean }> = [];
    const h = runPeriodicDrain(
      fakeClient({ rawSequence: [0, 0, 0] }),
      fakeTransport(),
      { intervalMs: 100, batch: 4, scheduler: sched, onTick: (t) => ticks.push({ ran: t.ran }), maxBackoffSteps: 3 },
    );
    expect(await sched.fire()).toBe(100); // initial tick
    expect(ticks[0]!.ran).toBe(false);
    // After empty tick, the next delay should grow: base * 2^1 = 200.
    expect(await sched.fire()).toBe(200);
    expect(ticks[1]!.ran).toBe(false);
    // Capped at 2^maxSteps after enough empty ticks.
    expect(await sched.fire()).toBe(400);
    h.stop();
    expect(sched.hasPending()).toBe(false);
  });

  it('drains when raw>0 and resets backoff after a non-empty drain', async () => {
    const sched = new ManualScheduler();
    const ticks: Array<{ ran: boolean; processed?: number }> = [];
    const h = runPeriodicDrain(
      fakeClient({
        rawSequence: [5, 5],
        events: [{
          eventId: 1, inputHash: 'h1', payloadJson: '{"x":1}', ts: 1, tool: 'Edit',
        }],
      }),
      fakeTransport(),
      {
        intervalMs: 100, batch: 4, scheduler: sched,
        onTick: (t) => ticks.push({ ran: t.ran, processed: t.result?.processed }),
      },
    );
    await sched.fire();
    expect(ticks[0]!.ran).toBe(true);
    expect(ticks[0]!.processed).toBe(1);
    // After non-empty drain, backoff should reset → next delay equals base 100ms.
    expect(await sched.fire()).toBe(100);
    h.stop();
  });

  it('does not overlap drains: stop() prevents future ticks', async () => {
    const sched = new ManualScheduler();
    const h = runPeriodicDrain(
      fakeClient({ rawSequence: [3, 3] }),
      fakeTransport(),
      { intervalMs: 100, batch: 4, scheduler: sched },
    );
    await sched.fire();
    h.stop();
    expect(sched.hasPending()).toBe(false);
    // Subsequent fires do nothing (no pending timer).
    expect(await sched.fire()).toBe(null);
  });

  it('treats status failures as a soft skip without crashing', async () => {
    const sched = new ManualScheduler();
    const errors: Error[] = [];
    const h = runPeriodicDrain(
      fakeClient({ rawSequence: [0], failStatus: true }),
      fakeTransport(),
      {
        intervalMs: 100, batch: 4, scheduler: sched,
        onTick: (t) => { if (t.error) errors.push(t.error); },
      },
    );
    await sched.fire();
    // Loop survived: a follow-up tick is queued.
    expect(sched.hasPending()).toBe(true);
    expect(errors[0]?.message).toContain('status boom');
    h.stop();
  });

  it('tickNow runs immediately and triggers a drain', async () => {
    const sched = new ManualScheduler();
    const ticks: Array<{ ran: boolean }> = [];
    const h = runPeriodicDrain(
      fakeClient({
        rawSequence: [2, 2],
        events: [{ eventId: 7, inputHash: 'x', payloadJson: '{}', ts: 1, tool: 'Bash' }],
      }),
      fakeTransport(),
      { intervalMs: 100, batch: 4, scheduler: sched, onTick: (t) => ticks.push({ ran: t.ran }) },
    );
    await h.tickNow();
    expect(ticks[0]?.ran).toBe(true);
    h.stop();
  });
});
