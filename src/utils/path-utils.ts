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
   * Get directory name (cross-platform)
   * Handles both Unix and Windows path separators
   */
  static dirname(filePath: string): string {
    // Check if it's a Windows path (has backslashes or drive letter)
    const isWindowsPath = filePath.includes('\\') || /^[A-Za-z]:/.test(filePath);

    if (isWindowsPath) {
      // Convert to Unix, get dirname, convert back to Windows
      const unixPath = this.toUnix(filePath);
      const dir = path.dirname(unixPath);
      // Convert back to Windows style if input was Windows style
      return filePath.includes('\\') ? dir.replace(/\//g, '\\') : dir;
    }

    return path.dirname(filePath);
  }

  /**
   * Get base name (cross-platform)
   * Handles edge cases like root directory
   */
  static basename(filePath: string, ext?: string): string {
    // Handle root directory edge case
    if (filePath === '/' || filePath === '\\') {
      return filePath;
    }

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
   * Check if path is absolute (cross-platform)
   * Handles both Unix (/path) and Windows (C:\path, C:/path) absolute paths
   */
  static isAbsolute(filePath: string): boolean {
    // Check Unix-style absolute paths
    if (filePath.startsWith('/')) {
      return true;
    }
    // Check Windows-style absolute paths (C:\, D:/, etc.)
    if (/^[A-Za-z]:[\\/]/.test(filePath)) {
      return true;
    }
    // Fallback to Node's path.isAbsolute for platform-specific checks
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
    // Replace all backslashes with forward slashes
    return filePath.replace(/\\/g, '/');
  }

  /**
   * Convert to platform-specific path
   */
  static toPlatform(filePath: string): string {
    // Replace all forward slashes with platform separator
    return filePath.replace(/\//g, path.sep);
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
   * Parse path into components (cross-platform)
   * Handles both Unix and Windows path separators
   */
  static parse(filePath: string) {
    // Convert Windows paths to Unix for Node's path.parse to work correctly
    const unixPath = this.toUnix(filePath);
    return path.parse(unixPath);
  }

  /**
   * Format path from components (cross-platform)
   * Handles edge cases like root directory
   */
  static format(pathObject: path.FormatInputPathObject): string {
    const formatted = path.format(pathObject);

    // Fix double slash on root directory (//file.txt -> /file.txt)
    // But preserve UNC paths on Windows (//server/share)
    if (formatted.startsWith('//') && process.platform !== 'win32') {
      return formatted.substring(1);
    }

    return formatted;
  }
}
