/**
 * Should Continue Service
 *
 * Determines if workflow should continue after Claude stops.
 * Checks task state, iterations, and pending work.
 */
export interface ContinueDecision {
    decision: 'continue' | 'stop';
    reason: string;
}
export interface CurrentTask {
    mode?: string;
    phase?: string;
    iteration?: number;
    paused?: boolean;
}
export interface FeaturesState {
    queue?: {
        pending?: string[];
        in_progress?: string[];
    };
}
export interface Config {
    autoContinue?: boolean;
    maxIterations?: number;
}
export declare class ShouldContinueService {
    private stateDir;
    constructor(projectRoot?: string);
    /**
     * Determine if workflow should continue
     */
    shouldContinue(): Promise<ContinueDecision>;
    /**
     * Check if there's more work to do based on mode
     */
    private checkForWork;
    /**
     * Load config file
     */
    private loadConfig;
    /**
     * Load features state
     */
    private loadFeatures;
}
//# sourceMappingURL=should-continue.d.ts.map