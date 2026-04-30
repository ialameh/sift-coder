---
name: checkpoint
description: Use to save a named savepoint with richer context than a git tag — captures intent, current scope, memory pin. Restorable. "Save a checkpoint", "snapshot before X".
---

# checkpoint

Named savepoint. Richer than `git tag` — captures *intent*, *scope*, *memory state* alongside the commit.

## Method

1. **Name + reason.** Required. "pre-auth-refactor — before the big auth rename".
2. **Snapshot:**
   - Git: SHA of HEAD (or stash if dirty)
   - Scope: copy of `.siftcoder/scope.json`
   - Memory: pin top-N memory items by recency
   - Notes: user's reason
3. **Persist** to `.siftcoder/checkpoints/<id>.json` via the V3 `StateManager` service (`src/services/state.ts`).
4. **Memory capture** with `kind: checkpoint`.

## Restore method

1. **List.** `siftcoder mem list-checkpoints` or via the skill.
2. **Pick.**
3. **Confirm.** Restore SHA via `git checkout` (worktree preferred) + restore scope + surface memory pins.

## Output shape (save)

```
Saving checkpoint:    <name>
Reason:               <user's text>

Git:                  HEAD = <SHA7>
Scope:                <allow N | deny M> patterns captured
Memory pinned:        <top 5 summary ids>

Saved as:             cp-<ts>
Restore with:         /siftcoder:checkpoint restore cp-<ts>
```

## Output shape (list)

```
Checkpoints (most recent first):

  cp-1746121800  pre-auth-refactor    (2026-05-01 10:30)
                 Before the big auth rename
                 SHA <sha7>  Scope <ok>
  cp-...
```

## Output shape (restore)

```
Restoring:    cp-1746121800 (pre-auth-refactor)

Worktree:     created at ../siftcoder-cp-1746121800
Scope:        restored to <allow patterns>
Memory:       resurfaced 5 pinned items
              <ids>

Cleanup when done:    git worktree remove ../siftcoder-cp-1746121800
```

## Rules

- **Worktree, not in-place checkout.** Restoring without worktree clobbers current state.
- **Name + reason mandatory.** Anonymous checkpoints rot.
- **Memory pins capture intent.** Future "what was X about" queries find them.
- **Don't auto-prune old checkpoints.** Manual via `memory-curator` agent.

## Anti-patterns

- `git tag` alone (no scope/memory/intent capture)
- Restore without worktree
- Checkpoints named "wip" / "save" (no reason = useless)
- Auto-pruning (loss of history)

## When NOT to use

- Trivial saves — `git stash` is faster
- End of session — `/handoff` covers
- Mid-thought freeze — `/pause` covers

## Subagent dispatch

- None — uses `src/services/state.ts` directly
- Memory MCP for the pin

## Value over native CC + git

Git tags capture commit + name. Checkpoints capture commit + name + scope + memory pins + reason. The intent layer IS the value — restoring later, you know *why* this point mattered.
