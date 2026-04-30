import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import os from 'node:os';
import path from 'node:path';
import fs from 'node:fs/promises';
import { formatLocalTree, formatPathList } from './tree-formatter.js';

describe('tree-formatter', () => {
  let tmp: string;

  beforeEach(async () => {
    tmp = await fs.mkdtemp(path.join(os.tmpdir(), 'sc-tree-'));
    await fs.mkdir(path.join(tmp, 'src/lib'), { recursive: true });
    await fs.writeFile(path.join(tmp, 'src/lib/a.ts'), '');
    await fs.writeFile(path.join(tmp, 'src/index.ts'), '');
    await fs.writeFile(path.join(tmp, 'README.md'), '');
    await fs.mkdir(path.join(tmp, 'node_modules/x'), { recursive: true });
  });

  afterEach(async () => {
    await fs.rm(tmp, { recursive: true, force: true });
  });

  it('formatLocalTree excludes node_modules by default', () => {
    const out = formatLocalTree(tmp, { depth: 3 });
    expect(out).not.toContain('node_modules');
    expect(out).toContain('src/');
    expect(out).toContain('README.md');
  });

  it('formatLocalTree honours depth limit', () => {
    const out = formatLocalTree(tmp, { depth: 1 });
    expect(out).toContain('src/');
    expect(out).not.toContain('a.ts');
  });

  it('formatLocalTree honours maxEntries', () => {
    const out = formatLocalTree(tmp, { depth: 5, maxEntries: 2 });
    const lines = out.split('\n').filter(Boolean);
    expect(lines.length).toBeLessThanOrEqual(2);
  });

  it('formatPathList renders pre-collected paths', () => {
    const out = formatPathList([
      { path: 'a/b.ts', type: 'file' },
      { path: 'a/c/d.ts', type: 'file' },
    ]);
    expect(out).toContain('a/');
    expect(out).toContain('b.ts');
  });

  it('formatLocalTree returns empty string for non-existent root', () => {
    expect(formatLocalTree(path.join(tmp, 'nope'))).toBe('');
  });
});
