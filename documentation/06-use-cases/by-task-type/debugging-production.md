# Use Case: Debugging Production Issues

**Investigating and fixing production problems**

---

## Overview

Production issues are stressful. This workflow helps you safely investigate and fix bugs without making things worse.

---

## Scenario

You're dealing with:
- Bug in production
- Can't reproduce locally
- Need to understand what's broken
- Must fix quickly and safely

---

## Workflow

### Phase 1: Understand the Issue

```bash
# Gather information
/siftcoder:monitor errors
```

**Shows:**
- Error patterns
- Frequency
- Affected users

### Phase 2: Reproduce Locally

```bash
# Get help reproducing
/siftcoder:debug reproduce "Issue description"
```

### Phase 3: Investigate Root Cause

```bash
# Safe investigation (read-only)
/siftcoder:investigate "Issue description"
```

**Output:**
```
🔍 Investigation Results

ROOT CAUSE:
  File: src/services/payment.ts:67
  Issue: Currency comparison uses string instead of number

AFFECTED FILES:
  ✓ src/services/payment.ts

SUGGESTED FIX:
  Convert currency to lowercase before comparison
```

### Phase 4: Fix with Boundaries

```bash
/siftcoder:fix "Currency comparison bug"
```

### Phase 5: Validate

```bash
# Verify fix contained
/siftcoder:blast-radius

# Run tests
npm test

# Deploy to staging
git push staging
```

---

## Production Debugging Commands

| Command | Purpose | Use When |
|---------|---------|---------|
| `/monitor errors` | Cluster production errors | See error patterns |
| `/timewarp` | Reconstruct app state | Debug impossible-to-reproduce bugs |
| `/debug bisect` | Find breaking commit | Tests started failing |
| `/ripple` | Change impact visualization | See what might break |

---

## Example: Production Bug Investigation

### Issue: "Users can't log in after deployment"

```bash
# 1. Check production errors
/siftcoder:monitor errors

# 2. Investigate safely
/siftcoder:investigate "Login fails after deployment"

# 3. Find breaking change
/siftcoder:debug bisect "Login broken"

# 4. Fix with boundaries
/siftcoder:fix "Auth token validation"

# 5. Verify fix
/siftcoder:blast-radius
npm test

# 6. Deploy fix
git push production
```

---

## See Also

- [Workflow: Investigate & Fix](../../05-workflows/investigate-fix.md)
- [Command: /investigate](../02-command-reference/by-category/maintain-workflow.md#investigate)
- [Command: /timewarp](../02-command-reference/by-category/creative-novel.md#timewarp)
