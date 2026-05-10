# SiftCoder Architecture

This document is the design contract; all source must conform.

## 1. Design thesis

Modern Claude Code already provides:

- Built-in subagent dispatch (`Task` / fork-self), `Plan` agent, `Explore` agent, `general-purpose` agent
- Native plan mode, todo/task tracking, ScheduleWakeup
- First-class skill system (`Skill` tool, autoloaded by manifest)
- First-class MCP support
- First-class hook system
- Built-in `/review`, `/security-review`, `/init` etc.
- Prompt caching, thinking, tool use orchestration baked into the SDK

SiftCoder adds durable value on top of Claude Code instead of reimplementing native behavior for its own sake.

The unique additive value:

1. **Persistent, queryable memory** across sessions, with provenance, decay, RRF retrieval, and cause-graph reasoning. Claude Code has no persistent memory.
2. **Local-LLM offload** (Ollama) for high-frequency cheap operations (summarisation, embeddings, reranking) — cuts token cost by ~50× on repeat sessions.
3. **Salesforce domain expertise** as skills/agents — Apex, LWC, Schema, Deploy, Architect — where Claude Code has no domain bias.
4. **Composable observability hooks** that feed memory without altering the user's workflow.
5. **Opinionated workflow contracts** for build, fix, investigate, review, test, autonomous work, docs, quality, ideation, and compression. These guide native Claude Code capabilities, not fight them.

## 2. System overview

```
┌──────────────────────────────────────────────────────────────────────┐
│                          Claude Code session                         │
│                                                                      │
│  user ↔ assistant ↔ [native subagents | Plan | Explore | general]    │
│              │                                                       │
│              ├─ Skills (siftcoder/*)        ─── markdown guidance    │
│              ├─ Slash commands (siftcoder/*) ── thin wrappers        │
│              ├─ MCP tools (siftcoder-memory) ── 29 mem_* tools (v1.2) │
│              └─ Hooks (PreTool / PostTool / PreCompact / Stop / …)   │
│                          │                                           │
└──────────────────────────┼───────────────────────────────────────────┘
                           │ UDS RPC + MCP stdio
                           ▼
┌──────────────────────────────────────────────────────────────────────┐
│   siftcoder daemon  (TypeScript, Node ≥20)                           │
│                                                                      │
│   ┌─ MCP server (stdio)  ────────  exposes mem_* tools to CC         │
│   ├─ UDS server  (~/.siftcoder/run/{wsHash}.sock)                    │
│   │                                                                  │
│   ├─ Storage (SQLite native + WASM parity, vec0 indexed retrieval)   │
│   ├─ Retrieval (BM25 + dense vector → RRF → decay → reranker)        │
│   │   ├─ streamingHybridSearch — emits BM25/vector/final stages      │
│   │   └─ optional cross-encoder via SIFTCODER_RERANKER_URL (HTTP)    │
│   ├─ Provenance (typed edge graph + auto-edge inference)             │
│   │   subgraph BFS, shortestPath, topHubs                            │
│   ├─ Summariser (Haiku → confidence eval → Sonnet escalation)        │
│   ├─ Embedder (Ollama → CDG → deterministic fallback)                │
│   ├─ Consolidator (dedup, merge, prune)                              │
│   ├─ MCP eager-drain loop (adaptive backoff, sampling-driven)        │
│   └─ HTTP sidecar (read-only SPA: 11 tabs)                           │
│                                                                      │
└──────────────────────────────────────────────────────────────────────┘
                           │
                           ▼
                    local Ollama (optional)
                    Anthropic API (fallback)
```

## 3. Plugin component model

