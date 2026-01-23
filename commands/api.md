# /siftcoder:api - API Development Suite

Generate, validate, and manage API documentation and tooling.

## Usage

```
/siftcoder:api [subcommand] [target]
```

## Subcommands

| Subcommand | Description |
|------------|-------------|
| `document` | Generate OpenAPI spec from code (default) |
| `validate` | Validate implementation against spec |
| `breaking` | Detect breaking changes |
| `mock` | Generate mock server |
| `client` | Generate client SDK |
| `test` | Generate API tests |

## Arguments
- `$ARGUMENTS` - Subcommand and target path/spec file

## Instructions

You are an API design expert. Generate accurate documentation, catch breaking changes, and help maintain API quality.

---

## Phase 0: Interactive Setup

**Use AskUserQuestion tool:**
```
Question: "What would you like to do with your API?"
Header: "Action"
Options:
- "Generate Documentation (Recommended)" - "Create OpenAPI spec from code"
- "Validate Against Spec" - "Check if code matches documentation"
- "Detect Breaking Changes" - "Compare versions for compatibility"
- "Generate Mock Server" - "Create mock for frontend development"
```

---

## Subcommand: document

### Phase 1: API Discovery

```
DISCOVERING API ENDPOINTS...

Framework detected: Express.js
Route files found: 8
```

```
API DISCOVERY RESULTS

Routes found: 34

By method:
├── GET: 15
├── POST: 12
├── PUT: 4
├── PATCH: 2
└── DELETE: 1

By resource:
├── /api/users: 6 endpoints
├── /api/products: 8 endpoints
├── /api/orders: 7 endpoints
├── /api/auth: 5 endpoints
└── /api/payments: 8 endpoints
```

### Phase 2: Schema Extraction

```
EXTRACTING SCHEMAS...

Analyzing:
├── Request bodies (from validation schemas, TypeScript types)
├── Response shapes (from return types, actual responses)
├── Path parameters
├── Query parameters
└── Headers
```

### Phase 3: OpenAPI Generation

```
GENERATING OPENAPI SPECIFICATION...
```

```yaml
# Generated: .claude/siftcoder-state/api/openapi.yaml

openapi: 3.0.3
info:
  title: MyApp API
  description: Auto-generated API documentation
  version: 1.0.0
  contact:
    email: api@myapp.com

servers:
  - url: http://localhost:3000/api
    description: Development
  - url: https://api.myapp.com
    description: Production

tags:
  - name: Users
    description: User management operations
  - name: Products
    description: Product catalog operations
  - name: Orders
    description: Order processing
  - name: Auth
    description: Authentication and authorization
  - name: Payments
    description: Payment processing

paths:
  /users:
    get:
      summary: List all users
      description: Returns a paginated list of users
      tags: [Users]
      parameters:
        - name: page
          in: query
          schema:
            type: integer
            default: 1
        - name: limit
          in: query
          schema:
            type: integer
            default: 20
            maximum: 100
      responses:
        '200':
          description: Successful response
          content:
            application/json:
              schema:
                type: object
                properties:
                  data:
                    type: array
                    items:
                      $ref: '#/components/schemas/User'
                  pagination:
                    $ref: '#/components/schemas/Pagination'
        '401':
          $ref: '#/components/responses/Unauthorized'

    post:
      summary: Create a new user
      tags: [Users]
      requestBody:
        required: true
        content:
          application/json:
            schema:
              $ref: '#/components/schemas/CreateUserRequest'
      responses:
        '201':
          description: User created
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/User'
        '400':
          $ref: '#/components/responses/BadRequest'
        '409':
          description: Email already exists

  /users/{id}:
    get:
      summary: Get user by ID
      tags: [Users]
      parameters:
        - name: id
          in: path
          required: true
          schema:
            type: string
            format: uuid
      responses:
        '200':
          description: Successful response
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/User'
        '404':
          $ref: '#/components/responses/NotFound'

  # ... more endpoints ...

components:
  schemas:
    User:
      type: object
      required: [id, email, name, createdAt]
      properties:
        id:
          type: string
          format: uuid
          example: "123e4567-e89b-12d3-a456-426614174000"
        email:
          type: string
          format: email
          example: "user@example.com"
        name:
          type: string
          example: "John Doe"
        role:
          type: string
          enum: [user, admin, moderator]
          default: user
        createdAt:
          type: string
          format: date-time
        updatedAt:
          type: string
          format: date-time

    CreateUserRequest:
      type: object
      required: [email, name, password]
      properties:
        email:
          type: string
          format: email
        name:
          type: string
          minLength: 2
          maxLength: 100
        password:
          type: string
          format: password
          minLength: 8

    Pagination:
      type: object
      properties:
        page:
          type: integer
        limit:
          type: integer
        total:
          type: integer
        totalPages:
          type: integer

  responses:
    BadRequest:
      description: Invalid request
      content:
        application/json:
          schema:
            $ref: '#/components/schemas/Error'
    Unauthorized:
      description: Authentication required
    NotFound:
      description: Resource not found
    Error:
      type: object
      properties:
        error:
          type: string
        message:
          type: string
        details:
          type: array
          items:
            type: object

  securitySchemes:
    BearerAuth:
      type: http
      scheme: bearer
      bearerFormat: JWT

security:
  - BearerAuth: []
```

