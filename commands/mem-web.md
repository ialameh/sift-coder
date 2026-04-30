---
description: Open the SiftCoder Memory web client in your browser
argument-hint: [--no-open]
allowed-tools: Bash
---

# /siftcoder:mem-web - Open Memory Web Client

Launches the local browser-based dashboard against the daemon's HTTP bridge. Six tabs: Overview, Events, Summaries, Search, Provenance, A/B savings.

Bound to `127.0.0.1` only. Auth via the bearer token at `~/.siftcoder/auth.token` — token is auto-injected into the URL so the browser session is authenticated immediately.

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

PORT_FILE=~/.siftcoder/workspaces/${WS_KEY}/http.port
SOCK=~/.siftcoder/run/${WS_KEY}.sock
```

### Step 1: ensure daemon is up

If the socket is missing, run the SessionStart spawn hook:

```bash
if [ ! -S "$SOCK" ]; then
  CLAUDE_PROJECT_DIR="$WS_CWD" CLAUDE_PLUGIN_ROOT="$PLUGIN" \
    node $PLUGIN/hooks/session-start/spawn-daemon.mjs
  sleep 1
fi
```

### Step 2: ensure HTTP bridge is up

The HTTP bridge is on by default. If `http.port` is missing, the daemon was started with `SIFTCODER_NO_HTTP=1`. Tell the user, then offer to restart without that flag:

```bash
if [ ! -f "$PORT_FILE" ]; then
  echo "HTTP bridge not enabled for this daemon."
  echo "Restart the daemon without SIFTCODER_NO_HTTP=1:"
  echo "  kill \$(cat ~/.siftcoder/workspaces/${WS_KEY}/run.pid)"
  echo "  /siftcoder:mem-start"
  exit 2
fi
```

### Step 3: print or open the URL

```bash
if echo "$ARGUMENTS" | grep -q -- "--no-open"; then
  CLAUDE_PROJECT_DIR="$WS_CWD" node $PLUGIN/dist/memory/cli.js web
else
  CLAUDE_PROJECT_DIR="$WS_CWD" node $PLUGIN/dist/memory/cli.js web --open
fi
```

## What the user sees

After running, the system browser opens to `http://127.0.0.1:<port>/?token=<token>`. The token is pulled from the URL into sessionStorage on first load, then stripped from the address bar.

Six tabs:

| Tab | Source |
|---|---|
| Overview | `siftcoder-mem savings` rendered as panels |
| Events | last 100 captured events with status tags |
| Summaries | last 100 summaries with confidence + text |
| Search | hybrid retrieval form, ranked results |
| Provenance | `mem_why` walk from any (kind, id) node |
| A/B savings | runs `AbHarness` on demand, plots Branch A vs B |

Auto-refresh every 15s. Manual `↻` button. Token persists across page reloads in sessionStorage.

## Tips

```
DAILY USE

  /siftcoder:mem-web          ← opens the dashboard

If the bridge is disabled (SIFTCODER_NO_HTTP=1 in env):
  unset SIFTCODER_NO_HTTP
  /siftcoder:mem-start
  /siftcoder:mem-web
```
