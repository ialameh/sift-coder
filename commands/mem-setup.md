---
description: First-time SiftCoder Memory setup for this workspace - narrated walkthrough; checks daemon, imports past transcripts, drains to summaries
argument-hint: (no args)
allowed-tools: Bash, mcp__plugin_siftcoder_siftcoder-memory__mem_drain
---

# /siftcoder:mem-setup - Onboard This Workspace

Walks the user through first-time memory setup w/ a one-line explanation before each step. Idempotent — re-running on an already-onboarded workspace is a no-op.

## Goal

End state: this workspace has captured events, summarized into searchable memories, ready for `mem_search` / `mem_why`. From here on, capture is automatic and `mem_search` auto-drains a small batch on every call.

## Flow

Five phases. Run sequentially. Print the **bold prefix line** before each phase so the user follows along without reading docs.

### Phase 1 — daemon health

> **Step 1/5: confirming the memory daemon is running for this workspace.** The daemon is one process per project; it captures every tool call into a local SQLite DB. If it's down, capture is silent dropped.

```bash
WS_CWD="${CLAUDE_PROJECT_DIR:-$(pwd)}"
PLUGIN="${CLAUDE_PLUGIN_ROOT}"
WS_KEY=$(node -e "
const {createHash}=require('crypto');
const {execFileSync}=require('child_process');
const {realpathSync}=require('fs');
const cwd=process.argv[1];
let top;
try{top=execFileSync('git',['-C',cwd,'rev-parse','--show-toplevel'],{stdio:['ignore','pipe','ignore']}).toString().trim();}catch{top=cwd}
console.log(createHash('sha256').update(realpathSync(top)).digest('hex').slice(0,12));
" "$WS_CWD")
SOCK=~/.siftcoder/run/${WS_KEY}.sock
if [ ! -S "$SOCK" ]; then
  CLAUDE_PROJECT_DIR="$WS_CWD" CLAUDE_PLUGIN_ROOT="$PLUGIN" \
    node $PLUGIN/hooks/session-start/spawn-daemon.mjs >/dev/null 2>&1
  for i in 1 2 3 4 5; do [ -S "$SOCK" ] && break; sleep 0.3; done
fi
[ -S "$SOCK" ] && echo "daemon: up (workspace=$WS_KEY)" || { echo "daemon: FAILED to spawn"; exit 1; }
```

If `daemon: FAILED to spawn`, halt. Tell user: **"Daemon couldn't start. Run `/siftcoder:mem-check` for diagnostic — likely a missing native binding."**

### Phase 2 — current state

> **Step 2/5: reading current capture state to decide what to do next.** This tells us whether you have past data (need backfill?) or a backlog (need drain?).

```bash
CLAUDE_PROJECT_DIR="$WS_CWD" node $PLUGIN/dist/memory/cli.js savings --json 2>&1
```

Parse the JSON. Read these three fields:
- `data.capture.events` → call this `captured`
- `data.drain.summarized` → `summarized`
- `data.drain.raw` → `pending`

Branch:

| State | What it means | Next step |
|---|---|---|
| `captured == 0` | Workspace empty. Either no past sessions OR memory wasn't installed during them. | Phase 3 (backfill from CC transcripts) |
| `captured > 0 && pending > 0` | Capture worked. Drain is behind. | Phase 4 (drain) |
| `captured > 0 && pending == 0` | Already up to date. | Phase 5 (mark onboarded) |

### Phase 3 — backfill (only if `captured == 0`)

> **Step 3/5: importing past Claude Code sessions.** SiftCoder Memory can replay every tool call from your `~/.claude/projects/<this-project>/*.jsonl` transcripts back through the capture pipeline. This populates the workspace as if memory had been running the whole time.

First, count what's available:

```bash
CC_DIR=~/.claude/projects/$(echo "$WS_CWD" | sed 's|/|-|g')
TRANSCRIPT_COUNT=$(ls "$CC_DIR"/*.jsonl 2>/dev/null | wc -l | tr -d ' ')
TOTAL_MB=$(du -sm "$CC_DIR" 2>/dev/null | cut -f1)
echo "Found ${TRANSCRIPT_COUNT} transcripts (${TOTAL_MB} MB) in $CC_DIR"
```

If `TRANSCRIPT_COUNT == 0`, tell user: **"No past Claude Code sessions for this directory. Skipping backfill — capture will start fresh from now."** and skip to Phase 5.

