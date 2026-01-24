/**
 * Learning Service Tests
 * Tests for pattern extraction and knowledge base management
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';

// Mock FileUtils using manual mock
vi.mock('../utils/file-utils', () => {
  return {
    FileUtils: {
      exists: vi.fn().mockResolvedValue(false),
      readFile: vi.fn().mockResolvedValue(''),
      writeFile: vi.fn().mockResolvedValue(undefined),
      readJSON: vi.fn().mockResolvedValue([]),
      writeJSON: vi.fn().mockResolvedValue(undefined),
      mkdir: vi.fn().mockResolvedValue(undefined),
      appendFile: vi.fn().mockResolvedValue(undefined),
      deleteFile: vi.fn().mockResolvedValue(undefined),
      copyFile: vi.fn().mockResolvedValue(undefined),
      moveFile: vi.fn().mockResolvedValue(undefined),
      glob: vi.fn().mockResolvedValue([]),
      stat: vi.fn().mockResolvedValue({ isFile: () => true }),
      listFiles: vi.fn().mockResolvedValue([]),
      match: vi.fn().mockReturnValue(false)
    }
  };
});

// Import modules
import { LearningService, Pattern, PatternCategory } from './learning-service';
import { FileUtils } from '../utils/file-utils';

// Get mocked FileUtils
const mockedFileUtils = FileUtils;

describe('LearningService', () => {
  let service: LearningService;
  const mockProjectRoot = '/test/project';

  beforeEach(() => {
    vi.clearAllMocks();
    // Reset mock behaviors before each test
    mockedFileUtils.exists.mockResolvedValue(false);
    mockedFileUtils.readFile.mockResolvedValue('');
    mockedFileUtils.readJSON.mockResolvedValue([]);
    mockedFileUtils.writeJSON.mockResolvedValue(undefined);
    mockedFileUtils.mkdir.mockResolvedValue(undefined);
    service = new LearningService(mockProjectRoot);
  });

  describe('Constructor', () => {
    it('should initialize with project root', () => {
      expect(service).toBeInstanceOf(LearningService);
    });

    it('should use cwd if project root not provided', () => {
      const cwdService = new LearningService();
      expect(cwdService).toBeInstanceOf(LearningService);
    });
  });

  describe('extractPattern', () => {
    it('should extract error resolution pattern', async () => {
      const pattern = await service.extractPattern(
        'Supabase auth error',
        'error_resolution',
        'User not found error in Supabase auth',
        'Check if user exists before auth call'
      );

      expect(pattern.id).toBe('supabase-auth-error');
      expect(pattern.name).toBe('Supabase auth error');
      expect(pattern.category).toBe('error_resolution');
      expect(pattern.problem).toBe('User not found error in Supabase auth');
      expect(pattern.solution).toBe('Check if user exists before auth call');
      expect(pattern.tags).toBeInstanceOf(Array);
      expect(pattern.created_at).toBeTruthy();
      expect(pattern.times_used).toBe(0);
    });

    it('should extract debugging pattern', async () => {
      const pattern = await service.extractPattern(
        'Memory leak detection',
        'debugging',
        'Memory usage increasing over time',
        'Use Chrome DevTools Memory profiler'
      );

      expect(pattern.category).toBe('debugging');
    });

    it('should extract best practice pattern', async () => {
      const pattern = await service.extractPattern(
        'Type-safe error handling',
        'best_practice',
        'Errors losing type information',
        'Create custom error classes with types'
      );

      expect(pattern.category).toBe('best_practice');
    });

    it('should extract workaround pattern', async () => {
      const pattern = await service.extractPattern(
        'Next.js static generation',
        'workaround',
        'Static generation fails',
        'Use getServerSideProps'
      );

      expect(pattern.category).toBe('workaround');
    });

    it('should include custom options', async () => {
      const pattern = await service.extractPattern(
        'Test pattern',
        'best_practice',
        'Problem',
        'Solution',
        {
          code_example: 'console.log("test");',
          tags: ['typescript', 'testing'],
          context: 'Used in unit tests'
        }
      );

      expect(pattern.code_example).toBe('console.log("test");');
      expect(pattern.tags).toContain('typescript');
      expect(pattern.tags).toContain('testing');
      expect(pattern.context).toBe('Used in unit tests');
    });

    it('should auto-generate tags from text', async () => {
      const pattern = await service.extractPattern(
        'React async promise error',
        'error_resolution',
        'Promise rejection in React component',
        'Use try-catch with async/await'
      );

      expect(pattern.tags).toContain('react');
      expect(pattern.tags).toContain('async');
      expect(pattern.tags).toContain('promise');
    });

    it('should handle special characters in name', async () => {
      const pattern = await service.extractPattern(
        'React + TypeScript @ 2024!',
        'best_practice',
        'Problem',
        'Solution'
      );

      expect(pattern.id).toBeTruthy();
      expect(pattern.id).not.toContain('@');
      expect(pattern.id).not.toContain('!');
    });

    it('should handle very long name', async () => {
      const longName = 'a'.repeat(100);
      const pattern = await service.extractPattern(
        longName,
        'best_practice',
        'Problem',
        'Solution'
      );

      expect(pattern.id.length).toBeLessThanOrEqual(50);
    });

    it('should handle empty name', async () => {
      const pattern = await service.extractPattern(
        '',
        'best_practice',
        'Problem',
        'Solution'
      );

      expect(pattern.id).toBe('');
    });

    it('should extract technology tags', async () => {
      const pattern = await service.extractPattern(
        'React and Node.js pattern',
        'best_practice',
        'Using React with Node.js backend and PostgreSQL database',
        'Solution'
      );

      expect(pattern.tags).toContain('react');
      expect(pattern.tags).toContain('node');
      expect(pattern.tags).toContain('postgresql');
    });

    it('should extract concept tags', async () => {
      const pattern = await service.extractPattern(
        'Async validation pattern',
        'best_practice',
        'Add async validation for authentication',
        'Solution'
      );

      expect(pattern.tags).toContain('async');
      expect(pattern.tags).toContain('validation');
      expect(pattern.tags).toContain('authentication');
    });
  });

  describe('savePattern', () => {
    it('should save new pattern', async () => {
      const pattern: Pattern = {
        id: 'test-pattern',
        name: 'Test Pattern',
        category: 'best_practice',
        problem: 'Test problem',
        solution: 'Test solution',
        tags: ['test'],
        created_at: new Date().toISOString()
      };

      mockedFileUtils.mkdir.mockResolvedValue();
      mockedFileUtils.readJSON.mockResolvedValue([]);
      mockedFileUtils.writeJSON.mockResolvedValue();

      await service.savePattern(pattern);

      expect(mockedFileUtils.mkdir).toHaveBeenCalled();
      expect(mockedFileUtils.readJSON).toHaveBeenCalled();
      expect(mockedFileUtils.writeJSON).toHaveBeenCalled();
    });

    it('should update existing pattern', async () => {
      const existingPattern: Pattern = {
        id: 'test-pattern',
        name: 'Test Pattern',
        category: 'best_practice',
        problem: 'Old problem',
        solution: 'Old solution',
        tags: ['test'],
        created_at: '2024-01-01T00:00:00Z'
      };

      const updatedPattern: Pattern = {
        ...existingPattern,
        problem: 'New problem',
        solution: 'New solution'
      };

      mockedFileUtils.mkdir.mockResolvedValue();
      mockedFileUtils.readJSON.mockResolvedValue([existingPattern]);
      mockedFileUtils.writeJSON.mockResolvedValue();

      await service.savePattern(updatedPattern);

      expect(mockedFileUtils.writeJSON).toHaveBeenCalledWith(
        expect.any(String),
        expect.arrayContaining([
          expect.objectContaining({
            id: 'test-pattern',
            problem: 'New problem',
            updated_at: expect.any(String)
          })
        ])
      );
    });

    it('should handle write errors gracefully', async () => {
      const pattern: Pattern = {
        id: 'test-pattern',
        name: 'Test Pattern',
        category: 'best_practice',
        problem: 'Test problem',
        solution: 'Test solution',
        tags: [],
        created_at: new Date().toISOString()
      };

      mockedFileUtils.mkdir.mockRejectedValue(new Error('Write error'));

      // Should not throw
      await expect(service.savePattern(pattern)).resolves.not.toThrow();
    });
  });

  describe('loadPatterns', () => {
    it('should load patterns from file', async () => {
      const patterns: Pattern[] = [
        {
          id: 'pattern-1',
          name: 'Pattern 1',
          category: 'best_practice',
          problem: 'Problem 1',
          solution: 'Solution 1',
          tags: [],
          created_at: '2024-01-01T00:00:00Z'
        }
      ];

      mockedFileUtils.readJSON.mockResolvedValue(patterns);

      const loaded = await service.loadPatterns();
      expect(loaded).toEqual(patterns);
    });

    it('should return empty array if file not found', async () => {
      mockedFileUtils.readJSON.mockRejectedValue(new Error('Not found'));

      const loaded = await service.loadPatterns();
      expect(loaded).toEqual([]);
    });
  });

  describe('searchPatterns', () => {
    it('should search by pattern name', async () => {
      const patterns: Pattern[] = [
        {
          id: 'supabase-auth',
          name: 'Supabase auth pattern',
          category: 'best_practice',
          problem: 'Problem',
          solution: 'Solution',
          tags: ['supabase'],
          created_at: '2024-01-01T00:00:00Z'
        }
      ];

      mockedFileUtils.readJSON.mockResolvedValue(patterns);

      const results = await service.searchPatterns('supabase');
      expect(results).toHaveLength(1);
      expect(results[0].name).toBe('Supabase auth pattern');
    });

    it('should search by problem text', async () => {
      const patterns: Pattern[] = [
        {
          id: 'error-1',
          name: 'Error Pattern',
          category: 'error_resolution',
          problem: 'Cannot find module typescript',
          solution: 'Install typescript',
          tags: [],
          created_at: '2024-01-01T00:00:00Z'
        }
      ];

      mockedFileUtils.readJSON.mockResolvedValue(patterns);

      const results = await service.searchPatterns('typescript');
      expect(results).toHaveLength(1);
    });

    it('should search by tags', async () => {
      const patterns: Pattern[] = [
        {
          id: 'pattern-1',
          name: 'React Pattern',
          category: 'best_practice',
          problem: 'Problem',
          solution: 'Solution',
          tags: ['react', 'hooks'],
          created_at: '2024-01-01T00:00:00Z'
        }
      ];

      mockedFileUtils.readJSON.mockResolvedValue(patterns);

      const results = await service.searchPatterns('react');
      expect(results).toHaveLength(1);
    });

    it('should be case insensitive', async () => {
      const patterns: Pattern[] = [
        {
          id: 'pattern-1',
          name: 'TypeScript Pattern',
          category: 'best_practice',
          problem: 'Problem',
          solution: 'Solution',
          tags: ['typescript'],
          created_at: '2024-01-01T00:00:00Z'
        }
      ];

      mockedFileUtils.readJSON.mockResolvedValue(patterns);

      const results = await service.searchPatterns('TYPESCRIPT');
      expect(results).toHaveLength(1);
    });

    it('should return empty array for no matches', async () => {
      mockedFileUtils.readJSON.mockResolvedValue([]);

      const results = await service.searchPatterns('nonexistent');
      expect(results).toEqual([]);
    });
  });

  describe('searchByCategory', () => {
    it('should filter by category', async () => {
      const patterns: Pattern[] = [
        {
          id: 'pattern-1',
          name: 'Error Pattern',
          category: 'error_resolution',
          problem: 'Problem',
          solution: 'Solution',
          tags: [],
          created_at: '2024-01-01T00:00:00Z'
        },
        {
          id: 'pattern-2',
          name: 'Best Practice',
          category: 'best_practice',
          problem: 'Problem',
          solution: 'Solution',
          tags: [],
          created_at: '2024-01-01T00:00:00Z'
        }
      ];

      mockedFileUtils.readJSON.mockResolvedValue(patterns);

      const results = await service.searchByCategory('error_resolution');
      expect(results).toHaveLength(1);
      expect(results[0].category).toBe('error_resolution');
    });
  });

  describe('searchByTag', () => {
    it('should filter by tag', async () => {
      const patterns: Pattern[] = [
        {
          id: 'pattern-1',
          name: 'React Pattern',
          category: 'best_practice',
          problem: 'Problem',
          solution: 'Solution',
          tags: ['react', 'hooks'],
          created_at: '2024-01-01T00:00:00Z'
        }
      ];

      mockedFileUtils.readJSON.mockResolvedValue(patterns);

      const results = await service.searchByTag('react');
      expect(results).toHaveLength(1);
    });
  });

  describe('getPattern', () => {
    it('should get pattern by ID', async () => {
      const patterns: Pattern[] = [
        {
          id: 'pattern-1',
          name: 'Pattern 1',
          category: 'best_practice',
          problem: 'Problem',
          solution: 'Solution',
          tags: [],
          created_at: '2024-01-01T00:00:00Z'
        }
      ];

      mockedFileUtils.readJSON.mockResolvedValue(patterns);

      const result = await service.getPattern('pattern-1');
      expect(result?.id).toBe('pattern-1');
    });

    it('should return null for non-existent ID', async () => {
      mockedFileUtils.readJSON.mockResolvedValue([]);

      const result = await service.getPattern('nonexistent');
      expect(result).toBeNull();
    });
  });

  describe('deletePattern', () => {
    it('should delete pattern by ID', async () => {
      const patterns: Pattern[] = [
        {
          id: 'pattern-1',
          name: 'Pattern 1',
          category: 'best_practice',
          problem: 'Problem',
          solution: 'Solution',
          tags: [],
          created_at: '2024-01-01T00:00:00Z'
        }
      ];

      mockedFileUtils.readJSON.mockResolvedValue([...patterns]);
      mockedFileUtils.writeJSON.mockResolvedValue();

      const deleted = await service.deletePattern('pattern-1');
      expect(deleted).toBe(true);
    });

    it('should return false for non-existent ID', async () => {
      mockedFileUtils.readJSON.mockResolvedValue([]);

      const deleted = await service.deletePattern('nonexistent');
      expect(deleted).toBe(false);
    });
  });

  describe('listPatterns', () => {
    it('should list all patterns', async () => {
      const patterns: Pattern[] = [
        {
          id: 'pattern-1',
          name: 'Pattern 1',
          category: 'best_practice',
          problem: 'Problem 1',
          solution: 'Solution 1',
          tags: [],
          created_at: '2024-01-01T00:00:00Z'
        }
      ];

      mockedFileUtils.readJSON.mockResolvedValue(patterns);

      const results = await service.listPatterns();
      expect(results).toHaveLength(1);
    });
  });

  describe('suggestPatterns', () => {
    it('should suggest patterns based on context', async () => {
      const patterns: Pattern[] = [
        {
          id: 'supabase-error',
          name: 'Supabase error handling',
          category: 'error_resolution',
          problem: 'Supabase query error',
          solution: 'Add error handling',
          tags: ['supabase', 'error'],
          created_at: '2024-01-01T00:00:00Z',
          times_used: 5
        }
      ];

      mockedFileUtils.readJSON.mockResolvedValue(patterns);

      const suggestions = await service.suggestPatterns('supabase query failing');
      expect(suggestions).toHaveLength(1);
      expect(suggestions[0].name).toBe('Supabase error handling');
    });

    it('should prioritize frequently used patterns', async () => {
      const patterns: Pattern[] = [
        {
          id: 'pattern-1',
          name: 'Frequently Used',
          category: 'best_practice',
          problem: 'Common problem',
          solution: 'Common solution',
          tags: ['common'],
          created_at: '2024-01-01T00:00:00Z',
          times_used: 10
        },
        {
          id: 'pattern-2',
          name: 'Rarely Used',
          category: 'best_practice',
          problem: 'Rare problem',
          solution: 'Rare solution',
          tags: ['rare'],
          created_at: '2024-01-01T00:00:00Z',
          times_used: 1
        }
      ];

      mockedFileUtils.readJSON.mockResolvedValue(patterns);

      const suggestions = await service.suggestPatterns('common problem');
      expect(suggestions[0].name).toBe('Frequently Used');
    });
  });

  describe('evaluateSession', () => {
    it('should evaluate session and suggest patterns', async () => {
      const sessionData = {
        tool_calls: 10,
        files_modified: ['src/service.ts'],
        errors_encountered: ['TypeError: Cannot read property'],
        commands_run: ['npm test']
      };

      const patterns: Pattern[] = [
        {
          id: 'type-error-fix',
          name: 'Type error handling',
          category: 'error_resolution',
          problem: 'TypeError',
          solution: 'Add type check',
          tags: ['typescript', 'error'],
          created_at: '2024-01-01T00:00:00Z'
        }
      ];

      mockedFileUtils.readJSON.mockResolvedValue(patterns);

      const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

      const suggestions = await service.evaluateSession(sessionData);

      expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('Evaluating session'));
      expect(suggestions).toBeInstanceOf(Array);
      expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('Found'));

      consoleSpy.mockRestore();
    });

    it('should show no related patterns message', async () => {
      const sessionData = {
        tool_calls: 10,
        files_modified: ['src/service.ts'],
        errors_encountered: [],
        commands_run: ['npm test']
      };

      mockedFileUtils.readJSON.mockResolvedValue([]);

      const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

      await service.evaluateSession(sessionData);

      expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('No related patterns found'));

      consoleSpy.mockRestore();
    });
  });

  describe('formatPattern', () => {
    it('should format pattern for display', () => {
      const pattern: Pattern = {
        id: 'test-pattern',
        name: 'Test Pattern',
        category: 'best_practice',
        problem: 'Test problem',
        solution: 'Test solution',
        tags: ['test', 'example'],
        created_at: '2024-01-01T00:00:00Z'
      };

      const formatted = service.formatPattern(pattern);

      expect(formatted).toContain('Test Pattern');
      expect(formatted).toContain('best_practice');
      expect(formatted).toContain('Test problem');
      expect(formatted).toContain('Test solution');
      expect(formatted).toContain('test');
      expect(formatted).toContain('example');
    });

    it('should format pattern with code example', () => {
      const pattern: Pattern = {
        id: 'test-pattern',
        name: 'Test Pattern',
        category: 'best_practice',
        problem: 'Test problem',
        solution: 'Test solution',
        code_example: 'console.log("test");',
        tags: [],
        created_at: '2024-01-01T00:00:00Z'
      };

      const formatted = service.formatPattern(pattern);
      expect(formatted).toContain('console.log("test");');
    });

    it('should format pattern with context', () => {
      const pattern: Pattern = {
        id: 'test-pattern',
        name: 'Test Pattern',
        category: 'best_practice',
        problem: 'Test problem',
        solution: 'Test solution',
        context: 'Used in authentication',
        tags: [],
        created_at: '2024-01-01T00:00:00Z'
      };

      const formatted = service.formatPattern(pattern);
      expect(formatted).toContain('Used in authentication');
    });
  });

  describe('generatePatternId', () => {
    it('should generate pattern ID from name', () => {
      const id = (service as any).generatePatternId('Test Pattern Name');
      expect(id).toBe('test-pattern-name');
    });

    it('should handle special characters', () => {
      const id = (service as any).generatePatternId('Test@Pattern #1!');
      expect(id).not.toContain('@');
      expect(id).not.toContain('#');
      expect(id).not.toContain('!');
    });

    it('should limit to 50 characters', () => {
      const longName = 'a'.repeat(100);
      const id = (service as any).generatePatternId(longName);
      expect(id.length).toBeLessThanOrEqual(50);
    });
  });

  describe('extractTags', () => {
    it('should extract technology tags', () => {
      const tags = (service as any).extractTags('Using react and nodejs with postgresql database');
      expect(tags).toContain('react');
      expect(tags).toContain('nodejs');
      expect(tags).toContain('postgresql');
    });

    it('should extract concept tags', () => {
      const tags = (service as any).extractTags('Add async validation for authentication');
      expect(tags).toContain('async');
      expect(tags).toContain('validation');
      expect(tags).toContain('authentication');
    });

    it('should return array', () => {
      const tags = (service as any).extractTags('Some text here');
      expect(Array.isArray(tags)).toBe(true);
    });
  });

  describe('CLI interface', () => {
    it('should have CLI main method', () => {
      expect(LearningService.main).toBeDefined();
    });
  });
});
