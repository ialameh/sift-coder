# Agents

15 agents — 4 Salesforce-domain plus 11 disciplined generics. Each adds a stricter contract than native Claude Code subagent dispatch (memory grounding, evidence ledgers, structured output, scope refusal, conflict resolution).

Source location: `agents/<name>.md`.

## Salesforce-domain (4)

| Agent | Use |
|---|---|
| `salesforce-architect` | Org-level architecture review (read-only). Capacity table + risk register + governor-limit checks. |
| `apex-bulkifier` | Targeted bulk-safety refactor — converts row-by-row code to batch-friendly patterns. |
| `lwc-debugger` | Lightning Web Component issue diagnosis: wire adapters, lifecycle, performance, state. |
| `memory-curator` | Dedup / merge / prune the memory store. Surfaces stale or redundant summaries. |

## Disciplined generic (11)

| Agent | Use |
|---|---|
| `planner` | Spec-first plans w/ evidence ledger + risk register + rollback path. |
| `coder` | Implement an approved plan; refuses scope creep. |
| `qa-reviewer` | Validate against acceptance criteria; structured pass/fail report. |
| `qa-fixer` | Fix only what `qa-reviewer` flagged. |
| `reviewer` | Memory- and convention-aware code review. |
| `documenter` | Doc-type-shaped output with citations. |
| `tester` | Behaviour-coverage tests, mutation-test sanity. |
| `investigator` | Hypothesis-driven read-only diagnosis. |
| `orchestrator` | Multi-agent coordination, file-locking, dependency batching. |
| `analyst` | Non-code text/data analysis (specs, tickets, transcripts). |
| `bridge-analyzer` | Cross-codebase integration design. |

## How to invoke

Agents are dispatched by orchestrating commands and skills. Examples:

```
/siftcoder:sf-architect              # → salesforce-architect
/siftcoder:agent                     # → planner → coder → qa-reviewer → qa-fixer pipeline
/siftcoder:investigate "<question>"  # → investigator
/siftcoder:bridge <a> <b>            # → bridge-analyzer
```

Or via Claude Code's native `Task` tool when an agent description matches the work.

## See also

- [commands.md](commands.md) — slash commands that invoke agents
- [skills.md](skills.md) — workflow contracts agents follow
