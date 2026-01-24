/**
 * Learning Service - Continuous Pattern Extraction
 *
 * Extracts reusable patterns from development work and maintains a knowledge base.
 * Supports error resolution, debugging, workarounds, and best practices.
 *
 * SiftCoder Flavor:
 * - Cross-platform file operations
 * - JSON-based pattern storage
 * - Search and retrieval functionality
 * - CLI and module interfaces
 */
export type PatternCategory = 'error_resolution' | 'debugging' | 'workaround' | 'best_practice' | 'refactoring' | 'architecture';
export interface Pattern {
    id: string;
    name: string;
    category: PatternCategory;
    problem: string;
    solution: string;
    code_example?: string;
    tags: string[];
    context?: string;
    created_at: string;
    updated_at?: string;
    times_used?: number;
}
export interface SessionData {
    tool_calls: number;
    files_modified: string[];
    errors_encountered: string[];
    commands_run: string[];
}
/**
 * Learning Service for pattern extraction and knowledge management
 */
export declare class LearningService {
    private projectRoot;
    private stateDir;
    private patternsFile;
    constructor(projectRoot?: string);
    /**
     * Extract a pattern from session data
     */
    extractPattern(name: string, category: PatternCategory, problem: string, solution: string, options?: Partial<Pattern>): Promise<Pattern>;
    /**
     * Save pattern to knowledge base
     */
    savePattern(pattern: Pattern): Promise<void>;
    /**
     * Load all patterns from knowledge base
     */
    loadPatterns(): Promise<Pattern[]>;
    /**
     * Search patterns by query
     */
    searchPatterns(query: string): Promise<Pattern[]>;
    /**
     * Search patterns by category
     */
    searchByCategory(category: PatternCategory): Promise<Pattern[]>;
    /**
     * Search patterns by tag
     */
    searchByTag(tag: string): Promise<Pattern[]>;
    /**
     * Get pattern by ID
     */
    getPattern(id: string): Promise<Pattern | null>;
    /**
     * Delete pattern by ID
     */
    deletePattern(id: string): Promise<boolean>;
    /**
     * List all patterns
     */
    listPatterns(): Promise<Pattern[]>;
    /**
     * Suggest patterns based on current context
     */
    suggestPatterns(context: string): Promise<Pattern[]>;
    /**
     * Evaluate session for extractable patterns
     */
    evaluateSession(sessionData: SessionData): Promise<Pattern[]>;
    /**
     * Generate pattern ID from name
     */
    private generatePatternId;
    /**
     * Extract tags from text
     */
    private extractTags;
    /**
     * Format pattern for display
     */
    formatPattern(pattern: Pattern): string;
    /**
     * CLI interface
     */
    static main(): Promise<void>;
}
//# sourceMappingURL=learning-service.d.ts.map