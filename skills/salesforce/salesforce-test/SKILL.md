---
name: salesforce-test
description: Use when generating Apex tests, designing test data factories, sanitising sandbox data, or improving Apex test coverage / quality.
---

# Salesforce test skill

## Coverage targets
- Hard floor: 75% (deploy gate)
- Soft floor: 85% (PR gate)
- Per-class: 75% minimum for any class touched in the PR

Coverage is a floor, not a ceiling. **Behaviour coverage** &gt; line coverage.

## Test data factories

Pattern:

```apex
@IsTest
public class TestDataFactory {
    public static List<Account> createAccounts(Integer n) {
        List<Account> accs = new List<Account>();
        for (Integer i = 0; i < n; i++) {
            accs.add(new Account(Name = 'Test ' + i));
        }
        insert accs;
        return accs;
    }
}
```

Rules:
- One factory per object
- `@IsTest` on the class so it doesn't count against org space
- Always insert and return
- Take an `Integer n` param — bulkify by default

## Bulk patterns

Tests must verify behaviour at 200+ records (the trigger batch boundary):

```apex
@IsTest static void shouldBulkInsert() {
    List<Account> accs = TestDataFactory.createAccounts(200);
    Test.startTest();
    AccountService.process(accs);
    Test.stopTest();
    System.assertEquals(200, [SELECT COUNT() FROM Account WHERE IsProcessed__c = true]);
}
```

## Sanitising sandbox data

For full-copy sandboxes refreshed from prod:

```apex
// Data masking via Apex script
List<Contact> cs = [SELECT Id FROM Contact LIMIT 50000];
for (Contact c : cs) {
    c.Email = 'masked+' + c.Id + '@example.invalid';
    c.Phone = null;
    c.MailingStreet = '[redacted]';
}
update cs;
```

For larger volumes: use Bulk API 2.0 from a script, or Salesforce Data Mask (paid).

## Common Apex test bugs

- **Test sees prod data** — `@IsTest(SeeAllData=true)` left on, remove unless absolutely needed
- **`MIXED_DML_OPERATION`** — setup objects (User, Profile) require `System.runAs(...)` block
- **Test passes locally, fails in CI** — depends on running user (System vs default), org settings, or record types not in test data
- **Coverage shows 100% but logic isn't tested** — assertions missing; line covered ≠ behaviour verified

## When to mock

- HTTP callouts: `Test.setMock(HttpCalloutMock.class, new MyMock())`
- Async chain endpoints: stub the next step
- External objects: mock the layer above

Don't mock domain logic — test it directly.
