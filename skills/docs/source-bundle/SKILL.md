---
name: source-bundle
description: Use to consolidate a codebase into a hidden `.source/` folder of AI-ingestion-friendly Markdown bundles — one `.md` per meaningful source folder, with each file's exact contents in fenced code blocks. Use when prepping a repo for an AI tool that only accepts Markdown, or when asked to "bundle / export source as markdown", "make the code ingestible", or "generate .source".
---

# source-bundle

Turn a whole project into a small set of readable Markdown bundles under `.source/`,
so an AI system that only accepts Markdown can ingest the code. Verbatim — nothing
is rewritten or summarized.

## When to use

- Prepping a repo for a Markdown-only AI ingestion / RAG pipeline.
- "Export/bundle the source as Markdown", "consolidate the codebase into docs", "generate `.source`".

## When NOT to use

- Generating prose docs (architecture / API / manual) → use the `document` skill.
- Codebase maps / symbol indexes → use `codemap`.

## Output contract

```
.source/                         # hidden, git-ignored
├── index.source.md              # explanation + included tree + bundle table + skip report
├── <folder>.source.md           # one bundle per meaningful folder
└── <folder>.part-01.source.md   # large folders split into parts
```

Each `<folder>.source.md` contains, in order:
1. Title with the original folder path.
2. Generated folder introduction (what the folder appears to contain).
3. Folder summary — list of files included in this part.
4. Per file: heading with the relative path → one-line generated note → full file
   contents in a fenced code block with the correct language tag.

## Procedure

The deterministic generator is shipped with the plugin. Run it against the target
project (defaults to the current working directory):

```sh
node ${CLAUDE_PLUGIN_ROOT}/scripts/generate-source-md.mjs $ARGUMENTS
```

- `$ARGUMENTS` (optional) = target project directory. Omit to bundle the CWD.
- Safe to rerun: it **wipes and regenerates** `.source/` every run and
  idempotently adds `.source/` to `.gitignore`.
- No model call — introductions are extracted from the files themselves
  (Markdown frontmatter `description:` / first `# H1`; leading JS/TS comment),
  so output is reproducible.

If the script is missing (e.g. running outside the plugin), recreate it in the
target repo at `scripts/generate-source-md.mjs` from the rules below, then run it.

## Behavior the generator guarantees

**Grouping (reasonable file count, not one file per source file):**
- One bundle per meaningful folder; whole subtree rolled into that bundle.
- Descend into subfolders only when a subtree exceeds ~40 files (so large trees
  like `skills/` or `src/` split by subsystem; small ones stay single).
- Split a bundle into `.part-NN.source.md` when embedded source exceeds ~350 KB.
- Safe readable names preserve nesting: `src/memory/web` → `src-memory-web.source.md`.

**Exclusions (never embedded):**
- Dirs: `.git`, `.source`, `node_modules`, `coverage`, build output (`dist`/`build`/
  `out` — root-level only, so a `/build` *skill* folder is kept), `.sfdx`, `.sf`,
  caches, virtualenvs.
- Files: lock files (`package-lock.json`, `yarn.lock`, …), binaries / images /
  archives / media (by extension), OS cruft (`.DS_Store`), and anything that looks
  like a secret/key/credential (`.env*`, `*.pem`, `*.key`, `id_rsa`, `.npmrc`, …).
- Per-project scratch (e.g. `IDEAS.md`) when git-ignored as personal.

**Correctness:**
- Code fences auto-size: the outer fence is one backtick longer than the longest
  backtick run inside the file, so Markdown sources (which contain their own ```
  fences) nest correctly.
- File contents are copied byte-for-byte (only a single trailing newline trimmed).

## Verify before reporting

1. `node --check` the script (if (re)created), then run it.
2. Confirm `.source/` exists with the expected bundles + `index.source.md`.
3. Confirm `.gitignore` contains `.source/` and nothing outside `.source/` was
   modified except `.gitignore`.
4. Optional integrity spot-check: extract a fenced block and diff against the
   original file.

## Report

State: files created/changed, source folders converted, Markdown files generated,
folders/files skipped (with reasons), and the regenerate command
(`/siftcoder:source-bundle` or `node scripts/generate-source-md.mjs`).
