---
description: Generate single conversational prompt that rebuilds this project from scratch via any AI agent
argument-hint: [--mode quick|deep|focus] [--focus "<text>"] [--repo <github-url>] [--output <path>] [--no-cache] [--list]
allowed-tools: Read, Write, Glob, Grep, Bash, Task
---

# /siftcoder:reverse-prompt - Generate Rebuild Prompt

Reverse engineer this codebase into ONE conversational user prompt (~120-200 words) that, pasted into any AI coding agent (Cursor, Claude Code, Codex, ChatGPT code mode, v0), would rebuild the project from scratch in a single "vibe coding" pass.

This is **distinct from** `/siftcoder:reverse-spec` (which writes a verbose `SPECIFICATION.md`). Output here is a short, plain-language paragraph an agent can act on directly.

## Usage

```
/siftcoder:reverse-prompt                              # Quick mode, current dir
/siftcoder:reverse-prompt --mode deep                  # Deep codebase scan
/siftcoder:reverse-prompt --focus "the auth flow"      # Focus on a specific angle
/siftcoder:reverse-prompt --repo <github-url>          # Reverse a remote repo
/siftcoder:reverse-prompt --output ./PROMPT.txt        # Write to file
/siftcoder:reverse-prompt --no-cache                   # Force regeneration
/siftcoder:reverse-prompt --list                       # Show cached prompts
```

## Modes

| Mode  | Trigger                       | Inputs                                              | Latency  |
|-------|-------------------------------|-----------------------------------------------------|----------|
| quick | default                       | manifest + root tree (depth 2) + README             | seconds  |
| deep  | `--mode deep`                 | quick context + investigator-agent codebase summary | 30-90s   |
| focus | `--focus "<text>"`            | quick (or deep) context + user-supplied angle       | seconds+ |

## Instructions

You are generating a single rebuild prompt. The output is the only thing the user sees — no preamble, no meta commentary, no explanation around it.

### Phase 1 — Parse arguments

Parse `$ARGUMENTS` for: `--mode`, `--focus`, `--repo`, `--output`, `--no-cache`, `--list`.

Defaults:
- `--mode quick` if not supplied
- `--focus` overrides `--mode` to `focus` (if `--mode` not explicitly `deep`)
- `--repo` switches target from cwd to a remote repo (clone via `gh repo clone <url> /tmp/_rp_<hash>` into a tmp dir; treat that dir as projectRoot)

### Phase 2 — Handle `--list`

If `--list` is set, run:

```bash
node --input-type=module -e "
import { listCached } from '/Users/sam/Documents/Plugins/SiftCoder/dist/services/reverse-prompt-service.js';
const entries = await listCached({ projectRoot: process.cwd() });
console.log(JSON.stringify(entries, null, 2));
"
```

Render the entries as a compact table (id, mode, focus, generatedAt, preview) and stop.

### Phase 3 — Cache check

