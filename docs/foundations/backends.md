# Backends

SiftCoder calls out to LLM-shaped services in three places. Each is a separate backend with its own selection rules, its own failure modes, and its own reasons to care.

The three roles:

1. **Summariser.** Turns raw event payloads into one-paragraph summaries. Runs on the consolidator tick, batched. Quality matters here — a bad summary makes search worse forever.
2. **Embedder (drain-time).** Vectorises each new summary text. Runs once per summary. The vector lives in `summary_embeddings` and is what powers the vector leg of search.
3. **Embedder (retrieval-time).** Vectorises the *query* on every search call. Cosine is computed against all stored summary embeddings. Must produce a vector in the same space as the drain-time embedder, or the cosine numbers are nonsense.

The summariser and the embedder are two different cascades. They overlap (both can use Ollama) but they're configured separately and fail independently.

## The cascades

From `src/core/config.ts`:

```ts
drainBackendCascade: ['ollama', 'anthropic', 'sampling'],
embedderCascade: ['ollama', 'cdg', 'deterministic'],
```

These are tried in order. The first one that's reachable wins. You can pin a backend explicitly via env (`SIFTCODER_DRAIN_BACKEND`, `SIFTCODER_EMBEDDER`) or via config (`memory.drainBackend`, `memory.embedder`). The accepted explicit values for the summariser are `ollama | anthropic | sampling | auto`; for the embedder, `ollama | cdg | deterministic | auto`. `auto` means "walk the cascade."

The order is opinionated: prefer local, prefer free, fall back to network only when forced. Ollama first because it's local and cheap. The cloud paths are there so that if you don't have Ollama, the tool still works — but they're not the default.

## Summariser backends

### `ollama`

`src/memory/ollama-client.ts`. Hits Ollama's HTTP API at `http://localhost:11434` (override with `SIFTCODER_OLLAMA_HOST` or `OLLAMA_HOST`). The default model is `llama3.2:3b`; override with `SIFTCODER_OLLAMA_MODEL`. Uses Ollama's `format: "json"` constrained-generation mode so the model is forced to emit valid JSON matching the `{text, confidence}` shape the summariser expects.

Probe: `GET /api/tags`, 1.5s timeout. If it returns `200`, Ollama is "available."

Failure modes:

- **Daemon not running.** Probe fails, cascade falls through to `anthropic`.
- **Model not pulled.** Probe succeeds (the daemon is up) but `/api/generate` returns "model 'llama3.2:3b' not found." `firstError` in the drain result will say so. Fix: `ollama pull llama3.2:3b`.
- **Timeout on first call.** Default is 30s. Cold-load of a 3B model takes 5-10s; first call after a long idle takes longer because the model has been swapped out of RAM. If you see consistent timeouts, raise `SIFTCODER_OLLAMA_TIMEOUT_MS` or warm the model before drain (`curl -s -d '{"model":"llama3.2:3b","prompt":"hi"}' http://localhost:11434/api/generate >/dev/null`).
- **Model produces malformed JSON.** Smaller models occasionally do. The summariser parses with `JSON.parse`; failure surfaces as a thrown error and the event is marked `skipped`.

Recommended models, from the source comment:

```
- llama3.2:3b      ~2GB, ~50 tok/s on M1, good instruction following
- qwen2.5:3b       ~2GB, excellent JSON output
- gemma2:2b        ~1.6GB, fastest
```

### `anthropic`

`src/memory/anthropic-client.ts`. Direct call to the Anthropic Messages API. Reads the API key from `SIFTCODER_ANTHROPIC_API_KEY` (preferred — lets you scope a separate budget) or `ANTHROPIC_API_KEY`. No SDK dependency; uses global `fetch`. Retries once on 5xx by default.

Default model on this path is whatever `req.model` says — the summariser passes `claude-haiku-4-5-20251001` (from `memory.summarizer.modelHaiku` in config). Sonnet is reserved for high-stakes calls (the rerank path, some skills); Haiku is the default for plain summarisation.

Failure modes:

- **No API key.** Constructor throws `AnthropicClient: no API key (...)`. Cascade falls through to `sampling`.
- **Network error / 5xx.** One retry, then throws. Drain marks the events `skipped`.
- **Rate limit (429).** Surfaces as an error in `firstError`. Wait a bit and re-drain.
- **Quota exhausted.** Same shape as rate limit. Check your Anthropic dashboard.

You'd disable the Anthropic backend entirely by leaving the env vars unset *and* removing it from the cascade in your config. The latter matters: if you have `ANTHROPIC_API_KEY` set globally for other tools and you don't want SiftCoder to use it, set `memory.drainBackend` to `ollama` (not `auto`) and `memory.drainBackendCascade` to `['ollama']`. Then the cloud path is genuinely unreachable.

### `sampling`

`src/memory/mcp/sampling-client.ts`. Delegates to the MCP host (Claude Code itself) via `sampling/createMessage`. The host runs the LLM call under its own credentials and billing. From the plugin's perspective there's no API key, no rate limit to manage, no network to worry about — you just send a request to the transport and the host comes back with text.

Important caveat from `src/memory/daemon/index.ts`:

```
Note: Claude Code CLI 2.1.x does NOT implement MCP `sampling/createMessage` (returns
JSON-RPC -32601). Until that lands, drain requires the fallback path.
```

So in the version of Claude Code most people are running today, `sampling` is the *last* fallback in the cascade and it doesn't actually work. The cascade ends at `anthropic` for any practical purpose. If/when Claude Code ships sampling support, this path becomes the natural default — host-billed, no plugin-side key, no extra service to run.

Failure mode: every call returns JSON-RPC -32601 ("method not found"). The summariser sees that and the event is marked `skipped`. Drain reports zero processed and a `firstError` saying so.

