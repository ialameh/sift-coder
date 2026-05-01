---
name: salesforce-security
description: Use for Salesforce-specific security review — sharing model, CRUD/FLS, callout security, secrets management, Shield Encryption, OWASP Top 10 mapped to Salesforce. Beats built-in /security-review for SF orgs.
---

# salesforce-security

Salesforce security. Org-specific threat model — sharing/CRUD/FLS leaks, SOQL injection, secrets in metadata, callout patterns.

## Threat model (per stack layer)

### Apex layer
- **SOQL injection** — string-built queries
- **CRUD/FLS bypass** — DML without `WITH SECURITY_ENFORCED` / `Security.stripInaccessible`
- **Sharing leak** — `without sharing` without auditable rationale
- **Apex managed sharing** misconfigured
- **Secrets in code** — keys, tokens, signing material in classes/static resources

### LWC / Visualforce layer
- **XSS** — `lwc:dom="manual"` w/o sanitisation; Visualforce expressions w/o `JSENCODE` etc
- **Insecure remote actions** — `RemoteAction` without auth check
- **`@AuraEnabled` exposure** — public accessibility; needs CRUD/FLS in body

### Configuration layer
- **OWD too permissive** — Public Read/Write where Private + sharing rule would suffice
- **Profile permissions** — "View All Data" / "Modify All Data" / "Author Apex" handed broadly
- **Permission Set Group** drift — explicit grants outliving role changes
- **Named Credentials** missing for callouts (hardcoded URLs/tokens)
- **External Credentials** + auth providers — mTLS / OAuth flow correctness
- **Shield Encryption** — sensitive fields without encryption when org is licensed

### Integration layer
- **Outbound callout** — should use Named Credentials, not hardcoded
- **Inbound webhook** — needs HMAC verification + replay window (see `/siftcoder:sf-webhook`)
- **REST/SOAP API** — auth, rate limit awareness, error shape leaking internals

## Method

1. **Detect surface.** Apex classes/triggers, LWCs, Visualforce, Flows, integrations, config (permsets, profiles, OWD).
2. **Per surface, run the per-layer rule set above.**
3. **Severity:**
   - **Critical** — data leak / privilege escalation / data loss
   - **High** — sharing bypass affecting PII, SOQL injection
   - **Medium** — missing FLS check on UI surface, no Named Cred
   - **Low** — style / hardening recommendations
4. **Cross-reference incident memory** for prior security findings in same area.

## Output shape

```
Org / project:   <name>

Findings:

  [CRITICAL]   SOQL injection at PaymentController.cls:42
    Evidence:  query string built via concatenation of req.params['filter']
    Repro:     POST /apex/payment?filter=' OR Id != null UNION SELECT...
    Fix:       use Database.queryWithBinds(query, bindVars, AccessLevel.USER_MODE)

  [HIGH]       without sharing on UserController without rationale
    Evidence:  src/classes/UserController.cls:14
    Risk:      privileged data exposure to non-admin users
    Fix:       change to with sharing OR document rationale + reviewer approval

  [HIGH]       Named Credential not used for outbound callout
    Evidence:  src/classes/StripeService.cls:67 — hardcoded https://api.stripe.com
              + apiKey field
    Fix:       create Named Credential 'Stripe_Live'; replace hardcoded URL + key

  [MEDIUM]    LWC missing CRUD check before Apex DML
    Evidence:  src/lwc/orderEdit/orderEdit.js:34 → OrderApex.updateOrder
              → updateOrder Apex doesn't call Schema.SObjectType.Order__c.IsUpdateable
    Fix:       add WITH SECURITY_ENFORCED in SOQL + Security.stripInaccessible in DML

  [LOW]       Shield Encryption available but not enabled on PII fields
    Evidence:  org has licence; Email__c on Contact__c stores PII; not encrypted
    Fix:       enable Probabilistic encryption on Email__c (deterministic if needed for SOQL)

Summary:
  Critical: 1     High: 2     Medium: 1     Low: 1
```

## Rules

- **Cite file:line + the exact code.** No "somewhere in payment".
- **Reproduction for critical/high.** Speculation maxes at medium.
- **`with sharing` is default.** Every `without sharing` needs documented rationale.
- **Named Credentials for ALL outbound callouts.** No exceptions in production code.
- **WITH SECURITY_ENFORCED or stripInaccessible** for any UI-driven DML.
- **Memory cross-reference** for repeat findings.

## Anti-patterns

- Profile-based access control without permission set audit
- "Test as user" without `System.runAs(...)` in tests
- Disabling `with sharing` to make a query work (find the actual fix)
- Storing tokens in Custom Settings without Encryption
- Hardcoded FLS bypasses ("admin only" fields with broad profile reads)

## When NOT to use

- Non-Salesforce code — `/security` skill or built-in `/security-review`
- Compliance-shaped — `/siftcoder:salesforce-comply` (HIPAA/FedRAMP/etc)
- General architecture — `/siftcoder:sf-architect`

## Subagent dispatch

- `salesforce-architect` for the org-wide audit (sharing, profiles, permsets)
- `apex-bulkifier` if findings include bulk-safety crossover
- Built-in `/security-review` for the OWASP-specific patterns; combine outputs
- `general-purpose` for the structured findings table

## Key references

- Apex Security: developer.salesforce.com → Apex Developer Guide → Security
- LWC Security: developer.salesforce.com → LWC Developer Guide → Security
- Salesforce Trust: trust.salesforce.com
- Shield: help.salesforce.com → Salesforce Shield

## Value over built-in /security-review

Built-in is generic OWASP. This skill knows: sharing model, CRUD/FLS semantics, Apex `with sharing` discipline, Named Credential patterns, Shield Encryption capacity, LWC/Visualforce XSS specifics, Apex SOQL injection variants. Platform depth IS the value. Use both — built-in for breadth, this for SF depth.
