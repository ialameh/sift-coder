import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import os from 'node:os';
import path from 'node:path';
import fs from 'node:fs/promises';
import { ChrootManager } from './chroot.js';

describe('ChrootManager', () => {
  let tmp: string;
  let cm: ChrootManager;

  beforeEach(async () => {
    tmp = await fs.mkdtemp(path.join(os.tmpdir(), 'sc-chroot-'));
    await fs.mkdir(path.join(tmp, 'src'), { recursive: true });
    await fs.writeFile(path.join(tmp, 'src/a.ts'), '');
    await fs.writeFile(path.join(tmp, 'src/b.ts'), '');
    await fs.writeFile(path.join(tmp, 'README.md'), '');
    cm = new ChrootManager(tmp);
  });

  afterEach(async () => {
    await fs.rm(tmp, { recursive: true, force: true });
  });

  it('getChroot returns null when not set', async () => {
    expect(await cm.getChroot()).toBeNull();
  });

  it('setChroot expands patterns and persists', async () => {
    const state = await cm.setChroot(['src/**/*.ts']);
    expect(state.fileCount).toBe(2);
    expect(state.patterns).toEqual(['src/**/*.ts']);
  });

  it('checkFile honours allow', async () => {
    await cm.setChroot(['src/**/*.ts']);
    expect(await cm.checkFile(path.join(tmp, 'src/a.ts'))).toBe(true);
    expect(await cm.checkFile(path.join(tmp, 'README.md'))).toBe(false);
  });

  it('checkFile defaults true when no chroot', async () => {
    expect(await cm.checkFile(path.join(tmp, 'whatever'))).toBe(true);
  });

  it('addPatterns merges', async () => {
    await cm.setChroot(['src/a.ts']);
    const state = await cm.addPatterns(['README.md']);
    expect(state.patterns.sort()).toEqual(['README.md', 'src/a.ts']);
    expect(state.fileCount).toBe(2);
  });

  it('removePatterns drops entries', async () => {
    await cm.setChroot(['src/a.ts', 'src/b.ts']);
    const state = await cm.removePatterns(['src/a.ts']);
    expect(state.patterns).toEqual(['src/b.ts']);
  });

  it('removePatterns throws when no state', async () => {
    await expect(cm.removePatterns(['x'])).rejects.toThrow('No chroot state');
  });

  it('negation pattern excludes', async () => {
    const state = await cm.setChroot(['src/**/*.ts', '!src/b.ts']);
    expect(state.fileCount).toBe(1);
    expect(state.files[0]).toContain('a.ts');
  });

  it('clearChroot is idempotent', async () => {
    await cm.clearChroot();
    await cm.setChroot(['src/**/*.ts']);
    await cm.clearChroot();
    expect(await cm.getChroot()).toBeNull();
  });
});
