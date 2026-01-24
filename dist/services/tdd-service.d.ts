/**
 * TDD Service - Test-Driven Development Workflow
 *
 * Provides comprehensive TDD workflow support with coverage tracking.
 * Supports Jest, Vitest, and Mocha testing frameworks.
 *
 * SiftCoder Flavor:
 * - Cross-platform test execution
 * - 80%+ coverage enforcement
 * - RED-GREEN-REFACTOR cycle support
 * - CLI and module interfaces
 */
export interface TDDConfig {
    coverageThreshold: number;
    testPatterns: string[];
    testCommand: string;
    coverageCommand: string;
}
export interface CoverageReport {
    lines: number;
    branches: number;
    functions: number;
    statements: number;
}
export interface TestResult {
    passed: number;
    failed: number;
    skipped: number;
    coverage?: CoverageReport;
    duration?: number;
}
export declare const DEFAULT_TDD_CONFIG: TDDConfig;
/**
 * Supported test frameworks
 */
export declare enum TestFramework {
    JEST = "jest",
    VITEST = "vitest",
    MOCHA = "mocha",
    UNKNOWN = "unknown"
}
export declare class TDDService {
    private projectRoot;
    private config;
    constructor(projectRoot?: string, config?: Partial<TDDConfig>);
    /**
     * Detect test framework from package.json
     */
    detectTestFramework(): Promise<TestFramework>;
    /**
     * Generate test guidance for a file
     */
    generateTests(filePath: string, type: 'unit' | 'integration' | 'e2e'): Promise<string>;
    /**
     * Get test file path from source file
     */
    private getTestFilePath;
    /**
     * Get Jest-specific guidance
     */
    private getJestGuidance;
    /**
     * Get Vitest-specific guidance
     */
    private getVitestGuidance;
    /**
     * Get Mocha-specific guidance
     */
    private getMochaGuidance;
    /**
     * Get generic guidance
     */
    private getGenericGuidance;
    /**
     * Extract class name from file path
     */
    private extractClassName;
    /**
     * Get relative path from test file to source file
     */
    private getRelativePath;
    /**
     * Verify coverage meets threshold
     */
    verifyCoverage(threshold?: number): Promise<TestResult>;
    /**
     * Run Jest/Vitest coverage
     */
    private runJestCoverage;
    /**
     * Run Mocha coverage
     */
    private runMochaCoverage;
    /**
     * Parse coverage from test output
     */
    private parseCoverageOutput;
    /**
     * Create skipped result
     */
    private createSkippedResult;
    /**
     * Create error result
     */
    private createErrorResult;
    /**
     * Run TDD cycle
     */
    runTDDCycle(featureDescription: string): Promise<void>;
    /**
     * Get service path for CLI messages
     */
    private getServicePath;
    /**
     * Check if project has test script
     */
    hasTestScript(): Promise<boolean>;
    /**
     * CLI interface
     */
    static main(): Promise<void>;
}
//# sourceMappingURL=tdd-service.d.ts.map