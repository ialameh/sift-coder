---
description: Salesforce test generation - comprehensive tests, coverage analysis, bulk testing, mocks
argument-hint: <action> [class|trigger] [--bulk|--negative|--mock]
allowed-tools: Read, Write, Edit, Glob, Grep, Bash
---

# /siftcoder:sf-test - Salesforce Test Generation

Generate comprehensive Apex test classes. Create tests for positive, negative, bulk, and edge cases. Analyze coverage gaps and generate mock classes.

## Usage

```
/siftcoder:sf-test generate <class>    - Generate test class
/siftcoder:sf-test coverage            - Analyze coverage gaps
/siftcoder:sf-test bulk <class>        - Generate bulk test data
/siftcoder:sf-test negative <class>    - Generate negative test cases
/siftcoder:sf-test mock <class>        - Generate mock class
/siftcoder:sf-test factory             - Create test data factory
/siftcoder:sf-test run [class]         - Run tests with analysis
/siftcoder:sf-test                     - Test status overview
```

## Instructions

### Default: Test Status Overview

```
SALESFORCE TEST STATUS
═══════════════════════════════════════════════════════════════

PROJECT COVERAGE: 78% (Target: 75%)

CLASSES BY COVERAGE:
┌─────────────────────────────────────────────────────────────┐
│ Class                    │ Coverage │ Status │ Test Class  │
├─────────────────────────────────────────────────────────────┤
│ AccountService.cls       │ 92%      │ ✓      │ Yes         │
│ ContactService.cls       │ 87%      │ ✓      │ Yes         │
│ InvoiceTriggerHandler    │ 85%      │ ✓      │ Yes         │
│ PaymentProcessor.cls     │ 72%      │ ⚠️      │ Yes         │
│ LegacyHelper.cls         │ 45%      │ ✗      │ Partial     │
│ IntegrationService.cls   │ 0%       │ ✗      │ No          │
└─────────────────────────────────────────────────────────────┘

UNCOVERED CLASSES (Need Tests):
├── IntegrationService.cls (0%)
├── WebhookHandler.cls (0%)
└── BatchProcessor.cls (0%)

UNDER THRESHOLD (<75%):
├── PaymentProcessor.cls (72%)
├── LegacyHelper.cls (45%)
└── ReportGenerator.cls (68%)

TEST EXECUTION SUMMARY (Last Run):
├── Total Tests: 156
├── Passed: 154
├── Failed: 2
├── Duration: 45 seconds
└── Last Run: 2026-01-12 10:30:00

FAILED TESTS:
├── PaymentProcessorTest.testRefund_InsufficientFunds
│   └── Expected: PaymentException, Got: NullPointerException
└── LegacyHelperTest.testBulkUpdate
    └── Error: SOQL 101 limit exceeded

[Generate Missing Tests] [Fix Failed Tests] [Run All Tests]
```

### generate <class>: Generate Test Class

**Step 1: Analyze Source Class**

```bash
# Read the class being tested
```

**Step 2: Generate Comprehensive Tests**

