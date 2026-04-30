# SiftCoder Memory v2 — Architecture Plan

Status: Phase 1 in progress
Owner: SiftCoder core
Supersedes: ad-hoc JSON state in `.claude/siftcoder-state/`

## Goal
Build a persistent, cross-session memory system that beats `claude-mem` on quality (recall@k), latency (p99 hook < 5ms), cost ($/1k turns), privacy (PII-redacted at edge), and team-readiness — while shipping fewer moving parts.

## Non-goals (Phase 1)
- CRDT team sync
- Sleep-time replay / decay
- Web viewer UI
- Tree-sitter code parsing
- Multi-vector ColBERT
- Continuous eval harness

These land in Phase 2+.

## Decisions

### Storage: better-sqlite3 + sqlite-vec + FTS5 (single file)
- Rejected: LanceDB (150 MB native dep, overkill for v1)
- Rejected: DuckDB+vss (less mature in Node)
- Rejected: SQLite + Chroma (claude-mem's two-store sync drift)
- Chosen: one `.db` file, ACID, FTS5 + sqlite-vec for hybrid search, behind a `Storage` interface so Lance/DuckDB swap is a one-file change.

### IPC: Unix Domain Socket + ndjson framed messages
- Rejected: HTTP on localhost:port (claude-mem; firewall surface, port collisions, ~1ms overhead)
- Rejected: shared memory ringbuffer (over-engineered for v1)
- Chosen: UDS at `~/.siftcoder/run/<workspace-hash>.sock`, length-prefixed ndjson. msgpack deferred to Phase 2 (premature optimization).

### Daemon supervisor: launchd-on-demand via SessionStart hook
- Rejected: persistent launchd plist (cross-platform burden; user-installed)
- Chosen: SessionStart hook spawns daemon if PID file stale; daemon self-exits after 30 min of zero clients.

### Capture tiers
- L0 raw: append-only ndjson WAL, content-addressed by BLAKE3
- L1 online summary: Haiku 4.5, novelty-gated (cosine vs last-N embeddings > 0.15)
- L2 episodic consolidation: nightly Sonnet pass (Phase 2)
- L3 semantic distillation: weekly (Phase 2)

### Embeddings
- Local: `fastembed-js` w/ `BAAI/bge-small-en-v1.5` (~33 MB ONNX, ~5 ms/embed)
- No API cost, no rate limits

### Summarization cascade
- Tier 1: Haiku 4.5 (default) — `claude-haiku-4-5-20251001`
- Tier 2: Sonnet 4.6 — escalation on self-eval confidence < 0.6
- Cache: content-hash on `(model, prompt_hash, input_hash)` → identical re-runs zero-cost
- Pinned `temperature: 0`

### Retrieval (3-layer MCP)
1. `mem_search(query, k=5)` — hybrid BM25(FTS5) + dense(sqlite-vec) fused via RRF (k=60)
2. `mem_timeline(near_id, window=10)` — chronological neighbors
3. `mem_get(ids[])` — full payloads by id

### Privacy edge
- `<private>...</private>` stripped before WAL write
- Regex pass: emails, phone, SSN-like, AWS keys (`AKIA[0-9A-Z]{16}`), bearer tokens
- Presidio integration deferred to Phase 2

### Workspace identity
- Key = SHA256(realpath(git toplevel || cwd)) first 12 hex chars
- Paths: `~/.siftcoder/workspaces/<key>/{db.sqlite,wal.ndjson,run.pid}`
- Socket: `~/.siftcoder/run/<key>.sock`

### Observability
- Structured ndjson logs at `~/.siftcoder/logs/<key>.ndjson`
- OTel deferred to Phase 2

## Schema (SQLite)

```sql
CREATE TABLE events (
  id INTEGER PRIMARY KEY,
  ts INTEGER NOT NULL,            -- unix ms
  session_id TEXT NOT NULL,
  tool TEXT NOT NULL,             -- 'Read'|'Write'|'Edit'|'Bash'|...
  input_hash TEXT NOT NULL,       -- BLAKE3
  payload_json TEXT NOT NULL,     -- redacted
  status TEXT NOT NULL DEFAULT 'raw'  -- raw|summarized|skipped
);
CREATE INDEX idx_events_session ON events(session_id, ts);

CREATE TABLE summaries (
  id INTEGER PRIMARY KEY,
  event_id INTEGER NOT NULL REFERENCES events(id),
  ts INTEGER NOT NULL,
  model TEXT NOT NULL,
  prompt_hash TEXT NOT NULL,
  text TEXT NOT NULL,
  tokens_in INTEGER, tokens_out INTEGER,
  confidence REAL
);
CREATE VIRTUAL TABLE summaries_fts USING fts5(text, content='summaries', content_rowid='id');
CREATE VIRTUAL TABLE summaries_vec USING vec0(embedding float[384]);

CREATE TABLE sessions (
  id TEXT PRIMARY KEY,
  started_at INTEGER NOT NULL,
  ended_at INTEGER,
  cwd TEXT,
  meta_json TEXT
);

CREATE TABLE summary_cache (
  cache_key TEXT PRIMARY KEY,     -- sha256(model||prompt_hash||input_hash)
  text TEXT NOT NULL,
  tokens_in INTEGER, tokens_out INTEGER,
  created_at INTEGER NOT NULL
);
```

## File layout

```
src/memory/
  protocol.ts          # message types + framed codec
  workspace.ts         # path + key derivation
  privacy.ts           # redaction
  client.ts            # thin RPC client (used by hooks)
  storage/
    schema.ts          # DDL
    storage.ts         # CRUD over better-sqlite3 + sqlite-vec
    storage.test.ts
  daemon/
    server.ts          # UDS listener
    summarizer.ts      # Anthropic SDK cascade
    embedder.ts        # fastembed wrapper
    wal.ts             # append-only writer
    index.ts           # entry point (excluded from coverage)
  mcp/
    server.ts          # stdio MCP w/ search/timeline/get
hooks/
  post-tool-use/
    capture-observation.mjs   # rewritten: thin client → daemon
  session-start/
    spawn-daemon.mjs          # idempotent daemon boot
```

## Phase 1 scope (this build)
1. protocol, workspace, privacy (pure modules, full unit tests)
2. storage (schema + CRUD + sqlite-vec stub if extension absent)
3. WAL writer
4. Daemon server (UDS) — capture endpoint only
5. Thin client + hook rewrite
6. SessionStart spawn-daemon
7. MCP stdio server w/ `mem_search`/`mem_timeline`/`mem_get`
8. Summarizer cascade w/ content-hash cache
9. Tests

## Open questions resolved
- Q: Add `@anthropic-ai/sdk`? **A: yes**, runtime dep. Required for L1 summarization.
- Q: Add `better-sqlite3`? **A: yes**. Native compile but mature.
- Q: Add `fastembed`? **A: yes** for embeddings. Falls back to "no embedding" if init fails — system stays functional, retrieval drops to BM25-only.
- Q: How does daemon find Claude API key? **A: env `ANTHROPIC_API_KEY`** — same convention as Claude Code.
- Q: Migration from old `siftcoder-state/`? **A: deferred** — old system stays read-only for inject-knowledge; new memory is additive.
