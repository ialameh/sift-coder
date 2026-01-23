# /siftcoder:comply - Compliance & Governance

Manage licenses, generate SBOMs, and ensure regulatory compliance.

## Usage

```
/siftcoder:comply [subcommand]
```

## Subcommands

| Subcommand | Description |
|------------|-------------|
| `licenses` | Dependency license audit (default) |
| `sbom` | Generate Software Bill of Materials |
| `gdpr` | GDPR/privacy compliance check |
| `standards` | Coding standards compliance |
| `audit` | Full compliance audit |

## Arguments
- `$ARGUMENTS` - Subcommand and optional flags

## Instructions

You are a compliance expert. Help ensure software meets legal, regulatory, and organizational requirements.

---

## Phase 0: Interactive Setup

**Use AskUserQuestion tool:**
```
Question: "What compliance area do you need help with?"
Header: "Area"
Options:
- "License Audit (Recommended)" - "Check dependency licenses for compatibility"
- "Generate SBOM" - "Create Software Bill of Materials"
- "Privacy Compliance" - "GDPR/CCPA data handling check"
- "Coding Standards" - "Check against organizational standards"
```

---

## Subcommand: licenses

### License Compliance Audit

```
LICENSE COMPLIANCE AUDIT
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Project license: MIT
Package manager: npm
Dependencies scanned: 456

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

LICENSE DISTRIBUTION

┌─────────────────────────────────────────────────────────────┐
│ MIT             ████████████████████████████████  68%       │
│ ISC             ████████░░░░░░░░░░░░░░░░░░░░░░░░  15%       │
│ Apache-2.0      ██████░░░░░░░░░░░░░░░░░░░░░░░░░░  10%       │
│ BSD-3-Clause    ██░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░   4%       │
│ LGPL-3.0        █░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░   2%       │
│ Unknown         █░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░   1%       │
└─────────────────────────────────────────────────────────────┘

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

LICENSE ISSUES

❌ INCOMPATIBLE LICENSES (2)

1. Package: pdf-generator
   License: GPL-3.0
   Issue: GPL-3.0 is copyleft; requires your code to be GPL

   Your project: MIT (permissive)
   Conflict: Cannot distribute MIT project with GPL dependency

   Options:
   a) Remove package, find alternative
   b) Use via API/separate process (AGPL safe harbor)
   c) Contact author for dual license
   d) Relicense your project to GPL

   Alternatives:
   ├── pdf-lib (MIT) - Similar functionality
   └── pdfmake (MIT) - Full-featured

2. Package: chart-component
   License: SSPL
   Issue: SSPL (Server Side Public License) is non-OSI-approved

   Risk: Legal uncertainty for commercial use
   Alternative: chart.js (MIT)

⚠ REQUIRES ATTRIBUTION (15)

These licenses require you to include attribution:

Package         License      Requirement
───────────────────────────────────────────────────────
lodash          MIT          Include license in distribution
axios           MIT          Include license in distribution
express         MIT          Include license in distribution
... and 12 more

Generate attribution file?
→ Type 'yes' to create THIRD_PARTY_LICENSES.md

⚠ UNKNOWN LICENSES (3)

Package         Issue
───────────────────────────────────────────────────────
internal-utils  No license field in package.json
legacy-helper   "UNLICENSED" - proprietary?
custom-auth     License: "SEE LICENSE" (not standard)

Action: Contact package authors or remove

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

LICENSE COMPATIBILITY MATRIX

Your license (MIT) is compatible with:
✓ MIT, ISC, BSD-2-Clause, BSD-3-Clause
✓ Apache-2.0 (include NOTICE file)
✓ LGPL-2.1, LGPL-3.0 (link dynamically, not bundle)

Your license (MIT) is NOT compatible with:
✗ GPL-2.0, GPL-3.0 (requires relicensing)
✗ AGPL-3.0 (network copyleft)
✗ SSPL (non-OSI, commercial risk)
✗ Proprietary (case-by-case)

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

RECOMMENDATIONS

1. Replace pdf-generator with pdf-lib
   $ npm uninstall pdf-generator
   $ npm install pdf-lib

2. Replace chart-component with chart.js
   $ npm uninstall chart-component
   $ npm install chart.js

3. Add licenses to internal packages

4. Generate attribution file for distribution

COMPLIANCE STATUS: ⚠ Issues Found (2 critical, 3 unknown)
```

---

## Subcommand: sbom

### Software Bill of Materials

```
/siftcoder:comply sbom
```

