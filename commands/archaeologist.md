---
description: Deep Code History Intelligence - AI-powered archaeology into why code exists
argument-hint: <file:lines> [--dig|--tribal|--evolution]
allowed-tools: Read, Bash, Glob, Grep, Task
---

# /siftcoder:archaeologist - Deep Code History Intelligence

Go beyond git blame. Understand the full story of why code exists, the decisions that shaped it, and the tribal knowledge locked within.

## Usage

```
/siftcoder:archaeologist <file:lines>  - Deep dig into code history
/siftcoder:archaeologist --dig <area>  - Explore entire area
/siftcoder:archaeologist --tribal      - Find tribal knowledge
/siftcoder:archaeologist --evolution   - Show code evolution
/siftcoder:archaeologist --mystery     - Find unexplained code
```

## Philosophy

```
Git blame tells you WHO and WHEN.
Archaeologist tells you WHY and WHAT HAPPENED.

Every line of code has a story:
  • Why was this decision made?
  • What problem was this solving?
  • What alternatives were considered?
  • Who has the knowledge to explain this?
  • Is this still relevant or can it be removed?

This tool excavates those stories.
```

## Instructions

### Default: Deep Dig into Code

**Step 1: Identify the Artifact**

```
/siftcoder:archaeologist src/payments/stripe.ts:145-160
```

```
ARCHAEOLOGICAL DIG
═══════════════════════════════════════════════════════════════

Excavating: src/payments/stripe.ts lines 145-160

┌─ THE ARTIFACT ───────────────────────────────────────────────┐
│                                                               │
│  145 │ // Special handling for large payments                │
│  146 │ if (amount > 999999) {                                │
│  147 │   logger.warn('Large payment detected', { amount });  │
│  148 │   return processLargePayment(amount, {                │
│  149 │     metadata,                                          │
│  150 │     retries: 3,                                        │
│  151 │     timeout: 30000                                     │
│  152 │   });                                                  │
│  153 │ }                                                      │
│                                                               │
│  Questions this code raises:                                  │
│  ├── Why 999999? (Not 1000000 or 10000?)                    │
│  ├── Why special handling for "large" payments?              │
│  ├── Why 3 retries? Why 30s timeout?                        │
│  └── Is this still needed?                                   │
│                                                               │
└───────────────────────────────────────────────────────────────┘
```

**Step 2: Excavate the History**

```
┌─ ORIGIN STORY ───────────────────────────────────────────────┐
│                                                               │
│  Created: 2024-03-15 by @alex                                │
│  Commit: d4e5f6g "Add large payment handling"                │
│  PR: #345 "Handle Stripe large payment bug"                  │
│                                                               │
│  PR Description:                                              │
│  "Stripe has a bug where payments over $9,999.99 can fail    │
│   silently. Adding special handling until they fix it."      │
│                                                               │
│  Linked Issue: #342 "Payments over $10k failing"            │
│  Issue Description:                                           │
│  "Customer reported payment of $12,500 failed but they were │
│   charged. Stripe support confirmed API bug with large       │
│   amounts. Temporary workaround needed."                     │
│                                                               │
│  Discussion in PR:                                            │
│  @alex: "Stripe says fix coming in Q2 2024"                  │
│  @sarah: "Should we set a reminder to remove this?"          │
│  @alex: "Good idea, adding TODO"                             │
│  (No TODO was ever added)                                     │
│                                                               │
└───────────────────────────────────────────────────────────────┘
```

**Step 3: Trace Evolution**

```
┌─ EVOLUTION TIMELINE ─────────────────────────────────────────┐
│                                                               │
│  2024-03-15 │ Original workaround added                      │
│             │ Threshold: 500000 (5000.00 in cents)           │
│             │ Author: @alex                                  │
│             │                                                 │
│  2024-06-20 │ Threshold raised to 999999                     │
│             │ Commit: "Increase large payment threshold"     │
│             │ Reason: "False positives on $5-10k payments"   │
│             │ Author: @alex                                  │
│             │                                                 │
│  2024-09-01 │ Added metadata parameter                       │
│             │ Commit: "Pass metadata to large payments"      │
│             │ Reason: "Need order ID for reconciliation"     │
│             │ Author: @jordan                                │
│             │                                                 │
│  2024-11-15 │ Added logging                                  │
│             │ Commit: "Add logging for payment debugging"    │
│             │ Author: @sam                                   │
│             │                                                 │
│  Today      │ No changes in 2 months                         │
│             │ Original bug status: UNKNOWN                   │
│                                                               │
└───────────────────────────────────────────────────────────────┘
```

