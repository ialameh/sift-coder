# Hooks

The hook layer is what turns SiftCoder from a memory database into a system the harness actually feeds. Hooks are short Node scripts wired in `.claude-plugin/plugin.json` — every relevant tool call from Claude Code triggers a hook synchronously, and the hook either captures, blocks, or annotates.

For the *why*, read [foundations/hooks](../foundations/hooks.md). This page is the catalogue.

## Registration

Hooks are declared in `.claude-plugin/plugin.json` under the `hooks` block:

```json
"hooks": {
  "PreToolUse":  [{ "matcher": "Read|Write|Edit", "hooks": [{ "type": "command", ... "timeout": 5 }] }],
  "PostToolUse": [{ "matcher": "Read|Write|Edit|Bash|Grep|Glob", "hooks": [...] }, { "matcher": "Write|Edit", ... }],
  "PreCompact":  [{ "hooks": [...] }],
  "Notification":[{ "hooks": [...] }],
  "SessionStart":[{ "hooks": [{...ensure-built}, {...spawn-daemon}, {...install-error-banner}] }],
  "Stop":        [{ "hooks": [{...should-continue}] }]
}
```

The harness invokes the listed `command` synchronously, observing the timeout. A non-zero exit can block (PreToolUse) or annotate (PostToolUse, Notification). Most hooks are written **fail-open**: any error → stderr log + exit 0.

## Matrix

| Event | Matcher | File | Timeout | What it does | Failure mode |
|---|---|---|---|---|---|
| `PreToolUse` | `Read\|Write\|Edit` | `hooks/pre-tool-use/boundary-enforcer.mjs` | 5s | Blocks `Write`/`Edit` outside `.siftcoder/scope.json` allow-globs. Reads logged but allowed. | Fail-open: any error → stderr + exit 0. |
| `PostToolUse` | `Read\|Write\|Edit\|Bash\|Grep\|Glob` | `hooks/post-tool-use/capture-observation.mjs` | 2s | Sends a `capture` RPC to the per-workspace daemon over UDS. Fire-and-forget. Adds ~2 ms to each tool call. | Silent: any error swallowed; never blocks. |
| `PostToolUse` | `Write\|Edit` | `hooks/post-tool-use/detect-console-logs.mjs` | 2s | Scans the edited TS/JS file for `console.log/debug/info/warn/error/trace`. Emits warnings with line + context. | Fail-open. |
| `PostToolUse` | `Write\|Edit` | `hooks/post-tool-use/auto-checkpoint.mjs` *(disabled by default)* | n/a | Creates a lightweight checkpoint snapshot every N edits or M minutes. | Silent fail-open. Enable in `settings.json` → `siftcoder.hooks.autoCheckpoint.enabled = true`. |
| `PreCompact` | (any) | `hooks/pre-compact/inject-memories.mjs` | 3s | Reads last 16 KiB of transcript, queries `mem_search` for top-8 hits, appends to `additional_context` so the compacted summary preserves load-bearing facts. | Fail-open. Compaction proceeds without injection on error. |
| `Notification` | (any) | `hooks/notification/pin-incident.mjs` | 2s | When the harness emits a notification (permission prompt, idle warning, error), captures it as a high-priority memory frame. | Silent. |
| `SessionStart` | (any) | `hooks/session-start/ensure-built.mjs` | 300s | If `dist/memory/mcp/server.js` is missing, runs `npm install && npm run build` in the plugin root. Logs to `~/.siftcoder/<ns>/logs/install.ndjson`. Idempotent. | On build failure: writes `install-error.flag` and exits 0 — `install-error-banner.mjs` then surfaces the error to the user next run. |
| `SessionStart` | (any) | `hooks/session-start/spawn-daemon.mjs` | 3s | Idempotent daemon spawn. Verifies native deps; reinstalls `better-sqlite3` if its prebuilt binary is missing. Spawns daemon detached. Waits up to 2s for socket. Logs to `spawn.ndjson`. | Fail-open. Logs and exits 0. |
| `SessionStart` | (any) | `hooks/session-start/install-error-banner.mjs` | 1s | If `install-error.flag` exists from a prior failed `ensure-built`, prints a one-line install instruction to stdout (which Claude Code surfaces). Rotates flag to `.seen`. | Always exits 0. |
| `Stop` | (any) | `hooks/stop/should-continue.mjs` | 5s | Queries the daemon for pending drain count, emits a one-line hint ("X events pending; run `/siftcoder:mem drain`"). | Fail-open: 1.5s budget; silent on miss. |

## Detailed entries

### boundary-enforcer (`PreToolUse: Write|Edit|Read`)

**Path**: `/Users/sam/Documents/Plugins/SiftCoder/hooks/pre-tool-use/boundary-enforcer.mjs`

Reads the scope file, with project taking precedence over global:

1. `<project>/.siftcoder/scope.json`
2. `~/.siftcoder/<NS>/scope.json`

If neither exists, no enforcement runs. If the file exists, `Write` and `Edit` to paths not matching any allow-glob are blocked (non-zero exit, blocking message). `Read` is logged but never blocked.

**Failure mode**: any error in the enforcer (bad JSON, glob throw, fs error) → stderr log + exit 0. The hook's bugs cannot accidentally block your work.

### capture-observation (`PostToolUse: Read|Write|Edit|Bash|Grep|Glob`)

**Path**: `/Users/sam/Documents/Plugins/SiftCoder/hooks/post-tool-use/capture-observation.mjs`

The capture path. Every relevant tool call:

