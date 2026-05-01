# Troubleshooting

The chapter you grep, not the one you read in order.

Each entry is a symptom you'd plausibly see, what's usually causing it, and the commands to fix it. If your symptom isn't here, the [Architecture overview](../foundations/architecture.md#where-to-look-when-something-breaks) has a higher-level diagnosis table.

## Daemon and process issues

### "daemon unreachable"

`siftcoder info` reports `daemon: unreachable`. The CLI's RPC connection to the UDS socket failed.

```bash
# Check if the daemon process is alive
PID=$(cat ~/.siftcoder/default/workspaces/<key>/run.pid 2>/dev/null)
ps -p "$PID"

# If the pid file points at a dead process, clean up and restart
rm ~/.siftcoder/default/workspaces/<key>/run.pid
siftcoder start
```

If `start` succeeds but `info` still says unreachable a few seconds later, check the daemon log:

```bash
tail -50 ~/.siftcoder/default/logs/<key>.ndjson
```

Common cause: SQLite migration failed because of a corrupt schema. See "WAL replay errors on startup" below.

### Stale socket file

Daemon was killed without cleanup, the `.sock` file remains, the next daemon refuses to bind because the path is "in use."

```bash
rm ~/.siftcoder/default/run/<key>.sock
siftcoder start
```

If this happens repeatedly, the daemon is crashing during shutdown and not unlinking the socket. Check the log for the crash reason; usually a flush-on-stop bug.

### Daemon restarts itself constantly

Uptime is always under a minute when you check `info`. The `SessionStart` hook is detecting an unhealthy daemon and restarting, but the new daemon dies the same way.

```bash
# Watch the log live to see why each instance dies
tail -f ~/.siftcoder/default/logs/<key>.ndjson
```

Common causes: a config file with invalid JSON; an Anthropic key that's malformed (the daemon validates on startup); a SQLite schema mismatch between the version that wrote the DB and the one trying to open it.

## Capture issues

### Events not capturing

You've made Claude do work (Read, Edit, Bash) but `info` shows `events=0` or a number that hasn't moved.

```bash
# Confirm hooks are configured
grep -r "post-tool-use" ~/.claude/settings.json ~/.claude/plugins/cache/siftcoder-marketplace/

# Confirm the daemon is reachable from the hook
siftcoder info
```

If the daemon is reachable but events aren't coming in, run a hook by hand:

```bash
node ~/.claude/plugins/cache/siftcoder-marketplace/siftcoder/<version>/hooks/post-tool-use/capture-observation.mjs <<< '{"tool":"Read","input":{"path":"/tmp/x"},"output":"hello"}'
```

It should print `{"ok":true}` and the event count should increment. If it errors with a connection failure, the hook is using the wrong socket path — usually means `SIFTCODER_NS` differs between hook and CLI.

### Boundary enforcer not blocking

You configured `.siftcoder/scope.json` to disallow writes outside `src/`, but Claude wrote to `tests/` anyway.

```bash
# Validate the scope file is parseable JSON
jq . .siftcoder/scope.json
```

Most common cause: a JSON-with-comments file. The boundary enforcer uses strict `JSON.parse` and silently no-ops if parsing fails. Remove comments and trailing commas. Re-test.

### Capture latency spikes

Tool calls feel slow. Suspecting the hook.

```bash
# Time a capture roundtrip
time node ~/.claude/plugins/cache/siftcoder-marketplace/siftcoder/<version>/hooks/post-tool-use/capture-observation.mjs <<< '{"tool":"Read","input":{},"output":""}'
```

Healthy: under 50 ms. Over 200 ms means the daemon is doing something synchronous in the request handler (rare), or the WAL fsync is hitting a slow disk (more likely on a network-mounted home directory). The hook has a `captureObservationBudgetMs: 250` budget; over that, it fails open and lets the tool call proceed without capture.

## Drain and summarisation issues

### Summaries stuck at 0

`info` shows non-zero `events` but `summaries=0`.

```bash
# Force a manual drain to see the error
siftcoder drain 8
```

Read the JSON output. `firstError` will tell you whether it's an Ollama outage, a missing API key, or a malformed payload.

If `processed > 0` but `summaries` in `info` still reads 0, you're looking at different SQLite files — verify the workspace key matches.

### "no drain backend available"

`siftcoder drain` errors with `no drain backend available: start Ollama or set ANTHROPIC_API_KEY`.

