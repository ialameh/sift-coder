# MCP Tools

The `siftcoder-memory` MCP server exposes five tools to Claude Code. Declared inline in `.claude-plugin/plugin.json` under `mcpServers`; starts automatically when Claude Code attaches.

## Tools

### `mem_search`

Hybrid retrieval over summaries.

```json
{
  "query": "auth middleware decision",
  "k": 5
}
```

Returns top-`k` summary rows ranked by BM25 + dense cosine fused via Reciprocal Rank Fusion, with Ebbinghaus decay applied. Optional Claude rerank when `SIFTCODER_RERANK=1`.

Side effect: drains a small batch (4) of pending events before searching, so retrieval is always against the freshest data.

### `mem_get`

Fetch full summary rows by ids.

```json
{
  "ids": [142, 287, 304]
}
```

Returns `text`, `model`, `confidence`, `tokens_in`, `tokens_out`, `ts`.

### `mem_timeline`

Chronological neighbours around a memory id.

```json
{
  "near_id": 142,
  "window": 10
}
```

Returns 10 summaries on each side of `near_id`, ordered by timestamp.

### `mem_why`

Trace causal provenance from a memory node.

```json
{
  "kind": "summary",
  "id": "142",
  "depth": 4
}
```

Walks the typed provenance graph: `causes`, `derives_from`, `calls`, `imports`, `supersedes`. Returns a depth-4 BFS with edge types and confidences.

### `mem_drain`

Force-drain pending events into summaries.

```json
{
  "batch": 16
}
```

Returns `{ processed, errors, pending, firstError? }`. `firstError` surfaces the actual host LLM error message when any event failed.

## Backend selection

The MCP server resolves the LLM backend at boot in this order:

1. `SIFTCODER_DRAIN_BACKEND=ollama|anthropic|mcp` — explicit override
2. **Ollama** at `http://localhost:11434` reachable
3. **Anthropic** if `ANTHROPIC_API_KEY` set
4. **MCP host sampling** otherwise

Logged to stderr: `siftcoder-mem mcp: drain backend = <choice>`.

## Sample interaction

User: *"What did we decide about the auth caching strategy?"*

Claude internally:

```
mem_search { query: "auth caching strategy", k: 5 }
```

Result:

```json
[
  {
    "id": 142,
    "ts": 1735000000,
    "model": "llama3.2:3b",
    "text": "Decided to skip in-memory cache; redis already in stack handles auth session lookups",
    "confidence": 0.91
  }
]
```

Then optionally:

```
mem_why { kind: "summary", id: "142", depth: 3 }
```

Returns the chain of events and decisions that led to summary 142.

## See also

- [memory.md](MEMORY.md) — engine details
- [configuration.md](CONFIG.md) — env vars for backend tuning
