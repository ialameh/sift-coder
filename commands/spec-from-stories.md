# /siftcoder:spec-from-stories - Specification Generator

**Generate detailed specifications from user stories or requirements.**

## Usage

```bash
/siftcoder:spec-from-stories [file-or-stories]
```

## Arguments
- `$ARGUMENTS` - Path to user stories file OR inline user stories

## Examples

```bash
# Generate from file
/siftcoder:spec-from-stories user-stories.md

# Generate from inline stories
/siftcoder:spec-from-stories "As a user, I want to login so that I can access my account"

# Generate detailed spec
/siftcoder:spec-from-stories stories.md --detailed

# Generate with architecture
/siftcoder:spec-from-stories stories.md --with-architecture
```

## Instructions

You are a **Specification Writer** that creates comprehensive technical specifications from user stories and requirements.

---

## Phase 1: Input Processing

### Step 1: Read User Stories

```bash
if [ -f "$1" ]; then
  stories=$(cat "$1")
else
  stories="$1"
fi

echo "📝 Processing $(echo "$stories" | grep -c "As a") user stories..."
```

### Step 2: Parse Stories

Extract from each story:
- **Actor/Role:** Who is the user?
- **Action:** What do they want to do?
- **Benefit:** Why do they want this?
- **Acceptance Criteria:** (if provided) How do we know it's done?

---

## Phase 2: Specification Generation

### Section 1: Executive Summary

```markdown
# [Project Name] - Technical Specification

## Overview
[Brief description of what we're building]

## Problem Statement
[What problem are we solving?]

## Solution Summary
[High-level approach to solving it]

## Goals
- [Goal 1]
- [Goal 2]
- [Goal 3]

## Success Metrics
- [Metric 1]: [Target]
- [Metric 2]: [Target]
```

### Section 2: User Stories & Requirements

```markdown
## User Stories

### Story 1: [Title]
**As a** [role]
**I want** [feature]
**So that** [benefit]

**Acceptance Criteria:**
- [ ] [Criterion 1]
- [ ] [Criterion 2]
- [ ] [Criterion 3]

**Priority:** [Must/Should/Could]
**Estimated Complexity:** [Low/Medium/High]

### Story 2: [Title]
...
```

### Section 3: Functional Requirements

```markdown
## Functional Requirements

### FR-001: [Requirement Name]
**Description:** [What the system must do]
**Priority:** [Must/Should/Could]
**User Story:** [Link to story]
**Dependencies:** [What this depends on]

**Details:**
- [Detail 1]
- [Detail 2]
- [Detail 3]

### FR-002: [Requirement Name]
...
```

### Section 4: Non-Functional Requirements

```markdown
## Non-Functional Requirements

### Performance
- **Response Time:** [X]ms for [operation]
- **Throughput:** [X] requests/second
- **Scalability:** Support [X] concurrent users

### Security
- **Authentication:** [Method required]
- **Authorization:** [Permission model]
- **Data Protection:** [Encryption standards]

### Reliability
- **Uptime:** [X]% availability target
- **Failure Handling:** [How to handle failures]
- **Data Backup:** [Backup strategy]

### Usability
- **Target Users:** [Who will use this]
- **Accessibility:** [WCAG level if applicable]
- **User Experience:** [UX goals]

### Maintainability
- **Code Quality:** [Standards to follow]
- **Documentation:** [Documentation requirements]
- **Testing:** [Test coverage requirements]
```

### Section 5: Technical Architecture

```markdown
## Technical Architecture

### Technology Stack

**Frontend:**
- Framework: [React/Vue/etc.]
- State Management: [Redux/Context/etc.]
- Styling: [CSS/Tailwind/etc.]
- Build Tools: [Vite/Webpack/etc.]

**Backend:**
- Runtime: [Node.js/Python/etc.]
- Framework: [Express/Django/etc.]
- API Pattern: [REST/GraphQL/etc.]

**Database:**
- Type: [SQL/NoSQL/etc.]
- Specific: [PostgreSQL/MongoDB/etc.]
- ORM: [Prisma/TypeORM/etc.]

**Infrastructure:**
- Hosting: [AWS/Vercel/etc.]
- CI/CD: [GitHub Actions/etc.]
- Monitoring: [Tools to use]

### System Architecture

[Architecture diagram or description]

**Components:**
1. **[Component 1]** - [Purpose]
2. **[Component 2]** - [Purpose]
3. **[Component 3]** - [Purpose]

**Data Flow:**
```
[User] → [Frontend] → [API] → [Database]
```

### API Design

**Endpoints:**

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| GET | /api/resource | List items | Required |
| POST | /api/resource | Create item | Required |
| GET | /api/resource/:id | Get item | Required |
| PUT | /api/resource/:id | Update item | Required |
| DELETE | /api/resource/:id | Delete item | Required |

### Data Model

```typescript
// Example TypeScript interface
interface User {
  id: string;
  email: string;
  name: string;
  createdAt: Date;
  updatedAt: Date;
}
```

### Security Considerations

- **Authentication:** [JWT/OAuth/etc.]
- **Authorization:** [Role-based/ABAC/etc.]
- **Input Validation:** [Validation approach]
- **Output Encoding:** [XSS prevention]
- **SQL Injection:** [Parameterized queries]
- **CSRF Protection:** [Token approach]
```

