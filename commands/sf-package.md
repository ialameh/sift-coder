---
description: Salesforce package development - unlocked packages, versioning, dependencies
argument-hint: <action> [package-name] [--version|--install]
allowed-tools: Read, Write, Edit, Glob, Grep, Bash
---

# /siftcoder:sf-package - Package Development

Develop and manage Salesforce packages. Create unlocked packages, manage versions, handle dependencies, and distribute your code.

## Usage

```
/siftcoder:sf-package create <name>    - Create unlocked package
/siftcoder:sf-package version          - Create new version
/siftcoder:sf-package install <id>     - Install package
/siftcoder:sf-package dependencies     - Analyze dependencies
/siftcoder:sf-package promote          - Promote to released
/siftcoder:sf-package list             - List all packages
/siftcoder:sf-package                  - Package overview
```

## Instructions

### Default: Package Overview

```
SALESFORCE PACKAGE OVERVIEW
═══════════════════════════════════════════════════════════════

DEV HUB: devhub@company.com (Connected ✓)

PACKAGES IN THIS PROJECT:
┌─────────────────────────────────────────────────────────────┐
│ Package              │ ID              │ Type     │ Versions│
├─────────────────────────────────────────────────────────────┤
│ InvoiceManager       │ 0Ho5g000000...  │ Unlocked │ 5       │
│ PaymentGateway       │ 0Ho5g000001...  │ Unlocked │ 3       │
│ CoreUtilities        │ 0Ho5g000002...  │ Unlocked │ 8       │
└─────────────────────────────────────────────────────────────┘

LATEST VERSIONS:
├── InvoiceManager@1.5.0-1 (Released)
├── PaymentGateway@1.2.0-3 (Beta)
└── CoreUtilities@2.1.0-1 (Released)

DEPENDENCIES:
├── InvoiceManager → CoreUtilities@2.0.0
├── PaymentGateway → CoreUtilities@2.0.0
└── PaymentGateway → InvoiceManager@1.4.0

[Create Package] [Create Version] [View Details]
```

### create <name>: Create Unlocked Package

```
PACKAGE CREATION: InvoiceManager
═══════════════════════════════════════════════════════════════

PACKAGE CONFIGURATION:

Name: InvoiceManager
Description: Invoice management components for Salesforce
Package Type: Unlocked
Namespace: (No namespace - org-dependent)
Path: force-app/main/default

SFDX-PROJECT.JSON UPDATE:
───────────────────────────────────────────────────────────────
{
    "packageDirectories": [
        {
            "path": "force-app/main/default",
            "default": true,
            "package": "InvoiceManager",
            "versionName": "ver 1.0",
            "versionNumber": "1.0.0.NEXT",
            "versionDescription": "Initial release"
        }
    ],
    "name": "invoice-manager-project",
    "namespace": "",
    "sfdcLoginUrl": "https://login.salesforce.com",
    "sourceApiVersion": "59.0"
}
───────────────────────────────────────────────────────────────

CREATING PACKAGE...

sf package create \
    --name "InvoiceManager" \
    --description "Invoice management components" \
    --package-type Unlocked \
    --path force-app/main/default \
    --target-dev-hub devhub

═══════════════════════════════════════════════════════════════
PACKAGE CREATED SUCCESSFULLY
═══════════════════════════════════════════════════════════════

Package Name: InvoiceManager
Package ID: 0Ho5g000000XXXX
Package Type: Unlocked
Ancestor: None

Next Steps:
1. Add components to force-app/main/default
2. Create first version: /siftcoder:sf-package version
3. Install in scratch org for testing

[Create Version] [Add Components] [View Package]
```

### version: Create New Version

```
PACKAGE VERSION CREATION
═══════════════════════════════════════════════════════════════

Package: InvoiceManager
Current Version: 1.4.0-5 (Released)
New Version: 1.5.0-NEXT

VERSION CONFIGURATION:
├── Version Name: Winter '26 Release
├── Version Number: 1.5.0.NEXT
├── Installation Key: Set (hidden)
├── Code Coverage: Required (75%+)
└── Skip Validation: No

CHANGES SINCE LAST VERSION:
├── New: Invoice__c.Payment_Terms__c field
├── New: InvoiceService.sendReminder() method
├── Modified: InvoiceTriggerHandler.cls
├── Modified: invoiceForm LWC
└── 12 total component changes

CREATING VERSION...

sf package version create \
    --package "InvoiceManager" \
    --definition-file config/project-scratch-def.json \
    --installation-key-bypass \
    --wait 60 \
    --code-coverage

Step 1: Creating scratch org for validation...
├── Org created: test-xxxx@example.com
└── ✓ Complete

Step 2: Installing package dependencies...
├── CoreUtilities@2.0.0 installing...
└── ✓ Dependencies installed

Step 3: Deploying package source...
├── Uploading components...
├── [████████████████████] 100%
└── ✓ Source deployed

Step 4: Running tests...
├── InvoiceServiceTest: 15/15 passed
├── InvoiceTriggerTest: 8/8 passed
├── InvoiceSelectorTest: 5/5 passed
├── Coverage: 87%
└── ✓ All tests passed

Step 5: Creating version...
├── Generating package version...
└── ✓ Version created

═══════════════════════════════════════════════════════════════
PACKAGE VERSION CREATED
═══════════════════════════════════════════════════════════════

Package: InvoiceManager
Version: 1.5.0-1
Version ID: 04t5g000000XXXX
Subscriber Version ID: 04t5g000000XXXX
Status: Beta

Install URL:
https://login.salesforce.com/packaging/installPackage.apexp?p0=04t5g000000XXXX

Install Command:
sf package install --package 04t5g000000XXXX --target-org myOrg --wait 10

[Install in Sandbox] [Promote to Released] [View Release Notes]
```

