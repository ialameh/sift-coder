---
description: Developer Pain Point Detection - Finds frustrating code and measures cognitive impact
argument-hint: [path] [--report|--fix|--baseline]
allowed-tools: Read, Write, Edit, Bash, Glob, Grep, Task
---

# /siftcoder:empathy - Developer Pain Point Detection

Detects code that causes developer frustration, measures cognitive load, and identifies emotional friction in your codebase.

## Usage

```
/siftcoder:empathy [path]              - Analyze for pain points
/siftcoder:empathy --report            - Generate full empathy report
/siftcoder:empathy --fix               - Fix most frustrating issues
/siftcoder:empathy --baseline          - Set baseline for tracking
/siftcoder:empathy --compare           - Compare to baseline
```

## Philosophy

```
Code isn't just correct or incorrect.
Code is also kind or cruel to its maintainers.

Cruel code:
  • Makes you say "WTF" out loud
  • Takes 10 minutes to understand 10 lines
  • Fills you with dread when you need to change it
  • Makes onboarding painful

Kind code:
  • Reads like well-written prose
  • Reveals its intent immediately
  • Welcomes changes
  • Makes new developers productive fast

This tool detects cruelty and suggests kindness.
```

## How It Works

```
┌─────────────────────────────────────────────────────────────┐
│                  EMPATHY ANALYSIS ENGINE                    │
└─────────────────────────────────────────────────────────────┘

            Your Codebase
                 │
                 ▼
    ┌────────────────────────┐
    │   FRUSTRATION SCAN     │
    │  ├── Naming clarity    │
    │  ├── Complexity score  │
    │  ├── Documentation     │
    │  ├── Test coverage     │
    │  └── Change history    │
    └───────────┬────────────┘
                │
                ▼
    ┌────────────────────────┐
    │   COGNITIVE ANALYSIS   │
    │  ├── Mental load       │
    │  ├── Context switching │
    │  ├── Tribal knowledge  │
    │  └── Time-to-understand│
    └───────────┬────────────┘
                │
                ▼
    ┌────────────────────────┐
    │   EMPATHY SCORE        │
    │  0-100 (higher=worse)  │
    └────────────────────────┘
```

## Instructions

### Default: Analyze Codebase

**Step 1: Scan for Pain Points**

Use Glob and Grep to analyze the codebase, then calculate scores:

```
EMPATHY ANALYSIS
═══════════════════════════════════════════════════════════════

Scanning for developer pain points...

Analyzed: 247 files
Time: 12 seconds

Overall Empathy Score: 67/100 (Needs Attention)

Interpretation:
  0-30:   Kind codebase - developers are happy
  31-50:  Some friction - minor improvements help
  51-70:  Frustrating areas - address soon
  71-100: Painful - significant issues affecting productivity
```

**Step 2: Identify High-Frustration Areas**

```
┌─ HIGH FRUSTRATION AREAS ─────────────────────────────────────┐
│                                                               │
│  1. src/utils/helpers.ts                                     │
│     Frustration Score: 92/100                                │
│     ├── 47 functions with no clear organization              │
│     ├── Function names: doThing, processIt, handleStuff      │
│     ├── No JSDoc or comments                                 │
│     ├── 12 functions are duplicates with slight variations   │
│     └── Predicted reaction: "WTF does this do?"             │
│                                                               │
│     Cognitive Impact:                                        │
│       Time to understand: ~45 minutes for new developer      │
│       Mental load: EXTREME (must hold 47 concepts)           │
│       Frustration triggers: 23 identified                    │
│                                                               │
│  2. src/api/routes/index.ts                                  │
│     Frustration Score: 78/100                                │
│     ├── 2,847 lines in single file                          │
│     ├── Mixed concerns: auth, validation, business logic     │
│     ├── 15 levels of callback nesting in places             │
│     └── Predicted reaction: "Where do I even start?"        │
│                                                               │
│     Cognitive Impact:                                        │
│       Time to understand: ~2 hours                           │
│       Mental load: HIGH (too many concerns)                  │
│       Frustration triggers: 18 identified                    │
│                                                               │
│  3. src/config/constants.ts                                  │
│     Frustration Score: 65/100                                │
│     ├── Magic numbers without explanation                    │
│     ├── TIMEOUT = 30000 (ms? seconds? what timeout?)        │
│     ├── MAX_RETRIES = 3 (why 3? business rule?)             │
│     └── Predicted reaction: "Afraid to change anything"     │
│                                                               │
└───────────────────────────────────────────────────────────────┘
```

