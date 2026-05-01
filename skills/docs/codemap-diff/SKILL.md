---
name: codemap-diff
description: Use to compare two refs/branches/tags semantically — what changed in architecture, not just lines. "What.s different between branches", "compare branches".
---

# codemap-diff

Semantic diff. Different from `git diff` — focuses on architecture changes, not line-level.

## Method

1. **Refs.** User specifies two refs (commit, branch, tag).
2. **Worktree both** (or use the active for one + worktree for the other).
3. **Generate codemap for each** (use `/codemap` skill internally — but cached if recent).
4. **Compare:**
   - Modules added/removed
   - LOC delta per module
   - Coverage delta
   - Public API additions/removals/changes
   - Dependency graph changes
   - New external deps
5. **Output the architectural delta**, not the file-level diff.

## Output shape

```
Compare:    <ref-a> ↔ <ref-b>

Module changes:
  + Added: src/services/ (4 modules)
  - Removed: src/legacy/ (2 modules)
  ~ Changed: src/memory/ (LOC +120, coverage -2pp)

Public API changes:
  + Added: mem_search, mem_why, mem_drain (MCP tools)
  - Removed: legacy_query (no replacement)
  ~ Signature changed: <none>

Dependency graph changes:
  + memory → services (new)
  - memory → legacy (removed)

External deps:
  + Added: gpt-tokenizer
  - Removed: lodash

Risk assessment:
  - Public API removals: 1 (legacy_query) — breaking change for consumers
  - Coverage decline: minor; trend acceptable

Migration notes:
  - Consumers of legacy_query → migrate to mem_search
  - <other affected callers>
```

## Rules

- **Semantic, not line-level.** `git diff` covers lines.
- **Public API changes are first-class.** Breaking changes flagged loudly.
- **Migration notes when API changes.** Consumers need a path.
- **Coverage delta is informative, not a gate.**

## Anti-patterns

- Line-level diff dump (use `git diff`)
- Missing migration notes on breaking changes
- Treating LOC delta as quality signal in isolation

## When NOT to use

- Commit-by-commit diff — `git log` / `git diff`
- Within-file refactor — `git diff` is enough
- Greenfield (no comparison ref)

## Subagent dispatch

- `timewarp` skill for the worktree management
- `codemap` skill (chained) for each side
- `general-purpose` for the comparison synthesis

## Value over native CC

CC will diff if asked. CC won't naturally produce module-level semantic diff with public API + migration notes. The architectural framing IS the value.
