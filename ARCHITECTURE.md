# SiftCoder Architecture

Version 3.0 — rewrite of legacy v2.x ("SiftCoder V1"). This document is the design contract; all source must conform.

## 1. Design thesis

Modern Claude Code already provides:

- Built-in subagent dispatch (`Task` / fork-self), `Plan` agent, `Explore` agent, `general-purpose` agent
- Native plan mode, todo/task tracking, ScheduleWakeup
- First-class skill system (`Skill` tool, autoloaded by manifest)
- First-class MCP support (`.mcp.json`)
- First-class hook system (`hooks.json`)
- Built-in `/review`, `/security-review`, `/init` etc.
- Prompt caching, thinking, tool use orchestration baked into the SDK

**SiftCoder must preserve every valuable V1 job-to-be-done, but not every V1 interface or implementation.** It should add durable value on top of Claude Code instead of reimplementing native behavior for its own sake.

The unique additive value:

1. **Persistent, queryable memory** across sessions, with provenance, decay, RRF retrieval, and cause-graph reasoning. *Claude Code has no persistent memory.*
2. **Local-LLM offload** (Ollama) for high-frequency cheap operations (summarisation, embeddings, reranking) — cuts token cost by ~50× on repeat sessions.
3. **Salesforce domain expertise** as skills/agents — Apex, LWC, Schema, Deploy, Architect — where Claude Code has no domain bias.
4. **Composable observability hooks** that feed memory without altering the user's workflow.
5. **Opinionated workflow contracts** for valuable V1 workflows: build, fix, investigate, review, test, autonomous work, docs, quality, ideation, and compression. These should guide native Claude Code capabilities, not fight them.

V2 is a total replacement for V1, not a compatibility layer. V1 command names may disappear, but V1 value must remain when it is real: autonomous safety, project discovery, Salesforce depth, quality discipline, ideation, compression, docs, and memory.

## 2. System overview

```
┌──────────────────────────────────────────────────────────────────────┐
│                          Claude Code session                         │
│                                                                      │
│  user ↔ assistant ↔ [native subagents | Plan | Explore | general]    │
│              │                                                       │
│              ├─ Skills (siftcoder/*)        ─── markdown guidance    │
│              ├─ Slash commands (siftcoder/*) ── thin wrappers        │
│              ├─ MCP tools (siftcoder-memory) ── mem_search, mem_why… │
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
│   ├─ Storage (SQLite native + WASM parity)                           │
│   ├─ Retrieval (BM25 + dense vector → RRF → Ebbinghaus decay)        │
│   ├─ Provenance (typed edge graph: causes/derives_from/calls/…)      │
│   ├─ Summariser (Haiku → confidence eval → Sonnet escalation)        │
│   ├─ Embedder (Ollama → CDG → deterministic fallback)                │
│   ├─ Consolidator (dedup, merge, prune)                              │
│   └─ HTTP sidecar (optional read-only web UI)                        │
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
| `.mcp.json` | yes | MCP config extracted from plugin.json (cleaner, more conventional) |
| `settings.json` (plugin defaults) | yes | safe defaults for timeouts/modes |
| `skills/` | yes (84) | workflow contracts covering V1 value areas, reorganized by family |
| `agents/` | yes (12) | domain agents plus disciplined generic agents that add memory grounding, evidence ledgers, scope control, or output contracts |
| `commands/` | yes (87) | thin slash wrappers over high-value skills; V1 aliases are not preserved for compatibility |
| `hooks/hooks.json` | yes (7 hooks) | only memory + safety hooks; quality-gates moved to on-demand skill |
| `monitors/` | yes (1) | memory-daemon health |
| `bin/` | yes | `siftcoder` CLI for setup, drain, status |
| `.lsp.json` | no | LSP is for IDE language servers; no plugin use case |

## 4. Module responsibility map

```
src/
├── core/                    plugin-wide primitives
│   ├── config.ts            schema-validated config loader (env + file)
│   ├── paths.ts             XDG-style path resolution
│   ├── logger.ts            structured ndjson logger
│   └── errors.ts            typed error classes
│
├── memory/                  the memory engine (ported from V1, modularised)
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

