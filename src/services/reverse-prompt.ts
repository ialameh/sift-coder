/**
 * Reverse-prompt cache + context gathering. Replaces V1 reverse-prompt-service.js.
 * Generation is performed by the calling Claude session — this module provides
 * context-gathering primitives + cache CRUD.
 */

import fs from 'node:fs';
import fsp from 'node:fs/promises';
import path from 'node:path';
import { execSync } from 'node:child_process';
import { focusFingerprint, shortFingerprint } from '../utils/focus-fingerprint.js';
import { formatLocalTree } from '../utils/tree-formatter.js';

const CACHE_DIR_NAME = 'reverse-prompts';

const inflight = new Map<string, Promise<string>>();

export interface QuickContext {
  repoId: string;
  manifest: { name: string; content: string | null } | null;
  tree: string;
  readme: string | null;
}

export interface CacheEntry {
  fingerprint: string;
  focus: string;
  mode: 'quick' | 'deep' | 'focus';
  prompt: string;
  createdAt: string;
}

function cacheDir(projectRoot: string): string {
  return path.join(projectRoot, '.siftcoder', CACHE_DIR_NAME);
}

function safeRead(absPath: string, maxBytes = 64 * 1024): string | null {
  try {
    const stat = fs.statSync(absPath);
    if (!stat.isFile()) return null;
    const buf = fs.readFileSync(absPath, 'utf8');
    return buf.length > maxBytes ? buf.slice(0, maxBytes) + '\n…[truncated]' : buf;
  } catch {
    return null;
  }
}

function detectRepoId(projectRoot: string): string {
  try {
    const remote = execSync('git config --get remote.origin.url', {
      cwd: projectRoot,
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'ignore'],
    }).trim();
    const m = remote.match(/[:/]([^/:]+)\/([^/]+?)(?:\.git)?$/);
    if (m) return `${m[1]}/${m[2]}`;
  } catch {
    // not a git repo
  }
  return `local:${path.basename(path.resolve(projectRoot))}`;
}

function findManifest(projectRoot: string): { name: string; content: string | null } | null {
  const candidates = [
    'package.json', 'pyproject.toml', 'Cargo.toml', 'go.mod',
    'pom.xml', 'build.gradle', 'composer.json', 'Gemfile',
    'sfdx-project.json',
  ];
  for (const name of candidates) {
    const p = path.join(projectRoot, name);
    if (fs.existsSync(p)) return { name, content: safeRead(p) };
  }
  return null;
}

function findReadme(projectRoot: string): string | null {
  const candidates = ['README.md', 'README.MD', 'readme.md', 'README', 'README.rst', 'README.txt'];
  for (const name of candidates) {
    const p = path.join(projectRoot, name);
    if (fs.existsSync(p)) return safeRead(p, 32 * 1024);
  }
  return null;
}

export function gatherQuickContext(projectRoot: string = process.cwd()): QuickContext {
  return {
    repoId: detectRepoId(projectRoot),
    manifest: findManifest(projectRoot),
    tree: formatLocalTree(projectRoot, { depth: 2, maxEntries: 200 }),
    readme: findReadme(projectRoot),
  };
}

export function gatherDeepContext(projectRoot: string = process.cwd()): QuickContext & { deepTree: string } {
  return {
    ...gatherQuickContext(projectRoot),
    deepTree: formatLocalTree(projectRoot, { depth: 5, maxEntries: 1000 }),
  };
}

export async function getCached(focus: string, projectRoot: string = process.cwd()): Promise<CacheEntry | null> {
  const fp = shortFingerprint(focus);
  const file = path.join(cacheDir(projectRoot), `${fp}.json`);
  try {
    const raw = await fsp.readFile(file, 'utf8');
    return JSON.parse(raw) as CacheEntry;
  } catch {
    return null;
  }
}

export async function putCached(entry: Omit<CacheEntry, 'createdAt' | 'fingerprint'>, projectRoot: string = process.cwd()): Promise<CacheEntry> {
  const fp = shortFingerprint(entry.focus);
  const full: CacheEntry = { ...entry, fingerprint: fp, createdAt: new Date().toISOString() };
  const dir = cacheDir(projectRoot);
  await fsp.mkdir(dir, { recursive: true });
  await fsp.writeFile(path.join(dir, `${fp}.json`), JSON.stringify(full, null, 2), 'utf8');
  return full;
}

export async function clearCache(projectRoot: string = process.cwd()): Promise<void> {
  const dir = cacheDir(projectRoot);
  try {
    await fsp.rm(dir, { recursive: true, force: true });
  } catch {
    // tolerate missing
  }
}

/**
 * In-flight dedup. If two callers generate the same prompt simultaneously,
 * only one runs; the other awaits the same promise.
 */
export async function withInflightDedup<T extends string>(
  focus: string,
  generate: () => Promise<T>,
): Promise<T> {
  const key = focusFingerprint(focus);
  const existing = inflight.get(key);
  if (existing) return existing as Promise<T>;
  const p = generate().finally(() => inflight.delete(key));
  inflight.set(key, p);
  return p;
}
