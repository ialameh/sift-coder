---
name: surprise-me
description: Use when the user wants a brand-new project idea / side project / weekend build / "I'm bored, give me something to build". Generates novel project concepts, not features for an existing repo.
---

# Surprise Me — project opportunity generator

This is **not** "feature ideas for the current repo" (use `ideate` for that). This generates fresh project concepts with enough shape that one can become a repo immediately.

## Inputs (gather, but ask at most ONE question)

- User skill set (infer from memory: languages, domains used recently)
- Available time budget (weekend / week / 1-2 evenings)
- Energy mode: **build** (ship a thing) / **learn** (master a tech) / **play** (just have fun)
- Distribution preference: private tool, open source, AppExchange/SaaS, content/demo, internal automation
- Constraint flags: `--salesforce`, `--tiny`, `--learning <tech>`

If memory has these from prior sessions, use them. Don't re-ask.

## Discovery pass

1. **Memory scan.** Search for unfinished ideas, repeated annoyances, tools the user keeps building around, and domains they enjoy.
2. **Capability scan.** Infer likely stacks from local repo, recent commands, and docs. Prefer ideas the user can actually ship.
3. **Novelty guard.** Reject ideas that are common templates unless the twist is concrete.
4. **Constraint fit.** Honor flags literally: `--tiny` means <200 LOC for MVP, not "small-ish".

## Generation pattern

Produce **5 ideas** across three creativity axes:

1. **Cross-pollinate (1 idea):** take a pattern from domain A, apply to domain B that doesn't usually have it. Examples: "Apex governor-limit visualiser styled like a flight sim", "git rebase as a tower-defence game".
2. **Subtraction (1 idea):** take a known crowded category, strip 80% of features, ship the smallest useful core. "X but only the one knob that matters."
3. **Constraint-driven (1 idea):** "what would this look like if the only allowed dependency is Y / fits in N LOC / runs entirely offline / has zero state".
4. **Memory-mining (1 idea):** scan memory for unfinished thoughts ("I wish there was a tool that..."), pick the most concrete one.
5. **Wildcard (1 idea):** something the user has not done before in any prior memory.

For each idea, include a **72-hour path**:

- First commit
- MVP slice
- Demo moment
- Hardest unknown
- Kill test

Score each idea:

| Metric | Meaning |
|---|---|
| Joy | How fun/energizing this likely is for the user |
| Shippability | How likely a working MVP is in the stated budget |
| Novelty | How non-obvious/non-template the idea is |
| Usefulness | Whether it solves a real problem |
| Learning yield | How much capability the user gains |

## Output shape

For each idea:

```
### <title>
<one-liner pitch>

Why interesting: <novel angle>
Time to MVP:    <hours/days>
Stack:          <minimal>
Risk of boredom: <low|med|high> — <reason>
First commit:   <what literally lands first>
72-hour path:   <commit → MVP → demo>
Hard unknown:   <thing to validate first>
Kill test:      <what would make us stop>
Score:          joy <n>/5, ship <n>/5, novelty <n>/5, useful <n>/5, learning <n>/5
```

End with **one** explicit recommendation:

> If I had to pick one: **<title>** — <why it fits the user's current state>

Then offer:

> Next concrete move: <scaffold repo | write spec | prototype spike | research market>.

## Hard rules

- Never propose "a todo app", "a chat bot", or "a personal site".
- Never propose something the user has obviously already built (check memory).
- Each idea must have a real differentiator — not "X but with AI" unless the AI angle is genuinely novel.
- Stack must be installable on the user's actual machine (check memory for OS/lang preferences).
- At least one idea must be commercially boring but practically useful.
- At least one idea must be playful or strange enough to expand the search space.
- Do not recommend the most novel idea if its shippability is weak; recommend the best fit.

## Variants

- **`/siftcoder:surprise-me --salesforce`** — restrict to sfdx-shaped projects (LWC, Flow, Apex packages, AppExchange concepts).
- **`/siftcoder:surprise-me --tiny`** — &lt; 200 LOC budget.
- **`/siftcoder:surprise-me --learning <tech>`** — vehicle for learning a specific technology.
