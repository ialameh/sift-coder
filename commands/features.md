# /siftcoder:features - Feature Queue Management

Manage the feature queue for siftcoder workflows.

## Usage

```
/siftcoder:features <subcommand> [args]
```

## Subcommands

### list
Show all features in the queue with their status.

### add <title>
Add a new feature manually to the queue.

### next
Get the next pending feature to work on.

### complete [feature-id]
Mark a feature as completed. If no ID provided, completes the current feature.

### skip [feature-id]
Skip a feature (moves to end of queue).

### priority <feature-id> <priority>
Set priority (1-5, where 1 is highest).

## Instructions

You are managing the siftcoder feature queue. Based on the subcommand:

### For `list`:
1. Read `.claude/siftcoder-state/features.json`
2. Display features grouped by status:
   ```
   📋 FEATURE QUEUE

   In Progress:
   ├── [auth-001] Implement user authentication (Priority: 1)
   │   ├── Subtask 1: Set up OAuth2 ✓
   │   ├── Subtask 2: Create login form (in progress)
   │   └── Subtask 3: Add session management

   Pending (3):
   ├── [profile-002] User profile page (Priority: 2)
   ├── [search-003] Search functionality (Priority: 3)
   └── [export-004] Export to CSV (Priority: 4)

   Completed (2):
   ├── [init-000] Project initialization ✓
   └── [setup-001] Database setup ✓
   ```

### For `add`:
1. Generate a unique feature ID (short descriptive slug + number)
2. Create feature entry with:
   - `id`: Generated ID
   - `title`: Provided title
   - `status`: "pending"
   - `priority`: 5 (default, lowest)
   - `subtasks`: [] (empty, to be filled by planner)
   - `createdAt`: Current timestamp
3. Add to features.json
4. Confirm addition:
   ```
   ✅ Added feature: [feature-id] "title"

   Use /siftcoder:build to start planning and implementation.
   ```

### For `next`:
1. Read features.json
2. Find first pending feature (by priority, then creation date)
3. Display:
   ```
   📌 NEXT FEATURE

   [feature-id] Title
   Priority: X
   Dependencies: [list or "None"]

   Ready to start? Use: /siftcoder:build [feature-id]
   ```

### For `complete`:
1. Find feature by ID (or current in-progress feature)
2. Update status to "completed"
3. Add completedAt timestamp
4. Log to implementation-log.jsonl
5. Confirm:
   ```
   ✅ Completed: [feature-id] "title"

   Remaining: X features pending
   ```

### For `skip`:
1. Find feature by ID
2. Move to end of queue (set priority to max + 1)
3. Add skip reason if provided
4. Confirm:
   ```
   ⏭️ Skipped: [feature-id] "title"
   Reason: [reason or "No reason provided"]
   ```

### For `priority`:
1. Find feature by ID
2. Update priority value
3. Confirm:
   ```
   🔢 Priority updated: [feature-id] now priority X
   ```

## State File Format

```json
{
  "version": "1.0.0",
  "features": {
    "feature-id": {
      "id": "feature-id",
      "title": "Feature title",
      "status": "pending|in_progress|completed|skipped",
      "priority": 1,
      "dependencies": [],
      "subtasks": [],
      "createdAt": "ISO timestamp",
      "startedAt": "ISO timestamp",
      "completedAt": "ISO timestamp",
      "metadata": {}
    }
  },
  "queue": {
    "pending": ["id1", "id2"],
    "in_progress": ["id3"],
    "completed": ["id4", "id5"]
  }
}
```

## Arguments
- `$ARGUMENTS` - The subcommand and any additional arguments

## Allowed Tools
Read, Write, Edit, Bash, Glob, Grep
