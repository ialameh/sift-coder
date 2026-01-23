---
description: Token/cost awareness - set budgets, track usage, optimize efficiency
argument-hint: set|status|optimize|report
allowed-tools: Read, Write, Bash, Glob
---

# /siftcoder:budget - Token & Cost Awareness

Set and track token budgets for tasks, monitor usage in real-time, get warnings before expensive operations, and optimize for efficiency.

## Usage

```
/siftcoder:budget                    - Show current budget status
/siftcoder:budget set <tokens>       - Set token budget for session
/siftcoder:budget status             - Detailed usage breakdown
/siftcoder:budget optimize           - Get optimization suggestions
/siftcoder:budget report             - Generate cost report
/siftcoder:budget reset              - Reset tracking
```

## How It Works

siftcoder tracks token usage across all operations and provides:
- Real-time usage monitoring
- Warnings before expensive operations
- Optimization suggestions
- Cost analysis reports

## Instructions

### Default: Quick Status

Show current budget and usage:

```
╔══════════════════════════════════════════════════════════════╗
║                    BUDGET STATUS                             ║
╚══════════════════════════════════════════════════════════════╝

Session: 2026-01-12 14:30 - now (2h 15m)

┌─ USAGE ──────────────────────────────────────────────────────┐
│                                                              │
│  Budget:    100,000 tokens                                  │
│  Used:      67,234 tokens (67%)                             │
│  Remaining: 32,766 tokens                                   │
│                                                              │
│  ████████████████████████████░░░░░░░░░░░░ 67%               │
│                                                              │
│  Estimated cost: ~$1.35 (at $0.02/1K tokens)               │
│                                                              │
└──────────────────────────────────────────────────────────────┘

At current rate:
  ~29,800 tokens/hour
  ~30 minutes of budget remaining

Tip: /siftcoder:budget optimize for efficiency suggestions
```

### Command: `set <tokens>`

Set a token budget for the session:

```
/siftcoder:budget set 100000
```

```
BUDGET SET

New budget: 100,000 tokens

Warnings at:
  80% (80,000 tokens) - Soft warning
  95% (95,000 tokens) - Hard warning
  100% - Stop and confirm

Estimated capacity:
  ~3-4 features at current patterns
  ~2-3 hours of active development

Budget active. Track with:
  /siftcoder:budget status
```

### Command: `status`

Detailed usage breakdown:

```
/siftcoder:budget status
```

```
╔══════════════════════════════════════════════════════════════╗
║                  DETAILED BUDGET STATUS                      ║
╚══════════════════════════════════════════════════════════════╝

Budget: 100,000 tokens | Used: 67,234 (67%) | Remaining: 32,766

┌─ USAGE BY OPERATION ─────────────────────────────────────────┐
│                                                              │
│  File reads:        12,450 tokens (19%)  ████                │
│  Code generation:   28,300 tokens (42%)  █████████           │
│  Planning:          15,200 tokens (23%)  █████               │
│  QA/Review:          8,400 tokens (12%)  ███                 │
│  Other:              2,884 tokens (4%)   █                   │
│                                                              │
└──────────────────────────────────────────────────────────────┘

┌─ USAGE BY FEATURE ───────────────────────────────────────────┐
│                                                              │
│  heal.md:           18,500 tokens                           │
│  checkpoint.md:     16,200 tokens                           │
│  preview.md:        12,800 tokens                           │
│  trace.md:          11,400 tokens                           │
│  handoff.md:         8,334 tokens (in progress)             │
│                                                              │
└──────────────────────────────────────────────────────────────┘

┌─ USAGE TIMELINE ─────────────────────────────────────────────┐
│                                                              │
│  14:30  ░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░  Start              │
│  14:45  ████░░░░░░░░░░░░░░░░░░░░░░░░░░  15K (heal.md)      │
│  15:00  ████████░░░░░░░░░░░░░░░░░░░░░░  31K (+checkpoint)  │
│  15:15  ████████████░░░░░░░░░░░░░░░░░░  44K (+preview)     │
│  15:30  ████████████████░░░░░░░░░░░░░░  55K (+trace)       │
│  15:45  ████████████████████░░░░░░░░░░  67K (+handoff)     │
│                                                              │
│  Average: 29,800 tokens/hour                                │
│                                                              │
└──────────────────────────────────────────────────────────────┘

┌─ EFFICIENCY METRICS ─────────────────────────────────────────┐
│                                                              │
│  Tokens per feature:      ~13,500 average                   │
│  Tokens per 100 LOC:      ~2,100                            │
│  Retry overhead:          8% (below average)                │
│  Context reuse:           72% (good)                        │
│                                                              │
└──────────────────────────────────────────────────────────────┘
```

