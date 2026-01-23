# Workflow: Investigate and Fix Bugs

**Safe, systematic bug fixing with read-only investigation followed by bounded fixes**

---

## Overview

This workflow guides you through safely investigating and fixing bugs with:

1. Read-only investigation (no code changes)
2. Root cause identification
3. Bounded fixes (only modifies approved files)
4. Blast radius validation

**Time Estimate:** 20 min - 1 hour

**Difficulty:** ⭐ Beginner to Intermediate

---

## Why This Workflow?

**Traditional approach risks:**
- Breaking unrelated code while fixing bugs
- Introducing regressions
- Not understanding the full context
- Fixing symptoms, not root causes

**SiftCoder approach:**
- Investigate first without touching code
- Identify exact root cause
- Fix only what's needed
- Verify nothing else broke

---

## Prerequisites

- [ ] Bug or issue description
- [ ] Access to codebase
- [ ] SiftCoder plugin loaded

---

## Step-by-Step Workflow

### Step 1: Investigate (Read-Only, Safe)

```bash
/siftcoder:investigate "Bug description"
```

**Example:**
```bash
/siftcoder:investigate "Users can't log in after password reset"
```

**What happens:**
```
🔍 Investigating: Users can't log in after password reset

📊 Analysis...
   Scanning codebase for authentication logic...
   Tracing password reset flow...
   Identifying token validation...

📍 Root Cause Identified
   File: src/services/auth.ts:45-52
   Issue: Token expiration check uses wrong timezone
   Code: expiresAt < now
   Should be: expiresAt < now.utc()

📁 Affected Files
   ✓ src/services/auth.ts     (modifiable)
   ✗ src/routes/auth.ts       (protected - not related)
   ✗ src/models/user.ts       (protected - not related)

💡 Suggested Boundaries
   Modifiable: src/services/auth.ts
   Protected: Everything else

🔗 Execution Path
   login() → validateToken() → checkExpiration()
                         ↑
                    Bug location

🔧 Recommended Fix
   Change: expiresAt < now → expiresAt < now.utc()
   Lines affected: 45-52
```

### Step 2: Review Findings

Take time to review:
- ✅ Root cause makes sense?
- ✅ Affected files are correct?
- ✅ Suggested fix is appropriate?

**Adjust scope if needed:**
```bash
# View current boundaries
/siftcoder:scope show

# Add more files if needed
/siftcoder:scope add src/another-file.ts

# Remove files (protect them)
/siftcoder:scope remove src/sensitive-file.ts
```

### Step 3: Fix with Boundaries

```bash
/siftcoder:fix "Users can't log in after password reset"
```

**What happens:**
```
🔧 Fixing: Users can't log in after password reset

📋 Boundaries
   Modifiable: src/services/auth.ts
   Protected: Everything else

🛠️ Fix Applied
   File: src/services/auth.ts
   Change: expiresAt < now → expiresAt < now.utc()
   Lines: 45-52

🔒 Boundary Enforcement
   ✓ Only modified src/services/auth.ts
   ✓ Protected files not touched

✅ Fix Complete
```

### Step 4: Verify Blast Radius

```bash
/siftcoder:blast-radius
```

**What happens:**
```
🎯 Blast Radius Check

MODIFIED FILES:
  ✓ src/services/auth.ts (changed)

VERIFICATION:
  ✓ Modified file tests: PASS (8/8)
  ✓ Protected area tests: PASS (41/41)
  ✓ No regressions detected

CONTAINMENT: ✅ SAFE
   Fix is properly contained
   No unexpected side effects
```

### Step 5: Test and Commit

```bash
# Run tests
npm test

# If all pass, commit
git add src/services/auth.ts
git commit -m "Fix: Token expiration timezone issue

Fixed login failures after password reset by using UTC
timezone for token expiration checks.

Fixes: #123"
```

---

## Commands Used

