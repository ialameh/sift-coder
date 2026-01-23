#!/usr/bin/env node
/**
 * SiftCoder Observation Logger
 *
 * Logs structured observations to implementation-log.jsonl
 * with agent attribution, workflow context, and learning extraction.
 *
 * SiftCoder Flavor:
 * - Agent attribution for each observation
 * - Workflow context tracking (feature, subtask, phase)
 * - Learning extraction (concepts, facts, gotchas)
 * - Safety verification (boundaries, blast radius)
 * - Token economics calculation
 */
interface ObservationEntry {
    timestamp: string;
    session_id: string;
    agent: string;
    workflow: {
        feature: string;
        subtask: string;
        phase: 'PLANNING' | 'CODING' | 'QA' | 'DONE';
        iteration: number;
    };
    observation: {
        type: string;
        tool: string;
        files?: string[];
        narrative?: string;
        outcomes?: {
            lines_changed?: number;
            files_modified?: number;
            quality_gates?: {
                format?: string;
                lint?: string;
                type_check?: string;
            };
        };
    };
    learning?: {
        concepts: string[];
        facts: string[];
        gotchas: string[];
        discovery_tokens: number;
    };
    safety: {
        boundary_check: 'passed' | 'warning' | 'failed' | 'skipped';
        files_in_scope: boolean;
        blast_radius?: string;
        protected_files_touched?: string[];
    };
    metadata?: {
        duration_ms?: number;
        exit_code?: number;
        tags?: string[];
    };
}
/**
 * Update workflow context
 */
export declare function updateContext(updates: {
    phase?: 'PLANNING' | 'CODING' | 'QA' | 'DONE';
    agent?: string;
    feature?: string;
    subtask?: string;
    iteration?: number;
}): void;
/**
 * Log observation to implementation-log.jsonl
 */
export declare function logObservation(observation: ObservationEntry): Promise<void>;
/**
 * Query observations with filters
 */
export declare function queryObservations(filters?: {
    agent?: string;
    phase?: string;
    concept?: string;
    limit?: number;
}): Promise<ObservationEntry[]>;
export {};
//# sourceMappingURL=observation-logger.d.ts.map