# Changelog

All notable changes to SiftCoder. Format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/), versioning is [SemVer](https://semver.org/).

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
