---
description: Cross-codebase integration analysis — gap map, pattern pick, bridge spec. See skills/integrations/bridge/SKILL.md and agents/bridge-analyzer.md
argument-hint: <repo-a-path> <repo-b-path> [intent]
allowed-tools: Read, Grep, Glob, Bash, WebFetch
---

# /siftcoder:bridge

Design the bridge between two distinct codebases.

`$ARGUMENTS` should name both repos + the integration intent.

Dispatches the `bridge-analyzer` agent. Read-only on both sides. Output: structured bridge spec with contract, auth, failure modes, observability, versioning, implementation plan per side.

See `skills/integrations/bridge/SKILL.md`.
