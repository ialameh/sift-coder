/**
 * Documentation Service - Automatic Documentation Generation
 *
 * Generates documentation from code including contributor guides, runbooks,
 * and architecture diagrams (codemaps).
 *
 * SiftCoder Flavor:
 * - Cross-platform file operations
 * - Markdown documentation generation
 * - Architecture diagram support
 * - CLI and module interfaces
 */
export interface DocConfig {
    outputDir: string;
    includePatterns: string[];
    excludePatterns: string[];
    generateCodemaps: boolean;
}
export interface FileInfo {
    path: string;
    lines: number;
    functions: number;
    imports: string[];
    exports: string[];
}
export interface ArchitectureNode {
    id: string;
    name: string;
    type: 'service' | 'component' | 'module' | 'utility';
    file: string;
    dependencies: string[];
    dependents: string[];
}
/**
 * Documentation Service for automated documentation generation
 */
export declare class DocService {
    private projectRoot;
    private config;
    constructor(projectRoot?: string, config?: Partial<DocConfig>);
    /**
     * Generate all documentation
     */
    generateDocs(): Promise<void>;
    /**
     * Generate contributor guide
     */
    generateContributorGuide(): Promise<void>;
    /**
     * Extract package information
     */
    private extractPackageInfo;
    /**
     * Extract scripts from package.json
     */
    private extractScripts;
    /**
     * Generate setup instructions
     */
    private generateSetupInstructions;
    /**
     * Generate project structure
     */
    private generateProjectStructure;
    /**
     * Generate runbook
     */
    generateRunbook(): Promise<void>;
    /**
     * Generate common tasks section
     */
    private generateCommonTasks;
    /**
     * Generate troubleshooting section
     */
    private generateTroubleshooting;
    /**
     * Generate API documentation
     */
    generateAPIDocumentation(): Promise<void>;
    /**
     * Extract API documentation from source files
     */
    private extractAPIDocs;
    /**
     * Extract exports from file content
     */
    private extractExports;
    /**
     * Update codemaps (architecture diagrams)
     */
    updateCodemaps(): Promise<void>;
    /**
     * Scan source files for information
     */
    private scanSourceFiles;
    /**
     * Extract imports from content
     */
    private extractImports;
    /**
     * Build architecture graph
     */
    private buildArchitectureGraph;
    /**
     * Categorize file by type
     */
    private categorizeFile;
    /**
     * Resolve import path
     */
    private resolveImportPath;
    /**
     * Generate service view
     */
    private generateServiceView;
    /**
     * Generate dependency graph
     */
    private generateDependencyGraph;
    /**
     * Generate component tree
     */
    private generateComponentTree;
    /**
     * CLI interface
     */
    static main(): Promise<void>;
}
//# sourceMappingURL=doc-service.d.ts.map