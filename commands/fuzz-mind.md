---
description: Intelligent Edge Case Generation - AI-generated adversarial test cases targeting code weak points
argument-hint: <file-or-function> [--generate|--run|--report]
allowed-tools: Read, Write, Edit, Bash, Glob, Grep, Task
---

# /siftcoder:fuzz-mind - Intelligent Edge Case Generation

AI-powered fuzzing that understands your code's weak points. Generate adversarial test cases that find bugs before users do.

## Usage

```
/siftcoder:fuzz-mind <target>          - Analyze and generate cases
/siftcoder:fuzz-mind --generate        - Generate test file
/siftcoder:fuzz-mind --run             - Run generated cases
/siftcoder:fuzz-mind --report          - Show vulnerability report
```

## Philosophy

```
Random fuzzing finds random bugs.
Intelligent fuzzing finds the bugs that matter.

Traditional fuzzing: Throw random data at code
Intelligent fuzzing: Understand the code, craft targeted attacks

This tool:
  1. Analyzes your validators, parsers, and handlers
  2. Identifies assumptions (explicit and implicit)
  3. Generates cases that violate those assumptions
  4. Reports which assumptions are actually vulnerable
```

## Instructions

### Default: Analyze and Generate

```
/siftcoder:fuzz-mind src/validators/
```

