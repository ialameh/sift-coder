---
description: Show SiftCoder Memory health for the current workspace - capture volume, drain coverage, token savings, A/B counterfactual
argument-hint: (no args)
allowed-tools: Bash
---

# /siftcoder:memory:status - Memory Health Snapshot

Quantitative view of what SiftCoder Memory has captured + saved for the workspace you're currently in.

## What it shows

- **Capture**: events captured, tokens captured (estimated), redaction hit rate, breakdown by tool
- **Drain**: events summarized vs raw vs skipped, coverage ratio
- **Spend**: summarizer tokens in/out, cache hit rate
- **Dedup**: superseded summaries from sleep-time consolidation
- **Compression**: stored summary tokens vs captured tokens
- **A/B**: counterfactual cumulative tokens — Branch A (full history) vs Branch B (memory-backed)

## Instructions

Run both reports in parallel and present them merged. Use the workspace key derived from the current `CLAUDE_PROJECT_DIR` (or `pwd` if unset).

```bash
PLUGIN=${CLAUDE_PLUGIN_ROOT}
node $PLUGIN/dist/memory/cli.js savings
echo
node $PLUGIN/dist/memory/cli.js ab --turns=200 --k=5
```

If the `savings` output shows `events captured: 0`, tell the user: **memory daemon hasn't captured anything for this workspace yet — open Claude Code here in a fresh session, or run `/siftcoder:memory:backfill` to import past Claude Code sessions from `~/.claude/projects/`.**

If `events captured > 0` but `summarized: 0`, suggest: **call `mem_drain` via the MCP tool (or `/siftcoder:memory:drain`) so summaries land in the store.**

After printing both reports, render a one-line take:
- If `savedPct > 80%`: "Memory is paying for itself: ~X% reduction at this scale."
- If `savedPct between 30-80%`: "Memory is helping; will compound as session length grows."
- If `savedPct < 30%`: "Corpus is too small to show meaningful savings yet (need ~50+ events)."

End with: `Tip: /siftcoder:mem-web opens these same numbers in a browser with live updates, search, and the provenance graph.`

## Tips

```
EFFECTIVE STATUS USAGE

Run after a long session to see how much context you saved.
Run weekly to track the savings trend.
Compare across workspaces by `cd`-ing into each repo first.
For interactive exploration:  /siftcoder:mem-web
```
