---
name: empathy
description: Use to measure cognitive load of code — what's frustrating, what's hard to understand, where readers waste mental cycles. Outputs friction map + ranked refactor candidates by user pain, not architectural elegance.
---

# empathy

Code review from the **next reader's** perspective. Quantifies friction. Refactor candidates ranked by reader pain, not abstract code-smell metrics.

## Method

1. **Pick the reader.** Most useful is "engineer joining the team next week, has 2 hours to get oriented". Tailor to a different persona if user requests.
2. **Friction probes** (per file/function):
   - **Naming** — does the name match what it does? Unsurprising?
   - **Length** — can the reader hold it in their head?
   - **Indentation** — > 3 levels = where am I
   - **Implicit context** — needs to know X, Y, Z to understand
   - **Surprises** — does anything diverge from the codebase's idioms
   - **Doc coverage** — public API has rationale or just signature?
3. **Score each finding 1-5** on reader pain.
4. **Rank.** Top 10 friction sources by score × use-frequency (how often readers encounter this).
5. **Recommend** smallest-change-highest-impact refactors. Not "rewrite everything" — "rename X, extract Y, add a comment to Z".

## Output shape

```
Reader persona:    <e.g. "new hire, 2-hour orientation">
Files reviewed:    N

Top friction sources:

#1  [pain 5]  <file:line>
    Friction:    <what hurts>
    Why:         <reader perspective>
    Fix:         <smallest change>
    Cost:        <minutes>
    Use freq:    high|med|low

#2  ...

Friction map:
  Naming      ███░░░░ 3
  Length      ██████ 5
  Indent      ██░░░░ 2
  Implicit    █████░ 4
  Surprise    ██░░░░ 2
  Doc         ████░░ 3
```

## Rules

- **Reader-first.** Don't flag things readers don't actually hit.
- **Smallest change.** A rename beats a refactor. A comment beats a rename if naming would break ABI.
- **Quantify pain.** Score 1-5 with rationale. Vague flagging = noise.
- **Use-frequency matters.** Painful internals nobody reads are lower priority than mildly painful hot paths.

## Anti-patterns

- Style-policing (handled by linter)
- "Could be more elegant" — that's `/siftcoder:zen`, not empathy
- Recommending wholesale rewrites
- Ignoring use-frequency — fixing cold code is low ROI

## When NOT to use

- Code review of a specific PR — `/review`
- Performance — `/optimize`
- Pre-shipping cleanup — `/zen`
- Active feature work — empathy interrupts flow

## Subagent dispatch

- `Explore` for breadth
- `general-purpose` for the ranking and recommendations
- `reviewer` agent (if installed) for the persona-driven pass

## Value over native CC

CC will critique code. CC won't naturally adopt a specific reader persona, score by reader pain, or weight by use-frequency. The persona-driven framing IS the value.
