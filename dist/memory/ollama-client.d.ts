/**
 * Ollama-backed ModelClient. Local-first summarization: no API key, no host MCP sampling,
 * no Anthropic billing. Targets the Ollama HTTP daemon at http://localhost:11434.
 *
 * Recommended models (small, JSON-friendly):
 *   - llama3.2:3b      ~2GB, ~50 tok/s on M1, good instruction following
 *   - qwen2.5:3b       ~2GB, excellent JSON output
 *   - gemma2:2b        ~1.6GB, fastest
 *
 * Uses Ollama's `format:"json"` constrained-generation mode so the model is forced to emit
 * valid JSON matching the {text, confidence} shape the summarizer expects.
 */
import type { ModelClient, ModelRequest, ModelResult } from './daemon/summarizer.js';
export interface OllamaClientOptions {
    host?: string;
    /** Override default model (one of the small models above). Used as-is. */
    model?: string;
    /** Override fetch for tests. */
    fetchImpl?: typeof fetch;
    /** Connection timeout in ms (default 30s — local model warm-up can be slow on first call). */
    timeoutMs?: number;
}
export declare class OllamaClient implements ModelClient {
    private readonly host;
    private readonly modelOverride;
    private readonly fetchImpl;
    private readonly timeoutMs;
    constructor(opts?: OllamaClientOptions);
    /**
     * Probe the daemon. Returns true if Ollama is reachable at the configured host. Used by
     * the MCP server to auto-select Ollama when no explicit backend is set.
     */
    static available(opts?: OllamaClientOptions): Promise<boolean>;
    generate(req: ModelRequest): Promise<ModelResult>;
}
//# sourceMappingURL=ollama-client.d.ts.map