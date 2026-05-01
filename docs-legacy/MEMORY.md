# Memory Engine

How SiftCoder captures, summarises, retrieves, and reasons about prior work.

## What it does

Every tool call (Read, Write, Edit, Bash, Grep, Glob) flows through a per-workspace memory daemon. Raw events become one-sentence summaries with confidence scores, embeddings, and provenance edges. Future sessions retrieve them via `mem_search` (BM25 + dense vector + Ebbinghaus decay) and `mem_why` (causal-chain BFS).

## System diagram

<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 880 540" width="100%" font-family="ui-sans-serif, system-ui, sans-serif" font-size="12">
  <defs>
    <marker id="arr" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
      <path d="M0,0 L10,5 L0,10 z" fill="#475569"/>
    </marker>
    <linearGradient id="cc" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#dbeafe"/>
      <stop offset="100%" stop-color="#bfdbfe"/>
    </linearGradient>
    <linearGradient id="dm" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#fef3c7"/>
      <stop offset="100%" stop-color="#fde68a"/>
    </linearGradient>
    <linearGradient id="st" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#dcfce7"/>
      <stop offset="100%" stop-color="#bbf7d0"/>
    </linearGradient>
    <linearGradient id="ll" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#fce7f3"/>
      <stop offset="100%" stop-color="#fbcfe8"/>
    </linearGradient>
  </defs>

  <rect x="20" y="20" width="840" height="120" rx="10" fill="url(#cc)" stroke="#1e40af" stroke-width="1.5"/>
  <text x="40" y="44" font-weight="700" fill="#1e3a8a">Claude Code session</text>
  <rect x="40" y="60" width="180" height="60" rx="6" fill="#fff" stroke="#3b82f6"/>
  <text x="130" y="88" text-anchor="middle" fill="#1e3a8a">Tool call</text>
  <text x="130" y="104" text-anchor="middle" fill="#1e3a8a" font-size="10">Read | Write | Edit | Bash</text>
  <rect x="240" y="60" width="180" height="60" rx="6" fill="#fff" stroke="#3b82f6"/>
  <text x="330" y="88" text-anchor="middle" fill="#1e3a8a">Hooks</text>
  <text x="330" y="104" text-anchor="middle" fill="#1e3a8a" font-size="10">PostToolUse capture</text>
  <rect x="440" y="60" width="180" height="60" rx="6" fill="#fff" stroke="#3b82f6"/>
  <text x="530" y="88" text-anchor="middle" fill="#1e3a8a">MCP tools</text>
  <text x="530" y="104" text-anchor="middle" fill="#1e3a8a" font-size="10">mem_search | mem_why</text>
  <rect x="640" y="60" width="200" height="60" rx="6" fill="#fff" stroke="#3b82f6"/>
  <text x="740" y="88" text-anchor="middle" fill="#1e3a8a">PreCompact inject</text>
  <text x="740" y="104" text-anchor="middle" fill="#1e3a8a" font-size="10">top-k memories preserved</text>

  <rect x="60" y="180" width="760" height="180" rx="10" fill="url(#dm)" stroke="#b45309" stroke-width="1.5"/>
  <text x="80" y="204" font-weight="700" fill="#7c2d12">SiftCoder daemon (per workspace)</text>

  <rect x="80" y="220" width="170" height="60" rx="6" fill="#fff" stroke="#f59e0b"/>
  <text x="165" y="248" text-anchor="middle" fill="#7c2d12">Capture</text>
  <text x="165" y="264" text-anchor="middle" fill="#7c2d12" font-size="10">redact + WAL append</text>

  <rect x="270" y="220" width="170" height="60" rx="6" fill="#fff" stroke="#f59e0b"/>
  <text x="355" y="248" text-anchor="middle" fill="#7c2d12">Summariser</text>
  <text x="355" y="264" text-anchor="middle" fill="#7c2d12" font-size="10">Haiku → Sonnet escalate</text>

  <rect x="460" y="220" width="170" height="60" rx="6" fill="#fff" stroke="#f59e0b"/>
  <text x="545" y="248" text-anchor="middle" fill="#7c2d12">Retrieval</text>
  <text x="545" y="264" text-anchor="middle" fill="#7c2d12" font-size="10">BM25 + vector → RRF + decay</text>

  <rect x="650" y="220" width="160" height="60" rx="6" fill="#fff" stroke="#f59e0b"/>
  <text x="730" y="248" text-anchor="middle" fill="#7c2d12">Provenance</text>
  <text x="730" y="264" text-anchor="middle" fill="#7c2d12" font-size="10">edge graph (mem_why)</text>

  <rect x="80" y="290" width="170" height="50" rx="6" fill="#fff" stroke="#f59e0b"/>
  <text x="165" y="312" text-anchor="middle" fill="#7c2d12">Embedder</text>
  <text x="165" y="328" text-anchor="middle" fill="#7c2d12" font-size="10">Ollama / CDG / det.</text>

  <rect x="270" y="290" width="170" height="50" rx="6" fill="#fff" stroke="#f59e0b"/>
  <text x="355" y="312" text-anchor="middle" fill="#7c2d12">Consolidator</text>
  <text x="355" y="328" text-anchor="middle" fill="#7c2d12" font-size="10">dedup, merge, prune</text>

  <rect x="460" y="290" width="170" height="50" rx="6" fill="#fff" stroke="#f59e0b"/>
  <text x="545" y="312" text-anchor="middle" fill="#7c2d12">Web sidecar</text>
  <text x="545" y="328" text-anchor="middle" fill="#7c2d12" font-size="10">read-only HTTP UI</text>

  <rect x="650" y="290" width="160" height="50" rx="6" fill="#fff" stroke="#f59e0b"/>
  <text x="730" y="312" text-anchor="middle" fill="#7c2d12">Health monitor</text>
  <text x="730" y="328" text-anchor="middle" fill="#7c2d12" font-size="10">30s UDS ping</text>

  <rect x="60" y="380" width="500" height="80" rx="10" fill="url(#st)" stroke="#15803d" stroke-width="1.5"/>
  <text x="80" y="404" font-weight="700" fill="#14532d">Storage (~/.siftcoder/workspaces/&lt;key&gt;)</text>
  <rect x="80" y="416" width="120" height="32" rx="4" fill="#fff" stroke="#22c55e"/>
  <text x="140" y="436" text-anchor="middle" fill="#14532d" font-size="10">events</text>
  <rect x="210" y="416" width="120" height="32" rx="4" fill="#fff" stroke="#22c55e"/>
  <text x="270" y="436" text-anchor="middle" fill="#14532d" font-size="10">summaries (FTS5)</text>
  <rect x="340" y="416" width="100" height="32" rx="4" fill="#fff" stroke="#22c55e"/>
  <text x="390" y="436" text-anchor="middle" fill="#14532d" font-size="10">embeddings</text>
  <rect x="450" y="416" width="100" height="32" rx="4" fill="#fff" stroke="#22c55e"/>
  <text x="500" y="436" text-anchor="middle" fill="#14532d" font-size="10">provenance</text>

  <rect x="600" y="380" width="220" height="80" rx="10" fill="url(#ll)" stroke="#a21caf" stroke-width="1.5"/>
  <text x="620" y="404" font-weight="700" fill="#86198f">LLM backends</text>
  <rect x="620" y="416" width="80" height="32" rx="4" fill="#fff" stroke="#d946ef"/>
  <text x="660" y="436" text-anchor="middle" fill="#86198f" font-size="10">Ollama</text>
  <rect x="710" y="416" width="100" height="32" rx="4" fill="#fff" stroke="#d946ef"/>
  <text x="760" y="436" text-anchor="middle" fill="#86198f" font-size="10">Anthropic API</text>

  <line x1="330" y1="120" x2="165" y2="220" stroke="#475569" stroke-width="1.5" marker-end="url(#arr)"/>
  <text x="220" y="172" font-size="10" fill="#475569">UDS frame</text>
  <line x1="530" y1="120" x2="545" y2="220" stroke="#475569" stroke-width="1.5" marker-end="url(#arr)"/>
  <text x="540" y="172" font-size="10" fill="#475569">MCP stdio</text>
  <line x1="660" y1="220" x2="740" y2="120" stroke="#475569" stroke-width="1.5" marker-end="url(#arr)"/>
  <line x1="165" y1="280" x2="140" y2="416" stroke="#475569" stroke-width="1.2" marker-end="url(#arr)"/>
  <line x1="355" y1="280" x2="270" y2="416" stroke="#475569" stroke-width="1.2" marker-end="url(#arr)"/>
  <line x1="165" y1="340" x2="390" y2="416" stroke="#475569" stroke-width="1" marker-end="url(#arr)"/>
  <line x1="730" y1="280" x2="500" y2="416" stroke="#475569" stroke-width="1" marker-end="url(#arr)"/>
  <line x1="440" y1="240" x2="660" y2="416" stroke="#a21caf" stroke-width="1" stroke-dasharray="4 3" marker-end="url(#arr)"/>
  <line x1="440" y1="260" x2="760" y2="416" stroke="#a21caf" stroke-width="1" stroke-dasharray="4 3" marker-end="url(#arr)"/>

  <text x="440" y="500" text-anchor="middle" fill="#475569">Capture is fire-and-forget · summarisation runs in the background · retrieval is sub-50ms · provenance is a first-class concept</text>
