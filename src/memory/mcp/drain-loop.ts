/**
 * Periodic background drain for the MCP server.
 *
 * Without this, drain only runs when `mem_search` is called. A session that captures hundreds of
 * events through hooks but never searches will leave them un-summarized indefinitely. This loop
 * polls the daemon's pending count and opportunistically drains when there is work, while the
 * host is idle between turns.
 *
 * Safety properties:
 *   - At most one drain runs at a time (concurrency guard).
 *   - Skips entirely when sampling is unavailable (no transport).
 *   - Skips when the backlog is empty — no sampling traffic on idle stores.
 *   - Backs off (doubles the interval, capped) after a run that drained 0 events, then snaps
 *     back to the base cadence the moment a non-empty drain succeeds.
 *   - Errors are logged via the supplied logger but never thrown out of the timer callback.
 *
 * Tunable via env in the caller (server.ts):
 *   SIFTCODER_MCP_DRAIN_MS  base cadence in ms (default 60_000); 0 disables.
 *   SIFTCODER_MCP_DRAIN_BATCH  per-tick batch (default 4).
 */
import type { MemoryClient } from '../client.js';
import type { SamplingTransport } from './sampling-client.js';
import { drainViaSampling, type DrainResult } from './handler.js';

export interface PeriodicDrainOptions {
  /** Base interval between drain checks. 0 disables. */
  intervalMs: number;
  /** Per-tick batch size handed to `drainViaSampling`. */
  batch: number;
  /** Cap on the back-off multiplier. After this many empty ticks, the cadence stops growing. */
  maxBackoffSteps?: number;
  /** Injectable for tests. Defaults to the global setInterval/clearInterval. */
  scheduler?: {
    setTimeout: (cb: () => void, ms: number) => unknown;
    clearTimeout: (handle: unknown) => void;
  };
  /** Optional callback for telemetry / logs. Called after each tick (success or skip). */
  onTick?: (info: { ran: boolean; result?: DrainResult; error?: Error }) => void;
}

export interface PeriodicDrainHandle {
  stop(): void;
  /** Test-only: trigger one drain immediately (bypasses the timer). */
  tickNow(): Promise<void>;
}

/**
 * Spawn the periodic drain loop. Returns a handle whose `stop()` cancels the next tick. Already
 * in-flight drains run to completion regardless — the guard prevents new ones, not running ones.
 */
export function runPeriodicDrain(
  client: MemoryClient,
  transport: SamplingTransport | null,
  opts: PeriodicDrainOptions,
): PeriodicDrainHandle {
  if (opts.intervalMs <= 0 || transport === null) {
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
      // Cheap precheck: don't burn a sampling round-trip when there's nothing to summarize.
      // Also skips the claim_for_summary RPC entirely when raw=0, which keeps idle workspaces
      // from spamming the daemon log on every tick.
      let raw = 0;
      try {
        const status = await client.send<{ counts?: { raw?: number } }>({ kind: 'status' });
        if (status.ok && status.data.counts && typeof status.data.counts.raw === 'number') {
          raw = status.data.counts.raw;
        }
      } catch (e) {
        opts.onTick?.({ ran: false, error: e as Error });
        return;
      }
      if (raw === 0) {
        // Empty store → grow backoff toward maxSteps, but never block a future re-arm.
        backoffSteps = Math.min(backoffSteps + 1, maxSteps);
        opts.onTick?.({ ran: false });
        return;
      }
      try {
        const result = await drainViaSampling(client, transport, opts.batch);
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
