---
description: State Reconstruction Debugging - Reconstruct exact application state at any point in history
argument-hint: "<time or event>" [--reproduce|--diff|--export]
allowed-tools: Read, Write, Bash, Glob, Grep, Task
---

# /siftcoder:timewarp - State Reconstruction Debugging

Reconstruct the exact state of your application at any point in history. Debug issues by traveling back to when they occurred.

## Usage

```
/siftcoder:timewarp "<time or event>"   - Reconstruct state at moment
/siftcoder:timewarp --reproduce         - Set up local reproduction
/siftcoder:timewarp --diff <t1> <t2>    - Compare two points in time
/siftcoder:timewarp --export            - Export reconstruction
```

## Philosophy

```
The hardest bugs are the ones you can't reproduce.

"It worked yesterday"
"It only happens in production"
"The user says X but I can't see how"

Timewarp solves this by reconstructing EXACTLY what existed
at the moment of failure:
  • Code version
  • Dependencies
  • Configuration
  • Environment
  • Data state (when available)
  • External service states

Then it analyzes what changed to cause the bug.
```

## How It Works

```
┌─────────────────────────────────────────────────────────────┐
│                  TIMEWARP RECONSTRUCTION                    │
└─────────────────────────────────────────────────────────────┘

    Time of Bug                    Reconstructed State
         │                                │
         ▼                                │
    ┌──────────┐                          │
    │ Git      │ ─── Commit at time ──────┤
    │ History  │                          │
    └──────────┘                          │
                                          │
    ┌──────────┐                          │
    │ Logs     │ ─── Context & errors ────┤
    │          │                          │
    └──────────┘                          │
                                          │
    ┌──────────┐                          │
    │ Config   │ ─── Env vars & config ───┤
    │ History  │                          │
    └──────────┘                          │
                                          │
    ┌──────────┐                          ▼
    │ External │ ─── API states ──► ┌───────────┐
    │ Services │                    │ Complete  │
    └──────────┘                    │ Snapshot  │
                                    └───────────┘
```

## Instructions

### Default: Reconstruct State at Time

**Step 1: Parse Time Reference**

Accept various time formats:

```
/siftcoder:timewarp "2026-01-10 14:32"          - Exact datetime
/siftcoder:timewarp "3 days ago"                - Relative time
/siftcoder:timewarp "commit a3f2b1c"            - Specific commit
/siftcoder:timewarp "when payment bug reported" - From issues/logs
/siftcoder:timewarp "last Tuesday 3pm"          - Natural language
```

**Step 2: Gather Evidence**

```
TIMEWARP: Reconstructing 2026-01-10 14:32:00
═══════════════════════════════════════════════════════════════

Gathering evidence from that moment...

┌─ GIT STATE ──────────────────────────────────────────────────┐
│                                                               │
│  Commit: a3f2b1c "Add payment retry logic"                   │
│  Author: @developer                                          │
│  Date: 2026-01-10 09:15:00 (5 hours before bug)              │
│                                                               │
│  Commits since then: 3                                       │
│  ├── b4e5d2f "Fix typo in error message" (14:00)            │
│  ├── c5f6e3g "Update Stripe API version" (14:25)  ← SUS     │
│  └── d6g7f4h "Add logging" (14:45) (after bug)              │
│                                                               │
│  Files changed at 14:25:                                     │
│  ├── src/payments/stripe.ts                                  │
│  ├── package.json (stripe version bump)                      │
│  └── src/config/api-versions.ts                              │
│                                                               │
└───────────────────────────────────────────────────────────────┘
```

**Step 3: Environment Reconstruction**

```
┌─ ENVIRONMENT AT 14:32 ───────────────────────────────────────┐
│                                                               │
│  Node Version: 18.19.0                                       │
│  NPM Version: 10.2.3                                         │
│                                                               │
│  Dependencies (from package-lock at commit):                 │
│  ├── stripe: 12.18.0 → 13.0.0 (CHANGED at 14:25!)           │
│  ├── express: 4.18.2                                         │
│  └── ... (247 unchanged)                                     │
│                                                               │
│  Environment Variables:                                       │
│  ├── STRIPE_API_VERSION: "2023-10-16"                        │
│  ├── NODE_ENV: "production"                                  │
│  └── ... (from config history)                               │
│                                                               │
└───────────────────────────────────────────────────────────────┘
```

