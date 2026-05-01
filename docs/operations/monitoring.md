# Monitoring

SiftCoder runs as a long-lived daemon. Long-lived processes drift — a memory leak surfaces over a week, an LLM endpoint quietly starts rate-limiting, a SQLite write fails and the queue silently backs up. You won't notice until your search results get worse, by which point the drift has already cost you.

The plugin ships a small monitor that pings the daemon every 30 seconds and writes a line to a log file. It is dumb on purpose — no thresholds, no alerting, no aggregation. It is the data feed; you decide what to do with it.

## The shipped monitor

`monitors/memory-daemon-health.mjs` is a 50-line Node script. It does exactly three things:

1. Resolve the workspace key from `CLAUDE_PROJECT_DIR` or `cwd`.
2. Open a UDS connection to the daemon's socket, send `{op: 'ping'}`, wait up to 1500 ms for a response.
3. Append a JSON line to `~/.siftcoder/<namespace>/health.ndjson` with the timestamp, success flag, and round-trip latency.

```js
const r = await ping();
fs.appendFileSync(log, JSON.stringify({ ts: new Date().toISOString(), ...r }) + '\n');
```

You run it like a daemon of its own:

```bash
nohup node ~/.claude/plugins/cache/siftcoder-marketplace/siftcoder/<version>/monitors/memory-daemon-health.mjs &
```

Or wire it into a launchd / systemd unit. The script is intentionally simple so you can read it once and trust it.

The output is line-delimited JSON. A healthy run looks like:

```
{"ts":"2025-04-12T09:14:02.103Z","ok":true,"latencyMs":3,"body":"{\"ok\":true}"}
{"ts":"2025-04-12T09:14:32.107Z","ok":true,"latencyMs":2,"body":"{\"ok\":true}"}
{"ts":"2025-04-12T09:15:02.111Z","ok":true,"latencyMs":4,"body":"{\"ok\":true}"}
```

An unhealthy run looks like:

```
{"ts":"2025-04-12T09:14:02.103Z","ok":true,"latencyMs":3,"body":"{\"ok\":true}"}
{"ts":"2025-04-12T09:14:32.107Z","ok":false,"latencyMs":1500,"error":"timeout"}
{"ts":"2025-04-12T09:15:02.111Z","ok":false,"latencyMs":2,"error":"connect ENOENT"}
{"ts":"2025-04-12T09:15:32.115Z","ok":false,"latencyMs":2,"error":"connect ENOENT"}
```

The first failure is a timeout — the socket exists but the daemon didn't respond in 1500 ms. The next two are `ENOENT`, meaning the socket file no longer exists; the daemon is dead.

## What healthy looks like

Health is not a single metric. There are four signals to track, and you want all four moving in the right direction.

**Daemon liveness.** The ping succeeds. `ok: true` in the health log, latency under 50 ms on a quiet system. If latency is consistently over 200 ms, the daemon is doing too much work in the request handler — file a bug, but it's not urgent.

**Uptime growing.** The daemon's `info.daemon.uptimeSec` should grow monotonically across observations. If you check it on Monday morning and the uptime is shorter than the time since you last started it, the daemon restarted. The `SessionStart` hook will quietly restart it after a crash, so a shorter-than-expected uptime usually means something broke and recovered without your involvement.

**Raw events not piling.** `counts.raw` should oscillate around zero. It will spike when you do heavy work, then come back down within a tick or two. If `raw` is climbing for hours and never coming down, the consolidator is failing — usually a backend outage. See [Drain](drain.md) for how to investigate.

**Embeddings tracking summaries.** `counts.embeddings` should equal `counts.summaries` plus or minus the current batch. If embeddings is significantly behind summaries (more than ~100), the embedder is failing while the summariser is succeeding. This usually means Ollama is up for chat completions but down for embeddings — either the embedding model isn't pulled (`ollama pull nomic-embed-text`) or the embedder cascade has fallen back to deterministic, which would be visible in the daemon log.

## What unhealthy looks like

