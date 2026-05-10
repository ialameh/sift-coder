import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import Database from 'better-sqlite3';
import { Storage } from '../storage/storage.js';
import type { ModelClient, ModelRequest, ModelResult } from './summarizer.js';
import { Summarizer } from './summarizer.js';
import { runPeriodicDaemonDrain } from './periodic-drain.js';

let dir: string;
let db: Database.Database;
let storage: Storage;

beforeEach(async () => {
  dir = mkdtempSync(join(tmpdir(), 'pdd-'));
  db = new Database(join(dir, 'd.sqlite'));
  storage = await Storage.init(db);
});
afterEach(() => {
  db.close();
  rmSync(dir, { recursive: true, force: true });
});

class StubClient implements ModelClient {
  constructor(public answers: string[] = ['{"text":"short fact","confidence":0.9}']) {}
  calls = 0;
  async generate(_req: ModelRequest): Promise<ModelResult> {
    const text = this.answers[Math.min(this.calls, this.answers.length - 1)] ?? this.answers[0]!;
    this.calls++;
    return { text, tokensIn: 10, tokensOut: 5 };
  }
}

class ManualScheduler {
  private next: { cb: () => void; ms: number } | null = null;
  setTimeout = (cb: () => void, ms: number): unknown => { this.next = { cb, ms }; return Symbol('h'); };
  clearTimeout = (): void => { this.next = null; };
  async fire(): Promise<number | null> {
    if (this.next === null) return null;
    const { cb, ms } = this.next;
    this.next = null;
    cb();
    await new Promise(r => setImmediate(r));
    return ms;
  }
  hasPending(): boolean { return this.next !== null; }
}

describe('runPeriodicDaemonDrain', () => {
  it('returns no-op handle when intervalMs is 0', async () => {
    const summarizer = new Summarizer(storage, new StubClient());
    const h = runPeriodicDaemonDrain(storage, summarizer, null, { intervalMs: 0, batch: 4, backend: 'test' });
    h.stop();
    expect(true).toBe(true);
  });

  it('returns no-op handle when no summarizer is configured', () => {
    const h = runPeriodicDaemonDrain(storage, null, null, { intervalMs: 1000, batch: 4, backend: 'test' });
    h.stop();
  });

  it('skips drain when raw=0 and grows backoff', async () => {
    const sched = new ManualScheduler();
    const ticks: Array<{ ran: boolean }> = [];
    const summarizer = new Summarizer(storage, new StubClient());
    const h = runPeriodicDaemonDrain(storage, summarizer, null, {
      intervalMs: 100, batch: 4, backend: 'test',
      scheduler: sched, onTick: (t) => ticks.push({ ran: t.ran }), maxBackoffSteps: 3,
    });
    expect(await sched.fire()).toBe(100);
    expect(ticks[0]!.ran).toBe(false);
    expect(await sched.fire()).toBe(200);
    expect(await sched.fire()).toBe(400);
    h.stop();
    expect(sched.hasPending()).toBe(false);
  });

  it('drains pending events when raw>0 and resets backoff after a productive drain', async () => {
    await storage.recordEvent({ ts: Date.now(), sessionId: 's', tool: 'Edit', payload: { x: 1 } });
    const sched = new ManualScheduler();
    const ticks: Array<{ ran: boolean; processed?: number }> = [];
    const client = new StubClient();
    const summarizer = new Summarizer(storage, client);
    const h = runPeriodicDaemonDrain(storage, summarizer, null, {
      intervalMs: 100, batch: 4, backend: 'test',
      scheduler: sched, onTick: (t) => ticks.push({ ran: t.ran, processed: t.result?.processed }),
    });
    await sched.fire();
    expect(ticks[0]!.ran).toBe(true);
    expect(ticks[0]!.processed).toBe(1);
    expect(client.calls).toBe(1);
    expect(await sched.fire()).toBe(100); // reset to base
    h.stop();
  });

  it('stop() prevents future ticks', async () => {
    const sched = new ManualScheduler();
    const summarizer = new Summarizer(storage, new StubClient());
    const h = runPeriodicDaemonDrain(storage, summarizer, null, {
      intervalMs: 100, batch: 4, backend: 'test', scheduler: sched,
    });
    await sched.fire();
    h.stop();
    expect(sched.hasPending()).toBe(false);
    expect(await sched.fire()).toBe(null);
  });

  it('keeps ticking when drain throws', async () => {
    await storage.recordEvent({ ts: Date.now(), sessionId: 's', tool: 'Edit', payload: { x: 1 } });
    const failClient: ModelClient = { generate: async () => { throw new Error('quota exceeded'); } };
    const summarizer = new Summarizer(storage, failClient);
    const sched = new ManualScheduler();
    const errors: string[] = [];
    const h = runPeriodicDaemonDrain(storage, summarizer, null, {
      intervalMs: 100, batch: 4, backend: 'test', scheduler: sched,
      onTick: (t) => { if (t.error) errors.push(t.error.message); },
    });
    await sched.fire();
    // Loop survived: a follow-up tick is queued.
    expect(sched.hasPending()).toBe(true);
    h.stop();
  });
});
