---
name: monitor
description: Use to set up health monitoring for SiftCoder daemon, memory store, or external dependencies (Ollama, Anthropic API). Pairs with monitors/ directory.
---

# monitor

Health monitoring config. Pairs with V3's `monitors/` directory.

## Built-in monitors

- **memory-daemon-health** (`monitors/memory-daemon-health.mjs`) — pings UDS every 30s
  - Output: `~/.siftcoder/v3/health.ndjson`

## What this skill does

1. **Audit current monitoring.** What's running? What's logged? Are alerts firing?
2. **Recommend additions** based on stack:
   - Ollama latency monitor (if Ollama is in use)
   - Anthropic API rate-limit monitor (if API is in use)
   - Disk space on memory store dir
   - Database WAL size
3. **Create custom monitors** in `monitors/<name>.mjs` following the existing pattern.
4. **Aggregate.** A weekly digest of monitor signals.

## Method (set up custom)

1. Define metric + threshold + alert action.
2. Write `monitors/<name>.mjs`:
   - Imports: `node:net`, `node:fs`, etc.
   - Pings/measures on interval
   - Writes ndjson lines to log
3. Register in plugin manifest if it should auto-start (currently monitors are manual; could change).
4. Test locally; verify ndjson output.

## Output shape

```
Current monitors:
  ✓ memory-daemon-health  (active, last ping: <s ago>, latency: <ms>)

Recommended additions:
  - ollama-latency        — your stack uses Ollama; track p95 of /api/generate
  - anthropic-budget      — track tokens_used vs limit; alert at 80%
  - disk-space            — alert if ~/.siftcoder/v3 < 1GB free

Weekly digest:
  - daemon uptime: 99.4%
  - longest outage: 12 minutes (memory-rebuild)
  - peak ping latency: 45ms
```

## Rules

- **Lightweight monitors.** Hooks must finish in &lt; 1s.
- **Append, don't rotate** during run; log rotation handled separately.
- **Fail silent.** Monitor crashes shouldn't crash the user's session.
- **Surface only when threshold breached.** Noise = ignored monitors.

## Anti-patterns

- Monitor that fires every 1 second
- Logging full payloads (privacy risk)
- Alerting on every variance (alert fatigue)
- Custom monitor that takes 5 seconds (too heavy)

## When NOT to use

- No daemon running yet — `/siftcoder:onboard`
- No customisation needed — built-ins are fine
- Monitoring as an end (you want metrics in Grafana etc.) — export via `monitor` → forward, don't reinvent

## Subagent dispatch

- `Bash` for health-check probes
- File ops for custom monitor authoring

## Value over native CC

CC has no native monitor system for plugins. The built-in pattern + skill provide structured health visibility. The framework IS the value.
