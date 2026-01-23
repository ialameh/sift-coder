---
description: Interactive pair programming mode - AI suggests, you approve each step
argument-hint: [--start|--trust|--autonomous]
allowed-tools: Read, Write, Edit, Bash, Glob, Grep, AskUserQuestion
---

# /siftcoder:pair - Interactive Pair Mode

Real-time collaboration mode where AI suggests and you approve at each step, like true pair programming. Build trust incrementally.

## Usage

```
/siftcoder:pair                      - Start pair session
/siftcoder:pair --start <task>       - Start with specific task
/siftcoder:pair --trust low          - Approve every action
/siftcoder:pair --trust medium       - Approve major decisions
/siftcoder:pair --trust high         - Approve only risky actions
/siftcoder:pair --autonomous         - Switch to autonomous mode
```

## Trust Levels

| Level | What's Auto-Approved | What Needs Approval |
|-------|----------------------|---------------------|
| **Low** | Nothing | Everything |
| **Medium** | File reads, small edits | New files, large changes, risky ops |
| **High** | Most operations | Deletes, security-sensitive, major refactors |
| **Autonomous** | Everything | Nothing (full auto mode) |

## How It Works

```
┌─────────────────────────────────────────────────────────────┐
│                    PAIR PROGRAMMING LOOP                    │
└─────────────────────────────────────────────────────────────┘

         YOU                           AI
          │                             │
          │   ←── Suggest next action ──│
          │                             │
          ├── Approve / Modify / Skip ──►
          │                             │
          │   ←── Execute action ───────│
          │                             │
          │   ←── Show result ──────────│
          │                             │
          │   ←── Suggest next action ──│
          │                             │
         ...                           ...
```

## Instructions

### Default: Start Pair Session

```
/siftcoder:pair
```

```
╔══════════════════════════════════════════════════════════════╗
║                   PAIR PROGRAMMING MODE                      ║
╚══════════════════════════════════════════════════════════════╝

Welcome! I'll suggest actions one at a time, and you decide.

Trust level: Medium (approve major decisions)
Change with: /siftcoder:pair --trust <low|medium|high>

What should we work on?

> Add user authentication

Got it! Let's implement user authentication together.

───────────────────────────────────────────────────────────────
STEP 1 of ~12
───────────────────────────────────────────────────────────────

I suggest we start by exploring the current auth-related code.

ACTION: Read existing auth files

Files to read:
  - src/auth/ (if exists)
  - src/api/routes/ (check for auth routes)
  - src/middleware/ (check for auth middleware)

This helps us understand what exists before adding new code.

[A] Approve  [M] Modify  [S] Skip  [?] Explain more
> A

Reading files...

Found:
  - src/middleware/auth.ts (basic JWT validation)
  - No src/auth/ directory
  - No login/logout routes

───────────────────────────────────────────────────────────────
STEP 2 of ~12
───────────────────────────────────────────────────────────────

Next, I suggest creating the auth service structure.

ACTION: Create directory and files

Will create:
  src/auth/
  ├── index.ts       (exports)
  ├── login.ts       (login logic)
  ├── session.ts     (session management)
  └── types.ts       (TypeScript types)

This follows the service pattern I see in src/services/.

[A] Approve  [M] Modify  [S] Skip  [?] Explain more
> M

What would you like to modify?
> Also add a register.ts for signup

Updated plan:
  src/auth/
  ├── index.ts
  ├── login.ts
  ├── register.ts    (added)
  ├── session.ts
  └── types.ts

[A] Approve  [S] Skip
> A

Creating files...
  ✓ src/auth/index.ts
  ✓ src/auth/login.ts
  ✓ src/auth/register.ts
  ✓ src/auth/session.ts
  ✓ src/auth/types.ts

───────────────────────────────────────────────────────────────
STEP 3 of ~12
───────────────────────────────────────────────────────────────

Now let's implement the User type and interfaces.

ACTION: Write types.ts

Proposed content:

export interface User {
  id: string;
  email: string;
  passwordHash: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Session {
  userId: string;
  token: string;
  expiresAt: Date;
}

export interface LoginResult {
  success: boolean;
  user?: User;
  session?: Session;
  error?: string;
}

[A] Approve  [M] Modify  [S] Skip  [?] Explain more
> ?

EXPLANATION

I'm defining these types because:

1. User - Core user model matching typical auth patterns
   - id: Unique identifier (UUID)
   - email: For login and communication
   - passwordHash: Stored hash, never plain password
   - timestamps: For auditing

2. Session - Represents an authenticated session
   - Links to user via userId
   - Contains JWT or session token
   - Has expiration for security

3. LoginResult - Typed response for login attempts
   - Explicit success/failure
   - Returns user and session on success
   - Returns error message on failure

This follows TypeScript best practices for explicit typing.

[A] Approve  [M] Modify  [S] Skip
> A

Writing types.ts...
  ✓ Written

───────────────────────────────────────────────────────────────
STEP 4 of ~12
───────────────────────────────────────────────────────────────

[Continues with each step...]
```

### Trust Level: Low

Every action needs approval:

```
/siftcoder:pair --trust low
```

