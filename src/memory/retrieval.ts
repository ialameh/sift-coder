/**
 * Hybrid retrieval: BM25 (FTS5) + dense (cosine) fused via Reciprocal Rank Fusion. Optional
 * Ebbinghaus recency decay applied as a multiplicative score boost, with **per-tool tau** so
 * code edits decay slower than transient bash output.
 *
 * RRF: score(d) = Σ_l 1 / (rrf_k + rank_l(d))
 * Decay: boost(d) = exp(-(now - ts(d)) / tau(tool))
 *
 * Vector backend selection:
 *   - `storage.vecEnabled === true` (sqlite-vec loaded): indexed `vec0 MATCH` scan.
 *   - else: JS-side cosine over `allEmbeddings()`. Fine up to ~10k rows.
 */
import { cosine, type Embedder } from './embedder.js';
import type { Storage, SearchHit, SummaryRow } from './storage/storage.js';
import { rerank, buildRerankCorpus, type RerankCorpus } from './reranker.js';

/**
 * Corpus IDF cache. Built lazily on first rerank call, refreshed when the summary count drifts
 * by `CORPUS_INVALIDATE_PCT` from when the cache was built. A single daemon serves many
 * searches per minute and the corpus changes slowly (~one new summary per drain), so caching
 * here saves O(n × tokens) work per query.
 */
const CORPUS_INVALIDATE_PCT = 0.05;
let corpusCache: { corpus: RerankCorpus; sourceCount: number } | null = null;

/**
 * Reset the cached corpus. Useful in tests; production callers shouldn't need this — staleness
 * is bounded by the percent-drift heuristic.
 */
export function resetRerankCorpusCache(): void {
  corpusCache = null;
}

async function getOrBuildCorpus(storage: Storage): Promise<RerankCorpus> {
  const total = await storage.countAll('summaries');
  if (corpusCache) {
    const drift = Math.abs(total - corpusCache.sourceCount) / Math.max(1, corpusCache.sourceCount);
    if (drift < CORPUS_INVALIDATE_PCT) return corpusCache.corpus;
  }
  // Sample up to 2000 most-recent summaries so the IDF stays bounded on huge stores. The
  // recency bias is intentional: query relevance tracks recent vocabulary.
  const sample = await storage.recentSummaries(2000);
  const corpus = buildRerankCorpus(sample.map(s => s.text));
  corpusCache = { corpus, sourceCount: total };
  return corpus;
}

/**
 * Per-tool Ebbinghaus tau (in ms). Lookups fall back to `decayTauMs` when the tool isn't in
 * the map. The defaults reflect signal half-life observed across coding sessions:
 *   - Long: code edits — fact survives weeks of related work.
 *   - Mid:  Read — file inspections you may revisit.
 *   - Short: shell output — usually only relevant in the moment.
 *   - Web:  web fetches — short shelf life, but worth retaining a week.
 */
export const DEFAULT_DECAY_TAU_MS_BY_TOOL: Readonly<Record<string, number>> = Object.freeze({
  Edit: 30 * 24 * 60 * 60 * 1000,
  Write: 30 * 24 * 60 * 60 * 1000,
  MultiEdit: 30 * 24 * 60 * 60 * 1000,
  NotebookEdit: 30 * 24 * 60 * 60 * 1000,
  Read: 14 * 24 * 60 * 60 * 1000,
  Glob: 7 * 24 * 60 * 60 * 1000,
  Grep: 5 * 24 * 60 * 60 * 1000,
  Bash: 3 * 24 * 60 * 60 * 1000,
  WebFetch: 7 * 24 * 60 * 60 * 1000,
  WebSearch: 7 * 24 * 60 * 60 * 1000,
});

function tauForTool(
  tool: string | undefined,
  byTool: Record<string, number>,
  fallback: number,
): number {
  if (tool && tool in byTool) return byTool[tool]!;
  return fallback;
}

export interface AsyncReranker {
  rerank(query: string, hits: HybridHit[]): Promise<HybridHit[]>;
  /**
   * Optional health probe. When implemented, `mem doctor` and `/api/doctor` invoke it to
   * surface whether the reranker server is reachable. Should be cheap (single 1-doc score).
   */
  ping?(): Promise<{ ok: boolean; latencyMs: number; error?: string }>;
}

export interface HybridOptions {
  k?: number;
  rrfK?: number;
  decayTauMs?: number;
  /** Override the per-tool decay map. Falls back to `decayTauMs` for unmapped tools. */
  decayTauMsByTool?: Record<string, number>;
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
  /** Originating tool (for downstream rendering and per-tool decay debugging). */
  tool?: string;
}

