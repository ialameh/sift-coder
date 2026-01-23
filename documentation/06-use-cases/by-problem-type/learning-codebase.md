# Use Case: Learning a Codebase

**Quickly understanding new and unfamiliar code**

---

## Overview

Learning a new codebase can be overwhelming. SiftCoder provides tools to rapidly understand architecture, patterns, and how code works together.

---

## Learning Workflow

### Step 1: High-Level Overview

```bash
# 1. Get overview
/siftcoder:understand

# Output:
# 📊 CODEBASE OVERVIEW:
#
# Project: E-commerce Platform
# Language: TypeScript
# Framework: Express + React
#
# Architecture:
# - Frontend: React SPA
# - Backend: Express API
# - Database: PostgreSQL
# - Cache: Redis
#
# Key Modules:
# - /src/api - API endpoints
# - /src/services - Business logic
# - /src/models - Data models
# - /src/frontend - React app
#
# Patterns Detected:
# - Repository pattern
# - Dependency injection
# - Middleware pattern
# - Service layer pattern
```

### Step 2: Explore Specific Areas

```bash
# 2. Learn about specific module
/siftcoder:learn codebase

# Output:
# 📚 LEARNING PLAN:
#
# 1. Entry Points
#    - src/index.ts (Backend server)
#    - src/frontend/index.tsx (Frontend app)
#
# 2. Data Flow
#    Request → API → Service → Repository → DB → Response
#
# 3. Key Concepts
#    - Controllers handle HTTP
#    - Services contain business logic
#    - Repositories handle data access
#
# 4. Next Steps
#    - Explore authentication flow
#    - Understand payment processing
#    - Review error handling
```

### Step 3: Follow User Journey

```bash
# 3. Trace user flow
/siftcoder:journey "User registration"

# Output:
# 🛤️ USER JOURNEY: Registration
#
# Step 1: Frontend
#    File: src/frontend/pages/Register.tsx:25
#    User fills registration form
#
# Step 2: API Call
#    File: src/frontend/api/auth.ts:15
#    POST /api/auth/register
#
# Step 3: Controller
#    File: src/api/controllers/AuthController.ts:45
#    Validates input, calls service
#
# Step 4: Service
#    File: src/services/AuthService.ts:78
#    Creates user, hashes password
#
# Step 5: Repository
#    File: src/repositories/UserRepository.ts:23
#    Saves to database
#
# Step 6: Response
#    File: src/api/controllers/AuthController.ts:52
#    Returns user + JWT token
```

### Step 4: Visualize Architecture

```bash
# 4. Generate architecture diagram
/siftcoder:document architecture

# Creates:
# - Component diagram
# - Data flow diagram
# - Dependency graph
# - ERD diagram (if database)
```

---

## Learning Commands

| Command | Purpose |
|---------|---------|
| `/understand` | Get codebase overview |
| `/learn codebase` | Structured learning path |
| `/journey <flow>` | Trace user journey |
| `/search <query>` | Semantic code search |
| `/explain <code>` | Get detailed explanation |

---

## Deep Dive Techniques

### Semantic Search

```bash
# 1. Search by meaning
/siftcoder:search "how authentication works"

# Output:
# 🔍 SEMANTIC SEARCH RESULTS:
#
# 1. src/services/AuthService.ts
#    Relevance: 95%
#    Lines 1-150: Authentication service with JWT
#
# 2. src/api/controllers/AuthController.ts
#    Relevance: 88%
#    Lines 1-80: Authentication endpoints
#
# 3. src/middleware/auth.ts
#    Relevance: 82%
#    Lines 1-40: Auth middleware

# 2. Search for patterns
/siftcoder:search "error handling pattern"

# 3. Search for specific functionality
/siftcoder:search "payment processing flow"
```

### Code Explanation