**Step 4: Log Analysis**

```
┌─ LOGS FROM ±5 MINUTES ───────────────────────────────────────┐
│                                                               │
│  14:30:12 [INFO] Payment intent created                      │
│           user_id=12345 amount=12750 currency=usd            │
│                                                               │
│  14:30:15 [INFO] Card validation started                     │
│           card_ending=4242                                    │
│                                                               │
│  14:30:18 [WARN] Stripe API returned unexpected format       │
│           expected: { id: string }                           │
│           got: { payment_intent: { id: string } }            │
│                                                               │
│  14:30:18 [ERROR] Cannot read property 'id' of undefined     │
│           at processPayment (stripe.ts:145)                  │
│           at async handleCheckout (checkout.ts:89)           │
│                                                               │
│  14:30:19 [INFO] Payment marked as failed                    │
│           user notified                                       │
│                                                               │
│  14:30:45 [INFO] User retry - payment succeeded (!)          │
│           Same user, same amount                              │
│                                                               │
└───────────────────────────────────────────────────────────────┘
```

**Step 5: Root Cause Analysis**

```
┌─ ROOT CAUSE ANALYSIS ────────────────────────────────────────┐
│                                                               │
│  LIKELY CAUSE IDENTIFIED                                     │
│                                                               │
│  The bug was introduced at 14:25 when:                       │
│                                                               │
│  1. Stripe was upgraded from 12.18.0 to 13.0.0               │
│                                                               │
│  2. Stripe 13.0.0 has a BREAKING CHANGE:                     │
│     Payment intent response format changed from:             │
│       { id: "pi_xxx", ... }                                  │
│     To:                                                       │
│       { payment_intent: { id: "pi_xxx", ... } }              │
│                                                               │
│  3. Our code at stripe.ts:145 expected the old format:       │
│       const paymentId = response.id;  // undefined!          │
│                                                               │
│  4. User saw "payment failed" but charge actually succeeded  │
│     (Stripe processed it, we just couldn't read the ID)      │
│                                                               │
│  WHY IT WORKED ON RETRY:                                     │
│  Cache was cleared between attempts, and the retry code      │
│  path has different error handling that caught this.         │
│                                                               │
└───────────────────────────────────────────────────────────────┘

┌─ EVIDENCE CHAIN ─────────────────────────────────────────────┐
│                                                               │
│  14:25 ─── Stripe upgrade committed                          │
│    │                                                          │
│    ├───── API response format changed                        │
│    │                                                          │
│  14:30 ─── User attempts payment                             │
│    │                                                          │
│    ├───── response.id is undefined                           │
│    │                                                          │
│    ├───── Error thrown, user sees failure                    │
│    │                                                          │
│    └───── But Stripe actually charged the card              │
│                                                               │
└───────────────────────────────────────────────────────────────┘
```

**Step 6: Present Fix**

```
┌─ RECOMMENDED FIX ────────────────────────────────────────────┐
│                                                               │
│  Option 1: Update code for new API format                    │
│  ────────────────────────────────────────                    │
│  - const paymentId = response.id;                            │
│  + const paymentId = response.payment_intent?.id || response.id;
│                                                               │
│  Option 2: Pin Stripe to previous version                    │
│  ────────────────────────────────────────                    │
│  In package.json:                                             │
│  - "stripe": "^13.0.0"                                       │
│  + "stripe": "12.18.0"                                       │
│                                                               │
│  Option 3: Add defensive parsing (recommended)               │
│  ────────────────────────────────────────                    │
│  function extractPaymentId(response: StripeResponse) {       │
│    // Handle both old and new Stripe API formats             │
│    if (response.payment_intent) {                            │
│      return response.payment_intent.id;                      │
│    }                                                          │
│    return response.id;                                        │
│  }                                                            │
│                                                               │
│  ALSO NEEDED:                                                │
│  - Check for users charged but marked as failed              │
│  - Refund duplicates or mark orders as complete              │
│  - Add API version checking to prevent future issues         │
│                                                               │
└───────────────────────────────────────────────────────────────┘

[Apply Fix #1] [Apply Fix #3] [Reproduce Locally] [Export Report]
```

