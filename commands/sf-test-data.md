---
description: Salesforce test data management - factories, seed data, sanitization
argument-hint: <action> [object|count] [--seed|--sanitize]
allowed-tools: Read, Write, Edit, Glob, Grep, Bash
---

# /siftcoder:sf-test-data - Test Data Management

Manage test data for Salesforce development and testing. Create factories, generate seed data, and sanitize production data.

## Usage

```
/siftcoder:sf-test-data factory            - Create TestDataFactory class
/siftcoder:sf-test-data seed <count>       - Generate seed data
/siftcoder:sf-test-data sanitize           - Sanitize prod data for testing
/siftcoder:sf-test-data export <object>    - Export test data to JSON
/siftcoder:sf-test-data import <file>      - Import test data from JSON
/siftcoder:sf-test-data analyze            - Analyze test data patterns
/siftcoder:sf-test-data                    - Show data status
```

## Instructions

### Default: Show Data Status

```
TEST DATA STATUS
═══════════════════════════════════════════════════════════════

CURRENT ORG: Dev Sandbox

EXISTING TEST DATA:
├── Accounts: 2,500
├── Contacts: 8,000
├── Opportunities: 1,200
├── Custom Objects:
│   ├── Invoice__c: 500
│   └── Payment__c: 300

TEST DATA FACTORY:
├── TestDataFactory.cls: ✓ Exists
├── Methods: 15
├── Last Updated: 2026-01-10
└── Objects Supported: Account, Contact, Opportunity, Invoice__c

RECOMMENDATIONS:
├── Add factory methods for User creation
├── Consider adding bulk helper (200+ records)
└── Add HTTP mock helpers

[Create Factory] [Generate Seed Data] [Clean Up Data]
```

### factory: Create TestDataFactory

