---
name: codemap-fast
description: Use for a quick structural scan of an unfamiliar repo. Top-level only, no deep semantics. ~30 seconds. "Quick map", "what's in this repo", "fast orientation".
---

# codemap-fast

Quick orientation. Top-level structure + one-line per module. ~30 seconds.

## Method

1. `ls` top-level.
2. `cat package.json | jq '.name, .description, .scripts'` (or equivalent for non-node).
3. Tree to depth 2: `find . -maxdepth 2 -type d -not -path '*/node_modules*'`.
4. Per top-level dir: one-line description from README, or inferred from name.
5. Output.

## Output shape

```
Repo:      <name>
Stack:     <inferred from package.json or equivalent>
Description: <from package.json>

Top level:
  src/        <one-line>
  tests/      <one-line>
  docs/       <one-line>
  scripts/    <one-line>
  ...

Build:     <command>
Test:      <command>

Suggested next:
  - /siftcoder:codemap (full)
  - /siftcoder:reverse-prompt (single-prompt rebuild description)
```

## Rules

- **Top-level only.** No deep dives.
- **Inferred descriptions are flagged** ("inferred" in italics) so user knows confidence.
- **No diagrams.** Fast = text.
- **Time-bounded.** If a step takes > 5s, skip.

## Anti-patterns

- Reading all files in src/
- Generating diagrams
- Running tests
- Anything that takes > 30s total

## When NOT to use

- Already familiar with the repo
- Need depth — `/codemap` instead
- Non-code repo (e.g. docs-only) — overkill

## Subagent dispatch

- None — keep it lean
- `Bash` for the few commands

## Value over native CC

CC will read files. CC may go deeper than needed. This skill enforces the time-budget — if a depth-2 view is enough, it's enough.