const DEFAULTS: Required<Omit<HybridOptions, 'asyncReranker' | 'boostFn' | 'decayTauMsByTool'>> = {
  k: 5,
  rrfK: 60,
  decayTauMs: 7 * 24 * 60 * 60 * 1000,
  candidatePool: 50,
  bm25Weight: 1,
  vectorWeight: 1,
  rerank: false,
};

/**
 * Preflight stage: run BM25 + (optional) vector queries and return the raw rank/score maps.
 * Pulled out of `hybridSearch` so streamingHybridSearch can emit BM25 + vector hits as they
 * land and then fuse them into the final ranking without re-querying.
 */
async function runRetrievalStages(
  storage: Storage,
  embedder: Embedder | null,
  query: string,
  pool: number,
): Promise<{
  bm25Hits: SearchHit[];
  vecRank: Map<number, number>;
  vecCos: Map<number, number>;
  vecTools: Map<number, string>;
}> {
  const bm25Hits = await storage.searchFts(query, pool);
  const vecRank = new Map<number, number>();
  const vecCos = new Map<number, number>();
  const vecTools = new Map<number, string>();
  if (embedder) {
    const qv = await embedder.embed(query);
    if (storage.vecEnabled) {
      const indexedHits = await storage.searchVec(qv, pool);
      indexedHits.forEach((e, i) => {
        vecRank.set(e.summaryId, i + 1);
        vecCos.set(e.summaryId, e.cosine);
      });
      const tools = await storage.toolsForSummaries(indexedHits.map(h => h.summaryId));
      for (const [sid, tool] of tools) vecTools.set(sid, tool);
    } else {
      const all = await storage.allEmbeddings();
      const scored = all
        .map(e => ({ id: e.summaryId, ts: e.ts, sim: cosine(qv, e.vec), tool: e.tool }))
        .sort((a, b) => b.sim - a.sim)
        .slice(0, pool);
      scored.forEach((e, i) => {
        vecRank.set(e.id, i + 1);
        vecCos.set(e.id, e.sim);
        if (e.tool) vecTools.set(e.id, e.tool);
      });
    }
  }
  return { bm25Hits, vecRank, vecCos, vecTools };
}

export async function hybridSearch(
  storage: Storage,
  embedder: Embedder | null,
  query: string,
  now: number,
  opts: HybridOptions = {}
): Promise<HybridHit[]> {
  const cfg = { ...DEFAULTS, ...opts };
  const decayByTool: Record<string, number> = opts.decayTauMsByTool ?? DEFAULT_DECAY_TAU_MS_BY_TOOL;

  const stages = await runRetrievalStages(storage, embedder, query, cfg.candidatePool);
  return await fuseAndRank(storage, query, stages, cfg, decayByTool, now, opts);
}

/**
 * Pure fusion stage: takes precomputed BM25 + vector outputs from `runRetrievalStages` and
 * produces the final ranked HybridHit list. RRF + per-tool decay + supersede sieve + optional
 * cross-encoder rerank live here. Sharing this with `streamingHybridSearch` means we don't
 * re-run the BM25 / vector queries when emitting the streaming `final` stage.
 */
