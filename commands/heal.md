---
description: Self-healing loop - automatically fix build/test failures and retry
argument-hint: [build|test|lint|all] [--max-retries N]
allowed-tools: Read, Write, Edit, Bash, Glob, Grep, Task
---

# /siftcoder:heal - Self-Healing Loop

When a build, test, or lint fails, automatically analyze the error, propose a fix, apply it, and retry - looping until success or max iterations.

## Usage

```
/siftcoder:heal                    - Heal last failed command
/siftcoder:heal build              - Run build and auto-fix failures
/siftcoder:heal test               - Run tests and auto-fix failures
/siftcoder:heal lint               - Run linter and auto-fix issues
/siftcoder:heal all                - Run full pipeline with healing
/siftcoder:heal --max-retries 5    - Set max retry attempts (default: 3)
```

## How It Works

```
┌─────────────────────────────────────────────────────────────┐
│                    SELF-HEALING LOOP                        │
└─────────────────────────────────────────────────────────────┘

     ┌──────────┐
     │  START   │
     └────┬─────┘
          │
          ▼
    ┌───────────┐
    │ Run Build │◄─────────────────────────┐
    │ /Test/Lint│                          │
    └─────┬─────┘                          │
          │                                │
          ▼                                │
    ┌───────────┐     ┌──────────────┐     │
    │  Success? │─Yes─►│    DONE      │     │
    └─────┬─────┘     └──────────────┘     │
          │No                              │
          ▼                                │
    ┌───────────┐                          │
    │  Parse    │                          │
    │  Errors   │                          │
    └─────┬─────┘                          │
          │                                │
          ▼                                │
    ┌───────────┐                          │
    │ Analyze & │                          │
    │ Propose   │                          │
    │   Fix     │                          │
    └─────┬─────┘                          │
          │                                │
          ▼                                │
    ┌───────────┐                          │
    │  Apply    │                          │
    │   Fix     │                          │
    └─────┬─────┘                          │
          │                                │
          ▼                                │
    ┌───────────┐     ┌──────────────┐     │
    │ Retries < │─No──►│ ESCALATE TO  │     │
    │   Max?    │     │    HUMAN     │     │
    └─────┬─────┘     └──────────────┘     │
          │Yes                             │
          └────────────────────────────────┘
```

## Instructions

### Step 1: Detect Target Command

Based on `$ARGUMENTS`:

| Argument | Command to Run |
|----------|----------------|
| `build` | `npm run build` or detected build command |
| `test` | `npm test` or detected test command |
| `lint` | `npm run lint` or detected lint command |
| `all` | Run in sequence: lint → build → test |
| (empty) | Re-run the last failed command from log |

**Auto-detect build system:**
- Check for `package.json` → npm/yarn/pnpm
- Check for `Cargo.toml` → cargo
- Check for `go.mod` → go
- Check for `Makefile` → make
- Check for `pyproject.toml` → python

### Step 2: Initial Run

Run the target command and capture output:

```
SELF-HEALING: [command]

Running initial attempt...

[command output]
```

### Step 3: Check Result

If success (exit code 0):
```
HEALING COMPLETE

Command:    [command]
Attempts:   1
Status:     Success (no fixes needed)
```

If failure, continue to Step 4.

### Step 4: Parse Errors

Analyze the error output to identify:

1. **Error type:** Syntax, type, runtime, missing dependency, etc.
2. **File location:** Which file(s) have issues
3. **Line numbers:** Exact locations if available
4. **Error messages:** The actual error text

```
ANALYZING FAILURE (Attempt 1/3)

Errors found: 3

[1] TypeError in src/auth/login.ts:42
    "Property 'user' does not exist on type 'Session'"

[2] TypeError in src/auth/login.ts:58
    "Argument of type 'string' is not assignable to parameter of type 'number'"

[3] SyntaxError in src/api/routes.ts:15
    "Unexpected token ';'"
```

### Step 5: Analyze & Propose Fixes

For each error, determine the fix:

```
PROPOSED FIXES

[1] src/auth/login.ts:42
    Problem:  Accessing 'user' on Session type which doesn't have it
    Fix:      Add 'user' property to Session interface or cast appropriately
    Approach: Check Session interface definition, add missing property

[2] src/auth/login.ts:58
    Problem:  Passing string where number expected
    Fix:      Convert string to number using parseInt()
    Approach: Wrap the argument with parseInt(..., 10)

[3] src/api/routes.ts:15
    Problem:  Extra semicolon causing syntax error
    Fix:      Remove the extra semicolon
    Approach: Simple deletion
```

