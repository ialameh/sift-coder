# Changelog

All notable changes to SiftCoder. Format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/), versioning is [SemVer](https://semver.org/).

## [Unreleased]

### Added — V1 convenience-command restoration (15 cmds + 7 skills)

Restored all 14 V1 conveniences flagged as "discoverability regressions" in the V1↔V3 deep comparison, plus pattern-list:

**New commands (15):**
`/siftcoder:search`, `/wizard`, `/focus`, `/perf`, `/lwc-debug`, `/schema-migrate`, `/organize-project`, `/help`, `/config`, `/test`, `/status`, `/examples`, `/use-cases`, `/narrator`, `/pattern-list`

**New skills (7):** workflow contracts behind the new commands:
- `skills/knowledge/search` — federated code + memory + docs search w/ RRF fusion
- `skills/meta/wizard` — multi-step interactive flow w/ decision-tree branching
- `skills/workflow/focus` — advisory attention narrowing, biases memory retrieval
- `skills/coding/perf` — dedicated perf profiling (multi-iteration, top-N hotspot Pareto)
- `skills/salesforce/schema-migrate` — SF metadata schema migration w/ risk classification
- `skills/workflow/organize-project` — project structure assessment + reorg
- `skills/coding/test` — multi-modal test gen (unit/integration/e2e/property/mutation/coverage/bulk)

**Wrapping existing skills (8 commands):** narrator, lwc-debug, status, help, config, examples, use-cases, pattern-list — thin command wrappers over existing skills/agents/CLI.

After this round V3 retains every V1 capability **plus** all V3 additions; no V1 capability remains unaddressed.

### Added — V1 capability completeness pass

Verified V1's full capability list is maintained in V3. Added the missing pieces:

- **3 agents:** `orchestrator` (multi-agent coordination, file-locking, dependency batching), `analyst` (non-code text/data analysis — sibling to investigator), `bridge-analyzer` (cross-codebase integration design)
- **5 commands + skills:**
  - `/siftcoder:agent` — full plan→code→review→fix pipeline w/ rollback (`skills/workflow/agent/SKILL.md`)
  - `/siftcoder:debug` — generic debugging w/ error/trace/repro/bisect/trace-call/log modes (`skills/coding/debug/SKILL.md`)
  - `/siftcoder:bridge` — cross-codebase integration analysis (`skills/integrations/bridge/SKILL.md`)
  - `/siftcoder:build-fix` — minimal-diff build-error resolution (`skills/coding/build-fix/SKILL.md`)
  - `/siftcoder:budget` — token/cost budget tracking (`skills/meta/budget/SKILL.md`, backed by `Budget` class in `src/services/tokens.ts`)
- **Opt-in `auto-checkpoint` hook** (`hooks/post-tool-use/auto-checkpoint.mjs`) — disabled by default; enable via `settings.json` `siftcoder.hooks.autoCheckpoint.enabled = true`. Creates lightweight git-anchored checkpoints at edit/time thresholds. Failure mode: silent.

V1 capabilities now confirmed maintained: planner/coder/investigator/qa-reviewer/qa-fixer/documenter/orchestrator/analyst agents; build/heal/agent autonomous workflows; boundary-enforcer + chroot + scope safety; checkpoint/handoff session persistence; quality gates as on-demand skill; full debugging suite (debug/bridge/build-fix); budget management; and all novel features (duck/ghost/oracle/archaeologist/dream/chaos/compress).

### Added — earlier in this Unreleased
- **8 generic agents restored:** planner, coder, qa-reviewer, qa-fixer, reviewer, documenter, tester, investigator. Each adds discipline over native CC subagent dispatch (evidence ledgers, output contracts, scope refusal, behaviour-coverage gates).
- **Backing services as clean TypeScript** (replaces V1's 8500 LOC of opaque compiled JS):
  - `src/services/state.ts` — scope.json + checkpoints management
  - `src/services/chroot.ts` — glob-pattern file jail
  - `src/services/reverse-prompt.ts` — context gathering + cache CRUD + in-flight dedup
  - `src/services/tokens.ts` — consolidates V1's 3 token-monitor variants
  - `src/utils/file.ts` — atomic-write + glob match + json io
  - `src/utils/focus-fingerprint.ts` — md5 cache keys
  - `src/utils/tree-formatter.ts` — directory tree rendering
- **45 fresh tests** for services + utils + core (all 563 tests passing, coverage 96.86% lines).
- **`docs/EXAMPLES.md`** with real session traces.
- **`docs/USE-CASES.md`** organised by developer type, problem type, task size.

### Removed (vs V1)

- **25 of V1's 29 backing services** — opaque compiled JS without TypeScript source. Behaviour moved to:
  - skills (workflow framing drives the assistant directly)
  - memory daemon (capture, indexing, knowledge, provenance, observation logging)
  - declarative config (`.mcp.json`, `settings.json`, `scope.json`)
  - native Claude Code (subagent dispatch, plan mode, `/review`, `/security-review`)
- Specifically dropped: `auto-checkpoint, bridge-utils, build-fix-service, checkpoint-service, cloud-config, cloud-sync, context-builder, detect-contextdigger, doc-service, file-iterator, index-codebase, inject-knowledge, knowledge-manager, learning-service, mcp-config-service, mcp-integration, observation-logger, quality-gates (service form — kept as skill), suggest-service, sync-to-glm, tdd-service (kept as skill), token-monitor, token-monitor-v2`
- 4 services kept and **rewritten in clean TypeScript** (550 LOC total) instead of imported as compiled JS (~8500 LOC).

### Why this matters for v1.0.0 public release

- v1.0.0 ships only code we own, read, test, and can audit.
- Net delete of 7950 LOC of opaque JS in exchange for 550 LOC of typed, tested TypeScript.
- The deleted code was either duplicating the memory daemon, duplicating native Claude Code, or shipping unmaintained external integrations (cloud-sync, sync-to-glm).

## [3.0.0] — 2026-05-01

Complete rewrite. Replaces legacy `siftcoder` v2.x.

### Added

- **Memory-first architecture.** Persistent per-workspace memory daemon with UDS RPC, dual SQLite backends (native + WASM), RRF retrieval, Ebbinghaus decay, typed provenance graph (`mem_why`).
- **Local-LLM defaults.** Ollama-first cascade for summarisation and embeddings; Anthropic API as fallback. ~50× steady-state token cost reduction over V1.
- **MCP server `siftcoder-memory`** exposing `mem_search`, `mem_get`, `mem_timeline`, `mem_why`, `mem_drain` to Claude Code natively.
- **Salesforce domain skills:** `salesforce-apex`, `salesforce-lwc`, `salesforce-deploy`, `salesforce-architecture`, `salesforce-test`.
- **4 domain agents:** `salesforce-architect`, `apex-bulkifier`, `lwc-debugger`, `memory-curator`.
- **Improved `ideate` and `surprise-me`** as skills (memory-grounded, anti-generic, portfolio output).
- **`reverse-prompt` skill** with Quick / Deep / Focus modes and project-fingerprint cache.
- **CLI `siftcoder`** at `bin/siftcoder.mjs` — `setup`, `start`, `stop`, `status`, `drain`, `backfill`, `web`.
- **Memory daemon health monitor** (`monitors/memory-daemon-health.mjs`).
- **Plugin `settings.json`** with safe defaults.
- **`.mcp.json`** extracted from manifest (cleaner, more conventional).
- **GitHub Actions CI** — matrix across ubuntu/macos/windows × Node 20/22.
- **ESLint + Prettier** configs in repo.

### Changed

- **State namespace bumped to `v3`** — `~/.siftcoder/v3/` instead of `~/.siftcoder/`. Avoids collisions with V1/V2 installs.
- **Hooks trimmed from 13 → 7.** Removed PostToolUse format/lint/type-check chain (was 210s sequential per edit) — moved to on-demand `/siftcoder:quality`.
- **SessionStart slimmed** to just `spawn-daemon.mjs`. Context/knowledge injection moved to first UserPromptSubmit (or memory MCP query).
- **Single-verb commands.** `/siftcoder:mem [action]` replaces 7 `mem-*` commands.
- **Coverage gates relaxed slightly** (90% lines vs V1's 100%) — V1 gates were unrealistic for I/O glue.

### Removed

- **~106 commands** from V1 (122 → 16). Removed: `siftcoder`, `autonomous`, `autonomous-run`, `swarm`, `continue`/`resume`/`pause`/`checkpoint`/`handoff` aliases, `pattern-learn`/`pattern-list`/`pattern-search`, generic coding (`build`/`fix`/`add-feature`/`investigate`/`heal`/`tdd`/`pair`/`refactor`/`optimize`/`zen`/`empathy`), vibes (`oracle`/`dream`/`ghost`/`fortune`/`duck`/`archaeologist`/`narrator`), `review`/`security`/`comply` (use Claude Code's built-in `/review`, `/security-review`).
- **9 of 13 V1 agents.** Removed: `planner`, `coder`, `qa-reviewer`, `qa-fixer`, `reviewer`, `documenter`, `tester`, `investigator`, `analyst`, `bridge-analyzer`, `semantic-searcher`, `orchestrator`, `suggest`. All redundant with Claude Code's native subagent dispatch (`Task` tool, `Plan` agent, `Explore` agent, `general-purpose` agent).
- **9 of 19 V1 skills.** Kept the genuinely additive ones; dropped the ones that wrapped native CC capability.
- **`vendor/sift-compress/`** — extracted to a separate companion plugin. The compression skill stays.
- **`claude-plugins-official/`, `everything-claude-code/`, `templates/`** — were reference dumps, not part of the plugin.
- **`dist/` from git tree.** Build output, gitignored.
- **Mixed `dist/services/*.js` hook entries.** All hooks now in `hooks/*.mjs`.
- **53KB README** — replaced with a 250-line README + linked docs.
- **13-folder auto-gen `documentation/`** — replaced with hand-curated `docs/` (5 files).
- **Jest typings** — Vitest only.

### Deprecated

- (none — clean rewrite)

### Security

- Boundary enforcer hook (`PreToolUse`) reads scope from `.siftcoder/scope.json` and blocks Write/Edit outside listed allow-globs.
- Webhook scaffold (`/siftcoder:sf-webhook`) ships with HMAC verification and timestamp window by default.

### Migration from v2.x

- Memory does not auto-migrate. Run `node bin/siftcoder.mjs backfill --from-v2 ~/.siftcoder` to import legacy summaries.
- Custom V1 commands not in the V3 list are dropped — re-implement as skills if still needed.
- V1 hooks chain (especially the format/lint/type-check 210s chain) is gone. Run `/siftcoder:quality` instead.
- Remove old plugin from Claude Code, install V3.
