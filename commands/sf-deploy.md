---
description: Salesforce deployment management - validate, deploy, diff, rollback, CI/CD setup
argument-hint: <action> [target-org] [--validate|--quick|--ci]
allowed-tools: Read, Write, Edit, Glob, Grep, Bash
---

# /siftcoder:sf-deploy - Deployment Management

Manage Salesforce deployments with validation, diff comparison, and rollback capabilities. Setup CI/CD pipelines for automated deployments.

## Usage

```
/siftcoder:sf-deploy validate [org]    - Validate deployment
/siftcoder:sf-deploy push [org]        - Deploy to org
/siftcoder:sf-deploy diff <org>        - Compare with target
/siftcoder:sf-deploy rollback          - Rollback deployment
/siftcoder:sf-deploy ci-setup          - Setup CI/CD pipeline
/siftcoder:sf-deploy status            - Check deployment status
/siftcoder:sf-deploy                   - Deployment overview
```

## Instructions

### Default: Deployment Overview

```
SALESFORCE DEPLOYMENT OVERVIEW
═══════════════════════════════════════════════════════════════

PROJECT: force-app
DEFAULT ORG: production (Connected ✓)

DEPLOYMENT READINESS:
├── ✓ Source validated
├── ✓ Tests passing (156/156)
├── ✓ Code coverage: 82%
├── ⚠️ Pending changes: 12 components
└── ✓ No destructive changes

PENDING CHANGES:
┌─────────────────────────────────────────────────────────────┐
│ Component                    │ Type          │ Action      │
├─────────────────────────────────────────────────────────────┤
│ Invoice__c                   │ CustomObject  │ Modified    │
│ Invoice__c.Status__c         │ CustomField   │ New         │
│ AccountService.cls           │ ApexClass     │ Modified    │
│ AccountTrigger.trigger       │ ApexTrigger   │ Modified    │
│ accountList (LWC)            │ LightningComp │ New         │
│ ... (7 more)                 │               │             │
└─────────────────────────────────────────────────────────────┘

RECENT DEPLOYMENTS:
├── 2026-01-12 09:30 │ production │ Success │ 8 components
├── 2026-01-10 14:15 │ staging    │ Success │ 15 components
└── 2026-01-08 11:00 │ production │ Failed  │ Validation error

[Validate] [Deploy] [View Diff] [Quick Deploy]
```

### validate [org]: Validate Deployment

```
DEPLOYMENT VALIDATION
═══════════════════════════════════════════════════════════════

Target: production
Mode: Check Only (Validate without Deploy)

RUNNING VALIDATION...

Step 1: Metadata Validation
├── Parsing source files...
├── Validating XML syntax...
├── Checking API versions...
└── ✓ All metadata valid

Step 2: Dependency Check
├── Analyzing dependencies...
├── Checking referenced components...
└── ✓ All dependencies satisfied

Step 3: Deploying to Target (Check Only)
├── Creating deployment package...
├── Uploading to org...
├── [████████████████████] 100%
└── ✓ Deployment simulation successful

Step 4: Running Tests
├── Running specified tests...
├── AccountServiceTest: 12/12 passed
├── InvoiceServiceTest: 8/8 passed
├── InvoiceTriggerTest: 6/6 passed
├── ... (130 more tests)
└── ✓ All tests passed (156/156)

Step 5: Code Coverage
├── Analyzing coverage...
├── AccountService.cls: 92%
├── InvoiceService.cls: 87%
├── InvoiceTriggerHandler.cls: 85%
└── ✓ Overall coverage: 82% (Required: 75%)

═══════════════════════════════════════════════════════════════
VALIDATION SUCCESSFUL
═══════════════════════════════════════════════════════════════

Deployment ID: 0Af5g00000XYZABC
Components: 12
Test Classes: 8
Tests Run: 156
Duration: 4m 32s

This validation can be quick-deployed within 10 days.

Quick Deploy Command:
sf project deploy quick --job-id 0Af5g00000XYZABC

[Quick Deploy Now] [Full Deploy] [View Details]
```

