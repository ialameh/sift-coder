/**
 * Direct Anthropic Messages API client implementing ModelClient.
 *
 * Used as a fallback when MCP host sampling is unavailable (sampling/createMessage returns
 * an error, or the host doesn't advertise the capability). Reads the API key from
 * `ANTHROPIC_API_KEY` (or `SIFTCODER_ANTHROPIC_API_KEY` to scope a separate budget).
 *
 * Uses the global `fetch` (Node 18+) so there's no SDK dependency. Returns a clean error
 * if the env var is missing — caller decides whether to surface or swallow.
 */
import type { ModelClient, ModelRequest, ModelResult } from './daemon/summarizer.js';
export interface AnthropicClientOptions {
    apiKey?: string;
    /** Override fetch for tests. */
    fetchImpl?: typeof fetch;
    /** Retry on 5xx / network errors. Default 1 (single retry). */
    maxRetries?: number;
    /** Override base URL for tests. */
    apiUrl?: string;
}
export declare class AnthropicClient implements ModelClient {
    private readonly apiKey;
    private readonly fetchImpl;
    private readonly maxRetries;
    private readonly apiUrl;
    constructor(opts?: AnthropicClientOptions);
    static available(env?: NodeJS.ProcessEnv): boolean;
    generate(req: ModelRequest): Promise<ModelResult>;
}
//# sourceMappingURL=anthropic-client.d.ts.map