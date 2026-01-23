---
description: Session memory and handoff - persist context across sessions
argument-hint: summary|context|save|load
allowed-tools: Read, Write, Bash, Glob, Grep
---

# /siftcoder:handoff - Session Memory & Resume

Persist rich context across sessions so work can continue days later without re-explaining everything. Like handing off to yourself in the future.

## Usage

```
/siftcoder:handoff                   - Auto-save current session context
/siftcoder:handoff summary           - View summary of last session
/siftcoder:handoff context <topic>   - Recall specific context
/siftcoder:handoff save "note"       - Save with custom note
/siftcoder:handoff load              - Load previous session context
/siftcoder:handoff list              - List all saved sessions
/siftcoder:handoff clear             - Clear session memory
```

## How It Works

When you end a session, siftcoder captures:
- What you were working on
- What was completed
- What's still pending
- Key decisions made
- Files touched
- Gotchas discovered
- The mental model of the task

When you return (even days later), siftcoder can reconstruct this context.

## Instructions

### Default: Auto-Save Current Session

Capture current session state:

```
SAVING SESSION CONTEXT

Session: 2026-01-12 14:30 - 16:45 (2h 15m)

Capturing:
  [1] Current task state...
  [2] Files modified (12 files)...
  [3] Decisions made (8 decisions)...
  [4] Patterns discovered (3 patterns)...
  [5] Pending work (5 items)...

Session context saved.

Resume later with:
  /siftcoder:handoff load
  /siftcoder:handoff summary
```

### Command: `summary`

View what happened in the last session:

```
╔══════════════════════════════════════════════════════════════╗
║                  SESSION SUMMARY                             ║
║          Last session: 2026-01-12 14:30 - 16:45            ║
╚══════════════════════════════════════════════════════════════╝

Duration: 2h 15m | Mode: build | Spec: FEATURE_IDEAS.md

┌─ WHAT WE WORKED ON ──────────────────────────────────────────┐
│                                                              │
│  Building new siftcoder features from FEATURE_IDEAS.md      │
│  Focus: Phase 1 (Foundation) commands                       │
│                                                              │
└──────────────────────────────────────────────────────────────┘

┌─ COMPLETED ──────────────────────────────────────────────────┐
│                                                              │
│  [x] heal.md - Self-healing loop command                    │
│  [x] checkpoint.md - Save/restore points                    │
│  [x] preview.md - Diff preview before apply                 │
│  [x] trace.md - Execution trace visualization               │
│                                                              │
│  4 features complete (4/15 total = 27%)                     │
│                                                              │
└──────────────────────────────────────────────────────────────┘

┌─ IN PROGRESS ────────────────────────────────────────────────┐
│                                                              │
│  [ ] handoff.md - Session memory (this one!)                │
│      Status: Writing instructions section                   │
│                                                              │
└──────────────────────────────────────────────────────────────┘

┌─ PENDING ────────────────────────────────────────────────────┐
│                                                              │
│  [ ] smart-retry.md - Learn from failures                   │
│  [ ] swarm.md - Parallel agent execution                    │
│  [ ] budget.md - Token/cost awareness                       │
│  [ ] tdd.md - Test-driven generation                        │
│  [ ] pair.md - Interactive pair mode                        │
│                                                              │
└──────────────────────────────────────────────────────────────┘

┌─ KEY DECISIONS ──────────────────────────────────────────────┐
│                                                              │
│  1. Heal command uses regex-based error parsing first,      │
│     falls back to LLM for complex errors                    │
│                                                              │
│  2. Checkpoints store git stash + JSON state, not commits   │
│                                                              │
│  3. Preview mode is opt-in per command, with threshold      │
│                                                              │
│  4. Trace uses JSONL for append-only efficiency             │
│                                                              │
└──────────────────────────────────────────────────────────────┘

┌─ FILES TOUCHED ──────────────────────────────────────────────┐
│                                                              │
│  Created:                                                    │
│    siftcoder/commands/heal.md (285 lines)                   │
│    siftcoder/commands/checkpoint.md (312 lines)             │
│    siftcoder/commands/preview.md (248 lines)                │
│    siftcoder/commands/trace.md (295 lines)                  │
│                                                              │
│  Modified:                                                   │
│    siftcoder/commands/siftcoder.md (added new commands)     │
│    siftcoder/FEATURE_IDEAS.md (marked progress)             │
│                                                              │
└──────────────────────────────────────────────────────────────┘

┌─ DISCOVERED PATTERNS ────────────────────────────────────────┐
│                                                              │
│  1. Command files follow standard structure:                 │
│     - YAML frontmatter (description, allowed-tools)         │
│     - Usage section with examples                           │
│     - Instructions section with steps                       │
│     - Tips section at end                                   │
│                                                              │
│  2. State files use .claude/siftcoder-state/ directory     │
│                                                              │
└──────────────────────────────────────────────────────────────┘

┌─ RESUME SUGGESTIONS ─────────────────────────────────────────┐
│                                                              │
│  To continue where you left off:                            │
│    /siftcoder:continue                                      │
│                                                              │
│  Next task would be:                                        │
│    Complete handoff.md, then smart-retry.md                 │
│                                                              │
│  Quick context refresh:                                     │
│    /siftcoder:handoff context "command structure"           │
│                                                              │
└──────────────────────────────────────────────────────────────┘
```

