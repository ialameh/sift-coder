'use strict';
// @ts-check
// sift-compress — structured JSONL debug logger with ring-buffer rotation.
// Opt-in via SIFT_DEBUG=1. Zero cost when disabled. Every hook wraps its
// work in `timed()` so the debug log captures duration + outcome for every
// invocation — field debugging without SSH access.

const fs = require('fs');
const path = require('path');
const { debugLogPath } = require('./paths');

const ENABLED = process.env.SIFT_DEBUG === '1';
const MAX_BYTES = 1024 * 1024;

function ensureDir(dir) {
  try { fs.mkdirSync(dir, { recursive: true, mode: 0o700 }); } catch (e) {}
}

function rotateIfNeeded(logPath) {
  try {
    const st = fs.statSync(logPath);
    if (st.size > MAX_BYTES) fs.renameSync(logPath, logPath + '.1');
  } catch (e) {}
}

function log(event) {
  if (!ENABLED) return;
  try {
    const logPath = debugLogPath();
    ensureDir(path.dirname(logPath));
    rotateIfNeeded(logPath);
    const line = JSON.stringify({ ts: new Date().toISOString(), pid: process.pid, ...event }) + '\n';
    fs.appendFileSync(logPath, line, { mode: 0o600 });
  } catch (e) {}
}

// Wrap a synchronous hook body so start/end are logged with duration.
function timed(hookName, fn) {
  const start = Date.now();
  log({ kind: 'hook_start', hook: hookName });
  try {
    const result = fn();
    log({ kind: 'hook_end', hook: hookName, outcome: 'ok', duration_ms: Date.now() - start });
    return result;
  } catch (e) {
    log({ kind: 'hook_end', hook: hookName, outcome: 'error', error: String((e && e.message) || e), duration_ms: Date.now() - start });
    // Re-throwing would crash the hook. A hook must never block the agent.
    // Events module captures the error separately; we swallow here.
  }
}

module.exports = { log, timed, enabled: () => ENABLED };
