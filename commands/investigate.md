---
description: Safely investigate an issue in read-only mode without making changes
argument-hint: <issue-description>
allowed-tools: Read, Grep, Glob, Bash, Task
---

# siftcoder Investigate - Safe Read-Only Investigation

## Safety Lock Engaged

```
┌─────────────────────────────────────────────────┐
│ Mode: INVESTIGATE (read-only)                   │
│ Can read: Everything                            │
│ Can modify: Nothing                             │
└─────────────────────────────────────────────────┘
```

## Issue to Investigate

**$ARGUMENTS**

## Investigation Process

### Step 1: Parse the Issue
- Understand symptoms and expected behavior
- Identify any error messages or stack traces
- Note suspected areas

### Step 2: Search for Evidence
Invoke the **siftcoder-investigator** agent to:
- Find relevant code using Grep
- Trace execution paths
- Identify root cause

### Step 3: Root Cause Analysis
- Determine the actual cause (not symptoms)
- Find all instances of the problem
- Understand why it exists

### Step 4: Impact Assessment
Categorize files:
- **Affected**: Need modification to fix
- **Related**: Need testing after fix
- **Safe**: Unrelated to issue

### Step 5: Generate Report
Produce investigation report with:
- Root cause identification
- Affected files list
- Suggested fix approach
- Recommended boundaries

## Output

The investigation will produce a report that includes:
1. Root cause with evidence
2. List of affected files
3. Suggested scope boundaries
4. Recommended fix approach

## Next Steps

After investigation completes:
- `[Fix with suggested scope]` - Proceed to `/siftcoder:fix`
- `[Expand scope]` - Add more files before fixing
- `[Manual review]` - Review findings before action

## Important

- This investigation is **read-only**
- No files will be modified
- No tests that modify state will run
- Safe to run on production code

---

## Tips & Hints

```
DID YOU KNOW?

Investigate first, fix second:
  → This command is completely safe
  → Nothing can be changed in read-only mode
  → You'll see exactly what's wrong before fixing

After investigation:
  → /siftcoder:fix "same issue"
  → The fix will use boundaries from this investigation

If you want to explore more:
  → /siftcoder:understand
  → Captures broader patterns and gotchas

Related commands:
  → /siftcoder:scope show   - See current boundaries
  → /siftcoder:blast-radius - Test protected areas
  → /siftcoder:rollback     - Undo if something goes wrong
```

---

## Now: Begin Investigation

Invoking the **siftcoder-investigator** agent...
