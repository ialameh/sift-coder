#!/usr/bin/env node
/**
 * SiftCoder SessionStart Hook - Memory Daemon Spawn (with self-heal)
 *
 * Idempotent. If a daemon is already running for this workspace (PID alive + socket present),
 * exits immediately. Otherwise:
 *   1. Verifies the plugin install has its native dependencies; reinstalls them if missing.
 *   2. Spawns the daemon detached.
 *   3. Waits up to 2s for the socket to appear; logs the outcome to ~/.siftcoder/logs/spawn.ndjson.
 *
 * The self-heal step is the permanent fix for plugin caches that lose better-sqlite3's prebuilt
 * binary (commonly seen after /plugin uninstall + install when npm install runs without scripts).
 */

import { spawn, execFileSync, spawnSync } from 'node:child_process';
import {
  existsSync, readFileSync, mkdirSync, realpathSync, appendFileSync,
} from 'node:fs';
import { homedir } from 'node:os';
import { join, dirname, resolve } from 'node:path';
import { createHash } from 'node:crypto';
import { fileURLToPath } from 'node:url';

const SIFTCODER_NS = process.env.SIFTCODER_NS || 'v3';

const __dirname = dirname(fileURLToPath(import.meta.url));
const SPAWN_LOG = join(homedir(), '.siftcoder', SIFTCODER_NS, 'logs', 'spawn.ndjson');
const SOCKET_TIMEOUT_MS = 2000;
const SOCKET_POLL_MS = 100;
const NATIVE_BINDING_SUBPATH = 'node_modules/better-sqlite3/build/Release/better_sqlite3.node';

function logEvent(level, message, attributes = {}) {
  try {
    mkdirSync(dirname(SPAWN_LOG), { recursive: true });
    appendFileSync(
      SPAWN_LOG,
      JSON.stringify({ timestamp: new Date().toISOString(), level, name: 'spawn-daemon', message, attributes }) + '\n'
    );
  } catch { /* never fatal */ }
}

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

/**
 * Permanent self-heal: when the plugin's better-sqlite3 native binding is missing, reinstall
 * the package. This is the recurring failure mode on plugin reinstall.
 */
function ensureNativeBinding(plugin, key) {
  const bindingPath = join(plugin, NATIVE_BINDING_SUBPATH);
  if (existsSync(bindingPath)) return true;
  logEvent('warn', 'native binding missing; healing', { plugin, expected: bindingPath, key });

  // Strategy 1: npm rebuild forces prebuild-install / native compile even if package-lock thinks
  // the package is installed. This is the case after `npm install --ignore-scripts` skipped the
  // native step.
  const rebuild = spawnSync('npm', ['rebuild', 'better-sqlite3', '--build-from-source-fallback'], {
    cwd: plugin,
    stdio: ['ignore', 'pipe', 'pipe'],
    timeout: 180_000,
    env: { ...process.env, npm_config_loglevel: 'error' },
  });
  if (rebuild.status === 0 && existsSync(bindingPath)) {
    logEvent('info', 'native binding healed via npm rebuild', { plugin, key });
    return true;
  }

  // Strategy 2: blow away the package and reinstall fresh.
  const pkgDir = join(plugin, 'node_modules', 'better-sqlite3');
  if (existsSync(pkgDir)) {
    spawnSync('rm', ['-rf', pkgDir], { stdio: 'ignore' });
  }
  const reinstall = spawnSync('npm', ['install', 'better-sqlite3', '--no-audit', '--no-fund'], {
    cwd: plugin,
    stdio: ['ignore', 'pipe', 'pipe'],
    timeout: 180_000,
    env: { ...process.env, npm_config_loglevel: 'error' },
  });
  if (reinstall.status !== 0) {
    logEvent('error', 'native binding self-heal failed', {
      plugin, key, exitCode: reinstall.status,
      stderr: (reinstall.stderr ?? '').toString().slice(0, 2000),
    });
    return false;
  }
  if (!existsSync(bindingPath)) {
    logEvent('error', 'native binding self-heal returned 0 but binding still missing', { plugin, key });
    return false;
  }
  logEvent('info', 'native binding healed via fresh reinstall', { plugin, key });
  return true;
}

