#!/usr/bin/env node
// Stop hook: emits non-blocking hints — (1) pending drain count, and (2) session conventions
// worth folding into CLAUDE.md. Advisory only; never writes. Budget ~1.5s total across the two
// daemon calls (700ms each). Silent on missing daemon / timeout.

import net from 'node:net';
import path from 'node:path';
import os from 'node:os';
import { workspaceKey } from '../lib/workspace.mjs';
import { pickConventionLearnings } from '../lib/conventions.mjs';

const NS = process.env.SIFTCODER_NS || 'default';
const CALL_TIMEOUT_MS = 700;
const HINT_MIN = Number(process.env.SIFTCODER_CLAUDEMD_HINT_MIN || '2');

function socketPath() {
  const cwd = process.env.CLAUDE_PROJECT_DIR || process.cwd();
  return path.join(os.homedir(), '.siftcoder', NS, 'run', `${workspaceKey(cwd)}.sock`);
}

function ask(request) {
  return new Promise((resolve) => {
    const sock = socketPath();
    const c = net.createConnection(sock);
    const chunks = [];
    const timer = setTimeout(() => {
      c.destroy();
      resolve(null);
    }, CALL_TIMEOUT_MS);
    c.on('data', (d) => chunks.push(d));
    c.on('end', () => {
      clearTimeout(timer);
      try {
        const buf = Buffer.concat(chunks);
        if (buf.length < 4) return resolve(null);
        const len = buf.readUInt32BE(0);
        resolve(JSON.parse(buf.subarray(4, 4 + len).toString('utf8')));
      } catch {
        resolve(null);
      }
    });
    c.on('error', () => {
      clearTimeout(timer);
      resolve(null);
    });
    const payload = Buffer.from(JSON.stringify(request), 'utf8');
    const header = Buffer.alloc(4);
    header.writeUInt32BE(payload.length, 0);
    c.write(Buffer.concat([header, payload]));
    c.end();
  });
}

async function readStdin() {
  return new Promise((res) => {
    let data = '';
    process.stdin.on('data', (c) => {
      data += c;
    });
    process.stdin.on('end', () => res(data));
    setTimeout(() => res(data), 80);
  });
}

let envelope = {};
try {
  envelope = JSON.parse((await readStdin()) || '{}');
} catch {
  envelope = {};
}

// (1) Pending-drain hint.
const status = await ask({ kind: 'status' });
const pending = status?.ok ? status.data?.counts?.raw : null;
if (pending && pending > 0) {
  process.stdout.write(
    `[siftcoder] ${pending} memory events pending drain. Run /siftcoder:mem drain.\n`,
  );
}

// (2) CLAUDE.md convention hint — advisory, never writes. Heuristic marker + confidence floor
// over the session digest; the real fold-in (classification + diff) happens in /siftcoder:knowledge.
const sessionId = envelope.session_id;
if (sessionId) {
  const digest = await ask({ kind: 'session_digest', sessionId, limit: 50 });
  const text = digest?.ok ? digest.data?.text || '' : '';
  const learnings = pickConventionLearnings(text);
  if (learnings.length >= HINT_MIN) {
    process.stdout.write(
      `[siftcoder] ${learnings.length} convention learnings this session — run /siftcoder:knowledge to fold into CLAUDE.md.\n`,
    );
  }
}

process.exit(0);
