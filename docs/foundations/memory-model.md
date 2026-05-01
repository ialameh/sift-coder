# Memory model

The store is the part of SiftCoder that has to be exactly right. Hooks are short scripts and the daemon is just a server, but if the database has the wrong shape or the WAL doesn't replay cleanly, every other promise the tool makes is a lie. This chapter is what's actually in there.

## Three tables that matter

There are six tables in `db.sqlite` plus a couple of FTS5 virtual tables and triggers. Three of them carry all the weight: `events`, `summaries`, `summary_embeddings`. The others (`sessions`, `summary_supersedes`, `summary_cache`, `provenance_edges`) are bookkeeping. If you only ever look at one, look at `events`.

### `events` — the raw capture log

```sql
CREATE TABLE events (
  id           INTEGER PRIMARY KEY AUTOINCREMENT,
  ts           INTEGER NOT NULL,
  session_id   TEXT NOT NULL,
  tool         TEXT NOT NULL,
  input_hash   TEXT NOT NULL,
  payload_json TEXT NOT NULL,
  status       TEXT NOT NULL DEFAULT 'raw',
  tokens_est   INTEGER NOT NULL DEFAULT 0
);
```

Every interesting tool call lands here as one row. `payload_json` is the *redacted* tool input and tool response, after `src/memory/privacy.ts` has had a pass at it — secrets out, `<private>...</private>` blocks out, then JSON.stringify'd verbatim. `input_hash` is the SHA-256 of that same redacted payload (with a `_source` provenance tag mixed in), and it is the only thing dedupe runs on.

`status` is the lifecycle marker. Three legal values:

- `raw` — captured but not yet summarised. The consolidator's queue.
- `summarized` — at least one summary row exists for this event id.
- `skipped` — the summariser tried, failed, and the event has been retired. There is no automatic retry of `skipped` rows. You'd reach for this state when investigating "why did this thing never make it into search?" — odds are the LLM rejected the payload (rate limit, timeout, malformed JSON response from a small Ollama model) and the daemon decided to stop retrying rather than burn cycles forever.

`tokens_est` is a rough character-based estimate via `src/memory/tokens.ts:approximate`. Used for budgeting, not billing. Don't trust it past one decimal place.

### `summaries` — what Claude actually searches over

```sql
CREATE TABLE summaries (
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
```

One row per condensation. `model` is a free-form string written by whichever backend produced the text — `ollama:llama3.2:3b`, `anthropic:claude-haiku-4-5-20251001`, `sampling:claude-sonnet-4-6`. When you grep through a database to figure out *what summarised this*, that's the column you're looking at. `prompt_hash` is what makes the summary cache work: same model + same prompt + same input hash means the daemon can return a cached summary without calling the LLM again.

A trigger keeps `summaries_fts` (the FTS5 virtual table) in lockstep on insert/update/delete. That's the BM25 leg of search. You do not maintain it by hand.

### `summary_embeddings` — the vector leg

```sql
CREATE TABLE summary_embeddings (
  summary_id  INTEGER PRIMARY KEY REFERENCES summaries(id) ON DELETE CASCADE,
  dim         INTEGER NOT NULL,
  vec         BLOB NOT NULL
);
```

The vector is a packed `Float32Array` written via `Buffer.from(vec.buffer, vec.byteOffset, vec.byteLength)`. `dim` is whatever the embedder reported — 384 for the deterministic hash-bucket fallback, 768 for `nomic-embed-text` on Ollama, 1024 for `mxbai-embed-large` if you've configured it. The `dim` column exists precisely because **switching embedders mid-workspace produces vectors in different spaces** and you need to know which row was written by which embedder. Cosine between a 768-d nomic vector and a 384-d hash-bucket vector is meaningless — it just truncates the longer one. There is no automatic re-embedding pass in the box; if you change embedders, the practical fix is to drop `summary_embeddings` and let the daemon re-fill it on the next drain. (Roadmap: dim-aware re-embed. Not built.)

There's a `summaries_vec` virtual table referenced in `VEC_DDL` for sqlite-vec, but `retrieval.ts` does cosine in JavaScript over `allEmbeddings()`. The comment at the top of that file explains why: for ~10k summaries it's faster than round-tripping through the extension, and it removes a native-binary dependency that didn't always install cleanly.

## Sessions, supersedes, and cache

`sessions` is a flat table mapping session_id (the Claude Code session UUID) to its `cwd` and timestamps. Used to answer "which session was this captured in" without re-parsing every event payload.

`summary_supersedes` is the consolidator's output. The consolidator (`src/memory/daemon/consolidator.ts`) runs every five minutes by default, scans embeddings, and when it finds two summaries with cosine similarity ≥ 0.95 it records `(newer_id, older_id, cosine, ts)`. Retrieval then filters out the `older_id`s on every search. This is the mechanism that stops you from getting nine variations of the same "fixed null check in auth.ts" memory back on a single query.

`summary_cache` is keyed on `sha256(model | prompt_hash | input_hash)`. If a re-drain runs over the same input with the same prompt and the same model, the LLM call is skipped entirely.

## The lifecycle of one tool call

Walk through it concretely. You ask Claude to read `src/foo.ts`.

