import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import os from 'node:os';
import path from 'node:path';
import fs from 'node:fs/promises';
import { StateManager } from './state.js';

describe('StateManager', () => {
  let tmp: string;
  let sm: StateManager;

  beforeEach(async () => {
    tmp = await fs.mkdtemp(path.join(os.tmpdir(), 'sc-state-'));
    sm = new StateManager(tmp);
  });

  afterEach(async () => {
    await fs.rm(tmp, { recursive: true, force: true });
  });

  it('loadScope returns null when absent', async () => {
    expect(await sm.loadScope()).toBeNull();
  });

  it('save → load round-trips scope', async () => {
    await sm.saveScope({ allow: ['src/**'], deny: ['src/secrets/**'] });
    const got = await sm.loadScope();
    expect(got).toEqual({ allow: ['src/**'], deny: ['src/secrets/**'] });
  });

  it('clearScope removes file', async () => {
    await sm.saveScope({ allow: ['*'], deny: [] });
    await sm.clearScope();
    expect(await sm.loadScope()).toBeNull();
  });

  it('listCheckpoints returns empty when no dir', async () => {
    expect(await sm.listCheckpoints()).toEqual([]);
  });

  it('saveCheckpoint → getCheckpoint round-trips', async () => {
    const saved = await sm.saveCheckpoint({ name: 'pre-refactor', description: 'before X' });
    expect(saved.id).toMatch(/^cp-\d+$/);
    const got = await sm.getCheckpoint(saved.id);
    expect(got?.name).toBe('pre-refactor');
  });

  it('listCheckpoints sorts newest first', async () => {
    await sm.saveCheckpoint({ name: 'a' });
    await new Promise((r) => setTimeout(r, 5));
    await sm.saveCheckpoint({ name: 'b' });
    const list = await sm.listCheckpoints();
    expect(list[0]?.name).toBe('b');
    expect(list[1]?.name).toBe('a');
  });

  it('deleteCheckpoint returns true on hit, false on miss', async () => {
    const cp = await sm.saveCheckpoint({ name: 'x' });
    expect(await sm.deleteCheckpoint(cp.id)).toBe(true);
    expect(await sm.deleteCheckpoint(cp.id)).toBe(false);
  });
});
