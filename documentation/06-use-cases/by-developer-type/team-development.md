# Use Case: Team Development

**Collaborative workflows and team coordination**

---

## Overview

Team development requires coordination, code review, shared standards, and continuous integration. SiftCoder provides tools for effective collaboration.

---

## Team Workflows

### Workflow 1: Onboarding New Team Members

```bash
# New developer joins:

# 1. Generate onboarding guide
/siftcoder:onboard

# Output:
# ✓ Project structure documentation
# ✓ Setup instructions
# ✓ Development workflow guide
# ✓ Key patterns and conventions

# 2. Explain architecture
/siftcoder:explain architecture

# 3. Create learning journey
/siftcoder:learn codebase
```

### Workflow 2: Collaborative Feature Development

```bash
# Developer A: Start feature
/siftcoder:add-feature "User search functionality"

# Developer A: Create checkpoint before PR
/siftcoder:checkpoint save user-search-feature

# Developer B: Review work
/siftcoder:review pr

# Developer B: Request changes if needed
[Review comments added]

# Developer A: Address feedback
/siftcoder:fix "PR feedback"

# Team: Approve and merge
[git workflow]
```

### Workflow 3: Code Review Process

```bash
# 1. Automated review
/siftcoder:review pr

# SiftCoder checks:
# ✓ Code quality
# ✓ Test coverage
# ✓ Security issues
# ✓ Performance concerns
# ✓ Documentation

# 2. Human review
[Team members review PR]

# 3. Address feedback
/siftcoder:fix "PR review comments"

# 4. Final validation
/siftcoder:quality-gates
```

---

## Branching Strategies

### Feature Branch Workflow

```bash
# 1. Create feature branch
git checkout -b feature/user-auth

# 2. Develop feature
/siftcoder:add-feature "User authentication"

# 3. Test locally
npm test
/siftcoder:test coverage

# 4. Commit and push
git add .
git commit -m "Add user authentication"
git push origin feature/user-auth

# 5. Create PR
gh pr create --title "Add user authentication"

# 6. Automated review
/siftcoder:review pr

# 7. Address feedback
/siftcoder:fix "PR comments"

# 8. Merge
gh pr merge
```

### Trunk-Based Development

```bash
# 1. Small, frequent changes
/siftcoder:add-feature "Add user avatar"

# 2. Quick test
npm test

# 3. Commit to main
git add .
git commit -m "Add user avatar"
git push

# 4. CI runs automatically
[CI pipeline: test, lint, type-check]
```

---

## Continuous Integration

### CI Configuration

```bash
# 1. Generate CI config
/siftcoder:add-feature "GitHub Actions workflow"

# 2. Quality gates in CI
{
  "qualityGates": {
    "format": true,
    "lint": true,
    "typeCheck": true,
    "tests": true
  }
}

# 3. Self-healing in CI
{
  "healing": {
    "maxRetries": 3,
    "autoLintFix": true,
    "escalateAfterMax": true
  }
}
```

### Pre-Commit Hooks

```bash
# 1. Setup hooks
/siftcoder:add-feature "Pre-commit hooks"

# 2. Configure quality checks
{
  "qualityGates": {
    "format": true,   # Prettier
    "lint": true      # ESLint
  }
}

# 3. Auto-fix on commit
git commit -m "Add feature"
# [Hooks run, auto-fix issues]
```

---

## Team Standards

### Code Style

```bash
# 1. Detect team patterns
/siftcoder:understand

# 2. Document conventions
/siftcoder:document architecture

# 3. Enforce with quality gates
{
  "qualityGates": {
    "format": true,   # Auto-format
    "lint": true      # Enforce rules
  }
}
```

### Architecture Standards

```bash
# 1. Document architecture
/siftcoder:document architecture

# 2. Review patterns
/siftcoder:review architecture

# 3. Generate diagrams
/siftcoder:document architecture --diagrams
```

---

## Collaboration Tools

### Knowledge Sharing

