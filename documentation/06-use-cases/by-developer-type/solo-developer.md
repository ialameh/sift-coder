# Use Case: Solo Developer

**Working independently with SiftCoder**

---

## Overview

As a solo developer, you need tools that help you:

- Move quickly from idea to implementation
- Fix bugs safely without breaking things
- Generate comprehensive documentation
- Handle all aspects of development yourself

SiftCoder's multi-agent workflows act like your virtual team, helping you plan, code, review, and fix automatically.

---

## Common Scenarios

### Scenario 1: Inherited Legacy Codebase

**Situation:** You've inherited a legacy codebase and don't know where to start.

**Workflow:**

```bash
# 1. Understand the codebase
/siftcoder:understand --deep

# Output shows:
# - Project type and architecture
# - Key components and their roles
# - Patterns and conventions
# - Gotchas and pitfalls

# 2. Check test coverage
/siftcoder:test coverage

# 3. Generate documentation
/siftcoder:document architecture
/siftcoder:document code src/
```

**Result:** You now understand:
- Overall architecture
- Key files and what they do
- Testing gaps
- How to work with the codebase

---

### Scenario 2: Building a New Feature

**Situation:** You need to add authentication to your app.

**Workflow:**

```bash
# 1. Add feature (SiftCoder detects your patterns)
/siftcoder:add-feature "Add JWT authentication with refresh tokens"

# SiftCoder:
# - Analyzes your existing code
# - Detects patterns (naming, structure)
# - Creates implementation plan
# - Gets your approval
# - Implements matching your style
# - Writes tests
# - Runs quality gates

# 2. Monitor progress
/siftcoder:status

# 3. Security check
/siftcoder:security owasp

# 4. Done!
```

**Result:** Authentication added with:
- Matching code style
- Comprehensive tests
- Security validation
- No breaking changes

---

### Scenario 3: Bug in Production

**Situation:** Production issue and you need to fix it safely.

**Workflow:**

```bash
# 1. Investigate (read-only, safe)
/siftcoder:investigate "Payment fails for amounts over $1000"

# Output:
# Root cause identified
# Affected files listed
# Suggested boundaries shown

# 2. Fix with boundaries
/siftcoder:fix "Payment fails for amounts over $1000"

# SiftCoder:
# - Only modifies files you approve
# - Protected files are locked
# - Pre-tool hooks enforce boundaries

# 3. Verify containment
/siftcoder:blast-radius

# Output:
# Modified file tests: ✓ PASS
# Protected area tests: ✓ PASS
# No regressions detected

# 4. Commit fix
git add src/payment.ts
git commit -m "Fix payment amount comparison"
```

**Result:** Bug fixed safely with:
- No unintended changes
- Blast radius verified
- Tests still passing

---

## Time-Saving Tips

### Use Autonomous Workflows

For building complete features:

```bash
/siftcoder:build feature-spec.md
```

SiftCoder will:
- Create implementation plan
- Implement each subtask
- Run quality gates
- Fix issues found
- Generate tests

You save hours of manual work.

### Use Self-Healing

For build/test/lint failures:

```bash
/siftcoder:heal
```

Automatically:
- Runs build/test/lint
- Identifies failures
- Attempts fixes (up to 3 times)
- Retries with different approaches

### Use Quick Documentation

For rapid documentation:

```bash
/siftcoder:document architecture
```

Generates:
- System overview diagrams
- Component hierarchies
- Data flows
- API maps

---

## Solo Developer Tips

### 1. Start with `/understand`

Before doing anything, understand your codebase:

```bash
/siftcoder:understand
```

This teaches SiftCoder your patterns, so future code matches.

### 2. Use `/investigate` Before `/fix`

Always investigate first:

```bash
/siftcoder:investigate "weird bug"
```

Then fix with confidence:

```bash
/siftcoder:fix "weird bug"
```

### 3. Leverage `/status`

Check progress anytime:

```bash
/siftcoder:status
```

See what's happening, what's next, and pause if needed.

### 4. Use Checkpoints

Before risky changes:

```bash
/siftcoder:checkpoint save before-refactor

# Make changes

# If issues:
/siftcoder:rollback before-refactor
```

### 5. Use `/prompt` for Help

Not sure what command to use?

```bash
/siftcoder:prompt
```

Interactive helper builds the perfect command.

---

## Typical Day

As a solo developer, your workflow might be:

**Morning:**
```bash
/siftcoder:status              # Check any running tasks
/siftcoder:heal test           # Fix any test failures
```

**Feature Development:**
```bash
/siftcoder:add-feature "New feature"
```

**Bug Fixes:**
```bash
/siftcoder:investigate "Bug"
/siftcoder:fix "Bug"
/siftcoder:blast-radius
```

**Before Deploy:**
```bash
/siftcoder:security scan       # Security check
/siftcoder:test coverage       # Check coverage
/siftcoder:document architecture # Update docs
```

---

## Advantages for Solo Developers

### Virtual Team
- **Planner** - Breaks down tasks
- **Coder** - Implements code
- **QA Reviewer** - Validates work
- **QA Fixer** - Fixes issues

You're never alone in the development process.

### Safety Nets
- **Boundaries** - Protect your codebase
- **Blast Radius** - Verify no side effects
- **Checkpoints** - Easy rollback
- **Quality Gates** - Auto format, lint, type-check

### Productivity Boosts
- **Autonomous workflows** - Work while you do other things
- **Pattern matching** - Code matches your style
- **Test generation** - Comprehensive tests
- **Documentation** - Auto-generated docs

---

## See Also

- [Workflow: Build New Project](../../05-workflows/build-new-project.md)
- [Workflow: Investigate & Fix](../../05-workflows/investigate-fix.md)
- [Command: /add-feature](../../02-command-reference/by-category/build-workflow.md#add-feature)
