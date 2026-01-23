# UNDERSTAND Workflow Commands

**Codebase analysis and knowledge capture**

The UNDERSTAND workflow contains commands for analyzing and capturing deep understanding of your project - from quick overviews to detailed analysis with diagrams.

---

## Commands Overview

| Command | Purpose | Difficulty | Time | Mode |
|---------|---------|------------|------|------|
| [`/understand`](#understand) | Analyze project structure | ⭐ Beginner | 2-30 min | Read-only |
| [`/search`](#search) | Semantic codebase search | ⭐ Beginner | 1-5 min | Read-only |
| [`/reverse-spec`](#reverse-spec) | Generate spec from code | ⭐⭐ Intermediate | 10-20 min | Read-only |

---

## /understand

Analyze the project and capture understanding of its structure, patterns, and architecture.

### Quick Overview
- **Purpose**: Capture project understanding
- **Difficulty**: ⭐ Beginner
- **Time Estimate**: 2-30 min
- **Mode**: Read-only

### When to Use This Command

✅ **Use this when:**
- New to a codebase
- Starting work on existing project
- Need to understand architecture
- Before adding features

❌ **Don't use when:**
- You already know the codebase well

### Syntax

```bash
/siftcoder:understand [--deep] [--area <path>]
```

**Arguments:**
- `--deep` - Thorough analysis with diagrams (slower)
- `--area <path>` - Focus on specific directory

### Examples

#### Basic Understanding

```bash
/siftcoder:understand
```

**Output:**
```
🔍 Analyzing project...

📊 Project Overview
   Type: nodejs
   Framework: Express + React
   Database: PostgreSQL
   Testing: Jest

🏗️ Architecture
   ├── src/
   │   ├── routes/         # API endpoints (12 files)
   │   ├── services/       # Business logic (8 files)
   │   ├── models/         # Data models (5 files)
   │   └── middleware/     # Express middleware (3 files)
   ├── tests/
   └── package.json

🔗 Dependencies
   - express: HTTP server
   - pg: PostgreSQL client
   - jest: Test framework
   - bcrypt: Password hashing

💡 Patterns Detected
   - Async/await throughout
   - Service layer for business logic
   - Centralized error handling

📚 Knowledge Stored
   Run /knowledge to query what was learned
```

#### Deep Analysis with Diagrams

```bash
/siftcoder:understand --deep
```

**Output:**
```
🔍 Deep analysis...

📊 Project Overview
   [Same as basic]

🧩 Dependency Graph
   Generated: docs/dependencies.mmd

📊 Data Flow
   Generated: docs/data-flow.mmd

🏗️ Architecture Diagram
   Generated: docs/architecture.mmd

📋 Patterns Detected (15)
   ├── Naming: camelCase functions, PascalCase components
   ├── Imports: External → Internal → Relative
   ├── Errors: Custom error classes with codes
   ├── Async: async/await with try/catch
   └── Tests: Co-located with .test.ts suffix

⚠️ Gotchas Found (5)
   ├── DATABASE_URL must be set before start
   ├── Node 18+ required for native fetch
   ├── Build requires VITE_API_URL env var
   ├── Tests need running database
   └── ESM modules - use .js extensions in imports
```

---

## /search

Semantic codebase search using vector embeddings.

### Quick Overview
- **Purpose**: Find code by meaning, not just keywords
- **Difficulty**: ⭐ Beginner
- **Time Estimate**: 1-5 min
- **Mode**: Read-only

### When to Use This Command

✅ **Use this when:**
- Finding code related to a concept
- Don't know exact variable names
- Need semantic code search

### Syntax

```bash
/siftcoder:search <query>
```

**Examples:**

```bash
/siftcoder:search "authentication logic"
```

**Output:**
```
🔍 Semantic search: "authentication logic"

Found 5 relevant code sections:

1. src/services/auth.ts (similarity: 0.92)
   Lines: 15-89
   Context: User authentication with JWT tokens

2. src/middleware/auth.ts (similarity: 0.87)
   Lines: 1-45
   Context: Authentication middleware for routes

3. src/routes/auth.ts (similarity: 0.81)
   Lines: 10-67
   Context: Authentication endpoints

[... more results]
```

---

## /reverse-spec

Generate a specification document from existing code.

### Quick Overview
- **Purpose**: Reverse engineer spec from code
- **Difficulty**: ⭐⭐ Intermediate
- **Time Estimate**: 10-20 min
- **Mode**: Read-only

### When to Use This Command

✅ **Use this when:**
- Documenting existing codebase
- Creating specs from legacy code
- Understanding what was built

### Syntax

```bash
/siftcoder:reverse-spec [--area <path>]
```

**Examples:**

```bash
/siftcoder:reverse-spec --area src/checkout
```

**Output:**
```
📄 Generating specification from code...

Created: specs/checkout-generated.md

# Checkout System Specification

## Features
- Shopping cart management
- Payment processing
- Order creation
- Email notifications

## Implementation Details
[Extracted from code analysis...]
```

---

## See Also

- [BUILD Workflow](build-workflow.md) - Create projects
- [LEARN Workflow](learn-workflow.md) - Interactive learning
- [MAINTAIN Workflow](maintain-workflow.md) - Fix and maintain
