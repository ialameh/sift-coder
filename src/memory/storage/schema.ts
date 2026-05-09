/**
 * SQLite DDL for SiftCoder memory v2.
 * sqlite-vec is loaded at runtime; the vec0 virtual table is only created if the extension is available.
 */

export const CORE_DDL = `
PRAGMA journal_mode = WAL;
PRAGMA synchronous = NORMAL;
PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS sessions (
  id          TEXT PRIMARY KEY,
  started_at  INTEGER NOT NULL,
  ended_at    INTEGER,
  cwd         TEXT,
  meta_json   TEXT
);

CREATE TABLE IF NOT EXISTS events (
  id           INTEGER PRIMARY KEY AUTOINCREMENT,
  ts           INTEGER NOT NULL,
  session_id   TEXT NOT NULL,
  tool         TEXT NOT NULL,
  input_hash   TEXT NOT NULL,
  payload_json TEXT NOT NULL,
  status       TEXT NOT NULL DEFAULT 'raw',
  tokens_est   INTEGER NOT NULL DEFAULT 0
);
CREATE INDEX IF NOT EXISTS idx_events_session ON events(session_id, ts);
CREATE INDEX IF NOT EXISTS idx_events_status  ON events(status);

CREATE TABLE IF NOT EXISTS summaries (
  id           INTEGER PRIMARY KEY AUTOINCREMENT,
  event_id     INTEGER NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  ts           INTEGER NOT NULL,
  model        TEXT NOT NULL,
  prompt_hash  TEXT NOT NULL,
  text         TEXT NOT NULL,
  tokens_in    INTEGER,
  tokens_out   INTEGER,
  confidence   REAL
);
CREATE INDEX IF NOT EXISTS idx_summaries_event ON summaries(event_id);

CREATE VIRTUAL TABLE IF NOT EXISTS summaries_fts
  USING fts5(text, content='summaries', content_rowid='id');

CREATE TRIGGER IF NOT EXISTS summaries_ai AFTER INSERT ON summaries BEGIN
  INSERT INTO summaries_fts(rowid, text) VALUES (new.id, new.text);
END;
CREATE TRIGGER IF NOT EXISTS summaries_ad AFTER DELETE ON summaries BEGIN
  INSERT INTO summaries_fts(summaries_fts, rowid, text) VALUES('delete', old.id, old.text);
END;
CREATE TRIGGER IF NOT EXISTS summaries_au AFTER UPDATE ON summaries BEGIN
  INSERT INTO summaries_fts(summaries_fts, rowid, text) VALUES('delete', old.id, old.text);
  INSERT INTO summaries_fts(rowid, text) VALUES (new.id, new.text);
END;

CREATE TABLE IF NOT EXISTS summary_embeddings (
  summary_id  INTEGER PRIMARY KEY REFERENCES summaries(id) ON DELETE CASCADE,
  dim         INTEGER NOT NULL,
  vec         BLOB NOT NULL
);

CREATE TABLE IF NOT EXISTS provenance_edges (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  ts          INTEGER NOT NULL,
  from_kind   TEXT NOT NULL,
  from_id     TEXT NOT NULL,
  to_kind     TEXT NOT NULL,
  to_id       TEXT NOT NULL,
  edge_type   TEXT NOT NULL,
  confidence  REAL NOT NULL DEFAULT 1.0,
  source      TEXT NOT NULL DEFAULT 'siftcoder',
  meta_json   TEXT
);
CREATE INDEX IF NOT EXISTS idx_prov_from ON provenance_edges(from_kind, from_id);
CREATE INDEX IF NOT EXISTS idx_prov_to   ON provenance_edges(to_kind, to_id);
CREATE INDEX IF NOT EXISTS idx_prov_type ON provenance_edges(edge_type);

CREATE TABLE IF NOT EXISTS summary_supersedes (
  newer_id    INTEGER NOT NULL REFERENCES summaries(id) ON DELETE CASCADE,
  older_id    INTEGER NOT NULL REFERENCES summaries(id) ON DELETE CASCADE,
  cosine      REAL NOT NULL,
  ts          INTEGER NOT NULL,
  PRIMARY KEY (newer_id, older_id)
);

CREATE TABLE IF NOT EXISTS summary_cache (
  cache_key   TEXT PRIMARY KEY,
  text        TEXT NOT NULL,
  tokens_in   INTEGER,
  tokens_out  INTEGER,
  created_at  INTEGER NOT NULL
);
`;

