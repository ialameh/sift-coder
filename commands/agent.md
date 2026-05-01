---
description: Full agentic multi-file refactor — planner → coder → qa-reviewer → qa-fixer pipeline w/ rollback. See skills/workflow/agent/SKILL.md
allowed-tools: Read, Edit, Write, Bash, Grep, Glob
---

# /siftcoder:agent

End-to-end agentic loop. Plan → Code → Review → Fix with checkpointing and rollback.

`$ARGUMENTS` is the goal or spec.

See `skills/workflow/agent/SKILL.md` for the full workflow contract.

Internally dispatches: `agents/planner.md`, `agents/orchestrator.md`, `agents/coder.md`, `agents/qa-reviewer.md`, `agents/qa-fixer.md`.

## Quick example

```
/siftcoder:agent migrate auth from JWT to session cookies
```

Will: pre-flight (clean tree, scope, checkpoint) → plan → user-approve → execute (parallel where independent) → QA review → fix gaps → verify → report.

Rollback: one `git reset --hard cp-<id>` away.
