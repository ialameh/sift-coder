---
description: View execution trace - see what AI did, why, and alternatives considered
argument-hint: [--live|--session|--export]
allowed-tools: Read, Bash, Glob
---

# /siftcoder:trace - Execution Trace Visualization

View a detailed trace of what siftcoder did, why it made certain decisions, and what alternatives it considered.

## Usage

```
/siftcoder:trace                     - Show trace for current session
/siftcoder:trace --live              - Enable live tracing (verbose mode)
/siftcoder:trace --session <id>      - View trace from past session
/siftcoder:trace --export            - Export trace to file
/siftcoder:trace --last <n>          - Show last N decisions
/siftcoder:trace --filter <type>     - Filter by decision type
```

## Instructions

### Default: Current Session Trace

Read from `.claude/siftcoder-state/trace.jsonl` and display:

```
╔══════════════════════════════════════════════════════════════╗
║                    EXECUTION TRACE                           ║
║                Session: 2026-01-12 14:30                    ║
╚══════════════════════════════════════════════════════════════╝

Duration: 45 minutes | Decisions: 28 | Files touched: 12

───────────────────────────────────────────────────────────────
TIMELINE
───────────────────────────────────────────────────────────────

14:30:00 ┃ SESSION START
         ┃ Mode: build | Spec: FEATURE_IDEAS.md
         ┃
14:30:15 ┃ DECISION: Feature prioritization
         ┃ ├─ Chose: Start with heal.md (P0, medium effort)
         ┃ ├─ Alternatives considered:
         ┃ │   - checkpoint.md (P0, medium) - similar priority
         ┃ │   - swarm.md (P0, high) - too complex for first
         ┃ └─ Reasoning: Foundation feature, enables other P0s
         ┃
14:32:00 ┃ DECISION: File structure
         ┃ ├─ Chose: Create commands/heal.md
         ┃ ├─ Pattern matched: Existing command structure
         ┃ └─ Reasoning: Follows established plugin conventions
         ┃
14:35:00 ┃ ACTION: Write file
         ┃ ├─ File: siftcoder/commands/heal.md
         ┃ ├─ Lines: 285
         ┃ └─ Content: Self-healing loop command
         ┃
14:40:00 ┃ DECISION: Error parsing strategy
         ┃ ├─ Chose: Regex-based with fallback to LLM parsing
         ┃ ├─ Alternatives:
         ┃ │   - Pure LLM parsing (slower, more accurate)
         ┃ │   - AST-based parsing (complex, language-specific)
         ┃ └─ Reasoning: Balance of speed and accuracy
         ┃
14:45:00 ┃ DECISION: Max retries default
         ┃ ├─ Chose: 3 retries
         ┃ ├─ Alternatives: 5 (too many), 1 (too few)
         ┃ └─ Reasoning: Industry standard, prevents infinite loops
         ┃
14:50:00 ┃ ACTION: Write file
         ┃ ├─ File: siftcoder/commands/checkpoint.md
         ┃ ├─ Lines: 312
         ┃ └─ Content: Save/restore checkpoint command
         ┃
15:00:00 ┃ DECISION: Checkpoint storage format
         ┃ ├─ Chose: JSON with git stash integration
         ┃ ├─ Alternatives:
         ┃ │   - Git commits (too heavy)
         ┃ │   - File copies (no git awareness)
         ┃ └─ Reasoning: Lightweight + git state preservation
         ┃
15:10:00 ┃ QA CHECK
         ┃ ├─ Status: Passed
         ┃ ├─ Criteria checked: 6/6
         ┃ └─ Issues: None
         ┃
15:15:00 ┃ SESSION END
         ┃ Completed: 4 features | Time: 45min

───────────────────────────────────────────────────────────────
SUMMARY
───────────────────────────────────────────────────────────────

Decisions by type:
  Architecture:     3
  Implementation:   8
  Prioritization:   2
  Error handling:   5
  Other:           10

Files created:     4
Files modified:    2
Tests passed:      12/12
Healing attempts:  0
```

### With `--live`

Enable real-time trace output during execution:

```
LIVE TRACE ENABLED

All decisions will be logged in real-time.
This may slow down execution slightly.

Output: .claude/siftcoder-state/trace.jsonl

[14:30:15] Considering feature order...
           Options: heal (P0), checkpoint (P0), swarm (P0)
           Selecting: heal.md
           Reason: Foundation feature

[14:32:00] Creating file: commands/heal.md
           Pattern: command-template
           Lines: ~280 estimated

[14:35:00] Writing heal.md...
           Progress: 100%
           Duration: 3m
```

### With `--filter <type>`

Filter trace by decision type:

```
/siftcoder:trace --filter architecture
```