/**
 * Idempotent migrations applied after CORE_DDL. Each statement is wrapped in try/catch by Storage
 * so re-runs are safe on existing databases.
 *
 * The summaries(event_id) UNIQUE INDEX is preceded by a dedupe step because the pre-fix
 * drain race could insert multiple summaries per event_id; without dedupe the index creation
 * would fail on existing DBs.
 */
export const MIGRATIONS: ReadonlyArray<string> = [
  `ALTER TABLE events ADD COLUMN tokens_est INTEGER NOT NULL DEFAULT 0`,
  `ALTER TABLE events ADD COLUMN attempts INTEGER NOT NULL DEFAULT 0`,
  `ALTER TABLE events ADD COLUMN last_error TEXT`,
  `DELETE FROM summary_embeddings WHERE summary_id NOT IN (SELECT MAX(id) FROM summaries GROUP BY event_id)`,
  `DELETE FROM summary_supersedes WHERE newer_id NOT IN (SELECT MAX(id) FROM summaries GROUP BY event_id) OR older_id NOT IN (SELECT MAX(id) FROM summaries GROUP BY event_id)`,
  `DELETE FROM summaries WHERE id NOT IN (SELECT MAX(id) FROM summaries GROUP BY event_id)`,
  `CREATE UNIQUE INDEX IF NOT EXISTS idx_summaries_event_unique ON summaries(event_id)`,
  // pinned_at: NULL means not pinned. Non-null timestamps survive supersede + decay so the
  // user (or an agent) can curate long-term memories that the consolidator won't kill.
  `ALTER TABLE summaries ADD COLUMN pinned_at INTEGER`,
  `CREATE INDEX IF NOT EXISTS idx_summaries_pinned ON summaries(pinned_at) WHERE pinned_at IS NOT NULL`,
  // expires_at: NULL = retained indefinitely. Non-null = epoch ms after which a periodic
  // sweep deletes the event and its dependents (cascade). Per-capture TTL for ephemeral
  // content (CI logs, transient bash output, etc.).
  `ALTER TABLE events ADD COLUMN expires_at INTEGER`,
  `CREATE INDEX IF NOT EXISTS idx_events_expires ON events(expires_at) WHERE expires_at IS NOT NULL`,
  // Backfill / live-capture race fix: enforce one event per (session_id, input_hash). The
  // pre-fix path used a SELECT-then-INSERT which TOCTOU-races under concurrent writers.
  // Pre-existing duplicates are deduped to the latest id before the index is created.
  // Cascade dependents (summaries, embeddings) follow via FK.
  `DELETE FROM summaries WHERE event_id IN (SELECT id FROM events WHERE id NOT IN (SELECT MAX(id) FROM events GROUP BY session_id, input_hash))`,
  `DELETE FROM events WHERE id NOT IN (SELECT MAX(id) FROM events GROUP BY session_id, input_hash)`,
  `CREATE UNIQUE INDEX IF NOT EXISTS idx_events_session_inputhash ON events(session_id, input_hash)`,
];

/**
 * Build the vec0 DDL with a runtime-resolved dimension. The default of 384 matches the
 * `DeterministicEmbedder`; daemon boot calls this with the active embedder's `dim` so the
 * virtual table matches whatever embedder was selected (e.g., 768 for Ollama nomic-embed-text).
 */
export function buildVecDdl(dim: number): string {
  return `
CREATE VIRTUAL TABLE IF NOT EXISTS summaries_vec USING vec0(
  embedding float[${dim}]
);
`;
}

export const VEC_DDL = buildVecDdl(384);
