import { l2Normalize } from './embedder.js';
function defaultMap(body) {
    if (!body || typeof body !== 'object')
        return null;
    const v = body.vector;
    if (!Array.isArray(v))
        return null;
    const out = new Float32Array(v.length);
    for (let i = 0; i < v.length; i++) {
        const n = Number(v[i]);
        if (!Number.isFinite(n))
            return null;
        out[i] = n;
    }
    return out;
}
export class CdgEmbedder {
    dim;
    cfg;
    constructor(opts) {
        this.dim = opts.dim ?? 384;
        this.cfg = {
            baseUrl: opts.baseUrl.replace(/\/+$/, ''),
            endpoint: opts.endpoint ?? '/v1/embed',
            timeoutMs: opts.timeoutMs ?? 2000,
            token: opts.token,
            fallback: opts.fallback ?? null,
            /* c8 ignore next -- default real fetch only used when no fetchImpl injected */
            fetchImpl: opts.fetchImpl ?? ((input, init) => fetch(input, init)),
            mapResponse: opts.mapResponse ?? defaultMap,
        };
    }
    static fromEnv(env = process.env, fallback = null) {
        const url = env['SIFTCODER_CDG_URL'];
        if (!url)
            return null;
        return new CdgEmbedder({ baseUrl: url, token: env['SIFTCODER_CDG_TOKEN'], fallback });
    }
    async embed(text) {
        if (!text || text.trim().length === 0)
            return new Float32Array(this.dim);
        const headers = { 'content-type': 'application/json' };
        if (this.cfg.token)
            headers['authorization'] = `Bearer ${this.cfg.token}`;
        const ctrl = new AbortController();
        const timer = setTimeout(() => ctrl.abort(), this.cfg.timeoutMs);
        try {
            const res = await this.cfg.fetchImpl(this.cfg.baseUrl + this.cfg.endpoint, {
                method: 'POST',
                headers,
                body: JSON.stringify({ text }),
                signal: ctrl.signal,
            });
            if (!res.ok)
                return await this.fallbackEmbed(text);
            const json = await res.json();
            const vec = this.cfg.mapResponse(json);
            if (!vec || vec.length === 0)
                return await this.fallbackEmbed(text);
            return l2Normalize(vec);
        }
        catch {
            return await this.fallbackEmbed(text);
        }
        finally {
            clearTimeout(timer);
        }
    }
    async fallbackEmbed(text) {
        if (!this.cfg.fallback)
            return new Float32Array(this.dim);
        return this.cfg.fallback.embed(text);
    }
}
//# sourceMappingURL=cdg-embedder.js.map