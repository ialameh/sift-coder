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
import { ProcessUtils } from '../utils/process-utils.js';
import { existsSync, readFileSync } from 'fs';
import { join } from 'path';
export const DEFAULT_TDD_CONFIG = {
    coverageThreshold: 80,
    testPatterns: ['**/*.test.ts', '**/*.test.js', '**/*.spec.ts', '**/*.spec.js'],
    testCommand: 'npm test',
    coverageCommand: 'npm run test:coverage'
};
/**
 * Supported test frameworks
 */
export var TestFramework;
(function (TestFramework) {
    TestFramework["JEST"] = "jest";
    TestFramework["VITEST"] = "vitest";
    TestFramework["MOCHA"] = "mocha";
    TestFramework["UNKNOWN"] = "unknown";
})(TestFramework || (TestFramework = {}));
export class TDDService {
    projectRoot;
    config;
    constructor(projectRoot, config) {
        this.projectRoot = projectRoot || process.cwd();
        this.config = { ...DEFAULT_TDD_CONFIG, ...config };
    }
    /**
     * Detect test framework from package.json
     */
    async detectTestFramework() {
        try {
            const pkgPath = join(this.projectRoot, 'package.json');
            if (!existsSync(pkgPath)) {
                return TestFramework.UNKNOWN;
            }
            const pkg = JSON.parse(readFileSync(pkgPath, 'utf-8'));
            const deps = { ...pkg.dependencies, ...pkg.devDependencies };
            if (deps.jest)
                return TestFramework.JEST;
            if (deps.vitest)
                return TestFramework.VITEST;
            if (deps.mocha)
                return TestFramework.MOCHA;
            return TestFramework.UNKNOWN;
        }
        catch {
            return TestFramework.UNKNOWN;
        }
    }
    /**
     * Generate test guidance for a file
     */
    async generateTests(filePath, type) {
        const framework = await this.detectTestFramework();
        console.log(`\n📋 [TDD] ${type.toUpperCase()} Test Generation Guide for ${filePath}\n`);
        // Determine test file path
        const testPath = this.getTestFilePath(filePath);
        console.log(`📁 Test File: ${testPath}`);
        console.log(`🔧 Framework: ${framework}\n`);
        // Provide framework-specific guidance
        switch (framework) {
            case TestFramework.JEST:
                return this.getJestGuidance(filePath, type);
            case TestFramework.VITEST:
                return this.getVitestGuidance(filePath, type);
            case TestFramework.MOCHA:
                return this.getMochaGuidance(filePath, type);
            default:
                return this.getGenericGuidance(filePath, type);
        }
    }
    /**
     * Get test file path from source file
     */
    getTestFilePath(sourcePath) {
        // Convert src/service.ts to src/service.test.ts
        const ext = sourcePath.substring(sourcePath.lastIndexOf('.'));
        const withoutExt = sourcePath.substring(0, sourcePath.lastIndexOf('.'));
        return `${withoutExt}.test${ext}`;
    }
    /**
     * Get Jest-specific guidance
     */
    getJestGuidance(filePath, type) {
        return `
💡 JEST ${type.toUpperCase()} TEST STRUCTURE:

\`\`\`typescript
import { ${this.extractClassName(filePath)} } from './${this.getRelativePath(filePath)}';

describe('${this.extractClassName(filePath)}', () => {
  describe('Happy Path', () => {
    it('should handle normal operation', async () => {
      // Arrange
      const input = {};

      // Act
      const result = await methodUnderTest(input);

      // Assert
      expect(result).toBeDefined();
    });
  });

  describe('Edge Cases', () => {
    it('should handle null input', async () => {
      // Test null/undefined handling
    });

    it('should handle empty arrays', async () => {
      // Test empty array handling
    });
  });

  describe('Error Cases', () => {
    it('should throw on invalid input', async () => {
      await expect(methodUnderTest(invalidInput))
        .rejects.toThrow();
    });
  });
});
\`\`\`

📊 COVERAGE REQUIREMENTS:
- Lines: ≥${this.config.coverageThreshold}%
- Branches: ≥${this.config.coverageThreshold}%
- Functions: ≥${this.config.coverageThreshold}%
- Statements: ≥${this.config.coverageThreshold}%

🚀 RUN TESTS:
  npm test -- ${this.getTestFilePath(filePath)}
  npm run test:coverage
`;
    }
    /**
     * Get Vitest-specific guidance
     */
    getVitestGuidance(filePath, type) {
        return this.getJestGuidance(filePath, type).replace('JEST', 'VITEST');
    }
    /**
     * Get Mocha-specific guidance
     */
    getMochaGuidance(filePath, type) {
        return `
💡 MOCHA ${type.toUpperCase()} TEST STRUCTURE:

\`\`\`typescript
import { expect } from 'chai';
import { ${this.extractClassName(filePath)} } from './${this.getRelativePath(filePath)}';

describe('${this.extractClassName(filePath)}', () => {
  describe('Happy Path', () => {
    it('should handle normal operation', async () => {
      // Arrange
      const input = {};

      // Act
      const result = await methodUnderTest(input);

      // Assert
      expect(result).to.be.undefined;
    });
  });

  describe('Edge Cases', () => {
    it('should handle null input', async () => {
      // Test null/undefined handling
    });

    it('should handle empty arrays', async () => {
      // Test empty array handling
    });
  });

  describe('Error Cases', () => {
    it('should throw on invalid input', async () => {
      await expect(methodUnderTest(invalidInput))
        .to.eventually.throw();
    });
  });
});
\`\`\`

📊 COVERAGE REQUIREMENTS:
- Lines: ≥${this.config.coverageThreshold}%
- Branches: ≥${this.config.coverageThreshold}%
- Functions: ≥${this.config.coverageThreshold}%
- Statements: ≥${this.config.coverageThreshold}%

🚀 RUN TESTS:
  npm test -- ${this.getTestFilePath(filePath)}
  npm run test:coverage
`;
    }
    /**
     * Get generic guidance
     */
    getGenericGuidance(filePath, type) {
        return `
💡 ${type.toUpperCase()} TEST GENERATION:

Framework not detected. Please configure test framework first.

📁 Test File: ${this.getTestFilePath(filePath)}

🚀 QUICK START:
  npm install --save-dev jest @types/jest
  npx jest --init

📊 COVERAGE REQUIREMENTS:
- Lines: ≥${this.config.coverageThreshold}%
- Branches: ≥${this.config.coverageThreshold}%
- Functions: ≥${this.config.coverageThreshold}%
- Statements: ≥${this.config.coverageThreshold}%
`;
    }
    /**
     * Extract class name from file path
     */
    extractClassName(filePath) {
        const fileName = filePath.split('/').pop() || '';
        const withoutExt = fileName.replace(/\.(ts|js|tsx|jsx)$/, '');
        return withoutExt.split(/[-_]/).map(part => part.charAt(0).toUpperCase() + part.slice(1)).join('');
    }
    /**
     * Get relative path from test file to source file
     */
    getRelativePath(filePath) {
        const parts = filePath.split('/');
        return parts[parts.length - 1];
    }
    /**
     * Verify coverage meets threshold
     */
    async verifyCoverage(threshold) {
        const targetThreshold = threshold || this.config.coverageThreshold;
        console.log(`\n📊 [TDD] Verifying coverage (target: ${targetThreshold}%)\n`);
        const framework = await this.detectTestFramework();
        try {
            let result;
            switch (framework) {
                case TestFramework.JEST:
                case TestFramework.VITEST:
                    result = await this.runJestCoverage();
                    break;
                case TestFramework.MOCHA:
                    result = await this.runMochaCoverage();
                    break;
                default:
                    return this.createSkippedResult('No test framework detected');
            }
            // Check if coverage meets threshold
            const coverage = result.coverage;
            const passed = coverage.lines >= targetThreshold &&
                coverage.branches >= targetThreshold &&
                coverage.functions >= targetThreshold &&
                coverage.statements >= targetThreshold;
            if (passed) {
                console.log(`✅ Coverage meets threshold (${targetThreshold}%)\n`);
            }
            else {
                console.log(`❌ Coverage below threshold (${targetThreshold}%)\n`);
                console.log(`   Lines: ${coverage.lines}%`);
                console.log(`   Branches: ${coverage.branches}%`);
                console.log(`   Functions: ${coverage.functions}%`);
                console.log(`   Statements: ${coverage.statements}%\n`);
            }
            return result;
        }
        catch (error) {
            console.log(`❌ Coverage check failed: ${error.message}\n`);
            return this.createErrorResult(error.message);
        }
    }
    /**
     * Run Jest/Vitest coverage
     */
    async runJestCoverage() {
        const result = await ProcessUtils.exec(this.config.coverageCommand, {
            cwd: this.projectRoot,
            timeout: 120000
        });
        // Parse coverage from output
        const coverage = this.parseCoverageOutput(result.stdout);
        return {
            passed: 0,
            failed: 0,
            skipped: 0,
            coverage
        };
    }
    /**
     * Run Mocha coverage
     */
    async runMochaCoverage() {
        const result = await ProcessUtils.exec(this.config.coverageCommand, {
            cwd: this.projectRoot,
            timeout: 120000
        });
        const coverage = this.parseCoverageOutput(result.stdout);
        return {
            passed: 0,
            failed: 0,
            skipped: 0,
            coverage
        };
    }
    /**
     * Parse coverage from test output
     */
    parseCoverageOutput(output) {
        // Try to parse Istanbul-style coverage (handles both "Lines: 85%" and "Lines        :        85%")
        const linesMatch = output.match(/Lines\s*:\s*([\d.]+)%?/);
        const branchesMatch = output.match(/Branches\s*:\s*([\d.]+)%?/);
        const functionsMatch = output.match(/Functions\s*:\s*([\d.]+)%?/);
        const statementsMatch = output.match(/Statements\s*:\s*([\d.]+)%?/);
        return {
            lines: linesMatch ? parseFloat(linesMatch[1]) : 0,
            branches: branchesMatch ? parseFloat(branchesMatch[1]) : 0,
            functions: functionsMatch ? parseFloat(functionsMatch[1]) : 0,
            statements: statementsMatch ? parseFloat(statementsMatch[1]) : 0
        };
    }
    /**
     * Create skipped result
     */
    createSkippedResult(_message) {
        return {
            passed: 0,
            failed: 0,
            skipped: 0,
            coverage: {
                lines: 0,
                branches: 0,
                functions: 0,
                statements: 0
            }
        };
    }
    /**
     * Create error result
     */
    createErrorResult(_message) {
        return {
            passed: 0,
            failed: 0,
            skipped: 0,
            coverage: {
                lines: 0,
                branches: 0,
                functions: 0,
                statements: 0
            }
        };
    }
    /**
     * Run TDD cycle
     */
    async runTDDCycle(featureDescription) {
        console.log('\n🔄 [TDD] Starting RED-GREEN-REFACTOR Cycle\n');
        console.log(`Feature: ${featureDescription}\n`);
        // RED: Write failing tests
        console.log('🔴 PHASE 1: RED - Write failing tests');
        console.log('   1. Identify test scenarios');
        console.log('   2. Write tests that fail');
        console.log('   3. Verify tests fail\n');
        // GREEN: Make tests pass
        console.log('🟢 PHASE 2: GREEN - Implement code to pass tests');
        console.log('   1. Write minimum code to pass tests');
        console.log('   2. Run tests: npm test');
        console.log('   3. Fix until all tests pass\n');
        // REFACTOR: Improve code quality
        console.log('🔵 PHASE 3: REFACTOR - Improve code quality');
        console.log('   1. Clean up code');
        console.log('   2. Extract methods/classes');
        console.log('   3. Verify tests still pass\n');
        // VERIFY: Check coverage
        console.log('✅ PHASE 4: VERIFY - Check coverage');
        console.log('   1. Run coverage: npm run test:coverage');
        console.log(`   2. Verify coverage >= ${this.config.coverageThreshold}%\n`);
        console.log('💡 Run this command to verify coverage:\n');
        console.log(`   node ${this.getServicePath()} verify\n`);
    }
    /**
     * Get service path for CLI messages
     */
    getServicePath() {
        return 'dist/services/tdd-service.js';
    }
    /**
     * Check if project has test script
     */
    async hasTestScript() {
        try {
            const pkgPath = join(this.projectRoot, 'package.json');
            if (!existsSync(pkgPath)) {
                return false;
            }
            const pkg = JSON.parse(readFileSync(pkgPath, 'utf-8'));
            return !!(pkg.scripts?.test || pkg.scripts?.['test:coverage']);
        }
        catch {
            return false;
        }
    }
    /**
     * CLI interface
     */
    static async main() {
        const command = process.argv[2];
        const service = new TDDService();
        switch (command) {
            case 'generate': {
                const filePath = process.argv[3];
                const type = (process.argv[4] || 'unit');
                if (!filePath) {
                    console.error('Usage: tdd-service generate <file-path> [unit|integration|e2e]');
                    ProcessUtils.exit(1);
                }
                await service.generateTests(filePath, type);
                break;
            }
            case 'verify': {
                const threshold = process.argv[3] ? parseInt(process.argv[3], 10) : undefined;
                await service.verifyCoverage(threshold);
                break;
            }
            case 'cycle': {
                const feature = process.argv[3] || 'Feature implementation';
                await service.runTDDCycle(feature);
                break;
            }
            default:
                console.error(`
📋 TDD Service - Test-Driven Development Workflow

Usage: tdd-service <command> [options]

Commands:
  generate <file> [type]     Generate test guidance for file
                             type: unit | integration | e2e (default: unit)

  verify [threshold]         Verify coverage meets threshold (default: 80%)

  cycle [description]        Run TDD cycle guidance

Examples:
  tdd-service generate src/services/my-service.ts
  tdd-service generate src/services/my-service.ts integration
  tdd-service verify 80
  tdd-service cycle "Add user authentication"
        `);
                ProcessUtils.exit(1);
        }
    }
}
// CLI interface
if (process.argv[1]?.endsWith('tdd-service.js')) {
    TDDService.main().catch(error => {
        console.error('Error:', error.message);
        ProcessUtils.exit(1);
    });
}
//# sourceMappingURL=tdd-service.js.map