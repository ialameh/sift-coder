---
description: Interactive SiftCoder config — wraps siftcoder setup + settings.json
argument-hint: [setup|show|edit]
allowed-tools: Bash, Read, Edit
---

# /siftcoder:config

Configure SiftCoder. Three actions:

- `setup` — interactive walkthrough (Ollama probe, Anthropic key, defaults). Runs `siftcoder setup`.
- `show` — print effective config (env + project + user-global + plugin defaults layered)
- `edit` — open `~/.siftcoder/v3/config.json` in editor

For programmatic config see `docs/CONFIG.md`.

Settings schema lives at `settings.json` (plugin defaults) and overrides via `~/.siftcoder/v3/config.json` or `.siftcoder/config.json` (project).
