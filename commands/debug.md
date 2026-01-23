# /siftcoder:debug - Intelligent Debugging Assistant

Analyze errors, trace issues, and find root causes faster.

## Usage

```
/siftcoder:debug [subcommand] [input]
```

## Subcommands

| Subcommand | Description |
|------------|-------------|
| `error` | Analyze error message (default) |
| `stacktrace` | Parse and explain stack trace |
| `reproduce` | Help reproduce an issue |
| `bisect` | Find the commit that broke it |
| `trace` | Trace code execution path |

## Arguments
- `$ARGUMENTS` - Subcommand and error message, stack trace, or issue description

## Instructions

You are an expert debugger. Help developers find and fix bugs quickly by analyzing errors, understanding code flow, and identifying root causes.

---

## Phase 0: Interactive Setup

**Use AskUserQuestion tool:**
```
Question: "What kind of debugging help do you need?"
Header: "Issue Type"
Options:
- "Error Message" - "I have an error message to analyze"
- "Stack Trace" - "I have a stack trace to understand"
- "Reproduce Bug" - "I need help reproducing an issue"
- "Find Breaking Commit" - "Something broke, need to find when"
```

---

## Subcommand: error

### Phase 1: Error Analysis

```
/siftcoder:debug error "TypeError: Cannot read property 'map' of undefined"
```

```
ANALYZING ERROR...

Error Type: TypeError
Message: Cannot read property 'map' of undefined

DIAGNOSIS:

This error occurs when trying to call .map() on a value that is undefined.

COMMON CAUSES:

1. API Response Not Loaded Yet
   ```javascript
   // Problem: data is undefined during initial render
   const items = data.items.map(...)

   // Fix: Add null check
   const items = data?.items?.map(...) ?? []
   ```

2. Incorrect State Initialization
   ```javascript
   // Problem: initial state is undefined
   const [items, setItems] = useState()

   // Fix: Initialize with empty array
   const [items, setItems] = useState([])
   ```

3. Missing Default Parameter
   ```javascript
   // Problem: items could be undefined
   function renderList(items) {
     return items.map(...)
   }

   // Fix: Add default value
   function renderList(items = []) {
     return items.map(...)
   }
   ```

4. Destructuring Non-Existent Property
   ```javascript
   // Problem: response doesn't have expected shape
   const { items } = await fetchData()
   items.map(...) // undefined!

   // Fix: Provide default
   const { items = [] } = await fetchData()
   ```
```

### Phase 2: Locate in Codebase

```
SEARCHING CODEBASE...

Potential locations where this error could originate:

HIGH PROBABILITY:
├── src/components/UserList.tsx:23
│   const users = data.users.map(u => ...)
│   Problem: data.users might be undefined
│   Context: Fetches from API, no loading state check
│
├── src/components/ProductGrid.tsx:45
│   products.map(p => <Product key={p.id} />)
│   Problem: products comes from props, could be undefined
│   Context: Parent doesn't always pass products

MEDIUM PROBABILITY:
├── src/hooks/useData.ts:34
│   return data.items.map(transform)
│   Problem: Initial state might not have items
│   Context: Custom hook for data fetching

SEARCH CRITERIA USED:
├── Pattern: .map(
├── Files: *.tsx, *.ts, *.jsx, *.js
└── Context: Near data fetching, state, props
```

### Phase 3: Fix Suggestions

```
RECOMMENDED FIXES

For src/components/UserList.tsx:23:

Option 1: Optional chaining (simplest)
```javascript
// Before
const users = data.users.map(u => <User key={u.id} {...u} />)

// After
const users = data?.users?.map(u => <User key={u.id} {...u} />) ?? []
```

Option 2: Loading state (better UX)
```javascript
// Add loading state
if (isLoading) return <Spinner />
if (!data?.users) return <EmptyState />

const users = data.users.map(u => <User key={u.id} {...u} />)
```

Option 3: Default value in destructuring
```javascript
const { users = [] } = data ?? {}
const userElements = users.map(u => <User key={u.id} {...u} />)
```

NEXT STEPS:
→ /siftcoder:fix "TypeError in UserList.tsx - add null safety"
→ /siftcoder:test generate src/components/UserList.tsx
```

---

## Subcommand: stacktrace

### Stack Trace Analysis

```
/siftcoder:debug stacktrace
```

Then paste stack trace:

```
Error: Connection refused
    at TCPConnectWrap.afterConnect [as oncomplete] (net.js:1141:16)
    at Protocol._enqueue (/app/node_modules/mysql/lib/protocol/Protocol.js:144:48)
    at Connection.query (/app/node_modules/mysql/lib/Connection.js:198:25)
    at UserRepository.findById (/app/src/repositories/user.js:23:16)
    at UserService.getUser (/app/src/services/user.js:45:28)
    at UserController.show (/app/src/controllers/user.js:12:32)
```

