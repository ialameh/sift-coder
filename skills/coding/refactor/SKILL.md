---
name: refactor
description: Use for refactoring — same behaviour, better structure. Test-coverage gate enforced. Extract-then-rename ordering. Refuses to mix in feature changes or bug fixes.
---

# refactor

Same behaviour, better structure. Tests are the contract — they must stay green throughout.

## Method

1. **Coverage gate.** Read the test coverage of the area you're refactoring. **If &lt; 80% line coverage of the target code, write tests first** until it is. Refactor without coverage = unsafe.
2. **Memory pass.** Has this area been refactored before? Reuse the lessons.
3. **Plan.** State the target shape (in &lt; 100 words). State the smell being addressed (e.g. "long method", "feature envy", "shotgun surgery").
4. **Mechanical sequence.** Refactor in this order:
   - **Extract** before **rename** before **move**
   - Each step is its own commit (or commit-shaped diff in a PR)
   - Run tests **after every step**
5. **Verify.** Tests green. Lint. Typecheck. Read your own diff — does it actually look better?

## Output shape

```
Target:      <area: file/symbol>
Smell:       <which one>
Goal shape:  <one paragraph>

Steps:
  1. Extract <X> from <Y>           ✓ tests green
  2. Rename <A> → <B>                ✓ tests green
  3. Move <fn> to <module>           ✓ tests green
  ...

Verify:      lint ✓ types ✓ tests ✓ (M passing, N before N after)
```

## Rules

- **Tests stay green.** If a test breaks, the refactor changed behaviour — that's a different workflow.
- **No feature changes.** Spotted a bug or missing feature? Note in memory + suggest as follow-up.
- **One smell per refactor.** Don't mix "long method" with "rename" with "move" in undisclosed ways.
- **Mechanical.** If you can't describe the step in one verb + one noun, it's too big.

## Anti-patterns

- "Refactor" that touches semantics (e.g. changing default values, error messages)
- Big-bang refactor in one commit — impossible to review or revert
- Renaming variables across 50 files when only the public API needs renaming
- Refactor that increases line count without increasing clarity

## When NOT to use

- Bug fix — `/siftcoder:fix`
- Performance — `/siftcoder:optimize`
- Aggressive simplification / deletion — `/siftcoder:zen`
- New feature — `/siftcoder:add-feature`

## Subagent dispatch

- `Explore` to map current shape
- `Plan` for non-trivial multi-step refactors
- `general-purpose` for the mechanical edits

## Value over native CC

CC will refactor when asked. CC won't naturally insist on coverage gates, mechanical step ordering, or refuse to mix concerns. This skill enforces the discipline that makes refactors safe.
