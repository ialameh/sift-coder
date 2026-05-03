/**
 * Sleep-time consolidation worker.
 * Periodically scans embeddings, marks near-duplicate older summaries as superseded by their
 * newer counterparts. Threshold-based; uses cosine similarity over normalized embeddings.
 *
 * Runs as a low-priority loop alongside the summarization queue. Cheaply rate-limited:
 * skips when fewer than minNewSinceLastRun summaries have been added.
 */
import { cosine } from '../embedder.js';
import type { Storage } from '../storage/storage.js';

export interface ConsolidatorOptions {
  intervalMs?: number;
  cosineThreshold?: number;
  minNewSinceLastRun?: number;
  pairLimit?: number;
}

export interface ConsolidationReport {
  pairsMarked: number;
  scanned: number;
}

export class Consolidator {
  private timer: ReturnType<typeof setTimeout> | null = null;
  private state: 'idle' | 'running' | 'stopped' = 'idle';
  private lastTotal = 0;
  private readonly interval: number;
  private readonly threshold: number;
  private readonly minDelta: number;
  private readonly pairLimit: number;

  constructor(private readonly storage: Storage, opts: ConsolidatorOptions = {}) {
    this.interval = opts.intervalMs ?? 5 * 60 * 1000;
    this.threshold = opts.cosineThreshold ?? 0.95;
    this.minDelta = opts.minNewSinceLastRun ?? 8;
    this.pairLimit = opts.pairLimit ?? 5000;
  }

  start(): void {
    if (this.state !== 'idle') return;
    this.state = 'running';
    this.scheduleTick(this.interval);
  }

  stop(): void {
    this.state = 'stopped';
    if (this.timer) {
      clearTimeout(this.timer);
      this.timer = null;
    }
  }

  getState(): typeof this.state {
    return this.state;
  }

  private scheduleTick(ms: number): void {
    /* c8 ignore next -- defensive guard for stop() racing scheduleTick */
    if (this.state !== 'running') return;
    this.timer = setTimeout(() => { void this.tick(); }, ms);
  }

  async tick(): Promise<ConsolidationReport> {
    if (this.state !== 'running') return { pairsMarked: 0, scanned: 0 };
    const all = await this.storage.allEmbeddings();
    if (all.length - this.lastTotal < this.minDelta) {
      this.scheduleTick(this.interval);
      return { pairsMarked: 0, scanned: all.length };
    }
    this.lastTotal = all.length;

    const dropped = await this.storage.supersededIds();
    const live = all.filter(e => !dropped.has(e.summaryId));
    live.sort((a, b) => a.ts - b.ts);

    let pairsMarked = 0;
    let comparisons = 0;
    const newlySuperseded = new Set<number>();
    outer: for (let i = 0; i < live.length; i++) {
      const newer = live[i]!;
      for (let j = 0; j < i; j++) {
        const older = live[j]!;
        if (newlySuperseded.has(older.summaryId)) continue;
        if (++comparisons > this.pairLimit) break outer;
        const sim = cosine(newer.vec, older.vec);
        if (sim >= this.threshold) {
          await this.storage.recordSupersedes(newer.summaryId, older.summaryId, sim, Date.now());
          newlySuperseded.add(older.summaryId);
          pairsMarked++;
        }
      }
    }
    this.scheduleTick(this.interval);
    return { pairsMarked, scanned: live.length };
  }
}