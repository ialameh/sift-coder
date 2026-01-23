---
description: Code-to-Story Translation - Converts code into narrative explanations for any audience
argument-hint: <file-or-area> --audience <role>
allowed-tools: Read, Write, Glob, Grep, Task
---

# /siftcoder:narrator - Code-to-Story Translation

Transforms code into engaging narrative explanations tailored for any audience - from product managers to executives to new developers.

## Usage

```
/siftcoder:narrator <file>                       - Default narrative
/siftcoder:narrator <file> --audience <role>     - Tailored for role
/siftcoder:narrator <area> --journey             - User journey through code
/siftcoder:narrator --system                     - Full system narrative
```

## Audiences

```
--audience "product manager"    - Business impact, features, no code
--audience "executive"          - High-level, metrics, decisions
--audience "new developer"      - Educational, step-by-step
--audience "security auditor"   - Risk focus, data flow
--audience "support team"       - User impact, troubleshooting
--audience "investor"           - Value proposition, scale
```

## Philosophy

```
Code is a story waiting to be told.

Variables are characters.
Functions are actions.
Control flow is plot.
Comments are narration.

Great storytelling:
  • Makes complex things simple
  • Engages the listener's context
  • Reveals the "why" behind the "what"
  • Creates understanding, not just information
```

## Instructions

### Default: Generate Narrative

**Step 1: Understand the Code**

```
/siftcoder:narrator src/checkout/flow.ts --audience "product manager"
```

Read and analyze the code structure, then generate narrative:

```
GENERATING NARRATIVE
═══════════════════════════════════════════════════════════════

Source: src/checkout/flow.ts (342 lines)
Audience: Product Manager
Tone: Business-focused, no technical jargon
```

**Step 2: Generate the Story**

```
═══════════════════════════════════════════════════════════════
THE CHECKOUT JOURNEY
A Story for Product Managers
═══════════════════════════════════════════════════════════════

CHAPTER 1: The Beginning
─────────────────────────────────────────────────────────────────

When a customer clicks "Checkout", they embark on a carefully
orchestrated journey. Here's what happens behind the scenes:

First, we check if they're logged in. If not, they see a login
screen - but don't worry, we remember everything in their cart.
Nobody loses their shopping progress.


CHAPTER 2: The Safety Check
─────────────────────────────────────────────────────────────────

Before we can accept payment, we verify their cart is still valid:

  "Is everything still in stock?"
  "Have any prices changed since they started shopping?"
  "Are there any items we can't ship to their address?"

Think of it like a waiter confirming your order before sending
it to the kitchen. If something's wrong, we tell the customer
exactly what changed and let them decide what to do.

This prevents the frustrating experience of paying for something
that's no longer available.


CHAPTER 3: The Payment Dance
─────────────────────────────────────────────────────────────────

This is where it gets interesting. We never touch their actual
credit card number - that would be a security risk. Instead:

  1. Customer enters their card details
  2. Those details go directly to Stripe (our payment processor)
  3. Stripe gives us a secure "token" representing the card
  4. We use that token to charge them

Why so indirect? Two reasons:

  SECURITY: If we're ever hacked, there are no card numbers to
  steal. We never had them in the first place.

  COMPLIANCE: This keeps us PCI compliant without expensive
  audits. Stripe handles the hard security stuff.

The actual charge takes about 3 seconds. During this time:
  - We show a spinner (keeps users calm)
  - We're actually doing 4 things simultaneously
  - If any step fails, we clean up gracefully


CHAPTER 4: The Happy Ending
─────────────────────────────────────────────────────────────────

Once payment succeeds, a cascade of good things happens:

  1. ORDER CREATED - Saved in our database with all details
  2. EMAIL SENT - Confirmation arrives in their inbox
  3. INVENTORY UPDATED - Those items are now "sold"
  4. WAREHOUSE NOTIFIED - Packing can begin immediately

All of this happens in about 3 seconds total.


═══════════════════════════════════════════════════════════════
KEY INSIGHTS FOR YOUR ROADMAP
═══════════════════════════════════════════════════════════════

OPPORTUNITY #1: The 5-Second Rule
─────────────────────────────────────────────────────────────────
Currently, if Stripe takes more than 5 seconds to respond, we
show an error. But sometimes Stripe is just slow, not broken.

Impact: ~2% of payments fail unnecessarily
Recommendation: Increase timeout to 10 seconds
Effort: Small (config change)


OPPORTUNITY #2: Card Declined UX
─────────────────────────────────────────────────────────────────
When a card is declined, we just say "Payment failed."

We could instead:
  - Suggest trying a different card
  - Offer to save the cart for later
  - Show alternative payment methods

Impact: Could recover 10-15% of failed payments
Effort: Medium (UI + logic changes)


OPPORTUNITY #3: The Inventory Race
─────────────────────────────────────────────────────────────────
We check inventory BEFORE payment. Some competitors check AFTER.

Our way: Customer never pays for unavailable items
Their way: Faster checkout, occasional refunds needed

Current choice is more customer-friendly but adds ~200ms to
checkout. Worth discussing if speed becomes a priority.


═══════════════════════════════════════════════════════════════
GLOSSARY (Just in Case)
═══════════════════════════════════════════════════════════════

Stripe: Our payment processor (like a digital cash register)
Token: A secure stand-in for sensitive data (like a coat check)
PCI Compliance: Security standards for handling credit cards
Webhook: A way for Stripe to notify us when something happens

═══════════════════════════════════════════════════════════════
```

