---
description: Automatic Contract Mining - Discovers implicit invariants and makes them explicit
argument-hint: <file-or-class> [--all|--generate|--enforce]
allowed-tools: Read, Write, Edit, Bash, Glob, Grep, Task
---

# /siftcoder:invariant - Automatic Contract Mining

Discovers implicit invariants in your code and makes them explicit. Turn unwritten rules into documented, enforced contracts.

## Usage

```
/siftcoder:invariant <file>            - Mine invariants from file
/siftcoder:invariant --all             - Scan entire codebase
/siftcoder:invariant --generate        - Generate assertion code
/siftcoder:invariant --enforce         - Add runtime checks
/siftcoder:invariant --types           - Generate stricter types
```

## Philosophy

```
Every codebase has hidden rules.

"email is always lowercase"
"createdAt never changes after construction"
"balance is never negative"
"status can only be these 5 values"

These rules exist but aren't documented or enforced.
They live in developers' heads until someone violates them.

Invariant mining discovers these rules automatically by:
  • Analyzing code patterns
  • Examining test data
  • Tracing execution paths
  • Inferring from naming conventions

Then it makes them explicit through:
  • Documentation
  • TypeScript types
  • Runtime assertions
  • Validation schemas
```

## Instructions

### Default: Mine Invariants

```
/siftcoder:invariant src/models/user.ts
```

```
INVARIANT MINING
═══════════════════════════════════════════════════════════════

Analyzing: src/models/user.ts

Mining techniques:
  [✓] Static analysis (type flow)
  [✓] Pattern recognition (naming, usage)
  [✓] Test data analysis (example values)
  [✓] Historical analysis (never violated)

Found: 12 implicit invariants


┌─ CLASS INVARIANTS: User ─────────────────────────────────────┐
│                                                               │
│  INVARIANT #1: email is always lowercase                     │
│  ─────────────────────────────────────────                   │
│  Evidence:                                                    │
│  ├── normalizeEmail() called in constructor                  │
│  ├── All test emails are lowercase                           │
│  ├── setEmail() also normalizes                              │
│  └── 0 violations in 847 test cases                          │
│                                                               │
│  Confidence: 98%                                              │
│                                                               │
│  Suggested assertion:                                         │
│    assert(email === email.toLowerCase(),                     │
│           'email must be lowercase')                         │
│                                                               │
│  Suggested type:                                              │
│    type LowercaseEmail = string & { __lowercase: true }      │
│                                                               │
│                                                               │
│  INVARIANT #2: createdAt never changes after construction    │
│  ─────────────────────────────────────────────────────────   │
│  Evidence:                                                    │
│  ├── No setter method exists                                 │
│  ├── Field marked readonly in practice                       │
│  ├── All mutations preserve original value                   │
│  └── Tests verify immutability                               │
│                                                               │
│  Confidence: 95%                                              │
│                                                               │
│  Suggested: Make field readonly                               │
│    readonly createdAt: Date                                   │
│                                                               │
│                                                               │
│  INVARIANT #3: passwordHash is never empty when active       │
│  ─────────────────────────────────────────────────────────   │
│  Evidence:                                                    │
│  ├── Registration requires password                          │
│  ├── status='active' always has passwordHash                 │
│  ├── Only OAuth users can have empty hash (status='oauth')   │
│  └── 847 test cases, 0 violations                           │
│                                                               │
│  Confidence: 99%                                              │
│                                                               │
│  Suggested assertion:                                         │
│    assert(                                                    │
│      status !== 'active' || passwordHash.length > 0,         │
│      'active users must have password'                       │
│    )                                                          │
│                                                               │
│                                                               │
│  INVARIANT #4: role is one of 5 specific values              │
│  ─────────────────────────────────────────────               │
│  Evidence:                                                    │
│  ├── All usages: 'user' | 'admin' | 'mod' | 'guest' | 'bot' │
│  ├── No other values in tests                                │
│  ├── UI dropdowns show only these options                    │
│  └── Database has CHECK constraint                           │
│                                                               │
│  Confidence: 100%                                             │
│                                                               │
│  Suggested: Use enum instead of string                       │
│    enum UserRole { User, Admin, Mod, Guest, Bot }            │
│    role: UserRole                                             │
│                                                               │
└───────────────────────────────────────────────────────────────┘


┌─ FUNCTION INVARIANTS ────────────────────────────────────────┐
│                                                               │
│  Function: User.deactivate()                                 │
│                                                               │
│  Preconditions (must be true BEFORE call):                   │
│  ├── status !== 'deactivated' (can't deactivate twice)      │
│  └── hasPermission(caller, 'deactivate_user')               │
│                                                               │
│  Postconditions (guaranteed AFTER call):                     │
│  ├── status === 'deactivated'                               │
│  ├── sessions.length === 0 (all logged out)                 │
│  └── deactivatedAt is set                                    │
│                                                               │
│  Preserved invariants:                                        │
│  ├── email remains unchanged                                 │
│  ├── createdAt remains unchanged                             │
│  └── id remains unchanged                                    │
│                                                               │
└───────────────────────────────────────────────────────────────┘


┌─ DATA INVARIANTS ────────────────────────────────────────────┐
│                                                               │
│  Relationship: User → Orders                                 │
│  ├── User.orders.length >= 0 (never negative)               │
│  ├── All orders.userId === this.id                          │
│  └── Deleted users have archived orders (not deleted)        │
│                                                               │
│  Relationship: User → Sessions                               │
│  ├── Active user has 0-10 sessions (limit enforced)         │
│  ├── Deactivated user has 0 sessions                        │
│  └── Session.expiresAt > Session.createdAt always           │
│                                                               │
└───────────────────────────────────────────────────────────────┘

[Generate All] [Add to Types] [Add Assertions] [Document Only]
```

