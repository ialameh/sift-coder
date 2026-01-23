---
description: Schema migration and change management - plan, diff, deploy, rollback schema changes
argument-hint: <action> [source] [target] [--preview|--force]
allowed-tools: Read, Write, Edit, Glob, Grep, Bash
---

# /siftcoder:schema-migrate - Schema Migration

Manage schema changes across Salesforce orgs. Compare environments, plan migrations, deploy changes, and rollback if needed.

## Usage

```
/siftcoder:schema-migrate plan              - Plan schema changes
/siftcoder:schema-migrate diff [org]        - Compare orgs/branches
/siftcoder:schema-migrate deploy [org]      - Deploy schema changes
/siftcoder:schema-migrate rollback          - Rollback schema changes
/siftcoder:schema-migrate validate          - Validate before deploy
/siftcoder:schema-migrate history           - View migration history
/siftcoder:schema-migrate                   - Show migration status
```

## Instructions

### Default: Show Migration Status

```
SCHEMA MIGRATION STATUS
═══════════════════════════════════════════════════════════════

Current Branch: feature/invoice-system
Target Org: production (connected)
Last Sync: 2026-01-12 09:30:00

PENDING CHANGES:
├── NEW OBJECTS: 2
│   ├── Invoice__c
│   └── Invoice_Line_Item__c
│
├── NEW FIELDS: 3
│   ├── Account.Total_Invoiced__c (Roll-up Summary)
│   ├── Account.Outstanding_Balance__c (Formula)
│   └── Contact.Billing_Contact__c (Checkbox)
│
├── MODIFIED: 1
│   └── Account.object-meta.xml (added sharing rules)
│
└── DELETED: 0

DEPLOYMENT READINESS:
├── ✓ All metadata valid
├── ✓ No destructive changes
├── ✓ Test classes exist
└── ⚠️ 2 permission sets need update

[Plan Migration] [Preview Deploy] [Deploy Now]
```

### plan: Plan Schema Changes

**Step 1: Analyze Changes**

```
MIGRATION PLAN
═══════════════════════════════════════════════════════════════

SOURCE: Local (feature/invoice-system)
TARGET: Production

PHASE 1: Objects & Fields (No Data Impact)
───────────────────────────────────────────────────────────────
Order   Component                    Action    Risk
───────────────────────────────────────────────────────────────
1       Invoice__c.object           CREATE    Low
2       Invoice__c.Account__c       CREATE    Low
3       Invoice__c.Amount__c        CREATE    Low
4       Invoice__c.Status__c        CREATE    Low
5       Invoice__c.Due_Date__c      CREATE    Low
6       Invoice_Line_Item__c        CREATE    Low
7       Invoice_Line_Item__c fields CREATE    Low

PHASE 2: Formulas & Roll-ups (Depends on Phase 1)
───────────────────────────────────────────────────────────────
Order   Component                    Action    Risk
───────────────────────────────────────────────────────────────
8       Account.Total_Invoiced__c   CREATE    Medium
9       Account.Outstanding__c      CREATE    Low
10      Invoice__c.Line_Total__c    CREATE    Low

PHASE 3: Validation & Automation
───────────────────────────────────────────────────────────────
Order   Component                    Action    Risk
───────────────────────────────────────────────────────────────
11      Amount_Positive.rule        CREATE    Medium
12      Due_Date_Future.rule        CREATE    Medium
13      Invoice_Process.flow        CREATE    Medium

PHASE 4: Security & Permissions
───────────────────────────────────────────────────────────────
Order   Component                    Action    Risk
───────────────────────────────────────────────────────────────
14      Invoice_Access.permset      CREATE    Low
15      Account sharing rules       MODIFY    Medium

DEPENDENCY GRAPH:
┌─────────────────────────────────────────────────────────────┐
│ Invoice__c ──┬── Invoice_Line_Item__c                      │
│              └── Account.Total_Invoiced__c (Roll-up)       │
│                                                             │
│ Must deploy Invoice__c before:                             │
│   - Invoice_Line_Item__c (Master-Detail parent)            │
│   - Roll-up Summary fields                                  │
│   - Validation rules referencing Invoice__c                │
└─────────────────────────────────────────────────────────────┘

ESTIMATED DEPLOYMENT:
├── Components: 15
├── Test execution: ~5 minutes
└── Total time: ~10 minutes

[Execute Plan] [Modify Plan] [Export Plan]
```

### diff [org]: Compare Environments

