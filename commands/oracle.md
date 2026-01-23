---
description: Predictive Intent Engine - Predicts what you're about to do before you ask
argument-hint: [--learn|--suggest|--patterns|--disable]
allowed-tools: Read, Glob, Grep, Task, AskUserQuestion
---

# /siftcoder:oracle - Predictive Intent Engine

Predicts what you're about to do based on your patterns, file access, and development rhythm. The AI that knows what you want before you ask.

## Usage

```
/siftcoder:oracle                      - Show predictions now
/siftcoder:oracle --learn              - Train on your patterns
/siftcoder:oracle --suggest            - Get proactive suggestions
/siftcoder:oracle --patterns           - View learned patterns
/siftcoder:oracle --disable            - Turn off predictions
```

## Philosophy

```
The best AI doesn't wait for instructions.
It anticipates.

Traditional AI:
  You: "Add error handling to payment flow"
  AI: [does it]

Oracle AI:
  AI: "Based on your patterns, you probably want to
       add error handling to payment flow next.
       You've been reading payment.ts and error.ts,
       similar to what you did in auth.ts yesterday."
  You: "Yes, do it"
```

## How It Works

```
┌─────────────────────────────────────────────────────────────┐
│                   ORACLE PREDICTION ENGINE                  │
└─────────────────────────────────────────────────────────────┘

         Your Actions                    Predictions
              │                               │
              ▼                               │
    ┌──────────────────┐                      │
    │  Pattern Tracker │                      │
    │  ├── File access │                      │
    │  ├── Edit types  │                      │
    │  ├── Time of day │                      │
    │  └── Sequences   │                      │
    └────────┬─────────┘                      │
             │                                │
             ▼                                │
    ┌──────────────────┐                      │
    │ Historical Match │                      │
    │ "You did X after │──────────────────────┤
    │  similar actions"│                      │
    └────────┬─────────┘                      │
             │                                │
             ▼                                ▼
    ┌──────────────────┐            ┌──────────────────┐
    │  Intent Model    │            │   Prediction     │
    │  P(next_action)  │───────────►│   "87% you want  │
    │                  │            │    to do X next" │
    └──────────────────┘            └──────────────────┘
```

## Instructions

### Default: Show Current Predictions

Analyze recent activity and predict next actions:

```
ORACLE PREDICTIONS
═══════════════════════════════════════════════════════════════

Based on your recent activity, I predict:

┌─ PREDICTION #1 (87% confidence) ─────────────────────────────┐
│                                                               │
│  You want to: Add error handling to payment flow             │
│                                                               │
│  Evidence:                                                    │
│  ├── You read payment.ts 3 times in last 15 minutes          │
│  ├── You read error.ts and exception-handler.ts              │
│  ├── Yesterday you added error handling to auth.ts           │
│  ├── Your commit history shows this pattern after new features│
│  └── Current payment.ts has no try/catch blocks              │
│                                                               │
│  If I'm right, I can:                                        │
│  ├── Add try/catch to async payment functions                │
│  ├── Create custom PaymentError class                        │
│  └── Add error logging similar to auth.ts                    │
│                                                               │
└───────────────────────────────────────────────────────────────┘

┌─ PREDICTION #2 (65% confidence) ─────────────────────────────┐
│                                                               │
│  You want to: Write tests for payment validation             │
│                                                               │
│  Evidence:                                                    │
│  ├── You usually write tests after implementation            │
│  ├── payment.ts was recently modified                        │
│  ├── No test file exists for payment validation              │
│  └── Your pattern: implement → manual test → unit test       │
│                                                               │
└───────────────────────────────────────────────────────────────┘

┌─ PREDICTION #3 (42% confidence) ─────────────────────────────┐
│                                                               │
│  You want to: Update API documentation                       │
│                                                               │
│  Evidence:                                                    │
│  ├── Payment endpoint changed                                │
│  ├── You updated docs after auth changes last week           │
│  └── OpenAPI spec is now out of sync                         │
│                                                               │
└───────────────────────────────────────────────────────────────┘

[1] Do Prediction #1  [2] Do #2  [3] Do #3  [?] None of these
```

### Command: `--learn`

Train Oracle on your patterns:

```
/siftcoder:oracle --learn
```

```
ORACLE LEARNING MODE
═══════════════════════════════════════════════════════════════

Analyzing your development patterns...

┌─ FILE ACCESS PATTERNS ───────────────────────────────────────┐
│                                                               │
│  Morning (6am-12pm):                                          │
│  ├── Usually start with: tests, then implementation          │
│  ├── Preferred files: src/api/*, tests/*                     │
│  └── Typical session: 2-3 hours focused                      │
│                                                               │
│  Afternoon (12pm-6pm):                                        │
│  ├── Usually: bug fixes, refactoring                         │
│  ├── Preferred files: src/utils/*, configs                   │
│  └── Typical session: 1-2 hours fragmented                   │
│                                                               │
│  Evening (6pm-12am):                                          │
│  ├── Usually: documentation, planning                        │
│  ├── Preferred files: *.md, docs/*                           │
│  └── Typical session: 30min-1hour                            │
│                                                               │
└───────────────────────────────────────────────────────────────┘

┌─ DEVELOPMENT SEQUENCES ──────────────────────────────────────┐
│                                                               │
│  Sequence 1 (seen 23 times):                                 │
│    Read model → Read service → Edit service → Run tests      │
│                                                               │
│  Sequence 2 (seen 18 times):                                 │
│    Edit file → Run app → Edit file → Commit                  │
│                                                               │
│  Sequence 3 (seen 15 times):                                 │
│    Read error log → Grep codebase → Edit source → Test       │
│                                                               │
│  Sequence 4 (seen 12 times):                                 │
│    New feature → Add tests → Update docs                     │
│                                                               │
└───────────────────────────────────────────────────────────────┘

┌─ YOUR PREFERENCES ───────────────────────────────────────────┐
│                                                               │
│  Code style:                                                  │
│  ├── Prefer async/await over callbacks                       │
│  ├── Prefer named exports over default                       │
│  ├── Prefer functional over class-based                      │
│  └── Test coverage usually 70-80%                            │
│                                                               │
│  When fixing bugs:                                            │
│  ├── First action: reproduce locally                         │
│  ├── Then: add failing test                                  │
│  ├── Then: fix implementation                                │
│  └── Then: verify test passes                                │
│                                                               │
│  When adding features:                                        │
│  ├── First: read related code                                │
│  ├── Then: modify/create files                               │
│  ├── Then: test manually                                     │
│  ├── Then: write tests                                       │
│  └── Then: update docs (sometimes)                           │
│                                                               │
└───────────────────────────────────────────────────────────────┘

Patterns learned: 47
Confidence in predictions: HIGH

Oracle is ready to predict your next moves.
```

