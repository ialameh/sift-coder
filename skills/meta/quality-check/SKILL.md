---
name: quality-check
description: Use when the user finishes a code change and wants format / lint / type-check / tests run together, or asks "is this clean?" / "any issues?". On-demand replacement for prior chained quality gates.
---

# On-demand quality check

Prior plugins ran format + lint + type-check on every Write/Edit via PostToolUse hooks, adding ~3.5min latency per edit. SiftCoder replaces that with this on-demand skill.

## Default sequence

Detect tooling from the project root, then run in parallel:

1. **Format check** — `prettier --check`, `dotnet format --verify-no-changes`, `gofmt -l`, `cargo fmt --check`, `apex-format` (sf-cli) — pick what exists.
2. **Lint** — `eslint`, `tsc --noEmit` (for TS), `pylint`/`ruff`, `golangci-lint`, `cargo clippy`, `pmd` (Apex) — pick what exists.
3. **Type-check** — `tsc --noEmit`, `mypy`, `pyright`, `cargo check` — pick what exists.
4. **Tests** — only if the user said "test" or "run tests". Otherwise skip; tests can be slow.

## Pattern

Use the `Bash` tool with multiple parallel calls in one message. Report a compact summary:

```
✓ format    no diffs
✗ lint      3 errors in src/foo.ts:14, src/bar.ts:7, src/bar.ts:22
✓ types     ok
- tests     skipped (use /siftcoder:quality --tests)
```

If there are failures, **fix them** unless the user said report-only.

## Salesforce projects

For sfdx projects, the canonical chain is:

```bash
sf project deploy validate --source-dir force-app
sf code analyzer run -t force-app
npx prettier --check 'force-app/**/*.{cls,trigger,xml}'
```

Use `sfdx scanner:run` for legacy orgs; `sf code-analyzer run` for v2.

## When to skip

- User is mid-thought, hasn't asked for it.
- Change is a comment or doc-only edit.
- Pre-commit hook will run it anyway.
