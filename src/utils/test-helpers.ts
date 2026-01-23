/**
 * Test Helpers
 * Common utilities and factories for SiftCoder plugin tests
 */

import { Mock } from 'jest-mock';

/**
 * Mock file system helpers
 */
export class MockFileSystem {
  private files: Map<string, string> = new Map();
  private directories: Set<string> = new Set();

  /**
   * Create a mock file system state
   */
  constructor(initialState?: { files?: Record<string, string>; directories?: string[] }) {
    if (initialState?.files) {
      Object.entries(initialState.files).forEach(([path, content]) => {
        this.files.set(path, content);
      });
    }
    if (initialState?.directories) {
      initialState.directories.forEach(dir => this.directories.add(dir));
    }
  }

  /**
   * Add a file to the mock filesystem
   */
  addFile(path: string, content: string): void {
    this.files.set(path, content);
  }

  /**
   * Add a directory to the mock filesystem
   */
  addDirectory(path: string): void {
    this.directories.add(path);
  }

  /**
   * Get file content
   */
  getFile(path: string): string | undefined {
    return this.files.get(path);
  }

  /**
   * Check if file exists
   */
  hasFile(path: string): boolean {
    return this.files.has(path);
  }

  /**
   * Check if directory exists
   */
  hasDirectory(path: string): boolean {
    return this.directories.has(path);
  }

  /**
   * Create fs.promises mock behavior
   */
  createFsPromisesMock() {
    const fs = require('fs/promises');

    // Mock readFile
    (fs.readFile as any).mockImplementation((path: string) => {
      const content = this.files.get(path);
      if (content === undefined) {
        throw new Error(`File not found: ${path}`);
      }
      return content;
    });

    // Mock writeFile
    (fs.writeFile as any).mockImplementation((path: string, content: string) => {
      this.files.set(path, content);
      return Promise.resolve();
    });

    // Mock access (for exists checks)
    (fs.access as any).mockImplementation((path: string) => {
      if (this.files.has(path) || this.directories.has(path)) {
        return Promise.resolve();
      }
      return Promise.reject(new Error(`Path not found: ${path}`));
    });

    // Mock mkdir
    (fs.mkdir as any).mockImplementation((_path: string, _options: any) => {
      return Promise.resolve();
    });

    // Mock readdir
    (fs.readdir as any).mockImplementation((path: string, options?: any) => {
      const entries: Array<{ name: string; isFile: () => boolean }> = [];

      // Find files and directories in this path
      for (const [filePath] of this.files) {
        if (filePath.startsWith(path) && filePath !== path) {
          const relativePath = filePath.slice(path.length + 1);
          const firstSegment = relativePath.split('/')[0];

          if (!relativePath.includes('/')) {
            // It's a direct file
            const dirent = {
              name: firstSegment,
              isFile: () => true,
              isDirectory: () => false
            };
            entries.push(dirent);
          }
        }
      }

      return Promise.resolve(options?.withFileTypes ? entries : entries.map(e => e.name));
    });

    // Mock stat
    (fs.stat as any).mockImplementation((path: string) => {
      if (this.files.has(path)) {
        return Promise.resolve({
          isFile: () => true,
          isDirectory: () => false,
          size: this.files.get(path)!.length
        });
      }
      if (this.directories.has(path)) {
        return Promise.resolve({
          isFile: () => false,
          isDirectory: () => true
        });
      }
      return Promise.reject(new Error(`Path not found: ${path}`));
    });

    // Mock unlink
    (fs.unlink as any).mockImplementation((path: string) => {
      this.files.delete(path);
      return Promise.resolve();
    });

    // Mock copyFile
    (fs.copyFile as any).mockImplementation((src: string, dest: string) => {
      const content = this.files.get(src);
      if (content === undefined) {
        throw new Error(`Source file not found: ${src}`);
      }
      this.files.set(dest, content);
      return Promise.resolve();
    });

    // Mock rename
    (fs.rename as any).mockImplementation((src: string, dest: string) => {
      const content = this.files.get(src);
      if (content === undefined) {
        throw new Error(`Source file not found: ${src}`);
      }
      this.files.set(dest, content);
      this.files.delete(src);
      return Promise.resolve();
    });

    // Mock appendFile
    (fs.appendFile as any).mockImplementation((path: string, content: string) => {
      const existing = this.files.get(path) || '';
      this.files.set(path, existing + content);
      return Promise.resolve();
    });

    return fs;
  }