### Section 6: UI/UX Requirements

```markdown
## User Interface

### Screens/Components

**Screen 1: [Screen Name]**
- Purpose: [What it's for]
- Components: [List of components]
- Interactions: [User actions]
- States: [Loading, error, success, etc.]

**Screen 2: [Screen Name]**
...

### Design System
- Colors: [Palette]
- Typography: [Font choices]
- Spacing: [Spacing scale]
- Components: [Component library]

### Responsive Design
- Breakpoints: [Mobile, tablet, desktop]
- Mobile-first: [Yes/No]
- Touch targets: [Minimum size]
```

### Section 7: Testing Strategy

```markdown
## Testing

### Unit Tests
- Framework: [Jest/Vitest/etc.]
- Coverage Target: [X]%
- Key Areas to Test:
  - [ ] [Area 1]
  - [ ] [Area 2]

### Integration Tests
- Framework: [Supertest/etc.]
- Scenarios:
  - [ ] [Scenario 1]
  - [ ] [Scenario 2]

### End-to-End Tests
- Framework: [Playwright/Cypress/etc.]
- Critical Paths:
  - [ ] [Path 1]
  - [ ] [Path 2]

### Performance Tests
- Load Testing: [Tool and approach]
- Stress Testing: [Tool and approach]
```

### Section 8: Implementation Plan

```markdown
## Implementation Phases

### Phase 1: Foundation (Weeks 1-2)
**Goal:** [What this phase achieves]
**Stories:**
- [ ] [Story 1]
- [ ] [Story 2]
**Deliverables:**
- [ ] [Deliverable 1]
- [ ] [Deliverable 2]

### Phase 2: Core Features (Weeks 3-4)
**Goal:** [What this phase achieves]
**Stories:**
- [ ] [Story 3]
- [ ] [Story 4]
**Deliverables:**
- [ ] [Deliverable 3]
- [ ] [Deliverable 4]

### Phase 3: Enhancement (Weeks 5-6)
**Goal:** [What this phase achieves]
...
```

### Section 9: Risk Assessment

```markdown
## Risks & Mitigations

| Risk | Impact | Probability | Mitigation |
|------|--------|-------------|------------|
| [Risk 1] | High/Medium/Low | High/Medium/Low | [Mitigation strategy] |
| [Risk 2] | High/Medium/Low | High/Medium/Low | [Mitigation strategy] |
```

### Section 10: Open Questions

```markdown
## Open Questions

1. [Question 1]
   - Impact: [How this affects the project]
   - Decision needed by: [When]

2. [Question 2]
   - Impact: [How this affects the project]
   - Decision needed by: [When]
```

---

## Phase 3: Output Generation

### Example: Complete Spec

