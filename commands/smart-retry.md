---
description: Learn from failures - remember what didn't work and try different approaches
argument-hint: [--analyze|--history|--clear]
allowed-tools: Read, Write, Edit, Bash, Glob, Grep, Task
---

# /siftcoder:smart-retry - Learn from Failures

When an approach fails, remember what didn't work and try a different approach. Build institutional memory of gotchas to avoid repeating mistakes.

## Usage

```
/siftcoder:smart-retry                - Retry last failed action with learning
/siftcoder:smart-retry --analyze      - Analyze why last approach failed
/siftcoder:smart-retry --history      - View failure history
/siftcoder:smart-retry --clear        - Clear failure memory
/siftcoder:smart-retry --suggest      - Get alternative approaches
```

## How It Works

```
┌─────────────────────────────────────────────────────────────┐
│                    SMART RETRY LOOP                         │
└─────────────────────────────────────────────────────────────┘

     ┌──────────┐
     │  Attempt │
     │  Action  │
     └────┬─────┘
          │
          ▼
    ┌───────────┐
    │  Success? │─────Yes────► Done
    └─────┬─────┘
          │No
          ▼
    ┌───────────────────────────────────────┐
    │  Log failure to memory:               │
    │  - What was tried                     │
    │  - Why it failed                      │
    │  - Context (files, state)             │
    └─────────────────┬─────────────────────┘
          │
          ▼
    ┌───────────────────────────────────────┐
    │  Analyze failure:                     │
    │  - Check similar past failures        │
    │  - Identify pattern                   │
    │  - Suggest alternatives               │
    └─────────────────┬─────────────────────┘
          │
          ▼
    ┌───────────────────────────────────────┐
    │  Try different approach:              │
    │  - Explicitly avoid failed pattern    │
    │  - Use alternative strategy           │
    │  - Learn from gotchas                 │
    └─────────────────┬─────────────────────┘
          │
          └────────────► Retry
```

## Instructions

### Default: Smart Retry Last Failure

Retry the last failed action with accumulated learning:

```
SMART RETRY

Last failure: Implement user authentication
Attempt: 3/5

┌─ PREVIOUS ATTEMPTS ──────────────────────────────────────────┐
│                                                              │
│  Attempt 1: Direct bcrypt implementation                    │
│  Result:    Failed - bcrypt not compatible with edge runtime│
│  Learning:  Avoid bcrypt in edge/serverless                 │
│                                                              │
│  Attempt 2: Switch to argon2                                │
│  Result:    Failed - argon2 needs native bindings          │
│  Learning:  Need pure JS solution for edge runtime          │
│                                                              │
└──────────────────────────────────────────────────────────────┘

┌─ ANALYSIS ───────────────────────────────────────────────────┐
│                                                              │
│  Pattern detected: Edge runtime compatibility issue         │
│                                                              │
│  Similar past failures:                                      │
│    - gotcha-15: "Native modules fail in edge runtime"       │
│    - gotcha-22: "Use Web Crypto API for edge compatibility" │
│                                                              │
└──────────────────────────────────────────────────────────────┘

┌─ NEW APPROACH ───────────────────────────────────────────────┐
│                                                              │
│  Strategy: Use @noble/hashes (pure JS, edge-compatible)     │
│                                                              │
│  Why this should work:                                       │
│    - Pure JavaScript, no native bindings                    │
│    - Designed for edge/browser environments                 │
│    - Provides scrypt which is bcrypt-equivalent             │
│                                                              │
│  Will explicitly avoid:                                      │
│    [x] bcrypt (native bindings)                             │
│    [x] argon2 (native bindings)                             │
│    [x] Any crypto requiring Node.js APIs                    │
│                                                              │
└──────────────────────────────────────────────────────────────┘

Trying new approach...

[Implementation with @noble/hashes]

SUCCESS on attempt 3!

┌─ LEARNING CAPTURED ──────────────────────────────────────────┐
│                                                              │
│  New gotcha added: gotcha-42                                 │
│                                                              │
│  Issue: Password hashing in edge runtime                    │
│  Bad approaches:                                             │
│    - bcrypt (native bindings)                               │
│    - argon2 (native bindings)                               │
│  Solution: Use @noble/hashes with scrypt                    │
│  Context: Edge runtime, Vercel, Cloudflare Workers          │
│                                                              │
└──────────────────────────────────────────────────────────────┘
```

