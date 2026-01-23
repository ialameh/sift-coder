/**
 * BoundaryEnforcer Service Tests
 * Tests for file modification boundary enforcement
 */

import { BoundaryEnforcer, BoundaryCheckResult } from './boundary-enforcer';
import { MockFileSystem, TestDataFactory } from '../utils/test-helpers';

// Mock dependencies with proper structure
jest.mock('./state-manager.js', () => ({
  StateManager: jest.fn().mockImplementation(() => ({
    loadBoundaries: jest.fn(),
    saveBoundaries: jest.fn(),
    getStateDir: jest.fn(() => '/test/state')
  }))
}));

jest.mock('../utils/file-utils.js', () => ({
  FileUtils: {
    match: jest.fn(),
    exists: jest.fn(),
    readJSON: jest.fn(),
    writeJSON: jest.fn()
  }
}));

jest.mock('../utils/path-utils.js', () => ({
  PathUtils: {
    toUnix: jest.fn((path: string) => path.replace(/\\/g, '/')),
    join: jest.fn((...args: string[]) => args.join('/'))
  }
}));

const StateManager = require('./state-manager.js').StateManager;
const FileUtils = require('../utils/file-utils.js').FileUtils;
const PathUtils = require('../utils/path-utils.js').PathUtils;

describe('BoundaryEnforcer', () => {
  let boundaryEnforcer: BoundaryEnforcer;
  let mockStateManager: any;

  beforeEach(() => {
    jest.clearAllMocks();

    // Create mock StateManager instance
    mockStateManager = {
      loadBoundaries: jest.fn().mockResolvedValue(null),
      saveBoundaries: jest.fn().mockResolvedValue(undefined),
      getStateDir: jest.fn(() => '/test/state')
    };

    // Setup StateManager mock
    StateManager.mockImplementation(() => mockStateManager);

    // Setup PathUtils and FileUtils mocks
    PathUtils.toUnix.mockImplementation((path: string) => path.replace(/\\/g, '/'));
    PathUtils.join.mockImplementation((...args: string[]) => args.join('/'));
    FileUtils.match.mockReturnValue(true);
    FileUtils.exists.mockResolvedValue(true);

    // Ensure saveBoundaries mock is properly set up
    mockStateManager.saveBoundaries.mockResolvedValue(undefined);
  });

  describe('constructor', () => {
    it('should initialize with project root', () => {
      boundaryEnforcer = new BoundaryEnforcer('/test/project');

      expect(boundaryEnforcer).toBeInstanceOf(BoundaryEnforcer);
      expect(StateManager).toHaveBeenCalledWith('/test/project');
    });

    it('should initialize without project root', () => {
      boundaryEnforcer = new BoundaryEnforcer();

      expect(boundaryEnforcer).toBeInstanceOf(BoundaryEnforcer);
    });
  });

  describe('checkFile', () => {
    it('should allow modification when no boundaries configured', async () => {
      mockStateManager.loadBoundaries.mockResolvedValue(null);

      boundaryEnforcer = new BoundaryEnforcer();
      const result = await boundaryEnforcer.checkFile('src/index.ts');

      expect(result).toEqual({
        allowed: true,
        reason: 'No boundaries configured',
        boundary_type: 'none'
      });
    });

    it('should allow modification within modifiable boundaries', async () => {
      const mockBoundaries = TestDataFactory.createBoundaries({
        modifiable: ['src/**/*', 'test/**/*'],
        protected: []
      });
      mockStateManager.loadBoundaries.mockResolvedValue(mockBoundaries);
      FileUtils.match.mockImplementation((path: string, pattern: string) => {
        return pattern === 'src/**/*' || pattern === 'test/**/*';
      });

      boundaryEnforcer = new BoundaryEnforcer();
      const result = await boundaryEnforcer.checkFile('src/utils/file.ts');

      expect(result).toEqual({
        allowed: true,
        reason: 'File is within modifiable boundaries',
        boundary_type: 'modifiable'
      });
    });

    it('should deny modification for protected files', async () => {
      const mockBoundaries = TestDataFactory.createBoundaries({
        modifiable: ['src/**/*'],
        protected: ['node_modules/**', 'dist/**']
      });
      mockStateManager.loadBoundaries.mockResolvedValue(mockBoundaries);
      FileUtils.match.mockImplementation((path: string, pattern: string) => {
        return pattern === 'dist/**' || pattern === 'node_modules/**';
      });

      boundaryEnforcer = new BoundaryEnforcer();
      const result = await boundaryEnforcer.checkFile('dist/bundle.js');

      expect(result).toEqual({
        allowed: false,
        reason: 'File is protected by boundary: dist/bundle.js',
        boundary_type: 'protected'
      });
    });

    it('should deny modification for files outside boundaries', async () => {
      const mockBoundaries = TestDataFactory.createBoundaries({
        modifiable: ['src/**/*'],
        protected: []
      });
      mockStateManager.loadBoundaries.mockResolvedValue(mockBoundaries);
      FileUtils.match.mockReturnValue(false);

      boundaryEnforcer = new BoundaryEnforcer();
      const result = await boundaryEnforcer.checkFile('temp/file.txt');

      expect(result).toEqual({
        allowed: false,
        reason: 'File is outside defined boundaries',
        boundary_type: 'none'
      });
    });

    it('should normalize paths for cross-platform matching', async () => {
      const mockBoundaries = TestDataFactory.createBoundaries({
        modifiable: ['src/**/*'],
        protected: []
      });
      mockStateManager.loadBoundaries.mockResolvedValue(mockBoundaries);

      boundaryEnforcer = new BoundaryEnforcer();

      // Test Windows path
      FileUtils.match.mockReturnValue(true);
      const result = await boundaryEnforcer.checkFile('src\\utils\\file.ts');

      expect(PathUtils.toUnix).toHaveBeenCalledWith('src\\utils\\file.ts');
      expect(result.allowed).toBe(true);
    });

    it('should prioritize protected over modifiable', async () => {
      const mockBoundaries = TestDataFactory.createBoundaries({
        modifiable: ['**/*.ts'],
        protected: ['**/node_modules/**']
      });
      mockStateManager.loadBoundaries.mockResolvedValue(mockBoundaries);
      FileUtils.match.mockImplementation((path: string, pattern: string) => {
        // Match both patterns
        return true;
      });

      boundaryEnforcer = new BoundaryEnforcer();
      const result = await boundaryEnforcer.checkFile('node_modules/package/index.ts');

      // Protected should take priority
      expect(result.boundary_type).toBe('protected');
      expect(result.allowed).toBe(false);
    });
  });

  describe('checkFiles', () => {
    it('should check multiple files', async () => {
      const mockBoundaries = TestDataFactory.createBoundaries({
        modifiable: ['src/**/*'],
        protected: ['node_modules/**']
      });
      mockStateManager.loadBoundaries.mockResolvedValue(mockBoundaries);
      FileUtils.match.mockImplementation((path: string, pattern: string) => {
        if (path.includes('src')) return pattern === 'src/**/*';
        if (path.includes('node_modules')) return pattern === 'node_modules/**';
        return false;
      });

      boundaryEnforcer = new BoundaryEnforcer();
      const files = ['src/index.ts', 'src/utils/helper.ts', 'node_modules/package/index.js'];

      const results = await boundaryEnforcer.checkFiles(files);

      expect(results.size).toBe(3);
      expect(results.get('src/index.ts')?.allowed).toBe(true);
      expect(results.get('src/utils/helper.ts')?.allowed).toBe(true);
      expect(results.get('node_modules/package/index.js')?.allowed).toBe(false);
    });

    it('should handle empty file list', async () => {
      mockStateManager.loadBoundaries.mockResolvedValue(null);

      boundaryEnforcer = new BoundaryEnforcer();
      const results = await boundaryEnforcer.checkFiles([]);

      expect(results.size).toBe(0);
    });
  });

  describe('setBoundaries', () => {
    it('should set boundaries with timestamp', async () => {
      mockStateManager.saveBoundaries.mockResolvedValue(undefined);

      boundaryEnforcer = new BoundaryEnforcer();
      await boundaryEnforcer.setBoundaries({
        modifiable: ['src/**/*'],
        protected: ['node_modules/**'],
        blast_radius_verified: true
      });

      expect(mockStateManager.saveBoundaries).toHaveBeenCalledWith(
        expect.objectContaining({
          modifiable: ['src/**/*'],
          protected: ['node_modules/**'],
          blast_radius_verified: true,
          last_check: expect.any(String)
        })
      );
    });
  });

  describe('addModifiable', () => {
    it('should add modifiable pattern to existing boundaries', async () => {
      const mockBoundaries = TestDataFactory.createBoundaries({
        modifiable: ['src/**/*'],
        protected: []
      });
      mockStateManager.loadBoundaries.mockResolvedValue(mockBoundaries);
      mockStateManager.saveBoundaries.mockResolvedValue(undefined);

      boundaryEnforcer = new BoundaryEnforcer();
      await boundaryEnforcer.addModifiable('test/**/*');

      expect(mockStateManager.saveBoundaries).toHaveBeenCalledWith(
        expect.objectContaining({
          modifiable: expect.arrayContaining(['src/**/*', 'test/**/*'])
        })
      );
    });

    it('should create new boundaries if none exist', async () => {
      mockStateManager.loadBoundaries.mockResolvedValue(null);
      mockStateManager.saveBoundaries.mockResolvedValue(undefined);

      boundaryEnforcer = new BoundaryEnforcer();
      await boundaryEnforcer.addModifiable('src/**/*');

      expect(mockStateManager.saveBoundaries).toHaveBeenCalledWith(
        expect.objectContaining({
          modifiable: ['src/**/*'],
          protected: [],
          blast_radius_verified: false,
          last_check: expect.any(String)
        })
      );
    });

    it('should not add duplicate patterns', async () => {
      const mockBoundaries = TestDataFactory.createBoundaries({
        modifiable: ['src/**/*'],
        protected: []
      });
      mockStateManager.loadBoundaries.mockResolvedValue(mockBoundaries);
      mockStateManager.saveBoundaries.mockResolvedValue(undefined);

      boundaryEnforcer = new BoundaryEnforcer();
      await boundaryEnforcer.addModifiable('src/**/*');

      // Should NOT call saveBoundaries since pattern already exists
      expect(mockStateManager.saveBoundaries).not.toHaveBeenCalled();
    });
  });

  describe('addProtected', () => {
    it('should add protected pattern to existing boundaries', async () => {
      const mockBoundaries = TestDataFactory.createBoundaries({
        modifiable: [],
        protected: ['node_modules/**']
      });
      mockStateManager.loadBoundaries.mockResolvedValue(mockBoundaries);
      mockStateManager.saveBoundaries.mockResolvedValue(undefined);

      boundaryEnforcer = new BoundaryEnforcer();
      await boundaryEnforcer.addProtected('dist/**');

      expect(mockStateManager.saveBoundaries).toHaveBeenCalledWith(
        expect.objectContaining({
          protected: expect.arrayContaining(['node_modules/**', 'dist/**'])
        })
      );
    });

    it('should create new boundaries if none exist', async () => {
      mockStateManager.loadBoundaries.mockResolvedValue(null);
      mockStateManager.saveBoundaries.mockResolvedValue(undefined);

      boundaryEnforcer = new BoundaryEnforcer();
      await boundaryEnforcer.addProtected('node_modules/**');

      expect(mockStateManager.saveBoundaries).toHaveBeenCalledWith(
        expect.objectContaining({
          modifiable: [],
          protected: ['node_modules/**'],
          blast_radius_verified: false,
          last_check: expect.any(String)
        })
      );
    });

    it('should not add duplicate patterns', async () => {
      const mockBoundaries = TestDataFactory.createBoundaries({
        modifiable: [],
        protected: ['node_modules/**']
      });
      mockStateManager.loadBoundaries.mockResolvedValue(mockBoundaries);
      mockStateManager.saveBoundaries.mockResolvedValue(undefined);

      boundaryEnforcer = new BoundaryEnforcer();
      await boundaryEnforcer.addProtected('node_modules/**');

      const saved = mockStateManager.saveBoundaries.mock.calls[0][0];
      expect(saved.protected).toEqual(['node_modules/**']);
    });
  });

  describe('clearBoundaries', () => {
    it('should clear all boundaries', async () => {
      mockStateManager.saveBoundaries.mockResolvedValue(undefined);

      boundaryEnforcer = new BoundaryEnforcer();
      await boundaryEnforcer.clearBoundaries();

      expect(mockStateManager.saveBoundaries).toHaveBeenCalledWith({
        modifiable: [],
        protected: [],
        blast_radius_verified: false,
        last_check: expect.any(String)
      });
    });
  });

  describe('getBoundaries', () => {
    it('should get current boundaries', async () => {
      const mockBoundaries = TestDataFactory.createBoundaries();
      mockStateManager.loadBoundaries.mockResolvedValue(mockBoundaries);

      boundaryEnforcer = new BoundaryEnforcer();
      const result = await boundaryEnforcer.getBoundaries();

      expect(result).toEqual(mockBoundaries);
    });

    it('should return null if no boundaries set', async () => {
      mockStateManager.loadBoundaries.mockResolvedValue(null);

      boundaryEnforcer = new BoundaryEnforcer();
      const result = await boundaryEnforcer.getBoundaries();

      expect(result).toBeNull();
    });
  });

  describe('verifyBlastRadius', () => {
    it('should return true if all files allowed', async () => {
      const mockBoundaries = TestDataFactory.createBoundaries({
        modifiable: ['src/**/*'],
        protected: []
      });
      mockStateManager.loadBoundaries.mockResolvedValue(mockBoundaries);
      mockStateManager.saveBoundaries.mockResolvedValue(undefined);
      FileUtils.match.mockReturnValue(true);

      boundaryEnforcer = new BoundaryEnforcer();
      const files = ['src/index.ts', 'src/utils/helper.ts'];

      const result = await boundaryEnforcer.verifyBlastRadius(files);

      expect(result).toBe(true);
      expect(mockStateManager.saveBoundaries).toHaveBeenCalledWith(
        expect.objectContaining({
          blast_radius_verified: true
        })
      );
    });

    it('should return false if any file denied', async () => {
      const mockBoundaries = TestDataFactory.createBoundaries({
        modifiable: ['src/**/*'],
        protected: ['node_modules/**']
      });
      mockStateManager.loadBoundaries.mockResolvedValue(mockBoundaries);
      FileUtils.match.mockImplementation((path: string, pattern: string) => {
        return pattern === 'node_modules/**';
      });

      boundaryEnforcer = new BoundaryEnforcer();
      const files = ['src/index.ts', 'node_modules/package/index.js'];

      const result = await boundaryEnforcer.verifyBlastRadius(files);

      expect(result).toBe(false);
    });

    it('should handle empty file list', async () => {
      mockStateManager.loadBoundaries.mockResolvedValue(null);

      boundaryEnforcer = new BoundaryEnforcer();
      const result = await boundaryEnforcer.verifyBlastRadius([]);

      expect(result).toBe(true);
    });
  });

  describe('Pattern matching', () => {
    it('should handle glob patterns correctly', async () => {
      const mockBoundaries = TestDataFactory.createBoundaries({
        modifiable: ['**/*.ts', 'src/**/*.js'],
        protected: []
      });
      mockStateManager.loadBoundaries.mockResolvedValue(mockBoundaries);
      FileUtils.match.mockImplementation((path: string, pattern: string) => {
        if (pattern === '**/*.ts') return path.endsWith('.ts');
        if (pattern === 'src/**/*.js') return path.startsWith('src/') && path.endsWith('.js');
        return false;
      });

      boundaryEnforcer = new BoundaryEnforcer();

      const tsResult = await boundaryEnforcer.checkFile('test/file.ts');
      expect(tsResult.allowed).toBe(true);

      const jsResult = await boundaryEnforcer.checkFile('src/utils/helper.js');
      expect(jsResult.allowed).toBe(true);
    });

    it('should handle negation patterns', async () => {
      const mockBoundaries = TestDataFactory.createBoundaries({
        modifiable: ['src/**/*', '!src/**/test/**'],
        protected: []
      });
      mockStateManager.loadBoundaries.mockResolvedValue(mockBoundaries);
      FileUtils.match.mockImplementation((path: string, pattern: string) => {
        if (pattern === '!src/**/test/**') return path.includes('/test/');
        if (pattern === 'src/**/*') return path.startsWith('src/');
        return false;
      });

      boundaryEnforcer = new BoundaryEnforcer();

      const normalResult = await boundaryEnforcer.checkFile('src/utils/file.ts');
      expect(normalResult.allowed).toBe(true);

      const testResult = await boundaryEnforcer.checkFile('src/utils/test/file.test.ts');
      expect(testResult.allowed).toBe(false);
    });
  });

  describe('Cross-platform compatibility', () => {
    it('should handle Windows paths', async () => {
      const mockBoundaries = TestDataFactory.createBoundaries({
        modifiable: ['src/**/*'],
        protected: []
      });
      mockStateManager.loadBoundaries.mockResolvedValue(mockBoundaries);
      FileUtils.match.mockReturnValue(true);

      boundaryEnforcer = new BoundaryEnforcer();
      const result = await boundaryEnforcer.checkFile('src\\utils\\file.ts');

      expect(PathUtils.toUnix).toHaveBeenCalledWith('src\\utils\\file.ts');
      expect(result.allowed).toBe(true);
    });

    it('should handle Unix paths', async () => {
      const mockBoundaries = TestDataFactory.createBoundaries({
        modifiable: ['src/**/*'],
        protected: []
      });
      mockStateManager.loadBoundaries.mockResolvedValue(mockBoundaries);
      FileUtils.match.mockReturnValue(true);

      boundaryEnforcer = new BoundaryEnforcer();
      const result = await boundaryEnforcer.checkFile('src/utils/file.ts');

      expect(result.allowed).toBe(true);
    });
  });

  describe('Edge cases', () => {
    it('should handle files with special characters', async () => {
      const mockBoundaries = TestDataFactory.createBoundaries({
        modifiable: ['src/**/*'],
        protected: []
      });
      mockStateManager.loadBoundaries.mockResolvedValue(mockBoundaries);
      FileUtils.match.mockReturnValue(true);

      boundaryEnforcer = new BoundaryEnforcer();
      const result = await boundaryEnforcer.checkFile('src/file with spaces.ts');

      expect(result.allowed).toBe(true);
    });

    it('should handle root directory paths', async () => {
      const mockBoundaries = TestDataFactory.createBoundaries({
        modifiable: ['*'],
        protected: []
      });
      mockStateManager.loadBoundaries.mockResolvedValue(mockBoundaries);
      FileUtils.match.mockReturnValue(true);

      boundaryEnforcer = new BoundaryEnforcer();
      const result = await boundaryEnforcer.checkFile('/root/file.txt');

      expect(result.allowed).toBe(true);
    });

    it('should handle relative paths', async () => {
      const mockBoundaries = TestDataFactory.createBoundaries({
        modifiable: ['./src/**/*'],
        protected: []
      });
      mockStateManager.loadBoundaries.mockResolvedValue(mockBoundaries);
      FileUtils.match.mockReturnValue(true);

      boundaryEnforcer = new BoundaryEnforcer();
      const result = await boundaryEnforcer.checkFile('./src/file.ts');

      expect(result.allowed).toBe(true);
    });
  });
});
