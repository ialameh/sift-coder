---
description: Salesforce architecture review - security, scalability, governor limits, sharing model
argument-hint: <review-type> [scope] [--detailed|--checklist]
allowed-tools: Read, Write, Edit, Glob, Grep, Bash
---

# /siftcoder:sf-architect-review - Architecture Review

Comprehensive architecture review for Salesforce implementations. Evaluate security, scalability, governor limit compliance, and sharing model design.

## Usage

```
/siftcoder:sf-architect-review security  - Security review
/siftcoder:sf-architect-review scale     - Scalability review
/siftcoder:sf-architect-review governor  - Governor limit review
/siftcoder:sf-architect-review sharing   - Sharing model review
/siftcoder:sf-architect-review full      - Complete architecture review
/siftcoder:sf-architect-review          - Review overview
```

## Instructions

### Default: Review Overview

```
ARCHITECTURE REVIEW OVERVIEW
═══════════════════════════════════════════════════════════════

PROJECT: Enterprise Sales Implementation
REVIEW DATE: 2026-01-12

REVIEW SCORES:
┌─────────────────────────────────────────────────────────────┐
│ Category          │ Score │ Grade │ Status                 │
├─────────────────────────────────────────────────────────────┤
│ Security          │ 85/100│ B+    │ Good, minor issues     │
│ Scalability       │ 78/100│ C+    │ Needs attention        │
│ Governor Limits   │ 92/100│ A-    │ Well optimized         │
│ Sharing Model     │ 88/100│ B+    │ Properly designed      │
│ Code Quality      │ 80/100│ B     │ Some refactoring needed│
├─────────────────────────────────────────────────────────────┤
│ OVERALL           │ 84/100│ B     │ Production Ready*      │
└─────────────────────────────────────────────────────────────┘

* With recommended improvements

CRITICAL FINDINGS:
├── [HIGH] 3 Apex classes missing CRUD/FLS checks
├── [HIGH] N+1 query pattern in 2 trigger handlers
└── [MEDIUM] Hardcoded IDs found in 5 locations

QUICK WINS:
├── Add WITH SECURITY_ENFORCED to 8 queries
├── Implement trigger bypass mechanism
└── Move hardcoded IDs to Custom Metadata

[View Full Report] [Security Review] [Scalability Review]
```

### security: Security Architecture Review

```
SECURITY ARCHITECTURE REVIEW
═══════════════════════════════════════════════════════════════

OVERALL SCORE: 85/100 (B+)

AUTHENTICATION & AUTHORIZATION
───────────────────────────────────────────────────────────────

✓ PASSED:
├── MFA enabled for all users
├── Session settings configured appropriately
├── Password policies meet requirements
├── Login IP restrictions configured
└── OAuth scopes properly restricted

⚠️ WARNINGS:
├── API-only user without IP restrictions
└── Some profiles have excessive permissions

APEX SECURITY
───────────────────────────────────────────────────────────────

CRUD/FLS ANALYSIS:
┌─────────────────────────────────────────────────────────────┐
│ Class                    │ CRUD Check │ FLS Check │ Status  │
├─────────────────────────────────────────────────────────────┤
│ AccountService.cls       │ Yes        │ Yes       │ ✓ PASS  │
│ ContactService.cls       │ Yes        │ No        │ ⚠️ WARN │
│ InvoiceService.cls       │ No         │ No        │ ✗ FAIL  │
│ ReportGenerator.cls      │ Yes        │ Yes       │ ✓ PASS  │
│ LegacyHelper.cls         │ No         │ No        │ ✗ FAIL  │
└─────────────────────────────────────────────────────────────┘

ISSUES FOUND:

[CRITICAL] InvoiceService.cls:45 - No CRUD check before DML
───────────────────────────────────────────────────────────────
// Current (Insecure)
insert newInvoice;

// Recommended
if (!Schema.sObjectType.Invoice__c.isCreateable()) {
    throw new SecurityException('No create access to Invoice');
}
insert newInvoice;
───────────────────────────────────────────────────────────────

[CRITICAL] LegacyHelper.cls:78 - Query without FLS enforcement
───────────────────────────────────────────────────────────────
// Current (Insecure)
SELECT Id, Name, SSN__c FROM Contact

// Recommended
SELECT Id, Name, SSN__c FROM Contact WITH SECURITY_ENFORCED

// Or use Security.stripInaccessible()
───────────────────────────────────────────────────────────────

SOQL INJECTION ANALYSIS:
├── ✓ No dynamic SOQL with user input found
├── ✓ String.escapeSingleQuotes used appropriately
└── ✓ Bind variables used in all queries

SHARING MODEL:
├── ✓ All classes use 'with sharing' appropriately
├── ✓ 'without sharing' justified and documented
└── ✓ 'inherited sharing' used for utility classes

LWC SECURITY:
├── ✓ @api properties validated
├── ⚠️ innerHTML usage found (1 instance)
└── ✓ No hardcoded credentials

INTEGRATION SECURITY:
───────────────────────────────────────────────────────────────
┌─────────────────────────────────────────────────────────────┐
│ Integration      │ Auth Type    │ Credential Storage│ Grade │
├─────────────────────────────────────────────────────────────┤
│ Stripe API       │ OAuth 2.0    │ Named Credential  │ A     │
│ Twilio API       │ Basic Auth   │ Named Credential  │ B     │
│ Legacy ERP       │ API Key      │ Custom Setting    │ C     │
│ Internal API     │ JWT          │ Named Credential  │ A     │
└─────────────────────────────────────────────────────────────┘

[MEDIUM] Legacy ERP uses Custom Setting for API key
└── Recommendation: Migrate to Named Credential + External Cred

RECOMMENDATIONS:
1. Add CRUD checks to InvoiceService.cls and LegacyHelper.cls
2. Add WITH SECURITY_ENFORCED to all SOQL queries
3. Migrate Legacy ERP credentials to Named Credential
4. Review innerHTML usage in LWC component
5. Add IP restrictions to API-only user

[Generate Security Report] [Auto-Fix CRUD/FLS] [Export Findings]
```

