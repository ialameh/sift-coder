# TEST Workflow Commands

**Intelligent testing and coverage**

The TEST workflow contains commands for generating, analyzing, and improving tests - from creating comprehensive test suites to fixing flaky tests to mutation testing.

---

## Commands Overview

| Command | Purpose | Difficulty | Time |
|---------|---------|------------|------|
| [`/test generate`](#test-generate) | Generate tests for code | ⭐⭐ Intermediate | 2-10 min |
| [`/test coverage`](#test-coverage) | Analyze test coverage gaps | ⭐ Beginner | 2-5 min |
| [`/test quality`](#test-quality) | Assess test effectiveness | ⭐⭐ Intermediate | 5-10 min |
| [`/test flaky`](#test-flaky) | Detect and fix flaky tests | ⭐⭐ Intermediate | 5-15 min |
| [`/test mutate`](#test-mutate) | Mutation testing | ⭐⭐⭐ Advanced | 10-20 min |

---

## /test generate

Generate comprehensive tests for a file including happy path, edge cases, error handling, and security tests.

### Quick Overview
- **Purpose**: Generate comprehensive tests
- **Difficulty**: ⭐⭐ Intermediate
- **Time Estimate**: 2-10 min
- **Mode**: Write-enabled

### When to Use This Command

✅ **Use this when:**
- Code lacks tests
- You need comprehensive test coverage
- You want edge case and error tests

### Syntax

```bash
/siftcoder:test generate <file>
```

**Examples:**

```bash
/siftcoder:test generate src/services/payment.ts
```

**Output:**
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

**Generated test includes:**
- Happy path tests
- Edge cases (null, empty, boundary values)
- Error handling
- Security tests
- Performance tests (if applicable)

---

## /test coverage

Analyze test coverage and identify gaps.

### Quick Overview
- **Purpose**: Find coverage gaps
- **Difficulty**: ⭐ Beginner
- **Time Estimate**: 2-5 min
- **Mode**: Read-only

### Syntax

```bash
/siftcoder:test coverage [path]
```

**Examples:**

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

COVERAGE GAPS (prioritized by risk):

HIGH PRIORITY:
1. src/auth/oauth.ts (23% coverage)
   └── Risk: Authentication bypass possible

2. src/api/payments.ts (34% coverage)
   └── Risk: Financial data at risk

RECOMMENDATIONS:
→ /test generate src/auth/oauth.ts
→ /test generate src/api/payments.ts
```

---

## /test quality

Assess test effectiveness - are tests actually testing meaningful behavior?

### Quick Overview
- **Purpose**: Assess test quality
- **Difficulty**: ⭐⭐ Intermediate
- **Time Estimate**: 5-10 min
- **Mode**: Read-only

### Syntax

```bash
/siftcoder:test quality [path]
```

**Issues Detected:**
- Weak assertions
- Missing negative tests
- Mock abuse
- Snapshot overuse
- Missing edge cases
- Flaky indicators

---

## /test flaky

Detect and fix flaky tests that pass/fail inconsistently.

### Quick Overview
- **Purpose**: Fix flaky tests
- **Difficulty**: ⭐⭐ Intermediate
- **Time Estimate**: 5-15 min
- **Mode**: Write-enabled (with --fix)

### Syntax

```bash
/siftcoder:test flaky [--fix]
```

**Examples:**

```bash
/siftcoder:test flaky
```

**Output:**
```
🔍 Detecting flaky tests...

FLAKY TESTS FOUND (3):

1. src/__tests__/async.test.ts:34
   Problem: Race condition - missing await
   Fix: Add async/await

2. src/__tests__/timer.test.ts:12
   Problem: Real timers used
   Fix: Use jest.useFakeTimers()

3. src/__tests__/random.test.ts:8
   Problem: Testing randomness
   Fix: Mock random or test statistical properties
```

---

## /test mutate

Run mutation testing to verify test robustness.

### Quick Overview
- **Purpose**: Mutation testing
- **Difficulty**: ⭐⭐⭐ Advanced
- **Time Estimate**: 10-20 min
- **Mode**: Read-only

### Syntax

```bash
/siftcoder:test mutate [file]
```

**Examples:**

```bash
/siftcoder:test mutate src/services/payment.ts
```

**Output:**
```
🧬 Mutation testing...

MUTATION SCORE: 75% (18/24 killed)

SURVIVING MUTANTS (tests didn't catch):

1. Line 45: amount > 0 → amount >= 0
   Impact: Zero amounts would be accepted
   Fix: Add test for amount = 0

2. Line 67: retries + 1 → retries - 1
   Impact: Retry count would decrease
   Fix: Add test verifying retry increment
```

---

## Workflow Examples

### Complete Testing Workflow

```bash
# 1. Generate tests
/siftcoder:test generate src/services/payment.ts

# 2. Check coverage
/siftcoder:test coverage

# 3. Run tests
npm test

# 4. Fix any flaky tests
/siftcoder:test flaky --fix

# 5. Run mutation testing
/siftcoder:test mutate src/services/payment.ts
```

---

## See Also

- [BUILD Workflow](build-workflow.md) - Create projects with tests
- [SECURE Workflow](secure-workflow.md) - Security testing
- [QA Reviewer Agent](../../04-agents-reference/qa-reviewer.md)
