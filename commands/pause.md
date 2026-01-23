---
description: Pause the current siftcoder workflow for later resumption
allowed-tools: Read, Bash
---

# /siftcoder:pause - Pause Workflow

Pause the current auto-continuation workflow to take a break or review progress.

## What This Does

1. Sets `paused: true` in current task state
2. Saves current position (feature, subtask, phase)
3. Logs pause event with context
4. Stops auto-continuation hook from triggering

## Instructions

### Step 1: Check Current State

Read `.claude/siftcoder-state/current-task.json` to see what's running.

If no active task exists:
```
No active workflow to pause.

Start a workflow with:
  /siftcoder:build <spec>
  /siftcoder:fix <issue>
  /siftcoder:add-feature <description>
```

### Step 2: Save Pause State

Update the current task with pause information:

```bash
# Using state-manager
./siftcoder/scripts/state-manager.sh task-update '{
  "mode": "[current mode]",
  "phase": "[current phase]",
  "paused": true,
  "pausedAt": "[ISO timestamp]",
  "pauseContext": {
    "currentFeature": "[feature id if any]",
    "currentSubtask": "[subtask index if any]",
    "lastCompletedAction": "[description]"
  }
}'
```

### Step 3: Log the Pause

```bash
./siftcoder/scripts/state-manager.sh log "workflow_paused" '{
  "mode": "[mode]",
  "phase": "[phase]",
  "reason": "user_requested"
}'
```

### Step 4: Confirm to User

```
WORKFLOW PAUSED

Mode:     [build/fix/optimize/document]
Phase:    [planning/coding/qa_review/qa_fix]
Feature:  [current feature name] ([X/Y] complete)
Subtask:  [current subtask] ([X/Y])

Progress saved. Resume anytime with:
  /siftcoder:continue

Check status with:
  /siftcoder:status

Your work is safe - all progress is preserved.
```

## Notes

- Pausing does NOT undo any completed work
- All progress is saved to state files
- Quality gate results are preserved
- You can resume from exactly where you left off
- The should-continue.sh hook checks `paused: true` and stops auto-continuation
