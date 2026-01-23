# /siftcoder:gap-analysis - Bidirectional Spec ↔ Code Analysis

Find gaps between specification and implementation, plus discover undocumented features.

## Usage

```
/siftcoder:gap-analysis <spec-file>
```

## Arguments
- `$ARGUMENTS` - Path to specification file (markdown, JSON, or YAML)

## Instructions

You are performing bidirectional gap analysis between a specification and codebase. This identifies:
- **Gaps**: Requirements in spec but missing/partial in code
- **Extras**: Features in code but not documented in spec

---

## Phase 0: Interactive Setup

**Use AskUserQuestion tool:**
```
Question: "How thorough should the analysis be?"
Header: "Depth"
Options:
- "Standard (Recommended)" - "Semantic matching with vector search (~10 min)"
- "Quick" - "Structure matching only, faster but less accurate (~2 min)"
- "Deep" - "Full code reading per requirement (~30 min)"
```

**Use AskUserQuestion tool:**
```
Question: "What should I analyze?"
Header: "Direction"
Options:
- "Both (Recommended)" - "Find gaps AND undocumented features"
- "Gaps only" - "Just find missing implementations"
- "Extras only" - "Just find undocumented code"
```

**Use AskUserQuestion tool:**
```
Question: "Focus on specific areas?"
Header: "Scope"
Options:
- "Entire codebase" - "Analyze all source directories"
- "Specify directories" - "I'll tell you which folders to analyze"
```

---

## Phase 1: Spec Parsing

Read and parse the specification file:

```
PARSING SPECIFICATION...

File: [spec path]
Format: [markdown/json/yaml]
```

Use the **spec-analyzer** skill to extract requirements:

```
REQUIREMENTS EXTRACTED

Total: [N] requirements

By Priority:
├── P0 (Critical): [count]
├── P1 (High): [count]
├── P2 (Medium): [count]
└── P3 (Low): [count]

Sections:
├── [Section 1]: [count] requirements
├── [Section 2]: [count] requirements
└── [Section 3]: [count] requirements
```

Store requirements in: `.claude/siftcoder-state/gap-analysis/requirements.json`

---

## Phase 2: Crawl Plan Generation

Scan the codebase structure and create exploration strategy:

```
GENERATING CRAWL PLAN...

Codebase Structure:
├── src/           [X files]
│   ├── auth/      [X files] ← Likely: REQ-001, REQ-003
│   ├── api/       [X files] ← Likely: REQ-002, REQ-005
│   ├── services/  [X files] ← Likely: REQ-004
│   └── utils/     [X files] ← No matching requirements
├── tests/         [X files]
└── config/        [X files]
```

**Pre-mapping Strategy:**
1. Match requirement keywords to folder/file names
2. If `/siftcoder:understand` was run, use captured knowledge
3. If siftcoder-mcp available, use vector similarity

```
CRAWL PLAN

Areas to explore: [N]
├── Area 1: src/auth/      → 5 requirements mapped
├── Area 2: src/api/       → 8 requirements mapped
├── Area 3: src/services/  → 4 requirements mapped
├── Area 4: src/models/    → 3 requirements mapped
└── [Skip]: src/utils/     → 0 requirements mapped

Strategy: Parallel exploration with [N] subagents
Estimated context: [X]K tokens per area
```

Store in: `.claude/siftcoder-state/gap-analysis/crawl-plan.json`

---

## Phase 3: Systematic Exploration

For each area, spawn a subagent to explore:

```
BEGINNING SYSTEMATIC EXPLORATION...

[Progress indicator as areas complete]

Area 1/4: src/auth/
├── Exploring...
├── Found: 3 implementations
├── Partial: 1 implementation
├── Missing: 1 requirement
├── EXTRA: Admin bypass feature (not in spec)
└── ✓ Complete

Area 2/4: src/api/
├── Exploring...
└── ...
```

**Subagent Instructions:**
Each subagent receives:
1. List of requirements likely in this area
2. Area path to explore
3. Instructions to report:
   - Implementation status per requirement
   - File locations
   - Missing acceptance criteria
   - Any features NOT matching spec requirements (extras)

Store results in: `.claude/siftcoder-state/gap-analysis/area-reports/`

---

## Phase 4: Semantic Matching (if siftcoder-mcp available)

If siftcoder-mcp is running:

```
SEMANTIC MATCHING...

Generating embeddings for [N] requirements...
Generating embeddings for [M] discovered code sections...

Cross-matching...
├── High confidence matches: [X]
├── Medium confidence matches: [Y]
├── Low/no matches (gaps): [Z]
└── Unmatched code (extras): [W]
```

**Matching Process:**
1. For each requirement, search code embeddings
2. Calculate similarity scores
3. Threshold (default 0.7) determines "implemented"
4. Cross-validate with subagent findings

