# Workflow: Testing Workflow

**Generate tests and improve coverage**

---

## Overview

This workflow guides you through:

1. Generating comprehensive tests
2. Analyzing test coverage
3. Fixing flaky tests
4. Mutation testing

**Time Estimate:** 30 min - 2 hours

**Difficulty:** ⭐⭐ Intermediate

---

## Prerequisites

- [ ] Existing codebase
- [ ] Tests set up (Jest, Pytest, etc.)
- [ ] SiftCoder plugin loaded

---

## Step-by-Step Workflow

### Step 1: Generate Tests

```bash
/siftcoder:test generate src/services/payment.ts
```

**What happens:**
```
🧪 Generating tests for: src/services/payment.ts

ANALYSIS COMPLETE

Functions to test:
├── processPayment(amount, currency, userId)
├── validateCard(cardNumber)
└── calculateFees(amount, region)

GENERATING TESTS...

Test Categories:
  ✓ Happy Path Tests (3)
  ✓ Edge Case Tests (8)
  ✓ Error Handling Tests (5)
  ✓ Security Tests (2)

Created: src/services/__tests__/payment.test.ts
Total tests: 18

Run tests:
→ npm test src/services/__tests__/payment.test.ts
```

### Step 2: Check Coverage

```bash
/siftcoder:test coverage
```

**Output:**
```
📊 Analyzing test coverage...

Overall Coverage:
├── Statements: 72.4%
├── Branches: 58.3%
├── Functions: 81.2%
└── Lines: 71.8%

COVERAGE GAPS (prioritized):

HIGH PRIORITY:
1. src/auth/oauth.ts (23% coverage)
   └── Risk: Authentication bypass possible

2. src/api/payments.ts (34% coverage)
   └── Risk: Financial data at risk

RECOMMENDATIONS:
→ /test generate src/auth/oauth.ts
→ /test generate src/api/payments.ts
```

### Step 3: Fix Flaky Tests

```bash
/siftcoder:test flaky --fix
```

**Detects and fixes:**
- Race conditions
- Timing issues
- Missing awaits
- Real timers

### Step 4: Mutation Testing

```bash
/siftcoder:test mutate src/services/payment.ts
```

**Output:**
```
🧬 Mutation testing...

MUTATION SCORE: 75% (18/24 killed)

SURVIVING MUTANTS:
1. Line 45: amount > 0 → amount >= 0
   Fix: Add test for amount = 0

2. Line 67: retries + 1 → retries - 1
   Fix: Add test verifying retry increment
```

---

## Commands Reference

| Command | Purpose |
|---------|---------|
| `/test generate <file>` | Generate tests |
| `/test coverage` | Find coverage gaps |
| `/test quality` | Assess test quality |
| `/test flaky` | Fix flaky tests |
| `/test mutate` | Mutation testing |

---

## Example: Complete Workflow

```bash
# 1. Generate tests for key files
/siftcoder:test generate src/services/auth.ts
/siftcoder:test generate src/api/payments.ts

# 2. Check coverage
/siftcoder:test coverage

# 3. Fix any flaky tests
/siftcoder:test flaky --fix

# 4. Run all tests
npm test

# 5. Check if coverage goal met
npm test -- --coverage
```

---

## See Also

- [Command: /test](../02-command-reference/by-category/test-workflow.md)
- [Workflow: Build New Project](build-new-project.md)
