---
name: comply
description: Use for compliance-shaped reviews — SOC2, HIPAA, GDPR, PCI-DSS, or org-specific control sets. Maps the codebase against named controls, surfaces gaps, produces an evidence-based report.
---

# comply

Control-mapped compliance review. Pick the framework; map the code; surface gaps with evidence.

## Frameworks supported

- **SOC2 Type 2** — Common Criteria (CC) controls
- **HIPAA** — Privacy, Security, Breach Notification rules
- **GDPR** — data subject rights, lawful basis, processor obligations
- **PCI-DSS v4** — for payment-card-handling code
- **Industry clouds** (Salesforce: Health Cloud / Financial Services Cloud / Public Sector Solutions) — see `/siftcoder:salesforce-comply`

User picks framework; or detect from project metadata if obvious.

## Method

1. **Pick framework + scope.** Which controls apply? (e.g. SOC2: CC6 Logical Access; CC7 System Operations.)
2. **Per control, map code:**
   - What evidence demonstrates the control?
   - Where does the evidence live (code, config, log, doc, test)?
   - Is the evidence current? Auditable? Tamper-evident?
3. **Gap analysis** for each control:
   - Has evidence and is current → ✅
   - Has evidence but stale → ⚠️
   - No evidence → ❌
4. **Severity** for each gap. Compliance frameworks usually rank for you (e.g. SOC2 has Implementation status); use that.
5. **Remediation plan** with effort estimate.

## Output shape

```
Framework:   <e.g. SOC2 Type 2>
Scope:       <e.g. Common Criteria 6.1 — 6.8>
Evidence period: <date range>

Control mapping:

  CC6.1 — Logical access controls
    Evidence: src/auth/middleware.ts:14-58, audit-log table
    Status:   ✅ implemented, evidence current
    Tests:    tests/auth/access-control.test.ts (12 tests)

  CC6.2 — Privileged access management
    Evidence: <none found>
    Status:   ❌ gap
    Risk:     high — admin actions not logged
    Remediation: instrument privileged ops in src/admin/*; ~2 days

  CC7.1 — System monitoring
    Evidence: monitors/memory-daemon-health.mjs, OpsGenie config
    Status:   ⚠️  partial — daemon health monitored; user-facing latency not
    Risk:     med
    Remediation: add p95 latency alert; ~4 hours

Summary:
  ✅ 8 controls fully evidenced
  ⚠️  3 controls partial
  ❌ 2 controls gap
  Total remediation effort: ~3-5 days
```

## Rules

- **Cite evidence by file:line / table / config key.** No claim without a citation.
- **Frameworks have official wording.** Use it. Don't paraphrase controls.
- **Stale evidence is a gap.** Last-touched > 12 months on a code-based control = ⚠️.
- **Don't auto-fix.** Compliance changes need human review of the framework mapping. Output recommendations only.

## Anti-patterns

- Generic "you should have logging" without naming the control it satisfies
- Citing a control without showing the code that implements it
- Treating "we have a policy doc" as evidence (frameworks want operational evidence)
- Mapping controls to imagined code (cite real paths)

## When NOT to use

- General code quality — `/empathy`, `/review`
- Pre-audit dry-run — actually use it; this is its purpose
- Ad-hoc security review — `/security` skill (lighter touch)

## Subagent dispatch

- `Explore` for evidence collection
- Built-in `/security-review` overlaps; combine outputs
- `general-purpose` for the control mapping
- `salesforce-architect` agent for SF-specific compliance (Health, FS, Public Sector)

## Value over native CC

CC will discuss compliance topics if asked. CC won't naturally produce a control-by-control mapping with evidence citations and stale-evidence detection. The framework-shaped output IS the value — feeds directly into audit prep.
