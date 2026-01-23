---
description: Parallel agent execution - run multiple agents on independent tasks simultaneously
argument-hint: start|status|merge|stop <tasks>
allowed-tools: Read, Write, Edit, Bash, Glob, Grep, Task
---

# /siftcoder:swarm - Parallel Agent Execution

Run multiple agents in parallel on independent features/tasks, with coordination, conflict detection, and merge support.

## Usage

```
/siftcoder:swarm start "task1, task2, task3"  - Start parallel tasks
/siftcoder:swarm start --from-queue           - Parallelize pending features
/siftcoder:swarm status                       - View all agent progress
/siftcoder:swarm logs <agent-id>              - View specific agent logs
/siftcoder:swarm merge                        - Merge completed work
/siftcoder:swarm stop                         - Stop all agents
/siftcoder:swarm stop <agent-id>              - Stop specific agent
```

## How It Works

```
┌─────────────────────────────────────────────────────────────┐
│                    SWARM ARCHITECTURE                       │
└─────────────────────────────────────────────────────────────┘

                    ┌─────────────┐
                    │  CONDUCTOR  │
                    │  (You)      │
                    └──────┬──────┘
                           │
                    ┌──────┴──────┐
                    │ COORDINATOR │
                    │  Monitors   │
                    │  Merges     │
                    └──────┬──────┘
                           │
         ┌─────────────────┼─────────────────┐
         │                 │                 │
    ┌────┴────┐       ┌────┴────┐       ┌────┴────┐
    │ AGENT 1 │       │ AGENT 2 │       │ AGENT 3 │
    │ Auth    │       │ Payments│       │ Notifs  │
    │         │       │         │       │         │
    │ Planner │       │ Planner │       │ Planner │
    │ Coder   │       │ Coder   │       │ Coder   │
    │ QA      │       │ QA      │       │ QA      │
    └────┬────┘       └────┬────┘       └────┬────┘
         │                 │                 │
         └────────┬────────┴────────┬────────┘
                  │                 │
             ┌────┴────┐       ┌────┴────┐
             │ RESULTS │       │ CONFLICTS│
             │         │       │ DETECTED │
             └─────────┘       └──────────┘
```

## Instructions

### Command: `start`

Launch parallel agents for multiple tasks:

```
/siftcoder:swarm start "auth: user login, payments: stripe checkout, notifications: email alerts"
```

#### Step 1: Parse and Validate Tasks

```
SWARM INITIALIZATION

Parsing tasks...

Found 3 independent tasks:
  [1] auth: user login
  [2] payments: stripe checkout
  [3] notifications: email alerts

Checking for conflicts...
  - File overlap: None detected
  - Dependency conflicts: None detected

All tasks are independent. Proceeding with parallel execution.
```

#### Step 2: Allocate Boundaries

Each agent gets its own boundary set:

```
BOUNDARY ALLOCATION

Agent 1 (auth):
  Modifiable: src/auth/*, src/api/routes/auth.ts
  Protected:  Everything else

Agent 2 (payments):
  Modifiable: src/payments/*, src/api/routes/payments.ts
  Protected:  Everything else

Agent 3 (notifications):
  Modifiable: src/notifications/*, src/services/email.ts
  Protected:  Everything else

Boundaries enforced - agents cannot modify each other's files.
```

#### Step 3: Launch Agents

```
LAUNCHING SWARM

Starting 3 agents in parallel...

[agent-1] Starting: auth - user login
          Branch: siftcoder/swarm/auth-1705069200
          Status: Planning...

[agent-2] Starting: payments - stripe checkout
          Branch: siftcoder/swarm/payments-1705069200
          Status: Planning...

[agent-3] Starting: notifications - email alerts
          Branch: siftcoder/swarm/notifications-1705069200
          Status: Planning...

Swarm active. Monitor with:
  /siftcoder:swarm status
```

### Command: `status`

View real-time status of all agents:

```
/siftcoder:swarm status
```

