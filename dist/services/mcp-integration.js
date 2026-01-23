/**
 * MCP Integration Service
 *
 * Detects and integrates with available MCP servers.
 * Supports siftcoder-mcp (LanceDB + Ollama) and ContextDigger.
 */
import { execSync } from 'child_process';
export class McpIntegrationService {
    /**
     * Detect MCP integration availability
     */
    async detect() {
        const result = {
            mcpServers: {},
            enhancedFeatures: {}
        };
        // Check for siftcoder-mcp
        const siftcoderMcp = await this.checkSiftcoderMcp();
        result.mcpServers['siftcoder-mcp'] = siftcoderMcp;
        if (siftcoderMcp.available) {
            result.enhancedFeatures.semanticSearch = true;
            result.enhancedFeatures.vectorStorage = true;
        }
        // Check for ContextDigger
        const contextDigger = await this.checkContextDigger();
        result.mcpServers.contextdigger = contextDigger;
        if (contextDigger.available) {
            result.enhancedFeatures.areaDiscovery = true;
            result.enhancedFeatures.symbolIndexing = true;
            result.enhancedFeatures.mermaidDiagrams = true;
            result.enhancedFeatures.governanceBudgets = true;
        }
        return result;
    }
    /**
     * Check if siftcoder-mcp is available
     */
    async checkSiftcoderMcp() {
        try {
            execSync('command -v siftcoder-mcp', { stdio: 'ignore' });
            // Check if Ollama is running
            let ollamaStatus = 'unavailable';
            try {
                execSync('curl -s http://localhost:11434/api/tags', { stdio: 'ignore', timeout: 1000 });
                ollamaStatus = 'running';
            }
            catch {
                // Ollama not running
            }
            return {
                available: true,
                ollamaStatus,
                capabilities: ['knowledge_search', 'knowledge_add', 'code_embed', 'similarity_find']
            };
        }
        catch {
            return {
                available: false,
                install: 'npm install -g @siftcoder/mcp'
            };
        }
    }
    /**
     * Check if ContextDigger is available
     */
    async checkContextDigger() {
        try {
            execSync('command -v contextdigger', { stdio: 'ignore' });
            let version = 'unknown';
            try {
                version = execSync('contextdigger --version', { encoding: 'utf-8', stdio: 'pipe' }).trim().split('\n')[0];
            }
            catch {
                // Version check failed
            }
            return {
                available: true,
                version,
                capabilities: ['dig', 'status', 'focus', 'render', 'knowledge', 'debug-analyze']
            };
        }
        catch {
            return {
                available: false,
                install: 'See https://github.com/contextdigger/contextdigger-core'
            };
        }
    }
}
// CLI interface
if (import.meta.url === `file://${process.argv[1]}`) {
    const service = new McpIntegrationService();
    service.detect().then(result => {
        console.log(JSON.stringify(result, null, 2));
        process.exit(0);
    }).catch(error => {
        console.error('Error:', error.message);
        process.exit(1);
    });
}
//# sourceMappingURL=mcp-integration.js.map