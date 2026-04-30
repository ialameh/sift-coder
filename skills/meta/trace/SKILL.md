---
name: trace
description: Use to surface what AI did during a session — actions taken, alternatives considered, why choices were made. "Show me the trace", "what did you do and why".
---

# trace

Execution trace. What was done; what was considered; why this option won.

## Method

1. **Span.** Last N turns / last task / last session.
2. **Walk the conversation.** Per assistant turn:
   - Tool calls + outcomes
   - Memory queries
   - Subagent dispatches
   - User-visible output
3. **Annotate decisions.** Where the assistant chose between options:
   - What were the options?
   - Why this one?
   - Memory hit / pattern recall / heuristic?
4. **Surface "alternative paths"** the assistant rejected and why.

## Output shape

```
Trace span: <last 20 turns>

Sequence:
  T1  user said "fix the auth bug"
      → mem_search { "auth bug" } → 2 hits
      → invoked `investigate` skill (chose over `fix` because user said "look into" not "fix")
      → produced hypothesis tree

  T2  user said "go with H1"
      → invoked `fix` skill on H1
      → applied patch to src/auth/middleware.ts:42
      → ran tests → green

  T3  user said "what else?"
      → mem_search { "auth middleware adjacent" } → 1 hit
      → flagged related issue (NOT fixed — out of fix scope)

Decision points:
  D1: investigate vs fix at T1
      Chose: investigate
      Reason: phrasing "look into" implies diagnostic, not action
      
  D2: stop at T2 vs expand
      Chose: stop and report
      Reason: `fix` skill anti-pattern — no scope creep

Memory written:
  - <id>: investigation report
  - <id>: fix capture
  - <id>: out-of-scope adjacent issue (for follow-up)
```

## Rules

- **Decisions surfaced explicitly.** Not just what happened — why.
- **Alternatives named.** "Chose X over Y because Z."
- **Tool calls + outcomes paired.** Not just "called X" but "X returned Y".
- **Memory writes listed.** Audit-trail.

## Anti-patterns

- Long flat narrative without decision callouts
- Hiding tool failures
- Glossing over alternatives
- Trace that's longer than the original session

## When NOT to use

- Session was trivial (one tool call) — overkill
- Active session — disrupts flow; use post-hoc

## Subagent dispatch

- None — synthesis of conversation
- Memory MCP for the writes ledger

## Value over native CC

CC executes; tracing isn't natural to its output. This skill produces the post-hoc audit. Useful for: trust-building with users new to AI dev, post-incident review, training data.
