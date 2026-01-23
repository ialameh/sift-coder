/**
 * Cross-platform path utilities
 * Handles Windows (\) and Unix (/) path separators
 */
import path from 'path';
export declare class PathUtils {
    /**
     * Get home directory (cross-platform)
     */
    static homeDir(): string;
    /**
     * Join paths (cross-platform)
     */
    static join(...paths: string[]): string;
    /**
     * Resolve absolute path
     */
    static resolve(...paths: string[]): string;
    /**
     * Get directory name
     */
    static dirname(filePath: string): string;
    /**
     * Get base name
     */
    static basename(filePath: string, ext?: string): string;
    /**
     * Get file extension
     */
    static extname(filePath: string): string;
    /**
     * Normalize path (removes .. and . segments)
     */
    static normalize(filePath: string): string;
    /**
     * Check if path is absolute
     */
    static isAbsolute(filePath: string): boolean;
    /**
     * Get relative path from one to another
     */
    static relative(from: string, to: string): string;
    /**
     * Convert to Unix-style path (always use / separator)
     * Useful for pattern matching and cross-platform consistency
     */
    static toUnix(filePath: string): string;
    /**
     * Convert to platform-specific path
     */
    static toPlatform(filePath: string): string;
    /**
     * Get state directory path
     */
    static getStateDir(projectRoot?: string): string;
    /**
     * Get config directory path (OS-specific)
     * - Windows: %APPDATA%\siftcoder
     * - Mac/Linux: ~/.config/siftcoder
     */
    static getConfigDir(): string;
    /**
     * Get temp directory
     */
    static getTempDir(): string;
    /**
     * Parse path into components
     */
    static parse(filePath: string): path.ParsedPath;
    /**
     * Format path from components
     */
    static format(pathObject: path.FormatInputPathObject): string;
}
//# sourceMappingURL=path-utils.d.ts.map