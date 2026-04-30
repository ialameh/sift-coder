---
name: heal
description: Use when build/test/lint/typecheck is failing and the user wants automatic recovery. Self-healing loop — retries with DIFFERENT strategies, not the same one twice. Bounded retry count.
---

# heal

Failing CI / failing local checks → auto-fix loop. Smart enough to not loop forever.

## Method

1. **Capture failure.** Run the failing command. Save full stderr + first 100 lines stdout.
2. **Classify.** Is this:
   - Type error? → narrow to file:line, propose fix
   - Lint error? → run linter's auto-fix, then re-run
   - Test failure? → read the test, read the code, hypothesis-driven fix (use `fix` skill discipline)
   - Build error? → missing dep / wrong import / wrong config
   - Flaky? → re-run once. If passes, log to memory; do NOT mark stable.
2. **Strategy 1.** Apply the most-likely fix.
3. **Re-run.** If pass → done. If fail and **same error** → escalate. If fail and **different error** → strategy 2.
4. **Strategy 2.** Different angle (e.g. if strategy 1 was "add type annotation", strategy 2 is "fix the call site").
5. **Strategy 3.** Read the relevant area more broadly. If still failing, **stop** and surface to user with the full diagnosis.
6. **Cap.** Max 3 strategies per failure. No infinite loops.

## Output shape per cycle

```
Cycle 1: type error in src/foo.ts:42
  Strategy: <description>
  Result:   ✗ same error
Cycle 2: ...
  Strategy: <different angle>
  Result:   ✓ fixed, moving on
Cycle 3: lint error in tests/bar.test.ts:7
  Strategy: <description>
  Result:   ✓ fixed
Final:   build green
```

If escalating to user:
```
Stuck after 3 strategies. Diagnosis:
  <hypothesis>
Suggested next: <human-driven option>
```

## Rules

- **Never retry the same strategy twice.** Define strategy by approach, not just by file edited.
- Never silently weaken tests / disable checks to make CI green.
- Never edit beyond the failure's actual scope.
- Cap at 3 strategies per failure; cap at 5 failures per session before bailing entirely.
- Capture every cycle to memory — future heal sessions learn what worked.

## Anti-patterns

- Same fix applied twice with slight variation (counts as same strategy)
- Casting the type to `any` to bypass type errors
- Adding `eslint-disable` to bypass lint
- `@skip` or deleting failing tests
- Retrying network failures with longer timeouts but no other change

## When NOT to use

- New work (no existing failure) — `/siftcoder:build` or `/siftcoder:add-feature`
- Single known fix — apply directly, no heal loop needed
- Investigation only — `/siftcoder:investigate`

## Subagent dispatch

- `general-purpose` for each strategy attempt
- `investigator` if 2 strategies fail (escalate to deeper diagnosis)

## Memory capture

Each cycle's strategy + result. Future "heal X" queries hit prior strategies that worked for the same error class.