Resolve `repoId`, `mode`, `focus` (use `[quick] root scan`, `[deep] whole codebase`, or the user's focus string). Look up cached entry:

```bash
node --input-type=module -e "
import { getCached } from '/Users/sam/Documents/Plugins/SiftCoder/dist/services/reverse-prompt-service.js';
const hit = await getCached({ repoId: '<repoId>', mode: '<mode>', focus: '<focus>', projectRoot: process.cwd() });
console.log(JSON.stringify(hit));
"
```

If a cache hit exists and `--no-cache` is NOT set: print the cached `prompt` and stop. Mention `(cached <generatedAt>)` on a separate line at the very end.

### Phase 4 — Gather context

For all modes, gather Quick context first:

```bash
node --input-type=module -e "
import { gatherQuickContext, buildContextBlock } from '/Users/sam/Documents/Plugins/SiftCoder/dist/services/reverse-prompt-service.js';
const ctx = gatherQuickContext(process.cwd());
console.log(JSON.stringify(ctx));
" > /tmp/_rp_ctx.json
```

If `--mode deep`: dispatch the **investigator** agent (via Task tool) with this exact prompt:

> Summarize this codebase in ≤500 words. Cover: real-world purpose, tech stack, key features (user-facing outcomes), notable architectural choices. Plain language. No file paths or package names unless essential. No bullet lists unless the codebase clearly has parallel features that warrant them.

Capture its output as `deepSummary`.

### Phase 5 — Synthesize the prompt

You (the calling Claude session) are the LLM. Read this **system prompt verbatim**, then the **context block**, then output ONLY the synthetic user message.

#### System prompt

```
You are an expert at inferring how people actually prompt modern coding agents.

## Task

You are given repository context (metadata, file tree, README, optional deep summary). Output ONE synthetic user message: the kind of prompt a non-technical or lightly technical person might paste into Cursor, Claude Code, Codex, ChatGPT code mode, or v0 to get this project built in one "vibe coding" pass.

## Output rules

- Plain language. Sounds like a real request ("Build me…", "I want…"), not an architecture doc.
- Outcome focused. Describe what the app or library should DO for a user using normal-person words.
- Honest scope. Only claim features or stacks the context supports. If README is thin, keep claims vague or limited to metadata signals.
- Length: about 120 to 200 words. One short paragraph or a few tight sentences. Not a bullet list of file paths or dependencies.
- Tone: natural and conversational. Contractions are fine. No preamble ("Sure, here is…"), no meta ("As an AI…"), no filler.
- NEVER use hyphens or em-dashes — split into shorter sentences or use commas.

## Avoid

- Framework jargon, exact package names, folder structure (unless README clearly shows the user cared).
- Agent system instructions, markdown specs, pseudo-code blocks.
- Inventing features unsupported by the evidence.

## Context about agent capabilities

Modern agents can search the web, read docs, iterate in the IDE. ONE short line like "look up current docs online if you need to" is fine when it matches real workflow. Do not turn the prompt into a tutorial.

## Output format

Reply with ONLY the synthetic user message. No title, no quotes around it, no explanation before or after.
```

#### Context block

Build via:

```bash
node --input-type=module -e "
import { buildContextBlock } from '/Users/sam/Documents/Plugins/SiftCoder/dist/services/reverse-prompt-service.js';
const ctx = JSON.parse(require('fs').readFileSync('/tmp/_rp_ctx.json', 'utf8'));
console.log(buildContextBlock(ctx, { focus: '<focus>', deepSummary: '<deep or empty>' }));
"
```

Then **internally synthesize** the rebuild prompt following the system prompt. Do not narrate the process — just produce the paragraph.

### Phase 6 — Persist & output

Cache the result:

```bash
node --input-type=module -e "
import { putCached } from '/Users/sam/Documents/Plugins/SiftCoder/dist/services/reverse-prompt-service.js';
await putCached({ repoId: '<repoId>', mode: '<mode>', focus: '<focus>', prompt: \`<generated>\`, projectRoot: process.cwd() });
"
```

If `--output <path>`: write the prompt to that path. Otherwise print to stdout.

### Phase 7 — Cleanup

If `--repo` was used, remove the tmp clone: `rm -rf /tmp/_rp_<hash>`.

## Output Style

The generated prompt must:
- Be ONE paragraph (or 2-3 short paragraphs separated by blank lines)
- 120-200 words
- Plain language, conversational, contractions OK
- Outcome focused — what it does for a user, not what files it has
- No bullet lists, no headings, no code blocks
- No hyphens or em-dashes

## Examples

**Project: a CLI todo app with SQLite + sync**

> Build me a small command line todo app that stores tasks in a local SQLite file. I want to add tasks, mark them done, list what's pending, and tag tasks by project. Tasks should sync across machines if I point two installs at the same shared database file in Dropbox or similar. Make the output clean and easy to read in a terminal, with colored status, and let me filter by tag or due date. Keep the install simple, just one binary or a tiny npm package. Look up current docs online if you need to for the SQLite library or argument parsing. I don't need a fancy interface, just something fast and snappy that I can pipe into other shell commands.

## Use Cases

1. **Bootstrap a sister project** — Generate a prompt that rebuilds the same idea in a different stack.
2. **Onboard collaborators** — Hand them the prompt as a high-level "what is this" without making them read docs.
3. **Backstop documentation** — When README is thin, the prompt captures the lived intent.
4. **Compare drift** — Re-run periodically; diff prompts to see how the project's identity has shifted.

## Allowed Tools

Read, Write, Glob, Grep, Bash, Task (for investigator dispatch in deep mode)

## Cache

Stored at `.claude/siftcoder-state/reverse-prompts/`:
- `index.json` — recent entries (200 max)
- `<fingerprint>.json` — full cached prompt + metadata

Keyed by `shortFingerprint(repoId::mode::focus)` (8-char MD5 prefix).
