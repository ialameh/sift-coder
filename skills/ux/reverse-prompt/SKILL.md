---
name: reverse-prompt
description: Use when the user wants a single conversational prompt that would rebuild the current project from scratch. Three modes — Quick (file tree + names), Deep (full understanding), Focus (one feature only).
---

# Reverse-prompt skill

Generate a single conversational prompt — what you'd say to an agent to rebuild this project. Useful for: handoffs, "starting over from scratch", spec extraction, onboarding new contributors.

## Modes

- **Quick** — just structure (file tree, top-level names). Cheapest. ~500 tokens.
- **Deep** — full understanding (architecture, key files, data flow, conventions). ~3-5k tokens.
- **Focus &lt;area&gt;** — one feature/area only, with surrounding context. ~1-2k tokens.

## Process

1. **Determine mode.** If user says "quick", "deep", "focus on X" — use that. Otherwise default Deep.
2. **Cache check.** Compute fingerprint = sha1(top-level tree + manifest hash). Check `~/.siftcoder/reverse-prompt-cache/<fingerprint>.json`. If &lt; 24h old and matching mode — use it.
3. **Scan.**
   - Quick: `ls`, `cat package.json`, `cat README.md`. That's it.
   - Deep: launch Explore subagent to map architecture; read 5-10 key files; sample test files; check git log.
   - Focus: launch Explore on the named area only; ignore everything else.
4. **Synthesise** the prompt as second-person ("Build me a project that..."). Include:
   - Goal (1 sentence)
   - Stack (lang/framework/runtime)
   - Folder structure (compressed)
   - Key abstractions (named, with one-line responsibility each)
   - Conventions (naming, error handling, test style)
   - Build/test commands
   - Constraints / non-goals
5. **Cache** the result with fingerprint + ts.

## Output shape (Deep)

```
Build me a <one-line description>.

Stack: <lang> <framework> <runtime>

Project structure:
<compressed tree>

Key modules:
- <name>/ — <responsibility>
…

Conventions:
- <pattern 1>
- <pattern 2>

Build:    <cmd>
Test:     <cmd>
Lint:     <cmd>

Non-goals:
- <thing it deliberately doesn't do>
```

## Output shape (Quick)

A short paragraph + bare structure listing.

## Output shape (Focus)

Like Deep but scoped to the area, plus a "wires-into:" line listing what surrounds it in the parent project.

## Anti-patterns

- Don't just `cat` files into the prompt. Synthesise.
- Don't include secrets, env vars, or local paths.
- Don't generate &gt; 5k tokens for Deep — if the project is big, summarise harder.