**Step 4: Identify Tribal Knowledge**

```
┌─ TRIBAL KNOWLEDGE ───────────────────────────────────────────┐
│                                                               │
│  Knowledge Holders:                                           │
│  ├── @alex - Original author                                │
│  │   Status: Left company July 2024                         │
│  │   Knowledge: Why 999999, original Stripe bug details     │
│  │                                                           │
│  ├── @sarah - Reviewed original PR                          │
│  │   Status: Still on team                                  │
│  │   Knowledge: Some context from review                    │
│  │                                                           │
│  └── @jordan - Added metadata handling                      │
│      Status: Still on team                                   │
│      Knowledge: Why metadata was needed                      │
│                                                               │
│  Undocumented Decisions:                                      │
│  ├── Why 999999 specifically? (No one knows)                │
│  ├── Why 3 retries? (Standard practice or specific reason?) │
│  ├── Why 30s timeout? (Stripe docs say 60s is safe)         │
│  └── Is the Stripe bug fixed? (No one checked)              │
│                                                               │
│  Risk Assessment:                                             │
│  ├── Bus factor: HIGH (original author gone)                │
│  ├── Documentation: NONE                                    │
│  └── Test coverage: PARTIAL (happy path only)               │
│                                                               │
└───────────────────────────────────────────────────────────────┘
```

**Step 5: Current Relevance Check**

```
┌─ IS THIS STILL NEEDED? ──────────────────────────────────────┐
│                                                               │
│  Checking Stripe changelog and bug trackers...               │
│                                                               │
│  Stripe API Updates:                                          │
│  ├── 2024-04-15: "Fixed payment processing for large amounts"│
│  ├── 2024-06-01: API version 2024-06-01 released            │
│  └── Current: API version 2024-10-28                         │
│                                                               │
│  Our Stripe API Version: 2023-10-16 (outdated!)             │
│                                                               │
│  Assessment:                                                  │
│  ├── The original Stripe bug appears to be FIXED            │
│  ├── We're using an outdated API version                    │
│  ├── This workaround may no longer be necessary             │
│  └── HOWEVER: Need to verify before removing                │
│                                                               │
│  Recommended Actions:                                         │
│  1. Update Stripe API version to latest                      │
│  2. Test large payments in staging                           │
│  3. If working, remove this workaround                       │
│  4. Add proper test coverage for large payments              │
│                                                               │
└───────────────────────────────────────────────────────────────┘
```

**Step 6: Generate Documentation**

```
┌─ RECOMMENDED DOCUMENTATION ──────────────────────────────────┐
│                                                               │
│  If keeping this code, add this comment:                     │
│                                                               │
│  /**                                                          │
│   * Special handling for large payments (>$9,999.99)         │
│   *                                                           │
│   * HISTORY:                                                  │
│   * - Added 2024-03-15 as workaround for Stripe bug #XXX    │
│   * - Stripe reportedly fixed this in API version 2024-06-01│
│   * - TODO: Verify fix and remove if no longer needed        │
│   *                                                           │
│   * WHY 999999?                                               │
│   * - Original threshold was 500000 ($5000)                  │
│   * - Raised to 999999 ($9999.99) due to false positives    │
│   * - This is in cents, not dollars                          │
│   *                                                           │
│   * CONTACTS:                                                 │
│   * - @sarah reviewed original implementation                │
│   * - @jordan knows metadata requirements                    │
│   *                                                           │
│   * @see Issue #342, PR #345                                 │
│   */                                                          │
│                                                               │
└───────────────────────────────────────────────────────────────┘

[Add Documentation] [Create Task to Verify] [Mark for Removal]
```

