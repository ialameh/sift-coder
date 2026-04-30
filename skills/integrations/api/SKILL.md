---
name: api
description: Use for API design — REST/GraphQL/gRPC. Versioning, error shape, auth, idempotency, pagination, rate limits. Output is a spec + scaffold.
---

# api

API design discipline. Forces decisions on the load-bearing axes before any code lands.

## Decision axes (every API needs answers)

1. **Style** — REST | GraphQL | gRPC | tRPC | RPC-over-HTTP. Pick + justify.
2. **Versioning** — URL path (`/v1`) | header (`Accept`) | media type. Pick + plan deprecation policy.
3. **Auth** — bearer token | OAuth2 | mTLS | API key | session. Pick + name the rotation/expiry policy.
4. **Error shape** — RFC 7807 (problem+json) | custom envelope | gRPC status. Pick + document.
5. **Idempotency** — key strategy for unsafe methods (`Idempotency-Key` header default).
6. **Pagination** — cursor | offset | keyset. Pick + max page size.
7. **Rate limit** — per-token | per-IP | per-account. Headers (`X-RateLimit-*` or RFC draft).
8. **Spec format** — OpenAPI 3.1 | GraphQL SDL | Protobuf. Source of truth.

## Method

1. **Audit existing.** If there's already an API, extract conventions.
2. **Per axis, decide + document.** Single source of truth.
3. **Spec first.** Write the spec (OpenAPI/SDL/proto) before code.
4. **Codegen.** Use spec to generate types/clients/server stubs.
5. **Implement** stubs with the actual logic.
6. **Test.** Contract tests against the spec.
7. **Doc.** API ref auto-generated from spec; supplemented with examples + auth flows.

## Output shape

```
# API: <name>

## Decisions
| Axis | Choice | Rationale |
|---|---|---|
| Style | REST | match existing system X |
| Versioning | URL path /v1 | simple; supports parallel /v2 |
| Auth | OAuth2 + scopes | identity provider Y already in stack |
| Errors | RFC 7807 | tooling support |
| Idempotency | Idempotency-Key header on POST/PUT | required for retries |
| Pagination | cursor (after_id) | works for non-sortable IDs |
| Rate limit | per-token; X-RateLimit-* headers | aligned w/ X |
| Spec | OpenAPI 3.1 | tooling, codegen |

## Spec
<path to openapi.yaml>

## Generated
- Server stubs:  <path>
- Client SDK:    <path>

## Test plan
- Contract tests:  <path>
- Auth flow tests: <path>
- Rate-limit tests: <path>

## Memory
Captured: <id>
```

## Rules

- **Spec first.** Code from spec, not the other way.
- **Decisions documented.** Future you forgets why; the table prevents re-deciding.
- **Versioning policy stated upfront.** "We'll figure out v2 later" = pain.
- **Auth + rate-limit + idempotency are not optional.**

## Anti-patterns

- Code first, retro-fit a spec
- Missing error shape until prod
- "Versioning is fine" without policy
- Idempotency added after first incident

## When NOT to use

- Internal-only RPC between two trusted services in same repo (lighter)
- Webhook receivers — `/siftcoder:sf-webhook` (specific shape)

## Subagent dispatch

- `Plan` for the decision pass
- `general-purpose` for spec drafting + codegen invocation
- Memory MCP for prior API decisions in this org

## Value over native CC

CC will write APIs. CC won't naturally force decisions on the 8 load-bearing axes upfront. The forced-decisions IS the value.
