/**
 * PathUtils Tests
 * Tests for cross-platform path utilities
 */

import { PathUtils } from './path-utils';
import { CrossPlatformTestHelper } from './test-helpers';

// Mock os module
jest.mock('os', () => ({
  homedir: jest.fn(() => '/home/test'),
  tmpdir: jest.fn(() => '/tmp')
}));

const mockOs = require('os');

describe('PathUtils', () => {
  describe('homeDir', () => {
    it('should return home directory', () => {
      mockOs.homedir.mockReturnValue('/home/test');

      const result = PathUtils.homeDir();

      expect(result).toBe('/home/test');
      expect(mockOs.homedir).toHaveBeenCalled();
    });

    it('should return Windows home directory', () => {
      mockOs.homedir.mockReturnValue('C:\\Users\\test');

      const result = PathUtils.homeDir();

      expect(result).toBe('C:\\Users\\test');
    });
  });

  describe('join', () => {
    it('should join paths correctly', () => {
      const result = PathUtils.join('src', 'utils', 'file.ts');

      expect(result).toMatch(/src[\/\\]utils[\/\\]file\.ts/);
    });

    it('should handle empty segments', () => {
      const result = PathUtils.join('src', '', 'file.ts');

      expect(result).toBeTruthy();
    });

    it('should handle absolute paths', () => {
      const result = PathUtils.join('/absolute', 'path');

      expect(result).toBeTruthy();
    });

    it('should handle multiple arguments', () => {
      const result = PathUtils.join('a', 'b', 'c', 'd', 'e');

      expect(result).toBeTruthy();
    });

    it('should normalize redundant separators', () => {
      const result = PathUtils.join('src', 'utils', 'file.ts');

      // Should not have double separators
      expect(result).not.toMatch(/[\/\\]{2}/);
    });
  });

  describe('resolve', () => {
    it('should resolve absolute path', () => {
      const result = PathUtils.resolve('src', 'file.ts');

      expect(result).toMatch(/^\/.*src.*file\.ts$/);
    });

    it('should handle multiple path segments', () => {
      const result = PathUtils.resolve('project', 'src', 'utils', 'helper.ts');

      expect(result).toBeTruthy();
    });

    it('should resolve relative paths', () => {
      const result = PathUtils.resolve('..', 'src');

      expect(result).toBeTruthy();
    });
  });

  describe('dirname', () => {
    it('should return directory name', () => {
      const result = PathUtils.dirname('/test/project/src/file.ts');

      expect(result).toBe('/test/project/src');
    });

    it('should handle files in root', () => {
      const result = PathUtils.dirname('/file.txt');

      expect(result).toBe('/');
    });

    it('should handle relative paths', () => {
      const result = PathUtils.dirname('src/file.ts');

      expect(result).toBe('src');
    });

    it('should handle Windows paths', () => {
      const result = PathUtils.dirname('C:\\test\\project\\file.ts');

      // Result should be C:\test\project (with backslashes)
      expect(result).toContain('test');
      expect(result).toContain('project');
      expect(result).toContain('\\');
    });
  });

  describe('basename', () => {
    it('should return file name', () => {
      const result = PathUtils.basename('/test/project/src/file.ts');

      expect(result).toBe('file.ts');
    });

    it('should return file name without extension', () => {
      const result = PathUtils.basename('/test/project/src/file.ts', '.ts');

      expect(result).toBe('file');
    });

    it('should handle files in root', () => {
      const result = PathUtils.basename('/file.txt');

      expect(result).toBe('file.txt');
    });

    it('should handle multiple extensions', () => {
      const result = PathUtils.basename('/test/file.tar.gz', '.gz');

      expect(result).toBe('file.tar');
    });
  });

  describe('extname', () => {
    it('should return file extension', () => {
      const result = PathUtils.extname('/test/project/src/file.ts');

      expect(result).toBe('.ts');
    });

    it('should return empty string for files without extension', () => {
      const result = PathUtils.extname('/test/project/src/file');

      expect(result).toBe('');
    });

    it('should handle multiple extensions', () => {
      const result = PathUtils.extname('/test/file.tar.gz');

      expect(result).toBe('.gz');
    });

    it('should handle hidden files', () => {
      const result = PathUtils.extname('/test/.gitignore');

      expect(result).toBe('');
    });
  });

  describe('normalize', () => {
    it('should normalize path with .. segments', () => {
      const result = PathUtils.normalize('/test/project/../src/file.ts');

      expect(result).toMatch(/^\/test\/src\/file\.ts$/);
    });

    it('should normalize path with . segments', () => {
      const result = PathUtils.normalize('/test/./src/file.ts');

      expect(result).toMatch(/^\/test\/src\/file\.ts$/);
    });

    it('should normalize double separators', () => {
      const result = PathUtils.normalize('/test//src///file.ts');

      expect(result).not.toMatch(/[\/\\]{2}/);
    });

    it('should handle trailing separators', () => {
      const result = PathUtils.normalize('/test/src/');

      expect(result).toBeTruthy();
    });
  });

  describe('isAbsolute', () => {
    it('should return true for absolute Unix paths', () => {
      expect(PathUtils.isAbsolute('/test/project')).toBe(true);
    });

    it('should return false for relative Unix paths', () => {
      expect(PathUtils.isAbsolute('test/project')).toBe(false);
      expect(PathUtils.isAbsolute('./test')).toBe(false);
    });

    it('should return true for absolute Windows paths', () => {
      expect(PathUtils.isAbsolute('C:\\test\\project')).toBe(true);
      expect(PathUtils.isAbsolute('D:/test')).toBe(true);
    });

    it('should return false for relative Windows paths', () => {
      expect(PathUtils.isAbsolute('test\\project')).toBe(false);
      expect(PathUtils.isAbsolute('.\\test')).toBe(false);
    });
  });

  describe('relative', () => {
    it('should calculate relative path', () => {
      const result = PathUtils.relative('/test/project/src', '/test/project/utils/file.ts');

      expect(result).toMatch(/utils[\/\\]file\.ts/);
    });

    it('should handle paths with common ancestor', () => {
      const result = PathUtils.relative('/test/project/src', '/test/project/test');

      expect(result).toMatch(/\.\.[\/\\]*test/);
    });

    it('should handle same path', () => {
      const result = PathUtils.relative('/test/project', '/test/project');

      expect(result).toBe('');
    });

    it('should handle relative source', () => {
      const result = PathUtils.relative('src', 'test');

      expect(result).toBeTruthy();
    });
  });

  describe('toUnix', () => {
    it('should convert Windows paths to Unix style', () => {
      const result = PathUtils.toUnix('src\\utils\\file.ts');

      expect(result).toBe('src/utils/file.ts');
    });

    it('should preserve Unix paths', () => {
      const result = PathUtils.toUnix('src/utils/file.ts');

      expect(result).toBe('src/utils/file.ts');
    });

    it('should handle mixed separators', () => {
      const result = PathUtils.toUnix('src\\utils/file.ts');

      expect(result).toBe('src/utils/file.ts');
    });

    it('should handle nested paths', () => {
      const result = PathUtils.toUnix('a\\b\\c\\d\\file.ts');

      expect(result).toBe('a/b/c/d/file.ts');
    });

    it('should handle Windows drive letters', () => {
      const result = PathUtils.toUnix('C:\\test\\file.ts');

      expect(result).toBe('C:/test/file.ts');
    });
  });

  describe('toPlatform', () => {
    it('should convert Unix paths to platform style', () => {
      const result = PathUtils.toPlatform('src/utils/file.ts');

      expect(result).toBeTruthy();
      // Should use platform separator
      expect(result).toContain(require('path').sep);
    });

    it('should preserve platform-specific paths', () => {
      const separator = require('path').sep;
      const input = `src${separator}utils${separator}file.ts`;

      const result = PathUtils.toPlatform(input);

      expect(result).toBe(input);
    });

    it('should handle nested paths', () => {
      const result = PathUtils.toPlatform('a/b/c/d/file.ts');

      expect(result).toBeTruthy();
      // On Unix, path should use forward slashes
      // On Windows, path should use backslashes
      const path = require('path');
      expect(result).toContain(path.sep);
    });
  });

  describe('getStateDir', () => {
    it('should return state directory for project root', () => {
      const result = PathUtils.getStateDir('/test/project');

      expect(result).toMatch(/test[\/\\]project[\/\\]\.claude[\/\\]siftcoder-state/);
    });

    it('should use CLAUDE_PROJECT_DIR env var', () => {
      process.env.CLAUDE_PROJECT_DIR = '/custom/project';

      const result = PathUtils.getStateDir();

      expect(result).toMatch(/custom[\/\\]project[\/\\]\.claude[\/\\]siftcoder-state/);
    });

    it('should use cwd when no project root provided', () => {
      const result = PathUtils.getStateDir();

      expect(result).toMatch(/\.claude[\/\\]siftcoder-state/);
    });
  });

  describe('getConfigDir', () => {
    it('should return config directory on Unix', () => {
      const originalPlatform = process.platform;
      Object.defineProperty(process, 'platform', { value: 'linux' });

      mockOs.homedir.mockReturnValue('/home/test');

      const result = PathUtils.getConfigDir();

      expect(result).toBe('/home/test/.config/siftcoder');

      Object.defineProperty(process, 'platform', { value: originalPlatform });
    });

    it('should return config directory on Windows', () => {
      const originalPlatform = process.platform;
      Object.defineProperty(process, 'platform', { value: 'win32' });

      process.env.APPDATA = 'C:\\Users\\test\\AppData\\Roaming';
      mockOs.homedir.mockReturnValue('C:\\Users\\test');

      const result = PathUtils.getConfigDir();

      expect(result).toMatch(/siftcoder$/);

      Object.defineProperty(process, 'platform', { value: originalPlatform });
    });

    it('should use homedir fallback on Windows if APPDATA not set', () => {
      const originalPlatform = process.platform;
      Object.defineProperty(process, 'platform', { value: 'win32' });

      delete process.env.APPDATA;
      mockOs.homedir.mockReturnValue('C:\\Users\\test');

      const result = PathUtils.getConfigDir();

      expect(result).toMatch(/siftcoder$/);

      Object.defineProperty(process, 'platform', { value: originalPlatform });
    });

    it('should return config directory on macOS', () => {
      const originalPlatform = process.platform;
      Object.defineProperty(process, 'platform', { value: 'darwin' });

      mockOs.homedir.mockReturnValue('/Users/test');

      const result = PathUtils.getConfigDir();

      expect(result).toBe('/Users/test/.config/siftcoder');

      Object.defineProperty(process, 'platform', { value: originalPlatform });
    });
  });

  describe('getTempDir', () => {
    it('should return temp directory', () => {
      mockOs.tmpdir.mockReturnValue('/tmp');

      const result = PathUtils.getTempDir();

      expect(result).toBe('/tmp');
      expect(mockOs.tmpdir).toHaveBeenCalled();
    });
  });

  describe('parse', () => {
    it('should parse path into components', () => {
      const result = PathUtils.parse('/test/project/src/file.ts');

      expect(result.dir).toBeTruthy();
      expect(result.base).toBe('file.ts');
      expect(result.name).toBe('file');
      expect(result.ext).toBe('.ts');
    });

    it('should handle relative paths', () => {
      const result = PathUtils.parse('src/file.ts');

      expect(result.dir).toBeTruthy();
      expect(result.base).toBe('file.ts');
    });

    it('should handle paths without extension', () => {
      const result = PathUtils.parse('/test/project/file');

      expect(result.ext).toBe('');
      expect(result.name).toBe('file');
    });

    it('should handle Windows paths', () => {
      const result = PathUtils.parse('C:\\test\\file.ts');

      expect(result.base).toBe('file.ts');
      expect(result.ext).toBe('.ts');
    });
  });

  describe('format', () => {
    it('should format path from components', () => {
      const pathObject = {
        dir: '/test/project',
        name: 'file',
        ext: '.ts'
      };

      const result = PathUtils.format(pathObject);

      expect(result).toBe('/test/project/file.ts');
    });

    it('should handle root directory', () => {
      const pathObject = {
        dir: '/',
        name: 'file',
        ext: '.txt'
      };

      const result = PathUtils.format(pathObject);

      expect(result).toBe('/file.txt');
    });

    it('should handle relative directory', () => {
      const pathObject = {
        dir: 'src',
        name: 'file',
        ext: '.js'
      };

      const result = PathUtils.format(pathObject);

      expect(result).toBeTruthy();
    });

    it('should handle missing extension', () => {
      const pathObject = {
        dir: '/test',
        name: 'file',
        ext: ''
      };

      const result = PathUtils.format(pathObject);

      expect(result).toBe('/test/file');
    });
  });

  describe('Cross-platform compatibility', () => {
    it('should handle Windows vs Unix path differences', () => {
      const paths = CrossPlatformTestHelper.getPlatformPaths();

      // Unix paths
      const unixPath = PathUtils.join(paths.darwin.project, 'src', 'file.ts');
      expect(unixPath).toContain('/');

      // Should convert to Unix consistently
      expect(PathUtils.toUnix(unixPath)).toBe(unixPath);
    });

    it('should normalize paths across platforms', () => {
      // Test with Windows-style path
      const winPath = 'src\\utils\\file.ts';
      const normalized = PathUtils.toUnix(winPath);

      expect(normalized).toBe('src/utils/file.ts');
    });

    it('should handle edge cases - empty paths', () => {
      expect(PathUtils.join()).toBeTruthy();
      expect(PathUtils.resolve()).toBeTruthy();
    });

    it('should handle edge cases - special characters', () => {
      const pathWithSpaces = PathUtils.join('src', 'my folder', 'file name.ts');
      expect(pathWithSpaces).toContain('my folder');

      const pathWithDots = PathUtils.join('src', '.hidden', 'file.ts');
      expect(pathWithDots).toContain('.hidden');
    });
  });

  describe('Edge cases', () => {
    it('should handle paths with trailing separators', () => {
      const result = PathUtils.join('src', 'utils', '');

      expect(result).toBeTruthy();
    });

    it('should handle paths with leading separators', () => {
      const result = PathUtils.join('/absolute', 'path');

      expect(result).toMatch(/^\/absolute/);
    });

    it('should handle empty basename', () => {
      const result = PathUtils.basename('/test/project/');

      expect(result).toBeTruthy();
    });

    it('should handle root directory', () => {
      expect(PathUtils.dirname('/')).toBe('/');
      expect(PathUtils.basename('/')).toBe('/');
    });

    it('should handle paths with only extension', () => {
      const result = PathUtils.extname('/test/.gitignore');

      expect(result).toBe('');
    });

    it('should handle multiple consecutive slashes', () => {
      const result = PathUtils.normalize('//test///path//file.ts');

      expect(result).not.toMatch(/[\/\\]{3}/);
    });
  });
});
