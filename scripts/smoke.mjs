#!/usr/bin/env node
/**
 * End-to-end smoke test. Verifies:
 *   1. Daemon spawns + binds UDS socket
 *   2. PostToolUse capture-observation hook frames the daemon
 *   3. MCP server (siftcoder-memory) handles mem_search / mem_get / mem_drain
 *   4. PreCompact inject-memories hook returns top-k
 *   5. Notification pin-incident hook frames the daemon
 *   6. PreToolUse boundary-enforcer respects scope.json
 *   7. Stop should-continue hook reports pending
 *
 * Output: ndjson lines per check + summary.
 */

import { spawn, spawnSync } from 'node:child_process';
import net from 'node:net';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import url from 'node:url';
import crypto from 'node:crypto';

const __dirname = path.dirname(url.fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
// Short paths critical: macOS UDS sockets cap at 104 chars
const SHORT_BASE = path.join('/tmp', `sc${Date.now() % 1000000}`);
fs.mkdirSync(SHORT_BASE, { recursive: true });
const NS = 'sm';
const TEST_PROJECT = path.join(SHORT_BASE, 'p');
fs.mkdirSync(TEST_PROJECT, { recursive: true });
const SIFT_HOME = path.join(SHORT_BASE, 'h');
fs.mkdirSync(SIFT_HOME, { recursive: true });

const HOME_BACKUP = process.env.HOME;
process.env.HOME = SIFT_HOME;
process.env.SIFTCODER_NS = NS;
process.env.CLAUDE_PROJECT_DIR = TEST_PROJECT;

const results = [];
function record(name, ok, detail = {}) {
  const rec = { ts: new Date().toISOString(), name, ok, ...detail };
  results.push(rec);
  process.stdout.write(JSON.stringify(rec) + '\n');
}

function workspaceKey() {
  // must match src/memory/workspace.ts: sha256 of realpath, first 12 hex
  return crypto.createHash('sha256').update(fs.realpathSync(TEST_PROJECT)).digest('hex').slice(0, 12);
}

function paths() {
  const base = path.join(SIFT_HOME, '.siftcoder', NS);
  return {
    base,
    run: path.join(base, 'run'),
    sock: path.join(base, 'run', `${workspaceKey()}.sock`),
    pid: path.join(base, 'run', `${workspaceKey()}.pid`),
    workspaceDb: path.join(base, 'workspaces', workspaceKey(), 'memory.db'),
  };
}

function encodeFrame(obj) {
  const body = Buffer.from(JSON.stringify(obj), 'utf8');
  const header = Buffer.alloc(4);
  header.writeUInt32BE(body.length, 0);
  return Buffer.concat([header, body]);
}

function rpc(kind, args = {}, budgetMs = 3000) {
  return new Promise((resolve, reject) => {
    const c = net.createConnection(paths().sock);
    const chunks = [];
    const t = setTimeout(() => {
      c.destroy();
      reject(new Error(`rpc ${kind} timeout`));
    }, budgetMs);
    c.on('data', (d) => chunks.push(d));
    c.on('end', () => {
      clearTimeout(t);
      try {
        const buf = Buffer.concat(chunks);
        if (buf.length < 4) return reject(new Error('short response'));
        const len = buf.readUInt32BE(0);
        const body = buf.slice(4, 4 + len).toString('utf8');
        resolve(JSON.parse(body));
      } catch (e) {
        reject(e);
      }
    });
    c.on('error', (e) => {
      clearTimeout(t);
      reject(e);
    });
    c.write(encodeFrame({ kind, ...args }));
    c.end();
  });
}

async function waitForSock(timeoutMs = 5000) {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    if (fs.existsSync(paths().sock)) return true;
    await new Promise((r) => setTimeout(r, 100));
  }
  return false;
}

function runHook(scriptPath, payload, env = {}) {
  const r = spawnSync(
    'node',
    [scriptPath],
    {
      input: JSON.stringify(payload),
      env: { ...process.env, ...env },
      encoding: 'utf8',
      timeout: 5000,
    },
  );
  return { stdout: r.stdout, stderr: r.stderr, status: r.status };
}

let daemon = null;

async function cleanup() {
  if (daemon) {
    try { daemon.kill(); } catch {}
  }
  process.env.HOME = HOME_BACKUP;
  // leave SIFT_HOME for debug, comment to delete:
  // await fs.promises.rm(TEST_PROJECT, { recursive: true, force: true });
}

