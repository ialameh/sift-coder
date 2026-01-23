# Workflow: Salesforce Development

**Comprehensive Salesforce development workflow**

---

## Overview

This workflow guides you through Salesforce development tasks:

1. Apex code analysis and bulkification
2. Lightning Web Components (LWC) development
3. Schema management
4. Deployment validation

**Time Estimate:** Varies by task

**Difficulty:** ⭐⭐⭐ Advanced (requires Salesforce knowledge)

---

## Quick Start

```bash
# Analyze Apex code
/siftcoder:apex analyze force-app/main/default/classes/

# Create LWC with tests
/siftcoder:lwc create accountList

# Generate schema diagrams
/siftcoder:schema erd

# Validate deployment
/siftcoder:sf-deploy validate
```

---

## Common Workflows

### Workflow 1: Apex Development

```bash
# 1. Analyze Apex code
/siftcoder:apex analyze

# 2. Check for governor limits
/siftcoder:apex bulkify

# 3. Generate enterprise patterns
/siftcoder:apex-patterns AccountDomain

# 4. Create tests
/siftcoder:sf-test generate force-app/main/default/classes/
```

### Workflow 2: LWC Development

```bash
# 1. Create component
/siftcoder:lwc create accountList

# 2. Generate tests
/siftcoder:lwc test accountList

# 3. Debug if needed
/siftcoder:lwc-debug wire accountList
```

### Workflow 3: Schema Changes

```bash
# 1. Create object
/siftcoder:schema create

# 2. Generate ERD
/siftcoder:schema erd

# 3. Plan migration
/siftcoder:schema-migrate plan

# 4. Deploy
/siftcoder:sf-deploy deploy
```

---

## Commands Reference

| Command | Purpose |
|---------|---------|
| `/apex analyze` | Apex code analysis |
| `/apex bulkify` | Convert to bulk-safe patterns |
| `/apex-patterns` | Generate enterprise patterns |
| `/lwc create` | Create LWC component |
| `/lwc test` | Generate LWC tests |
| `/schema erd` | Generate entity diagrams |
| `/sf-deploy` | Deployment management |

---

## See Also

- [Salesforce Commands](../02-command-reference/by-category/salesforce-development.md)
- [Workflow: Build New Project](build-new-project.md)
