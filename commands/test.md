# /siftcoder:test - Intelligent Testing Suite

Generate, analyze, and improve tests for your codebase.

## Usage

```
/siftcoder:test [subcommand] [target]
```

## Subcommands

| Subcommand | Description |
|------------|-------------|
| `generate` | Generate tests for file/function (default) |
| `coverage` | Analyze coverage gaps and prioritize |
| `quality` | Assess test effectiveness |
| `flaky` | Detect and fix flaky tests |
| `mutate` | Mutation testing for test strength |

## Arguments
- `$ARGUMENTS` - Subcommand, target file/function, and flags

## Instructions

You are an expert test engineer. Generate high-quality tests that actually catch bugs, not just increase coverage numbers.

---

## Phase 0: Interactive Setup

**Use AskUserQuestion tool:**
```
Question: "What would you like to do?"
Header: "Action"
Options:
- "Generate Tests (Recommended)" - "Create tests for specific code"
- "Coverage Analysis" - "Find untested code paths"
- "Test Quality Audit" - "Are your tests actually good?"
- "Fix Flaky Tests" - "Identify and stabilize unreliable tests"
```

**If Generate selected, use AskUserQuestion:**
```
Question: "What testing style do you prefer?"
Header: "Style"
Options:
- "Unit Tests" - "Isolated function/component tests"
- "Integration Tests" - "Test multiple components together"
- "E2E Tests" - "Full user flow testing"
- "All Types" - "Comprehensive test suite"
```

---

## Subcommand: generate

### Phase 1: Code Analysis

```
ANALYZING CODE FOR TEST GENERATION...

Target: src/services/payment.ts
```

**Analysis Steps:**
1. Parse file AST (functions, classes, exports)
2. Identify dependencies (imports, injections)
3. Detect side effects (API calls, DB, file system)
4. Map input/output types
5. Find edge cases from code logic

```
ANALYSIS COMPLETE

Functions to test:
├── processPayment(amount, currency, userId)
│   ├── Dependencies: stripeClient, userService, logger
│   ├── Side effects: Stripe API, database write
│   ├── Edge cases: negative amount, invalid currency, user not found
│   └── Complexity: HIGH
│
├── validateCard(cardNumber)
│   ├── Dependencies: none
│   ├── Side effects: none
│   ├── Edge cases: invalid format, expired, test cards
│   └── Complexity: LOW
│
└── calculateFees(amount, region)
    ├── Dependencies: feeConfig
    ├── Side effects: none
    ├── Edge cases: zero amount, unknown region, boundary values
    └── Complexity: MEDIUM
```

### Phase 2: Test Generation

**Test Categories Generated:**

```
GENERATING TESTS...

1. Happy Path Tests
   → Normal successful operations
   → Expected inputs → expected outputs

2. Edge Case Tests
   → Boundary values (0, -1, MAX_INT)
   → Empty inputs (null, undefined, "")
   → Special characters and unicode

3. Error Handling Tests
   → Invalid inputs
   → Dependency failures
   → Network errors
   → Timeouts

4. Security Tests
   → Input validation
   → Authorization checks
   → Injection attempts

5. Performance Tests (if applicable)
   → Large inputs
   → Concurrent operations
```

**Generated Test Example:**