```
TEST GENERATION: AccountService.cls
═══════════════════════════════════════════════════════════════

Analyzing source class...

SOURCE ANALYSIS:
├── Type: Service Class
├── Methods: 8
├── Dependencies: AccountSelector, UnitOfWork
├── DML Operations: Insert, Update, Delete
└── SOQL Queries: 3 (via Selector)

GENERATED: AccountServiceTest.cls
───────────────────────────────────────────────────────────────

/**
 * Test class for AccountService
 * Coverage Target: 95%+
 *
 * @group Service
 */
@isTest
private class AccountServiceTest {

    // ═══════════════════════════════════════════════════════════
    // TEST SETUP
    // ═══════════════════════════════════════════════════════════

    @TestSetup
    static void setup() {
        // Create test data factory records
        List<Account> accounts = TestDataFactory.createAccounts(5);
        insert accounts;

        List<Contact> contacts = TestDataFactory.createContactsForAccounts(accounts);
        insert contacts;
    }

    // ═══════════════════════════════════════════════════════════
    // CREATE ACCOUNT TESTS
    // ═══════════════════════════════════════════════════════════

    @isTest
    static void createAccount_ValidData_Success() {
        // Given
        AccountService.AccountData data = new AccountService.AccountData();
        data.name = 'Test Account';
        data.industry = 'Technology';
        data.type = 'Customer';

        // When
        Test.startTest();
        Id accountId = AccountService.createAccount(data);
        Test.stopTest();

        // Then
        Account result = [SELECT Id, Name, Industry, Type FROM Account WHERE Id = :accountId];
        System.assertNotEquals(null, accountId, 'Account should be created');
        System.assertEquals('Test Account', result.Name);
        System.assertEquals('Technology', result.Industry);
    }

    @isTest
    static void createAccount_MissingName_ThrowsException() {
        // Given
        AccountService.AccountData data = new AccountService.AccountData();
        data.industry = 'Technology';
        // name is missing

        // When
        Test.startTest();
        try {
            AccountService.createAccount(data);
            System.assert(false, 'Expected AccountServiceException');
        } catch (AccountService.AccountServiceException e) {
            // Then
            System.assert(e.getMessage().contains('Name is required'));
        }
        Test.stopTest();
    }

    @isTest
    static void createAccount_DuplicateName_ThrowsException() {
        // Given - account with same name already exists
        Account existing = [SELECT Id, Name FROM Account LIMIT 1];

        AccountService.AccountData data = new AccountService.AccountData();
        data.name = existing.Name; // Duplicate name

        // When
        Test.startTest();
        try {
            AccountService.createAccount(data);
            System.assert(false, 'Expected AccountServiceException');
        } catch (AccountService.AccountServiceException e) {
            // Then
            System.assert(e.getMessage().contains('already exists'));
        }
        Test.stopTest();
    }

    @isTest
    static void createAccount_NullData_ThrowsException() {
        // When
        Test.startTest();
        try {
            AccountService.createAccount(null);
            System.assert(false, 'Expected AccountServiceException');
        } catch (AccountService.AccountServiceException e) {
            // Then
            System.assert(e.getMessage().contains('Account data required'));
        }
        Test.stopTest();
    }

    // ═══════════════════════════════════════════════════════════
    // BULK TESTS (200+ Records)
    // ═══════════════════════════════════════════════════════════

    @isTest
    static void createAccounts_Bulk200_Success() {
        // Given
        List<AccountService.AccountData> dataList = new List<AccountService.AccountData>();
        for (Integer i = 0; i < 200; i++) {
            AccountService.AccountData data = new AccountService.AccountData();
            data.name = 'Bulk Account ' + i;
            data.industry = 'Technology';
            dataList.add(data);
        }

        // When
        Test.startTest();
        List<Id> accountIds = AccountService.createAccounts(dataList);
        Test.stopTest();

        // Then
        System.assertEquals(200, accountIds.size(), 'Should create 200 accounts');
        Integer count = [SELECT COUNT() FROM Account WHERE Name LIKE 'Bulk Account%'];
        System.assertEquals(200, count);
    }

    @isTest
    static void updateAccounts_Bulk200_Success() {
        // Given
        List<Account> accounts = TestDataFactory.createAccounts(200);
        insert accounts;

        Set<Id> accountIds = new Map<Id, Account>(accounts).keySet();

        // When
        Test.startTest();
        AccountService.updateAccountIndustry(accountIds, 'Healthcare');
        Test.stopTest();

        // Then
        List<Account> updated = [SELECT Id, Industry FROM Account WHERE Id IN :accountIds];
        for (Account acc : updated) {
            System.assertEquals('Healthcare', acc.Industry);
        }
    }

    // ═══════════════════════════════════════════════════════════
    // UPDATE TESTS
    // ═══════════════════════════════════════════════════════════

    @isTest
    static void updateAccount_ValidData_Success() {
        // Given
        Account acc = [SELECT Id, Name FROM Account LIMIT 1];

        AccountService.AccountData data = new AccountService.AccountData();
        data.name = 'Updated Name';
        data.industry = 'Healthcare';

        // When
        Test.startTest();
        AccountService.updateAccount(acc.Id, data);
        Test.stopTest();

        // Then
        Account updated = [SELECT Name, Industry FROM Account WHERE Id = :acc.Id];
        System.assertEquals('Updated Name', updated.Name);
        System.assertEquals('Healthcare', updated.Industry);
    }

    @isTest
    static void updateAccount_InvalidId_ThrowsException() {
        // Given
        Id fakeId = Account.SObjectType.getDescribe().getKeyPrefix() + '000000000000';

        AccountService.AccountData data = new AccountService.AccountData();
        data.name = 'Test';

        // When
        Test.startTest();
        try {
            AccountService.updateAccount(fakeId, data);
            System.assert(false, 'Expected AccountServiceException');
        } catch (AccountService.AccountServiceException e) {
            // Then
            System.assert(e.getMessage().contains('not found'));
        }
        Test.stopTest();
    }

    // ═══════════════════════════════════════════════════════════
    // DELETE TESTS
    // ═══════════════════════════════════════════════════════════

    @isTest
    static void deleteAccount_NoRelatedRecords_Success() {
        // Given - account with no contacts
        Account acc = new Account(Name = 'Delete Test');
        insert acc;

        // When
        Test.startTest();
        AccountService.deleteAccount(acc.Id);
        Test.stopTest();

        // Then
        List<Account> remaining = [SELECT Id FROM Account WHERE Id = :acc.Id];
        System.assertEquals(0, remaining.size(), 'Account should be deleted');
    }

    @isTest
    static void deleteAccount_WithContacts_CascadesOrThrows() {
        // Given
        Account acc = [SELECT Id FROM Account LIMIT 1];
        // acc has contacts from TestSetup

        // When
        Test.startTest();
        // Depending on business rule: cascade delete or throw
        try {
            AccountService.deleteAccount(acc.Id);
            // If cascade delete is allowed, verify contacts deleted
            Integer contactCount = [SELECT COUNT() FROM Contact WHERE AccountId = :acc.Id];
            System.assertEquals(0, contactCount);
        } catch (AccountService.AccountServiceException e) {
            // If not allowed, verify exception
            System.assert(e.getMessage().contains('Cannot delete'));
        }
        Test.stopTest();
    }

    // ═══════════════════════════════════════════════════════════
    // QUERY TESTS
    // ═══════════════════════════════════════════════════════════

    @isTest
    static void getAccountsByIndustry_Found_ReturnsAccounts() {
        // Given
        Account acc = [SELECT Id, Industry FROM Account WHERE Industry != null LIMIT 1];

        // When
        Test.startTest();
        List<Account> results = AccountService.getAccountsByIndustry(acc.Industry);
        Test.stopTest();

        // Then
        System.assert(!results.isEmpty(), 'Should find accounts');
        for (Account a : results) {
            System.assertEquals(acc.Industry, a.Industry);
        }
    }

    @isTest
    static void getAccountsByIndustry_NotFound_ReturnsEmpty() {
        // When
        Test.startTest();
        List<Account> results = AccountService.getAccountsByIndustry('NonExistentIndustry');
        Test.stopTest();

        // Then
        System.assertEquals(0, results.size(), 'Should return empty list');
    }

    @isTest
    static void getAccountsByIndustry_NullParam_ThrowsException() {
        // When
        Test.startTest();
        try {
            AccountService.getAccountsByIndustry(null);
            System.assert(false, 'Expected exception');
        } catch (AccountService.AccountServiceException e) {
            System.assert(e.getMessage().contains('Industry required'));
        }
        Test.stopTest();
    }

    // ═══════════════════════════════════════════════════════════
    // EDGE CASES
    // ═══════════════════════════════════════════════════════════

    @isTest
    static void createAccount_MaxLengthName_Success() {
        // Given - name at max length (255)
        AccountService.AccountData data = new AccountService.AccountData();
        data.name = 'A'.repeat(255);

        // When
        Test.startTest();
        Id accountId = AccountService.createAccount(data);
        Test.stopTest();

        // Then
        Account result = [SELECT Name FROM Account WHERE Id = :accountId];
        System.assertEquals(255, result.Name.length());
    }

    @isTest
    static void createAccount_SpecialCharacters_Success() {
        // Given
        AccountService.AccountData data = new AccountService.AccountData();
        data.name = 'Test & Company <>"\'';

        // When
        Test.startTest();
        Id accountId = AccountService.createAccount(data);
        Test.stopTest();

        // Then
        Account result = [SELECT Name FROM Account WHERE Id = :accountId];
        System.assertEquals('Test & Company <>"\'', result.Name);
    }
}
───────────────────────────────────────────────────────────────

TEST COVERAGE ESTIMATE:
├── AccountService.createAccount: 100%
├── AccountService.createAccounts: 100%
├── AccountService.updateAccount: 95%
├── AccountService.deleteAccount: 90%
├── AccountService.getAccountsByIndustry: 100%
└── Total Estimated: 97%

[Create File] [Add More Tests] [Generate Mock]
```