### scale: Scalability Review

```
SCALABILITY REVIEW
═══════════════════════════════════════════════════════════════

OVERALL SCORE: 78/100 (C+)

CURRENT SCALE:
├── Users: 1,500
├── Records: 2.8M total
├── Daily Transactions: 50,000
└── API Calls: 450,000/day

PROJECTED SCALE (12 months):
├── Users: 2,500 (+67%)
├── Records: 5M (+78%)
├── Daily Transactions: 100,000 (+100%)
└── API Calls: 800,000/day (+78%)

BULK OPERATION ANALYSIS:
───────────────────────────────────────────────────────────────

APEX TRIGGERS:
┌─────────────────────────────────────────────────────────────┐
│ Trigger              │ Bulk Safe │ Recursion │ Score       │
├─────────────────────────────────────────────────────────────┤
│ AccountTrigger       │ Yes       │ Protected │ A           │
│ ContactTrigger       │ Yes       │ Protected │ A           │
│ InvoiceTrigger       │ Partial   │ No Guard  │ C           │
│ OpportunityTrigger   │ Yes       │ Protected │ A           │
│ TaskTrigger          │ No        │ No Guard  │ F           │
└─────────────────────────────────────────────────────────────┘

[CRITICAL] TaskTrigger - Not bulk safe
───────────────────────────────────────────────────────────────
Line 15:
for (Task t : Trigger.new) {
    // SOQL IN LOOP - Will fail at 100+ records
    User owner = [SELECT Id, Name FROM User WHERE Id = :t.OwnerId];
    ...
}

Recommendation:
Set<Id> ownerIds = new Set<Id>();
for (Task t : Trigger.new) {
    ownerIds.add(t.OwnerId);
}
Map<Id, User> owners = new Map<Id, User>(
    [SELECT Id, Name FROM User WHERE Id IN :ownerIds]
);
───────────────────────────────────────────────────────────────

SERVICE CLASS ANALYSIS:
┌─────────────────────────────────────────────────────────────┐
│ Service              │ Bulk Methods │ Async Support│ Score  │
├─────────────────────────────────────────────────────────────┤
│ AccountService       │ Yes          │ Queueable    │ A      │
│ InvoiceService       │ Partial      │ No           │ C      │
│ ReportService        │ No           │ Batch        │ B      │
│ IntegrationService   │ Yes          │ Future       │ B+     │
└─────────────────────────────────────────────────────────────┘

ASYNC PROCESSING:
├── Batch Jobs: 5 defined
│   ├── DailyAccountSync (optimized)
│   ├── InvoiceProcessor (needs review)
│   └── DataCleanup (optimized)
├── Queueable: 8 classes
├── Future Methods: 12 (consider consolidating)
└── Platform Events: 3 event types

QUERY OPTIMIZATION:
───────────────────────────────────────────────────────────────

SLOW QUERIES IDENTIFIED:
1. AccountSelector.cls:67 - No index on Custom_Field__c
   └── Add custom index: Custom_Field__c

2. InvoiceSelector.cls:89 - Unselective query
   └── Add compound filter or index

3. ReportGenerator.cls:234 - Large result set
   └── Add LIMIT or pagination

INDEX RECOMMENDATIONS:
├── Account.Custom_Field__c - High selectivity, frequent filter
├── Invoice__c.Status__c + Due_Date__c - Compound index
└── Contact.External_Id__c - Integration key

CACHING ANALYSIS:
├── Platform Cache: Not utilized
├── Session Cache: Minimal usage
└── Recommendation: Implement cache for reference data

RECOMMENDATIONS:
1. [CRITICAL] Fix TaskTrigger bulkification
2. [HIGH] Add recursion guard to InvoiceTrigger
3. [MEDIUM] Implement Platform Cache for picklist values
4. [MEDIUM] Add bulk methods to InvoiceService
5. [LOW] Consolidate future methods into queueable

[Generate Optimization Plan] [Fix Critical Issues] [Export Report]
```

