/**
 * Workspace identity + path resolution.
 * Workspace key = first 12 hex of SHA-256 over the realpath of the git toplevel (or cwd if not a repo).
 */
import { createHash } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { realpathSync, mkdirSync } from 'node:fs';
import { homedir } from 'node:os';
import { join, resolve } from 'node:path';

export interface WorkspacePaths {
  key: string;
  root: string;          // ~/.siftcoder/workspaces/<key>
  db: string;            // <root>/db.sqlite
  wal: string;           // <root>/wal.ndjson
  pid: string;           // <root>/run.pid
  socket: string;        // ~/.siftcoder/run/<key>.sock
  log: string;           // ~/.siftcoder/logs/<key>.ndjson
}

export function gitToplevel(cwd: string): string | null {
  try {
    const out = execFileSync('git', ['-C', cwd, 'rev-parse', '--show-toplevel'], {
      stdio: ['ignore', 'pipe', 'ignore'],
    });
    /* c8 ignore next -- empty git output is defensive; in practice rev-parse either succeeds or throws */
    return out.toString('utf8').trim() || null;
  } catch {
    return null;
  }
}

export function workspaceKey(cwd: string): string {
  const top = gitToplevel(cwd) ?? cwd;
  let real: string;
  try {
    real = realpathSync(top);
  } catch {
    real = resolve(top);
  }
  return createHash('sha256').update(real).digest('hex').slice(0, 12);
}

export function workspacePaths(cwd: string, home: string = homedir()): WorkspacePaths {
  const key = workspaceKey(cwd);
  const ns = process.env['SIFTCODER_NS'] || 'v3';
  const root = join(home, '.siftcoder', ns, 'workspaces', key);
  const runDir = join(home, '.siftcoder', ns, 'run');
  const logDir = join(home, '.siftcoder', ns, 'logs');
  return {
    key,
    root,
    db: join(root, 'db.sqlite'),
    wal: join(root, 'wal.ndjson'),
    pid: join(root, 'run.pid'),
    socket: join(runDir, `${key}.sock`),
    log: join(logDir, `${key}.ndjson`),
  };
}

export function ensureWorkspaceDirs(paths: WorkspacePaths): void {
  mkdirSync(paths.root, { recursive: true });
  mkdirSync(join(paths.socket, '..'), { recursive: true });
  mkdirSync(join(paths.log, '..'), { recursive: true });
}