1. Resolves workspace key (sha256 of git toplevel realpath).
2. Builds a `capture` request (see [protocol.md](protocol.md)).
3. Connects to `~/.siftcoder/<NS>/run/<key>.sock`.
4. Writes a length-prefixed JSON frame.
5. Reads the response (event id) or times out.
6. Closes.

Budget is 250 ms per the config; in practice a healthy daemon answers in 2-5 ms. **If the daemon isn't running the connection fails and the hook exits silently** — your work is never blocked by a missing daemon.

**Logs**: nothing. Errors are swallowed by design — the daemon's own log shows what was missed.

### detect-console-logs (`PostToolUse: Write|Edit`)

**Path**: `/Users/sam/Documents/Plugins/SiftCoder/hooks/post-tool-use/detect-console-logs.mjs`

Scans `.ts`, `.tsx`, `.js`, `.jsx`, `.mjs`, `.cjs` files for the pattern `^\s*console\.(log|debug|info|warn|error|trace)\(`. Emits a warning with the line number and a short context snippet. Doesn't block. Useful for catching debug prints before they ship.

### auto-checkpoint (`PostToolUse: Write|Edit`, opt-in)

**Path**: `/Users/sam/Documents/Plugins/SiftCoder/hooks/post-tool-use/auto-checkpoint.mjs`

Disabled by default. Enable in `settings.json`:

```json
{
  "siftcoder": {
    "hooks": {
      "autoCheckpoint": {
        "enabled": true,
        "everyEdits": 25,
        "everyMs": 1800000
      }
    }
  }
}
```

When enabled, creates a lightweight git snapshot tag every N edits or every M ms (whichever fires first). Useful for long autonomous runs where you want fast rollback. **Silent on failure** — never blocks user work.

### inject-memories (`PreCompact`)

**Path**: `/Users/sam/Documents/Plugins/SiftCoder/hooks/pre-compact/inject-memories.mjs`

The compaction firewall. Before the harness compacts a long transcript:

1. Read the last 16 KiB of the transcript file.
2. Query the daemon's `search` with that tail as the query, `k=8`.
3. Format the hits as a `## Relevant memory` section.
4. Append to `additional_context` so the harness's compactor preserves the load-bearing facts.

Budget is 1.5s. If the daemon isn't reachable or the search returns nothing, compaction proceeds without injection — fail-open.

### pin-incident (`Notification`)

**Path**: `/Users/sam/Documents/Plugins/SiftCoder/hooks/notification/pin-incident.mjs`

When the harness emits any notification — permission prompt, idle warning, error — the hook captures it as a high-priority memory frame. The frame is tagged so `/handoff` can later surface it as "things that interrupted you this session".

### ensure-built (`SessionStart`, 300s)

**Path**: `/Users/sam/Documents/Plugins/SiftCoder/hooks/session-start/ensure-built.mjs`

The "first-install" hook. Marketplace plugin installs git-clone the repo without running `npm install` or `npm run build`, so `dist/` is missing and everything else fails. This hook fixes that.

1. Detect plugin root via `CLAUDE_PLUGIN_ROOT`.
2. If `dist/memory/mcp/server.js` exists → silent exit.
3. Otherwise: run `npm install && npm run build`.
4. Log to `~/.siftcoder/<ns>/logs/install.ndjson`.
5. On success → silent.
6. On failure → write `install-error.flag` + exit 0.

Idempotent. ~50 ms when already built; up to 90 s on first run.

### spawn-daemon (`SessionStart`, 3s)

**Path**: `/Users/sam/Documents/Plugins/SiftCoder/hooks/session-start/spawn-daemon.mjs`

Idempotent daemon spawn with self-heal:

1. If a daemon is alive (PID + socket present) → exit immediately.
2. Otherwise verify the plugin's native deps (`better-sqlite3` prebuilt binary). If missing → reinstall.
3. Spawn the daemon detached.
4. Wait up to 2 s for the socket.
5. Log outcome to `~/.siftcoder/<ns>/logs/spawn.ndjson`.

The self-heal step is the permanent fix for plugin caches that lose the native binary after `/plugin uninstall + install`.

### install-error-banner (`SessionStart`, 1s)

**Path**: `/Users/sam/Documents/Plugins/SiftCoder/hooks/session-start/install-error-banner.mjs`

If `ensure-built` left an `install-error.flag`, this hook prints a one-line instruction to stdout (which Claude Code surfaces to the user) and rotates the flag to `.seen` so it shows once. Always exits 0.

### should-continue (`Stop`)

**Path**: `/Users/sam/Documents/Plugins/SiftCoder/hooks/stop/should-continue.mjs`

End-of-turn signal. Queries the daemon's `status` for the pending event count and emits a one-line hint:

```
[siftcoder] 12 events pending drain. Run /siftcoder:mem drain when convenient.
```

Budget 1.5 s; non-blocking.

## Logs

All hooks log to ndjson under the namespace logs dir:

| File | Source |
|---|---|
| `~/.siftcoder/<ns>/logs/<wsKey>.ndjson` | The daemon itself (capture path, consolidator, retrieval). |
| `~/.siftcoder/<ns>/logs/install.ndjson` | `ensure-built` build attempts. |
| `~/.siftcoder/<ns>/logs/spawn.ndjson` | `spawn-daemon` startup attempts. |

## Cross-references

- The narrative on hooks: [foundations/hooks](../foundations/hooks.md).
- The capture wire format: [protocol.md](protocol.md).
- The scope file: [layout.md](layout.md) and the `scope` skill.
