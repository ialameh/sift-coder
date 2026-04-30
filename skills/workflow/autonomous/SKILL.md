---
name: autonomous
description: Use for long-running unattended runs. Strict safety brakes — checkpoint to memory every N steps, rollback gates, cost cap, time cap. NOT a substitute for native subagent dispatch on bounded tasks.
---

# autonomous

Long-running unattended execution. **Designed for hours-scale work, not minutes-scale.** Adds safety brakes native subagent dispatch lacks.

## When this differs from native subagent dispatch

- Native `Task`/`general-purpose`/`Plan` agents = bounded; user reviews output
- Autonomous = unbounded; runs through user sleep/dinner/meeting

## Method

1. **Manifest** before starting:
   - **Goal** — concrete, measurable end state
   - **Time cap** — hard stop wall clock
   - **Cost cap** — token/dollar budget
   - **Step cap** — max iterations before review-gate
   - **Boundaries** — `.siftcoder/scope.json` enforced
   - **Rollback** — git checkpoint before start
2. **Approval gate.** User confirms manifest before launch.
3. **Execution loop:**
   - Plan next step → check budgets → execute → checkpoint → continue
   - Every 5 steps: write a snapshot to memory + git stash/branch
   - On any budget breach: stop, summarise, await human
4. **End conditions:**
   - Goal met → write final report
   - Time/cost/step cap hit → pause + report
   - Unrecoverable error → rollback to last checkpoint + report
5. **Final report.** What was achieved. What's left. Recommended next.

## Output shape

```
Manifest:
  Goal:        <concrete>
  Time cap:    <hours>
  Cost cap:    <tokens / USD>
  Step cap:    <N>
  Scope:       <files>
  Rollback:    <git ref to revert to>

Approve to proceed? [y/N]

--- on completion ---

Result:      <goal-met | partial | aborted>
Wall time:   <hh:mm>
Tokens:      <count> / <cap>
Steps:       <count> / <cap>

What was achieved:
  - <items>

What's left:
  - <items>

Checkpoints:    <git refs>
Memory:         <summary ids>
Final state:    <commit / branch>

Recommended next: <action or "review and merge">
```

## Rules

- **Manifest required.** No autonomous run without explicit caps.
- **User approves manifest.** No silent autonomous mode.
- **Checkpoint every 5 steps minimum.** Hour-scale work without rollback = catastrophe.
- **Cost cap is hard.** Stop on breach.
- **Memory captures the run.** Reproducible.
- **Boundaries enforced via `.siftcoder/scope.json`.** Out-of-scope writes blocked by hook.

## Anti-patterns

- "Autonomous" with no cost cap (token bills)
- Starting without rollback ref
- Ignoring boundary hook errors
- Reporting only on success (failure mode is more important)
- Running > 4 hours without human review-gate

## When NOT to use

- Bounded task — native subagent dispatch
- Risky / irreversible domain — even with caps, autonomous is wrong
- No clear end-state — autonomous needs goal completion to terminate

## Subagent dispatch

- `Plan` for the manifest
- `general-purpose` for execution steps
- `Agent` with `isolation: "worktree"` for clean rollback
- Memory MCP throughout for checkpoint capture

## Value over native CC

CC subagent dispatch is bounded by single-session limits. Autonomous explicitly extends across long timeframes with explicit safety. The brake-system IS the value.
