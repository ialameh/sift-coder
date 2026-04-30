/**
 * Cross-platform file utilities. Replaces V1 dist/utils/file-utils.js — keeps only what V3 services use.
 */

import fs from 'node:fs/promises';
import path from 'node:path';
import { minimatch } from 'minimatch';

export async function exists(p: string): Promise<boolean> {
  try {
    await fs.access(p);
    return true;
  } catch {
    return false;
  }
}

export async function readJSON<T = unknown>(p: string): Promise<T> {
  const raw = await fs.readFile(p, 'utf8');
  return JSON.parse(raw) as T;
}

export async function writeJSON(p: string, data: unknown): Promise<void> {
  const dir = path.dirname(p);
  await fs.mkdir(dir, { recursive: true });
  await fs.writeFile(p, JSON.stringify(data, null, 2), 'utf8');
}

export async function atomicWriteJSON(p: string, data: unknown): Promise<void> {
  const dir = path.dirname(p);
  await fs.mkdir(dir, { recursive: true });
  const tmp = `${p}.${process.pid}.tmp`;
  await fs.writeFile(tmp, JSON.stringify(data, null, 2), 'utf8');
  await fs.rename(tmp, p);
}

export function match(filePath: string, pattern: string): boolean {
  const norm = (s: string): string => s.replace(/\\/g, '/');
  return minimatch(norm(filePath), norm(pattern));
}

export async function ensureDir(p: string): Promise<void> {
  await fs.mkdir(p, { recursive: true });
}

export async function deleteFile(p: string): Promise<void> {
  try {
    await fs.unlink(p);
  } catch {
    // tolerate missing file
  }
}
