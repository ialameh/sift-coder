---
name: reverse-spec
description: Use to extract a spec FROM existing code. Inverse of "build from spec" — given the code, recover what it does. Useful for: legacy systems, undocumented modules, post-hoc compliance evidence.
---

# reverse-spec

Code → spec. Reads a module/service/feature and writes the spec it implements.

## Method

1. **Anchor.** Pick the surface: a directory, a class, an HTTP service, a CLI command.
2. **Walk the public surface.** Every entry point gets:
   - What it accepts (params, headers, env)
   - What it does (one sentence)
   - What it returns (success + error shapes)
   - Side effects (writes, calls, mutates)
3. **Behaviour from tests.** If the area has tests, each test name is a one-line behaviour assertion. Aggregate.
4. **Behaviour from code paths.** For each non-trivial branch, name the trigger and outcome.
5. **Unstated assumptions** (mine via `/invariant` skill if helpful).
6. **Synthesise spec** in the same shape `improve-spec` would produce — overview, actors, behaviour, AC, edge cases, non-goals.
7. **Confidence per claim.** Test-backed claims = high; code-only claims = medium; inferred-from-comments = low.

## Output shape

```
Source:     <directory / module / service>
Coverage:   N entry points walked

# Spec: <inferred title>

## Overview
<one-paragraph capability description>

## Actors
<inferred from auth checks, headers, role guards>

## Behaviour
- B1 [high]    <test-backed behaviour>
- B2 [med]     <code-only behaviour>
- B3 [low]     <inferred from comment>

## Acceptance Criteria (test-backed)
- AC1 → tests/foo.test.ts:42 — <one-liner>
- AC2 → tests/foo.test.ts:78 — <one-liner>

## Edge Cases (from code branches)
- Empty input → returns []
- Auth missing → 401
- DB error → propagated; no retry

## Non-goals (inferred from absence)
- Pagination (no cursor/limit handling found)
- Caching (no cache layer detected)

## Open questions
- Q1: <ambiguity in code; behaviour unclear>
```

## Rules

- **Confidence labels mandatory.** Don't pretend code-only inference is the same as test-backed.
- **Cite test files for AC.** Each test name → AC line.
- **Surface ambiguities.** When code does X but it's unclear if X is intended, flag it.
- **Don't fabricate non-goals.** Inferred non-goals are explicit absences; speculation is open question.

## Anti-patterns

- Treating implementation detail as AC (e.g. "uses Redis" — internal, not spec)
- Skipping confidence labels
- Long prose summaries instead of structured spec
- Inferring requirements that the code happens to satisfy but didn't intentionally

## When NOT to use

- Code with up-to-date spec — read the spec instead
- Active development — moving target
- Generated code — spec is in the source-of-truth schema, not the gen output

## Subagent dispatch

- `Explore` for the walk
- `archaeologist` if the spec needs git/memory context for "why"
- `general-purpose` for the synthesis

## Value over native CC

CC will summarise code. CC won't naturally produce spec-shaped output with confidence labels and AC backlinks. The structure IS the value — the output is auditable and feeds compliance evidence.
