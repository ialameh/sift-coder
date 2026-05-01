#!/usr/bin/env node
/**
 * SiftCoder PreCompact Hook - Memory Injection
 *
 * Before the harness compacts the transcript, surface the top-k most relevant memories
 * based on the recent transcript tail. Output is appended to additional_context so the
 * compacted summary preserves the load-bearing facts.
 */

import { connect } from 'node:net';
import { createHash } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { existsSync, realpathSync, readFileSync } from 'node:fs';
import { homedir } from 'node:os';
import { join, resolve } from 'node:path';

const SIFTCODER_NS = process.env.SIFTCODER_NS || 'v3';

const HOOK_BUDGET_MS = 1500;
const TRANSCRIPT_TAIL_BYTES = 16 * 1024;
const TOP_K = 8;

function gitToplevel(cwd) {
  try {
    return execFileSync('git', ['-C', cwd, 'rev-parse', '--show-toplevel'], { stdio: ['ignore', 'pipe', 'ignore'] })
      .toString('utf8').trim() || null;
  } catch { return null; }
}

function workspaceKey(cwd) {
  const top = gitToplevel(cwd) ?? cwd;
  let real;
  try { real = realpathSync(top); } catch { real = resolve(top); }
  return createHash('sha256').update(real).digest('hex').slice(0, 12);
}

function encodeFrame(message) {
  const body = Buffer.from(JSON.stringify(message), 'utf8');
  const header = Buffer.alloc(4);
  header.writeUInt32BE(body.length, 0);
  return Buffer.concat([header, body]);
}

function decodeOne(buf) {
  if (buf.length < 4) return null;
  const len = buf.readUInt32BE(0);
  if (buf.length < 4 + len) return null;
  return JSON.parse(buf.subarray(4, 4 + len).toString('utf8'));
}

async function readStdin() {
  return new Promise(res => {
    let data = '';
    process.stdin.on('data', c => { data += c; });
    process.stdin.on('end', () => res(data));
    setTimeout(() => res(data), 200);
  });
}

async function send(sock, frame) {
  return new Promise(res => {
    const socket = connect(sock);
    let buf = Buffer.alloc(0);
    let settled = false;
    const finish = (v) => { if (settled) return; settled = true; try { socket.end(); } catch {} res(v); };
    const timer = setTimeout(() => finish(null), HOOK_BUDGET_MS);
    socket.on('error', () => { clearTimeout(timer); finish(null); });
    socket.on('connect', () => socket.write(frame));
    socket.on('data', c => {
      buf = Buffer.concat([buf, c]);
      const r = decodeOne(buf);
      if (r) { clearTimeout(timer); finish(r); }
    });
    socket.on('end', () => { clearTimeout(timer); finish(null); });
  });
}

function transcriptTail(path) {
  try {
    const content = readFileSync(path, 'utf8');
    return content.slice(-TRANSCRIPT_TAIL_BYTES);
  } catch { return ''; }
}

function extractKeywords(text) {
  const tokens = (text.toLowerCase().match(/[a-z][a-z0-9_-]{3,}/g) ?? []);
  const stop = new Set(['this','that','with','from','have','were','they','their','about','will','would','could','should','what','when','which','your','user','yourself','assistant']);
  const counts = new Map();
  for (const t of tokens) if (!stop.has(t)) counts.set(t, (counts.get(t) ?? 0) + 1);
  return [...counts.entries()].sort((a, b) => b[1] - a[1]).slice(0, 12).map(([w]) => w).join(' ');
}

async function main() {
  const cwd = process.env.CLAUDE_PROJECT_DIR || process.cwd();
  const sock = join(homedir(), '.siftcoder', SIFTCODER_NS, 'run', `${workspaceKey(cwd)}.sock`);
  if (!existsSync(sock)) process.exit(0);

  const raw = await readStdin();
  let env = {};
  try { env = raw ? JSON.parse(raw) : {}; } catch { env = {}; }

  const tail = env.transcript_path ? transcriptTail(env.transcript_path) : '';
  const query = extractKeywords(tail);
  if (!query) process.exit(0);

  const frame = encodeFrame({ kind: 'search', query, k: TOP_K });
  const res = await send(sock, frame);
  if (!res || !res.ok || !res.data?.hits?.length) process.exit(0);

  const lines = res.data.hits.map((h, i) => `${i + 1}. [#${h.id}] ${h.text}`);
  const output = {
    hookSpecificOutput: {
      hookEventName: 'PreCompact',
      additionalContext: `<siftcoder-memory>\nRecent relevant memories preserved across compaction:\n${lines.join('\n')}\n</siftcoder-memory>`,
    },
  };
  process.stdout.write(JSON.stringify(output));
  process.exit(0);
}

main().catch(() => process.exit(0));