### Command: `--analyze`

Deep analysis of why the last approach failed:

```
/siftcoder:smart-retry --analyze
```

```
FAILURE ANALYSIS

Last action: Implement user authentication
Failed at:   2026-01-12 15:30:00

┌─ WHAT WAS TRIED ─────────────────────────────────────────────┐
│                                                              │
│  Approach: Use bcrypt for password hashing                  │
│                                                              │
│  Code written:                                               │
│    import bcrypt from 'bcrypt';                             │
│    const hash = await bcrypt.hash(password, 10);            │
│                                                              │
│  Files modified:                                             │
│    src/auth/password.ts                                     │
│                                                              │
└──────────────────────────────────────────────────────────────┘

┌─ WHY IT FAILED ──────────────────────────────────────────────┐
│                                                              │
│  Error message:                                              │
│    "Error: Cannot find module 'bcrypt' in edge runtime"     │
│                                                              │
│  Root cause:                                                 │
│    bcrypt uses native C++ bindings that are not available   │
│    in edge runtime environments (Vercel Edge, Cloudflare)   │
│                                                              │
│  Environment factors:                                        │
│    - Project uses Next.js with edge runtime                 │
│    - Middleware runs on edge                                │
│    - API routes configured for edge                         │
│                                                              │
└──────────────────────────────────────────────────────────────┘

┌─ SIMILAR FAILURES IN HISTORY ────────────────────────────────┐
│                                                              │
│  [1] gotcha-15 (2026-01-05)                                 │
│      "Sharp image library fails in edge runtime"            │
│      Solution: Use Cloudflare Images or client-side         │
│                                                              │
│  [2] gotcha-22 (2026-01-08)                                 │
│      "crypto.randomBytes not available in edge"             │
│      Solution: Use Web Crypto API                           │
│                                                              │
│  Pattern: Native Node.js modules fail in edge runtime       │
│                                                              │
└──────────────────────────────────────────────────────────────┘

┌─ ALTERNATIVE APPROACHES ─────────────────────────────────────┐
│                                                              │
│  Ranked by likelihood of success:                           │
│                                                              │
│  [1] @noble/hashes (95% confidence)                         │
│      Pure JS, designed for edge, battle-tested              │
│                                                              │
│  [2] Web Crypto API directly (85% confidence)               │
│      Native to edge, but lower-level API                    │
│                                                              │
│  [3] Move auth to Node.js runtime (80% confidence)          │
│      Change runtime config, but adds complexity             │
│                                                              │
│  [4] External auth service (75% confidence)                 │
│      Auth0, Clerk - offload entirely                        │
│                                                              │
└──────────────────────────────────────────────────────────────┘

Recommended: Try approach [1] @noble/hashes

Run /siftcoder:smart-retry to try this approach
```

### Command: `--history`

View failure history and learnings:

```
/siftcoder:smart-retry --history
```

```
FAILURE HISTORY

Total failures: 24 | Recovered: 21 | Escalated: 3

┌─ RECENT FAILURES ────────────────────────────────────────────┐
│                                                              │
│  [1] 2026-01-12 15:30 - Password hashing (RECOVERED)        │
│      Attempts: 3 | Solution: @noble/hashes                  │
│                                                              │
│  [2] 2026-01-12 14:00 - TypeScript types (RECOVERED)        │
│      Attempts: 2 | Solution: Add missing interface          │
│                                                              │
│  [3] 2026-01-11 16:00 - API route timeout (RECOVERED)       │
│      Attempts: 4 | Solution: Streaming response             │
│                                                              │
│  [4] 2026-01-10 11:00 - Database connection (ESCALATED)     │
│      Attempts: 5 | Reason: Required env var missing         │
│                                                              │
└──────────────────────────────────────────────────────────────┘

┌─ TOP GOTCHAS LEARNED ────────────────────────────────────────┐
│                                                              │
│  [1] gotcha-42: Edge runtime + native modules               │
│      Triggered: 8 times | Success rate: 100%                │
│                                                              │
│  [2] gotcha-38: Prisma + edge runtime                       │
│      Triggered: 5 times | Success rate: 80%                 │
│                                                              │
│  [3] gotcha-31: Type inference with generics                │
│      Triggered: 12 times | Success rate: 92%                │
│                                                              │
└──────────────────────────────────────────────────────────────┘

View details:
  /siftcoder:smart-retry --analyze
  /siftcoder:knowledge gotcha-42
```

