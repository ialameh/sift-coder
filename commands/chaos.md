---
description: Intelligent Chaos Engineering - AI-designed failure scenarios tailored to your architecture
argument-hint: [analyze|run|gameday] [--scenario <name>]
allowed-tools: Read, Write, Edit, Bash, Glob, Grep, Task
---

# /siftcoder:chaos - Intelligent Chaos Engineering

AI-designed chaos experiments based on your specific architecture. Find weaknesses before they find you.

## Usage

```
/siftcoder:chaos analyze                - Identify failure scenarios
/siftcoder:chaos run <scenario>         - Execute chaos experiment
/siftcoder:chaos gameday                - Full chaos gameday plan
/siftcoder:chaos --what-if "<failure>"  - Simulate specific failure
```

## Philosophy

```
Every system has weaknesses. The question is:
Do you find them, or do your users?

Traditional chaos engineering: Random failures
Intelligent chaos: Targeted failures based on YOUR code

This tool analyzes your architecture to identify:
  • Missing error handling
  • Single points of failure
  • Cascading failure risks
  • Timeout vulnerabilities
  • Resource exhaustion paths

Then designs experiments to safely test them.
```

## Instructions

### Default: Analyze for Chaos Opportunities

```
/siftcoder:chaos analyze
```

```
CHAOS ANALYSIS
═══════════════════════════════════════════════════════════════

Analyzing your architecture for failure points...

Scanned:
  ├── 247 source files
  ├── 12 external integrations
  ├── 4 databases/caches
  └── 3 message queues


┌─ HIGH-VALUE CHAOS SCENARIOS ─────────────────────────────────┐
│                                                               │
│  SCENARIO 1: "The Stripe Outage"                             │
│  ─────────────────────────────────────────────────────────   │
│  What: Stripe API returns 503 for 60 seconds                 │
│                                                               │
│  Why test this:                                               │
│  ├── src/payments/stripe.ts has no circuit breaker           │
│  ├── No fallback payment processor configured                │
│  ├── Timeout is 30s - users will wait forever               │
│  └── No graceful degradation for checkout                    │
│                                                               │
│  Predicted impact:                                            │
│  ├── Checkout completely broken                              │
│  ├── Users see infinite spinner                              │
│  ├── No error message shown                                  │
│  └── Cart data may be lost                                   │
│                                                               │
│  Risk: HIGH                                                   │
│  Blast radius: Payment flow only                             │
│                                                               │
│  Run: /siftcoder:chaos run stripe-outage                     │
│                                                               │
│                                                               │
│  SCENARIO 2: "Database Partition"                            │
│  ─────────────────────────────────────────────────────────   │
│  What: Read replica lags behind primary by 5 seconds         │
│                                                               │
│  Why test this:                                               │
│  ├── Auth reads from replica                                 │
│  ├── Registration writes to primary                          │
│  ├── New users won't be found for 5 seconds                 │
│  └── "User not found" errors after registration              │
│                                                               │
│  Predicted impact:                                            │
│  ├── New user login fails immediately after signup           │
│  ├── Error: "User not found"                                │
│  ├── User thinks registration failed                         │
│  └── May register again (duplicate)                          │
│                                                               │
│  Risk: HIGH                                                   │
│  Blast radius: Authentication                                │
│                                                               │
│  Run: /siftcoder:chaos run db-partition                      │
│                                                               │
│                                                               │
│  SCENARIO 3: "Memory Leak Pressure"                          │
│  ─────────────────────────────────────────────────────────   │
│  What: Gradual memory consumption in worker process          │
│                                                               │
│  Why test this:                                               │
│  ├── Cache in src/cache/memory.ts has no eviction           │
│  ├── No max size configured                                  │
│  ├── Worker processes have 512MB limit                       │
│  └── OOM will crash without graceful shutdown                │
│                                                               │
│  Predicted impact:                                            │
│  ├── Worker OOM after ~2000 requests                        │
│  ├── Background jobs fail                                    │
│  ├── No retry (jobs lost)                                    │
│  └── Email notifications stop                                │
│                                                               │
│  Risk: MEDIUM                                                 │
│  Blast radius: Background jobs                               │
│                                                               │
│  Run: /siftcoder:chaos run memory-pressure                   │
│                                                               │
│                                                               │
│  SCENARIO 4: "DNS Resolution Failure"                        │
│  ─────────────────────────────────────────────────────────   │
│  What: External API DNS fails for 30 seconds                 │
│                                                               │
│  Why test this:                                               │
│  ├── No DNS caching configured                               │
│  ├── Each request does fresh lookup                          │
│  ├── DNS failure = total service failure                     │
│  └── No retry with backoff                                   │
│                                                               │
│  Predicted impact:                                            │
│  ├── All external API calls fail                            │
│  ├── Cryptic "ENOTFOUND" errors                             │
│  ├── Users see "Something went wrong"                        │
│  └── No actionable error message                             │
│                                                               │
│  Risk: MEDIUM                                                 │
│  Blast radius: All external integrations                     │
│                                                               │
└───────────────────────────────────────────────────────────────┘

┌─ SCENARIO SUMMARY ───────────────────────────────────────────┐
│                                                               │
│  Total scenarios identified: 12                              │
│  High risk: 4                                                │
│  Medium risk: 5                                              │
│  Low risk: 3                                                 │
│                                                               │
│  Recommended test order:                                      │
│  1. stripe-outage (most likely to occur)                    │
│  2. db-partition (hardest to detect)                        │
│  3. memory-pressure (slowest to manifest)                   │
│                                                               │
└───────────────────────────────────────────────────────────────┘

[Run Scenario 1] [View All] [Generate Gameday] [Fix Weaknesses]
```