| Mechanism | Used? | Rationale |
|---|---|---|
| `.claude-plugin/plugin.json` | yes | manifest |
| `settings.json` (plugin defaults) | yes | safe defaults for timeouts/modes |
| `skills/` | yes (96) | workflow contracts, organised by family |
| `agents/` | yes (15) | domain agents plus disciplined generic agents that add memory grounding, evidence ledgers, scope control, or output contracts |
| `commands/` | yes (107) | thin slash wrappers over high-value skills |
| `hooks/` | yes (7) | only memory + safety hooks; quality-gates moved to on-demand skill |
| `monitors/` | yes (1) | memory-daemon health |
| `bin/` | yes | `siftcoder` CLI for setup, drain, status |

## 4. Module responsibility map

```
src/
├── core/                    plugin-wide primitives
│   ├── config.ts            schema-validated config loader (env + file)
│   ├── paths.ts             XDG-style path resolution
│   ├── logger.ts            structured ndjson logger
│   └── errors.ts            typed error classes
│
├── memory/                  the memory engine
│   ├── daemon/              UDS server, lifecycle, WAL
│   ├── mcp/                 MCP server, handler, sampling bridge
│   ├── storage/             dual-backend (better-sqlite3 + node-sqlite3-wasm)
│   ├── retrieval/           RRF fusion + decay
│   ├── provenance/          typed edge graph + BFS
│   ├── summarizer/          cache → Haiku → confidence → Sonnet
│   ├── embedders/           ollama / cdg / deterministic
│   ├── consolidator/        dedup, merge, prune
│   ├── reranker/            optional Claude rerank
│   └── web/                 read-only HTTP UI
│
├── services/                workflow helpers with persistent project state
│   ├── chroot.ts            glob-pattern file jail state
│   ├── state.ts             scope/checkpoint state
│   ├── reverse-prompt.ts    repo-to-prompt extraction
│   └── tokens.ts            token budget helpers
│
└── utils/                   shared file/tree/fingerprint helpers
```

## 5. Plugin component map

### Skills (96)
Skills are the primary value surface. They are grouped by family:

- `coding` — build, fix, add-feature, investigate, heal, tdd, pair, refactor, optimize, zen
- `workflow` — autonomous, swarm, pause, continue, handoff, checkpoint, session-eval, smart-retry, preview, scope, chroot
- `quality` + `review` — blast-radius, chaos, fuzz, invariant, review, security, comply, timewarp, ripple, polyglot
- `knowledge` — memory usage and pattern learning/search
- `docs` + `spec` — codemap, documentation, reverse spec, gap analysis, feasibility
- `salesforce` — Apex, LWC, deploy, architecture, test, Flow, CPQ, Agentforce, Einstein, security, compliance
- `ux` — ideate, surprise-me, reverse-prompt
- `meta` — compression, local LLM setup, prompt/sync/team/trace/onboard/siftcoder

### Agents (15)
Agents are kept only when they add a stricter contract than native dispatch:

- Domain: `salesforce-architect`, `apex-bulkifier`, `lwc-debugger`, `memory-curator`
- Disciplined generic: `planner`, `coder`, `qa-reviewer`, `qa-fixer`, `reviewer`, `documenter`, `tester`, `investigator`, `orchestrator`, `analyst`, `bridge-analyzer`

The generic agents must add value through memory grounding, evidence ledgers, scope refusal, deviation protocol, or structured output. If an agent does not maintain that edge, delete it.

### Slash commands (107)
Commands are thin entry points into skills. This is intentional: direct slash invocation is still useful, but behaviour belongs in skills/agents so native Claude Code can compose it.

High-value groups:

- `/siftcoder:mem` — memory daemon operations
- `/siftcoder:sf-*`, `/siftcoder:lwc`, `/siftcoder:apex-patterns`, `/siftcoder:schema` — Salesforce work
- `/siftcoder:build`, `/siftcoder:fix`, `/siftcoder:review`, `/siftcoder:security`, `/siftcoder:tdd`, `/siftcoder:refactor` — workflow contracts
- `/siftcoder:ideate`, `/siftcoder:surprise-me`, `/siftcoder:compress`

