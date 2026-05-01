---
name: build-fix
description: Use to auto-resolve build errors. Reads compiler/linker/bundler output, classifies, suggests minimal-diff fixes. Different from /heal (which is multi-strategy retry across build/test/lint).
---

# build-fix

Single-purpose: build is failing, you want it green with the smallest possible diff.

## Method

1. **Capture full build output.** Stdout + stderr from the failing command.
2. **Classify** the first failure (later failures often cascade from first):
   - **Type error** (TS / Flow) → narrow to file:line, propose annotation/cast/refactor
   - **Module not found** → missing dep / wrong import path / case mismatch
   - **Syntax error** → fix the file:line directly
   - **Linker / native binding** → check rebuild scripts, postinstall
   - **Bundler config** → tsconfig / vite.config / webpack.config issue
   - **Codegen** → schema/proto/openapi out of date
3. **Hypothesise minimal-diff fix.**
4. **Apply.**
5. **Re-run build.** Pass → done. Fail → if same error after distinct strategy, escalate via `/heal`.
6. **Categorise for memory.** Future `build-fix` runs hit the cache for the same error class.

## Output shape

```
Build cmd:       <command>
Output (head):   <first 30 lines>

Classification:  <type error | module not found | syntax | linker | config | codegen>
Fault:           <file:line>

Hypothesis:      <one-line>
Fix:             <minimal diff>

Re-run:
  Status:        ✓ build green  |  ✗ same error  |  ✗ new error
  
If new error:    chained build-fix run
If same error:   escalate to /siftcoder:heal (multi-strategy)

Captured:        <memory id — error → fix mapping>
```

## Rules

- **Minimal diff.** Adding `// @ts-ignore` is a smell, not a fix — only acceptable with reason in commit message.
- **One error at a time** (cascade pruning — first error often unblocks others).
- **Don't loop on same strategy.** Cap at 2 attempts; escalate.
- **Memory captures error→fix.** Repeat builds hit the cache.
- **No silent type weakening.** If a fix involves casting to `any`, surface explicitly to user.

## Anti-patterns

- Mass `// @ts-ignore` to make build pass
- Bumping a dep to "any version that works" without reading changelog
- Disabling the failing rule in eslint config instead of fixing the code
- Touching unrelated files because "they were also broken"

## When NOT to use

- Multi-strategy auto-recovery → `/siftcoder:heal`
- Test failures (not build) → `/siftcoder:fix` or `/heal`
- Architecture-shaped problem (build broken because design is wrong) → `/investigate` first

## Subagent dispatch

- `Bash` to run build
- `Explore` to find the fault location
- `general-purpose` for the diff
- Memory MCP for prior similar errors

## Value over native CC

CC will fix build errors on request. CC doesn't always classify error class first, doesn't enforce minimal-diff discipline, won't refuse type-weakening shortcuts. The discipline IS the value.
