# siftcoder Workflow Skill

Full autonomous multi-agent workflow for implementing features.

## Description

This skill orchestrates the complete siftcoder workflow: Planning → Coding → QA Review → QA Fix. It manages agent handoffs, state transitions, and auto-continuation.

## When to Use

This skill is automatically invoked when:
- A feature implementation starts
- Auto-continuation triggers next subtask
- QA review requires fixes
- Workflow needs to resume

## Instructions

You are the siftcoder workflow orchestrator. You coordinate multiple agents to implement features autonomously.

### Workflow States

```
┌─────────────────────────────────────────────────────────────┐
│                    siftcoder WORKFLOW                       │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ┌──────────┐    ┌──────────┐    ┌──────────┐    ┌──────┐  │
│  │ PLANNING │ -> │ CODING   │ -> │ QA       │ -> │ DONE │  │
│  └──────────┘    └──────────┘    └──────────┘    └──────┘  │
│       │               │               │                     │
│       v               v               v                     │
│   [Planner]       [Coder]        [Reviewer]                │
│                                      │                      │
│                                      v                      │
│                                 [QA Fixer]                  │
│                                 (if needed)                 │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### Phase 1: Planning

1. **Load Feature**
   Read from `features.json` to get feature details.

2. **Invoke Planner Agent**
   ```
   Task: Create implementation plan for feature [ID]

   Context:
   - Feature: [title]
   - Description: [description]
   - Acceptance Criteria: [criteria]

   Output: Structured plan with subtasks
   ```

3. **Store Plan**
   Save plan to feature's subtasks in `features.json`.

4. **Transition**
   Update state to `coding`, move to first subtask.

### Phase 2: Coding (Per Subtask)

1. **Load Subtask**
   Get current subtask from feature.

2. **Invoke Coder Agent**
   ```
   Task: Implement subtask [ID]

   Context:
   - Subtask: [title]
   - Feature: [parent feature]
   - Previous subtasks: [completed subtasks]

   Constraints:
   - Follow project patterns
   - Write tests
   - Run quality gates
   ```

3. **Quality Gates**
   Automatic via PostToolUse hooks:
   - Format code
   - Run linter
   - Type check

4. **Mark Complete**
   Update subtask status to `completed`.

5. **Auto-Continue**
   Stop hook triggers `should-continue.sh`:
   - If more subtasks: continue to next
   - If all subtasks done: transition to QA

### Phase 3: QA Review

1. **Invoke QA Reviewer**
   ```
   Task: Validate feature [ID] implementation

   Context:
   - Feature: [title]
   - Acceptance Criteria: [criteria]
   - Files Modified: [list]

   Checks:
   - All acceptance criteria met
   - Tests pass
   - No regressions
   - Code quality acceptable

   Output: PASS or FAIL with issues
   ```

2. **Handle Result**
   - **PASS**: Transition to completion
   - **FAIL**: Transition to QA Fix

### Phase 4: QA Fix (If Needed)

1. **Invoke QA Fixer**
   ```
   Task: Fix issues from QA review

   Issues:
   [List of issues from reviewer]

   Constraints:
   - Fix ONLY the listed issues
   - Don't refactor unrelated code
   - Re-run affected tests

   Output: Fixes applied
   ```

2. **Re-Review**
   Return to QA Review phase.

3. **Iteration Limit**
   Max 3 QA iterations. If still failing:
   - Mark feature as `needs_human_review`
   - Log issues
   - Notify user

### Phase 5: Completion

1. **Update State**
   - Mark feature as `completed`
   - Update `features.json`
   - Log to `implementation-log.jsonl`

2. **Create Checkpoint**
   - Git commit with descriptive message
   - Store ref in checkpoints

3. **Update Knowledge**
   - Store any new patterns discovered
   - Log any gotchas encountered

4. **Sync to Cloud (Pro Tier)**
   - Check if cloud sync is configured
   - Check if auto-sync is enabled
   - If both true:
     ```bash
     # Push updated knowledge to cloud
     siftcoder/scripts/cloud-sync.sh push
     ```
   - Display sync status in completion report

5. **Report**
   ```
   ✅ FEATURE COMPLETE: [ID]

   Subtasks: 5/5 completed
   QA Iterations: 1
   Files Modified: 8
   Tests Added: 12
   Time: 15 minutes

   Summary: [brief description of what was implemented]
   ```

5. **Auto-Continue to Next Feature**
   If more features in queue and autonomous mode:
   - Load next pending feature
   - Start from Planning phase

### State Machine

```json
{
  "states": {
    "pending": { "next": "planning" },
    "planning": { "next": "coding" },
    "coding": { "next": "qa_review" },
    "qa_review": {
      "next": "completed",
      "fail": "qa_fix"
    },
    "qa_fix": { "next": "qa_review" },
    "completed": { "terminal": true },
    "needs_human_review": { "terminal": true }
  }
}
```

### Error Handling

1. **Agent Failure**
   - Log error
   - Retry up to 2 times
   - If still failing, pause and notify user

2. **Infinite Loop Detection**
   - Track QA issue hashes
   - If same issue appears 3 times, break loop
   - Mark as `needs_human_review`

3. **Context Overflow**
   - If context getting large, summarize completed work
   - Start fresh agent with summary

### Pause/Resume

**Pause**:
- Save current state to `current-task.json`
- Stop auto-continuation
- User can use `/siftcoder:status` to check

**Resume**:
- Load state from `current-task.json`
- Resume from last phase/subtask
- Continue auto-continuation

## Configuration

Read from `.claude/siftcoder-state/config.json`:
```json
{
  "mode": "autonomous",
  "autoContinue": true,
  "maxIterations": 10,
  "maxQARetries": 3,
  "autoCommit": true,
  "agentModels": {
    "planner": "sonnet",
    "coder": "sonnet",
    "qaReviewer": "sonnet",
    "qaFixer": "sonnet"
  },
  "cloudSync": {
    "enabled": false,
    "autoSyncOnKnowledgeChange": false,
    "autoSyncOnFeatureComplete": false
  }
}
```

### Cloud Sync Settings

When `cloudSync.enabled = true`:
- **Session Start**: Execute `cloud-sync.sh pull` to get latest knowledge
- **Knowledge Add**: Trigger `cloud-sync.sh push` (if `autoSyncOnKnowledgeChange = true`)
- **Feature Complete**: Trigger `cloud-sync.sh push` (if `autoSyncOnFeatureComplete = true`)

Check cloud configuration at `~/.config/siftcoder/cloud.toml` before sync operations.

## Runtime Implementation

This skill includes a minimal `skill.ts` entry point to satisfy plugin requirements.
The primary value remains in this documentation - see sections above for:
- Workflow orchestration patterns
- State management
- Agent coordination

The runtime entry point can be extended with actual functionality as needed.

## Allowed Tools
Read, Write, Edit, Bash, Glob, Grep, Task (for subagents)
