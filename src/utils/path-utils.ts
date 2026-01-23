/**
 * Cross-platform path utilities
 * Handles Windows (\) and Unix (/) path separators
 */

import path from 'path';
import os from 'os';

export class PathUtils {
  /**
   * Get home directory (cross-platform)
   */
  static homeDir(): string {
    return os.homedir();
  }

  /**
   * Join paths (cross-platform)
   */
  static join(...paths: string[]): string {
    return path.join(...paths);
  }

  /**
   * Resolve absolute path
   */
  static resolve(...paths: string[]): string {
    return path.resolve(...paths);
  }

  /**
   * Get directory name
   */
  static dirname(filePath: string): string {
    return path.dirname(filePath);
  }

  /**
   * Get base name
   */
  static basename(filePath: string, ext?: string): string {
    return path.basename(filePath, ext);
  }

  /**
   * Get file extension
   */
  static extname(filePath: string): string {
    return path.extname(filePath);
  }

  /**
   * Normalize path (removes .. and . segments)
   */
  static normalize(filePath: string): string {
    return path.normalize(filePath);
  }

  /**
   * Check if path is absolute
   */
  static isAbsolute(filePath: string): boolean {
    return path.isAbsolute(filePath);
  }

  /**
   * Get relative path from one to another
   */
  static relative(from: string, to: string): string {
    return path.relative(from, to);
  }

  /**
   * Convert to Unix-style path (always use / separator)
   * Useful for pattern matching and cross-platform consistency
   */
  static toUnix(filePath: string): string {
    return filePath.split(path.sep).join('/');
  }

  /**
   * Convert to platform-specific path
   */
  static toPlatform(filePath: string): string {
    return filePath.split('/').join(path.sep);
  }

  /**
   * Get state directory path
   */
  static getStateDir(projectRoot?: string): string {
    const root = projectRoot || process.env.CLAUDE_PROJECT_DIR || process.cwd();
    return this.join(root, '.claude', 'siftcoder-state');
  }

  /**
   * Get config directory path (OS-specific)
   * - Windows: %APPDATA%\siftcoder
   * - Mac/Linux: ~/.config/siftcoder
   */
  static getConfigDir(): string {
    if (process.platform === 'win32') {
      const appData = process.env.APPDATA || this.join(this.homeDir(), 'AppData', 'Roaming');
      return this.join(appData, 'siftcoder');
    } else {
      return this.join(this.homeDir(), '.config', 'siftcoder');
    }
  }

  /**
   * Get temp directory
   */
  static getTempDir(): string {
    return os.tmpdir();
  }

  /**
   * Parse path into components
   */
  static parse(filePath: string) {
    return path.parse(filePath);
  }

  /**
   * Format path from components
   */
  static format(pathObject: path.FormatInputPathObject): string {
    return path.format(pathObject);
  }
}
