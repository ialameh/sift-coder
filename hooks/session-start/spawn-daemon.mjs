#!/usr/bin/env node
/**
 * SiftCoder SessionStart Hook - Memory Daemon Spawn
 *
 * Idempotent: if a daemon is already running for this workspace (PID alive + socket present),
 * exits immediately. Otherwise spawns the daemon as a detached, double-forked process and exits.
 */

import { spawn } from 'node:child_process';
import { existsSync, readFileSync, mkdirSync } from 'node:fs';
import { homedir } from 'node:os';
import { join, dirname, resolve } from 'node:path';
import { realpathSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));

function gitToplevel(cwd) {
  try {
    const out = execFileSync('git', ['-C', cwd, 'rev-parse', '--show-toplevel'], {
      stdio: ['ignore', 'pipe', 'ignore'],
    });
    return out.toString('utf8').trim() || null;
  } catch {
    return null;
  }
}

function workspaceKey(cwd) {
  const top = gitToplevel(cwd) ?? cwd;
  let real;
  try { real = realpathSync(top); } catch { real = resolve(top); }
  return createHash('sha256').update(real).digest('hex').slice(0, 12);
}

function isAlive(pid) {
  try { process.kill(pid, 0); return true; } catch { return false; }
}

function pluginRoot() {
  if (process.env.CLAUDE_PLUGIN_ROOT) return process.env.CLAUDE_PLUGIN_ROOT;
  let cur = __dirname;
  for (let i = 0; i < 10 && cur !== dirname(cur); i++) {
    if (existsSync(join(cur, 'package.json'))) return cur;
    cur = dirname(cur);
  }
  return null;
}

function main() {
  const cwd = process.env.CLAUDE_PROJECT_DIR || process.cwd();
  const key = workspaceKey(cwd);
  const home = homedir();
  const root = join(home, '.siftcoder', 'workspaces', key);
  const runDir = join(home, '.siftcoder', 'run');
  const pidFile = join(root, 'run.pid');
  const sockFile = join(runDir, `${key}.sock`);
  const logDir = join(home, '.siftcoder', 'logs');
  mkdirSync(root, { recursive: true });
  mkdirSync(runDir, { recursive: true });
  mkdirSync(logDir, { recursive: true });

  if (existsSync(pidFile)) {
    const pid = parseInt(readFileSync(pidFile, 'utf8').trim(), 10);
    if (Number.isFinite(pid) && isAlive(pid) && existsSync(sockFile)) {
      process.exit(0);
    }
  }

  const plugin = pluginRoot();
  if (!plugin) process.exit(0);
  const entry = join(plugin, 'dist', 'memory', 'daemon', 'index.js');
  if (!existsSync(entry)) process.exit(0);

  const child = spawn(process.execPath, [entry], {
    detached: true,
    stdio: 'ignore',
    env: {
      ...process.env,
      SIFTCODER_WORKSPACE_CWD: cwd,
    },
    cwd,
  });
  child.unref();
  process.exit(0);
}

main();
