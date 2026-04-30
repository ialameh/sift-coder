#!/usr/bin/env node
// Memory daemon health monitor.
// Pings UDS socket every 30s, writes JSON line to ~/.siftcoder/v3/health.ndjson.

import net from 'node:net';
import path from 'node:path';
import os from 'node:os';
import fs from 'node:fs';
import crypto from 'node:crypto';

const NS = process.env.SIFTCODER_NS || 'v3';
const INTERVAL_MS = 30_000;

function key() {
  const root = process.env.CLAUDE_PROJECT_DIR || process.cwd();
  return crypto.createHash('sha1').update(root).digest('hex').slice(0, 12);
}

function paths() {
  const base = path.join(os.homedir(), '.siftcoder', NS);
  return { base, sock: path.join(base, 'run', `${key()}.sock`), log: path.join(base, 'health.ndjson') };
}

function ping() {
  return new Promise((resolve) => {
    const t0 = Date.now();
    const { sock } = paths();
    const c = net.createConnection(sock);
    let body = '';
    const t = setTimeout(() => {
      c.destroy();
      resolve({ ok: false, latencyMs: Date.now() - t0, error: 'timeout' });
    }, 1500);
    c.on('data', (d) => (body += d));
    c.on('end', () => {
      clearTimeout(t);
      resolve({ ok: true, latencyMs: Date.now() - t0, body: body.slice(0, 200) });
    });
    c.on('error', (e) => {
      clearTimeout(t);
      resolve({ ok: false, latencyMs: Date.now() - t0, error: e.message });
    });
    c.write(JSON.stringify({ op: 'ping' }));
    c.end();
  });
}

async function tick() {
  const r = await ping();
  const { base, log } = paths();
  fs.mkdirSync(base, { recursive: true });
  fs.appendFileSync(log, JSON.stringify({ ts: new Date().toISOString(), ...r }) + '\n');
}

await tick();
setInterval(tick, INTERVAL_MS);