### Command: `--tribal`

Find all tribal knowledge in codebase:

```
/siftcoder:archaeologist --tribal
```

```
TRIBAL KNOWLEDGE SCAN
═══════════════════════════════════════════════════════════════

Scanning for undocumented institutional knowledge...

┌─ HIGH RISK TRIBAL KNOWLEDGE ─────────────────────────────────┐
│                                                               │
│  1. src/payments/stripe.ts:145-160                           │
│     Knowledge type: Workaround for external bug              │
│     Owner: @alex (left company)                              │
│     Documentation: None                                       │
│     Risk: Critical functionality, no one understands         │
│                                                               │
│  2. src/auth/oauth.ts:89-120                                 │
│     Knowledge type: OAuth edge case handling                 │
│     Owner: @maria (on leave)                                │
│     Documentation: Cryptic comment only                      │
│     Risk: Auth failures if modified incorrectly              │
│                                                               │
│  3. src/db/migrations/007_users.ts                           │
│     Knowledge type: Data migration decision                  │
│     Owner: Unknown (git history unclear)                     │
│     Documentation: None                                       │
│     Risk: Can't safely rollback                              │
│                                                               │
└───────────────────────────────────────────────────────────────┘

┌─ MEDIUM RISK ────────────────────────────────────────────────┐
│                                                               │
│  12 additional locations with tribal knowledge...            │
│  [View All]                                                   │
│                                                               │
└───────────────────────────────────────────────────────────────┘

RECOMMENDATIONS:
  • Interview @sarah about payment handling (she reviewed)
  • Document OAuth edge cases before @maria's return
  • Add comments to all 15 locations
  • Create runbook for critical paths

[Generate Documentation Tasks] [Create Tickets] [Export Report]
```

### Command: `--mystery`

Find unexplained code:

```
/siftcoder:archaeologist --mystery
```

```
MYSTERY CODE DETECTED
═══════════════════════════════════════════════════════════════

Code that exists without clear explanation:

┌─ MYSTERY #1 ─────────────────────────────────────────────────┐
│                                                               │
│  Location: src/utils/date.ts:34                              │
│  Code: if (day === 29 && month === 2) return day - 1;       │
│                                                               │
│  Questions:                                                   │
│  ├── Why specifically Feb 29?                               │
│  ├── Why subtract 1? (Returns 28)                           │
│  ├── Is this leap year handling? Why here?                  │
│  └── No tests cover this branch                              │
│                                                               │
│  Git history: Added in "misc fixes" commit with 50 files    │
│  Author: @unknown (account deleted)                          │
│                                                               │
└───────────────────────────────────────────────────────────────┘

┌─ MYSTERY #2 ─────────────────────────────────────────────────┐
│                                                               │
│  Location: src/api/middleware.ts:156                         │
│  Code: await sleep(100); // don't remove                     │
│                                                               │
│  Questions:                                                   │
│  ├── Why 100ms sleep?                                        │
│  ├── What breaks if removed? (Comment says don't)           │
│  └── Race condition? Rate limit? Unknown                     │
│                                                               │
│  Git history: Added 3 years ago, never modified              │
│  Author: @founder (doesn't code anymore)                     │
│                                                               │
└───────────────────────────────────────────────────────────────┘

Found: 8 mysteries
High risk: 3
Should investigate: 5

[Investigate All] [Create Documentation Tasks] [Ignore Low Risk]
```

## Configuration

```json
{
  "archaeologist": {
    "sources": {
      "git": true,
      "github": true,
      "jira": false,
      "slack": false
    },
    "riskThresholds": {
      "busFactorWarning": 1,
      "staleDays": 180
    },
    "ignorePatterns": [
      "*.generated.ts",
      "node_modules/**"
    ]
  }
}
```

## Integration

Works well with:
  • `/siftcoder:timewarp` - See code at specific moments
  • `/siftcoder:document` - Add missing documentation
  • `/siftcoder:empathy` - Find frustrating code
  • `/siftcoder:narrator` - Explain code to others
