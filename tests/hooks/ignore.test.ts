import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { mkdtempSync, writeFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { loadIgnore, shouldCapturePath } from '../../hooks/lib/ignore.mjs';

let root: string;
beforeAll(() => {
  root = mkdtempSync(join(tmpdir(), 'sc-ign-'));
  writeFileSync(join(root, '.gitignore'), 'secret/\n*.tmp\n');
  writeFileSync(join(root, '.claudeignore'), 'snapshots/\n!snapshots/keep.md\n');
});
afterAll(() => rmSync(root, { recursive: true, force: true }));

describe('hook ignore matcher', () => {
  it('drops defaults + gitignore + claudeignore, keeps source', () => {
    const m = loadIgnore(root);
    expect(shouldCapturePath(join(root, 'src/x.ts'), root, m)).toBe(true);
    expect(shouldCapturePath(join(root, 'node_modules/a.js'), root, m)).toBe(false);
    expect(shouldCapturePath(join(root, 'dist/b.js'), root, m)).toBe(false);
    expect(shouldCapturePath(join(root, 'secret/k.pem'), root, m)).toBe(false);
    expect(shouldCapturePath(join(root, 'a/b.tmp'), root, m)).toBe(false);
    expect(shouldCapturePath(join(root, 'snapshots/s.json'), root, m)).toBe(false);
  });

  it('honors negation re-include', () => {
    const m = loadIgnore(root);
    expect(shouldCapturePath(join(root, 'snapshots/keep.md'), root, m)).toBe(true);
  });

  it('captures paths outside the root (never loses them)', () => {
    const m = loadIgnore(root);
    expect(shouldCapturePath('/elsewhere/node_modules/x.js', root, m)).toBe(true);
  });

  it('caches by mtime (second load matches first)', () => {
    const a = loadIgnore(root);
    const b = loadIgnore(root);
    expect(b.gitignore).toEqual(a.gitignore);
    expect(b.claudeignore).toEqual(a.claudeignore);
  });
});
