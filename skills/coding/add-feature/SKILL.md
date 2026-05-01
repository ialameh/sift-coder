---
name: add-feature
description: Use when adding a new capability to an existing project. Smaller than build (no full spec) but bigger than fix. Incremental, behind a feature flag where appropriate, with rollback path.
---

# add-feature

Incremental capability addition. Keeps existing behaviour intact.

## Method

1. **Scope.** One sentence: what does this feature let users do that they couldn't before? If it doesn't fit in one sentence, it's two features — split.
2. **Memory pass.** `mem_search` for prior conversations about this area. Reuse prior decisions.
3. **Existing-pattern reuse.** Find the closest existing feature in the codebase. New feature should look structurally like it.
4. **Flagging.** Default: ship behind a feature flag if user-facing. No-op for internal-only.
5. **Slice.** Define minimum-shippable: smallest change that delivers the one-sentence value. Ship that first; iterate.
6. **Test.** Tests must cover both flag-on and flag-off behaviour.
7. **Docs.** User-facing changelog entry. README only if surface area changes.

## Output shape

```
Feature:      <one sentence>
Flag:         <flag name or "none">
Pattern:      <existing feature this mirrors, w/ file paths>
Slice 1:      <what shipped this round>
Tests:        <list>
Rollback:     <flag off | git revert>
Roadmap:      <slice 2, slice 3 — explicit future work>
```

## Rules

- Never break existing tests. If a test seems wrong, fix the test in a separate commit, with reason.
- Never bypass project conventions for the new feature. Match what's there.
- Never ship slice 2+ in the same PR as slice 1. Memory + scheduled follow-up.
- Default flag is `off`. Flip on per user / per env after soak.

## Anti-patterns

- "Quick add" that touches 12 unrelated files
- Copy-paste of a similar feature without extracting the shared abstraction
- Test added for happy path only — needs flag-off + error case too
- Hardcoded config when the codebase already has a config layer

## When NOT to use

- Bug fix — `/siftcoder:fix`
- Whole new system — `/siftcoder:build`
- Refactor — `/siftcoder:refactor`

## Subagent dispatch

- `Explore` to find the closest pattern to mirror
- `Plan` to slice the feature
- `general-purpose` to implement
- `tester` for behaviour-coverage tests

## Memory capture

Capture: the pattern reused, the flag name, the rollback command. Future "what features have we shipped" queries use this.
