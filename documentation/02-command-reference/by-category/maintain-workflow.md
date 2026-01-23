# MAINTAIN Workflow Commands

**Safe bug fixing and code maintenance**

The MAINTAIN workflow contains 6 commands for investigating issues, fixing bugs with scope limits, and managing file modification boundaries.

---

## Commands Overview

| Command | Purpose | Difficulty | Time | Mode |
|---------|---------|------------|------|------|
| [`/investigate`](#investigate) | Safe read-only investigation | ⭐ Beginner | 5-15 min | Read-only |
| [`/fix`](#fix) | Fix with defined boundaries | ⭐⭐ Intermediate | 5-15 min | Write-enabled |
| [`/optimize`](#optimize) | Performance optimization | ⭐⭐ Intermediate | 15-30 min | Write-enabled |
| [`/scope show`](#scope) | View file boundaries | ⭐ Beginner | 1 min | Read-only |
| [`/scope add`](#scope) | Add file to modifiable list | ⭐ Beginner | 1 min | Write-enabled |
| [`/scope remove`](#scope) | Remove file from scope | ⭐ Beginner | 1 min | Write-enabled |
| [`/blast-radius`](#blast-radius) | Verify fix containment | ⭐ Beginner | 2-5 min | Read-only |

---

## /investigate

Safely explore the codebase to understand an issue without making any modifications.

### Quick Overview
- **Purpose**: Read-only investigation of issues
- **Difficulty**: ⭐ Beginner
- **Time Estimate**: 5-15 min
- **Mode**: Read-only (completely safe)

### When to Use This Command

✅ **Use this when:**
- You need to understand a bug before fixing it
- You're new to a codebase and need exploration
- You want root cause analysis without risk
- You need to identify affected files
- You're not sure what's broken

❌ **Don't use when:**
- You already understand the issue
- You're ready to make changes (use `/fix` instead)

🔄 **Alternatives:**
- `/understand` - For general codebase exploration
- `/fix` - For fixing the issue after investigation
- `/learn explain` - For deep file explanation

### Syntax

```bash
/siftcoder:investigate <issue-description>
```

**Arguments:**
- `issue-description`: Description of the issue to investigate

### How It Works

#### Phase 1: Issue Analysis
- Parse the issue description
- Identify key terms and context
- Determine search strategy

#### Phase 2: Codebase Exploration
- Search for relevant code patterns
- Trace execution paths
- Identify data flows

#### Phase 3: Root Cause Analysis
- Analyze findings
- Identify root cause
- List affected files

#### Phase 4: Boundary Suggestions
- Suggest modifiable files
- Identify protected areas
- Provide fix recommendations

### Examples

#### Basic Example

```bash
/siftcoder:investigate "Users can't log in after password reset"
```

**Output:**
```
🔍 Investigating: Users can't log in after password reset

📍 Root Cause Identified
   File: src/services/auth.ts:45-52
   Issue: Token expiration check uses wrong timezone

📁 Affected Files
   ✓ src/services/auth.ts     (modifiable)
   ✗ src/routes/auth.ts       (protected - not related)
   ✗ src/models/user.ts       (protected - not related)

💡 Suggested Boundaries
   Modifiable: src/services/auth.ts
   Protected: Everything else

🔧 Recommended Fix
   Change: expiresAt < now → expiresAt < now.utc()

🔗 Execution Path
   login() → validateToken() → checkExpiration()
                         ↑
                    Bug location
```

#### Real-World Example

**Scenario**: Memory leak in production

```bash
/siftcoder:investigate "Memory usage grows continuously in websocket handler"
```

**Investigation finds:**
```
🔍 Investigating: Memory leak in websocket handler

📍 Root Cause Identified
   File: src/handlers/websocket.ts
   Issue: Event listeners not removed on disconnect

   Lines 89-95:
   client.on('message', handler)
   // ❌ handler never removed

📁 Affected Files
   ✓ src/handlers/websocket.ts  (modifiable)

💡 Suggested Boundaries
   Modifiable: src/handlers/websocket.ts

🔧 Recommended Fix
   Add cleanup in disconnect handler:
   client.off('message', handler)

📊 Memory Impact
   Estimated leak: ~2MB per connection
   With 1000 connections: ~2GB/hour
```

### Integration

**Skills Used:**
- `semantic-codebase-search` - Finds relevant code
- `pattern-detector` - Identifies code patterns

**Agents Invoked:**
- **Investigator** - Read-only exploration and analysis

**Related Commands:**
- `/fix` - Fix the issue after investigation
- `/scope` - Manage file boundaries
- `/understand` - Broader codebase understanding

**Prerequisites:**
- Codebase should be accessible
- Issue description should be specific

### Tips & Best Practices

✅ **DO:**
- Always investigate before fixing unfamiliar issues
- Review the suggested boundaries carefully
- Check the affected files list
- Use investigation results to create precise boundaries

❌ **DON'T:**
- Skip investigation if you're unsure of the root cause
- Modify files suggested as protected
- Assume the first finding is the only issue

💡 **PRO TIP:**
Copy the "Suggested Boundaries" output to use directly with the `/fix` command for safe, targeted fixes.

### Troubleshooting

| Issue | Solution |
|-------|----------|
| No root cause found | Provide more specific issue description |
| Too many files affected | Narrow the issue description |
| Can't understand findings | Use `/learn explain` on specific files |

---

## /fix

Fix an issue with defined boundaries to prevent unintended changes.

### Quick Overview
- **Purpose**: Fix issues with scope limits
- **Difficulty**: ⭐⭐ Intermediate
- **Time Estimate**: 5-15 min
- **Mode**: Write-enabled (bounded)

### When to Use This Command

✅ **Use this when:**
- You've investigated an issue and know the root cause
- You want to fix with safety boundaries
- You need to protect certain files from modification
- You want blast radius validation

❌ **Don't use when:**
- You haven't investigated yet (use `/investigate` first)
- You want to refactor broadly (use `/refactor` instead)

🔄 **Alternatives:**
- `/investigate` - For understanding the issue first
- `/optimize` - For performance improvements
- `/refactor` - For code restructuring

### Syntax

```bash
/siftcoder:fix <issue-description>
```

**Arguments:**
- `issue-description`: Description of the issue to fix

### How It Works

#### Step 1: Investigation (if not done)
- Invokes Investigator agent
- Finds root cause
- Identifies affected files
- Suggests boundaries

#### Step 2: Boundary Definition
```
┌─────────────────────────────────────────────────┐
│ MODIFIABLE FILES:                               │
│ (Only these can be modified)                    │
│                                                 │
│ [Files listed from investigation]              │
│                                                 │
│ PROTECTED FILES:                                │
│ (Cannot be modified - enforced by hooks)        │
│                                                 │
│ Everything else                          🔒     │
└─────────────────────────────────────────────────┘
```

#### Step 3: Bounded Implementation
- Invokes Coder agent with boundaries
- Works ONLY within modifiable files
- Attempts to modify protected files are BLOCKED
- Finds alternative approaches within bounds

#### Step 4: Blast Radius Validation
- Invokes QA Reviewer
- Runs tests on modified code
- Runs tests on protected areas (must still pass)
- Validates no regressions

#### Step 5: User Approval
- Shows diff summary
- Displays test results
- User approves or discards

### Examples

#### Basic Example

```bash
/siftcoder:fix "Payments fail for amounts over $1000"
```

**Output:**
```
🔧 Fixing: Payments fail for amounts over $1000

📋 Boundaries
   Modifiable: src/services/payment.ts
   Protected: Everything else

🔍 Investigation Findings
   Root cause: Amount comparison uses string compare
   Location: src/services/payment.ts:67

🛠️ Fix Applied
   Changed: amount > '1000' → amount > 1000
   File: src/services/payment.ts

✅ Blast Radius Check
   Modified file tests: ✓ PASS
   Protected area tests: ✓ PASS
   No regressions detected

📊 Summary
   Files modified: 1
   Lines changed: 1
   Tests passing: 89/89
```

#### Real-World Example

**Scenario**: Race condition in async handler

```bash
/siftcoder:fix "Race condition causes duplicate orders"
```

**Fix process:**
```
🔧 Fixing: Race condition causes duplicate orders

📋 Boundaries
   Modifiable: src/handlers/order.ts
   Protected: Everything else

🛠️ Fix Applied
   Added mutex lock for order creation:
   + const orderLock = new Map()
   + async function createOrder(id) {
   +     const lock = orderLock.get(id)
   +     if (lock) await lock
   +     ...

✅ Blast Radius Check
   Modified file tests: ✓ PASS
   Protected area tests: ✓ PASS
   Load test: ✓ 1000 concurrent orders, 0 duplicates
```

### Integration

**Skills Used:**
- None (uses agent collaboration)

**Agents Invoked:**
- **Investigator** - Find root cause (if not done)
- **Coder** - Implement fix within boundaries
- **QA Reviewer** - Validate blast radius
- **QA Fixer** - Fix any issues found

**Related Commands:**
- `/investigate` - Understand issue first
- `/scope` - Manage file boundaries
- `/blast-radius` - Re-run containment check
- `/rollback` - Undo if fix is wrong

**Prerequisites:**
- Issue should be investigated first (automatic if not)
- Boundaries should be defined

### Tips & Best Practices

✅ **DO:**
- Run `/investigate` first for best results
- Review boundaries before implementation
- Run `/blast-radius` after fix
- Use `/scope add` to expand boundaries if needed

❌ **DON'T:**
- Skip investigation for complex issues
- Modify files outside boundaries
- Ignore blast radius warnings

💡 **PRO TIP:**
Use `/investigate` → `/fix` → `/blast-radius` workflow for safe, systematic bug fixing.

### Troubleshooting

| Issue | Solution |
|-------|----------|
| Can't modify file | File is protected, use `/scope add <file>` |
| Fix doesn't work | Use `/investigate` for deeper analysis |
| Tests failing in protected areas | Fix is affecting too much, use `/scope` to adjust |

---

## /optimize

Performance optimization for a specific area of the codebase.

### Quick Overview
- **Purpose**: Performance optimization
- **Difficulty**: ⭐⭐ Intermediate
- **Time Estimate**: 15-30 min
- **Mode**: Write-enabled

### When to Use This Command

✅ **Use this when:**
- You need to improve performance
- You've identified slow code paths
- You need profiling and optimization

### Syntax

```bash
/siftcoder:optimize <area>
```

**Arguments:**
- `area`: Area of codebase to optimize (file, directory, or description)

---

## /scope

Manage file modification boundaries for fix/optimize workflows.

### Quick Overview
- **Purpose**: Manage file boundaries
- **Difficulty**: ⭐ Beginner
- **Time Estimate**: 1 min
- **Mode**: Varies by subcommand

### Syntax

```bash
/siftcoder:scope <action> [file-path]
```

**Actions:**
- `show` - Display current boundaries
- `add <file>` - Add file to modifiable list
- `remove <file>` - Protect a file from modification
- `suggest` - AI suggests appropriate scope

### Examples

#### Show Current Boundaries

```bash
/siftcoder:scope show
```

**Output:**
```
📋 Current Boundaries

MODIFIABLE FILES:
  ✓ src/services/payment.ts
  ✓ src/utils/currency.ts

PROTECTED FILES:
  🔒 **/* (everything else)

MUST-PASS TESTS:
  ✓ tests/payment.test.ts
  ✓ tests/integration/checkout.test.ts
```

#### Add File to Scope

```bash
/siftcoder:scope add src/config/payment.ts
```

**Output:**
```
✓ Added to modifiable scope
   File: src/config/payment.ts
   Reason: Payment configuration needed for fix
```

#### Get AI Suggestions

```bash
/siftcoder:scope suggest
```

**Output:**
```
💡 Scope Suggestions for: "Fix payment processing"

MODIFIABLE (recommended):
  ✓ src/services/payment.ts - Contains the bug
  ✓ src/utils/currency.ts - Helper functions

PROTECTED (keep safe):
  🔒 src/database/ - Not related to issue
  🔒 src/api/ - No changes needed
  🔒 tests/ - Don't modify tests
```

### Integration

**Related Commands:**
- `/investigate` - Suggests boundaries
- `/fix` - Respects boundaries
- `/blast-radius` - Verifies containment

---

## /blast-radius

Verify that a fix doesn't affect protected areas.

### Quick Overview
- **Purpose**: Verify fix containment
- **Difficulty**: ⭐ Beginner
- **Time Estimate**: 2-5 min
- **Mode**: Read-only

### When to Use This Command

✅ **Use this when:**
- After running `/fix`
- To verify changes are contained
- To ensure no regressions

### Syntax

```bash
/siftcoder:blast-radius
```

### Examples

```bash
/siftcoder:blast-radius
```

**Output:**
```
🎯 Blast Radius Check

MODIFIED FILES:
  ✓ src/services/payment.ts (changed)

VERIFICATION:
  ✓ Modified file tests: PASS (12/12)
  ✓ Protected area tests: PASS (77/77)
  ✓ No regressions detected

CONTAINMENT: ✅ SAFE
   Fix is properly contained
   No unexpected side effects
```

---

## Workflow Examples

### Complete Bug Fix Workflow

```bash
# 1. Investigate (read-only, safe)
/siftcoder:investigate "Login fails after password reset"

# 2. Review findings
#    - Root cause identified
#    - Affected files listed
#    - Suggested boundaries shown

# 3. Fix with boundaries
/siftcoder:fix "Login fails after password reset"

# 4. Verify containment
/siftcoder:blast-radius

# 5. If satisfied, commit changes
git add src/services/auth.ts
git commit -m "Fix: Password reset login issue"
```

### Managing Scope Manually

```bash
# 1. Show current scope
/siftcoder:scope show

# 2. Add files as needed
/siftcoder:scope add src/utils/helpers.ts
/siftcoder:scope add src/config/settings.ts

# 3. Remove file from scope (protect it)
/siftcoder:scope remove src/core/engine.ts

# 4. Run fix with custom scope
/siftcoder:fix "Bug in payment processing"
```

---

## Comparison: Investigate vs Fix

| Aspect | `/investigate` | `/fix` |
|--------|---------------|--------|
| **Mode** | Read-only | Write-enabled |
| **Code changes** | None | Bounded |
| **Use when** | Understanding the issue | Fixing the issue |
| **Safety** | Completely safe | Safe with boundaries |
| **Output** | Root cause, affected files | Fixed code |
| **Best practice** | Run first | Run after investigate |

---

## See Also

- [BUILD Workflow](build-workflow.md) - Create new projects
- [DEBUG Workflow](debug-workflow.md) - Debugging assistance
- [Workflow: Investigate & Fix](../../05-workflows/investigate-fix.md)
- [Use Case: Debugging Production](../../06-use-cases/by-task-type/debugging-production.md)
