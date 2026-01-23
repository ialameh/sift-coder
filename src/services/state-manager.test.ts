/**
 * StateManager Service Tests
 * Tests for state management functionality
 */

import { StateManager, Feature, FeaturesState, Boundaries, CurrentTask } from './state-manager';
import { MockFileSystem, TestDataFactory } from '../utils/test-helpers';
import * as path from 'path';

// Setup path mocking for all tests - mock PathUtils class with static methods
jest.mock('../utils/path-utils.js', () => ({
  PathUtils: {
    getStateDir: jest.fn(() => '/test/project/.claude/siftcoder-state'),
    join: jest.fn((...args: string[]) => args.join('/')),
    dirname: jest.fn((p: string) => path.dirname(p)),
    basename: jest.fn((p: string, e?: string) => path.basename(p, e)),
    toUnix: jest.fn((p: string) => p.replace(/\\/g, '/'))
  }
}));

// Mock FileUtils class
jest.mock('../utils/file-utils.js', () => ({
  FileUtils: {
    mkdir: jest.fn().mockResolvedValue(undefined),
    exists: jest.fn().mockResolvedValue(true),
    readJSON: jest.fn().mockResolvedValue({}),
    writeJSON: jest.fn().mockResolvedValue(undefined),
    deleteFile: jest.fn().mockResolvedValue(undefined),
    appendFile: jest.fn().mockResolvedValue(undefined),
    match: jest.fn(),
    stat: jest.fn(),
    copyFile: jest.fn(),
    moveFile: jest.fn()
  }
}));

