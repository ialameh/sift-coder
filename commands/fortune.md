---
description: Technical Debt Fortune Telling - Predicts which tech debt will cause problems and when
argument-hint: [--predict|--timeline|--cost]
allowed-tools: Read, Glob, Grep, Bash, Task
---

# /siftcoder:fortune - Technical Debt Fortune Telling

Predicts which technical debt will cause problems and when. See the future of your codebase and act before disasters strike.

## Usage

```
/siftcoder:fortune                     - Show predictions
/siftcoder:fortune --timeline          - Time-based predictions
/siftcoder:fortune --cost              - Cost projections
/siftcoder:fortune --hotspots          - High-risk areas
```

## Philosophy

```
Technical debt compounds like financial debt.
Small problems become big problems.

A function with 100 lines today will have 200 tomorrow.
A test suite taking 5 minutes will take 15 next quarter.
A file touched by everyone will cause merge conflicts forever.

Fortune telling uses:
  • Growth rate analysis (how fast is it getting worse?)
  • Change frequency (how often is this modified?)
  • Complexity trends (is complexity increasing?)
  • Industry patterns (what usually breaks at scale?)

To predict when debt will become painful.
```

## Instructions

### Default: Show Predictions

```
/siftcoder:fortune
```

```
TECHNICAL DEBT FORTUNE
═══════════════════════════════════════════════════════════════

Reading your codebase's future... 🔮


┌─ NEXT 30 DAYS ───────────────────────────────────────────────┐
│                                                               │
│  [CRITICAL] src/api/routes/index.ts                         │
│  ─────────────────────────────────────────────────────────   │
│  Prediction: Will become unmaintainable                      │
│                                                               │
│  Current state:                                               │
│    Lines: 2,847                                              │
│    Growth rate: +180 lines/week                              │
│    Contributors: 8 (everyone touches it)                     │
│    Merge conflicts: 12 last month                            │
│                                                               │
│  Trajectory:                                                  │
│    Week 1: 3,000 lines (pain threshold)                     │
│    Week 2: 3,200 lines                                       │
│    Week 3: 3,400 lines                                       │
│    Week 4: 3,600 lines (critical mass)                      │
│                                                               │
│  Predicted impact:                                            │
│    • New features take 2x longer (context switching)         │
│    • Onboarding time +3 days (for new devs)                 │
│    • Bug rate +40% (too much to hold in head)               │
│                                                               │
│  Recommended action: Split into domain modules NOW           │
│  Estimated fix time: 4-6 hours                              │
│  ROI: Pays back in 2 weeks                                   │
│                                                               │
│                                                               │
│  [HIGH] Test suite execution time                            │
│  ─────────────────────────────────────────────────────────   │
│  Prediction: Will exceed patience threshold                  │
│                                                               │
│  Current state:                                               │
│    Duration: 4.2 minutes                                     │
│    Growth rate: +25 seconds/week                             │
│    Tests added: ~15/week                                     │
│                                                               │
│  Trajectory:                                                  │
│    Week 4: 5.5 minutes                                       │
│    Week 8: 7 minutes                                         │
│    Week 12: 10 minutes (people stop running tests)          │
│                                                               │
│  Predicted impact:                                            │
│    • Developers skip local testing                           │
│    • CI becomes bottleneck                                   │
│    • Bug escape rate increases                               │
│                                                               │
│  Recommended action: Parallelize test suite                  │
│  Estimated fix time: 2-3 hours                              │
│                                                               │
└───────────────────────────────────────────────────────────────┘


┌─ NEXT 90 DAYS ───────────────────────────────────────────────┐
│                                                               │
│  [HIGH] Database query performance                           │
│  ─────────────────────────────────────────────────────────   │
│  Prediction: Queries will start timing out                   │
│                                                               │
│  Current state:                                               │
│    Avg query time: 145ms                                     │
│    Table growth: +50K rows/week                              │
│    Missing indexes: 3 detected                               │
│                                                               │
│  Trajectory:                                                  │
│    Month 1: 200ms average                                    │
│    Month 2: 400ms average                                    │
│    Month 3: 1200ms (timeout threshold)                       │
│                                                               │
│  Predicted impact:                                            │
│    • User-facing slowness                                    │
│    • Timeout errors during peak                              │
│    • Emergency weekend debugging                             │
│                                                               │
│  Recommended action: Add indexes, optimize N+1 queries       │
│  Estimated fix time: 4 hours                                │
│                                                               │
│                                                               │
│  [MEDIUM] Dependency freshness                               │
│  ─────────────────────────────────────────────────────────   │
│  Prediction: Security vulnerabilities will accumulate        │
│                                                               │
│  Current state:                                               │
│    Outdated packages: 23                                     │
│    Major versions behind: 8                                  │
│    Known vulnerabilities: 2 (low severity)                   │
│                                                               │
│  Trajectory:                                                  │
│    Month 1: 4 vulnerabilities                               │
│    Month 2: 7 vulnerabilities                               │
│    Month 3: 12 vulnerabilities (audit failure)              │
│                                                               │
│  Recommended action: Monthly dependency update routine        │
│                                                               │
└───────────────────────────────────────────────────────────────┘


┌─ NEXT 12 MONTHS ─────────────────────────────────────────────┐
│                                                               │
│  [MEDIUM] Architecture bottleneck                            │
│  ─────────────────────────────────────────────────────────   │
│  Prediction: Monolith will need splitting                    │
│                                                               │
│  Current trajectory suggests:                                 │
│    • Team size will outgrow single repo efficiency           │
│    • Deploy frequency will decrease (too risky)              │
│    • Feature velocity will plateau                           │
│                                                               │
│  When to start planning: Month 6-9                           │
│  When critical: Month 10-12                                  │
│                                                               │
│  Not urgent now, but should be on roadmap.                   │
│                                                               │
└───────────────────────────────────────────────────────────────┘


FORTUNE SUMMARY
═══════════════════════════════════════════════════════════════

  Next 30 days: 2 critical issues
  Next 90 days: 2 high issues
  Next 12 months: 1 strategic decision

  If you address top 2 issues:
    Developer time saved: ~8 hours/week/developer
    Bug reduction: ~35%
    Onboarding improvement: 3 days faster

  If you don't address them:
    Technical debt growth: +200% in 6 months
    Velocity reduction: 40% by Q3
    Team morale impact: Significant

[Fix Critical Now] [Add to Roadmap] [Generate Report] [Ignore at Peril]
```

