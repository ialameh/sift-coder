---
name: oracle
description: Use when the user wants predictive intent inference — "what am I about to do", "what would I likely want next", "predict the next step". Mines memory patterns to forecast the next action.
---

# oracle

Predictive intent. Looks at recent activity + memory patterns + current cursor/file/branch state. Suggests the next 1-3 likely actions before the user asks.

## Method

1. **Recent state.** Read the last ~10 turns of conversation, current open file (if any), current branch, last few commits.
2. **Memory pattern mine.** `mem_search` for similar contexts in the past. What did the user do **after** being in this state historically?
3. **Generate hypotheses.** Top 3 likely next actions. For each:
   - Confidence (low | med | high)
   - Evidence (which past context this echoes)
   - Suggested invocation
4. **Surface, don't act.** Output is a list of suggestions. Wait for user direction.

## Output shape

```
Current state:
  Branch:     <branch>
  Recent:     <last 3 actions, compressed>
  Open:       <file or area>
  Memory:     <similar past contexts found, w/ ids>

Predicted next actions:

  H1 [high]   <action> — <suggested invocation, e.g. "/siftcoder:fix">
              Why: <evidence from past pattern>

  H2 [med]    <action>
              Why: ...

  H3 [low]    <action>
              Why: ...

User: pick one (1/2/3) or describe alternative.
```

## Rules

- **Predict only — never execute.** Oracle is read-only and surface-only.
- 3 hypotheses max. More dilutes signal.
- Confidence-rank by memory match strength + recency.
- If the state is novel (no memory matches), say so. Don't fabricate predictions.

## Anti-patterns

- Predicting based on heuristics without checking memory
- Acting on your own prediction without user confirm
- Predicting 7 things (analysis paralysis)
- Hedging every prediction as "low confidence" — useless

## When NOT to use

- User has stated their intent — just do it, don't predict
- Memory is empty (no prior sessions) — predictions will be guesses
- High-stakes irreversible action ahead — verify, don't predict

## Subagent dispatch

- None — oracle is a fast inference, not a delegated task
- Optional: `Explore` if state requires reading more files to ground the prediction

## Value over native CC

CC responds to what you ask. Oracle proactively names what you'd likely ask next, grounded in your own history. Useful for: "I'm about to do something but not sure what to start with" or "what's the obvious next step here".
