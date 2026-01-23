/**
 * Auto Checkpoint Service
 *
 * Creates git checkpoints at feature milestones.
 * Called after subtask completion or feature completion.
 */
export type CheckpointTrigger = 'feature_complete' | 'subtask_complete' | 'manual' | 'auto_threshold' | 'auto_critical';
export interface CheckpointMetadata {
    id: string;
    createdAt: string;
    gitRef: string;
    featureId: string;
    trigger: CheckpointTrigger;
    message: string;
    filesChanged: string;
}
export declare class AutoCheckpointService {
    private stateDir;
    private checkpointsDir;
    private logFile;
    private projectRoot;
    constructor(projectRoot?: string);
    /**
     * Create a checkpoint
     */
    createCheckpoint(options: {
        trigger?: 'feature_complete' | 'subtask_complete' | 'manual' | 'auto_threshold' | 'auto_critical';
        featureId?: string;
        message?: string;
    }): Promise<CheckpointMetadata | null>;
    /**
     * List all checkpoints
     */
    listCheckpoints(): Promise<CheckpointMetadata[]>;
}
//# sourceMappingURL=auto-checkpoint.d.ts.map