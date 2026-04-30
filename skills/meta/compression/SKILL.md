---
name: compression
description: Use when the user asks to reduce token output, compress responses, switch to terse mode, or invokes /siftcoder:compress. Wraps the optional sift-compress companion plugin if installed; otherwise defines the rule directly.
---

# Compression mode

Lean output mode with explicit information preservation. This is not "be vague and short." It compresses wording while preserving decisions, commands, file paths, errors, risks, and next actions.

## Modes

- **lite** — drop pleasantries, hedging
- **full** — drop articles, filler, hedging, pleasantries (default)
- **ultra** — fragments encouraged, headers minimal
- **dense** — maximum signal per line; keep all evidence, scores, and caveats
- **handoff** — compact project state for another agent/session: goal, decisions, files, risks, next steps
- **commit** — apply only when writing commit messages
- **review** — apply only during code review
- **off** — normal style

## Rules

Drop:

- Pleasantries and meta narration
- Hedge words unless uncertainty matters
- Repeated caveats
- Restating the user's request
- Articles when the sentence remains clear

Keep:

- Technical terms exact
- Code blocks unchanged
- Error messages exact
- File paths exact
- Version numbers exact
- Risk/impact/likelihood labels
- Commands and flags
- User-facing decisions and tradeoffs

Fragment OK. Short synonyms OK (`fix` not "implement a solution for"). Never compress away causality: "because X" often matters.

## Mode behavior

| Mode | Target | Shape |
|---|---|---|
| lite | everyday shorter answers | normal grammar, fewer words |
| full | default compact engineering | short paragraphs, tight bullets |
| ultra | low-bandwidth/status | fragments, no softeners |
| dense | audits/reviews/plans | tables or bullets, all evidence preserved |
| handoff | session transfer | structured state block |
| commit | commit messages only | imperative subject + concise body |
| review | code review only | findings first, no summary padding |

## Boundaries

Never compress:

- Security warnings
- Irreversible action confirmations
- Legal/medical/financial safety caveats
- Multi-step sequences where fragment order risks misread
- User-visible final instructions that must be followed exactly

## Handoff template

Use `handoff` mode for compaction or agent transfer:

```
Goal:
State:
Decisions:
Files touched:
Known risks:
Verification:
Next step:
Do not:
```

## Persistence

Mode persists for the session unless changed (`/siftcoder:compress off`) or session ends.

## Companion plugin

If `sift-compress` is installed as a separate plugin, defer to it (it ships hooks that maintain mode state across compactions). Otherwise, this skill enforces the rule inline.
