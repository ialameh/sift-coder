# /siftcoder:rollback - Rollback to Checkpoint

Rollback to a previous checkpoint, undoing changes made during a feature or fix workflow.

## Usage

```
/siftcoder:rollback [checkpoint-id|feature-id]
```

## Arguments
- `$ARGUMENTS` - Optional checkpoint ID or feature ID. If not provided, shows available checkpoints.

## Instructions

You are managing rollback operations for siftcoder workflows.

### Without Arguments (List Checkpoints):
1. Read `.claude/siftcoder-state/checkpoints/` directory
2. Read `implementation-log.jsonl` for checkpoint events
3. Display available rollback points:
   ```
   🔄 AVAILABLE CHECKPOINTS

   Recent Checkpoints:
   ├── [cp-005] 2 hours ago
   │   Feature: auth-001 (completed)
   │   Files: 5 modified, 2 created
   │   Git ref: abc123
   │
   ├── [cp-004] 5 hours ago
   │   Feature: auth-001 (subtask 3 complete)
   │   Files: 3 modified
   │   Git ref: def456
   │
   └── [cp-003] 1 day ago
       Feature: setup-000 (completed)
       Files: 8 created
       Git ref: ghi789

   Usage: /siftcoder:rollback cp-004
   ```

### With Checkpoint ID:
1. Find checkpoint in state
2. Show what will be reverted:
   ```
   ⚠️ ROLLBACK PREVIEW

   Checkpoint: [cp-004]
   Created: 5 hours ago
   Git ref: def456

   Will Revert:
   ├── Modified Files (3):
   │   ├── src/auth/login.ts (restore previous version)
   │   ├── src/auth/session.ts (restore previous version)
   │   └── src/tests/auth.test.ts (restore previous version)
   │
   └── Created Files (2):
       ├── src/auth/oauth.ts (will be deleted)
       └── src/auth/tokens.ts (will be deleted)

   State Changes:
   ├── Feature auth-001: in_progress → pending
   └── Subtasks 4-5: will be removed

   [Confirm Rollback] [Cancel]
   ```

3. On confirmation:
   ```bash
   # Git rollback
   git checkout <git-ref> -- <files>
   # Or for full rollback:
   git reset --hard <git-ref>
   ```

4. Update state:
   - Restore features.json from checkpoint snapshot
   - Update current-task.json
   - Log rollback event to implementation-log.jsonl

5. Confirm:
   ```
   ✅ ROLLBACK COMPLETE

   Restored to: [cp-004] (5 hours ago)
   Files reverted: 5
   Features affected: 1

   Current State:
   ├── Feature auth-001: pending (subtasks 1-3 complete)
   └── Ready to continue from subtask 4

   Use /siftcoder:status to see current state.
   ```

### With Feature ID:
1. Find the checkpoint created at feature start
2. Rollback to pre-feature state
3. Remove feature from queue (or mark as "rolled_back")

## Checkpoint Structure

Each checkpoint in `.claude/siftcoder-state/checkpoints/`:
```json
{
  "id": "cp-005",
  "createdAt": "2026-01-10T15:00:00Z",
  "gitRef": "abc123def456",
  "featureId": "auth-001",
  "phase": "completed",
  "trigger": "feature_complete",
  "filesModified": ["path1", "path2"],
  "filesCreated": ["path3"],
  "stateSnapshot": {
    "features": { ... },
    "currentTask": { ... }
  }
}
```

## Rollback Safety

1. **Pre-rollback Backup**
   - Create automatic checkpoint of current state before rollback
   - Allows "undo rollback" if needed

2. **Dirty Working Directory**
   - If uncommitted changes exist, warn user:
     ```
     ⚠️ Uncommitted changes detected!

     Modified files:
     ├── src/config.ts
     └── src/utils.ts

     These changes will be lost. Options:
     [Stash and Rollback] [Commit First] [Cancel]
     ```

3. **Pushed Commits**
   - If rolling back pushed commits, warn:
     ```
     ⚠️ Some commits have been pushed to remote.

     Rolling back will require force push.
     This may affect other collaborators.

     [Force Rollback] [Cancel]
     ```

## Integration with Claude Code

This command integrates with Claude Code's built-in `/rewind` for recent changes:
- Use `/rewind` for changes in last 30 days
- Use `/siftcoder:rollback` for checkpoint-based rollback with state restoration

## Allowed Tools
Read, Write, Edit, Bash, Glob
