/**
 * PostgreSQL DBHandle adapter for SiftCoder memory.
 *
 * Implements the same async DBHandle interface as the SQLite adapter, but targets
 * PostgreSQL as the backend. Workspace isolation is via separate databases.
 *
 * Env:
 *   POSTGRES_HOST      (default localhost)
 *   POSTGRES_PORT      (default 5432)
 *   POSTGRES_USER      (default postgres)
 *   POSTGRES_PASSWORD  (required)
 *   POSTGRES_BASE_NAME (default siftcoder — databases are {base}_{workspace_key})
 *
 * Architecture: the DBHandle interface is async. Each method posts to a worker
 * thread that owns the pg Pool and sends back responses via worker.postMessage().
 * The worker uses its parentPort to communicate back to the main thread.
 * Since all callers are async, we simply await the response from the worker.
 */
import type { DBHandle } from './storage.js';
import { Worker } from 'node:worker_threads';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

export interface PgDbOptions {
  host?: string;
  port?: number;
  user?: string;
  password?: string;
  baseName?: string;
  database: string; // workspace key — maps to {baseName}_{workspace_key}
  maxConnections?: number;
}

export function pgOptionsFromEnv(database: string): PgDbOptions {
  return {
    host: process.env['POSTGRES_HOST'] ?? 'localhost',
    port: parseInt(process.env['POSTGRES_PORT'] ?? '5432', 10),
    user: process.env['POSTGRES_USER'] ?? 'postgres',
    password: process.env['POSTGRES_PASSWORD'] ?? '',
    baseName: process.env['POSTGRES_BASE_NAME'] ?? 'siftcoder',
    database,
  };
}

// ─── Prepared statement wrapper ────────────────────────────────────────────────

interface PgStmt {
  run(...params: unknown[]): Promise<{ lastInsertRowid: number | bigint }>;
  get(...params: unknown[]): Promise<unknown>;
  all(...params: unknown[]): Promise<unknown[]>;
}

// ─── Worker thread bootstrap ──────────────────────────────────────────────────

// Worker file ships as `.mjs` (it uses ESM imports). The path was previously `.cjs`, which
// resolved to a non-existent file and silently broke the Postgres backend at boot.
const WORKER_MODULE = /* @__PURE__ */ join(dirname(fileURLToPath(import.meta.url)), 'pg-worker.mjs');

interface WorkerRequest {
  id: number;
  sql?: string;
  params?: unknown[];
  op: 'init' | 'exec' | 'run' | 'get' | 'all';
  opts?: PgDbOptions;
}

interface WorkerResponse {
  id: number;
  ok: boolean;
  result?: unknown;
  error?: string;
  lastInsertRowid?: number;
}

/**
 * PostgresDB — async DBHandle backed by a worker thread.
 *
 * Each DBHandle method posts a request to the worker via worker.postMessage()
 * and awaits the response. The worker replies using its parentPort.
 */
export class PostgresDB implements DBHandle {
  private readonly worker: Worker;
  private readonly pending = new Map<number, {
    resolve: (v: unknown) => void;
    reject: (e: unknown) => void;
  }>();
  private _nextId = 0;
  private _lastId = 0;
  private _initDone = false;

  static async connect(opts: PgDbOptions): Promise<PostgresDB> {
    const db = new PostgresDB();
    await db._init(opts);
    return db;
  }

  private constructor() {
    this.worker = new Worker(WORKER_MODULE, {
      stderr: true,
      env: process.env,
    });

    // Set up message handler for worker responses
    this.worker.on('message', (msg: WorkerResponse) => {
      if (msg.id === -1) {
        this._initDone = true;
        return;
      }
      const pending = this.pending.get(msg.id);
      if (pending) {
        this.pending.delete(msg.id);
        if (msg.ok) {
          if (msg.lastInsertRowid !== undefined) {
            this._lastId = Number(msg.lastInsertRowid);
          }
          pending.resolve(msg.result);
        } else {
          pending.reject(new Error(msg.error ?? 'worker error'));
        }
      }
    });
  }

  private _init(opts: PgDbOptions): Promise<void> {
    return new Promise<void>((resolve) => {
      const check = () => {
        if (this._initDone) {
          resolve();
        } else {
          setTimeout(check, 1);
        }
      };
      check();

      const id = this._nextId++;
      this.pending.set(id, { resolve: () => {}, reject: () => {} });
      this.worker.postMessage({ id, op: 'init', opts } satisfies WorkerRequest);
    });
  }

  private async _post<T>(op: 'exec' | 'run' | 'get' | 'all', sql: string, params: unknown[] = []): Promise<T> {
    return new Promise<T>((resolve, reject) => {
      const id = this._nextId++;
      this.pending.set(id, { resolve: resolve as (v: unknown) => void, reject });
      this.worker.postMessage({ id, op, sql, params } satisfies WorkerRequest);
    });
  }

  async exec(sqlCmd: string): Promise<unknown> {
    return this._post('exec', sqlCmd, []);
  }

  async prepare(sqlCmd: string): Promise<PgStmt> {
    return {
      run: async (...params: unknown[]) => {
        await this._post<unknown>('run', sqlCmd, params);
        return { lastInsertRowid: this._lastId };
      },
      get: (...params: unknown[]) => this._post('get', sqlCmd, params) as Promise<unknown>,
      all: (...params: unknown[]) => this._post('all', sqlCmd, params) as Promise<unknown[]>,
    };
  }

