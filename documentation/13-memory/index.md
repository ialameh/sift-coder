# SiftCoder Memory

Persistent, per-workspace memory for Claude Code. Captures every tool call, summarizes through a local or remote LLM, and serves them back through hybrid (BM25 + dense) retrieval w/ Ebbinghaus decay and a provenance graph.

> **TL;DR.** Run `/siftcoder:mem-setup` once per project. After that, capture is automatic and `mem_search` keeps itself current via auto-drain on every call.

---

## Why use it

| Problem | Without Memory | With Memory |
|---|---|---|
| Context blown after `/compact` | Lose detailed history | Retrieve via `mem_search` |
| New session, unfamiliar repo | Re-read code from scratch | Ask "what did we do for X?" |
| Long-running migration spanning weeks | Track manually | Provenance graph (`mem_why`) traces decisions back to events |
| Token cost on rehashed context | Pay every turn | A/B harness shows ~99% reduction at 200-turn scale |

---

## Quick start

```bash
# 1. Install Ollama (recommended local backend — free, private, no API key)
brew install ollama
ollama pull llama3.2:3b           # 2GB summarization model
ollama pull nomic-embed-text      # 137M embedding model
ollama serve &                    # or open the Ollama app

# 2. Open Claude Code in the project, run setup
cd <your-project>
# launch claude code

/siftcoder:mem-setup              # walks daemon check, optional backfill, drain, mark onboarded
```

That's it. Capture is now automatic. After setup:
- Capture happens on every tool call via SessionStart hook → UDS daemon → SQLite.
- `mem_search` is callable by Claude in any conversation.
- Auto-drain (batch=4) runs on every `mem_search` to keep summaries current.

---

## Commands