### Hooks (7)
| Event | Hook | Purpose |
|---|---|---|
| `PreToolUse` (Read|Write|Edit) | `boundary-enforcer.mjs` | block writes outside scope; transparent failure |
| `PostToolUse` (Read|Write|Edit|Bash|Grep|Glob) | `capture-observation.mjs` | feed memory daemon |
| `PostToolUse` (Write|Edit) | `detect-console-logs.mjs` | warn on console.log |
| `PreCompact` | `inject-memories.mjs` | top-k memories into compact context |
| `Notification` | `pin-incident.mjs` | high-priority capture (permission prompts, errors) |
| `SessionStart` | `spawn-daemon.mjs` | idempotent daemon boot with native binding self-heal |
| `Stop` | `should-continue.mjs` | optional continuation hint |

Quality gates run via on-demand `/siftcoder:quality` skill. Checkpoint/handoff are explicit workflow skills, not hidden automation. Compression is a skill backed by companion plugin state.

### MCP server
`siftcoder-memory` exposes 29 tools (v1.2.x). Declared inline in `plugin.json`.

**Retrieval & state:** `mem_search`, `mem_get`, `mem_timeline`, `mem_why`, `mem_replay`, `mem_thread`, `mem_federate_search`, `mem_symbol_search`, `mem_context_budget`, `mem_as_of`, `mem_session_digest`, `mem_dashboard`, `mem_stats`.

**Capture & curation:** `mem_capture`, `mem_pin`, `mem_unpin`, `mem_pinned`, `mem_auto_pin_patterns`, `mem_patterns`.

**Knowledge graph (v1.2):** `mem_graph_subgraph`, `mem_graph_hubs`, `mem_graph_path`. Bidirectional BFS subgraph extraction, top-degree node ranking, undirected shortest path. Provenance graph seeded automatically by the auto-edges module on every capture.

**Operations:** `mem_drain`, `mem_prune`, `mem_retry`, `mem_doctor`, `mem_compact`, `mem_sweep_expired`, `mem_export`, `mem_import`.

**Drain backend:** when the host advertises `sampling`, the MCP server delegates summarization to the host LLM via `sampling/createMessage` — no API key required. Otherwise falls back to GLM → Gemini → Ollama → Anthropic-direct on the daemon. See `src/memory/mcp/handler.ts` (drainViaSampling) and `src/memory/mcp/server.ts` (bidirectional StdioBridge).

**Eager-drain loop (v1.2):** `src/memory/mcp/drain-loop.ts` polls daemon backlog without waiting for `mem_search`. Adaptive backoff (2× per empty tick, capped) keeps idle workspaces quiet; resets to base cadence on a productive drain. `SIFTCODER_MCP_DRAIN_MS` (default 60s; 0 disables), `SIFTCODER_MCP_DRAIN_BATCH` (default 4).

**Streaming search (v1.2):** `mem stream-search` and the `stream_search` RPC kind emit BM25 → vector → final stages as separate frames on one socket connection. `MemoryClient.sendStream` is an AsyncGenerator with per-frame progress timeout. Total wall-clock matches non-streaming; perceived latency improves.

**Cross-encoder reranker (v1.2):** opt-in HTTP scoring via `SIFTCODER_RERANKER_URL`. Auto-detects Jina/TEI (`{scores}`) and Cohere (`{results}`) shapes. Fails open: any scoring error falls back to baseline RRF order. Reachability surfaced in `mem doctor` and the SPA Health tab.

**Auto-edge inference (v1.2):** `src/memory/auto-edges.ts` writes provenance edges as events land:
- File tools (Edit, Write, Read, MultiEdit, NotebookEdit) → `event:N --edits--> file:<path>`
- Bash → `event:N --references--> file:<path>` for path-tokens (deduped)
- Sequential events in same session → `event:N --derives_from--> event:N-1`

All inferred edges tagged `source='auto'` to distinguish from CDG / human edges. `SIFTCODER_AUTO_EDGES=0` disables. Means `mem_graph_*` produce non-empty results on a fresh workspace.

### HTTP API & web UI