### Command: `--suggest`

Proactive suggestion mode (appears automatically):

```
/siftcoder:oracle --suggest
```

```
PROACTIVE SUGGESTIONS ENABLED

Oracle will now surface predictions when confident.

Trigger conditions:
  • >80% confidence in prediction
  • Significant time saved if correct
  • Non-intrusive timing (between tasks)

Example appearance:

  ┌─ ORACLE SUGGESTS ──────────────────────────────────────────┐
  │                                                             │
  │  Based on your pattern, you might want to:                 │
  │                                                             │
  │  → Add input validation to createUser()                    │
  │                                                             │
  │  You just added validation to updateUser().                │
  │  createUser() has the same parameters but no validation.   │
  │                                                             │
  │  [Yes, do it] [Not now] [Never suggest this]               │
  │                                                             │
  └─────────────────────────────────────────────────────────────┘

Disable with: /siftcoder:oracle --disable
```

### Command: `--patterns`

View all learned patterns:

```
/siftcoder:oracle --patterns
```

```
LEARNED PATTERNS
═══════════════════════════════════════════════════════════════

┌─ HIGH-CONFIDENCE PATTERNS ───────────────────────────────────┐
│                                                               │
│  After editing a model file, you usually:                    │
│    93% → Edit corresponding service file                     │
│    87% → Run related tests                                   │
│    72% → Update API route                                    │
│                                                               │
│  After reading error logs, you usually:                      │
│    89% → Search codebase for error message                   │
│    78% → Open the file mentioned in stack trace              │
│                                                               │
│  After completing a feature, you usually:                    │
│    81% → Run full test suite                                 │
│    67% → Update documentation                                │
│    54% → Create commit                                       │
│                                                               │
│  After a test fails, you usually:                            │
│    91% → Open the tested file                                │
│    84% → Add console.log (then remove later)                 │
│    72% → Run just that test in isolation                     │
│                                                               │
└───────────────────────────────────────────────────────────────┘

┌─ TIME-BASED PATTERNS ────────────────────────────────────────┐
│                                                               │
│  Monday mornings: Usually review PRs first                   │
│  Friday afternoons: Usually documentation/cleanup            │
│  After lunch: Lower focus, prefer simple tasks               │
│  Late sessions: More experimental, less testing              │
│                                                               │
└───────────────────────────────────────────────────────────────┘

┌─ PROJECT-SPECIFIC PATTERNS ──────────────────────────────────┐
│                                                               │
│  In this repo, you:                                           │
│  ├── Always run `npm run lint` before commits                │
│  ├── Prefer editing src/utils before src/helpers             │
│  ├── Usually fix TypeScript errors immediately               │
│  └── Often forget to update types.d.ts                       │
│                                                               │
└───────────────────────────────────────────────────────────────┘

Pattern count: 47
Accuracy rate: 78% (based on accepted suggestions)
```

### Prediction Confidence Factors

```
CONFIDENCE CALCULATION
═══════════════════════════════════════════════════════════════

High confidence (>80%):
  • Pattern seen 10+ times
  • Recent similar sequence
  • Multiple evidence sources
  • Matches time-of-day pattern

Medium confidence (50-80%):
  • Pattern seen 5-10 times
  • Some evidence sources
  • Partial sequence match

Low confidence (<50%):
  • Pattern seen <5 times
  • Weak evidence
  • Conflicting signals
  • New type of activity
```

### Privacy & Data

```
DATA HANDLING
═══════════════════════════════════════════════════════════════

Oracle stores:
  ├── File access timestamps (not contents)
  ├── Action sequences (anonymized)
  ├── Time-of-day patterns
  └── Prediction accuracy feedback

Oracle does NOT store:
  ├── Actual file contents
  ├── Code you write
  ├── Personal data
  └── Sensitive patterns

Data location:
  .claude/siftcoder-state/oracle/
  ├── patterns.json
  ├── sequences.json
  └── feedback.json

Clear all data:
  /siftcoder:oracle --reset
```

## Configuration

```json
{
  "oracle": {
    "enabled": true,
    "minConfidence": 0.7,
    "proactiveSuggestions": true,
    "learnFromFeedback": true,
    "timePatterns": true,
    "maxPatterns": 100,
    "privacyMode": false
  }
}
```

## Integration

Works well with:
  • `/siftcoder:handoff` - Preserves patterns across sessions
  • `/siftcoder:pair` - Suggests during pair programming
  • `/siftcoder:focus` - Predictions scoped to focus area
  • `/siftcoder:trace` - See why predictions were made
