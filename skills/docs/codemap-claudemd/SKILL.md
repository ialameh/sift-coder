---
name: codemap-claudemd
description: Use to generate or refresh a layered CLAUDE.md hierarchy (lean root + per-subdir) for a large codebase. "Set up CLAUDE.md files", "scaffold context files", "make this repo legible to Claude Code", "add directory-scoped conventions".
---

# codemap-claudemd

Emit the layered CLAUDE.md hierarchy the Claude Code large-codebase playbook recommends. Reuses the `/codemap` walk; the output is CLAUDE.md files (loaded every session, additively as Claude traverses the tree), not standalone docs.

## Variants in the codemap family

- **codemap** — full evidence-based map (standalone markdown)
- **codemap-fast** — quick structural scan
- **codemap-claudemd** (this skill) — emit the map AS a CLAUDE.md hierarchy

## Method

1. **Survey.** Run the `codemap` walk (or `codemap-fast` on a huge repo) to get modules, responsibilities, dependencies, and the per-directory build/test/lint commands.
2. **Root `CLAUDE.md` — keep it lean.** One-paragraph repo purpose, the highest-level structure, critical gotchas, and pointers to the subdirectory files. This is loaded every session, so resist detail (article: *"root contains pointers and critical gotchas only"*). If a SiftCoder `ARCHITECTURE.md` or design contract exists, point to it rather than duplicating it.
3. **Per-significant-subdir `CLAUDE.md`.** One file per service/module boundary (not per technical layer). Include: local conventions, the scoped test/build/lint command for that directory (so Claude runs the dir suite, not the whole monorepo), and module-specific gotchas.
4. **Idempotent merge.** If a CLAUDE.md already exists, diff the generated content against it and propose additions only. Never clobber hand-written guidance.
5. **Show every proposed file/diff. Write only on approval.**

## Choosing which subdirs get a file

- Has its own build/test/lint command → yes.
- Distinct domain or ownership → yes.
- Non-obvious conventions a newcomer would trip on → yes.
- Pure leaf with nothing local to say → skip (don't dilute with empty files).

## Output discipline

- Root stays short; detail lives in subdir files. Hundreds-of-folders monorepos need hierarchy, not one giant root file.
- Phrase conventions as durable, imperative rules — not a narration of recent work.
- Pairs with `/siftcoder:knowledge` (folds session conventions into the right CLAUDE.md) and the Stop-hook convention hint.

## Value over native CC

`/init` writes a single root CLAUDE.md. This skill produces the *layered* hierarchy large codebases need, scoped per module with per-directory commands, and merges into existing files instead of overwriting.
