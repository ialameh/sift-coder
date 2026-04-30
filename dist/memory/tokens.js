/**
 * Token estimator for SiftCoder Memory.
 *
 * Uses `gpt-tokenizer` (already a SiftCoder dep) for fast, accurate counts. Lazy-imported so the
 * dependency is only loaded when token measurement is requested. Exports a sync `estimate` shim
 * that falls back to a 4-chars-per-token approximation when the tokenizer is unavailable.
 */
let encoder;
async function loadEncoder() {
    if (encoder !== undefined)
        return encoder;
    try {
        const mod = (await import('gpt-tokenizer'));
        encoder = mod.encode;
    }
    catch {
        /* c8 ignore next -- defensive fallback when gpt-tokenizer is absent */
        encoder = null;
    }
    return encoder;
}
export async function countTokens(text) {
    if (!text)
        return 0;
    const enc = await loadEncoder();
    /* c8 ignore next -- approximate fallback only fires when gpt-tokenizer is absent */
    return enc ? enc(text).length : approximate(text);
}
/** Cheap estimate when no tokenizer is loaded. ~4 characters per token. */
export function approximate(text) {
    if (!text)
        return 0;
    return Math.ceil(text.length / 4);
}
export async function countPayloadTokens(payload) {
    if (payload === null || payload === undefined)
        return 0;
    const text = typeof payload === 'string' ? payload : JSON.stringify(payload);
    return countTokens(text);
}
//# sourceMappingURL=tokens.js.map