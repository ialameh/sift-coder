export interface Embedder {
    readonly dim: number;
    embed(text: string): Promise<Float32Array>;
}
export declare function l2Normalize(v: Float32Array): Float32Array;
export declare function cosine(a: Float32Array, b: Float32Array): number;
/**
 * Hash-bucketed embedder: tokenize on word boundaries, fold each token into a fixed bucket via
 * SHA-256, increment that dimension. Yields stable, content-sensitive vectors with no model.
 */
export declare class DeterministicEmbedder implements Embedder {
    readonly dim: number;
    constructor(dim?: number);
    embed(text: string): Promise<Float32Array>;
}
export interface PluggableConfig {
    modulePath: string;
    dim: number;
}
export declare class PluggableEmbedder implements Embedder {
    private readonly config;
    readonly dim: number;
    private impl;
    constructor(config: PluggableConfig);
    private load;
    embed(text: string): Promise<Float32Array>;
}
//# sourceMappingURL=embedder.d.ts.map