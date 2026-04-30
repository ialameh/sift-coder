function parseResponse(body) {
    if (!body || typeof body !== 'object')
        return { entries: [], max: 0 };
    const arr = body.hotspots;
    if (!Array.isArray(arr))
        return { entries: [], max: 0 };
    const entries = [];
    let max = 0;
    for (const raw of arr) {
        if (!raw || typeof raw !== 'object')
            continue;
        const r = raw;
        if (typeof r.path !== 'string')
            continue;
        const t = Number(r.temperature);
        if (!Number.isFinite(t) || t < 0)
            continue;
        entries.push({ path: r.path, temperature: t });
        if (t > max)
            max = t;
    }
    return { entries, max };
}
export class HotspotService {
    cache = new Map();
    maxTemp = 0;
    lastRefresh = 0;
    cfg;
    constructor(opts) {
        this.cfg = {
            baseUrl: opts.baseUrl.replace(/\/+$/, ''),
            endpoint: opts.endpoint ?? '/v1/hotspots',
            refreshIntervalMs: opts.refreshIntervalMs ?? 5 * 60 * 1000,
            alpha: opts.alpha ?? 0.5,
            token: opts.token,
            /* c8 ignore next -- default real fetch only used when no fetchImpl injected */
            fetchImpl: opts.fetchImpl ?? ((input, init) => fetch(input, init)),
        };
    }
    static fromEnv(env = process.env) {
        const url = env['SIFTCODER_CDG_URL'];
        if (!url)
            return null;
        return new HotspotService({ baseUrl: url, token: env['SIFTCODER_CDG_TOKEN'] });
    }
    async refresh(now = Date.now()) {
        if (this.lastRefresh > 0 && now - this.lastRefresh < this.cfg.refreshIntervalMs)
            return;
        const headers = {};
        if (this.cfg.token)
            headers['authorization'] = `Bearer ${this.cfg.token}`;
        try {
            const res = await this.cfg.fetchImpl(this.cfg.baseUrl + this.cfg.endpoint, { method: 'GET', headers });
            if (!res.ok)
                return;
            const body = await res.json();
            const parsed = parseResponse(body);
            this.cache.clear();
            for (const e of parsed.entries)
                this.cache.set(e.path, e.temperature);
            this.maxTemp = parsed.max;
            this.lastRefresh = now;
        }
        catch {
            /* keep stale cache */
        }
    }
    /** Returns 1.0 for unknown paths; >1.0 for hot files; max boost is `1 + alpha`. */
    boostForPath(path) {
        if (!path)
            return 1;
        const t = this.cache.get(path);
        if (t === undefined || this.maxTemp <= 0)
            return 1;
        return 1 + this.cfg.alpha * (t / this.maxTemp);
    }
}
/**
 * Returns a `boostFn` suitable for HybridOptions.boostFn. Reads the source event of each hit and
 * extracts its `tool_input.file_path` (or `path`/`notebook_path`) to look up hotspot temperature.
 */
export function hotspotBoostFn(storage, hotspots) {
    return (hit) => {
        const ev = storage.getEvent(hit.eventId);
        if (!ev)
            return 1;
        let payload;
        try {
            payload = JSON.parse(ev.payloadJson);
        }
        catch {
            return 1;
        }
        if (!payload || typeof payload !== 'object')
            return 1;
        const input = payload.tool_input;
        if (!input || typeof input !== 'object')
            return 1;
        const i = input;
        const path = (typeof i.file_path === 'string' ? i.file_path :
            typeof i.path === 'string' ? i.path :
                typeof i.notebook_path === 'string' ? i.notebook_path : null);
        return hotspots.boostForPath(path);
    };
}
//# sourceMappingURL=hotspots.js.map