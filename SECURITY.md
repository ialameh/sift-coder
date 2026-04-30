# Security Policy

## Supported versions

| Version | Supported |
|---|---|
| 3.x (current) | ✅ |
| 2.x (legacy SiftCoder) | ❌ end-of-life on V3 GA |
| 1.x | ❌ |

## Reporting a vulnerability

**Do not open public GitHub issues for security vulnerabilities.**

Email: `issam@alameh.com` with subject prefix `[SECURITY]`.

Include:
- Affected version (`siftcoder version`)
- Reproduction steps
- Impact assessment (what an attacker could achieve)
- Suggested fix (if known)
- Whether you'd like public credit on disclosure

We acknowledge within 72 hours, ship patches for confirmed vulnerabilities within 14 days for critical issues, 30 days for high severity, on the next release for medium/low.

## Threat model

SiftCoder runs locally and stores data in `~/.siftcoder/v3/`. The threat surface:

| Surface | Threats | Mitigations |
|---|---|---|
| Boundary enforcer hook | path-traversal in scope.json, denial-of-service via slow regex | hard-coded glob primitives, no user-supplied regex; non-blocking failure mode |
| Memory daemon UDS socket | local privilege escalation if socket world-writable | created with 0700 perms; owner-only |
| Memory store SQLite | SQL injection via captured payloads | all queries parameterised; payloads stored as opaque JSON |
| MCP server stdio | malicious payload from compromised host | length-prefixed framing; max-frame cap; JSON parse errors fail closed |
| Ollama backend | RCE via malicious model | only accept models from explicit allow-list; document recommended models |
| Anthropic API | API key exfil | key read from env only; never logged; never embedded in capture payloads |
| Hooks | shell injection via tool-input strings | hooks consume JSON only; no shell interpolation of payloads |
| `siftcoder backfill --from-v2` | path traversal via custom v1Root | resolved + checked against home dir; fails closed on suspicious paths |

## What's intentionally not in scope

- Full sandboxing of arbitrary Apex / LWC / TypeScript code that the assistant writes — that's the user's CI / deploy gate's job
- Network-level confidentiality of Ollama / Anthropic traffic — relies on TLS at the destination
- Multi-tenant isolation on shared dev hosts — V3 is single-user-per-OS-account by design

## Known limitations

- Memory store is **not encrypted at rest**. Sensitive data should be excluded from capture via `.siftcoder/scope.json` or `.siftcoder/privacy.json` redaction patterns.
- Webhook scaffolds (`/siftcoder:sf-webhook`) ship with HMAC verification by default but **users must rotate secrets** — there is no automatic rotation.
- Cloud-sync / federation features were intentionally removed in V3; if your workflow needs them, do not bridge to a third-party service without security review.

## Disclosure history

This project is at v3.0.0 — no public CVEs to date.

## Coordinated disclosure

For widely-exploitable issues, we coordinate disclosure with downstream consumers (npm consumers, plugin consumers) before public detail goes live. Reports may stay embargoed up to 90 days post-fix at our discretion or earlier on consumer signoff.

## Out-of-scope security reports

These are not vulnerabilities under this policy:

- Lack of rate-limiting in CLI commands (single-user tool)
- Self-XSS in markdown rendered by the assistant (not exploitable cross-user)
- Theoretical timing attacks against hash comparisons that the daemon doesn't actually perform on attacker-controlled data
- Denial-of-service against the user's own machine via prompt-injection (use prompt-safety guidance from Claude Code)

If unsure, send the report and we'll triage.
