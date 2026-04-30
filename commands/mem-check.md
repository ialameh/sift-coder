---
description: Verify SiftCoder Memory is running for the current workspace; auto-start the daemon if it's down
argument-hint: [--no-fix]
allowed-tools: Bash, mcp__plugin_siftcoder_siftcoder-memory__mem_drain
---

# /siftcoder:mem-check - Health Check (with auto-recovery)

Five checkpoints, each with a clear pass/fail. **By default, if the daemon socket is missing, this command spawns the daemon and re-checks.** Pass `--no-fix` for a strict read-only diagnostic.

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

### Check 2: daemon socket (with auto-spawn)

```bash
SOCK=~/.siftcoder/run/${WS_KEY}.sock
PLUGIN="${CLAUDE_PLUGIN_ROOT}"
if [ ! -S "$SOCK" ]; then
  if echo "$ARGUMENTS" | grep -q -- "--no-fix"; then
    echo "FAIL: socket missing; --no-fix supplied, not auto-spawning"
  else
    echo "[INFO] daemon socket missing — spawning..."
    CLAUDE_PROJECT_DIR="$WS_CWD" CLAUDE_PLUGIN_ROOT="$PLUGIN" \
      node $PLUGIN/hooks/session-start/spawn-daemon.mjs
    for i in 1 2 3 4 5; do
      [ -S "$SOCK" ] && break
      sleep 0.3
    done
  fi
fi
[ -S "$SOCK" ] && echo PASS || echo FAIL
```

PASS: `[PASS] daemon socket: ~/.siftcoder/run/${WS_KEY}.sock` (note "spawned" if auto-recovered).
FAIL fix: `spawn-daemon hook ran but socket did not appear in 1.5s. Check ~/.siftcoder/logs/${WS_KEY}.ndjson for boot errors. Common cause: better-sqlite3 native binding missing in the plugin cache install.`

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

If all pass, append: `Memory is fully operational. Run /siftcoder:mem-status for token savings, or /siftcoder:mem-web for the live dashboard.`
If any fail, append the specific remediation from the failing check.

## Tips

```
DAILY HEALTH

Run at session start:
  /siftcoder:mem-check        ← verifies + auto-fixes daemon if down

Strict diagnostic (no auto-fix):
  /siftcoder:mem-check --no-fix

Explicit start (no diagnostic):
  /siftcoder:mem-start

Run after upgrade or reload:
  /reload-plugins
  /siftcoder:mem-check
```
