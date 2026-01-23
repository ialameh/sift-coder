# DEBUG Workflow Commands

**Debugging assistance for resolving issues**

---

## Overview

The DEBUG workflow contains 5 commands for debugging and resolving issues:

- [`/debug error`](#debug-error) - Analyze error messages
- [`/debug stacktrace`](#debug-stacktrace) - Parse stack traces
- [`/debug reproduce`](#debug-reproduce) - Help reproduce issues
- [`/debug bisect`](#debug-bisect) - Find breaking commits
- [`/debug trace`](#debug-trace) - Trace code execution

---

## Commands Overview

| Command | Purpose | Difficulty | Time |
|---------|---------|------------|------|
| `/debug error <msg>` | Analyze error message | ⭐ Beginner | 2-5 min |
| `/debug stacktrace` | Explain stack trace | ⭐ Beginner | 2-5 min |
| `/debug reproduce` | Help reproduce issue | ⭐⭐ Intermediate | 5-15 min |
| `/debug bisect` | Binary search git history | ⭐⭐ Intermediate | 5-10 min |
| `/debug trace` | Trace code execution | ⭐⭐ Intermediate | 5-10 min |

---

## /debug error

Analyze an error message and explain what it means and how to fix it.

### Syntax
```bash
/siftcoder:debug error "<error-message>"
```

### Examples

```bash
/siftcoder:debug error "TypeError: Cannot read property 'id' of undefined"
```

**Output:**
```
🔍 Error Analysis: TypeError: Cannot read property 'id' of undefined

EXPLANATION:
  You're trying to access the 'id' property on an object that is
  undefined or null.

COMMON CAUSES:
  1. Object not initialized
  2. API response missing data
  3. Async/await issue
  4. Missing null check

SOLUTIONS:
  → Add null check: if (obj && obj.id)
  → Check API response structure
  → Verify async function returns data
  → Use optional chaining: obj?.id

CONTEXT:
  This often happens when:
  - Database query returns null
  - API call fails silently
  - Array.find() returns undefined
```

---

## /debug stacktrace

Parse and explain a stack trace to identify the root cause.

### Syntax
```bash
/siftcoder:debug stacktrace
```

### Examples

```bash
/siftcoder:debug stacktrace
```

**Output:**
```
🔍 Stack Trace Analysis

TRACEBACK:
Error: Payment failed
    at processPayment (/src/payment.ts:45)
    at checkout (/src/checkout.ts:78)
    at onClick (/src/components/Button.tsx:23)

ROOT CAUSE:
  File: src/payment.ts:45
  Issue: Stripe API call failed
  Cause: Invalid API key

EXECUTION FLOW:
  1. User clicks button (Button.tsx:23)
  2. Triggers checkout (checkout.ts:78)
  3. Calls payment service (payment.ts:45)
  4. Stripe API rejects (invalid key)

SOLUTION:
  → Check STRIPE_SECRET_KEY environment variable
  → Verify key is valid in Stripe dashboard
  → Test API key with: stripe keys verify
```

---

## /debug reproduce

Help reproduce an issue with specific steps and conditions.

### Syntax
```bash
/siftcoder:debug reproduce "Issue description"
```

---

## /debug bisect

Find the breaking commit using binary search through git history.

### Syntax
```bash
/siftcoder:debug bisect "Tests started failing"
```

### Examples

```bash
/siftcoder:debug bisect "User authentication broken"
```

**Process:**
```
🔍 Bisecting: User authentication broken

Finding bad commit...

[123abc] Good - auth works
[456def] Bad - auth broken

Testing 5 commits...

Found bad commit: 789ghi
"Merge: Refactored auth service"

CHANGES:
- src/auth/service.ts (major refactor)
- tests/auth.test.ts (updated tests)

SOLUTION:
  → Revert commit or fix refactor
  → Check for breaking changes
```

---

## /debug trace

Trace code execution path to understand flow.

### Syntax
```bash
/siftcoder:debug trace "function name"
```

---

## Common Debugging Workflows

### Workflow 1: Quick Error Analysis

```bash
# 1. Analyze the error
/siftcoder:debug error "The error message"

# 2. Check stack trace if available
/siftcoder:debug stacktrace

# 3. Fix the issue
/siftcoder:fix "Root cause from analysis"
```

### Workflow 2: Reproduction Steps

```bash
# 1. Get help reproducing
/siftcoder:debug reproduce "Issue description"

# 2. Reproduce manually
[Follow steps provided]

# 3. Trace execution
/siftcoder:debug trace "function name"
```

### Workflow 3: Find Breaking Change

```bash
# 1. Bisect to find commit
/siftcoder:debug bisect "Feature X broken"

# 2. Review commit
git show <commit-hash>

# 3. Revert or fix
git revert <commit-hash>
```

---

## See Also

- [Command: /investigate](../maintain-workflow.md#investigate) - Safe investigation
- [Command: /fix](../maintain-workflow.md#fix) - Fix with boundaries
- [Novel AI: Timewarp](../creative-novel.md#timewarp) - State reconstruction
