---
name: team
description: Use for team-knowledge sharing patterns — share captured patterns/decisions across teammates' SiftCoder installs, set up shared workspaces, federation hygiene.
---

# team

Team knowledge sharing. Patterns + decisions cross human boundaries; SiftCoder federation is the mechanism.

## Surfaces

- **Federation** — multiple workspaces share a memory cluster (already in the memory engine)
- **Pattern publishing** — captured patterns can be tagged for team-visibility
- **Decision broadcasting** — high-priority decisions auto-shared
- **Privacy** — what stays local vs what shares

## Method

1. **Topology.** How many teammates, where do their installs live, do they share a memory backend?
2. **Federation setup.**
   - Single shared remote memory daemon? (centralised)
   - Per-user with periodic sync? (federated)
3. **Pattern visibility.**
   - `private` — only this user's installs
   - `team` — federation-shared
   - `public` — published to team registry
4. **Decision priority.**
   - Routine summaries — local
   - High-impact decisions — flagged for team broadcast
5. **Privacy.** PII never crosses workspace boundary; redaction enforced by `src/memory/privacy.ts`.

## Output shape

```
Team:    <name>
Members: <count>

Federation:
  Mode:           <central | federated>
  Backend:        <URL or "local"; if federated, sync interval>
  Privacy:        <PII redaction policy>

Pattern visibility:
  Default:        <private | team>
  Currently shared: <count patterns>

Decision broadcast:
  Trigger:        <priority threshold>
  Last broadcast: <timestamp + summary>

Recommended actions:
  - <action — e.g. enable team federation>
  - <action>
```

## Rules

- **Privacy default-on.** PII redacted before any cross-workspace share.
- **Federation opt-in.** Don't auto-federate.
- **Decision broadcasts annotated.** "Team-shared" tag in memory for transparency.
- **Local-first.** Local memory works without federation; federation enhances.

## Anti-patterns

- Federation without redaction policy
- Broadcasting routine summaries (noise)
- Centralised memory without backup
- Mixing prod team data with personal projects

## When NOT to use

- Solo dev — federation is overhead
- Heavily-regulated context — federation needs separate compliance review
- Pre-onboarding — `/siftcoder:onboard` first

## Subagent dispatch

- None for setup — uses memory CLI directly
- Memory MCP for cross-workspace queries

## Value over native CC

CC has no native team-memory federation. SiftCoder's memory engine supports it; this skill provides the operational discipline. The framework + privacy defaults are the value.
