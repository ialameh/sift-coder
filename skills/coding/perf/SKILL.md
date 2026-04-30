---
name: perf
description: Use for dedicated performance profiling — wall time, CPU, memory, allocation, query count, network. Different from /optimize (which assumes a target). Perf measures + reports; optimize fixes.
---

# perf

Dedicated performance measurement. Different from `/optimize` — perf produces a baseline + report; optimize uses that baseline to drive a fix.

## When this differs from /optimize

- `/perf` — measure + report; no code changes
- `/optimize` — measure + improve + verify (uses perf as input)

Use `/perf` first when you don't yet have a baseline. Use `/optimize` after.

## Method

1. **Pick metric.** Wall-time | CPU-time | memory | allocations | query count | network calls | latency p95 — pick the one that matters.
2. **Pick reproducible workload.** Synthetic test, real prod-shaped input, load-test scenario. **Same inputs every run** is non-negotiable.
3. **Pick tool per stack:**
   - Node: `--prof`, `clinic.js`, `0x`, `autocannon` (HTTP)
   - Python: `cProfile`, `py-spy`, `scalene`, `locust`
   - Go: `pprof`, `vegeta`, `hey`
   - Rust: `cargo flamegraph`, `criterion`
   - Browser: DevTools Performance, Lighthouse
   - Salesforce: debug log analysis (`/sf-debug parse`)
   - SQL: `EXPLAIN ANALYZE`
4. **Run multiple iterations.** Single-run numbers lie. Minimum N=5; report p50, p95, p99.
5. **Identify hotspots.** Top 5 functions / queries / endpoints by self-time or contribution.
6. **Capture baseline to memory** so future perf runs detect regression.

## Output shape

```
Workload:    <description, deterministic inputs>
Iterations:  N=10
Tool:        <profiler used>

Metrics:
  Wall p50:    142 ms
  Wall p95:    310 ms
  Wall p99:    520 ms
  CPU avg:     78%
  RSS peak:    245 MB
  Allocs/op:   18,400

Hotspots (top 5 by self-time):
  1. parseRequest         42% — src/server/parse.ts:88
  2. validateSchema       18% — src/schema/validate.ts:120
  3. <fn>                 12%
  4. <fn>                  8%
  5. <fn>                  5%

Query count (if applicable):
  N+1 detected:    yes — at src/users/list.ts:34 (200 queries for 1 list endpoint)

Recommendations:
  - Run /siftcoder:optimize on parseRequest (highest hotspot)
  - Fix N+1 at users/list.ts (cheap win)
  - Cache schema validation results (validateSchema is pure)

Baseline captured: <memory id>
```

## Rules

- **Multiple iterations always.** Single-run = noise.
- **Same inputs every run** for comparability.
- **Pick the metric that matters** — don't dump all of them.
- **Pareto rule** — top 5 hotspots cover usually 80%+ of cost.
- **Baseline captured to memory** so trend over time is visible.

## Anti-patterns

- "Faster" without numbers
- Single-run measurements
- Profiling in dev with debug builds (production-shape required)
- Mixing profiling with optimisation in the same pass (separate concerns)

## When NOT to use

- Already have baseline + target — `/optimize` skill
- Pure latency at edge — needs synthetic load testing, not local profiler
- Salesforce-specific perf — `/sf-debug parse` is more targeted

## Subagent dispatch

- `Bash` for profiler invocation
- `general-purpose` for hotspot synthesis
- Memory MCP for baseline + trend

## Value over native CC

CC will discuss performance. CC won't naturally insist on tool-per-stack, multi-iteration, deterministic-workload, top-N-hotspot-Pareto discipline. The discipline IS the value.
