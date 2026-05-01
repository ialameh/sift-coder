# Hooks

7 hooks active by default + 1 opt-in. All under `hooks/<event>/<name>.mjs`. Wired through `.claude-plugin/plugin.json` `hooks` block.

## Active

| Event | Hook | Purpose | Timeout |
|---|---|---|---|
| `PreToolUse` (Read|Write|Edit) | `boundary-enforcer.mjs` | Block writes outside scope; transparent failure mode | 5 s |
| `PostToolUse` (Read|Write|Edit|Bash|Grep|Glob) | `capture-observation.mjs` | Send tool result to memory daemon over UDS | 2 s |
| `PostToolUse` (Write|Edit) | `detect-console-logs.mjs` | Warn on stray `console.log` | 2 s |
| `PreCompact` | `inject-memories.mjs` | Inject top-k memories into compact context | 3 s |
| `Notification` | `pin-incident.mjs` | High-priority capture for permission prompts and errors | 2 s |
| `SessionStart` | `spawn-daemon.mjs` | Idempotent daemon spawn with native-binding self-heal | 3 s |
| `Stop` | `should-continue.mjs` | Optional continuation suggestion at end of turn | 5 s |

## Opt-in

| Event | Hook | Purpose | Activation |
|---|---|---|---|
| `PostToolUse` | `auto-checkpoint.mjs` | Lightweight git-anchored checkpoints at edit/time thresholds | `settings.json` → `siftcoder.hooks.autoCheckpoint.enabled = true` |

## Failure modes

All hooks fail silently to stderr and never block the user. The boundary-enforcer is the one exception — it blocks writes outside the configured scope (by design), but a missing or unreadable scope file falls through as "no scope, allow all".

## What hooks do NOT do

- Run formatters, linters, or type-checks on every Write/Edit. That belongs in on-demand `/siftcoder:quality`.
- Modify the file being written. Hooks are observers.
- Make LLM calls. Hooks emit events that the daemon later processes asynchronously.

## See also

- [memory.md](MEMORY.md) — how `capture-observation.mjs` and `inject-memories.mjs` feed retrieval
- [configuration.md](CONFIG.md) — how to enable `auto-checkpoint`
