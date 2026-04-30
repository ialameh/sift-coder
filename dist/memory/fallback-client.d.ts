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
export declare class FallbackModelClient implements ModelClient {
    private readonly primary;
    private readonly secondary;
    private consecutiveFailures;
    private stickUntil;
    private readonly failuresBeforeStick;
    private readonly stickWindowMs;
    private readonly onFallback;
    private readonly now;
    constructor(primary: ModelClient, secondary: ModelClient, opts?: FallbackOptions);
    generate(req: ModelRequest): Promise<ModelResult>;
}
//# sourceMappingURL=fallback-client.d.ts.map