```
FUZZ-MIND ANALYSIS
═══════════════════════════════════════════════════════════════

Scanning validators for weak points...

Analyzed:
  ├── email.validator.ts
  ├── amount.validator.ts
  ├── date.validator.ts
  ├── user.validator.ts
  └── payment.validator.ts


┌─ EMAIL VALIDATOR ANALYSIS ───────────────────────────────────┐
│                                                               │
│  File: src/validators/email.validator.ts                     │
│  Function: validateEmail(email: string): boolean             │
│                                                               │
│  Current regex:                                               │
│    /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/       │
│                                                               │
│  ASSUMPTIONS DETECTED:                                        │
│  ├── Assumes ASCII characters only                           │
│  ├── Assumes no consecutive dots                            │
│  ├── Assumes reasonable length                               │
│  ├── Assumes single @ symbol                                │
│  └── Assumes standard TLD format                            │
│                                                               │
│  GENERATED ADVERSARIAL CASES:                                │
│                                                               │
│  ✗ BYPASSES VALIDATION:                                      │
│    "test@localhost"                                          │
│      → Returns true, but localhost isn't a valid domain     │
│      → Risk: Users register with local addresses            │
│                                                               │
│    "a"*256 + "@test.com"                                    │
│      → No length check, may cause buffer issues             │
│      → Risk: Memory/storage attacks                          │
│                                                               │
│    "test+tag+tag+tag@test.com"                              │
│      → Valid per RFC but may break your email system        │
│      → Risk: Email delivery issues                          │
│                                                               │
│    "test@test..com"                                          │
│      → Double dot accepted by regex                          │
│      → Risk: Invalid domain stored                          │
│                                                               │
│    "CAPITAL@CASE.COM"                                        │
│      → Accepted, but is it normalized?                      │
│      → Risk: Duplicate accounts                              │
│                                                               │
│  ✓ CORRECTLY REJECTS:                                        │
│    "notanemail" ✓                                            │
│    "@missing.local" ✓                                        │
│    "spaces in@email.com" ✓                                   │
│                                                               │
└───────────────────────────────────────────────────────────────┘


┌─ AMOUNT VALIDATOR ANALYSIS ──────────────────────────────────┐
│                                                               │
│  File: src/validators/amount.validator.ts                    │
│  Function: validateAmount(amount: number): boolean           │
│                                                               │
│  Current logic:                                               │
│    return amount > 0 && amount < 1000000;                   │
│                                                               │
│  ASSUMPTIONS DETECTED:                                        │
│  ├── Assumes amount is actually a number                    │
│  ├── Assumes no decimal precision issues                    │
│  ├── Assumes 1M is reasonable max                           │
│  └── Assumes positive numbers only                          │
│                                                               │
│  GENERATED ADVERSARIAL CASES:                                │
│                                                               │
│  ✗ TYPE COERCION ATTACKS:                                    │
│    "100" (string)                                            │
│      → TypeScript allows, JavaScript coerces                │
│      → Risk: Unexpected behavior                            │
│                                                               │
│    NaN                                                        │
│      → NaN > 0 is false, but NaN < 1000000 is also false   │
│      → Actually rejected, but error message unclear         │
│                                                               │
│    Infinity                                                   │
│      → Infinity < 1000000 is false                          │
│      → Rejected, but edge case worth noting                 │
│                                                               │
│  ✗ PRECISION ATTACKS:                                        │
│    0.001                                                      │
│      → Accepted, but rounds to $0.00 in display             │
│      → Risk: Charge $0.00, get product                      │
│                                                               │
│    0.0000000001                                              │
│      → Accepted, floating point nightmare                   │
│      → Risk: Accounting discrepancies                        │
│                                                               │
│    999999.999999                                             │
│      → Exceeds max when converted to cents                  │
│      → Risk: Integer overflow in downstream                  │
│                                                               │
│  ✗ BOUNDARY ATTACKS:                                         │
│    0                                                          │
│      → Rejected (> 0 fails)                                 │
│      → But what about 0.000001?                             │
│                                                               │
│    -1                                                         │
│      → Rejected ✓                                            │
│                                                               │
│    999999.99                                                  │
│      → Accepted, but is this intentional?                   │
│      → $10K seems like a reasonable limit                   │
│                                                               │
└───────────────────────────────────────────────────────────────┘


┌─ DATE VALIDATOR ANALYSIS ────────────────────────────────────┐
│                                                               │
│  Function: validateDate(date: string): boolean               │
│                                                               │
│  GENERATED ADVERSARIAL CASES:                                │
│                                                               │
│  ✗ BYPASSES VALIDATION:                                      │
│    "2026-02-30"                                              │
│      → Invalid date (Feb has 28-29 days)                    │
│      → Regex accepts, Date parsing may fail later           │
│                                                               │
│    "2026-13-01"                                              │
│      → Month 13 doesn't exist                               │
│      → Accepted by pattern, fails later                     │
│                                                               │
│    "1970-01-01"                                              │
│      → Valid but suspiciously epoch-y                       │
│      → Often indicates uninitialized data                   │
│                                                               │
│    "9999-12-31"                                              │
│      → Far future, may break age calculations               │
│      → "User is -7973 years old"                           │
│                                                               │
│    "0001-01-01"                                              │
│      → Year 1 AD, definitely wrong                          │
│      → No reasonable minimum enforced                        │
│                                                               │
└───────────────────────────────────────────────────────────────┘


SUMMARY
═══════════════════════════════════════════════════════════════

┌─ VULNERABILITY MATRIX ───────────────────────────────────────┐
│                                                               │
│  Validator      Bypasses   Type Issues   Boundary   Total   │
│  ─────────────────────────────────────────────────────────   │
│  email            4           0            0          4     │
│  amount           0           3            3          6     │
│  date             5           0            0          5     │
│  user             2           1            2          5     │
│  payment          1           2            1          4     │
│  ─────────────────────────────────────────────────────────   │
│  TOTAL           12           6            6         24     │
│                                                               │
└───────────────────────────────────────────────────────────────┘

Risk Assessment:
  Critical: 3 (can bypass security)
  High: 8 (can cause data issues)
  Medium: 7 (can cause UX issues)
  Low: 6 (edge cases)

[Generate Test File] [Fix Critical] [View All Cases] [Export]
```

### Command: `--generate`

Generate test file with all cases:

```
/siftcoder:fuzz-mind src/validators/ --generate
```

