---
name: ideate
description: Use when the user asks to brainstorm features, expand a project, or "what should I build next" / "give me ideas for X" / "how could we extend Y". Memory-aware — pulls prior decisions and avoids re-suggesting rejected ideas. Improved from V1 ideate command.
---

# Ideate — feature strategy with memory grounding

This skill generates feature/expansion ideas that are **grounded in the project's actual state and history**, not generic. It is not a brainstorming list. It is a product/engineering option set with evidence, sequencing, and kill criteria.

## Before generating ideas

1. **Memory pass.** Run `mem_search({ query: "<topic>", k: 12 })` when available. Skim hits for already-explored, rejected, or in-flight ideas. Note what was tried and why it was abandoned. If MCP memory is unavailable, say so once and continue from repo evidence.
2. **Repo pass.** Use native Explore or direct reads to understand:
   - what the product/lib actually does (read README + 2–3 entry points)
   - what's instrumented, tested, deployed
   - what the recent git log shows people working on
   - where users feel friction (issues/TODOs/errors/tests/docs)
3. **Market/edge pass.** Infer the audience and adjacent products from repo/docs. If user asked for current market validation, use web research; otherwise mark market claims as assumptions.
4. **Constraint pass.** Ask the user one question max only if a hard constraint blocks useful ideation. Prefer inferred budgets: 1 hour, 1 day, 1 week.

## Generation pattern

For each candidate idea:

- **T** Title — &lt; 8 words
- **D** Distinguishing claim — what makes this not generic? cite file/feature
- **I** Impact — who benefits, by how much
- **R** Risk — what breaks, what's hard
- **E** Evidence — file, symbol, test, memory id, issue, or observed gap
- **S** Smallest slice — first shippable implementation in one paragraph
- **K** Kill criterion — signal that proves this idea is not worth continuing

Generate **2 portfolios**:

- **Safe (3 ideas)** — incremental, low-risk, predictable
- **Asymmetric (3 ideas)** — high-upside, less proven, requires conviction

Then pick:

- **1 dark horse** that the user probably has not considered.
- **1 compounding bet** that makes future development faster, smarter, or cheaper.

Score each idea 1–5 on:

| Metric | Meaning |
|---|---|
| User value | Direct benefit to real users |
| Strategic leverage | Whether this unlocks future work |
| Build confidence | Likelihood of shipping cleanly |
| Differentiation | How non-generic it is |
| Maintenance cost | Reverse-scored: 5 = cheap to maintain |

## Anti-generic rules

- No "add observability" / "add a dashboard" / "improve documentation" without a concrete hook into the codebase.
- No idea that is already present or recently rejected (check memory/repo).
- No idea that contradicts a stated constraint (check memory).
- Each idea must reference at least one file path, symbol, or feature already in the repo.
- Each recommendation must have a first slice that can ship independently.
- Do not hide weak assumptions. Label them `Assumption:` and say what evidence would validate them.

## Output shape

```
## Evidence Snapshot
- Product read: <files/features>
- Memory read: <hits or unavailable>
- Constraints inferred: <budget/risk/audience>

## Safe (incremental)
1. <title> — <one-line distinguishing claim>
   Impact: …
   Risk: …
   Evidence: <files/memory/tests>
   First slice: …
   Kill criterion: …
   Score: user <n>/5, leverage <n>/5, confidence <n>/5, differentiation <n>/5, maintenance <n>/5

## Asymmetric (high upside)
…

## Compounding bet
<title> — <why it improves future development>

## Dark horse
<title> — <why it's worth a real look>

## My pick
<one idea> — <why this is the best next move now>
```

End with one concrete next action: either write a one-page spec, create an implementation plan, or run a focused investigation.

## Salesforce-flavoured variant

For sfdx projects, prefer ideas that exploit:
- Platform Events / Change Data Capture for cheap eventing
- Flow / triggers consolidation
- Bulkification opportunities visible from `sf code-analyzer`
- License-tier upgrades the org already has but isn't using
- Admin/developer handoff pain: metadata diffs, test data, deployment safety, package boundaries
