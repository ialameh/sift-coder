#!/usr/bin/env node
/**
 * SiftCoder Token Monitor Service
 *
 * Monitors context usage and triggers auto-checkpoints before hitting limits.
 * Prevents context overflow and ensures work isn't lost on long-running sessions.
 */
export type TokenStatus = 'ok' | 'warn' | 'checkpoint' | 'critical';
export interface TokenUsage {
    tokens: number;
    characters: number;
    method: 'exact' | 'estimate';
    status: TokenStatus;
    threshold_percent: number;
    recommendation: string;
}
/**
 * Count tokens using gpt-tokenizer library (Node.js)
 * Uses cl100k_base encoding (compatible with Claude/GPT-4)
 */
export declare function countTokens(text: string): {
    tokens: number;
    method: string;
    characters: number;
};
/**
 * Fast token estimation (fallback)
 * 1 token ≈ 3.5 characters for code/mixed content
 */
export declare function estimateTokens(text: string): {
    tokens: number;
    method: string;
    characters: number;
};
/**
 * Calculate session tokens from all relevant state files
 */
export declare function calculateSessionTokens(): Promise<TokenUsage>;
/**
 * Check token status against thresholds
 */
export declare function checkTokenStatus(tokens: number): TokenStatus;
/**
 * Get recommended action based on token usage
 */
export declare function getRecommendedAction(status: TokenStatus): string;
/**
 * Format token usage for display
 */
export declare function formatTokenUsage(usage: TokenUsage): string;
/**
 * Check if checkpoint is needed based on current token usage
 */
export declare function shouldCheckpoint(): Promise<{
    needed: boolean;
    reason: string;
    usage: TokenUsage;
}>;
//# sourceMappingURL=token-monitor.d.ts.map