Otherwise, ask the user:

> **"Found ${TRANSCRIPT_COUNT} past sessions (${TOTAL_MB} MB). Import all, or just the most recent?**
> - Type `all` to import everything (slower, more complete history)
> - Type `latest=N` to import the N most recent sessions (e.g. `latest=3`)
> - Type `skip` to start fresh"

Wait for response. Then run the matching `mem-backfill` flow:

```bash
# all
/siftcoder:memory:backfill --all
# or latest=N
/siftcoder:memory:backfill --latest=N
# or skip → Phase 5
```

### Phase 4 — drain (when `pending > 0`)

> **Step 4/5: turning raw events into searchable summaries.** Drain sends each captured tool call through a small LLM (local Ollama by default — free + private — or Anthropic API if configured) to produce a 1-sentence durable memory + confidence score. After this, `mem_search` ranks against summaries instead of raw payloads.

Backend check:

```bash
if curl -sS -m 1 http://localhost:11434/api/tags >/dev/null 2>&1; then
  echo "backend: Ollama (local, free, ~1.5s/event)"
elif [ -n "$ANTHROPIC_API_KEY" ] && [ "$SIFTCODER_DRAIN_BACKEND" = "anthropic" ]; then
  echo "backend: Anthropic direct (paid)"
else
  echo "backend: NONE configured. Drain will fail with 'Method not found'."
fi
```

If backend is `NONE`, tell user:

> **"No drain backend configured. Two paths:**
> - **Recommended (free):** Install Ollama:
>   ```
>   brew install ollama
>   ollama pull llama3.2:3b
>   ollama serve &
>   ```
>   Then re-run `/siftcoder:mem-setup`.
> - **Paid:** `export SIFTCODER_DRAIN_BACKEND=anthropic && export ANTHROPIC_API_KEY=...`, restart Claude Code, re-run.
> - **Skip:** capture still works; `mem_search` ranks against raw payloads instead of summaries."

If user chooses skip → Phase 5. Otherwise wait until they say re-run, then start over from Phase 1.

If backend OK, run drain in batches until pending is 0:

```bash
# Loop with batch=64. Stop when pending=0 or after 50 iterations (safety cap).
```

Use the MCP tool:
```
use mem_drain with batch=64
```

After each call, parse `pending` from the result. Loop until 0. Print after each batch:
> **"Drained N events. M still pending. (errors: K)"**

If `errors > 0`, surface `firstError` from the result:
- `"Method not found"` → host sampling not supported. Recommend Ollama install + restart, halt.
- `"ollama api"` / `"ECONNREFUSED"` → Ollama daemon stopped mid-drain. Tell user `ollama serve` and re-run `/siftcoder:mem-setup` (idempotent — picks up where it left off).
- Anything else → surface verbatim, halt.

### Phase 5 — mark onboarded + summary

> **Step 5/5: marking this workspace as onboarded so SessionStart hook stops nagging.**

```bash
mkdir -p ~/.siftcoder/workspaces/${WS_KEY}
echo "$(date -u +%FT%TZ) onboarded via /siftcoder:mem-setup" > ~/.siftcoder/workspaces/${WS_KEY}/onboarded
```

Then re-read state and print final summary:

```bash
CLAUDE_PROJECT_DIR="$WS_CWD" node $PLUGIN/dist/memory/cli.js savings 2>&1 | head -20
```

Print to user:
> **"Setup complete. Workspace: $WS_KEY. Captured: X events, summarized: Y, raw: 0.**
> - `mem_search` is ready: just ask Claude things like *'what did we do for X?'*
> - Auto-drain (batch=4) runs on every `mem_search` to keep up with new captures.
> - Open the dashboard: `/siftcoder:mem-web`
> - Check status anytime: `/siftcoder:mem-status`"

## Idempotency

Re-running `/siftcoder:mem-setup` on an already-onboarded workspace:
- Phase 1: daemon already up → no-op.
- Phase 2: reads current state.
- Phase 3: `captured > 0` → skipped.
- Phase 4: drains any new pending events.
- Phase 5: re-touches the sentinel.

Safe to re-run weekly as a "catch-up" command.

## Tips

```
TYPICAL FIRST-OPEN FLOW

  cd <existing-project>
  # launch Claude Code

  /siftcoder:mem-setup        ← run me first
  # answer prompts, wait for drain

  # work normally — capture + auto-drain handle the rest
```
