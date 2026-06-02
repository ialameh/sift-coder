---
name: salesforce-flow
description: Use for Salesforce Flow Builder work — Record-Triggered, Screen, Scheduled, Platform-Event-Triggered, Auto-launched. Bulk-safe patterns, error handling, sub-flows, performance.
paths: '**/*.cls,**/*.trigger,**/*.apex,**/lwc/**,**/aura/**,**/objects/**,**/*.object-meta.xml,sfdx-project.json,**/flows/**,**/flexipages/**,**/permissionsets/**,**/profiles/**'
---

# salesforce-flow

Salesforce Flow. Declarative automation. Replaces Workflow Rules + Process Builder (deprecated).

## Flow types

| Type | Triggered by | Pattern |
|---|---|---|
| Record-Triggered Before-Save | DML on object | Field updates same record (lightweight) |
| Record-Triggered After-Save | DML on object | Cross-object DML, callouts (async OK) |
| Schedule-Triggered | Cron | Bulk jobs |
| Platform-Event-Triggered | PE publish | Async response to events |
| Screen | User action | UI flow |
| Auto-launched | Apex / Flow / button | Sub-routine |

## Bulk-safe patterns

1. **Bulkify in Flow:** loops process collections, not single records. Get Records → Loop → Add to collection → Update Records (after loop).
2. **DML in loop = anti-pattern** (CPU + governor limit risk). Always batch.
3. **Sub-flow for reuse.** Auto-launched sub-flows; pass collections.
4. **Decision elements** before DML to filter out unaffected records.

## Error handling

Every Flow needs error handling. Three options:
- **Fault path** on each DML node (most explicit)
- **Schedule-Triggered fault email** (org-wide setting)
- **Platform Event for failures** (custom error_event__e)

For Record-Triggered: fault paths must NOT throw (or DML rolls back). Use `Sticky Faults` pattern: log to error event, swallow.

## Method (build a record-triggered flow)

1. **Decide trigger:** Before-Save (field updates only) or After-Save (related DML, callouts).
2. **Entry conditions** — narrow as much as possible to avoid wasted invocations.
3. **Bulkified body** — collections, loops only over collections, single DML at end.
4. **Fault paths** on every DML.
5. **Test:** Apex test class invoking flow via Database.insert/update of trigger object. 200 records minimum to verify bulk safety.
6. **Activate** in deploy package.

## Output shape

```
Flow:        <name>
Type:        <record-triggered before-save | etc>
Trigger:     <object + entry conditions>

Structure:
  Get Records   <variable name>
  Loop          <variable>
  ↳ Decision    <conditions>
  ↳ Assignment  <field updates>
  Add to coll   <output collection>
  Update Records <single DML at end>

Fault handling:
  Each DML → fault path → custom error event publish
  Email-on-error: <on | off>

Test plan:
  Apex test class:  <FlowName_Test.cls>
  Records inserted: 200 (bulk-safe verification)
  Coverage:          ≥ 75%
```

## Rules

- **Before-Save flows: same record only, field updates only.** No DML on related, no callouts.
- **After-Save flows: anything else, but mind governor limits.**
- **No DML in loops.** Aggregate; flush once.
- **Fault paths ALWAYS.** Even when "shouldn't fail".
- **Apex test classes for Flows.** Flow tests in Setup are not source-controlled.
- **Sub-flows for reuse.** Don't copy-paste decision logic.

## Anti-patterns

- Multiple Flows on same object same trigger (ordering chaos; consolidate)
- Process Builder still active (deprecated; migrate)
- Flow that calls Apex that calls Flow (debugging nightmare)
- Decision element that's actually a switch on 30 picklist values (use Apex; Flow has limits)
- Schedule-Triggered Flow processing 10k+ records synchronously (use Apex Batch)

## When NOT to use

- Pure Apex automation works — Flow adds complexity
- Sharing rules / role updates — those are config, not Flow
- Bulk migration — Apex Batch / Bulk API better

## Subagent dispatch

- `salesforce-architect` for "should this be Flow or Apex?" decision
- `apex-bulkifier` for the Apex test class
- `Plan` for multi-flow refactors

## Key references

- Flow Builder: help.salesforce.com → Flow Builder
- Bulkification: trailhead.salesforce.com (Flow Bulkification)
- Process Builder migration: help.salesforce.com → Migrate to Flow

## Value over native CC

CC won't naturally know Flow-specific bulkification patterns, Before-Save vs After-Save trade-offs, fault-path discipline, or sub-flow consolidation patterns. Platform-specific knowledge IS the value.
