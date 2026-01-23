# /siftcoder:reverse-spec - Generate Specification from Code

Reverse engineer existing code to create a specification document. Analyzes the codebase and produces a structured spec that could be used to recreate the project.

## Usage

```
/siftcoder:reverse-spec [--format <format>] [--output <path>] [--area <path>]
```

## Arguments
- `$ARGUMENTS` - Optional flags:
  - `--format`: Output format (markdown, json, yaml) - default: markdown
  - `--output`: Output file path - default: `./SPECIFICATION.md`
  - `--area`: Focus on specific directory/module

## Instructions

You are reverse engineering a codebase to create a specification document. This is the inverse of `/siftcoder:build` - instead of code from spec, you create spec from code.

### Phase 1: Codebase Analysis

1. **Run Understanding First**
   If not already done, invoke understanding:
   ```
   🔍 ANALYZING CODEBASE FOR SPECIFICATION...

   Running project understanding...
   [Uses /siftcoder:understand internally]
   ```

2. **Extract High-Level Overview**
   - Project purpose (from README, package.json, comments)
   - Target users/audience
   - Core value proposition

3. **Map Features**
   Identify all user-facing features:
   ```
   📋 FEATURES DETECTED

   Authentication:
   ├── User registration
   ├── Email/password login
   ├── OAuth (Google, GitHub)
   ├── Password reset
   └── Session management

   User Management:
   ├── Profile viewing
   ├── Profile editing
   ├── Avatar upload
   └── Account deletion

   Product Catalog:
   ├── Product listing
   ├── Category filtering
   ├── Search functionality
   ├── Product details
   └── Image gallery
   ...
   ```

### Phase 2: Feature Extraction

For each detected feature, extract:

1. **Functional Requirements**
   - What the feature does
   - User interactions
   - Expected behaviors
   - Edge cases handled

2. **Acceptance Criteria**
   Derive from tests and code:
   ```
   Feature: User Registration

   Acceptance Criteria:
   ✓ User can register with email and password
   ✓ Email must be unique (checked against database)
   ✓ Password must be 8+ characters with mixed case
   ✓ Confirmation email sent after registration
   ✓ User redirected to onboarding after verification
   ```

3. **Technical Implementation Notes**
   - Technologies used
   - External services
   - Database schemas
   - API endpoints

### Phase 3: API Documentation

If APIs exist, document:

```
📡 API SPECIFICATION

Base URL: /api/v1

Authentication:
├── POST /auth/register
│   Request: { email, password, name }
│   Response: { user, token }
│
├── POST /auth/login
│   Request: { email, password }
│   Response: { user, token }
│
└── POST /auth/logout
    Headers: Authorization: Bearer <token>
    Response: { success: true }

Users:
├── GET /users/:id
├── PUT /users/:id
└── DELETE /users/:id

Products:
├── GET /products
├── GET /products/:id
├── POST /products (admin)
├── PUT /products/:id (admin)
└── DELETE /products/:id (admin)
```

### Phase 4: Data Model Extraction

Document database schema:

```
📊 DATA MODELS

User:
├── id: UUID (primary key)
├── email: String (unique, required)
├── passwordHash: String (required)
├── name: String (required)
├── avatar: String (optional)
├── role: Enum [user, admin]
├── createdAt: DateTime
└── updatedAt: DateTime

Product:
├── id: UUID (primary key)
├── name: String (required)
├── description: Text
├── price: Decimal (required)
├── category: Reference → Category
├── images: Array<String>
├── stock: Integer
├── createdAt: DateTime
└── updatedAt: DateTime

Order:
├── id: UUID (primary key)
├── user: Reference → User
├── items: Array<OrderItem>
├── total: Decimal
├── status: Enum [pending, paid, shipped, delivered]
└── createdAt: DateTime
```

### Phase 5: Generate Specification Document

Create structured specification:

```markdown
# Project Specification: [Project Name]

## Overview
[Extracted from README and code analysis]

## Target Users
[Inferred from features and UI]

## Features

### 1. Authentication
**Description:** User authentication system with multiple providers.

**Requirements:**
- Users can register with email/password
- Users can login with Google OAuth
- Users can reset forgotten passwords
- Sessions expire after 7 days of inactivity

**Acceptance Criteria:**
- [ ] Registration validates email format
- [ ] Registration checks password strength
- [ ] Login rate-limited to 5 attempts per minute
- [ ] OAuth redirects preserve original destination

### 2. User Management
...

### 3. Product Catalog
...

## API Specification
[OpenAPI-style documentation]

## Data Models
[Schema definitions]

## Non-Functional Requirements
- Performance: [Extracted from code patterns]
- Security: [Extracted from middleware, validation]
- Scalability: [Inferred from architecture]

## Technical Stack
- Frontend: [Detected]
- Backend: [Detected]
- Database: [Detected]
- External Services: [Detected]

## Dependencies
[From package.json, requirements.txt, etc.]
```

### Phase 6: Output

1. **Write Specification File**
   Default: `./SPECIFICATION.md`

2. **Generate Supporting Files** (optional)
   - `openapi.yaml` - API specification
   - `schema.prisma` or `models.py` - Data models
   - `features.json` - Feature list for siftcoder

3. **Report**
   ```
   ✅ SPECIFICATION GENERATED

   Output: ./SPECIFICATION.md

   Extracted:
   ├── Features: 12 major, 47 sub-features
   ├── API Endpoints: 28
   ├── Data Models: 8
   ├── External Services: 4

   Supporting Files:
   ├── ./docs/openapi.yaml
   └── ./docs/data-models.md

   This specification can be used with:
   └── /siftcoder:build ./SPECIFICATION.md
   ```

## Output Formats

### Markdown (default)
Human-readable specification document.

### JSON
```json
{
  "name": "project-name",
  "version": "1.0.0",
  "overview": "...",
  "features": [...],
  "api": {...},
  "models": [...],
  "stack": {...}
}
```

### YAML
```yaml
name: project-name
version: 1.0.0
overview: |
  ...
features:
  - name: Authentication
    requirements: [...]
```

## Use Cases

1. **Documentation** - Create specs for undocumented projects
2. **Rewrite** - Spec for rebuilding in different technology
3. **Onboarding** - Help new developers understand the project
4. **Audit** - Review what was actually built vs. planned
5. **Migration** - Document before migrating to new system

## Integration

Works with:
- `/siftcoder:understand` - Uses captured understanding
- `/siftcoder:build` - Generated spec can recreate project
- `/siftcoder:document` - Complements technical docs

## Allowed Tools
Read, Write, Glob, Grep, Bash, Task (for subagents)

## Skills Used
- **pattern-detector** - Detect implementation patterns
- **spec-analyzer** - Structure the specification (reverse mode)
