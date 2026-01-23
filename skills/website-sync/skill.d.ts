/**
 * SiftCoder - Website Sync Skill
 *
 * Synchronize codebase changes to generated websites
 * Detects changes, maps them to website updates, and applies sync strategies
 */
import { Tool } from "@modelcontextprotocol/sdk/types.js";
/**
 * Sync mode
 */
export type SyncMode = "auto" | "semi-auto" | "manual";
/**
 * Website type for sync strategies
 */
export type WebsiteType = "documentation" | "admin" | "marketing" | "portfolio";
/**
 * Change detected in codebase
 */
export interface CodebaseChange {
    type: "api" | "component" | "docs" | "model" | "content";
    file: string;
    description: string;
    impact: "critical" | "moderate" | "low";
}
/**
 * Sync action to apply
 */
export interface SyncAction {
    action: "update" | "create" | "delete" | "review";
    target: string;
    description: string;
    autoApply: boolean;
}
/**
 * Sync result
 */
export interface SyncResult {
    success: boolean;
    changesDetected: number;
    actionsApplied: number;
    actionsPending: number;
    actions: SyncAction[];
    message: string;
}
/**
 * Detect changes in codebase
 */
export declare function detectChanges(projectPath: string, websitePath: string): Promise<{
    success: boolean;
    changes?: CodebaseChange[];
    error?: string;
}>;
/**
 * Map codebase changes to website sync actions
 */
export declare function mapChanges(changes: CodebaseChange[], websiteType: WebsiteType, syncMode: SyncMode): Promise<SyncAction[]>;
/**
 * Sync changes to website
 */
export declare function syncChanges(projectPath: string, websitePath: string, websiteType: WebsiteType, syncMode: SyncMode): Promise<SyncResult>;
/**
 * Get sync strategy for website type
 */
export declare function getSyncStrategy(websiteType: WebsiteType): {
    defaultMode: SyncMode;
    description: string;
    strategies: {
        [key in CodebaseChange["type"]]: SyncMode;
    };
};
/**
 * Check sync status
 */
export declare function checkSyncStatus(projectPath: string, websitePath: string): Promise<{
    success: boolean;
    status?: {
        lastSync: string | null;
        pendingChanges: number;
        syncMode: SyncMode;
        websiteType: WebsiteType;
    };
    error?: string;
}>;
declare const detectChangesTool: Tool;
declare const syncChangesTool: Tool;
declare const checkSyncStatusTool: Tool;
export { detectChangesTool, syncChangesTool, checkSyncStatusTool, };
//# sourceMappingURL=skill.d.ts.map