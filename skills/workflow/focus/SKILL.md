---
name: focus
description: Use to narrow attention to a feature/file set/area for the current session. Different from /scope (which enforces via hook) — focus is advisory + helps memory + retrieval prioritise the area.
---

# focus

Attention narrowing. Tells memory + retrieval to weight this area; primes the assistant to think within these bounds.

## When this differs from /scope

- `/scope` — enforces via boundary-enforcer hook (blocks writes outside)
- `/focus` — advisory; doesn't block, but biases memory retrieval and assistant attention toward the focus area

You can use both: `/scope` for hard bounds, `/focus` for softer attention.

## Method

1. **Define focus.** User specifies a feature name, file pattern, area description, or subdirectory.
2. **Persist** to `.siftcoder/focus.json`:
   ```json
   { "name": "<name>", "patterns": ["..."], "since": "<ts>", "memoryTags": ["..."] }
   ```
3. **Bias retrieval.** Subsequent `mem_search` queries get a boost for results matching the focus area (file paths overlap, tags match).
4. **Prime assistant context.** Surface focus on session start: "Focused on: <name>. Files: 14. Last touched: 2h ago."
5. **Decay.** Focus auto-clears after 24h of inactivity unless renewed.

## Output shape (set)

```
Focus set: <name>
Patterns: 
  - src/auth/**
  - tests/auth/**
Files matched: 14
Memory tags primed: auth, jwt, session

Will bias mem_search results toward this area.
Use /siftcoder:focus clear to release.
```

## Output shape (status)

```
Currently focused on: auth-refactor (since 14:30, 2h ago)
Last memory captures: 5 in this area
Last edits: 3 in this area
Auto-clear at: 14:30 tomorrow (or sooner with /focus clear)
```

## Sub-actions

- `set <name> <patterns>` — set or replace focus
- `status` — show current focus
- `clear` — release focus
- `extend [hours]` — extend auto-clear window

## Rules

- **Advisory only.** Doesn't block writes — that's `/scope`'s job.
- **Auto-decay** so stale focus doesn't bias retrieval indefinitely.
- **One focus per project at a time.** Multi-focus dilutes the bias.
- **Memory captures focus changes** so `mem_why` can answer "why was this work done?"

## Anti-patterns

- Setting focus without patterns (no actual narrowing)
- Stale focus that biases retrieval against current work
- Using focus where scope is needed (focus doesn't enforce)

## When NOT to use

- Whole-project work — focus would drop relevant hits
- One-off question — focus is session-scoped
- Hard boundary required — use `/scope` instead

## Subagent dispatch

- None — focus is local state
- Memory MCP for the bias hooks

## Value over native CC

CC has no native attention-bias mechanism per project. Focus pairs with `mem_search` for measurably better retrieval relevance during deep-work sessions.
