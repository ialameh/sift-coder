---
name: search
description: Use for codebase-wide search across code + memory + docs simultaneously. Different from mem_search (memory-only) and Grep (code-only). One query, three sources, deduplicated ranking.
---

# search

Unified search across code, memory, and docs. One query, three sources, ranked results.

## When this differs from native Grep / `mem_search`

- `Grep` — code only, regex, exact match
- `mem_search` (MCP) — memory only, BM25 + vector + decay
- `search` (this skill) — federates Grep + mem_search + docs grep, dedups, ranks by relevance × source-type

## Method

1. **Parse query.** Extract: keyword(s), optional file-glob filter, optional source filter (`--code`, `--memory`, `--docs`).
2. **Parallel dispatch:**
   - **Code:** `Grep` over project; rank by file path × hit density
   - **Memory:** `mem_search { query, k: 10 }`
   - **Docs:** `Grep` over `docs/` and root markdown files
3. **Merge + rank.** RRF (reciprocal rank fusion) across the three result sets. Recency boost for memory hits.
4. **Output.** Top 10 unified hits with source label.

## Output shape

```
Query: <text>
Sources: code | memory | docs (or filtered)

Hits (ranked):

  [code]    src/auth/middleware.ts:42  — match line snippet
  [mem]     summary:142 (2026-04-12)   — captured note about caching
  [code]    src/payment/processor.ts:18
  [docs]    docs/MEMORY.md:88          — describes mem_why
  [mem]     summary:201 (2026-04-30)   — incident
  ...

Source mix: 4 code, 3 memory, 3 docs
```

## Rules

- **Federate, don't pick one source.** If user wanted code-only they'd `Grep`.
- **Dedupe by content fingerprint.** Same passage in code + memory = single hit.
- **Cite source kind explicitly.** Reader needs to know if it's live code, captured decision, or doc.
- **Recency-aware for memory only.** Code rank doesn't decay.

## Anti-patterns

- Returning > 10 hits (dilutes signal)
- Mixing exact + fuzzy matches without separation
- Skipping memory pass (memory is half the value)
- Treating doc hits as authoritative when code says otherwise

## When NOT to use

- Single-file search — use `Grep` directly
- Pure memory query — use `mem_search` MCP tool
- Reference lookup with known path — open the file

## Subagent dispatch

- `Grep` for code + docs
- `mem_search` MCP tool for memory
- `Explore` if results need follow-up reading

## Value over native CC

CC will Grep on request. CC won't naturally federate code + memory + docs in one query with RRF + source labels. The federation IS the value.
