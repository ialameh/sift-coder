# Advanced Topics

**Expert-level SiftCoder techniques and customization**

---

## Overview

This section covers advanced SiftCoder topics for power users who want to customize, extend, and optimize their workflows.

---

## Available Advanced Topics

1. [Performance Optimization](#performance) - Token efficiency, speed optimization
2. [Custom Agents](#custom-agents) - Creating specialized agents
3. [Extending Commands](#extending-commands) - Adding custom commands
4. [Prompt Engineering](#prompt-engineering) - Optimizing AI interactions
5. [State Management](#state-management) - Advanced state control
6. [Integration Patterns](#integration) - CI/CD, hooks, automation

---

## Performance Optimization

### Token Efficiency

```bash
# 1. Check token usage
/siftcoder:budget

# 2. Set budget limits
/siftcoder:budget set 100000

# 3. Optimize context
/siftcoder:budget optimize

# Output:
# 💡 OPTIMIZATION SUGGESTIONS:
#
# 1. Use focus mode to reduce context
#    /siftcoder:focus src/payment/
#
# 2. Use semantic search instead of reading files
#    /siftcoder:search "payment logic"
#
# 3. Use scope to limit file access
#    /siftcoder:scope add specific-files.ts
```

### Focus Mode

```bash
# Focus on specific area
/siftcoder:focus src/payment/

# Benefits:
# - Reduced context
# - Faster responses
# - Lower token usage
# - More relevant suggestions

# Work within focused area
/siftcoder:add-feature "Add refund support"
# [Only sees payment-related files]
```

### Parallel Execution

```bash
# Run independent tasks in parallel
/siftcoder:swarm start "task1, task2, task3"

# Example:
/siftcoder:swarm start "generate-tests, run-linter, type-check"

# Output:
# 🔄 PARALLEL EXECUTION:
#
# Task 1: generate-tests
#   Agent: Tester
#   Status: In Progress
#
# Task 2: run-linter
#   Agent: Reviewer
#   Status: In Progress
#
# Task 3: type-check
#   Agent: Coder
#   Status: In Progress
```

---

## Custom Agents

### Creating Custom Agents

```bash
# 1. Create agent definition
mkdir -p agents/custom
cat > agents/custom/security-specialist.md << 'EOF'
# Agent: Security Specialist

## Role
Specializes in identifying and fixing security vulnerabilities.

## Responsibilities
- Identify security vulnerabilities (OWASP Top 10)
- Suggest security best practices
- Fix security issues
- Validate security fixes

## Tools Available
- Read
- Grep
- Edit
- Bash

## When Invoked
- /security scan command
- /fix for security issues
- During quality gates if security enabled

## Process
1. Scan code for security issues
2. Identify vulnerabilities
3. Prioritize by severity
4. Suggest fixes
5. Validate fixes don't break functionality
EOF

# 2. Create skill that invokes agent
cat > skills/security-specialist/skill.ts << 'EOF'
import { Skill } from '@claude-code/plugin/skill';

export const skill: Skill = {
  name: 'security-specialist',
  description: 'Security vulnerability specialist',
  execute: async (input) => {
    // Invoke security-specialist agent
  }
};
EOF

# 3. Use custom agent
/siftcoder:security scan
# [Uses custom security-specialist agent]
```

### Agent Configuration

```bash
# Configure agent behavior
{
  "agents": {
    "security-specialist": {
      "model": "claude-opus-4-5",
      "temperature": 0.1,
      "maxTokens": 8000,
      "tools": ["Read", "Grep", "Edit", "Bash"],
      "systemPrompt": "You are a security expert..."
    }
  }
}
```

---

## Extending Commands

### Creating Custom Commands

```bash
# 1. Create command file
cat > commands/custom-deploy.md << 'EOF'
description: Deploy application with safety checks
argument-hint: "<environment>"
allowed-tools: [Read, Write, Bash, AskUserQuestion]
workflow: |
  1. Ask user for target environment
  2. Run pre-deployment checks
  3. Create checkpoint
  4. Deploy
  5. Run smoke tests
  6. Rollback if tests fail
EOF

# 2. Implement workflow logic
# [Command is now available as /custom-deploy]

# 3. Use custom command
/siftcoder:custom-deploy production
```

### Command Aliases

```bash
# Create aliases for common workflows
{
  "aliases": {
    "q": "/quick-fix",
    "d": "/deploy",
    "t": "/test"
  }
}

# Use aliases
/q "bug description"  # Equivalent to /quick-fix
```

---

## Prompt Engineering

### Optimizing Prompts

```bash
# 1. Use custom prompts
/siftcoder:prompt "Fix the bug with detailed explanation"

# 2. Provide context
/siftcoder:prompt "Fix authentication bug. Context: User reports login fails after password reset."

# 3. Specify approach
/siftcoder:prompt "Refactor to use factory pattern. Keep existing interface."

# 4. Set constraints
/siftcoder:prompt "Add feature X. Don't modify files in src/legacy/."
```

### Prompt Templates

```bash
# Create reusable prompt templates
{
  "prompts": {
    "bug-fix": "Investate and fix: {description}. Priority: {priority}.",
    "feature": "Add feature: {description}. Requirements: {requirements}.",
    "refactor": "Refactor {module} to use {pattern}."
  }
}

# Use templates
/siftcoder:prompt bug-fix --description "Login fails" --priority "high"
```

---

## State Management

### Advanced Checkpointing

```bash
# 1. Create checkpoint with metadata
/siftcoder:checkpoint save feature-x --metadata "Before adding new feature"

# 2. List checkpoints
/siftcoder:checkpoint list

# 3. Restore with context
/siftcoder:checkpoint restore feature-x

# 4. Delete old checkpoints
/siftcoder:checkpoint delete old-feature
```

### Handoff Between Sessions

```bash
# 1. End session with handoff
/siftcoder:handoff

# Output:
# 📝 HANDOFF SUMMARY:
#
# Current Task: Adding user authentication
# Status: In Progress
# Next Steps: Complete login UI
# Context: [Full context saved]
#
# Resume with: /siftcoder:resume

# 2. Resume session
/siftcoder:resume

# Output:
# ✅ SESSION RESTORED:
#
# Previous Task: Adding user authentication
# Status: In Progress
# Next Steps: Complete login UI
# [Full context restored]
```

### State Synchronization

```bash
# Sync state across machines
/siftcoder:sync

# Configure sync location
{
  "sync": {
    "provider": "github",
    "repo": "my-org/siftcoder-state",
    "branch": "main"
  }
}
```

---

## Integration Patterns

### CI/CD Integration

```bash
# 1. Create CI workflow
cat > .github/workflows/siftcoder.yml << 'EOF'
name: SiftCoder Quality Gates

on: [push, pull_request]

jobs:
  siftcoder:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - name: Run SiftCoder Quality Gates
        run: |
          npx @claude-code/siftcoder quality-gates
          npx @claude-code/siftcoder test coverage
          npx @claude-code/siftcoder security scan
EOF

# 2. Quality gates run automatically on every push
```

### Pre-Commit Hooks

```bash
# 1. Setup pre-commit hooks
cat > .pre-commit-config.yaml << 'EOF'
repos:
  - repo: local
    hooks:
      - id: siftcoder-format
        name: SiftCoder Format
        entry: npx siftcoder format
        language: system

      - id: siftcoder-lint
        name: SiftCoder Lint
        entry: npx siftcoder lint
        language: system

      - id: siftcoder-security
        name: SiftCoder Security
        entry: npx siftcoder security scan
        language: system
EOF

# 2. Install hooks
pre-commit install

# 3. Hooks run automatically on commit
git commit
# [Pre-commit hooks run]
```

### GitHub Actions Integration

```bash
# 1. Automated PR review
cat > .github/workflows/pr-review.yml << 'EOF'
name: SiftCoder PR Review

on: pull_request

jobs:
  review:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - name: Run SiftCoder Review
        run: npx siftcoder review pr
      - name: Comment on PR
        uses: actions/github-script@v6
        with:
          script: |
            const fs = require('fs');
            const review = fs.readFileSync('siftcoder-review.md', 'utf8');
            github.rest.issues.createComment({
              issue_number: context.issue.number,
              owner: context.repo.owner,
              repo: context.repo.repo,
              body: review
            });
EOF

# 2. Automatic PR reviews on every PR
```

---

## Advanced Configuration

### Workflow Modes

```bash
# Autonomous mode (full automation)
{
  "mode": "autonomous",
  "autoContinue": true,
  "maxIterations": 10
}

# Interactive mode (approve each step)
{
  "mode": "interactive",
  "autoContinue": false
}

# Pair mode (AI suggests, you approve)
{
  "mode": "pair"
}
```

### Quality Gates

```bash
# Custom quality gates
{
  "qualityGates": {
    "format": {
      "enabled": true,
      "command": "prettier --check",
      "fixCommand": "prettier --write"
    },
    "lint": {
      "enabled": true,
      "command": "eslint src/",
      "fixCommand": "eslint --fix src/"
    },
    "typeCheck": {
      "enabled": true,
      "command": "tsc --noEmit"
    },
    "tests": {
      "enabled": true,
      "command": "jest",
      "coverageThreshold": 80
    },
    "custom": [
      "npm run custom-check",
      "python -m pytest"
    ]
  }
}
```

### Self-Healing Configuration

```bash
# Advanced healing
{
  "healing": {
    "maxRetries": 5,
    "autoLintFix": true,
    "addToGotchas": true,
    "respectBoundaries": true,
    "escalateAfterMax": true,
    "strategies": [
      "alternativeApproach",
      "simplifyLogic",
      "addLogging",
      "consultDocumentation",
      "reduceScope"
    ],
    "learnFromFailures": true
  }
}
```

---

## Troubleshooting

### Debug Mode

```bash
# Enable debug logging
{
  "debug": true,
  "logLevel": "verbose"
}

# View execution trace
/siftcoder:trace

# Output:
# 🔍 EXECUTION TRACE:
#
# 1. Planner Agent started
#    - Read: src/payment/index.ts
#    - Plan created: 3 subtasks
#
# 2. Coder Agent started
#    - Edit: src/payment/index.ts
#    - Run: npm test
#    - Tests passed
#
# 3. QA Reviewer Agent started
#    - All acceptance criteria met
#
# 4. Task completed
```

### Performance Profiling

```bash
# Profile workflow
/siftcoder:profile

# Output:
# 📊 PERFORMANCE PROFILE:
#
# Task: Add user authentication
# Total time: 5m 23s
#
# Breakdown:
# - Planning: 45s
# - Coding: 3m 12s
# - Testing: 1m 8s
# - Review: 18s
#
# Token usage: 45,234
#
# Bottlenecks:
# - Coding phase took longest
# - Consider breaking into smaller tasks
```

---

## See Also

- [Configuration Reference](../12-appendices/configuration.md)
- [Best Practices](../09-best-practices/index.md)
- [Workflow Reference](../05-workflows/index.md)
