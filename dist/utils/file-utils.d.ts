/**
 * Cross-platform file utilities
 * Works on Windows, Mac, Linux
 */
export declare class FileUtils {
    /**
     * Cross-platform glob pattern matching
     * Handles Windows paths correctly
     */
    static glob(pattern: string, cwd?: string): Promise<string[]>;
    /**
     * Check if file exists
     */
    static exists(filePath: string): Promise<boolean>;
    /**
     * Read file safely with encoding
     */
    static readFile(filePath: string): Promise<string>;
    /**
     * Write file with directory creation
     */
    static writeFile(filePath: string, content: string): Promise<void>;
    /**
     * Read JSON file
     */
    static readJSON<T = any>(filePath: string): Promise<T>;
    /**
     * Write JSON file with formatting
     */
    static writeJSON(filePath: string, data: any): Promise<void>;
    /**
     * Append to file (creates if doesn't exist)
     */
    static appendFile(filePath: string, content: string): Promise<void>;
    /**
     * Create directory recursively
     */
    static mkdir(dirPath: string): Promise<void>;
    /**
     * List files in directory
     */
    static listFiles(dirPath: string): Promise<string[]>;
    /**
     * Match file path against pattern (cross-platform)
     */
    static match(filePath: string, pattern: string): boolean;
    /**
     * Get file stats
     */
    static stat(filePath: string): Promise<import("fs").Stats>;
    /**
     * Delete file
     */
    static deleteFile(filePath: string): Promise<void>;
    /**
     * Copy file
     */
    static copyFile(src: string, dest: string): Promise<void>;
    /**
     * Move/rename file
     */
    static moveFile(src: string, dest: string): Promise<void>;
}
//# sourceMappingURL=file-utils.d.ts.map