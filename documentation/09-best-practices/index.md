# SiftCoder Best Practices

**Workflow patterns and proven techniques**

---

## Overview

This section contains best practices for using SiftCoder effectively, covering workflow patterns, safety, testing, and team adoption.

---

## Core Best Practices

### 1. Always Investigate Before Fixing

```bash
# RIGHT
/siftcoder:investigate "Bug description"
/siftcoder:fix "Bug description"

# WRONG
/siftcoder:fix "Bug description"  # Without investigation
```

**Why:** Investigation ensures you understand the root cause before making changes.

### 2. Use Boundaries for Safety

```bash
# 1. Investigate shows affected files
/siftcoder:investigate "Issue"

# 2. Review suggested boundaries
/siftcoder:scope show

# 3. Adjust if needed
/siftcoder:scope add extra-file.ts

# 4. Fix with boundaries
/siftcoder:fix "Issue"

# 5. Verify containment
/siftcoder:blast-radius
```

### 3. Let Quality Gates Run

SiftCoder automatically runs:
- Format (Prettier/Black/etc.)
- Lint (ESLint/Pylint/etc.)
- Type check (TypeScript/mypy/etc.)
- Tests

**Don't skip these** - they catch issues early.

---

## Workflow Patterns

### Build Pattern

**For new projects:**

```bash
# 1. Create good specification
# [Write detailed spec with acceptance criteria]

# 2. Build autonomously
/siftcoder:build spec.md

# 3. Generate documentation
/siftcoder:document architecture
```

### Maintain Pattern

**For existing code:**

```bash
# 1. Understand patterns first
/siftcoder:understand

# 2. Add feature (matches patterns)
/siftcoder:add-feature "New feature"

# 3. Validate
/siftcoder:test coverage
```

### Fix Pattern

**For bugs:**

```bash
# 1. Investigate (read-only)
/siftcoder:investigate "Bug"

# 2. Fix (with boundaries)
/siftcoder:fix "Bug"

# 3. Verify (blast radius)
/siftcoder:blast-radius

# 4. Test
npm test
```

---

## Safety First

### Checkpoints

Before risky changes:

```bash
/siftcoder:checkpoint save before-risky-change

# Make changes

# If issues:
/siftcoder:rollback before-risky-change
```

### Blast Radius

After fixes:

```bash
/siftcoder:blast-radius
```

Verifies:
- Modified file tests pass
- Protected area tests pass
- No regressions

### Scope Management

```bash
# View what can be modified
/siftcoder:scope show

# Add files to scope
/siftcoder:scope add src/file.ts

# Remove from scope (protect)
/siftcoder:scope remove src/protected.ts
```

---

## Testing Best Practices

### Generate Tests First

For TDD:

```bash
/siftcoder:tdd "Feature description"
```

SiftCoder writes tests first, then code.

### Test Coverage

```bash
# Check coverage
/siftcoder:test coverage

# Generate missing tests
/siftcoder:test generate src/uncovered/
```

### Fix Flaky Tests

```bash
/siftcoder:test flaky --fix
```

Detects and fixes:
- Race conditions
- Timing issues
- Missing awaits

---

## Documentation Habits

### Document Early and Often

```bash
# After completing features
/siftcoder:document architecture
```

### Keep Docs Updated

After changes:
```bash
# Update architecture docs
/siftcoder:document architecture

# Update code docs
/siftcoder:document code src/changed/
```

---

## Session Management

### Checkpoints for Safety

```bash
# Before risky work
/siftcoder:checkpoint save <name>

# Continue work
[Make changes]

# If needed, restore
/siftcoder:checkpoint restore <name>
```

### Handoff for Continuity

```bash
# End of day
/siftcoder:handoff

# Next day, resume
/siftcoder:resume
```

---

## Team Adoption

### Getting Started

1. **Start with `/understand`**
   - Learns your codebase patterns
   - Stores for future use

2. **Use `/pair` for learning**
   - Interactive pair programming
   - See how SiftCoder works

3. **Review AI suggestions**
   - Don't accept blindly
   - Learn from recommendations

### Progressive Adoption

**Week 1:**
```bash
/siftcoder:understand        # Learn patterns
/siftcoder:investigate bugs  # Safe exploration
```

**Week 2:**
```bash
/siftcoder:add-feature     # Add features
siftcoder:document code    # Generate docs
```

**Week 3+:**
```bash
/siftcoder:build specs     # Full autonomous
/siftcoder:heal            # Self-healing
```

---

## Performance Tips

### Token Efficiency

```bash
# Check usage
/siftcoder:budget

# Set budget if needed
/siftcoder:budget set 100000

# Get optimization tips
/siftcoder:budget optimize
```

### Use Focus Mode

```bash
# Focus on specific area
/siftcoder:focus src/payment/

# Reduces context, saves tokens
```

---

## Common Mistakes to Avoid

### ❌ Don't: Skip Investigation

```bash
# WRONG
/siftcoder:fix "Bug"  # No investigation

# RIGHT
/siftcoder:investigate "Bug"
siftcoder:fix "Bug"
```

### ❌ Don't: Ignore Quality Gates

```bash
# WRONG
# Disable lint to ship faster

# RIGHT
# Let quality gates run
# Fix issues they find
```

### ❌ Don't: Build Bad Specs

```bash
# WRONG
# Vague spec leads to bad project

# RIGHT
# Detailed spec with acceptance criteria
```

### ❌ Don't: Skip Documentation

```bash
# WRONG
# We'll document later
# (later never comes)

# RIGHT
# Document as you go
/siftcoder:document architecture
```

---

## Quick Reference

| Task | Best Practice |
|------|---------------|
| **New project** | `/build` with detailed spec |
| **Add feature** | `/understand` first, then `/add-feature` |
| **Bug fix** | `/investigate` → `/fix` → `/blast-radius` |
| **Documentation** | `/document architecture` → `/document code` |
| **Tests** | `/test generate` → `/test coverage` |
| **Security** | `/security scan` before deploy |

---

## See Also

- [Workflow Guides](../05-workflows/index.md) - Step-by-step workflows
- [Decision Guide](../07-decision-guides/choosing-the-right-command.md) - Which command to use
- [Troubleshooting](../01-getting-started/troubleshooting.md) - Common issues
