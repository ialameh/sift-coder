# Changelog

All notable changes to SiftCoder. Format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/), versioning is [SemVer](https://semver.org/).

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
