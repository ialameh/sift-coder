---
name: ghost
description: Use when the user wants to explore "what if we did X instead" — alternative implementations, parallel approaches, counterfactual designs. Generates scratch-branch explorations without committing to main.
---

# ghost

Parallel-universe code exploration. "What if we wrote this differently" — explored in scratch branches/files, never main.

## Method

1. **Crystallise the alternative.** State the variant in one sentence: "What if we used X instead of Y."
2. **Cost estimate.** Time to implement variant. Files affected. Risk. **State explicitly that this is exploration, not a real change.**
3. **Isolate.** Either:
   - Worktree: create a temporary git worktree (`git worktree add ../ghost-<topic>`)
   - Branch: `git switch -c ghost/<topic>` (less ideal — pollutes main repo state)
   - Files: `<filename>.ghost.<ext>` placeholders (lightest)
4. **Implement the variant** within isolation.
5. **Compare.** Side-by-side:
   - Lines changed
   - Test outcome
   - Performance (if measurable)
   - Readability (subjective but call it)
6. **Verdict.** Worth the merge? Or scratch the ghost?
7. **Cleanup.** If scratched: remove worktree/branch/files. If kept: surface to user as a real PR proposal.

## Output shape

```
Variant:     <one-sentence what-if>
Isolation:   <worktree | branch | ghost files>  at <path>

Comparison:
                  Main         Ghost
  LOC             N            M
  Tests           N pass       M pass
  Perf            <metric>     <metric or n/a>
  Readability     baseline     <better|worse|equal — reasoning>

Verdict:     <merge candidate | scratch>

Cleanup:     <command to remove ghost>
Or merge:    <command to materialise as a real PR>
```

## Rules

- **Never touch main.** All work in isolation. If you find yourself editing main files, stop.
- **Always have a cleanup path.** Ghost work that lingers becomes confusion.
- Explore one variant per ghost. Multiple variants = multiple ghosts.
- Compare honestly. Don't bias toward the variant just because it's new.

## Anti-patterns

- "Quick experiment" that ends up half-merged into main
- Ghost branches that live for weeks
- Comparing main (incomplete feature) vs ghost (complete feature) — apples to oranges
- Falling in love with the ghost; merging without honest comparison

## When NOT to use

- You're sure the variant is better — just do it via `/siftcoder:refactor` or `/siftcoder:add-feature`
- The current code is fine — ghost is for genuine uncertainty
- Deadline pressure — explorations take time

## Subagent dispatch

- `general-purpose` to implement the ghost variant
- `Plan` to design the variant before implementing
- Use isolation: `Agent` with `isolation: "worktree"` is the cleanest tool for this

## Value over native CC

CC will write the alternative if asked. CC won't naturally enforce isolation, structured comparison, or cleanup. Ghost provides the discipline so explorations don't pollute the main repo.
