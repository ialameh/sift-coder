---
description: Show current siftcoder progress and status with resume context
allowed-tools: Read, Bash, Glob
---

# siftcoder Status

## Instructions

Read and display comprehensive status from `.claude/siftcoder-state/`.

### Step 1: Load All State Files

Read these files:
- `current-task.json` - Active task state
- `features.json` - Feature queue
- `focus.json` - Current focus (if exists)
- `boundaries.json` - Scope limits (if exists)
- `file-iteration.json` - File iteration state (if exists)
- `implementation-log.jsonl` - Recent activity (last 10 entries)

### Step 2: Generate Status Report

```
╔══════════════════════════════════════════════════════════════╗
║                    SIFTCODER STATUS                          ║
╚══════════════════════════════════════════════════════════════╝

┌─ WORKFLOW STATE ─────────────────────────────────────────────┐
│                                                              │
│  Status:   [🔄 RUNNING | ⏸️  PAUSED | ⏹️  IDLE]               │
│  Mode:     [build | fix | optimize | document | none]       │
│  Phase:    [planning | coding | qa_review | qa_fix | done]  │
│  Started:  [timestamp] ([duration] ago)                     │
│                                                              │
└──────────────────────────────────────────────────────────────┘

┌─ WHERE YOU LEFT OFF ─────────────────────────────────────────┐
│                                                              │
│  Feature:  [feature name]                                   │
│            "[feature description]"                          │
│            Progress: ████████░░ 80% (4/5 subtasks)          │
│                                                              │
│  Current Subtask: [subtask description]                     │
│  Last Action:     [what was last completed]                 │
│  Next Action:     [what will happen next]                   │
│                                                              │
│  Files Modified This Session:                               │
│    src/auth/login.ts (12 changes)                           │
│    src/api/routes.ts (3 changes)                            │
│                                                              │
└──────────────────────────────────────────────────────────────┘

┌─ FEATURE QUEUE ──────────────────────────────────────────────┐
│                                                              │
│  Total: [N] features                                        │
│                                                              │
│  ✅ Completed:   [X] ████████████████████░░░░ 60%           │
│  🔄 In Progress: [Y]                                        │
│  ⏳ Pending:     [Z]                                        │
│                                                              │
│  Queue:                                                     │
│  [1] ✅ feat-auth-login     - User login (done)             │
│  [2] ✅ feat-auth-register  - Registration (done)           │
│  [3] 🔄 feat-payments       - Payments (in progress) ◄──    │
│  [4] ⏳ feat-notifications  - Notifications                 │
│  [5] ⏳ feat-settings       - User settings                 │
│                                                              │
└──────────────────────────────────────────────────────────────┘

┌─ FOCUS ──────────────────────────────────────────────────────┐
│                                                              │
│  Type:    [feature | area | files | none]                   │
│  Target:  [feature name / path / file list]                 │
│  Files:   [N] files in scope                                │
│                                                              │
└──────────────────────────────────────────────────────────────┘

┌─ BOUNDARIES (if fix/optimize mode) ──────────────────────────┐
│                                                              │
│  Modifiable:  [N] files                                     │
│    src/auth/*                                               │
│    src/api/routes/auth.ts                                   │
│                                                              │
│  Protected:   Everything else                               │
│                                                              │
└──────────────────────────────────────────────────────────────┘

┌─ FILE ITERATION (if analyze mode) ───────────────────────────┐
│                                                              │
│  Status:   [in_progress | paused | completed]               │
│  Goal:     [analysis goal description]                      │
│  Pattern:  [glob pattern]                                   │
│                                                              │
│  Progress: [X]/[N] files (Y%)                               │
│            ████████████░░░░░░░░░░░░░░░░░░░░ Y%              │
│                                                              │
│  Current:  [current file path]                              │
│  Insights: [N] insights accumulated                         │
│                                                              │
│  Checkpoints: [N] created                                   │
│  Started: [timestamp] ([duration] ago)                      │
│                                                              │
└──────────────────────────────────────────────────────────────┘

┌─ QUALITY GATES ──────────────────────────────────────────────┐
│                                                              │
│  Tests:      ✅ 45/45 passing                               │
│  Lint:       ✅ No issues                                   │
│  TypeCheck:  ⚠️  2 warnings                                  │
│  Format:     ✅ Clean                                       │
│                                                              │
└──────────────────────────────────────────────────────────────┘

┌─ RECENT ACTIVITY ────────────────────────────────────────────┐
│                                                              │
│  [5 min ago]  Completed subtask: "Add login API endpoint"   │
│  [8 min ago]  Quality gates passed                          │
│  [12 min ago] Started subtask: "Add session management"     │
│  [15 min ago] Completed subtask: "Create user model"        │
│                                                              │
└──────────────────────────────────────────────────────────────┘

┌─ QUICK ACTIONS ──────────────────────────────────────────────┐
│                                                              │
│  /siftcoder:continue   - Resume from where you left off     │
│  /siftcoder:pause      - Pause workflow                     │
│  /siftcoder:focus show - See current focus                  │
│  /siftcoder:missing    - Check what's not implemented       │
│  /siftcoder:rollback   - Rollback to checkpoint             │
│                                                              │
└──────────────────────────────────────────────────────────────┘
```

