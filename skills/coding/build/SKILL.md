---
name: build
description: Use when the user says "build X", "implement X", "create X feature" or hands a spec and expects working code. Spec-first, evidence-gated, test-as-acceptance. Refuses to start coding before alignment on what success looks like.
---

# build

Spec → tests → code → verify → docs. Refuses to skip steps.

## Method

1. **Spec alignment.** If spec is ambiguous, surface 1-3 ambiguities **before any code**. One round of clarification, then proceed. If spec is missing, draft it from user input and confirm in &lt; 100 words.
2. **Memory pass.** `mem_search { query: <feature topic>, k: 8 }`. If prior decisions exist, cite them. If they conflict with spec, flag — do not silently override.
3. **Acceptance criteria.** Before writing any code, write the test names that would prove this works. List as bullet checklist. User confirms or amends.
4. **Plan.** Use native CC `Plan` agent. Output: file list, order, risk register, rollback path. ≤ 200 words.
5. **Build.** Implement smallest slice that lights up acceptance criterion #1. Run test. Green → criterion #2. Loop.
6. **Verify.** Run full suite. Run lint, typecheck. Read your own diff.
7. **Docs.** Update README/changelog/inline docs **only** for user-visible changes. Don't doc internal implementation details.

## Output shape

End-of-build summary:

```
Spec:        <one line>
Acceptance:  ✓ N/M criteria passing
Files:       <list>
Tests:       <list of new tests, with paths>
Verify:      lint ✓ types ✓ tests ✓
Rollback:    <git command if reverting>
Memory:      captured <summary count> events
Next:        <suggested follow-up or "complete">
```

## Rules

- Never write code before acceptance criteria are confirmed.
- Never skip the test-first step — even for "trivial" changes (trivial is where bugs hide).
- Never expand scope beyond spec. Out-of-scope ideas → log to memory + suggest as `/siftcoder:ideate` topic.
- Never delete tests to make a build pass.

## Anti-patterns

- Writing code, then writing tests to match the code (false safety)
- Mocking the thing under test (test does nothing)
- "Should work" without running it
- Touching unrelated files in the same change

## When NOT to use

- Bug fixes — use `/siftcoder:fix`
- Refactors with no new behaviour — use `/siftcoder:refactor`
- One-line typo fixes — just do it
- Investigation only (no code) — use `/siftcoder:investigate`

## Subagent dispatch

- `Plan` for the design step
- `general-purpose` for multi-file coordinated implementation
- `Explore` for codebase mapping when entering unfamiliar areas
- `tester` agent (if installed) for behaviour-coverage test gen, not just line coverage