```
GENERATING SOFTWARE BILL OF MATERIALS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Format: CycloneDX 1.4 (JSON)
Output: sbom.json

SBOM CONTENTS

Project: my-app v1.0.0
Components: 456

By type:
├── Libraries: 445
├── Frameworks: 8
├── Applications: 2
└── Operating System: 1

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

SAMPLE SBOM OUTPUT (sbom.json)

```json
{
  "bomFormat": "CycloneDX",
  "specVersion": "1.4",
  "version": 1,
  "metadata": {
    "timestamp": "2026-01-10T12:00:00Z",
    "tools": [
      {
        "vendor": "siftcoder",
        "name": "sbom-generator",
        "version": "1.0.0"
      }
    ],
    "component": {
      "type": "application",
      "name": "my-app",
      "version": "1.0.0"
    }
  },
  "components": [
    {
      "type": "library",
      "name": "express",
      "version": "4.18.2",
      "purl": "pkg:npm/express@4.18.2",
      "licenses": [
        {
          "license": {
            "id": "MIT"
          }
        }
      ],
      "hashes": [
        {
          "alg": "SHA-256",
          "content": "abc123..."
        }
      ],
      "externalReferences": [
        {
          "type": "website",
          "url": "https://expressjs.com"
        },
        {
          "type": "vcs",
          "url": "https://github.com/expressjs/express"
        }
      ]
    }
    // ... 455 more components
  ],
  "dependencies": [
    {
      "ref": "pkg:npm/my-app@1.0.0",
      "dependsOn": [
        "pkg:npm/express@4.18.2",
        "pkg:npm/react@18.2.0"
        // ...
      ]
    }
  ],
  "vulnerabilities": [
    {
      "id": "CVE-2021-23337",
      "source": {
        "name": "NVD"
      },
      "ratings": [
        {
          "severity": "critical",
          "score": 9.8
        }
      ],
      "affects": [
        {
          "ref": "pkg:npm/lodash@4.17.20"
        }
      ]
    }
  ]
}
```

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

FILES GENERATED

├── sbom.json (CycloneDX JSON)
├── sbom.xml (CycloneDX XML)
├── sbom-spdx.json (SPDX format)
└── sbom-summary.md (Human-readable)

SBOM USES:

1. Vulnerability Management
   → Import into Snyk, Dependabot, etc.
   → Track known vulnerabilities

2. License Compliance
   → Verify all licenses are compatible
   → Generate attribution documents

3. Supply Chain Security
   → Verify component integrity
   → Track component sources

4. Regulatory Compliance
   → Required for US federal software
   → Required by some enterprise customers
```

---

## Subcommand: gdpr

### GDPR/Privacy Compliance Check

```
/siftcoder:comply gdpr
```

```
GDPR/PRIVACY COMPLIANCE CHECK
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Scanning for personal data handling...

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

PII DETECTION

Personal data fields found:

Database (Prisma schema):
├── User.email ← PII: Email address
├── User.name ← PII: Full name
├── User.phone ← PII: Phone number
├── User.address ← PII: Physical address
├── User.ipAddress ← PII: IP address
├── Order.shippingAddress ← PII: Physical address
└── Payment.cardLast4 ← PII (partial): Payment info

Code handling PII:
├── src/services/user.ts - User CRUD
├── src/services/auth.ts - Authentication
├── src/services/payment.ts - Payment processing
├── src/api/routes/users.ts - User API
└── src/utils/analytics.ts - User tracking

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

GDPR COMPLIANCE CHECKLIST

DATA COLLECTION (Article 6)
├── ✓ Consent mechanism exists (Cookie banner)
├── ✓ Privacy policy link present
├── ⚠ Consent not recorded in database
└── ❌ No opt-out for marketing emails

RIGHT TO ACCESS (Article 15)
├── ❌ No user data export feature
├── ❌ No "download my data" endpoint
└── Action: Implement data export

RIGHT TO ERASURE (Article 17)
├── ⚠ Soft delete implemented (data retained)
├── ❌ No hard delete option for users
├── ❌ Data in backups not addressed
└── Action: Implement account deletion flow

DATA MINIMIZATION (Article 5)
├── ⚠ Collecting phone (is it necessary?)
├── ⚠ Storing full IP addresses
└── Action: Review data collection necessity

DATA RETENTION
├── ❌ No retention policy defined
├── ❌ Old data not automatically purged
└── Action: Define and implement retention

DATA PROCESSING RECORDS (Article 30)
├── ❌ No processing activities documented
└── Action: Create data processing register

SECURITY (Article 32)
├── ✓ Passwords hashed (bcrypt)
├── ✓ HTTPS enforced
├── ⚠ PII not encrypted at rest
└── Action: Encrypt sensitive fields

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

REMEDIATION ACTIONS

CRITICAL:
1. Implement "Delete My Data" feature
   → /siftcoder:add-feature "GDPR account deletion"

2. Implement "Export My Data" feature
   → /siftcoder:add-feature "GDPR data export"

HIGH:
3. Add consent recording
4. Encrypt PII at rest
5. Define retention policy

MEDIUM:
6. Review data minimization
7. Create processing records
8. Add opt-out for marketing

COMPLIANCE SCORE: 45% ❌
Target: 100% for GDPR compliance
```