`/api/*` routes mirror RPC kinds 1:1 where useful. New in v1.2: `/api/sessions`, `/api/patterns`, `/api/session-digest`, `/api/as-of`, `/api/graph/subgraph`, `/api/graph/hubs`, `/api/graph/path`.

SPA tabs (v1.2): Overview, Health, Events, Summaries, Pinned, Sessions (with replay), Search, Symbol, Provenance, Graph (subgraph + path-finder + hubs sidebar), Patterns, A/B savings.

### Monitors
`memory-daemon-health.mjs` — pings UDS socket every 30s, logs and surfaces in `/siftcoder:mem status`.

### Bin
`bin/siftcoder` — CLI: `setup`, `start`, `stop`, `status`, `drain`, `backfill`, `web`, `version`.

### Plugin settings
`settings.json` ships safe defaults: hook timeouts, drain backend cascade order, embedder cascade, retention windows, decay tau, RRF k.

## 6. Data flow

**Capture path (every tool use):**
```
tool result
  → PostToolUse capture-observation.mjs (250ms budget, fire-and-forget)
  → UDS frame → daemon
  → WAL append → events table
  → auto-edges.ts inferEdgesForEvent (file edits, Bash references,
    derives_from chain to prior event in session)
  → provenance_edges INSERT (source='auto')
```

**Drain path (background, MCP-side preferred):**
```
mem_search OR runPeriodicDrain tick (eager-drain loop, MCP-side)
  → MCP server checks samplingTransport availability
    ├─ available  → status probe (raw count) — short-circuit if 0 (backoff)
    │              → claim_for_summary (atomic raw → claimed)
    │              → for each: cache_get → host sampling/createMessage → record_summary
    │              → release_summary on retryable error (back to raw)
    └─ unavailable → daemon-side runDrain (GLM → Gemini → Ollama → Anthropic cascade)
  → INSERT summary + (vec0 if loaded) embedding via SymbolWorker-decoupled write
```

**Retrieval path (mem_search):**
```
MCP tool call mem_search(query, k=10)
  → status probe (eager-drain ramp by backlog: 8/16/32 above 50/200/500)
  → drain pending (sampling- or daemon-side, see above)
  → tokenise → BM25 over FTS5 (joined with events for tool propagation)
  → embed query → vec0 MATCH if loaded, else JS-side cosine
  → RRF fuse → per-tool Ebbinghaus decay (Edit 30d, Bash 3d, etc.)
  → pinned summaries exempt from supersede sieve
  → optional cross-encoder rerank (HTTP, fails open)
  → return top-k summaries + tool + provenance hints
```

**Streaming retrieval path (stream_search):**
```
mem stream-search "<query>"
  → server.ts socket loop branches on kind === 'stream_search'
  → streamingHybridSearch:
      emit { stage: 'bm25',   hits: searchFts(...) }    (~5ms)
      emit { stage: 'vector', hits: vec0 / cosine }      (after embed RT)
      emit { stage: 'final',  hits: full hybridSearch }  (full pipeline)
  → server writes terminator { done: true }
  → MemoryClient.sendStream yields each frame as it lands
```

**Knowledge graph path (mem_graph_*):**
```
mem_graph_subgraph { kind, id, maxDepth, direction, edgeType, maxEdges }
  → ProvenanceStore.subgraph BFS in either / both directions
  → returns { nodes, edges } with maxEdges hub cap

mem_graph_path { fromKind/Id, toKind/Id, maxDepth }
  → bidirectional BFS treating edges as undirected for connectivity
  → returns ordered Edge[] (directed) or null

mem_graph_hubs { limit, kind? }
  → Storage.topProvenanceDegree (UNION ALL on edges, group by node)
  → returns { node, degree, outDegree, inDegree }
```

**PreCompact path:**
```
Claude Code emits PreCompact
  → inject-memories.mjs reads transcript tail
  → mem_search for top 8 relevant
  → emit as system context (kept after compact)
```