```
SCHEMA DIFF: Local vs Production
═══════════════════════════════════════════════════════════════

Comparing force-app/main/default with Production org...

OBJECTS DIFF:
┌─────────────────────────────────────────────────────────────┐
│ Object              │ Local    │ Production │ Status       │
├─────────────────────────────────────────────────────────────┤
│ Invoice__c          │ ✓        │ ✗          │ + NEW        │
│ Invoice_Line_Item__c│ ✓        │ ✗          │ + NEW        │
│ Payment__c          │ ✓        │ ✗          │ + NEW        │
│ Account             │ Modified │ Original   │ ~ CHANGED    │
│ Contact             │ Modified │ Original   │ ~ CHANGED    │
│ Legacy_Object__c    │ ✗        │ ✓          │ - MISSING    │
└─────────────────────────────────────────────────────────────┘

FIELD DIFF (Account):
┌─────────────────────────────────────────────────────────────┐
│ Field                    │ Local      │ Prod       │ Status │
├─────────────────────────────────────────────────────────────┤
│ Total_Invoiced__c        │ Roll-up    │ -          │ + NEW  │
│ Outstanding_Balance__c   │ Formula    │ -          │ + NEW  │
│ Rating                   │ Picklist   │ Picklist   │ = SAME │
│ Industry                 │ Picklist   │ Picklist   │ = SAME │
│ Old_Field__c             │ -          │ Text       │ - MISS │
└─────────────────────────────────────────────────────────────┘

VALIDATION RULES DIFF:
┌─────────────────────────────────────────────────────────────┐
│ Rule                     │ Local      │ Prod       │ Status │
├─────────────────────────────────────────────────────────────┤
│ Amount_Must_Be_Positive  │ Active     │ -          │ + NEW  │
│ Due_Date_Future          │ Active     │ -          │ + NEW  │
│ Old_Rule                 │ -          │ Active     │ - MISS │
└─────────────────────────────────────────────────────────────┘

SUMMARY:
├── Objects: +3 new, 2 modified, 1 missing locally
├── Fields: +5 new, 0 modified, 2 missing locally
├── Validation Rules: +2 new, 1 missing locally
└── Total changes: 14

⚠️ WARNINGS:
├── Legacy_Object__c exists in prod but not in source
│   └── Will NOT be deleted unless using destructive changes
│
└── Old_Field__c exists in prod but not in source
    └── Consider adding to source or planning removal

[Generate Manifest] [Deploy Changes] [Sync from Prod]
```

### deploy [org]: Deploy Schema Changes

```
SCHEMA DEPLOYMENT
═══════════════════════════════════════════════════════════════

Target: Production
Mode: Validate + Deploy

PRE-DEPLOYMENT CHECKS:
├── ✓ Source org authenticated
├── ✓ Target org authenticated
├── ✓ All metadata valid XML
├── ✓ No circular dependencies
├── ✓ Required fields have defaults
└── ✓ Test coverage > 75%

DEPLOYMENT MANIFEST:
───────────────────────────────────────────────────────────────
<?xml version="1.0" encoding="UTF-8"?>
<Package xmlns="http://soap.sforce.com/2006/04/metadata">
    <types>
        <members>Invoice__c</members>
        <members>Invoice_Line_Item__c</members>
        <members>Payment__c</members>
        <name>CustomObject</name>
    </types>
    <types>
        <members>Account.Total_Invoiced__c</members>
        <members>Account.Outstanding_Balance__c</members>
        <name>CustomField</name>
    </types>
    <types>
        <members>Invoice__c.Amount_Must_Be_Positive</members>
        <name>ValidationRule</name>
    </types>
    <version>59.0</version>
</Package>
───────────────────────────────────────────────────────────────

EXECUTING DEPLOYMENT...

Phase 1/4: Validating metadata...
├── Invoice__c.object-meta.xml ✓
├── Invoice_Line_Item__c.object-meta.xml ✓
├── 12 field metadata files ✓
└── Validation complete

Phase 2/4: Running tests...
├── InvoiceServiceTest: 12/12 passed
├── InvoiceTriggerTest: 8/8 passed
├── InvoiceSelectorTest: 5/5 passed
└── All tests passed (25/25)

Phase 3/4: Deploying components...
├── [============================] 100%
├── 15/15 components deployed
└── No errors

Phase 4/4: Post-deployment validation...
├── ✓ Objects accessible
├── ✓ Fields queryable
├── ✓ Validation rules active
└── ✓ Deployment verified

═══════════════════════════════════════════════════════════════
DEPLOYMENT SUCCESSFUL
═══════════════════════════════════════════════════════════════

Deployment ID: 0Af5g00000XXXXXX
Components: 15
Test Classes: 3
Duration: 4m 32s

Rollback available for 7 days.

[View in Setup] [Run Smoke Tests] [Notify Team]
```

### rollback: Rollback Schema Changes

