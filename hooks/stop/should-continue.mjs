#!/usr/bin/env node
// Stop hook: queries memory daemon for pending drain count, emits a one-line hint.
// Non-blocking; budget 1.5s.

import net from 'node:net';
import path from 'node:path';
import os from 'node:os';
import { workspaceKey } from '../lib/workspace.mjs';

const NS = process.env.SIFTCODER_NS || 'default';
const BUDGET_MS = 1500;

function socketPath() {
  const cwd = process.env.CLAUDE_PROJECT_DIR || process.cwd();
  return path.join(os.homedir(), '.siftcoder', NS, 'run', `${workspaceKey(cwd)}.sock`);
}

function ask() {
  return new Promise((resolve) => {
    const sock = socketPath();
    const c = net.createConnection(sock);
    const chunks = [];
    const timer = setTimeout(() => {
      c.destroy();
      resolve(null);
    }, BUDGET_MS);
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
    const payload = Buffer.from(JSON.stringify({ kind: 'status' }), 'utf8');
    const header = Buffer.alloc(4);
    header.writeUInt32BE(payload.length, 0);
    c.write(Buffer.concat([header, payload]));
    c.end();
  });
}

const r = await ask();
const pending = r?.ok ? r.data?.counts?.raw : null;
if (pending && pending > 0) {
  process.stdout.write(`[siftcoder] ${pending} memory events pending drain. Run /siftcoder:mem drain.\n`);
}
process.exit(0);