### Command: `optimize`

Get suggestions to reduce token usage:

```
/siftcoder:budget optimize
```

```
╔══════════════════════════════════════════════════════════════╗
║                  OPTIMIZATION SUGGESTIONS                    ║
╚══════════════════════════════════════════════════════════════╝

Current efficiency: 72% | Target: 85%

┌─ HIGH IMPACT ────────────────────────────────────────────────┐
│                                                              │
│  [1] Reduce file re-reads                                   │
│      Issue:    Reading same files multiple times            │
│      Files:    src/auth/login.ts (read 4 times)            │
│      Savings:  ~3,200 tokens (5%)                          │
│      Action:   Use cached file contents                     │
│                                                              │
│  [2] Batch similar operations                               │
│      Issue:    Sequential small edits to same file          │
│      Example:  5 edits to checkpoint.md in sequence         │
│      Savings:  ~2,100 tokens (3%)                          │
│      Action:   Combine into single edit operation           │
│                                                              │
└──────────────────────────────────────────────────────────────┘

┌─ MEDIUM IMPACT ──────────────────────────────────────────────┐
│                                                              │
│  [3] Optimize planning prompts                              │
│      Issue:    Verbose planning context                     │
│      Savings:  ~1,500 tokens (2%)                          │
│      Action:   Use structured templates                     │
│                                                              │
│  [4] Reduce QA verbosity                                    │
│      Issue:    Full test output in QA phase                 │
│      Savings:  ~800 tokens (1%)                            │
│      Action:   Summarize test results only                  │
│                                                              │
└──────────────────────────────────────────────────────────────┘

┌─ CONFIGURATION TWEAKS ───────────────────────────────────────┐
│                                                              │
│  Set trace level to "decisions" instead of "verbose"        │
│  Enable file content caching                                │
│  Use incremental context for similar tasks                  │
│                                                              │
│  Apply all optimizations? [Yes / No / Select]               │
│                                                              │
└──────────────────────────────────────────────────────────────┘

Potential savings: ~7,600 tokens (11%)
```

### Command: `report`

Generate a detailed cost report:

```
/siftcoder:budget report
```