**Step 3: Identify Frustration Patterns**

```
┌─ FRUSTRATION PATTERNS ───────────────────────────────────────┐
│                                                               │
│  NAMING ISSUES (37 instances)                                │
│  ├── Generic names: data, info, result, temp, item          │
│  ├── Abbreviations: usr, msg, btn, cfg                      │
│  ├── Misleading names: getUser actually mutates state       │
│  └── Inconsistent: getUserById, fetchUserData, loadUser     │
│                                                               │
│  COMPLEXITY BOMBS (12 instances)                             │
│  ├── Functions >100 lines: 8                                │
│  ├── Cyclomatic complexity >15: 4                           │
│  ├── Parameter count >5: 23 functions                       │
│  └── Nesting depth >4: 15 locations                         │
│                                                               │
│  TRIBAL KNOWLEDGE (28 instances)                             │
│  ├── Unexplained business rules in code                     │
│  ├── "Don't touch this" comments without explanation        │
│  ├── Workarounds for unknown issues                         │
│  └── Author-specific patterns no one else understands       │
│                                                               │
│  DOCUMENTATION GAPS (156 instances)                          │
│  ├── Public APIs with no docs: 45                           │
│  ├── Complex functions with no explanation: 67              │
│  ├── Outdated comments that lie: 12                         │
│  └── TODOs older than 6 months: 32                          │
│                                                               │
│  BROKEN PROMISES (45 instances)                              │
│  ├── "TODO: fix this" from 2 years ago                      │
│  ├── "HACK: temporary workaround" still in prod             │
│  ├── Disabled tests with "will fix later"                   │
│  └── Commented-out code "just in case"                      │
│                                                               │
└───────────────────────────────────────────────────────────────┘
```

**Step 4: Calculate Team Impact**

```
┌─ TEAM IMPACT ANALYSIS ───────────────────────────────────────┐
│                                                               │
│  Time Lost to Frustration (estimated weekly):                │
│                                                               │
│    Understanding unclear code:     3.2 hours/developer       │
│    Finding things in large files:  1.4 hours/developer       │
│    Debugging naming confusion:     0.8 hours/developer       │
│    Deciphering tribal knowledge:   1.1 hours/developer       │
│    ─────────────────────────────────────────────────         │
│    TOTAL:                          6.5 hours/developer/week  │
│                                                               │
│  For a team of 5: 32.5 hours/week lost                       │
│  Annual cost: ~$170,000 (at $100/hour loaded cost)           │
│                                                               │
│  Onboarding Impact:                                          │
│    Time for new dev to be productive: ~4 weeks               │
│    Industry average: 2 weeks                                 │
│    Frustration-related attrition risk: ELEVATED              │
│                                                               │
│  Bus Factor Risks:                                           │
│    3 files only understood by 1 person                       │
│    12 files have no recent contributors                      │
│                                                               │
└───────────────────────────────────────────────────────────────┘
```

**Step 5: Recommendations**

```
┌─ RECOMMENDATIONS (by ROI) ───────────────────────────────────┐
│                                                               │
│  1. SPLIT src/api/routes/index.ts                           │
│     Effort: 4 hours                                          │
│     Savings: 1.4 hours/week/developer                        │
│     ROI: Pays back in 3 weeks                                │
│     Action: /siftcoder:empathy --fix routes                  │
│                                                               │
│  2. RENAME functions in helpers.ts                           │
│     Effort: 2 hours                                          │
│     Savings: 0.8 hours/week/developer                        │
│     ROI: Pays back in 2.5 weeks                              │
│     Action: /siftcoder:empathy --fix naming                  │
│                                                               │
│  3. DOCUMENT magic numbers in constants.ts                   │
│     Effort: 1 hour                                           │
│     Savings: 0.3 hours/week/developer                        │
│     ROI: Pays back in 3 weeks                                │
│     Action: /siftcoder:empathy --fix constants               │
│                                                               │
│  4. ADD JSDoc to public APIs                                 │
│     Effort: 6 hours                                          │
│     Savings: 1.2 hours/week/developer                        │
│     ROI: Pays back in 5 weeks                                │
│     Action: /siftcoder:document code --public-api            │
│                                                               │
└───────────────────────────────────────────────────────────────┘

[Fix All] [Fix Top 3] [Generate Full Report] [Set Baseline]
```