```markdown
# Authentication System - Technical Specification

## Overview
Build a secure JWT-based authentication system with email/password login, token refresh, and role-based access control.

## Problem Statement
Current application lacks authentication. Users need secure access to personalized features, and admins need role-based permissions.

## Solution Summary
Implement JWT-based authentication with:
- Email/password registration and login
- Secure password hashing (bcrypt)
- JWT token generation and validation
- Refresh token mechanism
- Role-based access control (User, Admin)

## Goals
- Secure user authentication
- Role-based authorization
- Seamless token refresh
- Password recovery flow

## Success Metrics
- < 200ms login response time
- 99.9% authentication success rate
- Zero security vulnerabilities in first year

---

## User Stories

### Story 1: User Registration
**As a** new user
**I want to** register with email and password
**So that** I can create an account and access the application

**Acceptance Criteria:**
- [ ] User can register with email and password
- [ ] Password must be at least 8 characters
- [ ] Email must be valid format
- [ ] User receives confirmation email
- [ ] Duplicate emails are rejected
- [ ] Account is created with "User" role

**Priority:** Must
**Complexity:** Medium

### Story 2: User Login
**As a** registered user
**I want to** login with email and password
**So that** I can access my account

**Acceptance Criteria:**
- [ ] User can login with valid credentials
- [ ] Invalid credentials show error message
- [ ] Successful login returns JWT token
- [ ] Token expires after 7 days
- [ ] User session persists across page refreshes

**Priority:** Must
**Complexity:** Medium

### Story 3: Token Refresh
**As a** logged-in user
**I want to** automatically refresh my token
**So that** I don't get logged out unexpectedly

**Acceptance Criteria:**
- [ ] Token refreshes automatically before expiration
- [ ] Refresh token is valid for 30 days
- [ ] User can logout and invalidate tokens
- [ ] Compromised tokens can be revoked

**Priority:** Should
**Complexity:** High

---

## Functional Requirements

### FR-001: User Registration
**Description:** System must allow new users to register with email and password
**Priority:** Must
**User Story:** Story 1
**Dependencies:** None

**Details:**
- Validate email format (RFC 5322)
- Validate password strength (min 8 chars, 1 uppercase, 1 number)
- Hash password using bcrypt with 12 salt rounds
- Check for duplicate emails
- Assign "User" role by default
- Generate verification token
- Send confirmation email

### FR-002: User Login
**Description:** System must authenticate users with email and password
**Priority:** Must
**User Story:** Story 2
**Dependencies:** FR-001

**Details:**
- Accept email and password credentials
- Verify user exists and password matches
- Generate JWT access token (7 day expiry)
- Generate refresh token (30 day expiry)
- Return tokens to client
- Track last login timestamp

### FR-003: Token Refresh
**Description:** System must refresh access tokens using refresh tokens
**Priority:** Should
**User Story:** Story 3
**Dependencies:** FR-002

**Details:**
- Accept valid refresh token
- Verify token not revoked
- Generate new access token
- Optional: Generate new refresh token
- Update token expiration

---

## Non-Functional Requirements

### Performance
- **Login Response:** < 200ms (p95)
- **Token Validation:** < 50ms (p95)
- **Throughput:** 1000 requests/second
- **Concurrent Users:** Support 10,000 simultaneous users

### Security
- **Password Hashing:** bcrypt with 12 salt rounds
- **JWT Secret:** 256-bit random key
- **Token Storage:** HttpOnly cookies
- **HTTPS Required:** All auth endpoints over HTTPS
- **Rate Limiting:** 5 login attempts per 15 minutes
- **Password Reset:** Time-limited tokens (1 hour expiry)

### Reliability
- **Uptime:** 99.9% availability
- **Token Revocation:** < 1 second propagation
- **Backup:** Daily database backups
- **Failover:** Hot standby for auth service

---

## Technical Architecture

### Technology Stack

**Backend:**
- Runtime: Node.js 18+
- Framework: Express.js
- Authentication: Passport.js
- Database: PostgreSQL
- ORM: Prisma

**Security:**
- Password Hashing: bcrypt
- JWT: jsonwebtoken library
- Validation: Joi/Zod
- Rate Limiting: express-rate-limit

**Infrastructure:**
- Hosting: AWS ECS
- Database: AWS RDS PostgreSQL
- Cache: AWS Elastisearch (for revoked tokens)
- CI/CD: GitHub Actions

### System Architecture

```
┌─────────┐     ┌──────────────┐     ┌──────────┐
│ Client  │────▶│  API Gateway  │────▶│  Auth    │
│ (App)   │     │   (Express)  │     │ Service  │
└─────────┘     └──────────────┘     └────┬─────┘
                                             │
                                      ┌────▼─────┐
                                      │ Database │
                                      │(Postgres)│
                                      └──────────┘
```

### API Design

**Authentication Endpoints:**

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| POST | /api/auth/register | Register new user | Public |
| POST | /api/auth/login | Login user | Public |
| POST | /api/auth/logout | Logout user | Required |
| POST | /api/auth/refresh | Refresh token | Public |
| POST | /api/auth/forgot-password | Request reset | Public |
| POST | /api/auth/reset-password | Reset password | Public |

**Request/Response Examples:**

```typescript
// POST /api/auth/register
interface RegisterRequest {
  email: string;
  password: string;
  name: string;
}

