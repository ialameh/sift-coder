# /siftcoder:monitor - Production Insights & Observability

Analyze logs, errors, and production behavior.

## Usage

```
/siftcoder:monitor [subcommand] [input]
```

## Subcommands

| Subcommand | Description |
|------------|-------------|
| `logs` | Analyze log patterns (default) |
| `errors` | Cluster and analyze errors |
| `alerts` | Alert fatigue analysis |
| `trace` | Distributed trace analysis |
| `health` | System health assessment |

## Arguments
- `$ARGUMENTS` - Subcommand and log file/pattern/trace ID

## Instructions

You are a production expert. Help developers understand production behavior, diagnose issues, and improve observability.

---

## Phase 0: Interactive Setup

**Use AskUserQuestion tool:**
```
Question: "What production insight do you need?"
Header: "Focus"
Options:
- "Analyze Logs" - "Find patterns, anomalies in log files"
- "Error Analysis" - "Group and diagnose production errors"
- "Alert Review" - "Reduce alert fatigue, tune alerting"
- "Trace Analysis" - "Debug distributed system issues"
```

---

## Subcommand: logs

### Log Pattern Analysis

```
/siftcoder:monitor logs /var/log/app/production.log
```

```
LOG ANALYSIS REPORT
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Log file: /var/log/app/production.log
Size: 2.4 GB
Time range: 2026-01-09 00:00 - 2026-01-10 12:00
Total entries: 4,234,567

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

LOG LEVEL DISTRIBUTION

┌─────────────────────────────────────────────────────────────┐
│ INFO    ██████████████████████████████████████  78.2%      │
│ WARN    ████████░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░  15.4%      │
│ ERROR   ███░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░   5.8%      │
│ DEBUG   ░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░   0.6%      │
└─────────────────────────────────────────────────────────────┘

⚠ Warning: 5.8% error rate is HIGH
  Industry benchmark: < 1%
  Investigate error patterns below

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

TOP ERROR PATTERNS

1. Database Connection Timeout (42% of errors)
   Count: 103,456
   Pattern: "ETIMEDOUT connecting to database"

   First occurrence: 2026-01-09 14:23:45
   Last occurrence: 2026-01-10 11:58:32
   Frequency: ~3/minute (sustained)

   Sample:
   ```
   [2026-01-09T14:23:45.123Z] ERROR: Database connection timeout
     Error: ETIMEDOUT
     Host: db-primary.internal
     Pool: 10/10 connections in use
     Wait time: 30001ms
   ```

   DIAGNOSIS:
   ├── Connection pool exhaustion
   ├── Possibly slow queries holding connections
   └── Database may be under heavy load

   RECOMMENDATIONS:
   → Check slow query log
   → Increase pool size temporarily
   → Review query patterns during peak

2. Payment Gateway 503 (28% of errors)
   Count: 68,543
   Pattern: "Payment service unavailable"

   Spike: 2026-01-09 16:00 - 16:45 (98% of these errors)

   DIAGNOSIS:
   ├── Stripe outage during this window
   ├── Check status.stripe.com for incident
   └── Retry logic may need tuning

3. Rate Limit Exceeded (18% of errors)
   Count: 44,123
   Pattern: "429 Too Many Requests"

   Source IPs: 3 IPs responsible for 89%
   ├── 192.168.1.100 (internal - legitimate?)
   ├── 45.33.32.156 (external - possible abuse)
   └── 45.33.32.157 (external - possible abuse)

   RECOMMENDATIONS:
   → Review rate limit thresholds
   → Investigate external IPs (possible attack)
   → Check internal IP for misconfigured service

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

ANOMALY DETECTION

TRAFFIC ANOMALY: 2026-01-09 14:00 - 15:00
├── Request volume: 3x normal
├── Error rate spiked to 15%
├── Correlation: Marketing email sent at 13:55
└── Action: Scale capacity before campaigns

LATENCY ANOMALY: 2026-01-10 02:00 - 03:00
├── P95 latency: 2500ms (normal: 200ms)
├── Correlation: Database backup running
└── Action: Schedule backups during lower traffic

NEW ERROR TYPE: First seen 2026-01-10 08:23
├── "OAuth token refresh failed"
├── Count: 234 (growing)
├── Affected users: 45
└── Action: Investigate OAuth provider or token logic

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

REQUEST PATTERNS

Most common endpoints:
├── GET /api/products (34%) - avg 45ms
├── GET /api/users/me (23%) - avg 12ms
├── POST /api/cart (15%) - avg 89ms
├── POST /api/checkout (8%) - avg 456ms ⚠ SLOW
└── GET /api/orders (7%) - avg 234ms

Slowest endpoints (P95):
├── POST /api/checkout: 2340ms
├── GET /api/reports/sales: 1890ms
├── POST /api/orders/bulk: 1234ms
└── GET /api/search: 890ms

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

RECOMMENDATIONS

IMMEDIATE:
1. Investigate database connection pool exhaustion
2. Review rate limiting for suspicious IPs
3. Check OAuth token refresh logic

SHORT-TERM:
4. Optimize checkout endpoint (too slow)
5. Add capacity planning for marketing campaigns
6. Reschedule database backups

LONG-TERM:
7. Implement better retry logic for external services
8. Add circuit breaker for payment gateway
9. Set up anomaly alerting
```

