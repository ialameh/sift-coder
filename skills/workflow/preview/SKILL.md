---
name: preview
description: Use when the user wants diff-before-apply discipline — show what would change, get approval, then apply. Risk-area enforcement. "Preview the change", "show before applying".
---

# preview

Diff-before-apply. AI proposes, user approves, AI applies. Distinct from `/pair` (which is per-step) — preview is per-change.

## Method

1. **Generate the change.** Plan the edits but **do not apply**.
2. **Diff.** Render the proposed diff in unified format. For multi-file changes, group by file.
3. **Surface risk axes** for the user:
   - Files touched
   - LOC delta
   - Tests affected
   - Public API changes
   - Migration concerns
4. **Three options:** Accept, Edit, Reject.
5. **Apply** on accept. **Adjust** on edit (user types deltas; AI integrates). **Drop** on reject.
6. **Verify** post-apply: tests, lint, typecheck.

## Output shape

```
Proposed change:    <one-line goal>

Diff:
  --- src/foo.ts
  +++ src/foo.ts
  @@ -10,5 +10,8 @@
   function foo(x: string) {
  -  return x.length;
  +  if (!x) return 0;
  +  return x.length;
   }

  --- tests/foo.test.ts
  +++ tests/foo.test.ts
  @@ ...

Risk:
  Files:        2
  LOC:          +5 -1
  Tests:        2 added
  Public API:   <none>
  Migration:    <none>

[accept | edit | reject]
```

## Rules

- **Don't apply silently.** Even on small changes, show diff first.
- **Risk axes mandatory.** Surface what could go wrong.
- **Edit mode is collaborative.** User types changes; AI integrates without re-proposing wholesale.
- **Verify post-apply.** Tests must stay green.

## Anti-patterns

- "Looks good?" without showing the diff
- Applying then asking "OK?" (defeats the point)
- Hiding risk axes
- Ignoring user's edits and re-proposing your own version

## When NOT to use

- Trivial change (one comment) — overkill
- User explicitly said "go" — they don't want preview
- High-trust autonomous mode — `/autonomous` (different discipline)

## Subagent dispatch

- None — preview is direct
- Optional: `Plan` if change is complex enough to need design first

## Value over native CC

CC defaults to applying when capable. Preview enforces the propose-before-apply contract. The discipline IS the value.