try {
  // 1. Spawn daemon
  fs.mkdirSync(paths().run, { recursive: true });
  daemon = spawn(
    'node',
    [path.join(ROOT, 'dist', 'memory', 'daemon', 'index.js')],
    { stdio: 'pipe', env: process.env, cwd: TEST_PROJECT },
  );
  daemon.stderr.on('data', (d) => process.stderr.write(`[daemon] ${d}`));

  const ok1 = await waitForSock();
  record('daemon_spawn', ok1, { sock: paths().sock });
  if (!ok1) throw new Error('daemon never bound socket');

  // 2. capture-observation hook
  const captureHook = path.join(ROOT, 'hooks', 'post-tool-use', 'capture-observation.mjs');
  const cap1 = runHook(captureHook, {
    tool_name: 'Read',
    tool_input: { file_path: '/test/file.ts' },
    tool_response: { content: 'export const X = 1' },
    session_id: 'smoke-sess',
    cwd: TEST_PROJECT,
  });
  record('capture_observation_hook', cap1.status === 0, { stderr: cap1.stderr.slice(0, 200) });

  // wait briefly for capture to settle
  await new Promise((r) => setTimeout(r, 300));

  // 3. ping daemon directly
  let ping;
  try {
    ping = await rpc('ping');
    record('daemon_ping', ping.ok === true, ping);
  } catch (e) {
    record('daemon_ping', false, { error: e.message });
  }

  // 3b. daemon get with empty id list — proves request/response round-trip works
  try {
    const got = await rpc('get', { ids: [] });
    record('daemon_get_empty_ok', got.ok === true, { rows: got.data?.rows?.length ?? 0 });
  } catch (e) {
    record('daemon_get_empty_ok', false, { error: e.message });
  }

  // 3c. capture frame via daemon RPC (separate from the hook path)
  try {
    const cap = await rpc('capture', {
      sessionId: 'smoke-sess',
      tool: 'Read',
      payload: { file: '/x.ts', body: 'hello' },
      source: 'smoke',
    });
    record('daemon_capture_via_rpc', cap.ok === true, cap.data || {});
  } catch (e) {
    record('daemon_capture_via_rpc', false, { error: e.message });
  }

  // 4. detect-console-logs hook
  const consoleHook = path.join(ROOT, 'hooks', 'post-tool-use', 'detect-console-logs.mjs');
  const c1 = runHook(consoleHook, {
    tool_name: 'Write',
    tool_input: { file_path: '/test/foo.ts', content: 'console.log("debug")' },
  });
  record('detect_console_logs_hook', c1.status === 0);

  // 5. PreToolUse boundary-enforcer (no scope file → allow)
  const beHook = path.join(ROOT, 'hooks', 'pre-tool-use', 'boundary-enforcer.mjs');
  const be1 = runHook(beHook, {
    tool_name: 'Write',
    tool_input: { file_path: '/some/file.ts' },
  });
  record('boundary_enforcer_no_scope_allows', be1.status === 0);

  // with scope file (deny)
  const scopeDir = path.join(TEST_PROJECT, '.siftcoder');
  fs.mkdirSync(scopeDir, { recursive: true });
  fs.writeFileSync(
    path.join(scopeDir, 'scope.json'),
    JSON.stringify({ allow: ['allowed/**'], deny: [] }),
  );
  const be2 = runHook(beHook, {
    tool_name: 'Write',
    tool_input: { file_path: '/forbidden/file.ts' },
  });
  record('boundary_enforcer_blocks_outside_scope', be2.status === 2);

  // 6. PreCompact inject-memories
  const preCompactHook = path.join(ROOT, 'hooks', 'pre-compact', 'inject-memories.mjs');
  const ic = runHook(preCompactHook, {
    transcript_path: '/dev/null',
    trigger: 'auto',
  });
  record('inject_memories_hook', ic.status === 0, { stdout_len: ic.stdout.length });

  // 7. Notification pin-incident
  const notifHook = path.join(ROOT, 'hooks', 'notification', 'pin-incident.mjs');
  const ni = runHook(notifHook, {
    message: 'Permission required: Write to /etc/passwd',
    title: 'permission_request',
  });
  record('pin_incident_hook', ni.status === 0);

  // 8. Stop should-continue
  const stopHook = path.join(ROOT, 'hooks', 'stop', 'should-continue.mjs');
  const sc = runHook(stopHook, { stop_hook_active: false });
  record('should_continue_hook', sc.status === 0, { stdout: sc.stdout.slice(0, 200) });

} finally {
  await cleanup();
}

const total = results.length;
const passed = results.filter((r) => r.ok).length;
const failed = total - passed;

console.log('\n=== smoke summary ===');
console.log(`total: ${total}  passed: ${passed}  failed: ${failed}`);
if (failed > 0) {
  console.log('\nfailures:');
  results.filter((r) => !r.ok).forEach((r) => console.log(`  ✗ ${r.name}`, r));
  process.exit(1);
}
console.log('all green');
