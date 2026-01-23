---
description: Bridge the gap between two codebases (e.g., website and admin panel) by analyzing, finding gaps, generating specs, and building integrations
argument-hint: <folder1-path> <folder2-path>
allowed-tools: Read, Write, Edit, Bash, Glob, Grep, Task
---

# siftcoder Bridge - Cross-Codebase Integration

Analyzing and bridging: **$ARGUMENTS**

## Overview

The bridge command analyzes two separate codebases (e.g., a website and an admin panel), identifies gaps between them, generates specifications for required integrations, and builds the bridge components.

## Use Cases

- **Website ↔ Admin Panel**: Connect frontend website to backend admin APIs
- **Service ↔ Service**: Bridge microservices or separate applications
- **Frontend ↔ Backend**: Connect UI to API services
- **Legacy ↔ Modern**: Bridge old and new systems

## Process

### Phase 1: Dual Codebase Analysis

Analyze both folders in parallel:

**For each folder:**
1. Detect project type (frontend, backend, full-stack, mobile)
2. Identify technology stack (frameworks, languages, build tools)
3. Map structure (components, services, APIs, models)
4. Extract API endpoints (REST, GraphQL, WebSocket)
5. Identify data models and types
6. Find authentication/authorization mechanisms
7. Note configuration files and environment variables

**Output:**
```json
{
  "folder1": {
    "type": "frontend",
    "tech": ["React", "TypeScript", "Vite"],
    "structure": {
      "components": "src/components/",
      "services": "src/services/",
      "apis": "src/api/"
    },
    "apis": [
      {
        "endpoint": "/api/users",
        "method": "GET",
        "file": "src/api/users.ts",
        "auth": "Bearer token"
      }
    ],
    "dataModels": ["User", "Product", "Order"],
    "auth": {
      "type": "JWT",
      "storage": "localStorage"
    }
  },
  "folder2": {
    "type": "backend",
    "tech": ["Node.js", "Express", "PostgreSQL"],
    "structure": {
      "routes": "src/routes/",
      "controllers": "src/controllers/",
      "models": "src/models/"
    },
    "apis": [
      {
        "endpoint": "/users",
        "method": "GET",
        "file": "src/routes/users.ts",
        "auth": "JWT required"
      }
    ],
    "dataModels": ["User", "Product", "Order"],
    "auth": {
      "type": "JWT",
      "secret": "env.JWT_SECRET"
    }
  }
}
```

### Phase 2: Gap Detection

Identify what's missing or broken between the two codebases:

**Gap Categories:**

