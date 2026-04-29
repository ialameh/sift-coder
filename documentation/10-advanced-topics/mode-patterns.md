# Quick / Deep / Focus Mode Pattern

A three-tier depth pattern for long-running analysis commands. First introduced by `/siftcoder:reverse-prompt`; reusable for `understand`, `document`, `analyze`, and any future command that synthesizes context from a codebase.

## Why three tiers

A single "do the analysis" mode forces a tradeoff:
- **Too shallow** → useless on big projects
- **Too deep** → wastes minutes on small projects or quick iterations

Three tiers let the user pick the right depth per call without re-prompting.

## The tiers

### Quick (default)

- Cached, fast, root-level signals only
- No subagent dispatch
- Inputs: manifest (`package.json`, `pyproject.toml`, etc.), root tree (depth 2), README
- Latency: seconds
- Use when: bootstrapping, iterating, small projects, repeat calls

### Deep

- Triggered by `--mode deep`
- Dispatches the **investigator** (or **analyst**) agent via the Task tool
- Agent prompt scopes to a bounded synthesis (≤500 words plain language)
- Latency: 30-90 seconds
- Use when: large codebases, first time on a project, depth > speed

### Focus

- Triggered by `--focus "<angle>"`
- Caller supplies an intent string (e.g. "the auth flow only", "just the API surface")
- Combines Quick context (or Deep, if `--mode deep --focus`) with the focus angle
- Latency: matches the underlying mode plus minor overhead
- Use when: a specific slice matters more than the whole

## Caching

All three tiers cache results keyed by `shortFingerprint(repoId::mode::focus)`. Cache invalidation is intentional — re-run with `--no-cache` to force regeneration. The fingerprint helper lives at `dist/utils/focus-fingerprint.js`.

## Implementation building blocks

Available in `dist/services/reverse-prompt-service.js` and reusable elsewhere:

- `gatherQuickContext(projectRoot)` — read manifest, format root tree, read README
- `buildContextBlock(ctx, opts)` — assemble the LLM-facing context block
- `getCached / putCached / listCached` — local cache CRUD
- `withDedup(key, fn)` — in-flight dedup so two parallel invocations don't duplicate work

The tree formatter (`dist/utils/tree-formatter.js`) and focus fingerprint (`dist/utils/focus-fingerprint.js`) are self-contained and depend on nothing siftcoder-specific.

## Adopting the pattern in a new command

1. Add `--mode quick|deep|focus` and `--focus "<text>"` arguments
2. Use `gatherQuickContext` for the Quick tier
3. For Deep, dispatch a tightly-scoped Task to the investigator/analyst agent
4. For Focus, append the user's angle to the context block before LLM synthesis
5. Wire cache lookup before generation, cache write after
6. Document the latency and signal-to-noise tradeoff so users can pick the right tier

## Inspiration

Adapted from gitreverse's Quick / Deep / Manual reverse modes (Next.js webapp). The siftcoder version drops the multi-LLM-provider abstraction (siftcoder runs inside Claude Code, so the calling session IS the LLM) and adds a local-only cache + investigator-agent dispatch path.
