import type { Storage } from '../storage/storage.js';
export interface ConsolidatorOptions {
    intervalMs?: number;
    cosineThreshold?: number;
    minNewSinceLastRun?: number;
    pairLimit?: number;
}
export interface ConsolidationReport {
    pairsMarked: number;
    scanned: number;
}
export declare class Consolidator {
    private readonly storage;
    private timer;
    private state;
    private lastTotal;
    private readonly interval;
    private readonly threshold;
    private readonly minDelta;
    private readonly pairLimit;
    constructor(storage: Storage, opts?: ConsolidatorOptions);
    start(): void;
    stop(): void;
    getState(): typeof this.state;
    private scheduleTick;
    tick(): ConsolidationReport;
}
//# sourceMappingURL=consolidator.d.ts.map