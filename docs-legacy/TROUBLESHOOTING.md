# Troubleshooting

Common problems and fixes.

## Install

### `Cannot find module .../dist/memory/...`

The plugin was installed without building. SessionStart hook `ensure-built.mjs` auto-fixes this on next session start.

If the hook didn't fire (e.g. you ran `siftcoder` CLI before any Claude Code session), build manually:

```bash
! cd ~/.claude/plugins/cache/siftcoder-marketplace/siftcoder/<version> && npm install && npm run build
```

Replace `<version>` with the installed version (`1.0.0` etc.). The `!` prefix runs the command in the current Claude Code prompt.

The auto-build runs `npm install` (skipped if `node_modules/` already populated) then `npx tsc`. Logs to `~/.siftcoder/v3/logs/install.ndjson`.

### Build fails with "Cannot find module 'typescript'"

`node_modules/` is incomplete. Install fully:

```bash
! cd ~/.claude/plugins/cache/siftcoder-marketplace/siftcoder/<version> && rm -rf node_modules && npm install && npm run build
```

### Banner: "SiftCoder install incomplete"

`ensure-built.mjs` failed and dropped a flag at `~/.siftcoder/v3/install-error.flag`. Run the printed command, then restart your Claude Code session.

## Daemon

### Daemon not reachable

```
Error: connect ENOENT ~/.siftcoder/run/<key>.sock
```

The daemon either hasn't spawned yet or has shut down (idle timeout 30 min). Force a respawn:

```
/siftcoder:mem start
```

Or check what the SessionStart hook tried to do:

```bash
tail -50 ~/.siftcoder/logs/spawn.ndjson
```

### Daemon won't start (native binding missing)

The plugin auto-rebuilds `better-sqlite3`'s native binding on session start. If that fails, the daemon falls back to the WASM SQLite backend. Logs:

```bash
tail -50 ~/.siftcoder/logs/<key>.ndjson
tail -50 ~/.siftcoder/logs/spawn.ndjson
```

If both backends fail, manual recovery:

```bash
cd ~/.claude/plugins/cache/siftcoder-marketplace/siftcoder/<version>
npm rebuild better-sqlite3 --build-from-source
```

### Wrong workspace key

`/siftcoder:mem status` prints `workspace: <key> (<cwd>)` on the first line. If the cwd isn't what you expect, ensure `CLAUDE_PROJECT_DIR` is set, or run from the project's git root. Non-git directories use the cwd path itself as the key.

## Drain

### `mem_drain` returns errors with `"Method not found"`

Claude Code's MCP host doesn't yet implement `sampling/createMessage`. Pick a backend:

```bash
# Ollama (recommended — local, free)
brew install ollama && ollama pull llama3.2:3b
brew services start ollama

# OR Anthropic API (paid)
export SIFTCODER_DRAIN_BACKEND=anthropic
export ANTHROPIC_API_KEY=sk-...
```

Then restart Claude Code so the MCP server picks up the env.

### `mem_drain` returns errors with `"ECONNREFUSED"`

Ollama daemon stopped:

```bash
brew services start ollama
# or run interactively:
ollama serve
```

### Drain returns `processed: 0, errors: N`

Look at `firstError` in the result. The MCP server surfaces the actual host error message. Common values:

- `Method not found` → see above
- `ECONNREFUSED` → see above
- `ollama api 503` → Ollama daemon overloaded; retry
- `anthropic api 429` → rate limit; wait or reduce batch
- `JSON parse error` → model output didn't match the JSON schema; usually transient

## Memory

### `mem_search` returns no hits

1. Confirm capture worked: `/siftcoder:mem status` should show `events captured > 0`
2. Confirm drain worked: same status should show `summarized > 0`
3. If only `events` populated, run `/siftcoder:mem drain`
4. If both zero, run `/siftcoder:mem backfill` to import past Claude Code transcripts

### Capture stopped working mid-session

The daemon may have idle-shut-down after 30 min without traffic. Force respawn:

```bash
kill $(cat ~/.siftcoder/workspaces/<key>/run.pid 2>/dev/null) 2>/dev/null
rm -f ~/.siftcoder/run/<key>.sock
# next tool call → SessionStart hook respawns
```

Or just restart Claude Code.

## Web

### Browser shows 401 on style.css / app.js

The MCP server should rewrite asset URLs in the SPA shell to include the auth token. If you see 401s, you may have an out-of-date plugin install:

```
/plugin install siftcoder
```

### `/siftcoder:mem web` says "bridge not active"

The daemon hasn't started or `SIFTCODER_NO_HTTP=1` is set. Run `/siftcoder:mem start` (or unset the env var and respawn).

## Hooks

### Boundary-enforcer blocks all writes

Your `.siftcoder/scope.json` allow-globs are too narrow. Loosen them or remove the file to disable the enforcer:

```bash
rm .siftcoder/scope.json   # falls back to "no scope, allow all"
```

### Auto-checkpoint creating too many commits

It's opt-in — disable in `settings.json`:

```json
{ "siftcoder": { "hooks": { "autoCheckpoint": { "enabled": false } } } }
```

## Resetting state

Wipes all captured memory + summaries. Daemon stops automatically when its workspace dir is gone.

```bash
rm -rf ~/.siftcoder
```

## Where to look first

When something is off, run these in order:

```bash
/siftcoder:mem check               # 5 health-check points
/siftcoder:mem status              # capture / drain / spend
tail -50 ~/.siftcoder/logs/<key>.ndjson
tail -50 ~/.siftcoder/logs/spawn.ndjson
```

If those don't surface the issue, open an issue with the output of all three.
