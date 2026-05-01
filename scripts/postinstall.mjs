#!/usr/bin/env node
// Post-install:
//   1. Probe better-sqlite3 native binding; report fallback to node-sqlite3-wasm if needed
//   2. Build dist/ if missing (npm install runs this; plugin marketplace clones do not — the
//      SessionStart `ensure-built.mjs` hook handles that case)
// Never breaks npm install.

import { createRequire } from 'node:module';
import { existsSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const require = createRequire(import.meta.url);
const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, '..');

let nativeOk = false;
try {
  require('better-sqlite3');
  nativeOk = true;
} catch (e) {
  console.warn(`[siftcoder] better-sqlite3 native binding unavailable: ${e?.message || e}`);
}

let wasmOk = false;
try {
  await import('node-sqlite3-wasm');
  wasmOk = true;
} catch (e) {
  console.warn(`[siftcoder] node-sqlite3-wasm unavailable: ${e?.message || e}`);
}

if (nativeOk) console.log('[siftcoder] storage backend: better-sqlite3 (native)');
else if (wasmOk) console.log('[siftcoder] storage backend: node-sqlite3-wasm (fallback)');
else console.error('[siftcoder] no storage backend available — daemon will fail to start');

// Build dist/ if absent. Skip if already present (re-install scenario).
const sentinel = join(ROOT, 'dist', 'memory', 'mcp', 'server.js');
if (!existsSync(sentinel)) {
  console.log('[siftcoder] building dist/ via npx tsc');
  const r = spawnSync('npx', ['tsc'], {
    cwd: ROOT,
    encoding: 'utf8',
    timeout: 120_000,
    stdio: 'inherit',
  });
  if (r.status !== 0) {
    console.warn(
      `[siftcoder] build failed (exit ${r.status}); the SessionStart hook will retry on next Claude Code session, or run \`npm run build\` manually`,
    );
  } else {
    console.log('[siftcoder] dist/ built');
  }
}

process.exit(0);
