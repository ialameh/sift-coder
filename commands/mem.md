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
| `pin <summaryId>` | Mark a summary as user-curated (exempt from supersede + decay) |
| `unpin <summaryId>` | Remove the curation mark |
| `pinned [N]` | List the most-recently pinned summaries (default 100) |
| `doctor [--json] [--heal]` | Health check; `--heal` repairs vec0 drift |
| `export <file>` | Dump events + summaries + embeddings + provenance to ndjson |
| `import <file>` | Load an ndjson snapshot (idempotent, INSERT OR IGNORE) |
| `search <query> [--k N] [--json]` | Hybrid search via the daemon |
| `federate-search <query> [--k N] [--prefix X] [--max-ws N]` | Cross-workspace federated search (consented workspaces only) |
| `symbol-search <kind:name \| term> [--k N] [--json]` | Match events by extracted code symbol |
| `stats [--day] [--json]` | Throughput, backlog ETA, cache hit rate, top tools |
| `web` | Print web UI URL for browser inspection |
| `list` | List recent summaries |
| `graph-subgraph <kind> <id> [--depth N] [--direction out\|in\|both] [--edge-type T] [--max-edges N] [--json]` | Extract a knowledge-graph subgraph around a node |
| `graph-hubs [--limit N] [--kind file\|symbol\|...] [--json]` | List the most-connected nodes in the provenance graph |
| `graph-path <fromKind> <fromId> <toKind> <toId> [--depth N] [--json]` | Shortest path between two graph nodes (undirected for connectivity) |

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
