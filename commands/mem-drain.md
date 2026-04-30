---
description: Drain pending captured events into summaries (requires ANTHROPIC_API_KEY today; MCP host sampling not yet supported by Claude Code)
argument-hint: [batch=N]
allowed-tools: Bash, mcp__plugin_siftcoder_siftcoder-memory__mem_drain
---

# /siftcoder:memory:drain - Summarize Pending Events

Calls the `mem_drain` MCP tool to convert raw captured events into searchable summaries.

## Backend options (verified 2026-04-30)

**Recommended: local Ollama (free, private, no key).** Original design was MCP host sampling — host-billed, no plugin key. Empirically: **Claude Code CLI 2.1.x does not implement `sampling/createMessage` (JSON-RPC -32601 "Method not found")**. Until Claude Code ships sampling, three backends:

| Backend | Cost | Setup | Best for |
|---|---|---|---|
| **Ollama** (local) | Free | `brew install ollama && ollama pull llama3.2:3b` then start Ollama (`ollama serve` or app). Auto-detected. | Default. Private. ~1.5s/event on M1. |
| Anthropic direct | Pay-per-token | `export SIFTCODER_DRAIN_BACKEND=anthropic && export ANTHROPIC_API_KEY=sk-...` then restart Claude Code | High-volume, want top-tier model |
| MCP sampling | Host-billed | Nothing. Activates automatically when Claude Code ships sampling. | Future state |
| Raw-only | n/a | Don't drain at all. `mem_search` still works on captured payloads. | Acceptable when summaries aren't needed |

Selection priority (auto):
1. `SIFTCODER_DRAIN_BACKEND` env (`ollama` / `anthropic` / `mcp`) — explicit override.
2. Otherwise: Ollama if reachable at `http://localhost:11434`.
3. Otherwise: Anthropic if `ANTHROPIC_API_KEY` set.
4. Otherwise: MCP host sampling (currently fails on Claude Code 2.1.x).

Optional Ollama tuning:
- `SIFTCODER_OLLAMA_MODEL=qwen2.5:3b` (default `llama3.2:3b`)
- `SIFTCODER_OLLAMA_HOST=http://192.168.1.10:11434` (remote daemon)

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
> **Drain blocked: Claude Code does not yet implement MCP sampling. Three options: (a) install Ollama (`brew install ollama && ollama pull llama3.2:3b && ollama serve`) — drain auto-detects it, free + private. (b) Set `SIFTCODER_DRAIN_BACKEND=anthropic` + `ANTHROPIC_API_KEY` and restart Claude Code. (c) Stay raw-only — `mem_search` still works against captured payloads.**

If `errors > 0` AND `firstError` contains `"ollama api"` or `"ECONNREFUSED"`, tell the user **Ollama daemon not reachable. Run `ollama serve` (or open the Ollama app), then re-run drain.**

If `errors > 0` AND `firstError` is something else, surface exact message and stop — different failure mode, needs investigation.

If `pending > 0`, ask: **"84 events still pending. Drain another batch?"** and offer to call again.

If `processed === 0` AND `pending === 0`, say: **"Nothing to drain — all events already summarized."**

## After draining

```bash
PLUGIN="${CLAUDE_PLUGIN_ROOT}"
node $PLUGIN/dist/memory/cli.js savings | grep -E "summarized|coverage|spend"
```

## Tips

```
TYPICAL DRAIN FLOW (Ollama, recommended)

  brew install ollama
  ollama pull llama3.2:3b      ← 2GB, ~50 tok/s on M1
  ollama serve                  ← or open the Ollama app
  # restart Claude Code so MCP server picks up Ollama

  /siftcoder:memory:drain
  /siftcoder:memory:status
  use mem_search to find <topic>

ANTHROPIC API (paid path)

  export SIFTCODER_DRAIN_BACKEND=anthropic
  export ANTHROPIC_API_KEY=sk-...
  # restart Claude Code

  /siftcoder:memory:drain

WITHOUT BACKEND (raw-only)

  /siftcoder:memory:drain     ← fails w/ "Method not found"
  use mem_search to find X    ← still works on raw events
```
