# First five minutes

The fastest path from "I just heard about this thing" to "it is running and I have evidence it is working." Copy each command, run it, and check the output against what's printed below it.

## Prerequisites

You need three things on your machine:

- **Claude Code** installed and working (`claude --version` returns a version).
- **Node.js 20 or higher** (`node --version`).
- Optional but recommended: **Ollama** running locally (`curl -s http://localhost:11434/api/tags | head`). Without Ollama, summarisation falls back to your Anthropic API key — which works, but spends real money.

## Install

SiftCoder ships as a Claude Code plugin from a marketplace. From inside Claude Code:

```
/plugin add siftcoder@siftcoder-marketplace
```

If you prefer git, clone the repo and point Claude Code at it:

```bash
git clone https://github.com/ialameh/sift-coder.git ~/Documents/Plugins/SiftCoder
```

Then in Claude Code, register the local marketplace:

```
/plugin marketplace add ~/Documents/Plugins/SiftCoder
```

The first run does an automatic build. If you ever need to rebuild manually:

```bash
cd ~/Documents/Plugins/SiftCoder && npm install && npm run build
```

## First-time setup

```bash
node ~/.claude/plugins/cache/siftcoder-marketplace/siftcoder/<version>/bin/siftcoder.mjs setup
```

Or, from inside Claude Code:

```
/siftcoder:mem setup
```

This probes Ollama, asks for an Anthropic API key if Ollama isn't there, and writes a config file to `~/.siftcoder/default/config.json`. It is interactive but every prompt has a sensible default — pressing return five times is a perfectly fine first run.

## Start the daemon

```
/siftcoder:mem start
```

You should see something like:

```
daemon started pid=41958 sock=/Users/you/.siftcoder/default/run/<workspace>.sock
```

The daemon is per-workspace. Each project directory you work in gets its own SQLite database, its own socket, and its own captured history. Nothing crosses over.

## Confirm it's alive

```
/siftcoder:mem info
```

You should get a block that looks like this:

```
siftcoder v1.0.8

runtime     node v25.9.0 darwin/arm64
install     /Users/you/.claude/plugins/cache/siftcoder-marketplace/siftcoder/1.0.8
namespace   default
workspace   91a0a425c157  cwd=/Users/you/Documents/your-project

daemon      running  pid=41958  uptime=12s
socket      /Users/you/.siftcoder/default/run/91a0a425c157.sock
db          /Users/you/.siftcoder/default/workspaces/91a0a425c157/db.sqlite  (24.0 KiB)
web         http://127.0.0.1:57945

backends    ollama=up  anthropic=no key
counts      events=0  raw=0  summarized=0  skipped=0  summaries=0  embeddings=0
```

If `daemon` says `running`, you are done with the install part.

## Capture something

The point of SiftCoder is that you do not have to think about capture. As soon as the daemon is running, every `Read`, `Write`, `Edit`, `Bash`, `Grep`, and `Glob` tool call inside this workspace is captured automatically by a `PostToolUse` hook.

Make Claude do something — anything. Read a file, ask it to explain a function, have it run `git status`. Then check counts again:

```
/siftcoder:mem info
```

You should see `events` go up. Those are the raw captured tool calls. Within thirty seconds (the default consolidator tick), some of them will move from `raw` to `summarized` and you'll start to see `summaries` and `embeddings` numbers grow.

## Backfill from your existing transcripts

This is the trick that makes SiftCoder *immediately useful* instead of useful next week. Your machine already has a folder full of past Claude Code conversations at `~/.claude/projects/`. SiftCoder can replay them into memory:

```
/siftcoder:mem backfill
```

```json
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

That just hydrated your memory with everything you have ever done with Claude Code in this directory. The next time Claude needs context, retrieval will pull from this history.

## Open the web UI

```
/siftcoder:mem web
```

Visit the URL it prints. You will see a live dashboard of captured events, summaries, embeddings, and search. The web UI is read-only and runs on a random localhost port — it never touches your network.

## What just happened

You now have a per-workspace memory daemon listening on a Unix socket. Every tool call Claude makes is being captured behind the scenes, redacted for secrets, written through a WAL, persisted to SQLite, and asynchronously summarised + embedded. Search will rank results using BM25 plus vector similarity plus a time-decay factor, then Claude can pull them back into context on future turns.

You did not write any of that. The hooks did the capture, the daemon did the persistence, the consolidator did the summarisation, the embedder did the vectors, and SiftCoder put the results back in front of Claude when relevant.

Next: read the [verifying](verifying.md) page if you want to confirm everything is healthy, or jump to [Mental model](../foundations/mental-model.md) if you want to understand what each of those pieces actually does.
