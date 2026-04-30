# SiftCoder V1 vs V2 Audit

## Executive Summary

V2 is directionally cleaner but not production-ready. It improves plugin packaging, skill organization, Salesforce specialization, and removes V1's expensive post-edit hook chain. But the rewrite also introduces hard breakages: the V2 CLI speaks an RPC protocol the daemon does not implement, migration code looks for database filenames that do not match V1/V2 storage, CI lint is guaranteed to fail with ESLint 9, and docs materially disagree with the actual plugin surface. The rewrite did not simply remove complexity; it moved a lot of workflow behavior into 84 skills and still ships 87 commands despite docs claiming roughly 12. Final verdict: **NO GO** until runtime, migration, CI, and docs are corrected.

## Feature Inventory

| Area | V1 SiftCoder | V2 SiftCoder-V2 |
|---|---:|---:|
| Skills | 19: `skills/*/SKILL.md` | 84: categorized under `skills/coding`, `docs`, `salesforce`, `workflow`, etc. |
| Commands | 122: `commands/*.md` | 87: `commands/*.md`; consolidated memory command plus new codemap commands |
| Agents | 13: generic + workflow agents | 12: keeps generic agents and adds Salesforce/memory agents |
| Hooks | 7 files plus `hooks.json`; config includes heavy dist services and vendor sift-compress | 6 hook scripts plus `hooks/hooks.json`; leaner but with path/protocol issues |
| Services | V1 source has memory only; service implementations exist in `dist/services` | Source adds `src/core`, `src/services`, `src/utils`; `src/files`, `src/llm`, `src/formatters` are empty |
| Memory/state | `~/.siftcoder/workspaces/<key>`, daemon, MCP, SQLite, WAL, retrieval | Namespaced `~/.siftcoder/v3`, migration module, settings, same memory engine lineage |
| CLI/bin | `package.json` points `siftcoder` to `dist/cli/index.js` | `bin/siftcoder.mjs` with setup/start/stop/status/drain/backfill/web |

## Scorecard

| Axis | V1 | V2 | Delta | Evidence | Verdict |
|---|---:|---:|---:|---|---|
| Plugin architecture | 3 | 3 | 0 | V1 `.claude-plugin/plugin.json` exposes skills/commands/MCP only; hooks live separately in `hooks.json`. V2 manifest adds `agents`, `hooks`, `.mcp.json`, but `ARCHITECTURE.md` claims ~12 commands/~4 agents while repo has 87/12. | V2 shape is better, execution inconsistent. |
| Feature surface | 4 | 4 | 0 | V1 has 122 commands and rich docs; e.g. `commands/apex.md` is detailed. V2 has 84 skills but many thin commands; `commands/mem.md` replaces seven mem commands. | Broader skills, fewer aliases; not clearly simpler. |
| Hook design and discipline | 2 | 3 | +1 | V1 `hooks.json` runs format/lint/type-check on every Write/Edit with 30/60/120s timeouts. V2 removes that chain, but `hooks/stop/should-continue.mjs` uses raw JSON while daemon expects framed protocol. | Better discipline, runtime bugs remain. |
| Memory/state handling | 4 | 3 | -1 | V1 `src/memory/workspace.ts` and daemon are coherent around SHA-256 key and `db.sqlite`. V2 namespaces state, but `src/core/paths.ts` uses SHA-1/cwd while memory hooks use SHA-256/git-root; migration expects `memory.db`, not V1 `db.sqlite`. | Regression in compatibility and path consistency. |
| Code quality | 3 | 3 | 0 | V2 adds typed `src/core/config.ts`, `src/services/state.ts`, atomic file utils. But `bin/siftcoder.mjs` sends `{op}` raw JSON to a daemon that only handles framed `{kind}` requests in `src/memory/daemon/server.ts`. | Good modules mixed with broken integration glue. |
| Test coverage/reliability | 3 | 2 | -1 | V1 has 38 test files, 100% thresholds in `vitest.config.ts`; sandbox UDS tests failed. V2 has 48 test files and migration tests, but `npm run lint` fails due missing ESLint flat config; V2 test runner hung after e2e socket failures. | V2 CI is currently not reliable. |
| Documentation quality | 4 | 2 | -2 | V1 has large `documentation/` tree. V2 docs are curated but inaccurate: `ARCHITECTURE.md` says ~12 commands/~4 agents and "no rebuild path"; actual repo has 87 commands/12 agents and `spawn-daemon.mjs` runs `npm rebuild`/`npm install`. | V2 docs cannot be trusted as contract. |
| Domain depth | 4 | 4 | 0 | V1 has deep command docs like `commands/apex.md`. V2 adds focused Salesforce skills and agents: `salesforce-apex/SKILL.md`, `salesforce-architect.md`, `apex-bulkifier.md`, `lwc-debugger.md`. | V2 improves structure, not clearly total depth. |
| Security/scope enforcement | 3 | 3 | 0 | V1 hook references `dist/services/boundary-enforcer.js`. V2 `boundary-enforcer.mjs` fails open on errors and uses limited matching (`exact`, `/**`, `*.ext`) rather than minimatch. | Useful but weak for serious scope control. |
| Performance/efficiency | 2 | 3 | +1 | V1 hook chain can add up to 210s per edit. V2 capture hooks are small, but `spawn-daemon.mjs` can run `npm rebuild` or `npm install better-sqlite3` during session start. | Net improvement, with startup risk. |
| Migration complexity | 4 | 1 | -3 | V2 removes 45 V1 command names from current surface and changes memory namespace to `~/.siftcoder/v3`. `docs/MIGRATION.md` admits 100+ commands removed. Importer scans `memory.db`, but V1 uses `db.sqlite`. | High breakage, migration tooling suspect. |
| Production readiness | 3 | 2 | -1 | V1 build passed; lint fails due ESLint 9 config. V2 build/typecheck passed, lint fails, CLI protocol is incompatible, migration DB paths are wrong. | V2 is not shippable yet. |