**Daemon unreachable for sustained periods.** Health log shows repeated `ENOENT` or `timeout`. The daemon either didn't start, crashed, or got SIGKILL'd. Check `~/.siftcoder/<ns>/workspaces/<key>/run.pid` — if the file exists and the pid is no longer running, the daemon died. Delete the pid file and run `siftcoder start`.

**Events accumulating in `raw`.** `counts.raw` keeps climbing. The consolidator is ticking but failing. Force a drain (`siftcoder drain 32`) and read the `firstError` from the JSON output. Most common: backend down, API key revoked, network partition.

**Drain failing silently.** The skipped count (`counts.skipped`) is climbing. The consolidator gave up on rows after repeated retries. Look at the daemon log for the rejection reason; usually a poison-pill payload (truncated, malformed). Skipped rows do not auto-retry — you can manually re-queue them with `UPDATE events SET status='raw' WHERE status='skipped'` once the underlying issue is fixed, but you can also leave them; they're already in the events table for inspection.

**DB size growing without bound.** Run `du -h ~/.siftcoder/<ns>/workspaces/<key>/db.sqlite`. Healthy steady-state for an active workspace is under 100 MiB after a year. If you see 1+ GiB and the workspace is younger than that, something is over-capturing — most likely a long-running Bash output that was captured verbatim instead of truncated. Use the curator (`mem prune --confirm`) to find and remove the outlier rows.

**WAL growing without bound.** The WAL at `~/.siftcoder/<ns>/workspaces/<key>/wal.ndjson` should stay small because the daemon truncates it after successful SQLite commits. If it's larger than the database, the truncation logic is failing — file a bug, and as a workaround stop the daemon, move the WAL aside, restart. The daemon will replay any unflushed events on next startup.

## The dig-status / dig-health surface

If you have the `dig-*` skill catalogue installed (it's bundled with several SiftCoder configs), `/dig-status` and `/dig-health` are the conventional ways to spot-check from inside Claude Code. They wrap `siftcoder info` plus the last few lines of the health log into a single prompt-friendly summary. Useful when you want a snapshot without leaving the editor.

If you don't have those skills, `/siftcoder:status` is the equivalent first-pass health check — it reads the daemon ping, counts, focus, and scope in one shot.

## Wiring a custom monitor

The shipped monitor is deliberately stupid because most teams want their own. Three patterns work:

**1. A periodic shell script.** Cron a script that runs `siftcoder info --json`, jq-extracts the counts, and posts to your existing observability stack (Datadog, Grafana, a Slack webhook). The JSON output of `info` is stable and tested.

```bash
#!/bin/bash
INFO=$(siftcoder info --json)
RAW=$(echo "$INFO" | jq '.counts.raw')
SKIPPED=$(echo "$INFO" | jq '.counts.skipped')
if [ "$RAW" -gt 200 ]; then
  curl -X POST "$SLACK_WEBHOOK" -d "{\"text\": \"SiftCoder: $RAW raw events backed up\"}"
fi
```

Cron it every five minutes. You'll get a ping when something genuinely backs up.

**2. A long-lived process tailing the health log.** If you already run a log-tailing agent (Fluent Bit, Vector, Filebeat), point it at `~/.siftcoder/<ns>/health.ndjson` and ship the lines wherever your other logs go. Then alert on `ok=false` for more than two consecutive observations.

**3. A pre-tool-use hook that fails noisy when the daemon is unreachable.** This is more aggressive — it makes Claude itself notice the outage. Put a script in `.claude/hooks/pre-tool-use/check-daemon.mjs` that pings the socket and warns (or blocks) if the ping fails. Tradeoff: every tool call now pays the ping latency. Only worth it if you've been bitten by silent capture loss before.

## Don't over-monitor

If you set up alerts on every count, you'll get noise. The two signals worth alerting on are:

1. **`ok=false` for three consecutive 30-second pings** — daemon is genuinely unreachable, hooks are losing capture.
2. **`counts.raw > some_threshold` for ten minutes** — drain backlog isn't clearing, retrieval will be incomplete.

Everything else is for forensics, not paging. The web UI is the place to investigate; the health log is the place to confirm an investigation. Don't let monitoring become its own day job.