```
OPENAPI SPECIFICATION GENERATED

Output: .claude/siftcoder-state/api/openapi.yaml

Summary:
├── Endpoints: 34
├── Schemas: 15
├── Security: JWT Bearer
└── Format: OpenAPI 3.0.3

Preview with Swagger UI:
→ npx @redocly/cli preview-docs openapi.yaml

Validate spec:
→ npx @redocly/cli lint openapi.yaml

WARNINGS:

⚠ 3 endpoints missing descriptions
  ├── POST /api/orders
  ├── PUT /api/users/{id}
  └── DELETE /api/products/{id}

⚠ 2 schemas with 'any' type detected
  ├── Order.metadata
  └── Product.attributes

Consider adding more specific types.
```

---

## Subcommand: validate

### Spec vs Implementation Validation

```
/siftcoder:api validate openapi.yaml
```

```
VALIDATING API AGAINST SPECIFICATION
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Spec: openapi.yaml
Endpoints in spec: 34
Endpoints in code: 36

VALIDATION RESULTS:

MISSING FROM CODE (spec defines, code doesn't implement):

❌ GET /api/users/{id}/preferences
   Defined in spec but no route handler found
   Expected: src/api/routes/users.ts

❌ POST /api/orders/{id}/refund
   Defined in spec but no route handler found
   Expected: src/api/routes/orders.ts

EXTRA IN CODE (code implements, spec doesn't document):

⚠ GET /api/health
   Found in: src/api/routes/health.ts
   Action: Add to spec or remove

⚠ POST /api/internal/sync
   Found in: src/api/routes/internal.ts
   Action: Add to spec or mark as internal

SCHEMA MISMATCHES:

❌ POST /api/users - Request body mismatch
   Spec expects: { email, name, password }
   Code accepts: { email, name, password, phone } ← phone not in spec

   Location: src/api/routes/users.ts:23
   Fix: Add 'phone' to spec or remove from validation

❌ GET /api/products/{id} - Response mismatch
   Spec: { id, name, price, description }
   Actual: { id, name, price, description, inventory } ← inventory extra

   Location: src/api/routes/products.ts:45
   Fix: Add 'inventory' to spec schema

PARAMETER MISMATCHES:

⚠ GET /api/orders - Query parameter
   Spec: status (enum: pending, processing, shipped, delivered)
   Code: status (enum: pending, processing, shipped, delivered, cancelled)
   Missing from spec: 'cancelled'

STATUS CODE MISMATCHES:

⚠ POST /api/auth/login
   Spec defines: 200, 400, 401
   Code returns: 200, 400, 401, 429 ← 429 not documented

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

VALIDATION SUMMARY

✓ Matching: 28 endpoints
❌ Missing from code: 2
⚠ Extra in code: 2
❌ Schema mismatches: 2
⚠ Parameter mismatches: 1
⚠ Status code mismatches: 1

COMPLIANCE: 82%

RECOMMENDED ACTIONS:

1. Implement missing endpoints or remove from spec
2. Update spec to include 'phone' field
3. Document 'inventory' in product response
4. Add 'cancelled' to order status enum
5. Document 429 rate limit response
```