### Audience: Executive

```
/siftcoder:narrator src/checkout/ --audience "executive"
```

```
═══════════════════════════════════════════════════════════════
CHECKOUT SYSTEM EXECUTIVE BRIEF
═══════════════════════════════════════════════════════════════

BOTTOM LINE
─────────────────────────────────────────────────────────────────
Our checkout system processes $2.3M monthly with 97.8% success
rate. Key risk: payment timeout causing 2% unnecessary failures.


WHAT IT DOES
─────────────────────────────────────────────────────────────────
Converts shopping carts into paid orders. Handles payment
processing, fraud detection, inventory management, and order
fulfillment triggers - all in under 4 seconds.


KEY METRICS
─────────────────────────────────────────────────────────────────
  Conversion rate:     97.8%
  Average checkout:    3.2 seconds
  Cart abandonment:    18% (industry avg: 25%)
  Fraud rate:          0.02%
  Monthly volume:      $2.3M


RISKS & OPPORTUNITIES
─────────────────────────────────────────────────────────────────
  [RISK] Single payment processor (Stripe)
         Mitigation: Adding PayPal as backup (Q2)

  [OPPORTUNITY] Timeout adjustment
         Potential: +$46K/month recovered revenue
         Investment: 2 engineering days


DEPENDENCIES
─────────────────────────────────────────────────────────────────
  External: Stripe (critical), SendGrid (email), Warehouse API
  Internal: User service, Inventory service, Order database


DECISION NEEDED
─────────────────────────────────────────────────────────────────
Should we prioritize payment timeout fix ($46K/mo impact) or
new payment methods ($85K/mo potential but 6 weeks work)?

═══════════════════════════════════════════════════════════════
```

### Audience: New Developer

```
/siftcoder:narrator src/checkout/flow.ts --audience "new developer"
```

