const VALID_KINDS = new Set([
    'function', 'class', 'method', 'interface', 'type', 'const',
]);
function defaultMap(body) {
    if (!body || typeof body !== 'object')
        return [];
    const arr = body.symbols;
    if (!Array.isArray(arr))
        return [];
    const out = [];
    for (const raw of arr) {
        if (!raw || typeof raw !== 'object')
            continue;
        const r = raw;
        if (typeof r.name !== 'string' || r.name.length === 0)
            continue;
        const kindRaw = typeof r.kind === 'string' ? r.kind.toLowerCase() : 'function';
        const kind = VALID_KINDS.has(kindRaw) ? kindRaw : 'function';
        out.push({ kind, name: r.name });
    }
    return out;
}
function languageFor(path) {
    if (!path)
        return undefined;
    const ext = path.toLowerCase().slice(path.lastIndexOf('.'));
    switch (ext) {
        case '.ts':
        case '.tsx': return 'typescript';
        case '.js':
        case '.jsx':
        case '.mjs':
        case '.cjs': return 'javascript';
        case '.py': return 'python';
        case '.cls':
        case '.trigger': return 'apex';
        case '.rs': return 'rust';
        case '.go': return 'go';
        default: return undefined;
    }
}
export class CdgSymbolExtractor {
    cfg;
    constructor(opts) {
        this.cfg = {
            baseUrl: opts.baseUrl.replace(/\/+$/, ''),
            endpoint: opts.endpoint ?? '/v1/symbols',
            timeoutMs: opts.timeoutMs ?? 1500,
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
        const token = env['SIFTCODER_CDG_TOKEN'];
        return new CdgSymbolExtractor({ baseUrl: url, token, fallback });
    }
    async extract(code, opts = {}) {
        const max = opts.maxSymbols ?? 32;
        const headers = { 'content-type': 'application/json' };
        if (this.cfg.token)
            headers['authorization'] = `Bearer ${this.cfg.token}`;
        const body = JSON.stringify({
            path: opts.path,
            content: code,
            language: opts.language ?? languageFor(opts.path),
        });
        const ctrl = new AbortController();
        const timer = setTimeout(() => ctrl.abort(), this.cfg.timeoutMs);
        try {
            const res = await this.cfg.fetchImpl(this.cfg.baseUrl + this.cfg.endpoint, {
                method: 'POST',
                headers,
                body,
                signal: ctrl.signal,
            });
            if (!res.ok)
                return await this.fallbackExtract(code, opts);
            const json = await res.json();
            const hits = this.cfg.mapResponse(json);
            return hits.slice(0, max);
        }
        catch {
            return await this.fallbackExtract(code, opts);
        }
        finally {
            clearTimeout(timer);
        }
    }
    async fallbackExtract(code, opts) {
        if (!this.cfg.fallback)
            return [];
        return this.cfg.fallback.extract(code, opts);
    }
}
/**
 * Wraps a sync SymbolExtractor as an AsyncSymbolExtractor — useful as a fallback for
 * CdgSymbolExtractor without async overhead in the happy path.
 */
export class AsyncFromSync {
    sync;
    constructor(sync) {
        this.sync = sync;
    }
    async extract(code, opts = {}) {
        return this.sync.extract(code, opts);
    }
}
//# sourceMappingURL=cdg-adapter.js.map