</svg>

## Per-workspace scoping

Each project gets its own SQLite database at `~/.siftcoder/workspaces/<key>/db.sqlite`, where `<key>` = SHA-256 of the realpath of the git toplevel (or cwd if not a repo), first 12 hex characters. Daemons are 1:1 with workspaces.

```
~/.siftcoder/
├── auth.token                          # global, web bridge bearer
├── run/<key>.sock                      # UDS socket
├── logs/
│   ├── <key>.ndjson                    # daemon log
│   └── spawn.ndjson                    # session-start hook log
└── workspaces/<key>/
    ├── db.sqlite                       # events, summaries, embeddings, provenance
    ├── wal.ndjson                      # crash-recovery WAL
    ├── run.pid                         # daemon PID
    ├── http.port                       # web bridge port
    └── onboarded                       # sentinel: skip session-start nudge
```

## Capture pipeline

The PostToolUse hook fires after every Read/Write/Edit/Bash/Grep/Glob. It serialises the tool input/output, runs PII redaction at the edge, frames a UDS message, and writes to the daemon. Budget: 250 ms; failure mode: silent.

Eight built-in redaction patterns: AWS keys, GitHub tokens, Anthropic keys, OpenAI keys, Bearer tokens, JWTs, emails, phone numbers. User-marked `<private>...</private>` blocks also stripped before transmission.