```
═══════════════════════════════════════════════════════════════
CHECKOUT SYSTEM: A GUIDED TOUR
For New Developers
═══════════════════════════════════════════════════════════════

Welcome! Let's walk through how checkout works. I'll explain
everything step-by-step, and point out patterns you'll see
throughout our codebase.


BEFORE WE START
─────────────────────────────────────────────────────────────────
Open these files in your editor:
  • src/checkout/flow.ts (main logic)
  • src/checkout/types.ts (data structures)
  • src/services/stripe.ts (payment integration)


STEP 1: THE ENTRY POINT (flow.ts:1-25)
─────────────────────────────────────────────────────────────────

export async function processCheckout(
  cart: Cart,
  user: User,
  paymentMethod: PaymentMethod
): Promise<CheckoutResult>

This is where everything begins. Notice:

  • It's an ASYNC function - we'll be waiting for external
    services (Stripe, database)

  • Clear parameter types - Cart, User, PaymentMethod are
    defined in types.ts

  • Returns a Promise<CheckoutResult> - either success with
    an order, or failure with an error

PATTERN: We use TypeScript strictly. Every function has clear
input and output types. This catches bugs at compile time.


STEP 2: VALIDATION (flow.ts:27-65)
─────────────────────────────────────────────────────────────────

const validationResult = await validateCart(cart, user);
if (!validationResult.valid) {
  return { success: false, error: validationResult.error };
}

Before doing anything expensive (like charging a card), we
validate everything. This is called "fail fast."

PATTERN: We return early on errors rather than nesting.
Compare this:

  // BAD - deep nesting
  if (valid) {
    if (inStock) {
      if (paymentOk) {
        // finally do something
      }
    }
  }

  // GOOD - early returns
  if (!valid) return error;
  if (!inStock) return error;
  if (!paymentOk) return error;
  // now do something


STEP 3: PAYMENT PROCESSING (flow.ts:67-120)
─────────────────────────────────────────────────────────────────

const paymentResult = await stripeService.charge({
  amount: cart.total,
  currency: 'usd',
  paymentMethod: paymentMethod.id,
  metadata: { orderId: tempOrderId }
});

This calls our Stripe service. Notice:

  • We pass a temporary order ID in metadata - this helps
    reconciliation if something goes wrong

  • The stripeService is injected (not imported directly) -
    this makes testing easier

PATTERN: External services are wrapped in our own service
classes. Never call Stripe directly from business logic.

[Continues with more steps...]


YOUR FIRST TASK
─────────────────────────────────────────────────────────────────
Now that you understand the flow, try this:

  1. Find where we handle "card declined" errors
  2. Add a log message when this happens
  3. Run the test: npm test checkout.test.ts

This is a safe first change that will help you learn the
codebase without risk.

Need help? Ask in #dev-help or ping @sarah

═══════════════════════════════════════════════════════════════
```

### Command: `--journey`

Follow a user's path through code:

```
/siftcoder:narrator --journey "user makes a purchase"
```

```
═══════════════════════════════════════════════════════════════
USER JOURNEY: Making a Purchase
═══════════════════════════════════════════════════════════════

Follow along as we trace a customer's path through our system...


🛒 SCENE 1: Adding to Cart
   Location: src/cart/add.ts
   Time: 0.0s
─────────────────────────────────────────────────────────────────
Sarah sees a product she likes and clicks "Add to Cart."

Behind the scenes:
  • We validate the product exists and is in stock
  • We check her cart for duplicates (increase quantity instead)
  • We calculate the new cart total
  • We save to her session (or database if logged in)

The button changes to "Added!" - she feels satisfied.


💳 SCENE 2: Starting Checkout
   Location: src/checkout/init.ts
   Time: 0.0s
─────────────────────────────────────────────────────────────────
Sarah clicks "Checkout" and sees a loading spinner for 1.2s.

During that spinner:
  • We lock her cart (no changes during checkout)
  • We re-verify all items are still available
  • We calculate shipping options for her address
  • We prepare the payment form

She sees the checkout page - items, total, payment form.


[Continues through each scene...]


📧 SCENE 7: Confirmation
   Location: src/notifications/order.ts
   Time: 3.4s total
─────────────────────────────────────────────────────────────────
Sarah sees "Order Confirmed!" and her email pings.

Final actions:
  • Order saved with status "confirmed"
  • Confirmation email sent via SendGrid
  • Warehouse API notified to start packing
  • Analytics event recorded

Sarah closes the browser, happy customer.

Total time: 3.4 seconds from click to confirmation

═══════════════════════════════════════════════════════════════
```

## Configuration

```json
{
  "narrator": {
    "defaultAudience": "developer",
    "includeCodeSnippets": true,
    "maxLength": "detailed",
    "tone": "friendly",
    "includeGlossary": true
  }
}
```

## Integration

Works well with:
  • `/siftcoder:document` - Generate formal documentation
  • `/siftcoder:archaeologist` - Understand code history
  • `/siftcoder:empathy` - Find confusing code to explain
  • `/siftcoder:learn` - Onboarding materials
