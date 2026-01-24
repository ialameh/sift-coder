/**
 * MCP Config Service - MCP Server Configuration Management
 *
 * Provides pre-configured MCP server templates with auto-detection.
 * Supports 20+ MCP servers with project capability detection.
 *
 * SiftCoder Flavor:
 * - Cross-platform path handling
 * - JSON-based configuration
 * - Auto-detection of project capabilities
 * - CLI and module interfaces
 */
import { FileUtils } from '../utils/file-utils.js';
import { ProcessUtils } from '../utils/process-utils.js';
import { existsSync, readFileSync } from 'fs';
import { homedir } from 'os';
export interface MCPServerTemplate {
    name: string;
    command: string;
    args: string[];
    env?: Record<string, string>;
    description: string;
    category?: string;
    recommended?: boolean;
    autoDetect?: {
        files?: string[];
        dependencies?: string[];
        patterns?: string[];
    };
}
export interface ProjectCapabilities {
    [key: string]: boolean;
}
export interface MCPConfig {
    mcpServers: Record<string, {
        command: string;
        args: string[];
        env?: Record<string, string>;
    }>;
}
/**
 * MCP Config Service for server configuration and management
 */
export declare class MCPConfigService {
    private projectRoot;
    private templates;
    private fileUtils;
    private processUtils;
    private existsFn;
    private readFileSyncFn;
    private homedirFn;
    constructor(projectRoot?: string, fileUtils?: typeof FileUtils, processUtils?: typeof ProcessUtils, existsFn?: typeof existsSync, readFileSyncFn?: typeof readFileSync, homedirFn?: typeof homedir);
    /**
     * Load MCP server templates
     */
    loadTemplates(): Promise<MCPServerTemplate[]>;
    /**
     * Get default MCP server templates
     */
    private getDefaultTemplates;
    /**
     * List all available MCP server templates
     */
    listAvailableServers(): Promise<MCPServerTemplate[]>;
    /**
     * List servers by category
     */
    listByCategory(category: string): Promise<MCPServerTemplate[]>;
    /**
     * List recommended servers
     */
    listRecommended(): Promise<MCPServerTemplate[]>;
    /**
     * Detect project capabilities
     */
    detectProjectCapabilities(): Promise<ProjectCapabilities>;
    /**
     * Detect if a specific MCP server is needed
     */
    private detectServer;
    /**
     * Generate optimal MCP config for current project
     */
    generateOptimalConfig(): Promise<MCPConfig>;
    /**
     * Format server config for Claude MCP config
     */
    private formatServerConfig;
    /**
     * Generate MCP config as JSON string
     */
    generateConfigString(): Promise<string>;
    /**
     * Save MCP config to file
     */
    saveConfig(outputPath?: string): Promise<void>;
    /**
     * Get MCP config file path for current platform
     */
    getConfigPath(): string;
    /**
     * Display server list formatted
     */
    formatServerList(servers: MCPServerTemplate[]): string;
    /**
     * CLI interface
     */
    static main(): Promise<void>;
}
//# sourceMappingURL=mcp-config-service.d.ts.map