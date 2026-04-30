---
name: analyze
description: Use for generic analysis with structured output — readability, complexity, risk, performance, churn, dep health. Multiple sub-modes; pick or detect.
---

# analyze

Generic analysis with structured output. Multiple sub-modes for different angles.

## Modes

- `readability` — Flesch-Kincaid for prose; cognitive load for code
- `complexity` — cyclomatic, cognitive, nesting depth
- `risk` — combines complexity + churn + coverage gaps
- `performance` — hotspots from profiling
- `churn` — files most-modified per timeframe
- `dep-health` — outdated deps, security advisories, abandoned packages
- `naming` — naming consistency vs conventions
- `surface-area` — public API breadth vs use depth

User picks (or skill picks based on phrasing).

## Method

1. **Mode pick.**
2. **Run measurement.**
   - Code analysis tools per mode (e.g. `eslint --rule complexity` for complexity)
   - `git log --shortstat` for churn
   - `npm audit` for dep health
3. **Rank.** Top 10 by mode-relevant score.
4. **Recommend** (don't auto-fix).

## Output shape (example: complexity)

```
Mode:    complexity

Top 10:

#1  src/payment/processor.ts:14  function processPayment
    Cyclomatic:   24
    Cognitive:    38
    Lines:        185
    Recommend:    extract validatePayment, settleCharge as separate fns

#2  src/auth/middleware.ts:42  function authenticate
    ...

Distribution:
  Functions with complexity > 10: 7
  Functions with complexity > 20: 2
  Average:                          4.3
```

## Rules

- **Mode-appropriate metric.** Don't run cognitive complexity for prose readability.
- **Real measurement, not estimate.** Use tools.
- **Recommendations actionable.** Name the refactor.
- **Don't auto-fix.** Surface; let user act.

## Anti-patterns

- Mode mismatch (readability of code = wrong tool)
- Aggregate scores without per-item breakdown
- "High complexity" without naming the function
- Recommendations that are too generic ("refactor this")

## When NOT to use

- Specific concern (use the targeted skill — `/empathy`, `/optimize`, `/security`)
- Tiny codebase (manual judgement faster)

## Subagent dispatch

- `Explore` for breadth
- `Bash` for tool invocations
- `general-purpose` for synthesis

## Value over native CC

CC will analyse on request. CC won't naturally pick the mode-appropriate metric or surface ranked findings with concrete recommendations. The mode-discipline IS the value.
