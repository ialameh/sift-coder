// Dependency-free path-exclusion matcher for the capture hook. Sources: hardcoded defaults
// ∪ .gitignore ∪ .claudeignore at the repo root. The compiled set is cached on disk keyed by
// the ignore-file mtimes so the capture hook's tight time budget holds. Semantics mirror
// src/utils/ignore.ts (which uses minimatch); this twin reimplements a small glob subset so
// hooks stay dependency-free.
import { readFileSync, statSync, writeFileSync, mkdirSync } from 'node:fs';
import { relative, sep, join } from 'node:path';
import { homedir } from 'node:os';
import { createHash } from 'node:crypto';

const DEFAULTS = [
  'node_modules',
  'dist',
  'build',
  'out',
  '.git',
  'coverage',
  'target',
  '.next',
  'vendor',
  '.venv',
  '__pycache__',
  '*.lock',
  '*-lock.json',
  '*.min.*',
  '*.map',
];

function mtime(p) {
  try {
    return statSync(p).mtimeMs;
  } catch {
    return 0;
  }
}

function readLines(p) {
  try {
    return readFileSync(p, 'utf8')
      .split('\n')
      .map((l) => l.trim())
      .filter((l) => l && !l.startsWith('#'));
  } catch {
    return [];
  }
}

export function loadIgnore(root) {
  const ns = process.env.SIFTCODER_NS || 'default';
  const gi = join(root, '.gitignore');
  const ci = join(root, '.claudeignore');
  const stamp = `${mtime(gi)}:${mtime(ci)}`;
  const key = createHash('sha256').update(root).digest('hex').slice(0, 12);
  const cacheFile = join(homedir(), '.siftcoder', ns, `${key}.ignore.json`);
  try {
    const c = JSON.parse(readFileSync(cacheFile, 'utf8'));
    if (c.stamp === stamp) return c.set;
  } catch {
    /* rebuild below */
  }
  const set = { defaults: DEFAULTS, gitignore: readLines(gi), claudeignore: readLines(ci) };
  try {
    mkdirSync(join(cacheFile, '..'), { recursive: true });
    writeFileSync(cacheFile, JSON.stringify({ stamp, set }));
  } catch {
    /* cache is best-effort */
  }
  return set;
}

// Convert a glob (single segment or full path) to an anchored RegExp. Supports **, *, ?.
function toRegExp(glob) {
  let re = '';
  for (let i = 0; i < glob.length; i++) {
    const c = glob[i];
    if (c === '*') {
      if (glob[i + 1] === '*') {
        i++;
        if (glob[i + 1] === '/') {
          i++;
          re += '(?:.*/)?';
        } else {
          re += '.*';
        }
      } else {
        re += '[^/]*';
      }
    } else if (c === '?') {
      re += '[^/]';
    } else {
      re += c.replace(/[.+^${}()|[\]\\]/g, '\\$&');
    }
  }
  return new RegExp(`^${re}$`);
}

// Match a single gitignore-style pattern (already stripped of any leading `!`).
function matchOne(rel, segs, raw) {
  let s = raw.trim();
  if (!s || s.startsWith('#')) return false;
  const anchored = s.startsWith('/');
  if (anchored) s = s.slice(1);
  if (s.endsWith('/')) s = s.slice(0, -1);
  if (!s) return false;

  // bare name (no slash, no glob) → any path segment
  if (!s.includes('/') && !s.includes('*') && !s.includes('?')) return segs.includes(s);
  // basename glob (no slash, has glob) → any segment
  if (!s.includes('/')) {
    const re = toRegExp(s);
    return segs.some((seg) => re.test(seg));
  }
  // path glob (has slash)
  if (toRegExp(s).test(rel)) return true;
  if (!anchored && toRegExp(`**/${s}`).test(rel)) return true;
  return false;
}

export function shouldCapturePath(absPath, root, set) {
  const rel = relative(root, absPath).split(sep).join('/');
  if (rel.startsWith('..') || rel === '') return true; // outside root → never lose it
  const segs = rel.split('/');

  const negations = [...set.gitignore, ...set.claudeignore]
    .filter((l) => l.trim().startsWith('!'))
    .map((l) => l.trim().slice(1));
  if (negations.some((p) => matchOne(rel, segs, p))) return true;

  const positives = [
    ...set.defaults,
    ...set.gitignore.filter((l) => !l.trim().startsWith('!')),
    ...set.claudeignore.filter((l) => !l.trim().startsWith('!')),
  ];
  return !positives.some((p) => matchOne(rel, segs, p));
}
