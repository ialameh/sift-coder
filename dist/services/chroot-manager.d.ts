/**
 * Chroot Manager Service
 *
 * Manages chroot jail state for file access control.
 */
export interface ChrootState {
    patterns: string[];
    files: string[];
    fileCount: number;
    lastUpdated: string;
}
export declare class ChrootManagerService {
    private stateDir;
    private chrootFile;
    private projectRoot;
    constructor(projectRoot?: string);
    /**
     * Expand glob patterns to file list
     */
    expandPatterns(patterns: string[]): Promise<string[]>;
    /**
     * Set chroot with patterns
     */
    setChroot(patterns: string[]): Promise<ChrootState>;
    /**
     * Add patterns to existing chroot
     */
    addPatterns(patterns: string[]): Promise<ChrootState>;
    /**
     * Remove patterns from chroot
     */
    removePatterns(patterns: string[]): Promise<ChrootState>;
    /**
     * Check if file is in chroot
     */
    checkFile(filePath: string): Promise<boolean>;
    /**
     * Get current chroot state
     */
    getChroot(): Promise<ChrootState | null>;
    /**
     * Clear chroot
     */
    clearChroot(): Promise<void>;
    /**
     * Expand patterns and show results
     */
    expand(patternsJson: string): Promise<ChrootState>;
}
//# sourceMappingURL=chroot-manager.d.ts.map