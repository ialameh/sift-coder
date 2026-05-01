---
name: feasibility
description: Use for go/no-go on a proposed feature/refactor/migration. Effort estimate + risk register + confidence. Outputs a 1-page memo, not an exhaustive technical study.
---

# feasibility

Quick go/no-go memo. Effort, risk, confidence — all explicit. One page max.

## Method

1. **Restate the proposal in one sentence.** If it doesn't fit, scope is too broad — split.
2. **Effort estimate** in three buckets:
   - **Best case** (everything goes well)
   - **Likely case**
   - **Worst case** (hidden complexity emerges)
3. **Risk register.** Top 3-5 risks. Each gets: probability (low/med/high), impact (low/med/high), mitigation, owner.
4. **Confidence.** How sure are you in the estimate? Drivers:
   - Have similar work been done? (memory pass)
   - Is the codebase area well-understood?
   - Are dependencies stable?
   - Is the spec clear?
5. **Recommendation.** Go / no-go / yes-with-condition. **Pick one.** Don't punt.

## Output shape

```
# Feasibility memo: <proposal>

## Proposal
<one sentence>

## Effort
- Best:    <hours/days>  — assumes <conditions>
- Likely:  <hours/days>
- Worst:   <hours/days>  — if <unknowns> turn out badly

## Risks
| # | Risk | Prob | Impact | Mitigation | Owner |
|---|---|---|---|---|---|
| 1 | <risk> | M | H | <plan> | <name> |
| 2 | ... |
...

## Confidence
<low | med | high> — driver: <why>

## Recommendation
<GO | NO-GO | GO with conditions: <list>>

## Memory references
- Prior similar work: <summary id> — <outcome>
```

## Rules

- **One page.** If you need more, scope is wrong.
- **Three estimates, not one.** Single point estimates are misleading.
- **Pick a recommendation.** "It depends" is not feasibility.
- **Memory grounding.** If similar work was done before, cite outcome. Adjusts confidence.

## Anti-patterns

- "Could go either way" recommendation
- Single-point estimate ("about a week")
- Risk register without mitigations
- Hand-wavy confidence ("medium-ish")
- Long technical study masquerading as a feasibility memo

## When NOT to use

- Tiny change — overkill
- Already approved — write the plan, not a memo
- Pure research / dream — `/dream`

## Subagent dispatch

- `Plan` for effort breakdown
- `general-purpose` for risk enumeration
- Memory MCP for prior similar work

## Value over native CC

CC will discuss feasibility if asked. CC won't naturally produce a 1-page memo with three-point estimates, structured risk register, and a forced recommendation. The forced recommendation IS the value — turns "discussion" into a decision.
