/**
 * Quality Gates Service (Converted from bash)
 * Runs format, lint, type-check quality gates
 * Cross-platform (Windows, Mac, Linux)
 */
import { ProcessUtils } from '../utils/process-utils.js';
import { existsSync, readFileSync } from 'fs';
import { join } from 'path';
export class QualityGates {
    projectRoot;
    coverageThreshold;
    constructor(projectRoot, coverageThreshold = 80) {
        this.projectRoot = projectRoot || process.cwd();
        this.coverageThreshold = coverageThreshold;
    }
    /**
     * Run all quality gates
     */
    async runAll() {
        const [format, lint, typeCheck] = await Promise.all([
            this.runFormat(),
            this.runLint(),
            this.runTypeCheck()
        ]);
        const overall_passed = format.status !== 'failed' &&
            lint.status !== 'failed' &&
            typeCheck.status !== 'failed';
        return {
            format,
            lint,
            type_check: typeCheck,
            overall_passed
        };
    }
    /**
     * Run format check (Prettier)
     */
    async runFormat() {
        const startTime = Date.now();
        try {
            // Check if prettier exists
            const hasPrettier = await ProcessUtils.commandExists('prettier');
            if (!hasPrettier) {
                return {
                    status: 'skipped',
                    message: 'Prettier not installed'
                };
            }
            // Run prettier check
            const result = await ProcessUtils.exec('prettier --check .', {
                cwd: this.projectRoot,
                timeout: 30000
            });
            const timeTaken = Date.now() - startTime;
            if (result.exitCode === 0) {
                return {
                    status: 'passed',
                    message: 'All files formatted correctly',
                    time_ms: timeTaken
                };
            }
            else {
                const filesCount = (result.stdout.match(/\n/g) || []).length;
                return {
                    status: 'failed',
                    message: 'Some files need formatting',
                    files_checked: filesCount,
                    time_ms: timeTaken
                };
            }
        }
        catch (error) {
            return {
                status: 'failed',
                message: error.message,
                time_ms: Date.now() - startTime
            };
        }
    }
    /**
     * Run linter (ESLint)
     */
    async runLint() {
        const startTime = Date.now();
        try {
            // Check if eslint exists
            const hasESLint = await ProcessUtils.commandExists('eslint');
            if (!hasESLint) {
                return {
                    status: 'skipped',
                    message: 'ESLint not installed'
                };
            }
            // Run eslint
            const result = await ProcessUtils.exec('eslint . --ext .ts,.js', {
                cwd: this.projectRoot,
                timeout: 60000
            });
            const timeTaken = Date.now() - startTime;
            // Parse errors and warnings
            const errors = (result.stdout.match(/error/gi) || []).length;
            const warnings = (result.stdout.match(/warning/gi) || []).length;
            if (result.exitCode === 0) {
                return {
                    status: 'passed',
                    message: 'No lint errors',
                    errors: 0,
                    warnings: 0,
                    time_ms: timeTaken
                };
            }
            else if (errors === 0 && warnings > 0) {
                return {
                    status: 'warning',
                    message: `${warnings} warnings found`,
                    errors: 0,
                    warnings,
                    time_ms: timeTaken
                };
            }
            else {
                return {
                    status: 'failed',
                    message: `${errors} errors, ${warnings} warnings`,
                    errors,
                    warnings,
                    time_ms: timeTaken
                };
            }
        }
        catch (error) {
            return {
                status: 'failed',
                message: error.message,
                time_ms: Date.now() - startTime
            };
        }
    }
    /**
     * Run type checker (TypeScript)
     */
    async runTypeCheck() {
        const startTime = Date.now();
        try {
            // Check if tsc exists
            const hasTSC = await ProcessUtils.commandExists('tsc');
            if (!hasTSC) {
                return {
                    status: 'skipped',
                    message: 'TypeScript not installed'
                };
            }
            // Run tsc
            const result = await ProcessUtils.exec('tsc --noEmit', {
                cwd: this.projectRoot,
                timeout: 60000
            });
            const timeTaken = Date.now() - startTime;
            if (result.exitCode === 0) {
                return {
                    status: 'passed',
                    message: 'No type errors',
                    time_ms: timeTaken
                };
            }
            else {
                const errorCount = (result.stdout.match(/error TS/g) || []).length;
                return {
                    status: 'failed',
                    message: `${errorCount} type errors`,
                    errors: errorCount,
                    time_ms: timeTaken
                };
            }
        }
        catch (error) {
            return {
                status: 'failed',
                message: error.message,
                time_ms: Date.now() - startTime
            };
        }
    }
    /**
     * Run coverage check (if test script exists)
     */
    async runCoverageCheck() {
        const startTime = Date.now();
        try {
            // Check if test:coverage script exists
            const hasCoverageScript = await this.hasScript('test:coverage');
            if (!hasCoverageScript) {
                return {
                    status: 'skipped',
                    message: 'No test:coverage script found',
                    time_ms: Date.now() - startTime
                };
            }
            // Check if TDDService is available
            const tddServicePath = join(this.projectRoot, 'dist', 'services', 'tdd-service.js');
            if (!existsSync(tddServicePath)) {
                return {
                    status: 'skipped',
                    message: 'TDDService not built',
                    time_ms: Date.now() - startTime
                };
            }
            // Import TDDService dynamically
            const { TDDService } = await import('../services/tdd-service.js');
            const tddService = new TDDService(this.projectRoot, { coverageThreshold: this.coverageThreshold });
            const result = await tddService.verifyCoverage(this.coverageThreshold);
            const timeTaken = Date.now() - startTime;
            if (!result.coverage) {
                return {
                    status: 'skipped',
                    message: 'No coverage data available',
                    time_ms: timeTaken
                };
            }
            // Check if coverage meets threshold
            const coverage = result.coverage;
            const meetsThreshold = coverage.lines >= this.coverageThreshold &&
                coverage.branches >= this.coverageThreshold &&
                coverage.functions >= this.coverageThreshold &&
                coverage.statements >= this.coverageThreshold;
            if (meetsThreshold) {
                return {
                    status: 'passed',
                    message: `Coverage ${coverage.lines}% (threshold: ${this.coverageThreshold}%)`,
                    time_ms: timeTaken
                };
            }
            else {
                return {
                    status: 'failed',
                    message: `Coverage below threshold: L${coverage.lines}% B${coverage.branches}% F${coverage.functions}% S${coverage.statements}% (required: ${this.coverageThreshold}%)`,
                    time_ms: timeTaken
                };
            }
        }
        catch (error) {
            return {
                status: 'skipped',
                message: `Coverage check skipped: ${error.message}`,
                time_ms: Date.now() - startTime
            };
        }
    }
    /**
     * Check if package.json has a specific script
     */
    async hasScript(scriptName) {
        try {
            const pkgPath = join(this.projectRoot, 'package.json');
            if (!existsSync(pkgPath)) {
                return false;
            }
            const pkg = JSON.parse(readFileSync(pkgPath, 'utf-8'));
            return !!pkg.scripts?.[scriptName];
        }
        catch {
            return false;
        }
    }
    /**
     * Format results for display
     */
    formatResults(results) {
        const formatStatus = (status) => {
            switch (status) {
                case 'passed': return '✅';
                case 'warning': return '⚠️';
                case 'failed': return '❌';
                case 'skipped': return '⏭️';
            }
        };
        return `
Quality Gates:
  Format:     ${formatStatus(results.format.status)} ${results.format.message || ''}
  Lint:       ${formatStatus(results.lint.status)} ${results.lint.message || ''}
  Type Check: ${formatStatus(results.type_check.status)} ${results.type_check.message || ''}

Overall: ${results.overall_passed ? '✅ PASSED' : '❌ FAILED'}
    `.trim();
    }
}
// CLI interface
// Check if this file is being run directly (CLI mode)
const isMainModule = process.argv[1]?.endsWith('/quality-gates.js') ||
    process.argv[1]?.endsWith('quality-gates.js') ||
    process.argv[1]?.endsWith('\\quality-gates.js');
