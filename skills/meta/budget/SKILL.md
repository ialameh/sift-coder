---
name: budget
description: Use to set + track token / cost budgets, get warnings on overrun, and optimise efficiency. Backed by `Budget` class in src/services/tokens.ts. Pairs with /siftcoder:budget command.
---

# budget

Token + cost awareness. Set a limit; track usage; surface warnings; optimise.

## Sub-modes

- **set <limit>** — set the budget limit (tokens or USD)
- **status** — show current consumption
- **report** — historical usage by skill / agent / session
- **optimise** — recommend savings (model downsizing, prompt caching, compression)

## Method (set)

1. Limit can be **tokens** (int) or **USD** (float w/ pricing assumption).
2. Scope: **session** (default) | **daily** | **monthly** | **per-task**.
3. Persist to `~/.siftcoder/budget.json`.
4. Warn at 80%, hard-stop at 100% (configurable).

## Method (status)

1. Read consumption ledger
2. Show: limit / used / remaining / pct / projected (linear extrapolation if mid-window)

## Method (report)

1. Aggregate from memory: tokens-in / tokens-out per summary.
2. Group by skill / agent / model.
3. Top consumers ranked.

## Method (optimise)

1. Find high-consumers (top 5 by cost).
2. For each:
   - Could it use a smaller model? (Haiku vs Sonnet vs Opus)
   - Could prompt caching reduce repeat cost?
   - Could output compression reduce tokens-out?
   - Is there an Ollama-eligible substitute?
3. Estimate savings.

## Output shape (status)

```
Budget:           1,000,000 tokens (session)
Used:             423,450 (42%)
Remaining:        576,550
Projected:        780,000 by session end (78%)
Warning at:       80%
Hard-stop at:     100%
```

## Output shape (optimise)

```
Top consumers (this session):
  /siftcoder:reverse-prompt   142,000 tokens   $0.42
  /siftcoder:archaeologist     98,000 tokens   $0.29
  /siftcoder:codemap           54,000 tokens   $0.16

Recommendations:
  1. reverse-prompt → use cache (8 of 12 invocations had identical fingerprint)
     Estimated savings: 110k tokens / $0.32

  2. archaeologist → switch to Haiku for first pass; only escalate to Sonnet if confidence < 0.7
     Estimated savings: 45k tokens / $0.13

  3. codemap → enable Ollama for embedding-only ops
     Estimated savings: 30k tokens / $0.09

Total projected savings: 185k tokens / $0.54 (~44% of session)
```

## Rules

- **Hard-stop is honoured.** No exceptions without explicit user override.
- **Warnings non-blocking** — status update only.
- **Use real measurement.** `gpt-tokenizer` for token counts; current Anthropic pricing for USD.
- **Per-skill granularity** for report — don't lump everything together.
- **Memory captures budget events** so trends emerge over weeks.

## Anti-patterns

- Setting a budget then ignoring the warning
- USD-based limits without naming the model (different price points)
- Optimising before measuring (premature optimisation)
- Treating soft warnings as hard-stops (alert fatigue)

## When NOT to use

- Single-shot scripted task — overhead > value
- Local-only Ollama work — token cost is electricity, not API
- Pre-launch crunch — wrong time to start counting

## Subagent dispatch

- None — local computation
- Memory MCP for the consumption ledger
- Use `src/services/tokens.ts` `Budget` class directly

## Value over native CC

CC has no native budget tracking. The Budget primitive + skill provide the discipline. Useful for long autonomous runs (`/autonomous`) where token spend can grow unboundedly.
