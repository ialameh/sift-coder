---
name: dream
description: Use when the user wants unconstrained generative exploration — "no rules, just brainstorm", "what's possible", "/dream". Explicitly NOT for shipping. Output is ideas, not implementation.
---

# dream

Unconstrained generative exploration. **Explicitly not for shipping.** Output is ideas, sketches, "what if" — not code, not plans, not commitments.

## Method

1. **Frame.** Confirm: this is exploration, no intent to ship. If the user actually wants a feature, redirect to `/siftcoder:ideate` or `/siftcoder:add-feature`.
2. **Stretch.** Generate ideas across:
   - **Counterfactual**: "what if we removed X entirely"
   - **Maximalist**: "what if X went 10x further"
   - **Inversion**: "what if we did the opposite"
   - **Borrowed**: "how would <other domain> solve this"
   - **Absurd**: deliberately impractical, sometimes the spark
3. **No filtering.** Output 5-10 ideas. Don't pre-judge feasibility.
4. **No commitment.** Never say "we should build X". Always "imagine if X" / "consider X".
5. **Memory capture** the dream session as `kind: dream` so it doesn't pollute decision-search.

## Output shape

```
Frame:    <what we're dreaming about>

Ideas:
  1. <one-line>
     Heat: 🔥🔥🔥 (visceral, exciting) | 🔥🔥 | 🔥
     Why interesting: <one line>

  2. ...
  ...

Pick one to develop further? (none also fine — dreams can stay dreams.)
```

## Rules

- **No "we should".** Dreams aren't decisions.
- No tech-feasibility analysis (kills creativity).
- Heat rating from gut, not feasibility.
- Output is generative, not analytical.
- If user latches onto an idea, hand off cleanly to `/siftcoder:ideate` or `/siftcoder:build` — but only when explicitly asked.

## Anti-patterns

- Practical filtering during ideation ("but that wouldn't work because...")
- Code blocks (this isn't an implementation pass)
- Lists of feature flags / stack choices
- Risk register / cost estimate (kills the dream)
- "Realistic" framing that constrains imagination

## When NOT to use

- User wants real next-feature ideas — `/siftcoder:ideate` (memory-grounded, practical)
- User wants to ship — `/siftcoder:build` or `/siftcoder:add-feature`
- Stakeholder presentation — dream output is too unfiltered

## Subagent dispatch

- None — dream is direct generation
- Optional: `Explore` to peek at the codebase for grounding the dream in reality (sparingly)

## Value over native CC

CC defaults to grounded, practical responses. Dream gives explicit permission to be unconstrained. Different mode, different output. Useful for unblocking when stuck in a "should we ship X or Y" rut.