## Embedder backends

### `ollama`

`src/memory/ollama-embedder.ts`. Hits `POST /api/embeddings` on the local Ollama daemon. Default model is `nomic-embed-text` (768 dimensions); override with `SIFTCODER_OLLAMA_EMBED_MODEL` and `SIFTCODER_OLLAMA_EMBED_DIM`.

The probe is more thorough than the summariser's: it not only checks `GET /api/tags` returns `200`, it also confirms the configured embedding model is in the returned model list. Ollama-the-daemon being up isn't enough; the *embedding model* has to be pulled. Otherwise the probe fails and the cascade moves on.

Failure modes:

- **Daemon up, model not pulled.** Probe fails. Falls through to next.
- **Empty embedding response.** Ollama occasionally returns `{}` instead of `{embedding: [...]}`. The code tolerates this and returns a zero vector — cosine returns 0, which downgrades the document but doesn't crash the drain. Comment in the source: *"Don't crash the drain on a single bad embed."*
- **Wrong dim.** If you set `SIFTCODER_OLLAMA_EMBED_DIM=384` but the model returns 768, you get a 768-d vector L2-normalised. Cosine still works among themselves, but if you later switch to a real 384-d model, those rows are now in the wrong space. See the [Memory model](memory-model.md) discussion of `dim`.

Recommended models, from the source:

```
- nomic-embed-text   137M params, 768 dim, 8192 ctx — best general-purpose default
- mxbai-embed-large  335M params, 1024 dim — higher quality, slower
- all-minilm         23M params, 384 dim — drop-in same dim as deterministic
```

### `cdg`

`src/memory/cdg-embedder.ts`. CDG is an internal/optional embedding service (Code Discovery Graph). Activated by `SIFTCODER_CDG_URL`. If it's set and reachable, embeddings get sent to that service. If not, the cascade falls through. This is mostly relevant if you're running SiftCoder in a corporate environment with a hosted embedding service; otherwise it'll never be selected.

### `deterministic`

`src/memory/embedder.ts:DeterministicEmbedder`. The last-resort fallback. The implementation is short and worth reading verbatim:

```ts
async embed(text: string): Promise<Float32Array> {
  const v = new Float32Array(this.dim);
  const tokens = text.toLowerCase().match(/[a-z0-9_]+/g) ?? [];
  if (tokens.length === 0) return v;
  for (const tok of tokens) {
    const h = createHash('sha256').update(tok).digest();
    const bucket = h.readUInt32BE(0) % this.dim;
    const sign = (h.readUInt8(4) & 1) === 0 ? 1 : -1;
    v[bucket]! += sign;
  }
  return l2Normalize(v);
}
```

Tokenise on word boundaries, hash each token, increment one of 384 buckets with a `±1` based on the hash. L2-normalise. That's it.

What it gets right: it's deterministic (same text → same vector, always), it's content-sensitive (different text → different vector), it has zero dependencies, and it works with no infrastructure. Tests use it. CI uses it. First-run-after-install uses it.

What it gets wrong: it has no semantics. "auth token" and "credential" share zero buckets, so cosine between them is roughly zero. "auth token" and "the auth token expired" share most of their buckets, so cosine is high — but only because the literal words overlap. Functionally, when this embedder is active, your vector leg is a noisy duplicate of BM25.

The retrieval code still works — fusion just gets less signal from the vector side. Search degrades gracefully rather than failing. You'd reach for this knowingly when you can't or don't want to run anything else; you'd otherwise want to upgrade to Ollama or CDG as soon as possible.

## "I'm offline at the cafe — what still works"

Capture works. Events go into the database whether or not anything is reachable. The hook just talks to the local daemon over a Unix socket; no network involved.

Search-without-embeddings works. BM25 over the FTS5 index doesn't need an embedder at all; it just won't have a vector leg to fuse with. Results are lexical-only, which is degraded but useful.

Embedding the query at retrieval time falls back to whatever's available. If you had Ollama running for embeddings before going offline, you still have it (it's local). If you were on CDG, that's a network service, so it'll be down — cascade falls through to `deterministic`. Note that this means the *query* is now embedded with the deterministic embedder while the *stored summaries* were embedded with whatever-was-up-before. Two different vector spaces, cosine is meaningless, vector leg returns garbage. This is the most surprising offline failure mode and the reason to prefer Ollama for embeddings if you sometimes work offline — the same local model is up wherever you are.

Summarisation depends on the cascade. If you had Ollama doing the summarising, you're fine — local model, no internet needed. If you were relying on Anthropic API or sampling, drain stops working until you reconnect. Captured events accumulate as `raw` and drain on the next online drain pass. Nothing is lost; consolidation is just delayed.

## The drain is best-effort

When drain fails (any backend, any reason), the affected events are marked `skipped` and not retried. The reasoning is in `src/memory/mcp/handler.ts:drain` — every error increments the count and `firstError` records the first message so you can diagnose. The event isn't deleted; it's still in `events` with `payload_json` intact. You can re-process it manually by setting `status='raw'` and running `/siftcoder:mem drain` again, but nothing in the box does this for you.

This is a deliberate tradeoff. The alternative — automatic retries with backoff — would mean a bad payload (one that always crashes the summariser) burns budget forever. Marking and moving on is the conservative choice. The price is that occasional events sit in `skipped` even after the underlying issue (rate limit, missing model) is resolved.

When you fix a backend issue, the right move is:

```sql
UPDATE events SET status = 'raw' WHERE status = 'skipped' AND ts > <ts of the outage>;
```

Then `/siftcoder:mem drain` will pick them up. If you don't care about historical skipped events, do nothing — they're just rows.
