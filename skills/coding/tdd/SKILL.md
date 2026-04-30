---
name: tdd
description: Use when the user invokes TDD discipline, says "write test first", "test-driven", "/tdd". Strict red-green-refactor. Refuses to write production code before a failing test exists.
---

# tdd

Strict TDD. Test first, fail first, then code, then refactor. Non-negotiable order.

## Method

For each unit of behaviour:

1. **Red.** Write **one** test that asserts the desired behaviour. Run it. **It must fail** — verify the failure mode is the absent behaviour, not a syntax error or wrong import.
2. **Green.** Write the **simplest** code that makes the test pass. Hardcoded values are fine if the test only asserts one input. Run all tests. All green.
3. **Refactor.** With all tests green, improve structure. Extract, rename, dedup. Run tests after every change — must stay green.
4. **Next.** New test that triggers a generalisation. Repeat.

## Rules — non-negotiable

- **No production code without a failing test.** If you find yourself writing code and there's no failing test for it, stop, write the test.
- **Test must have actually failed.** If you wrote a test and it passed immediately, you wrote the wrong test or the code was already there. Diagnose; don't claim done.
- **Tests are first-class.** Bad test names, no assertions, mocking the thing under test = same as no test.
- **Refactor only when green.** Never refactor on a failing test (you lose your ground truth).
- **One test at a time.** Don't write three tests then implement all three.

## Output shape per cycle

```
Cycle N
  Behaviour:  <one sentence>
  Red:        <test path>:<line>  ← failed with: <quoted error>
  Green:      <smallest change to make it pass>
  Tests:      M passing
  Refactor:   <what changed>  | tests: M passing
```

## Anti-patterns

- Writing the production code "in your head" before the test (cheating)
- Test that asserts implementation detail (e.g. private method called) instead of behaviour
- Big-bang test that asserts 5 behaviours — split it
- Refactoring during red (you have no safety net)
- Skipping refactor because "it works" (debt accumulates fast)

## When NOT to use

- Spike / exploration code (use `/siftcoder:dream` or scratch)
- Pure config / data file changes
- Generated code (e.g. graphql codegen) — test the inputs, not the output

## Subagent dispatch

- `tester` agent (if installed) — knows behaviour-coverage gates, not just line coverage
- `Plan` to break a feature into TDD-shaped units of behaviour before starting

## Memory capture

Each red-green-refactor cycle is a captured event. Future "how do we test X" queries surface prior TDD cycles in the same module.

## Value over native CC

CC will write tests if asked. CC won't refuse to write code first if you ask it for code first. This skill enforces the order. The discipline IS the value.
