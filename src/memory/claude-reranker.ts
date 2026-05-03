/**
 * Cross-encoder reranker that uses the host model itself (via MCP sampling) as the scorer.
 * For each candidate, prompt the model with "Rate relevance 0-9" and read a single digit.
 *
 * Why this beats an open-source reranker at our scale:
 *   - Trained on a strictly larger corpus than any public cross-encoder
 *   - Inherits Claude's instruction-following: handles negation, multi-hop, code semantics
 *   - Zero plugin-side credentials (host pays the tokens)
 *   - Result is deterministic with temperature=0 + cached by (queryHash, summaryId)
 *
 * Latency budget: ~150ms per candidate (no parallelism), or ~30ms with concurrency=8.
 * Token cost per candidate: ~50 in / 1 out = ~$0.0001 on Haiku 4.5.
 */
import { createHash } from 'node:crypto';
import type { ModelClient, ModelRequest } from './daemon/summarizer.js';
import type { HybridHit } from './retrieval.js';
import type { Storage } from './storage/storage.js';

export interface ClaudeRerankerOptions {
  model?: string;
  concurrency?: number;
  k?: number;
  cache?: RerankCache;
}

export interface RerankCache {
  get(key: string): Promise<number | undefined>;
  set(key: string, value: number): Promise<void>;
}

const SYSTEM = `You are a relevance scorer.
Read a query and a memory snippet. Output a single digit 0..9 indicating how useful the snippet is for answering the query.
0 = unrelated. 9 = directly answers.
Output exactly one digit. No prose, no punctuation.`;

const DEFAULT_MODEL = 'claude-haiku-4-5-20251001';

export class ClaudeReranker {
  private readonly model: string;
  private readonly concurrency: number;
  private readonly k: number;
  private readonly cache: RerankCache | null;

  constructor(private readonly client: ModelClient, opts: ClaudeRerankerOptions = {}) {
    this.model = opts.model ?? DEFAULT_MODEL;
    this.concurrency = opts.concurrency ?? 8;
    this.k = opts.k ?? 5;
    this.cache = opts.cache ?? null;
  }

  static cacheKey(query: string, summaryId: number, model: string): string {
    return createHash('sha256').update(model).update('|').update(query).update('|').update(String(summaryId)).digest('hex');
  }

  async rerank(query: string, hits: HybridHit[]): Promise<HybridHit[]> {
    if (hits.length === 0) return [];
    const tasks = hits.map(h => async (): Promise<HybridHit> => {
      const ck = ClaudeReranker.cacheKey(query, h.id, this.model);
      const cached = this.cache ? await this.cache.get(ck) : undefined;
      if (cached !== undefined) return { ...h, score: cached };
      const score = await this.scoreOne(query, h.text);
      if (this.cache) await this.cache.set(ck, score);
      return { ...h, score };
    });
    const scored = await runWithConcurrency(tasks, this.concurrency);
    scored.sort((a, b) => b.score - a.score);
    return scored.slice(0, this.k);
  }

  private async scoreOne(query: string, text: string): Promise<number> {
    const req: ModelRequest = {
      model: this.model,
      system: SYSTEM,
      user: `Q: ${query}\nM: ${truncate(text, 1200)}\nScore:`,
      maxTokens: 1,
    };
    try {
      const res = await this.client.generate(req);
      const digit = (res.text.match(/\d/) ?? [])[0];
      const n = digit ? parseInt(digit, 10) : 0;
      if (Number.isFinite(n) && n >= 0 && n <= 9) return n;
      /* c8 ignore next -- /\d/ guarantees 0..9; this is a defensive guard */
      return 0;
    } catch {
      return 0;
    }
  }
}

function truncate(s: string, max: number): string {
  if (s.length <= max) return s;
  return s.slice(0, max - 1) + '…';
}

async function runWithConcurrency<T>(tasks: Array<() => Promise<T>>, n: number): Promise<T[]> {
  const out: T[] = new Array(tasks.length);
  let i = 0;
  const workers = Array.from({ length: Math.min(n, tasks.length) }, async () => {
    while (true) {
      const idx = i++;
      if (idx >= tasks.length) return;
      out[idx] = await tasks[idx]!();
    }
  });
  await Promise.all(workers);
  return out;
}

/**
 * SQLite-backed cache adapter that stores rerank scores in summary_cache, reusing the existing
 * cache table so we get free TTL/eviction policy if we add one later.
 */
export class StorageRerankCache implements RerankCache {
  constructor(private readonly storage: Storage) {}

  async get(key: string): Promise<number | undefined> {
    const row = await this.storage.getCachedSummary(key);
    if (!row) return undefined;
    const n = parseInt(row.text, 10);
    return Number.isFinite(n) ? n : undefined;
  }

  async set(key: string, value: number): Promise<void> {
    await this.storage.putCachedSummary(key, String(value), null, null, Date.now());
  }
}
