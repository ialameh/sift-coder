---
description: Apex development - analyze anti-patterns, bulkify code, generate enterprise patterns
argument-hint: <action> [file|object] [--fix|--generate]
allowed-tools: Read, Write, Edit, Glob, Grep, Bash
---

# /siftcoder:apex - Apex Development & Analysis

Comprehensive Apex code analysis and generation. Detect governor limit risks, auto-bulkify code, and implement enterprise patterns.

## Usage

```
/siftcoder:apex analyze <file>        - Analyze Apex for anti-patterns
/siftcoder:apex bulkify <file>        - Auto-bulkify code
/siftcoder:apex optimize <file>       - Governor limit optimization
/siftcoder:apex trigger <object>      - Generate trigger handler pattern
/siftcoder:apex service <name>        - Generate service class
/siftcoder:apex selector <object>     - Generate selector pattern
/siftcoder:apex domain <object>       - Generate domain class
/siftcoder:apex                       - Analyze all Apex in project
```

## Instructions

### Default (No Args): Analyze Project

Scan entire project for Apex issues:

**Step 1: Find All Apex Files**

```bash
find force-app -name "*.cls" -o -name "*.trigger"
```

**Step 2: Analyze Each File**

For each file, check for:

```
CRITICAL ANTI-PATTERNS
═══════════════════════════════════════════════════════════════

1. SOQL IN LOOPS
   Pattern: for(...) { ... [SELECT ...] ... }
   Fix: Query before loop, use Map<Id, SObject>

2. DML IN LOOPS
   Pattern: for(...) { ... insert/update/delete ... }
   Fix: Collect in List, single DML after loop

3. HARDCODED IDS
   Pattern: '001...' or '00G...' literals
   Fix: Use Custom Metadata or Custom Settings

4. NO NULL CHECKS
   Pattern: list.size() without null check
   Fix: if(list != null && !list.isEmpty())

5. MISSING BULKIFICATION
   Pattern: Method accepts single record
   Fix: Accept List<SObject>, process in bulk

6. NO RECURSION CONTROL
   Pattern: Trigger without static boolean guard
   Fix: Add TriggerHandler with recursion check

7. INEFFICIENT QUERIES
   Pattern: SELECT * or missing WHERE clause
   Fix: Select only needed fields, add filters

8. MIXED CONCERNS
   Pattern: Queries and DML in trigger body
   Fix: Use Handler/Service/Selector patterns
```

**Step 3: Output Summary**

```
APEX ANALYSIS REPORT
═══════════════════════════════════════════════════════════════

Scanned: 45 classes, 12 triggers
Issues Found: 23

CRITICAL (Fix Immediately):
├── AccountTrigger.trigger:34 - SOQL in loop
├── ContactService.cls:89 - DML in loop
└── OpportunityHelper.cls:12 - Hardcoded Record Type ID

HIGH (Governor Limit Risk):
├── LeadProcessor.cls - No bulkification (accepts single record)
├── AccountTrigger.trigger - No recursion control
└── CaseService.cls:156 - N+1 query pattern

MEDIUM (Code Quality):
├── OrderService.cls - Mixed concerns
├── InvoiceHelper.cls - Missing null checks
└── ProductSelector.cls - Inefficient query

RECOMMENDATIONS:
1. Implement TriggerHandler framework for all triggers
2. Create Selector classes for SOQL
3. Use UnitOfWork for DML operations

[Fix All Critical] [Generate Report] [View Details]
```

### analyze <file>: Deep File Analysis

When user provides specific file:

**Step 1: Read and Parse File**

```bash
# Read the file content
```

**Step 2: Perform Analysis**

```
APEX ANALYSIS: AccountService.cls
═══════════════════════════════════════════════════════════════

FILE INFO:
├── Type: Service Class
├── Lines: 234
├── Methods: 12
├── Test Coverage: Unknown (run sf apex test for coverage)

GOVERNOR LIMIT RISKS:
├── [CRITICAL] Line 45: SOQL inside for loop
│   Code: for(Account a : accounts) { Contact c = [SELECT...]; }
│   └── Fix: Query all contacts before loop with Map<Id, List<Contact>>
│
├── [HIGH] Line 78: DML inside loop
│   Code: for(Account a : accounts) { update a; }
│   └── Fix: Collect records, single update after loop
│
└── [MEDIUM] Line 102: List.size() without null check
    Code: if(results.size() > 0)
    └── Fix: if(results != null && !results.isEmpty())

BULKIFICATION ISSUES:
├── Method: processAccount(Account acc)
│   └── Should accept List<Account> for bulk processing
│
└── Method: updateContact(Contact c, String newEmail)
    └── Should accept List<Contact> or Map

PATTERN VIOLATIONS:
├── Lines 50-60: Raw SOQL query in service method
│   └── Extract to AccountSelector.cls
│
├── Lines 90-95: Direct DML statements
│   └── Use UnitOfWork pattern
│
└── No interface defined
    └── Create IAccountService for testability

SECURITY CONCERNS:
├── Line 120: No CRUD/FLS check before DML
│   └── Add Schema.sObjectType.Account.isUpdateable()
│
└── Line 150: SOQL without WITH SECURITY_ENFORCED
    └── Add sharing enforcement or explicit check

SUGGESTED FIXES:
┌─────────────────────────────────────────────────────────────┐
│ Auto-fix available for 5 issues. Apply? [Y/n]               │
└─────────────────────────────────────────────────────────────┘
```