interface RegisterResponse {
  user: {
    id: string;
    email: string;
    name: string;
    role: 'USER' | 'ADMIN';
  };
  tokens: {
    accessToken: string;
    refreshToken: string;
  };
}
```

### Data Model

```typescript
// User model
interface User {
  id: string;        // UUID
  email: string;     // Unique, indexed
  passwordHash: string;
  name: string;
  role: 'USER' | 'ADMIN';
  emailVerified: boolean;
  createdAt: Date;
  updatedAt: Date;
}

// Refresh Token model
interface RefreshToken {
  id: string;        // UUID
  token: string;     // Hashed
  userId: string;    // Foreign key to User
  expiresAt: Date;
  revoked: boolean;
  createdAt: Date;
}

// Password Reset Token model
interface PasswordResetToken {
  id: string;
  token: string;
  userId: string;
  expiresAt: Date;
  used: boolean;
  createdAt: Date;
}
```

---

## Implementation Plan

### Phase 1: Foundation (Week 1)
**Goal:** Core authentication endpoints

**Tasks:**
- [ ] Set up project structure
- [ ] Configure database schema
- [ ] Implement user registration
- [ ] Implement user login
- [ ] Add JWT token generation
- [ ] Write basic tests

**Deliverables:**
- Working registration endpoint
- Working login endpoint
- JWT token generation
- Database schema

### Phase 2: Security & Validation (Week 2)
**Goal:** Production-ready security

**Tasks:**
- [ ] Add password hashing (bcrypt)
- [ ] Implement input validation
- [ ] Add rate limiting
- [ ] Configure CORS
- [ ] Add security headers
- [ ] Write security tests

**Deliverables:**
- Secure password storage
- Rate-limited endpoints
- Input validation
- Security hardening

### Phase 3: Token Management (Week 3)
**Goal:** Token refresh and logout

**Tasks:**
- [ ] Implement refresh token endpoint
- [ ] Add logout functionality
- [ ] Token revocation system
- [ ] Background cleanup job
- [ ] Integration tests

**Deliverables:**
- Token refresh flow
- Logout functionality
- Token revocation
- Automated cleanup

---

## Risk Assessment

| Risk | Impact | Probability | Mitigation |
|------|--------|-------------|------------|
| JWT secret leaked | Critical | Low | Environment variable, rotation policy |
| Password database compromised | Critical | Low | Bcrypt hashing, slow hash function |
| Token replay attacks | High | Medium | Short expiry, unique token IDs |
| DoS on login endpoint | Medium | Medium | Rate limiting, CAPTCHA |
| Refresh token theft | High | Low | HttpOnly cookies, rotation |

---

## Open Questions

1. **Social Login Integration**
   - Impact: High user demand
   - Decision needed by: Week 2
   - Options: Google, GitHub, both, defer to Phase 2

2. **2FA Requirement**
   - Impact: Security enhancement
   - Decision needed by: Week 3
   - Options: TOTP, SMS, email, none initially

3. **Session Management UI**
   - Impact: User experience
   - Decision needed by: Week 2
   - Options: Show active sessions, allow remote logout

---

**Specification Version:** 1.0
**Last Updated:** January 15, 2026
**Status:** Ready for Development
**Estimated Duration:** 3 weeks
**Team Size:** 1-2 developers
```

---

## Tips & Hints

```
WHEN TO USE

Before development starts:
  → /siftcoder:spec-from-stories user-stories.md
  → Clear technical blueprint

For stakeholder approval:
  → /siftcoder:spec-from-stories --with-architecture
  → Include diagrams and technical details

For sprint planning:
  → /siftcoder:spec-from-stories --detailed
  → Break down into tasks

FROM DIFFERENT INPUTS

User stories file:
  → /siftcoder:spec-from-stories stories.md
  → Structured user stories

Jira/Linear export:
  → /siftcoder:spec-from-stories jira-export.txt
  → Parse ticket descriptions

Requirements meeting notes:
  → /siftcoder:spec-from-stories "requirements from meeting"
  → Parse natural language

CUSTOMIZATION

Focus on security:
  → /siftcoder:spec-from-stories --focus security
  → Emphasize security requirements

Focus on performance:
  → /siftcoder:spec-from-stories --focus performance
  → Include performance targets

With monitoring:
  → /siftcoder:spec-from-stories --with-monitoring
  → Add observability requirements

OUTPUT FORMATS

Markdown (default):
  → Readable, version control friendly

JSON:
  → /siftcoder:spec-from-stories --format json
  → Machine-readable, tool-consumable

HTML:
  → /siftcoder:spec-from-stories --format html
  → Presentation-ready
```

---

## Allowed Tools

Read, Write, Glob, Grep, Bash, AskUserQuestion
