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

export async function hybridSearch(
  storage: Storage,
  embedder: Embedder | null,
  query: string,
  now: number,
  opts: HybridOptions = {}
): Promise<HybridHit[]> {
  const cfg = { ...DEFAULTS, ...opts };
  const decayByTool: Record<string, number> = opts.decayTauMsByTool ?? DEFAULT_DECAY_TAU_MS_BY_TOOL;

  const bm25Hits = await storage.searchFts(query, cfg.candidatePool);
  const bm25Rank = new Map<number, number>();
  bm25Hits.forEach((h, i) => bm25Rank.set(h.id, i + 1));

  // Vector candidates: prefer indexed vec0 MATCH when sqlite-vec is loaded; otherwise fall
  // back to a JS-side cosine over every embedding. Both paths produce the same shape so the
  // RRF + decay + rerank stages downstream are unchanged.
  const vecRank = new Map<number, number>();
  const vecCos = new Map<number, number>();
  const vecTools = new Map<number, string>();
  if (embedder) {
    const qv = await embedder.embed(query);
    if (storage.vecEnabled) {
      const indexedHits = await storage.searchVec(qv, cfg.candidatePool);
      indexedHits.forEach((e, i) => {
        vecRank.set(e.summaryId, i + 1);
        vecCos.set(e.summaryId, e.cosine);
      });
      // Fetch tools for these ids in one query so per-tool decay can apply downstream.
      const tools = await storage.toolsForSummaries(indexedHits.map(h => h.summaryId));
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
  }

  const dropped = await storage.supersededIds();
  // Pinned summaries are exempt from the supersede sieve — even if a near-duplicate beats one
  // in cosine, the user pin is a stronger signal than the consolidator's heuristic.
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
    // Per-tool decay: tools come from BM25 hits (joined in searchFts) or the vec-side tools map.
    const tool: string | undefined = (row as SearchHit).tool ?? vecTools.get(id);
    const tau = tauForTool(tool, decayByTool, cfg.decayTauMs);
    const recency = Math.exp(-(now - row.ts) / tau);
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

  // Stage 1: BM25 — fastest path, no embedding cost. Emit immediately.
  const bm25Hits = await storage.searchFts(query, cfg.candidatePool);
  emit({
    stage: 'bm25',
    hits: bm25Hits.slice(0, cfg.k).map(h => ({
      id: h.id, eventId: h.eventId, text: h.text, ts: h.ts, ...(h.tool ? { tool: h.tool } : {}),
    })),
  });

  // Stage 2: vector — embedding round-trip is the expensive part. Emit once it lands.
  if (embedder) {
    try {
      const vecHits = await runVectorStage(storage, embedder, query, cfg.candidatePool);
      emit({
        stage: 'vector',
        hits: vecHits.slice(0, cfg.k),
      });
    } catch {
      // Vector stage failure (embedder unavailable) → emit empty stage; final still useful.
      emit({ stage: 'vector', hits: [] });
    }
  } else {
    emit({ stage: 'vector', hits: [] });
  }

  // Stage 3: final — full pipeline result. Reuses the non-streaming impl to guarantee parity.
  const final = await hybridSearch(storage, embedder, query, now, opts);
  emit({ stage: 'final', hits: final });
}

async function runVectorStage(
  storage: Storage,
  embedder: Embedder,
  query: string,
  pool: number,
): Promise<Array<{ id: number; eventId: number; text: string; ts: number; tool?: string; cosine: number; vecRank: number }>> {
  const qv = await embedder.embed(query);
  const hits: Array<{ summaryId: number; cosine: number }> = storage.vecEnabled
    ? (await storage.searchVec(qv, pool)).map(e => ({ summaryId: e.summaryId, cosine: e.cosine }))
    : (await storage.allEmbeddings())
        .map(e => ({ summaryId: e.summaryId, cosine: cosine(qv, e.vec) }))
        .sort((a, b) => b.cosine - a.cosine)
        .slice(0, pool);
  if (hits.length === 0) return [];
  const rows = await storage.getSummariesByIds(hits.map(h => h.summaryId));
  const byId = new Map(rows.map(r => [r.id, r]));
  return hits
    .map((h, i) => {
      const row = byId.get(h.summaryId);
      if (!row) return null;
      return {
        id: row.id, eventId: row.eventId, text: row.text, ts: row.ts,
        cosine: h.cosine, vecRank: i + 1,
      };
    })
    .filter((x): x is { id: number; eventId: number; text: string; ts: number; cosine: number; vecRank: number } => x !== null);
}