```bash
# 1. Explain specific file
/siftcoder:explain src/services/PaymentService.ts

# Output:
# 📖 PAYMENT SERVICE EXPLANATION:
#
# Purpose: Handle payment processing
#
# Responsibilities:
# - Validate payment data
# - Process payments via providers
# - Handle payment failures
# - Store payment records
#
# Key Methods:
# - processPayment(): Main processing logic
# - validatePayment(): Input validation
# - handleFailure(): Error handling
#
# Dependencies:
# - PaymentProvider (Stripe, PayPal)
# - PaymentRepository (data access)
# - NotificationService (user alerts)
#
# Patterns:
# - Strategy pattern for payment providers
# - Repository pattern for data access
```

### Pattern Detection

```bash
# 2. Detect patterns
/siftcoder:investigate "Design patterns used"

# Output:
# 🔍 PATTERN ANALYSIS:
#
# 1. Repository Pattern
#    Files: src/repositories/*.ts
#    Purpose: Abstract data access
#
# 2. Factory Pattern
#    Files: src/factories/PaymentFactory.ts
#    Purpose: Create payment providers
#
# 3. Middleware Pattern
#    Files: src/middleware/*.ts
#    Purpose: Request/response processing
#
# 4. Observer Pattern
#    Files: src/events/*.ts
#    Purpose: Event handling
```

---

## Learning Strategies

### Strategy 1: Follow a Feature

```bash
# Pick a feature and trace it end-to-end

# 1. Start with UI
/siftcoder:journey "User adds item to cart"

# 2. Follow through backend
# [Shows complete flow]

# 3. Understand database
/siftcoder:explain src/models/Cart.ts

# 4. Review tests
/siftcoder:explain tests/cart.test.ts
```

### Strategy 2: Understand Architecture

```bash
# 1. Get architecture overview
/siftcoder:document architecture

# 2. Review diagrams
# [Component, data flow, dependency diagrams]

# 3. Explore layers
/siftcoder:learn codebase --layer api
/siftcoder:learn codebase --layer services
/siftcoder:learn codebase --layer repositories
```

### Strategy 3: Learn by Example

```bash
# 1. Find similar functionality
/siftcoder:search "user authentication"

# 2. Study implementation
[Read the code]

# 3. Understand patterns
/siftcoder:explain src/services/AuthService.ts

# 4. Apply to new feature
/siftcoder:add-feature "Add similar feature for X"
```

---

## Onboarding Guide

### New Developer Onboarding

```bash
# 1. Generate onboarding guide
/siftcoder:onboard

# Output:
# 👋 NEW DEVELOPER ONBOARDING
#
# Welcome to E-commerce Platform!
#
# Day 1: Setup
#   ✓ Clone repository
#   ✓ Install dependencies: npm install
#   ✓ Start development: npm run dev
#   ✓ Run tests: npm test
#
# Day 2: Architecture
#   - Read: docs/architecture.md
#   - Run: /siftcoder:understand
#   - Review: /siftcoder:document architecture
#
# Day 3: Code Tour
#   - Frontend: src/frontend/
#   - Backend: src/api/
#   - Database: src/models/
#   - Run: /siftcoder:journey "User registration"
#
# Week 1: First Task
#   - Pick a small bug fix
#   - Use: /siftcoder:investigate
#   - Use: /siftcoder:fix
#
# Resources:
#   - Documentation: docs/
#   - API Docs: /docs/api
#   - Team: Ask questions!
```

### Quick Reference Card

```bash
# Generate quick reference
/siftcoder:learn codebase --quick-reference

# Output:
# 📋 QUICK REFERENCE
#
# Commands:
#   npm run dev       - Start development server
#   npm test          - Run tests
#   npm run build     - Build for production
#
# Key Files:
#   src/index.ts      - Backend entry point
#   src/api/          - API endpoints
#   src/services/     - Business logic
#   src/frontend/     - React app
#
# Patterns:
#   Repository: src/repositories/
#   Service: src/services/
#   Model: src/models/
#
# Tips:
#   - Use /siftcoder:search to find code
#   - Use /siftcoder:explain to understand
#   - Use /siftcoder:journey to trace flows
```

