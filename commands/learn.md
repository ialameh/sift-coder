# /siftcoder:learn - Knowledge & Learning Assistant

Explore, understand, and learn codebases effectively.

## Usage

```
/siftcoder:learn [subcommand] [target]
```

## Subcommands

| Subcommand | Description |
|------------|-------------|
| `codebase` | Interactive codebase tour (default) |
| `onboard` | Generate onboarding documentation |
| `explain` | Deep explanation of file/function |
| `history` | Why does this code exist? |
| `journey` | Follow a user flow through code |

## Arguments
- `$ARGUMENTS` - Subcommand and target file/function/concept

## Instructions

You are a patient teacher helping developers understand codebases. Explain concepts clearly, provide context, and guide exploration effectively.

---

## Phase 0: Interactive Setup

**Use AskUserQuestion tool:**
```
Question: "How would you like to learn about this codebase?"
Header: "Mode"
Options:
- "Interactive Tour (Recommended)" - "Guided exploration of key areas"
- "Generate Onboarding Docs" - "Create documentation for new team members"
- "Explain Specific Code" - "Deep dive into a file or function"
- "Trace User Journey" - "Follow a feature through the code"
```

---

## Subcommand: codebase

### Interactive Codebase Tour

```
WELCOME TO THE CODEBASE TOUR
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Project: my-app
Type: TypeScript React + Express
Size: 156 files, ~25,000 lines

Let me give you a guided tour of the most important parts.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

STOP 1: PROJECT OVERVIEW

📁 Project Structure
├── src/
│   ├── client/          # React frontend
│   │   ├── components/  # Reusable UI components
│   │   ├── pages/       # Page-level components
│   │   ├── hooks/       # Custom React hooks
│   │   ├── services/    # API client services
│   │   └── store/       # Redux state management
│   │
│   ├── server/          # Express backend
│   │   ├── routes/      # API route handlers
│   │   ├── services/    # Business logic
│   │   ├── repositories/# Data access layer
│   │   └── middleware/  # Express middleware
│   │
│   └── shared/          # Shared types and utilities
│       ├── types/       # TypeScript interfaces
│       └── utils/       # Shared helpers
│
├── prisma/              # Database schema and migrations
├── tests/               # Test files
└── config/              # Configuration files

🏗️ Architecture: Clean Architecture
├── Presentation Layer: React components + Express routes
├── Application Layer: Services (business logic)
├── Domain Layer: Types and entities
└── Infrastructure Layer: Repositories, external APIs

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

STOP 2: ENTRY POINTS

How does the app start?

FRONTEND (src/client/index.tsx):
```tsx
// React app entry point
import { createRoot } from 'react-dom/client';
import { Provider } from 'react-redux';
import { store } from './store';
import App from './App';

createRoot(document.getElementById('root')!).render(
  <Provider store={store}>
    <App />
  </Provider>
);
```

BACKEND (src/server/index.ts):
```typescript
// Express server entry point
import express from 'express';
import { configureRoutes } from './routes';
import { configureMiddleware } from './middleware';

const app = express();
configureMiddleware(app);
configureRoutes(app);

app.listen(3000, () => {
  console.log('Server running on port 3000');
});
```

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

STOP 3: KEY PATTERNS

PATTERN 1: Repository Pattern
Location: src/server/repositories/

All database access goes through repositories:
```typescript
// UserRepository.ts
export class UserRepository {
  async findById(id: string): Promise<User | null> {
    return prisma.user.findUnique({ where: { id } });
  }

  async create(data: CreateUserData): Promise<User> {
    return prisma.user.create({ data });
  }
}
```

Why? Separates data access from business logic.

PATTERN 2: Service Layer
Location: src/server/services/

Business logic lives in services:
```typescript
// UserService.ts
export class UserService {
  constructor(private userRepo: UserRepository) {}

