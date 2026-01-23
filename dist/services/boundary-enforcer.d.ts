/**
 * Boundary Enforcer Service (Converted from bash)
 * Enforces file modification boundaries
 * Cross-platform (Windows, Mac, Linux)
 */
import { Boundaries } from './state-manager.js';
export interface BoundaryCheckResult {
    allowed: boolean;
    reason: string;
    boundary_type?: 'modifiable' | 'protected' | 'none';
}
export declare class BoundaryEnforcer {
    private stateManager;
    constructor(projectRoot?: string);
    /**
     * Check if file can be modified
     */
    checkFile(filePath: string): Promise<BoundaryCheckResult>;
    /**
     * Check multiple files
     */
    checkFiles(filePaths: string[]): Promise<Map<string, BoundaryCheckResult>>;
    /**
     * Set boundaries
     */
    setBoundaries(boundaries: Omit<Boundaries, 'last_check'>): Promise<void>;
    /**
     * Add modifiable pattern
     */
    addModifiable(pattern: string): Promise<void>;
    /**
     * Add protected pattern
     */
    addProtected(pattern: string): Promise<void>;
    /**
     * Clear boundaries
     */
    clearBoundaries(): Promise<void>;
    /**
     * Get current boundaries
     */
    getBoundaries(): Promise<Boundaries | null>;
    /**
     * Verify blast radius
     */
    verifyBlastRadius(files: string[]): Promise<boolean>;
}
//# sourceMappingURL=boundary-enforcer.d.ts.map