---
description: Salesforce schema management — objects, fields, relationships, ERD diagrams
argument-hint: [object|field|erd] [args]
allowed-tools: Read, Edit, Bash
---

# /siftcoder:schema

## Subactions

- `object <Name>` — create custom object metadata (with Name field, security)
- `field <Object> <FieldName> <Type>` — add a custom field
- `erd [--scope <objects>]` — generate Mermaid ERD from current metadata
- `migrate` — diff + plan a schema change against target org (delegates to schema migration flow)

Generates source-format metadata. Deploy via `/siftcoder:sf-deploy validate`.