```typescript
// src/services/__tests__/payment.test.ts

import { processPayment, validateCard, calculateFees } from '../payment';
import { stripeClient } from '../../lib/stripe';
import { userService } from '../user';

// Mock dependencies
jest.mock('../../lib/stripe');
jest.mock('../user');

describe('Payment Service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('processPayment', () => {
    // Happy path
    it('should process valid payment successfully', async () => {
      const mockUser = { id: '123', email: 'test@example.com' };
      const mockCharge = { id: 'ch_123', status: 'succeeded' };

      (userService.findById as jest.Mock).mockResolvedValue(mockUser);
      (stripeClient.charges.create as jest.Mock).mockResolvedValue(mockCharge);

      const result = await processPayment(100, 'USD', '123');

      expect(result.success).toBe(true);
      expect(result.chargeId).toBe('ch_123');
      expect(stripeClient.charges.create).toHaveBeenCalledWith({
        amount: 10000, // cents
        currency: 'usd',
        customer: mockUser.email,
      });
    });

    // Edge cases
    it('should reject negative amounts', async () => {
      await expect(processPayment(-100, 'USD', '123'))
        .rejects.toThrow('Amount must be positive');
    });

    it('should reject zero amount', async () => {
      await expect(processPayment(0, 'USD', '123'))
        .rejects.toThrow('Amount must be positive');
    });

    it('should handle very large amounts', async () => {
      await expect(processPayment(1000000000, 'USD', '123'))
        .rejects.toThrow('Amount exceeds maximum');
    });

    // Error handling
    it('should handle user not found', async () => {
      (userService.findById as jest.Mock).mockResolvedValue(null);

      await expect(processPayment(100, 'USD', 'invalid'))
        .rejects.toThrow('User not found');
    });

    it('should handle Stripe API failure', async () => {
      (userService.findById as jest.Mock).mockResolvedValue({ id: '123' });
      (stripeClient.charges.create as jest.Mock).mockRejectedValue(
        new Error('Card declined')
      );

      const result = await processPayment(100, 'USD', '123');

      expect(result.success).toBe(false);
      expect(result.error).toBe('Card declined');
    });

    it('should handle network timeout', async () => {
      (userService.findById as jest.Mock).mockResolvedValue({ id: '123' });
      (stripeClient.charges.create as jest.Mock).mockRejectedValue(
        new Error('ETIMEDOUT')
      );

      await expect(processPayment(100, 'USD', '123'))
        .rejects.toThrow('Payment service unavailable');
    });

    // Invalid currency
    it('should reject invalid currency code', async () => {
      await expect(processPayment(100, 'INVALID', '123'))
        .rejects.toThrow('Invalid currency');
    });
  });

  describe('validateCard', () => {
    it('should validate correct Visa card', () => {
      expect(validateCard('4111111111111111')).toBe(true);
    });

    it('should validate correct Mastercard', () => {
      expect(validateCard('5500000000000004')).toBe(true);
    });

    it('should reject invalid card number', () => {
      expect(validateCard('1234567890123456')).toBe(false);
    });

    it('should reject non-numeric input', () => {
      expect(validateCard('abcd-efgh-ijkl-mnop')).toBe(false);
    });

    it('should reject empty input', () => {
      expect(validateCard('')).toBe(false);
    });

    it('should handle null/undefined', () => {
      expect(validateCard(null as any)).toBe(false);
      expect(validateCard(undefined as any)).toBe(false);
    });
  });

  describe('calculateFees', () => {
    it('should calculate US fees correctly', () => {
      expect(calculateFees(100, 'US')).toBe(2.9); // 2.9%
    });

    it('should calculate EU fees correctly', () => {
      expect(calculateFees(100, 'EU')).toBe(1.4); // 1.4%
    });

    it('should use default fees for unknown region', () => {
      expect(calculateFees(100, 'UNKNOWN')).toBe(3.5); // default
    });

    it('should return 0 for zero amount', () => {
      expect(calculateFees(0, 'US')).toBe(0);
    });

    // Precision test
    it('should handle decimal precision correctly', () => {
      expect(calculateFees(99.99, 'US')).toBeCloseTo(2.8997, 4);
    });
  });
});
```

### Phase 3: Output Summary

```
TEST GENERATION COMPLETE

Created: src/services/__tests__/payment.test.ts

Test Summary:
├── Total tests: 18
├── Happy path: 3
├── Edge cases: 8
├── Error handling: 5
├── Security: 2

Coverage Estimate:
├── Functions: 3/3 (100%)
├── Branches: 12/15 (80%)
├── Lines: ~85%

Run tests:
→ npm test src/services/__tests__/payment.test.ts

Missing coverage (manual review needed):
├── Line 67: Retry logic branch
├── Line 89: Rate limit handling
└── Line 102: Webhook verification
```

---

## Subcommand: coverage

```
/siftcoder:test coverage [path]
```

### Coverage Analysis

