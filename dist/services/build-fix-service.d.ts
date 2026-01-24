/**
 * Build Fix Service - Automated Build Error Analysis
 *
 * Analyzes build errors and provides minimal-diff fix suggestions.
 * Supports TypeScript, JavaScript, and common build tools.
 *
 * SiftCoder Flavor:
 * - Cross-platform build execution
 * - Error parsing and categorization
 * - Minimal fix suggestions
 * - CLI and module interfaces
 */
export type ErrorCategory = 'type' | 'syntax' | 'import' | 'config' | 'runtime' | 'unknown';
export interface BuildError {
    file: string;
    line: number;
    column: number;
    code: number;
    message: string;
    category: ErrorCategory;
    context?: string;
}
export interface FixSuggestion {
    error: BuildError;
    suggestion: string;
    code_fix?: string;
    priority: 'high' | 'medium' | 'low';
}
export interface BuildResult {
    success: boolean;
    exitCode: number;
    output: string;
    errors: BuildError[];
    fixes: FixSuggestion[];
}
/**
 * Build Fix Service for error analysis and resolution
 */
export declare class BuildFixService {
    private projectRoot;
    constructor(projectRoot?: string);
    /**
     * Run build and analyze results
     */
    runBuild(buildCommand?: string): Promise<BuildResult>;
    /**
     * Detect build command from package.json
     */
    private detectBuildCommand;
    /**
     * Analyze build output for errors
     */
    analyzeBuildError(buildOutput: string): Promise<BuildError[]>;
    /**
     * Categorize TypeScript error by code
     */
    private categorizeError;
    /**
     * Suggest fix for a specific error
     */
    suggestFix(error: BuildError): FixSuggestion;
    /**
     * Get text suggestion for error
     */
    private getFixSuggestion;
    /**
     * Get code fix for error
     */
    private getCodeFix;
    /**
     * Get priority level for error
     */
    private getPriority;
    /**
     * Display build results
     */
    displayResults(result: BuildResult): void;
    /**
     * Display individual fix
     */
    private displayFix;
    /**
     * Indent text for display
     */
    private indent;
    /**
     * Analyze without running build
     */
    analyzeOutput(buildOutput: string): Promise<void>;
    /**
     * CLI interface
     */
    static main(): Promise<void>;
}
//# sourceMappingURL=build-fix-service.d.ts.map