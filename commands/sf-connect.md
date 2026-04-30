---
description: Salesforce integration setup — Named Credentials, External Credentials, OAuth flows
argument-hint: [named-cred|external-cred|oauth] [--target-org <alias>]
allowed-tools: Bash, Read, Edit
---

# /siftcoder:sf-connect

Configure outbound integrations. Always prefer Named Credentials over hardcoded URLs in Apex.

## Subactions

- `named-cred <name> --url <url>` — create Named Credential metadata (sfdx source)
- `external-cred <name>` — create External Credential
- `oauth <name>` — set up Auth Provider + OAuth flow (Salesforce ↔ external)

Generates source-format metadata; commit to git, deploy via `sf-deploy`.
