#!/usr/bin/env node
/**
 * SiftCoder File Iterator Service
 *
 * Manages sequential file processing with state tracking,
 * auto-checkpointing, and insight accumulation.
 */
export interface FileIterationState {
    id: string;
    status: 'in_progress' | 'completed' | 'paused';
    pattern: string;
    goal: string;
    files: {
        total: number;
        processed: string[];
        remaining: string[];
        current: string | null;
    };
    insights: {
        file: string;
        count: number;
    };
    checkpoints: string[];
    started_at: string;
    updated_at: string;
    checkpoint_every_n_files: number;
}
export interface Insight {
    id: string;
    type: string;
    category?: string;
    quote?: string;
    source: string;
    timestamp: string;
    metadata?: Record<string, any>;
}
/**
 * Initialize new file iteration
 */
export declare function initializeIteration(pattern: string, goal: string, checkpointEvery?: number): Promise<FileIterationState>;
/**
 * Load existing iteration state
 */
export declare function loadState(): Promise<FileIterationState | null>;
/**
 * Save iteration state
 */
export declare function saveState(state: FileIterationState): Promise<void>;
/**
 * Mark file as processed and move to next
 */
export declare function advanceToNextFile(state: FileIterationState): Promise<FileIterationState>;
/**
 * Add insight to accumulated insights
 */
export declare function addInsight(insight: Insight): Promise<void>;
/**
 * Check if checkpoint is needed
 */
export declare function shouldCheckpoint(state: FileIterationState): Promise<boolean>;
/**
 * Create checkpoint for current iteration state
 */
export declare function createIterationCheckpoint(state: FileIterationState, reason?: string): Promise<string>;
/**
 * Resume iteration from saved state
 */
export declare function resumeIteration(): Promise<FileIterationState | null>;
/**
 * Pause current iteration
 */
export declare function pauseIteration(): Promise<void>;
/**
 * Get iteration progress summary
 */
export declare function getProgress(): Promise<string>;
//# sourceMappingURL=file-iterator.d.ts.map