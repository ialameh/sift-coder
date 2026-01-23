/**
 * SuggestService Tests
 * Tests for command suggestion functionality
 */

import { SuggestService, CommandMatch, SuggestionResult } from './suggest-service';

// Mock dependencies with proper structure
jest.mock('glob', () => ({
  glob: jest.fn().mockResolvedValue([])
}));

jest.mock('path', () => ({
  join: jest.fn((...args: string[]) => args.filter(a => a).join('/')),
  basename: jest.fn((p: string) => p.split('/').pop())
}));

jest.mock('fs/promises', () => ({
  readFile: jest.fn().mockResolvedValue('')
}));

const glob = require('glob').glob;
const path = require('path');
const fs = require('fs/promises');

describe('SuggestService', () => {
  let service: SuggestService;

  beforeEach(() => {
    service = new SuggestService('/test/commands');
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('constructor', () => {
    it('should initialize with root path', () => {
      const newService = new SuggestService('/test/root');

      expect(newService).toBeInstanceOf(SuggestService);
    });

    it('should initialize without root path (use cwd)', () => {
      const newService = new SuggestService();

      expect(newService).toBeInstanceOf(SuggestService);
    });
  });

  describe('suggestRequest', () => {
    beforeEach(() => {
      jest.clearAllMocks();

      // Mock command files
      glob.mockResolvedValue(['build.md', 'fix.md', 'test.md']);
      path.join.mockImplementation((...args: string[]) => args.filter(a => a).join('/'));

      // Mock file content
      fs.readFile.mockImplementation((filePath: string) => {
        if (filePath.includes('build.md')) {
          return Promise.resolve('description: Build a new feature from specification');
        }
        if (filePath.includes('fix.md')) {
          return Promise.resolve('description: Fix an issue with defined boundaries');
        }
        if (filePath.includes('test.md')) {
          return Promise.resolve('description: Generate comprehensive tests');
        }
        return Promise.resolve('description: Generic command');
      });
    });

    it('should suggest command for build request', async () => {
      const result = await service.suggestRequest('I want to build a new feature');

      expect(result.primary.command).toBe('/siftcoder:build');
      expect(result.primary.confidence).toBeGreaterThan(50);
    });

    it('should suggest command for fix request', async () => {
      const result = await service.suggestRequest('There is a bug I need to fix');

      expect(result.primary.command).toContain('fix');
      expect(result.primary.confidence).toBeGreaterThan(0);
    });

    it('should suggest command for test request', async () => {
      const result = await service.suggestRequest('I need to write tests');

      expect(result.primary.command).toContain('test');
      expect(result.primary.confidence).toBeGreaterThan(0);
    });

    it('should return primary command and alternatives', async () => {
      const result = await service.suggestRequest('create something new');

      expect(result.primary).toBeDefined();
      expect(Array.isArray(result.alternatives)).toBe(true);
    });

    it('should include user intent in result', async () => {
      const result = await service.suggestRequest('help me understand the codebase');

      expect(result.userIntent).toBeTruthy();
      expect(typeof result.userIntent).toBe('string');
    });

    it('should include keywords in result', async () => {
      const result = await service.suggestRequest('add authentication feature');

      expect(result.keywords).toBeDefined();
      expect(Array.isArray(result.keywords)).toBe(true);
    });

    it('should limit alternatives to 3', async () => {
      const result = await service.suggestRequest('test request');

      expect(result.alternatives.length).toBeLessThanOrEqual(3);
    });

    it('should sort by confidence', async () => {
      const result = await service.suggestRequest('fix a bug');

      if (result.alternatives.length > 1) {
        const confidences = result.alternatives.map((alt: CommandMatch) => alt.confidence);
        const sorted = [...confidences].sort((a, b) => b - a);
        expect(confidences).toEqual(sorted);
      }
    });
  });

  describe('analyzeRequest', () => {
    it('should extract keywords from request', async () => {
      glob.mockResolvedValue(['build.md']);
      path.join = jest.fn((...args: string[]) => args.join('/'));
      fs.readFile.mockResolvedValue('description: Build feature');

      const result = await service.suggestRequest('Add user authentication to the app');

      expect(result.keywords).toContain('add');
      expect(result.keywords).toContain('authentication');
    });

    it('should detect create intent', async () => {
      glob.mockResolvedValue(['build.md']);
      path.join = jest.fn((...args: string[]) => args.join('/'));
      fs.readFile.mockResolvedValue('description: Build feature');

      const result = await service.suggestRequest('create a new component');

      expect(result.userIntent).toBe('Create new feature or functionality');
    });

    it('should detect fix intent', async () => {
      glob.mockResolvedValue(['fix.md']);
      path.join = jest.fn((...args: string[]) => args.join('/'));
      fs.readFile.mockResolvedValue('description: Fix issue');

      const result = await service.suggestRequest('fix this bug');

      expect(result.userIntent).toBe('Fix or debug existing code');
    });

    it('should detect refactor intent', async () => {
      glob.mockResolvedValue(['refactor.md']);
      path.join = jest.fn((...args: string[]) => args.join('/'));
      fs.readFile.mockResolvedValue('description: Refactor code');

      const result = await service.suggestRequest('refactor this module');

      expect(result.userIntent).toBe('Refactor or improve existing code');
    });

    it('should detect document intent', async () => {
      glob.mockResolvedValue(['document.md']);
      path.join = jest.fn((...args: string[]) => args.join('/'));
      fs.readFile.mockResolvedValue('description: Generate documentation');

      const result = await service.suggestRequest('generate docs for this');

      expect(result.userIntent).toBe('Generate documentation');
    });

    it('should detect test intent', async () => {
      glob.mockResolvedValue(['test.md']);
      path.join = jest.fn((...args: string[]) => args.join('/'));
      fs.readFile.mockResolvedValue('description: Generate tests');

      const result = await service.suggestRequest('add test coverage');

      expect(result.userIntent).toBe('Test or add test coverage');
    });

    it('should detect understand intent', async () => {
      glob.mockResolvedValue(['understand.md']);
      path.join = jest.fn((...args: string[]) => args.join('/'));
      fs.readFile.mockResolvedValue('description: Understand code');

      const result = await service.suggestRequest('how does this work?');

      expect(result.userIntent).toBe('Understand or learn codebase');
    });

    it('should detect review intent', async () => {
      glob.mockResolvedValue(['review.md']);
      path.join = jest.fn((...args: string[]) => args.join('/'));
      fs.readFile.mockResolvedValue('description: Review code');

      const result = await service.suggestRequest('review this PR');

      expect(result.userIntent).toBe('Review or analyze code');
    });

    it('should default to general assistance for unknown intent', async () => {
      glob.mockResolvedValue(['wizard.md']);
      path.join = jest.fn((...args: string[]) => args.join('/'));
      fs.readFile.mockResolvedValue('description: Wizard');

      const result = await service.suggestRequest('help me with something generic');

      expect(result.userIntent).toBe('General assistance');
    });
  });

  describe('Command matching', () => {
    beforeEach(() => {
      glob.mockResolvedValue(['build.md', 'test.md']);
      path.join = jest.fn((...args: string[]) => args.join('/'));
      fs.readFile.mockImplementation((filePath: string) => {
        if (filePath.includes('build.md')) {
          return Promise.resolve('description: Build feature add create');
        }
        if (filePath.includes('test.md')) {
          return Promise.resolve('description: Test coverage spec tdd');
        }
        return Promise.resolve('description: Generic');
      });
    });

    it('should score commands by keyword matches', async () => {
      const result = await service.suggestRequest('add a build feature');

      expect(result.primary.command).toContain('build');
      expect(result.primary.confidence).toBeGreaterThan(0);
    });

    it('should boost score for intent matches', async () => {
      const result = await service.suggestRequest('I want to add tests');

      expect(result.primary.command).toContain('test');
    });

    it('should add reason for match', async () => {
      const result = await service.suggestRequest('create feature');

      expect(result.primary.reason).toBeTruthy();
      expect(typeof result.primary.reason).toBe('string');
    });

    it('should include command name in match', async () => {
      const result = await service.suggestRequest('test this');

      expect(result.primary.name).toBe('test');
    });

    it('should include description in match', async () => {
      const result = await service.suggestRequest('test this');

      expect(result.primary.description).toBeTruthy();
    });

    it('should cap confidence at 100', async () => {
      const result = await service.suggestRequest('build add create feature test tdd');

      expect(result.primary.confidence).toBeLessThanOrEqual(100);
    });
  });

  describe('Context awareness', () => {
    beforeEach(() => {
      glob.mockResolvedValue(['document.md', 'test.md']);
      path.join = jest.fn((...args: string[]) => args.join('/'));
      fs.readFile.mockImplementation((filePath: string) => {
        if (filePath.includes('document.md')) {
          return Promise.resolve('description: Generate documentation');
        }
        if (filePath.includes('test.md')) {
          return Promise.resolve('description: Generate tests');
        }
        return Promise.resolve('description: Generic');
      });
    });

    it('should consider current file type in scoring', async () => {
      const result = await service.suggestRequest('help with this file', {
        currentFile: 'test.spec.ts'
      });

      expect(result.primary.command).toBeTruthy();
    });

    it('should boost score for file-relevant commands', async () => {
      const result = await service.suggestRequest('analyze this', {
        currentFile: 'component.tsx'
      });

      // Should prefer commands relevant to TSX files
      expect(result.primary).toBeDefined();
    });
  });

  describe('Default suggestion', () => {
    it('should return wizard as default when no match', async () => {
      glob.mockResolvedValue([]);
      const result = await service.suggestRequest('xyzabc nonsense');

      expect(result.primary.command).toContain('wizard');
      expect(result.primary.confidence).toBe(50);
    });

    it('should include reason for default suggestion', async () => {
      glob.mockResolvedValue([]);
      const result = await service.suggestRequest('unclear request');

      expect(result.primary.reason).toContain('Interactive guide');
    });
  });

  describe('Keyword extraction', () => {
    beforeEach(() => {
      glob.mockResolvedValue(['build.md']);
      path.join = jest.fn((...args: string[]) => args.join('/'));
      fs.readFile.mockResolvedValue('description: Build feature');
    });

    it('should extract action keywords', async () => {
      const result = await service.suggestRequest('create build add implement');

      expect(result.keywords).toContain('add');
      expect(result.keywords).toContain('create');
    });

    it('should extract domain keywords', async () => {
      const result = await service.suggestRequest('add user authentication login');

      expect(result.keywords).toContain('auth');
      expect(result.keywords).toContain('user');
    });

    it('should extract Salesforce-specific keywords', async () => {
      const result = await service.suggestRequest('create apex trigger for salesforce integration');

      expect(result.keywords).toContain('salesforce');
      expect(result.keywords).toContain('apex');
    });

    it('should be case insensitive', async () => {
      const result = await service.suggestRequest('BUILD Feature');

      expect(result.keywords).toContain('action');  // Category
      expect(result.keywords).toContain('build');   // Matched word
    });

    it('should handle multiple keywords', async () => {
      const result = await service.suggestRequest('add authentication to improve security');

      expect(result.keywords.length).toBeGreaterThan(2);
    });
  });

  describe('Command categories', () => {
    beforeEach(() => {
      glob.mockResolvedValue(['sf-deploy.md', 'build.md']);
      path.join = jest.fn((...args: string[]) => args.join('/'));
      fs.readFile.mockResolvedValue('description: Deploy code');
    });

    it('should categorize Salesforce commands', async () => {
      const result = await service.suggestRequest('deploy to salesforce');

      expect(result.primary.category).toBe('Salesforce');
    });

    it('should categorize core commands', async () => {
      const result = await service.suggestRequest('build this');

      expect(result.primary.category).toBe('Core');
    });
  });

  describe('Edge cases', () => {
    it('should handle empty request', async () => {
      glob.mockResolvedValue([]);

      const result = await service.suggestRequest('');

      expect(result.primary).toBeDefined();
    });

    it('should handle very long request', async () => {
      glob.mockResolvedValue(['build.md']);
      path.join = jest.fn((...args: string[]) => args.join('/'));
      fs.readFile.mockResolvedValue('description: Build');

      const longRequest = 'x'.repeat(10000);
      const result = await service.suggestRequest(longRequest);

      expect(result.primary).toBeDefined();
    });

    it('should handle special characters', async () => {
      glob.mockResolvedValue(['build.md']);
      path.join = jest.fn((...args: string[]) => args.join('/'));
      fs.readFile.mockResolvedValue('description: Build');

      const result = await service.suggestRequest('fix! @#$ bug');

      expect(result.primary).toBeDefined();
    });

    it('should handle unicode characters', async () => {
      glob.mockResolvedValue(['build.md']);
      path.join = jest.fn((...args: string[]) => args.join('/'));
      fs.readFile.mockResolvedValue('description: Build');

      const result = await service.suggestRequest('build 世界 🌍');

      expect(result.primary).toBeDefined();
    });

    it('should handle no command files', async () => {
      glob.mockResolvedValue([]);

      const result = await service.suggestRequest('help me');

      expect(result.primary.command).toContain('wizard');
    });
  });

  describe('Caching', () => {
    it('should cache loaded commands', async () => {
      glob.mockResolvedValue(['build.md']);
      path.join = jest.fn((...args: string[]) => args.join('/'));
      fs.readFile.mockResolvedValue('description: Build');

      await service.suggestRequest('build');
      await service.suggestRequest('build again');

      // Should only call glob once
      expect(glob).toHaveBeenCalledTimes(1);
    });
  });

  describe('Error handling', () => {
    it('should handle file read errors gracefully', async () => {
      glob.mockResolvedValue(['build.md']);
      path.join = jest.fn((...args: string[]) => args.join('/'));
      fs.readFile.mockRejectedValue(new Error('Read failed'));

      const result = await service.suggestRequest('build');

      // Should still return a result
      expect(result.primary).toBeDefined();
    });

    it('should handle glob errors gracefully', async () => {
      glob.mockRejectedValue(new Error('Glob failed'));

      const result = await service.suggestRequest('build');

      // Should still return a result (default to wizard)
      expect(result.primary.command).toContain('wizard');
    });
  });
});
