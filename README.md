# SiftCoder

> Persistent project memory + local-LLM offload + Salesforce domain skills for Claude Code.

[![CI](https://github.com/ialameh/siftcoder/actions/workflows/ci.yml/badge.svg)](https://github.com/ialameh/siftcoder/actions/workflows/ci.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)
[![Node](https://img.shields.io/badge/node-%3E%3D20-brightgreen.svg)](https://nodejs.org/)

SiftCoder is a Claude Code plugin that adds four things Claude Code does not have natively:

1. **Persistent, queryable memory** across sessions — with provenance (`mem_why`), decay, and RRF retrieval.
2. **Local-LLM offload** (Ollama) for summarisation and embeddings — cuts steady-state token cost ~50×.
3. **Salesforce domain expertise** as skills + agents — Apex, LWC, Schema, Deploy, Architecture.
4. **Workflow contracts** for the useful V1 jobs-to-be-done: build, fix, investigate, review, test, autonomous, docs, quality, ideation, project discovery, and compression.

V2 is a clean replacement for V1, not a compatibility layer. It keeps V1 value where it is real and drops V1 names or mechanisms when they do not add value. See [docs/REPLACEMENT-CONTRACT.md](docs/REPLACEMENT-CONTRACT.md).

---

## Why this exists

Claude Code already has Plan/Explore/general-purpose subagents, native skills, native MCP, hooks, plan mode, `/review`, `/security-review`, prompt caching, and tool-use orchestration. What it lacks:

- **Memory.** Every session starts cold. SiftCoder gives Claude a per-workspace memory daemon that captures, summarises, and lets you query past work.
- **Local LLM.** API calls are not free. SiftCoder routes summarisation and embeddings through local Ollama by default, falling back to Anthropic only when local is unavailable or quality is insufficient.
- **Domain depth.** Generic AI is generic. SiftCoder ships skills/agents tuned for Salesforce — the largest enterprise platform without a domain-specific Claude flavour.
- **Workflow leverage.** Claude Code has strong native primitives; SiftCoder adds stricter contracts, evidence ledgers, memory grounding, and domain-specific rules around those primitives.

## Install

Requires Node ≥ 20.

```bash
git clone https://github.com/ialameh/siftcoder.git
cd siftcoder
npm install
npm run build
```

In Claude Code, register the plugin:

```bash
# from any project
/plugin install /path/to/siftcoder
```

Recommended: install [Ollama](https://ollama.com/) for local-LLM benefits.

```bash
brew install ollama && brew services start ollama
ollama pull nomic-embed-text llama3.2:3b
node bin/siftcoder.mjs setup
```

## Quick start

```bash
# spawn the memory daemon for your workspace
node bin/siftcoder.mjs start

# verify
node bin/siftcoder.mjs status
```

Inside Claude Code:

```
/siftcoder:mem status
/siftcoder:mem drain
/siftcoder:ideate
/siftcoder:sf-deploy validate
/siftcoder:reverse-prompt deep
```

## What ships

### Skills (96) organised by family

Each skill is a workflow contract — explicit ordering, evidence gates, output shape, anti-patterns. Auto-loaded by trigger description; also invokable via slash command.

| Family | Skills |
|---|---|
| **coding** (14) | build, fix, add-feature, investigate, heal, tdd, pair, refactor, optimize, zen, debug, build-fix, perf, test |
| **reasoning** (7) | archaeologist, oracle, ghost, duck, dream, fortune, narrator |
| **quality** (9) | chaos, fuzz-mind, invariant, empathy, ripple, timewarp, blast-radius, polyglot, comply |
| **review** (2) | review, security |
| **knowledge** (5) | memory-usage, pattern-learn, pattern-search, knowledge, search |
| **docs** (8) | document, update-docs, update-codemaps, codemap, codemap-fast, codemap-diff, codemap-trust, codemap-export |
| **workflow** (14) | autonomous, swarm, pause, continue, handoff, checkpoint, session-eval, smart-retry, preview, scope, chroot, agent, focus, organize-project |
| **spec** (5) | improve-spec, spec-from-stories, gap-analysis, reverse-spec, feasibility |
| **salesforce** (12) | salesforce-apex, salesforce-lwc, salesforce-deploy, salesforce-architecture, salesforce-test, salesforce-agentforce, salesforce-einstein, salesforce-cpq, salesforce-comply, salesforce-flow, salesforce-security, schema-migrate |
| **integrations** (4) | api, integrate, migrate, bridge |
| **ux** (3) | ideate, surprise-me, reverse-prompt |
| **meta** (13) | siftcoder, onboard, prompt, team, sync, monitor, trace, analyze, compression, local-llm-setup, quality-check, budget, wizard |

Each `skills/<family>/<name>/SKILL.md` body documents: method, output shape, hard rules, anti-patterns, when-NOT-to-use, and value-add over native Claude Code.

### Agents (15)

Domain-specific (4) plus disciplined generics (11) — both add value over native subagent dispatch via memory grounding, evidence ledgers, structured output contracts, scope refusal, and conflict-resolution discipline.

| Agent | Use |
|---|---|
| `salesforce-architect` | org-level architecture review (read-only) |
| `apex-bulkifier` | targeted bulk-safety refactor |
| `lwc-debugger` | LWC issue diagnosis |
| `memory-curator` | dedup/merge/prune memory store |
| `planner` | spec-first plans w/ evidence ledger + risk register + rollback path |
| `coder` | implement approved plan; refuse scope creep |
| `qa-reviewer` | validate AC; structured pass/fail report |
| `qa-fixer` | fix only what qa-reviewer flagged |
| `reviewer` | memory + convention-aware code review |
| `documenter` | doc-type-shaped output w/ citations |
| `tester` | behaviour-coverage tests, mutation-test sanity |
| `investigator` | hypothesis-driven read-only diagnosis |
| `orchestrator` | multi-agent coordination, file-locking, dependency batching |
| `analyst` | non-code text/data analysis (specs, tickets, transcripts) |
| `bridge-analyzer` | cross-codebase integration design |

### Commands (107)

Each skill has a thin slash-command wrapper for direct invocation. Multi-action consolidation where it reduces sprawl (e.g. `/siftcoder:mem [action]` covers 7 V1 mem-* commands).

### MCP tools

The `siftcoder-memory` MCP server exposes:

- `mem_search(query, k)` — hybrid BM25 + vector + decay
- `mem_get(id)`
- `mem_timeline(id, before, after)`
- `mem_why(id)` — provenance BFS
- `mem_drain(batch)` — force-drain pending events

### Hooks (7 active + 1 opt-in, down from V1's 13)

Memory-feeding + minimal safety only. **No more 210s blocking format/lint/type-check chain on every edit.**

| Event | Hook | Purpose |
|---|---|---|
| `PreToolUse` | `boundary-enforcer.mjs` | block writes outside scope |
| `PostToolUse` | `capture-observation.mjs` | feed memory daemon |
| `PostToolUse` | `detect-console-logs.mjs` | warn on console.log |
| `PostToolUse` | `auto-checkpoint.mjs` | **opt-in:** lightweight git-anchored checkpoints at edit/time thresholds |
| `PreCompact` | `inject-memories.mjs` | keep relevant memory across compaction |
| `Notification` | `pin-incident.mjs` | high-priority capture |
| `SessionStart` | `spawn-daemon.mjs` | slim, idempotent |
| `Stop` | `should-continue.mjs` | suggest next action |

The auto-checkpoint hook is disabled by default. Enable via `settings.json` → `siftcoder.hooks.autoCheckpoint.enabled = true`.

## Configuration

`settings.json` ships safe defaults. Override per-user via env or per-project via `.siftcoder/config.json`:

```bash
SIFTCODER_DRAIN_BACKEND=ollama          # ollama | anthropic | sampling | auto
SIFTCODER_EMBEDDER=ollama               # ollama | cdg | deterministic | auto
SIFTCODER_NS=v3                         # namespace under ~/.siftcoder/
ANTHROPIC_API_KEY=sk-...                # for fallback / escalation
OLLAMA_HOST=http://localhost:11434
```

Full config reference: [docs/CONFIG.md](docs/CONFIG.md).

## Examples

```
# Q: did we already discuss caching strategy?
> use mem_search to check
mem_search { query: "caching strategy" }
[3 hits — top: "decided to skip in-memory cache; redis already in stack" (2026-04-12)]

# Q: why does auth.ts look this way?
> use mem_why
mem_why { id: "summary:142" }
[chain: summary:142 ← derives_from ← summary:128 ← causes ← event:legal-flag-2026-03 ...]

# Q: what's broken in this org?
/siftcoder:sf-architect
[dispatches salesforce-architect agent — read-only review with capacity table + risk register]

# Q: I want to build something this weekend
/siftcoder:surprise-me --tiny
[5 scored ideas across creativity axes + 72-hour path + one explicit recommendation]
```

## Troubleshooting

See [docs/TROUBLESHOOTING.md](docs/TROUBLESHOOTING.md). Common:

- **Daemon not reachable** → `node bin/siftcoder.mjs start`
- **Native binding failed** → falls back to WASM SQLite automatically; check postinstall log
- **Ollama not detected** → `curl http://localhost:11434/api/tags` should return models
- **Memory not capturing** → check `~/.siftcoder/v3/logs/spawn.ndjson`

## Architecture

See [ARCHITECTURE.md](ARCHITECTURE.md) for the full system design.

```
Claude Code session ─┬─ Skills (markdown)
                     ├─ Slash commands (markdown)
                     ├─ MCP tools ──────► siftcoder-memory daemon (stdio)
                     └─ Hooks ──UDS────► siftcoder-memory daemon
                                               │
                                               ├─ SQLite (native + WASM parity)
                                               ├─ RRF retrieval + decay
                                               ├─ Provenance graph
                                               ├─ Summariser (Ollama → Anthropic)
                                               └─ Embedder (Ollama → deterministic)
```

## Migrating from V1 / V2

If you used the legacy `siftcoder` plugin (versions ≤ 2.x), note:

- State lives at `~/.siftcoder/v3/` instead of `~/.siftcoder/` — no collision
- 100+ legacy commands removed; see [docs/MIGRATION.md](docs/MIGRATION.md) for what's gone and what's replaced
- Hook chain trimmed; quality gates moved to on-demand `/siftcoder:quality`
- `vendor/sift-compress/` extracted to a separate plugin

Migration tool to import legacy memory:

```bash
node bin/siftcoder.mjs backfill --from-v2 ~/.siftcoder
```

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md).

## License

MIT — see [LICENSE](LICENSE).