**Fallback without MCP:**
- Use keyword matching
- Rely on subagent analysis
- Report lower confidence scores

---

## Phase 5: Generate Report

Create comprehensive bidirectional report:

```
ANALYSIS COMPLETE
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

COVERAGE SUMMARY

┌─────────────────────────────────────────────────────────┐
│ SPEC COVERAGE: 75%                                      │
│                                                         │
│ ✓ Implemented:  15 requirements                         │
│ ◐ Partial:       3 requirements                         │
│ ✗ Missing:       2 requirements (GAPS)                  │
│                                                         │
│ CODE DOCUMENTATION: 80%                                 │
│                                                         │
│ ✓ Documented:   16 features                             │
│ ? Undocumented:  4 features (EXTRAS)                    │
└─────────────────────────────────────────────────────────┘

CRITICAL GAPS (P0)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

1. REQ-003: Password Reset
   Status: MISSING
   Expected: src/auth/
   Evidence: No password reset logic found
   → /siftcoder:add-feature "Password reset with email verification"

2. REQ-017: Rate Limiting
   Status: PARTIAL (30%)
   Implemented: Basic middleware in src/middleware/rateLimit.ts
   Missing: Redis backend, per-user limits, configurable thresholds
   → /siftcoder:fix "Complete rate limiting implementation"

UNDOCUMENTED CODE (EXTRAS)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

1. EXTRA-001: Admin Dashboard
   Location: src/admin/ (12 files, ~2400 LOC)
   Description: User management, analytics, system settings
   → /siftcoder:reverse-spec --area src/admin/

2. EXTRA-002: WebSocket Notifications
   Location: src/realtime/ (4 files, ~600 LOC)
   Description: Real-time push notifications
   → Add to specification document

FULL REPORT: .claude/siftcoder-state/gap-analysis/report.md

NEXT STEPS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Address gaps:
→ /siftcoder:add-feature "Password reset with email verification"
→ /siftcoder:fix "Complete rate limiting"

Document extras:
→ /siftcoder:reverse-spec --area src/admin/
→ Edit spec to include WebSocket feature

View full report:
→ cat .claude/siftcoder-state/gap-analysis/report.md
```

---

## Output Files

Generate these files:

### `.claude/siftcoder-state/gap-analysis/report.md`

Full markdown report with all details.

### `.claude/siftcoder-state/gap-analysis/report.json`

Machine-readable version:

```json
{
  "analyzedAt": "2026-01-10T...",
  "spec": {
    "file": "./SPEC.md",
    "totalRequirements": 20
  },
  "coverage": {
    "implemented": 15,
    "partial": 3,
    "missing": 2,
    "percentage": 75
  },
  "extras": {
    "count": 4,
    "documented": false
  },
  "gaps": [
    {
      "id": "REQ-003",
      "title": "Password Reset",
      "priority": "P0",
      "status": "missing",
      "expectedLocation": "src/auth/",
      "suggestedAction": "/siftcoder:add-feature \"Password reset\""
    }
  ],
  "undocumented": [
    {
      "id": "EXTRA-001",
      "title": "Admin Dashboard",
      "location": "src/admin/",
      "files": 12,
      "loc": 2400,
      "suggestedAction": "/siftcoder:reverse-spec --area src/admin/"
    }
  ]
}
```

---

## Integration

### After Gap Analysis

| Finding | Recommended Command |
|---------|---------------------|
| Missing feature | `/siftcoder:add-feature "description"` |
| Partial implementation | `/siftcoder:fix "complete the feature"` |
| Undocumented code | `/siftcoder:reverse-spec --area path/` |
| Need more context | `/siftcoder:understand` then re-run |
| Want feature ideas | `/siftcoder:ideate` on the gap |

### Re-running Analysis

After making changes:
```
/siftcoder:gap-analysis ./SPEC.md
```

The analysis will show improved coverage.

---

## Tips & Hints

```
GETTING THE MOST FROM GAP ANALYSIS

Before running:
  → Run /siftcoder:understand first for better matching
  → Ensure spec file has clear, testable requirements
  → Use section headers in spec for better mapping

Understanding results:
  → "Partial" means some acceptance criteria met
  → "Extras" are features that should be documented
  → Confidence % reflects matching certainty

Improving coverage:
  → Address P0 gaps first (critical)
  → Use suggested commands directly
  → Re-run after changes to track progress

For large codebases:
  → Use --areas to focus on specific directories
  → Run in "quick" mode first for overview
  → Deep mode for final verification
```

---

## Allowed Tools
Read, Write, Glob, Grep, Bash, Task, AskUserQuestion

## Skills Used
- **spec-analyzer** - Extract requirements from specification
- **gap-analyzer** - Gap detection and matching logic
- **pattern-detector** - Identify code patterns (if /understand ran)