| Command | Purpose |
|---|---|
| [`/siftcoder:mem-setup`](#mem-setup) | First-time orchestrator. Narrated 5-phase walkthrough. |
| [`/siftcoder:mem-check`](#mem-check) | Health check. 5 diagnostic points. Auto-spawns daemon. |
| [`/siftcoder:mem-start`](#mem-start) | Explicit daemon spawn. |
| [`/siftcoder:mem-status`](#mem-status) | Capture / drain / spend / A-B savings report. |
| [`/siftcoder:mem-backfill`](#mem-backfill) | Import past Claude Code transcripts. |
| [`/siftcoder:mem-drain`](#mem-drain) | Summarize raw events into searchable summaries. |
| [`/siftcoder:mem-web`](#mem-web) | Open browser dashboard (overview, events, summaries, search, provenance, A/B). |

### MCP tools (Claude calls these during conversation)

| Tool | What it does | Auto-drains? |
|---|---|---|
| `mem_search` | Hybrid BM25 + dense + RRF + Ebbinghaus decay over summaries. | Yes (batch=4). |
| `mem_timeline` | Chronological window around a memory id. | No. |
| `mem_get` | Fetch full summary rows by ids. | No. |
| `mem_drain` | Force-drain pending events. | Itself. |
| `mem_why` | Trace causal provenance from a node. | No. |

---

## Architecture

```
SessionStart hook ──spawn──► Daemon (per workspace)
                              │
Tool call ──UDS───────────────┴──► capture → SQLite
                                              │
                                              ▼
                                    raw events (status='raw')
                                              │
   /mem-drain ───MCP tool────► dispatch ──────┤
                                              │  ┌──► Ollama (local, default)
                                    summarize ┼──┼──► Anthropic API (opt-in)
                                              │  └──► MCP host sampling (when CC supports)
                                              ▼
                                    summaries + embeddings + FTS5 + provenance
                                              │
   mem_search ──MCP tool────► hybrid retrieval (BM25 + dense + RRF + decay)
```

### Per-workspace scoping

Each project gets its own SQLite DB at `~/.siftcoder/workspaces/<key>/db.sqlite` where `<key>` = SHA-256(realpath(git toplevel)) first 12 hex. Daemons are 1:1 with workspaces. Drain, search, status — all scoped to the workspace whose cwd Claude Code is launched in.

### Files per workspace

```
~/.siftcoder/
├── auth.token                          # global, web bridge bearer
├── run/<key>.sock                      # UDS for daemon-client
├── logs/
│   ├── <key>.ndjson                    # daemon log
│   └── spawn.ndjson                    # SessionStart hook log
└── workspaces/<key>/
    ├── db.sqlite                       # events, summaries, embeddings, provenance
    ├── wal.ndjson                      # crash-recovery WAL
    ├── run.pid                         # daemon PID
    ├── http.port                       # web bridge port
    └── onboarded                       # sentinel: skip SessionStart nudge
```

---

## Backends

### Drain (summarization)

Resolved at MCP server boot in this order:

1. `SIFTCODER_DRAIN_BACKEND=ollama|anthropic|mcp` explicit override.
2. **Ollama** at `http://localhost:11434` reachable → use it. **Recommended default.** Free, private, ~1.5s/event on M1.
3. **Anthropic API** if `ANTHROPIC_API_KEY` set → direct API. Pay per token.
4. **MCP host sampling** otherwise. Currently fails on Claude Code 2.1.x with JSON-RPC `-32601 Method not found` — this is the original "host-billed" design, blocked until Claude Code ships sampling support.

| Knob | Default | Use case |
|---|---|---|
| `SIFTCODER_OLLAMA_HOST` | `http://localhost:11434` | Remote Ollama on LAN |
| `SIFTCODER_OLLAMA_MODEL` | `llama3.2:3b` | Try `qwen2.5:3b` for stricter JSON |

### Embedder (semantic search)

Resolved at daemon boot:

1. `SIFTCODER_EMBEDDER` explicit override.
2. **CDG** (remote knowledge graph service) if `SIFTCODER_CDG_URL` set.
3. **Ollama** w/ `nomic-embed-text` (768 dim, 139ms/embed on M1).
4. **DeterministicEmbedder** (hash-bucket, 384 dim) — fallback only, not real semantics.

| Knob | Default | Use case |
|---|---|---|
| `SIFTCODER_OLLAMA_EMBED_MODEL` | `nomic-embed-text` | Try `mxbai-embed-large` (1024 dim, higher quality) |
| `SIFTCODER_OLLAMA_EMBED_DIM` | `768` | Match the model |

> **Switching embedders mid-workspace invalidates similarity scores against existing vectors** (different vector spaces). BM25 path is unaffected — hybrid retrieval degrades gracefully. Worth a fresh drain after backend switch.

---

## Privacy + security

- **Local by default.** Capture stays on disk. Drain through Ollama keeps payloads on your machine.
- **PII redaction at hook edge.** Eight built-in patterns (AWS / GitHub / Anthropic / OpenAI / Bearer / JWT / email / phone) plus user-marked `<private>...</private>` blocks are stripped before payloads reach the daemon.
- **Web bridge bound to 127.0.0.1 only.** Bearer token at `~/.siftcoder/auth.token` (mode 0600). Token rewritten into asset URLs server-side so browsers can fetch `/style.css` and `/app.js` without ?token leak in subsequent links.
- **No API key required for the default path.** Ollama is local. Anthropic key is opt-in for users on hosts without sampling.

---

## Performance

Measured on Apple M1, 16GB RAM:

| Operation | Backend | Latency |
|---|---|---|
| Capture (hook → daemon → SQLite) | n/a | <5ms p99 |
| Summarize | Ollama llama3.2:3b | ~1.5s/event |
| Embed | Ollama nomic-embed-text | ~140ms/event |
| Hybrid search (k=5) | BM25 + dense + RRF | <50ms p99 |
| Backfill 1000 events | replay → daemon | ~12s |
| Drain 1000 events | Ollama serial | ~25 min |

A/B counterfactual on 200-turn TPM workspace: **12.3M tokens (full history) → 117k tokens (memory-backed) = 99.0% saved.**

---

## Command details

### mem-setup

```
/siftcoder:mem-setup
```

Five narrated phases. First-time orchestrator that eliminates needing to remember the right command order.

1. **Daemon health** — auto-spawn if down.
2. **Read state** — captured / summarized / pending counts.
3. **Backfill** (if `captured == 0`) — asks user for `all` / `latest=N` / `skip`. Imports `~/.claude/projects/<encoded-cwd>/*.jsonl` through capture pipeline.
4. **Drain** (if `pending > 0`) — auto-detects backend, halts w/ clear instructions if none.
5. **Mark onboarded** — writes `~/.siftcoder/workspaces/<key>/onboarded` sentinel + final summary.

Idempotent. Safe to re-run anytime as catch-up.

### mem-check

```
/siftcoder:mem-check          # default: auto-fix daemon if down
/siftcoder:mem-check --no-fix  # strict diagnostic
```

Five checkpoints — workspace key, daemon socket, CLI ping, storage, MCP attached. Halts on first failure with one-line remediation.

### mem-start

```
/siftcoder:mem-start
```

Explicit daemon spawn. Useful when you want spawn without the diagnostic overhead of mem-check.

### mem-status

```
/siftcoder:mem-status
```

Full report: capture volume, redaction hit rate, drain coverage, summarization spend, dedup, compression ratio, A/B counterfactual. Prints `workspace: <key> (<cwd>)` banner so the report is unambiguous about which workspace it covers.

### mem-backfill

```
/siftcoder:mem-backfill                    # dry-run
/siftcoder:mem-backfill --all              # import all transcripts
/siftcoder:mem-backfill --latest=3         # most recent 3 sessions
```

Replays past Claude Code transcripts under `~/.claude/projects/<encoded-cwd>/` through the capture pipeline. Useful for old projects where memory wasn't installed during prior sessions.

### mem-drain

```
/siftcoder:mem-drain
/siftcoder:mem-drain batch=64
```

Summarizes raw events into one-sentence durable memories + confidence scores. Loops batch until pending=0 (or backend errors). Auto-detects Ollama → Anthropic → MCP host sampling.

When errors > 0, surfaces the first error message:
- `"Method not found"` → Claude Code MCP sampling not implemented yet. Install Ollama or set Anthropic key.
- `"ollama api"` / `"ECONNREFUSED"` → Ollama daemon not running. `ollama serve`.
- Anything else → verbatim, halts for diagnosis.

### mem-web

```
/siftcoder:mem-web
```

Opens browser dashboard at `http://127.0.0.1:<port>?token=<token>`. Six tabs:
- **Overview** — savings + drain coverage
- **Events** — recent tool-call captures
- **Summaries** — generated memories
- **Search** — interactive `mem_search` UI
- **Provenance** — graph traversal from any memory id
- **A/B savings** — token reduction harness

Stable port per workspace via `chooseStablePort(workspaceKey)` in IANA dynamic range 49152-65535. Override with `SIFTCODER_HTTP_PORT`.

---

## Troubleshooting

### Drain returns `errors: N, processed: 0, firstError: "Method not found"`

Claude Code 2.1.x doesn't implement MCP `sampling/createMessage`. Pick one:
- **Ollama:** `brew install ollama && ollama pull llama3.2:3b && ollama serve`
- **Anthropic:** `export SIFTCODER_DRAIN_BACKEND=anthropic ANTHROPIC_API_KEY=sk-...`, restart Claude Code
- **Skip:** stay raw-only, `mem_search` still works against captured payloads

### Daemon won't start

`/siftcoder:mem-check` will tell you which checkpoint fails. Most common: better-sqlite3 native binding missing in plugin cache. The SessionStart hook self-heals via `npm rebuild` — if that fails, the daemon falls back to `node-sqlite3-wasm`. Logs at `~/.siftcoder/logs/<key>.ndjson` and `~/.siftcoder/logs/spawn.ndjson`.

### Wrong workspace reported

`/siftcoder:mem-status` prints `workspace: <key> (<cwd>)` on the first line. If the cwd isn't what you expect, ensure `CLAUDE_PROJECT_DIR` is set, or run from the project's git root. Non-git directories use the cwd path itself as the key.

### Capture stops working

Daemon may have idle-shutdown after 30 minutes without traffic. SessionStart hook respawns it on next Claude Code launch. Force-respawn: `kill $(cat ~/.siftcoder/workspaces/<key>/run.pid) && rm -f ~/.siftcoder/run/<key>.sock`, next session restarts.

---

## Related

- [Plugin architecture](../architecture/) — overall SiftCoder design
- [Hooks reference](../10-advanced-topics/) — SessionStart hook customization
- [MCP server reference](../03-skills-reference/) — full MCP tool list
