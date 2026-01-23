---
description: Check what's not yet implemented from spec or feature queue
argument-hint: [spec-file|--from-queue|--from-focus]
allowed-tools: Read, Bash, Glob, Grep, Task
---

# /siftcoder:missing - Find Unimplemented Features

Identify what remains to be built from your specification or feature queue.

## Usage

```
/siftcoder:missing                    - Quick check from feature queue
/siftcoder:missing <spec-file>        - Compare against specification
/siftcoder:missing --from-queue       - Show pending features from queue
/siftcoder:missing --from-focus       - Show missing in focused area only
/siftcoder:missing --detailed         - Include implementation suggestions
```

## Instructions

### Default: Quick Queue Check

If no arguments or `--from-queue`:

Read `.claude/siftcoder-state/features.json` and display pending/partial features:

```
╔══════════════════════════════════════════════════════════════╗
║                    MISSING IMPLEMENTATIONS                   ║
╚══════════════════════════════════════════════════════════════╝

Source: Feature Queue (.claude/siftcoder-state/features.json)

┌─ SUMMARY ────────────────────────────────────────────────────┐
│                                                              │
│  Total Features:    [N]                                      │
│  Implemented:       [X] ██████████████░░░░░░ 70%            │
│  Partial:           [Y]                                      │
│  Missing:           [Z]                                      │
│                                                              │
└──────────────────────────────────────────────────────────────┘

┌─ PENDING FEATURES ───────────────────────────────────────────┐
│                                                              │
│  Priority: HIGH                                              │
│  ─────────────────                                          │
│  [1] feat-payments                                          │
│      "Payment processing with Stripe"                       │
│      Dependencies: feat-auth (✅ done)                      │
│      Subtasks: 0/5 complete                                 │
│                                                              │
│  [2] feat-notifications                                     │
│      "Email and push notifications"                         │
│      Dependencies: none                                      │
│      Subtasks: not planned yet                              │
│                                                              │
│  Priority: MEDIUM                                            │
│  ─────────────────                                          │
│  [3] feat-settings                                          │
│      "User preferences and settings"                        │
│      Dependencies: feat-auth (✅ done)                      │
│                                                              │
│  Priority: LOW                                               │
│  ─────────────────                                          │
│  [4] feat-analytics                                         │
│      "Usage analytics dashboard"                            │
│                                                              │
└──────────────────────────────────────────────────────────────┘

┌─ PARTIAL IMPLEMENTATIONS ────────────────────────────────────┐
│                                                              │
│  [1] feat-auth-2fa                                          │
│      Status: 60% complete (3/5 subtasks)                    │
│      Missing:                                                │
│        - Backup codes generation                            │
│        - Recovery flow                                       │
│      Last worked: 2 days ago                                │
│                                                              │
└──────────────────────────────────────────────────────────────┘

Next steps:
  /siftcoder:continue              - Resume partial features
  /siftcoder:add-feature <desc>    - Add new feature
  /siftcoder:focus feat-payments   - Focus on specific feature
```

### With Spec File

If `$ARGUMENTS` contains a file path:

1. Read the specification file
2. Extract requirements/features
3. Compare against implemented code
4. Show gaps

```
╔══════════════════════════════════════════════════════════════╗
║           MISSING: Spec vs Implementation                    ║
╚══════════════════════════════════════════════════════════════╝

Spec File: [path to spec]
Analyzed:  [timestamp]

┌─ COVERAGE ───────────────────────────────────────────────────┐
│                                                              │
│  Requirements: [N] total                                     │
│  Implemented:  [X] ████████████████░░░░ 80%                 │
│  Partial:      [Y]                                          │
│  Missing:      [Z]                                          │
│                                                              │
└──────────────────────────────────────────────────────────────┘

┌─ MISSING REQUIREMENTS ───────────────────────────────────────┐
│                                                              │
│  CRITICAL (must have):                                       │
│  ─────────────────────                                      │
│  [REQ-012] Password Reset                                   │
│    Spec: "Users can reset password via email"              │
│    Evidence: No password reset endpoints found              │
│    Suggested: /siftcoder:add-feature "Password reset flow"  │
│                                                              │
│  [REQ-015] Rate Limiting                                    │
│    Spec: "API rate limited to 100 req/min per user"        │
│    Evidence: Middleware exists but not applied              │
│    Suggested: /siftcoder:fix "Apply rate limit middleware"  │
│                                                              │
│  IMPORTANT (should have):                                    │
│  ─────────────────────────                                  │
│  [REQ-023] Export Data                                      │
│    Spec: "Users can export their data as JSON/CSV"         │
│    Evidence: No export functionality found                  │
│                                                              │
│  NICE TO HAVE:                                               │
│  ─────────────                                              │
│  [REQ-031] Dark Mode                                        │
│    Spec: "Support dark mode theme"                         │
│    Evidence: No theme switching found                       │
│                                                              │
└──────────────────────────────────────────────────────────────┘

┌─ PARTIAL IMPLEMENTATIONS ────────────────────────────────────┐
│                                                              │
│  [REQ-008] Two-Factor Authentication                        │
│    Spec: "Support TOTP and SMS 2FA"                        │
│    Found: TOTP implemented in src/auth/totp.ts              │
│    Missing: SMS verification                                │
│    Coverage: 50%                                            │
│                                                              │
└──────────────────────────────────────────────────────────────┘

Full report: .claude/siftcoder-state/missing-analysis.json
```

