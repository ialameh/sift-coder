---
description: Generate single conversational prompt that rebuilds this project from scratch
argument-hint: [quick|deep|focus <area>]
allowed-tools: Read, Grep, Glob, Bash
---

# /siftcoder:reverse-prompt

Produce a single conversational prompt that, given to an agent, would rebuild the current project from scratch.

## Modes

- `quick` — file tree + names only (~500 tokens)
- `deep` — full architecture + conventions (~3-5k tokens, default)
- `focus <area>` — one feature, with surrounding context (~1-2k tokens)

Caches by project fingerprint at `~/.siftcoder/v3/reverse-prompt-cache/`.

See `skills/reverse-prompt/SKILL.md`.
