---
name: codemap
description: Use for evidence-based codebase documentation. Walks the repo, builds a map of components + responsibilities + interconnections. Output is hand-curated markdown with diagrams. Variants — codemap-fast, codemap-diff, codemap-trust, codemap-export.
---

# codemap

Evidence-based codebase doc. Map of what exists, who depends on what, what each module does. Distinguishes confidence levels (proven by tests / inferred from usage / guessed).

## Variants

- **codemap** (this skill) — full pass, single repo
- **codemap-fast** — quick structural scan, no deep semantics
- **codemap-diff** — what changed between two refs (semantically, not just diff)
- **codemap-trust** — confidence/risk per module (which areas to trust, which to verify)
- **codemap-export** — machine-readable JSON output for tools

## Method (full codemap)

1. **Top-down survey.** Top-level dirs; one-line responsibility for each.
2. **Module inventory.** For each subdir:
   - LOC
   - Test coverage
   - Last-touched dates
   - Public API (exports / endpoints)
   - Internal deps (what does it import?)
   - External deps (npm packages used)
3. **Dependency graph.** Module-level. Mermaid.
4. **Hotspots.** High-churn × low-coverage = risk.
5. **Confidence labels** per module — high (tests + recent), med (works but uncovered), low (works but unstable).
6. **Output: ARCHITECTURE.md or codemap.md.**

## Output shape

```
# Codemap: <repo name>

## Top-level
- src/        — code
- tests/      — tests
- docs/       — hand-curated docs
- ...

## Modules

### src/memory/  (5,300 LOC, 96.86% cov, last-touched 2026-04-30)
**Responsibility:** persistent memory engine — daemon, MCP server, retrieval

**Public API:**
  - daemon: UDS server for capture
  - mcp/server: stdio MCP server
  - storage: dual-backend SQLite

**Imports from:** src/core, src/utils
**Imported by:** src/services (none yet)
**External deps:** better-sqlite3, node-sqlite3-wasm, gpt-tokenizer

**Confidence:** high (518 tests, recent)

### src/core/  (200 LOC, 100% cov, last-touched 2026-05-01)
**Responsibility:** plugin-wide primitives — config, paths, errors, logger
...

## Dependency graph

\`\`\`mermaid
graph TD
  Memory --> Core
  Memory --> Utils
  Services --> Core
  Services --> Utils
\`\`\`

## Hotspots
- (none — coverage strong, churn matched by tests)

## Confidence summary
- High:  4 modules (memory, core, utils, services)
- Med:   1 module (formatters — light usage)
- Low:   0 modules
```

## Rules

- **Cite LOC + coverage from real measurement,** not estimate.
- **Confidence labels with reasoning.** "High because <evidence>".
- **Hotspots are evidence-cited** — high churn from `git log`, low coverage from coverage report.
- **Don't bloat with file lists.** Module-level, not file-level.

## Anti-patterns

- File-by-file listing (use a tree command for that)
- Hotspots without evidence (just guessing)
- Confidence labels without reasoning
- Out-of-date diagrams (use `/codemap-diff` to verify)

## When NOT to use

- Tiny repo (manual scan faster)
- One module (just read it)
- Auto-generated doc tool already in place — augment, don't replace

## Subagent dispatch

- `Explore` for the survey
- `Bash` for `git log --shortstat`, `wc -l`, coverage extraction
- `general-purpose` for the synthesis

## Value over native CC

CC will list files. CC won't naturally produce evidence-cited confidence labels, dependency graphs, hotspot analysis. The evidence-based shape IS the value.
