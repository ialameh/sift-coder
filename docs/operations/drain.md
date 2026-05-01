# Drain

Drain is the step that turns captured tool calls into searchable memory. Capture is fast — the hook writes a row to the events table tagged `status='raw'` and returns in a couple of milliseconds. Drain is slow — it pulls those raw rows, sends each one to an LLM for summarisation, computes an embedding for the summary, and updates the row to `status='summarized'`. Without drain, you have a log of tool calls but no searchable text and no vectors.

Drain runs automatically. You will rarely need to invoke it by hand. The exceptions are documented at the end.

## What the consolidator does

When the daemon starts, it spins up a background consolidator that ticks on an interval. The defaults from `src/core/config.ts`:

```
consolidator: { tickMs: 30_000, batchSize: 16 }
```

Every thirty seconds the consolidator:

1. Queries SQLite for up to 16 events with `status='raw'`, ordered by `id` (oldest first).
2. For each event, builds a prompt from the redacted payload and sends it to the configured drain backend.
3. The backend returns summary text. The summarizer writes a row to `summaries` with the source `event_id`, the text, the model name, and a token count.
4. The embedder turns the summary text into a float32 vector. The vector is written to `summary_embeddings` with the `summary_id` as foreign key.
5. The event row is updated to `status='summarized'`.

If any step throws, the event stays at `status='raw'` and is retried on the next tick. After repeated failures it is marked `status='skipped'` and never retried — see "Skipped events" below.

The 30-second tick is a tradeoff between throughput and latency. Ticking faster means events become searchable sooner; ticking slower means fewer round-trips to the LLM and lower CPU when idle. Thirty seconds was picked because it is shorter than a typical user's pause-to-think interval — by the time you've finished writing your next prompt, last turn's events are already summarised and indexable.

The 16-event batch size is similarly a tradeoff. With Ollama on a laptop, a batch of 16 takes 10–30 seconds depending on model and event size; that comfortably fits inside the 30-second tick. With Anthropic Haiku, a batch of 16 takes 2–5 seconds; you could comfortably push the tick interval up and the batch size down. If you raise the batch size beyond what the LLM can finish before the next tick, the consolidator will overlap runs — which is fine in principle but adds queue depth and makes failure modes harder to reason about. Don't go over 64 unless you've measured.

## The CLI: forcing a drain

```
siftcoder drain [batch]
```

Default batch is 32 (note: the CLI's default is larger than the consolidator's per-tick default of 16, because manual drains are usually catch-up runs).

The CLI implementation in `bin/siftcoder.mjs` is interesting in one respect: it doesn't go through the daemon socket. It opens its own SQLite handle, instantiates a `Summarizer` and a `DeterministicEmbedder` directly, and processes events synchronously. This is deliberate — manual drain is the recovery path you reach for when the daemon's consolidator is stuck or failing, and you want a fresh process with full visibility into the error.

The cascade order for picking a backend is `Ollama → Anthropic`:

```js
if (await OllamaClient.available()) {
  modelClient = new OllamaClient();
} else if (AnthropicClient.available(process.env)) {
  modelClient = new AnthropicClient();
} else {
  throw new Error('no drain backend available: start Ollama or set ANTHROPIC_API_KEY');
}
```

If both are configured, Ollama wins. This keeps the manual drain free even when an Anthropic key is set. To force Anthropic, stop the Ollama service for the duration of the drain.

The output is a JSON report:

```json
{
  "backend": "ollama",
  "processed": 32,
  "errors": 0,
  "pending": 18
}
```

`pending` is the number of events still at `status='raw'` after the run — useful to decide whether to fire another drain immediately.

## When to drain manually

Three real cases:

1. **You ran a heavy session and want it indexed before you context-switch.** You spent two hours debugging, generated 400 raw events, and you're about to put the laptop down. Default tick will catch up overnight, but you want to be sure. `siftcoder drain 64` a few times until `pending` is zero.

2. **The consolidator is stuck and you want a clean retry.** The daemon's tick may be repeatedly failing on a poison-pill event. A manual drain runs in a fresh process with the same code path; if it succeeds, the issue was transient. If it fails with a clear error message, you have something to file.

3. **Right after a `backfill`.** You've just inserted a thousand replay events, all at `status='raw'`. The consolidator will catch up at 16 per tick — about thirty minutes — but you can shorten that to a few minutes with `siftcoder drain 64` in a loop, or just one big batch if you're using Anthropic and don't mind the API spend.

