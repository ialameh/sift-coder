---
description: List captured patterns. Wraps mem_search { kind: pattern } MCP tool.
argument-hint: [--family <name>] [--limit <n>]
allowed-tools: Bash
---

# /siftcoder:pattern-list

List captured patterns from memory. Filter by family or limit count.

Internally calls `mem_search { kind: "pattern", k: <limit> }` via the siftcoder-memory MCP server.

For pattern retrieval by query: `/siftcoder:pattern-search`.
For capturing new patterns: `/siftcoder:pattern-learn`.

See `skills/knowledge/pattern-search/SKILL.md`.
