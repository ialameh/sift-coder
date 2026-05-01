---
name: chaos
description: Use to design failure scenarios for resilience testing. AI generates failure modes tailored to the actual stack — DB outage, slow downstream, partial deploy, region failover. Output is a runbook of "what should happen if X fails".
---

# chaos

Designed failure injection. Tailored to the actual stack — not generic "kill a pod". Outputs scenarios + expected behaviour + observability assertions.

## Method

1. **Stack pass.** Detect: DB(s), queues, caches, external APIs, regions, deploy strategy, feature flags. Foundation for tailored scenarios.
2. **Failure-mode brainstorm** (per dependency):
   - **Slow** — adds latency
   - **Down** — fully unreachable
   - **Wrong** — returns valid-looking but incorrect data
   - **Flaky** — alternates pass/fail
   - **Partial** — some operations succeed, some fail
3. **For each scenario:**
   - Trigger (how to reproduce in test/staging)
   - Expected user-visible behaviour (graceful? degraded? error message?)
   - Expected observability signal (alert? log line? metric?)
   - Recovery path (auto? manual?)
4. **Prioritise.** P0 (user-facing data loss / security), P1 (degraded UX), P2 (internal noise).
5. **Output runbook.** One scenario per page; runnable.

## Output shape

```
Stack:    <detected — DB, queues, caches, deps>

Scenario #1  [P0]  <name — e.g. "primary DB unreachable">
  Trigger:        <iptables block | toxiproxy | feature flag>
  Expected UX:    <what user sees>
  Expected obs:   <alert name, log line, metric>
  Recovery:       <auto | manual + steps>
  Test:           <how to assert it works as expected>

Scenario #2  ...
```

## Rules

- **Prod-realistic, not toy.** Don't propose chaos that can't be triggered in a real environment.
- **Expected behaviour is concrete.** "Graceful degradation" is not enough — name the actual signal.
- **Observability is part of the contract.** If failure has no signal, that's a finding (add observability before chaos).
- **Don't actually run chaos in prod without explicit approval.** Output is a plan; execution is gated.

## Anti-patterns

- Generic "kill a pod" scenarios that ignore the real architecture
- "It should fail gracefully" without naming the gracefulness signal
- Test-only scenarios (real chaos lives in staging at minimum)
- Recommending chaos in services without prior load testing

## When NOT to use

- New service, no production traffic — load-test first
- Already running game-day frameworks — don't reinvent
- Single-machine local dev — chaos is for distributed systems

## Subagent dispatch

- `Explore` to detect the stack
- `Plan` to sequence the scenarios
- `general-purpose` for runbook generation

## Value over native CC

CC will list failure modes. CC won't naturally tailor to the actual stack, prioritise by impact, or produce runbook-shape output with observability assertions. The structure IS the value.
