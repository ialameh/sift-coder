---
name: knowledge
description: Use for org/project-wide knowledge curation — what do we collectively know, what's drifting stale, what's new since last review. Operates on memory store as a whole, not one query.
---

# knowledge

Whole-store curation. Different from `pattern-search` (one query) — this skill takes inventory of what's known and surfaces drift.

## Method

1. **Snapshot.** Total summaries by category (decisions, patterns, incidents, refactors). `mem_search` aggregations.
2. **Topic clusters.** Group summaries semantically. Top 10 clusters by size.
3. **Hot vs cold.**
   - **Hot** — touched/retrieved in last 30 days
   - **Warm** — last 90
   - **Cold** — older
4. **Stale check.** For each cluster, sample 3 summaries; verify they still match current code (does the file exist? is the symbol still there?). Flag stale.
5. **New since last review.** Diff against previous knowledge snapshot.

## Output shape

```
Memory snapshot at: <ISO timestamp>

Totals:
  Decisions:   N
  Patterns:    N
  Incidents:   N
  Refactors:   N
  Other:       N

Top clusters:
  1. <topic> — N summaries, hot
  2. <topic> — N summaries, warm
  3. <topic> — N summaries, cold (consider archive?)
  ...

Stale findings:
  - <summary id>: refers to file <path> — file no longer exists
  - <summary id>: refers to symbol <name> — not found in repo
  
New since last snapshot:
  - <count> summaries added
  - <count> patterns captured
  - <count> incidents pinned

Recommendations:
  - Run /siftcoder:mem prune to address stale (memory-curator agent reviews first)
  - Cold cluster <topic> — archive or revisit?
```

## Rules

- **Don't auto-prune.** Surface; let user decide.
- **Stale ≠ wrong.** Stale flag triggers review, not deletion.
- **Cluster by semantic similarity, not exact-match.** Use embedding distance.
- **Compare to last snapshot** if one exists. Drift over time is the interesting signal.

## Anti-patterns

- Auto-deleting cold summaries (loss aversion warranted; use `memory-curator`)
- Treating every memory as equally valuable
- Overwhelming output with raw counts; pick what's actionable

## When NOT to use

- Specific question — `mem_search` directly
- Just-onboarded user — `/siftcoder:onboard` instead
- Daily — overkill; this is weekly/monthly hygiene

## Subagent dispatch

- `memory-curator` agent for actual prune-recommendations
- Memory MCP throughout

## Value over native CC

CC won't naturally take inventory of the memory store, cluster, detect drift, or compare snapshots over time. The aggregate-curation IS the value.
