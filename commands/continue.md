---
description: Continue a paused siftcoder workflow from where you left off
allowed-tools: Read, Write, Edit, Bash, Glob, Grep, Task
---

# /siftcoder:continue - Resume Paused Workflow

Resume a previously paused workflow from exactly where you stopped.

## Arguments

- `$ARGUMENTS` - Optional: specific feature ID to continue with (otherwise continues current)

## Instructions

### Step 1: Load Paused State

Read `.claude/siftcoder-state/current-task.json`:

If no paused task exists:
```
No paused workflow found.

Start a new workflow:
  /siftcoder:build <spec>      - Build from specification
  /siftcoder:fix <issue>       - Fix with boundaries
  /siftcoder:add-feature <desc> - Add new feature
```

If task exists but not paused:
```
Workflow is already running.

Current: [mode] - [phase]
Feature: [feature name]

Use /siftcoder:status to see progress.
```

### Step 2: Show Resume Context

Display what will be resumed:

```
RESUMING WORKFLOW

Mode:          [build/fix/optimize/document]
Paused at:     [timestamp] ([duration] ago)
Phase:         [planning/coding/qa_review/qa_fix]

Progress Summary:
 Feature: [current feature] ([X/Y] features complete)
 Subtask: [current subtask] ([X/Y] subtasks complete)

Last completed:
  [description of last action]

Next action:
  [description of what will happen next]

Resuming in 3 seconds... (Ctrl+C to cancel)
```

### Step 3: Clear Pause State

Update task to resume:

```bash
./siftcoder/scripts/state-manager.sh task-update '{
  "mode": "[mode]",
  "phase": "[phase]",
  "paused": false,
  "resumedAt": "[ISO timestamp]",
  "pausedAt": null
}'

./siftcoder/scripts/state-manager.sh log "workflow_resumed" '{
  "mode": "[mode]",
  "phase": "[phase]",
  "pausedDuration": "[duration in seconds]"
}'
```

### Step 4: Resume Appropriate Phase

Based on the saved state, invoke the appropriate agent:

**If phase = "planning":**
- Invoke **siftcoder-planner** agent to continue planning
- Load feature context from features.json

**If phase = "coding":**
- Invoke **siftcoder-coder** agent
- Resume at the current subtask index
- Load existing plan from state

**If phase = "qa_review":**
- Invoke **siftcoder-qa-reviewer** agent
- Run validation on completed code

**If phase = "qa_fix":**
- Invoke **siftcoder-qa-fixer** agent
- Load issues from last QA report

### Step 5: Continue Auto-Continuation

Once resumed, the workflow continues automatically until:
- All features/subtasks complete
- User runs `/siftcoder:pause` again
- Max iterations reached
- Error requires human intervention

## Resuming a Specific Feature

If `$ARGUMENTS` contains a feature ID:

1. Validate the feature exists in features.json
2. Set it as the current feature
3. Start from its current phase
4. Continue workflow from there

```
/siftcoder:continue feat-auth-login
```

```
SWITCHING TO FEATURE

Feature:  feat-auth-login
Title:    User Authentication Login
Status:   in_progress (subtask 3/7)

Continuing from subtask 3...
```

## Tips

- Run `/siftcoder:status` first to see what will be resumed
- All your previous work is preserved
- Quality gate results from before pause still apply
- You can pause and continue as many times as needed
