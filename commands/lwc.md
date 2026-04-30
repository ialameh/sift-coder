---
description: LWC development — create, debug, wire adapters, events, performance
argument-hint: [create|debug|wire|event] <componentName>
allowed-tools: Read, Edit, Bash, Grep, Glob
---

# /siftcoder:lwc

## Subactions

- `create <name>` — scaffold a new LWC (HTML + JS + CSS + meta + jest test)
- `debug <name>` — dispatch the `lwc-debugger` agent on the named component
- `wire <name> <adapter>` — generate or refactor a wire adapter binding
- `event <name>` — generate event dispatch boilerplate (composed/bubbles default)

See `skills/salesforce-lwc/SKILL.md` and `agents/lwc-debugger.md`.