describe('StateManager', () => {
  let mockFs: MockFileSystem;
  let stateManager: StateManager;

  beforeEach(() => {
    jest.clearAllMocks();

    // Setup PathUtils mock
    const PathUtils = require('../utils/path-utils.js').PathUtils;
    PathUtils.getStateDir.mockReturnValue('/test/project/.claude/siftcoder-state');
    PathUtils.join.mockImplementation((...args: string[]) => args.join('/'));

    // Setup FileUtils mock
    const FileUtils = require('../utils/file-utils.js').FileUtils;
    FileUtils.mkdir.mockResolvedValue(undefined);
    FileUtils.exists.mockResolvedValue(true);
    FileUtils.readJSON.mockResolvedValue({});
    FileUtils.writeJSON.mockResolvedValue(undefined);
    FileUtils.deleteFile.mockResolvedValue(undefined);

    // Create a real mock filesystem
    mockFs = new MockFileSystem();
    mockFs.createFsPromisesMock();

    stateManager = new StateManager('/test/project');
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('constructor', () => {
    it('should initialize with project root', () => {
      expect(stateManager).toBeInstanceOf(StateManager);
    });

    it('should initialize without project root', () => {
      const sm = new StateManager();
      expect(sm).toBeInstanceOf(StateManager);
    });
  });

  describe('init', () => {
    it('should initialize state directory with default files', async () => {
      await stateManager.init();

      const FileUtils = require('../utils/file-utils.js').FileUtils;
      expect(FileUtils.mkdir).toHaveBeenCalledWith('/test/project/.claude/siftcoder-state');
      expect(FileUtils.mkdir).toHaveBeenCalledWith('/test/project/.claude/siftcoder-state/knowledge');
      expect(FileUtils.mkdir).toHaveBeenCalledWith('/test/project/.claude/siftcoder-state/checkpoints');
      expect(FileUtils.mkdir).toHaveBeenCalledWith('/test/project/.claude/siftcoder-state/diagrams');
    });

    it('should create features.json if not exists', async () => {
      const FileUtils = require('../utils/file-utils.js').FileUtils;
      (FileUtils.exists as jest.Mock).mockResolvedValue(false);

      await stateManager.init();

      const expectedFeatures: FeaturesState = {
        version: '1.0.0',
        features: {},
        queue: {
          pending: [],
          in_progress: [],
          completed: []
        }
      };

      expect(FileUtils.writeJSON).toHaveBeenCalledWith(
        '/test/project/.claude/siftcoder-state/features.json',
        expectedFeatures
      );
    });

    it('should create config.json if not exists', async () => {
      const FileUtils = require('../utils/file-utils.js').FileUtils;
      (FileUtils.exists as jest.Mock).mockResolvedValue(false);

      await stateManager.init();

      expect(FileUtils.writeJSON).toHaveBeenCalledWith(
        '/test/project/.claude/siftcoder-state/config.json',
        expect.objectContaining({
          version: '1.0.0',
          initialized_at: expect.any(String)
        })
      );
    });

    it('should create session.json if not exists', async () => {
      const FileUtils = require('../utils/file-utils.js').FileUtils;
      (FileUtils.exists as jest.Mock).mockResolvedValue(false);

      await stateManager.init();

      expect(FileUtils.writeJSON).toHaveBeenCalledWith(
        '/test/project/.claude/siftcoder-state/session.json',
        expect.objectContaining({
          id: expect.stringMatching(/^sess_\d+$/),
          created_at: expect.any(String)
        })
      );
    });

    it('should not overwrite existing files', async () => {
      const FileUtils = require('../utils/file-utils.js').FileUtils;
      (FileUtils.exists as jest.Mock).mockResolvedValue(true);

      await stateManager.init();

      expect(FileUtils.writeJSON).not.toHaveBeenCalled();
    });
  });

  describe('get', () => {
    it('should get config value', async () => {
      const FileUtils = require('../utils/file-utils.js').FileUtils;
      (FileUtils.exists as jest.Mock).mockResolvedValue(true);
      (FileUtils.readJSON as jest.Mock).mockResolvedValue({ key1: 'value1', key2: 'value2' });

      const result = await stateManager.get('key1');

      expect(result).toBe('value1');
    });

    it('should return undefined if config file does not exist', async () => {
      const FileUtils = require('../utils/file-utils.js').FileUtils;
      (FileUtils.exists as jest.Mock).mockResolvedValue(false);

      const result = await stateManager.get('key1');

      expect(result).toBeUndefined();
    });

    it('should return undefined for non-existing key', async () => {
      const FileUtils = require('../utils/file-utils.js').FileUtils;
      (FileUtils.exists as jest.Mock).mockResolvedValue(true);
      (FileUtils.readJSON as jest.Mock).mockResolvedValue({ key1: 'value1' });

      const result = await stateManager.get('nonexistent');

      expect(result).toBeUndefined();
    });
  });

  describe('set', () => {
    it('should set config value', async () => {
      const FileUtils = require('../utils/file-utils.js').FileUtils;
      (FileUtils.exists as jest.Mock).mockResolvedValue(false);

      await stateManager.set('key1', 'value1');

      expect(FileUtils.writeJSON).toHaveBeenCalledWith(
        '/test/project/.claude/siftcoder-state/config.json',
        { key1: 'value1' }
      );
    });

    it('should update existing config', async () => {
      const FileUtils = require('../utils/file-utils.js').FileUtils;
      (FileUtils.exists as jest.Mock).mockResolvedValue(true);
      (FileUtils.readJSON as jest.Mock).mockResolvedValue({ key1: 'value1' });

      await stateManager.set('key2', 'value2');

      expect(FileUtils.writeJSON).toHaveBeenCalledWith(
        '/test/project/.claude/siftcoder-state/config.json',
        { key1: 'value1', key2: 'value2' }
      );
    });

    it('should overwrite existing key', async () => {
      const FileUtils = require('../utils/file-utils.js').FileUtils;
      (FileUtils.exists as jest.Mock).mockResolvedValue(true);
      (FileUtils.readJSON as jest.Mock).mockResolvedValue({ key1: 'old_value' });

      await stateManager.set('key1', 'new_value');

      expect(FileUtils.writeJSON).toHaveBeenCalledWith(
        '/test/project/.claude/siftcoder-state/config.json',
        { key1: 'new_value' }
      );
    });
  });

  describe('loadFeatures', () => {
    it('should load features state', async () => {
      const FileUtils = require('../utils/file-utils.js').FileUtils;
      (FileUtils.exists as jest.Mock).mockResolvedValue(true);
      const mockFeatures: FeaturesState = {
        version: '1.0.0',
        features: {
          'feat-1': TestDataFactory.createFeature({ id: 'feat-1' })
        },
        queue: {
          pending: ['feat-1'],
          in_progress: [],
          completed: []
        }
      };
      (FileUtils.readJSON as jest.Mock).mockResolvedValue(mockFeatures);

      const result = await stateManager.loadFeatures();

      expect(result).toEqual(mockFeatures);
    });

    it('should initialize if features.json does not exist', async () => {
      const FileUtils = require('../utils/file-utils.js').FileUtils;
      (FileUtils.exists as jest.Mock).mockResolvedValue(false);
      (FileUtils.mkdir as jest.Mock).mockResolvedValue(undefined);
      (FileUtils.writeJSON as jest.Mock).mockResolvedValue(undefined);
      (FileUtils.readJSON as jest.Mock).mockImplementation((path: string) => {
        if (path.includes('features.json')) {
          return { version: '1.0.0', features: {}, queue: { pending: [], in_progress: [], completed: [] } };
        }
        return {};
      });

      const result = await stateManager.loadFeatures();

      expect(result.version).toBe('1.0.0');
      expect(result.features).toEqual({});
    });
  });

  describe('saveFeatures', () => {
    it('should save features state', async () => {
      const FileUtils = require('../utils/file-utils.js').FileUtils;
      const mockFeatures: FeaturesState = {
        version: '1.0.0',
        features: {},
        queue: { pending: [], in_progress: [], completed: [] }
      };

      await stateManager.saveFeatures(mockFeatures);

      expect(FileUtils.writeJSON).toHaveBeenCalledWith(
        '/test/project/.claude/siftcoder-state/features.json',
        mockFeatures
      );
    });
  });

  describe('addFeature', () => {
    it('should add feature and return id', async () => {
      const FileUtils = require('../utils/file-utils.js').FileUtils;
      (FileUtils.readJSON as jest.Mock).mockResolvedValue({
        version: '1.0.0',
        features: {},
        queue: { pending: [], in_progress: [], completed: [] }
      });

      const featureId = await stateManager.addFeature({
        name: 'Test Feature',
        description: 'A test feature',
        status: 'pending'
      });

      expect(featureId).toMatch(/^feat-\d+$/);
    });

    it('should set created_at and updated_at timestamps', async () => {
      const FileUtils = require('../utils/file-utils.js').FileUtils;
      (FileUtils.readJSON as jest.Mock).mockResolvedValue({
        version: '1.0.0',
        features: {},
        queue: { pending: [], in_progress: [], completed: [] }
      });

      await stateManager.addFeature({
        name: 'Test',
        description: 'Test',
        status: 'pending'
      });

      const savedCall = (FileUtils.writeJSON as jest.Mock).mock.calls[0];
      const feature = Object.values(savedCall[1].features)[0] as any;
      expect(feature.created_at).toBeTruthy();
      expect(feature.updated_at).toBeTruthy();
    });
  });

  describe('completeFeature', () => {
    it('should mark feature as complete', async () => {
      const FileUtils = require('../utils/file-utils.js').FileUtils;
      const feature = TestDataFactory.createFeature({ id: 'feat-1', status: 'in_progress' });
      (FileUtils.readJSON as jest.Mock).mockResolvedValue({
        version: '1.0.0',
        features: { 'feat-1': feature },
        queue: { pending: [], in_progress: ['feat-1'], completed: [] }
      });

      await stateManager.completeFeature('feat-1');

      const savedCall = (FileUtils.writeJSON as jest.Mock).mock.calls[0];
      expect(savedCall[1].features['feat-1'].status).toBe('completed');
    });

    it('should throw error for non-existing feature', async () => {
      const FileUtils = require('../utils/file-utils.js').FileUtils;
      (FileUtils.readJSON as jest.Mock).mockResolvedValue({
        version: '1.0.0',
        features: {},
        queue: { pending: [], in_progress: [], completed: [] }
      });

      await expect(stateManager.completeFeature('nonexistent')).rejects.toThrow('Feature not found');
    });

    it('should update updated_at timestamp', async () => {
      const FileUtils = require('../utils/file-utils.js').FileUtils;
      const feature = TestDataFactory.createFeature({ id: 'feat-1' });
      (FileUtils.readJSON as jest.Mock).mockResolvedValue({
        version: '1.0.0',
        features: { 'feat-1': feature },
        queue: { pending: [], in_progress: ['feat-1'], completed: [] }
      });

      await stateManager.completeFeature('feat-1');

      const savedCall = (FileUtils.writeJSON as jest.Mock).mock.calls[0];
      const completedFeature = savedCall[1].features['feat-1'];
      expect(completedFeature.updated_at).toBeTruthy();
    });
  });

  describe('startFeature', () => {
    it('should start working on a feature', async () => {
      const FileUtils = require('../utils/file-utils.js').FileUtils;
      const feature = TestDataFactory.createFeature({ id: 'feat-1', status: 'pending' });
      (FileUtils.readJSON as jest.Mock).mockResolvedValue({
        version: '1.0.0',
        features: { 'feat-1': feature },
        queue: { pending: ['feat-1'], in_progress: [], completed: [] }
      });

      await stateManager.startFeature('feat-1');

      const savedCall = (FileUtils.writeJSON as jest.Mock).mock.calls[0];
      expect(savedCall[1].features['feat-1'].status).toBe('in_progress');
    });

    it('should throw error for non-existing feature', async () => {
      const FileUtils = require('../utils/file-utils.js').FileUtils;
      (FileUtils.readJSON as jest.Mock).mockResolvedValue({
        version: '1.0.0',
        features: {},
        queue: { pending: [], in_progress: [], completed: [] }
      });

      await expect(stateManager.startFeature('nonexistent')).rejects.toThrow('Feature not found');
    });
  });

  describe('loadCurrentTask', () => {
    it('should load current task', async () => {
      const FileUtils = require('../utils/file-utils.js').FileUtils;
      const mockTask = TestDataFactory.createCurrentTask();
      (FileUtils.exists as jest.Mock).mockResolvedValue(true);
      (FileUtils.readJSON as jest.Mock).mockResolvedValue(mockTask);

      const result = await stateManager.loadCurrentTask();

      expect(result).toEqual(mockTask);
    });

    it('should return null if task file does not exist', async () => {
      const FileUtils = require('../utils/file-utils.js').FileUtils;
      (FileUtils.exists as jest.Mock).mockResolvedValue(false);

      const result = await stateManager.loadCurrentTask();

      expect(result).toBeNull();
    });
  });

  describe('saveCurrentTask', () => {
    it('should save current task', async () => {
      const FileUtils = require('../utils/file-utils.js').FileUtils;
      const mockTask = TestDataFactory.createCurrentTask();

      await stateManager.saveCurrentTask(mockTask);

      expect(FileUtils.writeJSON).toHaveBeenCalledWith(
        '/test/project/.claude/siftcoder-state/current-task.json',
        expect.objectContaining({
          ...mockTask,
          updated_at: expect.any(String)
        })
      );
    });
  });

  describe('startTask', () => {
    it('should start new task', async () => {
      const FileUtils = require('../utils/file-utils.js').FileUtils;
      await stateManager.startTask('build', 'feat-1');

      expect(FileUtils.writeJSON).toHaveBeenCalledWith(
        '/test/project/.claude/siftcoder-state/current-task.json',
        expect.objectContaining({
          feature: 'feat-1',
          workflow_phase: 'PLANNING',
          iteration: 1
        })
      );
    });
  });

  describe('completeTask', () => {
    it('should delete current task file', async () => {
      const FileUtils = require('../utils/file-utils.js').FileUtils;
      (FileUtils.exists as jest.Mock).mockResolvedValue(true);

      await stateManager.completeTask();

      expect(FileUtils.deleteFile).toHaveBeenCalledWith('/test/project/.claude/siftcoder-state/current-task.json');
    });

    it('should handle missing task file', async () => {
      const FileUtils = require('../utils/file-utils.js').FileUtils;
      (FileUtils.exists as jest.Mock).mockResolvedValue(false);

      await expect(stateManager.completeTask()).resolves.not.toThrow();
    });
  });

  describe('loadBoundaries', () => {
    it('should load boundaries', async () => {
      const FileUtils = require('../utils/file-utils.js').FileUtils;
      const mockBoundaries = TestDataFactory.createBoundaries();
      (FileUtils.exists as jest.Mock).mockResolvedValue(true);
      (FileUtils.readJSON as jest.Mock).mockResolvedValue(mockBoundaries);

      const result = await stateManager.loadBoundaries();

      expect(result).toEqual(mockBoundaries);
    });

    it('should return null if boundaries file does not exist', async () => {
      const FileUtils = require('../utils/file-utils.js').FileUtils;
      (FileUtils.exists as jest.Mock).mockResolvedValue(false);

      const result = await stateManager.loadBoundaries();

      expect(result).toBeNull();
    });
  });

  describe('saveBoundaries', () => {
    it('should save boundaries with timestamp', async () => {
      const FileUtils = require('../utils/file-utils.js').FileUtils;
      const mockBoundaries = TestDataFactory.createBoundaries();

      await stateManager.saveBoundaries(mockBoundaries);

      expect(FileUtils.writeJSON).toHaveBeenCalledWith(
        '/test/project/.claude/siftcoder-state/boundaries.json',
        expect.objectContaining({
          ...mockBoundaries,
          last_check: expect.any(String)
        })
      );
    });
  });

  describe('log', () => {
    it('should log event to implementation log', async () => {
      const FileUtils = require('../utils/file-utils.js').FileUtils;
      await stateManager.log('test_event', { key: 'value' });

      expect(FileUtils.appendFile).toHaveBeenCalledWith(
        '/test/project/.claude/siftcoder-state/implementation-log.jsonl',
        expect.stringContaining('"event":"test_event"')
      );
    });

    it('should include timestamp in log entry', async () => {
      const FileUtils = require('../utils/file-utils.js').FileUtils;
      await stateManager.log('event', {});

      const logEntry = (FileUtils.appendFile as jest.Mock).mock.calls[0][1] as string;
      expect(logEntry).toContain('"timestamp"');
    });
  });

  describe('getStateDir', () => {
    it('should return state directory path', () => {
      const result = stateManager.getStateDir();

      expect(result).toBe('/test/project/.claude/siftcoder-state');
    });
  });

  describe('Error handling', () => {
    it('should handle file system errors gracefully', async () => {
      const FileUtils = require('../utils/file-utils.js').FileUtils;
      (FileUtils.mkdir as jest.Mock).mockRejectedValue(new Error('Permission denied'));

      await expect(stateManager.init()).rejects.toThrow();
    });

    it('should handle JSON parse errors', async () => {
      const FileUtils = require('../utils/file-utils.js').FileUtils;
      (FileUtils.exists as jest.Mock).mockResolvedValue(true);
      (FileUtils.readJSON as jest.Mock).mockRejectedValue(new Error('Invalid JSON'));

      await expect(stateManager.loadFeatures()).rejects.toThrow();
    });
  });
});