```
GENERATING FUZZ TEST FILE
═══════════════════════════════════════════════════════════════

Creating: tests/validators.fuzz.test.ts

/**
 * Auto-generated fuzz tests
 * Generated by /siftcoder:fuzz-mind
 *
 * These tests check edge cases and adversarial inputs.
 * Failures indicate potential vulnerabilities.
 */

describe('Email Validator Fuzzing', () => {
  describe('bypass attempts', () => {
    it('should reject localhost domains', () => {
      expect(validateEmail('test@localhost')).toBe(false);
    });

    it('should reject extremely long emails', () => {
      const longEmail = 'a'.repeat(256) + '@test.com';
      expect(validateEmail(longEmail)).toBe(false);
    });

    it('should handle plus addressing consistently', () => {
      // If you accept plus addressing, ensure email system handles it
      const result = validateEmail('test+tag@test.com');
      // Either reject or ensure downstream systems work
      expect(result).toBeDefined();
    });

    it('should reject double dots in domain', () => {
      expect(validateEmail('test@test..com')).toBe(false);
    });

    it('should normalize case', () => {
      // Emails should be case-insensitive
      const upper = validateEmail('TEST@TEST.COM');
      const lower = validateEmail('test@test.com');
      expect(upper).toBe(lower);
    });
  });
});

describe('Amount Validator Fuzzing', () => {
  describe('type coercion', () => {
    it('should reject string amounts', () => {
      // @ts-expect-error - testing runtime behavior
      expect(validateAmount('100')).toBe(false);
    });

    it('should reject NaN', () => {
      expect(validateAmount(NaN)).toBe(false);
    });

    it('should reject Infinity', () => {
      expect(validateAmount(Infinity)).toBe(false);
    });
  });

  describe('precision attacks', () => {
    it('should reject amounts that round to zero', () => {
      expect(validateAmount(0.001)).toBe(false);
    });

    it('should reject microscopic amounts', () => {
      expect(validateAmount(0.0000000001)).toBe(false);
    });

    it('should handle cents overflow', () => {
      // 999999.99 * 100 = 99999999 cents - check for overflow
      expect(validateAmount(999999.99)).toBeDefined();
    });
  });

  describe('boundary testing', () => {
    it('should reject zero', () => {
      expect(validateAmount(0)).toBe(false);
    });

    it('should reject negative', () => {
      expect(validateAmount(-1)).toBe(false);
    });

    it('should have sensible maximum', () => {
      // $10,000 seems like a reasonable max for most apps
      expect(validateAmount(10000.01)).toBe(false);
    });
  });
});

// ... more test cases ...

File created: tests/validators.fuzz.test.ts
Total test cases: 47
```

### Command: `--run`

Run fuzzing and show results:

```
/siftcoder:fuzz-mind src/validators/ --run
```

```
RUNNING FUZZ TESTS
═══════════════════════════════════════════════════════════════

Running 47 fuzz test cases...

Email Validator:
  ✗ should reject localhost domains
    Expected: false, Got: true
    VULNERABILITY: Local domain bypass

  ✗ should reject extremely long emails
    Expected: false, Got: true
    VULNERABILITY: Length attack possible

  ✓ should handle plus addressing consistently
  ✗ should reject double dots in domain
    Expected: false, Got: true
    VULNERABILITY: Invalid domain accepted

  ✓ should normalize case

Amount Validator:
  ✗ should reject string amounts
    Expected: false, Got: true (after coercion)
    VULNERABILITY: Type coercion bypass

  ✓ should reject NaN
  ✓ should reject Infinity
  ✗ should reject amounts that round to zero
    Expected: false, Got: true
    VULNERABILITY: Zero-charge attack

  ...

RESULTS
═══════════════════════════════════════════════════════════════

  Total:  47
  Passed: 31
  Failed: 16

  Vulnerabilities found: 16
    Critical: 2
    High: 5
    Medium: 6
    Low: 3

[Generate Fixes] [View Failed Only] [Export Report]
```

## Configuration

```json
{
  "fuzz-mind": {
    "maxCases": 100,
    "includeTypes": ["bypass", "type", "boundary", "injection"],
    "severityThreshold": "medium",
    "autoFix": false,
    "reportFormat": "markdown"
  }
}
```

## Integration

Works well with:
  • `/siftcoder:invariant` - Test discovered invariants
  • `/siftcoder:chaos` - Runtime failure testing
  • `/siftcoder:tdd` - Incorporate fuzz cases into TDD
  • `/siftcoder:heal` - Auto-fix found vulnerabilities