  /**
   * Reset all mocks
   */
  reset(): void {
    this.files.clear();
    this.directories.clear();
  }
}

/**
 * Test data factories
 */
export class TestDataFactory {
  /**
   * Create mock feature data
   */
  static createFeature(overrides?: Partial<any>): any {
    return {
      id: 'feat-123456',
      name: 'Test Feature',
      description: 'A test feature',
      status: 'pending',
      created_at: '2024-01-01T00:00:00.000Z',
      updated_at: '2024-01-01T00:00:00.000Z',
      subtasks: [],
      ...overrides
    };
  }

  /**
   * Create mock boundaries data
   */
  static createBoundaries(overrides?: Partial<any>): any {
    return {
      modifiable: ['src/**/*'],
      protected: ['node_modules/**', 'dist/**'],
      blast_radius_verified: true,
      last_check: '2024-01-01T00:00:00.000Z',
      ...overrides
    };
  }

  /**
   * Create mock current task data
   */
  static createCurrentTask(overrides?: Partial<any>): any {
    return {
      feature: 'feat-123456',
      subtask: 'subtask-1',
      workflow_phase: 'PLANNING',
      iteration: 1,
      agent: 'planner',
      started_at: '2024-01-01T00:00:00.000Z',
      updated_at: '2024-01-01T00:00:00.000Z',
      ...overrides
    };
  }

  /**
   * Create mock pattern data
   */
  static createPattern(overrides?: Partial<any>): any {
    return {
      id: 'pattern-1',
      title: 'Test Pattern',
      source: 'test',
      usage: 'Test usage',
      example: 'Test example',
      addedAt: '2024-01-01T00:00:00.000Z',
      ...overrides
    };
  }

  /**
   * Create mock gotcha data
   */
  static createGotcha(overrides?: Partial<any>): any {
    return {
      id: 'gotcha-1',
      issue: 'Test issue',
      fix: 'Test fix',
      context: 'Test context',
      addedAt: '2024-01-01T00:00:00.000Z',
      ...overrides
    };
  }

  /**
   * Create mock decision data
   */
  static createDecision(overrides?: Partial<any>): any {
    return {
      id: 'decision-1',
      title: 'Test Decision',
      decision: 'Test decision text',
      rationale: 'Test rationale',
      addedAt: '2024-01-01T00:00:00.000Z',
      ...overrides
    };
  }

  /**
   * Create mock checkpoint metadata
   */
  static createCheckpoint(overrides?: Partial<any>): any {
    return {
      id: 'cp-2024-01-01T00-00-00',
      createdAt: '2024-01-01T00:00:00.000Z',
      gitRef: 'abc123def456',
      featureId: 'feat-123456',
      trigger: 'feature_complete',
      message: 'Test checkpoint',
      filesChanged: 'file1.ts,file2.ts',
      ...overrides
    };
  }
}

/**
 * Mock process execution helpers
 */
export class MockProcessExecutor {
  private mockCommands: Map<string, { exitCode: number; stdout: string; stderr: string }> = new Map();

  /**
   * Register a mock command response
   */
  mockCommand(command: string, response: { exitCode: number; stdout: string; stderr: string }): void {
    this.mockCommands.set(command, response);
  }

