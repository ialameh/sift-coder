# Use Case: New Project

**Starting from scratch with a new project**

---

## Overview

Starting a new project from scratch? This guide shows you how to use SiftCoder to go from idea to working application in one autonomous workflow.

---

## Scenario

You have an idea for a project and want to:
1. Turn it into a specification
2. Build the complete project
3. Generate tests and documentation
4. Deploy and run it

---

## Prerequisites

- Claude Code CLI installed
- SiftCoder plugin loaded
- Project idea in mind

---

## Step 1: Create Specification

Create `my-project-spec.md`:

```markdown
# My Project

## Overview
[Brief description]

## Features

### Feature 1: User Authentication
Users can register with email and password
- User registration with email validation
- Secure password storage (hashed)
- Email verification required
- Session management (7-day expiration)
- Password reset functionality

Acceptance Criteria:
- ✓ User can register with email/password
- ✓ Email verification sent on registration
- ✓ User can login with credentials
- ✓ Session persists for 7 days
- ✓ User can reset password via email

### Feature 2: [Feature Name]
[Description]
[Acceptance criteria]

## Technical Preferences
- Backend: Node.js with Express
- Frontend: React with TypeScript
- Database: PostgreSQL
- Testing: Jest
- Styling: Tailwind CSS

## Priority Order
1. User Authentication (blocks everything else)
2. [Next feature]
3. [Next feature]
```

---

## Step 2: Build the Project

```bash
/siftcoder:build my-project-spec.md
```

**What happens:**
1. **Spec Analysis** - Extracts features from spec
2. **Planning** - Creates implementation plan for each feature
3. **Implementation** - Builds each feature with:
   - Code following best practices
   - Comprehensive tests
   - Quality gates (format, lint, type-check)
4. **QA Validation** - Reviews and validates each feature
5. **Issue Resolution** - Fixes any problems found

**Time estimate:** 1-3 hours depending on complexity

---

## Step 3: Monitor Progress

While building, check progress:

```bash
/siftcoder:status
```

**Output shows:**
- Current feature being built
- Subtask progress
- Files created/modified
- Test results

**Pause if needed:**
```bash
/siftcoder:pause
```

**Resume later:**
```bash
/siftcoder:resume
```

---

## Step 4: Generate Documentation

After build completes:

```bash
# Architecture diagrams
/siftcoder:document architecture

# Code documentation
/siftcoder:document code src/

# User manual
/siftcoder:document user-manual

# Technical docs
/siftcoder:document technical
```

---

## Step 5: Test the Application

```bash
# Run all tests
npm test

# Start application
npm start

# Test manually
[Open browser and test]
```

---

## Step 6: Deploy

```bash
# Build for production
npm run build

# Deploy
[Deploy to your hosting platform]
```

---

## Example: Complete Workflow

```bash
# 1. Create spec
cat > todo-app.md << 'EOF'
# Todo App

## Features

### User Authentication
- Email/password registration
- Session management
- Password reset

### Todo Management
- Create todos
- Mark complete
- Delete todos

### Web UI
- Clean, simple interface
- Add todo form
- Todo list display

## Technical Preferences
- Backend: Node.js/Express
- Frontend: React
- Database: MongoDB
- Testing: Jest
EOF

# 2. Build
/siftcoder:build todo-app.md

# 3. Check progress
/siftcoder:status

# 4. Generate docs
/siftcoder:document architecture

# 5. Test
npm test
npm start
```

**Time breakdown:**
- Creating spec: 15 min
- Building: 1-2 hours (autonomous)
- Generating docs: 15 min
- Testing: 10 min
- **Total: 2-3 hours**

---

## Tips for Success

### Write Good Specifications

✅ **DO:**
- Be specific about features
- Include acceptance criteria
- Specify technical preferences
- Order features by dependency

❌ **DON'T:**
- Use vague descriptions
- Skip acceptance criteria
- Forget dependencies
- Leave technical choices ambiguous

### Before Building

✅ **DO:**
- Review spec for completeness
- Run `/improve-spec` first if needed
- Be available for questions

❌ **DON'T:**
- Start with incomplete spec
- Skip planning phase
- Go offline during build

### During Build

✅ **DO:**
- Monitor progress occasionally
- Pause to review if needed
- Let quality gates run

❌ **DON'T:**
- Micromanage the build
- Skip quality gates
- Interrupt unnecessarily

---

## Variations

### Quick Prototype

For simple projects, use quick mode:

```bash
/siftcoder:build simple-spec.md --quick
```

### Interactive Mode

For more control, use pair programming:

```bash
/siftcoder:pair
```

AI suggests, you approve each step.

### Manual Planning

Plan first, then build:

```bash
# Just create the plan
/siftcoder:build my-spec.md --plan-only

# Review plan, then build
[siftcoder:build my-spec.md]
```

---

## Common Issues

### Issue: Build taking too long

**Solution:**
- Check `/status` for progress
- Consider splitting spec into smaller files
- Use `/pause` to review

### Issue: Wrong tech choices

**Solution:**
1. Cancel with `/pause`
2. Update spec with technical preferences
3. Resume or restart build

### Issue: Want to add features

**Solution:**
After build completes:
```bash
/siftcoder:add-feature "Additional feature description"
```

---

## Next Steps

- [ ] Test the application thoroughly
- [ ] Deploy to staging environment
- [ ] Get user feedback
- [ ] Plan iteration based on feedback
- [ ] Use `/add-feature` for enhancements

---

## See Also

- [Workflow: Build New Project](../../05-workflows/build-new-project.md)
- [Command: /build](../02-command-reference/by-category/build-workflow.md#build)
- [Command: /add-feature](../02-command-reference/by-category/build-workflow.md#add-feature)
