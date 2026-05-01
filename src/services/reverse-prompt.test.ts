import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import os from 'node:os';
import path from 'node:path';
import fs from 'node:fs/promises';
import {
  gatherQuickContext,
  gatherDeepContext,
  getCached,
  putCached,
  clearCache,
  withInflightDedup,
} from './reverse-prompt.js';

describe('reverse-prompt service', () => {
  let tmp: string;

  beforeEach(async () => {
    tmp = await fs.mkdtemp(path.join(os.tmpdir(), 'sc-rp-'));
    await fs.writeFile(path.join(tmp, 'package.json'), JSON.stringify({ name: 'demo', version: '0.0.1' }));
    await fs.writeFile(path.join(tmp, 'README.md'), '# demo\n\nA test project.');
    await fs.mkdir(path.join(tmp, 'src'), { recursive: true });
    await fs.writeFile(path.join(tmp, 'src/index.ts'), '');
  });

  afterEach(async () => {
    await fs.rm(tmp, { recursive: true, force: true });
  });

  it('gatherQuickContext finds manifest, readme, tree', () => {
    const ctx = gatherQuickContext(tmp);
    expect(ctx.manifest?.name).toBe('package.json');
    expect(ctx.readme).toContain('demo');
    expect(ctx.tree).toContain('src/');
    expect(ctx.repoId).toContain(path.basename(tmp));
  });

  it('gatherDeepContext includes deeper tree', () => {
    const ctx = gatherDeepContext(tmp);
    expect(ctx.deepTree).toContain('index.ts');
  });

  it('getCached returns null when absent', async () => {
    expect(await getCached('foo', tmp)).toBeNull();
  });

  it('putCached → getCached round-trips', async () => {
    await putCached({ focus: 'foo', mode: 'quick', prompt: 'build me X' }, tmp);
    const got = await getCached('foo', tmp);
    expect(got?.prompt).toBe('build me X');
    expect(got?.fingerprint).toHaveLength(8);
  });

  it('clearCache removes all entries', async () => {
    await putCached({ focus: 'a', mode: 'quick', prompt: 'p1' }, tmp);
    await putCached({ focus: 'b', mode: 'deep', prompt: 'p2' }, tmp);
    await clearCache(tmp);
    expect(await getCached('a', tmp)).toBeNull();
    expect(await getCached('b', tmp)).toBeNull();
  });

  it('withInflightDedup deduplicates parallel calls', async () => {
    let calls = 0;
    const gen = async (): Promise<string> => {
      calls++;
      await new Promise((r) => setTimeout(r, 10));
      return 'result';
    };
    const [a, b] = await Promise.all([
      withInflightDedup('focus', gen),
      withInflightDedup('focus', gen),
    ]);
    expect(a).toBe('result');
    expect(b).toBe('result');
    expect(calls).toBe(1);
  });

  it('different focus values run independently', async () => {
    let calls = 0;
    const gen = async (): Promise<string> => {
      calls++;
      return 'r';
    };
    await Promise.all([
      withInflightDedup('a', gen),
      withInflightDedup('b', gen),
    ]);
    expect(calls).toBe(2);
  });
});
