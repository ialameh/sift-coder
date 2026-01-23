/**
 * Chroot Manager Service
 *
 * Manages chroot jail state for file access control.
 */

import { FileUtils } from '../utils/file-utils.js';
import { PathUtils } from '../utils/path-utils.js';
import { glob } from 'glob';

export interface ChrootState {
  patterns: string[];
  files: string[];
  fileCount: number;
  lastUpdated: string;
}

export class ChrootManagerService {
  private stateDir: string;
  private chrootFile: string;
  private projectRoot: string;

  constructor(projectRoot?: string) {
    this.projectRoot = projectRoot || process.cwd();
    this.stateDir = PathUtils.getStateDir(projectRoot);
    this.chrootFile = PathUtils.join(this.stateDir, 'chroot.json');
  }

  /**
   * Expand glob patterns to file list
   */
  async expandPatterns(patterns: string[]): Promise<string[]> {
    const allFiles = new Set<string>();

    for (const pattern of patterns) {
      if (!pattern || !pattern.trim()) continue;

      // Handle negation patterns (!pattern)
      const isNegation = pattern.startsWith('!');
      const actualPattern = isNegation ? pattern.slice(1) : pattern;

      // Expand glob
      try {
        const expanded = await glob(actualPattern, {
          cwd: this.projectRoot,
          absolute: true,
          dot: true
        });

        for (const file of expanded) {
          try {
            const stat = await FileUtils.stat(file);
            if (stat.isFile()) {
              if (isNegation) {
                allFiles.delete(file);
              } else {
                allFiles.add(file);
              }
            }
          } catch {
            // File might not be accessible
          }
        }
      } catch {
        // Pattern might be invalid
      }
    }

    return Array.from(allFiles).sort();
  }

  /**
   * Set chroot with patterns
   */
  async setChroot(patterns: string[]): Promise<ChrootState> {
    const files = await this.expandPatterns(patterns);

    const state: ChrootState = {
      patterns,
      files,
      fileCount: files.length,
      lastUpdated: new Date().toISOString()
    };

    await FileUtils.writeJSON(this.chrootFile, state);
    return state;
  }

  /**
   * Add patterns to existing chroot
   */
  async addPatterns(patterns: string[]): Promise<ChrootState> {
    const current = await this.getChroot();
    const existingPatterns = current?.patterns || [];

    const combinedPatterns = [...new Set([...existingPatterns, ...patterns])];
    return this.setChroot(combinedPatterns);
  }

  /**
   * Remove patterns from chroot
   */
  async removePatterns(patterns: string[]): Promise<ChrootState> {
    const current = await this.getChroot();
    if (!current) {
      throw new Error('No chroot state exists');
    }

    const filteredPatterns = current.patterns.filter(p => !patterns.includes(p));
    return this.setChroot(filteredPatterns);
  }

  /**
   * Check if file is in chroot
   */
  async checkFile(filePath: string): Promise<boolean> {
    const current = await this.getChroot();
    if (!current || current.files.length === 0) {
      // No chroot means all files are accessible
      return true;
    }

    const resolvedPath = PathUtils.resolve(filePath);
    return current.files.includes(resolvedPath);
  }

  /**
   * Get current chroot state
   */
  async getChroot(): Promise<ChrootState | null> {
    if (!await FileUtils.exists(this.chrootFile)) {
      return null;
    }
    return FileUtils.readJSON<ChrootState>(this.chrootFile);
  }

  /**
   * Clear chroot
   */
  async clearChroot(): Promise<void> {
    if (await FileUtils.exists(this.chrootFile)) {
      await FileUtils.deleteFile(this.chrootFile);
    }
  }

  /**
   * Expand patterns and show results
   */
  async expand(patternsJson: string): Promise<ChrootState> {
    const patterns = JSON.parse(patternsJson) as string[];
    const files = await this.expandPatterns(patterns);

    return {
      patterns,
      files,
      fileCount: files.length,
      lastUpdated: new Date().toISOString()
    };
  }
}

// CLI interface
if (import.meta.url === `file://${process.argv[1]}`) {
  const service = new ChrootManagerService();
  const command = process.argv[2] || 'help';

  (async () => {
    switch (command) {
      case 'expand': {
        const patternsJson = process.argv[3];
        if (!patternsJson) {
          console.error('Usage: chroot-manager.ts expand <patterns_json>');
          process.exit(1);
        }

        const result = await service.expand(patternsJson);
        console.log(JSON.stringify(result, null, 2));
        break;
      }

      case 'set': {
        const patternsJson = process.argv[3];
        if (!patternsJson) {
          console.error('Usage: chroot-manager.ts set <patterns_json>');
          process.exit(1);
        }

        const patterns = JSON.parse(patternsJson) as string[];
        const result = await service.setChroot(patterns);
        console.log(`Chroot set with ${result.fileCount} files`);
        break;
      }

      case 'add': {
        const patternsJson = process.argv[3];
        if (!patternsJson) {
          console.error('Usage: chroot-manager.ts add <patterns_json>');
          process.exit(1);
        }

        const patterns = JSON.parse(patternsJson) as string[];
        const result = await service.addPatterns(patterns);
        console.log(`Added patterns. Chroot now has ${result.fileCount} files`);
        break;
      }

      case 'remove': {
        const patternsJson = process.argv[3];
        if (!patternsJson) {
          console.error('Usage: chroot-manager.ts remove <patterns_json>');
          process.exit(1);
        }

        const patterns = JSON.parse(patternsJson) as string[];
        const result = await service.removePatterns(patterns);
        console.log(`Removed patterns. Chroot now has ${result.fileCount} files`);
        break;
      }

      case 'check': {
        const filePath = process.argv[3];
        if (!filePath) {
          console.error('Usage: chroot-manager.ts check <file_path>');
          process.exit(1);
        }

        const allowed = await service.checkFile(filePath);
        console.log(allowed ? 'ALLOWED' : 'DENIED');
        process.exit(allowed ? 0 : 1);
      }

      case 'show': {
        const state = await service.getChroot();
        if (!state) {
          console.log('No chroot state exists');
        } else {
          console.log(JSON.stringify(state, null, 2));
        }
        break;
      }

      case 'clear': {
        await service.clearChroot();
        console.log('Chroot cleared');
        break;
      }

      default:
        console.error(`
Usage: chroot-manager.ts <command> [arguments]

Commands:
  expand <patterns_json>    Expand patterns to file list
  set <patterns_json>       Set chroot with patterns
  add <patterns_json>       Add patterns to existing chroot
  remove <patterns_json>    Remove patterns from chroot
  check <file_path>         Check if file is in chroot
  show                      Show current chroot
  clear                     Clear chroot
        `);
        process.exit(1);
    }
  })().catch(error => {
    console.error('Error:', error.message);
    process.exit(1);
  });
}
