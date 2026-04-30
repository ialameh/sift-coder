/**
 * Ollama-backed Embedder. Uses the local Ollama daemon for real semantic embeddings,
 * replacing the hash-bucketed DeterministicEmbedder when Ollama is reachable.
 *
 * Recommended models (all small):
 *   - nomic-embed-text   137M params, 768 dim, 8192 ctx — best general-purpose default
 *   - mxbai-embed-large  335M params, 1024 dim — higher quality, slower
 *   - all-minilm         23M params, 384 dim — drop-in replacement w/ same dim as DeterministicEmbedder
 *
 * Switching embedders mid-workspace invalidates old similarity scores (different vector
 * spaces). The hybrid retrieval path still works because BM25 is independent of embeddings.
 */
import { l2Normalize, type Embedder } from './embedder.js';

const DEFAULT_HOST = 'http://localhost:11434';
const DEFAULT_MODEL = 'nomic-embed-text';
const DEFAULT_DIM = 768;

export interface OllamaEmbedderOptions {
  host?: string;
  model?: string;
  dim?: number;
  fetchImpl?: typeof fetch;
  timeoutMs?: number;
}

interface OllamaEmbeddingResponse {
  embedding?: number[];
}

export class OllamaEmbedder implements Embedder {
  readonly dim: number;
  private readonly host: string;
  private readonly model: string;
  private readonly fetchImpl: typeof fetch;
  private readonly timeoutMs: number;

  constructor(opts: OllamaEmbedderOptions = {}) {
    this.host = (opts.host ?? process.env['SIFTCODER_OLLAMA_HOST'] ?? DEFAULT_HOST).replace(/\/+$/, '');
    this.model = opts.model ?? process.env['SIFTCODER_OLLAMA_EMBED_MODEL'] ?? DEFAULT_MODEL;
    this.dim = opts.dim ?? parseInt(process.env['SIFTCODER_OLLAMA_EMBED_DIM'] ?? `${DEFAULT_DIM}`, 10);
    /* c8 ignore next -- production path uses globalThis.fetch; tests inject */
    this.fetchImpl = opts.fetchImpl ?? globalThis.fetch;
    this.timeoutMs = opts.timeoutMs ?? 15_000;
  }

  /**
   * Probe the daemon AND verify the embedding model is loaded. Used by the daemon for
   * auto-select: only swap from DeterministicEmbedder when both checks pass.
   */
  static async available(opts: OllamaEmbedderOptions = {}): Promise<boolean> {
    const host = (opts.host ?? process.env['SIFTCODER_OLLAMA_HOST'] ?? DEFAULT_HOST).replace(/\/+$/, '');
    const model = opts.model ?? process.env['SIFTCODER_OLLAMA_EMBED_MODEL'] ?? DEFAULT_MODEL;
    /* c8 ignore next -- prod path uses globalThis.fetch */
    const fetchImpl = opts.fetchImpl ?? globalThis.fetch;
    const ctl = new AbortController();
    /* c8 ignore next -- abort fires on real-network probe timeout */
    const timer = setTimeout(() => ctl.abort(), 1500);
    try {
      const res = await fetchImpl(`${host}/api/tags`, { signal: ctl.signal });
      if (!res.ok) return false;
      const tags = (await res.json()) as { models?: Array<{ name?: string }> };
      const have = (tags.models ?? []).some(m => (m.name ?? '').startsWith(model));
      return have;
    } catch {
      return false;
    } finally {
      clearTimeout(timer);
    }
  }

  async embed(text: string): Promise<Float32Array> {
    const ctl = new AbortController();
    /* c8 ignore next -- abort fires only on real-network embed timeout */
    const timer = setTimeout(() => ctl.abort(), this.timeoutMs);
    try {
      const res = await this.fetchImpl(`${this.host}/api/embeddings`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ model: this.model, prompt: text }),
        signal: ctl.signal,
      });
      if (!res.ok) {
        throw new Error(`ollama embeddings ${res.status} ${res.statusText}`);
      }
      const json = (await res.json()) as OllamaEmbeddingResponse;
      const raw = json.embedding ?? [];
      if (raw.length === 0) {
        // Empty response — return a zero vector of the configured dim so downstream cosine
        // returns 0, equivalent to "no signal". Don't crash the drain on a single bad embed.
        return new Float32Array(this.dim);
      }
      return l2Normalize(Float32Array.from(raw));
    } finally {
      clearTimeout(timer);
    }
  }
}
