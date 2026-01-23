---
description: Enhance and improve specification quality with testable criteria
argument-hint: <spec-file> [--interactive|--auto|--validate]
allowed-tools: Read, Write, Edit, Bash, Glob, Grep, Task, AskUserQuestion, WebSearch
---

# /siftcoder:improve-spec - Enhance Specifications

Analyze and improve your specification file to make it more complete, testable, and implementation-ready.

## Usage

```
/siftcoder:improve-spec <spec-file>              - Interactive improvement
/siftcoder:improve-spec <spec-file> --auto       - Auto-improve with defaults
/siftcoder:improve-spec <spec-file> --validate   - Check quality without changes
/siftcoder:improve-spec <spec-file> --focus <area> - Improve specific section
```

## Instructions

### Phase 0: Interactive Setup

**Use AskUserQuestion:**
```
Question: "What kind of improvements do you want?"
Header: "Mode"
Options:
- "Full analysis (Recommended)" - "Check completeness, testability, clarity, and suggest enhancements"
- "Testability only" - "Add acceptance criteria and test scenarios"
- "Clarity only" - "Improve wording and remove ambiguity"
- "Completeness only" - "Find missing requirements and edge cases"
```

**Use AskUserQuestion:**
```
Question: "Should I research industry best practices?"
Header: "Research"
Options:
- "Yes (Recommended)" - "Look up patterns for similar features (uses web search)"
- "No" - "Use only local context and general knowledge"
```

**Use AskUserQuestion:**
```
Question: "How should I apply improvements?"
Header: "Apply"
Options:
- "Interactive" - "Show each change and ask for approval"
- "Generate new file" - "Create improved-spec.md alongside original"
- "Edit in place" - "Update the original file directly"
```

### Phase 1: Spec Analysis

Read the spec file and analyze:

```
╔══════════════════════════════════════════════════════════════╗
║              ANALYZING SPECIFICATION                         ║
╚══════════════════════════════════════════════════════════════╝

File: [spec path]
Format: [markdown/yaml/json]

Parsing requirements...

┌─ SPEC STRUCTURE ─────────────────────────────────────────────┐
│                                                              │
│  Sections:       [N]                                        │
│  Requirements:   [N]                                        │
│  With criteria:  [X] (Y%)                                   │
│  Ambiguous:      [Z]                                        │
│                                                              │
│  Sections found:                                             │
│    [1] Overview (no requirements)                           │
│    [2] User Authentication (5 requirements)                 │
│    [3] Payments (3 requirements)                            │
│    [4] Notifications (2 requirements)                       │
│                                                              │
└──────────────────────────────────────────────────────────────┘
```

### Phase 2: Quality Assessment

Score the spec on multiple dimensions:

```
┌─ QUALITY SCORES ─────────────────────────────────────────────┐
│                                                              │
│  OVERALL: 62/100 - Needs Improvement                        │
│                                                              │
│  Testability:    ████████░░ 40%                             │
│    - 6/15 requirements have acceptance criteria             │
│    - Missing: test scenarios, edge cases                    │
│                                                              │
│  Completeness:   ██████████████░░ 70%                       │
│    - Most features defined                                   │
│    - Missing: error handling, security requirements          │
│                                                              │
│  Clarity:        ████████████░░░░ 60%                       │
│    - 4 ambiguous requirements found                         │
│    - Vague terms: "fast", "user-friendly", "secure"         │
│                                                              │
│  Consistency:    ██████████████████░░ 90%                   │
│    - Format mostly consistent                               │
│    - 1 section uses different structure                     │
│                                                              │
│  Dependencies:   ████████████░░░░ 60%                       │
│    - Some feature dependencies unclear                      │
│    - Missing: order of implementation                       │
│                                                              │
└──────────────────────────────────────────────────────────────┘
```

### Phase 3: Identify Improvements

List specific improvements needed:

```
┌─ IMPROVEMENTS NEEDED ────────────────────────────────────────┐
│                                                              │
│  CRITICAL (blocks implementation):                          │
│  ─────────────────────────────────                          │
│  [1] "User login" - No acceptance criteria                  │
│      Line 24: "Users can log in"                           │
│      Needs: specific steps, validation rules, error cases   │
│                                                              │
│  [2] "Payment processing" - Ambiguous                       │
│      Line 45: "Payments should be secure"                  │
│      "Secure" is not testable - needs specific requirements │
│                                                              │
│  HIGH (improves quality):                                    │
│  ─────────────────────────                                  │
│  [3] Missing error scenarios                                │
│      What happens when: payment fails? session expires?     │
│                                                              │
│  [4] No performance requirements                            │
│      How fast should login be? API response times?          │
│                                                              │
│  MEDIUM (nice to have):                                      │
│  ─────────────────────                                      │
│  [5] Add user stories format                                │
│      Current: "Users can X" → "As a user, I want X so Y"   │
│                                                              │
│  [6] Add priority levels                                    │
│      No P0/P1/P2 classification                             │
│                                                              │
└──────────────────────────────────────────────────────────────┘
```

### Phase 4: Research Best Practices (if enabled)

Use WebSearch to find relevant patterns:

```
RESEARCHING BEST PRACTICES...

For "User Authentication":
  → Searched: "user authentication requirements best practices 2026"
  → Found: OAuth2.0 recommendations, session management patterns

For "Payment Processing":
  → Searched: "Stripe integration requirements PCI compliance"
  → Found: Required security measures, webhook handling patterns

Incorporating findings...
```

### Phase 5: Generate Improvements

#### Interactive Mode

For each improvement, ask:

```
╔══════════════════════════════════════════════════════════════╗
║  IMPROVEMENT 1/8                                             ║
╚══════════════════════════════════════════════════════════════╝

Section: User Authentication
Line 24

CURRENT:
  "Users can log in to the application"

SUGGESTED:
  "## User Login

   Users can authenticate with email and password.

   **Acceptance Criteria:**
   - [ ] Login form accepts email and password
   - [ ] Valid credentials redirect to dashboard
   - [ ] Invalid credentials show error message
   - [ ] Account locks after 5 failed attempts
   - [ ] Session persists for 7 days (remember me)

   **Error Cases:**
   - Invalid email format → "Please enter a valid email"
   - Wrong password → "Invalid credentials" (no hint which)
   - Locked account → "Account locked. Reset password or wait 30 min"

   **Performance:**
   - Login API responds in < 500ms"

Apply this change? [Yes / No / Edit / Skip]
```

#### Auto Mode

Apply all improvements and show summary:

```
APPLYING IMPROVEMENTS...

[1/8] ✅ Added acceptance criteria to "User login"
[2/8] ✅ Clarified "secure payments" → specific requirements
[3/8] ✅ Added error scenarios for authentication
[4/8] ✅ Added performance requirements
[5/8] ✅ Converted to user story format
[6/8] ✅ Added priority levels (P0/P1/P2)
[7/8] ✅ Added dependency graph
[8/8] ✅ Added glossary of terms

Output: ./SPEC-improved.md
```

### Phase 6: Validate Mode (--validate)

Just report without changes:

```
╔══════════════════════════════════════════════════════════════╗
║              SPEC VALIDATION REPORT                          ║
╚══════════════════════════════════════════════════════════════╝

File: [spec path]
Status: ⚠️ NEEDS IMPROVEMENT

Quality Score: 62/100

Issues Found: 12
  - Critical: 2 (blocks implementation)
  - High: 4 (reduces quality)
  - Medium: 6 (nice to have)

To fix automatically:
  /siftcoder:improve-spec ./SPEC.md --auto

To fix interactively:
  /siftcoder:improve-spec ./SPEC.md

Full report: .claude/siftcoder-state/spec-validation.json
```

## Output Files

### Improved Spec Structure

The improved spec will include:

```markdown
# [Project Name] Specification

## Overview
[Project description]

## Glossary
| Term | Definition |
|------|------------|
| User | Registered account holder |
| Session | Authenticated period |

## Features

### P0 - Critical

#### FEAT-001: User Login
**Priority:** P0 (Critical)
**Dependencies:** None

**User Story:**
As a user, I want to log in with my credentials so that I can access my account.

**Acceptance Criteria:**
- [ ] Login form accepts email and password
- [ ] Valid credentials redirect to dashboard
- [ ] Invalid credentials show error (no hint which field)
- [ ] Account locks after 5 failed attempts

**Error Scenarios:**
| Scenario | Expected Behavior |
|----------|-------------------|
| Invalid email | "Please enter valid email" |
| Wrong password | "Invalid credentials" |
| Locked account | "Account locked. Try again in 30 min" |

**Performance:**
- API response < 500ms
- Page load < 2s

**Security:**
- Passwords hashed with bcrypt
- HTTPS required
- CSRF protection

**Test Scenarios:**
1. Login with valid credentials → Success
2. Login with wrong password → Error shown
3. 5 failed attempts → Account locked
4. Login from new device → Email notification

---

### P1 - High Priority
...
```

### `.claude/siftcoder-state/spec-validation.json`

```json
{
  "validatedAt": "2026-01-12T...",
  "file": "./SPEC.md",
  "score": 62,
  "scores": {
    "testability": 40,
    "completeness": 70,
    "clarity": 60,
    "consistency": 90,
    "dependencies": 60
  },
  "issues": [
    {
      "severity": "critical",
      "type": "missing_criteria",
      "location": "line 24",
      "current": "Users can log in",
      "suggestion": "Add acceptance criteria"
    }
  ],
  "improvements": [
    {
      "id": 1,
      "type": "add_criteria",
      "applied": true,
      "before": "...",
      "after": "..."
    }
  ]
}
```

## Templates

### Adding Acceptance Criteria

```markdown
**Acceptance Criteria:**
- [ ] [Specific testable condition]
- [ ] [Another testable condition]
- [ ] [Edge case handling]
```

### Adding Error Scenarios

```markdown
**Error Scenarios:**
| Scenario | Expected Behavior |
|----------|-------------------|
| [Condition] | [Result] |
```

### Adding Performance Requirements

```markdown
**Performance:**
- [Metric] < [Threshold]
- [Metric] < [Threshold]
```

## Tips

```
WRITING BETTER SPECS

Make requirements testable:
  ❌ "Fast login"
  ✅ "Login completes in < 500ms"

  ❌ "Secure authentication"
  ✅ "Passwords hashed with bcrypt, min 12 characters"

Define error cases:
  What happens when...
  - User enters wrong data?
  - Network fails?
  - Concurrent access?

Add acceptance criteria:
  Every feature needs checkboxes that QA can verify

Specify dependencies:
  Which features must be built first?
  What external services are required?

Use consistent format:
  Same structure for every feature
  Makes implementation predictable
```

## Integration

| After improve-spec | Next step |
|--------------------|-----------|
| Spec improved | `/siftcoder:build` to implement |
| Need gap analysis | `/siftcoder:gap-analysis` |
| Want to add features | `/siftcoder:ideate` |
| Ready to start | `/siftcoder:add-feature` |