```bash
# 1. Document decisions
/siftcoder:document technical

# 2. Share learning
/siftcoder:handoff
# [Persists context for team]

# 3. Resume from checkpoint
/siftcoder:checkpoint restore feature-x
```

### Pair Programming

```bash
# 1. Start pair mode
/siftcoder:pair

# 2. AI suggests, you approve
[Collaborative development]

# 3. Learn from AI
[See patterns and approaches]
```

### Swarm Mode (Parallel Tasks)

```bash
# 1. Split work
/siftcoder:swarm start "task1, task2, task3"

# 2. Parallel execution
[Multiple agents work independently]

# 3. Merge results
[Combine completed tasks]
```

---

## Pull Request Automation

### PR Template

```bash
# 1. Generate PR template
/siftcoder:add-feature "PR template"

# Template includes:
# - Description
# - Testing done
# - Screenshots (if UI)
# - Breaking changes
# - Checklist
```

### Automated PR Review

```bash
# 1. Create PR
gh pr create

# 2. Auto-review
/siftcoder:review pr

# Output:
# ✓ Code quality assessment
# ✓ Test coverage check
# ✓ Security scan
# ✓ Performance analysis
# ✓ Documentation review
# ✓ Suggestions for improvements

# 3. Fix issues found
/siftcoder:fix "PR review feedback"

# 4. Re-review
/siftcoder:review pr
```

---

## Bug Triage

### Team Bug Workflow

```bash
# 1. Investigate bug
/siftcoder:investigate "Issue description"

# 2. Document findings
/siftcoder:document technical

# 3. Assign to developer
[Team assignment]

# 4. Developer fixes
/siftcoder:fix "Issue"

# 5. Team reviews
/siftcoder:review pr

# 6. Verify fix
npm test
/siftcoder:blast-radius
```

---

## Release Process

### Pre-Release Checklist

```bash
# 1. Run full test suite
npm test
/siftcoder:test coverage

# 2. Security scan
/siftcoder:security scan

# 3. Documentation
/siftcoder:document architecture
/siftcoder:document user-manual

# 4. Performance check
/siftcoder:optimize

# 5. Create release notes
/siftcoder:document changelog
```

### Release

```bash
# 1. Tag release
git tag v1.0.0

# 2. Push tag
git push origin v1.0.0

# 3. Deploy
npm run deploy

# 4. Monitor
/siftcoder:monitor
```

---

## Team Best Practices

### ✅ DO

- Use checkpoints before major changes
- Run quality gates before committing
- Document architectural decisions
- Review PRs with AI assistance
- Share knowledge with handoff

### ❌ DON'T

- Skip tests to save time
- Ignore quality gate failures
- Merge without review
- Make breaking changes without discussion
- Work in isolation without communication

---

## Example: Team Feature Sprint

```bash
# Sprint: Add multi-factor authentication

# Day 1: Planning
/siftcoder:spec-analyzer mfa-spec.md
/siftcoder:improve-spec mfa-spec.md

# Day 2-3: Development
Developer A:
/siftcoder:add-feature "MFA backend API"

Developer B:
/siftcoder:add-feature "MFA UI components"

# Day 4: Integration
/siftcoder:bridge "Frontend MFA" "Backend MFA"

# Day 5: Testing & Review
/siftcoder:test generate
npm test
/siftcoder:security scan
/siftcoder:review pr

# Day 6: Documentation & Deploy
/siftcoder:document user-manual
/siftcoder:document technical
git push
[CI/CD deploys]
```

---

## Quick Reference

| Task | Command |
|------|---------|
| **Onboard** | `/onboard` |
| **Review PR** | `/review pr` |
| **Pair program** | `/pair` |
| **Share context** | `/handoff` |
| **Swarm tasks** | `/swarm start` |
| **Document** | `/document technical` |

---

## See Also

- [Workflow: Add Feature](../../05-workflows/add-feature.md)
- [Best Practices: Team Adoption](../../09-best-practices/index.md)
- [Command: Review](../../02-command-reference/by-category/review-workflow.md)
