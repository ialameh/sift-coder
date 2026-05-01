---
name: bridge
description: Use to design and document the bridge between two distinct codebases or services. Maps gaps, picks integration pattern, produces a bridge spec. Pairs with /siftcoder:bridge command and bridge-analyzer agent.
---

# bridge

Cross-codebase integration design. Skill drives the analysis; `bridge-analyzer` agent executes for full reports; `/siftcoder:bridge` is the slash command.

## When this differs from /integrate

- `integrate` skill — design ONE integration (source → sink) within a single mental model
- `bridge` skill — design integration between TWO separately-owned codebases / repos / teams

The cross-org / cross-codebase context adds: governance, version-skew, deploy-cadence mismatch, identity translation.

## Method

See `agents/bridge-analyzer.md` for the agent. Skill summary:

1. **Inventory both sides.** Surface, stack, data model, auth, ops cadence.
2. **Boundary map.** Where they touch / will touch.
3. **Gap analysis.** Mismatches in shape / auth / version / load.
4. **Pattern pick.** Use integration pattern matrix from `skills/integrations/integrate/SKILL.md`.
5. **Bridge spec.** Contract, auth, failure modes, observability, versioning.
6. **Implementation plan.** Per side, with rollout strategy.

## Output shape

(See bridge-analyzer agent for the full markdown shape.)

## Rules

- **Read-only on both sides** during analysis.
- **One pattern picked, others rejected with reason.**
- **Failure modes table mandatory.**
- **Versioning policy upfront** (semver? URL versioning? schema registry?).
- **Identity translation explicit** if the two sides have different user models.

## Anti-patterns

- Shared DB without governance — silent coupling
- Sync request-reply across orgs — back-pressure pain
- "Eventually consistent" without measuring tolerance
- Skipping auth translation
- Implementation-first instead of contract-first

## When NOT to use

- Same-repo modules — refactor, not bridge
- One-off data move — `/migrate`
- Greenfield — `/api` + `/integrate` directly

## Subagent dispatch

- `bridge-analyzer` agent for the full report
- `integrate` skill for pattern matrix
- `polyglot` skill if the two sides speak different languages
- Memory MCP for prior cross-codebase decisions

## Value over native CC

CC will discuss integration. CC won't naturally produce a structured bridge spec with governance + identity-translation + failure-mode columns. The cross-codebase shape IS the value.
