# Workflow: Build New Project from Specification

**Create a complete project from a specification file with automatic planning, implementation, testing, and documentation**

---

## Overview

This workflow guides you through building a complete project from a specification file. SiftCoder will automatically:

1. Analyze your specification
2. Create an implementation plan
3. Implement each feature with tests
4. Run quality gates (format, lint, type-check)
5. Generate documentation

**Time Estimate:** 1-3 hours (depending on project complexity)

**Difficulty:** ⭐⭐ Intermediate

---

## Prerequisites

### Before You Start

- [ ] Have a specification file (markdown, text, or structured format)
- [ ] Specification includes clear features and acceptance criteria
- [ ] Know your preferred tech stack (or let SiftCoder choose)
- [ ] Have Claude Code CLI installed and SiftCoder plugin loaded
- [ ] Empty project directory ready

### Specification Template

If you don't have a spec, create one with this template:

```markdown
# Project Name

## Overview
[Brief description of what this project does]

## Features
1. Feature 1
   - Description
   - Acceptance criteria

2. Feature 2
   - Description
   - Acceptance criteria

## Technical Preferences (optional)
- Language: [TypeScript/Python/Go/etc.]
- Framework: [React/Vue/Express/etc.]
- Database: [PostgreSQL/MongoDB/etc.]
- Testing: [Jest/Pytest/etc.]

## Priority Order
[List features in dependency order]
```

---

## Step-by-Step Workflow

### Step 1: Create Specification File

Create `my-project-spec.md` with your project requirements:

```markdown
# Todo App

## Features

### User Authentication
- Users can register with email and password
- Users can login and logout
- Session persists for 7 days

### Todo Management
- Users can create todos
- Users can mark todos as complete
- Users can delete todos
- Todos are stored in database

### Web UI
- Simple, clean interface
- Shows all todos
- Add todo form at top

## Technical Preferences
- Backend: Node.js with Express
- Frontend: React
- Database: MongoDB
- Testing: Jest
```

### Step 2: Run Build Command

```bash
/siftcoder:build my-project-spec.md
```

**What happens:**

```
📋 BUILD MODE: my-project-spec

🔍 Phase 1: Spec Analysis
   Reading specification...
   Features extracted: 3
   Dependencies identified: auth → todos → ui

📊 Phase 2: Feature Queue
   1. User Authentication (blocks: todos)
   2. Todo Management
   3. Web UI

🏗️ Phase 3: Implementation
   Feature: 1/3 - User Authentication

   📋 Planning...
      Subtasks: 5
      - Create user model
      - Implement auth service
      - Add JWT middleware
      - Create auth routes
      - Write tests

   💻 Implementation...
      [Progress indicators...]

   ✅ Quality Gates...
      ✓ Format: Prettier
      ✓ Lint: ESLint
      ✓ Type Check: TypeScript
      ✓ Tests: 12/12 passing

   🎯 QA Review...
      ✓ Acceptance criteria met
      ✓ Code quality good
      ✓ No issues found

   Feature: 2/3 - Todo Management
   [Same process repeats...]

   Feature: 3/3 - Web UI
   [Same process repeats...]

✅ PROJECT COMPLETE!
   Files created: 47
   Tests: 89 (all passing)
   Coverage: 85%
```

### Step 3: Monitor Progress (Optional)

While building, check progress anytime:

```bash
/siftcoder:status
```

**Output:**
```
📊 Current Status

WORKFLOW: BUILD
   Status: In Progress

FEATURE: Todo Management (2/3)
   Progress: 3/5 subtasks (60%)
   ✅ Create todo model
   ✅ Implement CRUD service
   ✅ Add API routes
   🔄 Write tests (in progress)
   ⏳ Add validation (queued)

BOUNDARIES:
   Modifiable: src/todos/*
   Protected: Everything else

NEXT: Complete tests, then validation
```

### Step 4: Pause if Needed (Optional)

```bash
/siftcoder:pause
```

**Use when:**
- You need to review progress
- You want to make manual changes
- You're stepping away

**To resume:**
```bash
/siftcoder:resume
```

### Step 5: Generate Documentation

After build completes, generate documentation:

```bash
# Architecture diagrams
/siftcoder:document architecture

# Code documentation
/siftcoder:document code src/

# User manual
/siftcoder:document user-manual
```

**Output:**
```
📚 Generating documentation...

Created docs/architecture/
├── system-overview.mmd
├── components.mmd
└── data-flow.mmd

Created inline documentation in src/
```

### Step 6: Review and Test

Test the application:

```bash
# Run tests
npm test

# Start application
npm start

# Manual testing
[Open browser and test functionality]
```

---

## Expected Final Structure

```
my-project/
├── src/
│   ├── auth/              # Authentication module
│   │   ├── auth.service.ts
│   │   ├── auth.middleware.ts
│   │   └── auth.routes.ts
│   ├── todos/             # Todo module
│   │   ├── todo.model.ts
│   │   ├── todo.service.ts
│   │   └── todo.routes.ts
│   ├── ui/                # Frontend
│   │   ├── App.tsx
│   │   ├── TodoList.tsx
│   │   └── AddTodoForm.tsx
│   └── index.ts
├── tests/
│   ├── auth/
│   │   └── auth.test.ts
│   └── todos/
│       └── todo.test.ts
├── docs/
│   └── architecture/
│       └── system-overview.mmd
├── package.json
└── tsconfig.json
```

---

## Commands Used

| Command | Purpose |
|---------|---------|
| `/build <spec>` | Main build command |
| `/status` | Check progress |
| `/pause` | Stop auto-continuation |
| `/resume` | Continue workflow |
| `/document architecture` | Generate diagrams |
| `/document code` | Inline docs |

---

## Tips & Best Practices

### Before Building

✅ **DO:**
- Start with a clear, detailed specification
- List features in dependency order
- Include acceptance criteria for each feature
- Specify tech stack if you have preferences

❌ **DON'T:**
- Use vague or incomplete specifications
- Skip acceptance criteria
- Forget to specify dependencies between features

### During Building

✅ **DO:**
- Monitor progress with `/status`
- Pause to review if needed
- Let quality gates run automatically
- Check test coverage

❌ **DON'T:**
- Interrupt unless necessary
- Skip quality gates
- Ignore failing tests

### After Building

✅ **DO:**
- Generate documentation
- Run tests manually
- Review the code structure
- Test the application

❌ **DON'T:**
- Skip documentation generation
- Assume everything works without testing

---

## Troubleshooting

### Issue: Build seems stuck

**Solution:**
```bash
# Check what's happening
/siftcoder:status

# If needed, pause and review
/siftcoder:pause
```

### Issue: Tests failing

**Solution:**
- Let QA Fixer handle it (automatic)
- If it persists after 3 attempts, review manually
- Check `/status` for details

### Issue: Wrong tech choices

**Solution:**
- Cancel with `/pause`
- Update spec with technical preferences
- Resume or restart build

### Issue: Want to add features

**Solution:**
```bash
# After build completes, add more features
/siftcoder:add-feature "New feature description"
```

---

## Variations

### Quick Build (Simple Projects)

For very simple projects, use quick mode:

```bash
/siftcoder:build simple-spec.md --quick
```

Skips some quality checks for faster build.

### Build with Manual Approval

For more control, use pair mode:

```bash
/siftcoder:pair
```

AI suggests, you approve each step.

### Build from Partial Spec

If spec is incomplete, enhance it first:

```bash
/siftcoder:improve-spec partial-spec.md
/siftcoder:build improved-spec.md
```

---

## Example: Complete Workflow

```bash
# 1. Create specification
cat > todo-app.md << 'EOF'
# Todo App
## Features
- User authentication
- Todo CRUD
- Simple web UI
EOF

# 2. Build project
/siftcoder:build todo-app.md

# 3. Check progress (optional)
/siftcoder:status

# 4. Generate documentation
/siftcoder:document architecture

# 5. Test
npm test
npm start

# 6. Done! Project ready.
```

---

## See Also

- [Command: /build](../02-command-reference/by-category/build-workflow.md#build)
- [Workflow: Add Feature](add-feature.md) - Add features to existing code
- [Use Case: New Project](../06-use-cases/by-task-type/new-project.md)
