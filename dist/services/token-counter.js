/**
 * Token Counter Service (Pure Node.js - No Python!)
 * Uses gpt-tokenizer for accurate token counting
 * Works on Windows, Mac, Linux
 */
import { encode } from 'gpt-tokenizer';
export class TokenCounter {
    /**
     * Count tokens using gpt-tokenizer (exact, fast)
     * Compatible with Claude models (uses same tokenizer family)
     */
    static count(text) {
        try {
            const tokens = encode(text);
            return {
                tokens: tokens.length,
                method: 'exact',
                characters: text.length
            };
        }
        catch (error) {
            console.warn('gpt-tokenizer failed, using estimation:', error);
            return this.estimate(text);
        }
    }
    /**
     * Fast token estimation (fallback)
     * ~1 token per 3.5 characters for code/mixed content
     */
    static estimate(text) {
        return {
            tokens: Math.ceil(text.length / 3.5),
            method: 'estimate',
            characters: text.length
        };
    }
    /**
     * Count tokens with automatic fallback
     */
    static countSafe(text) {
        return this.count(text);
    }
    /**
     * Count tokens in multiple texts
     */
    static countMultiple(texts) {
        const total = texts.reduce((acc, text) => {
            const count = this.count(text);
            return {
                tokens: acc.tokens + count.tokens,
                characters: acc.characters + count.characters,
                method: acc.method === 'exact' && count.method === 'exact' ? 'exact' : 'estimate'
            };
        }, { tokens: 0, characters: 0, method: 'exact' });
        return total;
    }
    /**
     * Format token count for display
     */
    static format(count) {
        return `${count.tokens.toLocaleString()} tokens (${count.method})`;
    }
}
// CLI interface
// Check if this file is being run directly (CLI mode)
const isMainModule = process.argv[1]?.endsWith('/token-counter.js') ||
    process.argv[1]?.endsWith('token-counter.js') ||
    process.argv[1]?.endsWith('\\token-counter.js');
if (isMainModule) {
    const text = process.argv[2] || '';
    if (!text) {
        console.error('Usage: node token-counter.js <text>');
        process.exit(1);
    }
    const result = TokenCounter.count(text);
    console.log(JSON.stringify(result, null, 2));
}
//# sourceMappingURL=token-counter.js.map