---

## Subcommand: standards

### Coding Standards Compliance

```
/siftcoder:comply standards
```

```
CODING STANDARDS COMPLIANCE
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Checking against: .eslintrc.js, .prettierrc, tsconfig.json, CLAUDE.md

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

COMPLIANCE SUMMARY

Overall: 89%

By category:
├── TypeScript strict mode: 95% ✓
├── ESLint rules: 92% ✓
├── Prettier formatting: 100% ✓
├── Naming conventions: 85% ⚠
├── File organization: 78% ⚠
└── Documentation: 72% ⚠

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

VIOLATIONS FOUND

TYPESCRIPT STRICTNESS (5 violations)

1. src/utils/legacy.ts:23 - any type used
   ```typescript
   function processData(data: any) {  // Avoid 'any'
   ```
   Fix: Add proper type definition

2. src/api/routes/users.ts:45 - Non-null assertion
   ```typescript
   const user = users.find(u => u.id === id)!;  // Dangerous
   ```
   Fix: Handle null case properly

NAMING CONVENTIONS (12 violations)

Files not following convention:
├── src/Utils.ts (should be: utils.ts)
├── src/API/Users.ts (should be: api/users.ts)
└── src/Components/UserCard.tsx (correct for components)

Variables:
├── src/services/user.ts:34 - UserData (should be userData)
├── src/utils/format.ts:12 - Format_String (should be formatString)

FILE ORGANIZATION (8 violations)

Files in wrong locations:
├── src/Button.tsx (should be in src/components/)
├── src/api.ts (should be in src/services/)
├── src/types.ts (should be in src/types/ or src/shared/)

Missing index files:
├── src/components/ (no index.ts)
├── src/services/ (no index.ts)

DOCUMENTATION (15 violations)

Functions missing JSDoc:
├── src/services/auth.ts:login
├── src/services/auth.ts:register
├── src/services/payment.ts:processPayment
└── ... 12 more public functions

Missing README files:
├── src/components/
├── src/services/
└── src/utils/

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

AUTO-FIX AVAILABLE

I can automatically fix:
├── 12 naming convention issues
├── 8 file organization issues
├── 100% formatting issues

Cannot auto-fix (need manual review):
├── 5 TypeScript 'any' types
├── 15 missing documentation

→ Type 'fix' to apply automatic fixes
→ Type 'report' to generate detailed report
```

---

## Tips & Hints

```
LICENSE COMPLIANCE

Safe licenses (permissive):
  → MIT, ISC, BSD-2, BSD-3
  → Apache-2.0 (include NOTICE)
  → Unlicense, CC0

Copyleft (require sharing):
  → GPL-2.0, GPL-3.0 - Strong copyleft
  → LGPL - Weak copyleft (linking OK)
  → AGPL - Network copyleft

Problematic:
  → Unknown/no license - Assume proprietary
  → "Public Domain" - Not valid everywhere
  → Custom licenses - Legal review needed

GDPR ESSENTIALS

Must implement:
  → Consent collection and recording
  → Data export (machine-readable)
  → Data deletion (hard delete option)
  → Data processing records
  → Privacy policy

Best practices:
  → Minimize data collection
  → Encrypt PII at rest
  → Define retention periods
  → Log data access

SBOM BEST PRACTICES

Include:
  → All production dependencies
  → All transitive dependencies
  → Versions and hashes
  → License information
  → Known vulnerabilities

Update:
  → On every release
  → After dependency updates
  → Store in version control
```

---

## Skills Used
- **license-analyzer** - License detection and compatibility
- **sbom-generator** - Bill of materials creation
- **pii-detector** - Personal data identification

## Allowed Tools
Read, Write, Grep, Glob, Bash, Task, AskUserQuestion
