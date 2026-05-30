# SiftCoder in large codebases

How SiftCoder maps to the Claude Code large-codebase best-practices playbook, and where to reach for a native Claude Code feature instead.

## Symbol navigation: use LSP for live precision

`mem_symbol_search` is a **memory-derived recall index** — the symbols you have actually touched, with provenance (`mem_why`). It answers *"where did I work on `FooService`, and what depended on it"*. It is extracted by a fast regex pass (`src/memory/symbols.ts`) over captured payloads; it is **not** a language server.

For live *go to definition* / *find all references* across a multi-language codebase, install Claude Code's **code-intelligence (LSP) plugin** plus the language-server binary for each language. LSP gives symbol-level precision and prevents text-pattern-matching errors.

The two are complementary, not competing:

| Need | Reach for |
|------|-----------|
| Where is this symbol *now*? Definitions, references | LSP (code-intelligence plugin) |
| Where have *I* been, and why is it this way? | `mem_symbol_search` + `mem_why` |

If a language server is available, prefer it for navigation and let memory recall stay focused on history and rationale.

## Memory hygiene at scale

As a codebase grows, capturing observations on generated and vendored files dilutes retrieval. SiftCoder excludes them automatically:

- **Capture exclusion** — the capture hook drops paths matching the defaults (`node_modules`, `dist`, `build`, `coverage`, `target`, lockfiles, minified/maps, …), plus everything in the repo's `.gitignore` and `.claudeignore`. The daemon re-applies the defaults as an authoritative backstop. Disable with `SIFTCODER_CAPTURE_IGNORE=0`.
- **Sub-workspace scoping** — in a monorepo, set `SIFTCODER_SUBSPACE` (or write a `.siftcoder/subspace` file) to partition memory per service, so retrieval doesn't mix unrelated subsystems. Default off — one memory per repo root, unchanged.

## Context files: layered CLAUDE.md

`/init` writes a single root `CLAUDE.md`. Large codebases want a *hierarchy* — a lean root (pointers + critical gotchas) and per-subdirectory files (scoped conventions + per-dir test/build commands), loaded additively as Claude walks the tree.

- Scaffold/refresh it with **`/siftcoder:codemap-claudemd`**.
- Fold session conventions into the right file with **`/siftcoder:knowledge`** — the Stop hook hints when a session produced conventions worth recording.

## Path-scoped skills

The Salesforce skill family is `paths:`-scoped so it auto-loads only when work touches Salesforce files (`**/*.cls`, `**/lwc/**`, `**/objects/**`, …). In a mixed monorepo this keeps domain skills from loading where they don't apply. Explicit slash invocation still works everywhere.

## Model-drift cadence

Instructions tuned for today's model can work against a future one. Review SiftCoder's model pins every 3–6 months — see the audit checklist in `/siftcoder:siftcoder`.
