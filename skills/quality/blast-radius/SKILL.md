---
name: blast-radius
description: Use pre-merge to assess the change's potential to cause damage. Distinct from ripple — ripple is "what else needs to change", blast-radius is "what could go wrong if this change is buggy".
---

# blast-radius

Pre-merge damage assessment. Different from `/ripple` (which finds dependent code). Blast-radius asks: **if this PR is buggy, what's the worst case?**

## Method

1. **Categorise the change:**
   - **Local** — single function, internal-only
   - **Module** — public API of one module
   - **Cross-cutting** — touches multiple modules, shared utility
   - **Infrastructure** — config, deploy, schema, dep
   - **External-facing** — API, UI, data emitted to other systems
2. **Probe damage axes:**
   - **Data** — could this corrupt or destroy data?
   - **Availability** — could this take the service down?
   - **Security** — does it touch authn/authz/secrets?
   - **Trust** — could users see broken UX, wrong data?
   - **Reversibility** — easy to revert? safe to roll forward?
3. **Score.** Each axis 0-3 (none / minor / major / catastrophic).
4. **Mitigations.** For each non-zero axis, list the existing safeguards (tests, gradual rollout, feature flag, monitoring, alerts) and whether they're sufficient.

## Output shape

```
Change:       <PR title or one-liner>
Category:     <local | module | cross-cutting | infrastructure | external-facing>

Damage axes:
  Data           [●○○]  minor    — <reason; mitigation>
  Availability   [○○○]  none
  Security       [●●○]  major    — <reason; mitigation>
  Trust          [●○○]  minor
  Reversibility  [●○○]  easy revert

Total blast radius:    <low | med | high>

Required pre-merge:
  ☐ <gate, e.g. canary deploy>
  ☐ <gate, e.g. SecOps signoff>
  ☐ <gate, e.g. integration test in staging>

Recommended monitoring post-merge:
  - <metric> — alert if <threshold>
  - <metric>
```

## Rules

- **Don't conflate with ripple.** Blast-radius is about damage, not propagation.
- **Score conservatively.** When in doubt, score higher.
- **Concrete mitigations only.** "Has tests" is too vague — name which tests, which boundaries.
- **Reversibility is its own axis.** A change with no rollback path is high-blast even if it looks small.

## Anti-patterns

- Auto-scoring "low" because the diff is small
- Ignoring data/security axes for non-data/security changes (they sneak in)
- "Should be fine" without naming the safeguards
- Generic "add monitoring" without naming the metric

## When NOT to use

- Trivial change (typo, comment, doc-only) — overkill
- Already merged — too late, post-mortem framework instead
- Internal-only one-liner refactor — manual judgement faster

## Subagent dispatch

- `Explore` for the categorisation
- Built-in `/security-review` for the security axis
- `reviewer` agent (if installed) for the structured assessment

## Value over native CC

CC will discuss risk if asked. CC won't naturally produce a structured 5-axis score with mitigations and concrete monitoring asks. The structure IS the value — turns "feels risky" into actionable gates.
