---
description: Change Impact Visualization - See how changes ripple through your entire system
argument-hint: <file> "<change description>" [--visual|--deps|--tests]
allowed-tools: Read, Glob, Grep, Task
---

# /siftcoder:ripple - Change Impact Visualization

Visualize how a proposed change ripples through your codebase. See dependencies, affected tests, and potential breaking changes before you make them.

## Usage

```
/siftcoder:ripple <file> "<change>"    - Show impact of change
/siftcoder:ripple --deps <file>        - Show dependency graph
/siftcoder:ripple --tests <file>       - Show affected tests
/siftcoder:ripple --breaking           - Detect breaking changes
```

## Philosophy

```
Every change has consequences.
Some are obvious. Many are not.

Before making a change, ask:
  • What depends on this code?
  • What tests will be affected?
  • What might break?
  • Who needs to know?

Ripple analysis answers these questions visually,
so you can change with confidence.
```

## Instructions

### Default: Analyze Change Impact

```
/siftcoder:ripple src/models/user.ts "add phone field"
```

```
RIPPLE ANALYSIS
═══════════════════════════════════════════════════════════════

Change: Add phone field to User model
File: src/models/user.ts


IMPACT VISUALIZATION
─────────────────────────────────────────────────────────────────

                     User.ts (CHANGED)
                          │
          ┌───────────────┼───────────────┐
          │               │               │
          ▼               ▼               ▼
     ┌─────────┐    ┌──────────┐    ┌──────────┐
     │UserDTO  │    │UserSchema│    │ Tests    │
     │ +phone  │    │ +phone   │    │ 12 fail  │
     └────┬────┘    └────┬─────┘    └────┬─────┘
          │              │               │
     ┌────┴────┐    ┌────┴─────┐        │
     ▼         ▼    ▼          ▼        │
 ┌──────┐ ┌──────┐ ┌─────┐ ┌───────┐   │
 │ API  │ │Admin │ │ DB  │ │Elastic│   │
 │routes│ │panel │ │migr.│ │search │   │
 │3 file│ │2 file│ │REQD │ │reindex│   │
 └──────┘ └──────┘ └─────┘ └───────┘   │
                                        │
                                   ┌────┴─────┐
                                   │ Snapshot │
                                   │ tests:47 │
                                   └──────────┘


DETAILED IMPACT
═══════════════════════════════════════════════════════════════

┌─ DIRECT CHANGES NEEDED ──────────────────────────────────────┐
│                                                               │
│  src/models/user.ts (you're changing this)                   │
│  └── Add: phone?: string                                     │
│                                                               │
│  src/dto/user.dto.ts                                         │
│  └── Add: phone field to UserDTO                            │
│                                                               │
│  src/schemas/user.schema.ts                                  │
│  └── Add: phone to validation schema                         │
│                                                               │
│  src/db/migrations/xxx_add_phone.ts                          │
│  └── CREATE: New migration file needed                       │
│                                                               │
└───────────────────────────────────────────────────────────────┘

┌─ INDIRECT CHANGES (Ripple Effects) ──────────────────────────┐
│                                                               │
│  API Routes (3 files):                                        │
│  ├── src/api/routes/users.ts                                │
│  │   └── GET /users/:id - will include phone in response    │
│  ├── src/api/routes/profile.ts                              │
│  │   └── PUT /profile - should accept phone update          │
│  └── src/api/routes/registration.ts                         │
│      └── POST /register - should accept phone (optional?)   │
│                                                               │
│  Admin Panel (2 files):                                       │
│  ├── src/admin/pages/users.tsx                              │
│  │   └── User list table - add phone column?                │
│  └── src/admin/pages/user-detail.tsx                        │
│      └── User detail form - add phone field                 │
│                                                               │
│  Search Index:                                                │
│  └── Elasticsearch index needs reindex if phone searchable   │
│                                                               │
└───────────────────────────────────────────────────────────────┘

┌─ TESTS AFFECTED ─────────────────────────────────────────────┐
│                                                               │
│  Will FAIL (snapshot mismatch):                              │
│  ├── tests/models/user.test.ts (3 tests)                    │
│  ├── tests/api/users.test.ts (5 tests)                      │
│  └── tests/api/registration.test.ts (4 tests)               │
│                                                               │
│  Will need UPDATE:                                            │
│  ├── tests/__snapshots__/user.snap (47 snapshots)           │
│  └── tests/fixtures/users.json (test data)                  │
│                                                               │
│  Should ADD:                                                  │
│  ├── Test: user with valid phone                            │
│  ├── Test: user with invalid phone format                   │
│  ├── Test: user without phone (optional field)              │
│  └── Test: phone update flow                                │
│                                                               │
└───────────────────────────────────────────────────────────────┘

┌─ BREAKING CHANGE ANALYSIS ───────────────────────────────────┐
│                                                               │
│  API Breaking Changes:                                        │
│  ├── GET /users/:id response shape changes                  │
│  │   Before: { id, email, name }                            │
│  │   After:  { id, email, name, phone }                     │
│  │   Impact: Clients may not expect phone field             │
│  │   Risk: LOW (adding field is usually safe)               │
│  │                                                           │
│  └── Database schema changes                                 │
│      Migration required before deployment                    │
│      Risk: MEDIUM (need coordinated deploy)                  │
│                                                               │
│  Not Breaking:                                                │
│  ├── phone is optional (nullable)                           │
│  ├── Existing data doesn't need phone                       │
│  └── API accepts requests without phone                     │
│                                                               │
└───────────────────────────────────────────────────────────────┘


SUMMARY
═══════════════════════════════════════════════════════════════

  Change scope:
    Direct files:     4
    Ripple files:     5
    Tests affected:   12 fail, 47 snapshots

  Risk assessment:
    Breaking changes: 1 (API response shape)
    Migration needed: Yes
    Reindex needed:   Maybe (if phone searchable)

  Estimated effort:
    Code changes:     2-3 hours
    Test updates:     1-2 hours
    Migration:        30 minutes

[Generate Migration] [Update Tests] [Create PR Description]
```

