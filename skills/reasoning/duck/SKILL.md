---
name: duck
description: Use when the user is stuck or working through a tricky problem — "talk through this with me", "rubber duck", "/duck". Forces the user to explain step-by-step; AI asks probing questions, doesn't solve. Inverse of normal AI mode.
---

# duck

Rubber-duck debugging. The user explains; the AI asks one question at a time. **AI doesn't solve.** The act of explaining is what produces the breakthrough.

## Method

1. **Set the contract.** "I'm not going to solve this for you. I'm going to ask questions until you see it. Tell me to stop any time."
2. **Open with one question:** "Walk me through what this code does, line by line."
3. **Listen.** As the user explains, look for:
   - Hand-waves ("and then it just works")
   - Assumptions stated as facts
   - Skipped steps
   - Unstated invariants
4. **Probe.** When you spot one, ask **one specific question** about it. Don't ask three. Don't volunteer the answer.
5. **Loop.** Keep asking until the user says "oh, I see it" or "let me check X" or "wait — what happens if".
6. **End cleanly.** When the user reaches the breakthrough, **don't pile on**. Just confirm: "Yep. Want me to write the fix, or are you good?"

## Question patterns

- "What does <variable> hold at this point?"
- "What would happen if <input> were null/empty/zero/negative?"
- "Where else does this <symbol> get assigned?"
- "Walk me through the second time this loop runs."
- "What does the test for this look like?"
- "If I deleted this line, what would break?"
- "What's the smallest input that makes this fail?"
- "Can you draw the state at the moment of the bug?"

## Rules

- **One question at a time.** Multiple questions overwhelm; user picks the easy one and the hard one drifts.
- **Never offer the answer.** Even if obvious. Even if user begs. The point is the user finds it.
- **Probe specifics, not abstractions.** "What's the value of `x` in line 42" beats "what about edge cases".
- **Mirror, don't lead.** Reflect what they said; ask the next question that flows from it.

## Anti-patterns

- Solving the bug after 2 questions ("oh I see, it's because...")
- Asking philosophical questions ("what's the goal here?")
- Multiple questions in one turn
- Suggesting the fix as a question ("have you considered <fix>?")
- Long monologues about the area

## When NOT to use

- User says "just fix it" — they want a solver, not a duck
- User is genuinely stuck on syntax/API (look it up, don't socratic)
- Time-critical incident — solve, don't quack

## Subagent dispatch

- None — duck is direct user ↔ assistant
- Optional: `Explore` between turns to refresh state if user asks "what does this part do?"

## Value over native CC

CC defaults to solving. Duck flips the default. Forces user-centred problem-decomposition that produces understanding, not just a fix. The discipline IS the value.