### push [org]: Deploy to Org

```
DEPLOYMENT EXECUTION
═══════════════════════════════════════════════════════════════

Target: production
Mode: Deploy and Run Tests

PRE-DEPLOYMENT CHECKLIST:
├── ✓ Validation passed
├── ✓ Tests passing
├── ✓ Code coverage > 75%
├── ✓ No pending approvals
└── ✓ Deployment window open

DEPLOYING...

Phase 1: Upload Package
├── Creating manifest...
├── Compressing source...
├── Uploading (2.4 MB)...
└── ✓ Upload complete

Phase 2: Deploy Components
├── [████████████████████] 100%
├── CustomObject: 2/2
├── CustomField: 5/5
├── ApexClass: 8/8
├── ApexTrigger: 2/2
├── LightningComponentBundle: 3/3
└── ✓ All components deployed

Phase 3: Run Tests
├── Running all local tests...
├── [████████████████████] 100%
├── Passed: 156
├── Failed: 0
└── ✓ All tests passed

Phase 4: Activate
├── Activating deployed components...
└── ✓ Deployment complete

═══════════════════════════════════════════════════════════════
DEPLOYMENT SUCCESSFUL
═══════════════════════════════════════════════════════════════

Deployment ID: 0Af5g00000XYZDEF
Components Deployed: 20
Tests Executed: 156
Total Duration: 6m 15s
Status: Succeeded

DEPLOYED COMPONENTS:
├── Objects: Invoice__c, Payment__c
├── Fields: 5 new fields
├── Classes: AccountService, InvoiceService, PaymentService
├── Triggers: AccountTrigger, InvoiceTrigger
└── LWC: accountList, invoiceForm, paymentWidget

[View in Setup] [Notify Team] [Create Release Notes]
```

### diff <org>: Compare with Target

```
DEPLOYMENT DIFF
═══════════════════════════════════════════════════════════════

Comparing: Local (feature/invoice) → Production

COMPONENT DIFF:
┌─────────────────────────────────────────────────────────────┐
│ Component                │ Local      │ Prod       │ Status │
├─────────────────────────────────────────────────────────────┤
│ Invoice__c               │ v2         │ v1         │ CHANGED│
│ Invoice__c.Status__c     │ Exists     │ Missing    │ NEW    │
│ Invoice__c.Amount__c     │ Currency   │ Number     │ CHANGED│
│ AccountService.cls       │ 245 lines  │ 200 lines  │ CHANGED│
│ LegacyHelper.cls         │ Missing    │ Exists     │ DELETE │
│ accountList (LWC)        │ Exists     │ Missing    │ NEW    │
└─────────────────────────────────────────────────────────────┘

DETAILED CHANGES:

AccountService.cls
───────────────────────────────────────────────────────────────
@@ -45,6 +45,25 @@
     public static void processAccount(Account acc) {
-        // Old implementation
+        // New implementation with bulk support
+        List<Account> accounts = new List<Account>{ acc };
+        processAccounts(accounts);
+    }
+
+    public static void processAccounts(List<Account> accounts) {
+        // Bulk processing logic
         ...
───────────────────────────────────────────────────────────────

Invoice__c.Amount__c - TYPE CHANGE WARNING ⚠️
───────────────────────────────────────────────────────────────
Local:  Currency (18,2)
Prod:   Number (18,0)

⚠️ WARNING: Field type change may cause data loss!
   - Existing decimal values will be truncated
   - Consider: Add new field instead of modifying

───────────────────────────────────────────────────────────────

SUMMARY:
├── New Components: 3
├── Modified: 4
├── Deleted: 1 (requires destructive changes)
└── Type Changes: 1 (review carefully)

RECOMMENDATIONS:
1. Review Amount__c type change - may need data migration
2. LegacyHelper.cls deletion requires destructiveChanges.xml
3. Test Invoice__c.Status__c picklist values

[Generate Manifest] [Deploy Changes] [Export Diff Report]
```

