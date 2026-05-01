---
name: test
description: Use for multi-modal test generation — unit, integration, e2e, property-based, mutation. Sub-modes pick the right shape per intent. Different from /tdd (which is the discipline) — /test is the production tool.
---

# test

Multi-modal test generation. Picks the right shape per the intent.

## Sub-modes

| Mode | When | Tool / pattern |
|---|---|---|
| `unit` | bounded function/class | vitest / jest / pytest |
| `integration` | multi-component flow | API client → real downstream / DB |
| `e2e` | user-facing happy path | Playwright / Cypress / WebDriver |
| `property` | universal contracts | fast-check / hypothesis / proptest |
| `mutation` | test-quality audit | stryker / mutmut |
| `coverage` | gap-finding | c8 / istanbul + threshold review |
| `bulk` | Salesforce 200+ record paths | Apex test class |

## When this differs from /tdd

- `/tdd` — discipline (red-green-refactor, refuse production code without failing test)
- `/test` — production tool (generate tests for existing or new code, in any of the above modes)

Use both together: TDD for new behaviour; `/test` for filling coverage gaps or generating integration scaffolds.

## Method

1. **Pick mode** (or detect from intent).
2. **Read target.** Function signature, callers, existing test style in the repo.
3. **Behaviour enumeration.** For each public behaviour:
   - Happy path
   - Edge cases (empty, null, boundary)
   - Error cases
   - State transitions
4. **Generate tests** in the project's existing style (extracted from neighbouring tests).
5. **Mocking decisions:**
   - Boundary I/O (network, time, randomness, file): mock
   - Internal pure logic: don't mock
   - Database in integration tests: real DB, not mock
6. **Run.** All pass. Mutation-test sample: each test should fail when implementation is broken.
7. **Coverage report.** Gaps named explicitly.

## Output shape

```
Mode:        unit
Target:      src/auth/middleware.ts:authenticate

Behaviours covered:
  ✓ valid token → next() called
  ✓ missing token → 401
  ✓ expired token → 401
  ✓ malformed token → 400
  ✓ revoked token → 401
  ✓ token with tampered sig → 401

Tests added:
  tests/auth/middleware.test.ts:14 — valid token
  tests/auth/middleware.test.ts:34 — missing token
  ...

Mocking:
  - mocked: jwt.verify (boundary)
  - not mocked: token-format validation (internal pure)

Verification:
  ✓ all 6 tests pass
  ✓ mutation-test sample: each fails when authenticate() is broken
  Coverage delta: +12% lines, +8% branches on auth/

Captured: <memory id>
```

## Rules

- **Behaviour-named tests** ("should reject expired token" not "test_expired").
- **Mutation-test sanity** — sample 1-2 tests; verify they fail with broken implementation.
- **Match project style** — vitest? jest? Apex `@IsTest`? Don't reinvent.
- **Don't mock the thing under test.**
- **Salesforce: 200-record bulk-safety pattern** for triggers / DML code.

## Anti-patterns

- Generated tests that all pass regardless of implementation (fake coverage)
- Mocking internals (test does nothing)
- Implementation-detail assertions (`expect(x).toHaveBeenCalledWith(...)` for private methods)
- Coverage chasing without behaviour mapping

## When NOT to use

- Pure red-green-refactor — `/tdd` skill
- Property-based on integer math when unit is enough — overkill
- Generated code (codegen output) — test the inputs, not the gen

## Subagent dispatch

- `tester` agent for the structured pass
- `Explore` to find existing test style
- `Bash` for mutation-test invocation

## Value over native CC

CC will write tests. CC won't naturally pick the mode, enforce mutation-test sanity, or refuse to mock internals. The mode-aware + discipline framing IS the value.