You should *not* drain manually as a routine. The tick is sized for the typical workload. If you find yourself draining every hour because the queue keeps backing up, the right fix is to raise `batchSize` in `~/.siftcoder/<ns>/config.json`, not to add a cron job.

## Skipped events

If summarisation throws, the manual CLI sets `status='skipped'` immediately:

```js
} catch (e) {
  storage.markEventStatus(ev.id, 'skipped');
  errors++;
  firstError ??= e.message;
}
```

The daemon's consolidator is more forgiving — it retries a configurable number of times before giving up. Either way, once an event is `skipped` it stays skipped; it does not re-enter the queue. The skipped count is a permanent tally of summarisation failures.

This is the correct behaviour. If a payload is malformed enough that the LLM consistently refuses to summarise it (truncated tool output, weirdly encoded bytes, prompt injection attempt), retrying forever costs money and never succeeds. Marking it `skipped` and moving on means one bad event doesn't poison the whole queue.

You do lose retrieval over the skipped event's content, but the event itself is still in the database — you can inspect it with `sqlite3` if you need to know what was in it, or with `mem_get` if you have its id.

## Worked example: a stuck drain

You notice that `summarized` has been flat for ten minutes despite a growing `raw` count.

```
$ /siftcoder:mem info
counts      events=412  raw=87  summarized=325  skipped=0  summaries=325  embeddings=325
```

Eighty-seven events have been waiting and the consolidator isn't progressing. Force a drain to see the error:

```
$ /siftcoder:mem drain 32
{
  "backend": "ollama",
  "processed": 0,
  "errors": 32,
  "pending": 87,
  "firstError": "fetch failed: connect ECONNREFUSED 127.0.0.1:11434"
}
```

Ollama is down. The consolidator has been failing every tick for ten minutes, but because it doesn't surface errors to your prompt, you didn't notice. The fix is `ollama serve` (or `brew services start ollama` on macOS, depending on your install). Once Ollama is back:

```
$ /siftcoder:mem drain 64
{
  "backend": "ollama",
  "processed": 64,
  "errors": 0,
  "pending": 23
}

$ /siftcoder:mem drain 32
{
  "backend": "ollama",
  "processed": 23,
  "errors": 0,
  "pending": 0
}
```

Queue cleared. The consolidator's next tick will find zero pending and go back to idle. No data was lost — the events sat at `status='raw'` the entire time and were waiting for a working backend.

A different failure shape: events succeed individually but slowly. You drain 32 and it takes four minutes. That's an Ollama on an underpowered machine, or a model that's too large for the workload. The fix is either a smaller summarisation model (`llama3.2:1b` instead of `3b`) or accepting that drain runs in the background and you don't need to watch it.

A third failure shape: the drain reports `errors > 0` and `firstError` says something like `Anthropic 401`. Your API key is missing or revoked. Check `ANTHROPIC_API_KEY` in your environment, regenerate if needed, and re-drain.

## Caveats and pitfalls

**The consolidator class in `daemon/consolidator.ts` is *not* the summarisation drain.** Confusingly, the file named `consolidator.ts` is the *embedding-deduplication* worker — it scans for near-duplicate summaries (cosine ≥ 0.95) and marks older ones as superseded by newer ones. The summarisation queue lives in `daemon/summarizer.ts` and is wired up by the daemon's main loop. Both are part of "drain" colloquially, but they're separate ticks with separate intervals. The dedup consolidator runs every five minutes by default (`5 * 60 * 1000`).

**Manual drain bypasses the daemon.** Because `siftcoder drain` opens its own SQLite handle, you can technically run it while the daemon is also running. SQLite's WAL mode handles the concurrent access correctly, but the daemon's consolidator might pick up events between your runs. This is harmless — both code paths use the same `markEventStatus` semantics — but it can make the `pending` count in your CLI output slightly racy. Don't use the number for anything load-bearing; use it as a hint that more drains are needed.

**Embedder choice affects drain speed.** The CLI hard-codes `DeterministicEmbedder(384)` for manual drains. The daemon's main loop uses the configured `embedder` from config (Ollama by default). Ollama embeddings are slower per-row but produce richer vectors; the deterministic fallback is fast but produces hash-based vectors that don't capture semantic similarity well. If you manually drain a backlog, the resulting embeddings will be deterministic-quality, which means subsequent retrieval over those rows will lean on BM25 more than on vector similarity. Not the end of the world, but worth knowing if your "find similar" queries get worse after a big manual drain.
