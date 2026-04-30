#!/usr/bin/env node
// Opt-in: PostToolUse Write|Edit hook that creates lightweight checkpoint snapshots
// at threshold (every N edits or every M minutes).
//
// DISABLED BY DEFAULT. Enable via settings.json:
//   {"siftcoder": {"hooks": {"autoCheckpoint": {"enabled": true, "everyEdits": 25}}}}
//
// Failure mode: silent. Hook never blocks user work.

import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import crypto from 'node:crypto';
import { execFileSync } from 'node:child_process';

const NS = process.env.SIFTCODER_NS || 'v3';

function workspaceKey(cwd) {
  let root = cwd;
  try {
    root = execFileSync('git', ['-C', cwd, 'rev-parse', '--show-toplevel'], {
      stdio: ['ignore', 'pipe', 'ignore'],
    }).toString('utf8').trim() || cwd;
  } catch {
    root = cwd;
  }
  try {
    root = fs.realpathSync(root);
  } catch {
    root = path.resolve(root);
  }
  return crypto.createHash('sha256').update(root).digest('hex').slice(0, 12);
}

function loadSettings(projectDir) {
  const candidates = [
    path.join(projectDir, '.siftcoder', 'config.json'),
    path.join(os.homedir(), '.siftcoder', NS, 'config.json'),
  ];
  for (const p of candidates) {
    try {
      if (fs.existsSync(p)) {
        const cfg = JSON.parse(fs.readFileSync(p, 'utf8'));
        return cfg.siftcoder?.hooks?.autoCheckpoint;
      }
    } catch {
      // ignore
    }
  }
  return null;
}

function counterPath(projectDir) {
  const wsKey = workspaceKey(projectDir);
  return path.join(os.homedir(), '.siftcoder', NS, 'workspaces', wsKey, 'auto-checkpoint.json');
}

function readCounter(file) {
  try {
    if (fs.existsSync(file)) return JSON.parse(fs.readFileSync(file, 'utf8'));
  } catch {
    // tolerate
  }
  return { edits: 0, lastCheckpointAt: 0 };
}

function writeCounter(file, state) {
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, JSON.stringify(state), 'utf8');
}

function createCheckpoint(projectDir, reason) {
  // Use git stash w/o pop as a lightweight snapshot
  try {
    const sha = execFileSync('git', ['-C', projectDir, 'rev-parse', 'HEAD'], {
      stdio: ['ignore', 'pipe', 'ignore'],
    }).toString('utf8').trim();
    const ts = Date.now();
    const id = `cp-auto-${ts}`;
    const dir = path.join(projectDir, '.siftcoder', 'checkpoints');
    fs.mkdirSync(dir, { recursive: true });
    const cp = {
      id,
      name: `auto-${new Date(ts).toISOString()}`,
      reason,
      createdAt: new Date(ts).toISOString(),
      gitSha: sha,
      auto: true,
    };
    fs.writeFileSync(path.join(dir, `${id}.json`), JSON.stringify(cp, null, 2));
    return id;
  } catch {
    return null;
  }
}

let payload = '';
process.stdin.on('data', (c) => (payload += c));
process.stdin.on('end', () => {
  try {
    const projectDir = process.env.CLAUDE_PROJECT_DIR || process.cwd();
    const cfg = loadSettings(projectDir);
    if (!cfg?.enabled) process.exit(0);

    const everyEdits = cfg.everyEdits ?? 25;
    const everyMs = cfg.everyMs ?? 30 * 60 * 1000; // 30 min
    const file = counterPath(projectDir);
    const state = readCounter(file);
    state.edits++;

    const editTrigger = state.edits >= everyEdits;
    const timeTrigger = Date.now() - state.lastCheckpointAt >= everyMs && state.edits > 0;

    if (editTrigger || timeTrigger) {
      const id = createCheckpoint(projectDir, editTrigger ? 'edits-threshold' : 'time-threshold');
      if (id) {
        state.edits = 0;
        state.lastCheckpointAt = Date.now();
        process.stdout.write(`[siftcoder] auto-checkpoint ${id} created\n`);
      }
    }

    writeCounter(file, state);
  } catch (e) {
    process.stderr.write(`[siftcoder] auto-checkpoint error: ${e?.message || e}\n`);
  }
  process.exit(0);
});
