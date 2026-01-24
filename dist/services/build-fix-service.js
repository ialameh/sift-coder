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
import { ProcessUtils } from '../utils/process-utils.js';
import { FileUtils } from '../utils/file-utils.js';
import { existsSync, readFileSync } from 'fs';
import { join } from 'path';
/**
 * Build Fix Service for error analysis and resolution
 */
export class BuildFixService {
    projectRoot;
    constructor(projectRoot) {
        this.projectRoot = projectRoot || process.cwd();
    }
    /**
     * Run build and analyze results
     */
    async runBuild(buildCommand) {
        const command = buildCommand || this.detectBuildCommand();
        console.log(`\n🔨 Running build: ${command}\n`);
        const result = await ProcessUtils.exec(command, {
            cwd: this.projectRoot,
            timeout: 180000 // 3 minutes
        });
        const success = result.exitCode === 0;
        const errors = success ? [] : await this.analyzeBuildError(result.stdout + result.stderr);
        return {
            success,
            exitCode: result.exitCode,
            output: result.stdout + result.stderr,
            errors,
            fixes: errors.map(e => this.suggestFix(e))
        };
    }
    /**
     * Detect build command from package.json
     */
    detectBuildCommand() {
        try {
            const pkgPath = join(this.projectRoot, 'package.json');
            if (existsSync(pkgPath)) {
                const pkg = JSON.parse(readFileSync(pkgPath, 'utf-8'));
                return pkg.scripts?.build || 'npm run build';
            }
        }
        catch {
            // Fall back to default
        }
        return 'npm run build';
    }
    /**
     * Analyze build output for errors
     */
    async analyzeBuildError(buildOutput) {
        const errors = [];
        const lines = buildOutput.split('\n');
        // TypeScript error patterns
        const tsErrorPattern = /(.+?)\((\d+),(\d+)\): error TS(\d+): (.+)/;
        // TypeScript error pattern alternative
        const tsErrorPattern2 = /(.+?):(\d+):(\d+)-error TS(\d+): (.+)/;
        lines.forEach(line => {
            let match = line.match(tsErrorPattern);
            if (!match) {
                match = line.match(tsErrorPattern2);
            }
            if (match) {
                errors.push({
                    file: match[1],
                    line: parseInt(match[2], 10),
                    column: parseInt(match[3], 10),
                    code: parseInt(match[4], 10),
                    message: match[5],
                    category: this.categorizeError(parseInt(match[4], 10))
                });
            }
        });
        // ESLint patterns
        const eslintPattern = /(.+?):(\d+):(\d+):\s+(error|warning)\s+(.+)/;
        lines.forEach(line => {
            const match = line.match(eslintPattern);
            if (match && match[4] === 'error') {
                errors.push({
                    file: match[1],
                    line: parseInt(match[2], 10),
                    column: parseInt(match[3], 10),
                    code: 0, // ESLint doesn't have error codes
                    message: match[5],
                    category: 'syntax'
                });
            }
        });
        return errors;
    }
    /**
     * Categorize TypeScript error by code
     */
    categorizeError(code) {
        const typeErrors = [2304, 2339, 2345, 2362, 2367, 2322, 2344, 2352, 2355, 2365];
        const syntaxErrors = [1002, 1003, 1005, 1009, 1038, 1086, 1089, 1092, 1109, 1123];
        const importErrors = [2307, 2305, 2306, 2351];
        const configErrors = [5023, 5024, 6053, 6054];
        if (typeErrors.includes(code))
            return 'type';
        if (syntaxErrors.includes(code))
            return 'syntax';
        if (importErrors.includes(code))
            return 'import';
        if (configErrors.includes(code))
            return 'config';
        return 'unknown';
    }
    /**
     * Suggest fix for a specific error
     */
    suggestFix(error) {
        const suggestion = this.getFixSuggestion(error);
        const codeFix = this.getCodeFix(error);
        const priority = this.getPriority(error);
        return {
            error,
            suggestion: suggestion.suggestion,
            code_fix: codeFix,
            priority
        };
    }
    /**
     * Get text suggestion for error
     */
    getFixSuggestion(error) {
        const suggestions = {
            // Type errors
            2304: 'Cannot find name. Add import, declare the variable, or check for typos.',
            2305: 'Module has no exported member. Check exports or import statement.',
            2307: 'Cannot find module. Install with npm/yarn or correct the import path.',
            2339: 'Property does not exist. Add type definition or check property name.',
            2345: 'Argument of type is not assignable. Check types or add type assertion.',
            2362: 'Property does not exist on type. Add index signature or type assertion.',
            2532: 'Object is possibly undefined. Add null check or optional chaining (?.).',
            2551: 'Property is possibly undefined. Add optional chaining (?.) or type guard.',
            2322: 'Type is not assignable. Check type compatibility or use type assertion.',
            2367: 'Type is not comparable. Ensure types are compatible.',
            2352: 'Condition always evaluates to true. Check logic or type guards.',
            2355: 'Function call cycle detected. Break circular references.',
            2365: 'Incompatible enum comparison. Compare values from same enum.',
            // Syntax errors
            1002: 'Unterminated string literal. Add closing quote.',
            1003: 'Identifier expected. Check syntax.',
            1005: "'}' expected. Add closing brace.",
            1009: 'Trailing comma not allowed. Remove trailing comma.',
            1038: "',' expected. Add comma between items.",
            1086: "';' expected. Add semicolon or check syntax.",
            1089: "'}' expected. Add closing brace.",
            1092: "Type parameters cannot appear on a constructor declaration.",
            // Import errors
            2306: 'File is not a module. Check export syntax.',
            2351: 'Cannot import type. Use import type instead.',
            // Config errors
            5023: 'Unknown compiler option. Remove from tsconfig.json.',
            5024: 'Unknown compiler option. Remove from tsconfig.json.',
            6053: 'File is not a module. Add export {} or check imports.'
        };
        if (error.code > 0 && suggestions[error.code]) {
            return { suggestion: suggestions[error.code] };
        }
        // Category-based suggestions
        switch (error.category) {
            case 'type':
                return { suggestion: 'Type mismatch. Check types or add type annotation.' };
            case 'syntax':
                return { suggestion: 'Syntax error. Check for missing brackets, quotes, or operators.' };
            case 'import':
                return { suggestion: 'Import issue. Check module path or install missing package.' };
            case 'config':
                return { suggestion: 'Configuration issue. Check tsconfig.json or build settings.' };
            default:
                return { suggestion: 'Review error message and check code around the error location.' };
        }
    }
    /**
     * Get code fix for error
     */
    getCodeFix(error) {
        const fixes = {
            2532: `// Add optional chaining
value?.method()`,
            2551: `// Add optional chaining
obj?.property`,
            2304: `// Import or declare the variable
import { Name } from './module';`
        };
        return fixes[error.code];
    }
    /**
     * Get priority level for error
     */
    getPriority(error) {
        if (error.category === 'syntax' || error.category === 'config') {
            return 'high'; // Blocks compilation
        }
        if (error.category === 'type') {
            return 'medium'; // Type mismatch
        }
        return 'low'; // Minor issues
    }
    /**
     * Display build results
     */
    displayResults(result) {
        if (result.success) {
            console.log('✅ Build successful!\n');
            return;
        }
        console.log(`❌ Build failed with ${result.errors.length} errors\n`);
        if (result.errors.length === 0) {
            console.log('Build output:\n');
            console.log(result.output);
            return;
        }
        // Group by priority
        const byPriority = {
            high: [],
            medium: [],
            low: []
        };
        result.fixes.forEach(fix => {
            byPriority[fix.priority].push(fix);
        });
        // Display high priority first
        if (byPriority.high.length > 0) {
            console.log('🔴 HIGH PRIORITY:\n');
            byPriority.high.forEach(fix => this.displayFix(fix));
        }
        if (byPriority.medium.length > 0) {
            console.log('🟡 MEDIUM PRIORITY:\n');
            byPriority.medium.forEach(fix => this.displayFix(fix));
        }
        if (byPriority.low.length > 0) {
            console.log('🟢 LOW PRIORITY:\n');
            byPriority.low.forEach(fix => this.displayFix(fix));
        }
    }
    /**
     * Display individual fix
     */
    displayFix(fix) {
        const { error, suggestion, code_fix } = fix;
        console.log(`  ${error.file}:${error.line}:${error.column}`);
        console.log(`    ${error.message}`);
        console.log(`    💡 ${suggestion}`);
        if (code_fix) {
            console.log(`    Code:\n${this.indent(code_fix, '      ')}`);
        }
        console.log('');
    }
    /**
     * Indent text for display
     */
    indent(text, indent) {
        return text.split('\n').map(line => indent + line).join('\n');
    }
    /**
     * Analyze without running build
     */
    async analyzeOutput(buildOutput) {
        const errors = await this.analyzeBuildError(buildOutput);
        console.log(`\n🔍 Found ${errors.length} errors\n`);
        errors.forEach(error => {
            const fix = this.suggestFix(error);
            this.displayFix(fix);
        });
    }
    /**
     * CLI interface
     */
    static async main() {
        const service = new BuildFixService();
        const command = process.argv[2];
        switch (command) {
            case 'run': {
                const buildCommand = process.argv[3];
                const result = await service.runBuild(buildCommand);
                service.displayResults(result);
                ProcessUtils.exit(result.success ? 0 : 1);
            }
            case 'analyze': {
                // Read from stdin or file
                const outputFile = process.argv[3];
                if (outputFile) {
                    const output = await FileUtils.readFile(outputFile);
                    await service.analyzeOutput(output);
                }
                else {
                    console.error('Usage: build-fix-service analyze <output-file>');
                    ProcessUtils.exit(1);
                }
                break;
            }
            case 'error': {
                // Explain a specific error code
                const code = parseInt(process.argv[3], 10);
                if (isNaN(code)) {
                    console.error('Usage: build-fix-service error <error-code>');
                    ProcessUtils.exit(1);
                }
                const error = {
                    file: 'example.ts',
                    line: 1,
                    column: 1,
                    code,
                    message: 'Example error',
                    category: service['categorizeError'](code)
                };
                const fix = service.suggestFix(error);
                console.log(`\nError TS${code}: ${fix.suggestion}\n`);
                break;
            }
            default:
                console.error(`
🔨 Build Fix Service - Automated Build Error Analysis

Usage: build-fix-service <command> [options]

Commands:
  run [build-command]       Run build and analyze errors
                            Default: npm run build

  analyze <output-file>     Analyze build output from file

  error <error-code>        Explain a specific TypeScript error code

Examples:
  build-fix-service run
  build-fix-service run "tsc --noEmit"
  build-fix-service analyze build-output.txt
  build-fix-service error 2304

Common Error Codes:
  2304  - Cannot find name
  2307  - Cannot find module
  2339  - Property does not exist on type
  2532  - Object is possibly 'undefined'
  2322  - Type is not assignable
        `);
                ProcessUtils.exit(1);
        }
    }
}
// CLI interface
if (process.argv[1]?.endsWith('build-fix-service.js')) {
    BuildFixService.main().catch(error => {
        console.error('Error:', error.message);
        ProcessUtils.exit(1);
    });
}
//# sourceMappingURL=build-fix-service.js.map