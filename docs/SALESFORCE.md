# Salesforce

SiftCoder ships first-class Salesforce support because Claude Code has no native domain bias for it. 12 skills, 4 agents, 18 commands.

## Commands

### Apex
```
/siftcoder:apex-patterns          # FFLib / Selector / Domain / Service / UnitOfWork patterns
/siftcoder:sf-test "<file>"       # comprehensive test gen
/siftcoder:sf-debug "<log>"       # debug-log analysis
```

### LWC
```
/siftcoder:lwc create "<name>"    # scaffold component + tests
/siftcoder:lwc-debug              # wire / lifecycle / state diagnosis
```

### Schema
```
/siftcoder:schema erd             # entity-relationship diagram
/siftcoder:schema-migrate         # migration with risk classification
```

### Architecture
```
/siftcoder:sf-architect           # org-level review (read-only)
/siftcoder:sf-flow                # Flow design + workflow conversion
/siftcoder:sf-cpq                 # CPQ configuration assistance
/siftcoder:sf-agentforce          # Agentforce setup
/siftcoder:sf-einstein            # Einstein integration
```

### Deploy + ops
```
/siftcoder:sf-deploy validate     # validate deployment
/siftcoder:sf-deploy diff         # diff against org
/siftcoder:sf-deploy rollback     # rollback to checkpoint
/siftcoder:sf-package             # unlocked package management
```

### Integrations + security
```
/siftcoder:sf-connect             # Named/External Credentials, OAuth
/siftcoder:sf-webhook             # inbound webhook scaffold w/ HMAC
/siftcoder:sf-comply              # compliance review
/siftcoder:sf-security            # security audit
```

## Agents

| Agent | Use |
|---|---|
| `salesforce-architect` | Org architecture review; capacity table + risk register |
| `apex-bulkifier` | Targeted bulk-safety refactor (row-by-row → batch) |
| `lwc-debugger` | LWC issue diagnosis |
| `memory-curator` | Memory store maintenance (works for any project, not Salesforce-specific) |

## Skills

12 SF-specific skill folders under `skills/salesforce/`:

`salesforce-apex` · `salesforce-lwc` · `salesforce-deploy` · `salesforce-architecture` · `salesforce-test` · `salesforce-agentforce` · `salesforce-einstein` · `salesforce-cpq` · `salesforce-comply` · `salesforce-flow` · `salesforce-security` · `schema-migrate`

Each skill encodes platform-specific rules: governor limits, SOQL/LDV, permission sets, sharing model, deployment metadata API quirks.

## Memory + Salesforce

The memory engine is platform-agnostic but particularly useful for Salesforce work:

- **Capture** records every Apex test execution, deploy attempt, and metadata pull
- **`mem_why`** traces decisions across long-running customisation work
- **`mem_search`** answers "have we hit this governor-limit pattern before?" or "what was our reason for not using Flow here?"

Pair `/siftcoder:sf-architect` with `mem_search` for "give me a review grounded in what we already decided."

## See also

- [agents.md](agents.md) — full agent table
- [skills.md](skills.md) — all skills
- [commands.md](commands.md) — full command reference
