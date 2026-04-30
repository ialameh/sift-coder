/**
 * Retrieval evaluation harness. Computes recall@k and Mean Reciprocal Rank (MRR) over a labeled
 * golden set: an array of {query, expectedIds[]} pairs.
 *
 * Used by tests + an opt-in nightly job to detect retrieval-quality regressions before they ship.
 */
import type { Embedder } from './embedder.js';
import { hybridSearch, type HybridOptions } from './retrieval.js';
import type { Storage } from './storage/storage.js';

export interface GoldenItem {
  query: string;
  expectedIds: number[];
}

export interface EvalReport {
  k: number;
  recallAtK: number;
  mrr: number;
  perQuery: Array<{ query: string; hitIds: number[]; firstHitRank: number | null; recall: number }>;
}

export async function evaluate(
  storage: Storage,
  embedder: Embedder | null,
  golden: GoldenItem[],
  k = 5,
  now: number = Date.now(),
  opts: HybridOptions = {}
): Promise<EvalReport> {
  let recallSum = 0;
  let rrSum = 0;
  const perQuery: EvalReport['perQuery'] = [];
  for (const item of golden) {
    const hits = await hybridSearch(storage, embedder, item.query, now, { ...opts, k });
    const hitIds = hits.map(h => h.id);
    const expected = new Set(item.expectedIds);
    const matched = hitIds.filter(id => expected.has(id)).length;
    const recall = expected.size === 0 ? 1 : matched / expected.size;
    recallSum += recall;

    let firstHitRank: number | null = null;
    for (let i = 0; i < hitIds.length; i++) {
      if (expected.has(hitIds[i]!)) {
        firstHitRank = i + 1;
        break;
      }
    }
    rrSum += firstHitRank !== null ? 1 / firstHitRank : 0;
    perQuery.push({ query: item.query, hitIds, firstHitRank, recall });
  }
  const n = golden.length;
  return {
    k,
    recallAtK: n === 0 ? 0 : recallSum / n,
    mrr: n === 0 ? 0 : rrSum / n,
    perQuery,
  };
}
