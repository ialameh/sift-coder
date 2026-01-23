/**
 * Codebase Indexer Service
 *
 * Builds vector index for semantic search.
 * Simplified Node.js version (without external dependencies like LanceDB/Ollama).
 */
export interface CodeFile {
    path: string;
    relativePath: string;
    language: string;
    size: number;
    lastModified: Date;
}
export interface IndexResult {
    totalFiles: number;
    indexedFiles: number;
    errors: string[];
    languages: Record<string, number>;
}
export declare class IndexCodebaseService {
    private projectRoot;
    private indexDir;
    constructor(projectRoot?: string);
    /**
     * Initialize index directory
     */
    init(): Promise<void>;
    /**
     * Find all code files
     */
    findCodeFiles(searchPath?: string): Promise<CodeFile[]>;
    /**
     * Get language from extension
     */
    private getLanguage;
    /**
     * Index codebase
     */
    index(searchPath?: string): Promise<IndexResult>;
    /**
     * Get stored index
     */
    getIndex(): Promise<{
        files: CodeFile[];
        indexedAt: string;
    } | null>;
    /**
     * Search files by pattern
     */
    searchFiles(query: string): Promise<CodeFile[]>;
}
//# sourceMappingURL=index-codebase.d.ts.map