# /siftcoder:refactor - Intelligent Refactoring Tools

Identify and execute safe refactoring operations.

## Usage

```
/siftcoder:refactor [subcommand] [target]
```

## Subcommands

| Subcommand | Description |
|------------|-------------|
| `suggest` | Find refactoring opportunities (default) |
| `extract` | Extract function, component, or module |
| `rename` | Safe cross-codebase rename |
| `debt` | Technical debt analysis |
| `inline` | Inline unnecessary abstractions |
| `move` | Move code to better location |

## Arguments
- `$ARGUMENTS` - Subcommand and target file/function/pattern

## Instructions

You are a refactoring expert. Identify opportunities to improve code quality while maintaining behavior. Always ensure tests pass before and after refactoring.

---

## Phase 0: Interactive Setup

**Use AskUserQuestion tool:**
```
Question: "What would you like to refactor?"
Header: "Action"
Options:
- "Find Opportunities (Recommended)" - "Scan for code smells and improvement areas"
- "Extract Code" - "Extract function, component, or module"
- "Rename Symbol" - "Rename with all references updated"
- "Analyze Technical Debt" - "Measure and prioritize debt"
```

**Use AskUserQuestion tool:**
```
Question: "How aggressive should refactoring be?"
Header: "Scope"
Options:
- "Conservative (Recommended)" - "Safe changes with minimal risk"
- "Moderate" - "Include structural changes"
- "Aggressive" - "Major restructuring allowed"
```

---

## Subcommand: suggest

### Phase 1: Code Smell Detection

```
SCANNING FOR REFACTORING OPPORTUNITIES...

Target: src/
Files analyzed: 156
```

```
REFACTORING OPPORTUNITIES FOUND
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

LONG FUNCTIONS (5 found)

1. src/services/checkout.ts:processCheckout (142 lines)
   Complexity: HIGH (cyclomatic: 23)

   Current structure:
   ```
   processCheckout() {
     // Validation (lines 12-45)
     // Calculate totals (lines 46-78)
     // Process payment (lines 79-112)
     // Create order (lines 113-142)
   }
   ```

   Suggestion: Extract into focused functions
   ```
   processCheckout() {
     const cart = await this.validateCart(cartId);
     const totals = this.calculateTotals(cart);
     const payment = await this.processPayment(totals);
     return await this.createOrder(cart, payment);
   }
   ```

   → /siftcoder:refactor extract src/services/checkout.ts:processCheckout

2. src/components/Dashboard.tsx:render (98 lines)
   Complexity: MEDIUM (cyclomatic: 15)

   Suggestion: Extract into sub-components
   ├── <DashboardHeader />
   ├── <DashboardMetrics />
   ├── <DashboardCharts />
   └── <DashboardActivity />

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

DUPLICATE CODE (3 patterns)

1. Validation pattern (found in 4 files)

   Files:
   ├── src/api/users.ts:23-35
   ├── src/api/products.ts:18-30
   ├── src/api/orders.ts:45-57
   └── src/api/payments.ts:12-24

   Pattern:
   ```javascript
   if (!req.body.email) {
     return res.status(400).json({ error: 'Email required' });
   }
   if (!isValidEmail(req.body.email)) {
     return res.status(400).json({ error: 'Invalid email' });
   }
   ```

   Suggestion: Create validation middleware
   ```javascript
   // src/middleware/validate.ts
   const validateEmail = createValidator({
     field: 'email',
     required: true,
     validate: isValidEmail,
     message: 'Invalid email'
   });

   // Usage
   router.post('/users', validateEmail, createUser);
   ```

2. Error handling pattern (found in 8 files)
   Similar try/catch with logging
   Suggestion: Create error handling wrapper

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

GOD CLASSES (2 found)

1. src/services/UserService.ts (45 methods, 890 lines)

   Responsibilities mixed:
   ├── User CRUD (12 methods)
   ├── Authentication (8 methods)
   ├── Email sending (5 methods)
   ├── Profile management (10 methods)
   └── Admin operations (10 methods)

   Suggestion: Split into focused services
   ├── UserRepository (CRUD)
   ├── AuthService (authentication)
   ├── EmailService (notifications)
   ├── ProfileService (profile operations)
   └── AdminService (admin ops)

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

DEEP NESTING (4 instances)

1. src/utils/permissions.ts:checkAccess (6 levels deep)

   Current:
   ```javascript
   if (user) {
     if (user.role) {
       if (user.role === 'admin') {
         if (resource) {
           if (resource.ownerId) {
             if (resource.ownerId === user.id) {
               return true;
             }
           }
         }
       }
     }
   }
   ```

   Suggestion: Early returns
   ```javascript
   if (!user?.role) return false;
   if (user.role !== 'admin') return false;
   if (!resource?.ownerId) return false;
   return resource.ownerId === user.id;
   ```

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

MAGIC NUMBERS/STRINGS (12 instances)

Examples:
├── src/config/session.ts:12 - maxAge: 86400000
├── src/services/payment.ts:45 - if (amount > 99999)
├── src/utils/retry.ts:8 - attempts: 3, delay: 1000

Suggestion: Extract to named constants
```javascript
const SESSION_DURATION_MS = 24 * 60 * 60 * 1000; // 24 hours
const MAX_PAYMENT_CENTS = 99999; // $999.99
const RETRY_CONFIG = { attempts: 3, delay: 1000 };
```

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

SUMMARY

| Category | Count | Priority |
|----------|-------|----------|
| Long functions | 5 | HIGH |
| Duplicate code | 3 | HIGH |
| God classes | 2 | MEDIUM |
| Deep nesting | 4 | MEDIUM |
| Magic numbers | 12 | LOW |

RECOMMENDED ORDER:
1. Extract long functions (highest impact)
2. Create shared validation middleware (removes duplication)
3. Split UserService (reduces complexity)
4. Fix deep nesting (improves readability)
5. Extract constants (when touching files)
```

