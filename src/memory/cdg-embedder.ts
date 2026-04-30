/**
 * CDG candle MiniLM embedder adapter for SiftCoder Memory.
 *
 * Implements the Embedder interface by calling CDG's REST embed endpoint, which runs
 * `all-MiniLM-L6-v2` via candle-core. Produces real semantic vectors (384-dim) that fill the
 * sqlite-vec slot in storage.
 *
 * Activation: SIFTCODER_CDG_URL + SIFTCODER_CDG_TOKEN. Falls back to whatever embedder the caller
 * passes in `fallback` on any failure (timeouts, non-2xx, malformed body).
 *
 * Wire shape (POST {baseUrl}/v1/embed):
 *   request:  { text: string; model?: string }
 *   response: { vector: number[] }  // any length; client-side L2 normalize
 */
import type { Embedder } from './embedder.js';
import { l2Normalize } from './embedder.js';
import type { FetchLike } from './cdg-adapter.js';

export interface CdgEmbedderOptions {
  baseUrl: string;
  token?: string;
  endpoint?: string;
  dim?: number;
  timeoutMs?: number;
  fetchImpl?: FetchLike;
  fallback?: Embedder | null;
  mapResponse?: (body: unknown) => Float32Array | null;
}

function defaultMap(body: unknown): Float32Array | null {
  if (!body || typeof body !== 'object') return null;
  const v = (body as { vector?: unknown }).vector;
  if (!Array.isArray(v)) return null;
  const out = new Float32Array(v.length);
  for (let i = 0; i < v.length; i++) {
    const n = Number(v[i]);
    if (!Number.isFinite(n)) return null;
    out[i] = n;
  }
  return out;
}

export class CdgEmbedder implements Embedder {
  readonly dim: number;
  private readonly cfg: Required<Omit<CdgEmbedderOptions, 'token' | 'fallback' | 'fetchImpl' | 'mapResponse' | 'dim'>> & {
    token: string | undefined;
    fallback: Embedder | null;
    fetchImpl: FetchLike;
    mapResponse: (body: unknown) => Float32Array | null;
  };

  constructor(opts: CdgEmbedderOptions) {
    this.dim = opts.dim ?? 384;
    this.cfg = {
      baseUrl: opts.baseUrl.replace(/\/+$/, ''),
      endpoint: opts.endpoint ?? '/v1/embed',
      timeoutMs: opts.timeoutMs ?? 2000,
      token: opts.token,
      fallback: opts.fallback ?? null,
      /* c8 ignore next -- default real fetch only used when no fetchImpl injected */
      fetchImpl: opts.fetchImpl ?? ((input, init) => fetch(input, init) as unknown as ReturnType<FetchLike>),
      mapResponse: opts.mapResponse ?? defaultMap,
    };
  }

  static fromEnv(env: NodeJS.ProcessEnv = process.env, fallback: Embedder | null = null): CdgEmbedder | null {
    const url = env['SIFTCODER_CDG_URL'];
    if (!url) return null;
    return new CdgEmbedder({ baseUrl: url, token: env['SIFTCODER_CDG_TOKEN'], fallback });
  }

  async embed(text: string): Promise<Float32Array> {
    if (!text || text.trim().length === 0) return new Float32Array(this.dim);
    const headers: Record<string, string> = { 'content-type': 'application/json' };
    if (this.cfg.token) headers['authorization'] = `Bearer ${this.cfg.token}`;
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), this.cfg.timeoutMs);
    try {
      const res = await this.cfg.fetchImpl(this.cfg.baseUrl + this.cfg.endpoint, {
        method: 'POST',
        headers,
        body: JSON.stringify({ text }),
        signal: ctrl.signal,
      });
      if (!res.ok) return await this.fallbackEmbed(text);
      const json = await res.json();
      const vec = this.cfg.mapResponse(json);
      if (!vec || vec.length === 0) return await this.fallbackEmbed(text);
      return l2Normalize(vec);
    } catch {
      return await this.fallbackEmbed(text);
    } finally {
      clearTimeout(timer);
    }
  }

  private async fallbackEmbed(text: string): Promise<Float32Array> {
    if (!this.cfg.fallback) return new Float32Array(this.dim);
    return this.cfg.fallback.embed(text);
  }
}