## 7. Plugin lifecycle

1. **Install** — `git clone` + `npm install` (postinstall does native binding self-heal). Plugin auto-discovered by Claude Code from `.claude-plugin/plugin.json`.
2. **Session start** — `spawn-daemon.mjs` checks PID/socket; if absent, spawns daemon detached. Non-blocking.
3. **First UserPromptSubmit** — daemon ready; injects context summary into system block.
4. **During session** — capture hooks feed daemon; MCP tools query it; PreCompact inject preserves memory across compaction.
5. **Session stop** — daemon stays running (other sessions may use it); `should-continue` hook may suggest next steps.
6. **Idle** — consolidator drains pending events using local Ollama where available.

## 8. Extension points

- **New embedder backend:** implement `Embedder` interface in `src/memory/embedders/`, register in cascade.
- **New summariser backend:** implement `LLMClient` in `src/llm/`, add to env-driven backend resolver.
- **New cross-encoder backend:** implement `CrossEncoder.score(query, docs[])` in `src/memory/cross-encoder.ts`. Plug via `daemon/index.ts` boot block. Ping support via `crossEncoderToReranker`.
- **New skill:** add `skills/<name>/SKILL.md` with frontmatter — auto-discovered.
- **New agent:** add `agents/<name>.md` with frontmatter — auto-discovered.
- **New slash command:** add `commands/<name>.md` — auto-discovered.
- **New hook:** add `hooks/<event>/<name>.mjs` and register in `plugin.json` `hooks` block.
- **New auto-edge rule:** extend `inferEdgesForEvent` in `src/memory/auto-edges.ts`. Tag `source='auto'` for distinguishability.
- **New streaming kind:** add to `RequestKind` union, branch in `server.ts` socket loop with multi-frame writes ending in `{ done: true }`.

## 9. Design decisions

**D1. Local-first defaults.** Ollama before Anthropic, deterministic embedder as floor. Reduces token cost ~50× on repeat sessions; works offline.

**D2. Single multi-verb command pattern.** `/siftcoder:mem [action]` instead of many `mem-*` commands. Lower discovery cost.

**D3. Hooks are observers, not enforcers.** No long blocking chains. Quality checks are explicit.

**D4. Dual SQLite backends preserved.** Native for speed, WASM for portability. Parity-tested in CI.

**D5. Provenance is a first-class concept.** `mem_why` differentiates SiftCoder from any RAG-style memory.

**D6. ESLint + Prettier + TS strict + Vitest + GitHub Actions CI** mandatory baseline.

**D7. README stays under 250 lines.** Long-form docs go in `docs/`.

**D8. Cross-encoder reranker is HTTP, not bundled.** Bundling onnxruntime would add ~50MB of native deps to a CLI plugin for a 5–15% NDCG lift. The HTTP boundary lets users opt into the cost (TEI, Jina, Cohere, local sentence-transformers) only when the lift matters. Failures fall back to the RRF baseline order — never break search.

**D9. Streaming uses one-call-multi-frame, not request_id correlation.** Each `MemoryClient.send` opens its own UDS connection. Multi-frame on a single connection is sufficient for streaming; introducing request-id keying would complicate the protocol for no current consumer.

**D10. Auto-edges run synchronously inside capture.** One INSERT per edge is cheap relative to FTS5 maintenance. A worker-queued model would add coordination overhead without latency wins. The provenance graph stays warm and useful from event 1.

**D11. Auto-edge `source` tag is load-bearing.** The provenance graph mixes auto-inferred, CDG-imported, and human-curated edges. Filtering by `source` lets graph queries scope to a trust level when that matters.

## 10. Open risks

- Ollama installation gating local-LLM benefits — mitigated by graceful Anthropic fallback + `/siftcoder:mem setup` walkthrough
- WASM SQLite backend can't load `sqlite-vec`; vector search stays JS-side until corpus > ~10k summaries
- License/provenance audit on `vendor/sift-compress/` before bundling