```
SCHEMA ROLLBACK
═══════════════════════════════════════════════════════════════

⚠️ CAUTION: Rollback may cause data loss!

AVAILABLE ROLLBACK POINTS:
┌─────────────────────────────────────────────────────────────┐
│ ID       │ Date       │ Components │ Status    │ Action    │
├─────────────────────────────────────────────────────────────┤
│ RB-001   │ 2026-01-12 │ 15         │ Available │ [Rollback]│
│ RB-002   │ 2026-01-10 │ 8          │ Available │ [Rollback]│
│ RB-003   │ 2026-01-05 │ 3          │ Expired   │ -         │
└─────────────────────────────────────────────────────────────┘

ROLLBACK RB-001 DETAILS:
───────────────────────────────────────────────────────────────

This will REMOVE:
├── Invoice__c (OBJECT - all data will be lost!)
├── Invoice_Line_Item__c (OBJECT - all data will be lost!)
├── Payment__c (OBJECT - all data will be lost!)
├── Account.Total_Invoiced__c (FIELD)
└── Account.Outstanding_Balance__c (FIELD)

DATA IMPACT:
├── Invoice__c records: 0 (new object, no data)
├── Invoice_Line_Item__c records: 0 (new object)
└── Payment__c records: 0 (new object)

CONFIRMATION REQUIRED:
┌─────────────────────────────────────────────────────────────┐
│ Type 'ROLLBACK RB-001' to confirm rollback                 │
│                                                             │
│ This action cannot be undone!                               │
└─────────────────────────────────────────────────────────────┘

[Cancel] [View Backup] [Proceed with Rollback]
```

### validate: Validate Before Deploy

```
DEPLOYMENT VALIDATION
═══════════════════════════════════════════════════════════════

Running validation against: Production

VALIDATION CHECKS:

1. METADATA SYNTAX
   ├── ✓ All XML files valid
   ├── ✓ API names follow conventions
   └── ✓ Required elements present

2. DEPENDENCY ANALYSIS
   ├── ✓ Parent objects exist before children
   ├── ✓ Lookup targets exist
   ├── ✓ Formula field references valid
   └── ✓ No circular dependencies

3. PERMISSION CHECK
   ├── ✓ User has Modify All Data
   ├── ✓ User has Customize Application
   └── ✓ User has Manage Users (for permsets)

4. CONFLICT DETECTION
   ├── ✓ No duplicate API names
   ├── ✓ No conflicting field types
   └── ⚠️ Account has local changes (merge required)

5. TEST EXECUTION (Check Only)
   ├── ✓ InvoiceServiceTest: PASS
   ├── ✓ InvoiceTriggerTest: PASS
   ├── ✓ InvoiceSelectorTest: PASS
   └── Coverage: 87% (required: 75%)

6. GOVERNOR LIMITS
   ├── ✓ Objects: 3/800 custom objects
   ├── ✓ Fields per object: 12/500
   └── ✓ Validation rules: 5/500

═══════════════════════════════════════════════════════════════
VALIDATION PASSED WITH 1 WARNING
═══════════════════════════════════════════════════════════════

Warnings:
└── Account object has modifications in both source and target
    Recommendation: Review Account changes manually

[Deploy Now] [Review Warning] [Export Report]
```

### history: View Migration History

```
MIGRATION HISTORY
═══════════════════════════════════════════════════════════════

Recent Deployments (Last 30 days):

DATE        TIME     USER          COMPONENTS  STATUS   ID
───────────────────────────────────────────────────────────────
2026-01-12  14:30    sam@demo.com  15          Success  0Af001
2026-01-10  09:15    sam@demo.com  8           Success  0Af002
2026-01-08  16:45    john@demo.com 3           Failed   0Af003
2026-01-05  11:00    sam@demo.com  12          Success  0Af004

DEPLOYMENT 0Af001 DETAILS:
├── Type: Schema Migration
├── Source: feature/invoice-system
├── Target: Production
├── Duration: 4m 32s
├── Components:
│   ├── 3 Custom Objects
│   ├── 12 Custom Fields
│   ├── 2 Validation Rules
│   └── 1 Permission Set
└── Tests: 25 passed, 0 failed

FAILED DEPLOYMENT 0Af003:
├── Error: FIELD_INTEGRITY_EXCEPTION
├── Component: Account.Rating
├── Message: Cannot change field type from Picklist to Text
└── Resolution: Reverted change, kept as Picklist

[View Full Log] [Compare Deployments] [Export History]
```

## Best Practices

```
SCHEMA MIGRATION BEST PRACTICES
═══════════════════════════════════════════════════════════════

1. ALWAYS VALIDATE FIRST
   sf project deploy start --dry-run --target-org prod

2. DEPLOY IN PHASES
   ├── Phase 1: Objects & Fields (no dependencies)
   ├── Phase 2: Formulas & Roll-ups
   ├── Phase 3: Validation & Automation
   └── Phase 4: Permissions

3. NEVER DELETE IN PRODUCTION
   ├── Use destructiveChangesPre.xml explicitly
   ├── Archive data before field deletion
   └── Consider deprecation first

4. TEST COVERAGE
   ├── Maintain 75%+ coverage
   ├── Include positive and negative tests
   └── Test bulk operations

5. ROLLBACK STRATEGY
   ├── Keep backups of previous metadata
   ├── Document data dependencies
   └── Have rollback scripts ready

6. CHANGE MANAGEMENT
   ├── Use version control (Git)
   ├── Review changes in sandbox first
   ├── Document all schema changes
   └── Communicate with stakeholders
```

## Integration

Works well with:
- `/siftcoder:schema` - Create schema
- `/siftcoder:sf-deploy` - Full deployment
- `/siftcoder:sf-test` - Ensure coverage
