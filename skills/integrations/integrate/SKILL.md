---
name: integrate
description: Use to design an integration between two systems. Pattern selection (sync/async/event/batch), error handling, idempotency, observability. Output is a plan + scaffold.
---

# integrate

Integration design. Pattern selection drives everything else.

## Pattern selection matrix

| Pattern | When | Tools |
|---|---|---|
| Sync request-reply | UI need-to-know now; idempotent fast | HTTP |
| Async fire-forget | Downstream slow; UI doesn't wait | queue / event |
| Pub/sub | Many consumers; real-time | Kafka / Pub/Sub API |
| Batch | Volume; off-hours | Bulk API / S3 / SFTP |
| CDC | DB-to-DB low-latency | Debezium / CDC |
| Streaming | Continuous events | gRPC stream / WebSocket |

Pick first; the rest of the design flows from this.

## Method

1. **Source + sink.** What's emitting; what's consuming.
2. **Volume + latency requirements.** RPS, p95 latency budget.
3. **Failure tolerance.** Loss-tolerant? Once-and-only? At-least-once?
4. **Ordering.** Required? Per-key? Global?
5. **Pattern pick.** From the matrix.
6. **Design:**
   - Auth between source and sink
   - Idempotency strategy (key, dedup window)
   - Retry policy (backoff, max attempts, dead-letter)
   - Observability (correlation id, latency histogram, error rate)
   - Schema evolution (versioning of the message shape)
7. **Scaffold.** Producer + consumer code skeletons.
8. **Test.** Contract test + chaos test (downstream slow/down).

## Output shape

```
# Integration: <source> → <sink>

## Requirements
- Volume:        <RPS>
- Latency p95:   <ms>
- Loss tolerance: <yes | no, exactly-once required>
- Ordering:      <none | per-key | global>

## Pattern
<chosen> — because <reason>

## Design
- Auth:        <how>
- Idempotency: <key, dedup window>
- Retry:       <policy>
- Observability:
  - Correlation: X-Request-Id propagated
  - Metrics: latency histogram, error rate, queue depth
  - Logs: structured ndjson w/ ids
- Schema versioning: <strategy>

## Failure modes
| Mode | Detection | Recovery |
|---|---|---|
| Downstream down | <signal> | <action> |
| Downstream slow | <signal> | <action> |
| Bad message | <signal> | DLQ + alert |

## Scaffold
- Producer: <path>
- Consumer: <path>
- Schema:   <path>

## Test plan
- Contract: <path>
- Chaos:    <path — uses /siftcoder:chaos>

## Memory
Captured: <id>
```

## Rules

- **Pattern picked first.** Backwards engineering = wasted code.
- **Failure-mode table mandatory.** "What happens if downstream is slow" must be answered upfront.
- **Idempotency for at-least-once.** No exceptions.
- **Observability not optional.** Correlation ids, metrics, structured logs.

## Anti-patterns

- Sync request-reply where async would do (back-pressure pain)
- Async without idempotency (duplicates inevitable)
- "We'll add monitoring later" (you won't until incident)
- Schema with no versioning strategy

## When NOT to use

- Same-process function call — not an integration
- Internal-only RPC inside a single deploy unit (lighter)
- Salesforce-internal — `/siftcoder:salesforce-flow` may cover

## Subagent dispatch

- `Plan` for the design
- `chaos` skill for failure mode design
- `api` skill if a new API is part of the integration

## Value over native CC

CC will design integrations. CC won't naturally force pattern-pick upfront, require failure-mode tables, or mandate observability. The structure IS the value — keeps integrations from becoming silent failure machines.
