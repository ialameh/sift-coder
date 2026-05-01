# Daily workflow

The honest answer to "what does a day with SiftCoder look like" is: most of it looks like a day without SiftCoder. The whole point of putting capture behind hooks and consolidation behind a thirty-second tick is that you should not be thinking about memory while you work. The interactions with the tool are bookends — a glance in the morning, an optional flush at the end of the day, a curation pass once a month.

What follows is a worked Tuesday.

## Morning: confirm it's awake

You sit down at 9:14, coffee in hand. You started a webhook bug on Friday afternoon and never finished it. The first thing you do is check that the daemon is up and the database from Friday is still there.

```
/siftcoder:mem info
```

What you're scanning for, in order:

1. `daemon` line says `running` with a non-zero `uptime`. If it says `unreachable`, you skip ahead to [Troubleshooting](troubleshooting.md).
2. `counts` shows the numbers you'd expect from Friday — events well into the hundreds, summaries close behind, embeddings matching summaries.
3. `backends` shows `ollama=up` (or `anthropic=configured` if that's how you've set things up).

If the daemon was killed overnight (laptop slept badly, OS update rebooted), the `SessionStart` hook will have already restarted it when you opened Claude Code. The `info` command is just confirming.

You don't need to memorise any of those numbers. You're checking shape, not values: did the database survive the night, is the consolidator caught up, is the LLM backend available.

## Mid-morning: glance at the web UI

Optional, but useful when you're picking up where you left off.

```
/siftcoder:mem web
```

It prints a localhost URL. Open it, and you see a feed of summaries from Friday's session — `Read auth/middleware.ts`, `Edit src/webhooks/handler.ts`, `Bash npm test -- --grep webhook`. You scan the top three or four, remember exactly where you stopped, and close the tab. Total time: maybe twenty seconds.

This is faster than re-reading your terminal scrollback or your editor's recently-opened files, because the summaries are written to be search-shaped: short, file-anchored, decision-focused. You're reading "fixed null check on `req.body.signature`" not "Edit at 4:47 PM".

## Day work: do nothing

You go fix the webhook bug. You ask Claude to read the handler, run the failing test, propose a fix, apply it, re-run the test. None of that involves memory tooling. The hooks fire on every tool call and capture in the background. You never see any of it.

Halfway through the afternoon, Claude says something like: "I notice we ran into a similar `req.body` parsing issue on Friday in `auth/middleware.ts` — the same fix pattern (checking for `Buffer.isBuffer` before JSON-parsing) might apply here." That's retrieval working. You didn't ask for it, the hook injected the relevant past summary into Claude's context, Claude pattern-matched.

If you ever want to ask explicitly:

```
/siftcoder:search webhook signature parsing
```

That goes through `mem_search`, returns ranked summaries, and you read the three or four most relevant. Useful when you remember solving something but can't remember where.

## End of day: optional drain

Most days you don't bother. The consolidator ticks every thirty seconds (`tickMs: 30_000`, `batchSize: 16` from `config.ts`), so by the time you stop typing, almost everything is already summarised. But if you ran a heavy session — a refactor that touched fifty files, a debugging session with hundreds of greps — there will be a backlog of `raw` events that haven't been summarised yet.

```
/siftcoder:mem info
```

If `raw` is over fifty or so and `summarized` is still climbing, force a drain:

```
/siftcoder:mem drain 64
```

That synchronously processes up to 64 events. On Ollama with `llama3.2:3b`, that's maybe sixty seconds of CPU. On Anthropic Haiku, it's faster but costs cents. You only do this when you want the events summarised *now* — for example, before closing the laptop and travelling, so retrieval is sharp tomorrow morning.

The default tick will catch up on its own if you skip the manual drain. The only reason to force it is impatience.

## Weekly: nothing

There is no weekly task. The decay function (`halfLifeDays: 7`) handles relevance drift on its own. Old summaries fade gradually in retrieval; nothing accumulates that needs your attention every Monday.

## Monthly: prune

Once a month for an active project, run the curator:

```
/siftcoder:mem prune --confirm
```

That dispatches the `memory-curator` agent (see [Pruning](pruning.md)). It finds duplicates within cosine 0.92, finds summaries about files that no longer exist, finds orphans with no provenance edges, and gives you a report. You read the report, confirm, and it executes. Bounded scope — it only ever touches the memory database, never your code.

For an archived project, never prune. Memory is cheap and the decay function already handles relevance.

## A note on what *not* to do

You do not need to:

- Manually capture anything. The `PostToolUse` hook does it for every tool call.
- Tell Claude when to search memory. The MCP tools are wired and Claude chooses.
- Keep the web UI open. It's a debugging tool, not a dashboard.
- Run `drain` after every prompt. The tick handles it.
- Restart the daemon after a config change. The `SessionStart` hook re-reads on the next session.

The whole design is that SiftCoder fades into the background. If you find yourself thinking about it more than a few minutes a day, something is off — check [Troubleshooting](troubleshooting.md) or open an issue.

## What a bad day looks like

For contrast: the Tuesday where the workflow falls apart.

You run `info` and see `daemon: unreachable`. The hooks have been silently failing for who knows how long because they can't reach the socket. You check `~/.siftcoder/default/logs/<workspace>.ndjson` — the daemon crashed at 2 AM during what looks like a SQLite migration. You delete `run.pid`, run `start`, the daemon comes back. You lose nothing because the WAL is intact, but you do lose the events that hooks tried to capture during the unreachable window — they were dropped, not queued.

That's the worst case for a working install: a few hours of missing capture, no data corruption, no manual recovery beyond `start`. The store survives. That's the entire reliability promise.
