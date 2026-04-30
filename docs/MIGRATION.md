# Migrating from SiftCoder v2.x → v3

Major rewrite. Many V1 commands removed; behaviour reshaped around native Claude Code capabilities.

## Why we cut so much

V1 shipped 122 commands, 19 skills, 13 agents, 13 hooks. Modern Claude Code provides:

- Built-in subagent dispatch (`Task` tool, `Plan`, `Explore`, `general-purpose`)
- Native skills, hooks, MCP, monitors, plan mode
- `/review` and `/security-review` built in
- Native task tracking and prompt caching

V1 reimplemented much of this. V3 leans on native CC and only adds genuinely additive value.

## Removed commands and their replacements

| V1 | V3 replacement |
|---|---|
| `/siftcoder` (orchestrator) | use Claude Code's native subagent dispatch |
| `/autonomous`, `/autonomous-run`, `/swarm` | use Claude Code's native subagent dispatch |
| `/continue`, `/resume`, `/pause` | native plan mode + ScheduleWakeup |
| `/checkpoint`, `/handoff` | native task tracking + memory captures it automatically |
| `/build`, `/fix`, `/add-feature`, `/investigate`, `/heal` | use native CC; ask the assistant |
| `/tdd`, `/pair`, `/refactor`, `/optimize`, `/zen`, `/empathy` | use native CC |
| `/oracle`, `/dream`, `/ghost`, `/fortune`, `/duck`, `/archaeologist`, `/narrator` | removed (low-utility "vibes") |
| `/review`, `/security`, `/comply` | use built-in `/review` and `/security-review` |
| `/pattern-learn`, `/pattern-list`, `/pattern-search` | use `mem_search` MCP tool directly |
| `/learn`, `/search` | use `mem_search` |
| `/mem-start`, `/mem-stop`, `/mem-status`, `/mem-check`, `/mem-setup`, `/mem-drain`, `/mem-backfill`, `/mem-web` | `/siftcoder:mem [action]` |
| `/sf-security` | `/siftcoder:sf-architect` |
| `/sf-log` | `/siftcoder:sf-debug` |
| `/sf-test-data` | `/siftcoder:sf-test factory` |
| `/lwc-debug` | `/siftcoder:lwc debug` |
| `/agentforce`, `/einstein`, `/cpq`, `/api`, `/integrate`, `/migrate`, `/comply` | removed for now; reintroduce as needed |
| `/setup-mcp` | not needed; MCP is declared in `.mcp.json` |
| `/config` | edit `settings.json` directly |
| `/help` | use `/help` (built-in) |

## Removed agents

V1's planner, coder, qa-reviewer, qa-fixer, reviewer, documenter, tester, investigator, analyst, bridge-analyzer, semantic-searcher, orchestrator, suggest are all **gone**. Use Claude Code's native subagents:

- `Plan` for design / step-by-step plans
- `Explore` for read-only codebase mapping
- `general-purpose` for multi-step research and implementation
- Fork yourself (no `subagent_type`) for context-keeping background work

V3 keeps only **domain-specific** agents: `salesforce-architect`, `apex-bulkifier`, `lwc-debugger`, `memory-curator`.

## Removed hooks

V1's PostToolUse format/lint/type-check chain (210s sequential per Write/Edit) is **gone**. Replaced by on-demand `/siftcoder:quality`. Run it when you want — not after every edit.

V1's SessionStart had 4 chained hooks including a path that could trigger a 180s npm rebuild. V3's SessionStart is just `spawn-daemon.mjs` (idempotent, non-blocking).

## State migration

V1 stored state at `~/.siftcoder/`. V3 uses `~/.siftcoder/v3/`. Both can coexist.

To import V1/V2 memory into V3:

```bash
node bin/siftcoder.mjs backfill --from-v2 ~/.siftcoder
```

This walks the V1 SQLite DB(s), translates summaries + provenance edges, and writes them into the V3 store with origin tags (`migrated: true`, `migrated_from: v2`).

## Hook migration

If you customised V1's `hooks.json`, the events and matchers in V3 are similar but the hook script paths are different (V3 puts everything in `hooks/*.mjs`, no `dist/services/*.js`). Re-add custom hooks under V3's structure.

## Settings migration

V1 had no central settings file. V3 ships `settings.json` and reads project overrides from `.siftcoder/config.json`. If you had env vars set, they keep working — same names.

## Vendor sift-compress

V1 bundled `vendor/sift-compress/` and merged its hooks into the main config. V3 extracts it. The `compression` skill is built in (works without sift-compress); for cross-session persistence install the separate `sift-compress` companion plugin.

## Documentation

V1's 13-folder `documentation/` tree is gone. V3 ships 6 hand-curated docs:

- `README.md`
- `ARCHITECTURE.md`
- `CONTRIBUTING.md`
- `CHANGELOG.md`
- `docs/USAGE.md`
- `docs/CONFIG.md`
- `docs/MEMORY.md`
- `docs/SALESFORCE.md`
- `docs/TROUBLESHOOTING.md`
- `docs/MIGRATION.md` (this file)

## Breaking changes summary

- 100+ commands removed
- 9 of 13 agents removed
- 9 of 19 skills removed
- Hook chain trimmed 13 → 7
- State namespace changed to `v3`
- `dist/` no longer in git
- All hook scripts now `.mjs` (no compiled hooks)
- Coverage gates 100% → 90% (more realistic for I/O glue)

## What stayed

- Memory engine — same architecture, refactored module boundaries
- Dual SQLite backend with parity testing
- RRF retrieval + Ebbinghaus decay
- Provenance graph + `mem_why`
- Salesforce skills (refined)
- Vitest + ESLint + TS strict
- Postinstall native binding self-heal
