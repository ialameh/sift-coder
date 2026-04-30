---
name: prompt
description: Use to craft a better prompt — for SiftCoder skills, for an LLM, or for a person. SiftCoder-aware framing. "Help me write a prompt", "rephrase this for the AI".
---

# prompt

Prompt-crafting helper. Knows SiftCoder skills + native CC subagents + general LLM patterns.

## Modes

- **for-skill** — turn user intent into the right `/siftcoder:<skill>` invocation
- **for-llm** — generic prompt engineering for any LLM
- **for-person** — request crafting for a teammate (PR description, ask for review, etc.)

## Method

1. **Mode pick** (or detect).
2. **Intent capture.** What does the user actually want as outcome?
3. **For-skill mode:**
   - Match intent to skill (use `/siftcoder` meta-skill decision tree)
   - Format invocation with proper args
4. **For-llm mode:**
   - Apply: clear task, structured input, explicit output shape, constraints, examples (if available)
   - Surface ambiguity for clarification before sending
5. **For-person mode:**
   - Audience + goal + decision needed + deadline
   - Tone-match the team norm (memory hint)

## Output shape

```
Mode:    <for-skill | for-llm | for-person>
Intent:  <one line>

Crafted prompt:
  <ready-to-send text>

Notes:
  - <why this shape>
  - <what to watch for in the response>
```

## Rules

- **Output is copy-paste-ready.** Not "you might want to say...".
- **Constraints explicit.** Don't bury them in prose.
- **Output shape requested.** "Reply with X format" beats hoping.
- **Examples when available.** Few-shot beats zero-shot for non-trivial tasks.

## Anti-patterns

- Long preamble before the prompt itself
- "Try saying..." instead of producing the actual prompt
- Generic prompt-engineering advice (this skill produces prompts, not lectures)
- Ignoring the audience for for-person mode

## When NOT to use

- User already knows what to say
- The task is so simple the prompt is the task

## Subagent dispatch

- None — synthesis is direct
- Memory MCP for prior similar prompts (especially for-skill mode)

## Value over native CC

CC will help write prompts. This skill is mode-aware (skill vs LLM vs person) and SiftCoder-aware. The matching IS the value.
