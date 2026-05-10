# Changelog

All notable changes to SiftCoder. Format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/), versioning is [SemVer](https://semver.org/).

## [1.2.6] — 2026-05-10

### Added
- **`siftcoder savings` CLI verb** + `savings` RPC kind. The savings report (capture / drain / spend / compression / net token savings) was previously only reachable via `/api/savings` HTTP or the SPA Overview tab. Adds parity with the rest of the operator surface — `mem stats` shows throughput, `mem savings` shows tokens.
- `/siftcoder:mem savings [--json]` slash command.

## [1.2.5] — 2026-05-10

Audit pass on the v1.2 line. Three measured findings, three fixes.

### Fixed
- **Streaming search ran every subquery twice** — `streamingHybridSearch` emitted BM25 + vector stages from one set of queries, then called `hybridSearch` for the final stage which re-ran BM25 + embedding + vector. Verified by instrumented count: `{ searchFts: 2, embed: 2 }` per stream_search request. Refactored: extracted `runRetrievalStages` (BM25 + vector preflight) and `fuseAndRank` (RRF + decay + supersede + rerank) so both `hybridSearch` and `streamingHybridSearch` share the work. Now `{ searchFts: 1, embed: 1 }` per request, matching non-streaming. Comment claiming "guarantees parity" was rationalization for the duplication.
- **Doctor reranker probe leaked money on idle workspaces** — `mem watch` polled doctor every 20s; doctor pinged the reranker server every call → 4320 paid Cohere/TEI/Jina API calls per idle day. Added 60s probe cache at the daemon level. `req.heal=true` bypasses the cache so an explicit `mem doctor --heal` always gets ground truth. Cached responses include a `cached: true` flag in the reply.

### Verified (no fix needed)
- **Auto-edge capture latency** — measured: 52µs/event baseline → 160µs with auto-edges (Edit) → 538µs worst case (Bash with 8 path tokens). Capture budget is 250ms; auto-edges uses ≤0.2% of it. Phantom concern.

### Internals
- `runRetrievalStages` and `fuseAndRank` are private helpers in `retrieval.ts`. Public surface (`hybridSearch`, `streamingHybridSearch`) unchanged.
- `resetRerankerProbeCache` exported from `server.ts` for tests; module-level cache is a `let` so tests can isolate.

## [1.2.4] — 2026-05-10

Loose-end polish.

### Added
- **`processFrame` extracted from `startServer` socket loop** — streaming branch now unit-testable in isolation. 3 new test cases (single-frame ping, full stream_search emit pattern, error-frame on stage failure). Closes the `c8 ignore` coverage gap on the streaming dispatch path.
- **CLI `mem stream-search` ANSI colors + per-stage timing** — `[bm25]` blue, `[vector]` cyan, `[final]` green, `[done]` dim, plus elapsed-ms badge per stage and total. `NO_COLOR` env var and `--no-color` flag honored. Plain output preserved when stdout is not a TTY (pipes / scripts).
- **`mem watch` upgraded** — adds backlog ETA, cache hit rate, pinned count, integrity status, reranker reachability badge. Doctor poll every 10 ticks (default 20s) layered on the per-tick stats RPC. Color-coded integrity / reranker state.

## [1.2.3] — 2026-05-10

Tail of the v1.2 cleanup wave.

### Added
- **SPA Federation tab + `/api/federate-search` route** — `mem_federate_search` had been daemon/CLI-only since 1.1.0. External callers no longer need the legacy `POST /` RPC frame. Tab provides query / k / prefix / max-workspaces controls; results tagged by workspace key.

### Docs
- **ARCHITECTURE.md refresh** — captures every shipped feature since the v1.1 doc-pass: knowledge-graph queries, auto-edge inference, MCP eager-drain, streaming hybrid search, cross-encoder reranker, 11 SPA tabs. Adds four new design decisions (D8–D11).

## [1.2.2] — 2026-05-10

Operational hardening. Three issues that all surfaced during the v1.2.1 plugin-cache install:

### Fixed
- **Missing native binding crashes daemon with cryptic `database is locked`** — `npm install --silent` (used by some plugin-marketplace install paths) skips better-sqlite3's postinstall on certain npm versions. The bindings.js fallback then triggers a wasm path that interprets WAL state as a lock. `bin/siftcoder.mjs` now checks for `node_modules/better-sqlite3/build/Release/better_sqlite3.node` on `start` and `openStorage`, runs `npm rebuild better-sqlite3` automatically when missing.
- **Daemon main-loop catch swallows stack** — `main().catch(err => stderr.write(err.message))` was hiding the line number. Now writes `err.stack ?? err.message`. Future first-boot failures will be diagnosable on first sight.

### Added
- **Reranker reachability probe in `mem doctor`** — when `SIFTCODER_RERANKER_URL` is set, doctor calls `reranker.ping()` (single 1-doc score round-trip) and reports `{ configured, ok, latencyMs, error? }`. Surfaced in the SPA Health tab as a `reachable | unreachable | disabled` tag with latency. A silently-broken reranker no longer degrades search quality unnoticed.
- `AsyncReranker.ping?(): Promise<{ ok, latencyMs, error? }>` — optional health probe. `crossEncoderToReranker` implements it via a 1-doc score call.

## [1.2.1] — 2026-05-10

Build fix. The TypeScript compiler doesn't copy non-`.ts` assets, so `dist/memory/web/static/` was never populated. The HTTP bridge resolves `index.html` / `app.js` / `style.css` from that path at runtime, so any installation built from a fresh checkout returned 404 on `/?token=…` even though the source files sat untouched in `src/memory/web/static/`. Latent since the SPA shipped; only surfaced when the daemon was restarted on a freshly built dist.

### Fixed
- **SPA shell 404 from compiled dist** — `npm run build` now runs `scripts/copy-static.mjs` after `tsc` to copy `src/memory/web/static/*` → `dist/memory/web/static/*`. The script logs the file count so build output makes the copy visible.

## [1.2.0] — 2026-05-10

Knowledge-graph + retrieval-quality release. Nine PRs (#27–#35) closing every deferred roadmap item from the 1.1.0 audit. Test count 800 → 857; +57 tests across new modules. Capture path now seeds the provenance graph automatically; search gains both progressive streaming and opt-in cross-encoder reranking.

### Added — knowledge graph

- **Auto-edge inference at capture** (PR #32) — `src/memory/auto-edges.ts` writes structural provenance edges as events land: `event → file (edits)` for Edit/Write/Read/MultiEdit, `event → file (references)` for Bash path-tokens, and a `derives_from` chain to the prior event in the same session. All inferred edges tagged `source='auto'`. Disable with `SIFTCODER_AUTO_EDGES=0`. Means `mem_graph_subgraph`/`hubs`/`path` now produce non-empty results on a fresh workspace.
- **`mem_graph_subgraph` + `mem_graph_hubs`** (PR #29) — bidirectional BFS subgraph extraction (with edgeType filter + maxEdges cap) and top-degree node ranking with optional kind filter. Tools, HTTP routes (`/api/graph/subgraph`, `/api/graph/hubs`), CLI verbs (`graph-subgraph`, `graph-hubs`).
- **`mem_graph_path`** (PR #31) — shortest path between two nodes via undirected BFS over the provenance graph; preserves edge direction in the response. CLI verb `graph-path`. Side-fix: `case 'why'` returned an unawaited Promise; now returns the resolved edges.

### Added — retrieval quality

- **Cross-encoder reranker** (PR #34) — opt-in HTTP scoring via `SIFTCODER_RERANKER_URL`. `HttpCrossEncoder` auto-detects Jina/TEI (`{scores}`) and Cohere (`{results}`) response shapes. Adapter fails open: any scoring error falls back to baseline RRF order so a flaky reranker never breaks search. Wired into `/api/search`, `mem_search`, `mem_context_budget`. Zero binary deps in default install.
- **Streaming hybrid search** (PR #35) — new `stream_search` RPC kind emits BM25 → vector → final stages as separate frames on one socket connection. `MemoryClient.sendStream` is an AsyncGenerator with per-frame progress timeout. CLI verb `siftcoder stream-search` renders each stage progressively. `streamingHybridSearch` reuses non-streaming `hybridSearch` for the final stage to guarantee parity.
- **MCP eager-drain loop** (PR #28) — `src/memory/mcp/drain-loop.ts` polls daemon backlog and drains via host sampling without waiting for `mem_search`. Adaptive backoff (2× per empty tick, capped) keeps idle workspaces quiet; resets to base cadence on a productive drain. Configurable: `SIFTCODER_MCP_DRAIN_MS` (default 60s; 0 disables), `SIFTCODER_MCP_DRAIN_BATCH` (default 4).

### Added — web UI

- **Health, Pinned, Sessions, Symbol tabs** (PR #27) — surfaces `/api/stats`, `/api/doctor`, `/api/pinned`, `/api/symbol-search`, `/api/replay` in the SPA. Adds `GET /api/sessions` for browser-friendly session listing (was RPC-only).
- **Graph tab** (PR #30) — subgraph explorer with click-pivot edge cells + hub sidebar with kind filter. Turns the SPA into a graph walker.
- **Path-finding form** (PR #31) — second form on the Graph tab for `/api/graph/path`.
- **Patterns tab + HTTP parity** (PR #33) — `/api/patterns`, `/api/session-digest`, `/api/as-of` so external callers no longer need the legacy `POST /` RPC frame. Patterns tab surfaces recurring `input_hash` buckets across sessions.

### Fixed

- **`case 'why'` returned `{}` not edges** (PR #29) — the `trace` Promise was being JSON-serialized without await. The endpoint now returns the resolved edge list.
- **Empty graph on fresh workspace** (PR #32) — graph features advertised but produced empty results until human edges or CDG ingest landed; auto-edge inference closes this.

### Internals

- 9 PRs, all squash-merged.
- New modules: `auto-edges.ts`, `cross-encoder.ts`, `mcp/drain-loop.ts`, `stream-search.integration.test.ts`.
- New protocol kinds: `graph_subgraph`, `graph_hubs`, `graph_path`, `stream_search`.
- New storage methods: `previousEventInSession`, `topProvenanceDegree`.
- New ProvenanceStore methods: `subgraph`, `topHubs`, `shortestPath`.
- WebDeps + ServerDeps gained an optional `reranker: AsyncReranker | null`.

## [1.1.0] — 2026-05-09

Major mem-subsystem expansion. 13 PRs (#8–#20) over a single audit-driven session, taking the memory system from a fragile capture-and-summarize pipeline to a self-maintaining knowledge graph with operator tooling and host-driven summarization. Test count 530 → 778, coverage 89.5 % → 92.6 %.

### Added — capture & retrieval

- **MCP host sampling drain** (PR #9) — when the host advertises `sampling`, the plugin delegates summarization to the host LLM via `sampling/createMessage`. No API key required inside Claude Code; GLM/Gemini/Ollama/Anthropic remain as direct-API fallbacks.
- **vec0 indexed retrieval** (PR #10) — `sqlite-vec` auto-loaded as an optional dep; `Storage.searchVec` replaces JS-side cosine when enabled. Backfill restores the vec table from existing embeddings on first boot.
- **Per-tool decay** (PR #10) — Edit/Write 30 d, Read 14 d, Bash 3 d, etc. Hits carry their originating tool through retrieval.
- **Corpus-wide IDF reranker** (PR #10) — IDF computed over recent 2 k summaries, cached with 5 % drift invalidation.
- **Async symbol annotation** (PR #13) — `events.symbols_json` populated by a background `SymbolWorker`; capture hot path no longer runs CDG / regex inline.
- **Cross-session continuity (`mem_thread`)** (PR #13) — surface other sessions sharing an `input_hash`.
- **Federation surface (`mem_federate_search`)** (PR #14) — cross-workspace consented search.
- **Symbol search (`mem_symbol_search`)** (PR #14) — match by `kind:name` exact or substring on the name.
- **Stats (`mem_stats`)** (PR #14) — throughput, backlog ETA, cache hit rate, top tools.
- **Replay (`mem_replay`)** (PR #15) — session chronology with summaries joined.
- **`mem_capture` MCP tool** (PR #15) — agents push facts directly with optional TTL.
- **Eight web UI HTTP endpoints** (PR #15) — stats, doctor, pinned, symbol-search, thread, replay, pin, unpin.
- **Live watch TUI** (PR #16) — `siftcoder watch` polling dashboard.
- **Eager drain** (PR #16) — `mem_search` ramps drain batch with backlog (8/16/32 above 50/200/500 pending).
- **`mem_context_budget`** (PR #16) — greedy fill: ranked summaries fitting under a token cap.
- **`mem_compact`** (PR #17) — VACUUM + cache prune + dim-mismatched embedding cleanup + FTS rebuild.
- **`mem_patterns`** (PR #17) — recurring `input_hash` buckets across sessions.
- **`mem_session_digest`** (PR #18) — concat session summaries into one chronological text.
- **`mem_auto_pin_patterns`** (PR #18) — one-shot curation: pin everything in a recurring pattern.
- **`siftcoder hooks <install|show>`** (PR #18) — bootstrap PostToolUse capture into `.claude/settings.local.json`.
- **`siftcoder capture` CLI** (PR #19) — closes the gap left by `hooks install`.
- **`siftcoder maintenance`** (PR #19) — one-shot nightly: sweep + compact (+ optional auto-pin).
- **`mem_as_of`** (PR #19) — point-in-time view: counts + summaries as they existed at a timestamp.
- **`mem_dashboard`** (PR #20) — single round-trip combined view (stats + doctor + pinned + patterns).

### Added — pinned summaries & schema

- **`pinned_at` column** (PR #11) — user-curated long-term memory exempt from supersede + decay.
- **`expires_at` column** (PR #12) — per-event TTL with automatic sweep.
- **`symbols_json` column** (PR #13) — async-populated symbol annotations.
- **`UNIQUE(session_id, input_hash)`** (PR #12) — kills the SELECT-then-INSERT TOCTOU race.
- **`UNIQUE INDEX on summaries(event_id)`** (PR #8) — enforces one summary per event at the DB layer.

### Added — operations

- **`mem doctor`** (PR #11) — integrity, orphans, vec0 cardinality drift, counts, pinned. `--heal` (PR #12) repairs drift in place.
- **`mem prune` / `mem retry`** (PR #9) — operational recovery for old skipped events and quota-poisoned queues.
- **`mem export` / `mem import`** (PR #12) — ndjson snapshot for migration / cross-machine sync.
- **`mem search` CLI** (PR #12) — one-shot hybrid search wrapper.
- **`mem auth-token [--rotate]`** (PR #16) — print or rotate the web UI bearer.
- **Daemon supervision** (PR #9) — pid-aliveness handshake, `uncaughtException` logging, `http.port` cleanup on shutdown, periodic counter snapshots.

### Fixed — correctness

- **Drain race + cache double-write** (PR #8) — `claimPending` with `BEGIN IMMEDIATE` + in-process write lock; `INSERT … ON CONFLICT DO NOTHING`.
- **WAL replay actually runs on boot** (PR #8) — daemon folds leftover frames back into SQLite, then truncates.
- **Retryable error policy** (PR #8) — quota / 429 / 5xx / network errors release back to `raw`; only `attempts ≥ 3` or terminal errors → `skipped`.
- **`siftcoder list`** (PR #8) — was returning `[]`; new `summaries` RPC + `Storage.recentSummaries`.
- **`siftcoder check`** (PR #8) — was emitting two contradictory JSON blobs.
- **`parseModelOutput` truncation handling** (PR #8) — strips ` ```json ` fences, recovers truncated `text` field.
- **vec0 dim now runtime-resolved** (PR #10) — was pinned at 384, mismatching nomic-embed-text's 768.
- **Storage facade encapsulation** (PR #9) — six `(storage as unknown as {db}).db` leak sites collapsed into typed methods.
- **Prepared-statement cache** (PR #9) — capture hot path no longer re-prepares identical SQL.
- **UDS multi-frame fix** (PR #12) — server no longer closes the connection on partial frames; large requests (10 KB+) split across multiple `data` events succeed.
- **`pg-worker.cjs` → `.mjs` filename mismatch** (PR #9) — was breaking PG bootstrap silently.
- **Pre-existing CI lint error in `pg-worker.mjs`** (PR #8) — TS syntax in a `.mjs` file unblocked all CI runs after months of failures.

### Security

- **Web auth uses `crypto.timingSafeEqual`** (PR #8) — was `===` despite a comment claiming "constant-time comparison".
- **Gemini API key in header, not URL query** (PR #8) — was leaking via proxy logs and exception stacks.

## [1.0.9] — 2026-05-02

### Fixed

- **Daemon no longer auto-shuts on idle.** `src/memory/daemon/index.ts` had a hardcoded `IDLE_SHUTDOWN_MS = 30 * 60 * 1000` that killed the daemon after 30 minutes without a socket connection. In practice this meant a quiet stretch in a Claude Code session (lunch, a meeting, deep reading) silently killed the daemon and subsequent `PostToolUse` captures dropped on the floor until the next `SessionStart` hook restarted it. Idle shutdown is now disabled by default. Set `SIFTCODER_IDLE_SHUTDOWN_MS=<ms>` to opt back in if you really want the cleanup behaviour.

## [1.0.8] — 2026-05-02

### Added

- **`siftcoder info` CLI subcommand** — full runtime snapshot in one place: package version, plugin manifest version, Node/platform/arch, install root, namespace, workspace key + cwd + git toplevel, daemon state with pid + uptime, socket/db/pid file paths, web URL (when bridge is up), backend availability (Ollama probe, Anthropic key configured), event/summary/embedding counts, and DB size on disk. Supports human-readable default and `--json` for piping.
- **`/siftcoder:mem info [--json]`** — same data, exposed via the existing memory slash command. Also documents `version` as a discrete action.
- **SiftCoder Field Guide** — new long-form documentation site at [ialameh.github.io/sift-coder](https://ialameh.github.io/sift-coder/). Built with mkdocs-material, light/dark toggle, full-text search, sticky tab nav, code copy buttons, edit-on-GitHub links. Auto-deploys on every push to `main` via `.github/workflows/docs.yml`. Source lives in `docs/`. Quickstart, Foundations, Operations, Reference, Salesforce, Cookbook, and Project tabs.

## [1.0.7] — 2026-05-02

### Fixed

- **`bin/siftcoder.mjs`** — `siftcoder backfill` was broken: `rpc('backfill', { source })` called `rpc()` with two positional args, but `rpc()` takes a single request object. Daemon received the bare string `"backfill"`, returned nothing, and the CLI crashed with `Error: short response`. Now sends `rpc({ kind: 'backfill', source })` and uses a 5-minute timeout (vs. the 5s default) since transcript scans can take a while.
- **Daemon `backfill` RPC was never implemented.** Added a `backfill` case to `src/memory/daemon/server.ts` that scans `~/.claude/projects/<encoded-cwd>/*.jsonl`, parses tool-use frames via `replay.ts`, and ingests them through the same WAL + storage path as live `capture` events. Deduplicates against existing rows by `(session_id, input_hash)`. Returns `{ scanned, captured, skippedDuplicate, errors }`.
- **`src/memory/storage/storage.ts`** — added `hasEvent(sessionId, inputHash)` to support backfill's dedupe check.
- **`src/memory/protocol.ts`** — added `BackfillRequest` shape + `'backfill'` to `RequestKind`.

### Removed

- **Stale `dist/memory/migration/v2-import.*` orphans.** The source `src/memory/migration/v2-import.ts` was deleted in an earlier release, but the compiled artifacts lingered in `dist/`. No code referenced them. `npm run clean && npm run build` removes them on this release.

## [1.0.6] — 2026-05-01

### Changed

- **Default namespace renamed `v3` → `default`.** The `v3` marker (visible in `siftcoder status` output as `"namespace": "v3"`) was a leftover from internal "third generation" naming during the rebuild and confused public users. State now lives at `~/.siftcoder/default/` instead of `~/.siftcoder/v3/`.
- **Auto-migration on first run.** `hooks/session-start/ensure-built.mjs` checks for legacy `~/.siftcoder/v3/` and atomically renames to `~/.siftcoder/default/` when the new dir doesn't exist. Logs `namespace-migrated` event. Idempotent. No data loss.
- Updated 18 file defaults: `bin/`, `monitors/`, all 8 hooks, `scripts/setup.mjs`, `src/core/{config,paths}.ts`, `src/memory/workspace.ts`, `.claude-plugin/plugin.json`, `.mcp.json`, `settings.json`.

### Notes

- Override via `SIFTCODER_NS=<name>` env var still works for users who explicitly want isolation.
- If you set `SIFTCODER_NS=v3` explicitly, migration is skipped and you stay on the legacy path.

## [1.0.5] — 2026-05-01

### Fixed

- **`scripts/setup.mjs`** — header read literal `"SiftCoder v3 setup"` (leftover from internal "third generation" naming during the rebuild). Now reads version from `package.json` so output matches the public release: `SiftCoder v1.0.5 setup`. Internal `~/.siftcoder/v3/` namespace path stays unchanged — it's the state-isolation marker, not the public version.

## [1.0.4] — 2026-05-01

Hotfix: `scripts/setup.mjs` crashed with `ERR_USE_AFTER_CLOSE` when stdin was not a TTY (e.g. running setup via `node bin/siftcoder.mjs setup < /dev/null` or under any non-interactive pipe). Readline.question fired against a closed stream.

### Fixed

- **`scripts/setup.mjs`** — detects non-TTY stdin via `process.stdin.isTTY`. Skips the `ANTHROPIC_API_KEY` prompt in non-interactive mode and prints a hint to export the env var instead. Writes config either way using whatever's already in the environment. Interactive TTY behaviour unchanged.

## [1.0.3] — 2026-05-01

Hotfix on top of v1.0.2: the v1.0.2 native-binding probe used `require('better-sqlite3')` only, which can pass when the binding loads OK but actually fails at the first SQLite call (Node-25 / prebuild-ABI mismatch case). The probe missed the case it was added to catch.

### Fixed

- **`hooks/session-start/ensure-built.mjs`** — probe now opens an in-memory DB and runs `select 1` to verify the binding works at runtime, not just at load. Catches the load-OK / runtime-broken case. 10s budget. Triggers `npm rebuild better-sqlite3` correctly when needed.

## [1.0.2] — 2026-05-01

Hotfix: on Node majors that ship ahead of `better-sqlite3` prebuilt binaries (e.g. Node 25 in 2026), `require('better-sqlite3')` crashes at module load and the WASM fallback also fails on init. Result: `siftcoder status`, the daemon, and the MCP server all fall over.

### Fixed

- **`hooks/session-start/ensure-built.mjs`** — after `npx tsc`, probes the native binding via a 8s subprocess `node -e "require('better-sqlite3')"`. On failure, runs `npm rebuild better-sqlite3 --silent` (180s budget) and re-probes. On second failure, drops an install-error flag with the manual recovery command and logs to `~/.siftcoder/v3/logs/install.ndjson` (events `native-rebuild`, `native-rebuild-ok`, `native-rebuild-fail`).
- Idempotent: probe is fast (~30ms) when binding works; rebuild only fires when needed.

### Manual recovery (if auto-rebuild is blocked)

```bash
! cd ~/.claude/plugins/cache/siftcoder-marketplace/siftcoder/<version> && npm rebuild better-sqlite3
```

## [1.0.1] — 2026-05-01

Hotfix: plugin marketplace installs were missing `dist/` (clones don't run `npm install`), so `bin/siftcoder.mjs` and the MCP server failed with `ERR_MODULE_NOT_FOUND` on first use.

### Fixed

- **`hooks/session-start/ensure-built.mjs`** (NEW) — auto-runs `npm install` (if needed) then `npx tsc` on first session start when `dist/memory/mcp/server.js` is missing or stale relative to `src/`. Idempotent. Logs to `~/.siftcoder/v3/logs/install.ndjson`. Budget 300s on first run, < 50ms on subsequent.
- **`hooks/session-start/install-error-banner.mjs`** (NEW) — surfaces a one-shot user-facing banner with the exact `! cd … && npm install && npm run build` command if `ensure-built.mjs` fails. Auto-clears after first display.
- **`scripts/postinstall.mjs`** — also builds `dist/` if absent (covers `npm install` paths). Falls back gracefully if `npx tsc` fails.
- **`bin/siftcoder.mjs`** — preflight `ensureBuilt()` check on `openStorage()` surfaces a clear error message with the exact recovery command instead of an opaque `ERR_MODULE_NOT_FOUND`.
- **`docs/TROUBLESHOOTING.md`** — new "Install" section documenting the auto-fix + manual command.

### Hooks count

7 active + 1 opt-in unchanged. SessionStart now chains 3 hooks: `ensure-built` → `spawn-daemon` → `install-error-banner`. All non-blocking.

## [1.0.0] — 2026-05-01

Initial public release.

### Memory engine
- Persistent per-workspace memory daemon with UDS RPC, dual SQLite backends (native + WASM), RRF retrieval, Ebbinghaus decay, typed provenance graph (`mem_why`).
- Local-LLM defaults via Ollama (summarisation + embeddings); Anthropic API as opt-in fallback. ~50× steady-state token-cost reduction.
- MCP server `siftcoder-memory` exposing `mem_search`, `mem_get`, `mem_timeline`, `mem_why`, `mem_drain` to Claude Code natively.
- Memory daemon health monitor (`monitors/memory-daemon-health.mjs`).

### Plugin surface
- **96 skills** across 12 family folders (coding, reasoning, quality, review, knowledge, docs, workflow, spec, salesforce, integrations, ux, meta). Each skill is a workflow contract with method, output shape, hard rules, anti-patterns, when-NOT-to-use, and value-add over native Claude Code.
- **107 slash commands** — thin wrappers + multi-verb consolidations like `/siftcoder:mem [start|status|drain|setup|web|backfill]`.
- **15 agents** — 4 Salesforce-domain (`salesforce-architect`, `apex-bulkifier`, `lwc-debugger`, `memory-curator`) plus 11 disciplined generics (`planner`, `coder`, `qa-reviewer`, `qa-fixer`, `reviewer`, `documenter`, `tester`, `investigator`, `orchestrator`, `analyst`, `bridge-analyzer`).
- **7 hooks** under `hooks/<event>/<name>.mjs`: `boundary-enforcer` (PreToolUse), `capture-observation` + `detect-console-logs` (PostToolUse), `inject-memories` (PreCompact), `pin-incident` (Notification), `spawn-daemon` (SessionStart), `should-continue` (Stop). Plus opt-in `auto-checkpoint` (disabled by default).
- **1 monitor** — 30s UDS ping + ndjson health log.

### Salesforce
- Domain skills: `salesforce-apex`, `salesforce-lwc`, `salesforce-deploy`, `salesforce-architecture`, `salesforce-test`, `salesforce-flow`, `salesforce-cpq`, `salesforce-agentforce`, `salesforce-einstein`, `salesforce-security`, `salesforce-comply`, `schema-migrate`.
- Domain agents: `salesforce-architect` (read-only architecture review), `apex-bulkifier` (targeted bulk-safety refactor), `lwc-debugger` (LWC issue diagnosis).
- Webhook scaffold (`/siftcoder:sf-webhook`) ships with HMAC verification and timestamp window by default.

### Tooling
- CLI at `bin/siftcoder.mjs` — `setup`, `start`, `stop`, `status`, `drain`, `backfill`, `web`, `version`.
- Plugin `settings.json` with safe defaults for hook timeouts, drain backend cascade, embedder cascade, retention windows.
- GitHub Actions CI — matrix across ubuntu/macos/windows × Node 20/22.
- ESLint + Prettier + TypeScript strict + Vitest baseline.
- Coverage gate: 96% lines, 98% branches/functions across the memory engine.

### Security
- Boundary enforcer hook reads scope from `.siftcoder/scope.json` and blocks Write/Edit outside listed allow-globs.
- Local-only data path: capture stays on disk; drain through Ollama keeps payloads on the user's machine.
- PII redaction at hook edge (8 built-in patterns: AWS / GitHub / Anthropic / OpenAI / Bearer / JWT / email / phone).
- Web bridge bound to 127.0.0.1 only; bearer token at `~/.siftcoder/auth.token` (mode 0600).
