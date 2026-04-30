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
export declare class HotspotService {
    private cache;
    private maxTemp;
    private lastRefresh;
    private readonly cfg;
    constructor(opts: HotspotServiceOptions);
    static fromEnv(env?: NodeJS.ProcessEnv): HotspotService | null;
    refresh(now?: number): Promise<void>;
    /** Returns 1.0 for unknown paths; >1.0 for hot files; max boost is `1 + alpha`. */
    boostForPath(path: string | null | undefined): number;
}
/**
 * Returns a `boostFn` suitable for HybridOptions.boostFn. Reads the source event of each hit and
 * extracts its `tool_input.file_path` (or `path`/`notebook_path`) to look up hotspot temperature.
 */
export declare function hotspotBoostFn(storage: Storage, hotspots: HotspotService): (hit: HybridHit) => number;
//# sourceMappingURL=hotspots.d.ts.map