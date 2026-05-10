/**
 * Cross-encoder reranker integration.
 *
 * Why cross-encoder: BM25 + vector + RRF gives a strong baseline candidate pool, but the final
 * top-k ordering benefits from a model that scores (query, document) pairs jointly rather than
 * scoring document and query in independent embedding spaces. Cross-encoders typically improve
 * NDCG@5 by 5–15% on top of strong dual-encoder retrievers.
 *
 * Why HTTP-based: bundling ONNX runtime would add ~50MB binary deps to a CLI plugin. Instead,
 * the user runs their own scoring service (text-embeddings-inference, jina-reranker-server,
 * Cohere API, etc.) and points us at it via `SIFTCODER_RERANKER_URL`. Zero plugin-side binary
 * cost; opt-in via env var.
 *
 * Compatible response shapes (auto-detected):
 *   - Jina/TEI:     { scores: number[] }                    — same order as documents
 *   - Cohere:       { results: [{ index, relevance_score }] } — sparse, by document index
 *
 * Failures (non-2xx, timeout, malformed body) fall back silently to the unranked HybridHit
 * order from `hybridSearch` so a flaky reranker never breaks search.
 */
import type { AsyncReranker, HybridHit } from './retrieval.js';

export interface CrossEncoder {
  /** Score (query, doc) pairs. Returns one score per doc, in the same order as `docs`. */
  score(query: string, docs: string[]): Promise<number[]>;
}

export interface FetchLike {
  (input: string, init?: { method?: string; headers?: Record<string, string>; body?: string }): Promise<{
    ok: boolean; status: number; json(): Promise<unknown>;
  }>;
}

export interface HttpCrossEncoderOptions {
  baseUrl: string;
  /** Optional bearer token (Cohere/proxy auth). */
  token?: string;
  /** Endpoint path under baseUrl. Defaults to `/rerank` (matches TEI / Jina). */
  endpoint?: string;
  /** Hard timeout per request. Default 5s. */
  timeoutMs?: number;
  fetchImpl?: FetchLike;
}

export class HttpCrossEncoder implements CrossEncoder {
  private readonly cfg: Required<Omit<HttpCrossEncoderOptions, 'fetchImpl' | 'token'>> & {
    fetchImpl: FetchLike;
    token: string | null;
  };

  constructor(opts: HttpCrossEncoderOptions) {
    this.cfg = {
      baseUrl: opts.baseUrl.replace(/\/+$/, ''),
      token: opts.token ?? null,
      endpoint: opts.endpoint ?? '/rerank',
      timeoutMs: opts.timeoutMs ?? 5000,
      /* c8 ignore next -- default real fetch only used when no fetchImpl injected */
      fetchImpl: opts.fetchImpl ?? ((input, init) => fetch(input, init) as unknown as ReturnType<FetchLike>),
    };
  }

  async score(query: string, docs: string[]): Promise<number[]> {
    if (docs.length === 0) return [];
    const url = this.cfg.baseUrl + this.cfg.endpoint;
    const headers: Record<string, string> = { 'content-type': 'application/json' };
    if (this.cfg.token) headers['authorization'] = `Bearer ${this.cfg.token}`;
    // AbortController would be ideal, but FetchLike doesn't expose `signal` to keep the
    // interface narrow. The caller-supplied fetchImpl can implement timeouts itself; otherwise
    // we wrap with Promise.race against a timer.
    const racePromise = this.cfg.fetchImpl(url, {
      method: 'POST',
      headers,
      body: JSON.stringify({ query, documents: docs }),
    });
    const timer = new Promise<never>((_, reject) => {
      setTimeout(() => reject(new Error('cross-encoder: timeout')), this.cfg.timeoutMs).unref?.();
    });
    const res = await Promise.race([racePromise, timer]);
    if (!res.ok) throw new Error(`cross-encoder: HTTP ${res.status}`);
    const body = await res.json() as unknown;
    return parseScores(body, docs.length);
  }
}

/**
 * Adapt a CrossEncoder to the existing AsyncReranker shape consumed by hybridSearch. The
 * adapter sorts by reranker score (descending) and preserves all HybridHit fields. On a
 * scorer failure, falls through to the original order — search still works, just unranked.
 */
export function crossEncoderToReranker(ce: CrossEncoder): AsyncReranker {
  return {
    async rerank(query: string, hits: HybridHit[]): Promise<HybridHit[]> {
      if (hits.length === 0) return hits;
      try {
        const scores = await ce.score(query, hits.map(h => h.text));
        // Pair scores back to hits, replacing the existing score field. Stable sort by reranker
        // score; ties broken by original score so retrieval-quality cues persist.
        const annotated = hits.map((h, i) => ({ h, rs: scores[i] ?? -Infinity }));
        annotated.sort((a, b) => {
          if (b.rs !== a.rs) return b.rs - a.rs;
          return b.h.score - a.h.score;
        });
        return annotated.map(({ h, rs }) => ({ ...h, score: rs }));
      } catch {
        return hits;
      }
    },
  };
}

/**
 * Read SIFTCODER_RERANKER_URL (and optional SIFTCODER_RERANKER_TOKEN) from the environment.
 * Returns null when the URL is unset — daemons can call this unconditionally and rely on the
 * null-return to mean "no reranker, use baseline order".
 */
export function loadCrossEncoderFromEnv(env: NodeJS.ProcessEnv = process.env): CrossEncoder | null {
  const baseUrl = env['SIFTCODER_RERANKER_URL'];
  if (!baseUrl) return null;
  const token = env['SIFTCODER_RERANKER_TOKEN'];
  const endpoint = env['SIFTCODER_RERANKER_PATH'];
  const timeoutRaw = env['SIFTCODER_RERANKER_TIMEOUT_MS'];
  const timeoutMs = timeoutRaw ? Number.parseInt(timeoutRaw, 10) : undefined;
  return new HttpCrossEncoder({
    baseUrl,
    token,
    endpoint,
    timeoutMs: Number.isFinite(timeoutMs) && timeoutMs! > 0 ? timeoutMs : undefined,
  });
}

function parseScores(body: unknown, n: number): number[] {
  if (!body || typeof body !== 'object') throw new Error('cross-encoder: malformed response');
  const obj = body as Record<string, unknown>;
  // Jina / TEI shape: { scores: number[] } already in document order.
  if (Array.isArray(obj['scores'])) {
    return (obj['scores'] as unknown[]).map(s => Number(s));
  }
  // Cohere shape: { results: [{ index, relevance_score }] } — sparse, may omit low-scoring docs.
  if (Array.isArray(obj['results'])) {
    const scores = new Array<number>(n).fill(-Infinity);
    for (const raw of obj['results'] as unknown[]) {
      if (!raw || typeof raw !== 'object') continue;
      const r = raw as Record<string, unknown>;
      const idx = Number(r['index']);
      const sc = Number(r['relevance_score'] ?? r['score']);
      if (Number.isInteger(idx) && idx >= 0 && idx < n && Number.isFinite(sc)) {
        scores[idx] = sc;
      }
    }
    return scores;
  }
  throw new Error('cross-encoder: response missing `scores` or `results`');
}
