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
import { cosine, type Embedder } from './embedder.js';
import type { Storage, SearchHit, SummaryRow } from './storage/storage.js';
import { rerank } from './reranker.js';

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
  boostFn?: ((hit: HybridHit) => number) | null;
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

const DEFAULTS: Required<Omit<HybridOptions, 'asyncReranker' | 'boostFn'>> = {
  k: 5,
  rrfK: 60,
  decayTauMs: 7 * 24 * 60 * 60 * 1000,
  candidatePool: 50,
  bm25Weight: 1,
  vectorWeight: 1,
  rerank: false,
};

export async function hybridSearch(
  storage: Storage,
  embedder: Embedder | null,
  query: string,
  now: number,
  opts: HybridOptions = {}
): Promise<HybridHit[]> {
  const cfg = { ...DEFAULTS, ...opts };

  const bm25Hits = await storage.searchFts(query, cfg.candidatePool);
  const bm25Rank = new Map<number, number>();
  bm25Hits.forEach((h, i) => bm25Rank.set(h.id, i + 1));

  const vecRank = new Map<number, number>();
  const vecCos = new Map<number, number>();
  if (embedder) {
    const qv = await embedder.embed(query);
    const all = await storage.allEmbeddings();
    const scored = all
      .map(e => ({ id: e.summaryId, ts: e.ts, sim: cosine(qv, e.vec) }))
      .sort((a, b) => b.sim - a.sim)
      .slice(0, cfg.candidatePool);
    scored.forEach((e, i) => {
      vecRank.set(e.id, i + 1);
      vecCos.set(e.id, e.sim);
    });
  }

  const dropped = await storage.supersededIds();
  const ids = new Set<number>([...bm25Rank.keys(), ...vecRank.keys()]);

  const summaries = new Map<number, SearchHit | SummaryRow>();
  for (const h of bm25Hits) summaries.set(h.id, h);

  const missing: number[] = [];
  for (const id of ids) if (!summaries.has(id)) missing.push(id);
  if (missing.length > 0) {
    const rows = await storage.getSummariesByIds(missing);
    for (const r of rows) summaries.set(r.id, r);
  }

  const hits: HybridHit[] = [];
  for (const id of ids) {
    if (dropped.has(id)) continue;
    const row = summaries.get(id);
    if (!row) continue;
    const br = bm25Rank.get(id);
    const vr = vecRank.get(id);
    const rrf =
      (br ? cfg.bm25Weight / (cfg.rrfK + br) : 0) +
      (vr ? cfg.vectorWeight / (cfg.rrfK + vr) : 0);
    const recency = Math.exp(-(now - row.ts) / cfg.decayTauMs);
    const score = rrf * recency;
    const text = row.text;
    const eventId = (row as SearchHit).eventId ?? (row as SummaryRow).eventId;
    hits.push({
      id,
      eventId,
      text,
      ts: row.ts,
      score,
      ...(br !== undefined ? { bm25Rank: br } : {}),
      ...(vr !== undefined ? { vecRank: vr } : {}),
      ...(vecCos.has(id) ? { cosine: vecCos.get(id)! } : {}),
      recency,
    });
  }

  if (opts.boostFn) {
    for (const h of hits) h.score = h.score * await opts.boostFn(h);
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
