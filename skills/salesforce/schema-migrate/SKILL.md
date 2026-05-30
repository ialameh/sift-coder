---
name: schema-migrate
description: Use for Salesforce schema changes — object/field/relationship migrations w/ deploy plan, sandbox validation, rollback strategy. Different from /migrate (data) — schema-migrate handles metadata.
paths: '**/*.cls,**/*.trigger,**/*.apex,**/lwc/**,**/aura/**,**/objects/**,**/*.object-meta.xml,sfdx-project.json,**/flows/**,**/flexipages/**,**/permissionsets/**,**/profiles/**'
---

# schema-migrate

Salesforce schema migration. Metadata-shaped. Plan + validate + deploy + verify.

## When this differs from /migrate

- `/migrate` — data migration (rows between systems / shapes)
- `/schema-migrate` — metadata migration (objects, fields, relationships in Salesforce)

## Method

1. **Source state.** What does the current org's schema look like for the target objects?
2. **Target state.** What's the desired shape — fields added, types changed, relationships modified, picklists updated?
3. **Diff.** Per object:
   - Fields added / removed / type-changed
   - Relationships altered
   - Picklist values changed
   - Validation rules / triggers affected
4. **Risk per change:**
   - **Breaking** — existing data won't fit new schema (e.g. shrinking field length, removing required field)
   - **Lossy** — data must be transformed before migration (e.g. text → picklist)
   - **Safe** — additive only
5. **Deploy plan:**
   - **Pre-deploy:** data backup or transform of soon-to-be-incompatible records
   - **Schema deploy:** sfdx package deploy
   - **Post-deploy:** verify counts, sample integrity, rerun automation tests
6. **Rollback strategy:** explicit per change (some metadata changes don't roll back cleanly — flag those)

## Output shape

```
# Schema migration plan

## Diff
| Object | Field | Change | Risk |
|---|---|---|---|
| Account | Industry__c | text(255) → picklist | Lossy — 12 distinct values exist |
| Contact | Phone__c | added | Safe |
| Order__c | Total__c | currency → number | Breaking — currency loses ISO context |

## Pre-deploy
- Run: SELECT Industry__c, COUNT(Id) FROM Account → 14 distinct values; map to 8 picklist values
- Backup: sf project retrieve start --metadata Account → snapshot

## Schema deploy
- Validate: sf project deploy validate --source-dir force-app --test-level RunLocalTests
- Preview: sf project deploy preview --source-dir force-app --target-org prod
- Deploy: (after validation green + preview reviewed)

## Post-deploy
- Reconciliation queries:
  - Account count parity
  - Industry__c picklist distribution matches mapping
- Smoke test: 5 sample records open in UI without error

## Rollback
- Account.Industry__c text→picklist: NOT cleanly reversible. Restore from backup.
- Contact.Phone__c add: removable in next deploy.
- Order__c.Total__c type change: lossy reversal. Restore from backup.

## Effort estimate
- Pre-deploy data transform:  4 hours
- Validation deploy:          30 min
- Production deploy window:    1 hour
- Total:                      ~6 hours
```

## Rules

- **Cite metadata files.** Every change refers to a `.field-meta.xml`, `.object-meta.xml`, etc.
- **Flag non-reversible changes loudly.** Type narrowing, field removal, picklist value deletion.
- **Pre-deploy data transform** mandatory for any lossy change.
- **Validate before deploy.** No exceptions in production.
- **Reconciliation queries** for every breaking change.

## Anti-patterns

- Deploying a breaking schema change without pre-deploy data transform
- "We'll deal with rollback if needed"
- Skipping validation deploy ("it worked in dev")
- Picklist value deletion without checking dependent records

## When NOT to use

- Pure data move (no schema change) — `/migrate`
- Greenfield org (no existing data to migrate) — direct deploy
- Non-Salesforce — different stack entirely

## Subagent dispatch

- `salesforce-architect` agent for the diff + risk pass
- `Bash` for sfdx commands
- Memory MCP for prior schema-migration patterns

## Value over native CC

CC will deploy SF metadata on request. CC won't naturally produce a structured diff × risk × pre-deploy × rollback plan with reconciliation queries. The Salesforce-specific framing IS the value.
