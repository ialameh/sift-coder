/**
 * MCP Config Service Tests
 * Tests for MCP server configuration management
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';

// Mock dependencies FIRST
vi.mock('../utils/file-utils', () => ({
  FileUtils: {
    exists: vi.fn().mockResolvedValue(false),
    readJSON: vi.fn().mockResolvedValue({ mcpServers: [] }),
    writeJSON: vi.fn().mockResolvedValue(undefined),
    mkdir: vi.fn().mockResolvedValue(undefined),
    readFile: vi.fn().mockResolvedValue('')
  }
}));

vi.mock('fs', () => ({
  existsSync: vi.fn().mockReturnValue(false),
  readFileSync: vi.fn().mockReturnValue(JSON.stringify({ dependencies: {}, devDependencies: {} }))
}));

vi.mock('os', () => ({
  homedir: vi.fn().mockReturnValue('/home/test')
}));

vi.mock('../utils/process-utils', () => ({
  ProcessUtils: {
    getPlatform: vi.fn().mockReturnValue({ platform: 'darwin' as NodeJS.Platform, isWindows: false, isMac: true, isLinux: false }),
    exit: vi.fn().mockReturnValue(undefined)
  }
}));

// THEN import modules
import { MCPConfigService, MCPServerTemplate } from './mcp-config-service';
import { FileUtils } from '../utils/file-utils';
import { existsSync, readFileSync } from 'fs';
import { homedir } from 'os';
import { ProcessUtils } from '../utils/process-utils';

const mockedFileUtils = FileUtils;
const mockedProcessUtils = ProcessUtils;
const mockedExistsSync = existsSync;
const mockedReadFileSync = readFileSync;
const mockedHomedir = homedir;

describe('MCPConfigService', () => {
  let service: MCPConfigService;
  const mockProjectRoot = '/test/project';

  beforeEach(() => {
    vi.clearAllMocks();
    service = new MCPConfigService(mockProjectRoot);
    mockedHomedir.mockReturnValue('/home/test');
  });

  describe('Constructor', () => {
    it('should initialize with project root', () => {
      expect(service).toBeInstanceOf(MCPConfigService);
    });

    it('should use cwd if project root not provided', () => {
      const cwdService = new MCPConfigService();

      expect(cwdService).toBeInstanceOf(MCPConfigService);
    });
  });

  describe('loadTemplates', () => {
    it('should load templates from file', async () => {
      const templates = {
        mcpServers: [
          {
            name: 'test-server',
            command: 'npx',
            args: ['-y', 'test-package'],
            description: 'Test server'
          }
        ]
      };

      mockedFileUtils.exists.mockResolvedValue(true);
      mockedFileUtils.readJSON.mockResolvedValue(templates);

      const loaded = await service.loadTemplates();

      expect(loaded).toEqual(templates.mcpServers);
      expect(loaded).toHaveLength(1);
      expect(loaded[0].name).toBe('test-server');
    });

    it('should return default templates if file not found', async () => {
      mockedFileUtils.exists.mockResolvedValue(false);

      const loaded = await service.loadTemplates();

      expect(loaded).toBeInstanceOf(Array);
      expect(loaded.length).toBeGreaterThan(0);
    });

    it('should cache loaded templates', async () => {
      mockedFileUtils.exists.mockResolvedValue(true);
      mockedFileUtils.readJSON.mockResolvedValue({ mcpServers: [] });

      await service.loadTemplates();
      await service.loadTemplates();

      expect(mockedFileUtils.readJSON).toHaveBeenCalledTimes(1);
    });
  });

  describe('listAvailableServers', () => {
    it('should list all servers sorted by name', async () => {
      mockedFileUtils.exists.mockResolvedValue(true);
      mockedFileUtils.readJSON.mockResolvedValue({
        mcpServers: [
          { name: 'zebra-server', command: 'npx', args: [], description: 'Z' },
          { name: 'apple-server', command: 'npx', args: [], description: 'A' }
        ]
      });

      const servers = await service.listAvailableServers();

      expect(servers).toHaveLength(2);
      expect(servers[0].name).toBe('apple-server');
      expect(servers[1].name).toBe('zebra-server');
    });
  });

  describe('listByCategory', () => {
    it('should filter servers by category', async () => {
      mockedFileUtils.exists.mockResolvedValue(true);
      mockedFileUtils.readJSON.mockResolvedValue({
        mcpServers: [
          { name: 'server1', command: 'npx', args: [], description: 'S1', category: 'development' },
          { name: 'server2', command: 'npx', args: [], description: 'S2', category: 'database' },
          { name: 'server3', command: 'npx', args: [], description: 'S3', category: 'development' }
        ]
      });

      const devServers = await service.listByCategory('development');

      expect(devServers).toHaveLength(2);
      expect(devServers.every(s => s.category === 'development')).toBe(true);
    });

    it('should return empty array for category with no servers', async () => {
      mockedFileUtils.exists.mockResolvedValue(true);
      mockedFileUtils.readJSON.mockResolvedValue({
        mcpServers: [
          { name: 'server1', command: 'npx', args: [], description: 'S1', category: 'development' }
        ]
      });

      const dbServers = await service.listByCategory('database');

      expect(dbServers).toEqual([]);
    });
  });

  describe('listRecommended', () => {
    it('should list only recommended servers', async () => {
      mockedFileUtils.exists.mockResolvedValue(true);
      mockedFileUtils.readJSON.mockResolvedValue({
        mcpServers: [
          { name: 'server1', command: 'npx', args: [], description: 'S1', recommended: true },
          { name: 'server2', command: 'npx', args: [], description: 'S2', recommended: false },
          { name: 'server3', command: 'npx', args: [], description: 'S3', recommended: true }
        ]
      });

      const recommended = await service.listRecommended();

      expect(recommended).toHaveLength(2);
      expect(recommended.every(s => s.recommended)).toBe(true);
    });
  });

  describe('detectProjectCapabilities', () => {
    it('should detect Git repository', async () => {
      mockedFileUtils.exists.mockResolvedValue(true);
      mockedFileUtils.readJSON.mockResolvedValue({
        mcpServers: [
          {
            name: 'github',
            command: 'npx',
            args: [],
            description: 'GitHub',
            autoDetect: { files: ['.git/config'] }
          }
        ]
      });
      mockedFileUtils.exists.mockImplementation((path) => {
        return Promise.resolve(
          path.toString().includes('.git/config')
        );
      });

      const capabilities = await service.detectProjectCapabilities();

      expect(capabilities.github).toBe(true);
    });

    it('should detect TypeScript project', async () => {
      mockedFileUtils.exists.mockResolvedValue(true);
      mockedFileUtils.readJSON.mockResolvedValue({
        mcpServers: [
          {
            name: 'typescript-eslint',
            command: 'npx',
            args: [],
            description: 'TypeScript ESLint',
            autoDetect: { files: ['tsconfig.json'] }
          }
        ]
      });
      mockedFileUtils.exists.mockImplementation((path) => {
        return Promise.resolve(
          path.toString().includes('tsconfig.json')
        );
      });

      const capabilities = await service.detectProjectCapabilities();

      expect(capabilities['typescript-eslint']).toBe(true);
    });

    it('should detect dependencies', async () => {
      mockedFileUtils.exists.mockResolvedValue(true);
      mockedFileUtils.readJSON.mockResolvedValue({
        mcpServers: [
          {
            name: 'supabase',
            command: 'npx',
            args: [],
            description: 'Supabase',
            autoDetect: { dependencies: ['@supabase/supabase-js'] }
          }
        ]
      });
      mockedFileUtils.exists.mockImplementation((path) => {
        return Promise.resolve(
          path.toString().includes('package.json')
        );
      });
      mockedExistsSync.mockReturnValue(true);
      mockedReadFileSync.mockReturnValue(JSON.stringify({
        dependencies: {
          '@supabase/supabase-js': '^1.0.0'
        }
      }));

      const capabilities = await service.detectProjectCapabilities();

      expect(capabilities.supabase).toBe(true);
    });
  });

  describe('generateOptimalConfig', () => {
    it('should include recommended servers', async () => {
      mockedFileUtils.exists.mockResolvedValue(true);
      mockedFileUtils.readJSON.mockResolvedValue({
        mcpServers: [
          { name: 'memory', command: 'npx', args: ['-y', 'pkg'], description: 'Memory', recommended: true }
        ]
      });
      mockedFileUtils.exists.mockResolvedValue(false);

      const config = await service.generateOptimalConfig();

      expect(config.mcpServers.memory).toBeDefined();
      expect(config.mcpServers.memory.command).toBe('npx');
    });

    it('should include detected servers', async () => {
      mockedFileUtils.exists.mockResolvedValue(true);
      mockedFileUtils.readJSON.mockResolvedValue({
        mcpServers: [
          {
            name: 'github',
            command: 'npx',
            args: ['-y', 'pkg'],
            description: 'GitHub',
            autoDetect: { files: ['.git/config'] }
          }
        ]
      });
      mockedFileUtils.exists.mockImplementation((path) => {
        return Promise.resolve(
          path.toString().includes('.git/config')
        );
      });

      const config = await service.generateOptimalConfig();

      expect(config.mcpServers.github).toBeDefined();
    });
  });

  describe('saveConfig', () => {
    it('should save config to default path', async () => {
      mockedFileUtils.exists.mockResolvedValue(false);
      mockedFileUtils.writeJSON.mockResolvedValue();
      mockedFileUtils.exists.mockResolvedValue(true);
      mockedFileUtils.readJSON.mockResolvedValue({ mcpServers: [] });

      const consoleSpy = vi.spyOn(console, 'log').mockImplementation();

      await service.saveConfig();

      expect(mockedFileUtils.writeJSON).toHaveBeenCalled();
      expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('saved'));
      consoleSpy.mockRestore();
    });

    it('should save config to custom path', async () => {
      mockedFileUtils.exists.mockResolvedValue(false);
      mockedFileUtils.writeJSON.mockResolvedValue();
      mockedFileUtils.exists.mockResolvedValue(true);
      mockedFileUtils.readJSON.mockResolvedValue({ mcpServers: [] });

      const customPath = '/custom/config.json';
      await service.saveConfig(customPath);

      expect(mockedFileUtils.writeJSON).toHaveBeenCalledWith(customPath, expect.any(Object));
    });
  });

  describe('getConfigPath', () => {
    it('should return Unix path', () => {
      mockedProcessUtils.getPlatform.mockReturnValue({
        platform: 'linux' as NodeJS.Platform,
        isWindows: false,
        isMac: false,
        isLinux: true
      });

      const path = service.getConfigPath();

      expect(path).toContain('.claude');
      expect(path).toContain('mcp_servers.json');
    });

    it('should return Windows path', () => {
      mockedProcessUtils.getPlatform.mockReturnValue({
        platform: 'win32' as NodeJS.Platform,
        isWindows: true,
        isMac: false,
        isLinux: false
      });
      process.env.APPDATA = 'C:\\Users\\test\\AppData\\Roaming';

      const path = service.getConfigPath();

      expect(path).toContain('Claude');
      expect(path).toContain('mcp_servers.json');
    });
  });

  describe('formatServerList', () => {
    it('should format servers by category', async () => {
      mockedFileUtils.exists.mockResolvedValue(true);
      mockedFileUtils.readJSON.mockResolvedValue({
        mcpServers: [
          { name: 'memory', command: 'npx', args: [], description: 'Memory', category: 'productivity', recommended: true },
          { name: 'github', command: 'npx', args: [], description: 'GitHub', category: 'development' }
        ]
      });

      const servers = await service.listAvailableServers();
      const formatted = service.formatServerList(servers);

      expect(formatted).toContain('PRODUCTIVITY');
      expect(formatted).toContain('DEVELOPMENT');
      expect(formatted).toContain('memory');
      expect(formatted).toContain('github');
    });
  });

  describe('Edge cases', () => {
    it('should handle empty templates', async () => {
      mockedFileUtils.exists.mockResolvedValue(true);
      mockedFileUtils.readJSON.mockResolvedValue({ mcpServers: [] });

      const servers = await service.listAvailableServers();

      expect(servers).toEqual([]);
    });

    it('should handle missing category', async () => {
      mockedFileUtils.exists.mockResolvedValue(true);
      mockedFileUtils.readJSON.mockResolvedValue({
        mcpServers: [
          { name: 'server', command: 'npx', args: [], description: 'Server' }
        ]
      });

      const servers = await service.listByCategory('nonexistent');

      expect(servers).toEqual([]);
    });

    it('should handle servers without autoDetect', async () => {
      mockedFileUtils.exists.mockResolvedValue(true);
      mockedFileUtils.readJSON.mockResolvedValue({
        mcpServers: [
          { name: 'memory', command: 'npx', args: [], description: 'Memory', recommended: true }
        ]
      });
      mockedFileUtils.exists.mockResolvedValue(false);

      const capabilities = await service.detectProjectCapabilities();

      expect(capabilities.memory).toBeUndefined();
    });
  });

  describe('Cross-platform compatibility', () => {
    it('should handle Windows project root', () => {
      const windowsService = new MCPConfigService('C:\\\\test\\\\project');

      expect(windowsService).toBeInstanceOf(MCPConfigService);
    });

    it('should handle Unix project root', () => {
      const unixService = new MCPConfigService('/home/user/project');

      expect(unixService).toBeInstanceOf(MCPConfigService);
    });
  });
});
