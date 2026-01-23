/**
 * Cloud Sync Manager Service
 *
 * Manages knowledge synchronization to cloud.
 */
export interface SyncStatus {
    configured: boolean;
    connected: boolean;
    lastSync?: string;
    pendingChanges: number;
    conflicts: number;
}
export interface SyncResult {
    success: boolean;
    pushed: number;
    pulled: number;
    conflicts: number;
    error?: string;
}
export declare class CloudSyncService {
    private stateDir;
    private knowledgeDir;
    private configService;
    constructor(projectRoot?: string);
    /**
     * Count entries in knowledge files
     */
    private countEntries;
    /**
     * Make authenticated API request
     */
    private apiRequest;
    /**
     * Push local knowledge to cloud
     */
    push(): Promise<SyncResult>;
    /**
     * Load knowledge file
     */
    private loadKnowledgeFile;
    /**
     * Pull and merge cloud knowledge
     */
    pull(): Promise<SyncResult>;
    /**
     * Merge knowledge from cloud
     */
    private mergeKnowledge;
    /**
     * Get sync status
     */
    getStatus(): Promise<SyncStatus>;
    /**
     * List pending conflicts
     */
    listConflicts(): Promise<any[]>;
    /**
     * Enable/disable auto-sync
     */
    setAutoSync(enabled: boolean): Promise<void>;
}
//# sourceMappingURL=cloud-sync.d.ts.map