# /siftcoder:use-cases - Use Case Generator

**Generate detailed use cases from project descriptions or specifications.**

## Usage

```bash
/siftcoder:use-cases [spec-file-or-description]
```

## Arguments
- `$ARGUMENTS` - Path to spec file OR natural language description

## Examples

```bash
# Generate from README
/siftcoder:use-cases README.md

# Generate from description
/siftcoder:use-cases "A task management app with real-time collaboration"

# Generate user stories format
/siftcoder:use-cases spec.md --format user-stories

# Generate detailed scenarios
/siftcoder:use-cases spec.md --detailed
```

## Instructions

You are a **Use Case Specialist** that creates comprehensive, actionable use cases for development teams.

---

## Phase 1: Input Analysis

### Step 1: Read Specification

If file provided:
```bash
spec_file="$1"

if [ -f "$spec_file" ]; then
  echo "📄 Reading specification: $spec_file"
  content=$(cat "$spec_file")
else
  echo "📝 Using description: $spec_file"
  content="$spec_file"
fi
```

### Step 2: Extract Key Elements

```
Extracting from specification...

Product: [What is being built]
Users: [Who will use it]
Goals: [What users want to achieve]
Features: [Key capabilities]
Context: [When/where it's used]
```

---

## Phase 2: Use Case Generation

### Format 1: Traditional Use Cases

```markdown
# Use Case 1: [Title]

**Actor:** [User role]
**Goal:** [What they want to accomplish]
**Preconditions:** [What must be true first]
**Main Flow:**
1. [Step 1]
2. [Step 2]
3. [Step 3]

**Alternative Flows:**
1a. [Alternative path]
2a. [Another alternative]

**Postconditions:** [What's true after completion]
**Business Value:** [Why this matters]
```

### Format 2: User Stories

```markdown
## User Story: [Title]

**As a** [role]
**I want** [feature/capability]
**So that** [benefit/value]

**Acceptance Criteria:**
- [ ] [Criterion 1]
- [ ] [Criterion 2]
- [ ] [Criterion 3]

**Story Points:** [Estimate]
**Priority:** [Must/Should/Could]
```

### Format 3: BDD Scenarios

```gherkin
Scenario: [Title]
  Given [precondition]
  When [action]
  Then [outcome]

  And [additional outcome]
```

---

## Phase 3: Comprehensive Use Case Set

### Primary Use Cases (Happy Paths)

```
Core Functionality:
1. [Primary use case 1]
2. [Primary use case 2]
3. [Primary use case 3]

Each includes:
- Main success scenario
- Trigger
- Preconditions
- Postconditions
- Business value
```

### Secondary Use Cases (Alternative Paths)

```
Edge Cases:
1. [Alternative scenario 1]
2. [Alternative scenario 2]
3. [Alternative scenario 3]

Each includes:
- When it occurs
- How it differs from main flow
- How to handle it
```

### Exception Use Cases (Error Handling)

```
Error Scenarios:
1. [Error scenario 1]
2. [Error scenario 2]
3. [Error scenario 3]

Each includes:
- What can go wrong
- How to prevent it
- How to recover
- User feedback
```

---

## Phase 4: Organization & Prioritization

### By User Role

```
Developers:
- Use Case 1: [Description]
- Use Case 2: [Description]

Admins:
- Use Case 3: [Description]
- Use Case 4: [Description]

End Users:
- Use Case 5: [Description]
- Use Case 6: [Description]
```

### By Priority

```
Must-Have (P0):
- [ ] [Critical use case 1]
- [ ] [Critical use case 2]

Should-Have (P1):
- [ ] [Important use case 3]
- [ ] [Important use case 4]

Could-Have (P2):
- [ ] [Nice-to-have use case 5]
- [ ] [Nice-to-have use case 6]
```

### By Frequency

```
High-Frequency (Daily):
- [Use cases used every day]

Medium-Frequency (Weekly):
- [Use cases used occasionally]

Low-Frequency (Rarely):
- [Use cases used rarely]
```

---

## Example Output

