import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { mkdtempSync, rmSync, writeFileSync, mkdirSync, existsSync, realpathSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { execFileSync } from 'node:child_process';
import { basename } from 'node:path';
import { gitToplevel, workspaceKey, workspacePaths, ensureWorkspaceDirs } from './workspace.js';

describe('gitToplevel', () => {
  let dir: string;
  beforeEach(() => {
    dir = mkdtempSync(join(tmpdir(), 'siftws-'));
  });
  afterEach(() => {
    rmSync(dir, { recursive: true, force: true });
  });

  it('returns the toplevel for an initialized repo', () => {
    execFileSync('git', ['init', '-q', dir]);
    const sub = join(dir, 'a', 'b');
    mkdirSync(sub, { recursive: true });
    const top = gitToplevel(sub);
    expect(top).toBeTruthy();
    // basename() is cross-platform; split('/') breaks on Windows backslash paths.
    expect(top!.endsWith(basename(dir))).toBe(true);
  });

  it('returns null outside a repo', () => {
    expect(gitToplevel(dir)).toBeNull();
  });
});

describe('workspaceKey', () => {
  it('produces a 12-hex-character workspace key', () => {
    const key = workspaceKey(tmpdir());
    expect(key).toMatch(/^[0-9a-f]{12}$/);
  });

  it('returns the same key for the same path', () => {
    expect(workspaceKey(tmpdir())).toBe(workspaceKey(tmpdir()));
  });

  it('returns different keys for different paths', () => {
    const a = mkdtempSync(join(tmpdir(), 'wsk-a-'));
    const b = mkdtempSync(join(tmpdir(), 'wsk-b-'));
    expect(workspaceKey(a)).not.toBe(workspaceKey(b));
    rmSync(a, { recursive: true, force: true });
    rmSync(b, { recursive: true, force: true });
  });
});

describe('workspacePaths', () => {
  const origNs = process.env['SIFTCODER_NS'];
  afterEach(() => {
    if (origNs === undefined) delete process.env['SIFTCODER_NS'];
    else process.env['SIFTCODER_NS'] = origNs;
  });

  it('produces all expected sub-paths under the given home directory (default namespace)', () => {
    delete process.env['SIFTCODER_NS'];
    const home = mkdtempSync(join(tmpdir(), 'siftcoder-home-'));
    const cwd = tmpdir();
    const p = workspacePaths(cwd, home);
    expect(p.root).toBe(join(home, '.siftcoder', 'default', 'workspaces', p.key));
    expect(p.db).toBe(join(p.root, 'db.sqlite'));
    expect(p.wal).toBe(join(p.root, 'wal.ndjson'));
    expect(p.pid).toBe(join(p.root, 'run.pid'));
    expect(p.socket).toBe(join(home, '.siftcoder', 'default', 'run', `${p.key}.sock`));
    expect(p.log).toBe(join(home, '.siftcoder', 'default', 'logs', `${p.key}.ndjson`));
    rmSync(home, { recursive: true, force: true });
  });

  it('honours SIFTCODER_NS override', () => {
    process.env['SIFTCODER_NS'] = 'custom-ns';
    const home = mkdtempSync(join(tmpdir(), 'siftcoder-ns-'));
    const p = workspacePaths(tmpdir(), home);
    expect(p.root).toContain(join('.siftcoder', 'custom-ns', 'workspaces'));
    expect(p.socket).toContain(join('.siftcoder', 'custom-ns', 'run'));
    rmSync(home, { recursive: true, force: true });
  });
});

describe('ensureWorkspaceDirs', () => {
  it('creates the workspace, run, and log directories', () => {
    const home = mkdtempSync(join(tmpdir(), 'siftcoder-ed-'));
    const p = workspacePaths(tmpdir(), home);
    ensureWorkspaceDirs(p);
    expect(existsSync(p.root)).toBe(true);
    expect(existsSync(join(p.socket, '..'))).toBe(true);
    expect(existsSync(join(p.log, '..'))).toBe(true);
    rmSync(home, { recursive: true, force: true });
  });
});

describe('workspaceKey realpath fallback', () => {
  it('falls back to resolve() when realpathSync throws', () => {
    const fakeMissing = join(tmpdir(), 'definitely-does-not-exist-' + Date.now());
    expect(workspaceKey(fakeMissing)).toMatch(/^[0-9a-f]{12}$/);
  });
});

describe('workspaceKey subspace partition', () => {
  const orig = process.env['SIFTCODER_SUBSPACE'];
  afterEach(() => {
    if (orig === undefined) delete process.env['SIFTCODER_SUBSPACE'];
    else process.env['SIFTCODER_SUBSPACE'] = orig;
  });

  it('partitions the key by SIFTCODER_SUBSPACE and is reversible to baseline', () => {
    const root = realpathSync(
      execFileSync('git', ['rev-parse', '--show-toplevel']).toString().trim(),
    );
    delete process.env['SIFTCODER_SUBSPACE'];
    const base = workspaceKey(root);
    process.env['SIFTCODER_SUBSPACE'] = 'svc-a';
    const a = workspaceKey(root);
    expect(a).not.toBe(base);
    expect(a).toMatch(/^[0-9a-f]{12}$/);
    delete process.env['SIFTCODER_SUBSPACE'];
    expect(workspaceKey(root)).toBe(base);
  });

  it('reads .siftcoder/subspace file when env is unset', () => {
    delete process.env['SIFTCODER_SUBSPACE'];
    const dir = mkdtempSync(join(tmpdir(), 'siftsub-'));
    execFileSync('git', ['init', '-q', dir]);
    const real = realpathSync(dir);
    const base = workspaceKey(real);
    mkdirSync(join(real, '.siftcoder'), { recursive: true });
    writeFileSync(join(real, '.siftcoder', 'subspace'), 'team-x\n');
    expect(workspaceKey(real)).not.toBe(base);
    rmSync(dir, { recursive: true, force: true });
  });
});
