# Use Case: Salesforce Developer

**Salesforce-specific development workflows**

---

## Overview

Salesforce development involves unique challenges - governor limits, bulkification, API patterns, and deployment complexity. SiftCoder provides 16+ specialized commands to help.

---

## Common Salesforce Workflows

### Workflow 1: Apex Development

```bash
# 1. Analyze Apex code
/siftcoder:apex analyze force-app/main/default/classes/

# 2. Find anti-patterns
[Shows SOQL in loops, hardcoded IDs, etc.]

# 3. Bulkify if needed
/siftcoder:apex bulkify

# 4. Generate tests
/siftcoder:sf-test generate

# 5. Deploy
/siftcoder:sf-deploy validate
```

### Workflow 2: LWC Development

```bash
# 1. Create LWC component
/siftcoder:lwc create accountList

# 2. Component created with:
#    - accountList.html
#    - accountList.js
#    - accountList.css
#    - accountList.js-meta.xml
#    - accountList.test.js

# 3. Generate tests
/siftcoder:lwc test accountList

# 4. Debug if needed
/siftcoder:lwc-debug wire accountList

# 5. Deploy
/siftcoder:sf-deploy deploy
```

### Workflow 3: Schema Development

```bash
# 1. Create custom object
/siftcoder:schema create

# 2. Generate ERD diagram
/siftcoder:schema erd

# 3. Plan migration
/siftcoder:schema-migrate plan

# 4. Deploy
/siftcoder:schema-migrate deploy
```

### Workflow 4: Deployment

```bash
# 1. Validate deployment
/siftcoder:sf-deploy validate

# 2. Deploy to org
/siftcoder:sf-deploy deploy

# 3. Check for issues
# [If problems, rollback]
/siftcoder:sf-deploy rollback
```

---

## Key Salesforce Commands

| Category | Commands |
|----------|----------|
| **Apex** | `/apex`, `/apex analyze`, `/apex bulkify`, `/apex-patterns` |
| **LWC** | `/lwc`, `/lwc create`, `/lwc test`, `/lwc-debug` |
| **Schema** | `/schema`, `/schema create`, `/schema erd`, `/schema-migrate` |
| **Testing** | `/sf-test`, `/sf-test-data` |
| **Deployment** | `/sf-deploy`, `/sf-package` |
| **Architecture** | `/sf-architect`, `/sf-architect-review` |

---

## Example: Complete LWC Workflow

```bash
# 1. Create component
/siftcoder:lwc create accountSelector

# Output:
# ✓ accountSelector.html created
# ✓ accountSelector.js created
# ✓ accountSelector.css created
# ✓ accountSelector.js-meta.xml created
# ✓ accountSelector.test.js created

# 2. Review the component
cat force-app/main/default/lwc/accountSelector/

# 3. Run tests
sfdx force:source:test:run -l apex

# 4. Debug if tests fail
/siftcoder:lwc-debug wire accountSelector

# 5. Deploy
sfdx project:deploy --sourcepath force-app/main/default

# 6. Verify in org
[Open org and test component]
```

---

## Example: Apex Bulkification

```bash
# 1. Analyze for governor limit issues
/siftcoder:apex analyze

# Output:
# 🚨 GOVERNOR LIMIT ISSUES:
#
# 1. SOQL in loop (line 45)
#    File: triggers/AccountTrigger.handler
#    Issue: Query inside loop, will hit 150 query limit
#    Impact: High
#
# 2. Non-bulkified DML (line 78)
#    File: services/AccountService.create
#    Issue: Insert in loop, will hit 150 DML limit
#    Impact: Critical

# 2. Bulkify the code
/siftcoder:apex bulkify

# Converts to bulk-safe patterns:
# - List<Database.QueryLocator> queries
# - Database.update(list)
# - Database.insert(list)
```

---

## Governor Limits Reference

| Limit | Limit | Notes |
|-------|-------|-------|
| SOQL queries | 100 per transaction | Avoid in loops |
| DML statements | 150 per transaction | Use bulk operations |
| Callouts | 100 | External API calls |
| Email invocations | 10 | Consider batch |
| Heap size | 6 MB | For sync exec |
| SOQL records retrieved | 50,000 | Use offset/PageInfo |

---

## See Also

- [Workflow: Salesforce Development](../../05-workflows/salesforce-development.md)
- [Command Reference: Salesforce](../02-command-reference/by-category/salesforce-development.md)
