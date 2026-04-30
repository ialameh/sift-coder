---
description: On-demand format / lint / type-check (replaces V1 PostToolUse 210s blocking chain)
argument-hint: [--tests] [--fix] [--report-only]
allowed-tools: Bash, Read, Edit
---

# /siftcoder:quality

Run quality gates **on demand**, not on every Write/Edit. Implements the `quality-check` skill.

## Flags

- `--tests` — also run the project test suite (slow; opt-in)
- `--fix` — auto-fix what's safe (prettier --write, eslint --fix, etc.)
- `--report-only` — surface findings, don't apply fixes

## Default behaviour

1. Detect project tooling (TS/JS, Python, Apex, Go, Rust, .NET).
2. Run format / lint / type-check in parallel.
3. Compact summary with file:line citations for failures.
4. Auto-fix safe issues unless `--report-only`.
5. Skip tests unless `--tests`.

## Salesforce projects

If `sfdx-project.json` is present, run `sf project deploy validate --source-dir force-app` and `sf code-analyzer run -t force-app`.

See `skills/quality-check/SKILL.md` for full rules.
