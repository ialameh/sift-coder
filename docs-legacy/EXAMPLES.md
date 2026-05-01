# Examples

Session traces showing how SiftCoder commands compose in practice. All examples are illustrative — actual results depend on your codebase + memory state.

## Memory recall

User: *"Did we already discuss the auth caching strategy?"*

Claude internally calls:
```
mem_search { query: "auth caching strategy", k: 5 }
```

Result:
```
[3 hits — top: "decided to skip in-memory cache; redis already in stack"
 (2026-04-12, confidence 0.91, model llama3.2:3b)]
```

User: *"Why?"*

Claude internally:
```
mem_why { kind: "summary", id: "142", depth: 3 }
```

Returns the chain of events that led to summary 142 — git commit, code read, decision Bash session — preventing the user from re-deriving the answer.

## Architecture review (Salesforce)

```
/siftcoder:sf-architect
```

Dispatches the `salesforce-architect` agent. Output:

- Capacity table: SOQL queries, DML rows, callouts, heap by transaction type
- Risk register: governor-limit hot spots, missing bulk safety, integration patterns
- Recommendations: prioritised by blast radius

Read-only — no code changes.

## Bounded fix

```
/siftcoder:fix "Apex test class throwing NullPointerException on bulk insert"
```

Workflow:

1. Boundary enforcer pins scope to the test class file
2. `investigator` agent reproduces and identifies root cause
3. `coder` implements the fix; refuses to edit unrelated files
4. `qa-reviewer` validates the AC; structured pass/fail
5. `qa-fixer` addresses any issues qa-reviewer flagged

## What-if exploration

```
/siftcoder:ghost "what if we used Flow instead of Apex for this calc"
```

Forks reasoning without touching real code. Returns:

- Two implementations side by side
- Pros/cons grounded in the existing org constraints (read from memory)
- Explicit recommendation

## Long unattended work

```
/siftcoder:autonomous "migrate all triggers to Apex Trigger Framework w/ tests + deploy validation"
```

The `orchestrator` agent coordinates `planner` → `coder` → `tester` → `qa-reviewer` in a file-locked pipeline. Memory captures every step; checkpoints created at key milestones; `should-continue` hook surfaces a summary on `Stop`.

## Idea grounding

```
/siftcoder:ideate "what should we build next for the customer portal?"
```

The `ideate` skill pulls prior memory:

- Past rejected ideas (don't re-suggest)
- Open TODOs from comments + Slack pastes
- Decisions that opened new doors

Returns scored ideas tied to memory citations.

## Reverse engineering

```
/siftcoder:reverse-prompt deep
```

Walks the codebase + memory store, produces a single conversational prompt that would rebuild the project from scratch. Useful for handoff, archival, or onboarding new team members.

## A/B savings benchmark

```
/siftcoder:mem ab --turns=200 --k=5
```

Replays 200 synthetic turns with and without memory injection. Reports cumulative tokens for each branch and percentage saved. Typical result: ~99 % at this scale.

## See also

- [usage.md](USAGE.md) — typical patterns
- [commands.md](commands.md) — full command reference
