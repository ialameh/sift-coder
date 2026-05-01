# Performance and Cost

What to expect from SiftCoder at runtime — token cost, latency, and how things scale.

## Latency (Apple M1, 16 GB)

| Operation | Backend | Latency |
|---|---|---|
| Capture (hook → daemon → SQLite) | n/a | < 5 ms p99 |
| Summarise one event | Ollama llama3.2:3b | ~ 1.5 s |
| Summarise one event | Anthropic Haiku | ~ 800 ms |
| Embed one summary | Ollama nomic-embed-text | ~ 140 ms |
| `mem_search` k=5 | BM25 + dense + RRF + decay | < 50 ms p99 |
| Backfill 1 000 events | replay → daemon | ~ 12 s |
| Drain 1 000 events | Ollama serial | ~ 25 min |
| Drain 1 000 events | Anthropic Haiku | ~ 13 min |

## Token cost

Per-event drain cost depends on backend:

| Backend | Input tokens | Output tokens | Cost |
|---|---|---|---|
| Ollama | ~80 (prompt) + payload | ~30 | $0 (local) |
| Anthropic Haiku | ~80 + payload | ~30 | ~ $0.0001 |
| Anthropic Sonnet (escalation) | ~80 + payload | ~30 | ~ $0.003 |

For a typical 1 000-event session:

- **Ollama: $0** (electricity only)
- **Anthropic Haiku-only: ~$0.10**
- **Anthropic Haiku + 10% Sonnet escalation: ~$0.40**

## Cache hits

Summaries are cached by `(model, prompt_hash, input_hash)`. Repeating an identical capture (same tool input bytes) reuses the cached summary at zero LLM cost. This kicks in heavily when:

- The same file is read multiple times
- The same Bash command is repeated
- Backfill is re-run on already-imported sessions

Cache hit rate visible via `/siftcoder:mem status` → "Spend: cache hits".

## Compression ratio

Summary tokens stored vs payload tokens captured:

| Capture volume | Compression ratio |
|---|---|
| ~100 events | ~5–8 % |
| ~1 000 events | ~3–5 % |
| ~10 000 events | ~2–4 % |

Lower is more compressed. The ratio improves as the consolidator merges duplicate or near-duplicate summaries.

## A/B savings (200-turn benchmark)

Synthetic 200-turn coding session, average payload ~6 KB:

| Branch | Cumulative tokens |
|---|---|
| Branch A (full history every turn) | ~12.3 M |
| Branch B (memory-backed, top-k retrieval per turn) | ~117 K |
| **Saved** | **~99.0 %** |

Reproduce with `/siftcoder:mem ab --turns=200 --k=5`.

## Scaling

The current implementation handles workspaces up to about 10 000 summaries comfortably. Above that:

- BM25 over FTS5 stays sub-100 ms
- Dense cosine is JS-side (Float32Array, 768-dim) and degrades to ~150 ms at 10K rows
- For larger corpora, enable `sqlite-vec` (native backend only — see [memory.md](MEMORY.md))

## Disk usage

- Per event: ~1–4 KB (capture payload + indexes)
- Per summary: ~0.5–1 KB (text + embedding + FTS)
- Typical workspace at 1 000 events / summaries: ~3–5 MB

## See also

- [memory.md](MEMORY.md) — engine architecture
- [troubleshooting.md](TROUBLESHOOTING.md) — when latency or cost looks wrong
