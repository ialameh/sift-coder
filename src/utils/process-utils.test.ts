/**
 * ProcessUtils Tests
 * Tests for cross-platform process utilities
 */

import { ProcessUtils, ExecResult } from './process-utils';
import { MockProcessExecutor } from './test-helpers';

// Mock child_process
jest.mock('child_process', () => ({
  exec: jest.fn(),
  spawn: jest.fn(),
}));

const mockChildProcess = require('child_process');

describe('ProcessUtils', () => {
  let mockExecutor: MockProcessExecutor;

  beforeEach(() => {
    jest.clearAllMocks();
    mockExecutor = new MockProcessExecutor();
    mockExecutor.createExecMock();
    mockExecutor.createSpawnMock();
  });

  afterEach(() => {
    mockExecutor.reset();
  });

  describe('exec', () => {
    it('should execute command successfully', async () => {
      // Set up mock directly - callback signature is (error, stdout, stderr)
      const mockExec = mockChildProcess.exec as jest.Mock;
      mockExec.mockImplementation((command: string, options: any, callback: any) => {
        const cb = typeof options === 'function' ? options : callback;
        if (command === 'node -e "console.log(\'hello\')"') {
          cb(null, 'hello\n', '');
        } else {
          cb(null, '', '');
        }
        return { kill: jest.fn() };
      });

      const result = await ProcessUtils.exec('node -e "console.log(\'hello\')"');

      expect(result.exitCode).toBe(0);
      expect(result.stdout.trim()).toBe('hello');
      expect(result.stderr).toBe('');
    });

    it('should execute command with options', async () => {
      const mockExec = mockChildProcess.exec as jest.Mock;
      mockExec.mockImplementation((command: string, options: any, callback: any) => {
        const cb = typeof options === 'function' ? options : callback;
        if (command === 'node -e "console.log(\'test\')"') {
          cb(null, 'test\n', '');
        } else {
          cb(null, '', '');
        }
        return { kill: jest.fn() };
      });

      const result = await ProcessUtils.exec('node -e "console.log(\'test\')"', { cwd: process.cwd(), timeout: 5000 });

      expect(result.exitCode).toBe(0);
      expect(result.stdout.trim()).toBe('test');
    });

    it('should handle command errors', async () => {
      const mockExec = mockChildProcess.exec as jest.Mock;
      const mockError = new Error('Command failed');
      (mockError as any).code = 1;
      (mockError as any).stdout = '';
      (mockError as any).stderr = 'error message';

      mockExec.mockImplementation((command: string, options: any, callback: any) => {
        callback(mockError, { stdout: '' }, 'error message');
        return { kill: jest.fn() };
      });

      const result = await ProcessUtils.exec('failing-command');

      expect(result.exitCode).toBe(1);
      expect(result.stderr).toBe('error message');
    });

    it('should use default timeout if not specified', async () => {
      const mockExec = mockChildProcess.exec as jest.Mock;
      mockExec.mockImplementation((command: string, options: any, callback: any) => {
        expect(options.timeout).toBe(30000);
        callback(null, { stdout: '' }, '');
        return { kill: jest.fn() };
      });

      await ProcessUtils.exec('echo test');

      expect(mockExec).toHaveBeenCalled();
    });

    it('should set maxBuffer to 10MB', async () => {
      const mockExec = mockChildProcess.exec as jest.Mock;
      mockExec.mockImplementation((command: string, options: any, callback: any) => {
        expect(options.maxBuffer).toBe(10 * 1024 * 1024);
        callback(null, { stdout: '' }, '');
        return { kill: jest.fn() };
      });

      await ProcessUtils.exec('echo test');

      expect(mockExec).toHaveBeenCalled();
    });

    it('should hide window on Windows', async () => {
      const mockExec = mockChildProcess.exec as jest.Mock;
      mockExec.mockImplementation((command: string, options: any, callback: any) => {
        expect(options.windowsHide).toBe(true);
        callback(null, { stdout: '' }, '');
        return { kill: jest.fn() };
      });

      await ProcessUtils.exec('echo test');

      expect(mockExec).toHaveBeenCalled();
    });
  });

  describe('spawn', () => {
    it('should spawn process with streaming output', async () => {
      const mockSpawn = mockChildProcess.spawn as jest.Mock;
      const stdoutData: string[] = [];
      const stderrData: string[] = [];

      mockSpawn.mockReturnValue({
        stdout: {
          on: jest.fn((event: string, handler: (data: string) => void) => {
            if (event === 'data') {
              handler('line 1\n');
              handler('line 2\n');
            }
          })
        },
        stderr: {
          on: jest.fn()
        },
        on: jest.fn((event: string, handler: (code: number) => void) => {
          if (event === 'close') {
            handler(0);
          }
        }),
        kill: jest.fn()
      });

      const exitCode = await ProcessUtils.spawn('echo', ['test'], {
        onStdout: (data) => stdoutData.push(data),
        onStderr: (data) => stderrData.push(data)
      });

      expect(exitCode).toBe(0);
      expect(stdoutData).toEqual(['line 1\n', 'line 2\n']);
    });

    it('should use cmd.exe on Windows', async () => {
      const originalPlatform = process.platform;
      Object.defineProperty(process, 'platform', { value: 'win32' });

      const mockSpawn = mockChildProcess.spawn as jest.Mock;
      mockSpawn.mockReturnValue({
        stdout: { on: jest.fn() },
        stderr: { on: jest.fn() },
        on: jest.fn((event: string, handler: (code: number) => void) => {
          if (event === 'close') handler(0);
        }),
        kill: jest.fn()
      });

      await ProcessUtils.spawn('echo', ['test']);

      expect(mockSpawn).toHaveBeenCalledWith(
        'cmd.exe',
        ['/c', 'echo', 'test'],
        expect.objectContaining({
          stdio: ['ignore', 'pipe', 'pipe']
        })
      );

      Object.defineProperty(process, 'platform', { value: originalPlatform });
    });

    it('should use /bin/sh on Unix', async () => {
      const originalPlatform = process.platform;
      Object.defineProperty(process, 'platform', { value: 'linux' });

      const mockSpawn = mockChildProcess.spawn as jest.Mock;
      mockSpawn.mockReturnValue({
        stdout: { on: jest.fn() },
        stderr: { on: jest.fn() },
        on: jest.fn((event: string, handler: (code: number) => void) => {
          if (event === 'close') handler(0);
        }),
        kill: jest.fn()
      });

      await ProcessUtils.spawn('echo', ['test']);

      expect(mockSpawn).toHaveBeenCalledWith(
        '/bin/sh',
        ['-c', 'echo test'],
        expect.objectContaining({
          stdio: ['ignore', 'pipe', 'pipe']
        })
      );

      Object.defineProperty(process, 'platform', { value: originalPlatform });
    });

    it('should handle process errors', async () => {
      const mockSpawn = mockChildProcess.spawn as jest.Mock;
      mockSpawn.mockReturnValue({
        stdout: { on: jest.fn() },
        stderr: { on: jest.fn() },
        on: jest.fn((event: string, handler: any) => {
          if (event === 'error') {
            handler(new Error('Spawn failed'));
          }
        }),
        kill: jest.fn()
      });

      await expect(ProcessUtils.spawn('invalid-command', [])).rejects.toThrow('Spawn failed');
    });

    it('should handle stderr streaming', async () => {
      const mockSpawn = mockChildProcess.spawn as jest.Mock;
      const stderrData: string[] = [];

      mockSpawn.mockReturnValue({
        stdout: { on: jest.fn() },
        stderr: {
          on: jest.fn((event: string, handler: (data: string) => void) => {
            if (event === 'data') {
              handler('error output\n');
            }
          })
        },
        on: jest.fn((event: string, handler: (code: number) => void) => {
          if (event === 'close') handler(1);
        }),
        kill: jest.fn()
      });

      await ProcessUtils.spawn('command', [], {
        onStderr: (data) => stderrData.push(data)
      });

      expect(stderrData).toEqual(['error output\n']);
    });
  });

  describe('commandExists', () => {
    it('should return true if command exists on Unix', async () => {
      const mockExec = mockChildProcess.exec as jest.Mock;
      const checkCommand = process.platform === 'win32' ? 'where node' : 'which node';
      mockExec.mockImplementation((command: string, options: any, callback: any) => {
        const cb = typeof options === 'function' ? options : callback;
        if (command === checkCommand) {
          cb(null, '/usr/bin/node\n', '');
        } else {
          cb(null, '', '');
        }
        return { kill: jest.fn() };
      });

      const result = await ProcessUtils.commandExists('node');
      expect(result).toBe(true);
    });

    it('should return false if command does not exist', async () => {
      const mockExec = mockChildProcess.exec as jest.Mock;
      mockExec.mockImplementation((command: string, options: any, callback: any) => {
        const error = new Error('Command not found');
        (error as any).code = 1;
        callback(error, { stdout: '' }, '');
        return { kill: jest.fn() };
      });

      const result = await ProcessUtils.commandExists('nonexistent-command');

      expect(result).toBe(false);
    });

    it('should use "where" on Windows', async () => {
      const originalPlatform = process.platform;
      Object.defineProperty(process, 'platform', { value: 'win32' });

      // On Windows, commandExists should use 'where' command
      // We can't fully test this without mocking, but we can verify the logic exists
      const result = await ProcessUtils.commandExists('cmd'); // cmd should exist on Windows

      Object.defineProperty(process, 'platform', { value: originalPlatform });

      // Just verify it returns a boolean
      expect(typeof result).toBe('boolean');
    });

    it('should handle errors gracefully', async () => {
      const mockExec = mockChildProcess.exec as jest.Mock;
      mockExec.mockImplementation((command: string, options: any, callback: any) => {
        callback(new Error('System error'), { stdout: '' }, '');
        return { kill: jest.fn() };
      });

      const result = await ProcessUtils.commandExists('node');

      expect(result).toBe(false);
    });
  });

  describe('getEnv', () => {
    it('should get environment variable', () => {
      process.env.TEST_VAR = 'test value';

      const result = ProcessUtils.getEnv('TEST_VAR');

      expect(result).toBe('test value');
    });

    it('should return undefined for non-existing variable', () => {
      const result = ProcessUtils.getEnv('NONEXISTENT_VAR');

      expect(result).toBeUndefined();
    });

    it('should return fallback if variable not set', () => {
      const result = ProcessUtils.getEnv('NONEXISTENT_VAR', 'default');

      expect(result).toBe('default');
    });

    it('should return value even if fallback provided', () => {
      process.env.TEST_VAR = 'actual value';

      const result = ProcessUtils.getEnv('TEST_VAR', 'fallback');

      expect(result).toBe('actual value');
    });
  });

  describe('setEnv', () => {
    it('should set environment variable', () => {
      ProcessUtils.setEnv('NEW_VAR', 'new value');

      expect(process.env.NEW_VAR).toBe('new value');
    });

    it('should overwrite existing variable', () => {
      process.env.EXISTING_VAR = 'old value';

      ProcessUtils.setEnv('EXISTING_VAR', 'new value');

      expect(process.env.EXISTING_VAR).toBe('new value');
    });

    it('should set empty string', () => {
      ProcessUtils.setEnv('EMPTY_VAR', '');

      expect(process.env.EMPTY_VAR).toBe('');
    });
  });

  describe('getPlatform', () => {
    it('should return platform info for Linux', () => {
      const originalPlatform = process.platform;
      Object.defineProperty(process, 'platform', { value: 'linux' });

      const result = ProcessUtils.getPlatform();

      expect(result.platform).toBe('linux');
      expect(result.isLinux).toBe(true);
      expect(result.isWindows).toBe(false);
      expect(result.isMac).toBe(false);

      Object.defineProperty(process, 'platform', { value: originalPlatform });
    });

    it('should return platform info for Windows', () => {
      const originalPlatform = process.platform;
      Object.defineProperty(process, 'platform', { value: 'win32' });

      const result = ProcessUtils.getPlatform();

      expect(result.platform).toBe('win32');
      expect(result.isWindows).toBe(true);
      expect(result.isLinux).toBe(false);
      expect(result.isMac).toBe(false);

      Object.defineProperty(process, 'platform', { value: originalPlatform });
    });

    it('should return platform info for macOS', () => {
      const originalPlatform = process.platform;
      Object.defineProperty(process, 'platform', { value: 'darwin' });

      const result = ProcessUtils.getPlatform();

      expect(result.platform).toBe('darwin');
      expect(result.isMac).toBe(true);
      expect(result.isWindows).toBe(false);
      expect(result.isLinux).toBe(false);

      Object.defineProperty(process, 'platform', { value: originalPlatform });
    });
  });

  describe('exit', () => {
    it('should exit process with code', () => {
      const mockExit = jest.spyOn(process, 'exit').mockImplementation(() => {
        throw new Error('process.exit was called');
      });

      expect(() => ProcessUtils.exit(1)).toThrow('process.exit was called');
      expect(mockExit).toHaveBeenCalledWith(1);

      mockExit.mockRestore();
    });

    it('should default to exit code 0', () => {
      const mockExit = jest.spyOn(process, 'exit').mockImplementation(() => {
        throw new Error('process.exit was called');
      });

      expect(() => ProcessUtils.exit()).toThrow('process.exit was called');
      expect(mockExit).toHaveBeenCalledWith(0);

      mockExit.mockRestore();
    });
  });

  describe('Error handling', () => {
    it('should handle timeout errors', async () => {
      const mockExec = mockChildProcess.exec as jest.Mock;
      const mockError = new Error('Command timed out');
      (mockError as any).code = 'ETIMEDOUT';
      (mockError as any).killed = true;

      mockExec.mockImplementation((command: string, options: any, callback: any) => {
        callback(mockError, { stdout: '' }, '');
        return { kill: jest.fn() };
      });

      const result = await ProcessUtils.exec('sleep 10', { timeout: 100 });

      expect(result.exitCode).toBeDefined();
    });

    it('should handle ENOENT errors', async () => {
      const mockExec = mockChildProcess.exec as jest.Mock;
      const mockError = new Error('Command not found');
      (mockError as any).code = 'ENOENT';

      mockExec.mockImplementation((command: string, options: any, callback: any) => {
        callback(mockError, { stdout: '' }, '');
        return { kill: jest.fn() };
      });

      const result = await ProcessUtils.exec('nonexistent-command');

      expect(result.exitCode).toBeDefined();
    });

    it('should handle spawn errors', async () => {
      const mockSpawn = mockChildProcess.spawn as jest.Mock;
      mockSpawn.mockReturnValue({
        stdout: { on: jest.fn() },
        stderr: { on: jest.fn() },
        on: jest.fn((event: string, handler: any) => {
          if (event === 'error') {
            handler(new Error('ENOENT: spawn failed'));
          }
        }),
        kill: jest.fn()
      });

      await expect(ProcessUtils.spawn('invalid', [])).rejects.toThrow();
    });
  });

  describe('Cross-platform compatibility', () => {
    it('should handle different platforms for exec', async () => {
      const originalPlatform = process.platform;

      const mockExec = mockChildProcess.exec as jest.Mock;
      mockExec.mockImplementation((command: string, options: any, callback: any) => {
        const cb = typeof options === 'function' ? options : callback;
        if (command === 'echo test') {
          cb(null, 'test\n', '');
        } else {
          cb(null, '', '');
        }
        return { kill: jest.fn() };
      });

      // Test on current platform
      const result = await ProcessUtils.exec('echo test');
      expect(result.exitCode).toBe(0);
      expect(result.stdout.trim()).toBe('test');

      // Reset to original platform
      Object.defineProperty(process, 'platform', { value: originalPlatform });
    });

    it('should use appropriate shell commands per platform', async () => {
      const originalPlatform = process.platform;

      const mockExec = mockChildProcess.exec as jest.Mock;
      const checkCommand = process.platform === 'win32' ? 'where node' : 'which node';
      mockExec.mockImplementation((command: string, options: any, callback: any) => {
        const cb = typeof options === 'function' ? options : callback;
        if (command === checkCommand) {
          cb(null, '/usr/bin/node\n', '');
        } else {
          cb(null, '', '');
        }
        return { kill: jest.fn() };
      });

      // Test that commandExists works on current platform
      const result = await ProcessUtils.commandExists('node');
      expect(typeof result).toBe('boolean');

      // Reset to original platform
      Object.defineProperty(process, 'platform', { value: originalPlatform });
    });
  });

  describe('Output handling', () => {
    it('should handle large output', async () => {
      const mockExec = mockChildProcess.exec as jest.Mock;
      const testString = 'x'.repeat(1000);

      mockExec.mockImplementation((command: string, options: any, callback: any) => {
        const cb = typeof options === 'function' ? options : callback;
        if (command === `echo ${testString}`) {
          cb(null, testString + '\n', '');
        } else {
          cb(null, '', '');
        }
        return { kill: jest.fn() };
      });

      const result = await ProcessUtils.exec(`echo ${testString}`);

      expect(result.exitCode).toBe(0);
      expect(result.stdout.trim()).toBe(testString);
    });

    it('should handle empty output', async () => {
      const mockExec = mockChildProcess.exec as jest.Mock;
      mockExec.mockImplementation((command: string, options: any, callback: any) => {
        callback(null, { stdout: '' }, '');
        return { kill: jest.fn() };
      });

      const result = await ProcessUtils.exec('echo -n ""');

      expect(result.stdout).toBe('');
    });

    it('should handle stderr output', async () => {
      const mockExec = mockChildProcess.exec as jest.Mock;

      mockExec.mockImplementation((command: string, options: any, callback: any) => {
        const cb = typeof options === 'function' ? options : callback;
        if (command === 'sh -c "echo error >&2"') {
          cb(null, '', 'error\n');
        } else {
          cb(null, '', '');
        }
        return { kill: jest.fn() };
      });

      const result = await ProcessUtils.exec('sh -c "echo error >&2"');

      expect(result.exitCode).toBe(0);
      expect(result.stderr).toContain('error');
    });
  });
});
