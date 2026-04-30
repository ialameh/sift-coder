---
name: improve-spec
description: Use to polish a spec/PRD/feature doc. Adds testable acceptance criteria, surfaces ambiguities, identifies missing edge cases. Output is a marked-up version of the spec, not a rewrite.
---

# improve-spec

Spec polish. Adds rigour. Surfaces gaps. Doesn't rewrite the user's voice.

## Method

1. **Read the spec.** Quote sections back in your output as you address them — keeps the user oriented.
2. **Ambiguity sweep.** Find every:
   - Unbounded quantifier ("fast", "many", "good")
   - Passive voice hiding the actor
   - Tense ambiguity (will/may/should)
   - Missing units (seconds vs minutes, MB vs GB)
3. **Acceptance criteria.** Every behaviour bullet should map to a testable assertion. If it doesn't:
   - Propose 1-3 testable criteria
   - Mark which become unit tests vs integration vs manual UAT
4. **Edge cases.**
   - Empty / zero / null input
   - Very large input
   - Concurrent calls
   - Failure of each downstream
   - Auth boundaries (anonymous, expired, revoked)
   - Time boundaries (epoch, far future, DST)
5. **Out-of-scope explicit.** Spec should name what it's NOT doing — half the value is the negative space.

## Output shape

Markup the original spec inline (annotated). Keep the user's voice; add precision in `> [improve-spec]: ...` callouts.

```
## Original Spec (annotated)

### Overview
Build a "buy now" button on the product page.

> [improve-spec] Ambiguity: "product page" — applies to all product types or
> excludes digital goods?

### Behaviour
- Click triggers checkout
- Show confirmation

> [improve-spec] Acceptance criteria proposed:
>   AC1 [unit]    Click on "Buy now" emits {event: "buy.click", productId} 
>   AC2 [integ]   On checkout success, confirmation page shows order id 
>                 within 2s p95
>   AC3 [manual]  Confirmation visible to assistive tech
>
> [improve-spec] Edge cases not covered:
>   - User not signed in (redirect to login? or guest checkout?)
>   - Out-of-stock item (button state? error?)
>   - Network failure mid-purchase (idempotency? retry?)

### Non-goals (proposed addition)
- Recurring subscriptions (separate spec)
- Volume pricing (separate spec)
- Cart consolidation (use existing flow)
```

## Rules

- **Don't rewrite.** Annotate. Keep the user's voice.
- **Every ambiguity gets a question or a proposal.** No bare flagging.
- **Acceptance criteria are testable.** "Behaves correctly" doesn't qualify.
- **Edge cases are concrete.** Not "handle errors" — name the error mode.
- **Out-of-scope is part of the spec.** Always propose if missing.

## Anti-patterns

- Replacing the user's prose with consultant-speak
- Marking everything as "needs clarification" — pick the load-bearing ones
- Acceptance criteria that just restate the requirement
- Edge cases not relevant to the actual stack

## When NOT to use

- Final spec already through review — too late
- One-line feature request — overkill
- Scratch / dream stage — `/dream` instead

## Subagent dispatch

- `Plan` for acceptance criteria generation
- `general-purpose` for edge-case enumeration
- Memory MCP for prior similar specs

## Value over native CC

CC will critique a doc on request. CC won't naturally produce annotated-in-place output, separate ambiguity from acceptance from edge cases, or insist on out-of-scope being explicit. The structure IS the value.
