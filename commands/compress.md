---
description: Activate sift-compress output compression (lite|full|ultra|commit|review|off)
argument-hint: "[lite|full|ultra|commit|review|off]"
allowed-tools: Bash
---

# /siftcoder:compress — Output Compression

Activate measured output compression. Drops articles/filler/hedging, keeps technical substance exact. Persists across turns and sessions.

Mode switching is driven by the plugin's `UserPromptSubmit` hook at `vendor/sift-compress/hooks/user-prompt-submit.js`, which parses `/siftcoder:compress [mode]` and writes a `mode_changed` event to `~/.claude/.sift-compress/events.jsonl`. `SessionStart` then re-injects the ruleset next session.

## Usage

```
/siftcoder:compress             # default → full
/siftcoder:compress lite        # professional but tight
/siftcoder:compress full        # drop articles, fragments OK
/siftcoder:compress ultra       # max compression, arrows for causality
/siftcoder:compress commit      # Conventional Commits mode
/siftcoder:compress review      # terse code-review mode
/siftcoder:compress off         # deactivate
```

## Instructions

$ARGUMENTS is the mode (empty → `full`). The hook has already processed the switch and injected the active ruleset as additional context. Your only job:

1. Confirm the mode in one short line: `compress: <mode>`.
2. Apply the mode immediately to this response and all that follow.
3. Ruleset reference: `skills/compress/SKILL.md`.

## Boundaries

Do not compress: security warnings, irreversible-action warnings, multi-step instructions where fragment order risks misread. Never compress code, commit messages, or PR descriptions — those are normal prose.

## Troubleshooting

- If activation fails, check: `node ${CLAUDE_PLUGIN_ROOT}/vendor/sift-compress/src/cli/doctor.js`
- Event log: `~/.claude/.sift-compress/events.jsonl`
- State cache: `~/.claude/.sift-compress/state.json`
