/**
 * Hybrid retrieval: BM25 (FTS5) + dense (cosine over JS-side embeddings) fused via Reciprocal Rank Fusion.
 * Optional Ebbinghaus recency decay applied as a multiplicative score boost.
 *
 * RRF: score(d) = Σ_l 1 / (rrf_k + rank_l(d))
 * Decay: boost(d) = exp(-(now - ts(d)) / tau_ms)
 *
 * Vector search is intentionally JS-side over allEmbeddings(): for the small N typical of memory
 * (up to ~10k summaries), this is faster than round-tripping a sqlite-vec MATCH per query, and
 * avoids the optional native dependency. Switch to vec0 when corpora exceed that scale.
 */
import { type Embedder } from './embedder.js';
import type { Storage } from './storage/storage.js';
export interface AsyncReranker {
    rerank(query: string, hits: HybridHit[]): Promise<HybridHit[]>;
}
export interface HybridOptions {
    k?: number;
    rrfK?: number;
    decayTauMs?: number;
    candidatePool?: number;
    bm25Weight?: number;
    vectorWeight?: number;
    rerank?: boolean;
    asyncReranker?: AsyncReranker | null;
}
export interface HybridHit {
    id: number;
    eventId: number;
    text: string;
    ts: number;
    score: number;
    bm25Rank?: number;
    vecRank?: number;
    cosine?: number;
    recency?: number;
}
export declare function hybridSearch(storage: Storage, embedder: Embedder | null, query: string, now: number, opts?: HybridOptions): Promise<HybridHit[]>;
//# sourceMappingURL=retrieval.d.ts.map