---

## Subcommand: breaking

### Breaking Change Detection

```
/siftcoder:api breaking v1.0.0 v2.0.0
```

```
DETECTING BREAKING CHANGES
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Comparing: v1.0.0 → v2.0.0

BREAKING CHANGES FOUND: 4

1. ❌ REMOVED ENDPOINT
   - DELETE /api/users/{id}/avatar
   Impact: Clients using this endpoint will get 404
   Migration: Use PUT /api/users/{id} with avatar: null

2. ❌ REQUIRED FIELD ADDED
   - POST /api/orders now requires 'shippingAddress'
   Before: { items, paymentMethod }
   After: { items, paymentMethod, shippingAddress }  ← NEW REQUIRED
   Impact: Existing clients will get 400 Bad Request
   Migration: Add shippingAddress to all order creation requests

3. ❌ RESPONSE FIELD REMOVED
   - GET /api/users/{id} no longer returns 'legacyId'
   Impact: Clients depending on legacyId will break
   Migration: Use 'id' field instead

4. ❌ ENUM VALUE REMOVED
   - User.role no longer accepts 'guest'
   Before: enum [user, admin, moderator, guest]
   After: enum [user, admin, moderator]
   Impact: Existing guests will fail validation
   Migration: Convert 'guest' users to 'user' role

NON-BREAKING CHANGES: 12

✓ New endpoint: GET /api/products/featured
✓ New optional field: User.preferences
✓ New enum value: Order.status.cancelled
✓ Deprecated: GET /api/legacy/users (still works)
... and 8 more

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

MIGRATION GUIDE GENERATED

# Migration Guide: v1.0.0 → v2.0.0

## Breaking Changes

### 1. Avatar Deletion Endpoint Removed
The dedicated avatar deletion endpoint has been removed.

**Before:**
```javascript
await api.delete(`/users/${userId}/avatar`);
```

**After:**
```javascript
await api.put(`/users/${userId}`, { avatar: null });
```

### 2. Shipping Address Required for Orders
...

Saved: .claude/siftcoder-state/api/migration-guide-v2.md
```

---

## Subcommand: mock

### Mock Server Generation

```
/siftcoder:api mock openapi.yaml
```

```
GENERATING MOCK SERVER
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Reading spec: openapi.yaml
Endpoints: 34
Schemas: 15

MOCK SERVER GENERATED

Output: .claude/siftcoder-state/api/mock-server/

Files created:
├── server.js           # Express mock server
├── routes/
│   ├── users.js        # User endpoints
│   ├── products.js     # Product endpoints
│   ├── orders.js       # Order endpoints
│   └── auth.js         # Auth endpoints
├── data/
│   ├── users.json      # Sample users
│   ├── products.json   # Sample products
│   └── orders.json     # Sample orders
├── middleware/
│   ├── auth.js         # Mock auth
│   └── delay.js        # Simulate latency
└── package.json

FEATURES:
├── Realistic fake data (using Faker.js)
├── Stateful (in-memory database)
├── Configurable delays
├── Error simulation
├── JWT auth mock

START MOCK SERVER:

$ cd .claude/siftcoder-state/api/mock-server
$ npm install
$ npm start

Server running at http://localhost:3001

CONFIGURATION:

// config.json
{
  "port": 3001,
  "delay": { "min": 100, "max": 500 },
  "errorRate": 0.05,  // 5% random errors
  "auth": {
    "enabled": true,
    "token": "mock-jwt-token"
  }
}

EXAMPLE USAGE:

# Get users (with mock JWT)
curl http://localhost:3001/api/users \
  -H "Authorization: Bearer mock-jwt-token"

# Create order
curl -X POST http://localhost:3001/api/orders \
  -H "Content-Type: application/json" \
  -d '{"items": [{"productId": "1", "quantity": 2}]}'

# Simulate error
curl http://localhost:3001/api/users?__error=500
```

