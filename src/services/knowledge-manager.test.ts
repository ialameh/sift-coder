/**
 * KnowledgeManager Service Tests
 * Tests for knowledge base operations
 */

import { KnowledgeManagerService, Pattern, Gotcha, Decision } from './knowledge-manager';
import { MockFileSystem, TestDataFactory } from '../utils/test-helpers';

// Mock dependencies
jest.mock('../utils/file-utils.js');
jest.mock('../utils/path-utils.js');

const FileUtils = require('../utils/file-utils.js');
const PathUtils = require('../utils/path-utils.js');

describe('KnowledgeManagerService', () => {
  let service: KnowledgeManagerService;
  let mockFs: MockFileSystem;

  beforeEach(() => {
    mockFs = new MockFileSystem();
    mockFs.createFsPromisesMock();

    PathUtils.getStateDir = jest.fn(() => '/test/state');
    PathUtils.join = jest.fn((...args: string[]) => args.join('/'));
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('constructor', () => {
    it('should initialize with project root', () => {
      service = new KnowledgeManagerService('/test/project');

      expect(service).toBeInstanceOf(KnowledgeManagerService);
    });

    it('should initialize without project root', () => {
      service = new KnowledgeManagerService();

      expect(service).toBeInstanceOf(KnowledgeManagerService);
    });
  });

  describe('init', () => {
    it('should initialize knowledge directory and files', async () => {
      service = new KnowledgeManagerService('/test/project');
      FileUtils.mkdir = jest.fn().mockResolvedValue(undefined);
      FileUtils.exists = jest.fn().mockResolvedValue(false);
      FileUtils.writeJSON = jest.fn().mockResolvedValue(undefined);

      await service.init();

      expect(FileUtils.mkdir).toHaveBeenCalledWith('/test/state/.claude/siftcoder-state/knowledge');
      expect(FileUtils.writeJSON).toHaveBeenCalledWith(
        '/test/state/.claude/siftcoder-state/knowledge/patterns.json',
        []
      );
      expect(FileUtils.writeJSON).toHaveBeenCalledWith(
        '/test/state/.claude/siftcoder-state/knowledge/gotchas.json',
        []
      );
      expect(FileUtils.writeJSON).toHaveBeenCalledWith(
        '/test/state/.claude/siftcoder-state/knowledge/decisions.json',
        []
      );
    });

    it('should not overwrite existing files', async () => {
      service = new KnowledgeManagerService('/test/project');
      FileUtils.mkdir = jest.fn().mockResolvedValue(undefined);
      FileUtils.exists = jest.fn().mockResolvedValue(true);

      await service.init();

      expect(FileUtils.writeJSON).not.toHaveBeenCalled();
    });
  });

  describe('addPattern', () => {
    it('should add a pattern', async () => {
      service = new KnowledgeManagerService('/test/project');
      FileUtils.mkdir = jest.fn().mockResolvedValue(undefined);
      FileUtils.exists = jest.fn().mockResolvedValue(false);
      FileUtils.writeJSON = jest.fn().mockResolvedValue(undefined);
      FileUtils.readJSON = jest.fn().mockResolvedValue([]);

      const id = await service.addPattern({
        title: 'Test Pattern',
        source: 'test',
        usage: 'test usage',
        example: 'test example'
      });

      expect(id).toBe('pattern-1');

      const savedPattern = FileUtils.writeJSON.mock.calls[0][1][0];
      expect(savedPattern.title).toBe('Test Pattern');
      expect(savedPattern.id).toBe('pattern-1');
      expect(savedPattern.addedAt).toBeTruthy();
    });

    it('should append to existing patterns', async () => {
      service = new KnowledgeManagerService('/test/project');
      FileUtils.mkdir = jest.fn().mockResolvedValue(undefined);
      FileUtils.exists = jest.fn().mockResolvedValue(true);
      FileUtils.readJSON = jest.fn().mockResolvedValue([
        TestDataFactory.createPattern({ id: 'pattern-1' })
      ]);
      FileUtils.writeJSON = jest.fn().mockResolvedValue(undefined);

      const id = await service.addPattern({
        title: 'New Pattern'
      });

      expect(id).toBe('pattern-2');

      const savedPatterns = FileUtils.writeJSON.mock.calls[0][1];
      expect(savedPatterns).toHaveLength(2);
    });

    it('should generate unique IDs', async () => {
      service = new KnowledgeManagerService('/test/project');
      FileUtils.mkdir = jest.fn().mockResolvedValue(undefined);
      FileUtils.exists = jest.fn().mockResolvedValue(false);
      FileUtils.writeJSON = jest.fn().mockResolvedValue(undefined);
      FileUtils.readJSON = jest.fn().mockResolvedValue([]);

      const id1 = await service.addPattern({ title: 'Pattern 1' });
      const id2 = await service.addPattern({ title: 'Pattern 2' });

      expect(id1).not.toBe(id2);
    });
  });

  describe('addGotcha', () => {
    it('should add a gotcha', async () => {
      service = new KnowledgeManagerService('/test/project');
      FileUtils.mkdir = jest.fn().mockResolvedValue(undefined);
      FileUtils.exists = jest.fn().mockResolvedValue(false);
      FileUtils.writeJSON = jest.fn().mockResolvedValue(undefined);
      FileUtils.readJSON = jest.fn().mockResolvedValue([]);

      const id = await service.addGotcha({
        issue: 'Test Issue',
        fix: 'Test Fix',
        context: 'Test Context'
      });

      expect(id).toBe('gotcha-1');

      const savedGotcha = FileUtils.writeJSON.mock.calls[0][1][0];
      expect(savedGotcha.issue).toBe('Test Issue');
      expect(savedGotcha.fix).toBe('Test Fix');
      expect(savedGotcha.context).toBe('Test Context');
      expect(savedGotcha.id).toBe('gotcha-1');
      expect(savedGotcha.addedAt).toBeTruthy();
    });

    it('should append to existing gotchas', async () => {
      service = new KnowledgeManagerService('/test/project');
      FileUtils.mkdir = jest.fn().mockResolvedValue(undefined);
      FileUtils.exists = jest.fn().mockResolvedValue(true);
      FileUtils.readJSON = jest.fn().mockResolvedValue([
        TestDataFactory.createGotcha({ id: 'gotcha-1' })
      ]);
      FileUtils.writeJSON = jest.fn().mockResolvedValue(undefined);

      const id = await service.addGotcha({
        issue: 'New Issue'
      });

      expect(id).toBe('gotcha-2');

      const savedGotchas = FileUtils.writeJSON.mock.calls[0][1];
      expect(savedGotchas).toHaveLength(2);
    });
  });

  describe('addDecision', () => {
    it('should add a decision', async () => {
      service = new KnowledgeManagerService('/test/project');
      FileUtils.mkdir = jest.fn().mockResolvedValue(undefined);
      FileUtils.exists = jest.fn().mockResolvedValue(false);
      FileUtils.writeJSON = jest.fn().mockResolvedValue(undefined);
      FileUtils.readJSON = jest.fn().mockResolvedValue([]);

      const id = await service.addDecision({
        title: 'Test Decision',
        decision: 'Chose option A',
        rationale: 'Better performance'
      });

      expect(id).toBe('decision-1');

      const savedDecision = FileUtils.writeJSON.mock.calls[0][1][0];
      expect(savedDecision.title).toBe('Test Decision');
      expect(savedDecision.decision).toBe('Chose option A');
      expect(savedDecision.rationale).toBe('Better performance');
      expect(savedDecision.id).toBe('decision-1');
      expect(savedDecision.addedAt).toBeTruthy();
    });

    it('should append to existing decisions', async () => {
      service = new KnowledgeManagerService('/test/project');
      FileUtils.mkdir = jest.fn().mockResolvedValue(undefined);
      FileUtils.exists = jest.fn().mockResolvedValue(true);
      FileUtils.readJSON = jest.fn().mockResolvedValue([
        TestDataFactory.createDecision({ id: 'decision-1' })
      ]);
      FileUtils.writeJSON = jest.fn().mockResolvedValue(undefined);

      const id = await service.addDecision({
        title: 'New Decision',
        decision: 'Chose option B'
      });

      expect(id).toBe('decision-2');

      const savedDecisions = FileUtils.writeJSON.mock.calls[0][1];
      expect(savedDecisions).toHaveLength(2);
    });
  });

  describe('getPatterns', () => {
    it('should return all patterns', async () => {
      service = new KnowledgeManagerService('/test/project');
      FileUtils.exists = jest.fn().mockResolvedValue(true);
      const mockPatterns = [
        TestDataFactory.createPattern({ id: 'pattern-1', title: 'Pattern 1' }),
        TestDataFactory.createPattern({ id: 'pattern-2', title: 'Pattern 2' })
      ];
      FileUtils.readJSON = jest.fn().mockResolvedValue(mockPatterns);

      const result = await service.getPatterns();

      expect(result).toHaveLength(2);
      expect(result[0].title).toBe('Pattern 1');
      expect(result[1].title).toBe('Pattern 2');
    });

    it('should return empty array if file does not exist', async () => {
      service = new KnowledgeManagerService('/test/project');
      FileUtils.exists = jest.fn().mockResolvedValue(false);

      const result = await service.getPatterns();

      expect(result).toEqual([]);
    });

    it('should return empty array for empty patterns file', async () => {
      service = new KnowledgeManagerService('/test/project');
      FileUtils.exists = jest.fn().mockResolvedValue(true);
      FileUtils.readJSON = jest.fn().mockResolvedValue([]);

      const result = await service.getPatterns();

      expect(result).toEqual([]);
    });
  });

  describe('getGotchas', () => {
    it('should return all gotchas', async () => {
      service = new KnowledgeManagerService('/test/project');
      FileUtils.exists = jest.fn().mockResolvedValue(true);
      const mockGotchas = [
        TestDataFactory.createGotcha({ id: 'gotcha-1', issue: 'Issue 1' }),
        TestDataFactory.createGotcha({ id: 'gotcha-2', issue: 'Issue 2' })
      ];
      FileUtils.readJSON = jest.fn().mockResolvedValue(mockGotchas);

      const result = await service.getGotchas();

      expect(result).toHaveLength(2);
      expect(result[0].issue).toBe('Issue 1');
      expect(result[1].issue).toBe('Issue 2');
    });

    it('should return empty array if file does not exist', async () => {
      service = new KnowledgeManagerService('/test/project');
      FileUtils.exists = jest.fn().mockResolvedValue(false);

      const result = await service.getGotchas();

      expect(result).toEqual([]);
    });
  });

  describe('getDecisions', () => {
    it('should return all decisions', async () => {
      service = new KnowledgeManagerService('/test/project');
      FileUtils.exists = jest.fn().mockResolvedValue(true);
      const mockDecisions = [
        TestDataFactory.createDecision({ id: 'decision-1', title: 'Decision 1' }),
        TestDataFactory.createDecision({ id: 'decision-2', title: 'Decision 2' })
      ];
      FileUtils.readJSON = jest.fn().mockResolvedValue(mockDecisions);

      const result = await service.getDecisions();

      expect(result).toHaveLength(2);
      expect(result[0].title).toBe('Decision 1');
      expect(result[1].title).toBe('Decision 2');
    });

    it('should return empty array if file does not exist', async () => {
      service = new KnowledgeManagerService('/test/project');
      FileUtils.exists = jest.fn().mockResolvedValue(false);

      const result = await service.getDecisions();

      expect(result).toEqual([]);
    });
  });

  describe('searchPatterns', () => {
    it('should search patterns by title', async () => {
      service = new KnowledgeManagerService('/test/project');
      FileUtils.exists = jest.fn().mockResolvedValue(true);
      const mockPatterns = [
        TestDataFactory.createPattern({ id: 'pattern-1', title: 'React Component Pattern' }),
        TestDataFactory.createPattern({ id: 'pattern-2', title: 'Vue Component Pattern' }),
        TestDataFactory.createPattern({ id: 'pattern-3', title: 'API Design Pattern' })
      ];
      FileUtils.readJSON = jest.fn().mockResolvedValue(mockPatterns);

      const result = await service.searchPatterns('react');

      expect(result).toHaveLength(1);
      expect(result[0].title).toBe('React Component Pattern');
    });

    it('should search patterns by usage', async () => {
      service = new KnowledgeManagerService('/test/project');
      FileUtils.exists = jest.fn().mockResolvedValue(true);
      const mockPatterns = [
        TestDataFactory.createPattern({
          id: 'pattern-1',
          title: 'Pattern 1',
          usage: 'Use for building React components'
        }),
        TestDataFactory.createPattern({
          id: 'pattern-2',
          title: 'Pattern 2',
          usage: 'Use for API design'
        })
      ];
      FileUtils.readJSON = jest.fn().mockResolvedValue(mockPatterns);

      const result = await service.searchPatterns('react');

      expect(result).toHaveLength(1);
      expect(result[0].title).toBe('Pattern 1');
    });

    it('should be case insensitive', async () => {
      service = new KnowledgeManagerService('/test/project');
      FileUtils.exists = jest.fn().mockResolvedValue(true);
      const mockPatterns = [
        TestDataFactory.createPattern({ id: 'pattern-1', title: 'REACT PATTERN' })
      ];
      FileUtils.readJSON = jest.fn().mockResolvedValue(mockPatterns);

      const result = await service.searchPatterns('react');

      expect(result).toHaveLength(1);
    });

    it('should return empty array for no matches', async () => {
      service = new KnowledgeManagerService('/test/project');
      FileUtils.exists = jest.fn().mockResolvedValue(true);
      const mockPatterns = [
        TestDataFactory.createPattern({ id: 'pattern-1', title: 'React Pattern' })
      ];
      FileUtils.readJSON = jest.fn().mockResolvedValue(mockPatterns);

      const result = await service.searchPatterns('vue');

      expect(result).toEqual([]);
    });
  });

  describe('searchGotchas', () => {
    it('should search gotchas by issue', async () => {
      service = new KnowledgeManagerService('/test/project');
      FileUtils.exists = jest.fn().mockResolvedValue(true);
      const mockGotchas = [
        TestDataFactory.createGotcha({ id: 'gotcha-1', issue: 'React memory leak' }),
        TestDataFactory.createGotcha({ id: 'gotcha-2', issue: 'Vue memory leak' }),
        TestDataFactory.createGotcha({ id: 'gotcha-3', issue: 'API timeout error' })
      ];
      FileUtils.readJSON = jest.fn().mockResolvedValue(mockGotchas);

      const result = await service.searchGotchas('react');

      expect(result).toHaveLength(1);
      expect(result[0].issue).toBe('React memory leak');
    });

    it('should search gotchas by fix', async () => {
      service = new KnowledgeManagerService('/test/project');
      FileUtils.exists = jest.fn().mockResolvedValue(true);
      const mockGotchas = [
        TestDataFactory.createGotcha({
          id: 'gotcha-1',
          issue: 'Issue 1',
          fix: 'Use cleanup function in React'
        }),
        TestDataFactory.createGotcha({
          id: 'gotcha-2',
          issue: 'Issue 2',
          fix: 'Use timeout in API'
        })
      ];
      FileUtils.readJSON = jest.fn().mockResolvedValue(mockGotchas);

      const result = await service.searchGotchas('react');

      expect(result).toHaveLength(1);
      expect(result[0].issue).toBe('Issue 1');
    });

    it('should be case insensitive', async () => {
      service = new KnowledgeManagerService('/test/project');
      FileUtils.exists = jest.fn().mockResolvedValue(true);
      const mockGotchas = [
        TestDataFactory.createGotcha({ id: 'gotcha-1', issue: 'MEMORY LEAK' })
      ];
      FileUtils.readJSON = jest.fn().mockResolvedValue(mockGotchas);

      const result = await service.searchGotchas('memory');

      expect(result).toHaveLength(1);
    });

    it('should return empty array for no matches', async () => {
      service = new KnowledgeManagerService('/test/project');
      FileUtils.exists = jest.fn().mockResolvedValue(true);
      const mockGotchas = [
        TestDataFactory.createGotcha({ id: 'gotcha-1', issue: 'React issue' })
      ];
      FileUtils.readJSON = jest.fn().mockResolvedValue(mockGotchas);

      const result = await service.searchGotchas('vue');

      expect(result).toEqual([]);
    });
  });

  describe('Edge cases', () => {
    it('should handle empty title when adding pattern', async () => {
      service = new KnowledgeManagerService('/test/project');
      FileUtils.mkdir = jest.fn().mockResolvedValue(undefined);
      FileUtils.exists = jest.fn().mockResolvedValue(false);
      FileUtils.writeJSON = jest.fn().mockResolvedValue(undefined);
      FileUtils.readJSON = jest.fn().mockResolvedValue([]);

      const id = await service.addPattern({
        title: '',
        source: 'test'
      });

      expect(id).toBe('pattern-1');
    });

    it('should handle special characters in search', async () => {
      service = new KnowledgeManagerService('/test/project');
      FileUtils.exists = jest.fn().mockResolvedValue(true);
      const mockPatterns = [
        TestDataFactory.createPattern({ id: 'pattern-1', title: 'Pattern: C++ / C#' })
      ];
      FileUtils.readJSON = jest.fn().mockResolvedValue(mockPatterns);

      const result = await service.searchPatterns('C++');

      expect(result).toHaveLength(1);
    });

    it('should handle very long descriptions', async () => {
      service = new KnowledgeManagerService('/test/project');
      FileUtils.mkdir = jest.fn().mockResolvedValue(undefined);
      FileUtils.exists = jest.fn().mockResolvedValue(false);
      FileUtils.writeJSON = jest.fn().mockResolvedValue(undefined);
      FileUtils.readJSON = jest.fn().mockResolvedValue([]);

      const longDescription = 'x'.repeat(10000);

      await service.addPattern({
        title: 'Pattern with long description',
        usage: longDescription
      });

      expect(FileUtils.writeJSON).toHaveBeenCalled();
    });
  });

  describe('Error handling', () => {
    it('should handle file read errors gracefully', async () => {
      service = new KnowledgeManagerService('/test/project');
      FileUtils.exists = jest.fn().mockResolvedValue(true);
      FileUtils.readJSON = jest.fn().mockRejectedValue(new Error('Read failed'));

      await expect(service.getPatterns()).rejects.toThrow('Read failed');
    });

    it('should handle file write errors gracefully', async () => {
      service = new KnowledgeManagerService('/test/project');
      FileUtils.mkdir = jest.fn().mockResolvedValue(undefined);
      FileUtils.exists = jest.fn().mockResolvedValue(false);
      FileUtils.writeJSON = jest.fn().mockRejectedValue(new Error('Write failed'));
      FileUtils.readJSON = jest.fn().mockResolvedValue([]);

      await expect(service.addPattern({ title: 'Test' })).rejects.toThrow('Write failed');
    });

    it('should handle JSON parse errors', async () => {
      service = new KnowledgeManagerService('/test/project');
      FileUtils.exists = jest.fn().mockResolvedValue(true);
      FileUtils.readJSON = jest.fn().mockRejectedValue(new Error('Invalid JSON'));

      await expect(service.getPatterns()).rejects.toThrow('Invalid JSON');
    });
  });
});