### Command: `context <topic>`

Recall specific context about a topic:

```
/siftcoder:handoff context "error handling"
```

```
CONTEXT: error handling

From session 2026-01-12:

In heal.md, we implemented error handling with these decisions:

1. Error Parsing Strategy:
   - Regex-based for common patterns (TypeScript, ESLint)
   - LLM fallback for complex/unknown errors
   - Reasoning: Balance speed and accuracy

2. Retry Limits:
   - Default: 3 retries
   - Configurable via --max-retries
   - Escalate to human after max

3. Error Categories:
   - Syntax errors: Usually auto-fixable
   - Type errors: Often auto-fixable
   - Runtime errors: May need investigation
   - Dependency errors: Suggest npm install

Related files:
  siftcoder/commands/heal.md (lines 45-120)

Related decisions from trace:
  [14:40:00] Error parsing strategy decision
  [14:45:00] Retry limit decision
```

### Command: `load`

Load previous session context into current session:

```
/siftcoder:handoff load
```

```
LOADING SESSION CONTEXT

Available sessions:
  [1] 2026-01-12 14:30 - Building FEATURE_IDEAS.md (2h 15m)
  [2] 2026-01-11 10:00 - Initial plugin setup (3h 30m)
  [3] 2026-01-10 16:00 - Market research for ideation (1h)

Load which session? [1/2/3/all]
> 1

Loading session: 2026-01-12 14:30

Context loaded:
  - Task state restored
  - 8 decisions in memory
  - 3 patterns available
  - File context for 6 files

You can now ask questions about this session or continue work.

Try:
  /siftcoder:continue            - Resume from where we left
  /siftcoder:handoff summary     - See what we did
  /siftcoder:handoff context X   - Ask about specific topic
```

### Command: `save "note"`

Save with custom annotation:

```
/siftcoder:handoff save "stopped at heal.md, need to add test section"
```

```
SESSION SAVED

Note: "stopped at heal.md, need to add test section"

Context captured:
  - Current task: heal.md
  - Position: Line 280, before Tips section
  - Pending: Add testing instructions

Resume with:
  /siftcoder:handoff load
```

### Command: `list`

List all saved sessions:

```
/siftcoder:handoff list
```

```
SAVED SESSIONS

ID       Date                 Duration  Mode      Note
───────────────────────────────────────────────────────────────
sess-5   2026-01-12 14:30    2h 15m    build     FEATURE_IDEAS.md
sess-4   2026-01-11 10:00    3h 30m    build     Initial setup
sess-3   2026-01-10 16:00    1h 00m    ideate    Market research
sess-2   2026-01-09 09:00    4h 00m    fix       Auth bug
sess-1   2026-01-08 14:00    2h 00m    document  API docs

Total: 5 sessions | Storage: 2.4 MB

Commands:
  /siftcoder:handoff load         - Load a session
  /siftcoder:handoff summary      - View latest
  /siftcoder:handoff clear        - Remove old sessions
```