| Command | Purpose | Mode |
|---------|---------|------|
| `/investigate <issue>` | Safe exploration | Read-only |
| `/fix <issue>` | Bounded fix | Write-enabled |
| `/scope show` | View boundaries | Read-only |
| `/scope add <file>` | Approve file for modification | Control |
| `/scope remove <file>` | Protect file from modification | Control |
| `/blast-radius` | Verify containment | Read-only |

---

## Tips & Best Practices

### Always Investigate First

✅ **DO:**
- Run `/investigate` before `/fix`
- Review findings thoroughly
- Understand root cause

❌ **DON'T:**
- Skip investigation to save time
- Assume you know the problem
- Fix without understanding

### Use Boundaries

✅ **DO:**
- Review suggested boundaries
- Add files if needed
- Keep scope minimal

❌ **DON'T:**
- Fix without boundaries
- Modify more than necessary
- Ignore blast radius warnings

### Verify Containment

✅ **DO:**
- Always run `/blast-radius` after fix
- Check protected areas still work
- Run full test suite

❌ **DON'T:**
- Skip blast radius check
- Assume no side effects
- Skip testing

---

## Troubleshooting

### Issue: Investigation finds nothing

**Solution:**
- Provide more specific issue description
- Include error messages
- Describe when it happens

### Issue: Can't modify file

**Solution:**
```bash
# File is protected
/siftcoder:scope add the-file.ts

# Then retry fix
/siftcoder:fix "issue description"
```

### Issue: Blast radius fails

**Solution:**
- Fix affected too much
- Use `/rollback` to revert
- Narrow scope and retry

### Issue: Fix doesn't work

**Solution:**
- Investigation may have been incomplete
- Re-run `/investigate` with more details
- Consider manual code review

---

## Example: Complete Workflow

```bash
# 1. Investigate (safe, read-only)
/siftcoder:investigate "Payment fails for amounts over $1000"

# Output shows:
# Root cause: String comparison instead of number
# Location: src/payment.ts:67
# Suggested boundary: src/payment.ts

# 2. Review and approve boundaries
/siftcoder:scope show

# 3. Fix with boundaries
/siftcoder:fix "Payment fails for amounts over $1000"

# 4. Verify containment
/siftcoder:blast-radius

# 5. Test
npm test payment.test.ts

# 6. Commit if good
git add src/payment.ts
git commit -m "Fix: Payment amount comparison"

# Done! Bug fixed safely.
```

---

## Comparison: Investigate vs Fix

| Aspect | `/investigate` | `/fix` |
|--------|---------------|--------|
| **Mode** | Read-only | Write-enabled |
| **Changes** | None | Bounded |
| **Use when** | Understanding the issue | Fixing the issue |
| **Safety** | Completely safe | Safe with boundaries |
| **Output** | Root cause, affected files | Fixed code |
| **Time** | 5-15 min | 5-15 min |

**Best Practice:** Always `/investigate` → `/fix` → `/blast-radius`

---

## Advanced: Complex Bugs

For complex issues affecting multiple files:

### 1. Thorough Investigation

```bash
/siftcoder:investigate "Complex multi-file issue"
```

Look for:
- All affected files
- Cascading effects
- Hidden dependencies

### 2. Expand Boundaries

```bash
# Add all affected files
/siftcoder:scope add src/file1.ts
/siftcoder:scope add src/file2.ts
/siftcoder:scope add src/file3.ts

# Verify scope
/siftcoder:scope show
```

### 3. Fix and Verify

```bash
/siftcoder:fix "Complex multi-file issue"
/siftcoder:blast-radius
```

---

## See Also

- [Command: /investigate](../02-command-reference/by-category/maintain-workflow.md#investigate)
- [Command: /fix](../02-command-reference/by-category/maintain-workflow.md#fix)
- [Command: /scope](../02-command-reference/by-category/maintain-workflow.md#scope)
- [Use Case: Debugging Production](../06-use-cases/by-task-type/debugging-production.md)
