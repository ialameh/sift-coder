# AUTONOMOUS Workflow Commands

**Self-improving loops and parallel execution**

The AUTONOMOUS workflow contains commands for self-healing loops, test-driven development, and parallel agent execution.

---

## Commands Overview

| Command | Purpose | Difficulty | Time |
|---------|---------|------------|------|
| [`/siftcoder`](#siftcoder) | Main autonomous workflow command | ⭐⭐ Intermediate | Varies |
| [`/heal`](#heal) | Self-healing loop | ⭐⭐ Intermediate | 5-30 min |
| [`/smart-retry`](#smart-retry) | Learn from failures | ⭐⭐ Intermediate | Varies |
| [`/tdd`](#tdd) | Test-driven generation | ⭐⭐ Intermediate | 10-30 min |
| [`/swarm`](#swarm) | Parallel agent execution | ⭐⭐⭐ Advanced | Varies |
| [`/autonomous`](#autonomous) | Full autonomous mode | ⭐⭐⭐ Advanced | 30 min - 2 hours |

---

## /siftcoder

Main autonomous workflow command - orchestrates multi-agent workflows for planning, coding, reviewing, and fixing.

### Quick Overview
- **Purpose**: Main workflow orchestration
- **Difficulty**: ⭐⭐ Intermediate
- **Time Estimate**: Varies by task
- **Mode**: Autonomous

### Syntax

```bash
/siftcoder:subcommand [arguments]
```

Most SiftCoder commands are invoked as `/siftcoder:command`.

---

## /heal

**Self-healing loop** - Automatically run build/test/lint and fix failures. Retries up to 3 times with different approaches.

### Quick Overview
- **Purpose**: Auto-fix build/test/lint failures
- **Difficulty**: ⭐⭐ Intermediate
- **Time Estimate**: 5-30 min
- **Mode**: Autonomous

### When to Use This Command

✅ **Use this when:**
- Build is failing
- Tests are failing
- Linter has errors
- You want automatic fixes

### Syntax

```bash
/siftcoder:heal [target]
```

**Targets:**
- (no target) - Run all quality gates
- `build` - Fix build issues
- `test` - Fix failing tests
- `lint` - Fix linting issues

### Examples

```bash
# Fix all quality issues
/siftcoder:heal

# Fix failing tests
/siftcoder:heal test

# Fix build errors
/siftcoder:heal build
```

**Output:**
```
🔁 Self-Healing Loop

ATTEMPT 1/3:
Running quality gates...
  ✗ Tests: 3 failing
  ✗ Lint: 5 errors

Analyzing failures...
  Test failure: src/auth.test.ts:45 - Expected 200, got 401
  Lint error: no-unused-vars in src/services/user.ts

Attempting fixes...
  Fixed: Test assertion (line 45)
  Fixed: Removed unused variable (user.ts)

ATTEMPT 2/3:
Running quality gates...
  ✓ Tests: All passing
  ✓ Lint: No errors
  ✓ Type check: No errors

✅ HEALING COMPLETE
   All quality gates passing
   Retries: 2
   Time: 3 min
```

---

## /tdd

**Test-driven generation** - Write tests first, then generate code that passes them.

### Quick Overview
- **Purpose**: Test-driven development workflow
- **Difficulty**: ⭐⭐ Intermediate
- **Time Estimate**: 10-30 min
- **Mode**: Autonomous

### When to Use This Command

✅ **Use this when:**
- You want TDD workflow
- Tests should drive implementation
- You need testable code

### Syntax

```bash
/siftcoder:tdd <feature-description>
```

### Examples

```bash
/siftcoder:tdd "User registration with email verification"
```

**Output:**
```
🧪 TEST-DRIVEN GENERATION

PHASE 1: Generate Tests
  Created: tests/registration.test.ts
  Tests: 15
    ✓ Valid registration
    ✓ Duplicate email handling
    ✓ Email verification flow
    ✓ Password validation
    ...

PHASE 2: Generate Code
  Implementing: src/services/registration.ts
  Goal: Pass all tests

PHASE 3: Validate
  Running tests...
  ✓ All 15 tests passing

✅ TDD COMPLETE
   Code: src/services/registration.ts
   Tests: tests/registration.test.ts
   Coverage: 95%
```

---

## /swarm

**Parallel agent execution** - Run multiple agents on independent tasks simultaneously with conflict detection.

### Quick Overview
- **Purpose**: Parallel execution of independent tasks
- **Difficulty**: ⭐⭐⭐ Advanced
- **Time Estimate:** Varies (parallel is faster)
- **Mode:** Autonomous

### When to Use This Command

✅ **Use this when:**
- Multiple independent features to build
- Want parallel execution
- Tasks don't depend on each other

### Syntax

```bash
/siftcoder:swarm start <task1, task2, task3>
```

### Examples

```bash
/siftcoder:swarm start "Add login page, add signup page, add password reset"
```

**Output:**
```
🐘 SWARM MODE: 3 tasks

ANALYZING INDEPENDENCE...
  ✓ Tasks are independent (no conflicts)

SPAWNING 3 PARALLEL WORKERS:

Worker 1: "Add login page"
  Agent: coder-1
  Files: src/components/Login.tsx

Worker 2: "Add signup page"
  Agent: coder-2
  Files: src/components/Signup.tsx

Worker 3: "Add password reset"
  Agent: coder-3
  Files: src/components/PasswordReset.tsx

[All 3 working simultaneously...]

✅ SWARM COMPLETE
   Tasks completed: 3/3
   Time: 8 min (parallel)
   vs 24 min (sequential)
   Speedup: 3x
```

---

## /smart-retry

Learn from failures and try different approaches automatically.

### Quick Overview
- **Purpose**: Learn from failures
- **Difficulty**: ⭐⭐ Intermediate
- **Time Estimate:** Varies
- **Mode:** Autonomous

### Syntax

```bash
/siftcoder:smart-retry
```

---

## Workflow Examples

### Self-Healing Loop

```bash
# Run heal loop to fix all quality issues
/siftcoder:heal

# Will automatically:
# 1. Run build/test/lint
# 2. Identify failures
# 3. Attempt fixes
# 4. Re-run (up to 3 times)
# 5. Succeed or report
```

### Test-Driven Development

```bash
# Write tests first, then generate code
/siftcoder:tdd "Shopping cart with quantity management"

# Process:
# 1. Generate comprehensive tests
# 2. Generate code to pass tests
# 3. Validate all tests pass
```

---

## See Also

- [BUILD Workflow](build-workflow.md) - Feature development
- [TEST Workflow](test-workflow.md) - Testing commands
- [Workflow Control](workflow-control.md) - Control autonomous workflows