---

## Subcommand: errors

### Error Clustering and Analysis

```
/siftcoder:monitor errors
```

```
ERROR CLUSTERING ANALYSIS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Analyzing error reports from last 7 days...

Total errors: 15,234
Unique patterns: 47
Clusters: 12

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

ERROR CLUSTERS (by impact)

CLUSTER 1: Payment Processing Failures
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Count: 4,567 (30% of errors)
Impact: $45,000 estimated lost revenue
Affected users: 2,341
Trend: ↑ Increasing

Error variants:
├── "Card declined" (45%)
├── "Payment timeout" (32%)
├── "Invalid card number" (18%)
└── "Fraud check failed" (5%)

Stack trace signature:
```
PaymentError: Card declined
  at StripeService.charge (src/services/stripe.ts:89)
  at CheckoutService.processPayment (src/services/checkout.ts:123)
  at CheckoutController.complete (src/controllers/checkout.ts:45)
```

ROOT CAUSE ANALYSIS:
├── "Card declined" - User issue, expected
├── "Payment timeout" - Network/Stripe latency
├── "Invalid card" - Frontend validation gap
└── "Fraud check" - Overly aggressive rules

RECOMMENDED FIXES:
1. Add retry with backoff for timeouts
2. Improve frontend card validation
3. Review fraud check thresholds

→ /siftcoder:fix "Payment timeout handling"

CLUSTER 2: Database Deadlocks
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Count: 2,345 (15% of errors)
Impact: Degraded performance, user frustration
Trend: → Stable (recurring pattern)

Time correlation:
├── 90% occur between 14:00-16:00 UTC
├── Coincides with batch job execution
└── Peak concurrent users

Involved tables:
├── orders (45%)
├── inventory (35%)
├── users (20%)

ROOT CAUSE:
Batch inventory update conflicts with user orders

RECOMMENDED FIX:
1. Use SKIP LOCKED for batch processing
2. Reduce transaction scope
3. Implement optimistic locking

→ /siftcoder:fix "Database deadlock in order processing"

[... more clusters ...]

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

ERROR TIMELINE

```
Errors/hour over last 24 hours:

  500 ┤
      │              ╭─╮
  400 ┤     ╭──╮    ╱   ╲
      │    ╱    ╲  ╱     ╲
  300 ┤   ╱      ╲╱       ╲
      │  ╱                  ╲
  200 ┤ ╱                    ╲
      │╱                      ╲
  100 ┤                        ╲___________
      │
    0 ┼──────────────────────────────────────
      00:00    06:00    12:00    18:00    24:00
```

SPIKE ANALYSIS:
├── 14:00 spike: Marketing campaign traffic
├── 16:00 spike: Batch job + user traffic collision
└── 08:00 dip: Low traffic, good time for deployments

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

PRIORITIZED ACTION ITEMS

| Priority | Error Cluster | Impact | Effort | Action |
|----------|--------------|--------|--------|--------|
| P0 | Payment timeouts | High | Low | Add retry logic |
| P0 | Database deadlocks | High | Medium | Query optimization |
| P1 | OAuth failures | Medium | Low | Token refresh fix |
| P2 | Rate limiting | Low | Low | Threshold tuning |
```

---

## Subcommand: alerts

### Alert Fatigue Analysis

```
/siftcoder:monitor alerts
```

