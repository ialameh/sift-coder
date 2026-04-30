---
description: Generate novel project ideas (not features for current repo)
argument-hint: [--salesforce] [--tiny] [--learning <tech>]
allowed-tools: Read, Bash
---

# /siftcoder:surprise-me

Generate brand-new project ideas. Memory-aware (won't propose what you've already built). Five ideas across creativity axes (cross-pollinate / subtraction / constraint-driven / memory-mining / wildcard) plus one explicit recommendation.

## Flags

- `--salesforce` — restrict to sfdx-shaped ideas (LWC, Flow, Apex packages, AppExchange)
- `--tiny` — &lt; 200 LOC budget
- `--learning <tech>` — vehicle for learning a specific technology

Invokes the `surprise-me` skill.

See `skills/ux/surprise-me/SKILL.md` for rules.