```bash
# Start Ollama
ollama serve  # or: brew services start ollama

# Or set the API key
export ANTHROPIC_API_KEY=sk-ant-...
```

The CLI checks Ollama first (`OllamaClient.available()`), then the env var. If both are set, Ollama wins.

### Anthropic 401

Drain reports `Anthropic API error: 401`. Key is invalid, expired, or revoked.

```bash
# Test the key directly
curl https://api.anthropic.com/v1/messages \
  -H "x-api-key: $ANTHROPIC_API_KEY" \
  -H "anthropic-version: 2023-06-01" \
  -H "content-type: application/json" \
  -d '{"model":"claude-haiku-4-5","max_tokens":10,"messages":[{"role":"user","content":"hi"}]}'
```

If that 401s, regenerate the key in the Anthropic console. Don't hard-code the new one in `~/.siftcoder/default/config.json`; export it from your shell profile so it lives outside the project.

### Ollama connection refused

Drain reports `fetch failed: connect ECONNREFUSED 127.0.0.1:11434`.

```bash
# Check Ollama is listening
curl -s http://localhost:11434/api/tags

# Start it if not
ollama serve
```

If Ollama is on a different port or host, set `OLLAMA_HOST` in the env, or override `ollama.endpoint` in `~/.siftcoder/default/config.json`.

### Drain succeeds but takes forever

Drain processes batches but each batch takes minutes. Either the model is too large for the machine, or the events being summarised are unusually large.

```bash
# Check median event size
sqlite3 ~/.siftcoder/default/workspaces/<key>/db.sqlite \
  "SELECT AVG(LENGTH(payload_json)) FROM events WHERE status='raw' LIMIT 100;"
```

If the average is above 50k characters, something is capturing huge payloads. Most often it's a long Bash output. Either truncate at the hook level (config option) or accept the latency.

If event sizes are normal, the model is too big. Switch to `llama3.2:1b` for summarisation:

```json
{ "ollama": { "summarizeModel": "llama3.2:1b" } }
```

in `~/.siftcoder/default/config.json`.

## Search and retrieval issues

### Search returns nothing

`mem_search` or the web UI's search returns zero results despite known summaries existing.

```bash
# Confirm summaries exist and are queryable
sqlite3 ~/.siftcoder/default/workspaces/<key>/db.sqlite \
  "SELECT count(*) FROM summaries;"

# Check if FTS5 index is populated
sqlite3 ~/.siftcoder/default/workspaces/<key>/db.sqlite \
  "SELECT count(*) FROM summaries_fts;"
```

If `summaries` is non-zero but `summaries_fts` is zero, the FTS index didn't populate. Restart the daemon — the migration on startup should rebuild it. If it still doesn't, file a bug; this should not happen.

### Embeddings count diverges from summaries count

`info` shows `summaries=412 embeddings=325`. The embedder is failing or lagging.

```bash
# Check daemon log for embedder errors
grep -i embed ~/.siftcoder/default/logs/<key>.ndjson | tail -20
```

Most common: `nomic-embed-text` is not pulled in Ollama.

```bash
ollama pull nomic-embed-text
```

If embeddings then catch up automatically, fine. If not, force a re-embed by deleting the affected rows from `summary_embeddings` and restarting — the consolidator will queue them.

### Retrieval surfaces irrelevant memories

You search for "webhook" and get back summaries about CSS. The vector leg is dominating with low-quality embeddings, usually because Ollama is down and the cascade fell through to the deterministic embedder.

```bash
# Confirm Ollama embedding endpoint works
curl -s http://localhost:11434/api/embeddings -d '{"model":"nomic-embed-text","prompt":"test"}'
```

If that fails, fix Ollama. Then re-embed the affected rows (delete from `summary_embeddings`, daemon will re-create on next pass).

## Backfill issues

### Backfill returns 0 captured

```json
{ "scanned": 0, "captured": 0, "skippedDuplicate": 0, "errors": 0 }
```

`scanned: 0` means no transcripts matched. Either:

- `~/.claude/projects/` doesn't exist (you've never used Claude Code outside the plugin context).
- The workspace's encoded directory name doesn't match. The encoder replaces `/` with `-`. If your project lives at `/Users/sam/Code/proj`, the encoded form is `-Users-sam-Code-proj`. If `~/.claude/projects/-Users-sam-Code-proj/` doesn't exist, there's nothing to replay.

