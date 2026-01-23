/**
 * Cross-platform file utilities
 * Works on Windows, Mac, Linux
 */
import fs from 'fs/promises';
import path from 'path';
import { glob as globSync } from 'glob';
import { minimatch } from 'minimatch';
export class FileUtils {
    /**
     * Cross-platform glob pattern matching
     * Handles Windows paths correctly
     */
    static async glob(pattern, cwd) {
        return globSync(pattern, {
            cwd: cwd || process.cwd(),
            windowsPathsNoEscape: true,
            absolute: false,
            dot: true
        });
    }
    /**
     * Check if file exists
     */
    static async exists(filePath) {
        try {
            await fs.access(filePath);
            return true;
        }
        catch {
            return false;
        }
    }
    /**
     * Read file safely with encoding
     */
    static async readFile(filePath) {
        return fs.readFile(filePath, 'utf-8');
    }
    /**
     * Write file with directory creation
     */
    static async writeFile(filePath, content) {
        const dir = path.dirname(filePath);
        await fs.mkdir(dir, { recursive: true });
        await fs.writeFile(filePath, content, 'utf-8');
    }
    /**
     * Read JSON file
     */
    static async readJSON(filePath) {
        const content = await this.readFile(filePath);
        return JSON.parse(content);
    }
    /**
     * Write JSON file with formatting
     */
    static async writeJSON(filePath, data) {
        const content = JSON.stringify(data, null, 2);
        await this.writeFile(filePath, content);
    }
    /**
     * Append to file (creates if doesn't exist)
     */
    static async appendFile(filePath, content) {
        await fs.appendFile(filePath, content, 'utf-8');
    }
    /**
     * Create directory recursively
     */
    static async mkdir(dirPath) {
        await fs.mkdir(dirPath, { recursive: true });
    }
    /**
     * List files in directory
     */
    static async listFiles(dirPath) {
        try {
            const entries = await fs.readdir(dirPath, { withFileTypes: true });
            return entries
                .filter(entry => entry.isFile())
                .map(entry => entry.name);
        }
        catch {
            return [];
        }
    }
    /**
     * Match file path against pattern (cross-platform)
     */
    static match(filePath, pattern) {
        // Normalize paths for cross-platform comparison
        // Convert Windows backslashes to Unix forward slashes
        const normalizedPath = filePath.replace(/\\/g, '/');
        const normalizedPattern = pattern.replace(/\\/g, '/');
        return minimatch(normalizedPath, normalizedPattern);
    }
    /**
     * Get file stats
     */
    static async stat(filePath) {
        return fs.stat(filePath);
    }
    /**
     * Delete file
     */
    static async deleteFile(filePath) {
        await fs.unlink(filePath);
    }
    /**
     * Copy file
     */
    static async copyFile(src, dest) {
        const dir = path.dirname(dest);
        await fs.mkdir(dir, { recursive: true });
        await fs.copyFile(src, dest);
    }
    /**
     * Move/rename file
     */
    static async moveFile(src, dest) {
        await fs.rename(src, dest);
    }
}
//# sourceMappingURL=file-utils.js.map