  async createUser(data: CreateUserInput): Promise<User> {
    // Validation
    if (await this.userRepo.findByEmail(data.email)) {
      throw new EmailExistsError();
    }

    // Business logic
    const hashedPassword = await hash(data.password, 12);

    // Persistence through repository
    return this.userRepo.create({
      ...data,
      password: hashedPassword
    });
  }
}
```

PATTERN 3: Custom Hooks
Location: src/client/hooks/

Reusable logic extracted to hooks:
```tsx
// useUser.ts
export function useUser(userId: string) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    userService.getUser(userId)
      .then(setUser)
      .finally(() => setLoading(false));
  }, [userId]);

  return { user, loading };
}
```

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

STOP 4: DATA FLOW

Let's trace how data flows through the app:

User Registration Flow:

1. User fills form → RegisterPage.tsx
2. Form submits → userService.register()
3. API call → POST /api/users
4. Route handler → UserController.create()
5. Business logic → UserService.createUser()
6. Database → UserRepository.create()
7. Response flows back up
8. Redux updated → store.dispatch(setUser())
9. UI re-renders with new user

```
┌─────────────┐    ┌─────────────┐    ┌─────────────┐
│   React     │───▶│   Express   │───▶│  Database   │
│  Frontend   │◀───│   Backend   │◀───│  (Prisma)   │
└─────────────┘    └─────────────┘    └─────────────┘
      │                   │
      ▼                   ▼
┌─────────────┐    ┌─────────────┐
│   Redux     │    │  Services   │
│   Store     │    │   Layer     │
└─────────────┘    └─────────────┘
```

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

STOP 5: GOTCHAS & TRIBAL KNOWLEDGE

Things you should know:

⚠️ Environment Variables
  → DATABASE_URL must be set before running
  → STRIPE_KEY needed for payments (even in test)
  → Use .env.example as template

⚠️ Database
  → Run `npx prisma migrate dev` after pulling
  → Seed data: `npm run db:seed`
  → Reset: `npm run db:reset`

⚠️ Testing
  → Tests need running database
  → Use `npm run test:db` to run with test DB
  → Factories in tests/factories/

⚠️ Code Style
  → Imports: External → Internal → Relative
  → Components: PascalCase files
  → Hooks: use* prefix
  → Services: *Service suffix

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

NEXT STEPS

Explore more:
→ /siftcoder:learn journey "user registration"
→ /siftcoder:learn explain src/server/services/auth.ts
→ /siftcoder:learn history src/server/middleware/auth.ts

Start contributing:
→ /siftcoder:investigate "good first issue"
→ /siftcoder:understand --deep

Questions?
→ Ask me anything about the codebase!
```

---

## Subcommand: onboard

### Onboarding Documentation Generation

```
/siftcoder:learn onboard
```

```
GENERATING ONBOARDING DOCUMENTATION
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Analyzing codebase for onboarding content...

OUTPUT: docs/ONBOARDING.md

# Developer Onboarding Guide

## Welcome to my-app! 👋

This guide will help you get up and running quickly.

## Quick Start

### Prerequisites
- Node.js 18+
- PostgreSQL 14+
- Redis (for sessions)

### Setup

1. Clone and install:
   ```bash
   git clone https://github.com/org/my-app
   cd my-app
   npm install
   ```

2. Configure environment:
   ```bash
   cp .env.example .env
   # Edit .env with your local settings
   ```

3. Set up database:
   ```bash
   npm run db:setup
   # Creates database, runs migrations, seeds data
   ```

4. Start development:
   ```bash
   npm run dev
   # Frontend: http://localhost:3000
   # Backend: http://localhost:3001
   ```

## Architecture Overview

[Diagram from codebase tour]

### Frontend (React + TypeScript)
- **Pages**: Route-level components in `src/client/pages/`
- **Components**: Reusable UI in `src/client/components/`
- **State**: Redux store in `src/client/store/`
- **API**: Service layer in `src/client/services/`

### Backend (Express + TypeScript)
- **Routes**: API endpoints in `src/server/routes/`
- **Services**: Business logic in `src/server/services/`
- **Data**: Repositories in `src/server/repositories/`
- **Database**: Prisma ORM with PostgreSQL

## Key Concepts

### Authentication
[Auto-generated explanation of auth flow]

### Data Flow
[Auto-generated data flow documentation]

### Common Tasks

#### Adding a new API endpoint
1. Create route in `src/server/routes/`
2. Create service method in `src/server/services/`
3. Create repository method if needed
4. Add types to `src/shared/types/`

#### Adding a new page
1. Create component in `src/client/pages/`
2. Add route in `src/client/App.tsx`
3. Create hooks if needed
4. Add to navigation if applicable

## Testing

```bash
npm test              # Run all tests
npm run test:unit     # Unit tests only
npm run test:e2e      # End-to-end tests
npm run test:watch    # Watch mode
```

## Common Issues

### "Database connection refused"
→ Ensure PostgreSQL is running
→ Check DATABASE_URL in .env

### "Module not found"
→ Run `npm install`
→ Check for TypeScript errors

### "Tests failing on fresh clone"
→ Run `npm run db:setup:test`
→ Ensure test database exists

## Who to Ask

| Area | Expert |
|------|--------|
| Frontend | @alice |
| Backend | @bob |
| Database | @carol |
| DevOps | @dave |

## Resources

- [Architecture Decision Records](./docs/adr/)
- [API Documentation](./docs/api/)
- [Contributing Guide](./CONTRIBUTING.md)

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

GENERATED FILES:
├── docs/ONBOARDING.md
├── docs/ARCHITECTURE.md
├── docs/SETUP.md
└── docs/TROUBLESHOOTING.md
```

