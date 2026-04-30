const DEFAULT_HOST = 'http://localhost:11434';
export class OllamaClient {
    host;
    modelOverride;
    fetchImpl;
    timeoutMs;
    constructor(opts = {}) {
        this.host = (opts.host ?? process.env['SIFTCODER_OLLAMA_HOST'] ?? DEFAULT_HOST).replace(/\/+$/, '');
        this.modelOverride = opts.model ?? process.env['SIFTCODER_OLLAMA_MODEL'] ?? null;
        /* c8 ignore next -- production path uses globalThis.fetch; tests inject */
        this.fetchImpl = opts.fetchImpl ?? globalThis.fetch;
        this.timeoutMs = opts.timeoutMs ?? 30_000;
    }
    /**
     * Probe the daemon. Returns true if Ollama is reachable at the configured host. Used by
     * the MCP server to auto-select Ollama when no explicit backend is set.
     */
    static async available(opts = {}) {
        const host = (opts.host ?? process.env['SIFTCODER_OLLAMA_HOST'] ?? DEFAULT_HOST).replace(/\/+$/, '');
        /* c8 ignore next -- prod path uses globalThis.fetch */
        const fetchImpl = opts.fetchImpl ?? globalThis.fetch;
        const ctl = new AbortController();
        /* c8 ignore next -- abort fires only on real-network probe timeout; covered by integration */
        const timer = setTimeout(() => ctl.abort(), 1500);
        try {
            const res = await fetchImpl(`${host}/api/tags`, { signal: ctl.signal });
            return res.ok;
        }
        catch {
            return false;
        }
        finally {
            clearTimeout(timer);
        }
    }
    async generate(req) {
        // Ollama's "model" doesn't accept Anthropic model names. Use the override (env or
        // constructor) — fall back to llama3.2:3b which is the most commonly-pulled small model.
        const model = this.modelOverride ?? 'llama3.2:3b';
        const prompt = req.system ? `${req.system}\n\n${req.user}` : req.user;
        const body = JSON.stringify({
            model,
            prompt,
            stream: false,
            format: 'json',
            options: { temperature: 0, num_predict: req.maxTokens },
        });
        const ctl = new AbortController();
        /* c8 ignore next -- abort fires only on real-network generate timeout; covered by integration */
        const timer = setTimeout(() => ctl.abort(), this.timeoutMs);
        try {
            const res = await this.fetchImpl(`${this.host}/api/generate`, {
                method: 'POST',
                headers: { 'content-type': 'application/json' },
                body,
                signal: ctl.signal,
            });
            if (!res.ok) {
                throw new Error(`ollama api ${res.status} ${res.statusText}`);
            }
            const json = (await res.json());
            return {
                text: json.response ?? '',
                tokensIn: json.prompt_eval_count ?? null,
                tokensOut: json.eval_count ?? null,
            };
        }
        finally {
            clearTimeout(timer);
        }
    }
}
//# sourceMappingURL=ollama-client.js.map