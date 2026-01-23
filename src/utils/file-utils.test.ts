/**
 * FileUtils Tests
 * Tests for cross-platform file utilities
 */

import { FileUtils } from './file-utils';
import { MockFileSystem, TestDataFactory, CrossPlatformTestHelper } from './test-helpers';
import { glob as globSync } from 'glob';

// Mock glob
jest.mock('glob');
const mockGlob = globSync as jest.MockedFunction<typeof globSync>;

describe('FileUtils', () => {
  let mockFs: MockFileSystem;

  beforeEach(() => {
    mockFs = new MockFileSystem({
      files: {
        '/test/project/src/index.ts': 'export class Test {}',
        '/test/project/src/utils/helper.ts': 'export function help() {}',
        '/test/project/package.json': '{"name": "test"}',
        '/test/project/.gitignore': 'node_modules\ndist',
      },
      directories: [
        '/test/project/src',
        '/test/project/src/utils',
        '/test/project/node_modules',
      ]
    });
    mockFs.createFsPromisesMock();

    // Mock glob to return files
    mockGlob.mockResolvedValue(['src/index.ts', 'src/utils/helper.ts']);
  });

  describe('glob', () => {
    it('should match files using glob pattern', async () => {
      mockGlob.mockResolvedValueOnce(['src/index.ts', 'src/utils/helper.ts']);

      const result = await FileUtils.glob('**/*.ts', '/test/project');

      expect(mockGlob).toHaveBeenCalledWith('**/*.ts', {
        cwd: '/test/project',
        windowsPathsNoEscape: true,
        absolute: false,
        dot: true
      });
      expect(result).toEqual(['src/index.ts', 'src/utils/helper.ts']);
    });

    it('should handle dot files with dot: true option', async () => {
      mockGlob.mockResolvedValueOnce(['.gitignore', '.env']);

      const result = await FileUtils.glob('.*', '/test/project');

      expect(result).toEqual(['.gitignore', '.env']);
    });

    it('should use current working directory if no cwd provided', async () => {
      mockGlob.mockResolvedValueOnce(['src/index.ts']);

      await FileUtils.glob('**/*.ts');

      expect(mockGlob).toHaveBeenCalledWith('**/*.ts', {
        cwd: process.cwd(),
        windowsPathsNoEscape: true,
        absolute: false,
        dot: true
      });
    });

    it('should handle empty results', async () => {
      mockGlob.mockResolvedValueOnce([]);

      const result = await FileUtils.glob('nonexistent/**/*');

      expect(result).toEqual([]);
    });
  });

  describe('exists', () => {
    it('should return true for existing file', async () => {
      const fs = require('fs/promises');
      fs.access.mockResolvedValue(undefined);

      const result = await FileUtils.exists('/test/project/src/index.ts');

      expect(result).toBe(true);
      expect(fs.access).toHaveBeenCalledWith('/test/project/src/index.ts');
    });

    it('should return false for non-existing file', async () => {
      const fs = require('fs/promises');
      fs.access.mockRejectedValue(new Error('File not found'));

      const result = await FileUtils.exists('/nonexistent/file.txt');

      expect(result).toBe(false);
    });

    it('should return true for existing directory', async () => {
      const fs = require('fs/promises');
      fs.access.mockResolvedValue(undefined);

      const result = await FileUtils.exists('/test/project/src');

      expect(result).toBe(true);
    });
  });

  describe('readFile', () => {
    it('should read file content as string', async () => {
      const fs = require('fs/promises');
      fs.readFile.mockResolvedValue('export class Test {}');

      const result = await FileUtils.readFile('/test/project/src/index.ts');

      expect(result).toBe('export class Test {}');
      expect(fs.readFile).toHaveBeenCalledWith('/test/project/src/index.ts', 'utf-8');
    });

    it('should throw error for non-existing file', async () => {
      const fs = require('fs/promises');
      fs.readFile.mockRejectedValue(new Error('File not found'));

      await expect(FileUtils.readFile('/nonexistent/file.txt')).rejects.toThrow('File not found');
    });
  });

  describe('writeFile', () => {
    it('should write file with directory creation', async () => {
      const fs = require('fs/promises');
      fs.mkdir.mockResolvedValue(undefined);
      fs.writeFile.mockResolvedValue(undefined);

      await FileUtils.writeFile('/test/project/new/dir/file.txt', 'content');

      expect(fs.mkdir).toHaveBeenCalledWith('/test/project/new/dir', { recursive: true });
      expect(fs.writeFile).toHaveBeenCalledWith('/test/project/new/dir/file.txt', 'content', 'utf-8');
    });

    it('should overwrite existing file', async () => {
      const fs = require('fs/promises');
      fs.mkdir.mockResolvedValue(undefined);
      fs.writeFile.mockResolvedValue(undefined);

      await FileUtils.writeFile('/test/project/src/index.ts', 'new content');

      expect(fs.writeFile).toHaveBeenCalledWith('/test/project/src/index.ts', 'new content', 'utf-8');
    });

    it('should handle nested directories', async () => {
      const fs = require('fs/promises');
      fs.mkdir.mockResolvedValue(undefined);
      fs.writeFile.mockResolvedValue(undefined);

      await FileUtils.writeFile('/a/b/c/d/file.txt', 'content');

      expect(fs.mkdir).toHaveBeenCalledWith('/a/b/c/d', { recursive: true });
    });
  });

  describe('readJSON', () => {
    it('should parse JSON file', async () => {
      const fs = require('fs/promises');
      fs.readFile.mockResolvedValue('{"name": "test", "version": "1.0.0"}');

      const result = await FileUtils.readJSON('/test/project/package.json');

      expect(result).toEqual({ name: 'test', version: '1.0.0' });
    });

    it('should throw error for invalid JSON', async () => {
      const fs = require('fs/promises');
      fs.readFile.mockResolvedValue('invalid json{');

      await expect(FileUtils.readJSON('/test/project/bad.json')).rejects.toThrow();
    });

    it('should parse arrays', async () => {
      const fs = require('fs/promises');
      fs.readFile.mockResolvedValue('[1, 2, 3]');

      const result = await FileUtils.readJSON<number[]>('/test/project/array.json');

      expect(result).toEqual([1, 2, 3]);
    });
  });

  describe('writeJSON', () => {
    it('should write JSON with formatting', async () => {
      const fs = require('fs/promises');
      fs.mkdir.mockResolvedValue(undefined);
      fs.writeFile.mockResolvedValue(undefined);

      const data = { name: 'test', version: '1.0.0' };
      await FileUtils.writeJSON('/test/project/data.json', data);

      const expected = JSON.stringify(data, null, 2);
      expect(fs.writeFile).toHaveBeenCalledWith('/test/project/data.json', expected, 'utf-8');
    });

    it('should handle nested objects', async () => {
      const fs = require('fs/promises');
      fs.mkdir.mockResolvedValue(undefined);
      fs.writeFile.mockResolvedValue(undefined);

      const data = { nested: { deep: { value: 1 } } };
      await FileUtils.writeJSON('/test/project/nested.json', data);

      expect(fs.writeFile).toHaveBeenCalledWith(
        '/test/project/nested.json',
        JSON.stringify(data, null, 2),
        'utf-8'
      );
    });
  });

  describe('appendFile', () => {
    it('should append content to existing file', async () => {
      const fs = require('fs/promises');
      fs.appendFile.mockResolvedValue(undefined);

      await FileUtils.appendFile('/test/project/log.txt', 'new line\n');

      expect(fs.appendFile).toHaveBeenCalledWith('/test/project/log.txt', 'new line\n', 'utf-8');
    });

    it('should create file if it does not exist', async () => {
      const fs = require('fs/promises');
      fs.appendFile.mockResolvedValue(undefined);

      await FileUtils.appendFile('/test/project/newlog.txt', 'first line\n');

      expect(fs.appendFile).toHaveBeenCalledWith('/test/project/newlog.txt', 'first line\n', 'utf-8');
    });
  });

  describe('mkdir', () => {
    it('should create directory recursively', async () => {
      const fs = require('fs/promises');
      fs.mkdir.mockResolvedValue(undefined);

      await FileUtils.mkdir('/test/project/new/dir');

      expect(fs.mkdir).toHaveBeenCalledWith('/test/project/new/dir', { recursive: true });
    });

    it('should handle existing directories', async () => {
      const fs = require('fs/promises');
      fs.mkdir.mockResolvedValue(undefined);

      await FileUtils.mkdir('/test/project/src');

      expect(fs.mkdir).toHaveBeenCalledWith('/test/project/src', { recursive: true });
    });
  });

  describe('listFiles', () => {
    it('should list files in directory', async () => {
      const fs = require('fs/promises');
      const mockEntries = [
        { name: 'file1.ts', isFile: () => true },
        { name: 'file2.ts', isFile: () => true },
        { name: 'subdir', isFile: () => false }
      ];
      fs.readdir.mockResolvedValue(mockEntries);

      const result = await FileUtils.listFiles('/test/project/src');

      expect(result).toEqual(['file1.ts', 'file2.ts']);
    });

    it('should return empty array for non-existing directory', async () => {
      const fs = require('fs/promises');
      fs.readdir.mockRejectedValue(new Error('Directory not found'));

      const result = await FileUtils.listFiles('/nonexistent/dir');

      expect(result).toEqual([]);
    });

    it('should return empty array for empty directory', async () => {
      const fs = require('fs/promises');
      fs.readdir.mockResolvedValue([]);

      const result = await FileUtils.listFiles('/test/project/empty');

      expect(result).toEqual([]);
    });
  });

  describe('match', () => {
    it('should match file path against pattern', () => {
      const result = FileUtils.match('src/utils/file.ts', 'src/**/*.ts');
      expect(result).toBe(true);
    });

    it('should not match non-matching pattern', () => {
      const result = FileUtils.match('src/utils/file.ts', 'test/**/*.js');
      expect(result).toBe(false);
    });

    it('should handle Windows paths', () => {
      const result = FileUtils.match('src\\utils\\file.ts', 'src/**/*.ts');
      expect(result).toBe(true);
    });

    it('should match dot files', () => {
      const result = FileUtils.match('.gitignore', '.*');
      expect(result).toBe(true);
    });

    it('should handle wildcards', () => {
      expect(FileUtils.match('src/index.ts', '*.ts')).toBe(false);
      expect(FileUtils.match('index.ts', '*.ts')).toBe(true);
      expect(FileUtils.match('src/utils/helper.ts', 'src/**/*.ts')).toBe(true);
    });

    it('should match negation patterns', () => {
      expect(FileUtils.match('node_modules/package/index.js', '!node_modules/**')).toBe(false);
    });
  });

  describe('stat', () => {
    it('should get file stats', async () => {
      const fs = require('fs/promises');
      const mockStats = {
        isFile: () => true,
        isDirectory: () => false,
        size: 1024
      };
      fs.stat.mockResolvedValue(mockStats);

      const result = await FileUtils.stat('/test/project/src/index.ts');

      expect(result).toEqual(mockStats);
    });

    it('should throw error for non-existing path', async () => {
      const fs = require('fs/promises');
      fs.stat.mockRejectedValue(new Error('Path not found'));

      await expect(FileUtils.stat('/nonexistent/file')).rejects.toThrow();
    });
  });

  describe('deleteFile', () => {
    it('should delete file', async () => {
      const fs = require('fs/promises');
      fs.unlink.mockResolvedValue(undefined);

      await FileUtils.deleteFile('/test/project/old-file.txt');

      expect(fs.unlink).toHaveBeenCalledWith('/test/project/old-file.txt');
    });

    it('should throw error for non-existing file', async () => {
      const fs = require('fs/promises');
      fs.unlink.mockRejectedValue(new Error('File not found'));

      await expect(FileUtils.deleteFile('/nonexistent/file')).rejects.toThrow();
    });
  });

  describe('copyFile', () => {
    it('should copy file with directory creation', async () => {
      const fs = require('fs/promises');
      fs.mkdir.mockResolvedValue(undefined);
      fs.copyFile.mockResolvedValue(undefined);

      await FileUtils.copyFile('/test/project/src/index.ts', '/test/project/dist/index.js');

      expect(fs.mkdir).toHaveBeenCalledWith('/test/project/dist', { recursive: true });
      expect(fs.copyFile).toHaveBeenCalledWith('/test/project/src/index.ts', '/test/project/dist/index.js');
    });

    it('should handle nested directories', async () => {
      const fs = require('fs/promises');
      fs.mkdir.mockResolvedValue(undefined);
      fs.copyFile.mockResolvedValue(undefined);

      await FileUtils.copyFile('/src/file.txt', '/a/b/c/file.txt');

      expect(fs.mkdir).toHaveBeenCalledWith('/a/b/c', { recursive: true });
    });
  });

  describe('moveFile', () => {
    it('should rename/move file', async () => {
      const fs = require('fs/promises');
      fs.rename.mockResolvedValue(undefined);

      await FileUtils.moveFile('/test/project/old.txt', '/test/project/new.txt');

      expect(fs.rename).toHaveBeenCalledWith('/test/project/old.txt', '/test/project/new.txt');
    });

    it('should throw error for non-existing source', async () => {
      const fs = require('fs/promises');
      fs.rename.mockRejectedValue(new Error('Source not found'));

      await expect(FileUtils.moveFile('/nonexistent/src', '/dest')).rejects.toThrow();
    });
  });

  describe('Cross-platform compatibility', () => {
    it('should handle Unix paths', async () => {
      const fs = require('fs/promises');
      fs.readFile.mockResolvedValue('content');

      await FileUtils.readFile('/test/project/src/file.ts');

      expect(fs.readFile).toHaveBeenCalledWith('/test/project/src/file.ts', 'utf-8');
    });

    it('should handle Windows paths when mocked with Unix separators', async () => {
      const fs = require('fs/promises');
      fs.readFile.mockResolvedValue('content');

      // Windows path converted to Unix style
      await FileUtils.readFile('C:/test/project/src/file.ts');

      expect(fs.readFile).toHaveBeenCalledWith('C:/test/project/src/file.ts', 'utf-8');
    });

    it('should normalize paths for matching', () => {
      // Test that match normalizes paths
      const winPath = 'src\\utils\\file.ts';
      const unixPattern = 'src/**/*.ts';

      expect(FileUtils.match(winPath, unixPattern)).toBe(true);
    });
  });
});
