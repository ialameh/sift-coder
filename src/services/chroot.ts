/**
 * Chroot manager. Glob-pattern jail for file ops.
 * Replaces V1 chroot-manager.js — same behaviour, V3-shape.
 */

import path from 'node:path';
import { glob } from 'glob';
import { readJSON, writeJSON, exists, deleteFile, ensureDir } from '../utils/file.js';

export interface ChrootState {
  patterns: string[];
  files: string[];
  fileCount: number;
  lastUpdated: string;
}

export class ChrootManager {
  private readonly stateDir: string;
  private readonly chrootFile: string;
  private readonly projectRoot: string;

  constructor(projectRoot: string = process.cwd()) {
    this.projectRoot = projectRoot;
    this.stateDir = path.join(projectRoot, '.siftcoder');
    this.chrootFile = path.join(this.stateDir, 'chroot.json');
  }

  async expandPatterns(patterns: string[]): Promise<string[]> {
    const all = new Set<string>();
    for (const raw of patterns) {
      if (!raw || !raw.trim()) continue;
      const isNeg = raw.startsWith('!');
      const pattern = isNeg ? raw.slice(1) : raw;
      try {
        const found = await glob(pattern, {
          cwd: this.projectRoot,
          absolute: true,
          dot: true,
          nodir: true,
        });
        for (const f of found) {
          if (isNeg) all.delete(f);
          else all.add(f);
        }
      } catch {
        // invalid pattern → skip
      }
    }
    return Array.from(all).sort();
  }

  async setChroot(patterns: string[]): Promise<ChrootState> {
    const files = await this.expandPatterns(patterns);
    const state: ChrootState = {
      patterns,
      files,
      fileCount: files.length,
      lastUpdated: new Date().toISOString(),
    };
    await ensureDir(this.stateDir);
    await writeJSON(this.chrootFile, state);
    return state;
  }

  async addPatterns(patterns: string[]): Promise<ChrootState> {
    const cur = await this.getChroot();
    const merged = Array.from(new Set([...(cur?.patterns ?? []), ...patterns]));
    return this.setChroot(merged);
  }

  async removePatterns(patterns: string[]): Promise<ChrootState> {
    const cur = await this.getChroot();
    if (!cur) throw new Error('No chroot state to remove from');
    const remaining = cur.patterns.filter((p) => !patterns.includes(p));
    return this.setChroot(remaining);
  }

  async getChroot(): Promise<ChrootState | null> {
    if (!(await exists(this.chrootFile))) return null;
    return readJSON<ChrootState>(this.chrootFile);
  }

  async clearChroot(): Promise<void> {
    if (await exists(this.chrootFile)) await deleteFile(this.chrootFile);
  }

  async checkFile(filePath: string): Promise<boolean> {
    const cur = await this.getChroot();
    if (!cur || cur.files.length === 0) return true;
    const resolved = path.resolve(filePath);
    return cur.files.includes(resolved);
  }
}