### install <id>: Install Package

```
PACKAGE INSTALLATION
═══════════════════════════════════════════════════════════════

Package: InvoiceManager@1.5.0-1
Target Org: staging (sandbox)

PRE-INSTALLATION CHECK:
├── ✓ Org authenticated
├── ✓ User has Install Packages permission
├── ✓ Dependencies satisfied
├── ✓ No conflicting components
└── ✓ Ready to install

INSTALLING...

sf package install \
    --package 04t5g000000XXXX \
    --target-org staging \
    --wait 20 \
    --publish-wait 10

Step 1: Validating package...
└── ✓ Package validated

Step 2: Installing components...
├── [████████████████████] 100%
├── Objects: 3
├── Fields: 15
├── Classes: 12
├── Triggers: 2
├── LWC: 5
└── ✓ Components installed

Step 3: Post-install configuration...
├── Assigning permissions...
└── ✓ Configuration complete

═══════════════════════════════════════════════════════════════
INSTALLATION SUCCESSFUL
═══════════════════════════════════════════════════════════════

Package: InvoiceManager@1.5.0-1
Install ID: 0Hf5g000000XXXX
Status: Installed
Duration: 2m 15s

POST-INSTALL STEPS:
1. Assign "InvoiceManager User" permission set to users
2. Add Invoice tab to App
3. Configure custom settings

[View in Setup] [Assign Permissions] [Test Installation]
```

### dependencies: Analyze Dependencies

```
PACKAGE DEPENDENCY ANALYSIS
═══════════════════════════════════════════════════════════════

Package: InvoiceManager

DEPENDENCY TREE:
┌─────────────────────────────────────────────────────────────┐
│                                                             │
│  InvoiceManager@1.5.0                                       │
│  ├── CoreUtilities@2.0.0 (Required)                        │
│  │   └── fflib-apex-common@1.4.0 (Required)               │
│  └── (Optional) PaymentGateway@1.2.0                       │
│                                                             │
└─────────────────────────────────────────────────────────────┘

DECLARED DEPENDENCIES (sfdx-project.json):
───────────────────────────────────────────────────────────────
"dependencies": [
    {
        "package": "CoreUtilities",
        "versionNumber": "2.0.0.LATEST"
    },
    {
        "package": "fflib-apex-common@1.4.0-1",
        "versionNumber": "1.4.0.LATEST"
    }
]
───────────────────────────────────────────────────────────────

COMPONENT DEPENDENCIES:
┌─────────────────────────────────────────────────────────────┐
│ Component              │ Depends On                         │
├─────────────────────────────────────────────────────────────┤
│ InvoiceService.cls     │ CoreUtilities.Logger              │
│ InvoiceService.cls     │ fflib_SObjectUnitOfWork           │
│ InvoiceSelector.cls    │ fflib_SObjectSelector             │
│ InvoiceTrigger         │ CoreUtilities.TriggerHandler      │
│ invoiceForm (LWC)      │ CoreUtilities.toastHelper         │
└─────────────────────────────────────────────────────────────┘

DEPENDENCY CONFLICTS:
├── None detected ✓

VERSION COMPATIBILITY:
├── CoreUtilities@2.0.0 ← Current: 2.1.0 (Compatible)
├── fflib-apex-common@1.4.0 ← Current: 1.4.0 (Match)
└── All dependencies compatible ✓

RECOMMENDATIONS:
├── Consider upgrading CoreUtilities to 2.1.0
└── Lock specific versions in production

[Update Dependencies] [Lock Versions] [View Matrix]
```

### promote: Promote to Released

```
PACKAGE VERSION PROMOTION
═══════════════════════════════════════════════════════════════

Package: InvoiceManager
Version: 1.5.0-1
Current Status: Beta

⚠️ PROMOTION WARNING:
Once promoted, this version cannot be deleted and becomes
available to all subscribers.

PRE-PROMOTION CHECKLIST:
├── ✓ All tests passing
├── ✓ Code coverage: 87%
├── ✓ Tested in sandbox
├── ✓ Release notes prepared
└── ✓ No known blocking issues

PROMOTING VERSION...

sf package version promote --package 04t5g000000XXXX

═══════════════════════════════════════════════════════════════
VERSION PROMOTED SUCCESSFULLY
═══════════════════════════════════════════════════════════════

Package: InvoiceManager
Version: 1.5.0-1
Status: Released
Released Date: 2026-01-12

This version is now:
├── Available on AppExchange (if listed)
├── Installable in production orgs
└── Cannot be deleted

Install URL (Production):
https://login.salesforce.com/packaging/installPackage.apexp?p0=04t5g000000XXXX

[Create Release Notes] [Notify Subscribers] [Start Next Version]
```

## Package Types Reference

```
SALESFORCE PACKAGE TYPES
═══════════════════════════════════════════════════════════════

UNLOCKED PACKAGES (Recommended)
├── Modular, source-driven development
├── No namespace required
├── Can be org-dependent or independent
├── Supports upgrades and patches
└── Best for: Internal apps, modular development

MANAGED PACKAGES
├── Required namespace
├── IP protection (code hidden)
├── AppExchange distribution
├── LMO (License Management Org)
└── Best for: ISVs, commercial apps

2GP (Second Generation Packaging)
├── Modern package format
├── Scratch org based development
├── CI/CD friendly
├── Version control native
└── Best for: DevOps, agile teams

UNPACKAGED METADATA
├── Traditional change sets
├── No versioning
├── Direct deployment
├── No dependency management
└── Best for: Quick fixes, small teams
```

## Integration

Works well with:
- `/siftcoder:sf-deploy` - Deploy packages
- `/siftcoder:sf-test` - Test before versioning
- `/siftcoder:sf-architect` - Package architecture
