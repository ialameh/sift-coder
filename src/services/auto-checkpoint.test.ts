/**
 * AutoCheckpoint Service Tests
 * Tests for automatic checkpoint creation
 */

import { AutoCheckpointService, CheckpointMetadata, CheckpointTrigger } from './auto-checkpoint';
import { TestDataFactory } from '../utils/test-helpers';

// Mock dependencies with proper structure
jest.mock('../utils/path-utils.js', () => ({
  PathUtils: {
    getStateDir: jest.fn(() => '/test/state'),
    join: jest.fn((...args: string[]) => args.join('/'))
  }
}));

jest.mock('../utils/file-utils.js', () => ({
  FileUtils: {
    mkdir: jest.fn().mockResolvedValue(undefined),
    writeJSON: jest.fn().mockResolvedValue(undefined),
    appendFile: jest.fn().mockResolvedValue(undefined),
    exists: jest.fn().mockResolvedValue(true),
    readJSON: jest.fn().mockResolvedValue({}),
    readFile: jest.fn().mockResolvedValue(''),
    readdir: jest.fn().mockResolvedValue([])
  }
}));

jest.mock('child_process', () => ({
  exec: jest.fn(),
  spawn: jest.fn()
}));

const FileUtils = require('../utils/file-utils.js').FileUtils;
const PathUtils = require('../utils/path-utils.js').PathUtils;
const childProcess = require('child_process');