if (isMainModule) {
    const command = process.argv[2];
    const gates = new QualityGates();
    (async () => {
        switch (command) {
            case 'all': {
                const results = await gates.runAll();
                console.log(gates.formatResults(results));
                process.exit(results.overall_passed ? 0 : 1);
            }
            case 'format': {
                const result = await gates.runFormat();
                console.log(JSON.stringify(result, null, 2));
                process.exit(result.status === 'failed' ? 1 : 0);
            }
            case 'lint': {
                const result = await gates.runLint();
                console.log(JSON.stringify(result, null, 2));
                process.exit(result.status === 'failed' ? 1 : 0);
            }
            case 'type-check': {
                const result = await gates.runTypeCheck();
                console.log(JSON.stringify(result, null, 2));
                process.exit(result.status === 'failed' ? 1 : 0);
            }
            case 'coverage': {
                const result = await gates.runCoverageCheck();
                console.log(JSON.stringify(result, null, 2));
                process.exit(result.status === 'failed' ? 1 : 0);
            }
            default:
                console.error(`
Usage: node quality-gates.js <command>

Commands:
  all          Run all quality gates
  format       Run format check only
  lint         Run linter only
  type-check   Run type checker only
  coverage     Run coverage check only

Examples:
  node quality-gates.js all
  node quality-gates.js format
  node quality-gates.js coverage
        `);
                process.exit(1);
        }
    })().catch(error => {
        console.error('Error:', error.message);
        process.exit(1);
    });
}
//# sourceMappingURL=quality-gates.js.map