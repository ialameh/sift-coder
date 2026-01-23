# Use Case: Refactoring

**Improving code quality and maintainability**

---

## Overview

Refactoring improves code structure without changing behavior. SiftCoder provides safe refactoring tools with blast radius validation to prevent regressions.

---

## Refactoring Workflow

### Step 1: Analyze Current Code

```bash
# 1. Understand current structure
/siftcoder:understand

# Output:
# ✓ Architecture patterns identified
# ✓ Code smells detected
# ✓ Dependencies mapped
# ✓ Refactoring opportunities listed

# 2. Get specific suggestions
/siftcoder:refactor suggest

# Output:
# 💡 REFACTORING SUGGESTIONS:
#
# 1. Extract UserService (450 lines → 3 classes)
#    File: src/services/user.ts
#    Benefit: Better separation of concerns
#
# 2. Replace conditionals with polymorphism
#    File: src/handlers/payment.ts
#    Benefit: Easier to add payment methods
#
# 3. Extract validation logic
#    Files: src/validators/*.ts
#    Benefit: Reusable validation
```

### Step 2: Plan Refactoring

```bash
# 3. Create checkpoint
/siftcoder:checkpoint save before-refactor

# 4. Set boundaries
/siftcoder:scope add src/services/user.ts
/siftcoder:scope add src/tests/user.test.ts
/siftcoder:scope protect src/api/

# 5. Preview changes
/siftcoder:preview "Extract UserService"
```

### Step 3: Execute Refactoring

```bash
# 6. Extract class
/siftcoder:refactor extract "Extract UserRepository"

# 7. Rename for clarity
/siftcoder:refactor rename "UserService" to "UserManager"

# 8. Run tests
npm test

# 9. Verify no regressions
/siftcoder:blast-radius
```

### Step 4: Validate

```bash
# 10: Full test suite
npm test

# 11. Check coverage
/siftcoder:test coverage

# 12. If issues, rollback
/siftcoder:rollback before-refactor
```

---

## Refactoring Types

### Extract Method/Class

```bash
# 1. Extract large method
/siftcoder:refactor extract "Extract validation logic from user creation"

# Before:
function createUser(data) {
  // 50 lines of validation
  // 10 lines of user creation
  // 5 lines of notification
}

# After:
function createUser(data) {
  validateUserData(data);
  const user = saveUser(data);
  notifyUser(user);
}

# 2. Extract class
/siftcoder:refactor extract "Extract UserRepository from UserService"

# Before:
class UserService {
  create() { /* ... */ }
  update() { /* ... */ }
  delete() { /* ... */ }
  find() { /* ... */ }
  validate() { /* ... */ }
}

# After:
class UserService {
  constructor(repo, validator) { /* ... */ }
}

class UserRepository {
  create() { /* ... */ }
  update() { /* ... */ }
  delete() { /* ... */ }
  find() { /* ... */ }
}

class UserValidator {
  validate() { /* ... */ }
}
```

### Rename

```bash
# 1. Rename for clarity
/siftcoder:refactor rename "DataManager" to "UserRepository"

# 2. Rename method
/siftcoder:refactor rename "get" to "findById"

# 3. Rename variable
/siftcoder:refactor rename "usr" to "user"

# SiftCoder updates all references
```

### Replace Conditional with Polymorphism

```bash
# 1. Identify switch/case on type
/siftcoder:refactor suggest

# Output:
# Consider replacing conditional with polymorphism:
# File: src/payment/processor.ts:45
#
# switch (paymentMethod.type) {
#   case 'credit_card':
#     return processCreditCard(payment);
#   case 'paypal':
#     return processPayPal(payment);
#   case 'bank_transfer':
#     return processBankTransfer(payment);
# }

# 2. Refactor to polymorphism
/siftcoder:refactor extract "Extract payment processor interface"

# Creates:
interface PaymentProcessor {
  process(payment): Promise<PaymentResult>;
}

class CreditCardProcessor implements PaymentProcessor {
  async process(payment) { /* ... */ }
}

class PayPalProcessor implements PaymentProcessor {
  async process(payment) { /* ... */ }
}

# 3. Use factory
const processor = PaymentProcessorFactory.create(paymentMethod.type);
return processor.process(payment);
```

