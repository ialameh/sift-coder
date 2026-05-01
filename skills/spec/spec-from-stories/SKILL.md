---
name: spec-from-stories
description: Use to derive a spec from user stories / Jira tickets / Linear issues. Aggregates the stories, finds the underlying capability, produces a spec with testable AC. Inverse of "spec → tickets".
---

# spec-from-stories

User stories → coherent spec. The opposite of breaking a spec into tickets — given the tickets, recover the spec.

## Method

1. **Gather stories.** User pastes them, points to a ticket query, or supplies a list. Ideal input is 3-15 related stories.
2. **Cluster.** Group by capability. A spec covers ≥ 1 cluster; multiple specs may emerge.
3. **Per cluster:**
   - Distil the underlying capability ("the user wants to do X")
   - Map each story to a slice of the capability
   - Find gaps — capability requires X but no story addresses it
   - Find overlaps — multiple stories asking for the same thing in different words
4. **Synthesise spec.** Standard shape: overview, actors, behaviour, acceptance criteria, edge cases, non-goals.
5. **Backlink.** Each AC cites the originating story IDs. Easy to pivot back.

## Output shape

```
Stories input:    N (e.g. STORY-1 to STORY-15)

Clusters:
  Cluster A — checkout (8 stories)
  Cluster B — search   (4 stories)
  Cluster C — outliers (3 stories — possibly noise)

---

# Spec: Checkout

## Overview
<one paragraph distilled capability>

## Actors
- Anonymous shopper
- Signed-in shopper
- (admin not in scope)

## Behaviour
- ...

## Acceptance Criteria
- AC1 [STORY-1, STORY-7]    <criterion>
- AC2 [STORY-3]             <criterion>
- AC3 [STORY-9, STORY-11]   <criterion>

## Edge Cases
- ...

## Non-goals
- Subscriptions (separate spec)

## Open questions (gaps in the stories)
- Q1: STORY-5 implies guest checkout but no story specifies idempotency
- Q2: <missing capability>

## Story coverage
  Mapped:        8 of 8 cluster A stories
  Outlier:       3 stories don't fit (suggest separate spec or reject)
```

## Rules

- **Backlink every AC** to source story IDs.
- **Surface outliers.** Stories that don't cluster get their own callout — don't force-fit.
- **Surface gaps.** Capability requires X but no story addresses it → open question.
- **Don't invent.** If 3 stories say "checkout should be fast", don't infer a SLA — flag as ambiguous.

## Anti-patterns

- Treating all stories as equally weighted
- Hiding outliers in the synthesis
- Inventing requirements not present in any story
- Long preambles before the spec — get to the structure

## When NOT to use

- Single ticket (no cluster to derive)
- Greenfield (no stories yet) — `/dream` or PRD-from-scratch
- After spec exists — `/improve-spec` instead

## Subagent dispatch

- `Plan` for cluster + spec synthesis
- `general-purpose` for the backlink mapping
- Memory MCP for prior specs on adjacent capabilities

## Value over native CC

CC will summarise stories. CC won't naturally cluster by capability, surface outliers, backlink ACs to source stories, or flag gaps. The structure IS the value.
