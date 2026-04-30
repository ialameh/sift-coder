---
name: timewarp
description: Use to reconstruct application/codebase state at a past commit, branch, or moment. "What did this look like 3 weeks ago", "go back to before the auth refactor". Read-only — uses git worktree to avoid disturbing current work.
---

# timewarp

State reconstruction debugging. Walk back to a past state cleanly via git worktree. Investigate without polluting current work.

## Method

1. **Pin the moment.** User specifies one of:
   - SHA: `git checkout <sha>`
   - Date: `git rev-list -n1 --before="<date>" main`
   - Tag/branch: `<ref>`
   - "Before X": `git log -S "<symbol>" --before` to find when X was introduced
2. **Worktree.** `git worktree add ../timewarp-<ref> <ref>`. Never check out in-place — that disturbs current state.
3. **Reproduce build.** `cd` to worktree; `npm install` (or equivalent). Note: deps may be older.
4. **Investigate.** What's the question? Run, query, read files in the worktree.
5. **Compare** (optional). Diff between worktree and current to highlight what changed.
6. **Cleanup.** `git worktree remove ../timewarp-<ref>` when done.

## Output shape

```
Anchored at:    <ref> (<sha7>, <date>)
Worktree:       <path>

Reproduction:
  Build:        <command>
  Status:       ✓ green | ✗ <error>

Findings:
  <answers to user's question, w/ file:line citations from past state>

Diff vs current (if requested):
  <key differences>

Cleanup:        <command>
```

## Rules

- **Always use a worktree.** Never check out a past ref in the active workspace.
- **Note dep drift.** Old code may have old deps; install may differ.
- **Read-only investigation.** Do not modify the past worktree as if it were current.
- **Cleanup is mandatory.** Don't leave worktrees lingering.
- Memory captures the timewarp result so it's reusable.

## Anti-patterns

- `git checkout <sha>` in the main worktree (loses current state if uncommitted)
- Modifying the historical worktree expecting it to merge back
- Not running `npm install` and getting confused by missing modules
- Forgetting cleanup; worktrees pile up

## When NOT to use

- "Show me the diff" — `git diff` directly
- Restoring deleted code — `/siftcoder:zen` undo via git, not timewarp
- Performance over time — needs benchmarking framework, not just reconstruction

## Subagent dispatch

- `Explore` inside the worktree once it's created
- `Bash` for the worktree management
- `Agent` with `isolation: "worktree"` is a natural fit if you want a sub-agent to do the timewarp investigation

## Value over native CC

CC will run git commands. CC won't naturally enforce worktree-isolation discipline, install deps, and clean up afterwards. The discipline keeps current work safe.
