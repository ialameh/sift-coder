# Operations

This tab is what you read after the install works and the demo wears off. It covers the actual day-to-day: when to drain, when to backfill, how to read the web UI, how much it costs, what to do when the daemon goes quiet.

The chapters are roughly ordered by how often you'll touch them. The first three you'll read once and refer back to occasionally. The last three you'll grep when something is broken.

- [Daily workflow](daily-workflow.md) — what a normal Tuesday with SiftCoder running looks like, including the few moments you actually interact with it.
- [Backfill](backfill.md) — replaying your existing `~/.claude/projects/` transcripts into memory so the daemon isn't empty on day one.
- [Drain](drain.md) — moving events from `raw` to `summarized`, and what to do when the queue stops moving.
- [Web UI](web-ui.md) — the read-only HTTP bridge, what it shows, and why it's the fastest way to convince yourself capture is real.
- [Monitoring](monitoring.md) — the daemon health monitor, what healthy looks like, what unhealthy looks like, and how to wire your own checks.
- [Pruning](pruning.md) — running the `memory-curator` agent monthly to dedupe, merge, and trim stale rows without touching your code.
- [Cost](cost.md) — the actual levers (backend, embedder, batch size, tick interval) and worked numbers for what this thing costs to run.
- [Troubleshooting](troubleshooting.md) — symptoms and fixes, table-format. The chapter you'll bookmark.

If something here contradicts the [Reference](../reference/index.md) tab, the reference wins — it tracks the source. File a docs bug.
