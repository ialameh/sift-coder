---
description: Salesforce architecture review — capacity, security, integrations, tech debt
argument-hint: [--target-org <alias>] [--scope <area>]
allowed-tools: Read, Grep, Glob, Bash, WebFetch
---

# /siftcoder:sf-architect

Dispatches the `salesforce-architect` agent. Read-only. Produces a written assessment grounded in actual metadata.

## Output

- Executive summary
- Capacity table
- Top 3 risks / Top 3 wins
- Risk register
- Roadmap (quick / structural / strategic)
- Mermaid diagrams (data model, integration topology, environments)

See `agents/salesforce-architect.md` and `skills/salesforce-architecture/SKILL.md`.
