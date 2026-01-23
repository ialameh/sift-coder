# Use Cases

**Real-world scenarios and examples**

This section provides practical use cases organized by developer type, task type, and problem type to help you find relevant examples for your situation.

---

## Browse By Category

### By Developer Type
- [Solo Developer](by-developer-type/solo-developer.md) - Individual workflows
- [Salesforce Developer](by-developer-type/salesforce-developer.md) - Salesforce-specific
- [Full-Stack Developer](by-developer-type/fullstack-developer.md) - End-to-end development
- [Team Lead](by-developer-type/team-lead.md) - Team collaboration patterns
- [New Developer](by-developer-type/new-developer.md) - Learning and onboarding

### By Task Type
- [New Project](by-task-type/new-project.md) - Starting from scratch
- [Adding Features](by-task-type/adding-features.md) - Feature development
- [Debugging Production](by-task-type/debugging-production.md) - Production issues
- [Documentation Generation](by-task-type/documentation-generation.md) - Creating docs
- [Legacy Codebase](by-task-type/legacy-codebase.md) - Working with legacy code
- [Performance Optimization](by-task-type/performance-optimization.md) - Improving performance
- [Security Audit](by-task-type/security-audit.md) - Security scanning

### By Problem Type
- [Can't Log In](by-problem-type/cant-login.md) - Authentication issues
- [Tests Failing](by-problem-type/tests-failing.md) - Test failures
- [Slow Performance](by-problem-type/slow-performance.md) - Performance issues
- [Memory Leaks](by-problem-type/memory-leaks.md) - Memory issues
- [Deployment Failures](by-problem-type/deployment-failures.md) - Deployment problems

---

## Quick Examples

### Common Scenarios

#### "I inherited a legacy codebase"
```bash
/siftcoder:understand --deep
/siftcoder:test coverage
/siftcoder:document architecture
```

#### "Tests are failing and I don't know why"
```bash
/siftcoder:investigate "Test X is failing"
/siftcoder:test flaky
/siftcoder:fix "Root cause from investigation"
```

#### "Need to add authentication"
```bash
/siftcoder:add-feature "Add JWT authentication"
/siftcoder:security owasp
/siftcoder:test generate src/auth/
```

#### "Code is slow"
```bash
/siftcoder:perf analyze src/services/
/siftcoder:optimize "Database queries in reports"
```

#### "Generate documentation"
```bash
/siftcoder:document architecture
/siftcoder:document code src/
/siftcoder:document user-manual
```

---

## Related Documentation

- [Workflow Guides](../05-workflows/index.md) - Step-by-step tutorials
- [Command Reference](../02-command-reference/index.md) - All commands
- [Decision Guide](../07-decision-guides/choosing-the-right-command.md) - Which command to use