### With --from-focus

If current focus is set, only analyze missing items within focus:

```
╔══════════════════════════════════════════════════════════════╗
║           MISSING IN FOCUS: src/auth/                        ║
╚══════════════════════════════════════════════════════════════╝

Focus: src/auth/ (12 files)

Missing in this area:
  [1] Password reset flow
  [2] Session invalidation
  [3] Login attempt logging

Existing but incomplete:
  [1] 2FA - missing backup codes (src/auth/totp.ts)
  [2] OAuth - missing refresh token (src/auth/oauth.ts)

Related features outside focus:
  [1] Rate limiting (in src/middleware/) - may affect auth
```

### With --detailed

Add implementation suggestions:

```
┌─ DETAILED: feat-payments ────────────────────────────────────┐
│                                                              │
│  Feature: Payment processing with Stripe                    │
│  Priority: HIGH                                              │
│  Complexity: Medium (~8 hours estimated)                     │
│                                                              │
│  Suggested Implementation:                                   │
│  ─────────────────────────                                  │
│  1. Create payment service (src/services/payment.ts)        │
│  2. Add Stripe SDK integration                              │
│  3. Create checkout API endpoint                            │
│  4. Add webhook handler for events                          │
│  5. Create payment history model                            │
│  6. Add payment UI components                               │
│                                                              │
│  Dependencies to install:                                    │
│    npm install stripe @stripe/stripe-js                     │
│                                                              │
│  Similar patterns in codebase:                              │
│    src/services/email.ts (service pattern)                  │
│    src/api/webhooks/ (webhook handling)                     │
│                                                              │
│  Start with:                                                 │
│    /siftcoder:focus feat-payments                           │
│    /siftcoder:add-feature "Stripe payment integration"      │
│                                                              │
└──────────────────────────────────────────────────────────────┘
```

## Output Files

Generate analysis results:

### `.claude/siftcoder-state/missing-analysis.json`

```json
{
  "analyzedAt": "2026-01-12T...",
  "source": "feature-queue",
  "summary": {
    "total": 10,
    "implemented": 6,
    "partial": 2,
    "missing": 2
  },
  "missing": [
    {
      "id": "feat-payments",
      "title": "Payment processing",
      "priority": "high",
      "dependencies": ["feat-auth"],
      "suggestedAction": "/siftcoder:add-feature ..."
    }
  ],
  "partial": [
    {
      "id": "feat-auth-2fa",
      "title": "Two-factor auth",
      "progress": 60,
      "completedSubtasks": 3,
      "totalSubtasks": 5,
      "remainingWork": ["Backup codes", "Recovery flow"]
    }
  ]
}
```

## Integration

| After running missing | Recommended next step |
|-----------------------|----------------------|
| High priority missing | `/siftcoder:add-feature` |
| Partial implementation | `/siftcoder:continue` |
| Need more context | `/siftcoder:investigate` |
| Want full gap analysis | `/siftcoder:gap-analysis` |
| Focus on specific area | `/siftcoder:focus` |

## Tips

```
FINDING WHAT'S MISSING

Quick checks:
  /siftcoder:missing           - What's left in the queue?
  /siftcoder:missing --detailed - With implementation hints

Against specification:
  /siftcoder:missing ./SPEC.md  - Compare to requirements

Within focus:
  /siftcoder:focus src/auth
  /siftcoder:missing --from-focus

Prioritizing work:
  Missing shows priority levels (HIGH/MEDIUM/LOW)
  Start with HIGH priority items
  Use /siftcoder:focus to tackle one at a time
```