---

## Subcommand: extract

### Extract Function/Component

```
/siftcoder:refactor extract src/services/checkout.ts:processCheckout
```

```
EXTRACT REFACTORING
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Target: processCheckout (142 lines)
Location: src/services/checkout.ts

ANALYSIS:

Identified logical sections:
├── Section 1: Cart validation (lines 12-45)
│   Inputs: cartId
│   Outputs: validatedCart
│   Side effects: None (read-only)
│
├── Section 2: Total calculation (lines 46-78)
│   Inputs: validatedCart
│   Outputs: totals object
│   Side effects: None (pure function)
│
├── Section 3: Payment processing (lines 79-112)
│   Inputs: totals, paymentMethod
│   Outputs: paymentResult
│   Side effects: Stripe API call
│
└── Section 4: Order creation (lines 113-142)
    Inputs: cart, paymentResult
    Outputs: order
    Side effects: Database write

PROPOSED EXTRACTION:

```typescript
// BEFORE (142 lines)
async processCheckout(cartId: string, paymentMethod: PaymentMethod): Promise<Order> {
  // ... 142 lines of mixed logic
}

// AFTER (clear, testable functions)
async processCheckout(cartId: string, paymentMethod: PaymentMethod): Promise<Order> {
  const cart = await this.validateCart(cartId);
  const totals = this.calculateTotals(cart);
  const payment = await this.processPayment(totals, paymentMethod);
  return await this.createOrder(cart, payment);
}

private async validateCart(cartId: string): Promise<ValidatedCart> {
  const cart = await this.cartRepository.findById(cartId);
  if (!cart) throw new CartNotFoundError(cartId);
  if (cart.items.length === 0) throw new EmptyCartError();

  const validatedItems = await Promise.all(
    cart.items.map(item => this.validateCartItem(item))
  );

  return { ...cart, items: validatedItems };
}

private calculateTotals(cart: ValidatedCart): OrderTotals {
  const subtotal = cart.items.reduce(
    (sum, item) => sum + item.price * item.quantity, 0
  );
  const tax = this.taxService.calculate(subtotal, cart.shippingAddress);
  const shipping = this.shippingService.calculate(cart);

  return { subtotal, tax, shipping, total: subtotal + tax + shipping };
}

