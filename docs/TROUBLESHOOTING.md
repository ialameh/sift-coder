# Troubleshooting

## Daemon

### `daemon unreachable`

```
> node bin/siftcoder.mjs status
daemon unreachable: connect ENOENT ~/.siftcoder/run/<key>.sock
```

Start the daemon:

```bash
node bin/siftcoder.mjs start
```

If start succeeds but status still fails, the socket path may be wrong (different `CLAUDE_PROJECT_DIR`). The socket is workspace-keyed via `sha1(cwd).slice(0,12)`. Make sure your shell `cwd` matches what Claude Code uses.

### `start` succeeds, daemon dies immediately

Check the spawn log:

```bash
tail -50 ~/.siftcoder/logs/spawn.ndjson
```

Common causes:
- Native binding load failed → WASM fallback should have kicked in; verify with `node -e "require('node-sqlite3-wasm')"`
- Port collision (web UI sidecar) → daemon picks a free port automatically; if not, set `SIFTCODER_WEB_PORT=0` to disable
- Permissions on `~/.siftcoder/` directory

### Native binding fails

```
[siftcoder] better-sqlite3 native binding unavailable: ...
```

Two causes:
1. Node version mismatch with prebuilt binary → run `npm rebuild better-sqlite3`
2. Glibc/libstdc++ too old (Linux) → install `libstdc++6` ≥ 9 or use the WASM fallback

WASM is automatic — the daemon will boot anyway, just slower writes (~30%).

## Ollama

### `Ollama not detected` after install

```bash
curl -s http://localhost:11434/api/tags
```

If empty, Ollama daemon is not running:

```bash
brew services start ollama        # macOS
systemctl --user start ollama     # Linux
```

### Drain quality is low

Symptom: confidence-eval keeps escalating to Sonnet.

Fix: pull a larger model:

```bash
ollama pull llama3.1:8b
```

Then in `settings.json`:

```json
{ "siftcoder": { "ollama": { "summarizeModel": "llama3.1:8b" } } }
```

Restart daemon: `node bin/siftcoder.mjs stop && node bin/siftcoder.mjs start`

### Embedder dim mismatch

Symptom:

```
mem_search error: vector dim 768 != stored 384
```

You changed embedder mid-corpus. Either:

```bash
# revert embedder
SIFTCODER_EMBEDDER=deterministic node bin/siftcoder.mjs status

# or reset stored vectors
node bin/siftcoder.mjs mem reset-vectors --confirm
```

## Hooks

### Hook output appearing in chat

Some hooks write to stdout to surface hints. If this is too noisy, set:

```json
{ "siftcoder": { "hooks": { "verbosity": "error" } } }
```

### Boundary enforcer blocking edits unexpectedly

Check your scope:

```bash
cat .siftcoder/scope.json
```

If `allow` is too narrow, widen it. To disable enforcement for the project, delete the file.

### Hook timing out

Hooks have explicit timeouts in `hooks/hooks.json`. If something is consistently timing out, either the daemon is unreachable (silent failure path) or the hook has a real bug. Inspect:

```bash
tail -50 ~/.siftcoder/logs/spawn.ndjson
```

## MCP

### `siftcoder-memory` not appearing in tool list

Ensure `.mcp.json` is recognised. Restart Claude Code. Verify the build is current:

```bash
npm run build
ls dist/memory/mcp/server.js   # must exist
```

### MCP tool calls returning errors

The MCP server talks to the daemon over UDS. If the daemon is down, MCP tools will fail. Check `siftcoder status` first.

## Memory not capturing

1. Check daemon is up — `siftcoder status`
2. Check hooks are wired — `cat hooks/hooks.json` (PostToolUse should list `capture-observation.mjs`)
3. Check capture log — `~/.siftcoder/logs/capture.ndjson`
4. Check WAL has appends — `~/.siftcoder/workspaces/<key>/wal.log`

## Performance

### Search is slow

If `mem_search` is taking &gt; 100ms, your corpus is large enough to benefit from `sqlite-vec`. This requires the native backend (better-sqlite3 with extension loading). Verify:

```bash
node bin/siftcoder.mjs status | jq .backend
# expect: "native"
```

If on WASM, vector search stays JS-side. Acceptable up to ~10k summaries.

### Drain is slow

- Switch to a smaller Ollama model (`llama3.2:3b`) — fast first pass, escalate to Sonnet only when confidence is low
- Increase batch size in `settings.json` consolidator block — more parallelism per tick

## Resetting state

```bash
# import prior memory
node bin/siftcoder.mjs backfill ~/.siftcoder

# verify
node bin/siftcoder.mjs status
```

If a prior daemon is still running, stop it before reinstalling — they bind to the same `~/.siftcoder/run/*.sock` paths .

## Reset everything

```bash
node bin/siftcoder.mjs stop
rm -rf ~/.siftcoder
node bin/siftcoder.mjs setup
node bin/siftcoder.mjs start
```

This wipes all memory.
