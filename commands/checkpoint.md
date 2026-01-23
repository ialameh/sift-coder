---
description: Save and restore named checkpoints with full context
argument-hint: save|list|restore|delete <name-or-id>
allowed-tools: Read, Write, Edit, Bash, Glob
---

# /siftcoder:checkpoint - Save/Restore Points

Create named checkpoints during work that can be restored later, with full context including state, boundaries, git state, and progress.

## Usage

```
/siftcoder:checkpoint save "before refactor"     - Create checkpoint
/siftcoder:checkpoint save --auto                - Auto-name with timestamp
/siftcoder:checkpoint list                       - Show all checkpoints
/siftcoder:checkpoint show <id>                  - Show checkpoint details
/siftcoder:checkpoint restore <id>               - Restore to checkpoint
/siftcoder:checkpoint delete <id>                - Delete a checkpoint
/siftcoder:checkpoint clean --older-than 7d      - Clean old checkpoints
```

## Instructions

### Command: `save`

Create a new checkpoint with the given name/description.

#### Step 1: Gather Current State

Collect all relevant state:

```bash
# Git state
git rev-parse HEAD              # Current commit
git status --porcelain          # Uncommitted changes
git stash list                  # Any stashes
git branch --show-current       # Current branch

# siftcoder state
cat .claude/siftcoder-state/current-task.json
cat .claude/siftcoder-state/features.json
cat .claude/siftcoder-state/boundaries.json
cat .claude/siftcoder-state/focus.json
```

#### Step 2: Create Checkpoint

Generate checkpoint JSON:

```json
{
  "id": "chk-1705069200",
  "name": "before refactor",
  "createdAt": "2026-01-12T15:00:00Z",
  "git": {
    "commit": "abc123def456",
    "branch": "feature/auth",
    "uncommittedFiles": ["src/auth/login.ts", "src/api/routes.ts"],
    "stashCount": 0
  },
  "siftcoder": {
    "mode": "build",
    "phase": "coding",
    "currentFeature": "feat-auth-login",
    "currentSubtask": 3,
    "totalSubtasks": 7,
    "boundaries": {
      "modifiable": ["src/auth/*", "src/api/routes.ts"],
      "protected": ["src/core/*"]
    },
    "focus": {
      "type": "feature",
      "target": "feat-auth-login"
    }
  },
  "files": {
    "modified": ["src/auth/login.ts", "src/api/routes.ts"],
    "checksums": {
      "src/auth/login.ts": "sha256:abc123...",
      "src/api/routes.ts": "sha256:def456..."
    }
  }
}
```

#### Step 3: Save Checkpoint

```bash
mkdir -p .claude/siftcoder-state/checkpoints
echo '<checkpoint-json>' > .claude/siftcoder-state/checkpoints/chk-1705069200.json

# Also create git stash for uncommitted changes
git stash push -m "siftcoder-checkpoint: chk-1705069200"
```

#### Step 4: Confirm

```
CHECKPOINT SAVED

ID:          chk-1705069200
Name:        "before refactor"
Time:        2026-01-12 15:00:00

State captured:
  Git commit:   abc123d (feature/auth)
  Uncommitted:  2 files (stashed)
  Task:         feat-auth-login (subtask 3/7)
  Boundaries:   2 modifiable, 1 protected
  Focus:        feat-auth-login

Restore with:
  /siftcoder:checkpoint restore chk-1705069200
```

---

### Command: `list`

Show all available checkpoints:

```
CHECKPOINTS

ID                  Name                    Created              Git Branch
───────────────────────────────────────────────────────────────────────────
chk-1705069200      before refactor         2 hours ago          feature/auth
chk-1705055600      after auth complete     6 hours ago          feature/auth
chk-1704969600      initial setup           1 day ago            main
chk-1704883200      before payment work     2 days ago           feature/payments

Total: 4 checkpoints

Commands:
  /siftcoder:checkpoint show <id>     - View details
  /siftcoder:checkpoint restore <id>  - Restore to checkpoint
  /siftcoder:checkpoint delete <id>   - Remove checkpoint
```

---

### Command: `show <id>`

Display detailed checkpoint information:

```
CHECKPOINT DETAILS

ID:      chk-1705069200
Name:    before refactor
Created: 2026-01-12 15:00:00 (2 hours ago)

┌─ GIT STATE ──────────────────────────────────────────────────┐
│                                                              │
│  Branch:   feature/auth                                      │
│  Commit:   abc123d "Add login endpoint"                     │
│  Status:   2 uncommitted files (stashed)                    │
│                                                              │
│  Uncommitted:                                                │
│    M  src/auth/login.ts                                     │
│    M  src/api/routes.ts                                     │
│                                                              │
└──────────────────────────────────────────────────────────────┘

┌─ SIFTCODER STATE ────────────────────────────────────────────┐
│                                                              │
│  Mode:     build                                             │
│  Phase:    coding                                            │
│  Feature:  feat-auth-login (subtask 3/7)                    │
│                                                              │
│  Boundaries:                                                 │
│    Modifiable: src/auth/*, src/api/routes.ts                │
│    Protected:  src/core/*                                   │
│                                                              │
│  Focus:    feature: feat-auth-login                         │
│                                                              │
└──────────────────────────────────────────────────────────────┘

Restore with:
  /siftcoder:checkpoint restore chk-1705069200
```

