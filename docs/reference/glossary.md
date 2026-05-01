# Glossary

Every load-bearing term used in the SiftCoder docs, alphabetised. If a term shows up in the foundations or operations chapters and you can't infer its meaning, look here.

---

**Anthropic backend** — One of the drain options. When `memory.drainBackend` resolves to `anthropic`, the consolidator (or the MCP server) calls the Anthropic SDK directly using `ANTHROPIC_API_KEY`. Models are configured via `memory.summarizer.modelHaiku` and `modelSonnet`. Higher-quality summaries than Ollama, but costs money and ships content out of the box.

**BM25** — A classic lexical ranking function over an inverted index. SiftCoder uses SQLite's FTS5 BM25 implementation as one of two retrieval legs (the other being vector similarity). Strong for exact-keyword queries; weak when the user phrases something differently from the corpus.

**Backfill** — The act of replaying past Claude Code transcripts (`~/.claude/projects/<encoded-cwd>/*.jsonl`) into the memory store. Triggered by `siftcoder backfill` or the `BackfillRequest` RPC. Useful right after first install — without it, retrieval finds nothing because the store is empty.

**Capture** — The act of recording a tool call as an event. Performed by the PostToolUse hook (`capture-observation.mjs`). Sends a `CaptureRequest` frame over UDS; the daemon redacts secrets, deduplicates on `input_hash`, and writes to the `events` table with status `raw`.

**CDG (Code Document Graph) embedder** — A code-aware embedding model. Second-priority embedder in the cascade. Falls between Ollama (when available) and the deterministic embedder. Produces vectors that respect code structure better than generic embedders.

**Chroot** — A SiftCoder-specific tighter scope mechanism: instead of glob-based allowlists (which is what `scope.json` does), `chroot.json` lists exact file paths. Used for "AI may only touch these 12 files".

**Consolidator** — The component inside the daemon that runs on a tick (default 30 s) and summarises raw events into the `summaries` table. Configurable via `memory.consolidator.tickMs` and `batchSize`.

**Daemon** — The single Node process per workspace that owns the SQLite handle, the WAL file, the socket, and the consolidator. Spawned by `hooks/session-start/spawn-daemon.mjs` or `siftcoder start`. Lives at `dist/memory/daemon/index.js`.

**Deterministic embedder** — A pure-JS, 384-dimensional embedder that hashes tokens into vector slots. Always available — needs no external service. Lower retrieval quality than Ollama or CDG, but the floor is reliable. The drain-time embedder when nothing better is up.

**Drain** — Force-running the consolidator now (rather than waiting for the next tick). Triggered by `siftcoder drain [batch]`, the `mem_drain` MCP tool, or the small per-call drain inside `mem_search`. Reads pending events, summarises, embeds, marks `summarized`.

**Embedding** — A fixed-length float vector representing the semantic content of a summary. Stored in `summary_embeddings.vec` as a packed float32 BLOB with the dimension in `dim`. Used for the cosine-similarity leg of retrieval.

**Event** — A row in the `events` table — one tool call. Columns: id, ts, session_id, tool, input_hash, payload_json, tokens_est, status. The unit of capture; many events become summaries.

**FTS5** — SQLite's full-text-search virtual-table extension. Backs the BM25 leg of retrieval. SiftCoder maintains an FTS5 table over summary text; the daemon updates it as summaries are written.

**Hook** — A short Node script the harness runs synchronously around tool calls. SiftCoder ships hooks for PreToolUse, PostToolUse, PreCompact, Notification, SessionStart, and Stop. See [hooks.md](hooks.md).

**MCP (Model Context Protocol)** — Anthropic's protocol for letting Claude call external tools. SiftCoder registers a server named `siftcoder-memory` that exposes `mem_search`, `mem_get`, `mem_timeline`, `mem_drain`, `mem_why`. JSON-RPC over stdio.

**Namespace** — Top-level isolation for runtime state. Set via `SIFTCODER_NS`. Defaults to `default`. Maps to `~/.siftcoder/<namespace>/`. Useful for separating work from personal, or tenants in a shared dev box.

**Ollama** — A local LLM runner. SiftCoder treats it as the preferred drain backend when reachable at `OLLAMA_HOST` (default `http://localhost:11434`) — no token cost, no data egress. Default model `llama3.2:3b` for summaries, `nomic-embed-text` for embeddings.

**RRF (Reciprocal Rank Fusion)** — The fusion method SiftCoder uses to combine BM25 and vector retrieval results. Formula: `score(d) = Σ_legs 1 / (rrfK + rank_leg(d))`. Works without score normalisation — it only needs ranks. The `rrfK` constant defaults to 60.

**Sampling (MCP)** — A capability where an MCP server can request LLM calls *back through the host*. SiftCoder uses this so the daemon doesn't need its own API key — it borrows the host's. Outbound JSON-RPC method is `sampling/createMessage`. Requires the host to advertise `sampling` capability on `initialize`.

**Scope file** — `.siftcoder/scope.json` (project) or `~/.siftcoder/<ns>/scope.json` (global). JSON object with allow-globs that the boundary-enforcer reads to decide which paths Write/Edit may touch. Strict JSON — comments break it silently.

**Session** — A Claude Code session id, propagated through hook invocations. Used in `events.session_id` for grouping. Multiple sessions can run against the same workspace.

**Summariser** — The class that takes a raw event payload and produces a short text summary. Implemented in `dist/memory/daemon/summarizer.js`. Calls whichever model client is configured (Ollama / Anthropic / sampling).

**Summary** — A condensed text representation of one or more events. Stored in the `summaries` table. The unit of retrieval — search and timeline operate over summaries, not raw events.

**Time decay** — An exponential weighting applied to retrieval scores so older summaries fade. `score' = score * exp(-Δt / tauMs)`. Default `tauMs = 7 days` (`halfLifeDays = 7`). Tuneable in `memory.decay`.

**WAL (Write-Ahead Log)** — Two distinct things in this codebase:
1. SiftCoder's own per-workspace `wal.ndjson` — every captured event as a JSON line, fsync'd. Lets the daemon survive a crash mid-capture.
2. SQLite's WAL mode — `db.sqlite-wal` and `db.sqlite-shm`. Enabled because it gives concurrent readers + writer without locking pain.

**Workspace** — A repo, identified by the SHA-256 of the realpath of its git toplevel, truncated to 12 hex characters. One workspace ↔ one daemon ↔ one socket ↔ one DB file. Two terminals in the same repo share the workspace.
