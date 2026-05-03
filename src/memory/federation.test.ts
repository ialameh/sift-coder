import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { mkdtempSync, mkdirSync, writeFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import Database from 'better-sqlite3';
import { Storage, type DBHandle } from './storage/storage.js';
import { listConsentedWorkspaces, federatedSearch } from './federation.js';

let home: string;

async function mkWs(key: string, withConsent: boolean): Promise<string> {
  const wsRoot = join(home, '.siftcoder', 'workspaces', key);
  mkdirSync(wsRoot, { recursive: true });
  const dbPath = join(wsRoot, 'db.sqlite');
  const db = new Database(dbPath);
  const storage = new Storage(db);
  const eid = await storage.recordEvent({ ts: 1, sessionId: 's', tool: 'R', payload: {} });
  await storage.recordSummary({
    eventId: eid, ts: 0, model: 'm', promptHash: 'p',
    text: `summary in workspace ${key}`,
    tokensIn: null, tokensOut: null, confidence: null,
  });
  db.close();
  if (withConsent) writeFileSync(join(wsRoot, 'federate.consent'), '');
  return dbPath;
}

const factory = (path: string): DBHandle & { close(): void } => new Database(path) as unknown as DBHandle & { close(): void };

beforeEach(() => { home = mkdtempSync(join(tmpdir(), 'fed-')); });
afterEach(() => { rmSync(home, { recursive: true, force: true }); });

describe('listConsentedWorkspaces', () => {
  it('returns workspaces with a federate.consent flag', async () => {
    await mkWs('aaa1', true);
    await mkWs('bbb2', false);
    const out = listConsentedWorkspaces(home);
    expect(out.map(w => w.key)).toEqual(['aaa1']);
  });

  it('skips workspaces without a db.sqlite', () => {
    const wsRoot = join(home, '.siftcoder', 'workspaces', 'noDb');
    mkdirSync(wsRoot, { recursive: true });
    writeFileSync(join(wsRoot, 'federate.consent'), '');
    expect(listConsentedWorkspaces(home)).toEqual([]);
  });

  it('returns empty array when ~/.siftcoder/workspaces does not exist', () => {
    const empty = mkdtempSync(join(tmpdir(), 'fed-empty-'));
    try {
      expect(listConsentedWorkspaces(empty)).toEqual([]);
    } finally {
      rmSync(empty, { recursive: true, force: true });
    }
  });
});

describe('federatedSearch', () => {
  it('searches across all consented workspaces and merges results', async () => {
    await mkWs('aaa1', true);
    await mkWs('bbb2', true);
    const hits = await federatedSearch('summary', null, factory, { home, decayTauMs: 1e15, k: 5 });
    expect(hits.length).toBe(2);
    expect(new Set(hits.map(h => h.workspace))).toEqual(new Set(['aaa1', 'bbb2']));
  });

  it('omits non-consented workspaces from results', async () => {
    await mkWs('opt-in', true);
    await mkWs('opt-out', false);
    const hits = await federatedSearch('summary', null, factory, { home, decayTauMs: 1e15 });
    expect(hits.every(h => h.workspace === 'opt-in')).toBe(true);
  });

  it('respects workspacePrefix filtering', async () => {
    await mkWs('aaa1', true);
    await mkWs('bbb2', true);
    const hits = await federatedSearch('summary', null, factory, { home, workspacePrefix: 'aaa', decayTauMs: 1e15 });
    expect(hits.every(h => h.workspace.startsWith('aaa'))).toBe(true);
  });

  it('respects maxWorkspaces', async () => {
    await mkWs('w1', true);
    await mkWs('w2', true);
    await mkWs('w3', true);
    const hits = await federatedSearch('summary', null, factory, { home, maxWorkspaces: 1, decayTauMs: 1e15 });
    expect(new Set(hits.map(h => h.workspace)).size).toBe(1);
  });

  it('skips workspaces whose DB cannot be opened', async () => {
    await mkWs('ok', true);
    const wsRoot = join(home, '.siftcoder', 'workspaces', 'broken');
    mkdirSync(wsRoot, { recursive: true });
    writeFileSync(join(wsRoot, 'db.sqlite'), 'not a real database');
    writeFileSync(join(wsRoot, 'federate.consent'), '');
    const hits = await federatedSearch('summary', null, factory, { home, decayTauMs: 1e15 });
    expect(hits.every(h => h.workspace === 'ok')).toBe(true);
  });

  it('honors the global k limit after merging', async () => {
    for (let i = 0; i < 4; i++) await mkWs(`w${i}`, true);
    const hits = await federatedSearch('summary', null, factory, { home, k: 2, decayTauMs: 1e15 });
    expect(hits).toHaveLength(2);
  });

  it('returns empty array when no workspaces are consented', async () => {
    await mkWs('not-yet', false);
    const hits = await federatedSearch('summary', null, factory, { home });
    expect(hits).toEqual([]);
  });
});
