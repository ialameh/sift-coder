const API_URL = 'https://api.anthropic.com/v1/messages';
const ANTHROPIC_VERSION = '2023-06-01';
export class AnthropicClient {
    apiKey;
    fetchImpl;
    maxRetries;
    apiUrl;
    constructor(opts = {}) {
        const key = opts.apiKey ?? process.env['SIFTCODER_ANTHROPIC_API_KEY'] ?? process.env['ANTHROPIC_API_KEY'];
        if (!key) {
            throw new Error('AnthropicClient: no API key (set SIFTCODER_ANTHROPIC_API_KEY or ANTHROPIC_API_KEY)');
        }
        this.apiKey = key;
        /* c8 ignore next -- production path uses globalThis.fetch; tests always inject fetchImpl */
        this.fetchImpl = opts.fetchImpl ?? globalThis.fetch;
        this.maxRetries = opts.maxRetries ?? 1;
        this.apiUrl = opts.apiUrl ?? API_URL;
    }
    static available(env = process.env) {
        return Boolean(env['SIFTCODER_ANTHROPIC_API_KEY'] || env['ANTHROPIC_API_KEY']);
    }
    async generate(req) {
        const body = JSON.stringify({
            model: req.model,
            max_tokens: req.maxTokens,
            system: req.system,
            temperature: 0,
            messages: [{ role: 'user', content: req.user }],
        });
        let attempt = 0;
        let lastErr = null;
        while (attempt <= this.maxRetries) {
            try {
                const res = await this.fetchImpl(this.apiUrl, {
                    method: 'POST',
                    headers: {
                        'content-type': 'application/json',
                        'x-api-key': this.apiKey,
                        'anthropic-version': ANTHROPIC_VERSION,
                    },
                    body,
                });
                if (res.status >= 500) {
                    lastErr = new Error(`anthropic api ${res.status}`);
                    attempt++;
                    continue;
                }
                const json = (await res.json());
                if (!res.ok || json.error) {
                    /* c8 ignore next -- statusText fallback only triggers on body-less HTTP errors; tests always include `error` */
                    throw new Error(`anthropic api error: ${json.error?.message ?? res.statusText}`);
                }
                const text = (json.content ?? [])
                    .filter(b => b.type === 'text' && typeof b.text === 'string')
                    .map(b => b.text)
                    .join('');
                return {
                    text,
                    tokensIn: json.usage?.input_tokens ?? null,
                    tokensOut: json.usage?.output_tokens ?? null,
                };
            }
            catch (e) {
                lastErr = e;
                attempt++;
            }
        }
        /* c8 ignore next -- while-loop guarantees at least one assignment to lastErr before throw; defensive guard only */
        throw lastErr ?? new Error('anthropic api: unknown error');
    }
}
//# sourceMappingURL=anthropic-client.js.map