/**
 * Golden-set miner. Heuristically extracts (query, expected_id) pairs from past summaries:
 *
 *   - For each summary S, generate a synthetic query from its highest-IDF terms.
 *   - The expected id is S.id (self-recall: a model that can't recall a memory by its own
 *     informative terms is broken).
 *
 * Bigger corpora warrant true human-labeled queries — but self-recall is the floor every
 * retriever must clear before any other eval matters.
 */
import { tokenize } from './reranker.js';
import type { Storage } from './storage/storage.js';
import type { GoldenItem } from './eval.js';

export interface MineOptions {
  termsPerQuery?: number;
  maxItems?: number;
  minSummaryTokens?: number;
}

export async function mineGolden(storage: Storage, opts: MineOptions = {}): Promise<GoldenItem[]> {
  const termsPerQuery = opts.termsPerQuery ?? 4;
  const maxItems = opts.maxItems ?? 200;
  const minTokens = opts.minSummaryTokens ?? 4;

  const all = await storage.allEmbeddings();
  if (all.length === 0) return [];

  const ids = all.map(e => e.summaryId);
  const summaries = await storage.getSummariesByIds(ids);
  const docFreq = new Map<string, number>();
  const docs = summaries.map(s => {
    const toks = tokenize(s.text);
    const seen = new Set(toks);
    for (const t of seen) docFreq.set(t, (docFreq.get(t) ?? 0) + 1);
    return { id: s.id, tokens: toks, text: s.text };
  });

  const N = docs.length;
  const idf = (t: string): number => {
    /* c8 ignore next -- t is always present in docFreq; the ?? 0 is a defensive type guard */
    const df = docFreq.get(t) ?? 0;
    return Math.log(1 + (N - df + 0.5) / (df + 0.5));
  };

  const items: GoldenItem[] = [];
  for (const d of docs) {
    if (d.tokens.length < minTokens) continue;
    const tf = new Map<string, number>();
    for (const t of d.tokens) tf.set(t, (tf.get(t) ?? 0) + 1);
    const ranked = [...tf.keys()]
      .map(t => ({ t, score: tf.get(t)! * idf(t) }))
      .sort((a, b) => b.score - a.score)
      .slice(0, termsPerQuery)
      .map(x => x.t);
    if (ranked.length === 0) continue;
    items.push({ query: ranked.join(' '), expectedIds: [d.id] });
    if (items.length >= maxItems) break;
  }
  return items;
}
