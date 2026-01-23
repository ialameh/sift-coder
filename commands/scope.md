---
description: Manage boundaries for fix/optimize workflows - show, add, remove files
argument-hint: <show|add|remove|suggest> [file-path]
allowed-tools: Read, Write, Bash, Glob, Grep
---

# siftcoder Scope - Boundary Management

## Command

**$ARGUMENTS**

## Actions

### `show`
Display current boundaries:
- Modifiable files
- Protected files
- Must-pass tests

### `add <file>`
Add a file to the modifiable scope:
- File will be writable during fix/optimize
- Related tests should be considered

### `remove <file>`
Remove a file from modifiable scope:
- File becomes protected
- Cannot be modified during fix/optimize

### `suggest`
AI analyzes the current task and suggests:
- Files that should be modifiable
- Files that should be protected
- Tests that must pass

## Current Boundaries

Boundaries are stored in `.claude/siftcoder-state/boundaries.json`:

```json
{
  "modifiable": [
    "List of files that can be modified"
  ],
  "protected": [
    "**/*"
  ],
  "must_pass_tests": [
    "Tests that must pass after changes"
  ]
}
```

## Enforcement

Boundaries are enforced by the PreToolUse hook:
- Write/Edit to protected files → BLOCKED
- Coder agent finds alternative approaches
- All blocked attempts are logged

## Examples

```bash
# View current scope
/siftcoder:scope show

# Add a file to modifiable list
/siftcoder:scope add src/utils/helpers.ts

# Remove a file (make it protected)
/siftcoder:scope remove src/config/secrets.ts

# Get AI suggestions for scope
/siftcoder:scope suggest
```

## Now: Execute Scope Command

Processing: `$1` `$2`...
