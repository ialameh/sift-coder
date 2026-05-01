#!/usr/bin/env node
/**
 * SessionStart hook — ensure plugin is built.
 *
 * Plugin marketplace installs git-clone the repo without running npm install or
 * npm run build, so dist/ is missing and bin/siftcoder.mjs + the MCP server fail
 * with ERR_MODULE_NOT_FOUND. This hook fixes that on first session start.
 *
 * Behaviour:
 *   1. Detect plugin root via CLAUDE_PLUGIN_ROOT (or fall back to script's repo root)
 *   2. If dist/memory/mcp/server.js is missing → run npm install + npm run build
 *   3. Log to ~/.siftcoder/<NS>/logs/install.ndjson
 *   4. On success: silent (let spawn-daemon proceed)
 *   5. On failure: print one clear instruction to stderr + write a flag file so
 *      spawn-daemon can surface the same message to the user
 *
 * Idempotent: subsequent sessions skip if dist/ is current. Cheap if already built.
 * Non-blocking: never blocks the user — exits 0 even on build failure.
 *
 * Budget: up to 90s on first run (npm install + build), <50ms on subsequent.
 */

import { execFileSync, spawnSync } from 'node:child_process';
import { existsSync, mkdirSync, appendFileSync, statSync, writeFileSync, readdirSync, rmSync, renameSync } from 'node:fs';
import { homedir } from 'node:os';
import { join, dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);

const NS = process.env.SIFTCODER_NS || 'default';
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

/**
 * Migrate legacy 'v3' namespace to 'default' on first run.
 * v1.0.0–v1.0.5 used 'v3' as the state-isolation marker (leftover from internal
 * "third generation" naming). v1.0.6+ uses 'default'. If user has data at the
 * old path and nothing at the new path, atomically rename one-shot.
 */
function migrateLegacyNamespace() {
  if (NS !== 'default' || process.env.SIFTCODER_NS) return;
  try {
    const root = join(homedir(), '.siftcoder');
    const oldDir = join(root, 'v3');
    const newDir = join(root, 'default');
    if (existsSync(oldDir) && !existsSync(newDir)) {
      renameSync(oldDir, newDir);
      logEvent({ kind: 'namespace-migrated', from: 'v3', to: 'default' });
    }
  } catch { /* never throw from a hook */ }
}

function pluginRoot() {
  if (process.env.CLAUDE_PLUGIN_ROOT) return process.env.CLAUDE_PLUGIN_ROOT;
  // hooks/session-start/ensure-built.mjs → plugin root is two levels up
  return resolve(__dirname, '..', '..');
}

function logEvent(rec) {
  try {
    const dir = join(homedir(), '.siftcoder', NS, 'logs');
    mkdirSync(dir, { recursive: true });
    appendFileSync(join(dir, 'install.ndjson'), JSON.stringify({ ts: new Date().toISOString(), ...rec }) + '\n');
  } catch { /* never throw from a hook */ }
}

function distLooksFresh(root) {
  const sentinel = join(root, 'dist', 'memory', 'mcp', 'server.js');
  if (!existsSync(sentinel)) return false;
  // Compare mtimes: if any src/**/*.ts is newer than the sentinel, dist is stale
  try {
    const sentinelMtime = statSync(sentinel).mtimeMs;
    const srcDir = join(root, 'src');
    if (!existsSync(srcDir)) return true; // no src → can't compare → trust dist
    return walkAndCheck(srcDir, sentinelMtime);
  } catch {
    return false;
  }
}

function walkAndCheck(dir, sentinelMtime) {
  for (const name of readdirSync(dir)) {
    const path = join(dir, name);
    let s;
    try { s = statSync(path); } catch { continue; }
    if (s.isDirectory()) {
      if (!walkAndCheck(path, sentinelMtime)) return false;
    } else if (name.endsWith('.ts') && !name.endsWith('.test.ts')) {
      if (s.mtimeMs > sentinelMtime) return false;
    }
  }
  return true;
}

function nodeModulesReady(root) {
  return existsSync(join(root, 'node_modules', 'better-sqlite3', 'package.json'))
    || existsSync(join(root, 'node_modules', 'node-sqlite3-wasm', 'package.json'));
}