```
TRUST: Low - Approving every action

───────────────────────────────────────────────────────────────
ACTION: Read file
───────────────────────────────────────────────────────────────

File: src/middleware/auth.ts
Reason: Check existing auth implementation

[A] Approve  [S] Skip
> A

Reading...

───────────────────────────────────────────────────────────────
ACTION: Read file
───────────────────────────────────────────────────────────────

File: package.json
Reason: Check installed auth libraries

[A] Approve  [S] Skip
> A

Reading...
```

### Trust Level: High

Only risky actions need approval:

```
/siftcoder:pair --trust high
```

```
TRUST: High - Only approving risky actions

Auto-approved:
  ✓ Read src/middleware/auth.ts
  ✓ Read package.json
  ✓ Read src/api/routes/index.ts
  ✓ Create src/auth/types.ts
  ✓ Write types.ts (small file)
  ✓ Create src/auth/login.ts
  ✓ Write login.ts (45 lines)

───────────────────────────────────────────────────────────────
APPROVAL NEEDED: Risky Operation
───────────────────────────────────────────────────────────────

ACTION: Modify existing file

File: src/middleware/auth.ts
Change: Update JWT verification to use new session service

This modifies existing production code.

Diff preview:
- import jwt from 'jsonwebtoken';
+ import { validateSession } from '@/auth/session';

- const decoded = jwt.verify(token, process.env.JWT_SECRET);
+ const session = await validateSession(token);

[A] Approve  [M] Modify  [S] Skip  [D] Full diff
> A

Modifying...
  ✓ Updated src/middleware/auth.ts
```

### Switching to Autonomous

During pair session, switch to full autonomous:

```
> /siftcoder:pair --autonomous
```

```
SWITCHING TO AUTONOMOUS MODE

You're comfortable with my approach. Continuing autonomously.

Remaining steps: 6

I'll complete:
  - Password hashing implementation
  - Login endpoint
  - Register endpoint
  - Session management
  - Logout functionality
  - Tests

Running autonomously...

[Progress updates shown]

───────────────────────────────────────────────────────────────

AUTONOMOUS RUN COMPLETE

Completed 6 steps in 4 minutes.

Files created/modified:
  src/auth/login.ts (45 lines)
  src/auth/register.ts (52 lines)
  src/auth/session.ts (38 lines)
  src/api/routes/auth.ts (65 lines)
  tests/auth.test.ts (120 lines)

All tests passing.

Return to pair mode anytime with:
  /siftcoder:pair
```

## Interactive Controls

During pair session:

| Command | Action |
|---------|--------|
| `A` or `approve` | Approve and execute |
| `M` or `modify` | Modify the suggestion |
| `S` or `skip` | Skip this step |
| `?` or `explain` | Get more explanation |
| `D` or `diff` | Show full diff |
| `P` or `plan` | Show remaining plan |
| `T` or `trust` | Change trust level |
| `Q` or `quit` | Exit pair mode |

## Session State

Pair sessions are saved for continuity:

```
PAIR SESSION SAVED

Session ID: pair-1705069200
Progress: Step 7 of 12
Trust: Medium

Resume with:
  /siftcoder:pair  (continues automatically)

Or start fresh:
  /siftcoder:pair --new
```

## Building Trust

The pair mode helps build trust progressively:

```
TRUST BUILDING

Session stats:
  Actions approved: 45
  Actions modified: 3
  Actions skipped: 1
  Autonomous completions: 12

Suggested trust upgrade:
  You've approved 92% of suggestions.
  Consider: /siftcoder:pair --trust high

Or fully autonomous:
  /siftcoder:pair --autonomous
```

## Configuration

```json
{
  "pair": {
    "defaultTrust": "medium",
    "rememberTrust": true,
    "showExplanations": true,
    "autoSaveSession": true,
    "suggestTrustUpgrade": true,
    "riskyOperations": [
      "delete",
      "modify-production",
      "external-api",
      "security-sensitive"
    ]
  }
}
```

## Integration with Other Commands

### Starting from Fix

```
/siftcoder:fix "login bug" --pair
```

Enters pair mode for the fix:

```
PAIR MODE: Fixing login bug

I'll investigate and fix with your approval at each step.

Step 1: Read error logs
[A] Approve  [S] Skip
```

### With Checkpoints

```
STEP 8: About to modify auth middleware

This is a significant change. Auto-checkpoint created.

Checkpoint: pair-before-middleware-change

If something goes wrong:
  /siftcoder:checkpoint restore pair-before-middleware-change

[A] Approve  [S] Skip
```

## Tips

```
EFFECTIVE PAIR PROGRAMMING

When to use pair mode:
  - First time with siftcoder
  - Unfamiliar codebase
  - Critical/sensitive changes
  - When you want to learn

Trust progression:
  Start low → Build confidence → Increase trust

Getting explanations:
  Press ? anytime for detailed reasoning
  Helps understand AI decision-making

Modifying suggestions:
  Don't just skip - modify instead
  AI learns from your modifications

When to go autonomous:
  After 10-20 successful approvals
  When pattern is established
  For repetitive tasks
```
