# SiftCoder Large-Codebase Hardening — Design Spec

**Date:** 2026-05-31
**Status:** Approved (design) → implementation
**Target version:** v1.3.0
**Source trigger:** Claude blog — *How Claude Code works in large codebases: best practices and where to start*.

## 1. Motivation

The article is a playbook for Claude Code in large codebases. SiftCoder's design thesis (`ARCHITECTURE.md` §1) already matches the article's "harness" model (skills on-demand, hooks for determinism, plugins for distribution, MCP for structured search, read-only-mapper + editor subagent split, context management at scale). An audit found SiftCoder under-delivers on ~7 of the article's own items, all small and on-brand.

Two themes:
- **(A) Stop polluting memory/context at scale** — capture exclusion (①), sub-workspace scoping (⑤).
- **(B) Close the read-side loop the article's hook philosophy expects** — Stop-hook CLAUDE.md hint (②), CLAUDE.md hierarchy generator (③), path-scoped skills (④), LSP guidance (⑥), model-drift cadence (⑦).

All changes conform to `ARCHITECTURE.md` (the design contract), D6 (Vitest mandatory; coverage thresholds lines 90 / branches 85 / functions 90 / statements 90), D7 (README < 250 lines).

## 2. Confirmed facts (from code audit)

- `hooks/post-tool-use/capture-observation.mjs:77` captures every `Read|Write|Edit|Bash|Grep|Glob` with **zero exclusion filtering** — sends full `tool_input`+`tool_response` over UDS, including `node_modules/`, `dist/`, generated, vendored paths.
- `hooks/stop/should-continue.mjs` emits only a pending-drain hint. No CLAUDE.md feedback loop.
- Skill frontmatter is `name`+`description` only across 96 skills — **no `paths:` scoping**. CC natively supports `paths:` (comma-string or YAML list of globs) — narrows *auto-load* only; explicit invocation unaffected. Source: `code.claude.com/docs/en/skills.md`.
- No skill generates/maintains a CLAUDE.md hierarchy. `/codemap` family emits standalone docs, not CLAUDE.md.
- `mem_symbol_search` is **regex-based** (`src/memory/symbols.ts`) memory-derived recall — not LSP.
- `workspaceKey` = `sha256(realpath(git-toplevel)).slice(0,12)` — monorepo subdirs share one memory namespace. Canonical impl: `src/memory/workspace.ts`. Re-implemented inline in 6 hooks: `spawn-daemon`, `capture-observation`, `pin-incident`, `inject-memories`, `should-continue`, `auto-checkpoint`.
- Deps already present: `minimatch@^10`, `glob@^13`, `better-sqlite3`, `node-sqlite3-wasm`. boundary-enforcer ships a tiny dep-free `matchAny`.
- Daemon UDS RPC kinds already include `session_digest` and `patterns` (`src/memory/daemon/server.ts` switch) — ② needs **no new RPC**.
- Model pins live in `settings.json` (`summarizer.modelHaiku` = `claude-haiku-4-5-20251001`, `modelSonnet` = `claude-sonnet-4-6`, `confidenceThreshold` 0.6).

## 3. Items

### ① P0 — Capture-hook exclusion filtering
**Problem:** memory pollution scales with repo size, diluting BM25+vector retrieval exactly where SiftCoder should shine.

