---
description: Cross-Language Intelligence - Ensures consistency and finds issues across multiple languages
argument-hint: [analyze|sync|patterns]
allowed-tools: Read, Write, Glob, Grep, Task
---

# /siftcoder:polyglot - Cross-Language Intelligence

Understands patterns across multiple languages in your repo. Ensures consistency, finds cross-language bugs, and maintains coherent architecture.

## Usage

```
/siftcoder:polyglot analyze            - Analyze cross-language patterns
/siftcoder:polyglot sync               - Sync patterns across languages
/siftcoder:polyglot patterns           - Show pattern comparison
/siftcoder:polyglot --types            - Check type consistency
```

## Philosophy

```
Modern projects speak multiple languages.

Your TypeScript frontend talks to your Python backend.
Your Go microservice calls your Rust library.
Your SQL schema defines your TypeScript types.

Problems arise when languages disagree:
  • Date formats differ
  • Error structures mismatch
  • Naming conventions clash
  • Types don't align

Polyglot analysis ensures your babel of languages
speaks with one consistent voice.
```

## Instructions

### Default: Analyze Cross-Language Patterns

```
/siftcoder:polyglot analyze
```

```
POLYGLOT ANALYSIS
═══════════════════════════════════════════════════════════════

Detected languages:
  ├── TypeScript (frontend, 156 files)
  ├── Python (backend API, 89 files)
  ├── Go (worker service, 34 files)
  └── SQL (database, 23 files)

Analyzing cross-language consistency...


┌─ INCONSISTENCIES DETECTED ───────────────────────────────────┐
│                                                               │
│  [CRITICAL] Date/Time Handling                               │
│  ─────────────────────────────────────────────────────────   │
│                                                               │
│  TypeScript: ISO 8601 strings                                │
│    "2026-01-12T14:30:00.000Z"                                │
│                                                               │
│  Python: Unix timestamps (seconds)                           │
│    1736692200                                                 │
│                                                               │
│  Go: RFC 3339 strings                                        │
│    "2026-01-12T14:30:00Z"                                    │
│                                                               │
│  SQL: TIMESTAMP WITH TIME ZONE                               │
│    2026-01-12 14:30:00+00                                    │
│                                                               │
│  PROBLEM: These formats will cause silent bugs!              │
│  ├── TypeScript parsing Python timestamp = "Invalid Date"   │
│  ├── Python parsing TypeScript ISO = works (lucky)          │
│  ├── Go parsing Python timestamp = error                    │
│  └── Millisecond precision lost in some conversions         │
│                                                               │
│  RECOMMENDATION: Standardize to ISO 8601 everywhere         │
│                                                               │
│                                                               │
│  [HIGH] Error Response Structure                             │
│  ─────────────────────────────────────────────────────────   │
│                                                               │
│  TypeScript expects:                                          │
│    { error: { code: string, message: string } }             │
│                                                               │
│  Python returns:                                              │
│    { "error": "message string" }                            │
│                                                               │
│  Go returns:                                                  │
│    { "error_code": "CODE", "error_msg": "message" }         │
│                                                               │
│  PROBLEM: Frontend error handling is inconsistent            │
│  ├── Some errors display properly                           │
│  ├── Some show "undefined" to users                         │
│  └── Error tracking is incomplete                           │
│                                                               │
│  RECOMMENDATION: Define shared error schema                  │
│                                                               │
│                                                               │
│  [MEDIUM] Naming Conventions                                 │
│  ─────────────────────────────────────────────────────────   │
│                                                               │
│  TypeScript: camelCase (userId, firstName)                   │
│  Python: snake_case (user_id, first_name)                    │
│  Go: PascalCase (UserId, FirstName)                          │
│  SQL: snake_case (user_id, first_name)                       │
│                                                               │
│  STATUS: This is language-appropriate ✓                      │
│  BUT: Serialization boundaries need explicit mapping         │
│                                                               │
│  Currently:                                                   │
│    Python → JSON: automatic snake_case                       │
│    TypeScript ← JSON: expects camelCase                      │
│    Result: { user_id: 1 } vs { userId: 1 } mismatch        │
│                                                               │
│  RECOMMENDATION: Add serialization transformers              │
│                                                               │
│                                                               │
│  [MEDIUM] Null/None/nil Handling                             │
│  ─────────────────────────────────────────────────────────   │
│                                                               │
│  TypeScript: null | undefined                                │
│  Python: None                                                 │
│  Go: nil (or zero value)                                     │
│  SQL: NULL                                                    │
│                                                               │
│  PROBLEM: Different null semantics across boundaries         │
│  ├── TypeScript undefined becomes null in JSON               │
│  ├── Go zero values (0, "") become actual values            │
│  └── SQL NULL vs empty string inconsistent                  │
│                                                               │
│  RECOMMENDATION: Explicit nullability at boundaries          │
│                                                               │
└───────────────────────────────────────────────────────────────┘


┌─ PATTERN CONSISTENCY ────────────────────────────────────────┐
│                                                               │
│  Authentication:                                              │
│  ├── TypeScript: JWT in Authorization header ✓               │
│  ├── Python: JWT in Authorization header ✓                   │
│  └── Go: JWT in Authorization header ✓                       │
│  Status: CONSISTENT                                           │
│                                                               │
│  Pagination:                                                  │
│  ├── TypeScript: { page, limit }                            │
│  ├── Python: { offset, limit }                              │
│  └── Go: { page, per_page }                                 │
│  Status: INCONSISTENT - standardize!                         │
│                                                               │
│  Error Logging:                                               │
│  ├── TypeScript: console.error + Sentry                     │
│  ├── Python: logging.error + Sentry                         │
│  └── Go: log.Error (no Sentry!)                             │
│  Status: INCONSISTENT - Go missing error tracking            │
│                                                               │
└───────────────────────────────────────────────────────────────┘


SUMMARY
═══════════════════════════════════════════════════════════════

  Languages: 4
  Inconsistencies: 8
    Critical: 1 (date formats)
    High: 2 (errors, pagination)
    Medium: 5

  Potential bugs prevented by fixing: ~15 issues
  Cross-language debugging time saved: ~20 hours

[Fix Critical] [Generate Shared Types] [Create Style Guide]
```