### coverage: Analyze Coverage Gaps

```
COVERAGE ANALYSIS
═══════════════════════════════════════════════════════════════

Running coverage analysis...

sf apex run test --code-coverage --result-format json

DETAILED COVERAGE REPORT:

PaymentProcessor.cls (72% - NEEDS IMPROVEMENT)
───────────────────────────────────────────────────────────────
Line Coverage:

   15:     public static PaymentResult processPayment(...) {    ✓
   16:         if (amount <= 0) {                               ✓
   17:             throw new PaymentException('Invalid');        ✗ NOT COVERED
   18:         }
   ...
   45:         if (paymentMethod == 'CREDIT_CARD') {            ✓
   46:             return processCreditCard(amount);            ✓
   47:         } else if (paymentMethod == 'ACH') {             ✓
   48:             return processACH(amount);                   ✗ NOT COVERED
   49:         } else if (paymentMethod == 'WIRE') {            ✗ NOT COVERED
   50:             return processWire(amount);                  ✗ NOT COVERED
   51:         }
   ...
   78:     } catch (CalloutException e) {                       ✗ NOT COVERED
   79:         throw new PaymentException('Callout failed', e); ✗ NOT COVERED
   80:     }

UNCOVERED PATHS:
├── Line 17: Negative amount validation
├── Lines 48-50: ACH and WIRE payment methods
├── Lines 78-79: CalloutException handling

RECOMMENDED TESTS TO ADD:
───────────────────────────────────────────────────────────────
@isTest
static void processPayment_NegativeAmount_ThrowsException() {
    // Test line 17
}

@isTest
static void processPayment_ACHMethod_Success() {
    // Test line 48
}

@isTest
static void processPayment_WIREMethod_Success() {
    // Test line 50
}

@isTest
static void processPayment_CalloutFails_ThrowsException() {
    // Test lines 78-79
    // Use HttpCalloutMock to simulate failure
}
───────────────────────────────────────────────────────────────

[Generate Missing Tests] [View Full Report]
```

