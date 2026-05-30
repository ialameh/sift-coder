#!/usr/bin/env node
/**
 * SiftCoder PostToolUse Hook - Observation Capture (memory v2)
 *
 * Sends a capture RPC to the per-workspace memory daemon over a Unix domain socket.
 * Fire-and-forget: any error is swallowed; the hook never blocks tool execution.
 */

import { connect } from 'node:net';
import { existsSync } from 'node:fs';
import { homedir } from 'node:os';
import { join } from 'node:path';
import { workspaceKey, gitToplevel } from '../lib/workspace.mjs';
import { loadIgnore, shouldCapturePath } from '../lib/ignore.mjs';

const SIFTCODER_NS = process.env.SIFTCODER_NS || 'default';

const HOOK_BUDGET_MS = 250;

function socketPath(cwd) {
  return join(homedir(), '.siftcoder', SIFTCODER_NS, 'run', `${workspaceKey(cwd)}.sock`);
}

function encodeFrame(message) {
  const body = Buffer.from(JSON.stringify(message), 'utf8');
  const header = Buffer.alloc(4);
  header.writeUInt32BE(body.length, 0);
  return Buffer.concat([header, body]);
}

async function readStdin() {
  return new Promise((res) => {
    let data = '';
    process.stdin.on('data', (chunk) => {
      data += chunk;
    });
    process.stdin.on('end', () => res(data));
    setTimeout(() => res(data), 100);
  });
}

async function send(sock, frame) {
  return new Promise((res) => {
    const socket = connect(sock);
    let settled = false;
    const finish = () => {
      if (settled) return;
      settled = true;
      try {
        socket.end();
      } catch {
        /* ignore */
      }
      res();
    };
    const timer = setTimeout(finish, HOOK_BUDGET_MS);
    socket.on('error', () => {
      clearTimeout(timer);
      finish();
    });
    socket.on('connect', () => {
      socket.write(frame);
    });
    socket.on('data', () => {
      clearTimeout(timer);
      finish();
    });
    socket.on('end', () => {
      clearTimeout(timer);
      finish();
    });
  });
}

async function main() {
  const RELEVANT = new Set(['Read', 'Write', 'Edit', 'Bash', 'Grep', 'Glob']);
  const cwd = process.env.CLAUDE_PROJECT_DIR || process.cwd();
  const sock = socketPath(cwd);
  if (!existsSync(sock)) process.exit(0);

  const raw = await readStdin();
  let envelope = {};
  try {
    envelope = raw ? JSON.parse(raw) : {};
  } catch {
    envelope = {};
  }

  const toolName = envelope.tool_name || process.argv[2] || process.env.TOOL_NAME || '';
  if (!RELEVANT.has(toolName)) process.exit(0);

  // Memory hygiene: drop captures for ignored paths (node_modules, dist, gitignored, …) so
  // retrieval quality does not degrade as the codebase grows. Opt out with
  // SIFTCODER_CAPTURE_IGNORE=0. Fail-open: any error falls through to capture.
  if (process.env.SIFTCODER_CAPTURE_IGNORE !== '0') {
    const ti = envelope.tool_input || {};
    const cand = ti.file_path || ti.path || ti.notebook_path;
    if (cand && typeof cand === 'string') {
      try {
        const root = gitToplevel(cwd) ?? cwd;
        const abs = cand.startsWith('/') ? cand : join(root, cand);
        if (!shouldCapturePath(abs, root, loadIgnore(root))) process.exit(0);
      } catch {
        /* fail open — capture */
      }
    }
  }

  const sessionId = envelope.session_id || 'unknown';
  const payload = {
    tool_input: envelope.tool_input ?? null,
    tool_response: envelope.tool_response ?? null,
  };

  const frame = encodeFrame({
    kind: 'capture',
    sessionId,
    tool: toolName,
    payload,
    ts: Date.now(),
  });

  await send(sock, frame);
  process.exit(0);
}

main().catch(() => process.exit(0));