### Command: `--reproduce`

Set up local reproduction environment:

```
/siftcoder:timewarp "2026-01-10 14:32" --reproduce
```

```
SETTING UP REPRODUCTION ENVIRONMENT
═══════════════════════════════════════════════════════════════

Creating time capsule at .timewarp/2026-01-10-14-32/

[1/5] Checking out code at commit a3f2b1c...
      ✓ Code state restored

[2/5] Installing exact dependencies...
      ✓ stripe@13.0.0 (the buggy version)
      ✓ 247 other packages

[3/5] Setting up environment variables...
      ✓ Created .env.timewarp

[4/5] Creating mock for Stripe API...
      ✓ Mock returns same response format as 14:32

[5/5] Setting up test scenario...
      ✓ Test user created
      ✓ Test payment data ready

REPRODUCTION READY

To reproduce the bug:
  cd .timewarp/2026-01-10-14-32
  npm start
  # Then trigger payment flow

The environment exactly matches production at 14:32.
The same request should produce the same error.

Cleanup when done:
  /siftcoder:timewarp --cleanup
```

### Command: `--diff`

Compare two points in time:

```
/siftcoder:timewarp --diff "2026-01-10 14:00" "2026-01-10 15:00"
```

```
TIME DIFF: 14:00 vs 15:00
═══════════════════════════════════════════════════════════════

What changed in that hour:

┌─ CODE CHANGES ───────────────────────────────────────────────┐
│                                                               │
│  2 commits:                                                   │
│                                                               │
│  14:25 - c5f6e3g "Update Stripe API version"                 │
│  ├── src/payments/stripe.ts (+3, -1)                         │
│  ├── package.json (+1, -1)                                   │
│  └── src/config/api-versions.ts (+5, -0)                     │
│                                                               │
│  14:45 - d6g7f4h "Add logging"                               │
│  └── src/payments/stripe.ts (+12, -0)                        │
│                                                               │
└───────────────────────────────────────────────────────────────┘

┌─ DEPENDENCY CHANGES ─────────────────────────────────────────┐
│                                                               │
│  stripe: 12.18.0 → 13.0.0 (MAJOR VERSION)                   │
│    Breaking changes in 13.0.0:                               │
│    - Response format for payment intents                     │
│    - Webhook payload structure                               │
│    - Error codes                                              │
│                                                               │
└───────────────────────────────────────────────────────────────┘

┌─ ERROR RATE CHANGES ─────────────────────────────────────────┐
│                                                               │
│  14:00: Error rate 0.1%                                       │
│  14:30: Error rate 12.5% (spike!)                            │
│  15:00: Error rate 0.3% (after hotfix)                       │
│                                                               │
│  Correlation: Error spike aligns with Stripe upgrade         │
│                                                               │
└───────────────────────────────────────────────────────────────┘
```

## Data Sources

Timewarp gathers data from:

```
DATA SOURCES
═══════════════════════════════════════════════════════════════

Built-in sources:
  ├── Git history (commits, branches, tags)
  ├── Package lock files (dependency snapshots)
  ├── Config files in git

Optional integrations:
  ├── Application logs (if accessible)
  ├── Error tracking (Sentry, etc.)
  ├── APM data (DataDog, New Relic)
  ├── Deployment history (CI/CD logs)
  └── Database migrations history

Privacy note:
  Timewarp only accesses data you've configured.
  No external calls without explicit setup.
```

## Configuration

```json
{
  "timewarp": {
    "logSources": [
      "./logs/*.log",
      "s3://my-bucket/logs/"
    ],
    "errorTracking": {
      "provider": "sentry",
      "dsn": "https://..."
    },
    "retentionDays": 90,
    "autoCapture": true
  }
}
```

## Integration

Works well with:
  • `/siftcoder:archaeologist` - Understand why code changed
  • `/siftcoder:trace` - See execution at that moment
  • `/siftcoder:ghost` - Explore what-if scenarios
  • `/siftcoder:checkpoint` - Restore to known good state
