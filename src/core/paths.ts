/**
 * XDG-style path resolution for SiftCoder runtime state.
 * All daemon, log, and socket paths flow through here.
 */

import path from 'node:path';
import os from 'node:os';
import crypto from 'node:crypto';

export interface SiftcoderPaths {
  base: string;       // ~/.siftcoder/<ns>
  run: string;        // ~/.siftcoder/<ns>/run
  logs: string;       // ~/.siftcoder/<ns>/logs
  workspaces: string; // ~/.siftcoder/<ns>/workspaces
  sock: string;       // ~/.siftcoder/<ns>/run/<wsKey>.sock
  pid: string;        // ~/.siftcoder/<ns>/run/<wsKey>.pid
  workspace: string;  // ~/.siftcoder/<ns>/workspaces/<wsKey>
  db: string;         // ~/.siftcoder/<ns>/workspaces/<wsKey>/memory.db
  wal: string;        // ~/.siftcoder/<ns>/workspaces/<wsKey>/wal.log
}

export function workspaceKey(projectDir: string = process.env.CLAUDE_PROJECT_DIR || process.cwd()): string {
  return crypto.createHash('sha1').update(projectDir).digest('hex').slice(0, 12);
}

export function resolvePaths(opts: { ns?: string; projectDir?: string } = {}): SiftcoderPaths {
  const ns = opts.ns || process.env.SIFTCODER_NS || 'v3';
  const wsKey = workspaceKey(opts.projectDir);
  const base = path.join(os.homedir(), '.siftcoder', ns);
  const run = path.join(base, 'run');
  const logs = path.join(base, 'logs');
  const workspaces = path.join(base, 'workspaces');
  const workspace = path.join(workspaces, wsKey);
  return {
    base,
    run,
    logs,
    workspaces,
    workspace,
    sock: path.join(run, `${wsKey}.sock`),
    pid: path.join(run, `${wsKey}.pid`),
    db: path.join(workspace, 'memory.db'),
    wal: path.join(workspace, 'wal.log'),
  };
}