## Drain pipeline

Background loop or on-demand via `/siftcoder:mem drain`. For each pending event:

1. Compute a cache key: `(model, prompt_hash, input_hash)` triplet
2. Cache hit → reuse summary text and token counts (zero LLM cost)
3. Cache miss → call the chosen LLM with a compression prompt
4. Parse JSON response: `{"text": "<240 chars>", "confidence": 0..1}`
5. If `confidence < 0.6`, escalate to a stronger model (Sonnet from Haiku)
6. Write to `summaries`, `summaries_fts`, `summary_embeddings`, `summary_cache`
7. Update event row: `status` → `summarized` or `skipped`

## Retrieval

`mem_search(query, k)` runs:

1. **BM25** over FTS5 — full-text rank
2. **Dense cosine** — embed query, dot-product against all summary vectors
3. **Reciprocal Rank Fusion** — fuse the two lists
4. **Ebbinghaus decay** — boost recent summaries against staler ones
5. **Optional rerank** — Claude as cross-encoder when `SIFTCODER_RERANK=1`

Returns top-k summary rows with provenance hints.

## Provenance

`mem_why(id, depth=4)` walks the typed edge graph. Edge types:

| Edge | Meaning |
|---|---|
| `causes` | Event A produced summary B |
| `derives_from` | Summary B was distilled from summaries A1..An |
| `calls` | Summary B references function called by A |
| `imports` | Summary B references file imported by A |
| `supersedes` | B replaces A (sleep-time consolidation) |

Returns a depth-N BFS from the starting node.

## Backend selection

| Layer | Order | Override |
|---|---|---|
| Drain LLM | Ollama → Anthropic → MCP sampling | `SIFTCODER_DRAIN_BACKEND` |
| Embedder | CDG → Ollama → Deterministic | `SIFTCODER_EMBEDDER` |

Detected at MCP server boot (drain) and daemon boot (embedder). Logged to stderr.

## Performance (Apple M1, 16 GB)

| Operation | Backend | Latency |
|---|---|---|
| Capture | n/a | < 5 ms p99 |
| Summarise | Ollama llama3.2:3b | ~ 1.5 s/event |
| Embed | Ollama nomic-embed-text | ~ 140 ms/event |
| `mem_search` k=5 | BM25 + dense + RRF | < 50 ms p99 |
| Backfill 1000 events | replay → daemon | ~ 12 s |
| Drain 1000 events | Ollama serial | ~ 25 min |

## See also

- [mcp-tools.md](API.md) — MCP tool reference (`mem_search`, `mem_get`, `mem_timeline`, `mem_why`, `mem_drain`)
- [configuration.md](CONFIG.md) — env vars + `settings.json`
- [troubleshooting.md](TROUBLESHOOTING.md) — common issues
