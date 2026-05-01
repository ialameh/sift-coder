---
name: fix
description: Use when the user reports a bug, says "fix X", "X is broken", "X doesn't work". Bounded-scope, root-cause-first. Adds a regression test before declaring done. Refuses to expand into refactor.
---

# fix

Find the actual cause. Fix it. Add a regression test. Stop.

## Method

1. **Reproduce.** Get the failing case to a deterministic command line. If you can't reproduce, ask for: exact command, env, input, expected vs actual. **Do not guess.**
2. **Memory pass.** `mem_search { query: <error or symptom>, k: 5 }`. Has this been hit before? Was there a prior fix that regressed?
3. **Hypothesis.** State the hypothesis explicitly. Cite evidence (line numbers, log lines, behaviour).
4. **Verify hypothesis** before patching. Add a `console.log`, run, confirm. If the hypothesis is wrong, restate. Don't patch on a hunch.
5. **Smallest fix.** One concept change. Target the root cause, not the symptom. If the root cause is in unrelated code, surface that — do not silently expand scope.
6. **Regression test.** Write a test that fails on the old code and passes on the new. **Required.**
7. **Verify.** Full test suite. Lint. Typecheck.

## Output shape

```
Symptom:    <quoted error or behaviour>
Reproduce:  <exact command>
Cause:      <one paragraph, w/ file:line citation>
Fix:        <minimal diff, applied>
Test:       <path to new regression test>
Adjacent:   <any related code that might also be wrong, NOT fixed in this PR>
```

## Rules

- No fix without reproduction.
- No fix without a regression test (rare exception: pure config change with no logic).
- No "while I was here" cleanup. Adjacent issues go to memory + a follow-up suggestion.
- If hypothesis is wrong, restart from step 3. Don't pile patches.
- Never delete or `@skip` a failing test to make CI green. The test was right.

## Anti-patterns

- Patching the symptom (e.g. catch + ignore the exception that signals the bug)
- "Should be fine now" without re-running the failing case
- Refactoring while fixing (separate concerns)
- Adding defensive null checks everywhere when one specific path was wrong

## When NOT to use

- Adding a new feature — `/siftcoder:add-feature`
- Refactoring with same behaviour — `/siftcoder:refactor`
- Investigation only — `/siftcoder:investigate`

## Subagent dispatch

- `investigator` agent (if installed) for diagnosis
- `Explore` for read-only mapping if the bug area is unfamiliar
- `general-purpose` for the patch + test, with explicit scope file list
