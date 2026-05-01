# Contributing to SiftCoder

## Development setup

```bash
git clone https://github.com/ialameh/siftcoder.git
cd siftcoder
npm install
npm run build
npm test
```

Requirements:
- Node ≥ 20
- Optional: Ollama for local-LLM development

## Repo layout

See [ARCHITECTURE.md §4](ARCHITECTURE.md#4-module-responsibility-map). Quick map:

```
src/        TypeScript core (memory engine, LLM clients, utils)
hooks/      .mjs hook scripts
skills/     SKILL.md per skill
agents/     .md per agent
commands/   .md per slash command
monitors/   .mjs monitor scripts
bin/        CLI entry
scripts/    install / setup helpers
docs/       hand-curated documentation
tests/      cross-module integration tests
```

## Testing

Vitest is the runner. Coverage gates are enforced in CI.

```bash
npm test                    # run once
npm run test:watch          # watch mode
npm run test:coverage       # with coverage report
```

Targets:
- 90% lines / 90% statements / 90% functions
- 85% branches

Coverage exclusions (see `vitest.config.ts`): I/O entry points (`daemon/index.ts`, `mcp/server.ts`), CLI binaries, web static assets.

## Coding standards

- TypeScript strict mode (`tsconfig.json` is the contract)
- ESLint + Prettier — `npm run lint` and `npm run format` before pushing
- ES modules everywhere (`"type": "module"`)
- No default exports — named exports only
- No global state — pass dependencies explicitly
- Async-first — no sync IO in async paths
- Errors are typed (`src/core/errors.ts`); throw classes, not strings
- Public functions need explicit return types

## How to add a skill

1. Create `skills/<name>/SKILL.md` with frontmatter:

   ```markdown
   ---
   name: <name>
   description: Use when... [trigger conditions, examples]
   ---
   ```

2. Body is markdown — rules, patterns, anti-patterns. No code other than examples.
3. Skills are auto-discovered via the plugin manifest. No registration needed.
4. Test the skill manually: `/skill <name>` in Claude Code.

## How to add an agent

1. Create `agents/<name>.md` with frontmatter:

   ```markdown
   ---
   name: <name>
   description: Use when... [single trigger sentence]
   tools: Read, Edit, Bash, Grep, Glob
   model: sonnet
   ---
   ```

2. Body is the agent's system prompt. Be specific:
   - **Method** — numbered steps
   - **Output** — exact shape expected
   - **Rules** — hard constraints (read-only? scope limits?)

3. Single-purpose. If the agent has two jobs, split it.
4. Read-only by default; only grant Edit/Write if the job requires it.

## How to add a hook

Hooks are heavyweight — they fire on every matching event. Default to NO. Only add a hook when:

- It captures something you can't get any other way (memory, incident)
- Its budget is &lt; 2s
- Failure is silent and never blocks the user

Steps:

1. Create `hooks/<event>/<name>.mjs`. Pure ES module.
2. Read the event payload from stdin (JSON), exit code controls behaviour:
   - `0` — pass
   - `2` — block (only PreToolUse / PreCompact)
3. Wrap in try/catch — never crash on bad input.
4. Document the hook's contract at the top of the file (event, matcher, side effects, failure mode).
5. Register in `hooks/hooks.json` with an explicit timeout.
6. Add a test in `tests/hooks/<name>.test.ts`.

## Commit style

Conventional commits:

```
feat(memory): add provenance pruning
fix(hooks): handle missing scope.json gracefully
docs(readme): clarify Ollama setup
chore(deps): bump vitest 2.1
```

## Pull requests

- One concern per PR
- All CI green (lint, typecheck, test, coverage)
- Update `CHANGELOG.md` under `## Unreleased`
- Reference issue if applicable

## Releases

Maintainers only. Steps:

1. Update `CHANGELOG.md` — move `Unreleased` to a new version section
2. Bump `package.json` version
3. Tag: `git tag v1.x.y && git push --tags`
4. GitHub Action publishes to npm and creates GitHub release

## Code of conduct

Be kind, be specific, be evidence-based. No bikeshedding.
