/**
 * MCP Integration Service
 *
 * Detects and integrates with available MCP servers.
 * Supports siftcoder-mcp (LanceDB + Ollama) and ContextDigger.
 */
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
export declare class McpIntegrationService {
    /**
     * Detect MCP integration availability
     */
    detect(): Promise<McpIntegrationResult>;
    /**
     * Check if siftcoder-mcp is available
     */
    private checkSiftcoderMcp;
    /**
     * Check if ContextDigger is available
     */
    private checkContextDigger;
}
//# sourceMappingURL=mcp-integration.d.ts.map