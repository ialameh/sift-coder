---
description: Salesforce package development — unlocked packages, versioning, dependencies
argument-hint: [create|version|install|uninstall]
allowed-tools: Bash, Read
---

# /siftcoder:sf-package

Wrap `sf package` workflow.

## Subactions

- `create <name>` — create unlocked package
- `version create` — create new package version (validates, runs tests)
- `version list` — list package versions
- `install <version-id> --target-org <alias>`
- `uninstall <package-id> --target-org <alias>`

Default to unlocked over managed for in-house packages.