describe('AutoCheckpointService', () => {
  let service: AutoCheckpointService;

  beforeEach(() => {
    jest.clearAllMocks();

    // Setup PathUtils mock
    PathUtils.getStateDir.mockReturnValue('/test/state');
    PathUtils.join.mockImplementation((...args: string[]) => args.join('/'));

    // Setup FileUtils mock
    FileUtils.mkdir.mockResolvedValue(undefined);
    FileUtils.writeJSON.mockResolvedValue(undefined);
    FileUtils.appendFile.mockResolvedValue(undefined);
    FileUtils.exists.mockResolvedValue(true);
    FileUtils.readJSON.mockResolvedValue({});
    FileUtils.readFile.mockResolvedValue('');
    FileUtils.readdir.mockResolvedValue([]);

    // Setup child_process mock
    (childProcess.exec as jest.Mock).mockImplementation((command: string, options: any, callback: any) => {
      // Simulate successful git commands
      if (command.includes('git rev-parse')) {
        callback(null, { stdout: 'abc123\n' }, '');
      } else if (command.includes('git diff')) {
        callback(null, { stdout: 'file1.ts\nfile2.ts\n' }, '');
      } else if (command.includes('git add')) {
        callback(null, { stdout: '' }, '');
      } else if (command.includes('git commit')) {
        callback(null, { stdout: '[checkpoint abc123] Test\n' }, '');
      } else {
        callback(null, { stdout: '' }, '');
      }
      return { kill: jest.fn() };
    });
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('constructor', () => {
    it('should initialize with project root', () => {
      service = new AutoCheckpointService('/test/project');

      expect(service).toBeInstanceOf(AutoCheckpointService);
    });

    it('should initialize without project root (use cwd)', () => {
      const originalCwd = process.cwd;
      process.cwd = jest.fn(() => '/current/dir');

      service = new AutoCheckpointService();

      expect(service).toBeInstanceOf(AutoCheckpointService);

      process.cwd = originalCwd;
    });

    it('should set state directory path', () => {
      service = new AutoCheckpointService('/test/project');

      expect(service).toBeInstanceOf(AutoCheckpointService);
    });
  });

  describe('createCheckpoint', () => {
    it('should create checkpoint with manual trigger by default', async () => {
      service = new AutoCheckpointService('/test/project');
      childProcess.execSync = jest.fn()
        .mockImplementation((cmd: string) => {
          if (cmd.includes('rev-parse --git-dir')) return '';
          if (cmd.includes('diff --quiet')) {
            throw new Error('Changes exist'); // Throws to indicate changes exist
          }
          if (cmd.includes('rev-parse HEAD')) return 'abc123\n';
          if (cmd.includes('diff-tree')) return 'file1.ts\nfile2.ts\n';
          if (cmd.includes('git add')) return '';
          if (cmd.includes('git commit')) return '[checkpoint abc123] Test\n';
          return '';
        });

      const result = await service.createCheckpoint({
        featureId: 'feat-1'
      });

      expect(result).not.toBeNull();
      expect(result?.trigger).toBe('manual');
      expect(result?.featureId).toBe('feat-1');
      expect(result?.gitRef).toBe('abc123');
      expect(result?.filesChanged).toBe('file1.ts,file2.ts');
    });

    it('should support different trigger types', async () => {
      service = new AutoCheckpointService('/test/project');
      childProcess.execSync = jest.fn()
        .mockImplementation((cmd: string) => {
          if (cmd.includes('rev-parse --git-dir')) return '';
          if (cmd.includes('diff --quiet')) {
            throw new Error('Changes exist'); // Throws to indicate changes exist
          }
          if (cmd.includes('rev-parse HEAD')) return 'def456\n';
          if (cmd.includes('diff-tree')) return '';
          if (cmd.includes('git add')) return '';
          if (cmd.includes('git commit')) return '[checkpoint def456] Test\n';
          return '';
        });

      const triggers: CheckpointTrigger[] = [
        'feature_complete',
        'subtask_complete',
        'manual',
        'auto_threshold',
        'auto_critical'
      ];

      for (const trigger of triggers) {
        const result = await service.createCheckpoint({ trigger, featureId: 'feat-1' });

        expect(result?.trigger).toBe(trigger);
      }
    });

    it('should return null if not a git repository', async () => {
      service = new AutoCheckpointService('/test/project');
      childProcess.execSync = jest.fn()
        .mockImplementation((cmd: string) => {
          if (cmd.includes('rev-parse --git-dir')) {
            throw new Error('Not a git repository');
          }
          return '';
        });

      const result = await service.createCheckpoint({});

      expect(result).toBeNull();
    });

    it('should return null if no changes to commit', async () => {
      service = new AutoCheckpointService('/test/project');
      childProcess.execSync = jest.fn()
        .mockImplementation((cmd: string) => {
          if (cmd.includes('rev-parse --git-dir')) return '';
          if (cmd.includes('diff --quiet')) return ''; // No error = no changes
          return '';
        });

      const result = await service.createCheckpoint({});

      expect(result).toBeNull();
    });

    it('should stage all changes', async () => {
      service = new AutoCheckpointService('/test/project');
      childProcess.execSync = jest.fn()
        .mockImplementation((cmd: string) => {
          if (cmd.includes('rev-parse --git-dir')) return '';
          if (cmd.includes('diff --quiet')) {
            throw new Error('Changes exist'); // Throws to indicate changes exist
          }
          if (cmd.includes('rev-parse HEAD')) return 'abc123\n';
          if (cmd.includes('diff-tree')) return '';
          if (cmd.includes('git add')) return '';
          if (cmd.includes('git commit')) return '[checkpoint abc123] Test\n';
          return '';
        });

      await service.createCheckpoint({});

      expect(childProcess.execSync).toHaveBeenCalledWith(
        'git add -A',
        expect.objectContaining({ cwd: '/test/project' })
      );
    });

    it('should create commit with proper message', async () => {
      service = new AutoCheckpointService('/test/project');
      childProcess.execSync = jest.fn()
        .mockImplementation((cmd: string) => {
          if (cmd.includes('rev-parse --git-dir')) return '';
          if (cmd.includes('diff --quiet')) {
            throw new Error('Changes exist'); // Throws to indicate changes exist
          }
          if (cmd.includes('rev-parse HEAD')) return 'abc123\n';
          if (cmd.includes('diff-tree')) return '';
          if (cmd.includes('git add')) return '';
          if (cmd.includes('git commit')) return '[checkpoint abc123] Test\n';
          return '';
        });

      await service.createCheckpoint({
        trigger: 'feature_complete',
        featureId: 'feat-123',
        message: 'Custom message'
      });

      const commitCall = childProcess.execSync.mock.calls.find(
        (call: any[]) => call[0].includes('git commit')
      );

      expect(commitCall[0]).toContain('[siftcoder] Custom message');
      expect(commitCall[0]).toContain('Feature: feat-123');
      expect(commitCall[0]).toContain('Trigger: feature_complete');
      expect(commitCall[0]).toContain('Co-Authored-By: Claude');
    });

    it('should save checkpoint metadata', async () => {
      service = new AutoCheckpointService('/test/project');
      childProcess.execSync = jest.fn()
        .mockImplementation((cmd: string) => {
          if (cmd.includes('rev-parse --git-dir')) return '';
          if (cmd.includes('diff --quiet')) {
            throw new Error('Changes exist'); // Throws to indicate changes exist
          }
          if (cmd.includes('rev-parse HEAD')) return 'abc123\n';
          if (cmd.includes('diff-tree')) return '';
          if (cmd.includes('git add')) return '';
          if (cmd.includes('git commit')) return '[checkpoint abc123] Test\n';
          return '';
        });

      await service.createCheckpoint({
        trigger: 'subtask_complete',
        featureId: 'feat-1',
        message: 'Test checkpoint'
      });

      expect(FileUtils.writeJSON).toHaveBeenCalledWith(
        '/test/state/.claude/siftcoder-state/checkpoints/cp-*.json',
        expect.objectContaining({
          id: expect.stringMatching(/^cp-/),
          createdAt: expect.any(String),
          gitRef: 'abc123',
          featureId: 'feat-1',
          trigger: 'subtask_complete',
          message: 'Test checkpoint',
          filesChanged: ''
        })
      );
    });

    it('should log checkpoint event', async () => {
      service = new AutoCheckpointService('/test/project');
      childProcess.execSync = jest.fn()
        .mockImplementation((cmd: string) => {
          if (cmd.includes('rev-parse --git-dir')) return '';
          if (cmd.includes('diff --quiet')) {
            throw new Error('Changes exist'); // Throws to indicate changes exist
          }
          if (cmd.includes('rev-parse HEAD')) return 'abc123\n';
          if (cmd.includes('diff-tree')) return '';
          if (cmd.includes('git add')) return '';
          if (cmd.includes('git commit')) return '[checkpoint abc123] Test\n';
          return '';
        });

      await service.createCheckpoint({
        trigger: 'manual',
        featureId: 'feat-1'
      });

      expect(FileUtils.appendFile).toHaveBeenCalledWith(
        '/test/state/implementation-log.jsonl',
        expect.stringContaining('"event":"checkpoint_created"')
      );
    });

    it('should handle commit failure', async () => {
      service = new AutoCheckpointService('/test/project');
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();
      childProcess.execSync = jest.fn()
        .mockImplementation((cmd: string) => {
          if (cmd.includes('rev-parse --git-dir')) return '';
          if (cmd.includes('diff --quiet')) {
            throw new Error('Changes exist'); // Throws to indicate changes exist
          }
          if (cmd.includes('git commit')) {
            throw new Error('Commit failed');
          }
          return '';
        });

      await expect(service.createCheckpoint({})).rejects.toThrow('Commit failed');

      consoleErrorSpy.mockRestore();
    });
  });

  describe('listCheckpoints', () => {
    it('should list all checkpoints sorted by date', async () => {
      service = new AutoCheckpointService('/test/project');
      FileUtils.listFiles = jest.fn().mockResolvedValue([
        'cp-1.json',
        'cp-2.json',
        'cp-3.json'
      ]);

      const mockCheckpoints = [
        TestDataFactory.createCheckpoint({
          id: 'cp-1',
          createdAt: '2024-01-03T00:00:00.000Z'
        }),
        TestDataFactory.createCheckpoint({
          id: 'cp-2',
          createdAt: '2024-01-01T00:00:00.000Z'
        }),
        TestDataFactory.createCheckpoint({
          id: 'cp-3',
          createdAt: '2024-01-02T00:00:00.000Z'
        })
      ];

      FileUtils.readJSON = jest.fn()
        .mockResolvedValueOnce(mockCheckpoints[0])
        .mockResolvedValueOnce(mockCheckpoints[1])
        .mockResolvedValueOnce(mockCheckpoints[2]);

      const result = await service.listCheckpoints();

      expect(result).toHaveLength(3);
      expect(result[0].id).toBe('cp-1'); // Most recent
      expect(result[1].id).toBe('cp-3');
      expect(result[2].id).toBe('cp-2'); // Oldest
    });

    it('should return empty array if no checkpoints', async () => {
      service = new AutoCheckpointService('/test/project');
      FileUtils.listFiles = jest.fn().mockResolvedValue([]);

      const result = await service.listCheckpoints();

      expect(result).toEqual([]);
    });

    it('should filter non-JSON files', async () => {
      service = new AutoCheckpointService('/test/project');
      FileUtils.listFiles = jest.fn().mockResolvedValue([
        'cp-1.json',
        'readme.txt',
        'cp-2.json',
        '.gitkeep'
      ]);

      const mockCheckpoints = [
        TestDataFactory.createCheckpoint({ id: 'cp-1' }),
        TestDataFactory.createCheckpoint({ id: 'cp-2' })
      ];

      FileUtils.readJSON = jest.fn()
        .mockResolvedValueOnce(mockCheckpoints[0])
        .mockResolvedValueOnce(mockCheckpoints[1]);

      const result = await service.listCheckpoints();

      expect(result).toHaveLength(2);
    });
  });

  describe('Checkpoint ID generation', () => {
    it('should generate unique checkpoint IDs', async () => {
      service = new AutoCheckpointService('/test/project');
      let callCount = 0;
      childProcess.execSync = jest.fn()
        .mockImplementation((cmd: string) => {
          if (cmd.includes('rev-parse --git-dir')) return '';
          if (cmd.includes('diff --quiet')) {
            throw new Error('Changes exist'); // Throws to indicate changes exist
          }
          if (cmd.includes('rev-parse HEAD')) {
            callCount++;
            return callCount === 1 ? 'abc123\n' : 'def456\n';
          }
          if (cmd.includes('diff-tree')) return '';
          if (cmd.includes('git add')) return '';
          if (cmd.includes('git commit')) return '[checkpoint] Test\n';
          return '';
        });

      const result1 = await service.createCheckpoint({ featureId: 'feat-1' });
      await new Promise(resolve => setTimeout(resolve, 10)); // Small delay
      const result2 = await service.createCheckpoint({ featureId: 'feat-2' });

      expect(result1?.id).not.toBe(result2?.id);
    });

    it('should use ISO timestamp format in ID', async () => {
      service = new AutoCheckpointService('/test/project');
      childProcess.execSync = jest.fn()
        .mockImplementation((cmd: string) => {
          if (cmd.includes('rev-parse --git-dir')) return '';
          if (cmd.includes('diff --quiet')) {
            throw new Error('Changes exist'); // Throws to indicate changes exist
          }
          if (cmd.includes('rev-parse HEAD')) return 'abc123\n';
          if (cmd.includes('diff-tree')) return '';
          if (cmd.includes('git add')) return '';
          if (cmd.includes('git commit')) return '[checkpoint abc123] Test\n';
          return '';
        });

      const result = await service.createCheckpoint({});

      expect(result?.id).toMatch(/^cp-\d{4}-\d{2}-\d{2}T\d{2}-\d{2}-\d{2}/);
    });
  });

  describe('File operations', () => {
    it('should create checkpoints directory if not exists', async () => {
      service = new AutoCheckpointService('/test/project');
      FileUtils.mkdir = jest.fn().mockResolvedValue(undefined);
      childProcess.execSync = jest.fn()
        .mockImplementation((cmd: string) => {
          if (cmd.includes('rev-parse --git-dir')) return '';
          if (cmd.includes('diff --quiet')) {
            throw new Error('Changes exist'); // Throws to indicate changes exist
          }
          if (cmd.includes('rev-parse HEAD')) return 'abc123\n';
          if (cmd.includes('diff-tree')) return '';
          if (cmd.includes('git add')) return '';
          if (cmd.includes('git commit')) return '[checkpoint abc123] Test\n';
          return '';
        });

      await service.createCheckpoint({});

      expect(FileUtils.mkdir).toHaveBeenCalledWith(
        '/test/state/checkpoints'
      );
    });

    it('should handle missing checkpoint metadata gracefully', async () => {
      service = new AutoCheckpointService('/test/project');
      FileUtils.listFiles = jest.fn().mockResolvedValue(['cp-1.json']);
      FileUtils.readJSON = jest.fn().mockRejectedValue(new Error('Read failed'));

      await expect(service.listCheckpoints()).rejects.toThrow('Read failed');
    });
  });

  describe('Error handling', () => {
    it('should handle git command errors', async () => {
      service = new AutoCheckpointService('/test/project');
      childProcess.execSync = jest.fn()
        .mockImplementation((cmd: string) => {
          throw new Error('Git command failed');
        });

      const result = await service.createCheckpoint({});

      expect(result).toBeNull();
    });

    it('should handle file system errors', async () => {
      service = new AutoCheckpointService('/test/project');
      FileUtils.mkdir = jest.fn().mockRejectedValue(new Error('Permission denied'));
      childProcess.execSync = jest.fn()
        .mockReturnValueOnce('') // git rev-parse
        .mockReturnValueOnce(''); // git diff --quiet

      await expect(service.createCheckpoint({})).rejects.toThrow('Permission denied');
    });
  });

  describe('Edge cases', () => {
    it('should handle checkpoint with no files changed', async () => {
      service = new AutoCheckpointService('/test/project');
      childProcess.execSync = jest.fn()
        .mockImplementation((cmd: string) => {
          if (cmd.includes('rev-parse --git-dir')) return '';
          if (cmd.includes('diff --quiet')) {
            throw new Error('Changes exist'); // Throws to indicate changes exist
          }
          if (cmd.includes('rev-parse HEAD')) return 'abc123\n';
          if (cmd.includes('diff-tree')) return '\n'; // No files in diff
          if (cmd.includes('git add')) return '';
          if (cmd.includes('git commit')) return '[checkpoint abc123] Test\n';
          return '';
        });

      const result = await service.createCheckpoint({});

      expect(result?.filesChanged).toBe('');
    });

    it('should handle special characters in feature ID', async () => {
      service = new AutoCheckpointService('/test/project');
      childProcess.execSync = jest.fn()
        .mockImplementation((cmd: string) => {
          if (cmd.includes('rev-parse --git-dir')) return '';
          if (cmd.includes('diff --quiet')) {
            throw new Error('Changes exist'); // Throws to indicate changes exist
          }
          if (cmd.includes('rev-parse HEAD')) return 'abc123\n';
          if (cmd.includes('diff-tree')) return '';
          if (cmd.includes('git add')) return '';
          if (cmd.includes('git commit')) return '[checkpoint abc123] Test\n';
          return '';
        });

      const result = await service.createCheckpoint({
        featureId: 'feat/with/slashes-and-dashes'
      });

      expect(result?.featureId).toBe('feat/with/slashes-and-dashes');
    });

    it('should handle very long commit messages', async () => {
      service = new AutoCheckpointService('/test/project');
      const longMessage = 'x'.repeat(10000);

      childProcess.execSync = jest.fn()
        .mockImplementation((cmd: string) => {
          if (cmd.includes('rev-parse --git-dir')) return '';
          if (cmd.includes('diff --quiet')) {
            throw new Error('Changes exist'); // Throws to indicate changes exist
          }
          if (cmd.includes('rev-parse HEAD')) return 'abc123\n';
          if (cmd.includes('diff-tree')) return '';
          if (cmd.includes('git add')) return '';
          if (cmd.includes('git commit')) return '[checkpoint abc123] Test\n';
          return '';
        });

      const result = await service.createCheckpoint({
        message: longMessage
      });

      expect(result?.message).toBe(longMessage);
    });
  });

  describe('Cross-platform compatibility', () => {
    it('should work with different project roots', async () => {
      const projects = [
        '/unix/project',
        'C:\\windows\\project'
      ];

      for (const projectRoot of projects) {
        service = new AutoCheckpointService(projectRoot);
        childProcess.execSync = jest.fn()
          .mockImplementation((cmd: string) => {
            if (cmd.includes('rev-parse --git-dir')) return '';
            if (cmd.includes('diff --quiet')) {
              throw new Error('Changes exist'); // Throws to indicate changes exist
            }
            if (cmd.includes('rev-parse HEAD')) return 'abc123\n';
            if (cmd.includes('diff-tree')) return '';
            if (cmd.includes('git add')) return '';
            if (cmd.includes('git commit')) return '[checkpoint abc123] Test\n';
            return '';
          });

        const result = await service.createCheckpoint({});

        expect(result).not.toBeNull();
      }
    });
  });

  describe('Integration with git', () => {
    it('should use correct git commands', async () => {
      service = new AutoCheckpointService('/test/project');
      const execCalls: string[][] = [];
      childProcess.execSync = jest.fn()
        .mockImplementation((cmd: string) => {
          execCalls.push([cmd]);
          if (cmd.includes('rev-parse --git-dir')) return '';
          if (cmd.includes('diff --quiet')) {
            // Must throw to indicate changes exist
            throw new Error('Has changes');
          }
          if (cmd.includes('rev-parse HEAD')) return 'abc123\n';
          if (cmd.includes('diff-tree')) return '';
          return '';
        });

      await service.createCheckpoint({ featureId: 'feat-1' });

      const commands = execCalls.map((call: string[]) => call[0]);
      expect(commands).toContain('git rev-parse --git-dir');
      expect(commands).toContain('git diff --quiet && git diff --staged --quiet');
      expect(commands).toContain('git add -A');
      expect(commands.some((cmd: string) => cmd.includes('git commit'))).toBe(true);
      expect(commands).toContain('git rev-parse HEAD');
      expect(commands).toContain('git diff-tree --no-commit-id --name-only -r HEAD');
    });
  });
});