### bulkify <file>: Auto-Bulkify Code

Transform non-bulk-safe code to bulk patterns:

**Step 1: Identify Non-Bulk Patterns**

**Step 2: Transform Code**

```
BULKIFICATION: AccountProcessor.cls
═══════════════════════════════════════════════════════════════

BEFORE (Line 25-35):
───────────────────────────────────────────────────────────────
public void processAccount(Account acc) {
    Contact c = [SELECT Id, Email FROM Contact
                 WHERE AccountId = :acc.Id LIMIT 1];
    acc.Primary_Contact__c = c.Id;
    update acc;
}
───────────────────────────────────────────────────────────────

AFTER:
───────────────────────────────────────────────────────────────
public void processAccounts(List<Account> accounts) {
    Set<Id> accountIds = new Set<Id>();
    for(Account acc : accounts) {
        accountIds.add(acc.Id);
    }

    Map<Id, Contact> contactsByAccountId = new Map<Id, Contact>();
    for(Contact c : [SELECT Id, Email, AccountId FROM Contact
                     WHERE AccountId IN :accountIds]) {
        contactsByAccountId.put(c.AccountId, c);
    }

    List<Account> accountsToUpdate = new List<Account>();
    for(Account acc : accounts) {
        Contact c = contactsByAccountId.get(acc.Id);
        if(c != null) {
            acc.Primary_Contact__c = c.Id;
            accountsToUpdate.add(acc);
        }
    }

    if(!accountsToUpdate.isEmpty()) {
        update accountsToUpdate;
    }
}
───────────────────────────────────────────────────────────────

CHANGES MADE:
├── Method signature: Account -> List<Account>
├── Extracted IDs to Set for bulk query
├── Query moved outside loop (1 SOQL instead of N)
├── DML moved outside loop (1 DML instead of N)
└── Added null safety checks

[Apply Changes] [Preview Diff] [Revert]
```

### trigger <object>: Generate Trigger Handler

Generate enterprise trigger handler pattern:

**Step 1: Get Object API Name**

**Step 2: Generate Files**

```
TRIGGER HANDLER: Account
═══════════════════════════════════════════════════════════════

Files Generated:

1. force-app/main/default/triggers/AccountTrigger.trigger
───────────────────────────────────────────────────────────────
trigger AccountTrigger on Account (
    before insert, before update, before delete,
    after insert, after update, after delete, after undelete
) {
    new AccountTriggerHandler().run();
}
───────────────────────────────────────────────────────────────

2. force-app/main/default/classes/AccountTriggerHandler.cls
───────────────────────────────────────────────────────────────
public with sharing class AccountTriggerHandler extends TriggerHandler {

    private List<Account> newRecords;
    private List<Account> oldRecords;
    private Map<Id, Account> newMap;
    private Map<Id, Account> oldMap;

    public AccountTriggerHandler() {
        this.newRecords = (List<Account>) Trigger.new;
        this.oldRecords = (List<Account>) Trigger.old;
        this.newMap = (Map<Id, Account>) Trigger.newMap;
        this.oldMap = (Map<Id, Account>) Trigger.oldMap;
    }

    protected override void beforeInsert() {
        // Add before insert logic
    }

    protected override void beforeUpdate() {
        // Add before update logic
    }

    protected override void afterInsert() {
        // Add after insert logic
    }

    protected override void afterUpdate() {
        // Add after update logic
    }

    // Additional handlers as needed
}
───────────────────────────────────────────────────────────────

3. force-app/main/default/classes/TriggerHandler.cls (if missing)
   [Base class with recursion control and bypass capability]

4. force-app/main/default/classes/AccountTriggerHandlerTest.cls
   [Test class with 85%+ coverage target]

[Deploy to Org] [Customize Handler] [Add Bypass Logic]
```

### service <name>: Generate Service Class

Generate service layer following enterprise patterns:

