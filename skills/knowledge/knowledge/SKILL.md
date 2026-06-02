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

## Fold session conventions into CLAUDE.md

The Stop hook may hint `N convention learnings this session — run /siftcoder:knowledge to fold into CLAUDE.md`. That hint is heuristic (marker + confidence floor over the session digest) and never writes. This is where the real fold-in happens, on demand:

1. **Pull this session's conventions.** `mem_session_digest { sessionId }` (or `mem_patterns`) → keep high-confidence decision/convention/gotcha summaries.
2. **Read the targets.** Root `CLAUDE.md`, plus the nearest subdirectory `CLAUDE.md` if the session's work was scoped to one module (pairs with `/siftcoder:codemap-claudemd`, which scaffolds the hierarchy).
3. **Draft a minimal delta.** Only conventions not already documented. Phrase each as a durable rule (imperative, file-scoped where it belongs), not a play-by-play of the session.
4. **Show the diff. Apply on approval only.** Never auto-write a tracked file. If the user declines, leave CLAUDE.md untouched — the knowledge survives in memory regardless.

Rule of thumb: a learning earns a CLAUDE.md line only if it will still be true next month and a new contributor would benefit. Session trivia stays in memory.

## Value over native CC

CC won't naturally take inventory of the memory store, cluster, detect drift, or compare snapshots over time. The aggregate-curation IS the value.
