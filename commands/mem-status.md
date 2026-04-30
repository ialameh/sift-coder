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

Run both reports in parallel and present them merged. Always pass `CLAUDE_PROJECT_DIR` explicitly so the workspace key resolves against the invoked directory, not whatever cwd the parent shell ended up at.

```bash
WS_CWD="${CLAUDE_PROJECT_DIR:-$(pwd)}"
PLUGIN=${CLAUDE_PLUGIN_ROOT}
CLAUDE_PROJECT_DIR="$WS_CWD" node $PLUGIN/dist/memory/cli.js savings
echo
CLAUDE_PROJECT_DIR="$WS_CWD" node $PLUGIN/dist/memory/cli.js ab --turns=200 --k=5
```

The CLI prints a `workspace: <key> (<cwd>)` banner on the first line of each report — surface that banner verbatim so the user sees which workspace is being summarized.

If the CLI exits with `no-data` / exit code 4 (no DB for this workspace yet), tell the user: **memory daemon hasn't captured anything for this workspace yet — open Claude Code here in a fresh session, or run `/siftcoder:memory:backfill` to import past Claude Code sessions from `~/.claude/projects/`.** Do NOT silently substitute another workspace.

If `events captured > 0` but `summarized: 0`, do NOT blindly suggest `mem_drain`. As of 2026-04-30, Claude Code 2.1.x does not implement MCP `sampling/createMessage`, so `mem_drain` returns "Method not found" against the default config. Tell the user: **"Capture working, drain blocked: Claude Code doesn't yet implement MCP sampling. Two paths: (a) raw-only mode — `mem_search` already works against captured payloads. (b) Set `SIFTCODER_DRAIN_FALLBACK=1` + `ANTHROPIC_API_KEY` and restart Claude Code to drain via direct Anthropic API. See `/siftcoder:memory:drain` docs."**

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
