# MCP server

SiftCoder exposes its memory store to Claude through an MCP (Model Context Protocol) server named `siftcoder-memory`. The server is a Node process Claude Code spawns at session start; the wire is JSON-RPC over stdio.

## Registration

Declared in `.claude-plugin/plugin.json`:

```json
"mcpServers": {
  "siftcoder-memory": {
    "command": "node",
    "args": ["${CLAUDE_PLUGIN_ROOT}/dist/memory/mcp/server.js"],
    "env": { "SIFTCODER_NS": "default" }
  }
}
```

The harness reads this at startup, spawns the process, and speaks MCP over its stdin/stdout. The server listens for JSON-RPC requests one per line, dispatches to the handler, and writes the response.

Source: `src/memory/mcp/server.ts` (stdio plumbing) + `src/memory/mcp/handler.ts` (pure dispatch).

## Lifecycle

```
Claude Code  ←─ initialize ─→  siftcoder-memory MCP
             ←─ tools/list ─→
             ←─ tools/call ─→  …repeat…
                  ↓
            (server may emit sampling/createMessage back through stdout
             when it needs the host to run an LLM call)
```

The server reads `SIFTCODER_WORKSPACE_CWD` (or falls back to `process.cwd()`) to derive the workspace key. It opens `MemoryClient` against the daemon socket and `Storage` directly against `db.sqlite`.

On `initialize`, the server logs whether the host advertised the `sampling` capability — without it, the drain fallback can't run. The log line goes to stderr (which the harness captures).

## Tools exposed

Five tools, each schema-checked. Source-of-truth: `TOOLS` array in `src/memory/mcp/handler.ts`.

### `mem_search`

**Description**: Hybrid (BM25 + vector) search over SiftCoder memory summaries. Returns top-k hits with ids. Drains a small backlog through host sampling.

**Input schema**:
```json
{
  "type": "object",
  "properties": {
    "query": { "type": "string" },
    "k": { "type": "number", "default": 5 }
  },
  "required": ["query"]
}
```

**Output**: `content: [{ type: "text", text: <JSON> }]` where `<JSON>` is the daemon's `search` response — `{ ok: true, data: { hits: [{id, summaryId, text, score, ts, ...}] } }`.

**Side effect**: drains up to `drainBatch` (default 4) pending events through sampling first, so search results are based on a fresh-as-possible store.

### `mem_get`

**Description**: Fetch full summary rows by ids.

**Input schema**:
```json
{
  "type": "object",
  "properties": { "ids": { "type": "array", "items": { "type": "number" } } },
  "required": ["ids"]
}
```

**Output**: the daemon's `get` response — full summary rows for the requested ids.

### `mem_timeline`

**Description**: Chronological neighbours around a memory id.

**Input schema**:
```json
{
  "type": "object",
  "properties": {
    "near_id": { "type": "number" },
    "window": { "type": "number", "default": 10 }
  },
  "required": ["near_id"]
}
```

**Output**: `data.before[]` and `data.after[]` — the `window` summaries that bracket the given id.

### `mem_drain`

**Description**: Force-drain pending captured events into summaries via host sampling. Returns counts.

**Input schema**:
```json
{
  "type": "object",
  "properties": { "batch": { "type": "number", "default": 16 } },
  "required": []
}
```

**Output**: `{ ok: true, data: { processed, errors, pending, firstError? } }`.

### `mem_why`

**Description**: Trace causal provenance from a memory node. Returns the chain of edges (`causes`, `derives_from`, `calls`, `imports`, `contradicts`, …) up to a configurable depth.

**Input schema**:
```json
{
  "type": "object",
  "properties": {
    "kind": { "type": "string" },
    "id":   { "type": "string" },
    "depth":{ "type": "number", "default": 4 }
  },
  "required": ["kind", "id"]
}
```

**Output**: `{ ok: true, data: { edges: [...] } }` — the BFS edge list from the starting node. If no `provenance` store is available (older db), returns `{ edges: [] }`.

## What Claude does with these

