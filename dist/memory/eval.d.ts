/**
 * Retrieval evaluation harness. Computes recall@k and Mean Reciprocal Rank (MRR) over a labeled
 * golden set: an array of {query, expectedIds[]} pairs.
 *
 * Used by tests + an opt-in nightly job to detect retrieval-quality regressions before they ship.
 */
import type { Embedder } from './embedder.js';
import { type HybridOptions } from './retrieval.js';
import type { Storage } from './storage/storage.js';
export interface GoldenItem {
    query: string;
    expectedIds: number[];
}
export interface EvalReport {
    k: number;
    recallAtK: number;
    mrr: number;
    perQuery: Array<{
        query: string;
        hitIds: number[];
        firstHitRank: number | null;
        recall: number;
    }>;
}
export declare function evaluate(storage: Storage, embedder: Embedder | null, golden: GoldenItem[], k?: number, now?: number, opts?: HybridOptions): Promise<EvalReport>;
//# sourceMappingURL=eval.d.ts.map