```
ALERT FATIGUE ANALYSIS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Analyzing alerts from last 30 days...

Total alerts: 12,456
Unique alert types: 89
Actionable rate: 23% ⚠ (target: >70%)

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

ALERT FATIGUE INDICATORS

High frequency alerts (noise):
├── "CPU > 80%" - 4,567 alerts (0 incidents)
├── "Memory > 85%" - 2,345 alerts (0 incidents)
├── "Request latency > 500ms" - 1,234 alerts (3 incidents)
└── "Error rate > 1%" - 890 alerts (12 incidents)

Alert efficiency:
┌─────────────────────────────────────────────────────────────┐
│ Alert                    Alerts  Incidents  Efficiency      │
├─────────────────────────────────────────────────────────────┤
│ CPU > 80%                 4,567         0        0% ❌      │
│ Memory > 85%              2,345         0        0% ❌      │
│ Latency > 500ms           1,234         3      0.2% ❌      │
│ Error rate > 1%             890        12      1.3% ⚠       │
│ Disk > 90%                   45        42       93% ✓       │
│ Payment failures > 10/min    34        28       82% ✓       │
│ Database connections full    12        12      100% ✓       │
└─────────────────────────────────────────────────────────────┘

RECOMMENDATIONS:

1. CPU > 80% alert
   Current: Alert at 80% for 1 minute
   Problem: Normal during deployments, spikes
   Fix: Change to 95% sustained for 10 minutes
   OR: Remove (auto-scaling handles it)

2. Memory > 85% alert
   Current: Alert at 85%
   Problem: Normal after GC cycles
   Fix: Change to 95% sustained, or trend-based

3. Latency > 500ms alert
   Current: Any request > 500ms
   Problem: Some endpoints are legitimately slow
   Fix: Per-endpoint P95 thresholds

4. Error rate > 1% alert
   Current: 1% over 1 minute
   Problem: Spikes from single bad request
   Fix: 5% over 5 minutes, or anomaly-based

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

ALERT TUNING SUGGESTIONS

REMOVE (noise, no value):
├── CPU > 80% (auto-scaling handles)
└── Memory > 85% (too sensitive)

ADJUST THRESHOLDS:
├── Latency: 500ms → 2000ms P95, 5min window
├── Error rate: 1% → 5%, 5min window
└── Add per-service breakdown

ADD NEW ALERTS:
├── Payment success rate < 95%
├── User signup conversion drop > 10%
├── API response time trend increasing
└── New error type detected

IMPLEMENT:
├── Anomaly detection (vs static thresholds)
├── Alert grouping (reduce duplicates)
├── Escalation policies (not everything is P0)
└── On-call rotation fairness
```

---

## Subcommand: health

### System Health Assessment

```
/siftcoder:monitor health
```

```
SYSTEM HEALTH REPORT
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Overall Health: 87% ⚠

┌─────────────────────────────────────────────────────────────┐
│ Component         Status    Health    Issues               │
├─────────────────────────────────────────────────────────────┤
│ Web Servers       ✓ UP       95%      High memory on ws-3  │
│ API Servers       ✓ UP       92%      Latency elevated     │
│ Database          ⚠ WARN     78%      Connection pool full │
│ Cache (Redis)     ✓ UP       98%      -                    │
│ Queue (RabbitMQ)  ✓ UP       95%      Queue growing        │
│ Search (ES)       ✓ UP       88%      Index lag            │
│ CDN               ✓ UP       99%      -                    │
│ Payment Provider  ✓ UP       100%     -                    │
└─────────────────────────────────────────────────────────────┘

CRITICAL ISSUES:

1. Database Connection Pool
   Status: 48/50 connections in use
   Risk: New requests will fail at 50/50
   Action: Increase pool size or optimize queries

2. Background Queue Growing
   Current depth: 12,456 messages
   Normal depth: < 1,000
   Processing rate: 100/sec (need 200/sec)
   Action: Scale workers or investigate slow jobs

WARNINGS:

3. Web Server ws-3 Memory
   Current: 7.2 GB / 8 GB (90%)
   Trend: Increasing 100 MB/hour
   Likely cause: Memory leak
   Action: Investigate, prepare to restart

4. API Latency Elevated
   Current P95: 450ms
   Baseline P95: 200ms
   Cause: Database latency propagating
   Action: Address database issues first

UPCOMING CONCERNS:

5. Disk Space (14 days)
   Current: 70% used
   Growth rate: 2%/day
   Action: Set up log rotation, archive old data

6. SSL Certificate (30 days)
   Expires: 2026-02-10
   Action: Renew certificate

POSITIVE NOTES:
✓ No downtime in last 30 days
✓ Error rate below SLA
✓ CDN cache hit rate excellent (94%)
```

---

## Tips & Hints

```
LOG ANALYSIS BEST PRACTICES

Structured logging:
  → Use JSON format for parseability
  → Include: timestamp, level, service, requestId
  → Add context: userId, endpoint, duration

Log levels:
  → ERROR: Something failed, needs attention
  → WARN: Unexpected but handled
  → INFO: Normal operations
  → DEBUG: Development only (not in prod!)

What to log:
  → Request start/end with duration
  → Errors with stack traces
  → External service calls
  → Business events (order, payment)

What NOT to log:
  → Passwords, tokens, PII
  → Every request in detail
  → Large payloads

PRODUCTION DEBUGGING

Safe investigation:
  → Use read-only database replicas
  → Add temporary logging, don't change logic
  → Use feature flags for changes

Common issues:
  → Memory leak: Check for unbounded caches
  → Slow queries: Check indexes, N+1
  → Connection exhaustion: Pool size, timeouts

Alert best practices:
  → Alert on symptoms, not causes
  → Use anomaly detection when possible
  → Group related alerts
  → Have runbooks for each alert
```

---

## Skills Used
- **log-analyzer** - Pattern extraction
- **error-clusterer** - Error grouping
- **alert-analyzer** - Alert efficiency

## Allowed Tools
Read, Grep, Glob, Bash, Task, Write, AskUserQuestion