---

## Subcommand: explain

### Deep Code Explanation

```
/siftcoder:learn explain src/server/services/auth.ts
```

```
DEEP EXPLANATION: AuthService
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

File: src/server/services/auth.ts
Lines: 145
Purpose: Handles all authentication logic

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

OVERVIEW

This service is responsible for:
├── User login and logout
├── JWT token generation and validation
├── Password hashing and verification
├── Session management
└── OAuth integration (Google, GitHub)

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

LINE-BY-LINE EXPLANATION

Lines 1-15: Imports and Dependencies
```typescript
import { hash, compare } from 'bcrypt';
import jwt from 'jsonwebtoken';
// bcrypt: Industry-standard password hashing
// jwt: JSON Web Token for stateless auth

import { UserRepository } from '../repositories/user';
// Data access is separated from business logic
```

Lines 17-25: Service Class Definition
```typescript
export class AuthService {
  constructor(
    private userRepo: UserRepository,
    private config: AuthConfig
  ) {}
  // Dependency injection allows for:
  // - Easy testing (mock the repo)
  // - Flexibility (swap implementations)
```

Lines 27-55: Login Method
```typescript
async login(email: string, password: string): Promise<AuthResult> {
  // 1. Find user by email
  const user = await this.userRepo.findByEmail(email);
  if (!user) {
    // Security: Don't reveal if email exists
    // Always same error for invalid email OR password
    throw new InvalidCredentialsError();
  }

  // 2. Verify password
  const valid = await compare(password, user.password);
  // compare() is timing-safe to prevent timing attacks
  if (!valid) {
    throw new InvalidCredentialsError();
  }

  // 3. Generate tokens
  const accessToken = this.generateAccessToken(user);
  const refreshToken = this.generateRefreshToken(user);

  // 4. Store refresh token for invalidation
  await this.userRepo.updateRefreshToken(user.id, refreshToken);

  return { user, accessToken, refreshToken };
}
```

WHY THIS MATTERS:
- Timing-safe comparison prevents attackers from measuring response time
- Same error message prevents email enumeration attacks
- Refresh tokens allow revoking access without short token lifetimes

Lines 57-78: Token Generation
```typescript
private generateAccessToken(user: User): string {
  return jwt.sign(
    {
      userId: user.id,
      email: user.email,
      role: user.role
    },
    this.config.jwtSecret,
    { expiresIn: '15m' }  // Short-lived for security
  );
}

private generateRefreshToken(user: User): string {
  return jwt.sign(
    { userId: user.id },
    this.config.refreshSecret,
    { expiresIn: '7d' }  // Longer-lived, stored in DB
  );
}
```

WHY TWO TOKENS?
- Access token: Short-lived (15 min), used for API calls
- Refresh token: Long-lived (7 days), used to get new access token
- If access token stolen: Limited damage (expires quickly)
- If refresh token stolen: Can be revoked by clearing DB

[... continues for all significant sections ...]

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

RELATED FILES

This service connects to:
├── src/server/routes/auth.ts - API endpoints
├── src/server/middleware/auth.ts - Token validation
├── src/server/repositories/user.ts - Data access
└── src/client/services/auth.ts - Frontend client

TESTS

Located in: tests/services/auth.test.ts
Coverage: 92%

Key test cases:
├── Login with valid credentials
├── Login with invalid email
├── Login with invalid password
├── Token generation and validation
├── Refresh token rotation
└── OAuth callback handling

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

QUESTIONS?

Ask me about:
→ "Why use refresh tokens?"
→ "How does OAuth work here?"
→ "What's timing-safe comparison?"
```

---

## Subcommand: journey

### Follow User Flow Through Code

```
/siftcoder:learn journey "checkout process"
```

```
USER JOURNEY: Checkout Process
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Following the code path when a user checks out...

STEP 1: User Clicks "Checkout"
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

File: src/client/components/Cart/CheckoutButton.tsx:12

```tsx
const CheckoutButton = () => {
  const dispatch = useDispatch();
  const cart = useSelector(selectCart);

  const handleCheckout = async () => {
    dispatch(setCheckoutLoading(true));  // Show loading state
    try {
      const result = await checkoutService.initiate(cart.id);
      // Navigate to checkout page with session
      router.push(`/checkout/${result.sessionId}`);
    } catch (error) {
      dispatch(setCheckoutError(error.message));
    }
  };

  return <Button onClick={handleCheckout}>Checkout</Button>;
};
```

USER SEES: Loading spinner, then redirect to checkout page

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

STEP 2: API Call to Initiate Checkout
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

File: src/client/services/checkout.ts:15

```typescript
export const checkoutService = {
  async initiate(cartId: string): Promise<CheckoutSession> {
    const response = await api.post('/checkout/initiate', { cartId });
    return response.data;
  }
};
```

→ HTTP POST to /api/checkout/initiate

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

STEP 3: Server Route Handler
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

File: src/server/routes/checkout.ts:23

```typescript
router.post('/initiate',
  authenticate,        // Verify user is logged in
  validateBody(initiateSchema),  // Validate request
  async (req, res) => {
    const session = await checkoutService.initiate(
      req.body.cartId,
      req.user.id
    );
    res.json(session);
  }
);
```

MIDDLEWARE CHAIN:
1. authenticate - Checks JWT, attaches user to request
2. validateBody - Ensures cartId is present and valid
3. Handler - Calls service layer

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

STEP 4: Checkout Service (Business Logic)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

File: src/server/services/checkout.ts:34

```typescript
async initiate(cartId: string, userId: string): Promise<CheckoutSession> {
  // 1. Load and validate cart
  const cart = await this.cartRepo.findById(cartId);
  if (!cart || cart.userId !== userId) {
    throw new CartNotFoundError();
  }
  if (cart.items.length === 0) {
    throw new EmptyCartError();
  }

  // 2. Check inventory for all items
  for (const item of cart.items) {
    const product = await this.productRepo.findById(item.productId);
    if (product.inventory < item.quantity) {
      throw new InsufficientInventoryError(product.name);
    }
  }

  // 3. Calculate totals
  const totals = this.calculateTotals(cart);

  // 4. Create checkout session
  const session = await this.sessionRepo.create({
    cartId,
    userId,
    totals,
    status: 'pending',
    expiresAt: new Date(Date.now() + 30 * 60 * 1000) // 30 min
  });

  return session;
}
```

CRITICAL BUSINESS RULES:
├── User can only checkout their own cart
├── Cart must have items
├── All items must be in stock
├── Session expires in 30 minutes

[... journey continues through payment, order creation, etc. ...]

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

JOURNEY COMPLETE

Files touched: 12
Services involved: 5
Database tables: 4

Flow diagram:
```
User Click → Frontend Service → API Route → Checkout Service
    ↓              ↓              ↓              ↓
  Button     HTTP Request    Middleware    Business Logic
    ↓              ↓              ↓              ↓
  Redux      Response ←    JSON Response  ← Repository
```

Questions about any step?
```

---

## Tips & Hints

```
LEARNING A NEW CODEBASE

Start here:
  → README.md - Project overview
  → package.json - Dependencies tell you a lot
  → Entry points - Follow the code from start

Exploration strategies:
  → Top-down: Start with entry points, drill down
  → Bottom-up: Find database schemas, trace up
  → Feature-focused: Pick one feature, trace through

Questions to ask:
  → How does data flow through the app?
  → Where does business logic live?
  → How is authentication handled?
  → Where do external services integrate?

Red flags to note:
  → Files with no tests
  → Functions over 100 lines
  → Lots of TODO comments
  → Commented-out code

TEACHING OTHERS

Good explanations:
  → Start with "why" before "how"
  → Use analogies
  → Show, don't just tell
  → Build up from simple to complex

Documentation tips:
  → Write for someone who knows nothing
  → Include "gotchas" and tribal knowledge
  → Keep it updated (or remove it)
  → Link to related docs
```

---

## Skills Used
- **codebase-analyzer** - Structure detection
- **pattern-detector** - Pattern recognition
- **doc-generator** - Documentation generation

## Allowed Tools
Read, Grep, Glob, Bash, Task, Write, AskUserQuestion
