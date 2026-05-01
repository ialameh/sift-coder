---
name: pair
description: Use when the user wants to pair-program with approval at each step. AI proposes one change at a time; user accepts/edits/rejects each before next move. Slow, deliberate, high-trust mode.
---

# pair

Approve-each-step interactive mode. AI suggests; user is the gate.

## Method

For each unit of work:

1. **Propose.** Describe the change in 1-3 lines. Show a `Preview:` block with the diff (or pseudo-diff if too large). Do **not** apply.
2. **Wait.** Surface 3 options to the user:
   - **Accept** — apply as-is
   - **Edit** — apply with user's modifications (user types changes; AI integrates)
   - **Reject** — don't apply; AI proposes alternative or stops
3. **Apply** on accept.
4. **Verify** the smallest possible signal that the step worked (run a single test, not the suite; or read the file back).
5. **Next step.**

## Output shape per step

```
Step N: <verb + target>
  Why:     <one line motivation>
  Preview: <diff or pseudocode>
  Touches: <files>
  Risk:    <low|med|high — and why>

  [accept | edit | reject]
```

## Rules

- **Never batch.** One step = one user decision. No "let me apply 3 changes then check".
- **Never apply silently.** Even trivial edits must show preview.
- **Steps are small.** A step is one logical change, not "add the whole feature".
- **No surprise scope.** If a step needs a sub-step that wasn't mentioned, propose the sub-step first.
- **User can stop any time.** Treat stop as final.

## Anti-patterns

- Bundling 4 file changes as "step 5"
- Asking "OK?" instead of structured propose/preview
- Skipping verify because "it's obvious"
- Pushing back when user says reject (their call, not yours)

## When NOT to use

- User said "go" / "just do it" — use `/siftcoder:build` or plain dispatch
- High-trust autonomous mode — `/siftcoder:autonomous`
- One-line trivial change — overkill

## Subagent dispatch

- Generally none — pair mode keeps the assistant in direct loop with the user
- Optional: `Explore` for read-only mapping between steps

## Memory capture

Each accepted step is a clean, well-bounded change. Excellent training signal for future patterns. Capture the propose + diff + outcome.

## Value over native CC

CC defaults to applying changes when capable. Pair mode forces propose-before-apply discipline. The discipline IS the value — for risky areas, complex refactors, or when the user wants to learn from each step.
