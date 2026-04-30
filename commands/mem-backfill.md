---
description: Backfill SiftCoder Memory from past Claude Code transcripts in this workspace
argument-hint: [--all|--latest=N|--session=<id>|--dry-run]
allowed-tools: Bash
---

# /siftcoder:memory:backfill - Replay Past Claude Code Sessions Into Memory

Imports historical tool calls from `~/.claude/projects/<encoded>/<session-id>.jsonl` into the SiftCoder Memory store for the current workspace. Useful right after you install the plugin: turns weeks of past Claude Code work into searchable memory.

## What it does

Calls `siftcoder-mem replay` for each transcript matching the current workspace, sending capture frames through the daemon's UDS endpoint. Replayed events are tagged `source: 'replay'` so they're distinguishable from live captures.

Filters to the same tool set as live capture (Read, Write, Edit, Bash, Grep, Glob). Things like TodoWrite and AskUserQuestion are skipped.

## Modes

- `--dry-run` — list what would be imported without sending any frames. **Always run this first.**
- `--latest=N` — replay only the N newest transcripts for this workspace.
- `--session=<id>` — replay one specific transcript by id.
- `--all` (default if other flags absent) — replay every transcript.

## Instructions

Determine the workspace cwd:

```bash
WS_CWD="${CLAUDE_PROJECT_DIR:-$(pwd)}"
PLUGIN="${CLAUDE_PLUGIN_ROOT}"
```

### Step 1: discover transcripts

```bash
node $PLUGIN/dist/memory/cli.js transcripts --cwd="$WS_CWD" --limit=100 | jq
```

Show the user the count + total size in MB. If zero, tell them: **no Claude Code sessions found for this workspace** and stop.

### Step 2: dry-run

If `$ARGUMENTS` contains `--dry-run`, OR no destructive flag was supplied yet:

```bash
node $PLUGIN/dist/memory/cli.js transcripts --cwd="$WS_CWD" --limit=100 \
  | jq -r '.data.transcripts[].sessionId' \
  | while read sid; do
      node $PLUGIN/dist/memory/cli.js replay --session="$sid" --cwd="$WS_CWD" --dry-run --json \
        | jq -c "{sid: \"$sid\", frames: .data.frames}"
    done
```

Sum the `frames` totals. Show the user something like: **"Would import 1,245 events across 13 sessions. Run again with `--all` (or `/siftcoder:memory:backfill --all`) to commit."**

### Step 3: real replay

When the user invokes with `--all` (or `--latest=N` / `--session=<id>`), spawn the daemon if needed, then loop:

```bash
# spawn daemon if no socket
WS_KEY=$(node -e "
const {createHash}=require('crypto');
const {execFileSync}=require('child_process');
const {realpathSync}=require('fs');
const cwd=process.argv[1];
let top;
try{top=execFileSync('git',['-C',cwd,'rev-parse','--show-toplevel'],{stdio:['ignore','pipe','ignore']}).toString().trim();}catch{top=cwd}
console.log(createHash('sha256').update(realpathSync(top)).digest('hex').slice(0,12));
" "$WS_CWD")
if [ ! -S ~/.siftcoder/run/${WS_KEY}.sock ]; then
  CLAUDE_PROJECT_DIR="$WS_CWD" CLAUDE_PLUGIN_ROOT="$PLUGIN" \
    node $PLUGIN/hooks/session-start/spawn-daemon.mjs
  sleep 1
fi

# replay loop
node $PLUGIN/dist/memory/cli.js transcripts --cwd="$WS_CWD" --limit=100 \
  | jq -r '.data.transcripts[].sessionId' \
  | while read sid; do
      echo "→ $sid"
      CLAUDE_PROJECT_DIR="$WS_CWD" \
        node $PLUGIN/dist/memory/cli.js replay --session="$sid" --cwd="$WS_CWD" --json \
        | jq -c '.data | {sent, errors}'
    done
```

For `--latest=N`, pipe through `head -n N` after the `jq -r '.data.transcripts[].sessionId'` step.
For `--session=<id>`, skip the listing entirely and replay just that id.

### Step 4: drain

After replay completes, suggest: **"Now run `/siftcoder:memory:drain` to summarize the imported events through host sampling — that's what makes them retrievable via `mem_search`."**

## Privacy

Transcripts contain real conversation content. Replay sends every captured tool I/O through the same redaction pipeline as live capture (`<private>` blocks + AWS / GitHub / Anthropic / OpenAI / Bearer / JWT / email / phone patterns). Anything redaction misses lands in SQLite — **review the events table** if you replayed sessions that contained secrets you don't want stored.

## Tips

```
SAFE BACKFILL FLOW

1. /siftcoder:memory:backfill           ← dry-run first
2. Review the per-session frame counts
3. /siftcoder:memory:backfill --latest=3   ← incremental commit
4. /siftcoder:memory:status              ← verify the events landed
5. /siftcoder:memory:drain               ← turn events into searchable summaries
6. /siftcoder:memory:backfill --all      ← commit the rest if happy
```