```
ANALYZING TEST COVERAGE...

Overall Coverage:
├── Statements: 72.4%
├── Branches: 58.3%
├── Functions: 81.2%
└── Lines: 71.8%

COVERAGE GAPS (prioritized by risk):

HIGH PRIORITY (critical paths, low coverage):

1. src/auth/oauth.ts (23% coverage)
   ├── Lines 45-89: Token refresh logic - UNTESTED
   ├── Lines 102-145: Error handling - UNTESTED
   └── Risk: Authentication bypass possible

2. src/api/payments.ts (34% coverage)
   ├── Lines 67-92: Refund processing - UNTESTED
   ├── Lines 110-130: Webhook handling - UNTESTED
   └── Risk: Financial data at risk

3. src/services/user.ts (45% coverage)
   ├── Lines 78-95: Password reset - PARTIAL
   ├── Lines 120-140: Account deletion - UNTESTED
   └── Risk: User data handling

MEDIUM PRIORITY:
├── src/utils/validation.ts (52%)
├── src/components/Form.tsx (48%)
└── src/hooks/useAuth.ts (55%)

LOW PRIORITY (utilities, low risk):
├── src/utils/format.ts (65%)
├── src/utils/date.ts (70%)
└── src/constants/index.ts (90%)

RECOMMENDATIONS:

→ /siftcoder:test generate src/auth/oauth.ts
→ /siftcoder:test generate src/api/payments.ts
→ /siftcoder:test generate src/services/user.ts

Estimated effort to reach 80% coverage:
├── Files to add tests: 8
├── Tests to write: ~45
```

---

## Subcommand: quality

```
/siftcoder:test quality [path]
```

### Test Quality Analysis

```
ANALYZING TEST QUALITY...

TEST QUALITY SCORE: 68/100

ISSUES FOUND:

1. WEAK ASSERTIONS (12 tests)

   Problem: Tests that always pass
   Example: src/__tests__/user.test.ts:45
   ```javascript
   it('should work', () => {
     const result = doSomething();
     expect(result).toBeDefined(); // Too weak!
   });
   ```
   Fix: Assert specific expected values

2. NO NEGATIVE TESTS (8 functions)

   Problem: Only testing happy paths
   Missing: Error cases, invalid inputs, edge cases
   Files: auth.test.ts, api.test.ts
   Fix: Add tests for failure scenarios

3. MOCK ABUSE (5 tests)

   Problem: Mocking too much, not testing real behavior
   Example: src/__tests__/service.test.ts:23
   ```javascript
   // Mocking the function being tested!
   jest.mock('../service');
   ```
   Fix: Only mock external dependencies

4. SNAPSHOT OVERUSE (15 tests)

   Problem: Snapshots hide what's being tested
   Risk: Easy to update without reviewing
   Files: components/__tests__/*.test.tsx
   Fix: Use explicit assertions for logic

5. MISSING EDGE CASES

   Functions without boundary testing:
   ├── calculateTotal: No test for 0, negative, MAX_SAFE_INTEGER
   ├── parseDate: No test for invalid formats
   └── validateEmail: No test for unicode, special chars

6. FLAKY INDICATORS

   Tests with timing issues:
   ├── async.test.ts:34 - Missing await
   ├── timer.test.ts:12 - Real timers used
   └── api.test.ts:89 - Network call not mocked

RECOMMENDATIONS:

1. Strengthen assertions in 12 tests
2. Add negative test cases for 8 functions
3. Review and reduce mocking in 5 tests
4. Convert 10 snapshots to explicit assertions
5. Add edge case tests for 3 functions
6. Fix 3 flaky tests

→ /siftcoder:test flaky  # Fix flaky tests
→ /siftcoder:test generate --edge-cases  # Add edge cases
```

---

## Subcommand: flaky

```
/siftcoder:test flaky [--fix]
```

### Flaky Test Detection

