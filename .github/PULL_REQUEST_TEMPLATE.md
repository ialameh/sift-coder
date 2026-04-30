<!--
Thanks for opening a PR. Please fill in this template.
For security fixes, see SECURITY.md and email maintainers BEFORE opening a public PR.
-->

## Summary

<!-- One paragraph: what this PR does and why -->

## Type of change

- [ ] Bug fix (non-breaking change which fixes an issue)
- [ ] New feature (non-breaking change which adds capability)
- [ ] Breaking change (fix or feature that changes existing behaviour)
- [ ] Documentation update
- [ ] Test / CI / tooling
- [ ] Refactor (no functional change)

## What ships

<!-- Concrete artefacts touched -->
- [ ] New skill(s): _list paths under `skills/<family>/<name>/SKILL.md`_
- [ ] New command(s): _list paths under `commands/*.md`_
- [ ] New agent(s): _list paths under `agents/*.md`_
- [ ] New hook(s): _list paths under `hooks/<event>/*.mjs` + `hooks/hooks.json` entry_
- [ ] Memory engine change: _list `src/memory/...` files_
- [ ] Service / util change: _list paths_
- [ ] Test change: _list paths_
- [ ] Docs: _list paths_

## Value-add bar (for new skills only)

<!-- New skills must satisfy ≥ 3 of: -->
- [ ] Workflow ordering — explicit step sequence with evidence gates
- [ ] Subagent dispatch plan — which native CC agent to use when
- [ ] Output shape — exact result structure
- [ ] Anti-patterns — what NOT to do, with reasons
- [ ] Domain rules — Salesforce / LWC / Apex / sfdx specifics
- [ ] Memory integration — when to query `mem_search`
- [ ] Tool-permission scope — read-only vs scoped-write

## Test plan

<!-- How a reviewer can verify this works -->
- [ ] `npm run lint` clean
- [ ] `npm run typecheck` clean
- [ ] `npm test` — all 571+ tests pass
- [ ] `node scripts/smoke.mjs` — 14/14 green
- [ ] Manual smoke for the specific change: _describe_

## Breaking changes

<!-- For breaking changes only -->
- Migration steps for existing users:
- Affected V1/V2 users:
- Deprecation timeline:

## Documentation

- [ ] README updated if surface counts changed
- [ ] CHANGELOG.md `Unreleased` section updated
- [ ] Relevant `docs/*.md` updated
- [ ] New skills self-document via SKILL.md (method, output, rules, anti-patterns, when-NOT)

## Linked issues

<!-- Closes #123 -->
