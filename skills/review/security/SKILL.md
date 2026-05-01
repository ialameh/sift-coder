---
name: security
description: Use for security review with project-specific framing. Adds memory of prior incidents/threats, project-stack-aware patterns (Salesforce sharing model, etc.). Complementary to built-in /security-review.
---

# security (SiftCoder-shaped)

**Complementary to** built-in `/security-review`. Built-in is excellent at OWASP top 10 + common patterns. This skill adds:

1. **Stack-aware** — Salesforce orgs need sharing/CRUD/FLS analysis; Node.js needs prototype-pollution/RCE-via-deserialisation; Apex needs SOQL injection variants
2. **Incident memory** — prior security findings captured by `pin-incident` hook fed back as known risk areas
3. **Threat-model-aware** — if the project has documented threats (e.g. PII handling, payment, multi-tenant), targeted assessment

## When to use which

- General OWASP / common vulnerabilities → built-in `/security-review`
- Salesforce-specific (sharing, FLS, CRUD, callouts, secrets) → `/siftcoder:salesforce-security`
- Compliance-shaped → `/comply`
- Project-context-aware security → this skill

## Method

1. **Stack detect.** What language(s), framework(s), domain (web/cli/iot/sf-org)?
2. **Incident memory.** `mem_search { kind: "incident" }`. What's been hit before?
3. **Threat model.**
   - If project has a threat doc → load it
   - Else infer top 3 threats from stack + domain
4. **Stack-tailored review.** Different rule sets per stack:
   - Node/JS: prototype pollution, eval, deserialisation, regex DoS, XSS, CSRF, JWT misuse
   - Python: pickle, eval, SQL injection, weak crypto, path traversal
   - Apex: SOQL injection (string concat), CRUD/FLS bypass, sharing leaks, XSS via Visualforce
   - Generic: secrets in code, weak randomness, time-of-check vs time-of-use
5. **Findings.** Severity (critical / high / medium / low / info). Evidence (file:line). Reproduction (where applicable). Mitigation (specific code change).

## Output shape

```
Stack:       <detected>
Threat model: <loaded from project | inferred>

Incident memory: <count> prior incidents in this area

Findings:

  [CRITICAL]  SOQL injection at src/UserController.cls:42
    Evidence: query string built via concatenation
    Repro:    POST /api/users?filter=' OR Id != null--
    Fix:      use bind variables (Database.queryWithBinds) or WITH SECURITY_ENFORCED

  [HIGH]      Secret in repo at config/dev.json:14
    Evidence: api_key field with non-empty value
    Fix:      move to env var; add to .gitignore; rotate key

  [MEDIUM]    Weak randomness for session id at src/auth/session.ts:23
    Evidence: Math.random() used
    Fix:      crypto.randomUUID() or crypto.randomBytes(16)

Summary:
  Critical: 1
  High:     1
  Medium:   1
  Low:      0

Pre-merge required: address critical + high.
```

## Rules

- **Reproduction or evidence is required for critical/high.** Speculation is medium at most.
- **Stack-specific rules apply.** Generic OWASP findings → defer to built-in.
- **Cross-reference incident memory.** "We had a SQLi here in 2024" → flag related code as elevated.
- **Specific fixes.** Not "validate input" — name the validation library, the encoding, the check.

## Anti-patterns

- Generic "use prepared statements" without showing the offending concat
- Flagging every input as potentially-malicious without showing the threat path
- Ignoring stack idioms (Apex `with sharing` is a real thing; Node has no equivalent)
- Long lectures per finding

## When NOT to use

- Greenfield without threat model — built-in suffices
- Compliance review — `/comply`
- Salesforce-only — `/siftcoder:salesforce-security`

## Subagent dispatch

- `Explore` for code paths
- Built-in `/security-review` for the OWASP pass — combine outputs
- `general-purpose` for the synthesis

## Value over built-in /security-review

Built-in is generic. This skill adds: stack-tailoring, incident memory, threat model awareness, and project-specific patterns. Use both — built-in for breadth, this for depth.
