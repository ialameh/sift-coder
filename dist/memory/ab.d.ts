/**
 * A/B savings harness for SiftCoder Memory.
 *
 * Replays captured events from the local SQLite store as a multi-turn workload and reports the
 * token cost under two regimes:
 *
 *   Branch A — full history. Every turn re-sends every prior event as transcript context. This
 *              is the upper bound on what "no memory at all" would cost in a multi-turn agent.
 *   Branch B — memory-backed. Every turn re-sends only the current event payload plus the top-k
 *              summary hits returned by hybridSearch against a synthetic query mined from the
 *              current event's most informative tokens.
 *
 * The integral over an N-turn session is the realistic cost: Branch A is O(N^2) tokens because
 * each turn re-sends the growing transcript; Branch B is O(N * (1 + k)) tokens because each turn
 * re-sends only the current event plus a fixed-size memory window.
 *
 * The harness is fully deterministic and reads only — no captures, no summarization. Run it any
 * time after a session has accumulated >=20 events.
 */
import type { Storage } from './storage/storage.js';
import type { Embedder } from './embedder.js';
export interface AbOptions {
    /** How many of the most recent events to replay. Default 100. */
    turns?: number;
    /** Memories to inject per turn in Branch B. Default 5. */
    memoryK?: number;
    /** Top-IDF tokens used to derive the synthetic query from each turn's event payload. Default 4. */
    queryTerms?: number;
    /** Override now() for retrieval recency decay. Useful for tests. */
    now?: number;
}
export interface AbTurn {
    id: number;
    ts: number;
    tool: string;
    branchATokens: number;
    branchBTokens: number;
    cumulativeA: number;
    cumulativeB: number;
}
export interface AbReport {
    turns: AbTurn[];
    totalA: number;
    totalB: number;
    savedTokens: number;
    savedPct: number;
    averageBranchAGrowth: number;
    averageBranchBSize: number;
    k: number;
}
export declare class AbHarness {
    private readonly storage;
    private readonly embedder;
    constructor(storage: Storage, embedder: Embedder | null);
    run(opts?: AbOptions): Promise<AbReport>;
}
export declare function renderAb(r: AbReport): string;
//# sourceMappingURL=ab.d.ts.map