### Command: `run <scenario>`

Execute a chaos experiment:

```
/siftcoder:chaos run stripe-outage
```

```
CHAOS EXPERIMENT: stripe-outage
═══════════════════════════════════════════════════════════════

╔══════════════════════════════════════════════════════════════╗
║  WARNING: This will inject failures into your system         ║
║  Ensure you're running in a SAFE environment                 ║
╚══════════════════════════════════════════════════════════════╝

Environment check:
  ├── NODE_ENV: development ✓
  ├── Database: test database ✓
  └── External APIs: mocked ✓

Proceed with chaos experiment? [yes/no]: yes


INJECTING CHAOS
─────────────────────────────────────────────────────────────────

Phase 1: Setup (0s)
  ✓ Creating Stripe mock that returns 503
  ✓ Setting up monitoring
  ✓ Baseline metrics captured

Phase 2: Injection (0-60s)
  [00:00] Chaos injected - Stripe now returning 503
  [00:05] First checkout attempt...
  [00:05] OBSERVATION: Request hung (no timeout triggered)
  [00:30] OBSERVATION: Still waiting (30s elapsed)
  [00:35] OBSERVATION: Finally timed out after 35s
  [00:35] OBSERVATION: Error: "ETIMEDOUT"
  [00:35] OBSERVATION: No user-friendly error shown
  [00:35] OBSERVATION: Cart state: CORRUPTED (partial update)
  [00:60] Chaos injection complete

Phase 3: Recovery (60-90s)
  [01:00] Stripe mock restored to healthy
  [01:05] Testing recovery...
  [01:05] OBSERVATION: First request after recovery succeeded
  [01:10] System recovered


EXPERIMENT RESULTS
═══════════════════════════════════════════════════════════════

Hypothesis: System handles Stripe outage gracefully
Result: FAILED

┌─ FINDINGS ───────────────────────────────────────────────────┐
│                                                               │
│  [CRITICAL] No timeout - users wait 35+ seconds              │
│  ├── Expected: 5-10 second timeout                           │
│  ├── Actual: 35 seconds                                      │
│  └── Fix: Add timeout to Stripe client                       │
│                                                               │
│  [CRITICAL] Cart corruption on failure                       │
│  ├── Cart items marked as "reserved"                        │
│  ├── Payment failed, but reservation not released           │
│  └── Fix: Use transaction or saga pattern                   │
│                                                               │
│  [HIGH] No user-friendly error                               │
│  ├── User sees generic "Something went wrong"               │
│  ├── No suggestion to retry                                 │
│  └── Fix: Add specific payment error handling               │
│                                                               │
│  [MEDIUM] No retry mechanism                                 │
│  ├── First failure = final failure                          │
│  ├── Temporary outages cause permanent failures             │
│  └── Fix: Add retry with exponential backoff                │
│                                                               │
└───────────────────────────────────────────────────────────────┘

┌─ RECOMMENDED FIXES ──────────────────────────────────────────┐
│                                                               │
│  1. Add 10-second timeout to Stripe client                  │
│     File: src/payments/stripe.ts                            │
│     Effort: 5 minutes                                        │
│                                                               │
│  2. Implement checkout transaction                           │
│     File: src/checkout/flow.ts                              │
│     Effort: 2-3 hours                                        │
│                                                               │
│  3. Add retry with backoff                                  │
│     File: src/payments/stripe.ts                            │
│     Effort: 30 minutes                                       │
│                                                               │
│  4. Improve error messages                                   │
│     File: src/checkout/errors.ts                            │
│     Effort: 1 hour                                           │
│                                                               │
└───────────────────────────────────────────────────────────────┘

[Apply All Fixes] [Apply Critical Only] [Schedule Retest] [Export]
```