## Session Storage Format

`.claude/siftcoder-state/sessions/sess-<id>.json`:

```json
{
  "id": "sess-5",
  "startedAt": "2026-01-12T14:30:00Z",
  "endedAt": "2026-01-12T16:45:00Z",
  "duration": "2h 15m",
  "mode": "build",
  "note": "Building FEATURE_IDEAS.md",

  "task": {
    "spec": "FEATURE_IDEAS.md",
    "phase": "coding",
    "currentFeature": "handoff",
    "progress": {
      "completed": ["heal", "checkpoint", "preview", "trace"],
      "inProgress": ["handoff"],
      "pending": ["smart-retry", "swarm", "budget", "tdd", "pair"]
    }
  },

  "decisions": [
    {
      "timestamp": "2026-01-12T14:40:00Z",
      "topic": "error parsing strategy",
      "chosen": "regex-based with LLM fallback",
      "reasoning": "Balance speed and accuracy"
    }
  ],

  "patterns": [
    {
      "name": "command structure",
      "description": "YAML frontmatter + sections",
      "files": ["commands/*.md"]
    }
  ],

  "files": {
    "created": ["heal.md", "checkpoint.md", "preview.md", "trace.md"],
    "modified": ["siftcoder.md"]
  },

  "context": {
    "summaryText": "Building new siftcoder features...",
    "keyInsights": ["Command files follow standard structure..."],
    "nextSteps": ["Complete handoff.md", "Start smart-retry.md"]
  }
}
```

## Auto-Save Triggers

Sessions are auto-saved on:

| Trigger | What's Saved |
|---------|--------------|
| Session end | Full context |
| `/siftcoder:pause` | Current state + position |
| Error/crash | Recovery snapshot |
| Every 30 min | Incremental backup |
| Major milestone | Checkpoint + context |

## Integration with Other Commands

### With `/siftcoder:continue`

```
/siftcoder:continue

Loading session context from 2026-01-12...

You were working on: handoff.md
Last action: Writing Instructions section
Next: Complete handoff.md, then smart-retry.md

Continuing from where you left off...
```

### With `/siftcoder:status`

Status shows if session context is available:

```
┌─ SESSION MEMORY ─────────────────────────────────────────────┐
│                                                              │
│  Last session: 2026-01-12 14:30 (2 days ago)                │
│  Context available: Yes                                      │
│  Quick resume: /siftcoder:continue                          │
│                                                              │
└──────────────────────────────────────────────────────────────┘
```

## Configuration

In `.claude/siftcoder-state/config.json`:

```json
{
  "handoff": {
    "autoSave": true,
    "saveInterval": 1800,      // 30 minutes
    "maxSessions": 20,         // Keep last 20
    "retentionDays": 30,       // Delete after 30 days
    "includeFileContents": false,  // Just references, not content
    "compressOlderThan": 7     // Compress sessions older than 7 days
  }
}
```

## Tips

```
EFFECTIVE SESSION HANDOFF

Before ending a session:
  /siftcoder:handoff save "context note"
  - Add a note about where you stopped
  - Mention any gotchas or blockers

When returning:
  /siftcoder:handoff summary     - Quick refresh
  /siftcoder:handoff load        - Full context
  /siftcoder:continue            - Just resume

For complex topics:
  /siftcoder:handoff context "topic"
  - Ask about specific decisions
  - Recall why something was done

Managing sessions:
  /siftcoder:handoff list        - See all sessions
  /siftcoder:handoff clear --older-than 14d

Best practices:
  - Save before stepping away
  - Add notes about blockers
  - Review summary before continuing
  - Use context queries for complex areas
```