private async processPayment(
  totals: OrderTotals,
  paymentMethod: PaymentMethod
): Promise<PaymentResult> {
  return await this.paymentService.charge({
    amount: totals.total,
    currency: 'USD',
    method: paymentMethod
  });
}

private async createOrder(
  cart: ValidatedCart,
  payment: PaymentResult
): Promise<Order> {
  return await this.orderRepository.create({
    items: cart.items,
    payment: payment,
    status: 'confirmed'
  });
}
```

BENEFITS:
├── Each function has single responsibility
├── Functions are independently testable
├── Easier to understand flow
├── Can reuse calculateTotals elsewhere
└── Errors are more localized

TESTS TO ADD:
```typescript
describe('CheckoutService', () => {
  describe('validateCart', () => {
    it('should throw CartNotFoundError for invalid cartId');
    it('should throw EmptyCartError for empty cart');
    it('should validate all items');
  });

  describe('calculateTotals', () => {
    it('should sum item prices correctly');
    it('should calculate tax');
    it('should add shipping');
  });

  // ... tests for each extracted function
});
```

Apply this refactoring?
→ Type 'yes' to apply
→ Type 'preview' to see full diff
→ Type 'no' to cancel
```

---

## Subcommand: rename

### Safe Rename

```
/siftcoder:refactor rename getUserById getUser
```

