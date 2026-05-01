---
name: zen
description: Use when the user wants aggressive simplification — "delete what we don't need", "minimal code", "/zen". Delete-as-default. Removes dead code, abstractions earning their keep, scaffolding from when "we might need this".
---

# zen

Less is more. Delete first; build only what's load-bearing.

## Method

1. **Inventory.** Read the target area. List every file/symbol/abstraction. Note for each:
   - **Used by** how many other places?
   - **Last touched** when?
   - **Tested** how thoroughly?
2. **Score for deletion.** Candidates:
   - 0 uses → delete
   - 1 use, last touched > 6 months → delete; inline at the use site
   - Abstraction with one concrete impl → delete the abstraction; use the impl directly
   - Scaffolding "for future use" → delete; YAGNI
   - Dead branches (unreachable code) → delete
   - Defensive checks for impossible conditions (internal-only callers always pass valid input) → delete
3. **Confirm with user** for anything user-facing or that crosses a module boundary. **Internal-only** deletions can proceed.
4. **Delete.** One concept per commit.
5. **Verify.** Tests stay green. If a test was the only thing keeping the dead code alive — delete the test too (the behaviour was never used).
6. **Re-measure.** Lines deleted, abstractions removed, files removed.

## Output shape

```
Target:    <module/area>
Inventory: <N symbols, M files>

Deleted:
  - <file/symbol> — reason
  - <file/symbol> — reason
  ...

Inlined:
  - <abstraction> → <concrete site>

Score:     <-X lines, -Y files, -Z abstractions>
Tests:     <M passing, N before, P deleted>
```

## Rules

- **Defaults to delete.** Burden of proof is on keeping, not removing.
- **No "might need it later".** When you need it, you'll write it then. Memory will remember the prior version.
- **Capture deletion to memory** with full content of what was deleted, so it's recoverable from the log.
- **Public API** — confirm with user. **Internal** — proceed.
- **Test that asserts implementation detail** of deleted code → also delete.
- **Comments explaining deleted code** → delete the comment too.

## Anti-patterns

- Keeping a wrapper "for consistency" when there's only one wrapper
- Keeping a flag for a feature that's been on for 2 years
- Keeping an abstraction layer with one impl
- Keeping `_unused` parameters
- Keeping `// removed in PR #123` comments

## When NOT to use

- Active refactor in progress — finish that first
- Library/SDK code with external consumers — public API needs deprecation, not deletion
- Bug fix — different workflow

## Subagent dispatch

- `Explore` to inventory and find use counts
- `general-purpose` to perform the deletions
- `archaeologist` if "I think this used to be used" — confirms history before delete

## Memory capture

Every deleted symbol gets captured with full content + reason. The provenance edge marks the deletion. Future `mem_search` retrieves "what did we delete from <module>" — recovery is one query away.

## Value over native CC

CC won't aggressively delete on its own. CC tends toward additive suggestions ("you could also..."). This skill flips the default. The bias IS the value.