### Command: `--timeline`

Visual timeline of predictions:

```
/siftcoder:fortune --timeline
```

```
TECHNICAL DEBT TIMELINE
═══════════════════════════════════════════════════════════════

          NOW                   +30d        +90d        +180d
           │                      │           │           │
ROUTES FILE━━━━━━━━━■━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
           │        ▲             │           │           │
           │    Critical          │           │           │
           │                      │           │           │
TEST SUITE ━━━━━━━━━━━━━━━━━■━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
           │                 ▲    │           │           │
           │             Annoying │           │           │
           │                      │           │           │
DB QUERIES ━━━━━━━━━━━━━━━━━━━━━━━━━━━■━━━━━━━━━━━━━━━━━━━━━━
           │                      │   ▲       │           │
           │                      │  Timeout  │           │
           │                      │           │           │
DEPS       ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━■━━━━━━━━━━━━━━━━━━
           │                      │           ▲           │
           │                      │       Audit fail      │
           │                      │           │           │
MONOLITH   ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━■━━━━
           │                      │           │           ▲
           │                      │           │       Split needed
           │                      │           │           │

Legend:
  ━━━ Accumulating debt
  ■   Pain point / threshold
  ▲   Action needed

[Export Timeline] [Show Details] [Add to Calendar]
```

### Command: `--cost`

Cost projections:

```
/siftcoder:fortune --cost
```

```
TECHNICAL DEBT COST PROJECTION
═══════════════════════════════════════════════════════════════

Assuming: $100/hour fully loaded developer cost


CURRENT DEBT COSTS (Monthly)
─────────────────────────────────────────────────────────────────

  Routes file complexity:
    Extra time per feature:    +2 hours
    Features per month:        8
    Monthly cost:              $1,600

  Test suite slowness:
    Waiting time per dev:      15 min/day
    Developers:                5
    Monthly cost:              $2,500

  Merge conflicts:
    Time per conflict:         30 min
    Conflicts per month:       12
    Monthly cost:              $600

  Onboarding overhead:
    Extra onboarding time:     3 days
    New hires per quarter:     2
    Monthly cost:              $800

  TOTAL CURRENT:               $5,500/month


PROJECTED COSTS (If Not Addressed)
─────────────────────────────────────────────────────────────────

  Month 1:    $5,500  (current)
  Month 2:    $6,800  (+24%)
  Month 3:    $8,400  (+53%)
  Month 6:    $14,200 (+158%)
  Month 12:   $28,500 (+418%)

  12-month cumulative cost: $156,000


FIX COSTS vs DEBT COSTS
─────────────────────────────────────────────────────────────────

  Issue              Fix Cost    Monthly Savings    Payback
  ─────────────────────────────────────────────────────────────
  Split routes       $600        $1,600            <1 month
  Parallelize tests  $300        $2,500            <1 week
  Add DB indexes     $400        $800              <1 month
  Dependency update  $200        $400              <1 month

  TOTAL FIX COST:    $1,500
  MONTHLY SAVINGS:   $5,300
  ROI:               4,240% annually


RECOMMENDATION
─────────────────────────────────────────────────────────────────

Invest $1,500 (15 developer hours) now to save $63,600/year.

This is equivalent to:
  • Hiring 0.5 additional developers
  • 3 months of runway extension
  • 1,272 cups of coffee

[Generate Investment Proposal] [Export to Spreadsheet]
```

## Configuration

```json
{
  "fortune": {
    "analysisDepth": "deep",
    "projectionMonths": 12,
    "costPerHour": 100,
    "teamSize": 5,
    "thresholds": {
      "testDuration": 600,
      "fileLines": 1000,
      "queryTime": 1000
    }
  }
}
```

## Integration

Works well with:
  • `/siftcoder:empathy` - Find frustrating code now
  • `/siftcoder:refactor debt` - Address detected debt
  • `/siftcoder:budget` - Track fix investment
  • `/siftcoder:heal` - Auto-fix simple debt
