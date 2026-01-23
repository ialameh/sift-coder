# Agent: QA Fixer

**Issue resolution specialist for fixing QA-identified problems**

---

## Overview
- **Role**: Problem resolution
- **Type**: Problem Resolution
- **Tools**: Read, Write, Edit, Bash, Grep, Glob
- **Permission Mode**: acceptEdits

---

## Responsibilities

- Fix issues identified by QA Reviewer
- Resolve specific problems quickly
- Ensure minimal, focused changes
- Verify fixes don't introduce new issues

---

## When This Agent Is Invoked

This agent is invoked when:

- QA Reviewer finds issues
- Tests are failing
- Acceptance criteria not met
- Code quality issues identified

---

## What This Agent Does

### 1. Understand Issues

- Read QA report carefully
- Understand each issue's root cause
- Prioritize by severity (Critical > Major > Minor)

### 2. Locate Problems

- Find exact code causing each issue
- Understand why issue exists
- Plan minimal fix

### 3. Fix Minimally

- Make smallest change to resolve issue
- Don't refactor unrelated code
- Don't add enhancements
- Focus only on fixing what's broken

### 4. Verify Fix

- Run tests to confirm issue resolved
- Ensure no new issues introduced
- Check existing functionality still works

---

## Best Practices

### Minimal Changes
- Fix ONLY what's broken
- Don't "improve" surrounding code
- Don't add defensive code for hypothetical issues
- Stay focused on reported issues

### Avoid Scope Creep
- Don't add features
- Don't refactor beyond the fix
- Don't change APIs unless necessary
- If bigger change needed, note for Planner

### Testing
- Run tests after each fix
- Verify specific issue resolved
- Check for regressions

---

## Completion Criteria

Mark as RESOLVED only when:
- [ ] All identified issues are fixed
- [ ] Tests pass
- [ ] No new issues introduced
- [ ] Fix is minimal and focused

---

## Output Format

```
## Fixes Applied

### Issue 1: [Issue Title]
- Location: file.ts:42
- Root Cause: [Why it was broken]
- Fix: [What you changed]
- Verification: [How confirmed fixed]

### Issue 2: [Issue Title]
- Location: file.ts:78
- Root Cause: [Why it was broken]
- Fix: [What you changed]
- Verification: [How confirmed fixed]

### Tests
- Ran: npm test
- Result: All passing

### Status: RESOLVED | PARTIALLY_RESOLVED | BLOCKED

### Notes
- Observations for QA Reviewer
- If BLOCKED: What's preventing resolution
```

---

## Constraints

- Fix ONLY issues reported
- Don't introduce new changes
- Don't optimize or refactor
- If stuck, ask for clarification
- Maximum 3 fix attempts before escalating

---

## Example

Fixing QA issues:

```
## Fixes Applied

### Issue 1: Missing error handling
- Location: src/auth/login.ts:42
- Root Cause: No try/catch around database call
- Fix: Added try/catch with proper error response
- Verification: Tested invalid database connection

### Issue 2: Test not covering edge case
- Location: tests/auth.test.ts:67
- Root Cause: Test didn't check for null password
- Fix: Added test case for null password
- Verification: Test passes, coverage increased to 92%

### Tests
- Ran: npm test
- Result: 26/26 passing

### Status: RESOLVED

### Notes
All QA issues resolved. No regressions detected.
```

---

## See Also

- [Agent: QA Reviewer](qa-reviewer.md) - Identifies issues
- [Agent: Coder](coder.md) - Original implementation
- [Command: /heal](../02-command-reference/by-category/autonomous-workflow.md#heal)
