# Retrieval

Retrieval is the only path through which memory affects what Claude sees. Capture is invisible — events flow into SQLite whether you ask for them or not. Retrieval is the opposite: nothing comes back unless something on the other side calls `mem_search`. This chapter is what happens when it does.

The whole search function is in `src/memory/retrieval.ts`. It is short. Read it once and most of this chapter becomes detail.

## Two legs and a fuse

Search has two independent legs.

**The lexical leg.** SQLite's FTS5 extension indexes every summary's text. Query goes through `sanitizeFtsQuery` (strips FTS5 operators like `AND`, `OR`, `NEAR`, `+`, `-`, `*`, `:`, `^` and reduces to alphanumeric tokens — without this, a query like "fix the auth-middleware bug" blows up with `fts5: syntax error near "-"`). The sanitised query goes into `MATCH`, FTS5 returns rows ordered by `bm25(summaries_fts)`. BM25 is a lexical relevance score — it rewards term frequency, penalises term-document overlap with the corpus, and doesn't care about meaning. If your query has the literal word "middleware" and the summary has the literal word "middleware," BM25 will find it.

**The vector leg.** The query is embedded by whichever embedder is wired up at the time. The daemon then loads `allEmbeddings()` — every `(summary_id, vec, ts)` row — and computes cosine similarity in JavaScript. Comment in the source:

```
Vector search is intentionally JS-side over allEmbeddings(): for the small N typical of memory
(up to ~10k summaries), this is faster than round-tripping a sqlite-vec MATCH per query, and
avoids the optional native dependency. Switch to vec0 when corpora exceed that scale.
```

Both legs return up to `candidatePool` candidates (default 50). The two ranked lists are then fused.

## Reciprocal Rank Fusion

The fusion is straight RRF. Each leg gives every hit a rank (1, 2, 3...). The combined score for a document is

```
score(d) = Σ_l ( weight_l / (rrf_k + rank_l(d)) )
```

with `rrf_k = 60` by default (from `DEFAULTS` in `retrieval.ts` and `memory.retrieval.rrfK` in `src/core/config.ts`). `bm25Weight` and `vectorWeight` both default to 1, so neither leg dominates. The sum is taken over whichever legs returned the document — a hit found only by BM25 just gets the BM25 term; ditto for vector-only.

Why RRF and not a weighted sum of normalised scores? Because BM25 scores and cosine similarities live on completely different scales (BM25 is unbounded negative, cosine is in `[-1, 1]`), and any normalisation you pick is a guess. RRF only uses *ranks*, which are scale-free. It's robust, it's boring, it's been the default in academic IR fusion benchmarks for fifteen years. We didn't try to be clever.

## Time decay

After RRF, each score is multiplied by an exponential decay factor:

```
boost(d) = exp(-(now - ts(d)) / tau_ms)
```

with `tau_ms = 7 * 24 * 60 * 60 * 1000` (seven days) by default. The config exposes both `tauMs` and `halfLifeDays`. They describe the same curve from two angles: at `tauMs` ago the boost is `1/e ≈ 0.37`; at `halfLifeDays` ago the boost is `0.5`. The defaults in `src/core/config.ts`:

```ts
decay: { tauMs: 7 * 24 * 3600 * 1000, halfLifeDays: 7 }
```

Note that the two defaults aren't internally consistent — `tauMs=7d` puts the half-life at `7 * ln(2) ≈ 4.85` days, not 7. The retrieval code uses `tauMs` directly; `halfLifeDays` is informational. If you want to tune decay, set `tauMs` and ignore `halfLifeDays`.

The reason for decay at all: a summary from six months ago about a function that has since been rewritten is mostly noise. Without decay, BM25 will surface it on every query that mentions the function name. Decay doesn't *delete* old memories — they're still there, still indexed — it just means a recent summary on the same topic outranks them.

You'd want to disable decay (set `tauMs` to a huge number) when you're doing archaeological work — "what did we figure out about this codebase six months ago" — because in that case recency is a bug, not a feature.

## When BM25 wins, when vector wins

The two legs catch different things and the failure modes are characteristic.

**BM25 wins when** the query contains the exact tokens you remember. "the bug in `parseConfig`" lands on summaries that literally contain `parseConfig`. BM25 is great for proper nouns, function names, file paths, commit hashes, error strings — anything where the surface form is what you'd want to match.

**Vector wins when** the query phrases something the summary doesn't literally contain. "what did we figure out about auth tokens" might match a summary that says "fixed null-deref when JWT was malformed" — there's no token overlap, but the embedder put both phrases near each other in vector space. Vector is what saves you when you don't remember the exact words.

**Both lose when** the query is too short or too generic. "the thing" returns whatever has high background term frequency; "fix" matches every fix you've ever made. Neither leg helps. The honest answer is: the corpus can't be searched for things you can't describe.

When the deterministic embedder is the active embedder (no Ollama, no CDG), the vector leg is *technically working* but functionally weak — it's a hash-bucket pseudo-embedding, not a learned model. Cosine between two such vectors really only fires when the two texts share a lot of literal tokens, which means it's basically a noisier BM25. In that mode you should expect search quality to feel BM25-only. Pull `nomic-embed-text` on Ollama to get the real vector leg.

