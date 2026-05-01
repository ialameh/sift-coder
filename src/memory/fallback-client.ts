/**
 * FallbackModelClient: tries primary, falls back to secondary on error.
 *
 * Used by the MCP server to chain MCP-host sampling -> direct Anthropic API:
 * if Claude Code's host hasn't advertised the sampling capability (or fails the
 * request), drain still works as long as ANTHROPIC_API_KEY is set.
 *
 * Tracks a sticky "primary unhealthy" flag — after `failuresBeforeStick` consecutive
 * primary failures, every subsequent generate() goes straight to the secondary until
 * the unhealthy window clears (`stickWindowMs`). Saves latency on the slow path.
 */
import type { ModelClient, ModelRequest, ModelResult } from './daemon/summarizer.js';

export interface FallbackOptions {
  failuresBeforeStick?: number;
  stickWindowMs?: number;
  onFallback?: (err: Error, req: ModelRequest) => void;
  now?: () => number;
}

export class FallbackModelClient implements ModelClient {
  private consecutiveFailures = 0;
  private stickUntil = 0;

  private readonly failuresBeforeStick: number;
  private readonly stickWindowMs: number;
  private readonly onFallback: (err: Error, req: ModelRequest) => void;
  private readonly now: () => number;

  constructor(
    private readonly primary: ModelClient,
    private readonly secondary: ModelClient,
    opts: FallbackOptions = {},
  ) {
    this.failuresBeforeStick = opts.failuresBeforeStick ?? 3;
    this.stickWindowMs = opts.stickWindowMs ?? 60_000;
    this.onFallback = opts.onFallback ?? (() => undefined);
    this.now = opts.now ?? Date.now;
  }

  async generate(req: ModelRequest): Promise<ModelResult> {
    if (this.now() < this.stickUntil) {
      return this.secondary.generate(req);
    }
    try {
      const r = await this.primary.generate(req);
      this.consecutiveFailures = 0;
      return r;
    } catch (e) {
      this.consecutiveFailures++;
      if (this.consecutiveFailures >= this.failuresBeforeStick) {
        this.stickUntil = this.now() + this.stickWindowMs;
      }
      this.onFallback(e as Error, req);
      return this.secondary.generate(req);
    }
  }
}