### governor: Governor Limit Review

```
GOVERNOR LIMIT REVIEW
═══════════════════════════════════════════════════════════════

OVERALL SCORE: 92/100 (A-)

APEX CODE ANALYSIS:
───────────────────────────────────────────────────────────────

SOQL IN LOOPS:
├── Found: 2 instances
├── AccountTrigger.cls:45 - FIXED ✓
└── TaskTrigger.cls:15 - NEEDS FIX ✗

DML IN LOOPS:
├── Found: 1 instance
└── InvoiceService.cls:89 - NEEDS FIX ✗

QUERY COUNT ANALYSIS:
┌─────────────────────────────────────────────────────────────┐
│ Transaction Type    │ Avg SOQL │ Max SOQL │ Limit │ Risk   │
├─────────────────────────────────────────────────────────────┤
│ Account Insert      │ 12       │ 25       │ 100   │ Low    │
│ Invoice Process     │ 45       │ 78       │ 100   │ Medium │
│ Daily Batch         │ 180      │ 195      │ 200   │ High   │
│ API Integration     │ 8        │ 15       │ 100   │ Low    │
└─────────────────────────────────────────────────────────────┘

[HIGH RISK] Daily Batch - Close to SOQL limit
───────────────────────────────────────────────────────────────
Current: 180-195 SOQL queries per batch execute
Limit: 200 (async context)
Headroom: 2.5-10%

Recommendations:
1. Consolidate queries in batch execute method
2. Use queryLocator instead of multiple queries
3. Consider reducing batch size from 200 to 100
───────────────────────────────────────────────────────────────

HEAP SIZE ANALYSIS:
├── Average: 3.2 MB
├── Maximum observed: 5.1 MB
├── Limit: 6 MB (sync) / 12 MB (async)
└── Risk: Medium

CALLOUT ANALYSIS:
├── Max callouts per transaction: 8
├── Limit: 100
├── Risk: Low
└── Note: Consider async for multiple callouts

CPU TIME ANALYSIS:
├── Average: 2,100 ms
├── Maximum observed: 7,500 ms
├── Limit: 10,000 ms
└── Risk: Medium (peaks need monitoring)

BEST PRACTICES CHECKLIST:
───────────────────────────────────────────────────────────────
✓ Queries moved outside loops
✓ Selective queries with indexed fields
✓ Bulk DML operations
✓ Async processing for heavy operations
⚠️ Some queries approaching row limits
⚠️ CPU time peaks need investigation
✗ 2 SOQL-in-loop violations remaining

RECOMMENDATIONS:
1. Fix remaining SOQL in loop (TaskTrigger.cls)
2. Fix DML in loop (InvoiceService.cls)
3. Add monitoring for CPU time peaks
4. Optimize Daily Batch to reduce SOQL count
5. Implement query result caching where appropriate

[Fix All Issues] [Generate Compliance Report] [Set Monitoring]
```

### sharing: Sharing Model Review

