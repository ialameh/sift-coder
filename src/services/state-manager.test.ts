/**
 * StateManager Service Tests
 * Tests for state management functionality
 */

import { StateManager, Feature, FeaturesState, Boundaries, CurrentTask } from './state-manager';
import { MockFileSystem, TestDataFactory, flushPromises } from '../utils/test-helpers';

// Mock dependencies
jest.mock('../utils/file-utils.js');
jest.mock('../utils/path-utils.js');

const FileUtils = require('../utils/file-utils.js');
const PathUtils = require('../utils/path-utils.js');

describe('StateManager', () => {
  let mockFs: MockFileSystem;
  let stateManager: StateManager;

  beforeEach(() => {
    mockFs = new MockFileSystem();
    mockFs.createFsPromisesMock();

    // Mock PathUtils
    PathUtils.getStateDir = jest.fn(() => '/test/project/.claude/siftcoder-state');
    PathUtils.join = jest.fn((...args: string[]) => args.join('/'));
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('constructor', () => {
    it('should initialize with project root', () => {
      stateManager = new StateManager('/test/project');

      expect(stateManager).toBeInstanceOf(StateManager);
    });

    it('should initialize without project root', () => {
      stateManager = new StateManager();

      expect(stateManager).toBeInstanceOf(StateManager);
    });
  });

  describe('init', () => {
    it('should initialize state directory with default files', async () => {
      stateManager = new StateManager('/test/project');

      await stateManager.init();

      expect(FileUtils.mkdir).toHaveBeenCalledWith('/test/project/.claude/siftcoder-state');
      expect(FileUtils.mkdir).toHaveBeenCalledWith('/test/project/.claude/siftcoder-state/knowledge');
      expect(FileUtils.mkdir).toHaveBeenCalledWith('/test/project/.claude/siftcoder-state/checkpoints');
      expect(FileUtils.mkdir).toHaveBeenCalledWith('/test/project/.claude/siftcoder-state/diagrams');
    });

    it('should create features.json if not exists', async () => {
      stateManager = new StateManager('/test/project');
      FileUtils.exists = jest.fn().mockResolvedValue(false);
      FileUtils.writeJSON = jest.fn().mockResolvedValue(undefined);

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
      stateManager = new StateManager('/test/project');
      FileUtils.exists = jest.fn().mockResolvedValue(false);
      FileUtils.writeJSON = jest.fn().mockResolvedValue(undefined);

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
      stateManager = new StateManager('/test/project');
      FileUtils.exists = jest.fn().mockResolvedValue(false);
      FileUtils.writeJSON = jest.fn().mockResolvedValue(undefined);

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
      stateManager = new StateManager('/test/project');
      FileUtils.exists = jest.fn().mockResolvedValue(true);

      await stateManager.init();

      expect(FileUtils.writeJSON).not.toHaveBeenCalled();
    });
  });

  describe('get', () => {
    it('should get config value', async () => {
      stateManager = new StateManager('/test/project');
      FileUtils.exists = jest.fn().mockResolvedValue(true);
      FileUtils.readJSON = jest.fn().mockResolvedValue({ key1: 'value1', key2: 'value2' });

      const result = await stateManager.get('key1');

      expect(result).toBe('value1');
    });

    it('should return undefined if config file does not exist', async () => {
      stateManager = new StateManager('/test/project');
      FileUtils.exists = jest.fn().mockResolvedValue(false);

      const result = await stateManager.get('key1');

      expect(result).toBeUndefined();
    });

    it('should return undefined for non-existing key', async () => {
      stateManager = new StateManager('/test/project');
      FileUtils.exists = jest.fn().mockResolvedValue(true);
      FileUtils.readJSON = jest.fn().mockResolvedValue({ key1: 'value1' });

      const result = await stateManager.get('nonexistent');

      expect(result).toBeUndefined();
    });
  });

  describe('set', () => {
    it('should set config value', async () => {
      stateManager = new StateManager('/test/project');
      FileUtils.exists = jest.fn().mockResolvedValue(false);
      FileUtils.writeJSON = jest.fn().mockResolvedValue(undefined);

      await stateManager.set('key1', 'value1');

      expect(FileUtils.writeJSON).toHaveBeenCalledWith(
        '/test/project/.claude/siftcoder-state/config.json',
        { key1: 'value1' }
      );
    });

    it('should update existing config', async () => {
      stateManager = new StateManager('/test/project');
      FileUtils.exists = jest.fn().mockResolvedValue(true);
      FileUtils.readJSON = jest.fn().mockResolvedValue({ key1: 'value1' });
      FileUtils.writeJSON = jest.fn().mockResolvedValue(undefined);

      await stateManager.set('key2', 'value2');

      expect(FileUtils.writeJSON).toHaveBeenCalledWith(
        '/test/project/.claude/siftcoder-state/config.json',
        { key1: 'value1', key2: 'value2' }
      );
    });

    it('should overwrite existing key', async () => {
      stateManager = new StateManager('/test/project');
      FileUtils.exists = jest.fn().mockResolvedValue(true);
      FileUtils.readJSON = jest.fn().mockResolvedValue({ key1: 'old_value' });
      FileUtils.writeJSON = jest.fn().mockResolvedValue(undefined);

      await stateManager.set('key1', 'new_value');

      expect(FileUtils.writeJSON).toHaveBeenCalledWith(
        '/test/project/.claude/siftcoder-state/config.json',
        { key1: 'new_value' }
      );
    });
  });

  describe('loadFeatures', () => {
    it('should load features state', async () => {
      stateManager = new StateManager('/test/project');
      FileUtils.exists = jest.fn().mockResolvedValue(true);
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
      FileUtils.readJSON = jest.fn().mockResolvedValue(mockFeatures);

      const result = await stateManager.loadFeatures();

      expect(result).toEqual(mockFeatures);
    });

    it('should initialize if features.json does not exist', async () => {
      stateManager = new StateManager('/test/project');
      FileUtils.exists = jest.fn().mockResolvedValue(false);
      FileUtils.mkdir = jest.fn().mockResolvedValue(undefined);
      FileUtils.writeJSON = jest.fn().mockResolvedValue(undefined);
      FileUtils.readJSON = jest.fn().mockImplementation((path: string) => {
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
      stateManager = new StateManager('/test/project');
      FileUtils.writeJSON = jest.fn().mockResolvedValue(undefined);

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
      stateManager = new StateManager('/test/project');
      const mockFeatures: FeaturesState = {
        version: '1.0.0',
        features: {},
        queue: { pending: [], in_progress: [], completed: [] }
      };
      FileUtils.readJSON = jest.fn().mockResolvedValue(mockFeatures);
      FileUtils.writeJSON = jest.fn().mockResolvedValue(undefined);

      const featureId = await stateManager.addFeature({
        name: 'Test Feature',
        description: 'A test feature',
        status: 'pending'
      });

      expect(featureId).toMatch(/^feat-\d+$/);

      const savedCall = FileUtils.writeJSON.mock.calls[0][1] as FeaturesState;
      expect(savedCall.features[featureId]).toBeDefined();
      expect(savedCall.queue.pending).toContain(featureId);
    });

    it('should set created_at and updated_at timestamps', async () => {
      stateManager = new StateManager('/test/project');
      const mockFeatures: FeaturesState = {
        version: '1.0.0',
        features: {},
        queue: { pending: [], in_progress: [], completed: [] }
      };
      FileUtils.readJSON = jest.fn().mockResolvedValue(mockFeatures);
      FileUtils.writeJSON = jest.fn().mockResolvedValue(undefined);

      await stateManager.addFeature({
        name: 'Test',
        description: 'Test',
        status: 'pending'
      });

      const savedCall = FileUtils.writeJSON.mock.calls[0][1] as FeaturesState;
      const feature = Object.values(savedCall.features)[0] as Feature;
      expect(feature.created_at).toBeTruthy();
      expect(feature.updated_at).toBeTruthy();
    });
  });

  describe('completeFeature', () => {
    it('should mark feature as complete', async () => {
      stateManager = new StateManager('/test/project');
      const feature = TestDataFactory.createFeature({ id: 'feat-1', status: 'in_progress' });
      const mockFeatures: FeaturesState = {
        version: '1.0.0',
        features: { 'feat-1': feature },
        queue: { pending: [], in_progress: ['feat-1'], completed: [] }
      };
      FileUtils.readJSON = jest.fn().mockResolvedValue(mockFeatures);
      FileUtils.writeJSON = jest.fn().mockResolvedValue(undefined);

      await stateManager.completeFeature('feat-1');

      const savedCall = FileUtils.writeJSON.mock.calls[0][1] as FeaturesState;
      expect(savedCall.features['feat-1'].status).toBe('completed');
      expect(savedCall.queue.in_progress).not.toContain('feat-1');
      expect(savedCall.queue.completed).toContain('feat-1');
    });

    it('should throw error for non-existing feature', async () => {
      stateManager = new StateManager('/test/project');
      const mockFeatures: FeaturesState = {
        version: '1.0.0',
        features: {},
        queue: { pending: [], in_progress: [], completed: [] }
      };
      FileUtils.readJSON = jest.fn().mockResolvedValue(mockFeatures);

      await expect(stateManager.completeFeature('nonexistent')).rejects.toThrow('Feature not found');
    });

    it('should update updated_at timestamp', async () => {
      stateManager = new StateManager('/test/project');
      const feature = TestDataFactory.createFeature({ id: 'feat-1' });
      const mockFeatures: FeaturesState = {
        version: '1.0.0',
        features: { 'feat-1': feature },
        queue: { pending: [], in_progress: ['feat-1'], completed: [] }
      };
      FileUtils.readJSON = jest.fn().mockResolvedValue(mockFeatures);
      FileUtils.writeJSON = jest.fn().mockResolvedValue(undefined);

      await stateManager.completeFeature('feat-1');

      const savedCall = FileUtils.writeJSON.mock.calls[0][1] as FeaturesState;
      const completedFeature = savedCall.features['feat-1'] as Feature;
      expect(completedFeature.updated_at).toBeTruthy();
    });
  });

  describe('startFeature', () => {
    it('should start working on a feature', async () => {
      stateManager = new StateManager('/test/project');
      const feature = TestDataFactory.createFeature({ id: 'feat-1', status: 'pending' });
      const mockFeatures: FeaturesState = {
        version: '1.0.0',
        features: { 'feat-1': feature },
        queue: { pending: ['feat-1'], in_progress: [], completed: [] }
      };
      FileUtils.readJSON = jest.fn().mockResolvedValue(mockFeatures);
      FileUtils.writeJSON = jest.fn().mockResolvedValue(undefined);

      await stateManager.startFeature('feat-1');

      const savedCall = FileUtils.writeJSON.mock.calls[0][1] as FeaturesState;
      expect(savedCall.features['feat-1'].status).toBe('in_progress');
      expect(savedCall.queue.pending).not.toContain('feat-1');
      expect(savedCall.queue.in_progress).toContain('feat-1');
    });

    it('should throw error for non-existing feature', async () => {
      stateManager = new StateManager('/test/project');
      const mockFeatures: FeaturesState = {
        version: '1.0.0',
        features: {},
        queue: { pending: [], in_progress: [], completed: [] }
      };
      FileUtils.readJSON = jest.fn().mockResolvedValue(mockFeatures);

      await expect(stateManager.startFeature('nonexistent')).rejects.toThrow('Feature not found');
    });
  });

  describe('loadCurrentTask', () => {
    it('should load current task', async () => {
      stateManager = new StateManager('/test/project');
      FileUtils.exists = jest.fn().mockResolvedValue(true);
      const mockTask = TestDataFactory.createCurrentTask();
      FileUtils.readJSON = jest.fn().mockResolvedValue(mockTask);

      const result = await stateManager.loadCurrentTask();

      expect(result).toEqual(mockTask);
    });

    it('should return null if task file does not exist', async () => {
      stateManager = new StateManager('/test/project');
      FileUtils.exists = jest.fn().mockResolvedValue(false);

      const result = await stateManager.loadCurrentTask();

      expect(result).toBeNull();
    });
  });

  describe('saveCurrentTask', () => {
    it('should save current task', async () => {
      stateManager = new StateManager('/test/project');
      FileUtils.writeJSON = jest.fn().mockResolvedValue(undefined);

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
      stateManager = new StateManager('/test/project');
      FileUtils.writeJSON = jest.fn().mockResolvedValue(undefined);

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
      stateManager = new StateManager('/test/project');
      FileUtils.exists = jest.fn().mockResolvedValue(true);
      FileUtils.deleteFile = jest.fn().mockResolvedValue(undefined);

      await stateManager.completeTask();

      expect(FileUtils.deleteFile).toHaveBeenCalledWith('/test/project/.claude/siftcoder-state/current-task.json');
    });

    it('should handle missing task file', async () => {
      stateManager = new StateManager('/test/project');
      FileUtils.exists = jest.fn().mockResolvedValue(false);

      await expect(stateManager.completeTask()).resolves.not.toThrow();
    });
  });

  describe('loadBoundaries', () => {
    it('should load boundaries', async () => {
      stateManager = new StateManager('/test/project');
      FileUtils.exists = jest.fn().mockResolvedValue(true);
      const mockBoundaries = TestDataFactory.createBoundaries();
      FileUtils.readJSON = jest.fn().mockResolvedValue(mockBoundaries);

      const result = await stateManager.loadBoundaries();

      expect(result).toEqual(mockBoundaries);
    });

    it('should return null if boundaries file does not exist', async () => {
      stateManager = new StateManager('/test/project');
      FileUtils.exists = jest.fn().mockResolvedValue(false);

      const result = await stateManager.loadBoundaries();

      expect(result).toBeNull();
    });
  });

  describe('saveBoundaries', () => {
    it('should save boundaries with timestamp', async () => {
      stateManager = new StateManager('/test/project');
      FileUtils.writeJSON = jest.fn().mockResolvedValue(undefined);

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
      stateManager = new StateManager('/test/project');
      FileUtils.appendFile = jest.fn().mockResolvedValue(undefined);

      await stateManager.log('test_event', { key: 'value' });

      expect(FileUtils.appendFile).toHaveBeenCalledWith(
        '/test/project/.claude/siftcoder-state/implementation-log.jsonl',
        expect.stringContaining('"event":"test_event"')
      );
    });

    it('should include timestamp in log entry', async () => {
      stateManager = new StateManager('/test/project');
      FileUtils.appendFile = jest.fn().mockResolvedValue(undefined);

      await stateManager.log('event', {});

      const logEntry = FileUtils.appendFile.mock.calls[0][1] as string;
      expect(logEntry).toContain('"timestamp"');
    });
  });

  describe('getStateDir', () => {
    it('should return state directory path', () => {
      stateManager = new StateManager('/test/project');

      const result = stateManager.getStateDir();

      expect(result).toBe('/test/project/.claude/siftcoder-state');
    });
  });

  describe('Error handling', () => {
    it('should handle file system errors gracefully', async () => {
      stateManager = new StateManager('/test/project');
      FileUtils.mkdir = jest.fn().mockRejectedValue(new Error('Permission denied'));

      await expect(stateManager.init()).rejects.toThrow();
    });

    it('should handle JSON parse errors', async () => {
      stateManager = new StateManager('/test/project');
      FileUtils.exists = jest.fn().mockResolvedValue(true);
      FileUtils.readJSON = jest.fn().mockRejectedValue(new Error('Invalid JSON'));

      await expect(stateManager.loadFeatures()).rejects.toThrow();
    });
  });
});
