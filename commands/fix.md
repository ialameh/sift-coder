---
description: Fix an issue with defined boundaries to prevent unintended changes
argument-hint: <issue-description>
allowed-tools: Read, Write, Edit, Bash, Glob, Grep, Task
---

# siftcoder Fix - Bounded Fix with Scope Limits

## Issue to Fix

**$ARGUMENTS**

## Process

### Step 1: Investigation (if not done)
If no investigation exists, first invoke **siftcoder-investigator** to:
- Find root cause
- Identify affected files
- Suggest boundaries

### Step 2: Boundary Definition

Define the scope of this fix:

```
┌─────────────────────────────────────────────────┐
│ MODIFIABLE FILES:                               │
│ (Only these can be modified)                    │
│                                                 │
│ [Files will be listed here from investigation] │
│                                                 │
│ PROTECTED FILES:                                │
│ (Cannot be modified - enforced by hooks)        │
│                                                 │
│ Everything else                          🔒     │
└─────────────────────────────────────────────────┘
```

### Step 3: Create Fix Branch
- Create git branch: `fix/{issue-slug}`
- Save current state for rollback

### Step 4: Bounded Implementation
Invoke **siftcoder-coder** agent with boundaries:
- Work ONLY within modifiable files
- Attempts to modify protected files will be BLOCKED
- Find alternative approaches within bounds

### Step 5: Blast Radius Validation
Invoke **siftcoder-qa-reviewer** to:
- Run tests on modified code
- Run tests on protected areas (must still pass)
- Validate no regressions

### Step 6: User Approval
- Show diff summary
- Display test results
- User approves or discards

## Scope Management

Use these commands to adjust scope:
- `/siftcoder:scope show` - View current boundaries
- `/siftcoder:scope add <file>` - Add file to modifiable list
- `/siftcoder:scope remove <file>` - Remove file from scope
- `/siftcoder:scope suggest` - AI suggests appropriate scope

## Boundary Enforcement

The PreToolUse hook will automatically:
- Block Write/Edit to protected files
- Allow only modifiable files to be changed
- Log all blocked attempts

## Blast Radius Check

After fix, we verify:
- ✅ Fix tests pass
- ✅ Protected area tests pass
- ✅ No regressions introduced

Use `/siftcoder:blast-radius` to re-run this check.

---

## Tips & Hints

```
SAFETY FIRST

Ran /investigate first?
  → Great! The boundaries are already set up
  → If not, I'll run it automatically

Want to expand scope?
  → /siftcoder:scope add src/another-file.ts
  → You control what can be modified

Worried about breaking something?
  → Protected files CANNOT be changed
  → /siftcoder:blast-radius verifies nothing broke

Made a mistake?
  → /siftcoder:rollback restores previous state
  → Git checkpoints are created automatically

BEST PRACTICE WORKFLOW:
  1. /siftcoder:investigate "issue"  ← Explore safely
  2. Review the findings
  3. /siftcoder:fix "issue"          ← Fix with boundaries
  4. /siftcoder:blast-radius         ← Verify containment

Related commands:
  → /siftcoder:scope show   - Current modifiable files
  → /siftcoder:rollback     - Undo changes
  → /siftcoder:status       - Check fix progress
```

---

## Now: Begin Fix

First, checking for existing investigation or starting one...
