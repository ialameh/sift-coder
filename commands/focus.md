---
description: Focus siftcoder on a specific feature, area, or file set
argument-hint: <feature-id|area-path|"query">
allowed-tools: Read, Write, Bash, Glob, Grep
---

# /siftcoder:focus - Set Implementation Focus

Narrow siftcoder's attention to a specific feature, code area, or set of files.

## Usage

```
/siftcoder:focus <target>
/siftcoder:focus show          - Show current focus
/siftcoder:focus clear         - Remove focus constraints
/siftcoder:focus list          - List available targets
```

## Target Types

### Focus on a Feature
```
/siftcoder:focus feat-auth-login
/siftcoder:focus "user authentication"
```

### Focus on a Directory/Area
```
/siftcoder:focus src/auth/
/siftcoder:focus ./api/routes/
```

### Focus on Specific Files
```
/siftcoder:focus src/auth/login.ts,src/auth/session.ts
```

## Instructions

### If `$ARGUMENTS` is "show":

Read current focus from `.claude/siftcoder-state/focus.json`:

```
CURRENT FOCUS

Type:      [feature|area|files|none]
Target:    [feature name / path / file list]
Set at:    [timestamp]

Scope:
 Files:     [N] files in focus
 Features:  [N] features matching

Related context:
 Patterns:  [N] patterns for this area
 Gotchas:   [N] known issues

Clear with: /siftcoder:focus clear
```

### If `$ARGUMENTS` is "clear":

```bash
rm -f .claude/siftcoder-state/focus.json
./siftcoder/scripts/state-manager.sh log "focus_cleared" '{}'
```

```
Focus cleared. Now operating on full codebase.
```

### If `$ARGUMENTS` is "list":

Show available focus targets:

```
AVAILABLE FOCUS TARGETS

Features (from features.json):
 [1] feat-auth-login      - User login flow (in_progress)
 [2] feat-auth-register   - User registration (pending)
 [3] feat-payments        - Payment processing (pending)

Directories (from codebase):
 [4] src/auth/            - 12 files
 [5] src/api/             - 24 files
 [6] src/services/        - 8 files
 [7] src/components/      - 45 files

Recent areas (from implementation log):
 [8] src/auth/login.ts    - Last modified today
 [9] src/api/users.ts     - Last modified today

Usage: /siftcoder:focus <number or name>
```

### If `$ARGUMENTS` is a feature ID or name:

1. Search features.json for matching feature
2. Load feature's file associations if available
3. Set focus state:

```bash
cat > .claude/siftcoder-state/focus.json << 'EOF'
{
  "type": "feature",
  "target": "[feature-id]",
  "featureName": "[feature title]",
  "associatedFiles": ["file1.ts", "file2.ts"],
  "associatedDirs": ["src/auth/"],
  "setAt": "[ISO timestamp]"
}
EOF
```

```
FOCUS SET: Feature

Feature:    [feature name]
ID:         [feature-id]
Status:     [pending/in_progress/completed]

Associated files:
 src/auth/login.ts
 src/auth/session.ts
 src/api/routes/auth.ts

Now all siftcoder commands will prioritize this feature.

Commands affected:
 /siftcoder:fix      - Will scope to feature files
 /siftcoder:status   - Will show feature progress
 /siftcoder:continue - Will resume this feature
```

### If `$ARGUMENTS` is a path:

1. Validate path exists
2. Count files in scope
3. Set focus state:

```bash
cat > .claude/siftcoder-state/focus.json << 'EOF'
{
  "type": "area",
  "target": "[path]",
  "files": ["list", "of", "files"],
  "fileCount": [N],
  "setAt": "[ISO timestamp]"
}
EOF
```

```
FOCUS SET: Area

Path:       [path]
Files:      [N] files
Languages:  [TypeScript, Python, etc.]

Included:
 src/auth/login.ts
 src/auth/session.ts
 src/auth/middleware.ts
 ... and [N-3] more

Now all siftcoder commands will operate within this area.
```

### If `$ARGUMENTS` is a comma-separated file list:

```bash
cat > .claude/siftcoder-state/focus.json << 'EOF'
{
  "type": "files",
  "target": "explicit",
  "files": ["file1.ts", "file2.ts"],
  "setAt": "[ISO timestamp]"
}
EOF
```

```
FOCUS SET: Specific Files

Files: [N] files
 [1] src/auth/login.ts
 [2] src/auth/session.ts

All modifications will be limited to these files.
```

## How Focus Affects Other Commands

| Command | Behavior with Focus |
|---------|---------------------|
| `/siftcoder:fix` | Only modifies files in focus |
| `/siftcoder:status` | Shows focus area progress |
| `/siftcoder:continue` | Resumes focused feature |
| `/siftcoder:missing` | Checks missing in focus only |
| `/siftcoder:gap-analysis` | Analyzes focused area |
| `/siftcoder:scope` | Automatically limits to focus |

## Focus + Boundaries

Focus works with but is different from boundaries:

- **Focus**: What you're working on (priority/attention)
- **Boundaries**: What you CAN modify (permission)

You can set focus to a feature while having broader boundaries, or vice versa.

## Tips

```
FOCUS TIPS

Quick focus:
  /siftcoder:focus 1    - Focus on first listed item
  /siftcoder:focus .    - Focus on current directory

Smart focus:
  /siftcoder:focus "payments"  - Fuzzy match features/areas

Check focus before work:
  /siftcoder:focus show - See current focus
  /siftcoder:status     - Shows focused progress

Combining with other commands:
  /siftcoder:focus src/auth && /siftcoder:fix "login bug"
```
