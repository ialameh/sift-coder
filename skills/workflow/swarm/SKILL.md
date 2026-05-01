---
name: swarm
description: Use to dispatch multiple parallel subagents on independent tasks. Discipline around isolation, conflict resolution, merge strategy. Wraps native parallel Task dispatch with structured gates.
---

# swarm

Parallel subagent dispatch with discipline. Native CC supports parallel `Task` calls; this skill adds isolation + merge strategy.

## When this beats raw parallel Task

- Tasks share files → need isolation (worktrees)
- Tasks may conflict → need merge strategy
- Tasks have shared dep order → need orchestration
- N tasks > 3 → benefit from explicit dispatch matrix

## Method

1. **Decompose.** Confirm tasks are truly independent. If task B depends on task A's output, swarm is wrong — sequence them.
2. **Per-task isolation.**
   - Read-only tasks → no isolation needed
   - Write tasks → `Agent` with `isolation: "worktree"`
3. **Dispatch matrix.** Table of task × subagent × scope.
4. **Launch in single message.** Multiple `Task` tool calls in one assistant turn — that's how parallel works in CC.
5. **Wait** for results. Don't fabricate predictions while pending.
6. **Merge strategy.**
   - Independent files → just merge
   - Shared files → conflict resolution plan (one wins | rebase | manual review)
7. **Verify.** Tests after merge. Lint. Typecheck.

## Output shape

```
Goal:    <umbrella task>

Dispatch matrix:
  T1  [worktree-a]  refactor src/auth        → general-purpose
  T2  [worktree-b]  refactor src/payment     → general-purpose
  T3  [read-only]   audit src/admin          → Explore

Launching 3 agents in parallel...

[results land — fork notifications in later turns]

Merge plan:
  T1 → branch: refactor-auth        (no conflicts)
  T2 → branch: refactor-payment     (no conflicts)
  T3 → output: docs/admin-audit.md  (read-only; just commit)

Merge order: T3, T1, T2 (T3 produces nothing conflicting)

Verification:
  Tests after each merge: ✓ green
  Final tests: ✓ N passing
```

## Rules

- **One assistant message launches all parallel agents.** Sequencing them across turns defeats parallelism.
- **Isolation for write-tasks.** Conflict resolution is harder than upfront isolation.
- **Don't predict results.** While agents run, don't fabricate. Status updates only.
- **Merge order is deterministic.** Document it.

## Anti-patterns

- Launching 7 agents on truly independent tasks (CC permits up to ~3-4 cleanly; more = cap risk)
- Shared write target without isolation (race-condition equivalent)
- Sequencing dependent tasks as parallel
- Reading sub-agent transcripts mid-flight (defeats the context savings)

## When NOT to use

- Single task — direct dispatch
- Sequential dependencies — `Plan` then sequential `Task`s
- Tiny tasks — overhead exceeds value

## Subagent dispatch

- This skill IS the dispatch pattern
- Agents launched are typically `general-purpose` and `Explore`

## Value over native parallel Task

Native parallel Task is just multiple calls in one message. Swarm adds: explicit isolation, merge strategy, verification gates. The discipline IS the value — keeps parallel work from creating conflict tar pits.
