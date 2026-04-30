---
description: SiftCoder memory daemon control — single multi-verb command
argument-hint: <action> [args]
allowed-tools: Bash
---

# /siftcoder:mem

Single entry point for memory daemon operations. Replaces V1's seven `mem-*` commands.

## Actions

| Action | Effect |
|---|---|
| `start` | Spawn the daemon detached (idempotent) |
| `stop` | Stop the daemon for this workspace |
| `status` | Show health, counts, backend cascade choices |
| `check` | Verify daemon reachable; auto-start if not |
| `setup` | Interactive first-time setup (Ollama probe, Anthropic key, config) |
| `drain [batch]` | Force a drain pass (default batch=32) |
| `backfill [source]` | Backfill from past Claude Code transcripts |
| `web` | Print web UI URL for browser inspection |
| `list` | List recent summaries |
| `prune --confirm` | Run memory-curator agent and prune flagged rows |

## Examples

```
/siftcoder:mem status
/siftcoder:mem drain 64
/siftcoder:mem setup
/siftcoder:mem backfill transcripts
```

## Implementation

Run the bundled CLI:

```bash
node ${CLAUDE_PLUGIN_ROOT}/bin/siftcoder.mjs $ARGUMENTS
```

For `prune`, dispatch to the `memory-curator` agent first, surface its report, and execute only on `--confirm`.
