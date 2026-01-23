# Use Case: Legacy Codebase

**Working with and modernizing existing code**

---

## Overview

Legacy codebases present unique challenges: lack of tests, outdated patterns, unclear architecture, and fear of breaking things. SiftCoder provides safe workflows for understanding and modernizing legacy code.

---

## Legacy Code Workflows

### Workflow 1: Understanding Legacy Code

```bash
# 1. Understand the codebase
/siftcoder:understand

# Output:
# ✓ Architecture patterns identified
# ✓ Dependencies mapped
# ✓ Code smells detected
# ✓ Entry points documented

# 2. Search for specific patterns
/siftcoder:search "user authentication flow"

# 3. Document architecture
/siftcoder:document architecture

# 4. Generate diagrams
/siftcoder:document architecture --diagrams
```

### Workflow 2: Safe Refactoring

```bash
# 1. Investigate area to refactor
/siftcoder:investigate "User authentication module"

# 2. Create checkpoint
/siftcoder:checkpoint save before-refactor

# 3. Set strict boundaries
/siftcoder:scope set src/auth/
/siftcoder:scope protect src/api/
/siftcoder:scope protect src/db/

# 4. Refactor with blast radius validation
/siftcoder:refactor extract "Extract auth service"

# 5. Verify no breakage
/siftcoder:blast-radius

# 6. If issues, rollback
/siftcoder:rollback before-refactor
```

### Workflow 3: Adding Tests to Legacy Code

```bash
# 1. Generate tests for existing code
/siftcoder:test generate src/legacy/

# 2. Focus on critical paths
/siftcoder:test generate src/legacy/payment-processing.ts

# 3. Check coverage
/siftcoder:test coverage

# 4. Find untested critical code
/siftcoder:test coverage --uncovered

# 5. Add tests incrementally
/siftcoder:test generate src/legacy/inventory.ts --critical
```

---

## Modernization Strategies

### Strategy 1: Incremental Modernization

```bash
# Month 1: Add tests
/siftcoder:test generate src/
/siftcoder:test coverage

# Month 2: Fix critical bugs
/siftcoder:investigate "Known issues"
/siftcoder:fix "Critical bugs"

# Month 3: Refactor small areas
/siftcoder:refactor suggest
# Pick small wins

# Month 4: Document
/siftcoder:document architecture
/siftcoder:document code

# Month 5+: Add features
/siftcoder:add-feature "New features"
```

### Strategy 2: Strangler Fig Pattern

```bash
# 1. Build new system alongside old
/siftcoder:add-feature "New user service"

# 2. Create proxy/facade
/siftcoder:add-feature "API gateway"

# 3. Migrate incrementally
/siftcoder:bridge "Legacy users" "New user service"

# 4. Route traffic gradually
/siftcoder:add-feature "Feature flag for new service"

# 5. Decommission old code
[When 100% migrated]
```

### Strategy 3: Parallel Implementation

```bash
# 1. Explore legacy code
/siftcoder:investigate "Legacy payment system"

# 2. Document behavior
/siftcoder:document technical

# 3. Build new implementation
/siftcoder:add-feature "New payment system"

# 4. Compare implementations
/siftcoder:bridge "Legacy payment" "New payment"

# 5: Run both in parallel
/siftcoder:add-feature "Payment comparison mode"

# 6: Migrate when confident
```

---

## Common Legacy Code Patterns

### Pattern 1: God Objects

```bash
# 1. Identify god object
/siftcoder:investigate "Large class with too many responsibilities"

# 2. Extract smaller classes
/siftcoder:refactor extract "Extract user repository"

# 3: Verify
/siftcoder:blast-radius

# 4. Continue extracting
/siftcoder:refactor extract "Extract validation service"
```

### Pattern 2: Spaghetti Code

```bash
# 1. Map dependencies
/siftcoder:understand

# 2. Identify circular dependencies
[Dependency graph shows cycles]

# 3. Break cycles
/siftcoder:refactor extract "Extract module"
/siftcoder:refactor suggest

# 4. Test
npm test
```

### Pattern 3: Missing Abstractions

