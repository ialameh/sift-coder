# Memory subsystem

Deep dive into how SiftCoder's memory works.

## The problem

Claude Code starts every session cold. Even with a CLAUDE.md and prompt cache, project decisions and conversation history don't persist. The user re-explains, the agent re-discovers.

## The solution

A per-workspace memory daemon that:

1. **Captures** tool observations as raw events.
2. **Summarises** them in batches using a local LLM.
3. **Indexes** summaries with both BM25 (keyword) and dense vectors (semantic).
4. **Retrieves** with RRF fusion + Ebbinghaus decay so old/irrelevant fades.
5. **Tracks provenance** — typed edges between events, summaries, files, symbols. Lets you ask `mem_why` and get a cause chain.

## Architecture

```
Claude Code session
   │
   ├─ PostToolUse hook ──UDS── daemon.append({tool, args, result, ts})
   │                              │
   │                              ▼
   │                          events table (WAL'd)
   │                              │
   │       (every 30s)            ▼
   │                          consolidator.tick()
   │                              │
   │                              ▼
   │                          summariser  ─── Ollama (local, free)
   │                              │     ↘── Anthropic (escalate if confidence < 0.6)
   │                              ▼
   │                          summaries table  +  provenance edges  +  vec index
   │
   └─ MCP tool ──stdio── handler.dispatch
                            │
                            ├─ mem_search → BM25 ⊕ vector → RRF → decay → top-k
                            ├─ mem_get
                            ├─ mem_timeline
                            ├─ mem_why     → BFS provenance graph
                            └─ mem_drain
```

## Storage

Two SQLite backends, parity-tested:

- `better-sqlite3` (native) — fast, can load `sqlite-vec` extension
- `node-sqlite3-wasm` (fallback) — portable, no extension loading

Schema:

```sql
events       (id, ts, tool, input_hash, payload, summary_id?)
summaries    (id, ts, text, model, prompt_hash, input_hash, confidence, embedding)
prov_edges   (from_kind, from_id, to_kind, to_id, edge_type, confidence)
fts_summaries (summary_id, text)  -- FTS5
```

Vector search is JS-side cosine until corpus &gt; ~10k summaries (where `sqlite-vec` becomes worth the overhead).

## Retrieval — RRF + decay

Reciprocal Rank Fusion combines BM25 and dense rankings:

```
score(d) = Σ_l 1 / (rrf_k + rank_l(d))
```

Ebbinghaus decay boosts recency:

```
boost(d) = exp(-(now - ts(d)) / tau_ms)
final(d) = score(d) * boost(d)
```

Default `rrf_k = 60`, `tau_ms = 7d`. Tunable in `settings.json`.

## Provenance

Typed edges between nodes. Node identity: `(kind, id)`. Kinds: `event`, `summary`, `file`, `symbol`.

Edge types:

| Type | Meaning |
|---|---|
| `causes` | this triggered that (event → event) |
| `derives_from` | summary built from these events |
| `calls` | symbol → symbol invocation |
| `imports` | file → file dependency |
| `contradicts` | this summary disagrees with that one |
| `edits` | event modified this file |
| `references` | summary mentions this symbol |
| `extends`, `implements`, `instantiates`, `similar_to` | structural |

`mem_why(id)` runs BFS up to a depth limit and returns the chain — letting you answer "why does this code look like this?" with conversation context, not just `git blame`.

## Summarisation

Cache-first cascade per event:

1. **Cache hit** on `(model, prompt_hash, input_hash)` — return zero-cost
2. **Haiku call** with system + user prompt, parse JSON `{ text, confidence }`
3. **Self-eval escalation** if `confidence < threshold` — retry with Sonnet
4. **Persist** summary + cache entry + token counts

Default: Haiku for first pass (`claude-haiku-4-5-20251001`), Sonnet escalation (`claude-sonnet-4-6`). Configurable.

## Embedders

Cascade:

1. **Ollama** at `http://localhost:11434` with `nomic-embed-text` — local, free
2. **CDG** (remote Code Dependency Graph embedder) — if configured
3. **Deterministic** SHA-256 hash-bucket fallback — works offline, lower quality

L2-normalised so cosine = dot product. Default dim = 384.

## Operations

```bash
# health
node bin/siftcoder.mjs status

# force-drain
node bin/siftcoder.mjs drain 64

# backfill from past Claude Code transcripts
node bin/siftcoder.mjs backfill transcripts

# from V1/V2 install
node bin/siftcoder.mjs backfill --from-v2 ~/.siftcoder

# web UI
node bin/siftcoder.mjs web   # prints URL like http://127.0.0.1:5710
```

## Performance characteristics

Measured on a 16k-event corpus on M2 MacBook:

| Operation | Latency | Cost |
|---|---|---|
| `mem_search(q, k=10)` | ~25ms | $0 (Ollama) / ~$0.0003 (rerank with Sonnet) |
| `mem_get` | ~3ms | $0 |
| `mem_why` (depth 5) | ~15ms | $0 |
| `mem_drain` per batch=16 | ~3s (Ollama) / ~6s (Anthropic) | $0 (Ollama) / ~$0.005 (Anthropic) |
| Capture-observation hook | ~80ms (UDS round-trip) | $0 |

## Failure modes

- **Daemon not running** — hooks fire-and-forget with 250ms budget; capture is lost but session continues
- **Ollama down** — drain falls back to Anthropic
- **Both unavailable** — drain queues until one returns; events accumulate (visible via `status`)
- **Native binding broken** — automatic WASM fallback; postinstall logs the choice
- **Vector dim mismatch after embedder change** — `mem_search` errors; run `mem reset-vectors`
