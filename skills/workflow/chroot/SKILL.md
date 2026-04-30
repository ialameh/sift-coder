---
name: chroot
description: Use to create a tighter file-access jail than /scope — explicit file list, not glob patterns. Useful for "I only want AI touching these 12 specific files". Backed by src/services/chroot.ts.
---

# chroot

Tight jail. Explicit file list, not glob. Stricter than `/scope`.

## When chroot beats scope

- `/scope` — pattern-based; flexible; "all of src/auth"
- `/chroot` — file-list-based; rigid; "exactly these 12 files"

Chroot for: deep refactors where you want to forbid surprise edits anywhere else.

## Method (set)

1. **Patterns.** User specifies glob patterns (e.g. `src/auth/**/*.ts`, `!src/auth/secrets/**`).
2. **Expand** via `src/services/chroot.ts` `ChrootManager.setChroot`. Negation patterns (`!`) excluded.
3. **Persist** the **explicit file list** (not the patterns) — pinned at jail-set time.
4. **Confirm.** Show file count + first 10 files.

## Method (check)

`ChrootManager.checkFile(path)` returns true/false. Used by tooling to enforce.

## Method (release)

`ChrootManager.clearChroot()` removes `.siftcoder/chroot.json`. Confirm with user.

## Output shape

```
Setting chroot:
  Patterns: ["src/auth/**/*.ts", "!src/auth/secrets/**"]

Expanded:    14 files
Sample:
  - src/auth/middleware.ts
  - src/auth/session.ts
  - src/auth/jwt.ts
  - ... (11 more)

Status: jail active
```

## Rules

- **List pinned at set-time.** Adding files to disk after chroot doesn't auto-include them.
- **Negation patterns first.** `["src/auth/**", "!src/auth/secrets/**"]` is explicit.
- **Single-jail per project.** Don't try to layer multiple chroots.
- **Backup on release.** Save the list to checkpoints so it's recoverable.

## Anti-patterns

- Setting chroot then expecting new files to be auto-included (they aren't)
- Combining chroot with scope (use one)
- Chroot too narrow (blocks the task itself)
- Forgetting to release after task complete

## When NOT to use

- Pattern-shaped boundary works — `/scope`
- Greenfield — no jail needed yet
- Multi-developer mob session — chroot is per-project, can collide

## Subagent dispatch

- None — `ChrootManager` is direct

## Value over native CC + scope

Scope is patterns — flexible. Chroot is explicit file list — rigid. The rigidity IS the value when you genuinely want to lock a refactor to a known set.
