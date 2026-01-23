---
description: Test-driven generation - write tests first, generate code that passes them
argument-hint: <feature> [--tests <file>|--generate-tests]
allowed-tools: Read, Write, Edit, Bash, Glob, Grep, Task
---

# /siftcoder:tdd - Test-Driven Generation

Write tests first, then generate code that passes them. Uses the "Micro Agent" pattern where tests are guardrails for AI code generation.

## Usage

```
/siftcoder:tdd <feature>                       - Generate tests then code
/siftcoder:tdd <feature> --tests <file>        - Use existing tests
/siftcoder:tdd <feature> --generate-tests      - Generate tests from spec
/siftcoder:tdd --coverage                      - Show coverage gaps
/siftcoder:tdd --iterate                       - Continue iterating on failures
```

## How It Works

```
┌─────────────────────────────────────────────────────────────┐
│              TEST-DRIVEN GENERATION LOOP                    │
└─────────────────────────────────────────────────────────────┘

     ┌──────────────┐
     │ 1. SPEC      │
     │ What to build│
     └──────┬───────┘
            │
            ▼
     ┌──────────────┐
     │ 2. TESTS     │
     │ Define pass  │
     │ criteria     │
     └──────┬───────┘
            │
            ▼
     ┌──────────────┐
     │ 3. GENERATE  │◄─────────────┐
     │ Write code   │              │
     └──────┬───────┘              │
            │                      │
            ▼                      │
     ┌──────────────┐              │
     │ 4. RUN TESTS │              │
     └──────┬───────┘              │
            │                      │
       ┌────┴────┐                 │
       │         │                 │
      Pass      Fail               │
       │         │                 │
       ▼         └─────────────────┘
     ┌──────────────┐
     │ 5. DONE      │
     │ All tests    │
     │ passing      │
     └──────────────┘
```

## Instructions

### Default: Full TDD Cycle

```
/siftcoder:tdd "user authentication"
```

#### Step 1: Understand the Feature

```
TDD: user authentication

Analyzing feature requirements...

Feature: User Authentication
├── Login with email/password
├── Session management
├── Logout functionality
└── Password validation

Detected patterns:
  - API routes (src/api/routes/)
  - Service layer (src/services/)
  - TypeScript + Jest

Proceeding with test generation...
```

#### Step 2: Generate Tests First

```
GENERATING TESTS

Based on feature requirements, creating test file...

┌─ tests/auth.test.ts ─────────────────────────────────────────┐
│                                                              │
│  describe('Authentication', () => {                          │
│                                                              │
│    describe('login', () => {                                │
│      it('should login with valid credentials', async () => {│
│        const result = await login('user@test.com', 'pass'); │
│        expect(result.success).toBe(true);                   │
│        expect(result.session).toBeDefined();                │
│      });                                                     │
│                                                              │
│      it('should reject invalid email', async () => {        │
│        await expect(login('invalid', 'pass'))               │
│          .rejects.toThrow('Invalid email format');          │
│      });                                                     │
│                                                              │
│      it('should reject wrong password', async () => {       │
│        await expect(login('user@test.com', 'wrong'))        │
│          .rejects.toThrow('Invalid credentials');           │
│      });                                                     │
│                                                              │
│      it('should lock after 5 failed attempts', async () => {│
│        for (let i = 0; i < 5; i++) {                        │
│          await login('user@test.com', 'wrong')              │
│            .catch(() => {});                                │
│        }                                                     │
│        await expect(login('user@test.com', 'correct'))      │
│          .rejects.toThrow('Account locked');                │
│      });                                                     │
│    });                                                       │
│                                                              │
│    describe('logout', () => {                               │
│      it('should invalidate session', async () => {          │
│        const session = await login('user@test.com', 'pass');│
│        await logout(session.token);                         │
│        await expect(validateSession(session.token))         │
│          .resolves.toBe(false);                             │
│      });                                                     │
│    });                                                       │
│                                                              │
│  });                                                         │
│                                                              │
└──────────────────────────────────────────────────────────────┘

Tests generated: 5 tests in 2 describe blocks

Running initial tests (should all fail)...

  ✗ should login with valid credentials
  ✗ should reject invalid email
  ✗ should reject wrong password
  ✗ should lock after 5 failed attempts
  ✗ should invalidate session

0/5 passing (expected - implementation not written yet)
```

