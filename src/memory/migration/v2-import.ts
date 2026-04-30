/**
 * V1/V2 → V3 memory backfill.
 *
 * Reads V1 sqlite DBs at ~/.siftcoder/workspaces/<key>/memory.db and copies events,
 * summaries, embeddings, provenance edges into V3's ~/.siftcoder/v3/workspaces/<key>/memory.db.
 *
 * V1 and V3 share the same schema (V3 inherited it intact), so this is a row-copy with
 * id remapping. Each migrated row gets meta_json or source flag indicating origin.
 */

import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { createRequire } from 'node:module';
import { CORE_DDL, MIGRATIONS } from '../storage/schema.js';

const require = createRequire(import.meta.url);

export interface BackfillOptions {
  v1Root?: string;          // default: ~/.siftcoder
  v3Ns?: string;            // default: 'v3'
  workspaceKey?: string;    // limit to one workspace
  dryRun?: boolean;         // count without writing
}

export interface BackfillWorkspaceResult {
  workspaceKey: string;
  events: number;
  summaries: number;
  embeddings: number;
  edges: number;
  sessions: number;
  skipped: { events: number; summaries: number };
}

export interface BackfillResult {
  v1Root: string;
  v3Ns: string;
  dryRun: boolean;
  workspaces: BackfillWorkspaceResult[];
  totals: {
    events: number;
    summaries: number;
    embeddings: number;
    edges: number;
    sessions: number;
  };
  errors: Array<{ workspace?: string; message: string }>;
}

interface BetterSqliteDb {
  prepare(sql: string): {
    all(...params: unknown[]): unknown[];
    get(...params: unknown[]): unknown;
    run(...params: unknown[]): { lastInsertRowid: number | bigint; changes: number };
  };
  exec(sql: string): void;
  close(): void;
  transaction<T>(fn: () => T): () => T;
}

function openDb(file: string, readonly: boolean): BetterSqliteDb {
  const Database = require('better-sqlite3') as new (
    file: string,
    opts?: { readonly?: boolean; fileMustExist?: boolean },
  ) => BetterSqliteDb;
  return new Database(file, readonly ? { readonly: true, fileMustExist: true } : {});
}

function listV1Workspaces(v1Root: string): string[] {
  const dir = path.join(v1Root, 'workspaces');
  if (!fs.existsSync(dir)) return [];
  return fs
    .readdirSync(dir)
    .filter((name) => fs.existsSync(path.join(dir, name, 'memory.db')));
}

function v1DbPath(v1Root: string, key: string): string {
  return path.join(v1Root, 'workspaces', key, 'memory.db');
}

function v3DbPath(v3Ns: string, key: string): string {
  return path.join(os.homedir(), '.siftcoder', v3Ns, 'workspaces', key, 'memory.db');
}

interface SessionRow {
  id: string;
  started_at: number;
  ended_at: number | null;
  cwd: string | null;
  meta_json: string | null;
}

interface V1EventRow {
  id: number;
  ts: number;
  session_id: string;
  tool: string;
  input_hash: string;
  payload_json: string;
  status: string;
  tokens_est: number;
}

interface V1SummaryRow {
  id: number;
  event_id: number;
  ts: number;
  model: string;
  prompt_hash: string;
  text: string;
  tokens_in: number | null;
  tokens_out: number | null;
  confidence: number | null;
}

interface V1EdgeRow {
  id: number;
  ts: number;
  from_kind: string;
  from_id: string;
  to_kind: string;
  to_id: string;
  edge_type: string;
  confidence: number;
  source: string;
  meta_json: string | null;
}

interface V1EmbeddingRow {
  summary_id: number;
  dim: number;
  vec: Buffer;
}

