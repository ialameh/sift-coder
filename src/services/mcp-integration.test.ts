/**
 * MCP Integration Service Tests
 * Tests for MCP server detection and integration
 */

import { McpIntegrationService, McpIntegrationResult, McpServerInfo, EnhancedFeatures } from './mcp-integration';

// Mock child_process
jest.mock('child_process');
const mockChildProcess = require('child_process');

describe('McpIntegrationService', () => {
  let service: McpIntegrationService;

  beforeEach(() => {
    service = new McpIntegrationService();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('constructor', () => {
    it('should initialize service', () => {
      expect(service).toBeInstanceOf(McpIntegrationService);
    });
  });

  describe('detect', () => {
    it('should detect both MCP servers when available', async () => {
      // Mock siftcoder-mcp available
      mockChildProcess.execSync = jest.fn()
        .mockReturnValueOnce('') // command -v siftcoder-mcp succeeds
        .mockReturnValueOnce(''); // curl to Ollama succeeds

      // Mock ContextDigger available
      mockChildProcess.execSync = jest.fn()
        .mockReturnValueOnce('') // command -v contextdigger succeeds
        .mockReturnValueOnce('contextdigger v1.0.0\n'); // version

      const result = await service.detect();

      expect(result.mcpServers['siftcoder-mcp']?.available).toBe(true);
      expect(result.mcpServers.contextdigger?.available).toBe(true);
      expect(result.enhancedFeatures.semanticSearch).toBe(true);
      expect(result.enhancedFeatures.areaDiscovery).toBe(true);
    });

    it('should return no servers when none available', async () => {
      // Mock both unavailable
      mockChildProcess.execSync = jest.fn()
        .mockImplementation((cmd: string) => {
          if (cmd.includes('command -v')) {
            throw new Error('Command not found');
          }
          return '';
        });

      const result = await service.detect();

      expect(result.mcpServers['siftcoder-mcp']?.available).toBe(false);
      expect(result.mcpServers.contextdigger?.available).toBe(false);
      expect(result.enhancedFeatures.semanticSearch).toBeUndefined();
      expect(result.enhancedFeatures.areaDiscovery).toBeUndefined();
    });

    it('should detect siftcoder-mcp only', async () => {
      mockChildProcess.execSync = jest.fn()
        .mockImplementation((cmd: string) => {
          if (cmd.includes('siftcoder-mcp')) {
            return '';
          }
          if (cmd.includes('contextdigger')) {
            throw new Error('Command not found');
          }
          return '';
        });

      const result = await service.detect();

      expect(result.mcpServers['siftcoder-mcp']?.available).toBe(true);
      expect(result.mcpServers.contextdigger?.available).toBe(false);
      expect(result.enhancedFeatures.semanticSearch).toBe(true);
      expect(result.enhancedFeatures.vectorStorage).toBe(true);
    });

    it('should detect ContextDigger only', async () => {
      mockChildProcess.execSync = jest.fn()
        .mockImplementation((cmd: string) => {
          if (cmd.includes('siftcoder-mcp')) {
            throw new Error('Command not found');
          }
          if (cmd.includes('contextdigger')) {
            return 'contextdigger v2.0.0\n';
          }
          return '';
        });

      const result = await service.detect();

      expect(result.mcpServers['siftcoder-mcp']?.available).toBe(false);
      expect(result.mcpServers.contextdigger?.available).toBe(true);
      expect(result.enhancedFeatures.areaDiscovery).toBe(true);
      expect(result.enhancedFeatures.symbolIndexing).toBe(true);
      expect(result.enhancedFeatures.mermaidDiagrams).toBe(true);
      expect(result.enhancedFeatures.governanceBudgets).toBe(true);
    });
  });

  describe('checkSiftcoderMcp', () => {
    it('should detect siftcoder-mcp with Ollama running', async () => {
      mockChildProcess.execSync = jest.fn()
        .mockImplementation((cmd: string, options: any) => {
          if (cmd.includes('command -v siftcoder-mcp')) {
            return '';
          }
          if (cmd.includes('curl')) {
            return '{}';
          }
          return '';
        });

      // Access private method through detect
      const result = await service.detect();

      expect(result.mcpServers['siftcoder-mcp']?.available).toBe(true);
      expect(result.mcpServers['siftcoder-mcp']?.ollamaStatus).toBe('running');
    });

    it('should detect siftcoder-mcp with Ollama unavailable', async () => {
      mockChildProcess.execSync = jest.fn()
        .mockImplementation((cmd: string, options: any) => {
          if (cmd.includes('command -v siftcoder-mcp')) {
            return '';
          }
          if (cmd.includes('curl')) {
            throw new Error('Connection refused');
          }
          return '';
        });

      const result = await service.detect();

      expect(result.mcpServers['siftcoder-mcp']?.available).toBe(true);
      expect(result.mcpServers['siftcoder-mcp']?.ollamaStatus).toBe('unavailable');
    });

    it('should return capabilities when available', async () => {
      mockChildProcess.execSync = jest.fn().mockReturnValue('');

      const result = await service.detect();

      expect(result.mcpServers['siftcoder-mcp']?.capabilities).toEqual([
        'knowledge_search',
        'knowledge_add',
        'code_embed',
        'similarity_find'
      ]);
    });

    it('should return install instructions when not available', async () => {
      mockChildProcess.execSync = jest.fn()
        .mockImplementation((cmd: string) => {
          if (cmd.includes('siftcoder-mcp')) {
            throw new Error('Command not found');
          }
          return '';
        });

      const result = await service.detect();

      expect(result.mcpServers['siftcoder-mcp']?.available).toBe(false);
      expect(result.mcpServers['siftcoder-mcp']?.install).toBe('npm install -g @siftcoder/mcp');
    });
  });

  describe('checkContextDigger', () => {
    it('should detect ContextDigger with version', async () => {
      const versionOutput = 'contextdigger version 1.5.0\nBuild: 2024-01-01';

      mockChildProcess.execSync = jest.fn()
        .mockImplementation((cmd: string, options: any) => {
          if (cmd.includes('command -v contextdigger')) {
            return '';
          }
          if (cmd.includes('--version')) {
            return versionOutput;
          }
          return '';
        });

      const result = await service.detect();

      expect(result.mcpServers.contextdigger?.available).toBe(true);
      expect(result.mcpServers.contextdigger?.version).toBe('contextdigger version 1.5.0');
    });

    it('should handle version check failure', async () => {
      mockChildProcess.execSync = jest.fn()
        .mockImplementation((cmd: string, options: any) => {
          if (cmd.includes('command -v contextdigger')) {
            return '';
          }
          if (cmd.includes('--version')) {
            throw new Error('Version check failed');
          }
          return '';
        });

      const result = await service.detect();

      expect(result.mcpServers.contextdigger?.available).toBe(true);
      expect(result.mcpServers.contextdigger?.version).toBe('unknown');
    });

    it('should return capabilities when available', async () => {
      mockChildProcess.execSync = jest.fn().mockReturnValue('');

      const result = await service.detect();

      expect(result.mcpServers.contextdigger?.capabilities).toEqual([
        'dig',
        'status',
        'focus',
        'render',
        'knowledge',
        'debug-analyze'
      ]);
    });

    it('should return install instructions when not available', async () => {
      mockChildProcess.execSync = jest.fn()
        .mockImplementation((cmd: string) => {
          if (cmd.includes('contextdigger')) {
            throw new Error('Command not found');
          }
          return '';
        });

      const result = await service.detect();

      expect(result.mcpServers.contextdigger?.available).toBe(false);
      expect(result.mcpServers.contextdigger?.install).toBe('See https://github.com/contextdigger/contextdigger-core');
    });
  });

  describe('Enhanced Features', () => {
    it('should enable semantic search when siftcoder-mcp available', async () => {
      mockChildProcess.execSync = jest.fn().mockReturnValue('');

      const result = await service.detect();

      expect(result.enhancedFeatures.semanticSearch).toBe(true);
      expect(result.enhancedFeatures.vectorStorage).toBe(true);
    });

    it('should enable area discovery features when ContextDigger available', async () => {
      mockChildProcess.execSync = jest.fn()
        .mockImplementation((cmd: string) => {
          if (cmd.includes('siftcoder-mcp')) {
            throw new Error('Not found');
          }
          return '';
        });

      const result = await service.detect();

      expect(result.enhancedFeatures.areaDiscovery).toBe(true);
      expect(result.enhancedFeatures.symbolIndexing).toBe(true);
      expect(result.enhancedFeatures.mermaidDiagrams).toBe(true);
      expect(result.enhancedFeatures.governanceBudgets).toBe(true);
    });

    it('should enable all features when both servers available', async () => {
      mockChildProcess.execSync = jest.fn().mockReturnValue('');

      const result = await service.detect();

      expect(result.enhancedFeatures.semanticSearch).toBe(true);
      expect(result.enhancedFeatures.vectorStorage).toBe(true);
      expect(result.enhancedFeatures.areaDiscovery).toBe(true);
      expect(result.enhancedFeatures.symbolIndexing).toBe(true);
      expect(result.enhancedFeatures.mermaidDiagrams).toBe(true);
      expect(result.enhancedFeatures.governanceBudgets).toBe(true);
    });

    it('should have no enhanced features when no servers available', async () => {
      mockChildProcess.execSync = jest.fn()
        .mockImplementation(() => {
          throw new Error('Command not found');
        });

      const result = await service.detect();

      expect(result.enhancedFeatures.semanticSearch).toBeUndefined();
      expect(result.enhancedFeatures.vectorStorage).toBeUndefined();
      expect(result.enhancedFeatures.areaDiscovery).toBeUndefined();
      expect(result.enhancedFeatures.symbolIndexing).toBeUndefined();
      expect(result.enhancedFeatures.mermaidDiagrams).toBeUndefined();
      expect(result.enhancedFeatures.governanceBudgets).toBeUndefined();
    });
  });

  describe('Error handling', () => {
    it('should handle command execution errors gracefully', async () => {
      mockChildProcess.execSync = jest.fn()
        .mockImplementation(() => {
          throw new Error('System error');
        });

      const result = await service.detect();

      expect(result.mcpServers['siftcoder-mcp']?.available).toBe(false);
      expect(result.mcpServers.contextdigger?.available).toBe(false);
    });

    it('should handle timeout errors', async () => {
      mockChildProcess.execSync = jest.fn()
        .mockImplementation((cmd: string, options: any) => {
          if (options?.timeout) {
            const error = new Error('Command timed out');
            (error as any).code = 'ETIMEDOUT';
            throw error;
          }
          return '';
        });

      // Should not throw, should return unavailable
      const result = await service.detect();

      expect(result).toBeDefined();
    });

    it('should handle ENOENT errors', async () => {
      mockChildProcess.execSync = jest.fn()
        .mockImplementation(() => {
          const error = new Error('Command not found');
          (error as any).code = 'ENOENT';
          throw error;
        });

      const result = await service.detect();

      expect(result.mcpServers['siftcoder-mcp']?.available).toBe(false);
      expect(result.mcpServers.contextdigger?.available).toBe(false);
    });
  });

  describe('Cross-platform compatibility', () => {
    it('should use command -v on Unix systems', async () => {
      const originalPlatform = process.platform;
      Object.defineProperty(process, 'platform', { value: 'linux' });

      mockChildProcess.execSync = jest.fn()
        .mockImplementation((cmd: string) => {
          expect(cmd).toContain('command -v');
          throw new Error('Not found');
        });

      await service.detect();

      Object.defineProperty(process, 'platform', { value: originalPlatform });
    });

    it('should work on different platforms', async () => {
      mockChildProcess.execSync = jest.fn().mockReturnValue('');

      // Test on different platforms
      const platforms = ['linux', 'darwin', 'win32'];

      for (const platform of platforms) {
        Object.defineProperty(process, 'platform', { value: platform });

        const result = await service.detect();

        expect(result).toBeDefined();
        expect(result.mcpServers).toBeDefined();
      }

      // Reset platform
      Object.defineProperty(process, 'platform', { value: process.platform });
    });
  });

  describe('Ollama detection', () => {
    it('should check Ollama with timeout', async () => {
      mockChildProcess.execSync = jest.fn()
        .mockImplementation((cmd: string, options: any) => {
          if (cmd.includes('curl')) {
            expect(options.timeout).toBe(1000);
            return '{}';
          }
          return '';
        });

      await service.detect();

      expect(mockChildProcess.execSync).toHaveBeenCalledWith(
        expect.stringContaining('curl'),
        expect.objectContaining({ timeout: 1000 })
      );
    });

    it('should use correct Ollama endpoint', async () => {
      mockChildProcess.execSync = jest.fn()
        .mockImplementation((cmd: string) => {
          if (cmd.includes('curl')) {
            expect(cmd).toContain('http://localhost:11434/api/tags');
            return '{}';
          }
          return '';
        });

      await service.detect();

      expect(mockChildProcess.execSync).toHaveBeenCalledWith(
        expect.stringContaining('http://localhost:11434/api/tags'),
        expect.anything()
      );
    });

    it('should handle Ollama not running', async () => {
      mockChildProcess.execSync = jest.fn()
        .mockImplementation((cmd: string, options: any) => {
          if (cmd.includes('curl')) {
            throw new Error('ECONNREFUSED');
          }
          return '';
        });

      const result = await service.detect();

      expect(result.mcpServers['siftcoder-mcp']?.ollamaStatus).toBe('unavailable');
    });
  });

  describe('Version parsing', () => {
    it('should parse single line version output', async () => {
      mockChildProcess.execSync = jest.fn()
        .mockImplementation((cmd: string, options: any) => {
          if (cmd.includes('--version')) {
            return 'contextdigger v1.0.0';
          }
          return '';
        });

      const result = await service.detect();

      expect(result.mcpServers.contextdigger?.version).toBe('contextdigger v1.0.0');
    });

    it('should parse multi-line version output', async () => {
      mockChildProcess.execSync = jest.fn()
        .mockImplementation((cmd: string, options: any) => {
          if (cmd.includes('--version')) {
            return 'contextdigger v1.0.0\nBuild: 12345\nCommit: abc123\n';
          }
          return '';
        });

      const result = await service.detect();

      expect(result.mcpServers.contextdigger?.version).toBe('contextdigger v1.0.0');
    });

    it('should handle empty version output', async () => {
      mockChildProcess.execSync = jest.fn()
        .mockImplementation((cmd: string, options: any) => {
          if (cmd.includes('--version')) {
            return '';
          }
          return '';
        });

      const result = await service.detect();

      expect(result.mcpServers.contextdigger?.version).toBe('');
    });
  });
});
