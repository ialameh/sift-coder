---
name: onboard
description: Use for first-time SiftCoder setup or onboarding a new user/project. Walks through Ollama probe, memory daemon start, scope setup, optional backfill. Opinionated, single happy path.
---

# onboard

First-session walkthrough. Opinionated. Single happy path. The user lands working in &lt; 5 minutes.

## Method

1. **State current.** Detect:
   - Plugin installed? (presence of `.claude-plugin/plugin.json` in plugin root)
   - Ollama present? (`curl http://localhost:11434/api/tags`)
   - `ANTHROPIC_API_KEY` set?
   - Memory daemon running? (`siftcoder status`)
   - Project has `.siftcoder/` dir?
2. **Recommend path:**
   - **Has Ollama** → `/siftcoder:mem setup` w/ Ollama defaults
   - **Has key, no Ollama** → setup with Anthropic fallback; suggest installing Ollama for cost reduction
   - **Has neither** → walk through Ollama install (recommended) or Anthropic key (faster)
3. **Start daemon.** `siftcoder start`. Verify socket.
4. **Optional backfill.** If user has prior CC sessions, offer `siftcoder backfill --from-v2` (when implemented) or `siftcoder backfill transcripts`.
5. **First task.** Suggest a real task: "try `/siftcoder:reverse-prompt quick` to map this project."

## Output shape

```
SiftCoder onboarding
====================

✓ Plugin installed
✓ Ollama detected at http://localhost:11434
✓ Anthropic key set (fallback ready)
○ Memory daemon: not running (will start)
○ Project: .siftcoder/ not present (will create)

Plan:
  1. Run `siftcoder setup` to configure
  2. Start daemon
  3. Optional: backfill memory from past sessions
  4. Try `/siftcoder:reverse-prompt quick` for a fast project map

Proceed? [y/N]
```

## Rules

- **One happy path.** Don't list 5 options at every step; pick the best for the detected state.
- **Detect, don't ask.** Probe environment first; ask only when truly ambiguous.
- **Land working.** End with a concrete next-action that exercises the install.
- **Capture onboarding to memory** so re-onboarding doesn't reprobe everything.

## Anti-patterns

- Long menus instead of detection
- Skipping the "first real task" suggestion (leaves user wondering "what now?")
- Failing silently if a step doesn't work
- Re-onboarding without checking previous state

## When NOT to use

- Already onboarded (return early on detect)
- Just upgrading — `/siftcoder:mem setup` directly
- Pure reference question — `/help` style

## Subagent dispatch

- `Bash` for environment probes
- Memory MCP for capturing the onboard event

## Value over native CC

CC has no native onboarding for plugins. This skill provides the opinionated single-path setup that gets users working fast. The opinionated framing IS the value.