### Step 6: Apply Fixes

Apply each fix within boundaries:

```
APPLYING FIXES

[1] Editing src/auth/login.ts:42...
    Added 'user: User | null' to Session interface
    ✓ Applied

[2] Editing src/auth/login.ts:58...
    Changed 'userId' to 'parseInt(userId, 10)'
    ✓ Applied

[3] Editing src/api/routes.ts:15...
    Removed extra semicolon
    ✓ Applied

Fixes applied: 3/3
```

### Step 7: Retry

Run the command again:

```
RETRY (Attempt 2/3)

Running: [command]

[output]
```

### Step 8: Loop or Complete

If success:
```
HEALING COMPLETE

Command:     [command]
Attempts:    2
Fixes Made:  3
Files Changed:
  - src/auth/login.ts (2 fixes)
  - src/api/routes.ts (1 fix)

All errors resolved automatically.
```

If still failing after max retries:
```
HEALING ESCALATED

Command:     [command]
Attempts:    3 (max reached)
Remaining:   2 errors could not be auto-fixed

Unresolved Errors:
[1] Complex type inference issue in src/auth/oauth.ts:120
    Reason: Requires understanding of external library types

[2] Circular dependency detected
    Reason: Architectural issue requiring human decision

Suggestions:
  1. Review the remaining errors manually
  2. Run /siftcoder:investigate to analyze deeper
  3. Adjust boundaries with /siftcoder:scope if needed
```

## Healing Strategies

### For Build Errors

| Error Type | Strategy |
|------------|----------|
| Missing import | Add import statement |
| Type mismatch | Fix types or add casts |
| Missing property | Add to interface/type |
| Syntax error | Fix syntax |
| Missing dependency | Suggest npm install |

### For Test Errors

| Error Type | Strategy |
|------------|----------|
| Assertion failed | Analyze expected vs actual, fix code |
| Mock not found | Create or fix mock |
| Timeout | Increase timeout or fix async |
| Setup error | Fix test setup |

### For Lint Errors

| Error Type | Strategy |
|------------|----------|
| Formatting | Auto-format with prettier/eslint --fix |
| Unused variable | Remove or use |
| Missing semicolon | Add semicolon |
| Naming convention | Rename to match |

## State & Logging

### Healing Log Entry

Each healing session is logged to `implementation-log.jsonl`:

```json
{
  "timestamp": "2026-01-12T...",
  "event": "healing_session",
  "data": {
    "command": "npm run build",
    "attempts": 2,
    "success": true,
    "fixes": [
      {
        "file": "src/auth/login.ts",
        "line": 42,
        "error": "Property 'user' does not exist",
        "fix": "Added property to interface",
        "attempt": 1
      }
    ],
    "duration": "45s"
  }
}
```

### Gotcha Learning

When a fix works, automatically add pattern to gotchas:

```json
{
  "id": "gotcha-42",
  "issue": "Session type missing user property after auth changes",
  "fix": "Always update Session interface when adding user-related fields",
  "context": "TypeScript auth code",
  "discoveredAt": "2026-01-12T..."
}
```

## Configuration

In `.claude/siftcoder-state/config.json`:

```json
{
  "healing": {
    "maxRetries": 3,
    "autoLintFix": true,
    "addToGotchas": true,
    "respectBoundaries": true,
    "escalateAfterMax": true
  }
}
```

## Integration with Other Commands

| After Healing | What Happens |
|---------------|--------------|
| Success | Continue with next subtask if in build mode |
| Escalated | Pause workflow, notify user |
| Boundaries violated | Skip that fix, log warning |

## Tips

```
EFFECTIVE SELF-HEALING

Best practices:
  - Set appropriate max-retries (3-5 is reasonable)
  - Use with /siftcoder:scope to limit blast radius
  - Review healing log after sessions

Common issues:
  - Complex type errors may need human insight
  - Architectural issues can't be auto-fixed
  - External dependencies require npm install

Advanced usage:
  /siftcoder:heal build --max-retries 5
  /siftcoder:heal all   # Full pipeline healing
```
