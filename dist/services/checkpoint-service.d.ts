#!/usr/bin/env node
/**
 * SiftCoder Checkpoint Service
 *
 * Manages checkpoint CRUD operations with schema validation,
 * multi-agent state tracking, and query capabilities.
 *
 * SiftCoder Flavor:
 * - Multi-agent state snapshots
 * - Quality gate result tracking
 * - Boundary state management
 * - Token economics calculation
 * - Feature queue persistence
 */
interface CheckpointData {
    name: string;
    workflow_phase: 'PLANNING' | 'CODING' | 'QA' | 'DONE';
    iteration?: number;
    agent: string;
    project_root: string;
    features: {
        completed: string[];
        in_progress: string[];
        pending: string[];
    };
    quality_results: {
        format: {
            status: string;
            files_checked?: number;
            time_ms?: number;
        };
        lint: {
            status: string;
            errors?: number;
            warnings?: number;
            time_ms?: number;
        };
        type_check: {
            status: string;
            files_checked?: number;
            time_ms?: number;
        };
    };
    boundaries: {
        modifiable: string[];
        protected: string[];
        blast_radius_verified: boolean;
        last_check?: string;
    };
    token_economics: {
        session_tokens: number;
        discovery_tokens: number;
        efficiency: string;
        patterns_learned?: number;
    };
    file_iteration?: {
        pattern: string;
        total_files: number;
        processed_files: number;
        current_file: string;
        insights_accumulated: number;
        started_at: string;
    };
    metadata?: {
        observations?: number;
        knowledge_entries?: number;
        description?: string;
        tags?: string[];
    };
}
interface CheckpointFilters {
    agent?: string;
    phase?: string;
    since?: Date;
    until?: Date;
    limit?: number;
}
/**
 * Save checkpoint with validation
 */
export declare function saveCheckpoint(name: string, data: CheckpointData): Promise<boolean>;
/**
 * Load checkpoint with validation
 */
export declare function loadCheckpoint(name: string): Promise<any>;
/**
 * Restore checkpoint - loads and applies state
 */
export declare function restoreCheckpoint(name: string): Promise<void>;
/**
 * List checkpoints with optional filters
 */
export declare function listCheckpoints(filters?: CheckpointFilters): Promise<any[]>;
/**
 * Delete checkpoint
 */
export declare function deleteCheckpoint(name: string): Promise<boolean>;
export {};
//# sourceMappingURL=checkpoint-service.d.ts.map