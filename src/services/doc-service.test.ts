/**
 * Documentation Service Tests
 * Tests for automatic documentation generation
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';

// Mock dependencies FIRST
vi.mock('../utils/file-utils', () => {
  return {
    FileUtils: {
      exists: vi.fn().mockResolvedValue(false),
      readJSON: vi.fn().mockResolvedValue({}),
      writeJSON: vi.fn().mockResolvedValue(undefined),
      mkdir: vi.fn().mockResolvedValue(undefined),
      readFile: vi.fn().mockResolvedValue(''),
      writeFile: vi.fn().mockResolvedValue(undefined),
      glob: vi.fn().mockResolvedValue([]),
      stat: vi.fn().mockResolvedValue({ isFile: () => true }),
      listFiles: vi.fn().mockResolvedValue([])
    }
  };
});

vi.mock('glob', () => {
  return {
    glob: vi.fn().mockResolvedValue([])
  };
});

vi.mock('../utils/process-utils', () => {
  return {
    ProcessUtils: {
      exit: vi.fn().mockReturnValue(undefined),
      exec: vi.fn().mockResolvedValue({ stdout: '', stderr: '', exitCode: 0 })
    }
  };
});

// THEN import modules
import { DocService } from './doc-service';
import { FileUtils } from '../utils/file-utils';
import { glob } from 'glob';
import { ProcessUtils } from '../utils/process-utils';

const mockedFileUtils = FileUtils;
const mockedGlob = glob;
const mockedProcessUtils = ProcessUtils;

describe('DocService', () => {
  let service: DocService;
  const mockProjectRoot = '/test/project';

  beforeEach(() => {
    vi.clearAllMocks();
    service = new DocService(mockProjectRoot);
  });

  describe('Constructor', () => {
    it('should initialize with default config', () => {
      expect(service).toBeInstanceOf(DocService);
    });

    it('should initialize with custom config', () => {
      const customService = new DocService(mockProjectRoot, {
        outputDir: 'custom-docs',
        includePatterns: ['src/**/*.ts'],
        excludePatterns: ['**/*.test.ts'],
        generateCodemaps: false
      });

      expect(customService).toBeInstanceOf(DocService);
    });
  });

  describe('generateDocs', () => {
    it('should generate all documentation', async () => {
      mockedFileUtils.mkdir.mockResolvedValue();
      mockedFileUtils.writeFile.mockResolvedValue();
      mockedFileUtils.exists.mockResolvedValue(true);
      mockedFileUtils.readFile.mockResolvedValue('');
      mockedFileUtils.readJSON.mockResolvedValue({
        name: 'test',
        version: '1.0.0',
        scripts: { test: 'jest' }
      });
      mockedGlob.mockResolvedValue([]);

      const consoleSpy = vi.spyOn(console, 'log').mockImplementation();

      await service.generateDocs();

      expect(mockedFileUtils.mkdir).toHaveBeenCalled();
      expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('Generating'));
      consoleSpy.mockRestore();
    });
  });

  describe('generateContributorGuide', () => {
    it('should generate contributor guide', async () => {
      mockedFileUtils.writeFile.mockResolvedValue();
      mockedFileUtils.exists.mockResolvedValue(true);
      mockedFileUtils.readFile.mockResolvedValue('');
      mockedFileUtils.readJSON.mockResolvedValue({
        name: 'test-project',
        version: '1.0.0',
        description: 'Test project',
        scripts: {
          test: 'jest',
          build: 'tsc',
          lint: 'eslint'
        }
      });

      await service.generateContributorGuide();

      expect(mockedFileUtils.writeFile).toHaveBeenCalledWith(
        expect.stringContaining('CONTRIBUTING.md'),
        expect.stringContaining('Contributor Guide')
      );
    });

    it('should handle missing package.json', async () => {
      mockedFileUtils.writeFile.mockResolvedValue();
      mockedFileUtils.exists.mockResolvedValue(false);

      await service.generateContributorGuide();

      expect(mockedFileUtils.writeFile).toHaveBeenCalled();
    });
  });

  describe('generateRunbook', () => {
    it('should generate runbook', async () => {
      mockedFileUtils.writeFile.mockResolvedValue();

      await service.generateRunbook();

      expect(mockedFileUtils.writeFile).toHaveBeenCalledWith(
        expect.stringContaining('RUNBOOK.md'),
        expect.stringContaining('Runbook')
      );
    });
  });

  describe('generateAPIDocumentation', () => {
    it('should generate API docs', async () => {
      mockedFileUtils.writeFile.mockResolvedValue();
      mockedGlob.mockResolvedValue(['src/service.ts']);
      mockedFileUtils.readFile.mockResolvedValue(`
        export class TestService {
          constructor() {}
          testMethod() {}
        }
        export const testFunction = () => {};
      `);

      await service.generateAPIDocumentation();

      expect(mockedFileUtils.writeFile).toHaveBeenCalledWith(
        expect.stringContaining('API.md'),
        expect.stringContaining('API Documentation')
      );
    });

    it('should handle no source files', async () => {
      mockedFileUtils.writeFile.mockResolvedValue();
      mockedGlob.mockResolvedValue([]);

      await service.generateAPIDocumentation();

      expect(mockedFileUtils.writeFile).toHaveBeenCalled();
    });
  });

  describe('updateCodemaps', () => {
    it('should generate codemaps', async () => {
      mockedFileUtils.mkdir.mockResolvedValue();
      mockedFileUtils.writeFile.mockResolvedValue();
      mockedGlob.mockResolvedValue(['src/service.ts', 'src/utils/helper.ts']);
      mockedFileUtils.readFile.mockResolvedValue(`
        import { helper } from './helper';
        export class Service {
          test() {}
        }
      `);

      await service.updateCodemaps();

      expect(mockedFileUtils.mkdir).toHaveBeenCalled();
      expect(mockedFileUtils.writeFile).toHaveBeenCalledTimes(3);
    });

    it('should skip if generateCodemaps is false', async () => {
      const noCodemapsService = new DocService(mockProjectRoot, {
        generateCodemaps: false
      });
      mockedFileUtils.mkdir.mockResolvedValue();
      mockedFileUtils.writeFile.mockResolvedValue();

      await noCodemapsService.generateDocs();

      // Should still generate other docs
      expect(mockedFileUtils.writeFile).toHaveBeenCalled();
    });
  });

  describe('scanSourceFiles', () => {
    it('should scan source files', async () => {
      mockedGlob.mockResolvedValue(['src/service.ts']);
      mockedFileUtils.readFile.mockResolvedValue(`
        import { helper } from './helper';
        export function test() {}
        export const value = 42;
      `);

      const files = await (service as any).scanSourceFiles();

      expect(files).toBeInstanceOf(Map);
      expect(files.size).toBeGreaterThan(0);
    });

    it('should handle read errors gracefully', async () => {
      mockedGlob.mockResolvedValue(['src/service.ts']);
      mockedFileUtils.readFile.mockRejectedValue(new Error('Read error'));

      const files = await (service as any).scanSourceFiles();

      expect(files.size).toBe(0);
    });
  });

  describe('buildArchitectureGraph', () => {
    it('should build architecture graph', async () => {
      const files = new Map([
        ['src/service.ts', {
          path: 'src/service.ts',
          lines: 10,
          functions: 2,
          imports: ['./helper'],
          exports: ['Service']
        }]
      ]);

      const graph = await (service as any).buildArchitectureGraph(files);

      expect(graph).toBeInstanceOf(Map);
      expect(graph.size).toBeGreaterThan(0);
    });

    it('should categorize files correctly', async () => {
      const files = new Map([
        ['src/services/auth.ts', {
          path: 'src/services/auth.ts',
          lines: 10,
          functions: 2,
          imports: [],
          exports: ['AuthService']
        }],
        ['src/components/Button.tsx', {
          path: 'src/components/Button.tsx',
          lines: 20,
          functions: 3,
          imports: [],
          exports: ['Button']
        }],
        ['src/utils/helper.ts', {
          path: 'src/utils/helper.ts',
          lines: 5,
          functions: 1,
          imports: [],
          exports: ['helper']
        }]
      ]);

      const graph = await (service as any).buildArchitectureGraph(files);

      expect(graph.get('src/services/auth.ts')?.type).toBe('service');
      expect(graph.get('src/components/Button.tsx')?.type).toBe('component');
      expect(graph.get('src/utils/helper.ts')?.type).toBe('utility');
    });
  });

  describe('extractExports', () => {
    it('should extract class exports', () => {
      const content = 'export class TestService { constructor() {} }';

      const exports = (service as any).extractExports(content, 'test.ts');

      expect(exports).toHaveLength(1);
      expect(exports[0].name).toBe('TestService');
      expect(exports[0].type).toBe('class');
    });

    it('should extract function exports', () => {
      const content = 'export function testFunction() {}';

      const exports = (service as any).extractExports(content, 'test.ts');

      expect(exports).toHaveLength(1);
      expect(exports[0].name).toBe('testFunction');
      expect(exports[0].type).toBe('function');
    });

    it('should extract const exports', () => {
      const content = 'export const testValue = 42;';

      const exports = (service as any).extractExports(content, 'test.ts');

      expect(exports).toHaveLength(1);
      expect(exports[0].name).toBe('testValue');
      expect(exports[0].type).toBe('const');
    });

    it('should extract async function exports', () => {
      const content = 'export async function testAsync() {}';

      const exports = (service as any).extractExports(content, 'test.ts');

      expect(exports).toHaveLength(1);
      expect(exports[0].type).toBe('function');
    });

    it('should handle mixed exports', () => {
      const content = `
        export class TestClass {}
        export function testFunc() {}
        export const testConst = 42;
      `;

      const exports = (service as any).extractExports(content, 'test.ts');

      expect(exports).toHaveLength(3);
    });

    it('should handle no exports', () => {
      const content = 'const internal = 42;';

      const exports = (service as any).extractExports(content, 'test.ts');

      expect(exports).toHaveLength(0);
    });
  });

  describe('extractImports', () => {
    it('should extract imports', () => {
      const content = `
        import { test } from './test';
        import * as fs from 'fs';
        import axios from 'axios';
      `;

      const imports = (service as any).extractImports(content);

      expect(imports).toHaveLength(3);
      expect(imports).toContain('./test');
      expect(imports).toContain('fs');
      expect(imports).toContain('axios');
    });
  });

  describe('Edge cases', () => {
    it('should handle empty project root', () => {
      const emptyService = new DocService('');

      expect(emptyService).toBeInstanceOf(DocService);
    });

    it('should handle Windows paths', () => {
      const windowsService = new DocService('C:\\\\test\\\\project');

      expect(windowsService).toBeInstanceOf(DocService);
    });

    it('should handle custom output directory', async () => {
      const customService = new DocService(mockProjectRoot, {
        outputDir: 'custom/docs'
      });
      mockedFileUtils.mkdir.mockResolvedValue();
      mockedFileUtils.writeFile.mockResolvedValue();

      await customService.generateContributorGuide();

      expect(mockedFileUtils.mkdir).toHaveBeenCalledWith(expect.stringContaining('custom/docs'));
    });
  });

  describe('Cross-platform compatibility', () => {
    it('should handle Unix paths', () => {
      const unixService = new DocService('/home/user/project');

      expect(unixService).toBeInstanceOf(DocService);
    });

    it('should handle relative paths', () => {
      const relativeService = new DocService('./project');

      expect(relativeService).toBeInstanceOf(DocService);
    });
  });

  describe('Error handling', () => {
    it('should handle writeFile errors gracefully', async () => {
      mockedFileUtils.mkdir.mockRejectedValue(new Error('Write error'));

      // Should not throw
      await expect(service.generateContributorGuide()).resolves.not.toThrow();
    });

    it('should handle glob errors gracefully', async () => {
      mockedGlob.mockRejectedValue(new Error('Glob error'));
      mockedFileUtils.writeFile.mockResolvedValue();

      await expect(service.generateAPIDocumentation()).resolves.not.toThrow();
    });
  });
});