```
╔══════════════════════════════════════════════════════════════╗
║                     SWARM STATUS                             ║
╚══════════════════════════════════════════════════════════════╝

Active: 3 agents | Runtime: 12 minutes | Conflicts: 0

┌─ AGENT 1: auth ──────────────────────────────────────────────┐
│                                                              │
│  Task:     User login implementation                        │
│  Status:   Coding (subtask 3/5)                             │
│  Progress: ████████████░░░░░░░░ 60%                         │
│  Branch:   siftcoder/swarm/auth-1705069200                  │
│                                                              │
│  Current:  Implementing password verification               │
│  Files:    src/auth/login.ts, src/auth/session.ts           │
│                                                              │
│  Timeline:                                                   │
│    [00:00] Started                                          │
│    [02:00] Planning complete                                │
│    [05:00] Subtask 1 complete                               │
│    [08:00] Subtask 2 complete                               │
│    [12:00] Subtask 3 in progress                            │
│                                                              │
└──────────────────────────────────────────────────────────────┘

┌─ AGENT 2: payments ──────────────────────────────────────────┐
│                                                              │
│  Task:     Stripe checkout integration                      │
│  Status:   QA Review                                        │
│  Progress: ████████████████████ 100% (pending QA)           │
│  Branch:   siftcoder/swarm/payments-1705069200              │
│                                                              │
│  Current:  Running acceptance tests                         │
│  Files:    src/payments/checkout.ts, src/api/routes/pay.ts  │
│                                                              │
└──────────────────────────────────────────────────────────────┘

┌─ AGENT 3: notifications ─────────────────────────────────────┐
│                                                              │
│  Task:     Email alerts                                     │
│  Status:   Complete                                         │
│  Progress: ████████████████████ 100%                        │
│  Branch:   siftcoder/swarm/notifications-1705069200         │
│                                                              │
│  Result:   All acceptance criteria passed                   │
│  Ready:    For merge                                        │
│                                                              │
└──────────────────────────────────────────────────────────────┘

┌─ CONFLICT MONITOR ───────────────────────────────────────────┐
│                                                              │
│  Status: No conflicts detected                              │
│                                                              │
│  Shared files: None                                         │
│  Boundary violations: 0                                     │
│                                                              │
└──────────────────────────────────────────────────────────────┘

Commands:
  /siftcoder:swarm logs agent-1   - View agent logs
  /siftcoder:swarm merge          - Merge completed work
  /siftcoder:swarm stop agent-2   - Stop specific agent
```

### Command: `merge`

Merge completed agent work back to main:

```
/siftcoder:swarm merge
```

```
SWARM MERGE

Checking agent status...

Ready to merge:
  [x] agent-3 (notifications) - Complete
  [x] agent-2 (payments) - QA Passed

Not ready:
  [ ] agent-1 (auth) - Still coding (60%)

Merge ready agents? [Yes / No / Wait for all]
> Yes

┌─ MERGING agent-3 (notifications) ────────────────────────────┐
│                                                              │
│  Branch: siftcoder/swarm/notifications-1705069200           │
│  Files:  3 files, +245 lines                                │
│                                                              │
│  Checking for conflicts with main...                        │
│  No conflicts detected.                                     │
│                                                              │
│  Merging...                                                  │
│  Merged successfully.                                       │
│                                                              │
└──────────────────────────────────────────────────────────────┘

┌─ MERGING agent-2 (payments) ─────────────────────────────────┐
│                                                              │
│  Branch: siftcoder/swarm/payments-1705069200                │
│  Files:  5 files, +380 lines                                │
│                                                              │
│  Checking for conflicts with main...                        │
│  No conflicts detected.                                     │
│                                                              │
│  Merging...                                                  │
│  Merged successfully.                                       │
│                                                              │
└──────────────────────────────────────────────────────────────┘

MERGE COMPLETE

Merged: 2 agents
Remaining: 1 agent (auth - still in progress)

The swarm continues for remaining agents.
Run /siftcoder:swarm status to monitor.
```

### Command: `logs <agent-id>`

View detailed logs for a specific agent:

```
/siftcoder:swarm logs agent-1
```

