---
name: salesforce-deploy
description: Use when deploying Salesforce metadata — package.xml, source-format/metadata-format, validate, deploy, diff, rollback, scratch orgs, sandboxes, production.
paths: '**/*.cls,**/*.trigger,**/*.apex,**/lwc/**,**/aura/**,**/objects/**,**/*.object-meta.xml,sfdx-project.json,**/flows/**,**/flexipages/**,**/permissionsets/**,**/profiles/**'
---

# Salesforce deploy skill

## Source vs metadata format
- **Source format** (sfdx, default): one file per metadata type, friendly to git
- **Metadata format** (legacy): single `package.xml` + folder structure, used for production deploys via change sets / migration tool

## Standard flow (sfdx)

```bash
# auth
sf org login web -a my-sandbox

# validate (no commits, runs tests)
sf project deploy validate --source-dir force-app --test-level RunLocalTests --target-org my-sandbox

# deploy (after validate passes)
sf project deploy start --source-dir force-app --test-level RunLocalTests --target-org my-sandbox

# quick deploy from a validated package
sf project deploy quick --job-id 0Af... --target-org my-sandbox
```

## Diff before deploy

```bash
# what's different from the org?
sf project retrieve preview --target-org my-sandbox --source-dir force-app
sf project deploy preview --target-org my-sandbox --source-dir force-app
```

Always preview before a prod deploy. The preview reports adds/changes/deletes.

## Tests

- `--test-level NoTestRun` — only sandboxes, never prod
- `--test-level RunSpecifiedTests --tests MyTest1,MyTest2` — fastest validation
- `--test-level RunLocalTests` — required for production deploys (skips managed-package tests)
- `--test-level RunAllTestsInOrg` — slow, only when needed for compliance

## Rollback

There is no native rollback in Salesforce. Strategies:
- Tag the previous successful deploy SHA in git
- Validate the previous version against the org and quick-deploy it on failure
- Pre-deploy: take metadata snapshot via `sf project retrieve start --metadata <list>`

## Common deploy errors

- **`Cannot find component`** — destructive change order issue. Use destructive changes pre-deploy.
- **`Test coverage failure`** — run `sf apex run test --code-coverage` locally, find &lt; 75% classes.
- **`Field not visible`** — profile/permset diff between source and target org.
- **`InvalidCrossReference`** — referenced record id doesn't exist in target org. Use `sf data import` for reference data.

## Scratch orgs

```bash
sf org create scratch --definition-file config/project-scratch-def.json --alias my-scratch --duration-days 7
sf project deploy start --source-dir force-app --target-org my-scratch
```

## CI/CD pattern

1. PR opens → validate against integration sandbox with `--test-level RunLocalTests`
2. PR merged → deploy to integration sandbox with `--quick` from validated job-id
3. Release branch → validate against UAT
4. UAT signoff → quick-deploy to production