```
TEST DATA FACTORY GENERATOR
═══════════════════════════════════════════════════════════════

Analyzing project objects...

OBJECTS DETECTED:
├── Standard: Account, Contact, Opportunity, Case, Lead
├── Custom: Invoice__c, Invoice_Line_Item__c, Payment__c
└── Related: User, Profile, PermissionSet

GENERATED: TestDataFactory.cls
───────────────────────────────────────────────────────────────

/**
 * Centralized test data factory for all test classes
 *
 * IMPORTANT: This class should be the ONLY source of test data.
 * Never create test records directly in test methods.
 *
 * @group Testing
 */
@isTest
public class TestDataFactory {

    // ═══════════════════════════════════════════════════════
    // CONFIGURATION
    // ═══════════════════════════════════════════════════════

    // Default values can be overridden per test
    private static String DEFAULT_INDUSTRY = 'Technology';
    private static String DEFAULT_COUNTRY = 'United States';
    private static Date DEFAULT_CLOSE_DATE = Date.today().addDays(30);

    // ═══════════════════════════════════════════════════════
    // ACCOUNT
    // ═══════════════════════════════════════════════════════

    /**
     * Create multiple Account records (NOT inserted)
     * @param count Number of accounts to create
     * @return List of Account records
     */
    public static List<Account> createAccounts(Integer count) {
        return createAccounts(count, new Map<String, Object>());
    }

    /**
     * Create multiple Account records with overrides
     * @param count Number of accounts to create
     * @param overrides Field values to override defaults
     * @return List of Account records
     */
    public static List<Account> createAccounts(
        Integer count,
        Map<String, Object> overrides
    ) {
        List<Account> accounts = new List<Account>();
        for (Integer i = 0; i < count; i++) {
            Account acc = new Account(
                Name = 'Test Account ' + i + '_' + generateUniqueId(),
                Industry = DEFAULT_INDUSTRY,
                Type = 'Customer',
                BillingCountry = DEFAULT_COUNTRY,
                Phone = '555-' + String.valueOf(1000 + i)
            );

            // Apply overrides
            for (String field : overrides.keySet()) {
                acc.put(field, overrides.get(field));
            }

            accounts.add(acc);
        }
        return accounts;
    }

    /**
     * Create and INSERT a single account
     */
    public static Account createAndInsertAccount() {
        Account acc = createAccounts(1)[0];
        insert acc;
        return acc;
    }

    // ═══════════════════════════════════════════════════════
    // CONTACT
    // ═══════════════════════════════════════════════════════

    public static List<Contact> createContacts(Integer count) {
        return createContacts(count, null, new Map<String, Object>());
    }

    public static List<Contact> createContacts(
        Integer count,
        Id accountId,
        Map<String, Object> overrides
    ) {
        List<Contact> contacts = new List<Contact>();
        for (Integer i = 0; i < count; i++) {
            String uniqueId = generateUniqueId();
            Contact con = new Contact(
                FirstName = 'Test',
                LastName = 'Contact ' + i + '_' + uniqueId,
                Email = 'test.contact.' + uniqueId + '@example.com',
                Phone = '555-' + String.valueOf(2000 + i),
                AccountId = accountId
            );

            for (String field : overrides.keySet()) {
                con.put(field, overrides.get(field));
            }

            contacts.add(con);
        }
        return contacts;
    }

    public static List<Contact> createContactsForAccounts(
        List<Account> accounts,
        Integer contactsPerAccount
    ) {
        List<Contact> allContacts = new List<Contact>();
        for (Account acc : accounts) {
            allContacts.addAll(createContacts(contactsPerAccount, acc.Id, new Map<String, Object>()));
        }
        return allContacts;
    }

    // ═══════════════════════════════════════════════════════
    // OPPORTUNITY
    // ═══════════════════════════════════════════════════════

    public static List<Opportunity> createOpportunities(
        Integer count,
        Id accountId
    ) {
        return createOpportunities(count, accountId, 'Prospecting', new Map<String, Object>());
    }

    public static List<Opportunity> createOpportunities(
        Integer count,
        Id accountId,
        String stageName,
        Map<String, Object> overrides
    ) {
        List<Opportunity> opps = new List<Opportunity>();
        for (Integer i = 0; i < count; i++) {
            Opportunity opp = new Opportunity(
                Name = 'Test Opportunity ' + i + '_' + generateUniqueId(),
                AccountId = accountId,
                StageName = stageName,
                CloseDate = DEFAULT_CLOSE_DATE,
                Amount = 10000 + (i * 1000)
            );

            for (String field : overrides.keySet()) {
                opp.put(field, overrides.get(field));
            }

            opps.add(opp);
        }
        return opps;
    }

    // ═══════════════════════════════════════════════════════
    // INVOICE (Custom Object)
    // ═══════════════════════════════════════════════════════

    public static List<Invoice__c> createInvoices(
        Integer count,
        Id accountId
    ) {
        List<Invoice__c> invoices = new List<Invoice__c>();
        for (Integer i = 0; i < count; i++) {
            invoices.add(new Invoice__c(
                Account__c = accountId,
                Amount__c = 1000 + (i * 100),
                Status__c = 'Draft',
                Due_Date__c = Date.today().addDays(30),
                Invoice_Date__c = Date.today()
            ));
        }
        return invoices;
    }

    public static List<Invoice_Line_Item__c> createLineItems(
        Integer count,
        Id invoiceId
    ) {
        List<Invoice_Line_Item__c> items = new List<Invoice_Line_Item__c>();
        for (Integer i = 0; i < count; i++) {
            items.add(new Invoice_Line_Item__c(
                Invoice__c = invoiceId,
                Quantity__c = i + 1,
                Unit_Price__c = 100
            ));
        }
        return items;
    }

    // ═══════════════════════════════════════════════════════
    // USER
    // ═══════════════════════════════════════════════════════

    public static User createUser(String profileName) {
        Profile p = [SELECT Id FROM Profile WHERE Name = :profileName LIMIT 1];
        String uniqueId = generateUniqueId();

        return new User(
            Alias = uniqueId.left(8),
            Email = 'test.' + uniqueId + '@example.com',
            EmailEncodingKey = 'UTF-8',
            FirstName = 'Test',
            LastName = 'User ' + uniqueId,
            LanguageLocaleKey = 'en_US',
            LocaleSidKey = 'en_US',
            ProfileId = p.Id,
            TimeZoneSidKey = 'America/Los_Angeles',
            UserName = 'test.' + uniqueId + '@example.com.test'
        );
    }

    public static User createStandardUser() {
        return createUser('Standard User');
    }

    public static User createAdminUser() {
        return createUser('System Administrator');
    }

    // ═══════════════════════════════════════════════════════
    // BULK DATA HELPERS
    // ═══════════════════════════════════════════════════════

    /**
     * Create complete test data set for integration testing
     * @return Map of object type to list of records
     */
    public static Map<String, List<SObject>> createIntegrationTestData() {
        Map<String, List<SObject>> testData = new Map<String, List<SObject>>();

        // Create accounts
        List<Account> accounts = createAccounts(10);
        insert accounts;
        testData.put('Account', accounts);

        // Create contacts
        List<Contact> contacts = createContactsForAccounts(accounts, 2);
        insert contacts;
        testData.put('Contact', contacts);

        // Create opportunities
        List<Opportunity> opps = new List<Opportunity>();
        for (Account acc : accounts) {
            opps.addAll(createOpportunities(3, acc.Id));
        }
        insert opps;
        testData.put('Opportunity', opps);

        return testData;
    }

    /**
     * Create bulk test data (200+ records per object)
     */
    public static void createBulkTestData() {
        List<Account> accounts = createAccounts(200);
        insert accounts;

        List<Contact> contacts = new List<Contact>();
        for (Account acc : accounts) {
            contacts.add(createContacts(1, acc.Id, new Map<String, Object>())[0]);
        }
        insert contacts;
    }

    // ═══════════════════════════════════════════════════════
    // HTTP CALLOUT MOCKS
    // ═══════════════════════════════════════════════════════

    /**
     * Generic HTTP callout mock for testing integrations
     */
    public class MockHttpResponse implements HttpCalloutMock {
        private Integer statusCode;
        private String body;
        private Map<String, String> headers;

        public MockHttpResponse(Integer statusCode, String body) {
            this.statusCode = statusCode;
            this.body = body;
            this.headers = new Map<String, String>();
        }

        public MockHttpResponse withHeader(String key, String value) {
            this.headers.put(key, value);
            return this;
        }

        public HttpResponse respond(HttpRequest req) {
            HttpResponse res = new HttpResponse();
            res.setStatusCode(statusCode);
            res.setBody(body);
            for (String key : headers.keySet()) {
                res.setHeader(key, headers.get(key));
            }
            return res;
        }
    }

    /**
     * Success response mock (200 OK)
     */
    public static MockHttpResponse successMock(String body) {
        return new MockHttpResponse(200, body);
    }

    /**
     * Error response mock (500 Error)
     */
    public static MockHttpResponse errorMock(String message) {
        return new MockHttpResponse(500, '{"error": "' + message + '"}');
    }

    // ═══════════════════════════════════════════════════════
    // UTILITIES
    // ═══════════════════════════════════════════════════════

    /**
     * Generate unique identifier for test records
     */
    private static String generateUniqueId() {
        return String.valueOf(DateTime.now().getTime()) +
               String.valueOf(Math.random()).substring(2, 6);
    }

    /**
     * Clean up all test data (use in @TestSetup or after tests)
     */
    public static void cleanUpTestData() {
        delete [SELECT Id FROM Invoice_Line_Item__c];
        delete [SELECT Id FROM Invoice__c];
        delete [SELECT Id FROM Opportunity];
        delete [SELECT Id FROM Contact];
        delete [SELECT Id FROM Account WHERE Name LIKE 'Test%'];
    }
}
───────────────────────────────────────────────────────────────
```

