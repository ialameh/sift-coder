# Salesforce in SiftCoder

SiftCoder ships first-class Salesforce support because Claude Code has no native domain bias for it.

## Surface

### Skills (11)

- `salesforce-apex` — Apex patterns, FFLib, bulk safety, governor limits, security
- `salesforce-lwc` — LWC wires, lifecycle, state, performance, testing
- `salesforce-deploy` — sfdx flow, validate/preview/deploy/quick/rollback
- `salesforce-architecture` — capacity, security, integrations, tech debt
- `salesforce-test` — test factories, coverage, sandbox sanitising
- `salesforce-flow` — Flow architecture, debug, trigger-order interactions
- `salesforce-security` — sharing, CRUD/FLS, Shield, review readiness
- `salesforce-comply` — regulated org controls and auditability
- `salesforce-cpq` — CPQ object model, quote lifecycle, pricing risks
- `salesforce-agentforce` — Agentforce architecture and grounding patterns
- `salesforce-einstein` — Einstein and AI feature integration patterns

### Agents (3)

- `salesforce-architect` — read-only org-level review
- `apex-bulkifier` — targeted bulk-safety refactor
- `lwc-debugger` — LWC issue diagnosis

### Commands (10)

- `/siftcoder:sf-deploy` `[validate|preview|deploy|quick|rollback]`
- `/siftcoder:sf-test` `[generate|coverage|run|factory]`
- `/siftcoder:sf-debug` `[parse|tail|limits]`
- `/siftcoder:sf-architect` (dispatches the agent)
- `/siftcoder:sf-package` `[create|version|install|uninstall]`
- `/siftcoder:sf-connect` `[named-cred|external-cred|oauth]`
- `/siftcoder:sf-webhook` (HMAC-verified inbound)
- `/siftcoder:apex-patterns` `[selector|domain|service|uow]`
- `/siftcoder:lwc` `[create|debug|wire|event]`
- `/siftcoder:schema` `[object|field|erd|migrate]`

## Project shape

SiftCoder assumes sfdx source format (`force-app/main/default/...`). For metadata-format orgs, convert first:

```bash
sf project convert source --target-org legacy
```

## End-to-end example: ship a webhook endpoint

```
# 1. Generate the endpoint
/siftcoder:sf-webhook OrderEvent --hmac-header X-Signature

# 2. Validate against sandbox
/siftcoder:sf-deploy validate --target-org dev

# 3. Bulk-safety check (the apex-bulkifier agent)
> run apex-bulkifier on classes/OrderEventWebhookResource.cls

# 4. Tests
/siftcoder:sf-test run OrderEventWebhookResource_Test

# 5. Architecture review (full org)
/siftcoder:sf-architect

# 6. Deploy
/siftcoder:sf-deploy deploy --target-org dev
```

## What SiftCoder does NOT do for Salesforce

- **Run sfdx for you blindly.** All deploys go through `validate` first, with previews for production.
- **Bypass governor limits.** Bulk safety is the default position; the bulkifier agent flags violations.
- **Hardcode credentials.** Webhooks and OAuth flows generate Named Credentials; secrets live in External Credentials or Custom Settings.
- **Touch managed packages without explicit user direction.**

## Common pitfalls SiftCoder catches

- SOQL/DML in loops — `apex-bulkifier`
- Test classes with `SeeAllData=true` left on — `salesforce-test` skill
- Missing FLS/CRUD checks — `salesforce-architecture` skill
- Profile-based perms instead of permission sets — `salesforce-architecture` skill
- Wire adapter not firing because param is undefined at construction — `lwc-debugger`
- `composed: false` event not crossing shadow DOM — `lwc-debugger`
- Production deploy without `--test-level RunLocalTests` — `salesforce-deploy` skill
- Deploy without preview — `salesforce-deploy` skill

## CI/CD pattern

The skill recommends:

1. PR opens → validate against integration sandbox with `RunLocalTests`
2. PR merged → quick-deploy from validated job-id
3. Release branch → validate against UAT
4. UAT signoff → quick-deploy to prod

The plugin doesn't ship CI templates — every Salesforce shop's CI is too org-specific. But all the steps are runnable individually via the commands above.
