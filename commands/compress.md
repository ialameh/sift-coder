---
description: Toggle output compression mode (lite|full|ultra|dense|handoff|commit|review|off)
argument-hint: [mode]
---

# /siftcoder:compress

Activate or change output compression. Default `full`. Persists for the session.

Modes documented in `skills/meta/compression/SKILL.md`.

If the `sift-compress` companion plugin is installed, defer to it for cross-session mode state. Otherwise apply the skill rules inline.
