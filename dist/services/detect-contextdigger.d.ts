/**
 * ContextDigger Detection Service
 *
 * Detects if ContextDigger is installed and returns its capabilities.
 * Used to enhance siftcoder workflows when ContextDigger is available.
 */
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
export declare class ContextDiggerDetectionService {
    /**
     * Check if ContextDigger is available and get capabilities
     */
    detect(): Promise<ContextDiggerCapabilities>;
}
//# sourceMappingURL=detect-contextdigger.d.ts.map