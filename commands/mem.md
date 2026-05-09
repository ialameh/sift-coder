---
description: SiftCoder memory daemon control — single multi-verb command
argument-hint: <action> [args]
allowed-tools: Bash
---

# /siftcoder:mem

Single entry point for memory daemon operations. 

## Actions

| Action | Effect |
|---|---|
| `start` | Spawn the daemon detached (idempotent) |
| `stop` | Stop the daemon for this workspace |
| `status` | Show health, counts, backend cascade choices |
| `info [--json]` | Full runtime details: version, daemon pid/uptime, namespace, workspace, paths, backends, counts, db size |
| `version` | Print version only |
| `check` | Verify daemon reachable; auto-start if not |
| `setup` | Interactive first-time setup (Ollama probe, Anthropic key, config) |
| `drain [batch]` | Force a drain pass (default batch=32) |
| `backfill [source]` | Backfill from past Claude Code transcripts |
| `prune [--days N] [--superseded]` | Drop skipped events older than N days (default 7); `--superseded` also drops dedup losers |
| `retry [N]` | Re-queue skipped events for another drain pass (optionally first N) |
| `web` | Print web UI URL for browser inspection |
| `list` | List recent summaries |

## Examples

```
/siftcoder:mem status
/siftcoder:mem info
/siftcoder:mem info --json
/siftcoder:mem drain 64
/siftcoder:mem setup
/siftcoder:mem backfill transcripts
```

## Implementation

Run the bundled CLI:

```bash
node ${CLAUDE_PLUGIN_ROOT}/bin/siftcoder.mjs $ARGUMENTS
```
