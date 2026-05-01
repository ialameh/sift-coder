---
name: handoff
description: Use at session end to summarise work for the next person/session — what was done, what's next, blockers. Different from /pause (mid-session freeze) — handoff is end-of-session deliverable.
---

# handoff

End-of-session summary for the next reader (future self, teammate, fresh CC session).

## Method

1. **Span.** What's the timeframe — this session, this week, this sprint?
2. **Aggregate.**
   - **Done** — concrete deliverables (commits, PRs, doc updates)
   - **In progress** — active work paused mid-flight (cross-link to `/pause` if applicable)
   - **Blocked** — items waiting on external (other team, decision, dep)
   - **Discovered** — context the next reader needs (constraints, gotchas, things that surprised us)
   - **Recommended next** — top 3 actions for the next reader
3. **Memory anchor.** Capture the handoff itself with `kind: handoff`. Future "what's the status of X" queries hit this.
4. **Format for the audience.**
   - Self → terse, working memory shorthand OK
   - Teammate → fuller context, link to specific commits / files
   - Fresh CC session → essentially a project brief

## Output shape

```
# Handoff: <span>

## Done
- ✓ <commit / PR / update>  — <commit SHA>
- ✓ <...>

## In progress
- <task> — paused at <state>; resume with /siftcoder:continue <id>

## Blocked
- <task> — blocked on <external thing>; ETA <when known>; owner <if any>

## Discovered (context for the reader)
- Constraint: <surfaced>
- Gotcha: <warning>
- Decision: <made — w/ rationale>

## Recommended next (top 3)
1. <action> — why
2. <action>
3. <action>

## References
- Memory: <ids>
- Commits: <range>
- Related: <other handoffs>
```

## Rules

- **Done is concrete.** Commits, PRs, file paths — not "worked on X".
- **Discovered is rich.** This is the section the next reader values most.
- **Top 3 next, not top 10.** Decision pressure forced; useful filter.
- **Capture to memory.** Future sessions retrieve this automatically.
- **Audience-shaped.** A teammate handoff has more linking than a self-handoff.

## Anti-patterns

- "Working on the auth refactor" — not concrete enough
- Listing every commit without grouping
- Skipping "discovered" section (highest-value)
- Long preamble before the structured content

## When NOT to use

- Mid-session — `/pause` instead
- Tiny session — overkill
- Active conversation — handoff is end-state

## Subagent dispatch

- None — synthesis of conversation + git
- Memory MCP for capture and reference lookups
- `Bash` for `git log --since=<start>`

## Value over native CC

CC will summarise on request. CC won't naturally produce handoff-shape output with done/in-progress/blocked/discovered/recommended structure or audience-targeted detail. The structure IS the value.