### Extract Interface

```bash
# 1. Extract interface from concrete class
/siftcoder:refactor extract "Extract IRepository interface"

# Before:
class UserRepository {
  findById(id) { /* ... */ }
  findAll() { /* ... */ }
  create(data) { /* ... */ }
  update(id, data) { /* ... */ }
  delete(id) { /* ... */ }
}

# After:
interface IRepository<T> {
  findById(id): Promise<T>;
  findAll(): Promise<T[]>;
  create(data): Promise<T>;
  update(id, data): Promise<T>;
  delete(id): Promise<void>;
}

class UserRepository implements IRepository<User> {
  // implementation
}
```

---

## Code Smell Refactoring

### Long Method

```bash
# 1. Identify long methods
/siftcoder:investigate "Long methods in payment module"

# 2. Extract smaller methods
/siftcoder:refactor extract "Extract payment validation"
/siftcoder:refactor extract "Extract payment processing"
/siftcoder:refactor extract "Extract payment notification"
```

### Large Class

```bash
# 1. Identify large classes
/siftcoder:investigate "Classes with too many responsibilities"

# 2. Split into focused classes
/siftcoder:refactor extract "Extract validation to separate class"
/siftcoder:refactor extract "Extract persistence to repository"
```

### Duplicate Code

```bash
# 1. Find duplicates
/siftcoder:investigate "Duplicate validation logic"

# 2. Extract common code
/siftcoder:refactor extract "Extract common validator"

# 3. Use in both places
[Both files now use extracted validator]
```

### Feature Envy

```bash
# 1. Identify feature envy
/siftcoder:investigate "Methods that should belong to other classes"

# 2. Move method to appropriate class
/siftcoder:refactor extract "Move method to User class"

# Before:
class UserService {
  getUserEmail(user) {
    return user.email;  // Should be on User
  }
}

# After:
class User {
  getEmail() {
    return this.email;
  }
}
```

---

## Architectural Refactoring

### Layered Architecture

```bash
# 1. Extract layers
/siftcoder:refactor extract "Extract repository layer"
/siftcoder:refactor extract "Extract service layer"
/siftcoder:refactor extract "Extract controller layer"

# Result:
src/
  controllers/    # HTTP handling
  services/       # Business logic
  repositories/   # Data access
  models/         # Domain models
```

### Dependency Injection

```bash
# 1. Extract dependencies
/siftcoder:refactor extract "Extract dependency injection"

# Before:
class UserService {
  constructor() {
    this.db = new Database();
    this.emailService = new EmailService();
  }
}

# After:
class UserService {
  constructor(db, emailService) {
    this.db = db;
    this.emailService = emailService;
  }
}
```

---

## Safe Refactoring Practices

### Always Use Checkpoints

```bash
# Before refactoring
/siftcoder:checkpoint save before-refactor

# After refactoring
# If tests pass, keep
# If tests fail, rollback
/siftcoder:rollback before-refactor
```

### Use Blast Radius

```bash
# After each refactor
/siftcoder:blast-radius

# Validates:
# ✓ Modified area tests pass
# ✓ Protected area tests pass
# ✓ No regressions
```

### Refactor in Small Steps

```bash
# WRONG: Big refactoring
/siftcoder:refactor extract "Rewrite entire user module"

# RIGHT: Small steps
/siftcoder:refactor extract "Extract validator"
npm test
/siftcoder:refactor extract "Extract repository"
npm test
/siftcoder:refactor extract "Extract service"
npm test
```

### Keep Tests Green

```bash
# After each change
npm test

# Only proceed if tests pass
# If tests fail, fix or rollback
```

---

