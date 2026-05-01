# Cost

SiftCoder has a cost story and an anti-cost story. The cost story is that summarising every tool call with an LLM and embedding every summary costs real CPU and real money if you use a paid backend. The anti-cost story is that *not* having memory means paying Anthropic to re-explain your project at the start of every session, and that's usually larger than what summarisation costs.

This chapter is about the actual levers and the actual numbers. No hand-waving.

## The four levers

Everything that affects cost goes through one of four config values in `src/core/config.ts`:

```ts
memory: {
  drainBackend: 'ollama' | 'anthropic' | 'sampling' | 'auto',
  embedder: 'ollama' | 'cdg' | 'deterministic' | 'auto',
  consolidator: { tickMs: 30_000, batchSize: 16 },
}
```

**Drain backend** — what LLM does the summarisation. Ollama is local and free; Anthropic is cloud and paid; sampling routes through Claude Code's own LLM access (paid through your existing Claude subscription).

**Embedder** — what produces the vectors. Ollama (`nomic-embed-text` by default) gives genuinely useful 768-dim vectors. CDG is a Code Description Generator (newer addition, embeds based on structured code understanding). Deterministic is a hash-based fallback — fast and free, but the vectors don't capture semantic similarity well.

**Batch size** — how many events the consolidator summarises per tick. Larger batches mean fewer LLM round-trips, but each call takes longer and is more likely to fail mid-batch.

**Tick interval** — how often the consolidator runs. Faster ticks mean events become searchable sooner; slower ticks mean less background CPU.

## Recommended setup, with reasons

For most users, the right configuration is what the defaults already give you:

```ts
drainBackend: 'auto',                              // Ollama first, Anthropic if no Ollama
drainBackendCascade: ['ollama', 'anthropic', 'sampling'],
embedder: 'auto',
embedderCascade: ['ollama', 'cdg', 'deterministic'],
consolidator: { tickMs: 30_000, batchSize: 16 },
ollama: {
  endpoint: 'http://localhost:11434',
  embedModel: 'nomic-embed-text',
  summarizeModel: 'llama3.2:3b',
}
```

This means: Ollama with a small fast summarisation model, Ollama for embeddings, 16-event batches every thirty seconds. Total cost: free, plus the laptop CPU that would otherwise be idle.

The `auto` cascade means if Ollama isn't running, the daemon falls back to Anthropic without asking. This is convenient on a laptop that sleeps, but it's a footgun if you're on a metered API budget — close your laptop, open it elsewhere, Ollama isn't up yet, the daemon quietly switches to Anthropic, you start spending. If that's a concern, hard-pin `drainBackend: 'ollama'` so it errors instead of falling back.

## Worked numbers

A real workspace generates somewhere between 100 and 5000 events per day. Let's price it.

**Active solo developer, 800 events/day, all on Anthropic Haiku.**

Each event's payload is roughly 200–800 tokens going in (the redacted tool input + tool output). The summarisation prompt adds maybe 150 tokens of instructions. Output is typically 50–100 tokens.

So: 800 events × ~600 input + 80 output = roughly 480k input tokens and 64k output tokens per day, going through Haiku.

At Haiku 4.5 prices (rough check needed against current Anthropic pricing): low single-digit dollars per million input tokens, somewhat higher for output. Daily cost in the range of $0.50–$2 per day for summarisation alone, plus a smaller embedding cost if you're using the `cdg` embedder rather than Ollama.

That's $15–60 per month for memory on a paid backend. Not nothing. For a solo developer paying per-token, this is the case where Ollama earns its keep — the same workload runs free on a laptop that's already running other dev tools.

**Same workload on Ollama.**

Zero dollars. The cost is laptop CPU and battery. On an M-series Mac with `llama3.2:3b`, summarisation runs in roughly 0.5–2 seconds per event. 800 events per day at 1 second each is 13 minutes of CPU spread across the day — barely noticeable.

The tradeoff is summary quality. `llama3.2:3b` produces *adequate* summaries — they're file-anchored, decision-focused, retrievable. They're not as crisp as Haiku's. For pure capture-and-retrieve workloads, the difference is hard to feel. For high-stakes summaries (architectural decisions you want to be able to read months later), some skills explicitly route to Sonnet via the sampling backend.

**Heavy team user, 3000 events/day, mixed.**

