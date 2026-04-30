---
description: Verify SiftCoder Memory is running for the current workspace - daemon, hooks, MCP, storage
argument-hint: (no args)
allowed-tools: Bash, mcp__plugin_siftcoder_siftcoder-memory__mem_drain
---

# /siftcoder:mem-check - Health Check

Five checkpoints, each with a clear pass/fail and a one-line fix when it fails. Tells you exactly which layer is broken.

## Checkpoints

1. **Workspace key resolved** — current cwd maps to a deterministic key
2. **Daemon socket exists** — daemon process spawned for this workspace
3. **CLI ping** — daemon is responsive over UDS
4. **Storage live** — SQLite table populated, schema migrations applied
5. **MCP attached** — `mem_drain` callable from this Claude Code session

## Instructions

Run all five checks in order. After each, print a line in this exact shape:

```
[PASS] <check name>: <one-line evidence>
[FAIL] <check name>: <reason>
       fix: <one-line remediation>
```

Stop at the first FAIL — earlier failures imply later ones.

### Check 1: workspace key

```bash
WS_CWD="${CLAUDE_PROJECT_DIR:-$(pwd)}"
WS_KEY=$(node -e "
const {createHash}=require('crypto');
const {execFileSync}=require('child_process');
const {realpathSync}=require('fs');
const cwd=process.argv[1];
let top;
try{top=execFileSync('git',['-C',cwd,'rev-parse','--show-toplevel'],{stdio:['ignore','pipe','ignore']}).toString().trim();}catch{top=cwd}
console.log(createHash('sha256').update(realpathSync(top)).digest('hex').slice(0,12));
" "$WS_CWD")
echo "$WS_KEY"
```

PASS if non-empty. Output: `[PASS] workspace key: <key> for <cwd>`.

### Check 2: daemon socket

```bash
SOCK=~/.siftcoder/run/${WS_KEY}.sock
[ -S "$SOCK" ] && echo PASS || echo FAIL
```

PASS: `[PASS] daemon socket: ~/.siftcoder/run/${WS_KEY}.sock`.
FAIL fix: `Open Claude Code in this directory in a fresh session, or run /reload-plugins. The SessionStart hook spawns the daemon.`

### Check 3: CLI ping

```bash
PLUGIN="${CLAUDE_PLUGIN_ROOT}"
CLAUDE_PROJECT_DIR="$WS_CWD" node $PLUGIN/dist/memory/cli.js ping
```

PASS: response is `{"ok":true,"data":{"pong":true}}`.
FAIL fix: `Daemon socket exists but daemon is unresponsive. Check ~/.siftcoder/logs/${WS_KEY}.ndjson, then kill the PID in ~/.siftcoder/workspaces/${WS_KEY}/run.pid and restart Claude Code.`

### Check 4: storage live

```bash
DB=~/.siftcoder/workspaces/${WS_KEY}/db.sqlite
sqlite3 "$DB" "SELECT count(*) AS events, count(DISTINCT session_id) AS sessions FROM events" 2>&1
sqlite3 "$DB" "SELECT count(*) FROM summaries"
sqlite3 "$DB" "SELECT name FROM sqlite_master WHERE type='table' ORDER BY name"
```

PASS: tables `events`, `summaries`, `summary_embeddings`, `summary_supersedes`, `provenance_edges`, `summary_cache` all listed.
FAIL fix: `DB file missing or schema not migrated. Restart Claude Code to re-run Storage migrations.`

### Check 5: MCP attached

Try the MCP tool:

```
use mem_drain with batch=1
```

PASS: tool returns `{"ok":true,"data":{...}}`.
FAIL fix: `MCP server not attached to this session. Run /reload-plugins, or close + reopen Claude Code.`

## Final summary

After all five checks, render:

```
=== /siftcoder:mem-check ===
  workspace:   <key>   <cwd>
  daemon:      <PID> running, socket alive
  storage:     <events> events, <summaries> summaries, <embeddings> embeddings
  MCP tools:   mem_search, mem_timeline, mem_get, mem_drain, mem_why
  status:      ALL CHECKS PASS  (or HALTED AT CHECK N)
```

If all pass, append: `Memory is fully operational. Run /siftcoder:mem-status for token savings.`
If any fail, append the specific remediation from the failing check.

## Tips

```
DAILY HEALTH

Run at session start:
  /siftcoder:mem-check        ← verifies the full stack in 3 seconds

Run after upgrade or reload:
  /reload-plugins
  /siftcoder:mem-check        ← confirms the upgrade took
```
