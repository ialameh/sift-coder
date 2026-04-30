/**
 * Token estimator for SiftCoder Memory.
 *
 * Uses `gpt-tokenizer` (already a SiftCoder dep) for fast, accurate counts. Lazy-imported so the
 * dependency is only loaded when token measurement is requested. Exports a sync `estimate` shim
 * that falls back to a 4-chars-per-token approximation when the tokenizer is unavailable.
 */
export declare function countTokens(text: string): Promise<number>;
/** Cheap estimate when no tokenizer is loaded. ~4 characters per token. */
export declare function approximate(text: string): number;
export declare function countPayloadTokens(payload: unknown): Promise<number>;
//# sourceMappingURL=tokens.d.ts.map