### Command: `--deps`

Show dependency graph:

```
/siftcoder:ripple --deps src/models/user.ts
```

```
DEPENDENCY GRAPH: user.ts
═══════════════════════════════════════════════════════════════

IMPORTS (What user.ts depends on):
─────────────────────────────────────────────────────────────────

  user.ts
     │
     ├── @prisma/client
     │     └── Built-in ORM types
     │
     ├── ./base-model.ts
     │     └── BaseModel class
     │
     ├── ../utils/crypto.ts
     │     └── hashPassword()
     │
     └── ../types/user.types.ts
           └── UserRole enum


EXPORTS (What depends on user.ts):
─────────────────────────────────────────────────────────────────

  user.ts ───┬──► dto/user.dto.ts
             │        └──► api/routes/users.ts
             │        └──► api/routes/profile.ts
             │
             ├──► schemas/user.schema.ts
             │        └──► api/middleware/validate.ts
             │
             ├──► services/user.service.ts
             │        └──► api/routes/users.ts
             │        └──► api/routes/auth.ts
             │        └──► jobs/user-cleanup.ts
             │
             ├──► services/auth.service.ts
             │        └──► api/routes/auth.ts
             │
             └──► admin/pages/*.tsx (4 files)


FULL DEPENDENCY TREE:
─────────────────────────────────────────────────────────────────

  Depth 1: 6 direct dependents
  Depth 2: 12 indirect dependents
  Depth 3: 8 further dependents
  Total: 26 files could be affected by changes

[Export as Mermaid] [Show Circular Deps] [Find Unused Exports]
```

### Command: `--breaking`

Detect breaking changes:

```
/siftcoder:ripple src/api/routes/users.ts --breaking
```

```
BREAKING CHANGE DETECTION
═══════════════════════════════════════════════════════════════

Analyzing recent changes to users.ts...

┌─ BREAKING CHANGES DETECTED ──────────────────────────────────┐
│                                                               │
│  [1] Response shape changed                                   │
│      Endpoint: GET /api/users/:id                           │
│      Before: { id, email, name, role }                      │
│      After:  { id, email, name, role, createdAt }           │
│      Type: ADDITIVE (usually safe)                          │
│      Risk: LOW                                               │
│                                                               │
│  [2] Required parameter added                                │
│      Endpoint: POST /api/users                              │
│      Before: { email, password }                            │
│      After:  { email, password, terms_accepted }            │
│      Type: BREAKING (clients will fail)                     │
│      Risk: HIGH                                              │
│                                                               │
│  [3] Response code changed                                   │
│      Endpoint: DELETE /api/users/:id                        │
│      Before: 200 OK                                          │
│      After:  204 No Content                                  │
│      Type: BREAKING (clients expect body)                   │
│      Risk: MEDIUM                                            │
│                                                               │
└───────────────────────────────────────────────────────────────┘

RECOMMENDATION:
  • Add terms_accepted with default value, or
  • Version the API (v2) for breaking change
  • Update API documentation
  • Notify API consumers

[Generate Migration Guide] [Add API Version] [Revert Change #2]
```

## Configuration

```json
{
  "ripple": {
    "maxDepth": 5,
    "includeTests": true,
    "includeSnapshots": true,
    "breakingChangeDetection": true,
    "outputFormat": "tree"
  }
}
```

## Integration

Works well with:
  • `/siftcoder:ghost` - Explore change in parallel universe
  • `/siftcoder:preview` - See actual diff before applying
  • `/siftcoder:blast-radius` - Understand modification scope
  • `/siftcoder:api breaking` - API-specific breaking changes
