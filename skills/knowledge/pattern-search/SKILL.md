---
name: pattern-search
description: Use to find captured patterns relevant to current work. "Have we got a pattern for X", "show me how we usually do Y". Searches memory for kind:pattern entries.
---

# pattern-search

Find captured patterns. Specifically targets `kind: pattern` entries; doesn't drown in generic memory.

## Method

1. **Query.** What pattern do you need? Express as the problem ("paginated query results", "bulk-safe trigger handler", "OAuth callback flow").
2. **Search:** `mem_search { query, kind: "pattern", k: 5 }`.
3. **Apply.** For each hit:
   - Read the pattern body
   - Verify it still makes sense in current code (patterns can rot)
   - Apply or adapt

## Output shape

```
Query:    <user's intent>

Hits:

  Pattern: <name>
    Problem:    <one-line>
    Source:     <file:line / commit>
    Match score: <relevance>

  Pattern: <name>
    ...

Recommendation:
  Apply <pattern name>: it fits because <evidence in current context>.

If none fit:
  No matching pattern. Consider /siftcoder:pattern-learn to capture this approach
  if it's worth keeping.
```

## Rules

- **Verify before apply.** Pattern was captured at a point in time; check it still applies (file paths exist, syntax current, etc.).
- **Adapt explicitly.** If the pattern needs tweaking, surface the diff between captured shape and intended use.
- **No-match is fine.** "No pattern for this" is a signal to consider `/pattern-learn` after the work.

## Anti-patterns

- Applying a stale pattern without verification
- Forcing a pattern to fit when it doesn't
- Searching for patterns that don't exist yet (over-eager retrieval)

## When NOT to use

- One-off scratch work
- Greenfield with no patterns captured yet
- Generic best practice — that's a skill, not a pattern

## Subagent dispatch

- Memory MCP exclusively (`mem_search` with `kind: pattern` filter)
- Optional `general-purpose` to verify the pattern still applies

## Value over native CC

CC will discuss patterns. CC won't naturally retrieve project-specific captured patterns from memory. The retrieval IS the value.
