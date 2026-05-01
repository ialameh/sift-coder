---
name: organize-project
description: Use to assess + improve project structure — folder layout, file placement, naming, separation of concerns. Read-mostly with structured proposal output. User approves before any moves.
---

# organize-project

Project-structure assessment and (with approval) reorganization. Diagnoses sprawl, proposes layout, applies only on user confirm.

## Method

1. **Inventory current.** Top-level dirs, file counts per dir, deepest paths, naming convention drift.
2. **Detect smells:**
   - Files-at-root sprawl (>15 top-level files)
   - Single-file dirs (folder with one file = noise)
   - Deeply nested paths (>5 levels)
   - Naming inconsistency (camelCase + kebab-case + snake_case mixed)
   - Orphan tests (test files without source pair, or vice versa)
   - Duplicate concerns across multiple folders
3. **Propose layout** matching project type:
   - Node lib: `src/`, `tests/`, `docs/`, `bin/`, `scripts/`
   - sfdx project: `force-app/main/default/{classes,lwc,objects,...}`
   - Rust: `src/`, `tests/`, `benches/`, `examples/`
   - Python: `src/<package>/`, `tests/`, `docs/`, `pyproject.toml`
4. **Diff.** Show what moves where. Group by reason.
5. **User approves.** Granular — accept all, accept some, reject.
6. **Apply** approved moves. Update import paths. Commit per group.

## Output shape (assess)

```
Project type detected: Node library

Smells:
  ✗ Root-level sprawl: 23 files at root
  ✗ Single-file dirs:  4 (config/, helpers/, types/, lib/)
  ⚠ Mixed naming:      camelCase + kebab-case in src/
  ✓ Tests paired:      all source files have test pairs

Proposed reorganization:
  Move:
    config/db.ts       → src/config/db.ts
    helpers/format.ts  → src/utils/format.ts
    types/api.ts       → src/types/api.ts
    lib/log.ts         → src/lib/log.ts
  Rename:
    src/UserService.ts → src/user-service.ts (kebab-case match)
    src/orderHelper.ts → src/order-helper.ts
  
  Effort: ~30 min including import updates
  
  Approve which: all | moves only | renames only | reject
```

## Rules

- **Don't auto-apply.** Always user-approve granular.
- **Update imports** after every move (atomically — single commit).
- **One move per commit** OR one logical group per commit (e.g. "move all helpers to utils/").
- **Detect convention from neighbouring projects** if the current is too sparse to inform.
- **Memory captures the reorg** so future similar projects reuse the layout.

## Anti-patterns

- Big-bang reorganisation in one commit (impossible to review)
- Moving without updating imports (broken builds)
- Imposing one stack's conventions on another (Rust idioms on Node project)
- Renaming `*.test.ts` files (breaks vitest discovery — verify first)

## When NOT to use

- Greenfield (you set the structure as you go)
- Single-file projects (no structure to organise)
- Active feature work in progress (wait for landing)

## Subagent dispatch

- `Explore` for the inventory + diagnosis
- `general-purpose` for the actual moves
- `Bash` for `git mv` (preserves history)

## Value over native CC

CC will move files on request. CC won't naturally diagnose smells, propose project-type-appropriate layouts, or enforce import-update-atomicity. The structure-aware framing IS the value.
