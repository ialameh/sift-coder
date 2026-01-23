# REFACTOR Workflow

**Safe, systematic code improvements**

---

## Overview

The REFACTOR workflow contains 4 commands for safe code refactoring.

---

## Commands Overview

| Command | Purpose | Difficulty | Time |
|---------|---------|------------|------|
| `/refactor suggest` | Find refactoring opportunities | ⭐⭐ Intermediate | 10-20 min |
| `/refactor extract` | Extract function/component | ⭐⭐ Intermediate | 5-15 min |
| `/refactor rename` | Safe cross-codebase rename | ⭐⭐ Intermediate | 5-10 min |
| `/refactor debt` | Technical debt analysis | ⭐⭐ Intermediate | 10-20 min |

---

## /refactor suggest

Find refactoring opportunities - code smells, duplication, complexity.

```bash
/siftcoder:refactor suggest
```

**Output:**
```
🔍 Refactoring Opportunities

CODE SMELLS:
1. Long Method (src/payment.ts:89)
   - Function: processPayment()
   - Lines: 156
   - Complexity: 12
   → Extract smaller methods

2. Duplicate Code
   - Found in: src/auth/login.ts and src/auth/register.ts
   - Duplicated: 45 lines
   → Extract to shared utility

3. Magic Numbers
   - Found in: src/config/constants.ts
   - Examples: 86400000, 0.05
   → Replace with named constants

COMPLEXITY HOTSPOTS:
- src/services/data.transformer.ts (complexity: 18)
- src/utils/validation.ts (cyclomatic complexity: 15)
```

---

## /refactor extract

Extract a function or component from existing code.

```bash
/siftcoder:refactor extract "the validation logic in handleSubmit"
```

---

## /refactor rename

Safe cross-codebase rename with all references updated.

```bash
/siftcoder:refactor rename oldFunctionName newFunctionName
```

---

## /refactor debt

Technical debt analysis with prioritized recommendations.

```bash
/siftcoder:refactor debt
```

---

## Refactoring Workflow

### 1. Analyze Code

```bash
/siftcoder:refactor suggest
```

### 2. Prioritize Issues

**Priority:**
- High complexity (15+)
- Duplicated code
- Security risks
- Performance issues

### 3. Refactor Systematically

```bash
# Extract large method
/siftcoder:refactor extract "processPayment in src/payment.ts"

# Fix duplicate code
/siftcoder:refactor extract "shared auth logic"

# Rename for clarity
/siftcoder:refactor rename badlyNamedFunction clearlyNamedFunction
```

### 4. Validate

```bash
npm test
```

---

## See Also

- [Command: /investigate](./maintain-workflow.md#investigate) - Understand first
- [Command: /fix](./maintain-workflow.md#fix) - Fix with boundaries
