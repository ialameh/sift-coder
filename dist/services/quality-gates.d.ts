/**
 * Quality Gates Service (Converted from bash)
 * Runs format, lint, type-check quality gates
 * Cross-platform (Windows, Mac, Linux)
 */
export type GateStatus = 'passed' | 'warning' | 'failed' | 'skipped';
export interface GateResult {
    status: GateStatus;
    message?: string;
    errors?: number;
    warnings?: number;
    files_checked?: number;
    time_ms?: number;
}
export interface QualityResults {
    format: GateResult;
    lint: GateResult;
    type_check: GateResult;
    overall_passed: boolean;
}
export declare class QualityGates {
    private projectRoot;
    constructor(projectRoot?: string);
    /**
     * Run all quality gates
     */
    runAll(): Promise<QualityResults>;
    /**
     * Run format check (Prettier)
     */
    runFormat(): Promise<GateResult>;
    /**
     * Run linter (ESLint)
     */
    runLint(): Promise<GateResult>;
    /**
     * Run type checker (TypeScript)
     */
    runTypeCheck(): Promise<GateResult>;
    /**
     * Format results for display
     */
    formatResults(results: QualityResults): string;
}
//# sourceMappingURL=quality-gates.d.ts.map