1. **Hook fires.** `hooks/post-tool-use/capture-observation.mjs` reads the envelope from stdin (Claude Code passes tool name, session id, input, response). It connects to `~/.siftcoder/<ns>/run/<wsKey>.sock` and writes one length-prefixed JSON frame: `{kind:"capture", sessionId, tool:"Read", payload:{tool_input, tool_response}, ts}`. It then waits up to 250ms for any response, doesn't care what it is, and exits 0.
2. **Daemon redacts.** `src/memory/daemon/server.ts` runs `redact()` over the payload (regex-based scrub of AWS keys, GitHub tokens, Anthropic keys, JWTs, emails, phone numbers, plus `<private>` blocks). The result is the *only* thing that ever touches durable storage.
3. **Symbols are extracted (sometimes).** If the payload looks like a code write — file path matches a code extension, has `content` or `new_string` — the regex symbol extractor pulls function/class names and stamps them onto the payload as a `symbols` field. Helps later searches like "where did we touch the `validateToken` function."
4. **Source stamp.** A `_source` field is added (`"claude-code"` by default; backfill uses what the transcript said). Then the input_hash is computed over the *whole stamped, redacted payload*.
5. **WAL append.** `wal.append({ts, sessionId, tool, inputHash, payload})` writes one ndjson line and `fsync`s. Crash safety lives here. If the process dies between this line and the SQLite insert, the next daemon boot will see the WAL and replay.
6. **SQLite insert.** One `INSERT INTO events` with `status='raw'`. Returns the auto-increment id. The hook's response carries that id and the tokens_est.
7. **Consolidator wakes up.** The summarisation worker (different from the dedupe consolidator — the naming is unfortunate) picks up `raw` events in batches. Default tick 30s, default batch 16, both configurable in `~/.siftcoder/default/config.json` under `memory.consolidator.tickMs` and `memory.consolidator.batchSize`.
8. **Backend produces text.** Ollama, Anthropic, or MCP sampling — see [Backends](backends.md) for which one and why. The result is a short paragraph plus a confidence score.
9. **Summary row.** `INSERT INTO summaries`, the FTS5 trigger fires, lexical index is up to date.
10. **Embedding.** The embedder vectorises the summary text. Result is `INSERT OR REPLACE INTO summary_embeddings`. Vector index is up to date.
11. **Status flip.** `UPDATE events SET status='summarized' WHERE id=?`.

That's the lifecycle. Roughly thirty seconds end-to-end on a warm Ollama; longer on the first call of the session because llama3.2 has to load.

## What dedupe actually means

Two paths into the events table use deduplication, and they don't behave the same way.

The capture hook **does not dedupe.** It just inserts. If Claude reads `foo.ts` three times in a row, that's three rows. This is intentional — the timestamps are different, the tool responses might differ if the file changed, and dedupe at capture time would lose the timeline.

The backfill path **does dedupe**, via `storage.hasEvent(sessionId, inputHash)`. That's the `skippedDuplicate` count you see in the backfill response. The reason: backfill replays transcripts you may have already replayed, and you don't want a second `/siftcoder:mem backfill` to double everything. The dedupe key is `(session_id, input_hash)`, so the same payload from a *different* session still gets recorded as a fresh event — which is the right call, because two different sessions touching the same file are genuinely different observations.

Concretely, you'd reach for this when reasoning about "I ran backfill twice and the count didn't go up" — that's correct, that's dedupe doing its job. Or "I expected dedupe but got duplicates" — check whether the sessions are actually the same, or whether the redactor is producing different output (which changes the input hash even when the underlying tool call was identical).

## WAL replay on crash

The WAL is `wal.ndjson` in the workspace directory. One JSON object per line, fsync'd on every write. Format from `src/memory/daemon/wal.ts`:

```ts
{ ts, sessionId, tool, inputHash, payload }
```

`WAL.replay(path)` reads the file line by line, parses each one, skips trailing torn lines silently, returns the parsed entries. The current daemon entry point doesn't run a replay loop on boot — the WAL is treated as a forward-secure audit trail rather than a recovery primitive. In practice the SQLite WAL (PRAGMA journal_mode=WAL) handles process-crash recovery for the SQL side, and the ndjson WAL is there so you can grep through actual captured payloads after the fact if you don't trust the database.

If you want to use the ndjson WAL for recovery — say, the SQLite file got corrupted — `WAL.replay` is exported and you can write a one-off script to re-insert each entry. Nothing in the box does this for you today.

## Debugging "why isn't this event showing up in search?"

When something feels missing, walk the lifecycle in reverse. The queries below assume you're sitting in the workspace's db.sqlite via `sqlite3`.

```sql
-- Was the event captured at all?
SELECT id, ts, tool, status, length(payload_json) AS bytes
FROM events
ORDER BY id DESC
LIMIT 20;
```

If the row isn't there, the hook never reached the daemon. Check `~/.siftcoder/default/logs/<wsKey>.ndjson` for the last few lines — if there are no `capture` entries around the time you expect, the socket was stale or the hook crashed silently. `/siftcoder:mem info` will tell you whether the daemon is actually up.

```sql
-- Is it stuck in 'raw'?
SELECT count(*) FROM events WHERE status = 'raw';
```

If this is large and not draining, the summariser backend is failing. Check `info`'s `backends` line; force a drain with `/siftcoder:mem drain 8` and read the `firstError`.

```sql
-- Was it summarised but not embedded?
SELECT s.id, s.event_id
FROM summaries s
LEFT JOIN summary_embeddings e ON e.summary_id = s.id
WHERE e.summary_id IS NULL
ORDER BY s.id DESC LIMIT 20;
```

If summaries exist without embeddings, the embedder is failing while the summariser succeeds — probably Ollama's embedding model isn't pulled. `ollama pull nomic-embed-text` and re-drain.

```sql
-- Is it being filtered as superseded?
SELECT * FROM summary_supersedes WHERE older_id = <id>;
```

If the consolidator marked your summary as a duplicate of a newer one, search will skip it. That's working as designed but occasionally surprising.

The store is durable, inspectable, and small enough that `sqlite3` is a perfectly reasonable debugger. If something seems wrong with memory, open the database. The truth is in there.