Each tool is invoked the same way Claude calls any MCP tool — through `tools/call` on the JSON-RPC channel. The harness presents them in Claude's tool catalogue with their descriptions; Claude decides when to call them based on the user's prompt.

The most common patterns:

- **`mem_search`** when the user asks "what did we decide about X" or when starting a new task ("any prior work on this").
- **`mem_get` + `mem_timeline`** to read a hit fully and look at its neighbours.
- **`mem_why`** when explaining a decision or tracing causality ("why is this the way it is").
- **`mem_drain`** opportunistically — `mem_search` already drains 4 events per call, so explicit `mem_drain` is rare unless the user asks.

Skill `skills/knowledge/memory-usage` is the prose contract for how Claude should use these tools.

## The sampling fallback (drain)

The clever bit. When the daemon's `drainBackend` is set to `sampling` (or `auto` falls through to it), summarisation work gets pushed *back* through the MCP wire to the host:

```
SiftCoder daemon → MCP server "I need a summary"
                ↓
              process.stdout.write(JSON.stringify({
                jsonrpc: "2.0",
                id: <next>,
                method: "sampling/createMessage",
                params: { messages: [...], max_tokens: 256 }
              }))
                ↓
            Claude Code receives the request, runs it on its own model
                ↓
          process.stdin → response with the same id
                ↓
            McpSamplingClient resolves the pending promise
                ↓
            Summarizer gets the text, writes the row
```

The bridge code is `src/memory/mcp/server.ts` → `StdioBridge` class. Outbound `sampling/createMessage` requests use ids starting at `1_000_000` to avoid collision with inbound JSON-RPC ids.

**Why this matters**: the plugin doesn't need its own API key. The host already has one (or local Ollama). The summariser just borrows it through the protocol.

**The catch**: the host must advertise the `sampling` capability in its `initialize` response. If not, drain via sampling will fail. The server logs this on startup:

```
siftcoder-mem mcp: host=Claude Code@1.0.x sampling=advertised
                                            sampling=NOT advertised
```

When sampling isn't advertised and no other backend is available, set `SIFTCODER_DRAIN_FALLBACK=1` with `ANTHROPIC_API_KEY` to hit Anthropic directly, or run Ollama locally.

## Backend resolution at MCP startup

When the MCP server boots, it resolves its drain backend by this priority:

1. **Explicit override** — `SIFTCODER_DRAIN_BACKEND` env (`ollama` / `anthropic` / `mcp` / `auto`).
2. **Auto-detect** — if Ollama is reachable at its endpoint, use Ollama (local, free).
3. **Anthropic direct** — if `ANTHROPIC_API_KEY` is set, use Anthropic SDK.
4. **MCP sampling** — fall back to host sampling.

The chosen backend is logged on startup:

```
siftcoder-mem mcp: drain backend = ollama (model=llama3.2:3b)
siftcoder-mem mcp: drain backend = anthropic-direct
siftcoder-mem mcp: drain backend = mcp-sampling
```

The MCP server is independent of the daemon's drain choice — they can disagree. The daemon's tick uses its own resolution; the MCP server's tools use this one.

## Error responses

JSON-RPC errors map to:

| Code | Meaning |
|---|---|
| `-32601` | Method not found (unknown tool name or method). |
| `-32000` | Generic server error (handler threw — message in `error.message`). |

Successful responses always wrap the data in MCP's tool-call envelope:

```json
{ "jsonrpc": "2.0", "id": <n>, "result": {
    "content": [{ "type": "text", "text": "<JSON-stringified body>" }]
  }
}
```

Claude parses `text` as JSON when the description tells it to.

## Testing the MCP server

The server keeps stdio plumbing in `server.ts` (excluded from coverage) and pure logic in `handler.ts` (unit-tested). To exercise the dispatch directly:

```ts
import { dispatch } from './handler.js';
const res = await dispatch({ jsonrpc: '2.0', id: 1, method: 'tools/list' }, deps);
```

The repo's tests use this pattern — see `src/memory/mcp/handler.test.ts`.
