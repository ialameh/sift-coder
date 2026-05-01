#!/usr/bin/env node
// Post-install: probes better-sqlite3; falls back to node-sqlite3-wasm. Never breaks npm install.

import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);

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
else {
  console.error('[siftcoder] no storage backend available — daemon will fail to start');
  process.exit(0);
}