```bash
# 1. Find duplicated code
/siftcoder:investigate "Duplicated payment logic"

# 2. Extract abstraction
/siftcoder:refactor extract "Extract payment processor interface"

# 3. Implement concrete classes
/siftcoder:add-feature "Implement payment providers"

# 4. Verify
npm test
```

---

## Working with Legacy Databases

### Database Schema Migration

```bash
# 1. Analyze current schema
/siftcoder:schema erd

# 2. Plan migration
/siftcoder:schema-migrate plan

# 3. Review changes
/siftcoder:preview

# 4. Deploy migration
/siftcoder:schema-migrate deploy

# 5. Verify
/siftcoder:schema erd
```

### Data Migration

```bash
# 1. Understand data structure
/siftcoder:investigate "User data model"

# 2. Create migration script
/siftcoder:add-feature "Data migration script"

# 3. Test on copy
/siftcoder:test generate migrations/test-migration.ts

# 4. Run migration
npm run migrate
```

---

## Legacy Code Safety

### Blast Radius Protection

```bash
# 1. Set tight boundaries
/siftcoder:scope add src/legacy/module-to-fix.ts
/siftcoder:scope protect src/legacy/critical-systems/

# 2. Fix
/siftcoder:fix "Bug in legacy module"

# 3. Blast radius validates:
# ✓ Modified area tests pass
# ✓ Protected area tests pass
# ✓ No regressions
```

### Checkpoints

```bash
# 1. Before risky changes
/siftcoder:checkpoint save pre-refactor

# 2. Make changes
[Refactor code]

# 3. If problems
/siftcoder:rollback pre-refactor

# 4. Restore complete state
```

---

## Example: Modernizing a Legacy Module

```bash
# Legacy module: Old authentication system (no tests, unclear logic)

# Step 1: Understand
/siftcoder:investigate "Old auth system"

# Output:
# 🔍 INVESTIGATION RESULTS:
#
# File: src/legacy/auth.ts (850 lines)
# Issues:
# - No tests
# - Mixed concerns (validation, DB, session, email)
# - Hardcoded secrets
# - SQL injection vulnerability
# - Inconsistent error handling
#
# Dependencies: 15 files import this
# Risk level: HIGH

# Step 2: Add tests first
/siftcoder:test generate src/legacy/auth.ts

# Step 3: Set boundaries
/siftcoder:scope add src/legacy/auth.ts
/siftcoder:scope add src/legacy/auth-tests.ts
/siftcoder:scope protect src/api/

# Step 4: Create checkpoint
/siftcoder:checkpoint save before-auth-refactor

# Step 5: Fix security issues
/siftcoder:fix "SQL injection in auth"

# Step 6: Verify
npm test
/siftcoder:blast-radius

# Step 7: Extract services
/siftcoder:refactor extract "Extract auth validation"
/siftcoder:refactor extract "Extract session management"

# Step 8: Verify again
npm test

# Step 9: Document
/siftcoder:document code src/legacy/auth/

# Step 10: Final verification
npm test
/siftcoder:security scan
```

---

## Quick Reference

| Task | Command |
|------|---------|
| **Understand** | `/understand` |
| **Add tests** | `/test generate <file>` |
| **Refactor** | `/refactor extract` |
| **Set boundaries** | `/scope add <file>` |
| **Checkpoint** | `/checkpoint save <name>` |
| **Rollback** | `/rollback <name>` |
| **Blast radius** | `/blast-radius` |

---

## Best Practices for Legacy Code

### ✅ DO

- Always add tests before changing
- Use checkpoints for safety
- Set strict boundaries
- Verify with blast radius
- Refactor in small steps
- Document as you go
- Prioritize by risk

### ❌ DON'T

- Rewrite everything from scratch
- Change code without tests
- Ignore dependencies
- Skip blast radius validation
- Make big changes at once
- Assume it works without testing
- Modify without understanding

---

## See Also

- [Workflow: Investigate & Fix](../../05-workflows/investigate-fix.md)
- [Use Case: Solo Developer](../by-developer-type/solo-developer.md)
- [Best Practices: Safety First](../../09-best-practices/index.md)