### Skills (84)
Skills are the primary replacement surface for V1 value. They are grouped by family:

- `coding` — build, fix, add-feature, investigate, heal, tdd, pair, refactor, optimize, zen
- `workflow` — autonomous, swarm, pause, continue, handoff, checkpoint, session-eval, smart-retry, preview, scope, chroot
- `quality` + `review` — blast-radius, chaos, fuzz, invariant, review, security, comply, timewarp, ripple, polyglot
- `knowledge` — memory usage and pattern learning/search
- `docs` + `spec` — codemap, documentation, reverse spec, gap analysis, feasibility
- `salesforce` — Apex, LWC, deploy, architecture, test, Flow, CPQ, Agentforce, Einstein, security, compliance
- `ux` — ideate, surprise-me, reverse-prompt
- `meta` — compression, local LLM setup, prompt/sync/team/trace/onboard/siftcoder

### Agents (12)
Agents are kept only when they add a stricter contract than native dispatch:

- Domain: `salesforce-architect`, `apex-bulkifier`, `lwc-debugger`, `memory-curator`
- Disciplined generic: `planner`, `coder`, `qa-reviewer`, `qa-fixer`, `reviewer`, `documenter`, `tester`, `investigator`

The generic agents are not here for compatibility. They must add value through memory grounding, evidence ledgers, scope refusal, deviation protocol, or structured output. If an agent does not maintain that edge, delete it.

### Slash commands (87)
Commands are thin entry points into skills. This is intentional: direct slash invocation is still useful, but behavior belongs in skills/agents so native Claude Code can compose it.

High-value groups:

- `/siftcoder:mem` — memory daemon operations
- `/siftcoder:sf-*`, `/siftcoder:lwc`, `/siftcoder:apex-patterns`, `/siftcoder:schema` — Salesforce work
- `/siftcoder:build`, `/siftcoder:fix`, `/siftcoder:review`, `/siftcoder:security`, `/siftcoder:tdd`, `/siftcoder:refactor` — V1 workflow value retained as skill contracts
- `/siftcoder:ideate`, `/siftcoder:surprise-me`, `/siftcoder:compress` — intentionally retained and expanded

### Hooks (7, down from 13)
| Event | Hook | Purpose |
|---|---|---|
| `PreToolUse` (Read|Write|Edit) | `boundary-enforcer.mjs` | block writes outside scope; transparent failure |
| `PostToolUse` (Read|Write|Edit|Bash|Grep|Glob) | `capture-observation.mjs` | feed memory daemon |
| `PostToolUse` (Write|Edit) | `detect-console-logs.mjs` | warn on console.log |
| `PreCompact` | `inject-memories.mjs` | top-k memories into compact context |
| `Notification` | `pin-incident.mjs` | high-priority capture (permission prompts, errors) |
| `SessionStart` | `spawn-daemon.mjs` | idempotent daemon boot with native binding self-heal |
| `Stop` | `should-continue.mjs` | optional continuation hint |

Removed from automatic hooks, not removed from value:

- Quality gates moved from blocking PostToolUse chain to `/siftcoder:quality`.
- Checkpoint/handoff moved from hidden automation to explicit workflow skills.
- Compression remains a skill and can be backed by companion plugin state.

### MCP server
`siftcoder-memory` exposing `mem_search`, `mem_get`, `mem_timeline`, `mem_why`, `mem_drain`. Declared in `.mcp.json`.

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
```

**Drain path (background):**
```
consolidator tick
  → SELECT events WHERE summary IS NULL LIMIT 16
  → for each: cache lookup (model||prompt_hash||input_hash)
              ↓ miss
              Ollama (local) → confidence eval → Sonnet escalate if low
  → INSERT summary + provenance edges