### Command: `--suggest`

Get alternative approaches for current task:

```
/siftcoder:smart-retry --suggest
```

```
ALTERNATIVE APPROACHES

Current task: Implement real-time notifications

Based on:
  - Project patterns
  - Past failures
  - Known gotchas
  - Industry best practices

┌─ APPROACH 1: Server-Sent Events (Recommended) ───────────────┐
│                                                              │
│  Pros:                                                       │
│    + Simple, one-directional                                │
│    + Works with edge runtime                                │
│    + No additional dependencies                             │
│                                                              │
│  Cons:                                                       │
│    - One-way only (server to client)                        │
│    - Reconnection handling needed                           │
│                                                              │
│  Confidence: 90%                                            │
│  Similar success: 3 times in this codebase                  │
│                                                              │
└──────────────────────────────────────────────────────────────┘

┌─ APPROACH 2: WebSockets with Pusher ─────────────────────────┐
│                                                              │
│  Pros:                                                       │
│    + Bidirectional                                          │
│    + Managed infrastructure                                 │
│    + Good edge compatibility                                │
│                                                              │
│  Cons:                                                       │
│    - External dependency                                    │
│    - Cost at scale                                          │
│                                                              │
│  Confidence: 85%                                            │
│                                                              │
└──────────────────────────────────────────────────────────────┘

┌─ APPROACH 3: Polling with SWR ───────────────────────────────┐
│                                                              │
│  Pros:                                                       │
│    + Simplest to implement                                  │
│    + Works everywhere                                       │
│                                                              │
│  Cons:                                                       │
│    - Not truly real-time                                    │
│    - More server load                                       │
│                                                              │
│  Confidence: 95% (but lower quality)                        │
│                                                              │
└──────────────────────────────────────────────────────────────┘

Try approach 1:
  /siftcoder:smart-retry --use 1
```

## Failure Memory Storage

`.claude/siftcoder-state/failures.json`:

```json
{
  "failures": [
    {
      "id": "fail-123",
      "timestamp": "2026-01-12T15:30:00Z",
      "task": "Implement user authentication",
      "attempts": [
        {
          "approach": "bcrypt",
          "error": "Cannot find module 'bcrypt' in edge runtime",
          "files": ["src/auth/password.ts"],
          "duration": "2m"
        },
        {
          "approach": "argon2",
          "error": "argon2 requires native bindings",
          "files": ["src/auth/password.ts"],
          "duration": "3m"
        },
        {
          "approach": "@noble/hashes",
          "result": "success",
          "files": ["src/auth/password.ts"],
          "duration": "4m"
        }
      ],
      "solution": "@noble/hashes with scrypt",
      "gotchaCreated": "gotcha-42"
    }
  ]
}
```

## Integration with Other Commands

### With `/siftcoder:heal`

Heal uses smart-retry internally:

```
HEALING with SMART RETRY

Build failed (attempt 1/3)
Analyzing failure...

Previous similar failure found: gotcha-38
Applying learned solution...

Build passed on attempt 2!
```

### With `/siftcoder:knowledge`

Gotchas are automatically added:

```
/siftcoder:knowledge gotchas

Gotchas: 42 total

Recent (from smart-retry):
  gotcha-42: Edge runtime + password hashing
  gotcha-41: Prisma transactions in serverless
  gotcha-40: Next.js dynamic imports in edge
```

## Configuration

```json
{
  "smartRetry": {
    "maxAttempts": 5,
    "learnFromFailures": true,
    "addToGotchas": true,
    "escalateAfterMax": true,
    "similarityThreshold": 0.7,
    "retentionDays": 90
  }
}
```

## Tips

```
EFFECTIVE SMART RETRY

When failures happen:
  - Let smart-retry analyze before manual debugging
  - Check if similar failure exists in history
  - Trust the alternative suggestions

Learning from failures:
  - Gotchas are automatically captured
  - Review gotchas periodically
  - Share gotchas across team (via sync)

Preventing failures:
  - Smart-retry checks gotchas before attempting
  - Known bad patterns are avoided automatically
  - Confidence scores help pick best approach

Manual intervention:
  - Escalated failures need human input
  - Add context with /siftcoder:knowledge add
  - Clear bad learnings with --clear
```
