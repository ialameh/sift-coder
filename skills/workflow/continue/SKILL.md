---
name: continue
description: Use to resume from /pause. Reads the pause state, injects relevant memory context, and proposes the next concrete step. Pairs with /pause skill.
---

# continue

Resume from `/pause`. Inverse operation. Reads pause state, refreshes memory context, proposes next move.

## Method

1. **Locate pause.** User specifies `<id>` or "most recent".
2. **Load `pause-<id>.json`** from `.siftcoder/checkpoints/`.
3. **Memory refresh.** `mem_get { id: pause.memoryId }`. Also `mem_search` for activity since the pause (any progress someone else made? any new constraints?).
4. **Verify state.** Has the codebase changed since pause? `git log --since=<pause.createdAt>`. Major changes invalidate the dead-end list.
5. **Propose resume.** Summarise the pause + propose the next concrete step + confirm with user.
6. **Mark resumed.** Update memory: `kind: pause`, `status: resumed`.

## Output shape

```
Resuming: pause-<id> (from <ISO>)

Original open question:    <pause.openQuestion>
Progress at pause:
  ✓ <item>
Hypothesis at pause:       <pause.hypothesis>

Since pause (X days ago):
  - <commits / activity>
  - <new memory items>

Dead ends still relevant: <count>
Constraints still hold:   <count>

Proposed next step:        <pause.nextStep>

Confirm to proceed, or describe variant?
```

## Rules

- **Verify state.** Codebase may have moved; pause's hypothesis may be stale.
- **Propose, don't auto-execute.** User confirms before resuming.
- **Memory updated.** Pause status moves to `resumed`.
- **List dead ends prominently.** They're the highest-value part of pause memory.

## Anti-patterns

- Resuming on a stale hypothesis without verification
- Ignoring activity since pause
- Bypassing the user-confirm step
- Re-exploring dead ends because they weren't surfaced

## When NOT to use

- No prior `/pause` to resume from
- Pause was about an abandoned thread — `/dream` for fresh thinking
- Better to start fresh — sometimes the right call

## Subagent dispatch

- None for the load step
- Memory MCP for refresh
- `general-purpose` for the next step if it's well-defined

## Value over native CC

CC has no native pause/resume. The pair `/pause` + `/continue` provides explicit session-bridging. The structured resumption (with verification) IS the value.
