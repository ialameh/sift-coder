---
name: codemap-trust
description: Use to assess confidence/risk per module. "Which parts of this codebase can I trust", "where's the risk concentrated". Outputs a trust map with reasoning.
---

# codemap-trust

Per-module trust assessment. Where can you confidently ship? Where do you tread carefully?

## Trust signals

- **Test coverage** — high cov = high signal (but coverage ≠ correctness)
- **Test quality** — assertions per test, edge case coverage, behaviour vs implementation
- **Churn** — high churn + low cov = unstable
- **Bus factor** — single committer = fragile
- **Documentation** — public API documented = trustworthy
- **Recent incidents** — `mem_search { kind: incident }` per module
- **Dependency stability** — pinned vs ^x.y.z; deps with security advisories
- **Type strictness** — `any` count per module

## Method

1. **Extract signals** per module via `Bash` (coverage report, git log, type-check output).
2. **Score** each module 0-5 per signal.
3. **Aggregate** to a trust score 0-5.
4. **Reason** for the score — name the strongest negative + strongest positive.
5. **Risk register** — modules at trust < 3 are flagged with mitigation.

## Output shape

```
Codebase:   <repo>

Trust scores:

  src/memory/         ⭐⭐⭐⭐⭐  (5/5)  high cov, recent activity, no incidents
  src/core/           ⭐⭐⭐⭐⭐  (5/5)  100% cov, recent
  src/services/       ⭐⭐⭐⭐☆  (4/5)  ported recently, some deps haven't run in CI
  src/utils/          ⭐⭐⭐⭐⭐  (5/5)  
  src/llm/            ⭐⭐☆☆☆  (2/5)  empty stubs only — placeholder

Risk register:
  src/llm/            unimplemented; flag for Phase E completion
                      Mitigation: scope out + complete stubs OR document as TODO

Trends:
  - Strong test culture across kept modules
  - One module (llm) needs completion before public release
```

## Rules

- **Score per signal.** Aggregate with reasoning, not handwave.
- **Risk register has mitigations.** Flagging without action is noise.
- **Trends matter.** Snapshot is one moment; trend reveals direction.
- **Compare to previous trust assessment** if one exists. Improvement / decline is interesting.

## Anti-patterns

- Aggregate-only score without per-signal breakdown
- Treating coverage as the only signal
- Ignoring memory of incidents per module
- Risk register without mitigations

## When NOT to use

- Tiny project — manual judgement faster
- All modules already trusted — overkill
- Pre-launch — by definition many modules are immature; trust grows

## Subagent dispatch

- `Bash` for signal extraction
- `Explore` for type-strictness sampling
- Memory MCP for incident lookups

## Value over native CC

CC will discuss code quality. CC won't naturally produce structured per-module trust scores with multi-signal reasoning. The structure IS the value — feeds prioritisation.
