/**
 * Sync to GLM Service
 *
 * Syncs siftcoder plugin to GLM's cache.
 * GLM uses a separate plugin cache from Claude Code.
 */
export interface SyncResult {
    success: boolean;
    commandsCount: number;
    agentsCount: number;
    error?: string;
}
export declare class SyncToGlmService {
    private siftcoderSource;
    private glmCache;
    constructor(siftcoderSource?: string, glmCache?: string);
    /**
     * Sync SiftCoder to GLM cache
     */
    sync(): Promise<SyncResult>;
    /**
     * Print sync report
     */
    syncAndReport(): Promise<void>;
}
//# sourceMappingURL=sync-to-glm.d.ts.map