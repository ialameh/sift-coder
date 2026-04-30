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
import { cosine } from './embedder.js';
import { rerank } from './reranker.js';
const DEFAULTS = {
    k: 5,
    rrfK: 60,
    decayTauMs: 7 * 24 * 60 * 60 * 1000,
    candidatePool: 50,
    bm25Weight: 1,
    vectorWeight: 1,
    rerank: false,
};
export async function hybridSearch(storage, embedder, query, now, opts = {}) {
    const cfg = { ...DEFAULTS, ...opts };
    const bm25Hits = storage.searchFts(query, cfg.candidatePool);
    const bm25Rank = new Map();
    bm25Hits.forEach((h, i) => bm25Rank.set(h.id, i + 1));
    const vecRank = new Map();
    const vecCos = new Map();
    if (embedder) {
        const qv = await embedder.embed(query);
        const all = storage.allEmbeddings();
        const scored = all
            .map(e => ({ id: e.summaryId, ts: e.ts, sim: cosine(qv, e.vec) }))
            .sort((a, b) => b.sim - a.sim)
            .slice(0, cfg.candidatePool);
        scored.forEach((e, i) => {
            vecRank.set(e.id, i + 1);
            vecCos.set(e.id, e.sim);
        });
    }
    const dropped = storage.supersededIds();
    const ids = new Set([...bm25Rank.keys(), ...vecRank.keys()]);
    const summaries = new Map();
    for (const h of bm25Hits)
        summaries.set(h.id, h);
    const missing = [];
    for (const id of ids)
        if (!summaries.has(id))
            missing.push(id);
    if (missing.length > 0) {
        const rows = storage.getSummariesByIds(missing);
        for (const r of rows)
            summaries.set(r.id, r);
    }
    const hits = [];
    for (const id of ids) {
        if (dropped.has(id))
            continue;
        const row = summaries.get(id);
        if (!row)
            continue;
        const br = bm25Rank.get(id);
        const vr = vecRank.get(id);
        const rrf = (br ? cfg.bm25Weight / (cfg.rrfK + br) : 0) +
            (vr ? cfg.vectorWeight / (cfg.rrfK + vr) : 0);
        const recency = Math.exp(-(now - row.ts) / cfg.decayTauMs);
        const score = rrf * recency;
        const text = row.text;
        const eventId = row.eventId ?? row.eventId;
        hits.push({
            id,
            eventId,
            text,
            ts: row.ts,
            score,
            ...(br !== undefined ? { bm25Rank: br } : {}),
            ...(vr !== undefined ? { vecRank: vr } : {}),
            ...(vecCos.has(id) ? { cosine: vecCos.get(id) } : {}),
            recency,
        });
    }
    hits.sort((a, b) => b.score - a.score);
    const pool = hits.slice(0, cfg.candidatePool);
    if (opts.asyncReranker) {
        const reranked = await opts.asyncReranker.rerank(query, pool);
        return reranked.slice(0, cfg.k);
    }
    if (cfg.rerank) {
        return rerank(query, pool, { k: cfg.k });
    }
    return hits.slice(0, cfg.k);
}
//# sourceMappingURL=retrieval.js.map