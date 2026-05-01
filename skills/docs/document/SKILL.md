---
name: document
description: Use to generate documentation — code reference, user manual, architecture, technical deep-dive. Output shape varies by document type. Pulls from code + tests + memory for accuracy.
---

# document

Generate docs. Doc-type-aware — architecture vs API ref vs user manual have different shapes.

## Document types

| Type | Audience | Shape |
|---|---|---|
| `architecture` | senior engineers, new hires | system overview, component map, data flow, design decisions |
| `api` | API consumers | endpoint table, request/response, errors, examples, auth |
| `user-manual` | end users | task-oriented (how to X), screenshots, troubleshooting |
| `technical` | engineers maintaining the code | module-by-module deep dive, conventions, pitfalls |
| `runbook` | on-call / SRE | symptoms → diagnosis → fix, escalation paths |
| `migration` | engineers upgrading | breaking changes, before/after, gotchas |

## Method

1. **Pick type** (or detect from prompt).
2. **Source pass:**
   - Architecture: `Explore` + `reverse-prompt` skill for high-level
   - API: codegen output + tests for examples
   - User manual: feature inventory + UI screens
   - Technical: per-module read + test names
   - Runbook: incident memory (`mem_search { kind: incident }`)
   - Migration: changelog + breaking-change tags
3. **Write.** Doc-type-specific structure.
4. **Cite.** Every claim links to source (file:line, commit, memory id).
5. **Verify.** Read the doc as the audience. Does it answer the questions they'd ask?

## Output shape (architecture example)

```
# <System> Architecture

## Overview
<one paragraph>

## Components
- <name> (<file>) — <responsibility>
- ...

## Data flow
<diagram or numbered sequence>

## Design decisions
- D1: <decision> — <rationale> — <alternatives considered>
- ...

## Extension points
- <how to add a new X>

## References
- <file:line>
- <memory id>
```

## Rules

- **Cite everything.** Claim without citation = fiction.
- **Audience-first.** Write for the named audience; don't mix levels.
- **Diagrams in Mermaid** where helpful (Markdown-renders, source-controlled).
- **Examples are runnable.** API doc examples should work copy-paste.
- **No "TODO" placeholders in shipped doc.**

## Anti-patterns

- README that's actually 3 docs jammed together
- API ref that says "coming soon"
- User manual that assumes engineering knowledge
- Architecture doc that's outdated (verify with `/codemap-trust`)

## When NOT to use

- One-line edit — inline comment suffices
- Generated doc (e.g. typedoc, swagger-ui) — let codegen do it

## Subagent dispatch

- `documenter` agent
- `Explore` for source pass
- `Bash` (Mermaid CLI) if diagrams need rendering

## Value over native CC

CC will write docs. CC won't naturally enforce doc-type-specific shapes, citation discipline, or audience matching. The structure IS the value.