Check what's actually there:

```bash
ls ~/.claude/projects/
```

If you see a similar but not-identical encoding (e.g., a stale path from before you renamed the directory), backfill won't pick it up. You can either rename the directory back to match (if you can) or run replay manually with a custom `cwd`.

### Backfill captures but nothing summarises

You backfilled 1000 events, the events table grew, but `summaries` stays at 0.

This is a drain backend problem, not a backfill problem. See "Summaries stuck at 0" above.

## Web UI issues

### Web UI port file missing

```
$ siftcoder web
web bridge not active yet; start the daemon and ensure SIFTCODER_NO_HTTP is not 1
```

Either the daemon isn't running, or `SIFTCODER_NO_HTTP=1` is set, or the bridge crashed at startup.

```bash
# Check the bridge isn't disabled
echo "$SIFTCODER_NO_HTTP"

# Check the daemon log for bridge errors
grep -i 'bridge\|http' ~/.siftcoder/default/logs/<key>.ndjson | tail
```

If the log shows the bridge starting but then erroring, common causes are port exhaustion (every candidate port was in use, then OS-assigned also failed — extremely rare) or a permission problem with the static asset directory.

### Web UI shows wrong workspace

You opened the URL but the data shown is from a different project's workspace.

The bridge writes `http.port` per workspace. If you have two daemons running for two workspaces, they each have their own `http.port` and the CLI picks based on the current `cwd`. `cd` into the right project and run `siftcoder web` again.

### 401 from web UI

```bash
# Cycle the token
rm ~/.siftcoder/auth.token
siftcoder stop
siftcoder start
# Reload the UI
```

This regenerates the token and the next bridge instance picks it up.

## Database issues

### SQLite locked

```
Error: SQLITE_BUSY: database is locked
```

Two writers are competing. Most common cause: you're running `siftcoder drain` while the daemon's consolidator is also draining. SQLite's WAL mode is supposed to handle this, but very old SQLite versions or unusual filesystems (NFS, some FUSE mounts) can get into a stuck state.

```bash
# Stop the daemon, complete the manual drain, restart
siftcoder stop
siftcoder drain 64
siftcoder start
```

If the lock persists with the daemon stopped, the WAL is in an unusual state. Stop everything, move the WAL file aside (`mv wal.ndjson wal.ndjson.bak`), restart. The daemon will replay any pending events from the backup file on next startup.

### WAL replay errors on startup

Daemon log shows entries like `WAL replay failed: SyntaxError: unexpected token at line 1432`.

A WAL line was written incompletely (crash mid-fsync, disk full mid-write). The replay is line-tolerant — it skips bad lines and continues — but it logs the failure. Usually safe to ignore. If startup fails entirely, the WAL is corrupt enough to need manual surgery:

```bash
# Inspect
head -1432 ~/.siftcoder/default/workspaces/<key>/wal.ndjson | tail -5

# Truncate at the bad line
head -1431 ~/.siftcoder/default/workspaces/<key>/wal.ndjson > /tmp/wal.fixed
mv /tmp/wal.fixed ~/.siftcoder/default/workspaces/<key>/wal.ndjson
siftcoder start
```

You'll lose any events that were in the lines after the truncation point. Usually a handful, no more.

### Database file growing unexpectedly

```bash
du -h ~/.siftcoder/default/workspaces/<key>/db.sqlite
```

Healthy: under 100 MiB after a year of heavy use. If you see > 1 GiB on a young workspace, find the outlier rows:

```sql
SELECT id, LENGTH(payload_json) FROM events ORDER BY LENGTH(payload_json) DESC LIMIT 10;
```

You'll usually see one or two events with payloads in the megabytes — captured Bash output that wasn't truncated. Delete them, vacuum the database:

```bash
sqlite3 ~/.siftcoder/default/workspaces/<key>/db.sqlite "DELETE FROM events WHERE id IN (...); VACUUM;"
```

## Catch-all

When nothing in this chapter matches, the diagnostic order is:

1. `siftcoder info` — what does it say is wrong?
2. `tail -100 ~/.siftcoder/<ns>/logs/<key>.ndjson` — what was the last error?
3. `siftcoder drain 1` — does a fresh process see the same problem?
4. Restart the daemon and try again.

If after that you still don't know, file an issue with the `info --json` output and the last 100 log lines. Most bugs are diagnosable from those two pieces alone.
