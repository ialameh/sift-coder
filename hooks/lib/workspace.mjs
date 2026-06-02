// Single source of truth for hook-side workspace identity. Mirrors src/memory/workspace.ts.
// Kept dependency-free and fast — runs inside hooks with tight time budgets.
import { createHash } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { realpathSync, readFileSync } from 'node:fs';
import { join, resolve } from 'node:path';

export function gitToplevel(cwd) {
  try {
    const out = execFileSync('git', ['-C', cwd, 'rev-parse', '--show-toplevel'], {
      stdio: ['ignore', 'pipe', 'ignore'],
    });
    return out.toString('utf8').trim() || null;
  } catch {
    return null;
  }
}

// Optional sub-workspace partition: SIFTCODER_SUBSPACE env, else first line of
// <top>/.siftcoder/subspace. Lets a monorepo scope memory per service. Default: none.
function subspaceFor(top) {
  const env = process.env.SIFTCODER_SUBSPACE;
  if (env && env.trim()) return env.trim();
  try {
    const v = readFileSync(join(top, '.siftcoder', 'subspace'), 'utf8')
      .split('\n')[0]
      .trim();
    return v || null;
  } catch {
    return null;
  }
}

export function workspaceKey(cwd) {
  const top = gitToplevel(cwd) ?? cwd;
  let real;
  try {
    real = realpathSync(top);
  } catch {
    real = resolve(top);
  }
  const sub = subspaceFor(real);
  const seed = sub ? `${real}:${sub}` : real;
  return createHash('sha256').update(seed).digest('hex').slice(0, 12);
}