function waitForSocket(sockFile) {
  const deadline = Date.now() + SOCKET_TIMEOUT_MS;
  while (Date.now() < deadline) {
    if (existsSync(sockFile)) return true;
    const wait = spawnSync(process.execPath, ['-e', `setTimeout(()=>{},${SOCKET_POLL_MS})`], {
      stdio: 'ignore',
    });
    if (wait.error) break;
  }
  return existsSync(sockFile);
}

function main() {
  const cwd = process.env.CLAUDE_PROJECT_DIR || process.cwd();
  const key = workspaceKey(cwd);
  const home = homedir();
  const root = join(home, '.siftcoder', SIFTCODER_NS, 'workspaces', key);
  const runDir = join(home, '.siftcoder', SIFTCODER_NS, 'run');
  const pidFile = join(root, 'run.pid');
  const sockFile = join(runDir, `${key}.sock`);
  const logDir = join(home, '.siftcoder', SIFTCODER_NS, 'logs');
  mkdirSync(root, { recursive: true });
  mkdirSync(runDir, { recursive: true });
  mkdirSync(logDir, { recursive: true });

  if (existsSync(pidFile)) {
    const pid = parseInt(readFileSync(pidFile, 'utf8').trim(), 10);
    if (Number.isFinite(pid) && isAlive(pid) && existsSync(sockFile)) {
      logEvent('info', 'daemon already running', { key, pid });
      process.exit(0);
    }
  }

  const plugin = pluginRoot();
  if (!plugin) {
    logEvent('error', 'plugin root not found', { cwd });
    process.exit(0);
  }
  const entry = join(plugin, 'dist', 'memory', 'daemon', 'index.js');
  if (!existsSync(entry)) {
    logEvent('error', 'daemon entrypoint missing', { plugin, entry });
    process.exit(0);
  }

  // Best-effort: try to heal the native binding so we get the fast path.
  // If this fails, the daemon will fall back to the WASM SQLite backend automatically — slower
  // but always works. Either way the daemon should boot.
  ensureNativeBinding(plugin, key);

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
  logEvent('info', 'daemon spawn dispatched', { key, plugin, pluginPid: child.pid });

  if (waitForSocket(sockFile)) {
    logEvent('info', 'daemon socket up', { key, sockFile });
  } else {
    logEvent('error', 'daemon spawn returned but socket did not appear', {
      key, sockFile, hint: `tail -20 ~/.siftcoder/logs/${key}.ndjson for daemon-side errors`,
    });
  }

  emitOnboardNudgeIfNeeded({ cwd, key, root });

  process.exit(0);
}

/**
 * If this workspace hasn't been onboarded yet, print a SessionStart context line so Claude
 * surfaces the suggestion to the user. Stays silent once `~/.siftcoder/workspaces/<key>/onboarded`
 * exists. Nags every session until then — by design, per user request.
 */
function emitOnboardNudgeIfNeeded({ cwd, key, root }) {
  const sentinel = join(root, 'onboarded');
  if (existsSync(sentinel)) return;

  // Cheap heuristic: are there past Claude Code transcripts for this directory? If so, the
  // user probably has history worth backfilling. If not, no point nagging.
  const ccProjectDir = join(homedir(), '.claude', 'projects', cwd.replace(/\//g, '-'));
  let transcriptCount = 0;
  try {
    if (existsSync(ccProjectDir)) {
      const files = spawnSync('ls', ['-1', ccProjectDir], { stdio: ['ignore', 'pipe', 'ignore'] });
      transcriptCount = (files.stdout?.toString() ?? '')
        .split('\n')
        .filter(f => f.endsWith('.jsonl'))
        .length;
    }
  } catch { /* best-effort */ }

  // SessionStart hook stdout is injected as additional context for Claude. Format the message
  // so the assistant naturally surfaces it to the user once.
  const lines = [
    `siftcoder-memory: workspace ${key} not yet onboarded.`,
    transcriptCount > 0
      ? `${transcriptCount} past Claude Code session(s) available to backfill.`
      : `no past sessions to backfill; capture starts fresh.`,
    `Suggested next step: run \`/siftcoder:mem-setup\` to walk through the one-time setup`,
    `(daemon check, optional transcript backfill, drain to summaries). Will keep showing this nudge until \`/siftcoder:mem-setup\` completes or you create \`${sentinel}\` manually.`,
  ];
  process.stdout.write(lines.join(' ') + '\n');
}

main();
