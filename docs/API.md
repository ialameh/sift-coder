# API Reference

Programmatic surfaces SiftCoder exposes.

## MCP server: `siftcoder-memory`

Declared in `.mcp.json`. Auto-loaded by Claude Code when the plugin is installed.

```json
{
  "mcpServers": {
    "siftcoder-memory": {
      "command": "node",
      "args": ["${CLAUDE_PLUGIN_ROOT}/dist/memory/mcp/server.js"],
      "env": { "SIFTCODER_NS": "default" }
    }
  }
}
```

### Tools

#### `mem_search`

Hybrid BM25 + dense-vector retrieval, RRF fused, Ebbinghaus-decayed.

```typescript
mem_search({ query: string, k?: number = 10 })
  → { hits: Array<{ id: string, ts: string, text: string, score: number }> }
```

Examples:

```
mem_search { query: "auth middleware decision", k: 5 }
mem_search { query: "why are we using jwt vs session" }
```

#### `mem_get`

Fetch full summary by id.

```typescript
mem_get({ id: string })
  → { id, ts, text, model, confidence, eventId } | null
```

#### `mem_timeline`

Chronological neighbours around a memory id.

```typescript
mem_timeline({ id: string, before?: number = 5, after?: number = 5 })
  → { rows: Array<{ id, ts, text }> }
```

#### `mem_why`

BFS the provenance graph from a node; returns the cause chain.

```typescript
mem_why({ id: string, maxDepth?: number = 5 })
  → { chain: Array<{ from, to, edge_type, confidence }> }
```

Edge types: `causes`, `derives_from`, `calls`, `imports`, `contradicts`, `edits`, `references`, `extends`, `implements`, `instantiates`, `similar_to`.

#### `mem_drain`

Force-drain pending events through the summariser. Rarely needed; consolidator runs automatically.

```typescript
mem_drain({ batch?: number = 16 })
  → { processed: number, summarized: number, failed: number }
```

## CLI: `bin/siftcoder.mjs`

```bash
siftcoder version
siftcoder setup           # interactive Ollama probe + Anthropic key + config
siftcoder start           # spawn daemon detached
siftcoder stop
siftcoder status          # daemon health + counts + namespace + workspace
siftcoder drain [batch]   # force-drain pending events
siftcoder backfill [root] [--dry-run] [--workspace <key>]
siftcoder backfill transcripts
siftcoder web             # print web UI URL
```

Exit codes:
- `0` — success
- `1` — daemon unreachable / runtime error
- `2` — invalid arguments

## UDS protocol (low-level — for advanced integrations)

Daemon listens on `~/.siftcoder/<NS>/run/<workspace-key>.sock`.

Wire format: 4-byte big-endian uint32 length prefix + UTF-8 JSON body.

Request `kind` discriminators:

| kind | params | response data |
|---|---|---|
| `ping` | (none) | `{ pong: true }` |
| `capture` | `{ sessionId, tool, payload, ts?, source? }` | `{ id, tokensEst }` |
| `search` | `{ query, k? }` | `{ hits: [...] }` |
| `timeline` | `{ nearId, window? }` | `{ rows: [...] }` |
| `get` | `{ ids: number[] }` | `{ rows: [...] }` |
| `shutdown` | (none) | `{ stopping: true }` |

Response shape: `{ ok: true, data: ... }` or `{ ok: false, error: string }`.

## Programmatic memory ingest

```bash
siftcoder backfill transcripts                    # from local CC transcript dir
siftcoder backfill ~/.siftcoder         # from prior install
```

Or directly via UDS:

```javascript
import net from 'node:net';
const sock = '/Users/me/.siftcoder/run/<key>.sock';
const c = net.createConnection(sock);
const body = Buffer.from(JSON.stringify({
  kind: 'capture',
  sessionId: 'my-session',
  tool: 'Read',
  payload: { file: '/x.ts', content: '...' },
}));
const header = Buffer.alloc(4);
header.writeUInt32BE(body.length, 0);
c.write(Buffer.concat([header, body]));
```

## TypeScript surfaces

For embedding the engine in other Node tools:

```typescript
import { Storage } from '@siftcoder/core/dist/memory/storage/storage.js';
import { backfill } from '@siftcoder/core/dist/memory/migration/import.js';
import { resolvePaths, workspaceKey } from '@siftcoder/core/dist/core/paths.js';
import { loadConfig } from '@siftcoder/core/dist/core/config.js';
import { ChrootManager } from '@siftcoder/core/dist/services/chroot.js';
import { StateManager } from '@siftcoder/core/dist/services/state.js';
import { Budget } from '@siftcoder/core/dist/services/tokens.js';
```

Public type definitions in `dist/**/*.d.ts`.

## Settings schema

`settings.json` (plugin defaults). User overrides at `~/.siftcoder/<NS>/config.json` or `.siftcoder/config.json` (project).

```typescript
interface SiftcoderConfig {
  siftcoder: {
    namespace: string;
    memory: {
      drainBackend: 'auto' | 'ollama' | 'anthropic' | 'sampling';
      drainBackendCascade: Array<'ollama' | 'anthropic' | 'sampling'>;
      embedder: 'auto' | 'ollama' | 'cdg' | 'deterministic';
      embedderCascade: string[];
      decay: { tauMs: number; halfLifeDays: number };
      retrieval: { rrfK: number; topK: number; candidateK: number };
      consolidator: { tickMs: number; batchSize: number };
      summarizer: { modelHaiku: string; modelSonnet: string; confidenceThreshold: number };
    };
    hooks: {
      captureObservationBudgetMs: number;
      injectMemoriesBudgetMs: number;
      boundaryEnforcerTimeoutMs: number;
      autoCheckpoint: { enabled: boolean; everyEdits: number; everyMs: number };
    };
    ollama: { endpoint: string; embedModel: string; summarizeModel: string };
  };
}
```

## Hook event payload contracts

Hooks receive Claude Code event JSON on stdin. Reference shapes:

### PreToolUse / PostToolUse

```json
{
  "tool_name": "Write" | "Edit" | "Read" | "Bash" | "Grep" | "Glob",
  "tool_input": { "file_path": string, "content"?: string, ... },
  "tool_response": { ... },
  "session_id": string,
  "cwd": string
}
```

### PreCompact

```json
{
  "transcript_path": string,
  "trigger": "auto" | "manual"
}
```

### Notification

```json
{
  "message": string,
  "title": string,
  "session_id": string
}
```

Hook exit codes: `0` allow / pass, `2` block (PreToolUse only). Any other → silent no-op.

## Versioning

SiftCoder follows SemVer. The 12-axis API surface above is **stable** within a major version.

Internal modules under `src/` not exported from `dist/index.js` are not part of the API.
