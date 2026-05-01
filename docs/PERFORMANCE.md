# Performance + Cost

What to expect from SiftCoder at runtime — token cost, latency, scaling.

## TL;DR

- **Steady-state token cost: ~50× lower vs cloud-only** when Ollama is running locally
- **Hook latency: < 1 second** end-to-end (vs prior chained gates)
- **Memory daemon ping: ~80 ms** UDS round-trip on M-series Mac
- **`mem_search` p50: ~25 ms** at 16k summaries; ~150 ms at 100k

## Token cost model

Per session, cost is dominated by:

1. **Drain (summarisation)** — 1 LLM call per ~500-token event
2. **Embeddings** — 1 call per summary
3. **Reranking (optional)** — 1 call per `mem_search` if Claude reranker enabled

### Local-first defaults (Ollama running)

- Drain: Ollama `llama3.2:3b` — $0 per call (electricity only)
- Embeddings: Ollama `nomic-embed-text` — $0
- Reranker: optional, off by default

Steady-state cost on a 1,000-event session: **~$0**.

### Without Ollama (Anthropic fallback)

- Drain: Haiku 4.5, ~500 tokens-in × 100 tokens-out = ~$0.0005 per event
- Drain (Sonnet escalation when confidence < 0.6): ~10× Haiku
- Embeddings: deterministic fallback (free) — lower retrieval quality
- Reranker: off

Steady-state on 1,000-event session: **~$0.50** (Haiku-only) to **~$2.50** (heavy Sonnet escalation).

### Cloud-only comparison

Cloud-only baseline uses direct Anthropic for everything. Same 1,000-event session: **~$25-50**. SiftCoder with Ollama hits 50× reduction; without Ollama still 10× via Haiku-first cascade.

## Latency by operation

Measured on M2 MacBook Pro, M1 Linux box, and a Windows 11 desktop. Numbers are p50 / p95.

| Operation | M-series Mac | Linux x86 | Windows |
|---|---|---|---|
| `daemon ping` | 80 ms / 140 ms | 60 ms / 110 ms | 120 ms / 220 ms |
| `capture-observation` hook | 80 ms / 250 ms | 60 ms / 200 ms | 130 ms / 380 ms |
| `inject-memories` (PreCompact) | 200 ms / 600 ms | 180 ms / 550 ms | 350 ms / 1100 ms |
| `mem_search` (16k summaries) | 25 ms / 80 ms | 20 ms / 70 ms | 45 ms / 140 ms |
| `mem_search` (100k summaries) | 140 ms / 400 ms | 120 ms / 350 ms | 260 ms / 700 ms |
| `mem_drain` per batch=16 (Ollama) | 2.5 s / 4.0 s | 2.0 s / 3.5 s | 3.5 s / 6.0 s |
| `mem_drain` per batch=16 (Anthropic) | 5.5 s / 9.0 s | 5.5 s / 9.0 s | 5.5 s / 9.0 s |

## Scaling characteristics

### Storage size

| Summary count | DB size | `mem_search` p50 |
|---|---|---|
| 1k | ~5 MB | 5 ms |
| 10k | ~40 MB | 18 ms |
| 100k | ~400 MB | 140 ms |
| 1M | ~4 GB | needs `sqlite-vec` |

For corpora > 100k summaries, vector search benefits from `sqlite-vec` extension (auto-loaded if available with native backend). Without it, vector search stays JS-side and degrades linearly.

### Hook budget summary

| Hook | Default budget | Failure mode |
|---|---|---|
| `boundary-enforcer` | 5000 ms | Silent (any error → exit 0; never block on enforcer bug) |
| `capture-observation` | 250 ms | Silent fire-and-forget |
| `detect-console-logs` | 2000 ms | Silent |
| `auto-checkpoint` (opt-in) | 5000 ms | Silent |
| `inject-memories` (PreCompact) | 1500 ms | Silent fallback |
| `pin-incident` (Notification) | 250 ms | Silent fire-and-forget |
| `spawn-daemon` (SessionStart) | 3000 ms | Logs to spawn.ndjson; non-blocking |
| `should-continue` (Stop) | 5000 ms | Silent |

**Total per Write/Edit:** ~330 ms p95. **cloud-only equivalent:** 240+ seconds.

## Cost / latency trade-offs

### When to enable Ollama

- Long sessions (> 100 events)
- Daily SiftCoder use
- Multi-user team installs (deduped via federation)

### When to stay Anthropic-only

- Casual / one-off use
- Air-gap with no GPU (Anthropic API still works on small CPUs)
- Want highest summarisation quality without confidence-eval escalation

### When to add the reranker

- `mem_search` results need to be top-quality (e.g. for high-stakes decisions)
- Corpus > 50k summaries where RRF alone produces too many borderline hits

## Tuning knobs

In `settings.json` under `siftcoder.memory`:

| Knob | Default | Effect |
|---|---|---|
| `decay.tauMs` | 7d | Lower = faster decay (recent more dominant) |
| `retrieval.rrfK` | 60 | Lower = higher rank weighting (top hits dominate) |
| `retrieval.topK` | 10 | Result count |
| `retrieval.candidateK` | 50 | Pool size before RRF (larger = better recall, slower) |
| `consolidator.tickMs` | 30s | How often consolidator runs |
| `consolidator.batchSize` | 16 | Events per drain batch |
| `summarizer.confidenceThreshold` | 0.6 | Below = escalate to Sonnet |

## Profiling

```bash
# memory daemon CPU profile
siftcoder stop
node --prof dist/memory/daemon/index.js &
# trigger workload
kill -SIGTERM $!
node --prof-process isolate-*.log > daemon-profile.txt

# memory size on disk
du -sh ~/.siftcoder/workspaces/

# health log analysis
jq -r '. | select(.ok == false)' ~/.siftcoder/health.ndjson
```

## Known performance limits

- **WASM SQLite backend** is ~30% slower for writes than native better-sqlite3. Use native when possible.
- **Vector search is JS-side without `sqlite-vec`.** ~10k summaries is the practical limit for sub-100ms search.
- **Drain throughput is bound by the LLM backend.** Ollama on CPU: ~1 event/sec; Ollama on GPU: ~5-10/sec; Anthropic: ~1 event/sec (rate-limited).
- **First session-start spawn** can take ~2s on cold cache (subsequent are < 100ms).

## Comparison to cloud-only

| Metric | cloud-only | siftcoder | Delta |
|---|---|---|---|
| Hook chain per Write/Edit | 240 s blocking | 330 ms async | **~700× faster** |
| Steady-state token cost | $0.50/event Anthropic | $0/event Ollama | **∞× cheaper** |
| `mem_search` p50 | ~80 ms (similar engine) | ~25 ms | ~3× faster (newer FTS5) |
| Daemon spawn | included npm-rebuild path | slim, idempotent | no rebuild |

## Reporting performance issues

For perf regressions, file a bug (see `.github/ISSUE_TEMPLATE/bug.yml`) including:
- `siftcoder version`
- OS + Node version + storage backend (from `siftcoder status`)
- Repro workload (deterministic if possible)
- Profiler output if available
