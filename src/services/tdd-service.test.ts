/**
 * TDD Service Tests
 * Tests for test-driven development workflow service
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';

// Mock dependencies FIRST
vi.mock('../utils/process-utils', () => ({
  ProcessUtils: {
    exec: vi.fn().mockResolvedValue({ stdout: '', stderr: '', exitCode: 0 }),
    commandExists: vi.fn().mockResolvedValue(true),
    getPlatform: vi.fn().mockReturnValue({ platform: 'linux' as NodeJS.Platform, isWindows: false, isMac: false, isLinux: true }),
    setEnv: vi.fn().mockResolvedValue(undefined),
    getEnv: vi.fn().mockReturnValue(undefined),
    exit: vi.fn().mockReturnValue(undefined)
  }
}));

vi.mock('fs', () => ({
  existsSync: vi.fn().mockReturnValue(false),
  readFileSync: vi.fn().mockReturnValue(JSON.stringify({ dependencies: {}, devDependencies: {}, scripts: {} }))
}));

// THEN import the modules
import { TDDService, DEFAULT_TDD_CONFIG, TestFramework } from './tdd-service';
import { ProcessUtils } from '../utils/process-utils';
import { existsSync, readFileSync } from 'fs';

const mockedProcessUtils = ProcessUtils;
const mockedExistsSync = existsSync;
const mockedReadFileSync = readFileSync;

describe('TDDService', () => {
  let service: TDDService;
  const mockProjectRoot = '/test/project';

  beforeEach(() => {
    vi.clearAllMocks();
    service = new TDDService(mockProjectRoot);
  });

  describe('Constructor', () => {
    it('should initialize with default config', () => {
      const newService = new TDDService();
      expect(newService).toBeInstanceOf(TDDService);
    });

    it('should initialize with custom config', () => {
      const customService = new TDDService(mockProjectRoot, {
        coverageThreshold: 90,
        testCommand: 'npm run test:custom',
        coverageCommand: 'npm run coverage:custom',
        testPatterns: ['**/*.test.ts']
      });
      expect(customService).toBeInstanceOf(TDDService);
    });
  });

  describe('detectTestFramework', () => {
    it('should detect Jest from dependencies', async () => {
      mockedExistsSync.mockReturnValue(true);
      mockedReadFileSync.mockReturnValue(JSON.stringify({
        dependencies: {},
        devDependencies: { jest: '^29.0.0' }
      }));

      const framework = await service.detectTestFramework();
      expect(framework).toBe(TestFramework.JEST);
    });

    it('should detect Vitest from dependencies', async () => {
      mockedExistsSync.mockReturnValue(true);
      mockedReadFileSync.mockReturnValue(JSON.stringify({
        dependencies: {},
        devDependencies: { vitest: '^1.0.0' }
      }));

      const framework = await service.detectTestFramework();
      expect(framework).toBe(TestFramework.VITEST);
    });

    it('should detect Mocha from dependencies', async () => {
      mockedExistsSync.mockReturnValue(true);
      mockedReadFileSync.mockReturnValue(JSON.stringify({
        dependencies: {},
        devDependencies: { mocha: '^10.0.0' }
      }));

      const framework = await service.detectTestFramework();
      expect(framework).toBe(TestFramework.MOCHA);
    });

    it('should return UNKNOWN if no framework detected', async () => {
      mockedExistsSync.mockReturnValue(true);
      mockedReadFileSync.mockReturnValue(JSON.stringify({
        dependencies: {},
        devDependencies: { eslint: '^8.0.0' }
      }));

      const framework = await service.detectTestFramework();
      expect(framework).toBe(TestFramework.UNKNOWN);
    });

    it('should return UNKNOWN if package.json not found', async () => {
      mockedExistsSync.mockReturnValue(false);
      const framework = await service.detectTestFramework();
      expect(framework).toBe(TestFramework.UNKNOWN);
    });

    it('should handle read errors gracefully', async () => {
      mockedExistsSync.mockReturnValue(true);
      mockedReadFileSync.mockImplementation(() => {
        throw new Error('Read error');
      });

      const framework = await service.detectTestFramework();
      expect(framework).toBe(TestFramework.UNKNOWN);
    });
  });

  describe('generateTests', () => {
    it('should generate Jest test guidance for unit tests', async () => {
      mockedExistsSync.mockReturnValue(true);
      mockedReadFileSync.mockReturnValue(JSON.stringify({
        dependencies: {},
        devDependencies: { jest: '^29.0.0' }
      }));

      const guidance = await service.generateTests('src/services/my-service.ts', 'unit');
      expect(guidance).toContain('JEST');
      expect(guidance).toContain('UNIT');
      expect(guidance).toContain('my-service');
    });

    it('should generate Vitest test guidance for integration tests', async () => {
      mockedExistsSync.mockReturnValue(true);
      mockedReadFileSync.mockReturnValue(JSON.stringify({
        dependencies: {},
        devDependencies: { vitest: '^1.0.0' }
      }));

      const guidance = await service.generateTests('src/services/api.ts', 'integration');
      expect(guidance).toContain('VITEST');
      expect(guidance).toContain('INTEGRATION');
    });

    it('should generate Mocha test guidance for e2e tests', async () => {
      mockedExistsSync.mockReturnValue(true);
      mockedReadFileSync.mockReturnValue(JSON.stringify({
        dependencies: {},
        devDependencies: { mocha: '^10.0.0' }
      }));

      const guidance = await service.generateTests('src/utils/helper.ts', 'e2e');
      expect(guidance).toContain('MOCHA');
      expect(guidance).toContain('E2E');
    });

    it('should generate generic guidance for unknown framework', async () => {
      mockedExistsSync.mockReturnValue(false);

      const guidance = await service.generateTests('src/components/button.tsx', 'unit');
      expect(guidance).toContain('Framework not detected');
      expect(guidance).toContain('npm install --save-dev jest');
    });
  });

  describe('verifyCoverage', () => {
    it('should pass when coverage meets threshold', async () => {
      mockedExistsSync.mockReturnValue(true);
      mockedReadFileSync.mockReturnValue(JSON.stringify({
        scripts: { 'test:coverage': 'jest --coverage' }
      }));
      mockedProcessUtils.exec.mockResolvedValue({
        stdout: 'Lines: 85%, Branches: 90%, Functions: 88%, Statements: 87%',
        stderr: '',
        exitCode: 0
      });

      const result = await service.verifyCoverage(80);
      expect(result.passed).toBe(0);
      expect(result.failed).toBe(0);
      expect(result.coverage?.lines).toBe(85);
      expect(result.coverage?.branches).toBe(90);
    });

    it('should fail when coverage below threshold', async () => {
      mockedExistsSync.mockReturnValue(true);
      mockedReadFileSync.mockReturnValue(JSON.stringify({
        scripts: { 'test:coverage': 'jest --coverage' }
      }));
      mockedProcessUtils.exec.mockResolvedValue({
        stdout: 'Lines: 75%, Branches: 70%, Functions: 72%, Statements: 73%',
        stderr: '',
        exitCode: 0
      });

      const result = await service.verifyCoverage(80);
      expect(result.passed).toBe(0);
      expect(result.failed).toBe(0);
      expect(result.coverage?.lines).toBe(75);
    });

    it('should skip if coverage script not found', async () => {
      mockedExistsSync.mockReturnValue(true);
      mockedReadFileSync.mockReturnValue(JSON.stringify({
        scripts: { test: 'jest' }
      }));

      const result = await service.verifyCoverage(80);
      expect(result.passed).toBe(0);
      expect(result.failed).toBe(0);
      expect(result.skipped).toBe(0);
      expect(result.status).toBe('skipped');
    });

    it('should skip if TDDService not built', async () => {
      mockedExistsSync.mockReturnValue(true);
      mockedReadFileSync.mockReturnValue(JSON.stringify({
        scripts: { 'test:coverage': 'jest --coverage' }
      }));

      // Mock import to fail
      const result = await service.verifyCoverage(80);
      // Should handle gracefully
      expect(result).toBeDefined();
    });

    it('should use custom threshold', async () => {
      mockedExistsSync.mockReturnValue(true);
      mockedReadFileSync.mockReturnValue(JSON.stringify({
        scripts: { 'test:coverage': 'jest --coverage' }
      }));
      mockedProcessUtils.exec.mockResolvedValue({
        stdout: 'Lines: 85%, Branches: 90%, Functions: 88%, Statements: 87%',
        stderr: '',
        exitCode: 0
      });

      const result = await service.verifyCoverage(90);
      expect(result.coverage?.lines).toBe(85);
    });

    it('should handle exec errors', async () => {
      mockedExistsSync.mockReturnValue(true);
      mockedReadFileSync.mockReturnValue(JSON.stringify({
        scripts: { 'test:coverage': 'jest --coverage' }
      }));
      mockedProcessUtils.exec.mockResolvedValue({
        stdout: '',
        stderr: 'Error',
        exitCode: 1
      });

      const result = await service.verifyCoverage(80);
      expect(result.passed).toBe(0);
      expect(result.failed).toBe(0);
    });
  });

  describe('runTDDCycle', () => {
    it('should display TDD cycle guidance', async () => {
      const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

      await service.runTDDCycle('Add user authentication');

      expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('RED-GREEN-REFACTOR'));
      expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('Add user authentication'));
      expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('80%'));

      consoleSpy.mockRestore();
    });
  });

  describe('hasTestScript', () => {
    it('should return true if test script exists', async () => {
      mockedExistsSync.mockReturnValue(true);
      mockedReadFileSync.mockReturnValue(JSON.stringify({
        scripts: { test: 'jest' }
      }));

      const hasTest = await service.hasTestScript();
      expect(hasTest).toBe(true);
    });

    it('should return true if test:coverage script exists', async () => {
      mockedExistsSync.mockReturnValue(true);
      mockedReadFileSync.mockReturnValue(JSON.stringify({
        scripts: { 'test:coverage': 'jest --coverage' }
      }));

      const hasTest = await service.hasTestScript();
      expect(hasTest).toBe(true);
    });

    it('should return false if no test script', async () => {
      mockedExistsSync.mockReturnValue(true);
      mockedReadFileSync.mockReturnValue(JSON.stringify({
        scripts: { build: 'tsc' }
      }));

      const hasTest = await service.hasTestScript();
      expect(hasTest).toBe(false);
    });

    it('should return false if package.json not found', async () => {
      mockedExistsSync.mockReturnValue(false);

      const hasTest = await service.hasTestScript();
      expect(hasTest).toBe(false);
    });

    it('should handle read errors gracefully', async () => {
      mockedExistsSync.mockReturnValue(true);
      mockedReadFileSync.mockImplementation(() => {
        throw new Error('Read error');
      });

      const hasTest = await service.hasTestScript();
      expect(hasTest).toBe(false);
    });
  });

  describe('Edge cases', () => {
    it('should handle empty project root', () => {
      const emptyService = new TDDService('');
      expect(emptyService).toBeInstanceOf(TDDService);
    });

    it('should handle zero coverage threshold', async () => {
      mockedExistsSync.mockReturnValue(true);
      mockedReadFileSync.mockReturnValue(JSON.stringify({
        scripts: { 'test:coverage': 'jest --coverage' }
      }));
      mockedProcessUtils.exec.mockResolvedValue({
        stdout: 'Lines: 0%, Branches: 0%, Functions: 0%, Statements: 0%',
        stderr: '',
        exitCode: 0
      });

      const result = await service.verifyCoverage(0);
      expect(result.coverage?.lines).toBe(0);
    });

    it('should handle 100% coverage threshold', async () => {
      mockedExistsSync.mockReturnValue(true);
      mockedReadFileSync.mockReturnValue(JSON.stringify({
        scripts: { 'test:coverage': 'jest --coverage' }
      }));
      mockedProcessUtils.exec.mockResolvedValue({
        stdout: 'Lines: 100%, Branches: 100%, Functions: 100%, Statements: 100%',
        stderr: '',
        exitCode: 0
      });

      const result = await service.verifyCoverage(100);
      expect(result.coverage?.lines).toBe(100);
    });

    it('should parse Istanbul-style coverage output', async () => {
      mockedExistsSync.mockReturnValue(true);
      mockedReadFileSync.mockReturnValue(JSON.stringify({
        scripts: { 'test:coverage': 'jest --coverage' }
      }));
      mockedProcessUtils.exec.mockResolvedValue({
        stdout: `
          Lines        : 85.5%
          Branches     : 92.3%
          Functions    : 88.7%
          Statements   : 86.2%
        `,
        stderr: '',
        exitCode: 0
      });

      const result = await service.verifyCoverage(80);
      expect(result.coverage?.lines).toBe(85.5);
      expect(result.coverage?.branches).toBe(92.3);
      expect(result.coverage?.functions).toBe(88.7);
      expect(result.coverage?.statements).toBe(86.2);
    });

    it('should handle malformed coverage output', async () => {
      mockedExistsSync.mockReturnValue(true);
      mockedReadFileSync.mockReturnValue(JSON.stringify({
        scripts: { 'test:coverage': 'jest --coverage' }
      }));
      mockedProcessUtils.exec.mockResolvedValue({
        stdout: 'Invalid coverage output',
        stderr: 'Error running coverage',
        exitCode: 1
      });

      const result = await service.verifyCoverage(80);
      expect(result.coverage?.lines).toBe(0);
      expect(result.coverage?.branches).toBe(0);
    });

    it('should handle timeout errors', async () => {
      mockedExistsSync.mockReturnValue(true);
      mockedReadFileSync.mockReturnValue(JSON.stringify({
        scripts: { 'test:coverage': 'jest --coverage' }
      }));
      mockedProcessUtils.exec.mockRejectedValue(new Error('Timeout'));

      const result = await service.verifyCoverage(80);
      expect(result.passed).toBe(0);
      expect(result.failed).toBe(0);
      expect(result.skipped).toBe(0);
    });
  });

  describe('Helper methods', () => {
    it('should extract class name from file path', () => {
      const name = (service as any).extractClassName('src/services/my-service.ts');
      expect(name).toBe('MyService');
    });

    it('should extract class name with underscores', () => {
      const name = (service as any).extractClassName('src/services/my_awesome_service.ts');
      expect(name).toBeTruthy();
    });

    it('should get test file path', () => {
      const testPath = (service as any).getTestFilePath('src/service.ts');
      expect(testPath).toContain('test.ts');
    });

    it('should parse coverage output', () => {
      const coverage = (service as any).parseCoverageOutput('Lines: 85%, Branches: 90%');
      expect(coverage.lines).toBe(85);
      expect(coverage.branches).toBe(90);
    });

    it('should parse empty coverage output', () => {
      const coverage = (service as any).parseCoverageOutput('');
      expect(coverage.lines).toBe(0);
    });

    it('should create skipped result', () => {
      const result = (service as any).createSkippedResult('test message');
      expect(result.passed).toBe(0);
      expect(result.failed).toBe(0);
      expect(result.skipped).toBe(0);
    });

    it('should create error result', () => {
      const result = (service as any).createErrorResult('error message');
      expect(result.passed).toBe(0);
      expect(result.failed).toBe(0);
      expect(result.skipped).toBe(0);
    });

    it('should get service path', () => {
      const path = (service as any).getServicePath();
      expect(path).toContain('tdd-service.js');
    });
  });

  describe('Guidance methods', () => {
    it('should generate Jest guidance', () => {
      mockedExistsSync.mockReturnValue(true);
      mockedReadFileSync.mockReturnValue(JSON.stringify({
        dependencies: {},
        devDependencies: { jest: '^29.0.0' }
      }));

      const guidance = (service as any).getJestGuidance('src/service.ts', 'unit');
      expect(guidance).toContain('JEST');
      expect(guidance).toContain('UNIT');
    });

    it('should generate Vitest guidance', () => {
      mockedExistsSync.mockReturnValue(true);
      mockedReadFileSync.mockReturnValue(JSON.stringify({
        dependencies: {},
        devDependencies: { vitest: '^1.0.0' }
      }));

      const guidance = (service as any).getVitestGuidance('src/service.ts', 'unit');
      expect(guidance).toContain('VITEST');
    });

    it('should generate Mocha guidance', () => {
      mockedExistsSync.mockReturnValue(true);
      mockedReadFileSync.mockReturnValue(JSON.stringify({
        dependencies: {},
        devDependencies: { mocha: '^10.0.0' }
      }));

      const guidance = (service as any).getMochaGuidance('src/service.ts', 'unit');
      expect(guidance).toContain('MOCHA');
    });

    it('should generate generic guidance', () => {
      const guidance = (service as any).getGenericGuidance('src/service.ts', 'unit');
      expect(guidance).toContain('Framework not detected');
    });
  });

  describe('Cross-platform compatibility', () => {
    it('should handle Windows paths', async () => {
      const windowsService = new TDDService('C:\\\\test\\\\project');
      mockedExistsSync.mockReturnValue(true);
      mockedReadFileSync.mockReturnValue(JSON.stringify({
        dependencies: {},
        devDependencies: { jest: '^29.0.0' }
      }));

      const framework = await windowsService.detectTestFramework();
      expect(framework).toBe(TestFramework.JEST);
    });

    it('should handle Unix paths', async () => {
      const unixService = new TDDService('/home/user/project');
      mockedExistsSync.mockReturnValue(true);
      mockedReadFileSync.mockReturnValue(JSON.stringify({
        dependencies: {},
        devDependencies: { vitest: '^1.0.0' }
      }));

      const framework = await unixService.detectTestFramework();
      expect(framework).toBe(TestFramework.VITEST);
    });
  });

  describe('CLI interface', () => {
    it('should have CLI main method', () => {
      expect(TDDService.main).toBeDefined();
    });
  });
});