  loadExtension(_path: string): void {
    // pg_vector loaded at connect time — no-op here
  }

  async close(): Promise<void> {
    this.worker.terminate();
  }
}

// ─── PostgreSQL DDL ───────────────────────────────────────────────────────────

export const PG_CORE_DDL = `
CREATE TABLE IF NOT EXISTS sessions (
  id          TEXT PRIMARY KEY,
  started_at  BIGINT NOT NULL,
  ended_at    BIGINT,
  cwd         TEXT,
  meta_json   TEXT
);

CREATE TABLE IF NOT EXISTS events (
  id           BIGSERIAL PRIMARY KEY,
  ts           BIGINT NOT NULL,
  session_id   TEXT NOT NULL,
  tool         TEXT NOT NULL,
  input_hash   TEXT NOT NULL,
  payload_json TEXT NOT NULL,
  status       TEXT NOT NULL DEFAULT 'raw',
  tokens_est   BIGINT NOT NULL DEFAULT 0
);
CREATE INDEX IF NOT EXISTS idx_events_session ON events(session_id, ts);
CREATE INDEX IF NOT EXISTS idx_events_status  ON events(status);

CREATE TABLE IF NOT EXISTS summaries (
  id           BIGSERIAL PRIMARY KEY,
  event_id     BIGINT NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  ts           BIGINT NOT NULL,
  model        TEXT NOT NULL,
  prompt_hash  TEXT NOT NULL,
  text         TEXT NOT NULL,
  tokens_in    BIGINT,
  tokens_out   BIGINT,
  confidence   DOUBLE PRECISION
);
CREATE INDEX IF NOT EXISTS idx_summaries_event ON summaries(event_id);

-- FTS via tsvector (replaces SQLite FTS5)
CREATE INDEX IF NOT EXISTS idx_summaries_fts ON summaries USING gin(to_tsvector('english', text));

CREATE TABLE IF NOT EXISTS summary_embeddings (
  summary_id  BIGINT PRIMARY KEY REFERENCES summaries(id) ON DELETE CASCADE,
  dim         BIGINT NOT NULL,
  vec         REAL[] NOT NULL
);

CREATE TABLE IF NOT EXISTS provenance_edges (
  id          BIGSERIAL PRIMARY KEY,
  ts          BIGINT NOT NULL,
  from_kind   TEXT NOT NULL,
  from_id     TEXT NOT NULL,
  to_kind     TEXT NOT NULL,
  to_id       TEXT NOT NULL,
  edge_type   TEXT NOT NULL,
  confidence  DOUBLE PRECISION NOT NULL DEFAULT 1.0,
  source      TEXT NOT NULL DEFAULT 'siftcoder',
  meta_json   TEXT
);
CREATE INDEX IF NOT EXISTS idx_prov_from ON provenance_edges(from_kind, from_id);
CREATE INDEX IF NOT EXISTS idx_prov_to   ON provenance_edges(to_kind, to_id);
CREATE INDEX IF NOT EXISTS idx_prov_type ON provenance_edges(edge_type);

CREATE TABLE IF NOT EXISTS summary_supersedes (
  newer_id    BIGINT NOT NULL REFERENCES summaries(id) ON DELETE CASCADE,
  older_id    BIGINT NOT NULL REFERENCES summaries(id) ON DELETE CASCADE,
  cosine      DOUBLE PRECISION NOT NULL,
  ts          BIGINT NOT NULL,
  PRIMARY KEY (newer_id, older_id)
);

CREATE TABLE IF NOT EXISTS summary_cache (
  cache_key   TEXT PRIMARY KEY,
  text        TEXT NOT NULL,
  tokens_in   BIGINT,
  tokens_out  BIGINT,
  created_at  BIGINT NOT NULL
);

CREATE TABLE IF NOT EXISTS entities (
  id          BIGSERIAL PRIMARY KEY,
  kind        TEXT NOT NULL,
  name        TEXT NOT NULL,
  qualified   TEXT,
  created_at  BIGINT NOT NULL DEFAULT (EXTRACT(EPOCH FROM NOW()) * 1000)::BIGINT,
  updated_at  BIGINT NOT NULL DEFAULT (EXTRACT(EPOCH FROM NOW()) * 1000)::BIGINT,
  UNIQUE(kind, name)
);

CREATE TABLE IF NOT EXISTS entity_facts (
  id                 BIGSERIAL PRIMARY KEY,
  entity_id          BIGINT NOT NULL REFERENCES entities(id) ON DELETE CASCADE,
  predicate         TEXT NOT NULL,
  object            TEXT NOT NULL,
  status            TEXT NOT NULL DEFAULT 'current',
  confidence        DOUBLE PRECISION NOT NULL DEFAULT 0.5,
  source_summary_id BIGINT,
  source_event_id   BIGINT,
  valid_from        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  valid_to          TIMESTAMPTZ,
  git_commit        TEXT,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_entity_facts_entity_status ON entity_facts(entity_id, status);
CREATE INDEX IF NOT EXISTS idx_entity_facts_predicate     ON entity_facts(predicate);
CREATE INDEX IF NOT EXISTS idx_entity_facts_entity_predicate ON entity_facts(entity_id, predicate, status);
`;

export const PG_VEC_DDL = `
CREATE EXTENSION IF NOT EXISTS vector;
`;

export const PG_MIGRATIONS: ReadonlyArray<string> = [];