# Hooks

Hooks are how SiftCoder gets its hands on what's happening. Claude Code runs them at specific lifecycle points — before a tool call, after a tool call, when a session starts, when it stops, when a notification fires, when the transcript is about to be compacted. Each hook is a small Node script that reads JSON from stdin, does something quick, and exits.

The actual list of registered hooks lives in `hooks/hooks.json`. There are six lifecycle points wired up.

## What's actually registered

| Lifecycle | Matcher | Script | Timeout |
|---|---|---|---|
| `SessionStart` | (any) | `session-start/ensure-built.mjs` | 300s |
| `SessionStart` | (any) | `session-start/spawn-daemon.mjs` | 3s |
| `SessionStart` | (any) | `session-start/install-error-banner.mjs` | 1s |
| `PreToolUse` | `Read\|Write\|Edit` | `pre-tool-use/boundary-enforcer.mjs` | 5s |
| `PostToolUse` | `Read\|Write\|Edit\|Bash\|Grep\|Glob` | `post-tool-use/capture-observation.mjs` | 2s |
| `PostToolUse` | `Write\|Edit` | `post-tool-use/detect-console-logs.mjs` | 2s |
| `PreCompact` | (any) | `pre-compact/inject-memories.mjs` | 3s |
| `Notification` | (any) | `notification/pin-incident.mjs` | 2s |
| `Stop` | (any) | `stop/should-continue.mjs` | 5s |

There is no `UserPromptSubmit`, `SubagentStop`, or `SessionEnd` hook in the box today. The architecture chapter previously mentioned them; in practice the actual lifecycle is the eight scripts above plus `auto-checkpoint.mjs` (an opt-in `PostToolUse` extension that's not in `hooks.json` by default — it's wired in only if you enable it via config).

## SessionStart — three scripts in order

Three hooks fire when a Claude Code session starts. They run in order; each is independent.

### `ensure-built.mjs`

The most important and the slowest. Plugin marketplace installs a git clone of the repo without running `npm install` or `npm run build`, so `dist/` is missing on first install and the daemon entrypoint won't exist. This hook fixes that.

It also runs the legacy `v3 → default` namespace migration on first session of v1.0.6+ (see [Namespaces](namespaces.md)).

The work it does:

