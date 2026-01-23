/**
 * QualityGates Service Tests
 * Tests for code quality gate checks
 */

import { QualityGates, GateResult, QualityResults, GateStatus } from './quality-gates';

// Mock ProcessUtils with proper factory
const mockExec = jest.fn();
const mockCommandExists = jest.fn();
const mockSpawn = jest.fn();

jest.mock('../utils/process-utils.js', () => ({
  ProcessUtils: {
    exec: mockExec,
    commandExists: mockCommandExists,
    spawn: mockSpawn
  }
}), { virtual: true });

// Import after mock
import { ProcessUtils } from '../utils/process-utils.js';

describe('QualityGates', () => {
  let qualityGates: QualityGates;

  beforeEach(() => {
    qualityGates = new QualityGates('/test/project');
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('constructor', () => {
    it('should initialize with project root', () => {
      const gates = new QualityGates('/test/project');

      expect(gates).toBeInstanceOf(QualityGates);
    });

    it('should initialize without project root (use cwd)', () => {
      const gates = new QualityGates();

      expect(gates).toBeInstanceOf(QualityGates);
    });
  });

  describe('runFormat', () => {
    it('should pass when prettier check succeeds', async () => {
      ProcessUtils.commandExists = jest.fn().mockResolvedValue(true);
      ProcessUtils.exec = jest.fn().mockResolvedValue({
        exitCode: 0,
        stdout: 'All files formatted',
        stderr: ''
      });

      const result = await qualityGates.runFormat();

      expect(result.status).toBe('passed');
      expect(result.message).toBe('All files formatted correctly');
      expect(result.time_ms).toBeGreaterThan(0);
    });

    it('should fail when prettier check finds issues', async () => {
      ProcessUtils.commandExists = jest.fn().mockResolvedValue(true);
      ProcessUtils.exec = jest.fn().mockResolvedValue({
        exitCode: 1,
        stdout: 'file1.ts\nfile2.ts\n',
        stderr: 'Code style issues found'
      });

      const result = await qualityGates.runFormat();

      expect(result.status).toBe('failed');
      expect(result.message).toBe('Some files need formatting');
      expect(result.files_checked).toBe(2);
    });

    it('should skip when prettier not installed', async () => {
      ProcessUtils.commandExists = jest.fn().mockResolvedValue(false);

      const result = await qualityGates.runFormat();

      expect(result.status).toBe('skipped');
      expect(result.message).toBe('Prettier not installed');
    });

    it('should handle prettier errors', async () => {
      ProcessUtils.commandExists = jest.fn().mockResolvedValue(true);
      ProcessUtils.exec = jest.fn().mockResolvedValue({
        exitCode: 1,
        stdout: '',
        stderr: 'Prettier error'
      });

      const result = await qualityGates.runFormat();

      expect(result.status).toBe('failed');
      expect(result.time_ms).toBeGreaterThan(0);
    });

    it('should use 30 second timeout', async () => {
      ProcessUtils.commandExists = jest.fn().mockResolvedValue(true);
      ProcessUtils.exec = jest.fn().mockResolvedValue({
        exitCode: 0,
        stdout: '',
        stderr: ''
      });

      await qualityGates.runFormat();

      expect(ProcessUtils.exec).toHaveBeenCalledWith(
        'prettier --check .',
        { cwd: '/test/project', timeout: 30000 }
      );
    });
  });

  describe('runLint', () => {
    it('should pass when eslint succeeds', async () => {
      ProcessUtils.commandExists = jest.fn().mockResolvedValue(true);
      ProcessUtils.exec = jest.fn().mockResolvedValue({
        exitCode: 0,
        stdout: 'No problems',
        stderr: ''
      });

      const result = await qualityGates.runLint();

      expect(result.status).toBe('passed');
      expect(result.message).toBe('No lint errors');
      expect(result.errors).toBe(0);
      expect(result.warnings).toBe(0);
    });

    it('should pass with warnings', async () => {
      ProcessUtils.commandExists = jest.fn().mockResolvedValue(true);
      ProcessUtils.exec = jest.fn().mockResolvedValue({
        exitCode: 0,
        stdout: '',
        stderr: '2 warnings'
      });

      const result = await qualityGates.runLint();

      // Need to check actual implementation - exitCode 0 should pass
      expect(result.status).toBe('passed');
    });

    it('should fail with errors', async () => {
      ProcessUtils.commandExists = jest.fn().mockResolvedValue(true);
      ProcessUtils.exec = jest.fn().mockResolvedValue({
        exitCode: 1,
        stdout: '3 errors, 2 warnings',
        stderr: 'Linting failed'
      });

      const result = await qualityGates.runLint();

      expect(result.status).toBe('failed');
      expect(result.errors).toBe(3);
      expect(result.warnings).toBe(2);
    });

    it('should skip when eslint not installed', async () => {
      ProcessUtils.commandExists = jest.fn().mockResolvedValue(false);

      const result = await qualityGates.runLint();

      expect(result.status).toBe('skipped');
      expect(result.message).toBe('ESLint not installed');
    });

    it('should use 60 second timeout', async () => {
      ProcessUtils.commandExists = jest.fn().mockResolvedValue(true);
      ProcessUtils.exec = jest.fn().mockResolvedValue({
        exitCode: 0,
        stdout: '',
        stderr: ''
      });

      await qualityGates.runLint();

      expect(ProcessUtils.exec).toHaveBeenCalledWith(
        'eslint . --ext .ts,.js',
        { cwd: '/test/project', timeout: 60000 }
      );
    });

    it('should parse error counts from output', async () => {
      ProcessUtils.commandExists = jest.fn().mockResolvedValue(true);
      ProcessUtils.exec = jest.fn().mockResolvedValue({
        exitCode: 1,
        stdout: 'error error error warning warning',
        stderr: ''
      });

      const result = await qualityGates.runLint();

      expect(result.errors).toBe(3);
      expect(result.warnings).toBe(2);
    });
  });

  describe('runTypeCheck', () => {
    it('should pass when tsc succeeds', async () => {
      ProcessUtils.commandExists = jest.fn().mockResolvedValue(true);
      ProcessUtils.exec = jest.fn().mockResolvedValue({
        exitCode: 0,
        stdout: '',
        stderr: ''
      });

      const result = await qualityGates.runTypeCheck();

      expect(result.status).toBe('passed');
      expect(result.message).toBe('No type errors');
    });

    it('should fail with type errors', async () => {
      ProcessUtils.commandExists = jest.fn().mockResolvedValue(true);
      ProcessUtils.exec = jest.fn().mockResolvedValue({
        exitCode: 1,
        stdout: 'error TS1234: Type error\nerror TS5678: Another error',
        stderr: ''
      });

      const result = await qualityGates.runTypeCheck();

      expect(result.status).toBe('failed');
      expect(result.message).toBe('2 type errors');
      expect(result.errors).toBe(2);
    });

    it('should skip when tsc not installed', async () => {
      ProcessUtils.commandExists = jest.fn().mockResolvedValue(false);

      const result = await qualityGates.runTypeCheck();

      expect(result.status).toBe('skipped');
      expect(result.message).toBe('TypeScript not installed');
    });

    it('should use 60 second timeout', async () => {
      ProcessUtils.commandExists = jest.fn().mockResolvedValue(true);
      ProcessUtils.exec = jest.fn().mockResolvedValue({
        exitCode: 0,
        stdout: '',
        stderr: ''
      });

      await qualityGates.runTypeCheck();

      expect(ProcessUtils.exec).toHaveBeenCalledWith(
        'tsc --noEmit',
        { cwd: '/test/project', timeout: 60000 }
      );
    });

    it('should parse error count from output', async () => {
      ProcessUtils.commandExists = jest.fn().mockResolvedValue(true);
      ProcessUtils.exec = jest.fn().mockResolvedValue({
        exitCode: 1,
        stdout: 'error TS1111: error1\nerror TS2222: error2\nerror TS3333: error3',
        stderr: ''
      });

      const result = await qualityGates.runTypeCheck();

      expect(result.errors).toBe(3);
    });
  });

  describe('runAll', () => {
    it('should run all quality gates in parallel', async () => {
      ProcessUtils.commandExists = jest.fn().mockResolvedValue(true);
      ProcessUtils.exec = jest.fn().mockResolvedValue({
        exitCode: 0,
        stdout: '',
        stderr: ''
      });

      const result = await qualityGates.runAll();

      expect(result.format).toBeDefined();
      expect(result.lint).toBeDefined();
      expect(result.type_check).toBeDefined();
      expect(result.overall_passed).toBe(true);
    });

    it('should fail overall if any gate fails', async () => {
      ProcessUtils.commandExists = jest.fn().mockResolvedValue(true);
      ProcessUtils.exec = jest.fn()
        .mockResolvedValueOnce({ exitCode: 0, stdout: '', stderr: '' }) // format
        .mockResolvedValueOnce({ exitCode: 1, stdout: 'error', stderr: '' }) // lint
        .mockResolvedValueOnce({ exitCode: 0, stdout: '', stderr: '' }); // type-check

      const result = await qualityGates.runAll();

      expect(result.overall_passed).toBe(false);
    });

    it('should pass overall if all gates pass', async () => {
      ProcessUtils.commandExists = jest.fn().mockResolvedValue(true);
      ProcessUtils.exec = jest.fn().mockResolvedValue({
        exitCode: 0,
        stdout: '',
        stderr: ''
      });

      const result = await qualityGates.runAll();

      expect(result.overall_passed).toBe(true);
    });

    it('should handle skipped gates', async () => {
      ProcessUtils.commandExists = jest.fn()
        .mockResolvedValueOnce(true) // prettier
        .mockResolvedValueOnce(false) // eslint
        .mockResolvedValueOnce(true); // tsc

      ProcessUtils.exec = jest.fn().mockResolvedValue({
        exitCode: 0,
        stdout: '',
        stderr: ''
      });

      const result = await qualityGates.runAll();

      expect(result.lint.status).toBe('skipped');
      // Overall should still pass if no failures
      expect(result.overall_passed).toBe(true);
    });

    it('should run all gates in parallel', async () => {
      ProcessUtils.commandExists = jest.fn().mockResolvedValue(true);

      let callCount = 0;
      ProcessUtils.exec = jest.fn().mockImplementation(() => {
        callCount++;
        return Promise.resolve({ exitCode: 0, stdout: '', stderr: '' });
      });

      await qualityGates.runAll();

      expect(ProcessUtils.exec).toHaveBeenCalledTimes(3);
    });
  });

  describe('formatResults', () => {
    it('should format results with passed status', () => {
      const results: QualityResults = {
        format: { status: 'passed', message: 'OK', time_ms: 100 },
        lint: { status: 'passed', message: 'OK', time_ms: 200 },
        type_check: { status: 'passed', message: 'OK', time_ms: 300 },
        overall_passed: true
      };

      const formatted = qualityGates.formatResults(results);

      expect(formatted).toContain('✅');
      expect(formatted).toContain('✅ PASSED');
      expect(formatted).toContain('OK');
    });

    it('should format results with warning status', () => {
      const results: QualityResults = {
        format: { status: 'passed', message: 'OK', time_ms: 100 },
        lint: { status: 'warning', message: '2 warnings', warnings: 2, time_ms: 200 },
        type_check: { status: 'passed', message: 'OK', time_ms: 300 },
        overall_passed: true
      };

      const formatted = qualityGates.formatResults(results);

      expect(formatted).toContain('⚠️');
    });

    it('should format results with failed status', () => {
      const results: QualityResults = {
        format: { status: 'failed', message: 'Errors found', time_ms: 100 },
        lint: { status: 'passed', message: 'OK', time_ms: 200 },
        type_check: { status: 'passed', message: 'OK', time_ms: 300 },
        overall_passed: false
      };

      const formatted = qualityGates.formatResults(results);

      expect(formatted).toContain('❌');
      expect(formatted).toContain('❌ FAILED');
    });

    it('should format results with skipped status', () => {
      const results: QualityResults = {
        format: { status: 'skipped', message: 'Not installed', time_ms: 0 },
        lint: { status: 'passed', message: 'OK', time_ms: 200 },
        type_check: { status: 'passed', message: 'OK', time_ms: 300 },
        overall_passed: true
      };

      const formatted = qualityGates.formatResults(results);

      expect(formatted).toContain('⏭️');
    });
  });

  describe('Error handling', () => {
    it('should handle format gate errors gracefully', async () => {
      ProcessUtils.commandExists = jest.fn().mockResolvedValue(true);
      ProcessUtils.exec = jest.fn().mockRejectedValue(new Error('Command failed'));

      const result = await qualityGates.runFormat();

      expect(result.status).toBe('failed');
      expect(result.time_ms).toBeGreaterThan(0);
    });

    it('should handle lint gate errors gracefully', async () => {
      ProcessUtils.commandExists = jest.fn().mockResolvedValue(true);
      ProcessUtils.exec = jest.fn().mockRejectedValue(new Error('ESLint error'));

      const result = await qualityGates.runLint();

      expect(result.status).toBe('failed');
      expect(result.time_ms).toBeGreaterThan(0);
    });

    it('should handle type-check gate errors gracefully', async () => {
      ProcessUtils.commandExists = jest.fn().mockResolvedValue(true);
      ProcessUtils.exec = jest.fn().mockRejectedValue(new Error('TSC error'));

      const result = await qualityGates.runTypeCheck();

      expect(result.status).toBe('failed');
      expect(result.time_ms).toBeGreaterThan(0);
    });

    it('should continue with other gates if one fails', async () => {
      ProcessUtils.commandExists = jest.fn().mockResolvedValue(true);
      ProcessUtils.exec = jest.fn()
        .mockRejectedValueOnce(new Error('Format failed'))
        .mockResolvedValueOnce({ exitCode: 0, stdout: '', stderr: '' })
        .mockResolvedValueOnce({ exitCode: 0, stdout: '', stderr: '' });

      const result = await qualityGates.runAll();

      expect(result.format.status).toBe('failed');
      expect(result.lint.status).toBe('passed');
      expect(result.type_check.status).toBe('passed');
      expect(result.overall_passed).toBe(false);
    });
  });

  describe('Cross-platform compatibility', () => {
    it('should work with different project roots', async () => {
      ProcessUtils.commandExists = jest.fn().mockResolvedValue(true);
      ProcessUtils.exec = jest.fn().mockResolvedValue({
        exitCode: 0,
        stdout: '',
        stderr: ''
      });

      const windowsGates = new QualityGates('C:\\Projects\\test');
      const unixGates = new QualityGates('/home/user/test');

      await windowsGates.runFormat();
      await unixGates.runFormat();

      expect(ProcessUtils.exec).toHaveBeenNthCalledWith(1,
        'prettier --check .',
        { cwd: 'C:\\Projects\\test', timeout: 30000 }
      );
      expect(ProcessUtils.exec).toHaveBeenNthCalledWith(2,
        'prettier --check .',
        { cwd: '/home/user/test', timeout: 30000 }
      );
    });
  });

  describe('Performance', () => {
    it('should measure time for each gate', async () => {
      ProcessUtils.commandExists = jest.fn().mockResolvedValue(true);
      ProcessUtils.exec = jest.fn().mockImplementation(async () => {
        await new Promise(resolve => setTimeout(resolve, 10));
        return { exitCode: 0, stdout: '', stderr: '' };
      });

      const result = await qualityGates.runFormat();

      expect(result.time_ms).toBeGreaterThanOrEqual(10);
    });
  });

  describe('Edge cases', () => {
    it('should handle empty stdout', async () => {
      ProcessUtils.commandExists = jest.fn().mockResolvedValue(true);
      ProcessUtils.exec = jest.fn().mockResolvedValue({
        exitCode: 0,
        stdout: '',
        stderr: ''
      });

      const result = await qualityGates.runLint();

      expect(result.status).toBe('passed');
    });

    it('should handle malformed output', async () => {
      ProcessUtils.commandExists = jest.fn().mockResolvedValue(true);
      ProcessUtils.exec = jest.fn().mockResolvedValue({
        exitCode: 1,
        stdout: 'unexpected output format',
        stderr: ''
      });

      const result = await qualityGates.runLint();

      expect(result.errors).toBe(0);
      expect(result.warnings).toBe(0);
    });

    it('should handle very long output', async () => {
      ProcessUtils.commandExists = jest.fn().mockResolvedValue(true);
      const longOutput = 'error '.repeat(10000);
      ProcessUtils.exec = jest.fn().mockResolvedValue({
        exitCode: 1,
        stdout: longOutput,
        stderr: ''
      });

      const result = await qualityGates.runLint();

      expect(result.errors).toBe(10000);
    });
  });
});
