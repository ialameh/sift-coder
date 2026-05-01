---
name: agent
description: Use for full agentic multi-file refactoring or feature work — spec → planner → coder → qa-reviewer → qa-fixer pipeline with rollback. The "do the whole loop" command. Pairs with /siftcoder:agent.
---

# agent

End-to-end agentic loop. Plan → Code → Review → Fix with safety brakes. The single-command equivalent of manually chaining the planner / coder / qa-reviewer / qa-fixer agents.

## When this differs from `/build`

- `build` skill → build a feature from a spec, smaller scope, no QA loop
- `agent` skill → full multi-agent pipeline with QA and remediation, suited to multi-file refactors and risky features

## When this differs from `/autonomous`

- `autonomous` → long-running unattended runs (hours)
- `agent` → bounded multi-file pipeline (minutes-to-hours), single goal, gated milestones

## Method

1. **Spec ingest.** User-provided spec or planner-output. If absent, dispatch `planner` agent first.
2. **Pre-flight.**
   - `git status` — must be clean (or stash)
   - Scope check — `.siftcoder/scope.json` (and chroot if set)
   - Checkpoint via `/checkpoint` skill — rollback ref
3. **Plan.** Dispatch `planner` agent → structured plan w/ subtasks.
4. **Approve.** Surface plan to user. Wait for approval (skip in fully-autonomous mode w/ explicit user opt-in).
5. **Execute.**
   - Sequential subtasks → `coder` agent per subtask
   - Parallelisable subtasks → `orchestrator` agent → batched dispatch
6. **Review.** Dispatch `qa-reviewer` agent against AC.
7. **Fix.** If qa-reviewer flags issues → dispatch `qa-fixer` agent.
8. **Re-review.** Loop step 6+7 once. If still failing → escalate to user.
9. **Verify.** Tests, lint, typecheck.
10. **Capture.** Memory captures the full run (plan, execution, QA outcomes).

## Output shape

```
# Agent run: <goal>

## Pre-flight
  ✓ git clean
  ✓ scope: 14 files in chroot
  ✓ checkpoint saved: cp-<id>

## Plan (planner agent)
  T1  refactor src/auth/middleware  (deps: none)
  T2  update tests/auth/*           (deps: T1)
  T3  migrate config schema         (deps: none)
  ...

User approval: ✓ (or autonomous mode)

## Execution
  T1: ✓ done by coder        files: 2 changed
  T3: ✓ done by coder        files: 1 changed
  T2: ✓ done by coder        files: 4 changed

## QA Review (qa-reviewer agent)
  AC1: ✓ pass
  AC2: ✓ pass
  AC3: ✗ uncovered — test missing for edge case

## QA Fix (qa-fixer agent)
  AC3: ✓ fixed — added test in tests/auth/edge.test.ts

## Re-review
  ✓ all AC pass

## Verification
  Tests: 412/412 ✓
  Lint:  ✓
  Types: ✓

## Final
  Files changed:    7
  Tests added:      5
  Memory:           summary id <X>
  Rollback:         git reset --hard cp-<id>

## Recommended next
  Manual smoke test → commit → merge
```

## Rules

- **Pre-flight required.** Clean tree + scope + checkpoint before any write.
- **User approval gate** by default. Autonomous mode is opt-in per run, not per project.
- **Loop cap.** Max 1 review-fix cycle. Second failure → escalate.
- **Rollback path explicit.** Always one git command away from before.
- **Memory captures the whole run** — re-runs of similar tasks reuse the plan.

## Anti-patterns

- Skipping pre-flight (no rollback = catastrophe)
- Treating qa-reviewer output as ignorable
- Looping review-fix indefinitely (cap at 1; escalate)
- Running on dirty tree

## When NOT to use

- Single-file change — `/fix` or `/build`
- Long autonomous run (hours) — `/autonomous` (different brake system)
- Pure investigation — `/investigate`

## Subagent dispatch

- `planner` → plan
- `orchestrator` → batched parallel dispatch
- `coder` → implementation per subtask
- `qa-reviewer` → AC validation
- `qa-fixer` → bounded remediation

## Value over native CC

CC has parallel `Task` calls + `Plan`. CC doesn't enforce: pre-flight checkpointing, plan approval gate, AC-validated review, scope-bounded fixer, single-cycle review-fix cap. The end-to-end discipline IS the value — turns "agentic refactor" from risky into auditable.
