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
export declare class CdgEmbedder implements Embedder {
    readonly dim: number;
    private readonly cfg;
    constructor(opts: CdgEmbedderOptions);
    static fromEnv(env?: NodeJS.ProcessEnv, fallback?: Embedder | null): CdgEmbedder | null;
    embed(text: string): Promise<Float32Array>;
    private fallbackEmbed;
}
//# sourceMappingURL=cdg-embedder.d.ts.map