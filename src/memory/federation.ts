/**
 * Cross-workspace federation for SiftCoder Memory.
 *
 * Walks ~/.siftcoder/workspaces/ and queries each workspace's SQLite store directly. Only includes
 * workspaces that have explicitly opted in by creating an empty `federate.consent` file in their
 * root.
 *
 * Privacy-by-consent: per-workspace flag, no implicit cross-share, no network. The current process
 * reads the consent-marked DBs read-only.
 *
 * Hits are tagged with the originating workspace key so downstream rendering can show provenance
 * (e.g. "[work/a1b2c3] handled the same migration last week").
 */
import { existsSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { homedir } from 'node:os';
import { hybridSearch, type HybridHit, type HybridOptions } from './retrieval.js';
import { Storage, type DBHandle } from './storage/storage.js';
import type { Embedder } from './embedder.js';

export interface FederatedHit extends HybridHit {
  workspace: string;
}

export interface FederationOptions extends HybridOptions {
  home?: string;
  /** Filter — only query workspaces whose key starts with this prefix. */
  workspacePrefix?: string;
  /** Maximum number of workspaces to query. */
  maxWorkspaces?: number;
}

const CONSENT_FILE = 'federate.consent';

export interface WorkspaceEntry {
  key: string;
  root: string;
  db: string;
}

export function listConsentedWorkspaces(home: string = homedir()): WorkspaceEntry[] {
  const root = join(home, '.siftcoder', 'workspaces');
  if (!existsSync(root)) return [];
  const out: WorkspaceEntry[] = [];
  for (const key of readdirSync(root)) {
    const wsRoot = join(root, key);
    if (!existsSync(join(wsRoot, CONSENT_FILE))) continue;
    if (!existsSync(join(wsRoot, 'db.sqlite'))) continue;
    out.push({ key, root: wsRoot, db: join(wsRoot, 'db.sqlite') });
  }
  return out;
}

export interface DatabaseFactory {
  (path: string): DBHandle & { close?(): void };
}

export async function federatedSearch(
  query: string,
  embedder: Embedder | null,
  factory: DatabaseFactory,
  opts: FederationOptions = {}
): Promise<FederatedHit[]> {
  /* c8 ignore next -- homedir() default exercised in real runs; tests always pass an explicit home */
  const home = opts.home ?? homedir();
  const all = listConsentedWorkspaces(home);
  let workspaces = all;
  if (opts.workspacePrefix) {
    workspaces = workspaces.filter(w => w.key.startsWith(opts.workspacePrefix!));
  }
  if (opts.maxWorkspaces && workspaces.length > opts.maxWorkspaces) {
    workspaces = workspaces.slice(0, opts.maxWorkspaces);
  }

  const k = opts.k ?? 5;
  const results: FederatedHit[] = [];
  for (const ws of workspaces) {
    let db: ReturnType<DatabaseFactory> | null = null;
    try {
      db = factory(ws.db);
      const storage = new Storage(db);
      const hits = await hybridSearch(storage, embedder, query, Date.now(), { ...opts, k: k * 2 });
      for (const h of hits) results.push({ ...h, workspace: ws.key });
    } catch {
      /* skip unreadable workspace */
    } finally {
      try { db?.close?.(); } catch { /* ignore */ }
    }
  }

  results.sort((a, b) => b.score - a.score);
  return results.slice(0, k);
}