**Design:**
- `hooks/lib/ignore.mjs` — dep-free matcher (extends boundary-enforcer's `matchAny` style: exact, `dir/**` prefix, `*.ext` suffix, plus `**/seg/**` contains and leading-`!` negation). Sources, unioned:
  1. Hardcoded defaults: `node_modules`, `dist`, `build`, `.git`, `coverage`, `target`, `.next`, `out`, `vendor`, `*.lock`, `*-lock.json`, `*.min.*`, `*.map`.
  2. `.gitignore` (repo root).
  3. `.claudeignore` (repo root).
- Compiled list cached to `~/.siftcoder/<ns>/<ws>.ignore.json` keyed on mtime of the two ignore files; recompute only on mtime change (keeps the 250 ms budget).
- `src/utils/ignore.ts` — TS port (may use `minimatch`, startup cost amortized in long-lived daemon) for daemon-side authoritative filtering.
- `capture-observation.mjs`: extract candidate path from `tool_input.file_path` (Read/Write/Edit) or `tool_input.path` (Grep/Glob). Match → `exit(0)` before RPC. Bash without a clear path token is captured as today.
- Daemon re-filters on ingest (belt-and-suspenders; covers WASM / older hooks).
- Opt-out: `SIFTCODER_CAPTURE_IGNORE=0`.

**Tests:** matcher unit (defaults, gitignore parse, claudeignore, negation, contains-glob, cache mtime invalidation); daemon-side filter unit. `.mjs` matcher logic is also exported/tested via a thin TS re-export or a dedicated `tests/` entry (vitest `include` is `src/**` + `tests/**`).

### ② P0 — Stop-hook CLAUDE.md hint (Hint only)
**Design:** `should-continue.mjs`, after the drain check, sends `{kind:'session_digest', sessionId}` over UDS (existing RPC). Filter the digest for convention/decision-class learnings above a confidence floor. If ≥1 → emit one line:
`[siftcoder] N convention learnings this session — run /siftcoder:knowledge to fold into CLAUDE.md.`
Never writes. Silent on miss/timeout (1.5 s budget preserved). `sessionId` taken from the Stop hook stdin envelope.

Add a **fold-in proposal flow** to `skills/knowledge/*` (the `/siftcoder:knowledge` surface): on demand, read session convention learnings → propose a CLAUDE.md delta → user applies manually. Never auto-writes.

**Tests:** hook emits hint when digest returns convention learnings; silent when none / socket absent / timeout.

### ③ P1 — CLAUDE.md hierarchy generator
**Design:** new `skills/docs/codemap-claudemd/SKILL.md` + `commands/codemap-claudemd.md` (auto-discovered). Reuses the codemap repo-walk. Emits:
- Lean **root** `CLAUDE.md` — highest-level structure, critical gotchas, pointers only (article: "root contains pointers and critical gotchas only").
- Per-significant-subdir `CLAUDE.md` — scoped conventions + per-directory test/build commands.
Idempotent: detects existing CLAUDE.md, proposes a merge diff, never clobbers. Markdown guidance only — no `src/` change.

**Verification:** skill structure + frontmatter validity. Bump skills count in `ARCHITECTURE.md` §5 (96 → 97).

### ④ P1 — Path-scoped Salesforce skills
**Design:** add `paths:` frontmatter to every `skills/salesforce/*` skill (12 dirs: agentforce, apex, architecture, comply, cpq, deploy, einstein, flow, lwc, security, test, schema-migrate):
```
paths: **/*.cls,**/*.trigger,**/*.apex,**/lwc/**,**/aura/**,**/objects/**,**/*.object-meta.xml,sfdx-project.json,**/flows/**,**/flexipages/**,**/permissionsets/**,**/profiles/**
```
Auto-load only in SF trees; slash invocation unaffected (confirmed via CC docs).

**Tests:** vitest guard asserting every `skills/salesforce/*/SKILL.md` has a non-empty `paths:` key.

### ⑤ P1 — Optional sub-workspace memory namespace
**Design:** extend `workspaceKey` to fold in an optional subspace:
- Source: `SIFTCODER_SUBSPACE` env, else `.siftcoder/subspace` file (first line), else none.
- When present: `key = sha256(realpath(toplevel) + ':' + subspace).slice(0,12)`. Absent → **identical to today** (no migration, default OFF).
- Single source of truth: new `hooks/lib/workspace.mjs` (mirrors `src/memory/workspace.ts` rule exactly). All 6 hooks import it instead of re-implementing inline. `src/memory/workspace.ts` gains the same subspace fold.
- **Invariant:** hook-side and daemon/MCP-side keys must agree, else captures route to a dead socket. Covered by a cross-impl test.

**Tests:** key stability; subspace on/off; `.mjs` ↔ `.ts` agreement (golden vector); existing `workspace.test.ts` extended.

### ⑥ P2 — LSP docs + graceful note (docs-only)
**Design:** doc section (`docs/`) recommending the CC code-intelligence (LSP) plugin as the live navigation layer for multi-language codebases; clarify `mem_symbol_search` is a memory-derived **recall** index (symbols touched + provenance), complementary to go-to-def / find-refs, not a replacement. One-line note in symbol-search skill output. No new deps (honors D8). Update `ARCHITECTURE.md` open-risks.

### ⑦ P2 — Model-drift review cadence
**Design:** add a "model-drift audit" section to `skills/meta/siftcoder` (`/siftcoder:siftcoder`) listing model-pinned spots (`settings.json` Haiku/Sonnet, confidence threshold, any model-tuned skill text) + a 3–6 month review checklist (article: "instructions for your current model can work against a future one"). Optional `mem doctor` line surfacing pinned model IDs. New decision **D12** in `ARCHITECTURE.md`.

## 4. Cross-cutting
- `ARCHITECTURE.md`: hook table (① capture filtering, ② Stop hint), skills count 96→97, **D12** model-drift cadence, **D13** capture exclusion, extension points (ignore matcher, subspace), open-risks (LSP).
- `CHANGELOG.md`: v1.3.0 entry (user-facing).
- `settings.json`: `siftcoder.hooks.captureIgnore` defaults, `siftcoder.memory.subspace` toggle (default off).
- Vitest for all `src/` + hook logic. ESLint + Prettier clean. Coverage thresholds hold.
- README: pointer only if needed (stay < 250 lines).

## 5. Build order (TDD each)
1. **⑤ workspace refactor** — foundational (① and ② both touch hook workspace/path resolution). Extract `hooks/lib/workspace.mjs`, add subspace, align 6 hooks, extend `src/memory/workspace.ts`.
2. **① capture filter** — `hooks/lib/ignore.mjs` + `src/utils/ignore.ts` + hook wiring + daemon-side filter.
3. **② Stop hint** — `session_digest` query + `/siftcoder:knowledge` fold-in flow.
4. **④ path-scope** — SF skill frontmatter + guard test.
5. **③ codemap-claudemd** — skill + command.
6. **⑥ LSP docs** — doc section + symbol-search note.
7. **⑦ model-drift** — self-audit section + D12 + optional doctor line.
8. **Cross-cutting** — ARCHITECTURE, CHANGELOG, settings, final lint/test/coverage gate.

## 6. Non-goals (YAGNI)
- No bundled LSP / tree-sitter (rejected — D8 reasoning; chosen docs-only).
- No auto-edit of CLAUDE.md (rejected — chosen hint-only).
- Sub-workspace default stays OFF — no data migration.
- No request-id streaming protocol change (D9 unaffected).
