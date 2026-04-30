---
name: pause
description: Use to freeze current session state with rich resumption context. "Pause this", "save my place", "I need to step away". Different from native task tracking — captures full thinking state, not just todos.
---

# pause

Session-state freeze. Saves the full context needed to resume cleanly later — including not just todos but the half-formed thoughts, the dead ends explored, the constraints discovered.

## What gets paused

1. **Open question** — what we were trying to figure out
2. **Progress** — what's done
3. **Active hypothesis** — what we currently believe
4. **Dead ends** — what we tried and why it didn't work
5. **Constraints** — discovered or stated
6. **Next concrete step** — what should happen first on resume
7. **Memory pin** — high-priority capture so resumption finds it

## Method

1. **Snapshot conversation.** Last ~20 turns, distilled.
2. **Distil the seven items above** in a structured `pause.json` at `.siftcoder/checkpoints/pause-<ts>.json`.
3. **Memory capture** with `kind: pause`, `priority: high`. Pin so it surfaces on next session.
4. **Final summary** to user — quick recap so they know what was saved.

## Output shape

Written to `.siftcoder/checkpoints/pause-<ts>.json`:

```json
{
  "id": "pause-<ts>",
  "createdAt": "<ISO>",
  "openQuestion": "...",
  "progress": ["...", "..."],
  "hypothesis": "...",
  "deadEnds": [
    { "tried": "...", "result": "..." }
  ],
  "constraints": ["..."],
  "nextStep": "...",
  "memoryId": "summary:..."
}
```

User-facing:

```
Paused at: <ts>

Open question: <one line>
Progress so far:
  ✓ <item>
  ✓ <item>
Currently believing: <hypothesis>
Resume with: /siftcoder:continue <id>
                or  /siftcoder:continue (most recent)
```

## Rules

- **Capture dead ends explicitly.** Otherwise resumption re-explores them.
- **Constraint capture is mandatory.** "Cannot use X because Y" is what's hardest to recover from memory alone.
- **Memory pin priority high.** Routine summaries are low-priority; pauses are high.
- **Single concrete next step.** Not a list — one specific action to start on resume.

## Anti-patterns

- Pause that just says "continue from where we left off" (no info)
- Listing 10 next-steps (paralyses on resume)
- Forgetting dead ends (high-cost rediscovery)
- Long prose summary nobody reads on resume

## When NOT to use

- Trivial work (just remember it)
- End of project (use `/handoff` instead — different shape)
- Session that's a scratch exploration — losing it is fine

## Subagent dispatch

- None — pause is a synthesis of current conversation
- Memory MCP for the pin

## Value over native task tracking

Native task tracking captures todos. Pause captures **why** the todos exist — hypothesis, dead ends, constraints. The thinking-state IS the value.
