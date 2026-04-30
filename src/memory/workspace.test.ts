import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { mkdtempSync, rmSync, writeFileSync, mkdirSync, existsSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { execFileSync } from 'node:child_process';
import { gitToplevel, workspaceKey, workspacePaths, ensureWorkspaceDirs } from './workspace.js';

describe('gitToplevel', () => {
  let dir: string;
  beforeEach(() => { dir = mkdtempSync(join(tmpdir(), 'siftws-')); });
  afterEach(() => { rmSync(dir, { recursive: true, force: true }); });

  it('returns the toplevel for an initialized repo', () => {
    execFileSync('git', ['init', '-q', dir]);
    const sub = join(dir, 'a', 'b');
    mkdirSync(sub, { recursive: true });
    const top = gitToplevel(sub);
    expect(top).toBeTruthy();
    expect(top!.endsWith(dir.split('/').pop()!)).toBe(true);
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

  it('produces all expected sub-paths under the given home directory (default ns v3)', () => {
    delete process.env['SIFTCODER_NS'];
    const home = mkdtempSync(join(tmpdir(), 'siftcoder-home-'));
    const cwd = tmpdir();
    const p = workspacePaths(cwd, home);
    expect(p.root).toBe(join(home, '.siftcoder', 'v3', 'workspaces', p.key));
    expect(p.db).toBe(join(p.root, 'db.sqlite'));
    expect(p.wal).toBe(join(p.root, 'wal.ndjson'));
    expect(p.pid).toBe(join(p.root, 'run.pid'));
    expect(p.socket).toBe(join(home, '.siftcoder', 'v3', 'run', `${p.key}.sock`));
    expect(p.log).toBe(join(home, '.siftcoder', 'v3', 'logs', `${p.key}.ndjson`));
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
