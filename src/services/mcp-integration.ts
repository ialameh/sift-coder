/**
 * MCP Integration Service
 *
 * Detects and integrates with available MCP servers.
 * Supports siftcoder-mcp (LanceDB + Ollama) and ContextDigger.
 */

import { execSync } from 'child_process';

export interface McpServerInfo {
  available: boolean;
  version?: string;
  ollamaStatus?: 'running' | 'unavailable';
  capabilities?: string[];
  install?: string;
}

export interface EnhancedFeatures {
  semanticSearch?: boolean;
  vectorStorage?: boolean;
  areaDiscovery?: boolean;
  symbolIndexing?: boolean;
  mermaidDiagrams?: boolean;
  governanceBudgets?: boolean;
}

export interface McpIntegrationResult {
  mcpServers: {
    'siftcoder-mcp'?: McpServerInfo;
    contextdigger?: McpServerInfo;
  };
  enhancedFeatures: EnhancedFeatures;
}

export class McpIntegrationService {
  /**
   * Detect MCP integration availability
   */
  async detect(): Promise<McpIntegrationResult> {
    const result: McpIntegrationResult = {
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
  private async checkSiftcoderMcp(): Promise<McpServerInfo> {
    try {
      execSync('command -v siftcoder-mcp', { stdio: 'ignore' });

      // Check if Ollama is running
      let ollamaStatus: 'running' | 'unavailable' = 'unavailable';
      try {
        execSync('curl -s http://localhost:11434/api/tags', { stdio: 'ignore', timeout: 1000 });
        ollamaStatus = 'running';
      } catch {
        // Ollama not running
      }

      return {
        available: true,
        ollamaStatus,
        capabilities: ['knowledge_search', 'knowledge_add', 'code_embed', 'similarity_find']
      };
    } catch {
      return {
        available: false,
        install: 'npm install -g @siftcoder/mcp'
      };
    }
  }

  /**
   * Check if ContextDigger is available
   */
  private async checkContextDigger(): Promise<McpServerInfo> {
    try {
      execSync('command -v contextdigger', { stdio: 'ignore' });

      let version = 'unknown';
      try {
        version = execSync('contextdigger --version', { encoding: 'utf-8', stdio: 'pipe' }).trim().split('\n')[0];
      } catch {
        // Version check failed
      }

      return {
        available: true,
        version,
        capabilities: ['dig', 'status', 'focus', 'render', 'knowledge', 'debug-analyze']
      };
    } catch {
      return {
        available: false,
        install: 'See https://github.com/contextdigger/contextdigger-core'
      };
    }
  }
}

// CLI interface
// Check if this file is being run directly (CLI mode)
const isMainModule = process.argv[1]?.endsWith('/mcp-integration.js') ||
                        process.argv[1]?.endsWith('mcp-integration.js') ||
                        process.argv[1]?.endsWith('\\mcp-integration.js');

if (isMainModule) {
  const service = new McpIntegrationService();

  service.detect().then(result => {
    console.log(JSON.stringify(result, null, 2));
    process.exit(0);
  }).catch(error => {
    console.error('Error:', error.message);
    process.exit(1);
  });
}
