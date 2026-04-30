---
description: Salesforce inbound webhook endpoints — Apex REST with HMAC verification
argument-hint: <name> [--hmac-header <header>] [--secret-name <NamedCred>]
allowed-tools: Read, Edit, Bash
---

# /siftcoder:sf-webhook

Generate an Apex REST webhook endpoint with HMAC signature verification.

Output:
- `force-app/main/default/classes/<Name>WebhookResource.cls` — `@RestResource(urlMapping='/<name>/*')`
- `force-app/main/default/classes/<Name>WebhookResource.cls-meta.xml`
- HMAC verification using `Crypto.computeHmac('hmacSHA256', ...)`
- Secret loaded from Named Credential / Custom Setting (never hardcoded)
- Test class with valid + invalid signature cases
- Idempotency check (header `X-Idempotency-Key`)
- Replay-attack protection (timestamp + window)

After generation, deploy with `/siftcoder:sf-deploy validate`.
