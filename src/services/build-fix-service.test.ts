/**
 * Build Fix Service Tests
 * Tests for automated build error analysis and resolution
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';

// Mock dependencies FIRST
vi.mock('../utils/process-utils', () => {
  return {
    ProcessUtils: {
      exec: vi.fn().mockResolvedValue({ stdout: '', stderr: '', exitCode: 0 }),
      commandExists: vi.fn().mockResolvedValue(true),
      getPlatform: vi.fn().mockReturnValue({ platform: 'linux' as NodeJS.Platform, isWindows: false, isMac: false, isLinux: true }),
      setEnv: vi.fn().mockResolvedValue(undefined),
      getEnv: vi.fn().mockReturnValue(undefined),
      exit: vi.fn().mockReturnValue(undefined)
    }
  };
});

vi.mock('../utils/file-utils', () => {
  return {
    FileUtils: {
      readFile: vi.fn().mockResolvedValue('')
    }
  };
});

// Import modules
import { BuildFixService, BuildError, ErrorCategory } from './build-fix-service';
import { ProcessUtils } from '../utils/process-utils';
import { FileUtils } from '../utils/file-utils';

const mockedProcessUtils = ProcessUtils;
const mockedFileUtils = FileUtils;

describe('BuildFixService', () => {
  let service: BuildFixService;
  const mockProjectRoot = '/test/project';

  beforeEach(() => {
    vi.clearAllMocks();
    service = new BuildFixService(mockProjectRoot);
  });

  describe('Constructor', () => {
    it('should initialize with project root', () => {
      expect(service).toBeInstanceOf(BuildFixService);
    });

    it('should use cwd if project root not provided', () => {
      const cwdService = new BuildFixService();

      expect(cwdService).toBeInstanceOf(BuildFixService);
    });
  });

  describe('runBuild', () => {
    it('should run build successfully', async () => {
      mockedProcessUtils.exec.mockResolvedValue({
        stdout: 'Build success',
        stderr: '',
        exitCode: 0
      });

      const result = await service.runBuild('npm run build');

      expect(result.success).toBe(true);
      expect(result.exitCode).toBe(0);
      expect(result.errors).toEqual([]);
    });

    it('should run build and capture errors', async () => {
      mockedProcessUtils.exec.mockResolvedValue({
        stdout: 'src/file.ts(10,5): error TS2304: Cannot find name test',
        stderr: '',
        exitCode: 1
      });

      const result = await service.runBuild('npm run build');

      expect(result.success).toBe(false);
      expect(result.exitCode).toBe(1);
      expect(result.errors).toHaveLength(1);
      expect(result.errors[0].code).toBe(2304);
    });

    it('should detect build command from package.json', async () => {
      mockedProcessUtils.exec.mockResolvedValue({
        stdout: '',
        stderr: '',
        exitCode: 0
      });

      await service.runBuild();

      expect(mockedProcessUtils.exec).toHaveBeenCalledWith('npm run build', expect.any(Object));
    });
  });

  describe('analyzeBuildError', () => {
    it('should parse TypeScript errors', async () => {
      const output = `
        src/file.ts(10,5): error TS2304: Cannot find name 'test'
        src/other.ts(20,10): error TS2339: Property 'x' does not exist
      `;

      const errors = await service.analyzeBuildError(output);

      expect(errors).toHaveLength(2);
      expect(errors[0].file).toBe('src/file.ts');
      expect(errors[0].line).toBe(10);
      expect(errors[0].column).toBe(5);
      expect(errors[0].code).toBe(2304);
      expect(errors[0].category).toBe('type');
    });

    it('should parse ESLint errors', async () => {
      const output = `
        src/file.ts:10:5: error Unexpected console.log
        src/other.ts:20:10: error Missing semicolon
      `;

      const errors = await service.analyzeBuildError(output);

      expect(errors).toHaveLength(2);
      expect(errors[0].file).toBe('src/file.ts');
      expect(errors[0].line).toBe(10);
      expect(errors[0].category).toBe('syntax');
    });

    it('should handle empty output', async () => {
      const errors = await service.analyzeBuildError('');

      expect(errors).toEqual([]);
    });

    it('should handle malformed output', async () => {
      const errors = await service.analyzeBuildError('Random output without errors');

      expect(errors).toEqual([]);
    });
  });

  describe('categorizeError', () => {
    it('should categorize type errors', () => {
      const typeErrorCodes = [2304, 2339, 2345, 2362, 2367, 2322, 2344, 2352, 2355, 2365];

      typeErrorCodes.forEach(code => {
        const category = (service as any).categorizeError(code);
        expect(category).toBe('type');
      });
    });

    it('should categorize syntax errors', () => {
      const syntaxErrorCodes = [1002, 1003, 1005, 1009, 1038, 1086, 1089, 1092, 1109, 1123];

      syntaxErrorCodes.forEach(code => {
        const category = (service as any).categorizeError(code);
        expect(category).toBe('syntax');
      });
    });

    it('should categorize import errors', () => {
      const importErrorCodes = [2307, 2305, 2306, 2351];

      importErrorCodes.forEach(code => {
        const category = (service as any).categorizeError(code);
        expect(category).toBe('import');
      });
    });

    it('should categorize config errors', () => {
      const configErrorCodes = [5023, 5024, 6053, 6054];

      configErrorCodes.forEach(code => {
        const category = (service as any).categorizeError(code);
        expect(category).toBe('config');
      });
    });

    it('should categorize unknown errors', () => {
      const category = (service as any).categorizeError(9999);
      expect(category).toBe('unknown');
    });
  });

  describe('suggestFix', () => {
    it('should suggest fix for TS2304', () => {
      const error: BuildError = {
        file: 'src/test.ts',
        line: 10,
        column: 5,
        code: 2304,
        message: "Cannot find name 'test'",
        category: 'type'
      };

      const fix = service.suggestFix(error);

      expect(fix.suggestion).toContain('import');
      expect(fix.priority).toBe('medium');
    });

    it('should suggest fix for TS2532', () => {
      const error: BuildError = {
        file: 'src/test.ts',
        line: 10,
        column: 5,
        code: 2532,
        message: 'Object is possibly undefined',
        category: 'type'
      };

      const fix = service.suggestFix(error);

      expect(fix.suggestion).toContain('optional chaining');
      expect(fix.code_fix).toContain('?.');
    });

    it('should suggest fix for TS2307', () => {
      const error: BuildError = {
        file: 'src/test.ts',
        line: 10,
        column: 5,
        code: 2307,
        message: 'Cannot find module',
        category: 'import'
      };

      const fix = service.suggestFix(error);

      expect(fix.suggestion).toContain('Install');
    });

    it('should return high priority for syntax errors', () => {
      const error: BuildError = {
        file: 'src/test.ts',
        line: 10,
        column: 5,
        code: 1005,
        message: "'}' expected",
        category: 'syntax'
      };

      const fix = service.suggestFix(error);

      expect(fix.priority).toBe('high');
    });

    it('should return medium priority for type errors', () => {
      const error: BuildError = {
        file: 'src/test.ts',
        line: 10,
        column: 5,
        code: 2304,
        message: 'Cannot find name',
        category: 'type'
      };

      const fix = service.suggestFix(error);

      expect(fix.priority).toBe('medium');
    });

    it('should return low priority for unknown errors', () => {
      const error: BuildError = {
        file: 'src/test.ts',
        line: 10,
        column: 5,
        code: 9999,
        message: 'Unknown error',
        category: 'unknown'
      };

      const fix = service.suggestFix(error);

      expect(fix.priority).toBe('low');
    });
  });

  describe('displayResults', () => {
    it('should display success message', () => {
      const consoleSpy = vi.spyOn(console, 'log').mockImplementation();
      const result = {
        success: true,
        exitCode: 0,
        output: 'Build success',
        errors: [],
        fixes: []
      };

      service.displayResults(result);

      expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('successful'));
      consoleSpy.mockRestore();
    });

    it('should display errors grouped by priority', () => {
      const consoleSpy = vi.spyOn(console, 'log').mockImplementation();
      const result = {
        success: false,
        exitCode: 1,
        output: 'Build failed',
        errors: [
          {
            file: 'src/test1.ts',
            line: 10,
            column: 5,
            code: 1005,
            message: "'}' expected",
            category: 'syntax'
          },
          {
            file: 'src/test2.ts',
            line: 20,
            column: 10,
            code: 2304,
            message: 'Cannot find name',
            category: 'type'
          }
        ],
        fixes: []
      };

      service.displayResults(result);

      expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('HIGH PRIORITY'));
      expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('MEDIUM PRIORITY'));
      consoleSpy.mockRestore();
    });
  });

  describe('analyzeOutput', () => {
    it('should analyze output without running build', async () => {
      const output = 'src/file.ts(10,5): error TS2304: Cannot find name';
      const consoleSpy = vi.spyOn(console, 'log').mockImplementation();

      await service.analyzeOutput(output);

      expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('Found 1 errors'));
      consoleSpy.mockRestore();
    });

    it('should handle empty output', async () => {
      const consoleSpy = vi.spyOn(console, 'log').mockImplementation();

      await service.analyzeOutput('');

      expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('Found 0 errors'));
      consoleSpy.mockRestore();
    });
  });

  describe('Edge cases', () => {
    it('should handle build timeout', async () => {
      mockedProcessUtils.exec.mockRejectedValue(new Error('Timeout'));

      const result = await service.runBuild('npm run build');

      expect(result.success).toBe(false);
      expect(result.errors).toEqual([]);
    });

    it('should handle multiple errors in same file', async () => {
      const output = `
        src/file.ts(10,5): error TS2304: Cannot find name 'test'
        src/file.ts(20,10): error TS2339: Property 'x' does not exist
      `;

      const errors = await service.analyzeBuildError(output);

      expect(errors).toHaveLength(2);
      expect(errors[0].file).toBe('src/file.ts');
      expect(errors[1].file).toBe('src/file.ts');
    });

    it('should handle Windows paths', async () => {
      const output = `src\\file.ts(10,5): error TS2304: Cannot find name 'test'`;

      const errors = await service.analyzeBuildError(output);

      expect(errors).toHaveLength(1);
      expect(errors[0].file).toContain('file.ts');
    });

    it('should handle very long error messages', async () => {
      const longMessage = 'a'.repeat(1000);
      const error: BuildError = {
        file: 'src/test.ts',
        line: 10,
        column: 5,
        code: 2304,
        message: longMessage,
        category: 'type'
      };

      const fix = service.suggestFix(error);

      expect(fix.suggestion).toBeTruthy();
    });

    it('should handle error code 0', async () => {
      const error: BuildError = {
        file: 'src/test.ts',
        line: 10,
        column: 5,
        code: 0,
        message: 'ESLint error',
        category: 'syntax'
      };

      const fix = service.suggestFix(error);

      expect(fix.suggestion).toBeTruthy();
    });
  });

  describe('Cross-platform compatibility', () => {
    it('should handle Windows project root', () => {
      const windowsService = new BuildFixService('C:\\\\test\\\\project');

      expect(windowsService).toBeInstanceOf(BuildFixService);
    });

    it('should handle Unix project root', () => {
      const unixService = new BuildFixService('/home/user/project');

      expect(unixService).toBeInstanceOf(BuildFixService);
    });
  });
});