---

## Subcommand: client

### Client SDK Generation

```
/siftcoder:api client openapi.yaml --language typescript
```

```
GENERATING CLIENT SDK
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Spec: openapi.yaml
Language: TypeScript
Style: Fetch-based with types

OUTPUT:

.claude/siftcoder-state/api/client/
├── index.ts            # Main export
├── client.ts           # API client class
├── types.ts            # TypeScript interfaces
├── endpoints/
│   ├── users.ts
│   ├── products.ts
│   ├── orders.ts
│   └── auth.ts
└── package.json

GENERATED CLIENT USAGE:

```typescript
import { ApiClient } from './client';

const api = new ApiClient({
  baseUrl: 'https://api.myapp.com',
  token: 'your-jwt-token'
});

// Fully typed methods
const users = await api.users.list({ page: 1, limit: 20 });
// users is typed as { data: User[], pagination: Pagination }

const user = await api.users.get('user-id');
// user is typed as User

const newUser = await api.users.create({
  email: 'new@example.com',
  name: 'New User',
  password: 'securepass123'
});
// Input is validated by TypeScript

// Error handling
try {
  await api.orders.create(orderData);
} catch (error) {
  if (error instanceof ApiError) {
    console.log(error.status); // 400
    console.log(error.message); // "Validation failed"
    console.log(error.details); // [{ field: 'email', message: '...' }]
  }
}
```

TYPES GENERATED:

```typescript
// types.ts
export interface User {
  id: string;
  email: string;
  name: string;
  role: 'user' | 'admin' | 'moderator';
  createdAt: string;
  updatedAt: string;
}

export interface CreateUserRequest {
  email: string;
  name: string;
  password: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}
// ... more types
```

INSTALL:

$ npm install ./client
# or copy to your project
```

---

## Tips & Hints

```
API DOCUMENTATION BEST PRACTICES

Good documentation includes:
  → Clear descriptions for each endpoint
  → Example requests and responses
  → Error codes and their meanings
  → Authentication requirements
  → Rate limiting information

OpenAPI tips:
  → Use $ref for reusable schemas
  → Include examples in schemas
  → Document all possible status codes
  → Use tags to organize endpoints

BREAKING CHANGE RULES

These are BREAKING:
  → Removing an endpoint
  → Adding required field
  → Removing response field
  → Changing field type
  → Removing enum value
  → Changing URL path

These are NOT breaking:
  → Adding new endpoint
  → Adding optional field
  → Adding enum value
  → Adding new response fields
  → Deprecating (but keeping) endpoints

VERSIONING STRATEGIES

URL versioning: /api/v1/users, /api/v2/users
  → Clear, explicit
  → Multiple versions can coexist

Header versioning: Accept: application/vnd.api+json;version=1
  → Cleaner URLs
  → More complex to implement

Query param: /api/users?version=1
  → Simple to implement
  → Can be confusing
```

---

## Skills Used
- **api-analyzer** - Endpoint discovery and extraction
- **schema-generator** - OpenAPI schema creation
- **breaking-change-detector** - Compatibility analysis

## Allowed Tools
Read, Write, Grep, Glob, Bash, Task, AskUserQuestion
