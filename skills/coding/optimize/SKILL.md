---
name: optimize
description: Use for performance work. Measure-first, profile-driven. Refuses to optimise without a baseline measurement. Targets the actual hotspot, not where intuition says it is.
---

# optimize

Measure. Find the hotspot. Optimise the hotspot. Re-measure. Stop.

## Method

1. **Baseline.** Reproduce the slowness with a deterministic command. Record:
   - Wall time, CPU time, memory, allocations, query count, network calls (whichever apply)
   - Example input characteristics
2. **Goal.** State a numeric target. "Faster" is not a goal. "p95 &lt; 200ms" is.
3. **Profile.** Use the right tool for the language:
   - Node: `--prof`, clinic.js, 0x
   - Python: cProfile, py-spy, scalene
   - Apex: Salesforce debug log analysis (`/siftcoder:sf-debug`)
   - SQL: EXPLAIN ANALYZE
   - Browser: DevTools Performance tab
4. **Identify the actual hotspot.** Often surprising. Optimising elsewhere is wasted.
5. **Hypothesise the fix.** State why it should help, by how much.
6. **Apply minimal change.**
7. **Re-measure.** If improvement is real and meets the goal — stop. If not, revert and try another hypothesis.
8. **Regression test.** Add a perf test (with reasonable tolerance) so you don't lose the win.

## Output shape

```
Goal:         <numeric target>
Baseline:     <metric snapshot>
Profile:      <hotspot identified — function or query, w/ %>
Hypothesis:   <fix description, expected gain>
Change:       <diff>
After:        <new metric snapshot>
Improvement:  <delta>
Status:       ✓ goal met | ✗ goal not met (revert)
```

## Rules

- **No optimisation without baseline.** "Faster" is not measurable.
- **No optimisation without profiling.** Intuition is wrong about hot paths >50% of the time.
- **Goal is numeric.** P95, throughput, memory, query count.
- **Revert if the change doesn't move the metric.** Speculative optimisations rot the code.
- **Add a perf test for the win.** Otherwise it regresses silently in 6 months.

## Anti-patterns

- "Cleaner code is faster" — sometimes, often not
- Caching without measuring cache hit rate
- Async-ifying sync code that wasn't blocking
- Premature optimisation in code that runs once a day
- Micro-optimising at the expense of readability when the macro problem is unsolved

## When NOT to use

- Refactoring for clarity (no perf goal) — `/siftcoder:refactor`
- Deleting code (smaller is better but not perf-driven) — `/siftcoder:zen`
- Bug fix — `/siftcoder:fix`

## Subagent dispatch

- `general-purpose` for targeted optimisation work
- `investigator` for read-only profiling diagnosis
- For Salesforce: `/siftcoder:sf-debug parse <log>` — dedicated debug-log analysis

## Value over native CC

CC will optimise on request. CC won't naturally insist on baseline + profile + numeric goal + revert-if-no-improvement. This skill enforces the discipline that distinguishes real optimisation from cargo-cult.
