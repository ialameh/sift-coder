---
name: fuzz-mind
description: Use to generate adversarial edge-case test inputs targeting the actual code paths. AI reads the function, finds the assumptions, and writes inputs that violate them. Beats random fuzzing for code with structure.
---

# fuzz-mind

Targeted adversarial test generation. Reads the function, finds implicit assumptions, generates inputs that break them.

## Method

1. **Read the function.** Understand:
   - Parameter types (declared and implicit)
   - Branches and what triggers each
   - External dependencies (file IO, network, time, randomness)
   - Stated invariants (in comments, types, asserts)
   - **Unstated invariants** (this is the goldmine — what the code "obviously" assumes)
2. **Mine for assumptions:**
   - Length: empty, 1-element, max+1
   - Numeric: 0, negative, NaN, Infinity, max-int
   - String: empty, unicode-edge, RTL, very long, control chars
   - Time: pre-epoch, future, leap second, DST boundaries
   - Concurrency: parallel calls with same/different inputs
   - State: called twice, called from inside itself
   - File: missing, permission-denied, race-deleted mid-read
3. **Generate inputs.** Top 10 most likely to expose bugs.
4. **Write tests.** Each input gets a test with:
   - Input description
   - Expected behaviour (defined behaviour, error, or undefined-but-must-not-crash)
5. **Run.** Surface results. Failed tests are findings.

## Output shape

```
Target:   <fn signature, file:line>

Assumptions found (implicit):
  - Input string is non-empty
  - Number is positive integer
  - File path exists at call time
  ...

Adversarial inputs (top 10):
  1. <input>     Expected: <error type | graceful return | undefined>
  2. ...

Test results:
  ✓ 7 passed (correct behaviour)
  ✗ 3 failed (real bugs found)

Findings:
  Bug #1: <input> caused <unexpected behaviour> at <file:line>
  Bug #2: ...
```

## Rules

- **Targeted, not random.** Each input must target a specific assumption, not be random.
- **Expected behaviour is explicit.** "Should not crash" is fine for undefined; for defined behaviour, name the expected outcome.
- **Real bugs go to `/siftcoder:fix`.** fuzz-mind finds; fix repairs.
- **Don't propose "validate input everywhere".** Fix the actual bug, not blanket defence.

## Anti-patterns

- Random string fuzzing without targeting structure
- Tests that assert "doesn't throw" — too weak; specify the actual contract
- Fuzzing private internals (test the public surface)
- Generating 10000 inputs when 10 carefully chosen find the bugs

## When NOT to use

- Functions with no input variability (constants, pure config)
- Code with already-extensive property-based tests
- Pre-shipping crunch — fuzz-mind is exploratory

## Subagent dispatch

- `Explore` to read the function and callers
- `tester` agent for generating the test bodies
- `investigator` if a found bug needs deeper diagnosis

## Value over native CC

CC will write tests. CC won't naturally focus on adversarial inputs that target unstated invariants. The targeting IS the value — better than 10000 random inputs.