```
SHARING MODEL REVIEW
═══════════════════════════════════════════════════════════════

OVERALL SCORE: 88/100 (B+)

ORG-WIDE DEFAULTS:
───────────────────────────────────────────────────────────────
┌─────────────────────────────────────────────────────────────┐
│ Object          │ Internal     │ External     │ Status     │
├─────────────────────────────────────────────────────────────┤
│ Account         │ Private      │ Private      │ ✓ Correct  │
│ Contact         │ Controlled   │ Private      │ ✓ Correct  │
│ Opportunity     │ Private      │ Private      │ ✓ Correct  │
│ Invoice__c      │ Private      │ Private      │ ✓ Correct  │
│ Report__c       │ Public RW    │ Private      │ ⚠️ Review  │
│ Audit_Log__c    │ Public RO    │ Private      │ ✓ Correct  │
└─────────────────────────────────────────────────────────────┘

[WARNING] Report__c - Public Read/Write may be too permissive
└── Recommendation: Review if all users should edit all reports

ROLE HIERARCHY:
───────────────────────────────────────────────────────────────
CEO
├── VP Sales
│   ├── Regional Manager West
│   │   ├── Sales Rep 1
│   │   └── Sales Rep 2
│   └── Regional Manager East
│       ├── Sales Rep 3
│       └── Sales Rep 4
├── VP Operations
│   └── Operations Manager
└── VP Finance
    └── Finance Manager

Analysis:
├── ✓ Hierarchy properly reflects org structure
├── ✓ Data rolls up appropriately
└── ✓ No orphaned roles

SHARING RULES:
───────────────────────────────────────────────────────────────
┌─────────────────────────────────────────────────────────────┐
│ Rule Name              │ Object      │ Type      │ Status   │
├─────────────────────────────────────────────────────────────┤
│ West_Region_Accounts   │ Account     │ Criteria  │ ✓ Active │
│ Finance_All_Invoices   │ Invoice__c  │ Owner     │ ✓ Active │
│ Support_All_Cases      │ Case        │ Criteria  │ ✓ Active │
│ Legacy_Rule_1          │ Account     │ Owner     │ ⚠️ Review│
└─────────────────────────────────────────────────────────────┘

[WARNING] Legacy_Rule_1 - Old sharing rule, verify still needed

APEX SHARING ANALYSIS:
───────────────────────────────────────────────────────────────
┌─────────────────────────────────────────────────────────────┐
│ Class                  │ Sharing Keyword   │ Analysis       │
├─────────────────────────────────────────────────────────────┤
│ AccountService         │ with sharing      │ ✓ Correct      │
│ InvoiceService         │ with sharing      │ ✓ Correct      │
│ BatchProcessor         │ without sharing   │ ⚠️ Documented  │
│ UtilityClass           │ inherited sharing │ ✓ Correct      │
│ LegacyHelper           │ (none - global)   │ ✗ Fix          │
└─────────────────────────────────────────────────────────────┘

[ISSUE] LegacyHelper.cls - No sharing keyword specified
───────────────────────────────────────────────────────────────
// Current (defaults to 'without sharing' in some contexts)
public class LegacyHelper {

// Recommended
public with sharing class LegacyHelper {
───────────────────────────────────────────────────────────────

MANUAL SHARING:
├── Manual shares: 245 records
├── Objects with manual sharing: Account, Opportunity
└── Review: Consider if sharing rules can replace manual shares

RECOMMENDATIONS:
1. Add 'with sharing' to LegacyHelper.cls
2. Review Report__c OWD - consider making Private
3. Audit Legacy_Rule_1 sharing rule
4. Document business justification for 'without sharing' usage
5. Review manual shares - may indicate sharing rule gaps

[Generate Sharing Report] [Fix Apex Sharing] [Export Analysis]
```

### full: Complete Architecture Review

```
COMPLETE ARCHITECTURE REVIEW
═══════════════════════════════════════════════════════════════

Generating comprehensive review...

[████████████████████] 100%

EXECUTIVE SUMMARY:
├── Security: B+ (85/100)
├── Scalability: C+ (78/100)
├── Governor Limits: A- (92/100)
├── Sharing Model: B+ (88/100)
├── Code Quality: B (80/100)
└── OVERALL: B (84/100) - Production Ready with improvements

CRITICAL ISSUES (Must Fix):
1. TaskTrigger.cls - SOQL in loop (Performance)
2. InvoiceService.cls - No CRUD/FLS checks (Security)
3. LegacyHelper.cls - Missing sharing keyword (Security)

HIGH PRIORITY (Should Fix):
4. Daily Batch - Near SOQL limit (Scalability)
5. InvoiceTrigger - No recursion guard (Reliability)
6. Legacy ERP - Credentials in Custom Setting (Security)

MEDIUM PRIORITY (Nice to Fix):
7. Report__c OWD too permissive (Security)
8. Platform Cache not utilized (Performance)
9. Future methods need consolidation (Maintainability)

FULL REPORT EXPORTED:
└── docs/architecture/review-2026-01-12.pdf

[View Full Report] [Create Action Plan] [Schedule Follow-up]
```

## Integration

Works well with:
- `/siftcoder:sf-architect` - Generate diagrams
- `/siftcoder:apex` - Fix code issues
- `/siftcoder:security` - Security analysis