```
STACK TRACE ANALYSIS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Error: Connection refused

ROOT CAUSE IDENTIFIED:
Database connection failed - MySQL server not reachable

CALL STACK (bottom to top):

┌─ YOUR CODE ───────────────────────────────────────────────
│
│  3. UserController.show (src/controllers/user.js:12)
│     └─ Entry point: HTTP request handler
│
│  2. UserService.getUser (src/services/user.js:45)
│     └─ Business logic layer
│
│  1. UserRepository.findById (src/repositories/user.js:23)  ← LIKELY FIX HERE
│     └─ Database query initiated
│
├─ LIBRARY CODE ────────────────────────────────────────────
│
│  Connection.query (mysql/lib/Connection.js:198)
│  Protocol._enqueue (mysql/lib/protocol/Protocol.js:144)
│
├─ NODE INTERNALS ──────────────────────────────────────────
│
│  TCPConnectWrap.afterConnect (net.js:1141)
│  └─ Network layer: connection attempt failed
│
└───────────────────────────────────────────────────────────

DIAGNOSIS:

This is a DATABASE CONNECTION error, not a code bug.

POSSIBLE CAUSES:

1. Database not running
   Check: Is MySQL server started?
   Fix: brew services start mysql / systemctl start mysql

2. Wrong connection settings
   Check: DATABASE_URL or connection config
   Verify: host, port, credentials

3. Firewall blocking connection
   Check: Port 3306 accessible?
   Fix: Check firewall rules, security groups

4. Max connections reached
   Check: MySQL connection limit
   Fix: Increase max_connections or use connection pool

5. Network issue (if remote DB)
   Check: Can you ping the database host?
   Fix: Check VPN, network configuration

DEBUGGING STEPS:

1. Verify database is running:
   $ mysql -u root -p -h localhost

2. Check connection config:
   $ echo $DATABASE_URL
   # or check config file

3. Test connection from app:
   Add: console.log('DB Config:', dbConfig)

4. Check error handling in your code:
   src/repositories/user.js:23 should catch this error

CODE REVIEW:

src/repositories/user.js:23
```javascript
// Current (no error handling)
async findById(id) {
  return await db.query('SELECT * FROM users WHERE id = ?', [id]);
}

// Recommended (with error handling)
async findById(id) {
  try {
    return await db.query('SELECT * FROM users WHERE id = ?', [id]);
  } catch (error) {
    if (error.code === 'ECONNREFUSED') {
      throw new DatabaseConnectionError('Cannot connect to database');
    }
    throw error;
  }
}
```
```

---

## Subcommand: reproduce

### Reproduction Assistant

```
/siftcoder:debug reproduce "Payments fail for amounts over $1000"
```

