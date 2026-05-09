/**
 * Background symbol-annotation worker. Pulls events whose `symbols_json` is NULL, runs the
 * configured extractor (regex sync, CDG async, or both), and commits the result. Decoupled
 * from the capture hot path so a slow CDG / tree-sitter call cannot block tool capture.
 *
 * Lifecycle mirrors the Consolidator:
 *   - `start()` schedules a tick after `intervalMs`.
 *   - `tick()` processes a batch and reschedules.
 *   - `stop()` cancels the timer.
 *
 * Tests can drive `tick()` directly without arming the timer.
 */
import type { Storage } from '../storage/storage.js';
import { looksLikeCodePath, type SymbolExtractor, type AsyncSymbolExtractor } from '../symbols.js';

export interface SymbolWorkerOptions {
  intervalMs?: number;
  batch?: number;
  syncExtractor?: SymbolExtractor | null;
  asyncExtractor?: AsyncSymbolExtractor | null;
}

export interface SymbolWorkerReport {
  scanned: number;
  annotated: number;
  skipped: number;
}

interface CodePayload {
  path: string;
  code: string;
}

function extractCodePayload(payloadJson: string): CodePayload | null {
  let p: unknown;
  try { p = JSON.parse(payloadJson) as unknown; } catch { return null; }
  if (!p || typeof p !== 'object') return null;
  const root = p as Record<string, unknown>;
  const input = root['tool_input'] as Record<string, unknown> | null | undefined;
  if (!input) return null;
  const path = (input['file_path'] ?? input['path'] ?? input['notebook_path']) as string | undefined;
  if (!looksLikeCodePath(path)) return null;
  const code = (input['content'] ?? input['new_string'] ?? input['file_text']) as string | undefined;
  if (typeof code !== 'string' || code.length === 0) return null;
  return { path: path!, code };
}

export class SymbolWorker {
  private timer: ReturnType<typeof setTimeout> | null = null;
  private state: 'idle' | 'running' | 'stopped' = 'idle';
  private readonly interval: number;
  private readonly batch: number;
  private readonly sync: SymbolExtractor | null;
  private readonly async: AsyncSymbolExtractor | null;

  constructor(private readonly storage: Storage, opts: SymbolWorkerOptions = {}) {
    this.interval = opts.intervalMs ?? 30_000;
    this.batch = opts.batch ?? 32;
    this.sync = opts.syncExtractor ?? null;
    this.async = opts.asyncExtractor ?? null;
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

  async tick(): Promise<SymbolWorkerReport> {
    if (this.state === 'stopped') return { scanned: 0, annotated: 0, skipped: 0 };
    const events = await this.storage.eventsNeedingSymbols(this.batch);
    let annotated = 0;
    let skipped = 0;
    for (const ev of events) {
      const code = extractCodePayload(ev.payloadJson);
      if (!code) {
        // Non-code events: write empty array so the worker doesn't keep picking them up.
        await this.storage.setEventSymbols(ev.id, []);
        skipped++;
        continue;
      }
      try {
        let hits: Array<{ kind: string; name: string }> = [];
        if (this.async) {
          hits = await this.async.extract(code.code, { path: code.path });
        } else if (this.sync) {
          hits = this.sync.extract(code.code);
        }
        await this.storage.setEventSymbols(ev.id, hits.map(h => `${h.kind}:${h.name}`));
        annotated++;
      } catch {
        // Fail open: never let a bad extraction stall the queue.
        await this.storage.setEventSymbols(ev.id, []);
        skipped++;
      }
    }
    if (this.state === 'running') this.scheduleTick(this.interval);
    return { scanned: events.length, annotated, skipped };
  }
}
