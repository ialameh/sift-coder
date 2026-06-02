---
name: salesforce-apex
description: Use when working on Apex code — classes, triggers, batch, queueable, schedulable, REST/SOAP services. Covers FFLib patterns, bulkification, governor limits, security, test data factories.
paths: '**/*.cls,**/*.trigger,**/*.apex,**/lwc/**,**/aura/**,**/objects/**,**/*.object-meta.xml,sfdx-project.json,**/flows/**,**/flexipages/**,**/permissionsets/**,**/profiles/**'
---

# Salesforce Apex skill

Domain knowledge for Apex development. Use **with** Claude Code's native Plan/Explore/general-purpose agents — this skill provides the rules; the agents do the work.

## Patterns to enforce

- **Bulk-safe by default.** Never write SOQL/DML inside a loop. Always operate on collections.
- **Selector / Domain / Service / UnitOfWork (FFLib)** for non-trivial domains. Skip for &lt; 200-line orgs.
- **`with sharing` by default**, `without sharing` only when explicitly auditable and necessary.
- **`Database.Stateful` only for `Database.Batchable`** that genuinely needs state.
- **Custom permission checks** via `FeatureManagement.checkPermission` not hardcoded profiles.
- **Limits-aware** — query `Limits.getQueries()`, `Limits.getDmlRows()` in long-running transactions; bail/chain instead of busting.

## Common smells

- Trigger logic in trigger body (move to handler class).
- `SELECT * FROM` patterns — always select fields explicitly.
- `try { ... } catch (Exception e) { }` — never swallow.
- Hardcoded record-type ids (use `Schema.SObjectType.getRecordTypeInfosByDeveloperName`).
- `System.debug` left in production.

## Test patterns

- `@IsTest(SeeAllData=false)` always.
- Use `Test.startTest()`/`Test.stopTest()` to reset limits.
- Use a test data factory (`TestDataFactory.createX(N)`) — never build records inline in tests.
- For triggers: 200+ records to verify bulkification.

## Governor limits cheat sheet

| Limit | Synchronous | Async |
|---|---|---|
| SOQL queries | 100 | 200 |
| SOQL rows | 50,000 | 50,000 |
| DML statements | 150 | 150 |
| CPU time (ms) | 10,000 | 60,000 |
| Heap (MB) | 6 | 12 |
| Callouts | 100 | 100 |

## Security checklist

- CRUD/FLS via `Security.stripInaccessible` or `WITH SECURITY_ENFORCED`
- SOQL injection — bind variables, never string concat
- Apex sharing — explicit `with sharing` / `without sharing` / `inherited sharing`
- HTTPS for callouts, Named Credentials over hardcoded URLs

## When using subagents

Dispatch to the native `general-purpose` agent for refactors, the built-in `Plan` agent for architecture, and the `apex-bulkifier` agent for targeted bulk-safety passes.
