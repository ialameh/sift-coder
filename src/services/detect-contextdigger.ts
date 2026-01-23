/**
 * ContextDigger Detection Service
 *
 * Detects if ContextDigger is installed and returns its capabilities.
 * Used to enhance siftcoder workflows when ContextDigger is available.
 */

import { execSync } from 'child_process';

export interface ContextDiggerCapabilities {
  available: boolean;
  reason?: string;
  version?: string;
  mcpAvailable?: boolean;
  commands?: string;
  capabilities?: {
    discovery: boolean;
    symbolIndexing: boolean;
    visualization: boolean;
    governance: boolean;
    knowledgeStore: boolean;
    debugAnalysis: boolean;
  };
  enhancedFeatures?: {
    investigate: string;
    scope: string;
    document: string;
    codemap: string;
  };
}

export class ContextDiggerDetectionService {
  /**
   * Check if ContextDigger is available and get capabilities
   */
  async detect(): Promise<ContextDiggerCapabilities> {
    // Check for contextdigger binary
    try {
      execSync('command -v contextdigger', { stdio: 'ignore' });
    } catch {
      return {
        available: false,
        reason: 'contextdigger binary not found'
      };
    }

    // Get version
    let version = 'unknown';
    try {
      version = execSync('contextdigger --version', { encoding: 'utf-8', stdio: 'pipe' }).trim();
    } catch {
      // Version check failed, but binary exists
    }

    // Check if MCP server is available
    let mcpAvailable = false;
    try {
      execSync('contextdigger mcp --help', { stdio: 'ignore' });
      mcpAvailable = true;
    } catch {
      // MCP not available
    }

    // List available commands
    let commands = '';
    try {
      const help = execSync('contextdigger --help', { encoding: 'utf-8', stdio: 'pipe' });
      commands = help
        .split('\n')
        .filter(line => /^\s+\w+/.test(line))
        .map(line => line.trim().split(' ')[0])
        .join(',');
    } catch {
      // Help command failed
    }

    return {
      available: true,
      version,
      mcpAvailable,
      commands,
      capabilities: {
        discovery: true,
        symbolIndexing: true,
        visualization: true,
        governance: true,
        knowledgeStore: true,
        debugAnalysis: true
      },
      enhancedFeatures: {
        investigate: 'Area-based search + symbol index',
        scope: 'Auto-discovered areas + governance budgets',
        document: 'Pre-computed dependency graphs + Mermaid rendering',
        codemap: 'Cohesion/coupling metrics + visual output'
      }
    };
  }
}

// CLI interface
if (import.meta.url === `file://${process.argv[1]}`) {
  const service = new ContextDiggerDetectionService();

  service.detect().then(capabilities => {
    console.log(JSON.stringify(capabilities, null, 2));
    process.exit(0);
  }).catch(error => {
    console.error('Error:', error.message);
    process.exit(1);
  });
}