## Key Improvements in V2

- Real manifest improvement: `.claude-plugin/plugin.json` declares `agents`, `hooks`, and `.mcp.json`; V1 manifest only declares skills/commands/MCP.
- Hook load is reduced: V2 `hooks/hooks.json` removes V1's post-edit `quality-gates` and `auto-checkpoint` chain from `hooks.json`, lowering per-edit overhead.
- Skill organization is materially better: V2 splits 84 skills into domain folders, including Salesforce, quality, workflow, docs, knowledge, and coding.
- Salesforce specialization improves: V2 adds `agents/apex-bulkifier.md`, `agents/lwc-debugger.md`, `agents/salesforce-architect.md`, and Salesforce-specific skills.
- Namespaced state is a good idea: V2 `settings.json` and `.mcp.json` introduce `SIFTCODER_NS=v3`, allowing coexistence with V1 in principle.

## Regressions / Losses

- Removed command compatibility: V1 command names missing in V2 include `apex`, `debug`, `learn`, `search`, `mem-start`, `mem-status`, `lwc-debug`, `sf-log`, `sf-test-data`, `website`, `wizard`, and many more.
- CLI is broken against daemon protocol: `bin/siftcoder.mjs` sends raw JSON `{ op: 'status' }`; `src/memory/daemon/server.ts` expects length-prefixed frames with `kind: 'ping'|'capture'|'search'|...`.
- Migration importer targets wrong DB names: `src/memory/migration/v2-import.ts` scans `memory.db`; V1/V2 workspace code uses `db.sqlite`.
- CI lint is broken: both versions use ESLint 9, but V2 only has `.eslintrc.json`; `npm run lint` fails because ESLint 9 requires `eslint.config.js`.
- Documentation overstates simplification: V2 `ARCHITECTURE.md` says ~12 commands and ~4 agents, but the repo has 87 commands and 12 agents.
- V2 dropped V1's detailed long-form command docs in many places; compare V1 `commands/apex.md` with V2's much thinner `commands/apex-patterns.md`.

## Risk Areas

| Risk | Likelihood | Impact | Mitigation |
|---|---|---|---|
| CLI commands fail in real use | High | High | Rewrite `bin/siftcoder.mjs` to use `MemoryClient` framed protocol or add daemon handlers for CLI ops. |
| Memory migration silently imports nothing | High | High | Fix importer to read V1 `db.sqlite` and V2 namespace paths; add fixture test using real V1 workspace layout. |
| CI blocks every PR | High | Medium | Add ESLint flat config or downgrade ESLint; verify `npm run ci`. |
| V2 docs mislead users | High | Medium | Regenerate docs from actual inventory; remove false claims about command/agent counts and no-rebuild startup. |
| Boundary enforcement gives false confidence | Medium | High | Use real glob matching, normalize relative/absolute paths, test allow/deny precedence. |
| Startup hook performs network/package work | Medium | Medium | Move native binding repair to install/setup; make SessionStart strictly non-mutating and bounded. |
| Native Claude replacement assumption is unproven | Medium | Medium | Mark replacements as uncertain; provide compatibility aliases or measured user migration guide. |

## Migration Impact

Existing users will break on command names. V1's separate `mem-*` commands are replaced by `/siftcoder:mem <action>`, and many generic commands are removed or redirected to native Claude behavior. Manual retraining is required.

Memory migration is not safely usable as written. The documented command `node bin/siftcoder.mjs backfill --from-v2 ~/.siftcoder` calls importer code that looks for `memory.db`; V1 stores `db.sqlite`.

Hook customizations need manual porting. V2 moves hooks under `hooks/hooks.json` and removes V1 vendor sift-compress and dist service hook paths.

Backward-compatible pieces: plugin name remains `siftcoder`, MCP server name remains `siftcoder-memory`, core memory schema appears largely inherited, and V1/V2 state can coexist because V2 uses `~/.siftcoder/v3`.

Difficulty: **high** for active V1 users; **medium** for new installs after runtime fixes.

## Final Verdict

**NO GO**

Required conditions before GO:

1. Fix V2 CLI/daemon protocol mismatch.
2. Fix migration DB path/schema assumptions and test against real V1 layout.
3. Make `npm run lint` and `npm run ci` pass.
4. Align docs with actual inventory or reduce inventory to match docs.
5. Resolve workspace key/path inconsistencies across hooks, CLI, core paths, and daemon.
6. Add compatibility aliases or an explicit deprecation layer for removed high-use commands.