```

**Retrieval path (mem_search):**
```
MCP tool call mem_search(query, k=10)
  → tokenise → BM25 over FTS5
  → embed query → cosine over summaries
  → RRF fuse → apply Ebbinghaus boost
  → optional rerank (Claude or local cross-encoder)
  → return top-k summaries + provenance hints
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
3. **First UserPromptSubmit** — daemon ready; injects context summary into system block (replaces V1 SessionStart inject chain).
4. **During session** — capture hooks feed daemon; MCP tools query it; PreCompact inject preserves memory across compaction.
5. **Session stop** — daemon stays running (other sessions may use it); `should-continue` hook may suggest next steps.
6. **Idle** — consolidator drains pending events using local Ollama where available.

## 8. Extension points

- **New embedder backend:** implement `Embedder` interface in `src/memory/embedders/`, register in cascade.
- **New summariser backend:** implement `LLMClient` in `src/llm/`, add to env-driven backend resolver.
- **New skill:** add `skills/<name>/SKILL.md` with frontmatter — auto-discovered.
- **New agent:** add `agents/<name>.md` with frontmatter — auto-discovered.
- **New slash command:** add `commands/<name>.md` — auto-discovered.
- **New hook:** add `hooks/<event>/<name>.mjs` and register in `hooks/hooks.json`.

## 9. Migration map (V1 → V3 / "siftcoder")

| V1 component | V3 disposition |
|---|---|
| `src/memory/` | port whole, refactor into submodules listed in §4 |
| `src/utils/` | merge into `src/core/` and `src/utils/` |
| `dist/` | gitignore, never commit build output |
| `vendor/sift-compress/` | extract to companion plugin or vendor as optional dep; not in main hooks |
| `commands/*.md` (122) | preserve valuable jobs, not command names; V2 currently ships 87 thin wrappers |
| `skills/*` (19) | expand to 84 focused workflow contracts |
| `agents/*.md` (13) | retain/add 12 only where stricter contracts add value over native dispatch |
| `hooks/*` + `dist/services/*` hooks | port 7 essential, all as raw `.mjs`, no compiled hooks |
| `vendor/sift-compress/hooks/*` | extracted/optional |
| `documentation/` (13-folder auto-gen) | drop; replaced by hand-curated `docs/` (5 files) |
| README (1419 lines) | new 200-line README, links to docs |
| `claude-plugins-official/` `everything-claude-code/` `templates/` | drop |
| jest typings | drop, vitest only |
| `node_modules/` `dist/` in tree | gitignore |

## 10. Design decisions

**D1. Local-first defaults.** Ollama before Anthropic, deterministic embedder as floor. Reduces token cost ~50× on repeat sessions; works offline.

**D2. Preserve V1 value, not V1 ceremony.** Driven by user mandate: V2 must do every valuable thing V1 offered, plus more, without carrying backward-compatible names or low-value implementation baggage.

**D3. Single multi-verb command pattern.** `/siftcoder:mem [action]` instead of 7 `mem-*` commands. Lower discovery cost.

**D4. Hooks are observers, not enforcers.** No 210s blocking chains. Quality checks are explicit.

**D5. Dual SQLite backends preserved.** Native for speed, WASM for portability. Parity-tested in CI.

**D6. Provenance is a first-class concept.** `mem_why` differentiates SiftCoder from any RAG-style memory.

**D7. Plugin name stays `siftcoder`.** V3 is the rebrand, will replace V1 repo. No `v2`/`v3` user-visible suffixes.

**D8. State namespace versioned.** `~/.siftcoder/v3/` to avoid V1 collisions during transition.

**D9. ESLint + Prettier + TS strict + Vitest + GitHub Actions CI** mandatory baseline.

**D10. README stays under 250 lines.** Long-form docs go in `docs/`.

## 11. Open risks

- Ollama installation gating local-LLM benefits — mitigated by graceful Anthropic fallback + `/siftcoder:mem setup` walkthrough
- WASM SQLite backend can't load `sqlite-vec`; vector search stays JS-side until corpus > ~10k summaries
- Public-release domain (`siftcoder.com`?) and homepage URL need decision before npm publish
- License/provenance audit on `vendor/sift-compress/` before bundling
- Breaking change for V1 users: old socket path won't be found by V3; ship migration tool
