# Usage

Day-to-day patterns for using SiftCoder.

## Boot

Daemon spawns automatically on session start. To verify:

```bash
node bin/siftcoder.mjs status
```

If the daemon is not reachable, start it manually:

```bash
node bin/siftcoder.mjs start
```

## Memory

Memory captures every tool observation (Read/Write/Edit/Bash/Grep/Glob) into events, then drains them into summaries via Ollama or Anthropic.

### Query memory

Inside Claude Code, the assistant can call MCP tools directly:

```
mem_search { query: "auth middleware decision", k: 5 }
mem_get { id: "summary:142" }
mem_why { id: "summary:142" }
mem_timeline { id: "summary:142", before: 3, after: 3 }
```

Or use the slash commands:

```
/siftcoder:mem list --limit 20
/siftcoder:mem status
/siftcoder:mem web        # opens web UI URL
```

### Force drain

If you want pending events summarised right now (e.g. before ending a session):

```
/siftcoder:mem drain 64
```

### Backfill from past transcripts

```bash
node bin/siftcoder.mjs backfill transcripts
```

Reads Claude Code's local transcript directory, replays into the memory store.

### Curate memory

```
/siftcoder:mem prune
```

Dispatches the `memory-curator` agent. Reports duplicates, contradictions, stale, orphans. Awaits `--confirm` before deleting.

## Salesforce flow

```
# diagnose an org
/siftcoder:sf-architect

# build a webhook endpoint
/siftcoder:sf-webhook OrderEvent --hmac-header X-Signature

# scaffold FFLib selector
/siftcoder:apex-patterns selector Account

# bulkify a class
> use the apex-bulkifier agent on AccountService.cls

# deploy
/siftcoder:sf-deploy validate --target-org dev
/siftcoder:sf-deploy preview --target-org dev
/siftcoder:sf-deploy deploy --target-org dev
```

## Quality on demand

```
/siftcoder:quality           # format + lint + type-check
/siftcoder:quality --fix     # auto-fix safe issues
/siftcoder:quality --tests   # also run tests
```

## Ideation

```
/siftcoder:ideate                       # for current project
/siftcoder:ideate caching               # focused topic
/siftcoder:surprise-me                  # new project ideas
/siftcoder:surprise-me --salesforce     # sfdx-shaped
/siftcoder:surprise-me --tiny           # < 200 LOC
```

## Reverse-prompt

```
/siftcoder:reverse-prompt              # deep mode (default)
/siftcoder:reverse-prompt quick
/siftcoder:reverse-prompt focus auth
```

Output is a single conversational prompt that would rebuild the project. Useful for handoffs and spec extraction.

## Compression

```
/siftcoder:compress full       # default — drop articles, filler, hedging
/siftcoder:compress lite       # less aggressive
/siftcoder:compress ultra      # fragments encouraged
/siftcoder:compress off
```
