---
name: ripple
description: Use before changing a public function/signature/schema/API to see the blast radius. "If I change X, what else changes". Reads call graph + tests + docs + memory for prior similar changes.
---

# ripple

Change-impact visualisation. Walks the call graph, finds tests that would change, finds docs that would lie, surfaces the full blast radius before you commit.

## Method

1. **Anchor.** What's changing — function signature, public method, schema, env var, config key, API endpoint, file location?
2. **Direct refs.** `Grep` / native search for the symbol/string. Categorise hits:
   - **Producers** — write/emit this
   - **Consumers** — read/call this
   - **Tests** — assert behaviour about this
   - **Docs** — describe this to humans
   - **Generated** — codegen, snapshots, fixtures
3. **Transitive.** For each consumer, check if **its** behaviour changes. Walk one more hop. Stop at module boundaries unless a public API of the consumer is also affected.
4. **Memory.** `mem_search` for prior changes to similar APIs. What broke last time? What was forgotten?
5. **Report.** Tree-shaped impact map.

## Output shape

```
Anchor:    <symbol / endpoint / config>

Direct impact:
  Producers:   N — <file:line list>
  Consumers:   N — <file:line list>
  Tests:       N — <file:line list>
  Docs:        N — <file list>
  Generated:   N — <list>

Transitive impact (1 hop):
  <consumer file>  → also publicly exposes signature change to <its callers>
  ...

Memory:
  Prior similar change at <commit/summary>: <what broke, what was forgotten>

Risk: <low | med | high>

Pre-flight checklist:
  ☐ Update direct callers
  ☐ Update tests
  ☐ Update docs (README, API ref)
  ☐ Regen fixtures/snapshots
  ☐ Migration note in CHANGELOG
  ☐ <items derived from memory of past misses>
```

## Rules

- **Walk the graph; don't guess.** Every consumer cited with file:line.
- **Tests count even when adapter-shaped.** Snapshot tests, contract tests, integration — all flagged.
- **Generated code is the silent killer.** Always check.
- **Memory ALWAYS consulted.** Past incidents reveal the items most easily missed.

## Anti-patterns

- "Should be safe" without enumeration
- Skipping tests in the count (they're code that depends on the symbol too)
- Ignoring docs (lying docs erode trust)
- Walking too deep (3+ hops dilutes signal)

## When NOT to use

- Internal-only function with one caller — manual scan suffices
- Changing implementation without changing signature — no ripple
- Pre-merge after the change is done — too late, this is preflight

## Subagent dispatch

- `Explore` for the grep + call graph
- `general-purpose` for transitive walk

## Value over native CC

CC will grep for callers if asked. CC won't naturally categorise into producers/consumers/tests/docs/generated, walk transitively with discipline, or cross-reference memory of past changes. The structured pre-flight IS the value.
