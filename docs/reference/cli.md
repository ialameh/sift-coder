# CLI reference

The `siftcoder` binary is a single Node script at `bin/siftcoder.mjs`. It dispatches on `argv[2]` and either talks to the per-workspace daemon over its Unix socket or operates directly on the SQLite file.

All subcommands honour `SIFTCODER_NS` (default `default`) for namespace isolation. The workspace key is always derived from the realpath of `git rev-parse --show-toplevel` (or the cwd if that fails).

## Subcommand index

| Command | Talks to | Typical exit |
|---|---|---|
| `version` | nothing | `0` |
| `info [--json]` | daemon (optional) + DB | `0` |
| `setup` | `scripts/setup.mjs` | `0` on success |
| `start` | spawns daemon | `0` once spawned |
| `stop` | sends `SIGTERM` to PID file | `0` if PID was reachable, `1` otherwise |
| `status` | daemon `ping` + DB read | `0` |
| `drain [batch]` | direct DB + LLM client | `0` if any drained, throws if no backend |
| `backfill [source]` | daemon `backfill` RPC | `0`, daemon-bounded 5-min timeout |
| `web` | reads `http.port` file | `0` if file present, `1` if not |
| (other) | help text | `0` |

---

## `siftcoder version`

**Signature**: `siftcoder version`

**What it's for**: One-line sanity check that the binary is callable and which version is on the path. Doesn't touch the daemon.

```
$ siftcoder version
siftcoder v1.0.8
```

Reads `package.json` from the install root. If parsing fails, prints `siftcoder vunknown`.

**Env vars**: none.

**When to use it**: in a script that needs to gate on a minimum version, or as the first thing you run after `/plugin install` to confirm the binary was wired up.

---

## `siftcoder info [--json]`

**Signature**: `siftcoder info [--json]`

**What it's for**: One screen of everything — version, runtime, paths, daemon state, backend availability, store counts, web URL. The single most useful command when something is misbehaving.

```
$ siftcoder info
siftcoder v1.0.8

runtime     node v20.19.0 darwin/arm64
install     /Users/you/.claude/plugins/cache/siftcoder-marketplace/siftcoder/1.0.8
namespace   default
workspace   3a1c9f2b8e0d  cwd=/Users/you/code/myproject
            git=/Users/you/code/myproject

daemon      running  pid=84219  uptime=4h 12m
socket      /Users/you/.siftcoder/default/run/3a1c9f2b8e0d.sock
db          /Users/you/.siftcoder/default/workspaces/3a1c9f2b8e0d/db.sqlite  (12.3 MiB)
web         http://127.0.0.1:51873

backends    ollama=up  anthropic=configured
counts      events=8412  raw=2  summarized=8378  skipped=32  summaries=8378  embeddings=8378
```

`--json` prints the same structure as machine-readable JSON for scripts.

**Env vars**: `SIFTCODER_NS`, `ANTHROPIC_API_KEY`, `OLLAMA_HOST`.

**When to use it**: first thing in any troubleshooting session. The `daemon` line tells you whether the socket is reachable; the `counts` row tells you whether capture and summarisation are flowing.

**Exit codes**: always `0`. Daemon-unreachable is reported as a field, not a process failure.

---

## `siftcoder setup`

**Signature**: `siftcoder setup`

**What it's for**: One-time interactive bootstrap. Probes Ollama, asks about Anthropic, writes `~/.siftcoder/<ns>/config.json`, optionally seeds `.siftcoder/scope.json`.

```
$ siftcoder setup
> Ollama running at http://localhost:11434? [yes]
> nomic-embed-text installed? [yes]
> ANTHROPIC_API_KEY in env? [no — using local-only]
Wrote /Users/you/.siftcoder/default/config.json
```

Implemented in `scripts/setup.mjs`. Re-running is safe — settings are merged, not overwritten blindly.

**Env vars**: reads `ANTHROPIC_API_KEY`, `OLLAMA_HOST` to pre-fill defaults.

**When to use it**: first install, or after wiping `~/.siftcoder/`.

---

## `siftcoder start`

**Signature**: `siftcoder start`

**What it's for**: Spawn the per-workspace daemon detached. Idempotent in practice — if a daemon is already up the new one will fail to bind the socket and exit, leaving the original alive. The `SessionStart` hook normally does this for you.

```
$ siftcoder start
daemon started pid=91234 sock=/Users/you/.siftcoder/default/run/3a1c9f2b8e0d.sock
```

Spawns:

```
node $PLUGIN_ROOT/dist/memory/daemon/index.js
```

with `detached: true`, `stdio: 'ignore'`, env `SIFTCODER_NS` and `SIFTCODER_WORKSPACE_CWD` set. Writes `run.pid` immediately.

**Env vars**: `SIFTCODER_NS`, `SIFTCODER_WORKSPACE_CWD`, `SIFTCODER_NO_HTTP` (skip web bridge), `OLLAMA_HOST`, `ANTHROPIC_API_KEY`, `SIFTCODER_DRAIN_BACKEND`.

**Exit codes**: `0` once spawn returns. Does NOT verify the daemon survived past startup.

---

## `siftcoder stop`

**Signature**: `siftcoder stop`

**What it's for**: Stop the daemon for this workspace. Reads the PID file and sends the default signal (`SIGTERM`).

```
$ siftcoder stop
stopped pid=91234
```

If the PID file is missing or the process is already gone:

```
$ siftcoder stop
stop failed: ENOENT: no such file or directory, open '...run.pid'
```

