---
name: salesforce-comply
description: Use for Salesforce industry-cloud compliance work — Health Cloud (HIPAA), Financial Services Cloud (regulatory), Public Sector Solutions (FedRAMP/CJIS), Education Cloud. Maps controls to org configuration.
paths: '**/*.cls,**/*.trigger,**/*.apex,**/lwc/**,**/aura/**,**/objects/**,**/*.object-meta.xml,sfdx-project.json,**/flows/**,**/flexipages/**,**/permissionsets/**,**/profiles/**'
---

# salesforce-comply

Industry-cloud compliance. Different from generic `/comply` (which covers SOC2/PCI/GDPR). This skill knows the Salesforce-specific controls per industry vertical.

## Industry clouds + frameworks

| Industry cloud | Primary frameworks |
|---|---|
| Health Cloud | HIPAA, HITRUST, GxP (life sciences) |
| Financial Services Cloud (FSC) | FINRA, SEC, MiFID II, GDPR |
| Public Sector Solutions | FedRAMP Moderate/High, CJIS, StateRAMP, IRS-1075 |
| Education Cloud | FERPA, COPPA |

## Method

1. **Identify cloud + frameworks.** Project metadata reveals (e.g. presence of `HealthCloud__*` SObjects, FSC managed packages).
2. **Per framework, fetch the control set.** Each Salesforce cloud has documented mappings.
3. **Map org configuration to controls:**
   - **Sharing model** (OWD, role hierarchy, sharing rules) — affects HIPAA min-necessary
   - **Encryption** (Shield Platform Encryption) — required for some HIPAA / FedRAMP profiles
   - **Field-level audit** — required for many regulated fields
   - **Login policies** (IP restrictions, MFA, session timeout) — FedRAMP / CJIS
   - **Data export controls** — FERPA, GDPR
   - **Retention** (Privacy Center) — GDPR, HIPAA
4. **Per control, status:**
   - ✅ implemented + evidence cited
   - ⚠️ partial / stale evidence
   - ❌ gap

## Output shape

```
Industry cloud:   <Health Cloud | FSC | Public Sector | Education>
Frameworks:       <HIPAA | FedRAMP-Moderate | etc>
Org edition:      <Enterprise | Unlimited | Government Cloud Plus>

Control mapping:

  HIPAA §164.312(a)(1) — Access Control
    Status:   ✅
    Evidence: Profile audit shows no "View All" on PHI objects
    Tests:    apex test class confirms with-sharing on PHI access

  HIPAA §164.312(b) — Audit Controls
    Status:   ⚠️ partial
    Evidence: Field History on key fields enabled
    Gap:      Login history retention 6 months; HIPAA wants ≥ 6 years
    Fix:      enable Login History export to S3 / SIEM; ~2 days

  FedRAMP AC-2 — Account Management
    Status:   ❌ gap
    Evidence: <not found>
    Risk:     high
    Fix:      configure user provisioning workflow; quarterly access reviews

Summary:
  ✅ N controls
  ⚠️  M controls (partial)
  ❌ K controls (gaps)

Compliance posture: <ready | needs remediation>
```

## Rules

- **Cite Salesforce-specific evidence.** Object permissions, sharing rules, profile/permset metadata, encryption schemes, login policies.
- **Government Cloud editions** have built-in controls; flag when project is on commercial cloud and FedRAMP is required.
- **Industry cloud features are licence-gated.** Check `OrgLimits` and `User.UserLicense`.
- **Trail audit** for AppExchange managed packages on PHI/PII data.

## Anti-patterns

- Generic SOC2 controls applied to Health Cloud (different framework)
- Treating Profiles as access-control evidence without checking Permission Sets
- Ignoring Field History (key audit primitive)
- Recommending Shield Encryption everywhere (it's expensive + has limits)

## When NOT to use

- Non-industry-cloud Salesforce — `/comply` (generic) instead
- Non-regulated org — `/security` skill
- Pre-licence — feature unavailability is the immediate gap

## Subagent dispatch

- `salesforce-architect` for the org review pass
- `comply` skill for cross-framework checks (e.g. GDPR alongside HIPAA)
- `general-purpose` for control-mapping tables

## Key references

- Health Cloud security: help.salesforce.com → Health Cloud Security
- FSC compliance: help.salesforce.com → Financial Services Cloud Security
- Salesforce Compliance: trust.salesforce.com → Compliance documents (SOC, ISO, FedRAMP)
- Government Cloud: help.salesforce.com → Government Cloud Plus

## Value over native CC and /comply

Generic `/comply` doesn't know Salesforce-specific evidence (sharing model, profile semantics, FLS, Shield Encryption). This skill bridges that gap. Platform + framework knowledge IS the value.