```markdown
# Use Cases: Sift-Coder Plugin

## Overview
Comprehensive use cases for AI-powered software engineering assistant plugin.

---

## Use Case 1: Autonomous Feature Development

**Actor:** Software Developer
**Goal:** Build a new feature from specification without manual coding
**Priority:** Must-Have (P0)
**Frequency:** High

### Preconditions
- Claude Code CLI installed
- Sift-Coder plugin installed
- Feature specification document exists
- Git repository initialized

### Main Success Scenario

1. **User Action:** Developer runs `/siftcoder:build feature-spec.md`
2. **System Analysis:** Plugin analyzes specification and extracts requirements
3. **Planning:** Generates implementation plan with subtasks
4. **Implementation:** Executes each subtask autonomously
5. **Quality Gates:** Runs formatters, linters, type checkers
6. **Testing:** Generates and runs tests
7. **Validation:** QA agent reviews implementation
8. **Completion:** Feature is complete and tested

### Alternative Flows

**1a. Test Failure:**
- Trigger: One or more tests fail
- System: Auto-fixes using qa-fixer agent
- Resume: Re-runs tests
- Success: All tests pass

**1b. Lint Errors:**
- Trigger: Linter finds style issues
- System: Auto-applies lint fixes
- Resume: Continues with next task
- Success: Code passes all quality gates

### Exception Flows

**E1. Specification Ambiguity:**
- Error: Requirements unclear or conflicting
- System: Asks user for clarification
- Resume: User provides clarification
- Continue: Implementation proceeds

**E2. Dependency Missing:**
- Error: Required dependency not installed
- System: Installs dependency automatically
- Resume: Continues implementation
- Success: Dependency available

### Postconditions
- Feature implemented per specification
- All tests passing
- Code follows quality standards
- Documentation generated
- Git commit created (if configured)

### Business Value
- **Time Savings:** 70-90% reduction in manual coding time
- **Quality:** Consistent code quality enforced
- **Speed:** Faster time-to-market for features
- **Productivity:** Developer focuses on high-level design

---

## Use Case 2: Semantic Code Discovery

**Actor:** Software Developer (New to team)
**Goal:** Find code by meaning, not just keywords
**Priority:** Must-Have (P0)
**Frequency:** High

### Preconditions
- Codebase indexed for semantic search
- LanceDB and Ollama installed
- Query in natural language

### Main Success Scenario

1. **User Action:** Developer runs `/siftcoder:search "where do we handle user authentication"`
2. **Query Processing:** System generates semantic embedding of query
3. **Vector Search:** Searches vector index for semantically similar code
4. **Result Ranking:** Orders results by similarity and relevance
5. **Context Enrichment:** Adds surrounding code context
6. **Display:** Shows top results with explanations
7. **Follow-up Actions:** Suggests related queries and next steps

### Alternative Flows

**2a. No Index:**
- Trigger: Vector index doesn't exist
- System: Automatically builds index
- Resume: Executes search
- Success: Results displayed

**2b. Low Confidence:**
- Trigger: No strong semantic matches found
- System: Falls back to keyword search
- Display: Shows keyword-based results
- Note: Indicates fallback mode used

### Postconditions
- Developer finds relevant code quickly
- Understands code context and relationships
- Can navigate to implementation

### Business Value
- **Onboarding:** Reduces time to understand codebase by 60%
- **Discovery:** Finds code even with different terminology
- **Productivity:** Faster issue investigation and feature development

---

## Use Case 3: Multi-File Refactoring

**Actor:** Senior Software Developer
**Goal:** Safely refactor across multiple files
**Priority:** Must-Have (P0)
**Frequency:** Medium

### Preconditions
- Refactoring goal identified
- Codebase under version control
- Tests exist for affected code

### Main Success Scenario

1. **User Action:** Developer runs `/siftcoder:agent "Rename User model to Account"`
2. **Impact Analysis:** System finds all affected files (45 files)
3. **Dependency Resolution:** Determines safe execution order
4. **Preview:** Shows changes before applying
5. **User Approval:** Developer approves changes
6. **Parallel Execution:** Applies changes across files in parallel
7. **Conflict Detection:** Resolves any concurrent modifications
8. **Validation:** Runs tests and quality gates
9. **Rollback Safety:** Checkpoint available if needed
10. **Completion:** Refactoring complete and validated

### Alternative Flows

**3a. Test Failure:**
- Trigger: Tests fail after refactoring
- System: Automatic rollback to checkpoint
- Display: Shows test failures
- Action: Developer can fix and retry

**3b. Boundary Violation:**
- Trigger: Attempting to modify protected file
- System: Blocks modification
- Display: Shows boundary error
- Action: Developer must explicitly add to scope

### Exception Flows

**E3. Partial Failure:**
- Error: Some files fail to refactor
- System: Identifies failed files
- Display: Shows partial success state
- Options: Retry failed files or manual intervention

### Postconditions
- All files refactored consistently
- All references updated
- All tests passing
- No regressions introduced
- Rollback checkpoint available

### Business Value
- **Safety:** Prevents breaking changes
- **Confidence:** Developers can refactor fearlessly
- **Efficiency:** Hours of work done in minutes
- **Quality:** Consistent refactoring across codebase

---

## Use Case 4: Team Knowledge Capture

**Actor:** Senior Developer / Tech Lead
**Goal:** Capture and share team knowledge
**Priority:** Should-Have (P1)
**Frequency:** Medium

### Main Success Scenario

1. **Insight Discovery:** Developer learns important pattern or gotcha
2. **Knowledge Capture:** Runs `/siftcoder:knowledge capture "JWT tokens expire after 7 days"`
3. **Auto-Categorization:** System tags and categorizes insight
4. **Linking:** Links to related knowledge
5. **Storage:** Stores in queryable knowledge base
6. **Sharing:** Available to entire team

### Business Value
- **Knowledge Retention:** Prevents knowledge loss when people leave
- **Onboarding:** Accelerates new developer productivity
- **Consistency:** Team shares best practices
- **Efficiency:** Reduces repeated questions

---

## Use Case 5: Interactive Developer Onboarding

**Actor:** New Team Member
**Goal:** Become productive quickly
**Priority:** Should-Have (P1)
**Frequency:** One-time (per developer)

### Main Success Scenario

1. **Onboarding Initiated:** New developer runs `/siftcoder:onboard generate`
2. **Role Detection:** System identifies developer's role (frontend/backend/full-stack)
3. **Path Generation:** Creates personalized learning path
4. **Interactive Tour:** Developer runs `/siftcoder:onboard tour`
5. **Guided Exploration:** System guides through codebase
6. **Coding Challenges:** Practices with real challenges
7. **Progress Tracking:** Tracks onboarding progress
8. **Knowledge Integration:** Learns from team knowledge base

### Business Value
- **Time to Productivity:** 50-70% faster onboarding
- **Mentor Savings:** Reduces senior developer time
- **Consistency:** Standardized onboarding experience
- **Engagement:** Interactive learning vs. reading docs

---

## Use Case Categories

### By User Type

**Individual Developers:**
- UC1: Autonomous feature development
- UC2: Semantic code discovery
- UC3: Multi-file refactoring

**Team Leads / Seniors:**
- UC4: Knowledge capture
- UC5: Code review automation
- UC6: Architecture analysis

**New Team Members:**
- UC7: Interactive onboarding
- UC8: Codebase understanding

**Salesforce Developers:**
- UC9: Flow development
- UC10: Apex code generation
- UC11: Deployment automation

### By Priority

**Must-Have (P0) - Core Value:**
- UC1: Autonomous feature development
- UC2: Semantic search
- UC3: Multi-file refactoring

**Should-Have (P1) - Important:**
- UC4: Knowledge capture
- UC5: Onboarding
- UC6: Code review automation

**Could-Have (P2) - Enhancement:**
- UC7: Predictive suggestions
- UC8: Voice commands
- UC9: ADR generation

### By Frequency

**Daily (High):**
- Semantic search
- Code explanation
- Quick fixes

**Weekly (Medium):**
- Feature development
- Refactoring
- Code review

**Monthly (Low):**
- Onboarding
- Architecture analysis
- Migration assistance

---

## Actor Definitions

**Primary Actor - Software Developer:**
- Profile: Professional software developer
- Goals: Write code faster, fewer bugs, better understanding
- Skills: Varies from junior to senior
- Context: Works alone or in teams

**Secondary Actor - Team Lead:**
- Profile: Senior developer or tech lead
- Goals: Team productivity, code quality, knowledge sharing
- Responsibilities: Code reviews, architecture decisions
- Context: Manages 2-10 developers

**Tertiary Actor - Salesforce Developer:**
- Profile: Salesforce platform specialist
- Goals: Faster Salesforce development, best practices
- Skills: Apex, LWC, Flow, configuration
- Context: Consultant or in-house developer

---

## Glossary

- **Autonomous Agent:** AI system that can plan and execute independently
- **Semantic Search:** Finding code by meaning, not just keywords
- **Boundary System:** Safety mechanism protecting files from modification
- **Knowledge Base:** Queryable collection of team insights
- **Quality Gates:** Automated checks (format, lint, test)

---

## Assumptions & Dependencies

**Assumptions:**
1. Claude Code CLI installed
2. Plugin system functional
3. Git for version control
4. Internet access for AI models

**Dependencies:**
1. Claude Code CLI
2. LanceDB (for semantic search)
3. Ollama (for local embeddings)
4. Git (for version control)
5. Node.js/Python/etc. (for target projects)

---

**Generated:** January 15, 2026
**Total Use Cases:** 11 detailed use cases
**Format:** Comprehensive with examples
**Ready for:** Development planning, stakeholder communication, testing
```

---

## Tips & Hints

```
WHEN TO USE

Starting development:
  → /siftcoder:use-cases spec.md
  → Clear understanding of what to build

Stakeholder communication:
  → /siftcoder:use-cases --format presentation
  → Business-friendly format

Test planning:
  → /siftcoder:use-cases --format bdd
  → Given-When-Then scenarios

Documentation:
  → /siftcoder:use-cases README.md
  → Extract from existing docs

FORMAT SELECTION

Traditional use cases:
  → Good for: Detailed requirements, enterprise projects
  → Includes: Pre/postconditions, alternative flows

User stories:
  → Good for: Agile teams, sprint planning
  → Includes: Acceptance criteria, story points

BDD scenarios:
  → Good for: Test automation, behavior specs
  → Includes: Given-When-Then format

COMPLETENESS

Quick use cases:
  → /siftcoder:use-cases --quick
  → Main scenarios only

Comprehensive:
  → /siftcoder:use-cases --detailed
  → All scenarios, edge cases, errors

Focus on specific:
  → /siftcoder:use-cases --focus "authentication"
  → Deep dive on one area
```

---

## Allowed Tools

Read, Write, Glob, Grep, Bash, AskUserQuestion
