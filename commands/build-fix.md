---
description: Auto-resolve build errors with minimal-diff fix. Different from /heal (multi-strategy retry). See skills/coding/build-fix/SKILL.md
argument-hint: [build-command]
allowed-tools: Read, Edit, Write, Bash, Grep, Glob
---

# /siftcoder:build-fix

Build is failing → fix it with the smallest possible diff.

Classifies the first failure (cascade-pruned), hypothesises a minimal-diff fix, applies, re-runs. Caps at 2 attempts then escalates to `/siftcoder:heal`.

See `skills/coding/build-fix/SKILL.md` for full workflow contract.
