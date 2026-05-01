---
name: migrate
description: Use for data migration between systems / schemas / regions. Plan + execute + verify + rollback. Memory captures the run for audit.
---

# migrate

Data migration. The core discipline: forward-only changes are cheap; reversibility is expensive but mandatory.

## Method

1. **Scope.** What's moving? Source → sink. Volume estimate.
2. **Schema diff.** Source vs sink fields. Per field:
   - Direct copy
   - Transformed (function name + spec)
   - Dropped
   - New (default value or null)
3. **Reference data.** Lookups, FKs — exists in target?
4. **Identity.** How to dedupe / link? Source PKs preserved? New IDs?
5. **Strategy:**
   - Big bang (cutover at moment T)
   - Dual-write (write both during transition window)
   - Backfill + delta (initial bulk, then incremental)
6. **Plan rollback.** What's the revert path? Snapshot? Re-replay from source?
7. **Validate.** Reconcile counts + samples + invariants.
8. **Cutover.** Stop writes to source. Final delta. Switch reads.
9. **Verify in production.** Spot-check; row-count match; key invariants hold.
10. **Capture run** to memory for audit.

## Output shape

```
# Migration: <source> → <sink>

## Volume
<row counts per table>

## Schema diff
| Field | Source | Sink | Action |
|---|---|---|---|
| user_id | bigint | uuid | transform: hash → uuid |
| email | text | text | direct |
| ... |

## Reference data
- ✓ countries: 244 rows in both
- ⚠ regions: 50 in source, 47 in sink (3 to map)

## Strategy
<big bang | dual-write | backfill+delta>

## Steps
1. Snapshot source for rollback (location)
2. Run schema migration on sink
3. Bulk copy: <command>
4. Delta loop: <command>
5. Validate (counts, samples, invariants)
6. Cutover (stop writes; final delta; switch reads)
7. Smoke test in prod
8. Mark old data as deprecated (don't delete for N days)

## Rollback
<step-by-step path back>

## Validation queries
- count parity:    <SQL>
- sample integrity: <SQL>
- invariants:      <SQL>

## Captured
<memory id — run logged for audit>
```

## Rules

- **Snapshot before any write.** Rollback's foundation.
- **Reference data verified before migration starts.** FK breaks during cutover are catastrophic.
- **Dual-write only if requirements demand it.** It doubles complexity.
- **Old data not deleted at cutover.** Keep N days post-cutover.
- **Memory captures the full run.** Audit trail.
- **Every step has a rollback.**

## Anti-patterns

- Big-bang without snapshot
- "We'll figure out rollback if needed"
- Migrating without validation queries
- Deleting source immediately after cutover
- Cutover without dry-run on staging-shaped data

## When NOT to use

- Single-record / few-record changes — direct DML
- Schema migration only (no data move) — `/siftcoder:schema migrate`
- Org-internal Salesforce data shuffle — `/siftcoder:sf-test-data` for tests; otherwise data loader

## Subagent dispatch

- `Plan` for the migration plan
- `chaos` for failure mode design
- `general-purpose` for the actual cutover scripts
- Memory MCP for capture

## Value over native CC

CC will write migration scripts. CC won't naturally enforce: snapshot-first, reference-data verification, dual-write evaluation, rollback path per step, post-cutover retention. The discipline IS the value — migrations without these become incidents.
