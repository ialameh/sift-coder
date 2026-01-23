/**
 * State Manager Service (Converted from bash)
 * Manages plugin state in .claude/siftcoder-state/
 * Cross-platform (Windows, Mac, Linux)
 */
export interface Feature {
    id: string;
    name: string;
    description: string;
    subtasks?: Subtask[];
    status: 'pending' | 'in_progress' | 'completed';
    created_at: string;
    updated_at: string;
}
export interface Subtask {
    id: string;
    name: string;
    status: 'pending' | 'in_progress' | 'completed';
}
export interface FeatureQueue {
    pending: string[];
    in_progress: string[];
    completed: string[];
}
export interface FeaturesState {
    version: string;
    features: Record<string, Feature>;
    queue: FeatureQueue;
}
export interface CurrentTask {
    feature?: string;
    subtask?: string;
    workflow_phase?: 'PLANNING' | 'CODING' | 'QA' | 'DONE';
    iteration?: number;
    agent?: string;
    started_at?: string;
    updated_at?: string;
}
export interface Boundaries {
    modifiable: string[];
    protected: string[];
    blast_radius_verified: boolean;
    last_check?: string;
}
export declare class StateManager {
    private stateDir;
    constructor(projectRoot?: string);
    /**
     * Initialize state directory with default files
     */
    init(): Promise<void>;
    /**
     * Get config value
     */
    get(key: string): Promise<any>;
    /**
     * Set config value
     */
    set(key: string, value: any): Promise<void>;
    /**
     * Load features state
     */
    loadFeatures(): Promise<FeaturesState>;
    /**
     * Save features state
     */
    saveFeatures(features: FeaturesState): Promise<void>;
    /**
     * Add feature to queue
     */
    addFeature(feature: Omit<Feature, 'id' | 'created_at' | 'updated_at'>): Promise<string>;
    /**
     * Mark feature as complete
     */
    completeFeature(featureId: string): Promise<void>;
    /**
     * Start working on a feature
     */
    startFeature(featureId: string): Promise<void>;
    /**
     * Load current task
     */
    loadCurrentTask(): Promise<CurrentTask | null>;
    /**
     * Save current task
     */
    saveCurrentTask(task: CurrentTask): Promise<void>;
    /**
     * Start new task
     */
    startTask(_mode: string, feature?: string): Promise<void>;
    /**
     * Complete current task
     */
    completeTask(): Promise<void>;
    /**
     * Load boundaries
     */
    loadBoundaries(): Promise<Boundaries | null>;
    /**
     * Save boundaries
     */
    saveBoundaries(boundaries: Boundaries): Promise<void>;
    /**
     * Log event to implementation-log.jsonl
     */
    log(event: string, data: any): Promise<void>;
    /**
     * Get state directory path
     */
    getStateDir(): string;
}
//# sourceMappingURL=state-manager.d.ts.map