### seed <count>: Generate Seed Data

```
SEED DATA GENERATION
═══════════════════════════════════════════════════════════════

Target: Dev Sandbox
Records per object: 100

GENERATING SEED DATA...

Step 1: Creating Accounts (100)
├── [████████████████████] 100/100
└── ✓ Complete

Step 2: Creating Contacts (200, 2 per account)
├── [████████████████████] 200/200
└── ✓ Complete

Step 3: Creating Opportunities (300, 3 per account)
├── [████████████████████] 300/300
└── ✓ Complete

Step 4: Creating Invoices (100)
├── [████████████████████] 100/100
└── ✓ Complete

Step 5: Creating Invoice Line Items (300)
├── [████████████████████] 300/300
└── ✓ Complete

═══════════════════════════════════════════════════════════════
SEED DATA COMPLETE
═══════════════════════════════════════════════════════════════

Total Records Created: 1,000
├── Account: 100
├── Contact: 200
├── Opportunity: 300
├── Invoice__c: 100
└── Invoice_Line_Item__c: 300

[View Data] [Export] [Delete Seed Data]
```

### sanitize: Sanitize Production Data

```
DATA SANITIZATION
═══════════════════════════════════════════════════════════════

⚠️ WARNING: This will modify sensitive data!

SANITIZATION RULES:
┌─────────────────────────────────────────────────────────────┐
│ Object    │ Field          │ Sanitization Rule              │
├─────────────────────────────────────────────────────────────┤
│ Contact   │ Email          │ test.{random}@example.com     │
│ Contact   │ Phone          │ 555-{random}                   │
│ Contact   │ SSN__c         │ XXX-XX-XXXX                    │
│ Account   │ Phone          │ 555-{random}                   │
│ Account   │ Website        │ https://example.com            │
│ User      │ Email          │ user.{id}@example.com          │
│ Lead      │ Email          │ lead.{random}@example.com      │
│ Lead      │ Phone          │ 555-{random}                   │
└─────────────────────────────────────────────────────────────┘

GENERATED: DataSanitizer.cls
───────────────────────────────────────────────────────────────

public class DataSanitizer {

    public static void sanitizeAllData() {
        sanitizeContacts();
        sanitizeAccounts();
        sanitizeLeads();
    }

    public static void sanitizeContacts() {
        List<Contact> contacts = [
            SELECT Id, Email, Phone, SSN__c
            FROM Contact
            LIMIT 10000
        ];

        for (Contact c : contacts) {
            c.Email = 'test.' + generateRandom() + '@example.com';
            c.Phone = '555-' + generateRandom();
            if (c.SSN__c != null) {
                c.SSN__c = 'XXX-XX-XXXX';
            }
        }

        update contacts;
    }

    // ... similar methods for other objects

    private static String generateRandom() {
        return String.valueOf(Math.abs(Crypto.getRandomInteger())).left(6);
    }
}
───────────────────────────────────────────────────────────────

[Preview Changes] [Run Sanitization] [Export Sanitized Data]
```

## Best Practices

```
TEST DATA BEST PRACTICES
═══════════════════════════════════════════════════════════════

1. USE FACTORY METHODS
   ✗ Account acc = new Account(Name = 'Test');
   ✓ Account acc = TestDataFactory.createAccount();

2. DON'T RELY ON ORG DATA
   ✗ Account acc = [SELECT Id FROM Account LIMIT 1];
   ✓ Account acc = TestDataFactory.createAndInsertAccount();

3. USE @TESTSETUP FOR SHARED DATA
   @TestSetup
   static void setup() {
       TestDataFactory.createBulkTestData();
   }

4. GENERATE UNIQUE IDENTIFIERS
   Name = 'Test ' + DateTime.now().getTime();

5. SUPPORT BULK TESTING
   List<Account> accs = TestDataFactory.createAccounts(200);
```

## Integration

Works well with:
- `/siftcoder:sf-test` - Generate tests using factory
- `/siftcoder:apex` - Analyze required test data
- `/siftcoder:schema` - Understand object relationships
