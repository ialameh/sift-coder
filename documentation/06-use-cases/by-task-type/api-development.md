# Use Case: API Development

**Designing, building, and documenting APIs**

---

## Overview

API development requires careful design, documentation, testing, and validation. SiftCoder provides comprehensive tools for the entire API lifecycle.

---

## API Development Workflow

### Step 1: Design API

```bash
# 1. Create OpenAPI specification
cat > openapi.yaml << 'EOF'
openapi: 3.0.0
info:
  title: User API
  version: 1.0.0
paths:
  /users:
    get:
      summary: List users
      responses:
        '200':
          description: Success
EOF

# 2. Validate specification
/siftcoder:api validate openapi.yaml

# 3. Improve spec
/siftcoder:improve-spec openapi.yaml
```

### Step 2: Generate API Code

```bash
# 4. Generate API implementation
/siftcoder:add-feature "Implement User API from OpenAPI spec"

# SiftCoder creates:
# - Routes
# - Controllers
# - Validation
# - Error handling
# - Documentation
```

### Step 3: Generate Tests

```bash
# 5. Generate API tests
/siftcoder:test generate src/api/users.ts

# 6. Run tests
npm test
```

### Step 4: Generate Documentation

```bash
# 7. Generate API documentation
/siftcoder:document api

# Creates:
# - OpenAPI/Swagger docs
# - Usage examples
# - Response schemas
# - Error documentation
```

---

## API Commands

| Command | Purpose |
|---------|---------|
| `/api validate` | Validate OpenAPI specification |
| `/api document` | Generate API documentation |
| `/api breaking` | Check for breaking changes |
| `/api mock` | Generate mock server |
| `/api client` | Generate client SDK |

---

## API Design

### RESTful API

```bash
# 1. Design RESTful API
/siftcoder:add-feature "REST API for user management"

# 2. Validate best practices
/siftcoder:api validate

# Checks:
# ✓ Proper HTTP methods
# ✓ Resource naming
# ✓ Status codes
# ✓ Error handling
# ✓ Pagination
# ✓ Filtering
```

### GraphQL API

```bash
# 1. Design GraphQL schema
cat > schema.graphql << 'EOF'
type User {
  id: ID!
  name: String!
  email: String!
  posts: [Post!]!
}

type Query {
  user(id: ID!): User
  users: [User!]!
}
EOF

# 2. Generate implementation
/siftcoder:add-feature "GraphQL API from schema"

# 3. Generate resolvers
/siftcoder:test generate src/resolvers/
```

---

## API Documentation

### OpenAPI/Swagger

```bash
# 1. Generate OpenAPI docs
/siftcoder:document api

# Output:
# ✓ openapi.yaml created
# ✓ API documentation at /docs/api
# ✓ Interactive Swagger UI
```

### API Reference

```bash
# 2. Generate detailed reference
/siftcoder:document api --detailed

# Includes:
# - All endpoints
# - Request/response schemas
# - Authentication details
# - Rate limiting
# - Error codes
# - Examples
```

### Usage Examples

```bash
# 3. Generate examples
/siftcoder:document api --examples

# Creates:
# - cURL examples
# - JavaScript examples
# - Python examples
# - Postman collection
```

---

## API Testing

### Contract Testing

```bash
# 1. Validate against OpenAPI spec
/siftcoder:api validate

# 2. Test all endpoints
/siftcoder:test generate src/api/

# 3. Check response schemas
npm run test:contract
```

### Integration Testing

```bash
# 1. Generate integration tests
/siftcoder:test generate tests/api-integration/

# 2. Test with mock server
/siftcoder:api mock

# 3. Run integration tests
npm run test:integration
```

### Load Testing

```bash
# 1. Generate load tests
/siftcoder:test load

# 2. Test API performance
npm run test:load

# 3. Analyze results
[Identify bottlenecks]
```

---

## API Versioning

### URL Versioning

```bash
# 1. Add v2 API
/siftcoder:add-feature "API v2 with breaking changes"

# 2. Maintain both versions
/v1/users
/v2/users

# 3. Document version differences
/siftcoder:document api --versions
```

### Header Versioning

```bash
# 1. Implement header-based versioning
/siftcoder:add-feature "API versioning via Accept header"

# 2. Handle versions
Accept: application/vnd.api.v1+json
Accept: application/vnd.api.v2+json
```

---

## Breaking Changes

### Detect Breaking Changes

