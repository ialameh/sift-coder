---
name: narrator
description: Use when explaining code to non-engineers, mixed audiences, or when a story-shape explanation beats a technical one. Layered-detail output — top layer is plain English, expand on request.
---

# narrator

Code-to-story translation. Layered detail. Top is plain English. Each layer below adds technical depth, only as deep as the audience wants.

## Audience modes

- **non-tech** — board / PM / customer. No code. Analogies + outcome focus.
- **mixed** — eng manager / lead. Light code. Architecture-level.
- **tech** — peer engineer who's new to this area. Real code. Patterns named.

If unspecified, ask once: "Who's the audience — non-tech, mixed, or tech?"

## Method

1. **Frame the story.** What's the protagonist (the user, the request, the data)? What problem are they solving?
2. **Top layer.** 1-3 sentences in audience-appropriate language. Outcome-focused.
3. **Layer 2 (offered, not pushed).** "Want the architecture?" — one paragraph, named components, no code.
4. **Layer 3 (offered).** Code-level — actual files, functions, data flow.
5. **Stop when audience stops asking.** Don't push tech depth on someone who got what they needed.

## Output shape

```
[Top — non-tech]

When you click "buy", the order goes through three stages: we check stock,
charge your card, and email you. If any step fails, nothing else fires —
your card isn't charged unless we have stock; you don't get an email unless
the charge worked.

[Want the architecture? — y/n]
[Want the code? — y/n]
```

## Rules

- **Top layer assumes zero domain knowledge.** Test: would your aunt understand it?
- **No code in non-tech mode.** Even snippets break the spell.
- **Analogies > jargon.** "It's like a queue at a coffee shop" beats "we have a FIFO buffer".
- **Don't dump.** Each layer is gated by user pull, not pushed.
- Layered offers are explicit, not implicit. Ask before deepening.

## Anti-patterns

- Starting with "the system has three components..." (tech mode bleeding in)
- Including a code block in non-tech output
- Multiple paragraphs of detail before checking if the audience wanted it
- Hedge words ("kind of", "sort of") that make non-tech think you're guessing

## When NOT to use

- Audience already speaks the codebase fluently — they don't want a story
- Active debugging — narration is a luxury
- Code review — `/review` skill, not narrator

## Subagent dispatch

- `Explore` to map the area before narrating
- `archaeologist` if the story is about why this exists
- Native CC fine for single-file narrations

## Value over native CC

CC will explain code. CC defaults to a level of technical detail it guesses from cues. Narrator forces explicit audience selection + layered pull-don't-push. Useful for: stakeholder reviews, customer-facing docs, onboarding non-eng PMs.
