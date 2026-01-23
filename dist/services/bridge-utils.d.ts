/**
 * Bridge Utilities Service
 *
 * Provides helper functions for cross-codebase integration.
 * Used by the bridge command.
 */
export type ProjectType = 'frontend' | 'backend' | 'fullstack' | 'unknown';
export interface TechStack {
    language?: string;
    frameworks?: string[];
    buildTool?: string;
}
export interface ApiEndpoint {
    path: string;
    method: string;
    file: string;
    line: number;
}
export declare class BridgeUtilsService {
    private projectRoot;
    constructor(projectRoot?: string);
    /**
     * Detect project type from directory structure and files
     */
    detectProjectType(dir?: string): Promise<ProjectType>;
    /**
     * Extract technology stack from directory
     */
    extractTechStack(dir?: string): Promise<TechStack>;
    /**
     * Extract API endpoints from codebase
     */
    extractApiEndpoints(_dir?: string): Promise<ApiEndpoint[]>;
    /**
     * Find entry points in the project
     */
    findEntryPoints(dir?: string): Promise<string[]>;
    /**
     * Get project structure summary
     */
    getProjectStructure(dir?: string): Promise<Record<string, number>>;
}
//# sourceMappingURL=bridge-utils.d.ts.map