---

## Interactive Learning

### Rubber Duck Debugging

```bash
# 1. Start rubber duck mode
/siftcoder:duck "How does payment processing work?"

# AI asks YOU questions:
# - Where would you look first?
# - What file handles payment requests?
# - How do you think it connects to payment providers?

# 2. You answer, AI guides you
[Interactive learning session]

# Benefit: Learn by discovering yourself
```

### Archaeology Mode

```bash
# 1. Understand why code exists
/siftcoder:archaeologist src/services/PaymentService.ts

# Output:
# 🏛️ CODE ARCHAEOLOGY:
#
# File: src/services/PaymentService.ts
# Created: 2023-06-15
# Author: john.doe
#
# Why it exists:
#   "Needed to support multiple payment providers for
#    international customers. Stripe didn't support all
#    countries we wanted to launch in."
#
# Evolution:
#   - Initially: Only Stripe
#   - 2023-08: Added PayPal
#   - 2023-10: Added bank transfers
#   - 2024-01: Refactored for factory pattern
#
# Gotchas:
#   - PayPal doesn't support recurring billing
#   - Bank transfers require manual approval
#   - Always check payment method before processing
```

---

## Common Questions

### How Does Authentication Work?

```bash
/siftcoder:search "authentication flow"
/siftcoder:journey "User login"
```

### Where Is Database Configured?

```bash
/siftcoder:search "database connection"
/siftcoder:explain src/config/database.ts
```

### How Do I Add a New Endpoint?

```bash
/siftcoder:search "API endpoint example"
/siftcoder:explain src/api/controllers/UserController.ts
# Then copy pattern
```

### What's the Error Handling Strategy?

```bash
/siftcoder:search "error handling"
/siftcoder:explain src/middleware/errorHandler.ts
```

---

## Example: Complete Onboarding Session

```bash
# New developer joins team

# Day 1: Setup
npm install
npm run dev

# Day 2: Learn architecture
/siftcoder:understand
/siftcoder:document architecture

# Day 3: Explore codebase
/siftcoder:journey "User registration flow"
/siftcoder:journey "User places order"

# Day 4: Deep dive
/siftcoder:explain src/services/PaymentService.ts
/siftcoder:explain src/repositories/OrderRepository.ts

# Day 5: First contribution
/siftcoder:investigate "Bug: User can't update profile"
/siftcoder:fix "Profile update bug"

# Week 2: Independent work
/siftcoder:add-feature "Add user avatar upload"
```

---

## Quick Reference

| Task | Command |
|------|---------|
| **Get overview** | `/understand` |
| **Structured learning** | `/learn codebase` |
| **Trace flow** | `/journey "<flow>"` |
| **Search code** | `/search "<query>"` |
| **Explain code** | `/explain <file>` |
| **Generate docs** | `/document architecture` |
| **Interactive learning** | `/duck "<question>"` |
| **Code history** | `/archaeologist <file>` |

---

## Learning Tips

### ✅ DO

- Start with high-level overview
- Follow user journeys
- Use semantic search
- Read tests to understand behavior
- Ask rubber duck for help
- Study diagrams
- Trace features end-to-end
- Learn patterns by example
- Document what you learn
- Ask team questions

### ❌ DON'T

- Try to read every file
- Get lost in details early
- Ignore tests
- Skip diagrams
- Work in isolation
- Assume without verifying
- Memorize code
- Fear asking questions
- Overwhelm yourself
- Forget to take breaks

---

## See Also

- [Workflow: Understand Codebase](../../05-workflows/understand-codebase.md)
- [Getting Started](../../01-getting-started/index.md)
- [Command: Understand](../../02-command-reference/by-category/understand-workflow.md)