  /**
   * Create child_process.exec mock
   */
  createExecMock() {
    const childProcess = require('child_process');
    const exec = childProcess.exec;

    (exec as any).mockImplementation((command: string, options: any, callback: any) => {
      // Handle both exec(command, callback) and exec(command, options, callback)
      const cb = typeof options === 'function' ? options : callback;

      const response = this.mockCommands.get(command) || {
        exitCode: 0,
        stdout: '',
        stderr: ''
      };

      if (response.exitCode === 0) {
        cb(null, { stdout: response.stdout }, '');
      } else {
        const error = new Error(response.stderr || 'Command failed');
        (error as any).code = response.exitCode;
        (error as any).stdout = response.stdout;
        (error as any).stderr = response.stderr;
        cb(error, { stdout: response.stdout }, response.stderr);
      }

      return { kill: jest.fn() };
    });

    return exec;
  }

  /**
   * Create child_process.spawn mock
   */
  createSpawnMock() {
    const { spawn } = require('child_process');

    (spawn as any).mockImplementation((command: string, args: string[], _options: any) => {
      const mockChild = {
        stdout: {
          on: jest.fn((event: string, handler: (data: any) => void) => {
            if (event === 'data') {
              const response = this.mockCommands.get(`${command} ${args.join(' ')}`);
              if (response) {
                handler(response.stdout);
              }
            }
          })
        },
        stderr: {
          on: jest.fn((event: string, handler: (data: any) => void) => {
            if (event === 'data') {
              const response = this.mockCommands.get(`${command} ${args.join(' ')}`);
              if (response) {
                handler(response.stderr);
              }
            }
          })
        },
        on: jest.fn((event: string, handler: (code: number) => void) => {
          if (event === 'close') {
            const response = this.mockCommands.get(`${command} ${args.join(' ')}`);
            handler(response?.exitCode || 0);
          }
        }),
        kill: jest.fn()
      };

      return mockChild;
    });

    return spawn;
  }

  /**
   * Reset all mocks
   */
  reset(): void {
    this.mockCommands.clear();
  }
}

/**
 * Cross-platform test helpers
 */
export class CrossPlatformTestHelper {
  /**
   * Get platform-specific paths for testing
   */
  static getPlatformPaths() {
    return {
      win32: {
        sep: '\\',
        home: 'C:\\Users\\test',
        project: 'C:\\Projects\\test',
        file: 'C:\\Projects\\test\\src\\index.ts',
        relative: 'src\\utils\\file.ts'
      },
      darwin: {
        sep: '/',
        home: '/Users/test',
        project: '/Projects/test',
        file: '/Projects/test/src/index.ts',
        relative: 'src/utils/file.ts'
      },
      linux: {
        sep: '/',
        home: '/home/test',
        project: '/home/test/projects',
        file: '/home/test/projects/src/index.ts',
        relative: 'src/utils/file.ts'
      }
    };
  }

  /**
   * Test a callback function with each platform's paths
   */
  static async testEachPlatform(
    callback: (platform: NodeJS.Platform, paths: any) => void | Promise<void>
  ): Promise<void> {
    const platforms = this.getPlatformPaths();

    for (const [platform, paths] of Object.entries(platforms)) {
      await callback(platform as NodeJS.Platform, paths);
    }
  }
}

/**
 * Assertion helpers
 */
export class AssertionHelpers {
  /**
   * Assert that file was written with specific content
   */
  static assertFileWritten(fs: MockFileSystem, path: string, content: string): void {
    expect(fs.hasFile(path)).toBe(true);
    expect(fs.getFile(path)).toBe(content);
  }

  /**
   * Assert that file was deleted
   */
  static assertFileDeleted(fs: MockFileSystem, path: string): void {
    expect(fs.hasFile(path)).toBe(false);
  }

  /**
   * Assert that directory was created
   */
  static assertDirectoryCreated(fs: MockFileSystem, path: string): void {
    expect(fs.hasDirectory(path)).toBe(true);
  }

  /**
   * Assert that command was executed
   */
  static assertCommandExecuted(execMock: Mock, command: string): void {
    expect(execMock).toHaveBeenCalledWith(
      expect.stringContaining(command),
      expect.anything(),
      expect.anything()
    );
  }
}

/**
 * Wait for async operations
 */
export async function waitFor(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Flush all pending promises
 */
export async function flushPromises(): Promise<void> {
  return new Promise(resolve => setImmediate(resolve));
}