```
RENAME REFACTORING
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Renaming: getUserById → getUser

IMPACT ANALYSIS:

Definition:
└── src/services/user.ts:23

References found (12):
├── src/controllers/user.ts:12 - const user = await userService.getUserById(id)
├── src/controllers/user.ts:34 - const user = await userService.getUserById(userId)
├── src/api/routes/users.ts:23 - userService.getUserById
├── src/middleware/auth.ts:45 - await userService.getUserById(decoded.userId)
├── src/hooks/useUser.ts:12 - api.getUserById(userId)
├── src/components/Profile.tsx:23 - const { data } = useQuery(() => getUserById(id))
├── tests/services/user.test.ts:34 - getUserById
├── tests/services/user.test.ts:45 - getUserById
├── tests/services/user.test.ts:56 - getUserById
├── tests/controllers/user.test.ts:12 - getUserById
├── tests/middleware/auth.test.ts:23 - getUserById
└── docs/api.md:67 - `getUserById(id)`

TYPE REFERENCES:
└── src/types/services.ts:12 - getUserById: (id: string) => Promise<User>

POTENTIAL ISSUES:

⚠ String reference in docs:
  docs/api.md:67 - Markdown documentation mentions getUserById
  Note: Will update, but verify formatting

⚠ Dynamic call detection:
  src/utils/service-loader.ts:34
  ```javascript
  const methodName = `get${entity}ById`;
  service[methodName](id);
  ```
  Warning: This dynamic call won't be updated automatically

RENAME PLAN:

Files to modify: 14
Lines to change: 18

Preview:

src/services/user.ts:23
```diff
- async getUserById(id: string): Promise<User> {
+ async getUser(id: string): Promise<User> {
```

src/controllers/user.ts:12
```diff
- const user = await userService.getUserById(id);
+ const user = await userService.getUser(id);
```

[... and 16 more changes]

Apply rename?
→ Type 'yes' to apply all changes
→ Type 'preview full' to see complete diff
→ Type 'no' to cancel
```

---

## Subcommand: debt

### Technical Debt Analysis

```
/siftcoder:refactor debt
```

```
TECHNICAL DEBT ANALYSIS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

DEBT SCORE: 67/100 (Moderate)

┌─────────────────────────────────────────────────────────────┐
│ Technical Debt Breakdown                                    │
│                                                             │
│ Code Complexity   ████████████░░░░░░░░  45%                │
│ Duplication       ██████░░░░░░░░░░░░░░  23%                │
│ Test Coverage     ████████████████░░░░  72%                │
│ Documentation     ██████████░░░░░░░░░░  38%                │
│ Dependencies      ████████████████████  95%                │
└─────────────────────────────────────────────────────────────┘

DEBT INVENTORY:

HIGH PRIORITY (blocking or risky):

1. [COMPLEXITY] CheckoutService.processCheckout
   File: src/services/checkout.ts
   Issue: 142 lines, cyclomatic complexity 23
   Risk: Hard to maintain, bug-prone
   Effort: 2-3 hours
   Impact: HIGH

2. [DUPLICATION] Validation logic
   Files: 4 API route files
   Issue: Same validation pattern repeated
   Risk: Inconsistent behavior, multiple fix points
   Effort: 1-2 hours
   Impact: HIGH

3. [COVERAGE] Payment service (34% covered)
   File: src/services/payment.ts
   Issue: Critical code path poorly tested
   Risk: Regressions, production bugs
   Effort: 3-4 hours
   Impact: CRITICAL

MEDIUM PRIORITY:

4. [COMPLEXITY] UserService god class
   File: src/services/user.ts
   Issue: 45 methods, mixed responsibilities
   Effort: 4-6 hours

5. [OUTDATED] express-session vulnerability
   File: package.json
   Issue: Known CVE in current version
   Effort: 1 hour

6. [TODO] 23 TODO comments in codebase
   Oldest: 8 months ago
   Critical: 3 security-related

LOW PRIORITY:

7. [STYLE] Inconsistent naming conventions
8. [DOCS] 12 public APIs undocumented
9. [MAGIC] 34 magic numbers/strings

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

DEBT TRENDS:

Past 3 months:
├── Month 1: Score 72 (baseline)
├── Month 2: Score 68 (debt increased)
└── Month 3: Score 67 (slight increase)

New debt added: 15 items
Debt resolved: 8 items
Net change: +7 items (debt growing)

HOTSPOTS (most problematic files):

1. src/services/checkout.ts
   Complexity: 89 | Changes: 45 | Bugs: 8
   ██████████████████████████████████████████ 89%

2. src/services/user.ts
   Complexity: 76 | Changes: 34 | Bugs: 5
   ████████████████████████████████████░░░░░░ 76%

3. src/api/routes/orders.ts
   Complexity: 65 | Changes: 28 | Bugs: 4
   ██████████████████████████████░░░░░░░░░░░░ 65%

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

PAYOFF RECOMMENDATIONS:

Tackle in this order for maximum impact:

1. Add tests to payment service (3-4 hours)
   ROI: Prevents production bugs in critical path

2. Extract checkout service functions (2-3 hours)
   ROI: Easier maintenance, fewer bugs

3. Create validation middleware (1-2 hours)
   ROI: Consistency, DRY, easier testing

4. Update vulnerable dependency (1 hour)
   ROI: Security compliance

Total: ~10 hours for significant improvement
Expected debt score after: 78/100

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

REPORT SAVED:
.claude/siftcoder-state/refactor/debt-report-2026-01-10.md
```

---

## Tips & Hints

```
REFACTORING BEST PRACTICES

Before refactoring:
  → Ensure tests exist and pass
  → Commit current state (can rollback)
  → Understand what code does first

Safe refactoring steps:
  1. Run tests (green)
  2. Make small change
  3. Run tests (still green)
  4. Commit
  5. Repeat

Red flags (don't refactor):
  → No tests exist
  → Deadline pressure
  → Don't understand the code
  → "While I'm here..." scope creep

COMMON REFACTORINGS

Extract Function:
  → Long function → multiple smaller ones
  → Duplicate code → shared function

Rename:
  → Unclear name → descriptive name
  → Always use tools for safety

Inline:
  → Unnecessary abstraction → direct code
  → Function called once → inline it

Move:
  → Misplaced code → correct module
  → Feature envy → move to owner

WHEN TO REFACTOR

Good times:
  → Before adding feature (prepare)
  → After fixing bug (prevent recurrence)
  → Code review feedback
  → Scheduled tech debt time

Bad times:
  → During emergency fix
  → Large unrelated changes
  → Without tests
  → Under deadline pressure
```

---

## Skills Used
- **code-analyzer** - Smell detection
- **pattern-detector** - Duplicate code finding
- **complexity-calculator** - Cyclomatic complexity

## Allowed Tools
Read, Write, Edit, Grep, Glob, Bash, Task, AskUserQuestion
