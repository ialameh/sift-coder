# /siftcoder:blast-radius - Verify Change Containment

Run comprehensive tests to verify that changes are contained within defined boundaries and haven't affected protected areas.

## Usage

```
/siftcoder:blast-radius [--full]
```

## Arguments
- `$ARGUMENTS` - Optional `--full` flag for comprehensive test suite

## Instructions

You are verifying that changes made during a fix or optimize workflow haven't affected protected areas of the codebase.

### Prerequisites Check:
1. Verify active task exists in `current-task.json`
2. Verify boundaries are defined
3. If no active task:
   ```
   ❌ No active task with boundaries.

   Blast radius check requires an active /siftcoder:fix or /siftcoder:optimize workflow.

   Current state:
   └── No boundaries defined

   Use /siftcoder:fix <issue> or /siftcoder:optimize <area> first.
   ```

### Phase 1: Boundary Summary
```
🔍 BLAST RADIUS CHECK

Current Boundaries:
┌─────────────────────────────────────────────────┐
│ MODIFIABLE (3 files):                           │
│ ├── src/services/payment.ts       ← Changed     │
│ ├── src/utils/currency.ts         ← Changed     │
│ └── src/tests/payment.test.ts     ← Changed     │
│                                                 │
│ PROTECTED:                                      │
│ └── Everything else              🔒             │
└─────────────────────────────────────────────────┘

Running containment verification...
```

### Phase 2: Modified Files Tests
Run tests specifically for modified files:
```
📋 MODIFIED AREA TESTS

src/services/payment.ts:
├── payment.test.ts .............. ✓ 23/23

src/utils/currency.ts:
├── currency.test.ts ............. ✓ 8/8

New Tests Added:
├── payment-overflow.test.ts ..... ✓ 3/3

MODIFIED AREA: ✅ ALL PASSING (34/34)
```

### Phase 3: Protected Area Tests
Run tests for areas that should NOT have been affected:
```
🔒 PROTECTED AREA TESTS

These tests verify nothing outside boundaries was affected:

Core Services:
├── checkout.test.ts ............. ✓ 31/31
├── orders.test.ts ............... ✓ 42/42
├── inventory.test.ts ............ ✓ 18/18
└── shipping.test.ts ............. ✓ 25/25

Authentication:
├── auth.test.ts ................. ✓ 27/27
└── session.test.ts .............. ✓ 15/15

API Layer:
├── api/routes.test.ts ........... ✓ 38/38
└── api/middleware.test.ts ....... ✓ 12/12

PROTECTED AREA: ✅ ALL PASSING (208/208)
```

### Phase 4: Integration Tests
If available, run integration tests:
```
🔗 INTEGRATION TESTS

End-to-end:
├── checkout-flow.e2e.ts ......... ✓ 5/5
├── payment-flow.e2e.ts .......... ✓ 8/8
└── order-lifecycle.e2e.ts ....... ✓ 12/12

INTEGRATION: ✅ ALL PASSING (25/25)
```

### Phase 5: Final Report

**If all pass:**
```
✅ BLAST RADIUS: CONTAINED

Summary:
├── Modified Area Tests:    34/34 passing
├── Protected Area Tests:  208/208 passing
├── Integration Tests:      25/25 passing
└── Total:                 267/267 passing

Containment Verified:
├── No protected files modified (boundary enforcer active)
├── All protected area tests passing
└── No regressions detected

Safe to proceed with merge.
```

**If failures detected:**
```
⚠️ BLAST RADIUS: BREACH DETECTED

Summary:
├── Modified Area Tests:    34/34 passing
├── Protected Area Tests:  206/208 FAILING ❌
├── Integration Tests:      23/25 FAILING ❌
└── Total:                 263/267 passing

Failures in Protected Areas:
├── checkout.test.ts:45 - "should calculate tax correctly"
│   Expected: 10.50, Received: 10.00
│   Likely Cause: Currency rounding change affected checkout
│
└── order-lifecycle.e2e.ts:78 - "complete order flow"
    Timeout: Payment step failed
    Likely Cause: Payment service interface changed

Options:
[Expand Scope] - Add affected files to modifiable list
[Rollback]     - Revert to checkpoint
[Investigate]  - Analyze failures in detail
```

### Full Mode (--full)

With `--full` flag, also runs:
- Type checking across entire codebase
- Lint check on all files
- Build verification
- Coverage comparison

```
🔬 FULL VERIFICATION (--full)

Type Check:
└── tsc --noEmit ................. ✓ No errors

Lint Check:
└── eslint . ..................... ✓ No errors

Build:
└── npm run build ................ ✓ Success

Coverage Comparison:
├── Before: 78.5%
├── After:  79.2%
└── Delta:  +0.7% ✅

Full Verification: ✅ PASSED
```

## Test Discovery

If test files are not explicitly mapped, discover by:
1. Look for `*.test.ts`, `*.spec.ts` patterns
2. Check `jest.config.js` or `vitest.config.ts` for patterns
3. Look for `__tests__` directories
4. Parse `package.json` test scripts

## Allowed Tools
Read, Bash, Glob, Grep
