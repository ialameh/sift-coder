---
description: Salesforce deploy — validate, deploy, diff, rollback (uses `sf` CLI)
argument-hint: [validate|deploy|preview|quick|rollback] [--target-org <alias>]
allowed-tools: Bash, Read, Grep, Glob
---

# /siftcoder:sf-deploy

Wraps the standard sfdx deploy flow. Pulls in the `salesforce-deploy` skill rules.

## Subactions

- `validate` — `sf project deploy validate --source-dir force-app --test-level RunLocalTests`
- `preview` — show diffs vs target org before deploy
- `deploy` — full deploy (validates first unless `--quick`)
- `quick <jobId>` — quick-deploy from a previously validated job id
- `rollback` — deploy the previous git tag to the target org

Always preview before production. Always run with `--test-level RunLocalTests` for prod.

See `skills/salesforce-deploy/SKILL.md`.