1. **API Mismatches**
   - Frontend calls `/api/users` but backend serves `/users`
   - Different HTTP methods (GET vs POST)
   - Missing endpoints (frontend expects, backend doesn't have)

2. **Data Model Inconsistencies**
   - Different field names (firstName vs first_name)
   - Type mismatches (string vs number)
   - Missing fields in one codebase
   - Nested structure differences

3. **Authentication Gaps**
   - Different token formats
   - Missing auth headers
   - CORS issues
   - No shared auth mechanism

4. **Communication Protocol Gaps**
   - WebSocket vs REST
   - Missing real-time features
   - No error handling integration
   - Different response formats

**Output:**
```json
{
  "gaps": [
    {
      "id": "GAP-001",
      "type": "api_mismatch",
      "severity": "critical",
      "description": "Frontend expects /api/users but backend serves /users",
      "folder1": {
        "file": "src/api/users.ts",
        "line": 15,
        "code": "fetch('/api/users')"
      },
      "folder2": {
        "file": "src/routes/users.ts",
        "line": 8,
        "code": "app.get('/users', ...)"
      },
      "impact": "Cannot fetch user data",
      "suggestedFix": "Add route prefix /api or update frontend calls"
    },
    {
      "id": "GAP-002",
      "type": "data_model",
      "severity": "high",
      "description": "User model field name mismatch",
      "folder1": {
        "file": "src/types/user.ts",
        "fields": ["firstName", "lastName"]
      },
      "folder2": {
        "file": "src/models/User.ts",
        "fields": ["first_name", "last_name"]
      },
      "impact": "Data serialization errors",
      "suggestedFix": "Add mapping layer or standardize names"
    }
  ]
}
```

### Phase 3: Specification Generation

Generate specifications for bridge components:

**For each critical/high severity gap:**

1. **Create bridge spec**
2. **Define acceptance criteria**
3. **Identify dependencies**
4. **Prioritize implementation**

**Spec Structure:**
```markdown
## Bridge Feature: API Gateway Integration

### Problem
Frontend cannot communicate with backend due to URL path mismatch.

### Solution
Create API gateway/proxy layer that:
- Maps frontend paths to backend paths
- Handles CORS
- Standardizes response format
- Manages authentication flow

### Acceptance Criteria
- [ ] Frontend can call /api/* routes successfully
- [ ] CORS headers configured properly
- [ ] JWT authentication passes through
- [ ] Error responses normalized
- [ ] Rate limiting applied
- [ ] Logging implemented

### Implementation
- Create middleware for path rewriting
- Add CORS configuration
- Implement auth token validation
- Add error handler middleware
```

**Save to:** `.claude/bridge-spec.md`

### Phase 4: Bridge Building

Use siftcoder build workflow to implement:

1. **Invoke siftcoder-planner** to break down bridge spec into tasks
2. **Invoke siftcoder-coder** to implement each task
3. **Invoke siftcoder-qa-reviewer** to validate integrations
4. **Invoke siftcoder-qa-fixer** to address issues

**Special considerations for bridge building:**
- Test both codebases still work independently
- Integration tests verify cross-codebase communication
- No breaking changes to existing APIs
- Backward compatibility maintained

### Phase 5: Validation

Verify the bridge works:

1. **Unit Tests**: Test bridge components in isolation
2. **Integration Tests**: Test communication between codebases
3. **End-to-End Tests**: Test full user flows across both systems
4. **Regression Tests**: Ensure existing functionality unaffected

**Validation Checklist:**
- [ ] Folder 1 can make requests to Folder 2
- [ ] Data flows correctly between systems
- [ ] Authentication works end-to-end
- [ ] Error handling is graceful
- [ ] Both systems can run independently
- [ ] No breaking changes to existing APIs

## State Management

Bridge state saved to `.claude/siftcoder-state/bridge.json`:
```json
{
  "folder1": {
    "path": "/path/to/folder1",
    "type": "frontend",
    "analyzedAt": "2025-01-15T10:00:00Z"
  },
  "folder2": {
    "path": "/path/to/folder2",
    "type": "backend",
    "analyzedAt": "2025-01-15T10:00:00Z"
  },
  "gaps": {
    "critical": 2,
    "high": 5,
    "medium": 3,
    "low": 1
  },
  "generatedSpecs": ["api-gateway", "auth-bridge", "data-mapper"],
  "implementationStatus": "in_progress",
  "currentFeature": "api-gateway"
}
```

## Advanced Features

### Bidirectional Analysis
If both codebases have APIs:
- Detect circular dependencies
- Identify potential race conditions
- Suggest async communication patterns

### Multiple Bridge Points
If more than two connection points:
- Create bridge architecture diagram
- Suggest gateway vs point-to-point
- Plan for future scalability

### Conflict Resolution
When both codebases define same entities:
- Create source-of-truth mapping
- Implement sync strategies
- Design conflict resolution policies

## Tips & Hints

```
BEFORE BRIDGING

Prepare your codebases:
  → Ensure both run independently
  → Have tests for each codebase
  → Document existing APIs
  → Know your authentication flow

Choose the right bridge pattern:
  → API Gateway - Multiple frontend → single backend
  → Adapter Layer - Legacy ↔ Modern systems
  → Event Bus - Async communication
  → Shared Types - TypeScript monorepo approach

DURING ANALYSIS

Watch for:
  → Different data formats (camelCase vs snake_case)
  → Authentication mismatches (cookie vs token)
  → Protocol differences (REST vs GraphQL)
  → Time zone or timestamp inconsistencies

AFTER BUILDING

Verify:
  → End-to-end flows work
  → Error handling is graceful
  → Performance is acceptable
  → Security is maintained
  → Tests cover integration

COMMON BRIDGE PATTERNS

Frontend + Backend:
  → API adapter layer
  → Shared type definitions
  → Auth token proxy

Microservices:
  → API Gateway
  → Service mesh
  → Event-driven bus

Legacy + Modern:
  → Strangler Fig pattern
  → Anti-corruption layer
  → Database sync
```

## Integration with Other Commands

- `/siftcoder:bridge` → generates spec → `/siftcoder:build` implements it
- `/siftcoder:gap-analysis` can be run on each codebase first
- `/siftcoder:document architecture` to document bridge architecture
- `/siftcoder:fix` to address specific integration issues

## Now: Start Bridging

Parse the two folder paths and begin analysis...
