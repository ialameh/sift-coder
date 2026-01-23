# Use Case: Full-Stack Developer

**End-to-end development workflows**

---

## Overview

Full-stack developers work across frontend, backend, API, and database layers. SiftCoder provides workflows for the entire development lifecycle.

---

## Common Full-Stack Workflows

### Workflow 1: Full Feature Development

```bash
# 1. Add feature to existing project
/siftcoder:add-feature "User authentication with JWT"

# SiftCoder will:
# - Understand existing patterns
# - Plan implementation
# - Create frontend components
# - Create backend API
# - Update database schema
# - Run quality gates
# - Generate tests

# 2. Document the architecture
/siftcoder:document architecture

# 3. Generate API documentation
/siftcoder:document api
```

### Workflow 2: API Development

```bash
# 1. Design API
/siftcoder:api validate "OpenAPI spec"

# 2. Generate mock server
/siftcoder:api mock

# 3. Generate client SDK
/siftcoder:api client

# 4. Document API
/siftcoder:document api
```

### Workflow 3: Database Schema Changes

```bash
# 1. Plan migration
/siftcoder:schema-migrate plan

# 2. Review migration
/siftcoder:preview

# 3. Deploy migration
/siftcoder:schema-migrate deploy

# 4. Verify
/siftcoder:schema erd
```

---

## Frontend Workflows

### Component Development

```bash
# 1. Create component
/siftcoder:add-feature "UserProfile component"

# 2. Test component
npm test

# 3. Check coverage
/siftcoder:test coverage
```

### State Management

```bash
# 1. Understand current state management
/siftcoder:understand

# 2. Add new state
/siftcoder:add-feature "Add Redux slice for user preferences"

# 3. Validate
npm run type-check
```

---

## Backend Workflows

### API Endpoint Development

```bash
# 1. Add endpoint
/siftcoder:add-feature "POST /api/users endpoint"

# 2. Validate API spec
/siftcoder:api validate

# 3. Generate tests
/siftcoder:test generate src/routes/users.ts

# 4. Run tests
npm test
```

### Database Operations

```bash
# 1. Create migration
/siftcoder:add-feature "Add users table"

# 2. Review migration
/siftcoder:preview

# 3. Deploy
npm run migrate
```

---

## Integration Workflows

### Frontend + Backend Integration

```bash
# 1. Build API first
/siftcoder:add-feature "REST API for user management"

# 2. Document API
/siftcoder:document api

# 3. Generate client
/siftcoder:api client

# 4. Integrate frontend
/siftcoder:add-feature "User management UI"

# 5. Test integration
/siftcoder:test generate
```

### Third-Party Integration

```bash
# 1. Analyze integration point
/siftcoder:investigate "Integrate payment provider"

# 2. Add integration
/siftcoder:add-feature "Stripe payment integration"

# 3. Test integration
/siftcoder:test generate src/integrations/stripe/
```

---

## Testing Strategies

### Frontend Testing

```bash
# 1. Generate component tests
/siftcoder:test generate src/components/

# 2. Check coverage
/siftcoder:test coverage

# 3. Find untested code
/siftcoder:test coverage --uncovered
```

### Backend Testing

```bash
# 1. Generate API tests
/siftcoder:test generate src/api/

# 2. Test with mock data
/siftcoder:test generate --mock

# 3. Load testing
/siftcoder:test load
```

### Integration Testing

```bash
# 1. Generate integration tests
/siftcoder:test generate tests/integration/

# 2. Test API contracts
/siftcoder:api validate

# 3. Test database
npm run test:integration
```

---

## Debugging Full-Stack Issues

### Frontend Bug

```bash
# 1. Investigate (read-only)
/siftcoder:investigate "Button not responding to clicks"

# 2. Fix with boundaries
/siftcoder:fix "Button click handler"

# 3. Verify
npm test
```

### Backend Bug

```bash
# 1. Investigate
/siftcoder:investigate "API returns 500 on user creation"

# 2. Check error logs
/siftcoder:debug error <stack-trace>

# 3. Fix
/siftcoder:fix "User creation endpoint"

# 4. Validate
npm test
```

### Integration Bug

```bash
# 1. Check API contract
/siftcoder:api validate

# 2. Investigate integration
/siftcoder:investigate "Frontend not parsing API response"

# 3. Fix
/siftcoder:fix "API response parsing"

# 4. Verify
npm run test:e2e
```

---

## Performance Optimization

### Frontend Performance

```bash
# 1. Analyze bundle
npm run build -- --analyze

# 2. Optimize
/siftcoder:optimize "Reduce bundle size"

# 3. Verify
npm run build
```

### Backend Performance

```bash
# 1. Profile
npm run profile

# 2. Optimize queries
/siftcoder:optimize "Database query performance"

# 3. Add caching
/siftcoder:add-feature "Redis caching layer"
```

---

## Documentation for Full-Stack Projects

```bash
# 1. Architecture documentation
/siftcoder:document architecture

# 2. API documentation
/siftcoder:document api

# 3. User guide
/siftcoder:document user-manual

# 4. Technical docs
/siftcoder:document technical
```

---

## Example: Complete Feature Workflow

```bash
# Feature: Add comment system

# 1. Plan the feature
/siftcoder:add-feature "Comment system for blog posts"

# Output:
# ✓ Frontend: CommentList, CommentForm components
# ✓ Backend: GET/POST /api/posts/:id/comments
# ✓ Database: comments table
# ✓ Tests: Component, API, integration tests

# 2. Review architecture
/siftcoder:document architecture

# 3. Run all tests
npm test

# 4. Check coverage
/siftcoder:test coverage

# 5. Security scan
/siftcoder:security scan

# 6. Deploy
npm run deploy
```

---

## Quick Reference

| Task | Command |
|------|---------|
| **Add feature** | `/add-feature "description"` |
| **Fix bug** | `/investigate` → `/fix` |
| **Test** | `/test generate` |
| **Document** | `/document architecture` |
| **API** | `/api validate` |
| **Debug** | `/investigate "issue"` |

---

## See Also

- [Workflow: Build New Project](../../05-workflows/build-new-project.md)
- [Workflow: Add Feature](../../05-workflows/add-feature.md)
- [Use Case: API Development](../by-task-type/api-development.md)
