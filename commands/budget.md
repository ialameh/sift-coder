---
description: Token + cost budget tracking and optimisation. Backed by Budget class in src/services/tokens.ts. See skills/meta/budget/SKILL.md
argument-hint: [set <limit>|status|report|optimise]
allowed-tools: Read, Edit, Bash
---

# /siftcoder:budget

Set / track / optimise token + cost budgets.

## Sub-modes

- `set <limit>` — set token or USD budget (defaults to session scope)
- `status` — show current consumption and projection
- `report` — historical usage by skill / agent / model
- `optimise` — recommend savings (model downsize, caching, Ollama, compression)

See `skills/meta/budget/SKILL.md` for full workflow contract.
