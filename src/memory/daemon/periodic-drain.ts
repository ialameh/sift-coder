/**
 * Daemon-side periodic drain.
 *
 * v1.2 added an MCP-side eager-drain loop (src/memory/mcp/drain-loop.ts) that handles
 * sessions where Claude Code advertises `sampling`. But sessions where sampling is NOT
 * advertised — or where the MCP server hasn't been initialized — leave the daemon idle:
 * capture works (UDS path is independent), drain doesn't fire. This loop closes that gap.
 *
 * Adaptive backoff mirrors the MCP-side pattern: 2× per empty tick, capped, snaps back to
 * base on a productive drain. A single concurrency guard prevents overlap. Errors are
 * logged via the supplied logger but never thrown out of the timer callback.
 *
 * Tunable via env in the caller (index.ts):
 *   SIFTCODER_DAEMON_DRAIN_MS    base cadence in ms (default 60_000); 0 disables.
 *   SIFTCODER_DAEMON_DRAIN_BATCH per-tick batch (default 8).
 */
import type { Storage } from '../storage/storage.js';
import type { Summarizer } from './summarizer.js';
import type { Embedder } from '../embedder.js';
import { runDrain, type DrainResult } from './server.js';

export interface PeriodicDrainOptions {
  intervalMs: number;
  batch: number;
  backend: string;
  /** Cap on the back-off multiplier. After this many empty ticks, the cadence stops growing. */
  maxBackoffSteps?: number;
  scheduler?: {
    setTimeout: (cb: () => void, ms: number) => unknown;
    clearTimeout: (handle: unknown) => void;
  };
  onTick?: (info: { ran: boolean; result?: DrainResult; error?: Error }) => void;
}

export interface PeriodicDrainHandle {
  stop(): void;
  tickNow(): Promise<void>;
}

export function runPeriodicDaemonDrain(
  storage: Storage,
  summarizer: Summarizer | null,
  embedder: Embedder | null | undefined,
  opts: PeriodicDrainOptions,
): PeriodicDrainHandle {
  if (opts.intervalMs <= 0 || summarizer === null) {
    return { stop: () => {}, tickNow: async () => {} };
  }
  const sched = opts.scheduler ?? {
    setTimeout: (cb, ms) => setTimeout(cb, ms),
    clearTimeout: (handle) => clearTimeout(handle as ReturnType<typeof setTimeout>),
  };
  const maxSteps = opts.maxBackoffSteps ?? 4;

  let running = false;
  let stopped = false;
  let backoffSteps = 0;
  let timer: unknown = null;

  const tick = async (): Promise<void> => {
    if (stopped || running) return;
    running = true;
    try {
      // Cheap precheck: skip drain when there's nothing to summarize. Saves a claimPending
      // round-trip on idle workspaces.
      const counts = await storage.counts().catch(() => null);
      if (counts === null) {
        opts.onTick?.({ ran: false });
        return;
      }
      if (counts.raw === 0) {
        backoffSteps = Math.min(backoffSteps + 1, maxSteps);
        opts.onTick?.({ ran: false });
        return;
      }
      try {
        const result = await runDrain(storage, summarizer, embedder, opts.batch, opts.backend);
        if (result.processed > 0) {
          backoffSteps = 0;
        } else {
          backoffSteps = Math.min(backoffSteps + 1, maxSteps);
        }
        opts.onTick?.({ ran: true, result });
      } catch (e) {
        opts.onTick?.({ ran: true, error: e as Error });
      }
    } finally {
      running = false;
      if (!stopped) {
        const delay = opts.intervalMs * (1 << backoffSteps);
        timer = sched.setTimeout(() => { void tick(); }, delay);
      }
    }
  };

  timer = sched.setTimeout(() => { void tick(); }, opts.intervalMs);

  return {
    stop(): void {
      stopped = true;
      if (timer !== null) sched.clearTimeout(timer);
      timer = null;
    },
    tickNow: tick,
  };
}