### Command: `sync`

Synchronize patterns across languages:

```
/siftcoder:polyglot sync
```

```
POLYGLOT SYNC
═══════════════════════════════════════════════════════════════

Synchronizing patterns across languages...


[1/4] Synchronizing Date Formats
─────────────────────────────────────────────────────────────────

  Standard: ISO 8601 with milliseconds

  TypeScript (no change needed):
    ✓ Already using ISO 8601

  Python (updating):
    - datetime.timestamp()
    + datetime.isoformat() + 'Z'

    Files modified:
    ├── api/utils/dates.py
    ├── api/serializers.py
    └── api/models/base.py

  Go (updating):
    - time.Unix()
    + time.Format(time.RFC3339)

    Files modified:
    ├── pkg/util/time.go
    └── pkg/api/response.go


[2/4] Synchronizing Error Response
─────────────────────────────────────────────────────────────────

  Standard schema:
    {
      "error": {
        "code": "ERROR_CODE",
        "message": "Human readable message",
        "details": {}  // optional
      }
    }

  Creating shared definition:
    ✓ shared/schemas/error.json (JSON Schema)
    ✓ frontend/src/types/error.ts (TypeScript)
    ✓ backend/app/schemas/error.py (Pydantic)
    ✓ worker/pkg/api/error.go (Go struct)


[3/4] Synchronizing Pagination
─────────────────────────────────────────────────────────────────

  Standard: { page: number, per_page: number }

  TypeScript (updating):
    - { page, limit }
    + { page, per_page }

  Python (updating):
    - { offset, limit }
    + { page, per_page }

  Go (no change needed):
    ✓ Already using { page, per_page }


[4/4] Creating Cross-Language Documentation
─────────────────────────────────────────────────────────────────

  Generated:
    ✓ docs/cross-language-guide.md
    ✓ docs/api-standards.md
    ✓ shared/schemas/ (JSON schemas for all shared types)


SYNC COMPLETE
═══════════════════════════════════════════════════════════════

  Files modified: 14
  Patterns synchronized: 4
  Tests updated: 8

  Next steps:
    1. Run tests in each language
    2. Review generated documentation
    3. Deploy services in order: backend → worker → frontend

[Run All Tests] [Review Changes] [Rollback]
```

### Command: `--types`

Check type consistency:

```
/siftcoder:polyglot --types
```

```
TYPE CONSISTENCY CHECK
═══════════════════════════════════════════════════════════════

Checking that types match across language boundaries...


┌─ User Type ──────────────────────────────────────────────────┐
│                                                               │
│  TypeScript:                                                  │
│    interface User {                                           │
│      id: string;                                             │
│      email: string;                                          │
│      name: string;                                           │
│      createdAt: string;                                      │
│    }                                                          │
│                                                               │
│  Python:                                                      │
│    class User(BaseModel):                                    │
│      id: str                                                 │
│      email: str                                              │
│      name: str                                               │
│      created_at: datetime  # ← Type mismatch!               │
│                                                               │
│  SQL:                                                         │
│    CREATE TABLE users (                                      │
│      id UUID PRIMARY KEY,  # ← Type mismatch!               │
│      email VARCHAR(255),                                     │
│      name VARCHAR(100),                                      │
│      created_at TIMESTAMP                                    │
│    )                                                          │
│                                                               │
│  ISSUES:                                                      │
│  ├── id: TypeScript=string, SQL=UUID (compatible)           │
│  ├── created_at: TypeScript=string, Python=datetime         │
│  └── name: SQL has VARCHAR(100) limit, not enforced in code │
│                                                               │
└───────────────────────────────────────────────────────────────┘


┌─ Order Type ─────────────────────────────────────────────────┐
│                                                               │
│  TypeScript: amount: number                                  │
│  Python: amount: Decimal                                     │
│  SQL: amount NUMERIC(10,2)                                   │
│                                                               │
│  ISSUE: Floating point vs Decimal precision                  │
│  JavaScript number can lose precision for large amounts!     │
│                                                               │
│  RECOMMENDATION: Use string for money in TypeScript          │
│                                                               │
└───────────────────────────────────────────────────────────────┘

[Generate Type Definitions] [Show All Types] [Fix Issues]
```

## Configuration

```json
{
  "polyglot": {
    "languages": ["typescript", "python", "go", "sql"],
    "standardDateFormat": "iso8601",
    "standardPagination": "page-based",
    "typeMapping": {
      "uuid": ["string", "str", "string", "UUID"],
      "datetime": ["string", "datetime", "time.Time", "TIMESTAMP"]
    }
  }
}
```

## Integration

Works well with:
  • `/siftcoder:api validate` - Check API consistency
  • `/siftcoder:document technical` - Generate cross-lang docs
  • `/siftcoder:invariant` - Enforce cross-language invariants
  • `/siftcoder:test` - Generate cross-boundary tests
