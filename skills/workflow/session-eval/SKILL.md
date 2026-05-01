---
name: session-eval
description: Use post-session to evaluate what worked, extract reusable patterns, capture lessons. Feeds knowledge base. "What did we learn", "evaluate this session".
---

# session-eval

Post-session retrospective. Mines patterns + lessons + anti-patterns observed. Feeds the memory knowledge base.

## Method

1. **Span.** This session, last N hours, since last eval.
2. **Pull data.**
   - Conversation transcript distilled
   - Tools called + outcomes
   - Errors encountered + how resolved
   - Memory captures during session
   - Files touched
3. **Categorise observations:**
   - **Patterns observed** — approaches that worked → candidates for `/pattern-learn`
   - **Anti-patterns observed** — approaches that didn't → captured to avoid repeats
   - **Tool gaps** — places where existing tools fell short
   - **Skill gaps** — places where a skill would have helped
   - **Memory hits** — past memory that was useful
   - **Memory misses** — questions answered that should have been retrievable from memory but weren't
4. **Recommendations.**
   - New skills to author
   - New patterns to capture
   - Memory gaps to fill (e.g. document a decision that wasn't pinned)

## Output shape

```
# Session eval: <timestamp>

## Span
<from> → <to>

## Headline
<one-line summary of what happened this session>

## Patterns observed
- <name> — <observed in: file:line>  → recommend /pattern-learn
- ...

## Anti-patterns observed
- <name> — <where>  → captured for future-avoidance
- ...

## Tool gaps
- <tool> would have helped at <moment> — recommend authoring or finding

## Skill gaps  
- <topic> — no skill covers this; recommend new skill

## Memory hits / misses
- Hit:  <query>  → relevance high
- Miss: <query>  → answered from current code, but should be in memory

## Recommendations
1. /pattern-learn <name>
2. New skill: <name>
3. Pin this decision to memory: <decision>
```

## Rules

- **Concrete observations only.** "Things went well" is not data.
- **Pattern observations need ≥ 1 occurrence in this session.** Single observation flagged for follow-up.
- **Memory misses are gold.** They reveal what should be captured but isn't.
- **Recommend, don't auto-execute.** User curates the knowledge base.

## Anti-patterns

- Generic "improve documentation" suggestions
- Patterns claimed without source citation
- Listing every error as anti-pattern (some are just transient)
- Long preamble before actionable observations

## When NOT to use

- Mid-session — `/pause` or `/handoff`
- Sessions of < 30 minutes — overkill
- Daily (it's a retrospective; not every session needs one)

## Subagent dispatch

- None — uses transcript + memory + git directly
- Memory MCP for hit/miss analysis

## Value over native CC

CC won't naturally retrospect on a session, distinguish pattern from one-off, or surface memory gaps. The retrospection discipline IS the value — feeds the knowledge flywheel.