3000 events/day means 1.8M input tokens and 240k output through Haiku — call it $5–15/day, $150–450/month. At this scale Ollama is the obvious win. The same workload on a workstation with a 12B-parameter model still runs free; the model is just slow enough that you actually notice it during peak bursts (you'll see `raw` count spike and take a few minutes to clear).

**Backfill cost.**

Backfill replays transcripts into the events table. The events themselves are written for free — backfill doesn't call any LLM. The cost is the subsequent drain. Backfill 1000 events, then drain them through Anthropic, expect to pay the equivalent of 1.25 days of normal capture in one burst.

Backfill through Ollama is free; you just wait longer. On a laptop, 1000 backfilled events take 15–30 minutes to fully drain.

## The `tokens_est` field

Every event row includes a `tokens_est` column — a rough estimate of how many tokens the event payload represents. Computed cheaply (character count divided by 4 plus some heuristics), not exact, but good enough for capacity planning.

You can sum it to get a sense of throughput:

```sql
SELECT date(ts/1000, 'unixepoch') as day, SUM(tokens_est) as tokens, COUNT(*) as events
FROM events
GROUP BY day
ORDER BY day DESC
LIMIT 14;
```

Run that against your SQLite file. You'll get a fortnight of daily token volume. Multiply by your backend's per-token rate to get an actual dollar number — far more accurate than any estimate this chapter could give, because it's your real workload.

The `tokens_est` is also what the budget tracker (`siftcoder budget`) uses for forecasting. If you want a hard ceiling on summarisation spend, set a budget cap; the consolidator will stop draining when the cap is hit, leaving events at `status='raw'` until the next budget window.

## Batch size and tick interval tradeoffs

**Larger batches.** Batch size of 32 or 64 instead of 16. Pros: fewer LLM round-trips, lower per-event overhead. Cons: a single batch failure (rate limit, timeout) loses more progress; the LLM context grows with batch size, raising per-token spend slightly even on Anthropic; on Ollama, large batches push past context limits and silently truncate.

For Ollama with `llama3.2:3b` (8k context), 16 is roughly the right ceiling. For Haiku (200k context), you can comfortably go to 64 — but you won't see meaningful cost savings, just throughput.

**Faster ticks.** Tick interval of 10 seconds instead of 30. Pros: events become searchable sooner; the queue stays shallower under bursty load. Cons: more frequent wake-ups, more CPU when idle, more LLM calls when the queue is small.

If you're working bursty (lots of events in 10-minute windows, then quiet), keep the default 30s. If you're working steadily and want sharp retrieval, drop to 15s. Don't go below 10s; the consolidator's startup overhead per tick starts to dominate.

**Slower ticks.** Tick interval of 60 seconds or more. Pros: less background CPU; cheaper on Ollama because the model can stay paged out longer. Cons: more events accumulate in `raw`, longer lag before they're searchable, longer recovery time after a backend outage.

Useful on a laptop with limited battery. The cost of less-fresh memory is usually invisible during normal work.

## Embedder choice

Ollama embedder (`nomic-embed-text`, 768-dim): genuinely good vectors, free, runs on the same Ollama you're using for summarisation. Slightly slower per row than the deterministic fallback. **Default and recommended.**

Deterministic embedder (384-dim, hash-based): produces a vector by hashing tokens into buckets. Fast, free, no model to install. Useful as a fallback when Ollama is down. Vectors don't capture semantic similarity — "fix null check" and "guard against undefined" will rank as far apart as random pairs. Retrieval still works because BM25 over the FTS5 index still works; you lose the vector leg of the hybrid search.

CDG embedder (newer): structured code-aware embeddings. Better than Ollama for code-heavy workloads but requires its own backend. Worth a look if you're indexing a large legacy codebase.

The `auto` cascade tries Ollama first, then CDG, then deterministic. You'll usually be on Ollama. If you ever see retrieval get noticeably worse, check whether Ollama is up — falling through to deterministic is the most common cause.

## Practical advice

If you have Ollama, use Ollama for everything. Set `drainBackend: 'ollama'` and `embedder: 'ollama'` and forget it.

If you don't have Ollama and don't want to install it, use Anthropic and watch your monthly bill for a couple of weeks. If it's under $30/month, ignore the cost and use the paid backend; it's not worth the optimisation effort. If it's over $30/month, install Ollama.

If you're on a corporate machine where you can't run Ollama, the sampling backend (which goes through Claude Code's own LLM access) is usually billable to your existing subscription rather than a separate API spend. Check your org's setup; this can make memory effectively free without local inference.

Don't tune `tickMs` or `batchSize` until you have a measured reason. The defaults work for the default workload, and the failure modes of aggressive tuning (race conditions in the consolidator, hot-loop CPU on tiny ticks) are harder to debug than the cost they save.
