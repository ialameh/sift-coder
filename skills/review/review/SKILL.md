---
name: review
description: Use for SiftCoder-shaped code review of a PR or pending change. Memory-aware (prior decisions, project conventions) and value-add over built-in /review. Use built-in /review for general best-practice; use this for project-context-aware review.
---

# review (SiftCoder-shaped)

**Complementary to** the built-in `/review`, not a replacement. Built-in `/review` is excellent for general best-practice. This skill adds:

1. **Memory grounding** — flags violations of prior decisions captured in memory
2. **Convention enforcement** — uses the project's actual conventions (extracted from existing code), not generic advice
3. **Local-context awareness** — knows what's load-bearing vs scaffolding in this specific codebase
4. **Cross-PR context** — checks against recent merged PRs for emerging-but-unwritten patterns

## When to use which

- General PR review (style, common bugs, security obvious cases) → built-in `/review`
- "Does this match how we do things in this repo?" → this skill
- "Are we contradicting prior decisions?" → this skill
- Compliance-shaped → `/comply`
- Security-focused → `/security` skill or built-in `/security-review`

## Method

1. **Read the change.** `git diff <base>..<head>`. Get the structural shape — files, lines added/removed.
2. **Memory pass.** For each file/symbol touched:
   - `mem_search` for prior decisions
   - Flag if the change contradicts a captured decision
3. **Convention pass.** Extract the project's conventions from neighbouring code:
   - Import order, naming, error handling, test patterns, doc style
   - Flag deviations
4. **Architecture pass.** Does the change respect module boundaries? Layering? Dependency direction?
5. **Test pass.** Does the change update tests where it should? Are the tests asserting behaviour or implementation?
6. **Output structured review.**

## Output shape

```
Diff:    <files, +N -M>

Memory hits (prior decisions):
  - <decision> (mem id: ...) — change <upholds|contradicts>

Convention findings:
  ✓ Naming: matches
  ✗ Error handling: file uses thrown Error; project uses Result type
  ⚠ Test style: mocks the thing under test (anti-pattern in this repo)

Architecture:
  ✓ Layering respected
  ⚠ src/foo/ imports from src/baz/internal — discouraged
  
Test coverage:
  ✓ New behaviour has 4 tests
  ⚠ Edge case (empty input) not asserted

Severity summary:
  ✗ blockers: 1
  ⚠ should-fix: 3
  ✓ approved areas: 5

Recommended: address blockers; pair the should-fixes with author for context.
```

## Rules

- **Cite memory ids.** Every "contradicts prior decision" finding has the summary id.
- **Convention findings are evidence-cited.** "Project uses X" cites file:line where X is the established pattern.
- **Distinguish blockers vs should-fix.** Blockers stop merge; should-fixes are author judgement calls.
- **Don't duplicate built-in `/review`.** If something is generic (e.g. "this could throw"), defer to it.

## Anti-patterns

- Generic best-practice review (use `/review` instead)
- Inventing project conventions that aren't actually established
- Flagging style that the linter handles
- Long monologues per finding — be terse, cite, move on

## When NOT to use

- Greenfield code with no project conventions yet — built-in `/review`
- General security — `/security-review` built-in
- Quick PR with one-line fix — overkill

## Subagent dispatch

- `Explore` for convention extraction
- `reviewer` agent for the structured pass
- Memory MCP tools throughout

## Value over built-in /review

Built-in is general; this is project-context-aware. Memory grounding + convention extraction are the differentiators. Use both.
