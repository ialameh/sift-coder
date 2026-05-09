/**
 * Lightweight reranker: a model-free substitute for a cross-encoder. Re-scores top-N RRF
 * candidates using TF-IDF over query terms with a length penalty and exact-phrase bonus.
 *
 * IDF source matters. The original implementation computed IDF over the candidate set itself,
 * which collapses to ~uniform when the pool is small (every term has df ≤ 50, log term ≈ 0).
 * The new path accepts a precomputed corpus IDF map so the score reflects how rare the term is
 * in the *full memory store*, not in the query result. The caller (retrieval) plumbs through a
 * `RerankCorpus` cached at the daemon scope and refreshed periodically.
 *
 * No model download, no native deps. Switch to a real cross-encoder (bge-reranker, ms-marco)
 * when you outgrow this.
 */
import type { HybridHit } from './retrieval.js';

/**
 * Aggregate term-document statistics over the entire summaries corpus. Built once and reused
 * across many rerank calls. `df` is the number of summaries that contain the term at least
 * once; `n` is the total summary count. Pass into `rerank` as `opts.corpus`.
 */
export interface RerankCorpus {
  df: ReadonlyMap<string, number>;
  n: number;
}

/**
 * Build a `RerankCorpus` from an iterable of summary texts. Single pass: tokenize, count
 * each term once per document. O(n × tokens) — fine for the daemon to refresh every minute or
 * after every K new summaries.
 */
export function buildRerankCorpus(texts: Iterable<string>): RerankCorpus {
  const df = new Map<string, number>();
  let n = 0;
  for (const text of texts) {
    n++;
    const seen = new Set<string>();
    for (const t of tokenize(text)) seen.add(t);
    for (const t of seen) df.set(t, (df.get(t) ?? 0) + 1);
  }
  return { df, n };
}

export interface RerankOptions {
  k?: number;
  lengthPenalty?: number;
  phraseBonus?: number;
  exactTermBonus?: number;
  /** Corpus-wide IDF source. When omitted, the reranker falls back to within-pool IDF. */
  corpus?: RerankCorpus;
}

interface DocStats {
  termFreq: Map<string, number>;
  length: number;
}

const STOP = new Set(['the','a','an','of','to','in','on','for','and','or','is','are','was','were','be','it','its']);

export function tokenize(text: string): string[] {
  return (text.toLowerCase().match(/[a-z0-9_-]{2,}/g) ?? []).filter(t => !STOP.has(t));
}

function docStats(text: string): DocStats {
  const tokens = tokenize(text);
  const tf = new Map<string, number>();
  for (const t of tokens) tf.set(t, (tf.get(t) ?? 0) + 1);
  return { termFreq: tf, length: tokens.length };
}

export function rerank(query: string, hits: HybridHit[], opts: RerankOptions = {}): HybridHit[] {
  const k = opts.k ?? 5;
  const lambdaLen = opts.lengthPenalty ?? 0.01;
  const phraseBonus = opts.phraseBonus ?? 0.4;
  const exactBonus = opts.exactTermBonus ?? 0.1;

  if (hits.length === 0) return [];

  const qTokens = tokenize(query);
  if (qTokens.length === 0) return hits.slice(0, k);

  const docs = hits.map(h => docStats(h.text));
  // Corpus IDF (Robertson-Spärck-Jones smoothed BM25 form). A precomputed `opts.corpus` is the
  // accurate signal: term rarity over the whole memory store. When unavailable we fall back to
  // the within-pool count, but a 50-doc pool can't tell common from rare so the falsy bonuses
  // (phrase, exact-term) end up dominating.
  let idf: (term: string) => number;
  if (opts.corpus) {
    const N = opts.corpus.n;
    const df = opts.corpus.df;
    idf = (term: string): number => {
      const d = df.get(term) ?? 0;
      return Math.log(1 + (N - d + 0.5) / (d + 0.5));
    };
  } else {
    const docFreq = new Map<string, number>();
    for (const d of docs) {
      for (const t of d.termFreq.keys()) docFreq.set(t, (docFreq.get(t) ?? 0) + 1);
    }
    const N = docs.length;
    idf = (term: string): number => {
      /* c8 ignore next -- term is always present in docFreq when idf is invoked; ?? 0 is a type guard */
      const df = docFreq.get(term) ?? 0;
      return Math.log(1 + (N - df + 0.5) / (df + 0.5));
    };
  }

  const phrase = query.toLowerCase().trim();
  const reranked = hits.map((h, i) => {
    const d = docs[i]!;
    let score = 0;
    const seen = new Set<string>();
    for (const t of qTokens) {
      const tf = d.termFreq.get(t);
      if (!tf) continue;
      /* c8 ignore next -- d.length is non-zero whenever tf > 0; Math.max guard is defensive */
      const tfidf = (tf / Math.max(1, d.length)) * idf(t);
      score += tfidf;
      if (!seen.has(t)) {
        score += exactBonus;
        seen.add(t);
      }
    }
    if (phrase.length >= 4 && h.text.toLowerCase().includes(phrase)) score += phraseBonus;
    score -= lambdaLen * Math.log(1 + d.length);
    score += h.score * 0.5;
    return { ...h, score };
  });

  reranked.sort((a, b) => b.score - a.score);
  return reranked.slice(0, k);
}