### If Workflow is Paused

Add prominent pause banner:

```
╔══════════════════════════════════════════════════════════════╗
║  ⏸️  WORKFLOW PAUSED                                          ║
║                                                              ║
║  Paused:  [timestamp] ([duration] ago)                      ║
║  Reason:  [user_requested | error | max_iterations]         ║
║                                                              ║
║  Resume with: /siftcoder:continue                           ║
╚══════════════════════════════════════════════════════════════╝
```

### If No Active Workflow

```
╔══════════════════════════════════════════════════════════════╗
║                    SIFTCODER STATUS                          ║
╚══════════════════════════════════════════════════════════════╝

Status: ⏹️  IDLE - No active workflow

Start a workflow:
  /siftcoder:build <spec>       - Build from specification
  /siftcoder:add-feature <desc> - Add feature to project
  /siftcoder:fix <issue>        - Fix with boundaries
  /siftcoder:investigate <issue>- Safe read-only exploration

Previous session (if any):
  Last active: [timestamp]
  Mode:        [mode]
  Completed:   [N] features

Knowledge base:
  Patterns:  [N] learned
  Gotchas:   [N] recorded
  Decisions: [N] documented
```

## Quick Actions

- `/siftcoder:pause` - Pause auto-continuation
- `/siftcoder:resume` - Resume workflow
- `/siftcoder:rollback` - Rollback to checkpoint
- `/siftcoder:sync status` - Check cloud sync status

## Now: Gathering Status

Reading state files...

### Cloud Sync Status Check

Check if cloud sync is configured:
1. Determine config directory based on OS:
   - macOS/Linux: `~/.config/siftcoder/cloud.toml`
   - Windows: `%APPDATA%\siftcoder\cloud.toml`
2. If config file exists:
   - Parse connection status (check if can reach server)
   - Read last sync time from `~/.config/siftcoder/last-sync.txt`
   - Check auto-sync setting from config file
   - Display:
     ```
     ☁️  Cloud Sync
     ├── Connection: ✅ Connected (or ⚠️ Offline)
     ├── Last Sync: 5 minutes ago (or Never)
     ├── Auto-sync: ✅ Enabled (or ⏸️ Disabled)
     └── Pending: 0 changes to push, 2 to pull
     ```
3. If not configured:
   ```
   ☁️  Cloud Sync: Not configured
   Run: /siftcoder:config cloud configure
   ```

### Reading State Files

Check `current-task.json`, `features.json`, and `implementation-log.jsonl` for other status information...