```
ARCHITECTURE DECISIONS

[14:32:00] File structure decision
├─ Chose: Create commands/heal.md
├─ Pattern: Existing command structure in siftcoder/commands/
└─ Reasoning: Maintains consistency with plugin conventions

[15:00:00] Checkpoint storage format
├─ Chose: JSON + git stash integration
├─ Alternatives rejected:
│   - Git commits: Too heavy, clutters history
│   - File copies: Loses git state awareness
└─ Reasoning: Lightweight storage with full git state

[15:20:00] State persistence layer
├─ Chose: JSONL for append-only logs
├─ Pattern: Implementation log pattern
└─ Reasoning: Efficient appends, easy to read/parse
```

### With `--export`

Export trace to file for post-mortem:

```
/siftcoder:trace --export
```

```
EXPORTING TRACE

Session:  2026-01-12 14:30
Duration: 45 minutes
Entries:  28

Exporting to:
  .claude/siftcoder-state/traces/trace-2026-01-12-1430.md
  .claude/siftcoder-state/traces/trace-2026-01-12-1430.json

Export complete.

View markdown:
  cat .claude/siftcoder-state/traces/trace-2026-01-12-1430.md
```

## Trace Entry Format

Each trace entry in `trace.jsonl`:

```json
{
  "timestamp": "2026-01-12T14:35:00Z",
  "type": "decision",
  "category": "architecture",
  "summary": "File structure for heal.md",
  "chosen": {
    "option": "Create commands/heal.md",
    "reasoning": "Follows established plugin conventions"
  },
  "alternatives": [
    {
      "option": "Create skills/heal/SKILL.md",
      "rejected_reason": "Commands are simpler for single-file features"
    }
  ],
  "context": {
    "task": "feat-heal",
    "subtask": 1,
    "files_touched": ["commands/heal.md"]
  }
}
```

## Decision Categories

| Category | Description | Examples |
|----------|-------------|----------|
| `architecture` | Structural decisions | File layout, patterns, abstractions |
| `implementation` | Code-level choices | Algorithm, library, syntax |
| `prioritization` | Order of work | Feature order, subtask sequence |
| `error_handling` | Failure responses | Retry strategy, fallback |
| `optimization` | Performance choices | Caching, batching |
| `integration` | External connections | APIs, services, tools |

## Trace Levels

Configure trace verbosity in config:

```json
{
  "trace": {
    "level": "decisions",  // minimal | decisions | verbose | debug
    "persist": true,       // Save to trace.jsonl
    "maxEntries": 1000,    // Rolling log size
    "exportFormat": "both" // md | json | both
  }
}
```

| Level | What's Logged |
|-------|---------------|
| `minimal` | Only major decisions and errors |
| `decisions` | All decisions with reasoning (default) |
| `verbose` | + File operations, tool calls |
| `debug` | + Internal state, alternatives |

## Integration with Other Commands

### With `/siftcoder:explain`

```
/siftcoder:explain "why did you use a factory pattern in auth?"
```

Uses trace to find the relevant decision and explain:

```
DECISION FOUND IN TRACE

Timestamp: 2026-01-12 14:42:00
Context:   Building auth module

Decision: Use factory pattern for session creation

Reasoning:
  1. Multiple session types needed (JWT, Cookie, API Key)
  2. Pattern exists in src/services/email.ts
  3. Allows easy extension for new session types

Alternatives considered:
  - Direct instantiation: Less flexible
  - Builder pattern: Overkill for this use case

Related trace entries:
  [14:40:00] Session type analysis
  [14:44:00] Factory implementation
```

### With `/siftcoder:heal`

Trace records each healing attempt:

```
[15:30:00] HEAL ATTEMPT 1/3
├─ Error: TypeError in src/auth/login.ts:42
├─ Analysis: Missing property on Session type
├─ Fix applied: Added 'user' to Session interface
└─ Result: Still failing (new error)

[15:31:00] HEAL ATTEMPT 2/3
├─ Error: TypeError in src/auth/login.ts:58
├─ Analysis: String/number mismatch
├─ Fix applied: Added parseInt() wrapper
└─ Result: Success
```

## Tips

```
USING TRACES EFFECTIVELY

For debugging:
  /siftcoder:trace --last 10   - Recent decisions
  /siftcoder:trace --filter error_handling

For learning:
  /siftcoder:trace --live      - Watch in real-time
  /siftcoder:explain <question> - Ask about decisions

For post-mortems:
  /siftcoder:trace --export    - Full session export
  Compare traces across sessions

For optimization:
  Look for repeated alternatives
  Identify decision bottlenecks
  Find patterns that slow down

Trace storage:
  Traces are kept for 7 days by default
  /siftcoder:trace clean --older-than 7d
```
