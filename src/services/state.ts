/**
 * State manager. Replaces V1 state-manager.js. Smaller scope: scope.json + checkpoints.
 * Other V1 features (features.json queue, knowledge dir) lifted to memory daemon.
 */

import path from 'node:path';
import { readJSON, writeJSON, atomicWriteJSON, exists, ensureDir } from '../utils/file.js';

export interface Scope {
  allow: string[];
  deny: string[];
}

export interface Checkpoint {
  id: string;
  name: string;
  createdAt: string;
  description?: string;
  files?: Record<string, string>;
}

export class StateManager {
  private readonly stateDir: string;

  constructor(projectRoot: string = process.cwd()) {
    this.stateDir = path.join(projectRoot, '.siftcoder');
  }

  private p(name: string): string {
    return path.join(this.stateDir, name);
  }

  async loadScope(): Promise<Scope | null> {
    const p = this.p('scope.json');
    if (!(await exists(p))) return null;
    return readJSON<Scope>(p);
  }

  async saveScope(scope: Scope): Promise<void> {
    await atomicWriteJSON(this.p('scope.json'), scope);
  }

  async clearScope(): Promise<void> {
    const p = this.p('scope.json');
    if (await exists(p)) {
      const fs = await import('node:fs/promises');
      await fs.unlink(p);
    }
  }

  async listCheckpoints(): Promise<Checkpoint[]> {
    const dir = this.p('checkpoints');
    if (!(await exists(dir))) return [];
    const fs = await import('node:fs/promises');
    const entries = await fs.readdir(dir);
    const out: Checkpoint[] = [];
    for (const name of entries) {
      if (!name.endsWith('.json')) continue;
      try {
        out.push(await readJSON<Checkpoint>(path.join(dir, name)));
      } catch {
        // skip corrupt
      }
    }
    return out.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  }

  async saveCheckpoint(cp: Omit<Checkpoint, 'id' | 'createdAt'>): Promise<Checkpoint> {
    const id = `cp-${Date.now()}`;
    const full: Checkpoint = { ...cp, id, createdAt: new Date().toISOString() };
    await ensureDir(this.p('checkpoints'));
    await writeJSON(path.join(this.p('checkpoints'), `${id}.json`), full);
    return full;
  }

  async getCheckpoint(id: string): Promise<Checkpoint | null> {
    const p = path.join(this.p('checkpoints'), `${id}.json`);
    if (!(await exists(p))) return null;
    return readJSON<Checkpoint>(p);
  }

  async deleteCheckpoint(id: string): Promise<boolean> {
    const p = path.join(this.p('checkpoints'), `${id}.json`);
    if (!(await exists(p))) return false;
    const fs = await import('node:fs/promises');
    await fs.unlink(p);
    return true;
  }
}