**Exit codes**: `0` on successful kill, `0` on stop-failed (the failure is printed but doesn't propagate). Wrap in `|| true` if you don't care.

---

## `siftcoder status`

**Signature**: `siftcoder status`

**What it's for**: Quick liveness + counts as JSON. Lighter than `info` — no version, no path discovery, no backend probe.

```
$ siftcoder status
{
  "daemon": "running",
  "namespace": "default",
  "workspace": "3a1c9f2b8e0d",
  "socket": "/Users/you/.siftcoder/default/run/3a1c9f2b8e0d.sock",
  "counts": {
    "events": 8412, "raw": 2, "summarized": 8378, "skipped": 32,
    "summaries": 8378, "embeddings": 8378
  }
}
```

`daemon` is `running` if `ping` came back ok, `error` if the daemon answered with `{ ok: false }`, `unreachable` if the socket connect failed.

**When to use it**: scripts that need to assert the daemon is up before doing work; CI smoke checks.

---

## `siftcoder drain [batch]`

**Signature**: `siftcoder drain [batch]` — default `batch=32`.

**What it's for**: Bypass the consolidator and force-summarise pending raw events right now. Useful when the daemon's tick is too slow, or when you want to verify your backend is actually working.

```
$ siftcoder drain 16
{
  "backend": "ollama",
  "processed": 14,
  "errors": 2,
  "pending": 0,
  "firstError": "ollama: model not found: llama3.2:3b"
}
```

`drain` operates **directly on the SQLite file** — it does not need the daemon to be running. It does need a backend:

1. Probe `OllamaClient.available()`. If true → use Ollama.
2. Else `AnthropicClient.available(env)` (`ANTHROPIC_API_KEY` set). If true → use Anthropic.
3. Else throw: `no drain backend available: start Ollama or set ANTHROPIC_API_KEY`.

The deterministic 384-dim embedder is used for the embedding leg regardless — it's pure-JS, always available.

**Env vars**: `OLLAMA_HOST`, `ANTHROPIC_API_KEY`, `SIFTCODER_OLLAMA_MODEL`.

**Exit codes**: `0` on completion (including partial errors). Throws and exits non-zero if no backend is available.

---

## `siftcoder backfill [source]`

**Signature**: `siftcoder backfill [source]` — `source` defaults to `transcripts`.

**What it's for**: Replay past Claude Code transcripts into memory. Useful right after first install — pulls historical context into the store so retrieval has something to find.

```
$ siftcoder backfill
{ "ok": true, "data": { "scanned": 142, "captured": 1284, "skipped": 22 } }
```

Sends a `backfill` RPC to the daemon with a 5-minute timeout. The daemon walks `~/.claude/projects/<encoded-cwd>/*.jsonl` and replays each frame through the capture pipeline.

`workspaceOnly` defaults to true — only this workspace's encoded cwd is scanned.

**When to use it**: once, after `siftcoder setup`. Re-running is safe but redundant — captures are deduped on `input_hash`.

---

## `siftcoder web`

**Signature**: `siftcoder web`

**What it's for**: Print the URL of the per-workspace web UI. Doesn't open a browser — just prints. Pipe to `open` or `xdg-open` yourself.

```
$ siftcoder web
http://127.0.0.1:51873

$ open "$(siftcoder web)"
```

Reads `~/.siftcoder/<ns>/workspaces/<key>/http.port`. If absent:

```
$ siftcoder web
web bridge not active yet; start the daemon and ensure SIFTCODER_NO_HTTP is not 1
```

**Exit codes**: `0` if file exists, `1` if not.

**Env vars**: `SIFTCODER_NO_HTTP` (set to `1` to disable the bridge entirely).

---

## Default help

Running with no subcommand or an unknown one prints usage:

```
$ siftcoder
siftcoder v1.0.8
Usage:
  siftcoder version             print version only
  siftcoder info [--json]       full runtime details (version, daemon, paths, backends, counts)
  siftcoder setup               one-time interactive setup
  siftcoder start               spawn daemon (detached)
  siftcoder stop                stop daemon
  siftcoder status              daemon health + counts
  siftcoder drain [batch]       force-drain pending events
  siftcoder backfill            backfill memory from past transcripts
  siftcoder web                 print web UI URL
```

Help is always exit `0`.

## Environment variable summary

| Variable | Effect |
|---|---|
| `SIFTCODER_NS` | Namespace under `~/.siftcoder/`. Defaults to `default`. |
| `SIFTCODER_WORKSPACE_CWD` | Override the cwd used to derive the workspace key (used by hooks). |
| `SIFTCODER_NO_HTTP` | If `1`, daemon skips the web bridge. |
| `SIFTCODER_DRAIN_BACKEND` | Force backend choice — `ollama`, `anthropic`, `mcp`, or `auto`. |
| `SIFTCODER_DRAIN_FALLBACK` | If `1`, wrap primary client in a sampling fallback for transient errors. |
| `SIFTCODER_OLLAMA_MODEL` | Override the Ollama summarise model (default `llama3.2:3b`). |
| `SIFTCODER_EMBEDDER` | Force embedder — `ollama`, `cdg`, `deterministic`, or `auto`. |
| `OLLAMA_HOST` | Ollama base URL (default `http://localhost:11434`). |
| `ANTHROPIC_API_KEY` | Enables the Anthropic backend for drain. |
| `CLAUDE_PROJECT_DIR` | Set by the harness; used by hooks to identify the workspace. |