### rollback: Rollback Deployment

```
DEPLOYMENT ROLLBACK
═══════════════════════════════════════════════════════════════

⚠️ CAUTION: Rollback will revert components to previous state

AVAILABLE ROLLBACK POINTS:
┌─────────────────────────────────────────────────────────────┐
│ Deployment ID      │ Date       │ Components │ Status      │
├─────────────────────────────────────────────────────────────┤
│ 0Af5g00000XYZDEF   │ 2026-01-12 │ 20         │ Deployed    │
│ 0Af5g00000XYZABC   │ 2026-01-10 │ 15         │ Available   │
│ 0Af5g00000XYZ123   │ 2026-01-08 │ 8          │ Available   │
└─────────────────────────────────────────────────────────────┘

ROLLBACK DEPLOYMENT 0Af5g00000XYZDEF:

Components to Revert:
├── AccountService.cls → Previous version (200 lines)
├── InvoiceService.cls → Previous version
├── Invoice__c.Status__c → Will be REMOVED
├── accountList (LWC) → Will be REMOVED
└── ... (16 more)

DATA IMPACT ASSESSMENT:
├── Invoice__c.Status__c: 0 records (new field, no data)
├── accountList: No data impact (UI only)
└── No destructive data changes detected

ROLLBACK OPTIONS:
┌─────────────────────────────────────────────────────────────┐
│ [1] Full Rollback - Revert all components                  │
│ [2] Partial Rollback - Select components to revert         │
│ [3] Code Only - Revert Apex/LWC, keep schema changes       │
│ [4] Cancel                                                  │
└─────────────────────────────────────────────────────────────┘

EXECUTING ROLLBACK...

[Would execute: sf project deploy start --source-dir rollback/]

═══════════════════════════════════════════════════════════════
ROLLBACK COMPLETE
═══════════════════════════════════════════════════════════════

Reverted to: Deployment from 2026-01-10
Components rolled back: 20
Duration: 3m 45s

[Verify Rollback] [Run Smoke Tests] [Notify Team]
```

### ci-setup: Setup CI/CD Pipeline

