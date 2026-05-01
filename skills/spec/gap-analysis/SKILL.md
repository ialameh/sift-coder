---
name: gap-analysis
description: Use to find what's missing — spec → implementation gaps, target → actual gaps, intended-vs-built. Produces a gap inventory with severity and effort estimates.
---

# gap-analysis

What was promised vs what was built. What was intended vs what exists. Surface gaps with severity + effort.

## Method

1. **Establish target.** What's the reference? Possible inputs:
   - Spec doc
   - Acceptance criteria checklist
   - Architecture doc / diagram
   - Test plan
   - Prior implementation in another repo (for migration)
2. **Establish actual.** What exists?
   - Code present
   - Tests present
   - Docs present
   - Operational / monitored
3. **Match item-by-item.**
   - **Present** ✅
   - **Partial** ⚠️ (exists but incomplete or buggy)
   - **Missing** ❌
4. **Severity per gap:**
   - **Blocker** — capability unavailable
   - **High** — capability degraded
   - **Medium** — secondary functionality
   - **Low** — nice-to-have
5. **Effort estimate** per gap (hours or days).

## Output shape

```
Target:    <spec/doc/checklist source>
Actual:    <repo / branch / deploy>

Coverage:  ✅ N  ⚠️ M  ❌ K  (out of N+M+K total items)

Gaps:

  ❌ [BLOCKER]   <item>  
                  Target says: <quote>
                  Actual:      <evidence of absence>
                  Effort:      <hrs/days>

  ⚠ [HIGH]      <item>
                  Target says: <quote>
                  Actual:      <partial impl at file:line>
                  Effort:      <hrs/days>

  ⚠ [MEDIUM]    <item>
                  ...

Total effort to close gaps: <hrs/days>
```

## Rules

- **Cite both sides.** Target quote + actual evidence (or "not found in <searched paths>").
- **Don't conflate "not yet built" with "not designed".** Flag the latter as a target ambiguity.
- **Severity by capability impact, not effort.** Easy fix can still be a blocker.
- **Search broadly before declaring missing.** Capability may be implemented under a different name.

## Anti-patterns

- Counting tests as items (separate analysis)
- Marking partial as missing (or vice versa) without evidence
- Effort estimates without scope (always say what's in the estimate)
- Ignoring "extra" — items in actual that aren't in target (might be rot or prudent additions)

## When NOT to use

- No clear target reference — gap-analysis needs both sides
- Pre-spec stage — `/improve-spec` first
- Ongoing development — wait for a milestone

## Subagent dispatch

- `Explore` to map actual
- `general-purpose` for the matching pass
- Memory MCP for what was decided in prior sessions

## Value over native CC

CC will compare two things if asked. CC won't naturally produce structured target ↔ actual matrix with severity + effort columns. The structure IS the value — feeds into prioritisation.
