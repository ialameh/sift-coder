/**
 * HookManager Tests
 * Tests for session-start and post-tool-use hooks
 */

import { HookManager, HookContext } from './hook-manager';
import { MockFileSystem, TestDataFactory } from '../utils/test-helpers';

// Mock StateManager with class structure
jest.mock('../services/state-manager.js', () => ({
  StateManager: jest.fn().mockImplementation(() => ({
    init: jest.fn().mockResolvedValue(undefined),
    getStateDir: jest.fn(() => '/test/state'),
    loadCurrentTask: jest.fn().mockResolvedValue(null),
    log: jest.fn().mockResolvedValue(undefined),
    get: jest.fn(),
    set: jest.fn(),
    loadFeatures: jest.fn(),
    saveFeatures: jest.fn(),
    loadCurrentTask: jest.fn(),
    saveCurrentTask: jest.fn(),
    loadBoundaries: jest.fn(),
    saveBoundaries: jest.fn()
  }))
}));

// Mock PathUtils with class structure
jest.mock('../utils/path-utils.js', () => ({
  PathUtils: {
    join: jest.fn((...args: string[]) => args.join('/')),
    getStateDir: jest.fn(() => '/test/state')
  }
}));

const StateManager = require('../services/state-manager.js').StateManager;

describe('HookManager', () => {
  let hookManager: HookManager;
  let mockStateManager: any;

  beforeEach(() => {
    // Create mock StateManager
    mockStateManager = {
      init: jest.fn().mockResolvedValue(undefined),
      getStateDir: jest.fn(() => '/test/state'),
      loadCurrentTask: jest.fn().mockResolvedValue(null),
      log: jest.fn().mockResolvedValue(undefined)
    };

    StateManager.mockImplementation(() => mockStateManager);

    // Mock PathUtils
    PathUtils.join = jest.fn((...args: string[]) => args.join('/'));
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('constructor', () => {
    it('should initialize with project root', () => {
      hookManager = new HookManager('/test/project');

      expect(hookManager).toBeInstanceOf(HookManager);
      expect(StateManager).toHaveBeenCalledWith('/test/project');
    });

    it('should initialize without project root', () => {
      hookManager = new HookManager();

      expect(hookManager).toBeInstanceOf(HookManager);
      expect(StateManager).toHaveBeenCalledWith(undefined);
    });
  });

  describe('onSessionStart', () => {
    it('should initialize state directory', async () => {
      hookManager = new HookManager('/test/project');

      await hookManager.onSessionStart();

      expect(mockStateManager.init).toHaveBeenCalled();
    });

    it('should create session file if not exists', async () => {
      hookManager = new HookManager('/test/project');
      FileUtils.exists = jest.fn().mockResolvedValue(false);
      FileUtils.writeJSON = jest.fn().mockResolvedValue(undefined);
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();

      await hookManager.onSessionStart();

      expect(FileUtils.writeJSON).toHaveBeenCalledWith(
        '/test/state/session.json',
        expect.objectContaining({
          id: expect.stringMatching(/^sess_\d+$/),
          created_at: expect.any(String)
        })
      );

      consoleErrorSpy.mockRestore();
    });

    it('should load existing session', async () => {
      hookManager = new HookManager('/test/project');
      FileUtils.exists = jest.fn().mockResolvedValue(true);
      FileUtils.readJSON = jest.fn().mockResolvedValue({
        id: 'sess_123',
        created_at: '2024-01-01T00:00:00.000Z'
      });
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();

      await hookManager.onSessionStart();

      expect(FileUtils.readJSON).toHaveBeenCalledWith('/test/state/session.json');

      consoleErrorSpy.mockRestore();
    });

    it('should log session start event', async () => {
      hookManager = new HookManager('/test/project');
      FileUtils.exists = jest.fn().mockResolvedValue(false);
      FileUtils.writeJSON = jest.fn().mockResolvedValue(undefined);
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();

      await hookManager.onSessionStart();

      expect(mockStateManager.log).toHaveBeenCalledWith(
        'session_start',
        expect.objectContaining({
          session_id: expect.stringMatching(/^sess_\d+$/),
          timestamp: expect.any(String)
        })
      );

      consoleErrorSpy.mockRestore();
    });

    it('should log session initialized message', async () => {
      hookManager = new HookManager('/test/project');
      FileUtils.exists = jest.fn().mockResolvedValue(false);
      FileUtils.writeJSON = jest.fn().mockResolvedValue(undefined);
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();

      await hookManager.onSessionStart();

      // Check that console.error was called with session initialized message
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        expect.stringContaining('Session initialized')
      );

      consoleErrorSpy.mockRestore();
    });

    it('should handle init errors gracefully', async () => {
      hookManager = new HookManager('/test/project');
      mockStateManager.init.mockRejectedValue(new Error('Init failed'));
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();

      await expect(hookManager.onSessionStart()).resolves.not.toThrow();

      expect(consoleErrorSpy).toHaveBeenCalledWith(
        expect.stringContaining('Session start hook failed')
      );

      consoleErrorSpy.mockRestore();
    });
  });

  describe('onPostToolUse', () => {
    it('should capture observations for capturable tools', async () => {
      hookManager = new HookManager('/test/project');

      const context: HookContext = {
        toolName: 'Read',
        toolInput: { file_path: 'test.ts' },
        sessionId: 'sess-123',
        agent: 'planner'
      };

      await hookManager.onPostToolUse(context);

      expect(mockStateManager.log).toHaveBeenCalledWith(
        'tool_use',
        expect.objectContaining({
          tool: 'Read',
          agent: 'planner',
          timestamp: expect.any(String)
        })
      );
    });

    it('should skip non-capturable tools', async () => {
      hookManager = new HookManager('/test/project');

      const context: HookContext = {
        toolName: 'NonCapturableTool',
        toolInput: {}
      };

      await hookManager.onPostToolUse(context);

      expect(mockStateManager.log).not.toHaveBeenCalled();
    });

    it('should include workflow context in observations', async () => {
      hookManager = new HookManager('/test/project');
      mockStateManager.loadCurrentTask = jest.fn().mockResolvedValue({
        feature: 'feat-1',
        workflow_phase: 'CODING',
        agent: 'coder'
      });

      const context: HookContext = {
        toolName: 'Write',
        toolInput: {}
      };

      await hookManager.onPostToolUse(context);

      expect(mockStateManager.log).toHaveBeenCalledWith(
        'tool_use',
        expect.objectContaining({
          tool: 'Write',
          agent: 'coder',
          feature: 'feat-1',
          workflow_phase: 'CODING'
        })
      );
    });

    it('should handle missing current task gracefully', async () => {
      hookManager = new HookManager('/test/project');
      mockStateManager.loadCurrentTask = jest.fn().mockResolvedValue(null);

      const context: HookContext = {
        toolName: 'Edit',
        toolInput: {}
      };

      await hookManager.onPostToolUse(context);

      expect(mockStateManager.log).toHaveBeenCalledWith(
        'tool_use',
        expect.objectContaining({
          tool: 'Edit',
          agent: 'unknown'
        })
      );
    });

    it('should use context agent if available', async () => {
      hookManager = new HookManager('/test/project');
      mockStateManager.loadCurrentTask = jest.fn().mockResolvedValue({
        agent: 'planner'
      });

      const context: HookContext = {
        toolName: 'Bash',
        toolInput: {},
        agent: 'custom-agent'
      };

      await hookManager.onPostToolUse(context);

      expect(mockStateManager.log).toHaveBeenCalledWith(
        'tool_use',
        expect.objectContaining({
          agent: 'custom-agent'
        })
      );
    });

    it('should capture all capturable tools', async () => {
      hookManager = new HookManager('/test/project');

      const capturableTools = ['Read', 'Write', 'Edit', 'Bash', 'Grep', 'Glob'];

      for (const tool of capturableTools) {
        await hookManager.onPostToolUse({ toolName: tool, toolInput: {} });
      }

      expect(mockStateManager.log).toHaveBeenCalledTimes(6);
    });

    it('should handle log errors silently', async () => {
      hookManager = new HookManager('/test/project');
      mockStateManager.log.mockRejectedValue(new Error('Log failed'));
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();

      const context: HookContext = {
        toolName: 'Read',
        toolInput: {}
      };

      await expect(hookManager.onPostToolUse(context)).resolves.not.toThrow();

      expect(consoleErrorSpy).toHaveBeenCalledWith(
        expect.stringContaining('Observation capture failed')
      );

      consoleErrorSpy.mockRestore();
    });

    it('should handle missing toolName gracefully', async () => {
      hookManager = new HookManager('/test/project');

      const context: HookContext = {
        toolInput: {}
      };

      await hookManager.onPostToolUse(context);

      expect(mockStateManager.log).not.toHaveBeenCalled();
    });
  });

  describe('registerHooks', () => {
    it('should initialize state directory', async () => {
      hookManager = new HookManager('/test/project');

      await hookManager.registerHooks();

      expect(mockStateManager.init).toHaveBeenCalled();
    });
  });

  describe('Capturable tools list', () => {
    it('should include Read tool', async () => {
      hookManager = new HookManager('/test/project');

      await hookManager.onPostToolUse({ toolName: 'Read', toolInput: {} });

      expect(mockStateManager.log).toHaveBeenCalled();
    });

    it('should include Write tool', async () => {
      hookManager = new HookManager('/test/project');

      await hookManager.onPostToolUse({ toolName: 'Write', toolInput: {} });

      expect(mockStateManager.log).toHaveBeenCalled();
    });

    it('should include Edit tool', async () => {
      hookManager = new HookManager('/test/project');

      await hookManager.onPostToolUse({ toolName: 'Edit', toolInput: {} });

      expect(mockStateManager.log).toHaveBeenCalled();
    });

    it('should include Bash tool', async () => {
      hookManager = new HookManager('/test/project');

      await hookManager.onPostToolUse({ toolName: 'Bash', toolInput: {} });

      expect(mockStateManager.log).toHaveBeenCalled();
    });

    it('should include Grep tool', async () => {
      hookManager = new HookManager('/test/project');

      await hookManager.onPostToolUse({ toolName: 'Grep', toolInput: {} });

      expect(mockStateManager.log).toHaveBeenCalled();
    });

    it('should include Glob tool', async () => {
      hookManager = new HookManager('/test/project');

      await hookManager.onPostToolUse({ toolName: 'Glob', toolInput: {} });

      expect(mockStateManager.log).toHaveBeenCalled();
    });

    it('should not include other tools', async () => {
      hookManager = new HookManager('/test/project');

      await hookManager.onPostToolUse({ toolName: 'Task', toolInput: {} });

      expect(mockStateManager.log).not.toHaveBeenCalled();
    });
  });

  describe('Error handling', () => {
    it('should continue on session file read error', async () => {
      hookManager = new HookManager('/test/project');
      FileUtils.exists = jest.fn().mockResolvedValue(true);
      FileUtils.readJSON = jest.fn().mockRejectedValue(new Error('Read failed'));
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();

      await expect(hookManager.onSessionStart()).resolves.not.toThrow();

      consoleErrorSpy.mockRestore();
    });

    it('should continue on session file write error', async () => {
      hookManager = new HookManager('/test/project');
      FileUtils.exists = jest.fn().mockResolvedValue(false);
      FileUtils.writeJSON = jest.fn().mockRejectedValue(new Error('Write failed'));
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();

      await expect(hookManager.onSessionStart()).resolves.not.toThrow();

      consoleErrorSpy.mockRestore();
    });

    it('should handle state manager init failure', async () => {
      hookManager = new HookManager('/test/project');
      mockStateManager.init.mockRejectedValue(new Error('State init failed'));
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();

      await expect(hookManager.onSessionStart()).resolves.not.toThrow();

      expect(consoleErrorSpy).toHaveBeenCalledWith(
        expect.stringContaining('Session start hook failed')
      );

      consoleErrorSpy.mockRestore();
    });
  });

  describe('Edge cases', () => {
    it('should handle empty tool input', async () => {
      hookManager = new HookManager('/test/project');

      const context: HookContext = {
        toolName: 'Read',
        toolInput: undefined
      };

      await expect(hookManager.onPostToolUse(context)).resolves.not.toThrow();
    });

    it('should handle session ID generation', async () => {
      hookManager = new HookManager('/test/project');
      FileUtils.exists = jest.fn().mockResolvedValue(false);
      FileUtils.writeJSON = jest.fn().mockResolvedValue(undefined);
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();

      await hookManager.onSessionStart();

      const sessionData = FileUtils.writeJSON.mock.calls[0][1];
      expect(sessionData.id).toMatch(/^sess_\d+$/);

      consoleErrorSpy.mockRestore();
    });

    it('should handle timestamp generation', async () => {
      hookManager = new HookManager('/test/project');
      FileUtils.exists = jest.fn().mockResolvedValue(false);
      FileUtils.writeJSON = jest.fn().mockResolvedValue(undefined);
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();

      await hookManager.onSessionStart();

      const sessionData = FileUtils.writeJSON.mock.calls[0][1];
      expect(sessionData.created_at).toMatch(/^\d{4}-\d{2}-\d{2}T/);

      consoleErrorSpy.mockRestore();
    });
  });

  describe('Integration with StateManager', () => {
    it('should use StateManager for all state operations', async () => {
      hookManager = new HookManager('/test/project');

      await hookManager.onSessionStart();

      expect(mockStateManager.init).toHaveBeenCalled();
    });

    it('should load current task from StateManager', async () => {
      hookManager = new HookManager('/test/project');
      mockStateManager.loadCurrentTask = jest.fn().mockResolvedValue({
        feature: 'feat-1',
        workflow_phase: 'CODING',
        agent: 'coder'
      });

      await hookManager.onPostToolUse({ toolName: 'Read', toolInput: {} });

      expect(mockStateManager.loadCurrentTask).toHaveBeenCalled();
    });

    it('should log events through StateManager', async () => {
      hookManager = new HookManager('/test/project');

      await hookManager.onPostToolUse({ toolName: 'Read', toolInput: {} });

      expect(mockStateManager.log).toHaveBeenCalledWith(
        'tool_use',
        expect.any(Object)
      );
    });
  });
});