### mock <class>: Generate Mock Class

```
MOCK GENERATION: AccountSelector
═══════════════════════════════════════════════════════════════

SOURCE CLASS: AccountSelector.cls
├── Methods: selectById, selectByIndustry, selectWithContacts
└── Pattern: Selector (SOQL queries)

GENERATED: AccountSelectorMock.cls
───────────────────────────────────────────────────────────────

/**
 * Mock implementation of AccountSelector for unit testing
 * Allows testing service classes without actual SOQL
 */
@isTest
public class AccountSelectorMock implements IAccountSelector {

    // Configurable return values
    public List<Account> accountsToReturn = new List<Account>();
    public Exception exceptionToThrow;

    // Call tracking
    public Integer selectByIdCallCount = 0;
    public Set<Id> lastSelectByIdParams;

    public Integer selectByIndustryCallCount = 0;
    public String lastSelectByIndustryParam;

    // ═══════════════════════════════════════════════════════════
    // MOCK IMPLEMENTATIONS
    // ═══════════════════════════════════════════════════════════

    public List<Account> selectById(Set<Id> accountIds) {
        selectByIdCallCount++;
        lastSelectByIdParams = accountIds;

        if (exceptionToThrow != null) {
            throw exceptionToThrow;
        }

        return accountsToReturn;
    }

    public List<Account> selectByIndustry(String industry) {
        selectByIndustryCallCount++;
        lastSelectByIndustryParam = industry;

        if (exceptionToThrow != null) {
            throw exceptionToThrow;
        }

        return accountsToReturn;
    }

    public List<Account> selectWithContacts(Set<Id> accountIds) {
        if (exceptionToThrow != null) {
            throw exceptionToThrow;
        }
        return accountsToReturn;
    }

    // ═══════════════════════════════════════════════════════════
    // BUILDER METHODS
    // ═══════════════════════════════════════════════════════════

    public AccountSelectorMock withAccounts(List<Account> accounts) {
        this.accountsToReturn = accounts;
        return this;
    }

    public AccountSelectorMock withException(Exception e) {
        this.exceptionToThrow = e;
        return this;
    }

    // ═══════════════════════════════════════════════════════════
    // VERIFICATION METHODS
    // ═══════════════════════════════════════════════════════════

    public void verifySelectByIdCalled() {
        System.assert(selectByIdCallCount > 0, 'selectById was not called');
    }

    public void verifySelectByIdCalledWith(Set<Id> expectedIds) {
        System.assertEquals(expectedIds, lastSelectByIdParams,
            'selectById called with unexpected parameters');
    }

    public void verifySelectByIdCallCount(Integer expected) {
        System.assertEquals(expected, selectByIdCallCount,
            'selectById call count mismatch');
    }
}

USAGE EXAMPLE:
───────────────────────────────────────────────────────────────
@isTest
static void testWithMock() {
    // Setup mock
    AccountSelectorMock mock = new AccountSelectorMock()
        .withAccounts(new List<Account>{
            new Account(Id = '001xx000003DGQAAA4', Name = 'Test')
        });

    // Inject mock (via Application factory or direct injection)
    Application.Selector.setMock(Account.SObjectType, mock);

    // Test
    Test.startTest();
    List<Account> results = AccountService.getAccountsByIndustry('Tech');
    Test.stopTest();

    // Verify
    System.assertEquals(1, results.size());
    mock.verifySelectByIndustryCalled();
}
───────────────────────────────────────────────────────────────
```

