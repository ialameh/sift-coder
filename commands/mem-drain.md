---
description: Drain pending captured events into summaries (requires ANTHROPIC_API_KEY today; MCP host sampling not yet supported by Claude Code)
argument-hint: [batch=N]
allowed-tools: Bash, mcp__plugin_siftcoder_siftcoder-memory__mem_drain
---

# /siftcoder:memory:drain - Summarize Pending Events

Calls the `mem_drain` MCP tool to convert raw captured events into searchable summaries.

## Reality check (verified 2026-04-30)

**Drain requires `ANTHROPIC_API_KEY` today.** The original design was: drain runs through Claude Code's MCP `sampling/createMessage`, host-billed, no plugin key. Verified empirically: **Claude Code CLI 2.1.x does not implement `sampling/createMessage` (JSON-RPC -32601 "Method not found")**. Until Claude Code ships sampling support, drain has two modes:

| Mode | Behavior | Setup |
|---|---|---|
| Default | Drain returns errors w/ `firstError: "Method not found"`. Raw events stay queryable via `mem_search` (BM25 + dense over payload text). No summaries, no provenance distillation. | None |
| Fallback | Drain runs against direct Anthropic API. Cost flows through your API key. | `export SIFTCODER_DRAIN_FALLBACK=1` and `export ANTHROPIC_API_KEY=...`, then restart Claude Code |

## When to use

- After a long session w/ lots of tool calls — backlog accumulates as `status='raw'`.
- After `/siftcoder:memory:backfill` — replayed events need to be summarized.
- Before `/siftcoder:memory:status` to refresh savings numbers.

Skip drain if API key path unacceptable. Raw-only mode still gives `mem_search` and events tab in `/siftcoder:mem-web`.

## How it works (when fallback enabled)

Each pending event sent to Haiku w/ compression prompt. Returns one-sentence summary + confidence. Low-confidence (< 0.6) escalates to Sonnet. Cached by `(model, prompt, input)` hash so repeats are zero-cost.

## Instructions

Default batch 16. If `$ARGUMENTS` has `batch=N`, use N. Cap at 64.

Invoke:

```
use mem_drain with batch=16
```

Surface result:
```json
{ "ok": true, "data": { "processed": 16, "errors": 0, "pending": 84 } }
```

If `errors > 0` AND `firstError` contains `"Method not found"`:
> **Drain blocked: Claude Code does not yet implement MCP sampling. To proceed, set `SIFTCODER_DRAIN_FALLBACK=1` + `ANTHROPIC_API_KEY` in env, then restart Claude Code. Or stay raw-only — `mem_search` still works against captured payloads.**

If `errors > 0` AND `firstError` is something else, surface exact message and stop — different host failure mode, needs investigation.

If `pending > 0`, ask: **"84 events still pending. Drain another batch?"** and offer to call again.

If `processed === 0` AND `pending === 0`, say: **"Nothing to drain — all events already summarized."**

## After draining

```bash
PLUGIN="${CLAUDE_PLUGIN_ROOT}"
node $PLUGIN/dist/memory/cli.js savings | grep -E "summarized|coverage|spend"
```

## Tips

```
TYPICAL DRAIN FLOW (fallback mode)

  export SIFTCODER_DRAIN_FALLBACK=1
  export ANTHROPIC_API_KEY=sk-...
  # restart Claude Code so MCP server picks up env

  /siftcoder:memory:drain
  /siftcoder:memory:status
  use mem_search to find <topic>

WITHOUT KEY (raw-only)

  /siftcoder:memory:drain     ← will fail w/ "Method not found"
  use mem_search to find X    ← still works against raw events
```
