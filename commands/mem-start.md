---
description: Start the SiftCoder Memory daemon for the current workspace if not already running
argument-hint: (no args)
allowed-tools: Bash
---

# /siftcoder:mem-start - Boot Memory Daemon

Idempotent. If the daemon for the current workspace is already up, this is a no-op. Otherwise it spawns it via the same SessionStart hook Claude Code runs on session start.

## Why a manual start exists

The SessionStart hook already auto-spawns the daemon when you open Claude Code in a project. This command is for the cases where:

- You opened CC before the plugin was installed
- The daemon crashed or was killed
- You want to capture in a project you're working in via terminal but haven't opened a fresh CC session for yet

## Instructions

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
PID_FILE=~/.siftcoder/workspaces/${WS_KEY}/run.pid

if [ -S "$SOCK" ] && [ -f "$PID_FILE" ] && kill -0 $(cat "$PID_FILE") 2>/dev/null; then
  echo "Already running"
  echo "  workspace: $WS_KEY"
  echo "  socket:    $SOCK"
  echo "  PID:       $(cat $PID_FILE)"
  exit 0
fi

CLAUDE_PROJECT_DIR="$WS_CWD" CLAUDE_PLUGIN_ROOT="$PLUGIN" \
  node $PLUGIN/hooks/session-start/spawn-daemon.mjs

# Wait briefly for the socket to appear
for i in 1 2 3 4 5; do
  [ -S "$SOCK" ] && break
  sleep 0.3
done

if [ -S "$SOCK" ]; then
  echo "Started"
  echo "  workspace: $WS_KEY"
  echo "  cwd:       $WS_CWD"
  echo "  socket:    $SOCK"
  echo "  PID:       $(cat $PID_FILE 2>/dev/null)"
  echo
  echo "Verify:    /siftcoder:mem-check"
  echo "Status:    /siftcoder:mem-status"
else
  echo "FAIL: daemon did not come up within 1.5s"
  echo "  Check ~/.siftcoder/logs/${WS_KEY}.ndjson for boot errors"
  echo "  Common cause: better-sqlite3 native binding missing in the plugin cache install"
  exit 1
fi
```

After printing the result, tell the user the next thing they should run:

- If just-started: `/siftcoder:mem-check` to confirm full stack
- If already-running: nothing — proceed with normal work

## Tips

```
WHEN TO USE

Right after /plugin install:
  /siftcoder:mem-start
  /siftcoder:mem-check
  ← capture starts immediately

After a crash or kill:
  /siftcoder:mem-start
  ← daemon resumes; previously-captured events still in the DB

To ensure capture in a side-task workspace:
  cd /other/repo && /siftcoder:mem-start
```
