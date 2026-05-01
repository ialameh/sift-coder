---
description: Salesforce test generation, coverage analysis, bulk patterns
argument-hint: [generate|coverage|run] [class-name]
allowed-tools: Bash, Read, Edit, Grep, Glob
---

# /siftcoder:sf-test

## Subactions

- `generate <ClassName>` — create a test class scaffolded with TestDataFactory + bulk pattern
- `coverage` — run `sf apex run test --code-coverage`, surface classes &lt; 75%
- `run [class]` — run a specific test class
- `factory <Object>` — generate or update TestDataFactory entries for an object

Pulls rules from `skills/salesforce-test/SKILL.md`. Uses the `apex-bulkifier` agent for bulk-safety verification of the code under test.
