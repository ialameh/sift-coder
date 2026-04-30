---
name: polyglot
description: Use when the codebase spans multiple languages/runtimes — frontend (TS) + backend (Python) + infra (HCL) + scripts (Bash). Finds cross-language consistency issues — naming, types, API shape, error contracts.
---

# polyglot

Cross-language consistency. Where one boundary feeds another (TS → Python via JSON, JS → Bash env, Java → SQL), enforces shared contracts.

## Method

1. **Map boundaries.** Find every language-crossing point:
   - HTTP endpoints
   - Job-queue messages
   - Shared config files
   - Generated bindings (OpenAPI, gRPC, GraphQL)
   - Env vars consumed by multiple stacks
2. **For each boundary, extract the contract:**
   - Field names + types on both sides
   - Error shape
   - Optional vs required
   - Versioning scheme
3. **Compare.** Mismatches: typos, type drift (string vs int), camelCase vs snake_case mixed, optional declared one side but treated required other side.
4. **Naming-convention sweep.** If the codebase has a clear convention per language, flag where it's broken at the boundary (e.g. TS uses camelCase but the API emits snake_case — pick one and document).
5. **Recommendations.** Single source of truth (codegen) where viable. Validation at boundary where not.

## Output shape

```
Languages detected:    TS, Python, HCL, Bash

Boundaries (N found):

#1  HTTP boundary  — POST /api/users/{id}
    Server (Python):  user_id: str, email: str, created_at: datetime
    Client (TS):      userId: string, email: string, createdAt: string
    Mismatch:         camelCase ↔ snake_case (no codegen)
    Risk:             med — works because manual mapping; breaks silently if either side renames
    Fix:              add OpenAPI codegen | OR document the mapping | OR rename one side

#2  Env-var boundary — DATABASE_URL
    Read by:    Python (sqlalchemy), Bash (deploy script)
    Format:     postgres://user:pass@host:5432/db
    Validation: neither side checks shape
    Risk:       low — usually correct
    Fix:        validate at process startup
```

## Rules

- **Find boundaries first; analyse each separately.** Don't bulk-judge "the codebase".
- **Cite both sides.** Every finding shows where it's defined on each side.
- **Recommend codegen for high-volume boundaries.** Manual mapping rots.
- **Naming convention is a per-language choice.** Don't impose TS conventions on Python.

## Anti-patterns

- Imposing one language's idioms across the boundary
- Flagging differences that are intentional (e.g. snake_case is canonical for the wire)
- Ignoring scripts/infra (Bash + HCL boundaries are real)
- Generic "use codegen" without naming the tool/format

## When NOT to use

- Single-language codebase — no boundaries to analyse
- Greenfield — set conventions upfront, not retroactively
- Active migration in progress — wait until landed

## Subagent dispatch

- `Explore` to find boundaries
- `Bridge` agent (V3 plans) — but native bridge skill covers similar territory
- `general-purpose` for the comparison work

## Value over native CC

CC will read multiple files. CC won't naturally enforce cross-language contract analysis at boundaries. The boundary-first framing IS the value.