---

### Command: `restore <id>`

Restore to a previous checkpoint:

#### Step 1: Confirm with User

```
RESTORE CHECKPOINT

You are about to restore to:
  ID:      chk-1705069200
  Name:    before refactor
  Created: 2 hours ago

This will:
  [1] Reset git to commit abc123d
  [2] Apply stashed changes from checkpoint
  [3] Restore siftcoder state (task, boundaries, focus)
  [4] DISCARD current uncommitted changes

Current uncommitted changes (will be LOST):
  M  src/auth/login.ts (15 lines changed)
  M  src/auth/session.ts (8 lines changed)
  A  src/auth/oauth.ts (new file)

Create a checkpoint of current state first?
  /siftcoder:checkpoint save "before restore"

Proceed with restore? [Yes / No / Save first]
```

#### Step 2: Perform Restore

```bash
# Stash current changes (optional backup)
git stash push -m "pre-restore-backup"

# Reset to checkpoint commit
git checkout <checkpoint-commit>

# Apply checkpoint stash
git stash apply stash@{<checkpoint-stash-index>}

# Restore siftcoder state files
cp .claude/siftcoder-state/checkpoints/chk-xxx/current-task.json .claude/siftcoder-state/
cp .claude/siftcoder-state/checkpoints/chk-xxx/boundaries.json .claude/siftcoder-state/
cp .claude/siftcoder-state/checkpoints/chk-xxx/focus.json .claude/siftcoder-state/
```

#### Step 3: Confirm Restore

```
CHECKPOINT RESTORED

Restored to: chk-1705069200 "before refactor"

Git:
  Now at commit: abc123d "Add login endpoint"
  Uncommitted files restored: 2

siftcoder State:
  Mode:     build
  Phase:    coding
  Feature:  feat-auth-login (subtask 3/7)
  Focus:    feat-auth-login

You can now continue from this point:
  /siftcoder:continue

Or see status:
  /siftcoder:status
```

---

### Command: `delete <id>`

Remove a checkpoint:

```
DELETING CHECKPOINT

ID:   chk-1705069200
Name: before refactor

This will:
  - Remove checkpoint metadata
  - Drop associated git stash (if any)

Proceed? [Yes / No]
```

After confirmation:
```
Checkpoint chk-1705069200 deleted.
```

---

### Command: `clean`

Remove old checkpoints:

```
/siftcoder:checkpoint clean --older-than 7d
```

```
CLEANING CHECKPOINTS

Criteria: Older than 7 days

Found 3 checkpoints to remove:
  chk-1704536400  "initial attempt"    (10 days ago)
  chk-1704622800  "broken state"       (9 days ago)
  chk-1704709200  "test checkpoint"    (8 days ago)

Remove these 3 checkpoints? [Yes / No]
```

---

## Auto-Checkpoints

siftcoder automatically creates checkpoints before risky operations:

| Operation | Auto-Checkpoint |
|-----------|-----------------|
| `/siftcoder:fix` start | `auto: before fix` |
| `/siftcoder:refactor` | `auto: before refactor` |
| `/siftcoder:migrate` | `auto: before migration` |
| QA failure, about to fix | `auto: before qa-fix` |

Auto-checkpoints are named with prefix `auto:` and can be cleaned separately:

```
/siftcoder:checkpoint clean --auto-only --older-than 3d
```

---

## Storage Structure

```
.claude/siftcoder-state/
└── checkpoints/
    ├── index.json                    # List of all checkpoints
    ├── chk-1705069200.json          # Checkpoint metadata
    ├── chk-1705069200/              # Checkpoint data
    │   ├── current-task.json
    │   ├── boundaries.json
    │   ├── focus.json
    │   └── features.json
    └── ...
```

---

## Tips

```
CHECKPOINT BEST PRACTICES

When to checkpoint:
  - Before any major refactoring
  - Before experimental changes
  - When switching focus to different feature
  - Before running risky automated fixes

Naming conventions:
  "before <action>"     - Before risky operation
  "after <milestone>"   - Completed milestone
  "<feature> working"   - Known good state
  "wip: <context>"      - Work in progress

Managing checkpoints:
  - Keep 5-10 recent checkpoints
  - Use /siftcoder:checkpoint clean regularly
  - Auto-checkpoints are cleaned after 3 days by default

Quick workflow:
  /siftcoder:checkpoint save "before experiment"
  # ... try risky changes ...
  /siftcoder:checkpoint restore <id>  # if it fails
```
