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
import { type Embedder } from './embedder.js';
export interface OllamaEmbedderOptions {
    host?: string;
    model?: string;
    dim?: number;
    fetchImpl?: typeof fetch;
    timeoutMs?: number;
}
export declare class OllamaEmbedder implements Embedder {
    readonly dim: number;
    private readonly host;
    private readonly model;
    private readonly fetchImpl;
    private readonly timeoutMs;
    constructor(opts?: OllamaEmbedderOptions);
    /**
     * Probe the daemon AND verify the embedding model is loaded. Used by the daemon for
     * auto-select: only swap from DeterministicEmbedder when both checks pass.
     */
    static available(opts?: OllamaEmbedderOptions): Promise<boolean>;
    embed(text: string): Promise<Float32Array>;
}
//# sourceMappingURL=ollama-embedder.d.ts.map