1. Migrate `~/.siftcoder/v3` to `~/.siftcoder/default` if needed (atomic rename).
2. Check `dist/memory/mcp/server.js` exists and is newer than every `.ts` in `src/`. If yes, bail fast.
3. If `node_modules/better-sqlite3` is missing, run `npm install --silent`.
4. Run `npx tsc` to compile.
5. Probe the `better-sqlite3` native binding. If it loads but fails to actually open a database (which happens when Node's ABI is ahead of the prebuilt binaries — Node 25 in 2026 is the example in the comment), run `npm rebuild better-sqlite3`.
6. On any failure, write a flag file at `~/.siftcoder/<ns>/install-error.flag` so the next hook can surface it.

300s timeout because first-time `npm install` plus build can genuinely take that long on slow networks. Subsequent runs hit the fast path and finish in <50ms.

### `spawn-daemon.mjs`

Boots the per-workspace daemon if it isn't running. Idempotent: if `run.pid` exists, the PID is alive, and the socket file exists, it exits immediately. Otherwise it spawns the daemon detached, writes the pid file, and waits up to 2s for the socket to appear.

Has its own self-heal for the `better-sqlite3` native binding — if `ensure-built.mjs` somehow didn't fix it (different code path, race condition, plugin uninstall+install), this hook tries `npm rebuild` and a full reinstall. Two layers of defence because the failure mode is recurring.

If a workspace hasn't been onboarded (no `~/.siftcoder/<ns>/workspaces/<key>/onboarded` sentinel), prints a SessionStart context line nudging the user toward `/siftcoder:mem-setup`. Stays silent once the sentinel is written. Counts past Claude Code transcripts in `~/.claude/projects/<encoded-cwd>/` to mention how many sessions are available to backfill.

### `install-error-banner.mjs`

If `ensure-built.mjs` left an `install-error.flag`, prints a boxed error banner to stdout (which Claude Code surfaces to the user) with the exact command to run to fix it. Rotates the flag to `.flag.seen` afterward so subsequent sessions don't nag. Always exits 0; never blocks.

## PreToolUse — boundary enforcer

`hooks/pre-tool-use/boundary-enforcer.mjs` runs before every `Read`, `Write`, or `Edit` tool call. The `hooks.json` matcher is `Read|Write|Edit` but inside the script, `Read` is allowed unconditionally — only `Write`, `Edit`, and `NotebookEdit` are subject to scope checking.

Scope file format: a JSON file at `.siftcoder/scope.json` (project-local, preferred) or `~/.siftcoder/<ns>/scope.json` (global fallback). Strict JSON; no comments, no trailing commas. If parsing fails, the file is silently skipped — which is a real footgun, because a comma in the wrong place means the enforcer thinks there's no scope at all and lets everything through.

```json
{
  "allow": ["src/**", "test/**", "*.md"],
  "deny": ["src/secrets/**"]
}
```

The matcher (`matchAny`) supports three glob shapes, and only three:

- Exact match: `src/foo.ts === src/foo.ts`
- Trailing-`**`: `src/**` matches anything starting with `src/`
- Leading `*.`: `*.md` matches anything ending in `.md`

Anything more clever — `**/*.test.ts`, `src/{a,b}/**`, glob negation — is not supported. If you write it, it'll silently never match, and the enforcer will fail closed for paths you wrote and meant to allow. This is the single most common scope-config bug.

Decision flow:

1. If no scope file: exit 0 (allow). No scope means no enforcement — the tool isn't restrictive by default.
2. If `scope.allow` is empty or missing: exit 0 (allow).
3. If file matches `scope.allow`: exit 0 (allow).
4. If file matches `scope.deny`: write to stderr, exit 2 (block).
5. Otherwise: write "write outside scope.allow" to stderr, exit 2 (block).

Exit 2 is the Claude Code convention for "block this tool call." Exit 0 lets it through.

The enforcer also fails open on internal errors: if the script itself throws (malformed JSON, fs error, anything unexpected), it logs to stderr and exits 0. This is the deliberate fail-open posture — *the enforcer's bugs should not block your work*. The cost is that an enforcer crash means your scope wasn't enforced for that one call. The alternative — fail closed — would mean any bug in the enforcer blocks Claude entirely until you ssh in and fix it. The team picked safety-of-availability over safety-of-isolation.

You'd want fail-closed behaviour if you were treating SiftCoder as a sandbox. It is not a sandbox. It is a capture-and-recall tool with a courtesy boundary check. If you need real isolation, run Claude Code in a container.

## PostToolUse — capture and console.log detection

### `capture-observation.mjs`

The capture hook. Runs after every `Read`, `Write`, `Edit`, `Bash`, `Grep`, `Glob`. The matcher in `hooks.json` is the same set; the script also re-checks against its own `RELEVANT` set — belt and braces.

What it does:

1. Compute the workspace key (same SHA-256-of-realpath-of-git-toplevel recipe everyone else uses).
2. Find the socket at `~/.siftcoder/<ns>/run/<key>.sock`.
3. If the socket doesn't exist, exit 0. The daemon isn't running; capture nothing; don't spawn anything.
4. Read the envelope from stdin (Claude Code passes `tool_name`, `session_id`, `tool_input`, `tool_response`).
5. Construct a frame: `{kind:"capture", sessionId, tool, payload:{tool_input, tool_response}, ts}`.
6. Connect to the socket, write the frame, wait up to 250ms for any response, exit.

The `HOOK_BUDGET_MS = 250` ceiling matters: hooks block tool execution. Adding 250ms to every Read/Write/Edit would feel sluggish, so the hook returns the moment it's seen *any* response (not necessarily the right response — fire-and-forget). The daemon does the actual work; the hook just hands off.

You can see what's being captured in real time by watching the daemon log:

```bash
tail -f ~/.siftcoder/default/logs/<wsKey>.ndjson
```

Each capture produces a log line. The redacted payload is in there. If you want to see exactly what's about to land in the database before it does, that's the place.

### `detect-console-logs.mjs`

Unrelated to memory. After a Write or Edit on a `.ts/.tsx/.js/.jsx/.mjs/.cjs` file, scans the file for `console.log/debug/info/warn/error/trace` and prints a warning with line numbers. Skips test files, files with `// eslint-disable`, files with `// keep-console`. Useful as a nag; doesn't write anything to the memory store. If you find it noisy, remove the second `PostToolUse` block from `hooks.json`.

## PreCompact — memory injection

`hooks/pre-compact/inject-memories.mjs` runs right before Claude Code compacts the transcript (when context is filling up and the harness is about to summarise older turns).

The work:

1. Read the transcript path from the hook envelope (`env.transcript_path`).
2. Read the last 16 KiB of the transcript file. This is "what's currently top-of-mind."
3. Extract the top 12 keywords (alphabetic tokens of length ≥ 4, with stopwords removed).
4. Build a query from those keywords.
5. Fire a `search` request at the daemon, `k=8`.
6. Format the top 8 hits into a `<siftcoder-memory>` block.
7. Write a JSON envelope to stdout with `hookSpecificOutput.additionalContext` set to that block.

Claude Code injects `additionalContext` into the prompt that does the compaction. The compacted summary then includes the load-bearing facts from your memory — so the post-compact transcript still knows about the auth-token fix even if the actual conversation about it has been compressed away.

Budget is 1500ms. It's the longest of the post-tool hooks because it includes a synchronous network call to the daemon and a search. If the daemon isn't there or the search returns no hits, the hook exits silently with no context — compact proceeds normally.

This is the *only* automatic retrieval path in the box today. Every other surfacing of memory is via Claude calling `mem_search` explicitly. PreCompact is the exception because there's no LLM in the loop at compact time — the harness is doing it — so we have to inject context directly.

## Notification — incident pin

`hooks/notification/pin-incident.mjs` runs whenever Claude Code emits a notification (permission prompt, idle warning, error banner). It captures the notification as a special memory frame:

```js
{
  kind: 'capture',
  sessionId,
  tool: 'Notification',
  payload: { message, kind: env.kind ?? null, urgency: 'high' },
  ts: Date.now(),
}
```

The `urgency: 'high'` is a hint for retrieval downstream — `/siftcoder:handoff` and similar workflows can pull recent high-urgency events to reconstruct what was happening when a session got interrupted. Captures via the same socket/protocol as regular tool calls; it's just a different `tool` value.

Useful when a session ends in a permission-denied or a long-running command failure and you want to pick that thread back up later — the notification is in memory and `mem_search "permission denied"` will surface it.

## Stop — drain reminder

`hooks/stop/should-continue.mjs`. Sends a `status` request to the daemon, reads the `raw` count, prints a one-liner if anything is pending:

```
[siftcoder] N memory events pending drain. Run /siftcoder:mem drain.
```

Doesn't drain anything itself — that's a deliberate choice, because draining can take many seconds (Ollama call per batch) and you don't want to extend the visible turn-end latency. It just nudges. You can ignore the nudge and the events will drain on the next session's consolidator tick anyway.

## The asymmetry: capture is hooks, retrieval is MCP

This is the central design decision and worth restating because every other lifecycle question reduces to it.

Capture goes through hooks because **capture must happen whether or not the LLM thinks about it**. If memory required Claude to remember to call `capture_this`, half your sessions would have empty captures and you'd never know which half. Hooking `PostToolUse` removes the LLM from the decision — the harness fires the hook, the hook talks to the daemon, every relevant tool call is captured.

Retrieval goes through MCP because **retrieval depends on what the user is asking**, and only the LLM has that context. A hook-driven retrieval would have to guess the query (which is what `inject-memories.mjs` does at compact time, and even there it just pulls the top keywords from the transcript tail — a lossy heuristic). Letting Claude call `mem_search` with a real query — *"didn't we fix something around malformed auth tokens"* — produces dramatically better results than any guessing the hooks could do.

The practical consequence: capture is automatic and invisible; retrieval is explicit and intentional. Skills like `/siftcoder:investigate` and `/siftcoder:debug` lean on this — they tell Claude "before you start, search memory for X" and the LLM does it. The hooks don't have to know what the user wants.

## Redaction rules

`src/memory/privacy.ts` runs against every payload before WAL append and before SQLite insert. Two layers.

**Layer one — `<private>` tag stripping.** Anything wrapped in `<private>...</private>` (case-sensitive, multiline) is replaced with `[REDACTED:private]`. This is a manual escape hatch: if you're about to do something sensitive and you don't want it captured, you can wrap it. Useful in chat with Claude when you need to paste credentials or PII for a specific debug; the redactor will scrub it on the way to disk.

**Layer two — pattern-based secret scrubbing.** Eight regex rules, applied in order:

```ts
{ name: 'aws-access-key',  pattern: /\bAKIA[0-9A-Z]{16}\b/g,                              mask: '[REDACTED:aws]' },
{ name: 'github-token',    pattern: /\bghp_[A-Za-z0-9]{36}\b/g,                           mask: '[REDACTED:github]' },
{ name: 'anthropic-key',   pattern: /\bsk-ant-[A-Za-z0-9_-]{20,}\b/g,                     mask: '[REDACTED:anthropic]' },
{ name: 'openai-key',      pattern: /\bsk-[A-Za-z0-9]{32,}\b/g,                           mask: '[REDACTED:openai]' },
{ name: 'bearer-token',    pattern: /\b[Bb]earer\s+[A-Za-z0-9._~+/=-]{20,}/g,             mask: 'Bearer [REDACTED]' },
{ name: 'jwt',             pattern: /\beyJ[A-Za-z0-9_-]+\.eyJ[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\b/g, mask: '[REDACTED:jwt]' },
{ name: 'email',           pattern: /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}\b/g, mask: '[REDACTED:email]' },
{ name: 'phone',           pattern: /\b\+?\d{1,3}[\s.-]?\(?\d{2,4}\)?[\s.-]?\d{3,4}[\s.-]?\d{3,4}\b/g, mask: '[REDACTED:phone]' },
```

The redactor walks the payload recursively (objects, arrays, strings) and replaces matches in any string value. A hit count is returned alongside the redacted value, but the daemon currently doesn't surface it anywhere user-visible — it's logged into the per-event payload via `_source` etc. but not aggregated.

Things this catches: AWS access key prefixes, GitHub fine-grained tokens, OpenAI/Anthropic API keys in their published shapes, Bearer headers, JWT triplets, plain emails, plain phone numbers.

Things this misses: passwords (no shape to match), secrets in unusual formats, tokens embedded in larger strings without word boundaries, anything custom your org uses. The redactor is a backstop, not a privacy guarantee — if you're working with truly sensitive data, the right approach is to keep it out of the prompt in the first place, or to use the `<private>` tag to scrub specific blocks.

## Auto-checkpoint (opt-in)

`hooks/post-tool-use/auto-checkpoint.mjs` exists in the source but is *not* registered in `hooks.json`. Enabling it requires a config change:

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

When active, every Write/Edit increments a counter; every 25 edits or 30 minutes (whichever comes first) creates a JSON checkpoint at `.siftcoder/checkpoints/cp-auto-<ts>.json` with the current git SHA. It's lightweight — no actual file content stored, just a marker pointing at a git commit you can roll back to. Used by `/siftcoder:checkpoint`-style workflows. Off by default because most users don't need it and the noise of one extra log line per 25 edits is real.
