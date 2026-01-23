# BUILD Workflow Commands

**New project development and feature addition**

The BUILD workflow contains 4 commands for creating new projects and adding features to existing applications.

---

## Commands Overview

| Command | Purpose | Difficulty | Time |
|---------|---------|------------|------|
| [`/build`](#build) | Create project from specification | ⭐⭐ | 30 min - 2 hours |
| [`/add-feature`](#add-feature) | Add feature to existing code | ⭐⭐ | 10 min - 1 hour |
| [`/organize-project`](#organize-project) | Organize to Sift structure | ⭐ | 5-15 min |
| [`/features`](#features) | Manage feature queue | ⭐ | 1 min |

---

## /build

Build a new project from a specification file.

### Quick Overview
- **Purpose**: Create complete project from specification
- **Difficulty**: ⭐⭐ Intermediate
- **Time Estimate**: 30 min - 2 hours
- **Mode**: Autonomous

### When to Use This Command

✅ **Use this when:**
- You have a specification file for a new project
- You want to create a complete project with tests and documentation
- You're starting from scratch
- You have a well-defined feature list

❌ **Don't use when:**
- Adding to existing code (use `/add-feature`)
- Spec is incomplete or vague

🔄 **Alternatives:**
- `/add-feature` - For adding to existing code
- `/ideate` - For generating feature ideas before building

### Syntax

```bash
/siftcoder:build <spec-file-path>
```

**Arguments:**
- `spec-file-path`: Path to specification file (markdown or text)

### How It Works

1. **Spec Analysis** (1-2 min)
   - Reads specification file
   - Extracts features with acceptance criteria
   - Identifies dependencies between features
   - Creates prioritized feature queue

2. **Feature Extraction**
   - Uses spec-analyzer skill
   - Extracts feature names, descriptions, acceptance criteria
   - Identifies test scenarios

3. **Planning** (2-5 min per feature)
   - Invokes Planner agent
   - Explores existing code patterns
   - Designs implementation approach
   - Breaks into subtasks

4. **Implementation** (10-30 min per feature)
   - Invokes Coder agent for each subtask
   - Implements code with tests
   - Runs quality gates (format, lint, type-check)

5. **QA Validation** (2-5 min per feature)
   - Invokes QA Reviewer agent
   - Validates acceptance criteria
   - Runs comprehensive tests
   - Identifies issues

6. **Issue Resolution**
   - Invokes QA Fixer if needed
   - Fixes identified problems
   - Re-validates with QA

### Examples

#### Basic Example

```bash
/siftcoder:build ./specs/todo-app.md
```

**Specification file (`todo-app.md`):**
```markdown
# Todo App

## Features
- Create, read, update, delete todos
- User authentication with email/password
- Persistent storage
- Simple web UI

## Technical Preferences
- Backend: Node.js with Express
- Frontend: React
- Database: MongoDB
- Testing: Jest
```

**Expected output:**
```
📋 BUILD MODE: todo-app

🔍 Analyzing specification...
   Features extracted: 4
   Dependencies identified: auth → todos

📊 Feature Queue:
   1. User Authentication (blocks: todos)
   2. Todo CRUD Operations
   3. Persistent Storage
   4. Web UI

🏗️ Phase 1: Planning
   Feature: User Authentication
   Subtasks: 5

🏗️ Phase 2: Implementation
   [Progress indicators...]

✅ Project Complete!
   Files created: 47
   Tests: 89 (all passing)
   Documentation: generated
```

#### Real-World Example

**Scenario**: Building an e-commerce API

```bash
/siftcoder:build ./specs/ecommerce-api.md
```

**Result:**
- Express.js REST API created
- User authentication with JWT
- Product catalog with categories
- Shopping cart and checkout
- Payment integration (Stripe)
- Order management
- Test coverage: 85%
- API documentation in OpenAPI format
- Docker configuration
- Deployment guide

### Integration

**Skills Used:**
- `spec-analyzer` - Extract features from specification
- `siftcoder-workflow` - Orchestrates autonomous workflow

**Agents Invoked:**
- **Planner** - Creates implementation plan
- **Coder** - Implements code
- **QA Reviewer** - Validates implementation
- **QA Fixer** - Fixes issues

**Related Commands:**
- `/add-feature` - Add features to existing code
- `/document architecture` - Generate architecture docs
- `/features list` - Show feature queue

**Prerequisites:**
- Specification file with clear features
- Empty project directory or new folder

### Tips & Best Practices

✅ **DO:**
- Include testable acceptance criteria in spec
- Specify technical preferences (framework, language)
- Order features by dependency
- Start with smaller specs to build trust

❌ **DON'T:**
- Use vague or incomplete specifications
- Skip acceptance criteria
- Forget to specify tech stack (or be okay with defaults)

💡 **PRO TIP:**
Run `/ideate` on your spec before building to add missing features and improve requirements quality.

### Troubleshooting

| Issue | Solution |
|-------|----------|
| Spec not found | Check file path is relative to current directory |
| Vague requirements | Use `/improve-spec` to enhance spec |
| Wrong tech choices | Specify technical preferences in spec |
| Build taking too long | Use `/pause` to stop, review progress |

---

## /add-feature

Add a new feature to an existing application.

### Quick Overview
- **Purpose**: Add feature to existing code
- **Difficulty**: ⭐⭐ Intermediate
- **Time Estimate**: 10 min - 1 hour
- **Mode**: Write-enabled

### When to Use This Command

✅ **Use this when:**
- Adding functionality to existing codebase
- Following established patterns
- Integrating with existing architecture
- Need to match coding conventions

❌ **Don't use when:**
- Creating new project (use `/build`)
- Don't have existing code

🔄 **Alternatives:**
- `/build` - For new projects
- `/fix` - For fixing bugs

### Syntax

```bash
/siftcoder:add-feature <description>
```

**Arguments:**
- `description`: Natural language description of feature

### How It Works

1. **Codebase Analysis** (1-2 min)
   - Detects project type and framework
   - Identifies architecture patterns
   - Scans for naming conventions
   - Finds integration points

2. **Pattern Detection** (1-2 min)
   - File naming conventions
   - Architecture patterns (MVC, Clean Architecture, etc.)
   - Code organization style
   - Error handling patterns

3. **Feature Planning** (2-3 min)
   - Invokes Planner agent with pattern context
   - Creates implementation plan
   - Identifies files to create/modify
   - Shows plan for approval

4. **Implementation** (5-30 min)
   - Invokes Coder agent
   - Follows detected patterns exactly
   - Integrates with existing code
   - Adds tests

5. **Quality Gates**
   - Format with project formatter
   - Lint with project linter
   - Type check
   - Run tests (no regressions)

### Examples

#### Basic Example

```bash
/siftcoder:add-feature "Add password reset functionality with email tokens"
```

**Output:**
```
🔍 Analyzing codebase...
   Detected: React + Express, TypeScript
   Patterns: camelCase, service layer, Jest tests

📋 Feature Plan
   New Files:
   ├── src/services/passwordReset.ts
   ├── src/api/passwordReset.ts
   └── src/components/PasswordReset.tsx

   Modified Files:
   ├── src/App.tsx (add route)
   └── src/services/index.ts (export)

   Subtasks: 7

✅ Implementation complete
   Files created: 3
   Tests added: 12
   All tests passing
```

#### Real-World Example

**Scenario**: Adding file upload to todo app

```bash
/siftcoder:add-feature "Add file attachments to todos with S3 storage"
```

**Result:**
- File upload component created
- S3 integration service added
- Database schema updated (attachments table)
- API endpoints created
- File validation and virus scanning
- Tests for upload/download/delete
- Documentation updated

### Integration

**Skills Used:**
- `pattern-detector` - Detect code patterns

**Agents Invoked:**
- **Planner** - Creates plan following patterns
- **Coder** - Implements matching existing style
- **QA Reviewer** - Validates pattern compliance

**Related Commands:**
- `/build` - Create new project
- `/understand` - Learn patterns first
- `/document code` - Document new code

**Prerequisites:**
- Existing codebase
- Clear feature description

### Tips & Best Practices

✅ **DO:**
- Run `/understand` first to detect patterns
- Be specific about feature requirements
- Review the plan before implementation

❌ **DON'T:**
- Skip pattern detection
- Make feature descriptions too vague

💡 **PRO TIP:**
After adding feature, run `/document code` on new files to maintain documentation.

---

## /organize-project

Organize an existing project folder into the Sift monorepo structure.

### Quick Overview
- **Purpose**: Organize project to Sift structure
- **Difficulty**: ⭐ Beginner
- **Time Estimate**: 5-15 min
- **Mode**: Write-enabled

### When to Use This Command

✅ **Use this when:**
- Importing existing project to Sift structure
- Standardizing project organization
- Preparing for multi-project workflow

❌ **Don't use when:**
- Project already organized
- Building from scratch (use `/build` instead)

### Syntax

```bash
/siftcoder:organize-project <path>
```

**Arguments:**
- `path`: Path to project directory to organize

---

## /features

Manage the feature queue for build workflows.

### Quick Overview
- **Purpose**: Show feature queue status
- **Difficulty**: ⭐ Beginner
- **Time Estimate**: 1 min
- **Mode**: Read-only

### When to Use This Command

✅ **Use this when:**
- Checking build progress
- Seeing what features remain
- Understanding workflow state

### Syntax

```bash
/siftcoder:features list
```

**Subcommands:**
- `list` - Show all features and their status
- `add` - Add feature to queue
- `remove` - Remove feature from queue
- `reorder` - Change feature priority

### Examples

```bash
# Show current feature queue
/siftcoder:features list

# Expected output
Feature Queue:
├── ✅ User Authentication (completed)
├── 🔄 Todo CRUD (in progress: subtask 3/5)
├── ⏳ Persistent Storage (queued)
└── ⏳ Web UI (queued)
```

---

## Workflow Examples

### Complete New Project Workflow

```bash
# 1. Create specification
cat > my-project.md << 'EOF'
# My Project
## Features
- Feature 1
- Feature 2
EOF

# 2. Build project
/siftcoder:build my-project.md

# 3. Check progress
/siftcoder:features list

# 4. Pause if needed
/siftcoder:pause

# 5. Resume later
/siftcoder:resume

# 6. Generate documentation
/siftcoder:document architecture
```

### Add Feature to Existing Project

```bash
# 1. Understand existing patterns
/siftcoder:understand

# 2. Add feature
/siftcoder:add-feature "Add user notifications"

# 3. Check progress
/siftcoder:status

# 4. Document new code
/siftcoder:document code src/notifications/
```

---

## See Also

- [MAINTAIN Workflow](maintain-workflow.md) - Fix and maintain code
- [DOCUMENT Workflow](document-workflow.md) - Generate documentation
- [UNDERSTAND Workflow](understand-workflow.md) - Analyze codebase
- [Workflow: Build New Project](../../05-workflows/build-new-project.md)
- [Use Case: New Project](../../06-use-cases/by-task-type/new-project.md)