async function fuseAndRank(
  storage: Storage,
  query: string,
  stages: { bm25Hits: SearchHit[]; vecRank: Map<number, number>; vecCos: Map<number, number>; vecTools: Map<number, string> },
  cfg: typeof DEFAULTS,
  decayByTool: Record<string, number>,
  now: number,
  opts: HybridOptions,
): Promise<HybridHit[]> {
  const { bm25Hits, vecRank, vecCos, vecTools } = stages;
  const bm25Rank = new Map<number, number>();
  bm25Hits.forEach((h, i) => bm25Rank.set(h.id, i + 1));

  const dropped = await storage.supersededIds();
  const pinned = await storage.pinnedIds();
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
    if (dropped.has(id) && !pinned.has(id)) continue;
    const row = summaries.get(id);
    if (!row) continue;
    const br = bm25Rank.get(id);
    const vr = vecRank.get(id);
    const rrf =
      (br ? cfg.bm25Weight / (cfg.rrfK + br) : 0) +
      (vr ? cfg.vectorWeight / (cfg.rrfK + vr) : 0);
    const tool: string | undefined = (row as SearchHit).tool ?? vecTools.get(id);
    const tau = tauForTool(tool, decayByTool, cfg.decayTauMs);
    const recency = Math.exp(-(now - row.ts) / tau);
    const score = rrf * recency;
    const eventId = (row as SearchHit).eventId ?? (row as SummaryRow).eventId;
    hits.push({
      id,
      eventId,
      text: row.text,
      ts: row.ts,
      score,
      ...(br !== undefined ? { bm25Rank: br } : {}),
      ...(vr !== undefined ? { vecRank: vr } : {}),
      ...(vecCos.has(id) ? { cosine: vecCos.get(id)! } : {}),
      recency,
      ...(tool ? { tool } : {}),
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
    const corpus = await getOrBuildCorpus(storage);
    return rerank(query, pool, { k: cfg.k, corpus });
  }
  return hits.slice(0, cfg.k);
}

/**
 * Streaming variant of hybridSearch. Emits intermediate stages via `emit` so a streaming
 * caller can render BM25 hits in ~5ms, vector hits as soon as the embedding round-trip
 * completes, and the final fused list once everything's combined. Total wall-clock is
 * unchanged from `hybridSearch`; only perceived latency improves.
 *
 * Failures inside any stage are swallowed locally so a single stage error doesn't kill the
 * stream — emit a `{ stage: 'final', hits: [] }` and let the caller see no results rather
 * than a partial-then-broken stream.
 */
export interface StreamSearchEmit {
  stage: 'bm25' | 'vector' | 'final';
  hits: Array<{ id: number; eventId: number; text: string; ts: number; tool?: string; score?: number; bm25Rank?: number; vecRank?: number; cosine?: number }>;
}

export async function streamingHybridSearch(
  storage: Storage,
  embedder: Embedder | null,
  query: string,
  now: number,
  emit: (chunk: StreamSearchEmit) => void,
  opts: HybridOptions = {},
): Promise<void> {
  const cfg = { ...DEFAULTS, ...opts };
  const decayByTool: Record<string, number> = opts.decayTauMsByTool ?? DEFAULT_DECAY_TAU_MS_BY_TOOL;

  // Stage 1: BM25 — fastest path, no embedding cost. Emit immediately and keep the result for
  // the fusion stage so we don't re-query.
  const bm25Hits = await storage.searchFts(query, cfg.candidatePool);
  emit({
    stage: 'bm25',
    hits: bm25Hits.slice(0, cfg.k).map(h => ({
      id: h.id, eventId: h.eventId, text: h.text, ts: h.ts, ...(h.tool ? { tool: h.tool } : {}),
    })),
  });

  // Stage 2: vector — embedding round-trip is the expensive part. Emit once it lands.
  // Capture the rank/cos/tools maps for fusion below.
  const vecRank = new Map<number, number>();
  const vecCos = new Map<number, number>();
  const vecTools = new Map<number, string>();
  if (embedder) {
    try {
      const qv = await embedder.embed(query);
      if (storage.vecEnabled) {
        const indexed = await storage.searchVec(qv, cfg.candidatePool);
        indexed.forEach((e, i) => {
          vecRank.set(e.summaryId, i + 1);
          vecCos.set(e.summaryId, e.cosine);
        });
        const tools = await storage.toolsForSummaries(indexed.map(h => h.summaryId));
        for (const [sid, tool] of tools) vecTools.set(sid, tool);
      } else {
        const all = await storage.allEmbeddings();
        const scored = all
          .map(e => ({ id: e.summaryId, ts: e.ts, sim: cosine(qv, e.vec), tool: e.tool }))
          .sort((a, b) => b.sim - a.sim)
          .slice(0, cfg.candidatePool);
        scored.forEach((e, i) => {
          vecRank.set(e.id, i + 1);
          vecCos.set(e.id, e.sim);
          if (e.tool) vecTools.set(e.id, e.tool);
        });
      }
      // Render the vector stage with the vec ids resolved to summary text.
      const vecIds = [...vecRank.keys()].sort((a, b) => vecRank.get(a)! - vecRank.get(b)!);
      const rows = vecIds.length > 0 ? await storage.getSummariesByIds(vecIds) : [];
      const byId = new Map(rows.map(r => [r.id, r]));
      const vecHits = vecIds.slice(0, cfg.k).map((id, i) => {
        const row = byId.get(id);
        if (!row) return null;
        const tool = vecTools.get(id);
        return {
          id, eventId: row.eventId, text: row.text, ts: row.ts,
          ...(tool ? { tool } : {}),
          cosine: vecCos.get(id)!, vecRank: i + 1,
        };
      }).filter((x): x is NonNullable<typeof x> => x !== null);
      emit({ stage: 'vector', hits: vecHits });
    } catch {
      emit({ stage: 'vector', hits: [] });
    }
  } else {
    emit({ stage: 'vector', hits: [] });
  }

  // Stage 3: final — fuse the precomputed stages. No re-querying.
  const final = await fuseAndRank(
    storage, query,
    { bm25Hits, vecRank, vecCos, vecTools },
    cfg, decayByTool, now, opts,
  );
  emit({ stage: 'final', hits: final });
}