```
AGENT LOGS: agent-1 (auth)

[00:00:00] Agent started
           Task: User login implementation
           Boundary: src/auth/*, src/api/routes/auth.ts

[00:00:30] Planning phase
           Invoking siftcoder-planner agent
           Subtasks: 5

[00:02:00] Plan complete
           1. Create User model
           2. Implement password hashing
           3. Create login endpoint
           4. Implement session management
           5. Add logout functionality

[00:02:30] Coding subtask 1
           Creating src/auth/user.ts
           Lines: 45

[00:05:00] Subtask 1 complete
           Quality gates: Passed

[00:05:30] Coding subtask 2
           Modifying src/auth/password.ts
           Using @noble/hashes (learned from gotcha-42)

[00:08:00] Subtask 2 complete
           Quality gates: Passed

[00:08:30] Coding subtask 3
           Creating src/api/routes/auth.ts
           Lines: 85

[00:12:00] Subtask 3 in progress...
           Current: Implementing JWT token creation

─────────────────────────────────────
Tail logs (live):
  /siftcoder:swarm logs agent-1 --follow
```

### Command: `stop`

Stop agents gracefully:

```
/siftcoder:swarm stop agent-1
```

```
STOPPING AGENT

Agent: agent-1 (auth)
Status: Coding (subtask 3/5)

Stopping gracefully...
  - Completing current file operation
  - Saving state checkpoint
  - Preserving branch

Agent stopped.

Progress saved:
  Branch: siftcoder/swarm/auth-1705069200 (preserved)
  State: .claude/siftcoder-state/swarm/agent-1.json

Resume later with:
  /siftcoder:swarm resume agent-1
```

Stop all agents:

```
/siftcoder:swarm stop
```

```
STOPPING ALL AGENTS

Stopping 3 agents...

[agent-1] Stopping... saved at subtask 3/5
[agent-2] Stopping... saved at QA review
[agent-3] Already complete

All agents stopped.
Branches preserved for later resume.
```

## Conflict Detection

When agents might conflict:

```
CONFLICT WARNING

Agent 1 (auth) and Agent 2 (payments) both want to modify:
  src/lib/session.ts

Options:
  [1] Let agent-1 proceed, agent-2 waits
  [2] Let agent-2 proceed, agent-1 waits
  [3] Expand boundaries to allow both (risky)
  [4] Stop and resolve manually

Select: [1/2/3/4]
```

## Swarm State Storage

`.claude/siftcoder-state/swarm/`:

```
swarm/
├── swarm-1705069200.json      # Swarm session
├── agent-1.json               # Agent 1 state
├── agent-2.json               # Agent 2 state
├── agent-3.json               # Agent 3 state
├── conflicts.json             # Conflict log
└── merge-history.json         # Merge records
```

## Configuration

```json
{
  "swarm": {
    "maxAgents": 5,
    "conflictStrategy": "ask",      // ask | first | queue
    "autoMerge": false,              // Auto-merge on complete
    "branchPrefix": "siftcoder/swarm/",
    "parallelQA": true,              // Run QA in parallel too
    "resourceLimit": {
      "maxFilesPerAgent": 20,
      "maxLinesPerAgent": 2000
    }
  }
}
```

## Integration with Other Commands

### From Feature Queue

```
/siftcoder:swarm start --from-queue
```

Takes pending features and runs them in parallel:

```
SWARM FROM QUEUE

Pending features: 5
Independent features: 3

Starting swarm for:
  [1] feat-auth (no dependencies)
  [2] feat-payments (depends on auth - SKIP)
  [3] feat-notifications (no dependencies)
  [4] feat-settings (no dependencies)
  [5] feat-analytics (depends on auth - SKIP)

Starting 3 parallel agents...
```

### With `/siftcoder:status`

Status shows swarm state:

```
┌─ SWARM ──────────────────────────────────────────────────────┐
│                                                              │
│  Active: Yes (3 agents)                                     │
│  Progress: 2/3 complete                                     │
│  Conflicts: 0                                               │
│                                                              │
│  /siftcoder:swarm status for details                        │
│                                                              │
└──────────────────────────────────────────────────────────────┘
```

## Tips

```
EFFECTIVE SWARMING

When to use swarm:
  - Multiple independent features
  - Large spec with no dependencies
  - Parallel bug fixes in different areas
  - Documentation + code simultaneously

Best practices:
  - Ensure tasks are truly independent
  - Set clear boundaries for each agent
  - Monitor for conflicts early
  - Merge incrementally, not all at once

Limitations:
  - Max 5 agents recommended
  - Shared files cause conflicts
  - More agents = more coordination overhead

Resource management:
  - Each agent uses context
  - Parallel costs more tokens
  - Use /siftcoder:budget to track
```
