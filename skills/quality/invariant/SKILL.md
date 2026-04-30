---
name: invariant
description: Use to discover implicit invariants/contracts in code and make them explicit. "What does this function silently assume", "find the contracts". Outputs are runtime asserts, type narrowings, or doc additions.
---

# invariant

Mines hidden contracts. Finds the rules code follows but never states. Surfaces them as asserts, types, or docs.

## Method

1. **Read.** The function/class/module under analysis.
2. **Find the seams** — places where the code:
   - Indexes without bounds-checking
   - Casts a type without narrowing
   - Calls a method without checking presence
   - Assumes ordering of inputs
   - Assumes uniqueness of keys
   - Assumes timezone / locale / encoding
   - Assumes a config value is present
   - Assumes a global state is initialised
3. **For each seam, infer the invariant** ("this assumes X").
4. **Decide enforcement**:
   - **Compile-time**: tighten types (remove `any`, narrow unions, add literal types)
   - **Runtime**: assert in dev, log in prod
   - **Documentation**: JSDoc/`@param` clarification when above are too heavy
5. **Apply** the chosen enforcement, smallest first.

## Output shape

```
Subject:   <file:line — fn/class>

Invariants found (implicit → explicit):

  I1: <statement>
      Where: <file:line>
      Enforcement: <type | assert | doc>
      Diff: <patch>

  I2: ...

Action:
  ✓ Type narrowing applied: 3
  ✓ Asserts added: 2
  ✓ Docstrings updated: 1
  Tests: still green
```

## Rules

- **Prefer types over runtime.** Compile-time check costs zero at runtime.
- **Asserts are dev-loud, prod-quiet.** `assert(x !== null)` in dev; metric/log in prod.
- **Docs are last resort.** Future readers may not read them.
- **One invariant per change.** Easy to revert if it surfaces a real bug.
- **Don't add asserts for impossible cases.** If the type system already proves it, don't double-check.

## Anti-patterns

- Defensive checks for cases the caller cannot trigger
- `assert(true)` placeholders
- Doc-only invariants where types would suffice
- Stripping `any` casts without checking what they were hiding (often a real bug)

## When NOT to use

- Generated code (regen pipeline overrides changes)
- Library/SDK with strict ABI commitments — invariant changes might be breaking
- Code with no runtime characterisation tests — assert additions might break unstated existing behaviour

## Subagent dispatch

- `Explore` to map callers (asserts must hold for all callers)
- `general-purpose` for the diff
- `tester` to add tests that exercise the invariant boundary

## Value over native CC

CC will add type annotations or asserts on request. CC won't systematically mine implicit invariants and surface them in priority order. The mining IS the value.
