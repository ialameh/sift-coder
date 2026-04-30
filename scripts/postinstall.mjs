#!/usr/bin/env node
/**
 * SiftCoder postinstall.
 *
 * Two responsibilities:
 *   1. Build the TypeScript sources via `tsc` so dist/ is current.
 *   2. Ensure the better-sqlite3 native binding is present. If npm install was run with
 *      `--ignore-scripts` or if prebuild-install couldn't reach the network, the binding may be
 *      missing. We attempt `npm rebuild better-sqlite3 --build-from-source-fallback` as a best
 *      effort. Failure here is logged but does NOT abort the install — the SessionStart hook will
 *      attempt a second self-heal at first daemon spawn.
 */
import { spawnSync } from 'node:child_process';
import { existsSync, mkdirSync, readdirSync, copyFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, '..');
const bindingPath = join(root, 'node_modules/better-sqlite3/build/Release/better_sqlite3.node');

function copyStaticWebAssets() {
  const src = join(root, 'src/memory/web/static');
  const dst = join(root, 'dist/memory/web/static');
  if (!existsSync(src)) return;
  mkdirSync(dst, { recursive: true });
  for (const f of readdirSync(src)) {
    try { copyFileSync(join(src, f), join(dst, f)); } catch { /* ignore */ }
  }
}

function run(cmd, args, opts = {}) {
  const r = spawnSync(cmd, args, { cwd: root, stdio: 'inherit', ...opts });
  return r.status ?? 0;
}

function tryQuiet(cmd, args) {
  return spawnSync(cmd, args, { cwd: root, stdio: ['ignore', 'pipe', 'pipe'] });
}

function ensureBinding() {
  if (existsSync(bindingPath)) return true;
  console.log('[siftcoder postinstall] better-sqlite3 native binding missing; rebuilding...');
  const rebuild = tryQuiet('npm', ['rebuild', 'better-sqlite3', '--build-from-source-fallback']);
  if (rebuild.status === 0 && existsSync(bindingPath)) {
    console.log('[siftcoder postinstall] native binding rebuilt');
    return true;
  }
  const reinstall = tryQuiet('npm', ['install', 'better-sqlite3', '--no-audit', '--no-fund']);
  if (reinstall.status === 0 && existsSync(bindingPath)) {
    console.log('[siftcoder postinstall] native binding reinstalled');
    return true;
  }
  console.warn(
    '[siftcoder postinstall] could not produce native binding. ' +
    'SessionStart hook will retry on first daemon spawn. ' +
    `Manually: cd ${root} && npm install better-sqlite3`
  );
  return false;
}

const tsc = run('npx', ['--no-install', 'tsc']);
if (tsc !== 0) {
  console.warn('[siftcoder postinstall] tsc returned non-zero; dist/ may be stale');
}

copyStaticWebAssets();

ensureBinding();

// Ensure WASM fallback dep is present (it's a runtime dep but the plugin cache may have been
// installed from a prior package.json that did not list it). Best-effort install — failure is
// non-fatal because we still have native better-sqlite3 in most cases.
const wasmDepDir = join(root, 'node_modules/node-sqlite3-wasm');
if (!existsSync(wasmDepDir)) {
  console.log('[siftcoder postinstall] node-sqlite3-wasm missing; installing fallback dep...');
  const r = tryQuiet('npm', ['install', 'node-sqlite3-wasm@^0.8.56', '--no-save', '--no-audit', '--no-fund']);
  if (r.status === 0 && existsSync(wasmDepDir)) {
    console.log('[siftcoder postinstall] WASM fallback dep installed');
  } else {
    console.warn('[siftcoder postinstall] could not install node-sqlite3-wasm; WASM fallback will be unavailable until npm install runs');
  }
}

process.exit(0);
