---
description: Build a new project from a specification file
argument-hint: <spec-file-path>
allowed-tools: Read, Write, Edit, Bash, Glob, Grep, Task
---

# siftcoder Build - New Project from Spec

Building from specification: **$ARGUMENTS**

## Process

### Phase 1: Spec Analysis
1. Read the specification file at `$ARGUMENTS`
2. Extract testable features with acceptance criteria
3. Identify dependencies between features
4. Create prioritized feature queue

### Phase 2: Feature Extraction
Use the spec-analyzer skill to extract:
- Feature name and description
- Acceptance criteria (testable)
- Dependencies on other features
- Test scenarios

### Phase 3: Planning
For each feature, invoke the **siftcoder-planner** agent to:
- Explore any existing code patterns
- Design the implementation approach
- Break down into subtasks

### Phase 4: Implementation
For each subtask, invoke the **siftcoder-coder** agent to:
- Implement the code
- Write tests
- Run quality gates

### Phase 5: QA Validation
Invoke the **siftcoder-qa-reviewer** agent to:
- Validate acceptance criteria
- Run comprehensive tests
- Identify any issues

### Phase 6: Issue Resolution
If issues found, invoke **siftcoder-qa-fixer** to:
- Fix identified problems
- Re-validate with QA

## State Management

All progress is saved to `.claude/siftcoder-state/`:
- `features.json` - Feature queue with status
- `implementation-log.jsonl` - Event log
- `knowledge/` - Patterns learned

## Auto-Continuation

The workflow will automatically continue:
- Between subtasks within a feature
- Between features in the queue
- Until all features are complete or user pauses

Use `/siftcoder:pause` to stop auto-continuation.
Use `/siftcoder:status` to check progress.

---

## Tips & Hints

```
BEFORE YOU BUILD

Don't have a spec file yet?
  → /siftcoder:ideate "your idea"
  → I'll generate a feature list with market research

Want to enhance your spec first?
  → /siftcoder:ideate ./your-spec.md
  → Adds competitor analysis and feature suggestions

DURING THE BUILD

Watch progress:
  → /siftcoder:status   - See current feature/subtask

Need to pause?
  → /siftcoder:pause    - Stop auto-continuation
  → /siftcoder:resume   - Continue later

Something went wrong?
  → /siftcoder:rollback - Restore to checkpoint

AFTER THE BUILD

Generate documentation:
  → /siftcoder:document architecture
  → /siftcoder:document code

Add more features:
  → /siftcoder:add-feature "new feature"
  → Follows patterns established during build

SPEC FILE TIPS:

Good spec structure:
  - Clear feature descriptions
  - Testable acceptance criteria
  - Technology preferences (optional)
  - Priority order (optional)

Example spec:
  ## Feature: User Login
  - User can log in with email/password
  - Session persists for 7 days
  - Rate limited to 5 attempts/minute
```

---

## Now: Start Building

Read the spec file and begin feature extraction...
