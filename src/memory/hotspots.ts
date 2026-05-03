/**
 * Hotspot-driven retrieval boost.
 *
 * Pulls per-file "temperature" scores from CDG (`/v1/hotspots`), caches them, and exposes a
 * `boostFor(hit)` function that retrieval consumes via HybridOptions.boostFn. Hits whose source
 * event references a hot file receive a multiplicative score boost — they decay slower against
 * the global Ebbinghaus τ.
 *
 * Design:
 *   - Refresh cache every `refreshIntervalMs` (default 5 min) on demand.
 *   - File path of a hit is read from the underlying summary's source event payload.
 *   - boost factor = 1 + alpha * normalize(temperature)
 *   - Falls back to neutral boost (1.0) when CDG unreachable.
 */
import type { Storage } from './storage/storage.js';
import type { HybridHit } from './retrieval.js';
import type { FetchLike } from './cdg-adapter.js';

export interface HotspotEntry {
  path: string;
  temperature: number;
}

export interface HotspotServiceOptions {
  baseUrl: string;
  token?: string;
  endpoint?: string;
  refreshIntervalMs?: number;
  alpha?: number;
  fetchImpl?: FetchLike;
}

interface ParsedResponse {
  entries: HotspotEntry[];
  max: number;
}

function parseResponse(body: unknown): ParsedResponse {
  if (!body || typeof body !== 'object') return { entries: [], max: 0 };
  const arr = (body as { hotspots?: unknown }).hotspots;
  if (!Array.isArray(arr)) return { entries: [], max: 0 };
  const entries: HotspotEntry[] = [];
  let max = 0;
  for (const raw of arr) {
    if (!raw || typeof raw !== 'object') continue;
    const r = raw as { path?: unknown; temperature?: unknown };
    if (typeof r.path !== 'string') continue;
    const t = Number(r.temperature);
    if (!Number.isFinite(t) || t < 0) continue;
    entries.push({ path: r.path, temperature: t });
    if (t > max) max = t;
  }
  return { entries, max };
}

export class HotspotService {
  private cache = new Map<string, number>();
  private maxTemp = 0;
  private lastRefresh = 0;
  private readonly cfg: Required<Omit<HotspotServiceOptions, 'token' | 'fetchImpl'>> & {
    token: string | undefined;
    fetchImpl: FetchLike;
  };

  constructor(opts: HotspotServiceOptions) {
    this.cfg = {
      baseUrl: opts.baseUrl.replace(/\/+$/, ''),
      endpoint: opts.endpoint ?? '/v1/hotspots',
      refreshIntervalMs: opts.refreshIntervalMs ?? 5 * 60 * 1000,
      alpha: opts.alpha ?? 0.5,
      token: opts.token,
      /* c8 ignore next -- default real fetch only used when no fetchImpl injected */
      fetchImpl: opts.fetchImpl ?? ((input, init) => fetch(input, init) as unknown as ReturnType<FetchLike>),
    };
  }

  static fromEnv(env: NodeJS.ProcessEnv = process.env): HotspotService | null {
    const url = env['SIFTCODER_CDG_URL'];
    if (!url) return null;
    return new HotspotService({ baseUrl: url, token: env['SIFTCODER_CDG_TOKEN'] });
  }

  async refresh(now: number = Date.now()): Promise<void> {
    if (this.lastRefresh > 0 && now - this.lastRefresh < this.cfg.refreshIntervalMs) return;
    const headers: Record<string, string> = {};
    if (this.cfg.token) headers['authorization'] = `Bearer ${this.cfg.token}`;
    try {
      const res = await this.cfg.fetchImpl(this.cfg.baseUrl + this.cfg.endpoint, { method: 'GET', headers });
      if (!res.ok) return;
      const body = await res.json();
      const parsed = parseResponse(body);
      this.cache.clear();
      for (const e of parsed.entries) this.cache.set(e.path, e.temperature);
      this.maxTemp = parsed.max;
      this.lastRefresh = now;
    } catch {
      /* keep stale cache */
    }
  }

  /** Returns 1.0 for unknown paths; >1.0 for hot files; max boost is `1 + alpha`. */
  boostForPath(path: string | null | undefined): number {
    if (!path) return 1;
    const t = this.cache.get(path);
    if (t === undefined || this.maxTemp <= 0) return 1;
    return 1 + this.cfg.alpha * (t / this.maxTemp);
  }
}

/**
 * Returns a `boostFn` suitable for HybridOptions.boostFn. Reads the source event of each hit and
 * extracts its `tool_input.file_path` (or `path`/`notebook_path`) to look up hotspot temperature.
 */
export function hotspotBoostFn(storage: Storage, hotspots: HotspotService): (hit: HybridHit) => Promise<number> {
  return async (hit: HybridHit) => {
    const ev = await storage.getEvent(hit.eventId);
    if (!ev) return 1;
    let payload: unknown;
    try { payload = JSON.parse(ev.payloadJson); } catch { return 1; }
    if (!payload || typeof payload !== 'object') return 1;
    const input = (payload as { tool_input?: unknown }).tool_input;
    if (!input || typeof input !== 'object') return 1;
    const i = input as { file_path?: unknown; path?: unknown; notebook_path?: unknown };
    const path = (typeof i.file_path === 'string' ? i.file_path :
                  typeof i.path === 'string' ? i.path :
                  typeof i.notebook_path === 'string' ? i.notebook_path : null);
    return hotspots.boostForPath(path);
  };
}