#### Step 3: Generate Implementation

```
GENERATING IMPLEMENTATION

Target: Make all 5 tests pass

Iteration 1:
  Creating src/auth/login.ts...
  Creating src/auth/session.ts...
  Creating src/auth/lockout.ts...

Running tests...

  ✓ should login with valid credentials
  ✗ should reject invalid email
  ✗ should reject wrong password
  ✗ should lock after 5 failed attempts
  ✗ should invalidate session

1/5 passing

Iteration 2:
  Adding email validation...
  Adding password verification error handling...

Running tests...

  ✓ should login with valid credentials
  ✓ should reject invalid email
  ✓ should reject wrong password
  ✗ should lock after 5 failed attempts
  ✗ should invalidate session

3/5 passing

Iteration 3:
  Implementing lockout mechanism...

Running tests...

  ✓ should login with valid credentials
  ✓ should reject invalid email
  ✓ should reject wrong password
  ✓ should lock after 5 failed attempts
  ✗ should invalidate session

4/5 passing

Iteration 4:
  Implementing session invalidation...

Running tests...

  ✓ should login with valid credentials
  ✓ should reject invalid email
  ✓ should reject wrong password
  ✓ should lock after 5 failed attempts
  ✓ should invalidate session

5/5 passing - ALL TESTS PASS!
```

#### Step 4: Report

```
TDD COMPLETE

Feature: User Authentication

┌─ RESULTS ────────────────────────────────────────────────────┐
│                                                              │
│  Tests:        5/5 passing                                  │
│  Iterations:   4                                            │
│  Duration:     8 minutes                                    │
│                                                              │
│  Files created:                                             │
│    src/auth/login.ts (45 lines)                            │
│    src/auth/session.ts (32 lines)                          │
│    src/auth/lockout.ts (28 lines)                          │
│    tests/auth.test.ts (65 lines)                           │
│                                                              │
│  Coverage: 94%                                              │
│    Statements: 45/48 covered                                │
│    Branches:   12/13 covered                                │
│    Functions:  8/8 covered                                  │
│                                                              │
└──────────────────────────────────────────────────────────────┘

Next steps:
  /siftcoder:tdd --coverage    - View coverage gaps
  /siftcoder:review            - Review implementation
```

### With `--tests <file>`

Use existing tests as the spec:

```
/siftcoder:tdd "payment processing" --tests tests/payments.test.ts
```

```
TDD FROM EXISTING TESTS

Loading tests from: tests/payments.test.ts

Found 8 tests:
  ✓ processPayment with valid card
  ✓ reject expired card
  ✓ reject insufficient funds
  ✓ handle refunds
  ✓ calculate fees correctly
  ✓ validate amount limits
  ✓ support multiple currencies
  ✓ log transactions

Running tests against current implementation...

Current status: 3/8 passing

Missing implementations:
  - Refund handling
  - Fee calculation
  - Multi-currency support
  - Transaction logging
  - Amount limit validation

Generating implementation to pass remaining tests...

[Iteration loop until all pass]
```

### With `--generate-tests`

Generate tests from a spec or description:

```
/siftcoder:tdd "rate limiting" --generate-tests
```

```
GENERATING TESTS FROM SPEC

Feature: Rate Limiting

Analyzing requirements...
  - Limit requests per user
  - Configurable limits
  - Different limits per endpoint
  - Sliding window algorithm

Generated test cases:

┌─ tests/rateLimit.test.ts ────────────────────────────────────┐
│                                                              │
│  describe('Rate Limiting', () => {                          │
│    it('should allow requests under limit')                  │
│    it('should block requests over limit')                   │
│    it('should reset after window expires')                  │
│    it('should apply per-endpoint limits')                   │
│    it('should identify users correctly')                    │
│    it('should return retry-after header')                   │
│    it('should handle concurrent requests')                  │
│  });                                                         │
│                                                              │
└──────────────────────────────────────────────────────────────┘

7 test cases generated.

Review tests before implementation? [Yes / No / Edit]
> Yes

[Show full test file for review]

Proceed with implementation? [Yes / No]
```