### Command: `--fix`

Automatically fix frustration sources:

```
/siftcoder:empathy --fix
```

```
EMPATHY FIX MODE

Fixing top frustration sources...

[1/4] Splitting src/api/routes/index.ts
      ├── Created src/api/routes/auth.ts (auth routes)
      ├── Created src/api/routes/users.ts (user routes)
      ├── Created src/api/routes/payments.ts (payment routes)
      ├── Updated src/api/routes/index.ts (re-exports)
      └── ✓ 2,847 lines → 4 files averaging 300 lines

[2/4] Renaming unclear functions in helpers.ts
      ├── doThing → formatCurrencyForDisplay
      ├── processIt → validateAndSanitizeInput
      ├── handleStuff → processQueuedNotifications
      └── ✓ 23 functions renamed

[3/4] Documenting magic numbers
      ├── TIMEOUT = 30000 → Added: "// 30 seconds - Stripe API timeout"
      ├── MAX_RETRIES = 3 → Added: "// 3 retries per PCI compliance req"
      └── ✓ 15 constants documented

[4/4] Removing dead code
      ├── Deleted 12 unused functions
      ├── Removed 34 commented-out code blocks
      └── ✓ 847 lines removed

RESULTS:
  Before: Frustration Score 67/100
  After:  Frustration Score 34/100
  Improvement: 49%

  Time savings: ~4.2 hours/week/developer
```

### Command: `--report`

Generate a detailed empathy report:

```
/siftcoder:empathy --report
```

Creates `.claude/siftcoder-state/reports/empathy-report.md`:

```markdown
# Codebase Empathy Report

Generated: 2026-01-12
Repository: my-app
Analysis: 247 files, 45,000 lines

## Executive Summary

Your codebase has a Frustration Score of 67/100, indicating
significant areas causing developer pain...

[Full detailed report with charts and recommendations]
```

### Command: `--baseline`

Set a baseline for tracking improvements:

```
/siftcoder:empathy --baseline
```

```
BASELINE SET

Date: 2026-01-12
Frustration Score: 67/100
Files analyzed: 247
Patterns captured: 278

Track improvements with:
  /siftcoder:empathy --compare
```

### Frustration Detectors

**Naming Analysis:**
```javascript
// BAD (triggers frustration)
function doThing(data, flag, opts) { ... }
const x = getData();
let temp = process(item);

// GOOD (reduces frustration)
function formatPriceForDisplay(amount, currency, options) { ... }
const activeSubscriptions = fetchActiveSubscriptions();
let sanitizedUserInput = sanitizeInput(rawInput);
```

**Complexity Detection:**
```javascript
// BAD: Deeply nested callback hell
fetchUser(id, (user) => {
  getOrders(user, (orders) => {
    calculateTotal(orders, (total) => {
      applyDiscount(total, (final) => {
        // Developer: "Kill me now"
      });
    });
  });
});

// GOOD: Flat and readable
const user = await fetchUser(id);
const orders = await getOrders(user);
const total = calculateTotal(orders);
const final = applyDiscount(total);
```

**Tribal Knowledge Detection:**
```javascript
// BAD: Unexplained magic
if (amount > 999999) {
  return processLargePayment(amount);  // Why 999999?
}

// GOOD: Explained context
// Stripe has a known bug with amounts over $9,999.99
// See: https://github.com/stripe/stripe-node/issues/1234
// Workaround: Route large payments through special handler
const STRIPE_LARGE_PAYMENT_THRESHOLD = 999999;
if (amount > STRIPE_LARGE_PAYMENT_THRESHOLD) {
  return processLargePayment(amount);
}
```

## Configuration

```json
{
  "empathy": {
    "thresholds": {
      "maxFileLines": 500,
      "maxFunctionLines": 50,
      "maxParameters": 4,
      "maxNestingDepth": 3,
      "maxCyclomaticComplexity": 10
    },
    "ignore": [
      "*.generated.ts",
      "node_modules/**",
      "dist/**"
    ],
    "customPatterns": {
      "frustrating": ["HACK", "FIXME", "XXX"],
      "acceptable": ["TODO"]
    }
  }
}
```

## Integration

Works well with:
  • `/siftcoder:refactor` - Fix detected issues
  • `/siftcoder:document` - Add missing documentation
  • `/siftcoder:narrator` - Explain complex code
  • `/siftcoder:zen` - Simplify overly complex code