```
CI/CD PIPELINE SETUP
═══════════════════════════════════════════════════════════════

Select CI/CD Platform:
┌─────────────────────────────────────────────────────────────┐
│ [1] GitHub Actions (Recommended)                           │
│ [2] GitLab CI                                              │
│ [3] Azure DevOps                                           │
│ [4] Bitbucket Pipelines                                    │
│ [5] Jenkins                                                │
└─────────────────────────────────────────────────────────────┘

Selected: [1] GitHub Actions

GENERATED: .github/workflows/salesforce-ci.yml
───────────────────────────────────────────────────────────────

name: Salesforce CI/CD

on:
  push:
    branches: [main, develop]
    paths:
      - 'force-app/**'
      - 'sfdx-project.json'
  pull_request:
    branches: [main]
    paths:
      - 'force-app/**'

env:
  SALESFORCE_CLI_URL: https://developer.salesforce.com/media/salesforce-cli/sf/channels/stable/sf-linux-x64.tar.xz

jobs:
  # ═══════════════════════════════════════════════════════════
  # VALIDATE PR
  # ═══════════════════════════════════════════════════════════
  validate:
    name: Validate PR
    runs-on: ubuntu-latest
    if: github.event_name == 'pull_request'

    steps:
      - name: Checkout
        uses: actions/checkout@v4

      - name: Install Salesforce CLI
        run: |
          wget $SALESFORCE_CLI_URL
          mkdir sf-cli
          tar -xf sf-linux-x64.tar.xz -C sf-cli --strip-components=1
          echo "$PWD/sf-cli/bin" >> $GITHUB_PATH

      - name: Authenticate to Org
        run: |
          echo "${{ secrets.SFDX_AUTH_URL }}" > auth-url.txt
          sf org login sfdx-url --sfdx-url-file auth-url.txt --alias target-org

      - name: Validate Deployment
        run: |
          sf project deploy start \
            --source-dir force-app \
            --target-org target-org \
            --dry-run \
            --test-level RunLocalTests \
            --wait 30

      - name: Check Code Coverage
        run: |
          sf apex get test --target-org target-org --code-coverage

  # ═══════════════════════════════════════════════════════════
  # DEPLOY TO STAGING
  # ═══════════════════════════════════════════════════════════
  deploy-staging:
    name: Deploy to Staging
    runs-on: ubuntu-latest
    if: github.ref == 'refs/heads/develop'
    needs: validate

    steps:
      - name: Checkout
        uses: actions/checkout@v4

      - name: Install Salesforce CLI
        run: |
          wget $SALESFORCE_CLI_URL
          mkdir sf-cli
          tar -xf sf-linux-x64.tar.xz -C sf-cli --strip-components=1
          echo "$PWD/sf-cli/bin" >> $GITHUB_PATH

      - name: Authenticate to Staging
        run: |
          echo "${{ secrets.STAGING_AUTH_URL }}" > auth-url.txt
          sf org login sfdx-url --sfdx-url-file auth-url.txt --alias staging

      - name: Deploy to Staging
        run: |
          sf project deploy start \
            --source-dir force-app \
            --target-org staging \
            --test-level RunLocalTests \
            --wait 30

  # ═══════════════════════════════════════════════════════════
  # DEPLOY TO PRODUCTION
  # ═══════════════════════════════════════════════════════════
  deploy-production:
    name: Deploy to Production
    runs-on: ubuntu-latest
    if: github.ref == 'refs/heads/main'
    environment: production

    steps:
      - name: Checkout
        uses: actions/checkout@v4

      - name: Install Salesforce CLI
        run: |
          wget $SALESFORCE_CLI_URL
          mkdir sf-cli
          tar -xf sf-linux-x64.tar.xz -C sf-cli --strip-components=1
          echo "$PWD/sf-cli/bin" >> $GITHUB_PATH

      - name: Authenticate to Production
        run: |
          echo "${{ secrets.PROD_AUTH_URL }}" > auth-url.txt
          sf org login sfdx-url --sfdx-url-file auth-url.txt --alias production

      - name: Deploy to Production
        run: |
          sf project deploy start \
            --source-dir force-app \
            --target-org production \
            --test-level RunLocalTests \
            --wait 60

      - name: Create Release Tag
        run: |
          git tag "release-$(date +%Y%m%d-%H%M%S)"
          git push --tags
───────────────────────────────────────────────────────────────

SETUP INSTRUCTIONS:

1. Create GitHub Secrets:
   - SFDX_AUTH_URL (for validation)
   - STAGING_AUTH_URL
   - PROD_AUTH_URL

   Generate auth URL:
   sf org display --target-org myOrg --verbose | grep "Sfdx Auth Url"

2. Create 'production' Environment:
   Settings → Environments → New → "production"
   Add required reviewers for production deploys

3. Push workflow file:
   git add .github/workflows/salesforce-ci.yml
   git commit -m "Add Salesforce CI/CD pipeline"
   git push

[Create Workflow File] [View Setup Guide] [Test Locally]
```

## Quick Reference

```
SALESFORCE CLI DEPLOYMENT COMMANDS
═══════════════════════════════════════════════════════════════

# Validate without deploying
sf project deploy start --dry-run --target-org myOrg

# Deploy all source
sf project deploy start --source-dir force-app --target-org myOrg

# Deploy with tests
sf project deploy start --source-dir force-app --test-level RunLocalTests

# Quick deploy (after successful validation)
sf project deploy quick --job-id 0Af...

# Check deployment status
sf project deploy report --job-id 0Af...

# Cancel deployment
sf project deploy cancel --job-id 0Af...

# Retrieve from org
sf project retrieve start --target-org myOrg --source-dir force-app
```

## Integration

Works well with:
- `/siftcoder:sf-test` - Ensure tests pass before deploy
- `/siftcoder:schema-migrate` - Schema change management
- `/siftcoder:sf-package` - Package deployments
