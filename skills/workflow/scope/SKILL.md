---
name: scope
description: Use to define/show/modify the .siftcoder/scope.json file that the boundary-enforcer hook reads. Bounds where AI can write. "Limit to these files", "lock down scope", "show current scope".
---

# scope

Manage `.siftcoder/scope.json` — the allow/deny list the `boundary-enforcer.mjs` hook enforces.

## Schema

```json
{
  "allow": ["src/auth/**", "tests/auth/**"],
  "deny":  ["src/auth/secrets/**"]
}
```

- **No scope file** → all writes allowed (only blocked by Claude Code's own permissions)
- **Scope set** → writes only to `allow` patterns; `deny` always wins over `allow`

## Method (set)

1. **Patterns.** User specifies allow + (optional) deny.
2. **Validate.** Each pattern must be syntactically valid; warn on patterns that match nothing.
3. **Persist** via `src/services/state.ts` `StateManager.saveScope`.
4. **Confirm.** Show what's currently in scope.

## Method (show)

1. Load scope.
2. Render allow + deny patterns.
3. Optionally expand patterns to file count.

## Method (clear)

1. Confirm with user (clearing scope removes all bounds).
2. Delete `.siftcoder/scope.json`.

## Method (add / remove)

Mutate the file via `StateManager`.

## Output shape

```
Current scope (.siftcoder/scope.json):
  Allow:
    - src/auth/**
    - tests/auth/**
  Deny:
    - src/auth/secrets/**

Effective files:    142 allowed, 3 denied

Hook status:        boundary-enforcer.mjs active in PreToolUse Write|Edit
```

## Rules

- **Deny wins over allow.** A path matching both is denied.
- **Pattern syntax is glob.** `**` for recursive, `*.ext` for extension.
- **Validate before save.** Warn if a pattern matches nothing (likely typo).
- **Backup on clear.** Save the cleared scope to `.siftcoder/checkpoints/scope-cleared-<ts>.json` so it can be recovered.

## Anti-patterns

- Allow `**` (defeats the point of scope)
- Forgetting to set deny for secrets
- Setting overly narrow scope that blocks legit work
- Ignoring "matches nothing" warnings

## When NOT to use

- Greenfield (no scope needed yet)
- Single-file edit (use Claude Code's own `--allowed-file` if available)
- Pre-merge review (different concern)

## Subagent dispatch

- None — uses `StateManager` directly
- Optional: `Explore` to validate patterns by listing matches

## Value over native CC

CC has its own permission system but doesn't natively support per-project allow/deny scope files enforced via hook. Scope IS the value — explicit project-scoped boundaries.
