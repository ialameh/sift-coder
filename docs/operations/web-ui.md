# Web UI

The daemon ships with an optional HTTP bridge. Start the daemon, browse to a localhost URL, see what's in your memory store. It is read-only, bound to `127.0.0.1`, and authenticated by a token file in your home directory. It exists for one reason: to make capture *visible*.

## Why this exists

When you tell a teammate that SiftCoder is "capturing your tool calls in the background," the reasonable response is scepticism. They'll ask where the data is, what it looks like, whether it's actually working. You can answer that with `sqlite3 ~/.siftcoder/default/workspaces/<key>/db.sqlite` and run SQL, but most people won't. The web UI is the human-readable equivalent.

The other reason: when you're debugging the plugin itself, watching counts tick up in real time tells you within seconds whether capture is firing. The web UI shows live counts from the same SQLite handle the daemon writes to; it's the fastest feedback loop you'll get short of `tail -f` on the WAL.

## Starting it

The HTTP bridge is gated by an environment variable. By default it runs alongside the daemon. To opt out:

```bash
SIFTCODER_NO_HTTP=1 siftcoder start
```

When the bridge is up, it picks an available port (random by default, configurable via `SIFTCODER_HTTP_PORT`) and writes the chosen port to a per-workspace file:

```
~/.siftcoder/<namespace>/workspaces/<key>/http.port
```

That file is the source of truth for "what URL is the web UI on". The CLI's `web` subcommand reads it:

```bash
siftcoder web
# http://127.0.0.1:57945
```

Or from inside Claude Code:

```
/siftcoder:mem web
```

If the file doesn't exist the CLI errors with `web bridge not active yet`. That means either the daemon isn't running, or it's running with `SIFTCODER_NO_HTTP=1`, or the bridge crashed during startup. Check the log at `~/.siftcoder/<ns>/logs/<workspace>.ndjson`.

## Auth and binding

The bridge binds to `127.0.0.1` only. It is not reachable from another machine on your network, your VPN, or a Tailscale node. There is no configuration to change this, by design — exposing memory contents over a network would require a real auth story that the project does not currently have.

There *is* a bearer token. On first startup the bridge generates a random 32-byte token and writes it to:

```
~/.siftcoder/auth.token
```

with file permissions `0600`. Every API request must include `Authorization: Bearer <token>`. The static SPA assets (HTML/JS/CSS) are gated by the same token, so a curious visitor who somehow reached the localhost port can't even load the shell.

The web client reads the token from the same file when you load it from `localhost`. If you ever want to inspect the API by hand:

```bash
TOKEN=$(cat ~/.siftcoder/auth.token)
curl -H "Authorization: Bearer $TOKEN" http://127.0.0.1:57945/api/status
```

## What the UI shows

The SPA has a few main panels:

**Counts.** Live numbers for events, raw, summarized, skipped, summaries, embeddings — the same numbers `info` prints, refreshed without reloading.

**Recent summaries.** A reverse-chronological list of the most recent summaries with their source event id, the model that produced them, and the timestamp. Clicking a summary reveals the underlying event payload (post-redaction) and the embedding vector dimension.

**Search.** A text box that posts to the daemon's search endpoint. You type a query, you get back the top-K ranked summaries with their scores. Useful when you want to see how retrieval behaves without involving Claude — "would my query for 'webhook signature' actually find the right summary?"

**`mem_why` explainer.** For any returned hit, the UI can call `mem_why` to break down the score into BM25 contribution, vector similarity, time decay, and final RRF rank. This is the debugging tool when retrieval is returning surprising results — you can see whether a hit ranked high because of lexical match, semantic match, or recency, and tune accordingly.

**Provenance graph.** If a summary is connected to others via `supersedes` or `contradicts` edges (set by the dedup consolidator and the curator agent), the UI draws the local neighbourhood. Mostly useful after a `prune` run when you want to confirm the curator merged the right pairs.

The UI does not let you edit, delete, or insert. There are no buttons that mutate state. If you want to prune, you do it from the CLI with `mem prune --confirm`. The HTTP bridge has POST endpoints, but they are limited to *queries* (search, why) — they don't write.

## Use cases

**Convincing a sceptical teammate.** Pair-programming, you say "this thing remembers what we did," they raise an eyebrow. Open the UI, point at the live counts climbing as you run a few tool calls, click into a recent summary, show them the captured payload. Total time, thirty seconds. They either accept that capture is real or have a more specific objection you can address.

**Confirming a particular file got captured.** You just edited a sensitive config file and want to check that the redactor caught the secret. Open the UI, find the most recent `Edit` event, expand the payload, look for the redaction markers. If you see the actual secret, file a security bug; if you see `<redacted:env>` placeholders, the redactor did its job.

**Tuning retrieval.** You searched for a thing you know you remember solving and SiftCoder didn't surface it. Open the UI, search the same query, look at the score breakdown. Maybe the relevant summary ranked twelfth and got truncated by `topK: 10`. Maybe the time decay aged it out. Now you have data to either raise `topK` in config or pin the summary so it ignores decay.

**Auditing what was captured during a session.** Worried about prompt-injection or accidental capture of secrets in pasted output? Open the UI, filter by today's session id, scroll through. If something looks wrong, you can find the exact event id and remove it (via SQL, since the UI is read-only) before it gets summarised.

## Disabling

```bash
SIFTCODER_NO_HTTP=1 siftcoder start
```

You'd disable it if:

- You're paranoid about any localhost surface, even auth-gated ones.
- You're running on a shared machine where another user account could potentially access localhost (the token file is `0600` so they'd need root, but defence in depth).
- The bridge is buggy on your platform and crashing the daemon at startup. Disabling it keeps the daemon running while you investigate.

The hooks, the consolidator, retrieval — none of them depend on the bridge. Disabling it removes only the inspection surface, nothing functional.

## Failure modes

**Port file missing.** Bridge crashed during startup before writing the port. Check the daemon log; the most common cause is a port conflict that exhausted the retry window (`MAX_RETRIES` in `web/port.ts`, then OS-assigned, then some downstream error). Restart the daemon.

**`401 Unauthorized` from the SPA.** The token in `~/.siftcoder/auth.token` doesn't match what the daemon loaded. This happens if you delete the file while the daemon is running — the daemon caches the token in memory, but the SPA reads it on each load. Fix: stop the daemon, delete the file, start the daemon (it will regenerate). Or just leave the file alone.

**UI shows zero counts but `info` shows non-zero.** The bridge is connected to a different SQLite handle, or pointing at the wrong workspace. Verify the workspace key in the URL matches `key()` from your CLI. If you've changed `cwd` between starting the daemon and opening the UI, you may have crossed workspaces.

**Long-running queries hang.** Search and `mem_why` are synchronous over the wire and not paginated. A query that returns thousands of hits will hold the connection open. Future versions may stream. For now, narrow your query.

The bridge is the most-skippable component in SiftCoder. The daemon and the hooks do all the real work; the UI is for humans. If you don't need it, turn it off and forget it exists.
