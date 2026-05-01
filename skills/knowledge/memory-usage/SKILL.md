---
name: memory-usage
description: Use when you need to query SiftCoder's persistent project memory across sessions. Provides MCP tools mem_search, mem_get, mem_timeline, mem_why, mem_drain. Triggers when the user asks "what did we decide about X", "why is X this way", "find prior discussion of X", "show me the history of Y".
---

# Using SiftCoder Memory

SiftCoder runs a per-workspace memory daemon that captures tool observations, summarises them with a local or remote LLM, and exposes a queryable store with provenance.

## Available MCP tools

- `mem_search(query, k=10)` — hybrid BM25+vector retrieval, RRF fused, Ebbinghaus-decayed. Returns top-k summaries with timestamps and provenance hints.
- `mem_get(id)` — fetch full summary by id.
- `mem_timeline(id, before=5, after=5)` — chronological neighbours.
- `mem_why(id)` — BFS the provenance graph from a node and return the cause chain (`causes`, `derives_from`, `calls`, `imports`, `contradicts`, …).
- `mem_drain(batch=16)` — force a small drain pass (rarely needed; consolidator runs automatically).

## When to use which tool

| Intent | Tool |
|---|---|
| "Has this been discussed before?" | `mem_search` |
| "Show me that decision in full" | `mem_get` (after search) |
| "What happened around the time of X?" | `mem_timeline` |
| "Why did we end up with this code?" | `mem_why` |
| "I just made big changes, capture them now" | `mem_drain` |

## Patterns

**Always search before assuming.** If the user references prior work, run `mem_search` first. A hit is cheaper and more accurate than re-deriving from current files.

**Verify before acting on memory.** Memory is a snapshot of what was true when written. If it names a file/symbol/flag, grep or read first to confirm it still exists.

**Prefer `mem_why` over `git log` for non-obvious code.** `git log` shows the commit; `mem_why` shows the conversation that led to it.

**Don't dump raw mem_search results to the user.** Pick the 1–3 relevant ones, paraphrase, cite ids.

## Anti-patterns

- Do not use memory as the source of truth for ephemeral session state (tasks, todos, in-progress work). Use TodoWrite/TaskCreate for those.
- Do not write to memory directly — capture flows through hooks. If you want something pinned, surface it to the user and let them confirm.

## Quick examples

```
mem_search({ query: "auth middleware decision", k: 5 })
mem_get({ id: "summary:142" })
mem_why({ id: "summary:142" })
mem_timeline({ id: "summary:142", before: 3, after: 3 })
```