```
REPRODUCTION ASSISTANT
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Issue: Payments fail for amounts over $1000

ANALYZING ISSUE...

HYPOTHESIS FORMATION:

Based on the description, possible causes:

1. Integer overflow / precision issue
   - Amounts stored as integers (cents)?
   - JavaScript number precision?
   - Database column size?

2. Validation threshold
   - Max amount validation?
   - Fraud detection rule?
   - Rate limiting?

3. External API limit
   - Payment processor limit?
   - Per-transaction cap?

RELEVANT CODE FOUND:

src/services/payment.ts:45
```typescript
const processPayment = async (amount: number) => {
  // Convert to cents
  const cents = Math.round(amount * 100);  // 1000 * 100 = 100000 ✓

  // Validate amount
  if (cents > 99999) {  // ❌ FOUND IT! Max is $999.99
    throw new Error('Amount exceeds maximum');
  }
  // ...
}
```

ROOT CAUSE IDENTIFIED:
Line 48: `if (cents > 99999)` limits payments to $999.99

REPRODUCTION STEPS:

1. Start the application
   $ npm run dev

2. Create a test payment:
   ```bash
   curl -X POST http://localhost:3000/api/payments \
     -H "Content-Type: application/json" \
     -d '{"amount": 999.99, "currency": "USD"}'
   # Expected: Success
   ```

3. Try amount over limit:
   ```bash
   curl -X POST http://localhost:3000/api/payments \
     -H "Content-Type: application/json" \
     -d '{"amount": 1000.00, "currency": "USD"}'
   # Expected: Fails with "Amount exceeds maximum"
   ```

4. Boundary testing:
   ```bash
   # $999.99 - should pass
   curl ... -d '{"amount": 999.99}'

   # $1000.00 - should fail (current behavior)
   curl ... -d '{"amount": 1000.00}'
   ```

TEST CASE TO ADD:

```typescript
describe('payment limits', () => {
  it('should accept payments up to $999.99', async () => {
    const result = await processPayment(999.99);
    expect(result.success).toBe(true);
  });

  it('should reject payments over $999.99', async () => {
    // Currently failing at $1000
    // After fix: Should accept up to new limit
    await expect(processPayment(1000.00))
      .rejects.toThrow('Amount exceeds maximum');
  });
});
```

FIX OPTIONS:

1. Increase the limit:
   ```typescript
   if (cents > 10000000) {  // $100,000 max
   ```

2. Make limit configurable:
   ```typescript
   const MAX_AMOUNT = process.env.MAX_PAYMENT_AMOUNT || 10000000;
   if (cents > MAX_AMOUNT) {
   ```

3. Remove limit (if not needed):
   ```typescript
   // Remove the validation entirely
   // But verify with business if limit was intentional
   ```

→ /siftcoder:fix "Increase payment limit from $999.99 to $100,000"
```

---

## Subcommand: bisect

### Git Bisect Automation

```
/siftcoder:debug bisect "Login page crashes"
```

```
GIT BISECT ASSISTANT
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Issue: Login page crashes

PREPARATION:

I'll help you find the commit that introduced this bug.

QUESTIONS:

1. When did it last work?
   - Do you know a commit/date when it worked?
   - Or should I find the last known good state?

2. How to verify the bug?
   - Manual test: Visit /login and check for crash?
   - Automated: Run specific test?
   - Command: npm test -- --grep "login"?

AUTOMATED BISECT:

Based on your answers, here's the bisect strategy:

```bash
# Start bisect
git bisect start

# Mark current commit as bad
git bisect bad HEAD

# Mark known good commit (last release)
git bisect good v2.3.0

# Run automated test for each commit
git bisect run npm test -- --grep "login"
```

RUNNING BISECT...

Testing commit abc1234... BAD
Testing commit def5678... BAD
Testing commit ghi9012... GOOD
Testing commit jkl3456... BAD
Testing commit mno7890... GOOD
Testing commit pqr1234... BAD

FOUND THE BREAKING COMMIT:

commit pqr1234
Author: developer@example.com
Date: 2026-01-05

    Refactor authentication to use new session library

    - Replaced express-session with custom session handler
    - Updated session configuration
    - Changed cookie settings

FILES CHANGED:
├── src/auth/session.ts (+145, -89)
├── src/middleware/auth.ts (+23, -12)
├── package.json (+1, -1)
└── src/pages/login.tsx (+5, -3)

LIKELY CAUSE:

The session refactor changed how login state is handled.

Specific changes to investigate:

src/auth/session.ts:67
```diff
- req.session.regenerate((err) => {
+ this.sessionStore.create(req, (err) => {  // Different API!
```

src/pages/login.tsx:45
```diff
- const { user } = useSession();
+ const { user } = useAuth();  // Changed hook
```

NEXT STEPS:

1. Review the full diff:
   $ git show pqr1234

2. Check what changed in session handling:
   $ git diff ghi9012..pqr1234 -- src/auth/session.ts

3. Revert if needed:
   $ git revert pqr1234

4. Or fix forward:
   → /siftcoder:fix "Login crash after session refactor"
```

---

## Subcommand: trace

### Code Execution Tracing

```
/siftcoder:debug trace "What happens when user clicks checkout"
```

```
CODE EXECUTION TRACE
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Tracing: User clicks checkout button

EXECUTION FLOW:

┌─────────────────────────────────────────────────────────────┐
│ 1. USER INTERACTION                                         │
│    Component: src/components/Cart/CheckoutButton.tsx:12     │
│    Event: onClick handler                                   │
└─────────────────────────────────────────────────────────────┘
              │
              ▼
┌─────────────────────────────────────────────────────────────┐
│ 2. STATE UPDATE                                             │
│    Hook: src/hooks/useCart.ts:45                            │
│    Action: initiateCheckout()                               │
│    State: { isProcessing: true }                            │
└─────────────────────────────────────────────────────────────┘
              │
              ▼
┌─────────────────────────────────────────────────────────────┐
│ 3. API CALL                                                 │
│    Service: src/services/checkout.ts:23                     │
│    Endpoint: POST /api/checkout                             │
│    Payload: { cartId, userId, paymentMethod }               │
└─────────────────────────────────────────────────────────────┘
              │
              ▼
┌─────────────────────────────────────────────────────────────┐
│ 4. SERVER HANDLER                                           │
│    Route: src/api/routes/checkout.ts:34                     │
│    Controller: CheckoutController.create                    │
└─────────────────────────────────────────────────────────────┘
              │
              ▼
┌─────────────────────────────────────────────────────────────┐
│ 5. BUSINESS LOGIC                                           │
│    Service: src/services/CheckoutService.ts:67              │
│    Steps:                                                   │
│    ├─ validateCart()                                        │
│    ├─ calculateTotals()                                     │
│    ├─ processPayment()                                      │
│    └─ createOrder()                                         │
└─────────────────────────────────────────────────────────────┘
              │
              ├─────────────────────┐
              ▼                     ▼
┌──────────────────────┐  ┌──────────────────────┐
│ 6a. PAYMENT SERVICE  │  │ 6b. INVENTORY CHECK  │
│ src/services/        │  │ src/services/        │
│ payment.ts:89        │  │ inventory.ts:45      │
│ → Stripe API call    │  │ → Database query     │
└──────────────────────┘  └──────────────────────┘
              │                     │
              └──────────┬──────────┘
                         ▼
┌─────────────────────────────────────────────────────────────┐
│ 7. DATABASE TRANSACTION                                     │
│    Repository: src/repositories/order.ts:34                 │
│    Operations:                                              │
│    ├─ INSERT INTO orders                                    │
│    ├─ INSERT INTO order_items                               │
│    ├─ UPDATE inventory SET quantity = quantity - X          │
│    └─ UPDATE cart SET status = 'completed'                  │
└─────────────────────────────────────────────────────────────┘
              │
              ▼
┌─────────────────────────────────────────────────────────────┐
│ 8. RESPONSE                                                 │
│    Return: { orderId, status: 'success' }                   │
│    Client receives → Update UI → Redirect to confirmation   │
└─────────────────────────────────────────────────────────────┘

POTENTIAL FAILURE POINTS:

❶ Payment fails (step 6a)
   └─ Error handling: src/services/checkout.ts:89
   └─ User sees: "Payment declined" message

❷ Inventory insufficient (step 6b)
   └─ Error handling: src/services/checkout.ts:78
   └─ User sees: "Item out of stock" message

❸ Database transaction fails (step 7)
   └─ Error handling: Rollback all changes
   └─ User sees: "Unable to complete order"

❹ Network timeout (any API call)
   └─ Timeout: 30 seconds
   └─ Retry: 3 attempts
   └─ User sees: "Please try again"

DATA FLOW:

Cart → Checkout Request
├── cartId: "cart_123"
├── items: [{ productId, quantity, price }]
├── userId: "user_456"
└── paymentMethod: { type: "card", token: "tok_xxx" }

     ↓ validateCart()

Validated Cart
├── items: [{ product, quantity, price, available: true }]
├── subtotal: 99.99
├── tax: 8.25
└── total: 108.24

     ↓ processPayment()

Payment Result
├── chargeId: "ch_789"
├── status: "succeeded"
└── amount: 10824

     ↓ createOrder()

Order Created
├── orderId: "order_xyz"
├── status: "confirmed"
└── estimatedDelivery: "2026-01-15"
```

---

## Tips & Hints

```
DEBUGGING STRATEGIES

1. Reproduce first
   → Can't fix what you can't see
   → Create minimal reproduction
   → Write a failing test

2. Binary search
   → Comment out half the code
   → Narrow down the problem area
   → Use git bisect for regressions

3. Rubber duck debugging
   → Explain the problem out loud
   → Often reveals the issue
   → That's what I'm here for!

4. Check the obvious
   → Is it plugged in? (env vars, config)
   → Did you save the file?
   → Did you restart the server?

5. Read error messages carefully
   → They often tell you exactly what's wrong
   → Look at file:line numbers
   → Google the exact error message

COMMON ERROR PATTERNS

TypeError: Cannot read property X of undefined
  → Something is null/undefined when accessed
  → Add null checks, defaults, loading states

ReferenceError: X is not defined
  → Typo in variable name
  → Import missing
  → Scope issue

SyntaxError
  → Missing bracket, quote, comma
  → Check the line BEFORE the error line
  → Use a linter

NetworkError / CORS
  → Backend not running
  → Wrong URL/port
  → CORS not configured

WHEN TO ASK FOR HELP

After you've:
  → Read the error message
  → Searched for the error
  → Created minimal reproduction
  → Identified where it fails

Then ask with:
  → What you expected
  → What actually happened
  → What you've tried
  → Minimal code to reproduce
```

---

## Skills Used
- **error-analyzer** - Error message interpretation
- **code-tracer** - Execution flow analysis
- **pattern-detector** - Common bug patterns

## Allowed Tools
Read, Grep, Glob, Bash, Task, AskUserQuestion