```
╔══════════════════════════════════════════════════════════════╗
║                     COST REPORT                              ║
║              Session: 2026-01-12 14:30                      ║
╚══════════════════════════════════════════════════════════════╝

Duration: 2h 15m
Total tokens: 67,234
Estimated cost: $1.35

┌─ COST BREAKDOWN ─────────────────────────────────────────────┐
│                                                              │
│  By Model:                                                   │
│    Claude Sonnet:   65,000 tokens  $1.30                    │
│    Claude Haiku:     2,234 tokens  $0.05                    │
│                                                              │
│  By Phase:                                                   │
│    Planning:        $0.30 (22%)                             │
│    Coding:          $0.56 (42%)                             │
│    QA:              $0.17 (13%)                             │
│    File Ops:        $0.25 (18%)                             │
│    Other:           $0.07 (5%)                              │
│                                                              │
└──────────────────────────────────────────────────────────────┘

┌─ EFFICIENCY ANALYSIS ────────────────────────────────────────┐
│                                                              │
│  Cost per feature:     $0.27 average                        │
│  Cost per 100 LOC:     $0.04                                │
│  Retry overhead:       $0.11 (8%)                           │
│                                                              │
│  Compared to benchmarks:                                     │
│    Your efficiency: 72%                                     │
│    Average:         65%                                     │
│    Best:            85%                                     │
│                                                              │
│  Status: Above average efficiency                           │
│                                                              │
└──────────────────────────────────────────────────────────────┘

┌─ PROJECTIONS ────────────────────────────────────────────────┐
│                                                              │
│  At current rate:                                            │
│    Features/budget: ~5 features per 100K tokens             │
│    Daily budget:    ~$5-10 for active development          │
│    Monthly:         ~$100-200 estimated                     │
│                                                              │
└──────────────────────────────────────────────────────────────┘

Export report:
  .claude/siftcoder-state/reports/cost-2026-01-12.json
  .claude/siftcoder-state/reports/cost-2026-01-12.md
```

## Budget Warnings

### Soft Warning (80%)

```
BUDGET WARNING (80%)

You've used 80,000 of 100,000 tokens.

Remaining: 20,000 tokens (~2 small features)

Options:
  [1] Continue (remaining budget)
  [2] Optimize first (/siftcoder:budget optimize)
  [3] Extend budget (/siftcoder:budget set 150000)

Select: [1/2/3]
```

### Hard Warning (95%)

```
BUDGET CRITICAL (95%)

Only 5,000 tokens remaining!

Current task: handoff.md
Estimated to complete: ~3,000 tokens

Options:
  [1] Complete current task only
  [2] Stop immediately
  [3] Extend budget

Recommend: Complete current task, then pause.
```

### Budget Exceeded

```
BUDGET EXCEEDED

100,000 token budget reached.

Session summary:
  Features completed: 5
  In progress: 1 (handoff.md at 80%)

To continue:
  /siftcoder:budget set 120000

Or review:
  /siftcoder:budget report
```

## Configuration

```json
{
  "budget": {
    "defaultLimit": 100000,
    "softWarning": 0.8,
    "hardWarning": 0.95,
    "stopOnExceed": true,
    "trackByModel": true,
    "costPerToken": {
      "sonnet": 0.00002,
      "haiku": 0.00001
    },
    "optimizations": {
      "cacheFileContents": true,
      "batchEdits": true,
      "incrementalContext": true
    }
  }
}
```

## Integration with Other Commands

### With `/siftcoder:swarm`

Track budget across parallel agents:

```
SWARM BUDGET

Total budget: 100,000 tokens
Per agent:    ~33,000 tokens

Agent 1 (auth):         12,000 used
Agent 2 (payments):     15,000 used
Agent 3 (notifications): 8,000 used
────────────────────────────────
Total used:             35,000 (35%)
```

### With `/siftcoder:status`

Status shows budget overview:

```
┌─ BUDGET ─────────────────────────────────────────────────────┐
│                                                              │
│  Used: 67,234 / 100,000 (67%)                               │
│  Cost: ~$1.35                                               │
│  ████████████████████░░░░░░░░░░ 67%                         │
│                                                              │
└──────────────────────────────────────────────────────────────┘
```

## Tips

```
BUDGET MANAGEMENT TIPS

Setting budgets:
  - 50K tokens: Quick fix or single feature
  - 100K tokens: 3-5 features (typical session)
  - 200K tokens: Large build from spec

Reducing costs:
  - Use --preview to avoid wasted edits
  - Batch similar tasks together
  - Run /siftcoder:optimize before big tasks

Monitoring:
  - Check /siftcoder:budget regularly
  - Set up warnings at 80%
  - Review reports weekly

For teams:
  - Track budget per project
  - Compare efficiency across features
  - Set team-wide limits
```
