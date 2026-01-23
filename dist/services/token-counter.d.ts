/**
 * Token Counter Service (Pure Node.js - No Python!)
 * Uses gpt-tokenizer for accurate token counting
 * Works on Windows, Mac, Linux
 */
export interface TokenCount {
    tokens: number;
    method: 'exact' | 'estimate';
    characters: number;
}
export declare class TokenCounter {
    /**
     * Count tokens using gpt-tokenizer (exact, fast)
     * Compatible with Claude models (uses same tokenizer family)
     */
    static count(text: string): TokenCount;
    /**
     * Fast token estimation (fallback)
     * ~1 token per 3.5 characters for code/mixed content
     */
    static estimate(text: string): TokenCount;
    /**
     * Count tokens with automatic fallback
     */
    static countSafe(text: string): TokenCount;
    /**
     * Count tokens in multiple texts
     */
    static countMultiple(texts: string[]): TokenCount;
    /**
     * Format token count for display
     */
    static format(count: TokenCount): string;
}
//# sourceMappingURL=token-counter.d.ts.map