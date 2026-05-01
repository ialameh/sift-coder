/**
 * Embedding adapter. Two implementations:
 *   - DeterministicEmbedder: hash-bucketed pseudo-embeddings (tests, offline dev, eval baseline).
 *   - PluggableEmbedder: lazy-imports a user-supplied module that exposes embed(text): Promise<number[]>.
 *
 * Vectors are L2-normalized so cosine similarity == dot product.
 */
import { createHash } from 'node:crypto';

export interface Embedder {
  readonly dim: number;
  embed(text: string): Promise<Float32Array>;
}

export function l2Normalize(v: Float32Array): Float32Array {
  let s = 0;
  for (let i = 0; i < v.length; i++) s += v[i]! * v[i]!;
  const n = Math.sqrt(s);
  if (n === 0) return v;
  const out = new Float32Array(v.length);
  for (let i = 0; i < v.length; i++) out[i] = v[i]! / n;
  return out;
}

export function cosine(a: Float32Array, b: Float32Array): number {
  const len = Math.min(a.length, b.length);
  let s = 0;
  for (let i = 0; i < len; i++) s += a[i]! * b[i]!;
  return s;
}

/**
 * Hash-bucketed embedder: tokenize on word boundaries, fold each token into a fixed bucket via
 * SHA-256, increment that dimension. Yields stable, content-sensitive vectors with no model.
 */
export class DeterministicEmbedder implements Embedder {
  readonly dim: number;
  constructor(dim = 384) {
    this.dim = dim;
  }

  async embed(text: string): Promise<Float32Array> {
    const v = new Float32Array(this.dim);
    const tokens = text.toLowerCase().match(/[a-z0-9_]+/g) ?? [];
    if (tokens.length === 0) return v;
    for (const tok of tokens) {
      const h = createHash('sha256').update(tok).digest();
      const bucket = h.readUInt32BE(0) % this.dim;
      const sign = (h.readUInt8(4) & 1) === 0 ? 1 : -1;
      v[bucket]! += sign;
    }
    return l2Normalize(v);
  }
}

export interface PluggableConfig {
  modulePath: string;
  dim: number;
}

/* c8 ignore start */
export class PluggableEmbedder implements Embedder {
  readonly dim: number;
  private impl: ((text: string) => Promise<number[] | Float32Array>) | null = null;

  constructor(private readonly config: PluggableConfig) {
    this.dim = config.dim;
  }

  private async load(): Promise<(text: string) => Promise<number[] | Float32Array>> {
    if (this.impl) return this.impl;
    const mod = (await import(this.config.modulePath)) as { embed: (text: string) => Promise<number[] | Float32Array> };
    this.impl = mod.embed.bind(mod);
    return this.impl;
  }

  async embed(text: string): Promise<Float32Array> {
    const fn = await this.load();
    const raw = await fn(text);
    const arr = raw instanceof Float32Array ? raw : Float32Array.from(raw);
    return l2Normalize(arr);
  }
}
/* c8 ignore stop */