### Command: `--generate`

Generate assertion code:

```
/siftcoder:invariant src/models/user.ts --generate
```

```
GENERATING INVARIANT ASSERTIONS
═══════════════════════════════════════════════════════════════

Creating: src/models/user.invariants.ts

/**
 * Auto-generated invariants for User class
 * Generated by /siftcoder:invariant on 2026-01-12
 *
 * These invariants were mined from code patterns and tests.
 * Review and adjust as needed.
 */

export function assertUserInvariants(user: User): void {
  // INV-1: email is always lowercase
  if (user.email !== user.email.toLowerCase()) {
    throw new InvariantViolation(
      'email must be lowercase',
      { field: 'email', value: user.email }
    );
  }

  // INV-3: active users must have password
  if (user.status === 'active' && !user.passwordHash) {
    throw new InvariantViolation(
      'active users must have passwordHash',
      { field: 'passwordHash', status: user.status }
    );
  }

  // INV-4: role must be valid enum value
  const validRoles = ['user', 'admin', 'mod', 'guest', 'bot'];
  if (!validRoles.includes(user.role)) {
    throw new InvariantViolation(
      'role must be one of: ' + validRoles.join(', '),
      { field: 'role', value: user.role }
    );
  }
}

export function assertDeactivatePreconditions(user: User): void {
  if (user.status === 'deactivated') {
    throw new PreconditionViolation(
      'cannot deactivate already deactivated user',
      { currentStatus: user.status }
    );
  }
}

export function assertDeactivatePostconditions(user: User): void {
  if (user.status !== 'deactivated') {
    throw new PostconditionViolation(
      'user should be deactivated after deactivate()',
      { actualStatus: user.status }
    );
  }
  if (user.sessions.length !== 0) {
    throw new PostconditionViolation(
      'all sessions should be cleared after deactivate()',
      { sessionCount: user.sessions.length }
    );
  }
}

File created: src/models/user.invariants.ts

Usage:
  import { assertUserInvariants } from './user.invariants';

  // In development/testing
  assertUserInvariants(user);

  // Or use the --enforce flag to auto-inject
```

### Command: `--enforce`

Add runtime enforcement:

```
/siftcoder:invariant src/models/user.ts --enforce
```

```
ENFORCING INVARIANTS
═══════════════════════════════════════════════════════════════

Modifying: src/models/user.ts

Adding enforcement points:

  [1] Constructor exit
      + assertUserInvariants(this)

  [2] setEmail() exit
      + assert(email === email.toLowerCase())

  [3] deactivate() entry
      + assertDeactivatePreconditions(this)

  [4] deactivate() exit
      + assertDeactivatePostconditions(this)

Mode: Development only (NODE_ENV !== 'production')

Modified: src/models/user.ts
  + 4 enforcement points
  + 1 import statement

Run tests to verify no violations...
  ✓ 847 tests pass
  ✓ No invariant violations detected

Invariants are now enforced in development.
```

### Command: `--types`

Generate stricter TypeScript types:

```
/siftcoder:invariant src/models/user.ts --types
```

```
GENERATING STRICTER TYPES
═══════════════════════════════════════════════════════════════

Creating: src/models/user.types.ts

// Branded type for lowercase emails
type LowercaseEmail = string & { __brand: 'LowercaseEmail' };

function toLowercaseEmail(email: string): LowercaseEmail {
  return email.toLowerCase() as LowercaseEmail;
}

// Enum for user roles (was string)
enum UserRole {
  User = 'user',
  Admin = 'admin',
  Mod = 'mod',
  Guest = 'guest',
  Bot = 'bot'
}

// Discriminated union for user status
type ActiveUser = {
  status: 'active';
  passwordHash: string;  // Required for active
  deactivatedAt: null;
};

type DeactivatedUser = {
  status: 'deactivated';
  passwordHash: string | null;  // May be cleared
  deactivatedAt: Date;  // Required when deactivated
};

type OAuthUser = {
  status: 'oauth';
  passwordHash: null;  // OAuth users have no password
  oauthProvider: string;
};

type User = (ActiveUser | DeactivatedUser | OAuthUser) & {
  id: string;
  email: LowercaseEmail;
  role: UserRole;
  readonly createdAt: Date;
};


TypeScript will now catch invariant violations at compile time:

  // ERROR: Type 'string' is not assignable to type 'LowercaseEmail'
  const user: User = { email: 'UPPER@CASE.COM' };

  // ERROR: Property 'passwordHash' is missing for status: 'active'
  const user: User = { status: 'active' };

  // ERROR: 'invalid' is not assignable to type 'UserRole'
  const user: User = { role: 'invalid' };
```

## Configuration

```json
{
  "invariant": {
    "minConfidence": 0.8,
    "enforceInDev": true,
    "enforceInProd": false,
    "generateTypes": true,
    "analyzeSources": ["code", "tests", "database"]
  }
}
```

## Integration

Works well with:
  • `/siftcoder:tdd` - Tests from invariants
  • `/siftcoder:document` - Document invariants
  • `/siftcoder:fuzz-mind` - Test invariants with fuzzing
  • `/siftcoder:refactor` - Refactor to enforce invariants
