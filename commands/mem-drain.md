---
description: Drain pending captured events into summaries via host sampling
argument-hint: [batch=N]
allowed-tools: Bash, mcp__plugin_siftcoder_siftcoder-memory__mem_drain
---

# /siftcoder:memory:drain - Summarize Pending Events

Calls the `mem_drain` MCP tool to convert raw captured events into searchable summaries. Uses host sampling so the LLM cost flows through your existing Claude Code billing (no plugin-side API key).

## When to use

- After a long session w/ lots of tool calls — backlog accumulates as `status='raw'`.
- After `/siftcoder:memory:backfill` — replayed events need to be summarized to be retrievable.
- Before running `/siftcoder:memory:status` if you want the savings numbers to reflect post-summarization state.

## How it works

Each pending event is sent to the host model with a compression prompt. The model returns a one-sentence durable memory + a confidence score. Low-confidence summaries (< 0.6) are escalated from Haiku to Sonnet automatically. Each result is cached by `(model, prompt, input)` hash so repeated drains are zero-cost.

## Instructions

Default batch size is 16. If `$ARGUMENTS` includes `batch=N`, use N. Cap at 64 per call to keep latency manageable.

Invoke the MCP tool directly:

```
use mem_drain with batch=16
```

Then surface the result. The tool returns:
```json
{ "ok": true, "data": { "processed": 16, "errors": 0, "pending": 84 } }
```

If `pending > 0`, ask the user: **"84 events still pending. Drain another batch?"** and offer to call again.

If `processed === 0` and `pending === 0`, tell the user: **"Nothing to drain — all events are already summarized."**

If `errors > 0`, run `/siftcoder:memory:status` and check the daemon log:
```bash
tail -50 ~/.siftcoder/logs/*.ndjson | grep -i error
```

## After draining

Show the user a quick verification:

```bash
PLUGIN="${CLAUDE_PLUGIN_ROOT}"
node $PLUGIN/dist/memory/cli.js savings | grep -E "summarized|coverage|spend"
```

## Tips

```
TYPICAL DRAIN FLOW

After a long coding session:
  /siftcoder:memory:drain               ← turn raw events into summaries
  /siftcoder:memory:status              ← see token savings
  use mem_search to find <topic>        ← search the new summaries

If draining a backfill:
  /siftcoder:memory:backfill --all
  /siftcoder:memory:drain batch=64      ← drain in big batches
  Repeat until pending=0
```