### With `--coverage`

Show coverage gaps and suggest tests:

```
/siftcoder:tdd --coverage
```

```
COVERAGE ANALYSIS

Overall: 78%

┌─ UNCOVERED CODE ─────────────────────────────────────────────┐
│                                                              │
│  src/auth/login.ts:                                         │
│    Line 45-48: Error handling for database timeout          │
│    Suggested test: "should handle database timeout"         │
│                                                              │
│  src/auth/session.ts:                                       │
│    Line 28-32: Session refresh logic                        │
│    Suggested test: "should refresh session before expiry"   │
│                                                              │
│  src/payments/checkout.ts:                                  │
│    Line 78-85: Webhook signature validation                 │
│    Suggested test: "should validate webhook signature"      │
│                                                              │
└──────────────────────────────────────────────────────────────┘

Generate tests for uncovered code? [Yes / No / Select]
```

### With `--iterate`

Continue iterating on a failed TDD session:

```
/siftcoder:tdd --iterate
```

```
CONTINUING TDD SESSION

Last session: payment processing
Status: 6/8 tests passing

Remaining failures:
  ✗ should support multiple currencies
  ✗ should log transactions

Analyzing failures...

[Continue iteration loop]
```

## Configuration

```json
{
  "tdd": {
    "maxIterations": 10,
    "testRunner": "jest",
    "coverageThreshold": 80,
    "generateMocks": true,
    "iterationDelay": 1000,
    "stopOnSuccess": true,
    "testPatterns": {
      "unit": "**/*.test.ts",
      "integration": "**/*.integration.ts"
    }
  }
}
```

## Test Generation Templates

### Unit Test Template

```typescript
describe('[Feature]', () => {
  beforeEach(() => {
    // Setup
  });

  afterEach(() => {
    // Cleanup
  });

  it('should [expected behavior]', async () => {
    // Arrange
    const input = {};

    // Act
    const result = await feature(input);

    // Assert
    expect(result).toEqual(expected);
  });

  it('should throw when [error condition]', async () => {
    await expect(feature(badInput))
      .rejects.toThrow('Expected error');
  });
});
```

### Integration Test Template

```typescript
describe('[Feature] Integration', () => {
  let app: Express;
  let db: Database;

  beforeAll(async () => {
    db = await setupTestDb();
    app = createApp(db);
  });

  afterAll(async () => {
    await db.close();
  });

  it('should [end-to-end behavior]', async () => {
    const response = await request(app)
      .post('/api/feature')
      .send({ data: 'test' });

    expect(response.status).toBe(200);
    expect(response.body).toMatchObject({ success: true });
  });
});
```

## Integration with Other Commands

### With `/siftcoder:heal`

When tests fail during TDD, heal can auto-fix:

```
TDD iteration 3: Tests failing

  ✗ should validate amount limits
    TypeError: amount.toFixed is not a function

Auto-healing...
  Fix: Convert string to number before calling toFixed

Re-running tests...
  ✓ should validate amount limits
```

### With `/siftcoder:smart-retry`

Learn from TDD failures:

```
TDD failure pattern detected:
  - Same test failing 3 times
  - Different approaches tried

Switching to smart-retry mode...
  Analyzing past solutions for similar tests...
```

## Tips

```
EFFECTIVE TDD

Test quality:
  - Tests should be specific and isolated
  - One assertion per test when possible
  - Use descriptive test names

Iteration strategy:
  - Start with happy path tests
  - Add edge cases progressively
  - Error cases last

When tests keep failing:
  - Check if test is correct first
  - Use /siftcoder:explain to understand failures
  - Sometimes tests need adjustment

Coverage goals:
  - 80% is good target
  - 100% often not worth the effort
  - Focus on critical paths

TDD vs traditional:
  - TDD forces clear requirements
  - Catches issues earlier
  - AI benefits from clear constraints
```