```bash
# 1. Compare API versions
/siftcoder:api breaking

# Output:
# ⚠️ BREAKING CHANGES DETECTED:
#
# 1. /users endpoint
#    - Removed: 'username' field
#    - Impact: High
#    - Fix: Add migration guide
#
# 2. /posts endpoint
#    - Changed: 'created_at' to 'createdAt'
#    - Impact: Medium
#    - Fix: Support both formats
```

### Migration Guide

```bash
# 2. Generate migration guide
/siftcoder:document api --migration-guide

# Creates guide for:
# - Breaking changes
# - Migration steps
# - Code examples
# - Deprecation timeline
```

---

## Mock Server

### Generate Mock Server

```bash
# 1. Create mock server from spec
/siftcoder:api mock

# Output:
# ✓ Mock server running on port 3001
# ✓ All endpoints mocked
# ✓ OpenAPI spec: http://localhost:3001/docs
```

### Use for Frontend Development

```bash
# 2. Frontend uses mock API
export API_URL=http://localhost:3001

# 3. Develop frontend independently
npm run dev:frontend

# 4. Switch to real API when ready
export API_URL=http://localhost:3000
```

---

## Client SDK Generation

### Generate Client

```bash
# 1. Generate JavaScript client
/siftcoder:api client --language javascript

# Output:
# ✓ client/ created
# ✓ UserApi, PostApi classes
# ✓ TypeScript types
# ✓ Documentation

# 2. Generate Python client
/siftcoder:api client --language python

# 3. Generate other languages
/siftcoder:api client --language java
/siftcoder:api client --language go
```

### Use Client SDK

```javascript
// 4. Use generated client
import { UserApi } from './client';

const api = new UserApi();
const users = await api.listUsers();
console.log(users);
```

---

## Security

### Authentication

```bash
# 1. Add authentication
/siftcoder:add-feature "JWT authentication for API"

# 2. Add authorization
/siftcoder:add-feature "Role-based access control"

# 3. Document security
/siftcoder:document api --security
```

### Rate Limiting

```bash
# 1. Add rate limiting
/siftcoder:add-feature "API rate limiting"

# 2. Configure limits
{
  "rateLimits": {
    "default": "100/hour",
    "authenticated": "1000/hour",
    "admin": "10000/hour"
  }
}

# 3. Document limits
/siftcoder:document api
```

---

## Example: Complete API Development

```bash
# Project: E-commerce API

# Step 1: Design
cat > openapi.yaml << 'EOF'
openapi: 3.0.0
info:
  title: E-commerce API
  version: 1.0.0
paths:
  /products:
    get:
      summary: List products
    post:
      summary: Create product
  /orders:
    get:
      summary: List orders
    post:
      summary: Create order
EOF

# Step 2: Validate
/siftcoder:api validate

# Step 3: Implement
/siftcoder:add-feature "Implement E-commerce API"

# Step 4: Generate tests
/siftcoder:test generate src/api/

# Step 5: Generate docs
/siftcoder:document api

# Step 6: Generate client
/siftcoder:api client --language javascript

# Step 7: Start mock server
/siftcoder:api mock

# Step 8: Frontend development
[Frontend uses mock API]

# Step 9: Deploy backend
npm run deploy

# Step 10: Update frontend to use real API
export API_URL=https://api.example.com
```

---

## Quick Reference

| Task | Command |
|------|---------|
| **Validate spec** | `/api validate` |
| **Generate docs** | `/document api` |
| **Check breaking** | `/api breaking` |
| **Mock server** | `/api mock` |
| **Generate client** | `/api client` |

---

## Best Practices

### ✅ DO

- Design API before coding
- Use OpenAPI/Swagger specification
- Document all endpoints
- Version your API
- Use proper HTTP methods
- Return appropriate status codes
- Handle errors consistently
- Implement rate limiting
- Secure with authentication
- Test thoroughly

### ❌ DON'T

- Skip documentation
- Change API without versioning
- Return inconsistent responses
- Ignore error handling
- Forget rate limiting
- Expose sensitive data
- Use GET for mutations
- Return 200 for errors
- Ignore backward compatibility
- Skip security

---

## See Also

- [Workflow: Build New Project](../../05-workflows/build-new-project.md)
- [Use Case: Full-Stack Developer](../by-developer-type/full-stack-developer.md)
- [Command: API](../../02-command-reference/by-category/api-workflow.md)
