---
description: Generate enterprise Apex patterns — FFLib Selector, Domain, Service, UnitOfWork
argument-hint: [selector|domain|service|uow] <ObjectOrName>
allowed-tools: Read, Edit, Bash
---

# /siftcoder:apex-patterns

Scaffold FFLib enterprise patterns.

## Subactions

- `selector <Object>` — generate `<Object>sSelector.cls` extending `fflib_SObjectSelector`
- `domain <Object>` — generate `<Object>s.cls` (domain class) + factory
- `service <Name>` — generate `<Name>Service.cls` interface + impl + locator
- `uow [objects]` — generate `Application.cls` with the UnitOfWork registration

Includes test classes. Uses `skills/salesforce-apex/SKILL.md` for naming and bulk safety.