function migrateWorkspace(
  v1Path: string,
  v3Path: string,
  dryRun: boolean,
): BackfillWorkspaceResult {
  const result: BackfillWorkspaceResult = {
    workspaceKey: path.basename(path.dirname(v3Path)),
    events: 0,
    summaries: 0,
    embeddings: 0,
    edges: 0,
    sessions: 0,
    skipped: { events: 0, summaries: 0 },
  };

  const v1 = openDb(v1Path, true);

  let v3: BetterSqliteDb | null = null;
  if (!dryRun) {
    fs.mkdirSync(path.dirname(v3Path), { recursive: true });
    v3 = openDb(v3Path, false);
    v3.exec(CORE_DDL);
    for (const stmt of MIGRATIONS) {
      try {
        v3.exec(stmt);
      } catch {
        // already applied
      }
    }
  }

  try {
    const sessions = v1
      .prepare('SELECT id, started_at, ended_at, cwd, meta_json FROM sessions')
      .all() as SessionRow[];
    const events = v1
      .prepare(
        'SELECT id, ts, session_id, tool, input_hash, payload_json, status, COALESCE(tokens_est, 0) AS tokens_est FROM events ORDER BY id ASC',
      )
      .all() as V1EventRow[];
    const summaries = v1
      .prepare(
        'SELECT id, event_id, ts, model, prompt_hash, text, tokens_in, tokens_out, confidence FROM summaries ORDER BY id ASC',
      )
      .all() as V1SummaryRow[];
    const edges = v1
      .prepare(
        'SELECT id, ts, from_kind, from_id, to_kind, to_id, edge_type, confidence, source, meta_json FROM provenance_edges',
      )
      .all() as V1EdgeRow[];
    const embeddings = v1
      .prepare('SELECT summary_id, dim, vec FROM summary_embeddings')
      .all() as V1EmbeddingRow[];

    if (dryRun) {
      return {
        ...result,
        sessions: sessions.length,
        events: events.length,
        summaries: summaries.length,
        edges: edges.length,
        embeddings: embeddings.length,
      };
    }

    if (!v3) throw new Error('v3 db not opened');

    const eventIdMap = new Map<number, number>();
    const summaryIdMap = new Map<number, number>();

    const insertSession = v3.prepare(
      'INSERT OR IGNORE INTO sessions (id, started_at, ended_at, cwd, meta_json) VALUES (?, ?, ?, ?, ?)',
    );
    const insertEvent = v3.prepare(
      "INSERT INTO events (ts, session_id, tool, input_hash, payload_json, status, tokens_est) VALUES (?, ?, ?, ?, ?, ?, ?)",
    );
    const checkEventDupe = v3.prepare(
      'SELECT id FROM events WHERE ts = ? AND session_id = ? AND tool = ? AND input_hash = ?',
    );
    const insertSummary = v3.prepare(
      'INSERT INTO summaries (event_id, ts, model, prompt_hash, text, tokens_in, tokens_out, confidence) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
    );
    const checkSummaryDupe = v3.prepare(
      'SELECT id FROM summaries WHERE event_id = ? AND model = ? AND prompt_hash = ?',
    );
    const insertEdge = v3.prepare(
      "INSERT INTO provenance_edges (ts, from_kind, from_id, to_kind, to_id, edge_type, confidence, source, meta_json) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)",
    );
    const insertEmbedding = v3.prepare(
      'INSERT OR REPLACE INTO summary_embeddings (summary_id, dim, vec) VALUES (?, ?, ?)',
    );

    const tx = v3.transaction(() => {
      for (const s of sessions) {
        insertSession.run(s.id, s.started_at, s.ended_at, s.cwd, s.meta_json);
        result.sessions++;
      }

      for (const e of events) {
        const dupe = checkEventDupe.get(e.ts, e.session_id, e.tool, e.input_hash) as
          | { id: number }
          | undefined;
        if (dupe) {
          eventIdMap.set(e.id, dupe.id);
          result.skipped.events++;
          continue;
        }
        const r = insertEvent.run(
          e.ts,
          e.session_id,
          e.tool,
          e.input_hash,
          e.payload_json,
          e.status,
          e.tokens_est,
        );
        eventIdMap.set(e.id, Number(r.lastInsertRowid));
        result.events++;
      }

      for (const s of summaries) {
        const newEventId = eventIdMap.get(s.event_id);
        if (!newEventId) continue;
        const dupe = checkSummaryDupe.get(newEventId, s.model, s.prompt_hash) as
          | { id: number }
          | undefined;
        if (dupe) {
          summaryIdMap.set(s.id, dupe.id);
          result.skipped.summaries++;
          continue;
        }
        const r = insertSummary.run(
          newEventId,
          s.ts,
          s.model,
          s.prompt_hash,
          s.text,
          s.tokens_in,
          s.tokens_out,
          s.confidence,
        );
        summaryIdMap.set(s.id, Number(r.lastInsertRowid));
        result.summaries++;
      }

      for (const emb of embeddings) {
        const newSummaryId = summaryIdMap.get(emb.summary_id);
        if (!newSummaryId) continue;
        insertEmbedding.run(newSummaryId, emb.dim, emb.vec);
        result.embeddings++;
      }

      for (const edge of edges) {
        const remap = (kind: string, id: string): string => {
          if (kind === 'event') {
            const n = parseInt(id, 10);
            const mapped = eventIdMap.get(n);
            return mapped ? String(mapped) : id;
          }
          if (kind === 'summary') {
            const n = parseInt(id, 10);
            const mapped = summaryIdMap.get(n);
            return mapped ? String(mapped) : id;
          }
          return id;
        };
        const meta = edge.meta_json ? edge.meta_json : null;
        const taggedMeta = meta
          ? JSON.stringify({ ...JSON.parse(meta), migrated_from: 'v2' })
          : JSON.stringify({ migrated_from: 'v2' });
        insertEdge.run(
          edge.ts,
          edge.from_kind,
          remap(edge.from_kind, edge.from_id),
          edge.to_kind,
          remap(edge.to_kind, edge.to_id),
          edge.edge_type,
          edge.confidence,
          edge.source,
          taggedMeta,
        );
        result.edges++;
      }
    });
    tx();
  } finally {
    v1.close();
    v3?.close();
  }

  return result;
}

export async function backfillFromV2(
  opts: BackfillOptions = {},
): Promise<BackfillResult> {
  const v1Root = opts.v1Root ?? path.join(os.homedir(), '.siftcoder');
  const v3Ns = opts.v3Ns ?? 'v3';
  const dryRun = opts.dryRun ?? false;

  const result: BackfillResult = {
    v1Root,
    v3Ns,
    dryRun,
    workspaces: [],
    totals: { events: 0, summaries: 0, embeddings: 0, edges: 0, sessions: 0 },
    errors: [],
  };

  if (!fs.existsSync(v1Root)) {
    result.errors.push({ message: `V1/V2 root not found: ${v1Root}` });
    return result;
  }

  const keys = opts.workspaceKey ? [opts.workspaceKey] : listV1Workspaces(v1Root);
  if (keys.length === 0) {
    result.errors.push({ message: `No V1 workspaces found at ${v1Root}/workspaces` });
    return result;
  }

  for (const key of keys) {
    try {
      const v1 = v1DbPath(v1Root, key);
      const v3 = v3DbPath(v3Ns, key);
      const ws = migrateWorkspace(v1, v3, dryRun);
      result.workspaces.push(ws);
      result.totals.events += ws.events;
      result.totals.summaries += ws.summaries;
      result.totals.embeddings += ws.embeddings;
      result.totals.edges += ws.edges;
      result.totals.sessions += ws.sessions;
    } catch (e) {
      result.errors.push({ workspace: key, message: (e as Error).message });
    }
  }

  return result;
}
