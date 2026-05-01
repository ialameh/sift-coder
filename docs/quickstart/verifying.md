# Verifying the install

Five things should be true once SiftCoder is set up. Walk through them in order. Each has a command, an expected result, and a fix if it isn't right.

## 1. The daemon is running

```
/siftcoder:mem info
```

Look for the line `daemon  running  pid=…  uptime=…`.

**If it says `unreachable`:** the daemon either isn't started or crashed. Run `/siftcoder:mem start`. If it still says unreachable, check the log at `~/.siftcoder/default/logs/<workspace>.ndjson` — the last few lines will explain why it died. The most common cause is a stale socket file from a previous crashed daemon; deleting it and re-running `start` fixes it.

**If it says `error`:** the daemon is listening but rejected the ping. This is rare and usually means the socket file is owned by a different user (e.g. you ran setup as root once). Delete the socket file and restart.

## 2. Capture is reaching the daemon

Make Claude read any file in your project. Then:

```
/siftcoder:mem info
```

The `events` counter under `counts` should have gone up by one or more.

**If it didn't go up:** the `PostToolUse` hook isn't firing. Two possible causes. First, the plugin's hooks may not be registered for this workspace — running Claude Code from a directory outside the workspace can confuse the per-workspace daemon. Second, your Claude Code settings may have hooks disabled globally. Check `~/.claude/settings.json` for a `hooks: false` flag and remove it.

## 3. Summarisation is making progress

Wait thirty seconds after capturing some events, then:

```
/siftcoder:mem info
```

The `summarized` count should be greater than zero. The `summaries` and `embeddings` counts should match (each summary gets one embedding).

**If `summarized` stays at zero:** no backend is available for the summariser. Check `backends` in the info output. If both `ollama=down` and `anthropic=no key`, you need to either start Ollama (`brew services start ollama` on macOS) or set `ANTHROPIC_API_KEY` in your environment and restart the daemon.

**If summarisation keeps failing:** force a drain pass and watch the output:

```
/siftcoder:mem drain 8
```

The error message will tell you which backend rejected the request. The most common one is an unreachable Ollama endpoint — the default is `http://localhost:11434` and if Ollama is bound to a different host you need to set `OLLAMA_ENDPOINT`.

## 4. Search returns something useful

From inside Claude Code, ask it a question that should hit your captured history. For example, if you just had it look at `src/auth/middleware.ts`, ask "what did we just look at in auth?". The retrieval skill should pull the captured event back into context.

You can also test retrieval directly with the MCP server. Run:

```
echo '{"jsonrpc":"2.0","id":1,"method":"tools/call","params":{"name":"mem_search","arguments":{"query":"middleware","k":3}}}' | \
  node ~/.claude/plugins/cache/siftcoder-marketplace/siftcoder/<version>/dist/memory/mcp/server.js
```

You should get back a list of summaries with scores.

**If search returns nothing despite captured events:** the embeddings probably haven't caught up yet. The consolidator runs every thirty seconds in the background; force it forward with `drain`. If summaries exist but search still finds nothing, the embedder is probably falling back to the deterministic embedder (which works but is intentionally weak). Set up Ollama with an embedding model — `nomic-embed-text` is the default — to get real semantic search.

## 5. Boundaries are enforced

This one is for safety. SiftCoder ships with a `PreToolUse` hook called the boundary enforcer. It reads a scope file at `.siftcoder/scope.json` (project) or `~/.siftcoder/default/scope.json` (global) and blocks `Write` or `Edit` calls outside the listed paths. Read calls are logged but allowed.

Verify it works by setting up a tight scope and trying to break it:

```bash
mkdir -p .siftcoder
cat > .siftcoder/scope.json <<'EOF'
{ "allowGlobs": ["src/**/*.ts"] }
EOF
```

Then ask Claude to write a file outside that path — `package.json` for instance. The PreToolUse hook should block it with a clear message.

**If the write is allowed anyway:** the boundary enforcer didn't run. Check that `.siftcoder/scope.json` is valid JSON and that the project hooks are wired in `~/.claude/plugins/...settings.json`.

## Everything's green. Now what?

Read [Mental model](../foundations/mental-model.md). Once you understand the four moving parts (daemon, hooks, storage, retrieval), the rest of the tool stops feeling like mystery infrastructure and becomes something you can reason about.
