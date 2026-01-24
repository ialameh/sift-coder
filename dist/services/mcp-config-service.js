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
import { join, dirname } from 'path';
import { homedir } from 'os';
/**
 * MCP Config Service for server configuration and management
 */
export class MCPConfigService {
    projectRoot;
    templates;
    fileUtils;
    processUtils;
    existsFn;
    readFileSyncFn;
    homedirFn;
    constructor(projectRoot, fileUtils, processUtils, existsFn, readFileSyncFn, homedirFn) {
        this.projectRoot = projectRoot || process.cwd();
        this.templates = [];
        this.fileUtils = fileUtils || FileUtils;
        this.processUtils = processUtils || ProcessUtils;
        this.existsFn = existsFn || existsSync;
        this.readFileSyncFn = readFileSyncFn || readFileSync;
        this.homedirFn = homedirFn || homedir;
    }
    /**
     * Load MCP server templates
     */
    async loadTemplates() {
        if (this.templates.length > 0) {
            return this.templates;
        }
        try {
            // Try multiple possible template locations
            const possiblePaths = [
                join(this.projectRoot, 'templates', 'mcp-servers.json'),
                join(dirname(this.projectRoot), 'templates', 'mcp-servers.json'),
                join(process.cwd(), 'templates', 'mcp-servers.json')
            ];
            for (const path of possiblePaths) {
                if (await this.fileUtils.exists(path)) {
                    const data = await this.fileUtils.readJSON(path);
                    this.templates = data.mcpServers || [];
                    return this.templates;
                }
            }
            // Return default templates if file not found
            this.templates = this.getDefaultTemplates();
            return this.templates;
        }
        catch (error) {
            // Return default templates on error
            this.templates = this.getDefaultTemplates();
            return this.templates;
        }
    }
    /**
     * Get default MCP server templates
     */
    getDefaultTemplates() {
        return [
            {
                name: 'memory',
                command: 'npx',
                args: ['-y', '@modelcontextprotocol/server-memory'],
                description: 'Persistent memory across sessions',
                category: 'productivity',
                recommended: true
            },
            {
                name: 'filesystem',
                command: 'npx',
                args: ['-y', '@modelcontextprotocol/server-filesystem', this.projectRoot],
                description: 'Filesystem operations',
                category: 'filesystem'
            },
            {
                name: 'sequential-thinking',
                command: 'npx',
                args: ['-y', '@modelcontextprotocol/server-sequential-thinking'],
                description: 'Chain-of-thought reasoning',
                category: 'productivity',
                recommended: true
            },
            {
                name: 'github',
                command: 'npx',
                args: ['-y', '@modelcontextprotocol/server-github'],
                env: { GITHUB_PERSONAL_ACCESS_TOKEN: 'YOUR_GITHUB_PAT_HERE' },
                description: 'GitHub operations - PRs, issues, repos',
                category: 'development',
                autoDetect: {
                    files: ['.git/config']
                }
            }
        ];
    }
    /**
     * List all available MCP server templates
     */
    async listAvailableServers() {
        const templates = await this.loadTemplates();
        return templates.sort((a, b) => a.name.localeCompare(b.name));
    }
    /**
     * List servers by category
     */
    async listByCategory(category) {
        const templates = await this.loadTemplates();
        return templates.filter(t => t.category === category);
    }
    /**
     * List recommended servers
     */
    async listRecommended() {
        const templates = await this.loadTemplates();
        return templates.filter(t => t.recommended);
    }
    /**
     * Detect project capabilities
     */
    async detectProjectCapabilities() {
        const capabilities = {};
        const templates = await this.loadTemplates();
        for (const template of templates) {
            if (!template.autoDetect) {
                continue;
            }
            capabilities[template.name] = await this.detectServer(template);
        }
        return capabilities;
    }
    /**
     * Detect if a specific MCP server is needed
     */
    async detectServer(template) {
        const { autoDetect } = template;
        if (!autoDetect) {
            return false;
        }
        // Check files
        if (autoDetect.files) {
            for (const filePattern of autoDetect.files) {
                if (await this.fileUtils.exists(join(this.projectRoot, filePattern))) {
                    return true;
                }
            }
        }
        // Check dependencies in package.json
        if (autoDetect.dependencies) {
            try {
                const pkgPath = join(this.projectRoot, 'package.json');
                if (this.existsFn(pkgPath)) {
                    const pkg = JSON.parse(this.readFileSyncFn(pkgPath, 'utf-8'));
                    const deps = { ...pkg.dependencies, ...pkg.devDependencies };
                    for (const dep of autoDetect.dependencies) {
                        // Handle glob patterns in dependency names
                        const pattern = dep.replace('*', '.*');
                        const regex = new RegExp(`^${pattern}$`);
                        if (Object.keys(deps).some(key => regex.test(key))) {
                            return true;
                        }
                    }
                }
            }
            catch {
                // Continue on error
            }
        }
        // Check patterns (simple substring matching for now)
        if (autoDetect.patterns) {
            for (const pattern of autoDetect.patterns) {
                if (pattern === '.') {
                    return true; // Always match
                }
            }
        }
        return false;
    }
    /**
     * Generate optimal MCP config for current project
     */
    async generateOptimalConfig() {
        const capabilities = await this.detectProjectCapabilities();
        const templates = await this.loadTemplates();
        const recommended = await this.listRecommended();
        const mcpServers = {};
        // Add recommended servers
        for (const template of recommended) {
            mcpServers[template.name] = this.formatServerConfig(template);
        }
        // Add detected servers
        for (const template of templates) {
            if (capabilities[template.name] && !mcpServers[template.name]) {
                mcpServers[template.name] = this.formatServerConfig(template);
            }
        }
        return { mcpServers };
    }
    /**
     * Format server config for Claude MCP config
     */
    formatServerConfig(template) {
        const config = {
            command: template.command,
            args: template.args
        };
        if (template.env) {
            config.env = template.env;
        }
        return config;
    }
    /**
     * Generate MCP config as JSON string
     */
    async generateConfigString() {
        const config = await this.generateOptimalConfig();
        return JSON.stringify(config, null, 2);
    }
    /**
     * Save MCP config to file
     */
    async saveConfig(outputPath) {
        const config = await this.generateOptimalConfig();
        const defaultPath = join(this.homedirFn(), '.claude', 'mcp_servers.json');
        const targetPath = outputPath || defaultPath;
        await this.fileUtils.writeJSON(targetPath, config);
        console.log(`✅ MCP config saved to: ${targetPath}`);
    }
    /**
     * Get MCP config file path for current platform
     */
    getConfigPath() {
        const platform = this.processUtils.getPlatform();
        if (platform.isWindows) {
            return join(process.env.APPDATA || '', 'Claude', 'mcp_servers.json');
        }
        return join(this.homedirFn(), '.claude', 'mcp_servers.json');
    }
    /**
     * Display server list formatted
     */
    formatServerList(servers) {
        let output = '\n📦 Available MCP Servers\n';
        output += '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n';
        const byCategory = {};
        servers.forEach(server => {
            const cat = server.category || 'other';
            if (!byCategory[cat]) {
                byCategory[cat] = [];
            }
            byCategory[cat].push(server);
        });
        Object.entries(byCategory).sort().forEach(([category, servers]) => {
            output += `${category.toUpperCase()} (${servers.length}):\n`;
            servers.forEach(server => {
                const recommended = server.recommended ? ' ⭐' : '';
                const detected = server.autoDetect ? ' 🔍' : '';
                output += `  • ${server.name}${recommended}${detected}\n`;
                output += `    ${server.description}\n`;
            });
            output += '\n';
        });
        return output;
    }
    /**
     * CLI interface
     */
    static async main() {
        const service = new MCPConfigService();
        const command = process.argv[2];
        switch (command) {
            case 'list': {
                const category = process.argv[3];
                let servers;
                if (category) {
                    servers = await service.listByCategory(category);
                    console.log(`\n📦 MCP Servers: ${category}\n`);
                }
                else {
                    servers = await service.listAvailableServers();
                }
                console.log(service.formatServerList(servers));
                break;
            }
            case 'recommended': {
                const servers = await service.listRecommended();
                console.log(service.formatServerList(servers));
                break;
            }
            case 'detect': {
                console.log('\n🔍 Detecting project capabilities...\n');
                const capabilities = await service.detectProjectCapabilities();
                const detected = Object.entries(capabilities)
                    .filter(([_, detected]) => detected)
                    .map(([name]) => name);
                if (detected.length > 0) {
                    console.log(`✅ Detected ${detected.length} compatible servers:\n`);
                    detected.forEach(name => console.log(`  • ${name}`));
                }
                else {
                    console.log('ℹ️  No specific MCP servers detected for this project');
                    console.log('💡 Use recommended servers for general productivity\n');
                }
                break;
            }
            case 'generate': {
                console.log('\n⚙️  Generating optimal MCP configuration...\n');
                const config = await service.generateOptimalConfig();
                const configPath = service.getConfigPath();
                console.log('Recommended configuration:');
                console.log(JSON.stringify(config, null, 2));
                console.log(`\n💡 Save to: ${configPath}`);
                console.log('💡 Or use: mcp-config-service save\n');
                break;
            }
            case 'save': {
                const outputPath = process.argv[3];
                console.log('\n💾 Saving MCP configuration...\n');
                await service.saveConfig(outputPath);
                break;
            }
            case 'search': {
                const query = process.argv[3];
                if (!query) {
                    console.error('Usage: mcp-config-service search <query>');
                    ProcessUtils.exit(1);
                }
                const servers = await service.listAvailableServers();
                const lowerQuery = query.toLowerCase();
                const matches = servers.filter(s => s.name.toLowerCase().includes(lowerQuery) ||
                    s.description.toLowerCase().includes(lowerQuery) ||
                    s.category?.toLowerCase().includes(lowerQuery));
                console.log(`\n🔍 Found ${matches.length} servers matching "${query}"\n`);
                console.log(service.formatServerList(matches));
                break;
            }
            default:
                console.error(`
⚙️  MCP Config Service - MCP Server Configuration

Usage: mcp-config-service <command> [options]

Commands:
  list [category]            List all available servers (or by category)
  recommended                List recommended servers
  detect                     Detect project capabilities
  generate                   Generate optimal config for current project
  save [path]                Save config to file (default: ~/.claude/mcp_servers.json)
  search <query>             Search servers by name or description

Categories:
  development, database, filesystem, productivity, search,
  automation, network, communication, ai, api, devops, cloud

Examples:
  mcp-config-service list
  mcp-config-service list development
  mcp-config-service detect
  mcp-config-service generate
  mcp-config-service save
  mcp-config-service search "github"
        `);
                ProcessUtils.exit(1);
        }
    }
}
// CLI interface
if (process.argv[1]?.endsWith('mcp-config-service.js')) {
    MCPConfigService.main().catch(error => {
        console.error('Error:', error.message);
        ProcessUtils.exit(1);
    });
}
//# sourceMappingURL=mcp-config-service.js.map