### factory: Create Test Data Factory

```
TEST DATA FACTORY
═══════════════════════════════════════════════════════════════

GENERATED: TestDataFactory.cls
───────────────────────────────────────────────────────────────

/**
 * Test Data Factory
 * Centralized test data creation for all test classes
 *
 * Usage:
 *   List<Account> accounts = TestDataFactory.createAccounts(5);
 *   insert accounts;
 */
@isTest
public class TestDataFactory {

    // ═══════════════════════════════════════════════════════════
    // ACCOUNT
    // ═══════════════════════════════════════════════════════════

    public static List<Account> createAccounts(Integer count) {
        List<Account> accounts = new List<Account>();
        for (Integer i = 0; i < count; i++) {
            accounts.add(new Account(
                Name = 'Test Account ' + i,
                Industry = 'Technology',
                Type = 'Customer',
                Phone = '555-000-' + String.valueOf(i).leftPad(4, '0'),
                Website = 'https://account' + i + '.test.com'
            ));
        }
        return accounts;
    }

    public static Account createAccount() {
        return createAccounts(1)[0];
    }

    // ═══════════════════════════════════════════════════════════
    // CONTACT
    // ═══════════════════════════════════════════════════════════

    public static List<Contact> createContacts(Integer count) {
        List<Contact> contacts = new List<Contact>();
        for (Integer i = 0; i < count; i++) {
            contacts.add(new Contact(
                FirstName = 'Test',
                LastName = 'Contact ' + i,
                Email = 'contact' + i + '@test.com',
                Phone = '555-111-' + String.valueOf(i).leftPad(4, '0')
            ));
        }
        return contacts;
    }

    public static List<Contact> createContactsForAccounts(List<Account> accounts) {
        List<Contact> contacts = new List<Contact>();
        for (Account acc : accounts) {
            contacts.add(new Contact(
                AccountId = acc.Id,
                FirstName = 'Test',
                LastName = 'Contact for ' + acc.Name,
                Email = 'contact.' + acc.Id + '@test.com'
            ));
        }
        return contacts;
    }

    // ═══════════════════════════════════════════════════════════
    // OPPORTUNITY
    // ═══════════════════════════════════════════════════════════

    public static List<Opportunity> createOpportunities(
        Integer count,
        Id accountId,
        String stageName
    ) {
        List<Opportunity> opps = new List<Opportunity>();
        for (Integer i = 0; i < count; i++) {
            opps.add(new Opportunity(
                Name = 'Test Opportunity ' + i,
                AccountId = accountId,
                StageName = stageName,
                CloseDate = Date.today().addDays(30),
                Amount = 10000 + (i * 1000)
            ));
        }
        return opps;
    }

    // ═══════════════════════════════════════════════════════════
    // INVOICE (Custom Object)
    // ═══════════════════════════════════════════════════════════

    public static List<Invoice__c> createInvoices(Integer count, Id accountId) {
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

    // ═══════════════════════════════════════════════════════════
    // USER (for running as different users)
    // ═══════════════════════════════════════════════════════════

    public static User createStandardUser() {
        Profile p = [SELECT Id FROM Profile WHERE Name = 'Standard User' LIMIT 1];
        String uniqueId = String.valueOf(DateTime.now().getTime());

        return new User(
            Alias = 'testuser',
            Email = 'test.' + uniqueId + '@test.com',
            EmailEncodingKey = 'UTF-8',
            LastName = 'TestUser',
            LanguageLocaleKey = 'en_US',
            LocaleSidKey = 'en_US',
            ProfileId = p.Id,
            TimeZoneSidKey = 'America/Los_Angeles',
            UserName = 'test.' + uniqueId + '@test.com.sandbox'
        );
    }

    // ═══════════════════════════════════════════════════════════
    // BULK DATA HELPERS
    // ═══════════════════════════════════════════════════════════

    public static void createBulkTestData() {
        // Create 200+ records for bulk testing
        List<Account> accounts = createAccounts(200);
        insert accounts;

        List<Contact> contacts = new List<Contact>();
        for (Account acc : accounts) {
            contacts.addAll(createContactsForAccounts(new List<Account>{acc}));
        }
        insert contacts;
    }

    // ═══════════════════════════════════════════════════════════
    // HTTP CALLOUT MOCKS
    // ═══════════════════════════════════════════════════════════

    public class GenericHttpMock implements HttpCalloutMock {
        private Integer statusCode;
        private String responseBody;

        public GenericHttpMock(Integer statusCode, String responseBody) {
            this.statusCode = statusCode;
            this.responseBody = responseBody;
        }

        public HttpResponse respond(HttpRequest req) {
            HttpResponse res = new HttpResponse();
            res.setStatusCode(statusCode);
            res.setBody(responseBody);
            return res;
        }
    }
}
───────────────────────────────────────────────────────────────

BEST PRACTICES:
├── Always use factory methods, never hardcode test data
├── Keep factory methods simple and composable
├── Return unsaved records (let tests decide when to insert)
├── Use unique identifiers to avoid conflicts
└── Create helper methods for complex scenarios
```