```
SERVICE CLASS: InvoiceService
═══════════════════════════════════════════════════════════════

Generated: force-app/main/default/classes/InvoiceService.cls

public with sharing class InvoiceService {

    /**
     * Creates invoices for the given accounts
     * @param accountIds Set of Account IDs to create invoices for
     * @return List of created Invoice records
     */
    public static List<Invoice__c> createInvoices(Set<Id> accountIds) {
        // Validate input
        if(accountIds == null || accountIds.isEmpty()) {
            throw new InvoiceServiceException('Account IDs required');
        }

        // Query required data via Selector
        List<Account> accounts = AccountSelector.selectByIds(accountIds);

        // Build invoices
        List<Invoice__c> invoices = new List<Invoice__c>();
        for(Account acc : accounts) {
            invoices.add(new Invoice__c(
                Account__c = acc.Id,
                Status__c = 'Draft',
                Invoice_Date__c = Date.today()
            ));
        }

        // Use UnitOfWork for DML
        fflib_SObjectUnitOfWork uow = new fflib_SObjectUnitOfWork(
            new List<Schema.SObjectType>{ Invoice__c.SObjectType }
        );
        uow.registerNew(invoices);
        uow.commitWork();

        return invoices;
    }
}
───────────────────────────────────────────────────────────────

Also Generated:
├── IInvoiceService.cls (interface)
├── InvoiceServiceException.cls
└── InvoiceServiceTest.cls
```

### selector <object>: Generate Selector Pattern

```
SELECTOR: AccountSelector
═══════════════════════════════════════════════════════════════

Generated: force-app/main/default/classes/AccountSelector.cls

public inherited sharing class AccountSelector {

    private static final List<Schema.SObjectField> FIELDS = new List<Schema.SObjectField>{
        Account.Id,
        Account.Name,
        Account.Industry,
        Account.Type,
        Account.OwnerId,
        Account.CreatedDate
    };

    public static List<Account> selectByIds(Set<Id> accountIds) {
        return [
            SELECT Id, Name, Industry, Type, OwnerId, CreatedDate
            FROM Account
            WHERE Id IN :accountIds
            WITH SECURITY_ENFORCED
        ];
    }

    public static List<Account> selectByIndustry(String industry) {
        return [
            SELECT Id, Name, Industry, Type, OwnerId, CreatedDate
            FROM Account
            WHERE Industry = :industry
            WITH SECURITY_ENFORCED
        ];
    }

    public static List<Account> selectWithContacts(Set<Id> accountIds) {
        return [
            SELECT Id, Name, Industry,
                (SELECT Id, Name, Email FROM Contacts)
            FROM Account
            WHERE Id IN :accountIds
            WITH SECURITY_ENFORCED
        ];
    }
}
```

### domain <object>: Generate Domain Pattern

```
DOMAIN CLASS: Accounts (Domain Pattern)
═══════════════════════════════════════════════════════════════

Generated: force-app/main/default/classes/Accounts.cls

public with sharing class Accounts extends fflib_SObjectDomain {

    public Accounts(List<Account> records) {
        super(records);
    }

    public class Constructor implements fflib_SObjectDomain.IConstructable {
        public fflib_SObjectDomain construct(List<SObject> records) {
            return new Accounts(records);
        }
    }

    public override void onBeforeInsert() {
        for(Account acc : (List<Account>) Records) {
            setDefaults(acc);
        }
    }

    public override void onBeforeUpdate(Map<Id, SObject> existingRecords) {
        for(Account acc : (List<Account>) Records) {
            Account oldAcc = (Account) existingRecords.get(acc.Id);
            validateChanges(acc, oldAcc);
        }
    }

    private void setDefaults(Account acc) {
        if(String.isBlank(acc.Type)) {
            acc.Type = 'Prospect';
        }
    }

    private void validateChanges(Account newAcc, Account oldAcc) {
        // Add validation logic
    }
}
```

## Quick Reference: Governor Limits

```
SALESFORCE GOVERNOR LIMITS (Per Transaction)
═══════════════════════════════════════════════════════════════

SOQL:
├── Queries: 100 (sync) / 200 (async)
├── Records retrieved: 50,000
├── Query locator rows: 10,000
└── Aggregate queries: 300

DML:
├── Statements: 150
├── Records: 10,000
└── Heap size: 6MB (sync) / 12MB (async)

CPU:
├── Sync: 10,000ms
└── Async: 60,000ms

Callouts:
├── Count: 100
├── Timeout: 120 seconds total
└── Max response size: 12MB

Other:
├── Future calls: 50
├── Queueable jobs: 50
├── Email invocations: 10
└── Push notifications: 10
```

## Integration

Works well with:
- `/siftcoder:sf-test` - Generate tests for Apex
- `/siftcoder:sf-debug` - Analyze debug logs
- `/siftcoder:apex-patterns` - Full FFLib setup
