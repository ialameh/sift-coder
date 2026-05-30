import { describe, it, expect } from 'vitest';
import { isIgnored, DEFAULT_IGNORES, type IgnoreSet } from './ignore.js';

const root = '/repo';

describe('isIgnored', () => {
  const set: IgnoreSet = {
    defaults: DEFAULT_IGNORES,
    gitignore: ['/secret/**', 'tmp/'],
    claudeignore: ['*.snap'],
  };

  it('excludes default junk dirs', () => {
    expect(isIgnored('/repo/node_modules/x/index.js', root, set)).toBe(true);
    expect(isIgnored('/repo/dist/bundle.js', root, set)).toBe(true);
    expect(isIgnored('/repo/coverage/lcov.info', root, set)).toBe(true);
  });

  it('excludes default lockfile / minified globs', () => {
    expect(isIgnored('/repo/package-lock.json', root, set)).toBe(true);
    expect(isIgnored('/repo/a/b.min.js', root, set)).toBe(true);
    expect(isIgnored('/repo/a/b.js.map', root, set)).toBe(true);
  });

  it('keeps real source', () => {
    expect(isIgnored('/repo/src/core/config.ts', root, set)).toBe(false);
    expect(isIgnored('/repo/hooks/lib/ignore.mjs', root, set)).toBe(false);
  });

  it('honors anchored gitignore globs and dir patterns', () => {
    expect(isIgnored('/repo/secret/key.pem', root, set)).toBe(true);
    expect(isIgnored('/repo/tmp/scratch.txt', root, set)).toBe(true);
  });

  it('honors claudeignore basename globs', () => {
    expect(isIgnored('/repo/a/b.snap', root, set)).toBe(true);
  });

  it('supports leading-! negation (claudeignore wins)', () => {
    const m: IgnoreSet = {
      defaults: [],
      gitignore: ['build/**'],
      claudeignore: ['!build/keep.txt'],
    };
    expect(isIgnored('/repo/build/x.o', root, m)).toBe(true);
    expect(isIgnored('/repo/build/keep.txt', root, m)).toBe(false);
  });

  it('ignores paths outside the root', () => {
    expect(isIgnored('/elsewhere/node_modules/x.js', root, set)).toBe(false);
  });
});
