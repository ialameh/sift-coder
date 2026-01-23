# Skill: Gap Analyzer

**Detect gaps between specification and implementation**

---

## Overview
- **Purpose**: Compare specification against code to find missing and extra features
- **Type**: Analysis
- **Invoked By**: `/gap-analysis`

---

## What This Skill Does

Performs bidirectional analysis:

### 1. Spec → Code (Missing Features)

Finds requirements in spec that aren't implemented:
- **Missing**: No implementation found
- **Partial**: Some criteria met, others missing
- **Incomplete**: Stub or TODO exists
- **Outdated**: Implemented differently than spec

### 2. Code → Spec (Extra Features)

Finds implemented features not documented:
- Undocumented functionality
- Features without spec entries
- "Shadow IT" in code

---

## Capabilities

### Requirement Extraction

Extract structured requirements from specification:

```json
{
  "requirements": [
    {
      "id": "REQ-001",
      "section": "Authentication",
      "title": "User Login",
      "description": "Users can authenticate with email and password",
      "acceptance": [
        "User can enter email and password",
        "Invalid credentials show error message",
        "Successful login redirects to dashboard",
        "Session persists for 7 days"
      ],
      "keywords": ["login", "auth", "email", "password", "session"],
      "priority": "P0",
      "dependencies": []
    }
  ]
}
```

### Crawl Plan Generation

Creates efficient exploration strategy:

```json
{
  "areas": [
    {
      "id": "area-001",
      "path": "src/auth/",
      "priority": 1,
      "likelyRequirements": ["REQ-001", "REQ-002", "REQ-003"],
      "fileCount": 12,
      "keywords": ["login", "register", "session", "token"],
      "confidence": 0.85
    }
  ]
}
```

### Implementation Detection

For each area, determines implementation status:

```json
{
  "requirementId": "REQ-001",
  "status": "implemented|partial|missing",
  "confidence": 0.85,
  "implementations": [
    {
      "file": "src/auth/login.ts",
      "lines": "15-45",
      "type": "function",
      "name": "authenticateUser",
      "matchedCriteria": [
        "User can enter email and password",
        "Successful login redirects to dashboard"
      ],
      "missingCriteria": [
        "Session persists for 7 days"
      ]
    }
  ],
  "evidence": "Found authenticateUser() with email/password params"
}
```

### Extra Feature Discovery

Identifies features in code not mentioned in spec:

```json
{
  "extras": [
    {
      "id": "EXTRA-001",
      "title": "Admin Dashboard",
      "location": "src/admin/",
      "files": 12,
      "linesOfCode": 2400,
      "description": "Full admin panel with user management, analytics",
      "entryPoints": ["src/admin/index.ts", "src/admin/routes.ts"],
      "suggestedSpecSection": "Administration",
      "importance": "high"
    }
  ]
}
```

---

## Gap Classification

### By Type

| Type | Description | Example |
|------|-------------|---------|
| `missing` | No implementation found | Feature entirely absent |
| `partial` | Some criteria met | Login works, but no session persistence |
| `incomplete` | Stub or TODO | Function exists but not implemented |
| `outdated` | Implemented differently | Spec says X, code does Y |

### By Severity

```
CRITICAL (P0):
  - Security features (auth, encryption)
  - Core business logic
  - Blocking other features

HIGH (P1):
  - Important user-facing features
  - Performance requirements
  - Integration points

MEDIUM (P2):
  - Enhancement features
  - Nice-to-have functionality
  - Non-critical paths

LOW (P3):
  - Documentation requirements
  - Minor improvements
```

---

## Detection Methods

### 1. Keyword Matching

Requirement keywords → folder/file names:
- "authentication" → likely in `auth/`, `login/`, `session/`
- "payment" → likely in `payment/`, `checkout/`, `billing/`

### 2. Semantic Analysis (with MCP)

If siftcoder-mcp is available:
- Generate embeddings for requirements
- Generate embeddings for code sections
- Cross-match for similarity scores
- Threshold (0.7) determines match

### 3. Test Coverage

Test names often mirror requirements:
- Check for tests covering the requirement
- Test assertions indicate implemented criteria
- Missing tests may indicate missing features

---

## Report Generation

Generates comprehensive analysis report with sections:

1. **Executive Summary**
   - Coverage percentages
   - Critical gaps count
   - Undocumented features count

2. **Gap Details**
   - Per requirement: status, evidence, suggested action
   - Grouped by section/priority

3. **Extras Details**
   - Per feature: location, description, documentation suggestion

4. **Coverage Matrix**
   - Section-by-section breakdown
   - Visual representation

5. **Recommendations**
   - Prioritized action items
   - Suggested SiftCoder commands

---

## Examples

### Gap Analysis Output

```bash
/siftcoder:gap-analysis spec.md
```

**Output:**
```
📊 GAP ANALYSIS REPORT

SUMMARY:
  Spec Coverage: 75%
  Critical Gaps: 2
  High Gaps: 5
  Undocumented Features: 3

GAPS:

CRITICAL (P0):

1. REQ-001: User Authentication
   Status: PARTIAL
   Location: src/auth/login.ts
   Missing: Session persistence (7-day)
   Action: Add session token with 7-day expiration

HIGH (P1):

2. REQ-005: Payment Processing
   Status: MISSING
   Location: None found
   Action: Implement payment feature

EXTRAS:

1. EXTRA-001: Admin Dashboard
   Location: src/admin/
   Description: Full admin panel (2400 LOC)
   Suggestion: Document in spec under "Administration"

RECOMMENDATIONS:
→ /add-feature "Payment processing with Stripe"
→ /fix "Add 7-day session persistence to auth"
→ /reverse-spec --area src/admin/
```

---

## Integration

### Commands Using This Skill
- `/gap-analysis` - Main command for gap detection

### Related Commands
- `/reverse-spec` - Document extras found
- `/add-feature` - Implement missing features
- `/fix` - Complete partial implementations

### Storage
Gap analysis history stored in:
- `.claude/siftcoder-state/gap-analysis/history/`

Track coverage improvement over time.

---

## See Also

- [Command: /gap-analysis](../02-command-reference/by-category/analyze-workflow.md#gap-analysis)
- [Command: /reverse-spec](../02-command-reference/by-category/understand-workflow.md#reverse-spec)
- [Skill: Spec Analyzer](spec-analyzer.md)