function run(cmd, args, cwd, timeoutMs) {
  const r = spawnSync(cmd, args, {
    cwd,
    encoding: 'utf8',
    timeout: timeoutMs,
    env: { ...process.env, npm_config_loglevel: 'error', npm_config_fund: 'false', npm_config_audit: 'false' },
  });
  return { ok: r.status === 0, stdout: r.stdout, stderr: r.stderr, status: r.status };
}

function writeInstallError(root, message) {
  try {
    const flag = join(homedir(), '.siftcoder', NS, 'install-error.flag');
    mkdirSync(dirname(flag), { recursive: true });
    writeFileSync(flag, JSON.stringify({ ts: new Date().toISOString(), pluginRoot: root, message }, null, 2));
  } catch { /* ignore */ }
}

function clearInstallError() {
  try {
    const flag = join(homedir(), '.siftcoder', NS, 'install-error.flag');
    if (existsSync(flag)) rmSync(flag, { force: true });
  } catch { /* ignore */ }
}

migrateLegacyNamespace();

const root = pluginRoot();

if (distLooksFresh(root)) {
  logEvent({ kind: 'skip', reason: 'dist-fresh', root });
  process.exit(0);
}

logEvent({ kind: 'build-start', root, hasNodeModules: nodeModulesReady(root) });

if (!nodeModulesReady(root)) {
  logEvent({ kind: 'npm-install', root });
  const inst = run('npm', ['install', '--silent', '--no-fund', '--no-audit'], root, 180_000);
  if (!inst.ok) {
    const msg = `npm install failed (exit ${inst.status}). Run manually:\n  cd ${root} && npm install && npm run build`;
    process.stderr.write(`[siftcoder] ${msg}\n`);
    writeInstallError(root, msg);
    logEvent({ kind: 'npm-install-fail', stderr: (inst.stderr || '').slice(-500) });
    process.exit(0);
  }
}

logEvent({ kind: 'npm-build', root });
const build = run('npx', ['tsc'], root, 120_000);
if (!build.ok) {
  const msg = `Build failed (exit ${build.status}). Run manually:\n  cd ${root} && npm install && npm run build`;
  process.stderr.write(`[siftcoder] ${msg}\n`);
  writeInstallError(root, msg);
  logEvent({ kind: 'build-fail', stderr: (build.stderr || '').slice(-500) });
  process.exit(0);
}

// Probe better-sqlite3 native binding. Node major versions ahead of the prebuilt
// binaries (e.g. Node 25 in 2026) often pass `require()` (binding loads) but fail
// at the first actual SQLite call. Probe must therefore open + query an in-memory
// DB to catch the load-OK / runtime-broken case. A targeted `npm rebuild
// better-sqlite3` compiles the binding against the running Node ABI and resolves
// both load-time and runtime failures.
function nativeBindingOk() {
  const r = spawnSync(
    'node',
    ['-e', "const D=require('better-sqlite3');const v=new D(':memory:').prepare('select 1 as v').get().v;if(v!==1)process.exit(2)"],
    { cwd: root, timeout: 10_000, stdio: 'pipe' },
  );
  return r.status === 0;
}

if (!nativeBindingOk()) {
  logEvent({ kind: 'native-rebuild', root });
  const rebuild = run('npm', ['rebuild', 'better-sqlite3', '--silent'], root, 180_000);
  if (!rebuild.ok || !nativeBindingOk()) {
    const msg = `better-sqlite3 native binding failed to build for Node ${process.version}. Run manually:\n  cd ${root} && npm rebuild better-sqlite3`;
    process.stderr.write(`[siftcoder] ${msg}\n`);
    writeInstallError(root, msg);
    logEvent({ kind: 'native-rebuild-fail', stderr: (rebuild.stderr || '').slice(-500) });
    process.exit(0);
  }
  logEvent({ kind: 'native-rebuild-ok', root });
}

// Clear any prior install error since we're now built
clearInstallError();

logEvent({ kind: 'build-ok', root });
process.exit(0);
