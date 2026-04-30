---
name: archaeologist
description: Use when the user asks "why does this exist", "why is this here", "what's the history of X", or wants to understand the reasoning behind code that looks weird. Triangulates git history + memory + code reading. Read-only.
---

# archaeologist

Three sources, one answer: **git history** (what), **memory provenance** (why), **code structure** (how it's used now).

## Method

1. **Locate.** Pin down the exact symbol/file/block in question. If ambiguous, ask once.
2. **Memory pass.** `mem_why { id }` if a memory id is at hand; else `mem_search { query: "<symbol or area>", k: 8 }`. Capture decisions/discussions about this code.
3. **Git pass.** `git log --follow -p -- <path>` for the file. `git log -S "<symbol>"` for when the symbol entered the codebase. `git blame -w` for current authorship. Read the **introducing commit** message.
4. **Reference pass.** `Grep` for current callers — is this still used? By whom? Is it load-bearing or vestigial?
5. **Synthesise.** One paragraph: *Why* it exists, *when* it changed, *who* depends on it now, *whether* it's still earning its keep.

## Output shape

```
Subject:    <file:line — symbol>

Origin:     <introducing commit SHA, date, author, message tl;dr>
Memory:     <prior decisions found, w/ summary ids>
Evolution:  <key commits that reshaped it>
Now:        <current callers — count + paths>

Verdict:
  Earning its keep?      <yes|no|inconclusive>
  Still relevant?        <yes|no>
  Recommended action:    <keep | refactor | delete | investigate further>

Captured to memory:      <new summary id>
```

## Rules

- Cite commits by SHA. Cite memory by summary id. Cite code by file:line.
- Triangulate. Memory alone or git alone is not enough. The interesting cases are when memory and git **disagree**.
- Don't speculate beyond evidence. "Inconclusive" is fine.
- Don't refactor or delete during archaeology. Surface the recommendation; let the user act.

## Anti-patterns

- Reading only `git blame` (shows current author, not original reasoning)
- Reading only memory (may be stale; verify against current code)
- Speculating "probably for X" — find evidence or say inconclusive
- Drifting into a refactor

## When NOT to use

- Active bug fix — `/siftcoder:fix` (might use archaeology as a sub-step)
- "Show me what this does" → `/siftcoder:investigate` or `/siftcoder:narrator`
- "What should we build" → `/siftcoder:ideate`

## Subagent dispatch

- `Explore` for code-reference mapping
- `general-purpose` for git log scraping
- The `archaeologist` agent (if installed) for full report

## Value over native CC

CC will read code and run git. CC won't naturally cross-reference git ↔ memory ↔ current usage and surface contradictions. The triangulation IS the value — finding the "the commit message says X but memory says Y and current usage suggests Z" cases.