## Candidate pool, top-k, and the rerank hook

Two `k` values matter:

- `candidatePool` (default 50) is how many hits each leg returns into the fusion. After RRF and decay, the merged list is sorted, sliced, and the top `k` (default 5) is what ships back over the socket. The pool is what lets fusion actually fuse — if you cut to top-5 on each leg first, you'd lose the cases where a document is rank 12 on one side and rank 4 on the other.
- `k` is what comes back to the caller. `mem_search` takes `k` as an argument; default 5.

There's also an optional rerank stage. `cfg.rerank` toggles a deterministic re-ranker (`src/memory/reranker.ts`, light-weight). `opts.asyncReranker` is a hook for an LLM reranker — `src/memory/claude-reranker.ts` is one such; it sends the candidate pool to a Claude call and lets the model pick the best subset. Async rerank is off by default because it adds an LLM call to every search. You'd reach for it on retrieval-quality-sensitive workflows like `/siftcoder:investigate` where the cost is justified.

A final escape hatch: `opts.boostFn` lets the caller multiply each hit's score by a custom factor. Used by the `/siftcoder:focus` command to upweight memories from a particular feature area without rewriting the retrieval core.

## Suppressed summaries

Before scoring, retrieval calls `storage.supersededIds()` and drops any hit whose id is in there. Those are summaries that the consolidator marked as near-duplicates of newer summaries (cosine ≥ 0.95, runs every 5 minutes). The reasoning is in [Memory model](memory-model.md) — without this filter, you'd get nine variations of the same fix on a single query.

This is occasionally surprising. A search "should" return 12 hits and only returns 3, because the other 9 were marked superseded. The fix isn't to disable supersedes — they're usually right — it's to drop the cosine threshold or look at the timeline directly with `mem_timeline` around one of the surviving ids.

## `mem_why` is not a search debugger

This is worth being explicit about because the name is misleading.

`mem_why` exists as an MCP tool (see `src/memory/mcp/handler.ts`). It looks like it would explain "why did this hit rank where it did," which is the obvious question. **It does not.** What it actually does is walk the `provenance_edges` table — a separate data structure that records causal relationships between memory nodes (`derives_from`, `causes`, `calls`, `imports`) — and returns the chain of edges from a starting node up to a given depth.

Useful when you want to ask "what led to this summary existing" if other tooling has populated the provenance graph. Not useful when you want to know "why did `mem_search` rank result #3 above result #4."

For the actual "why this rank" question, the honest tools today are:

1. **Read the `bm25Rank`, `vecRank`, `cosine`, and `recency` fields on each `HybridHit`.** They're returned. The hybrid hit shape includes them precisely so a human can sanity-check the fusion.
2. **Compute the score by hand:** `score = (bm25Weight / (60 + bm25Rank) + vectorWeight / (60 + vecRank)) * exp(-(now - ts) / tauMs)`. The math is short. If a result you expected to win is losing, one of those four numbers will tell you which leg is letting you down.
3. **Run the search twice** — once with vector disabled (set `vectorWeight = 0` in config or pass `embedder: null`), once with BM25 disabled — and see which hits each leg surfaces independently. The difference is informative.

A proper retrieval-trace tool that returns the per-leg ranks and the post-fusion score for every candidate is on the roadmap. Today, the wire shape gives you the raw fields and you read them yourself.

## Worked example

You search for `"didn't we fix something around malformed auth tokens"`.

```
sanitizeFtsQuery → "didn t we fix something around malformed auth tokens"
```

(Apostrophe stripped because `'` isn't alphanumeric. "didn" and "t" survive as their own tokens, which is harmless — neither shows up in your summaries.)

BM25 over FTS5 returns 14 hits ranked by lexical match. The top three contain "auth" and "token" literally; the next eleven contain just "fix" or "auth." `bm25Rank` is set 1..14.

The query is embedded by Ollama's `nomic-embed-text` (768-d). All 1,200 summary embeddings load from `summary_embeddings`, cosine is computed against each, top 50 by similarity are kept. `vecRank` is set 1..50, `cosine` is recorded.

For each candidate, RRF gives `score = 1/(60+br) + 1/(60+vr)` (with both legs at weight 1). For a hit that BM25 ranked 1 and vector ranked 4: `1/61 + 1/64 = 0.0320`. For one that BM25 ranked 12 and vector ranked 1: `1/72 + 1/61 = 0.0303`. The first wins on fusion despite vector ranking it lower.

Each score is multiplied by `exp(-(now - ts) / 7days)`. A summary from yesterday gets `0.87`; from a month ago gets `0.013`. A vivid lexical match from a month ago can lose to a moderate match from yesterday — that's the decay doing what it's there to do.

Top 5 ship back. Claude pulls them into context. The summary about the JWT null-deref is at #1, with `bm25Rank=2, vecRank=1, cosine=0.74, recency=0.71, score=0.0234`. You go look. The fix is there. That's the whole loop.
