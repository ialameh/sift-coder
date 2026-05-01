---
name: smart-retry
description: Use when retrying a failed operation — but with a different strategy, not the same one. "Try again differently", "retry with another approach". Memory-aware so it doesn't repeat strategies that already failed.
---

# smart-retry

Retry with a different strategy. Memory-aware — refuses to repeat what already failed.

## When this differs from naive retry

- Network blip → naive retry works
- Test failure → smart-retry needs *different angle*
- Build error → likely needs config change, not re-run
- Rate-limit → wait, then naive retry

Smart-retry classifies the failure first.

## Method

1. **Failure capture.** What failed? Full error + context.
2. **Memory pass.** `mem_search { query: "<error signature>", k: 5 }`. Has this been hit before? What was tried?
3. **Classify.**
   - **Transient** (network, rate-limit, race) → wait + naive retry, max 3 attempts
   - **Definitive** (test failure, type error, missing dep) → strategy switch needed
   - **Configuration** (env var, missing file, permission) → fix-then-retry
4. **Generate strategies.** For definitive failures, list 3 distinct approaches. **Distinct** means: different file, different angle, different abstraction.
5. **Apply strategy 1.** If success → log to memory + done. If fail → strategy 2. Cap at 3.
6. **Escalate** to user if all 3 fail with rich context.

## Output shape

```
Failure:        <quoted error>
Classification: <transient | definitive | config>
Memory hits:    <prior failures matching this error>

Strategies (definitive only):

  S1:  <strategy>  — based on memory item <id> (worked then, similar context)
       Apply? [auto / manual]

  S2:  <distinct strategy>  — different angle: <what>

  S3:  <distinct strategy>  — different abstraction: <what>

Cycle 1: applied S1
  Result: <pass | fail with new error>

Cycle 2: applied S2 (S1 failed with same error, switching)
  Result: ✓ pass

Final: green after S2.
Captured: this strategy works for <error class>; future smart-retry will rank S2 first.
```

## Rules

- **Strategies must be distinct.** Re-running the same fix with retries = naive retry.
- **Memory cited per strategy.** "Tried S1 because memory says it worked for similar X."
- **Cap at 3 strategies.** No infinite loops.
- **Escalate richly.** When 3 strategies fail, hand back full diagnosis to user.
- **Capture outcomes.** Successful strategy raises rank for future similar errors.

## Anti-patterns

- Same strategy with cosmetic variation
- Retrying without classifying first (treats all failures as transient)
- Bypassing the cap (3 max)
- Silent retries (no log of what was tried)

## When NOT to use

- Single transient failure — naive retry once
- Definitive error with single obvious fix — just fix
- Heal workflow already running — `/heal` skill is the parent here

## Subagent dispatch

- `general-purpose` per strategy attempt
- Memory MCP for prior-failure lookup

## Value over native CC

CC retries on errors but tends to retry the same approach. Smart-retry forces strategy-distinctness + memory-grounding. The discipline IS the value.
