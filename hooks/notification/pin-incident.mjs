#!/usr/bin/env node
/**
 * SiftCoder Notification Hook - Incident Pin
 *
 * When Claude Code emits a notification (permission prompt, idle warning, error), capture it as
 * a high-priority memory frame so /handoff can recall it later. Light-weight: enqueue and exit.
 */

import { connect } from 'node:net';
import { existsSync } from 'node:fs';
import { homedir } from 'node:os';
import { join } from 'node:path';
import { workspaceKey } from '../lib/workspace.mjs';

const SIFTCODER_NS = process.env.SIFTCODER_NS || 'default';

const HOOK_BUDGET_MS = 250;

function encodeFrame(message) {
  const body = Buffer.from(JSON.stringify(message), 'utf8');
  const header = Buffer.alloc(4);
  header.writeUInt32BE(body.length, 0);
  return Buffer.concat([header, body]);
}

async function readStdin() {
  return new Promise(res => {
    let data = '';
    process.stdin.on('data', c => { data += c; });
    process.stdin.on('end', () => res(data));
    setTimeout(() => res(data), 100);
  });
}

async function send(sock, frame) {
  return new Promise(res => {
    const socket = connect(sock);
    let settled = false;
    const finish = () => { if (settled) return; settled = true; try { socket.end(); } catch {} res(); };
    const timer = setTimeout(finish, HOOK_BUDGET_MS);
    socket.on('error', () => { clearTimeout(timer); finish(); });
    socket.on('connect', () => socket.write(frame));
    socket.on('data', () => { clearTimeout(timer); finish(); });
    socket.on('end', () => { clearTimeout(timer); finish(); });
  });
}

async function main() {
  const cwd = process.env.CLAUDE_PROJECT_DIR || process.cwd();
  const sock = join(homedir(), '.siftcoder', SIFTCODER_NS, 'run', `${workspaceKey(cwd)}.sock`);
  if (!existsSync(sock)) process.exit(0);

  const raw = await readStdin();
  let env = {};
  try { env = raw ? JSON.parse(raw) : {}; } catch { env = {}; }

  const sessionId = env.session_id || 'unknown';
  const message = env.message || env.notification || env.text || 'notification';
  const frame = encodeFrame({
    kind: 'capture',
    sessionId,
    tool: 'Notification',
    payload: { message, kind: env.kind ?? null, urgency: 'high' },
    ts: Date.now(),
  });

  await send(sock, frame);
  process.exit(0);
}

main().catch(() => process.exit(0));