```
DETECTING FLAKY TESTS...

Running test suite 5 times to detect inconsistencies...

FLAKY TESTS FOUND (3):

1. src/__tests__/async.test.ts:34
   "should fetch user data"

   Failure rate: 20% (1/5 runs)

   Problem: Race condition
   ```javascript
   it('should fetch user data', () => {
     fetchUser('123');
     expect(mockApi).toHaveBeenCalled(); // May not be called yet!
   });
   ```

   Fix:
   ```javascript
   it('should fetch user data', async () => {
     await fetchUser('123');
     expect(mockApi).toHaveBeenCalled();
   });
   ```

2. src/__tests__/timer.test.ts:12
   "should debounce calls"

   Failure rate: 40% (2/5 runs)

   Problem: Real timers
   ```javascript
   it('should debounce', () => {
     debounce(fn, 100);
     setTimeout(() => {
       expect(fn).toHaveBeenCalledTimes(1);
     }, 150);
   });
   ```

   Fix:
   ```javascript
   it('should debounce', () => {
     jest.useFakeTimers();
     debounce(fn, 100);
     jest.advanceTimersByTime(150);
     expect(fn).toHaveBeenCalledTimes(1);
   });
   ```

3. src/__tests__/random.test.ts:8
   "should generate unique IDs"

   Failure rate: 5% (occasional collision)

   Problem: Testing randomness
   Fix: Mock random or test statistical properties

With --fix flag, I'll apply these fixes automatically.
```

---

## Subcommand: mutate

```
/siftcoder:test mutate [file]
```

### Mutation Testing

```
MUTATION TESTING...

Target: src/services/payment.ts
Tests: src/services/__tests__/payment.test.ts

Generating mutants...

MUTANTS CREATED: 24

Mutations applied:
├── Arithmetic: + → -, * → /
├── Comparison: > → >=, === → !==
├── Logical: && → ||, ! removed
├── Return values: true → false, null → value
├── Boundary: +1, -1 to numbers

Running tests against mutants...

MUTATION SCORE: 75% (18/24 killed)

SURVIVING MUTANTS (tests didn't catch):

1. Line 45: amount > 0 → amount >= 0
   Impact: Zero amounts would be accepted
   Fix: Add test for amount = 0

2. Line 67: retries + 1 → retries - 1
   Impact: Retry count would decrease
   Fix: Add test verifying retry increment

3. Line 89: return null → return undefined
   Impact: Different falsy value returned
   Fix: Assert exact return value

4. Line 102: && → ||
   Impact: Logic condition inverted
   Fix: Add test for partial condition

5. Line 115: fee * 1.1 → fee * 1.0
   Impact: 10% markup removed
   Fix: Add precise fee calculation test

6. Line 130: removed console.log
   Impact: None (dead code?)
   Note: Consider removing this line

RECOMMENDATIONS:

Your tests would miss 25% of bugs.
Add these tests to improve mutation score:

→ Test boundary: amount = 0
→ Test retry logic explicitly
→ Assert exact return types
→ Test each condition independently
→ Verify fee calculations precisely
```

---

## Output Files

### Test files generated in standard locations:
- `__tests__/` directories
- `.test.ts` / `.spec.ts` suffixes

### Reports:
- `.claude/siftcoder-state/test/coverage-report.json`
- `.claude/siftcoder-state/test/quality-report.md`
- `.claude/siftcoder-state/test/flaky-tests.json`
- `.claude/siftcoder-state/test/mutation-report.md`

---

## Tips & Hints

```
TEST GENERATION BEST PRACTICES

Good tests:
  → Test behavior, not implementation
  → One assertion concept per test
  → Descriptive test names (should_X_when_Y)
  → Fast and independent

Test coverage:
  → 80% is a good target
  → 100% is often wasteful
  → Focus on critical paths first
  → Branch coverage matters more than line coverage

Edge cases to always test:
  → Empty inputs (null, undefined, "", [], {})
  → Boundary values (0, -1, MAX, MIN)
  → Invalid types
  → Unicode and special characters
  → Very long strings
  → Concurrent operations

Mocking guidelines:
  → Mock external services (APIs, databases)
  → Don't mock the code under test
  → Use dependency injection for testability
  → Verify mock interactions

Flaky test prevention:
  → Use fake timers, not real delays
  → Always await async operations
  → Don't depend on test order
  → Mock all external dependencies
  → Seed random generators
```

---

## Skills Used
- **test-generator** - Intelligent test creation
- **coverage-analyzer** - Gap detection
- **mutation-tester** - Test effectiveness

## Allowed Tools
Read, Write, Grep, Glob, Bash, Task, AskUserQuestion
