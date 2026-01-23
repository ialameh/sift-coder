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
  static async glob(pattern: string, cwd?: string): Promise<string[]> {
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
  static async exists(filePath: string): Promise<boolean> {
    try {
      await fs.access(filePath);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Read file safely with encoding
   */
  static async readFile(filePath: string): Promise<string> {
    return fs.readFile(filePath, 'utf-8');
  }

  /**
   * Write file with directory creation
   */
  static async writeFile(filePath: string, content: string): Promise<void> {
    const dir = path.dirname(filePath);
    await fs.mkdir(dir, { recursive: true });
    await fs.writeFile(filePath, content, 'utf-8');
  }

  /**
   * Read JSON file
   */
  static async readJSON<T = any>(filePath: string): Promise<T> {
    const content = await this.readFile(filePath);
    return JSON.parse(content);
  }

  /**
   * Write JSON file with formatting
   */
  static async writeJSON(filePath: string, data: any): Promise<void> {
    const content = JSON.stringify(data, null, 2);
    await this.writeFile(filePath, content);
  }

  /**
   * Append to file (creates if doesn't exist)
   */
  static async appendFile(filePath: string, content: string): Promise<void> {
    await fs.appendFile(filePath, content, 'utf-8');
  }

  /**
   * Create directory recursively
   */
  static async mkdir(dirPath: string): Promise<void> {
    await fs.mkdir(dirPath, { recursive: true });
  }

  /**
   * List files in directory
   */
  static async listFiles(dirPath: string): Promise<string[]> {
    try {
      const entries = await fs.readdir(dirPath, { withFileTypes: true });
      return entries
        .filter(entry => entry.isFile())
        .map(entry => entry.name);
    } catch {
      return [];
    }
  }

  /**
   * Match file path against pattern (cross-platform)
   */
  static match(filePath: string, pattern: string): boolean {
    // Normalize paths for cross-platform comparison
    // Convert Windows backslashes to Unix forward slashes
    const normalizedPath = filePath.replace(/\\/g, '/');
    const normalizedPattern = pattern.replace(/\\/g, '/');
    return minimatch(normalizedPath, normalizedPattern);
  }

  /**
   * Get file stats
   */
  static async stat(filePath: string) {
    return fs.stat(filePath);
  }

  /**
   * Delete file
   */
  static async deleteFile(filePath: string): Promise<void> {
    await fs.unlink(filePath);
  }

  /**
   * Copy file
   */
  static async copyFile(src: string, dest: string): Promise<void> {
    const dir = path.dirname(dest);
    await fs.mkdir(dir, { recursive: true });
    await fs.copyFile(src, dest);
  }

  /**
   * Move/rename file
   */
  static async moveFile(src: string, dest: string): Promise<void> {
    await fs.rename(src, dest);
  }
}