### run [class]: Run Tests with Analysis

```bash
# Run specific test class
sf apex run test --tests AccountServiceTest --code-coverage --result-format human

# Run all tests
sf apex run test --code-coverage --result-format human
```

```
TEST EXECUTION RESULTS
═══════════════════════════════════════════════════════════════

Running: AccountServiceTest

Tests: 15 | Passed: 14 | Failed: 1 | Duration: 8.2s

PASSED:
├── ✓ createAccount_ValidData_Success (0.8s)
├── ✓ createAccount_MissingName_ThrowsException (0.3s)
├── ✓ createAccount_DuplicateName_ThrowsException (0.5s)
├── ✓ createAccounts_Bulk200_Success (3.2s)
├── ✓ updateAccount_ValidData_Success (0.6s)
... (9 more)

FAILED:
├── ✗ deleteAccount_WithContacts_CascadesOrThrows
│   ├── Expected: Contact cascade delete OR exception
│   ├── Actual: System.DmlException: ENTITY_IS_DELETED
│   └── Stack: AccountService.deleteAccount line 89

COVERAGE IMPACT:
├── AccountService.cls: 92% → 97%
├── AccountSelector.cls: 100%
└── AccountTriggerHandler.cls: 85%

[Fix Failed Test] [View Coverage Map] [Run Again]
```

## Test Patterns Reference

```
SALESFORCE TEST BEST PRACTICES
═══════════════════════════════════════════════════════════════

DO:
├── Use @TestSetup for common test data
├── Test positive, negative, and edge cases
├── Test bulk operations (200+ records)
├── Use System.runAs() for permission testing
├── Mock callouts with HttpCalloutMock
├── Assert meaningful messages
└── Keep test methods focused and independent

DON'T:
├── ✗ Use @SeeAllData=true (except for specific needs)
├── ✗ Hardcode IDs in tests
├── ✗ Skip error handling coverage
├── ✗ Rely on org-specific data
├── ✗ Create tests that depend on execution order
└── ✗ Ignore async test patterns (Test.startTest/stopTest)

ASYNC TEST PATTERN:
───────────────────────────────────────────────────────────────
@isTest
static void testQueueable() {
    Test.startTest();
    System.enqueueJob(new MyQueueable());
    Test.stopTest(); // Forces async job to complete

    // Assert results after async completes
}
───────────────────────────────────────────────────────────────
```

## Integration

Works well with:
- `/siftcoder:apex` - Analyze code before testing
- `/siftcoder:sf-debug` - Debug failing tests
- `/siftcoder:sf-deploy` - Validate deployment with tests