### Command: `gameday`

Generate a chaos gameday plan:

```
/siftcoder:chaos gameday
```

```
CHAOS GAMEDAY PLAN
═══════════════════════════════════════════════════════════════

A structured half-day exercise to test system resilience.


PREPARATION (Before Gameday)
─────────────────────────────────────────────────────────────────

  [ ] Notify team of gameday date/time
  [ ] Ensure staging environment is isolated
  [ ] Set up monitoring dashboards
  [ ] Prepare rollback procedures
  [ ] Brief on-call engineer


SCHEDULE
─────────────────────────────────────────────────────────────────

  09:00 - 09:15  Kickoff & Safety Check
                 Verify environment, confirm participants

  09:15 - 09:45  Scenario 1: External API Failure
                 Inject: Stripe 503 for 2 minutes
                 Observe: User experience, error handling
                 Recover: Restore API, verify recovery

  09:45 - 10:00  Break & Debrief

  10:00 - 10:30  Scenario 2: Database Latency
                 Inject: 5 second query delay
                 Observe: Page load times, timeouts
                 Recover: Remove delay, verify performance

  10:30 - 10:45  Break & Debrief

  10:45 - 11:15  Scenario 3: Memory Pressure
                 Inject: Consume 80% of available memory
                 Observe: App behavior, OOM handling
                 Recover: Release memory, verify stability

  11:15 - 11:30  Break & Debrief

  11:30 - 12:00  Scenario 4: Cascading Failure
                 Inject: Kill primary database
                 Observe: Failover behavior, data integrity
                 Recover: Restore primary, verify sync

  12:00 - 12:30  Retrospective
                 Document findings, prioritize fixes


RUNBOOK FOR EACH SCENARIO
─────────────────────────────────────────────────────────────────

For each scenario:
  1. Announce: "Injecting [scenario name] in 30 seconds"
  2. Inject: Run the chaos command
  3. Observe: Watch dashboards, try user flows
  4. Document: Note unexpected behaviors
  5. Recover: Remove chaos injection
  6. Verify: Confirm system is healthy
  7. Debrief: Quick discussion of observations


SUCCESS CRITERIA
─────────────────────────────────────────────────────────────────

Green (Passed):
  • Error messages are user-friendly
  • No data corruption
  • Recovery is automatic
  • Alerts fired appropriately

Yellow (Degraded):
  • Slow but functional
  • Manual intervention needed
  • Some features unavailable

Red (Failed):
  • Complete outage
  • Data corruption
  • No recovery without restart
  • No alerts


[Export as PDF] [Schedule in Calendar] [Create Tickets]
```

## Configuration

```json
{
  "chaos": {
    "safeEnvironments": ["development", "staging"],
    "requireConfirmation": true,
    "maxDuration": 300,
    "autoRecover": true,
    "notifyOnRun": ["#engineering"],
    "scenarios": {
      "custom": []
    }
  }
}
```

## Integration

Works well with:
  • `/siftcoder:heal` - Auto-fix found weaknesses
  • `/siftcoder:monitor` - Set up alerting for failures
  • `/siftcoder:test` - Add resilience tests
  • `/siftcoder:document` - Document failure modes
