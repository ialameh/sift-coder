#!/usr/bin/env node
// PreToolUse boundary enforcer.
// Reads scope file at .siftcoder/scope.json (project) or ~/.siftcoder/v3/scope.json (global).
// Blocks Write/Edit on paths outside listed allow-globs. Read is logged but allowed.
// Failure mode: any error → log to stderr, exit 0 (do NOT block on enforcer bugs).

import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';

const NS = process.env.SIFTCODER_NS || 'default';

function loadScope(projectDir) {
  const candidates = [
    path.join(projectDir, '.siftcoder', 'scope.json'),
    path.join(os.homedir(), '.siftcoder', NS, 'scope.json'),
  ];
  for (const p of candidates) {
    try {
      if (fs.existsSync(p)) return JSON.parse(fs.readFileSync(p, 'utf8'));
    } catch {
      // ignore
    }
  }
  return null;
}

function matchAny(globs, target) {
  for (const g of globs) {
    if (g === target) return true;
    if (g.endsWith('/**') && target.startsWith(g.slice(0, -3))) return true;
    if (g.startsWith('*.') && target.endsWith(g.slice(1))) return true;
  }
  return false;
}

let payload = '';
process.stdin.on('data', (c) => (payload += c));
process.stdin.on('end', () => {
  try {
    const evt = JSON.parse(payload || '{}');
    const tool = evt.tool_name;
    if (!['Write', 'Edit', 'NotebookEdit'].includes(tool)) {
      process.exit(0);
    }
    const file = evt.tool_input?.file_path || evt.tool_input?.notebook_path;
    if (!file) process.exit(0);

    const scope = loadScope(process.env.CLAUDE_PROJECT_DIR || process.cwd());
    if (!scope || !Array.isArray(scope.allow) || scope.allow.length === 0) {
      process.exit(0);
    }
    if (matchAny(scope.allow, file)) process.exit(0);
    if (Array.isArray(scope.deny) && matchAny(scope.deny, file)) {
      process.stderr.write(`[siftcoder] blocked write to denied path: ${file}\n`);
      process.exit(2);
    }

    process.stderr.write(`[siftcoder] write outside scope.allow: ${file}\n`);
    process.exit(2);
  } catch (e) {
    process.stderr.write(`[siftcoder] boundary-enforcer error: ${e?.message || e}\n`);
    process.exit(0);
  }
});
