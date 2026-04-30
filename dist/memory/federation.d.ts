import { type HybridHit, type HybridOptions } from './retrieval.js';
import { type DBHandle } from './storage/storage.js';
import type { Embedder } from './embedder.js';
export interface FederatedHit extends HybridHit {
    workspace: string;
}
export interface FederationOptions extends HybridOptions {
    home?: string;
    /** Filter — only query workspaces whose key starts with this prefix. */
    workspacePrefix?: string;
    /** Maximum number of workspaces to query. */
    maxWorkspaces?: number;
}
export interface WorkspaceEntry {
    key: string;
    root: string;
    db: string;
}
export declare function listConsentedWorkspaces(home?: string): WorkspaceEntry[];
export interface DatabaseFactory {
    (path: string): DBHandle & {
        close?(): void;
    };
}
export declare function federatedSearch(query: string, embedder: Embedder | null, factory: DatabaseFactory, opts?: FederationOptions): Promise<FederatedHit[]>;
//# sourceMappingURL=federation.d.ts.map