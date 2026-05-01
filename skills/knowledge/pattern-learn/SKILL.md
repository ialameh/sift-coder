---
name: pattern-learn
description: Use when the user wants to extract a reusable pattern from recent work and store it for future use. "Save this as a pattern", "remember this approach", "learn from this commit".
---

# pattern-learn

Mine a reusable pattern from concrete code. Store with provenance + searchable description.

## Method

1. **Source.** What's the source — a recent commit? A file? A PR? A code block in chat?
2. **Distil.**
   - **Pattern name** — 2-4 words, descriptive
   - **Problem it solves** — one sentence
   - **Shape** — code template (with placeholders) or structural description
   - **When to use** — explicit triggers
   - **When NOT to use** — anti-trigger
3. **Capture to memory** with `kind: pattern`. Provenance edges link to the source code.
4. **Index.** Make sure it's discoverable via `mem_search` — descriptive description + tags.

## Output shape

```
Pattern:    <name>
Problem:    <one sentence>

Shape:
  ```<language>
  <code template with placeholders>
  ```

When to use:
  - <trigger>
  - <trigger>

When NOT to use:
  - <anti-trigger>

Source:     <file:line / commit SHA>
Captured:   <memory id>  (search via mem_search { query: "<keywords>" })
```

## Rules

- **Patterns are concrete + named.** "Use a factory" is not a pattern. "TestDataFactory.createAccounts(N) returning List<Account>" is.
- **Source is mandatory.** Pattern without origin = mythology.
- **Anti-trigger required.** "Don't use when X" prevents misapplication.
- **Capture is once per pattern.** Don't re-learn the same pattern; update the existing one.

## Anti-patterns

- Generic patterns ("use SOLID")
- Patterns extracted from one-off code (need 2+ instances to be a pattern)
- Patterns without when-NOT-to-use
- Patterns no one will retrieve (description doesn't match how anyone would search)

## When NOT to use

- One-off code — not a pattern
- Pattern already documented elsewhere — link, don't duplicate
- Pre-pattern — code not yet structured enough

## Subagent dispatch

- `Explore` for finding all instances of the pattern (validates it IS a pattern)
- Memory MCP for capture
- Optional `archaeologist` for git context

## Value over native CC

CC won't naturally extract + structure + persist patterns with provenance. The capture-with-discovery-context IS the value. Future `mem_search` retrieves the pattern when relevant.
