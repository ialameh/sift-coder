# Backfill

A fresh SiftCoder install starts with an empty database. The hooks are wired, the daemon is running, but there is nothing to retrieve from. The first session captures a few dozen events, the second session a few dozen more, and after a week of work memory starts to feel useful. That is fine, but it means SiftCoder is least helpful on day one — the day you most want a demo that lands.

Backfill solves this by replaying your existing Claude Code transcripts into the memory store.

## What it actually does

Claude Code keeps a transcript of every session as a `.jsonl` file under `~/.claude/projects/`. The directory name is your project's `cwd` with slashes replaced by dashes — for example, `/Users/sam/Documents/SiftCoder` becomes `-Users-sam-Documents-SiftCoder`. Inside that directory there is one `.jsonl` per session, named by the session UUID.

Each line in the transcript is an event from the conversation: a user prompt, an assistant message, a `tool_use` block, a `tool_result`. The replay engine in `src/memory/replay.ts` parses these, pairs each `tool_use` with its matching `tool_result` (by `tool_use_id`), and emits a capture-shaped frame for each pair.

The frames are then sent to the daemon's `capture` endpoint over the same socket the live `PostToolUse` hook uses. The daemon writes them to the events table tagged with `source: 'replay'`, so they're distinguishable from live captures if you ever want to filter.

By default the replay only captures the same six tools the live hook does: `Read`, `Write`, `Edit`, `Bash`, `Grep`, `Glob` (the `DEFAULT_TOOLS` constant in `replay.ts`). Everything else is ignored — `TodoWrite`, `WebFetch`, custom MCP tools, all skipped. You can override this by passing a custom `tools` set if you're calling the parser directly, but the CLI uses the defaults.

## Dedup

Replay is idempotent. The capture path computes a SHA-256 hash of the redacted payload (`input_hash` in the events table) and the daemon rejects any frame whose `(session_id, input_hash)` pair already exists. Run backfill twice in a row and the second run will report `skippedDuplicate` matching the first run's `captured`.

This matters because it means you can re-run backfill without thinking about it. Switched machines and want to seed from your old transcripts? Run it. Forgot whether you ran it last week? Run it again. The dedup will sort it out.

## When you'd run it

Three real cases:

1. **Just installed.** You want retrieval to work *now*, not next Friday. Run backfill once, immediately after `start`, before you do any new work. You hydrate the database with however many sessions you have on disk for this workspace.

2. **Switched machines.** You moved laptops, the SiftCoder database didn't come with you (it lives in `~/.siftcoder/`, not in the repo), but your `~/.claude/projects/` did because you sync that across machines. Backfill rebuilds memory from transcripts on the new machine.

3. **Lost the database.** SQLite file got corrupted, you deleted `~/.siftcoder/` to start clean, the WAL didn't help. Transcripts are usually intact even when the SiftCoder store is destroyed, so backfill is your recovery path.

There is a fourth, less common case: you've been *testing* the plugin in a throwaway directory and want to clean out test events while keeping real ones. Easier to delete the database and re-backfill from real transcripts than to surgically prune. Backfill is fast (see numbers below) — usually faster than the alternative.

## The CLI

```
siftcoder backfill [source]
```

`source` defaults to `transcripts`. There's only one supported source today, but the argument exists so future sources (an exported memory dump, a teammate's transcripts) can slot in without changing the command shape.

From inside Claude Code:

```
/siftcoder:mem backfill
```

It calls the same code path. The slash-command surface in `commands/mem.md` is a thin wrapper over `bin/siftcoder.mjs`.

By default the replay is **workspace-scoped** — it only looks at transcripts under the encoded directory matching your current `cwd`. This is the right default. You don't want transcripts from your hobby project leaking into your work workspace's memory; they have different file paths, different terminology, different libraries, and retrieval would surface noise.

If you want to widen the scope (you're consolidating multiple project directories into one workspace, or you've just renamed your project root), you'd need to call the underlying replay functions directly — that's a [Reference](../reference/index.md) topic, not a daily-driver one.

## Worked example

Fresh install in a real project. Daemon just started, database empty.

```
$ /siftcoder:mem info
counts      events=0  raw=0  summarized=0  skipped=0  summaries=0  embeddings=0

$ /siftcoder:mem backfill
{
  "ok": true,
  "data": {
    "source": "transcripts",
    "scanned": 14,
    "captured": 1132,
    "skippedDuplicate": 0,
    "errors": 0
  }
}
```

What just happened:

- `scanned: 14` — fourteen `.jsonl` files matched the workspace directory.
- `captured: 1132` — eleven hundred-odd `tool_use`/`tool_result` pairs were extracted across those sessions and written to the events table.
- `skippedDuplicate: 0` — first run, no dupes possible.
- `errors: 0` — no malformed JSON lines, no unmatched `tool_use_id` references.

Now check counts again:

```
$ /siftcoder:mem info
counts      events=1132  raw=1132  summarized=0  skipped=0  summaries=0  embeddings=0
```

All 1132 events are sitting at `status='raw'`. The consolidator will now start working through them at 16 events per 30-second tick — about 35 minutes to clear the queue on default settings, faster if you raise the batch size or run drain manually.

Run it a second time, immediately:

```
$ /siftcoder:mem backfill
{
  "ok": true,
  "data": {
    "source": "transcripts",
    "scanned": 14,
    "captured": 0,
    "skippedDuplicate": 1132,
    "errors": 0
  }
}
```

Dedup did its job. The `(session_id, input_hash)` pairs all matched existing rows and were rejected.

## What can go wrong

**Huge transcripts.** If you have a single session `.jsonl` that's 200 MiB (yes, this happens — long debugging sessions with verbose Bash output can balloon), `parseTranscript` reads the whole thing into memory and splits on newlines. That's fine on a laptop with 16 GiB of RAM but tight on a 4 GiB cloud VM. There is no streaming parser today; if you hit memory pressure, either close other apps or skip that one transcript by moving it out of `~/.claude/projects/<encoded>/` temporarily.

**Corrupted JSON line.** `parseTranscript` wraps `JSON.parse` in a try/catch and silently `continue`s on parse failure. Good for resilience, bad if you're wondering why one session has fewer captures than expected. To investigate, point the parser at the suspect file directly and count successful frames vs. total non-empty lines. The discrepancy tells you how many lines were unparseable.

**Unmatched `tool_use_id`.** Some transcripts contain `tool_use` blocks whose matching `tool_result` is missing (Claude Code crashed mid-tool-call, the session was killed, etc.). The replay correctly skips these — it pairs only when both halves are present. The `errors` counter does *not* increment for this case; they are silent skips. If your `captured` count looks low, this is usually why.

**Old transcripts with renamed tools.** Claude Code has occasionally renamed tool capabilities. If your transcript history predates the current naming, a tool that's now called `Read` might appear as `read_file` or similar. The replay filter does an exact match against `DEFAULT_TOOLS`, so older naming is silently skipped. This affects very old transcripts only — anything from the last six months is fine.

**Anthropic API key required for drain, not backfill.** Backfill itself only writes events. The summarisation that turns those events into searchable summaries happens later, in the consolidator, and that is the step that needs an LLM backend. Don't be alarmed if backfill succeeds with `anthropic=no key` and `ollama=down` — you'll just sit at `summarized=0` until you stand a backend up.

## After backfill, then what

Run `info` periodically over the next thirty minutes. You'll see `summarized` and `embeddings` climb in lockstep. When they catch up to `events`, the database is fully indexed and retrieval is sharp.

If you don't want to wait, drain manually in larger batches. See [Drain](drain.md).
