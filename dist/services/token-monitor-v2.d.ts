/**
 * Token Monitor Service v2 (Pure Node.js)
 * Monitors context usage and triggers auto-checkpoints
 * NO Python dependency!
 */
export interface TokenThresholds {
    warn: number;
    checkpoint: number;
    critical: number;
}
export declare const DEFAULT_THRESHOLDS: TokenThresholds;
export type TokenStatus = 'ok' | 'warn' | 'checkpoint' | 'critical';
export interface TokenUsage {
    tokens: number;
    characters: number;
    method: 'exact' | 'estimate';
    status: TokenStatus;
    threshold_percent: number;
    recommendation: string;
}
export declare class TokenMonitor {
    private stateDir;
    private thresholds;
    private contextWindow;
    constructor(options?: {
        stateDir?: string;
        thresholds?: Partial<TokenThresholds>;
        contextWindow?: number;
    });
    /**
     * Calculate total session tokens from all state files
     */
    calculateSessionTokens(): Promise<TokenUsage>;
    /**
     * Check token status against thresholds
     */
    checkTokenStatus(tokens: number): TokenStatus;
    /**
     * Get recommended action based on token usage
     */
    getRecommendedAction(status: TokenStatus): string;
    /**
     * Format token usage for display
     */
    formatTokenUsage(usage: TokenUsage): string;
    /**
     * Create progress bar for token usage
     */
    private createProgressBar;
    /**
     * Check if checkpoint is needed
     */
    shouldCheckpoint(): Promise<{
        needed: boolean;
        reason: string;
        usage: TokenUsage;
    }>;
}
//# sourceMappingURL=token-monitor-v2.d.ts.map