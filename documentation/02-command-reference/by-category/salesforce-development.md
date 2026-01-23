# SALESFORCE DEVELOPMENT

**Comprehensive Salesforce development commands**

---

## Overview

SiftCoder includes 16+ specialized commands for Salesforce development covering:

- **Apex Development** - Code analysis, bulkification, patterns
- **Lightning Web Components** - Create, test, debug
- **Schema Management** - Create, visualize, migrate
- **Integration** - Named credentials, webhooks
- **Testing** - Apex tests, test data
- **Deployment** - Validate, deploy, rollback
- **Architecture** - Data models, capacity planning

---

## Quick Reference

### Apex Development

| Command | Purpose | Link |
|---------|---------|------|
| `/apex` | Apex code analysis | [Details](#apex-development) |
| `/apex analyze` | Deep analysis | [Details](#apex-development) |
| `/apex bulkify` | Convert to bulk-safe patterns | [Details](#apex-development) |
| `/apex-patterns` | Generate enterprise patterns | [Details](#apex-development) |

### Lightning Web Components

| Command | Purpose | Link |
|---------|---------|------|
| `/lwc` | LWC development | [Details](#lightning-web-components) |
| `/lwc create <name>` | Create new component | [Details](#lightning-web-components) |
| `/lwc test <name>` | Generate tests | [Details](#lightning-web-components) |
| `/lwc-debug` | Debug LWC issues | [Details](#lightning-web-components) |

### Schema Management

| Command | Purpose | Link |
|---------|---------|------|
| `/schema` | Schema management | [Details](#schema-management) |
| `/schema create` | Create custom object/field | [Details](#schema-management) |
| `/schema erd` | Generate ERD diagram | [Details](#schema-management) |
| `/schema-migrate` | Migration management | [Details](#schema-management) |

### Deployment & Testing

| Command | Purpose | Link |
|---------|---------|------|
| `/sf-deploy` | Deployment management | [Details](#deployment-testing) |
| `/sf-test` | Apex test generation | [Details](#deployment-testing) |
| `/sf-test-data` | Test data management | [Details](#deployment-testing) |
| `/sf-debug` | Debug log analysis | [Details](#deployment-testing) |

---

## Apex Development

### /apex

Analyze Apex code for anti-patterns, bulkification issues, governor limits.

```bash
/siftcoder:apex analyze force-app/main/default/classes/
```

**Finds:**
- SOQL queries inside loops
- Hardcoded IDs
- Missing sharing rules
- Governor limit violations

### /apex-patterns

Generate enterprise Apex patterns (FFLib).

```bash
/siftcoder:apex-patterns AccountDomain
```

**Generates:**
- Domain class
- Selector class
- Service class
- Unit of Work pattern
- Test factory

---

## Lightning Web Components

### /lwc create

Create a new Lightning Web Component with best practices.

```bash
/siftcoder:lwc create accountList
```

**Creates:**
- `accountList.html` - Component markup
- `accountList.js` - Component logic
- `accountList.css` - Styles
- `accountList.js-meta.xml` - Metadata
- `accountList.test.js` - Jest tests

### /lwc test

Generate Jest tests for LWC component.

```bash
/siftcoder:lwc test accountList
```

### /lwc-debug

Debug LWC issues (wire, lifecycle, performance).

```bash
/siftcoder:lwc-debug wire accountList
```

---

## Schema Management

### /schema erd

Generate Entity Relationship Diagram.

```bash
/siftcoder:schema erd
```

**Generates Mermaid diagram showing:**
- All custom objects
- Standard objects
- Relationships
- Fields

### /schema-migrate

Plan and execute schema migrations.

```bash
/siftcoder:schema-migrate plan
/siftcoder:schema-migrate deploy
```

---

## Deployment

### /sf-deploy

Deployment management.

```bash
# Validate deployment
/siftcoder:sf-deploy validate

# Deploy to org
/siftcoder:sf-deploy deploy

# Check differences
/siftcoder:sf-deploy diff

# Rollback if needed
/siftcoder:sf-deploy rollback
```

---

## Common Workflows

### Workflow 1: Apex Development

```bash
# 1. Analyze Apex code
/siftcoder:apex analyze

# 2. Fix governor limit issues
/siftcoder:apex bulkify

# 3. Generate tests
/siftcoder:sf-test generate

# 4. Deploy
/siftcoder:sf-deploy deploy
```

### Workflow 2: LWC Development

```bash
# 1. Create component
/siftcoder:lwc create accountSelector

# 2. Generate tests
/siftcoder:lwc test accountSelector

# 3. Debug if needed
/siftcoder:lwc-debug wire accountSelector

# 4. Deploy
/siftcoder:sf-deploy deploy
```

### Workflow 3: Schema Development

```bash
# 1. Create object
/siftcoder:schema create

# 2. Generate diagram
/siftcoder:schema erd

# 3. Plan migration
/siftcoder:schema-migrate plan

# 4. Deploy
/siftcoder:schema-migrate deploy
```

---

## See Also

- [Workflow: Salesforce Development](../../05-workflows/salesforce-development.md)
- [Command: /sf-architect](./sf-architect.md) - Architecture tools
