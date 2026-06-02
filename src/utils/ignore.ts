/**
 * Path-exclusion matcher for memory capture. Sources: hardcoded defaults ∪ .gitignore ∪
 * .claudeignore at the repo root. Keeps junk (node_modules, dist, generated, vendored) out of
 * the memory store so retrieval quality does not degrade as a codebase grows.
 *
 * The hook side has a dependency-free twin (hooks/lib/ignore.mjs); this TS version uses
 * minimatch and is the authoritative filter on the daemon (covers backfill + older hooks).
 */
import { minimatch } from 'minimatch';
import { relative, sep, isAbsolute } from 'node:path';

export const DEFAULT_IGNORES = [
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

export interface IgnoreSet {
  defaults: string[];
  gitignore: string[];
  claudeignore: string[];
}

/** Match a single gitignore-style pattern (already stripped of any leading `!`). */
function matches(rel: string, segs: string[], raw: string): boolean {
  let s = raw.trim();
  if (!s || s.startsWith('#')) return false;
  const anchored = s.startsWith('/');
  if (anchored) s = s.slice(1);
  const isDir = s.endsWith('/');
  if (isDir) s = s.slice(0, -1);
  if (!s) return false;

  // Bare name (no slash, no glob) → match any path segment (dir or file at any depth).
  if (!s.includes('/') && !s.includes('*') && !s.includes('?')) {
    return segs.includes(s);
  }

  const globs: string[] = [];
  if (anchored) {
    globs.push(s);
    if (isDir) globs.push(`${s}/**`);
  } else {
    globs.push(s, `**/${s}`);
    if (isDir) globs.push(`${s}/**`, `**/${s}/**`);
  }
  return globs.some((g) => minimatch(rel, g, { dot: true }));
}

export function isIgnored(absPath: string, root: string, set: IgnoreSet): boolean {
  const relRaw = relative(root, absPath);
  const rel = relRaw.split(sep).join('/');
  // outside root → not our concern. `isAbsolute(relRaw)` catches the Windows
  // cross-drive case where `relative()` returns an absolute path (no leading `..`).
  if (rel === '' || rel.startsWith('..') || isAbsolute(relRaw)) return false;
  const segs = rel.split('/');

  // Negations (leading `!`) win — a re-included path is always captured.
  const negations = [...set.gitignore, ...set.claudeignore]
    .filter((l) => l.trim().startsWith('!'))
    .map((l) => l.trim().slice(1));
  if (negations.some((p) => matches(rel, segs, p))) return false;

  const positives = [
    ...set.defaults,
    ...set.gitignore.filter((l) => !l.trim().startsWith('!')),
    ...set.claudeignore.filter((l) => !l.trim().startsWith('!')),
  ];
  return positives.some((p) => matches(rel, segs, p));
}
