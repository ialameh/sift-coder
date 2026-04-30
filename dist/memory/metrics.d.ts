/**
 * Memory savings metrics.
 *
 * Aggregates from existing tables to produce a quantitative picture of:
 *   - Capture volume   — events captured, tokens stored before redaction.
 *   - Compression ratio — events tokens vs summaries tokens (savings).
 *   - Drain coverage   — fraction of events that have been summarized.
 *   - Cache hit rate   — proportion of summarizations served from cache.
 *   - Dedup ratio      — fraction of summaries marked as superseded.
 *   - Spend            — total summarizer tokens_in / tokens_out (cost).
 *   - ROI              — captured tokens minus summarizer tokens minus stored summary tokens.
 *
 * Pure read-only over a Storage handle. No DB schema changes required.
 */
import type { Storage } from './storage/storage.js';
export interface SavingsReport {
    workspace: {
        dbPath: string | null;
        sizeBytes: number | null;
    };
    capture: {
        events: number;
        tokensCaptured: number;
        redactedEvents: number;
        perTool: Record<string, number>;
    };
    drain: {
        summarized: number;
        skipped: number;
        raw: number;
        coverage: number;
    };
    spend: {
        summaries: number;
        tokensIn: number;
        tokensOut: number;
        cacheRows: number;
        cacheHits: number;
        cacheHitRate: number;
    };
    dedup: {
        embeddings: number;
        superseded: number;
        dedupRatio: number;
    };
    context: {
        summaryTokensStored: number;
        compressionRatio: number;
        netSavedTokens: number;
    };
}
export declare function computeSavings(storage: Storage): SavingsReport;
export declare function renderSavings(r: SavingsReport): string;
//# sourceMappingURL=metrics.d.ts.map