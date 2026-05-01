# Quality Gate — SiftCoder quality gate review

Self-review against modern Claude Code best practices.

## P0 — public-release blockers

| Item | Status | Evidence |
|---|---|---|
| Trim hook layer (kill 210s chain, slim SessionStart) | ✅ | `hooks/hooks.json` — 7 hooks, no quality-gates chain, single SessionStart hook |
| Remove `claude-plugins-official/`, `everything-claude-code/`, vendor sift-compress, `templates/` | ✅ | none present |
| Modular README + ARCHITECTURE + CONTRIBUTING + CHANGELOG | ✅ | all present, README ~250 lines |
| Migrate memory subsystem cleanly, change socket path namespace | ✅ | `~/.siftcoder/` — verified across hooks, CLI, paths.ts |
| Single `.mcp.json` | ✅ | `.mcp.json` present, references dist build |
| Plugin `settings.json` defaults | ✅ | present at root |
| `monitors/` for daemon health | ✅ | `monitors/memory-daemon-health.mjs` |
| All hooks under `hooks/*.mjs`, no dist/ refs | ✅ | grep verified |
| CI (GitHub Actions) | ✅ | `.github/workflows/ci.yml` — matrix os×node |
| ESLint + Prettier configs | ✅ | `.eslintrc.json`, `.prettierrc.json` |
| Drop jest types, vitest only | ✅ | package.json — only vitest |

## P1 — strong improvements

| Item | Status | Evidence |
|---|---|---|
| Consolidate memory cmds → `/siftcoder:mem [action]` | ✅ | `commands/mem.md` |
| Hand-write `docs/` tree (USAGE/CONFIG/MEMORY/SALESFORCE/TROUBLESHOOTING/MIGRATION) | ✅ | 6 files |
| Plugin `bin/` entry for CLI | ✅ | `bin/siftcoder.mjs` |
| Local-first defaults: Ollama embedder + Ollama summariser when available | ✅ | `settings.json` cascades, setup probes Ollama |
| Improved `ideate` + `surprise-me` | ✅ | both as skills + thin command wrappers |
| Preserve core value without requiring prior command compatibility | ✅ | README lists 84 skills / 87 commands; commands are thin wrappers over skills |
| Keep generic agents only when they add stricter contracts than native dispatch | ✅ | 12 agents; generic agents declare memory/evidence/scope/deviation value |
| `central` config loader | ✅ | `src/core/config.ts` with deep-merge layering |
| Typed errors | ✅ | `src/core/errors.ts` |
| Structured logger | ✅ | `src/core/logger.ts` |

## P2 — post-launch deferred

| Item | Status | Notes |
|---|---|---|
| Telemetry-driven prune of vibes commands | n/a | already pruned, no telemetry needed |
| LSP integration | not built | confirmed no use case |
| Web UI hardening | partial | UI is read-only; auth model deferred |

## Concerns

1. **Memory subsystem still has two path layers.** `src/memory/workspace.ts` is the daemon source of truth; `src/core/paths.ts` exists for plugin-wide services. Keep them aligned or consolidate.
2. **Socket-based tests can fail in restricted sandboxes.** CI should run them on normal OS runners; local sandbox failures need clear diagnosis.
3. **Build artefact `dist/` is required by `.mcp.json`, hooks, and `bin/siftcoder.mjs`.** First-time users must run `npm run build`; postinstall intentionally does not compile.
4. **Compression companion plugin is optional.** Inline compression skill works without it; companion only provides cross-session hook state.
5. **Salesforce CLI (`sf`) is a system prerequisite.** It is not an npm dependency.

## Follow-up recommendations

1. Run `npm run build`, `npm run lint`, and `npm test` on a normal OS runner.
2. Keep expanding procedural depth in skills, especially Salesforce and autonomous workflows.
3. Add issue templates, `SECURITY.md`, and public support policy before external release.
4. Run a real session end-to-end before tagging the next release: install plugin, capture events, drain, query `mem_search`, confirm hooks fire.

## Passes

- Plugin component model is intentional, not performative.
- Commands are thin wrappers; behavior lives in skills/agents.
- README under 250 lines, links to focused docs.
- `dist/` and `node_modules/` are local build/install artifacts, not part of the source contract.
- Hooks are mostly observers; boundary enforcement is best-effort and fails open.
- Local-first defaults align with user mandate.
- Memory engine is preserved (no working code lost).
- All choices documented in `ARCHITECTURE.md` §10.