## Example: Refactoring a Service

```bash
# Original: 400-line UserService with mixed concerns

# Step 1: Analyze
/siftcoder:investigate "UserService refactoring opportunities"

# Output:
# 🔍 ANALYSIS:
#
# File: src/services/UserService.ts (400 lines)
# Concerns:
# - User validation (80 lines)
# - Database operations (120 lines)
# - Email notifications (60 lines)
# - Business logic (100 lines)
# - Error handling (40 lines)
#
# Suggestion: Extract 4 classes

# Step 2: Checkpoint
/siftcoder:checkpoint save before-user-refactor

# Step 3: Set boundaries
/siftcoder:scope add src/services/UserService.ts
/siftcoder:scope add src/tests/UserService.test.ts
/siftcoder:scope protect src/api/

# Step 4: Extract validators
/siftcoder:refactor extract "Extract UserValidator class"

npm test
# ✓ Tests pass

# Step 5: Extract repository
/siftcoder:refactor extract "Extract UserRepository class"

npm test
# ✓ Tests pass

# Step 6: Extract email service
/siftcoder:refactor extract "Extract UserNotificationService class"

npm test
# ✓ Tests pass

# Step 7: Simplify UserService
# Now only business logic (100 lines)

npm test
# ✓ All tests pass

# Step 8: Blast radius
/siftcoder:blast-radius

# Output:
# ✅ BLAST RADIUS VALIDATION:
#
# Modified area tests: ✓ PASS
# Protected area tests: ✓ PASS
# No regressions detected
#
# Refactoring successful!

# Step 9: Update documentation
/siftcoder:document code src/services/
```

---

## Technical Debt Management

### Track Debt

```bash
# 1. Identify technical debt
/siftcoder:investigate "Technical debt"

# 2. Prioritize by impact
/siftcoder:fortune

# Output:
# 🔮 TECHNICAL DEBT PREDICTIONS:
#
# HIGH PRIORITY (Fix within 1 month):
# - UserService (400 lines) - Will cause bugs
# - No tests in payment module - Will break in production
#
# MEDIUM PRIORITY (Fix within 3 months):
# - Duplicate validation logic - Slowing development
# - Missing error handling - Will cause issues
#
# LOW PRIORITY (Fix within 6 months):
# - Inconsistent naming - Annoying but not critical
```

### Pay Down Debt

```bash
# 3. Create debt payment plan
/siftcoder:refactor suggest

# 4. Pay debt incrementally
# Each sprint, reserve time for debt payment

# Week 1: Fix UserService
/siftcoder:refactor extract "Extract UserService components"

# Week 2: Add tests to payment
/siftcoder:test generate src/payment/

# Week 3: Extract validation
/siftcoder:refactor extract "Extract common validator"
```

---

## Quick Reference

| Task | Command |
|------|---------|
| **Get suggestions** | `/refactor suggest` |
| **Extract** | `/refactor extract <name>` |
| **Rename** | `/refactor rename <old> to <new>` |
| **Track debt** | `/fortune` |
| **Checkpoint** | `/checkpoint save <name>` |
| **Blast radius** | `/blast-radius` |

---

## Best Practices

### ✅ DO

- Use checkpoints before refactoring
- Refactor in small steps
- Run tests after each change
- Use blast radius validation
- Keep tests green
- Document changes
- Pay debt incrementally
- Prioritize by impact
- Refactor when adding features
- Improve code quality

### ❌ DON'T

- Refactor without tests
- Make big changes at once
- Skip checkpoints
- Ignore blast radius
- Break existing functionality
- Create technical debt
- Refactor for fun
- Optimize prematurely
- Change interface unnecessarily
- Forget to update tests

---

## See Also

- [Workflow: Investigate & Fix](../../05-workflows/investigate-fix.md)
- [Use Case: Legacy Codebase](../by-problem-type/legacy-codebase.md)
- [Best Practices: Safety First](../../09-best-practices/index.md)
