import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import os from 'node:os';
import path from 'node:path';
import fs from 'node:fs/promises';
import * as file from './file.js';

describe('file utils', () => {
  let tmp: string;

  beforeEach(async () => {
    tmp = await fs.mkdtemp(path.join(os.tmpdir(), 'sc-file-'));
  });

  afterEach(async () => {
    await fs.rm(tmp, { recursive: true, force: true });
  });

  it('exists / writeJSON / readJSON round-trip', async () => {
    const p = path.join(tmp, 'a/b/c.json');
    expect(await file.exists(p)).toBe(false);
    await file.writeJSON(p, { x: 1, y: 'hello' });
    expect(await file.exists(p)).toBe(true);
    expect(await file.readJSON<{ x: number; y: string }>(p)).toEqual({ x: 1, y: 'hello' });
  });

  it('atomicWriteJSON does not leave tmp file on success', async () => {
    const p = path.join(tmp, 'atomic.json');
    await file.atomicWriteJSON(p, { ok: true });
    const dir = await fs.readdir(tmp);
    expect(dir).toEqual(['atomic.json']);
    expect(await file.readJSON(p)).toEqual({ ok: true });
  });

  it('match handles unix and windows-style paths', () => {
    expect(file.match('src/foo.ts', 'src/**')).toBe(true);
    expect(file.match('src\\foo.ts', 'src/**')).toBe(true);
    expect(file.match('src/foo.ts', '*.ts')).toBe(false);
    expect(file.match('foo.ts', '*.ts')).toBe(true);
  });

  it('ensureDir is idempotent', async () => {
    const p = path.join(tmp, 'x/y/z');
    await file.ensureDir(p);
    await file.ensureDir(p);
    expect(await file.exists(p)).toBe(true);
  });

  it('deleteFile tolerates missing file', async () => {
    await expect(file.deleteFile(path.join(tmp, 'nope.json'))).resolves.toBeUndefined();
  });
});
