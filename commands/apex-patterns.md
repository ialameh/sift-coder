---
description: Generate enterprise Apex patterns - FFLib, Selector, Domain, Service, UnitOfWork
argument-hint: <pattern> [object] [--full]
allowed-tools: Read, Write, Edit, Glob, Grep, Bash
---

# /siftcoder:apex-patterns - Enterprise Apex Patterns

Generate enterprise-grade Apex patterns following FFLib/AT4DX conventions. Full separation of concerns with Selector, Domain, Service, and Unit of Work layers.

## Usage

```
/siftcoder:apex-patterns fflib              - Setup full FFLib framework
/siftcoder:apex-patterns selector <object>  - Generate Selector pattern
/siftcoder:apex-patterns domain <object>    - Generate Domain pattern
/siftcoder:apex-patterns service <name>     - Generate Service pattern
/siftcoder:apex-patterns uow                - Generate Unit of Work pattern
/siftcoder:apex-patterns trigger <object>   - Generate Trigger Handler framework
/siftcoder:apex-patterns factory            - Generate Application factory
/siftcoder:apex-patterns all <object>       - Generate all patterns for object
```

## Pattern Overview

```
ENTERPRISE PATTERN ARCHITECTURE
═══════════════════════════════════════════════════════════════

┌─────────────────────────────────────────────────────────────┐
│                    SERVICE LAYER                             │
│  (Business Logic, Orchestration, Transaction Boundary)       │
│  AccountService.cls, OrderService.cls                        │
└────────────────────────┬────────────────────────────────────┘
                         │
         ┌───────────────┼───────────────┐
         ▼               ▼               ▼
┌──────────────┐ ┌──────────────┐ ┌──────────────┐
│   SELECTOR   │ │   DOMAIN     │ │  UNIT OF     │
│   LAYER      │ │   LAYER      │ │  WORK        │
│ (Queries)    │ │ (Validation) │ │ (DML)        │
└──────────────┘ └──────────────┘ └──────────────┘
         │               │               │
         └───────────────┼───────────────┘
                         ▼
              ┌──────────────────┐
              │   DATABASE       │
              │   (SObjects)     │
              └──────────────────┘

BENEFITS:
├── Single Responsibility - Each layer has one job
├── Testability - Mock any layer independently
├── Reusability - Share logic across triggers/controllers
├── Maintainability - Clear code organization
└── Scalability - Easy to extend without breaking
```

## Instructions

### fflib: Full FFLib Setup

Install the complete FFLib framework:

**Step 1: Check Existing Installation**

```bash
# Check if FFLib classes exist
ls force-app/main/default/classes/fflib_*.cls 2>/dev/null
```

**Step 2: Create FFLib Base Classes**

```
FFLIB FRAMEWORK SETUP
═══════════════════════════════════════════════════════════════

Installing FFLib Enterprise Patterns...

Core Classes Created:
├── fflib_SObjectDomain.cls
│   └── Base class for Domain layer
├── fflib_SObjectSelector.cls
│   └── Base class for Selector layer
├── fflib_SObjectUnitOfWork.cls
│   └── Manages DML transactions
├── fflib_Application.cls
│   └── Factory for runtime binding
├── fflib_ISObjectDomain.cls
│   └── Domain interface
├── fflib_ISObjectUnitOfWork.cls
│   └── Unit of Work interface
└── fflib_SecurityUtils.cls
    └── CRUD/FLS enforcement

Mocking Support (for tests):
├── fflib_ApexMocks.cls
├── fflib_Match.cls
├── fflib_Answer.cls
└── fflib_InvocationOnMock.cls

Application Factory:
└── Application.cls
    └── Central factory for dependency injection

Configuration:
└── fflib_SObjectDescribe.cls
    └── Metadata caching for performance

[View Installation Guide] [Generate Sample] [Run Tests]
```

### selector <object>: Generate Selector

**Step 1: Determine Object Fields**

Query object metadata or use common patterns.

**Step 2: Generate Selector Class**

```
SELECTOR PATTERN: ContactSelector
═══════════════════════════════════════════════════════════════

Generated: force-app/main/default/classes/ContactSelector.cls

/**
 * Selector class for Contact object
 * Centralizes all SOQL queries for Contacts
 *
 * @group Selector
 */
public inherited sharing class ContactSelector extends fflib_SObjectSelector {

    /**
     * Returns list of fields to query by default
     */
    public List<Schema.SObjectField> getSObjectFieldList() {
        return new List<Schema.SObjectField>{
            Contact.Id,
            Contact.FirstName,
            Contact.LastName,
            Contact.Email,
            Contact.Phone,
            Contact.AccountId,
            Contact.OwnerId,
            Contact.CreatedDate,
            Contact.LastModifiedDate
        };
    }

    /**
     * Returns the SObject type for this selector
     */
    public Schema.SObjectType getSObjectType() {
        return Contact.SObjectType;
    }

    /**
     * Creates new instance with default field list
     */
    public static ContactSelector newInstance() {
        return (ContactSelector) Application.Selector.newInstance(Contact.SObjectType);
    }

    /**
     * Select Contacts by Id
     * @param contactIds Set of Contact Ids
     * @return List of Contact records
     */
    public List<Contact> selectById(Set<Id> contactIds) {
        return (List<Contact>) selectSObjectsById(contactIds);
    }

    /**
     * Select Contacts by Account
     * @param accountIds Set of Account Ids
     * @return List of Contact records
     */
    public List<Contact> selectByAccountId(Set<Id> accountIds) {
        return Database.query(
            newQueryFactory()
                .setCondition('AccountId IN :accountIds')
                .toSOQL()
        );
    }

    /**
     * Select Contacts by Email
     * @param emails Set of email addresses
     * @return List of Contact records
     */
    public List<Contact> selectByEmail(Set<String> emails) {
        return Database.query(
            newQueryFactory()
                .setCondition('Email IN :emails')
                .toSOQL()
        );
    }

    /**
     * Select Contacts with Account details
     * @param contactIds Set of Contact Ids
     * @return List of Contact records with Account
     */
    public List<Contact> selectByIdWithAccount(Set<Id> contactIds) {
        fflib_QueryFactory query = newQueryFactory();

        new AccountSelector().configureQueryFactoryFields(
            query,
            Contact.AccountId.getDescribe().getRelationshipName()
        );

        return Database.query(
            query.setCondition('Id IN :contactIds').toSOQL()
        );
    }
}
───────────────────────────────────────────────────────────────

Interface: IContactSelector.cls (generated)
Test Class: ContactSelectorTest.cls (generated)
Mock Class: ContactSelectorMock.cls (generated)
```

### domain <object>: Generate Domain

```
DOMAIN PATTERN: Contacts
═══════════════════════════════════════════════════════════════

Generated: force-app/main/default/classes/Contacts.cls

/**
 * Domain class for Contact object
 * Contains all validation and behavior logic
 *
 * @group Domain
 */
public with sharing class Contacts extends fflib_SObjectDomain {

    /**
     * Constructor
     * @param records List of Contact records
     */
    public Contacts(List<Contact> records) {
        super(records);
    }

    /**
     * Domain factory class for Application binding
     */
    public class Constructor implements fflib_SObjectDomain.IConstructable {
        public fflib_SObjectDomain construct(List<SObject> records) {
            return new Contacts(records);
        }
    }

    /**
     * Override to set configuration
     */
    public override void onApplyDefaults() {
        for(Contact contact : (List<Contact>) Records) {
            // Set default values for new records
            if(String.isBlank(contact.LeadSource)) {
                contact.LeadSource = 'Web';
            }
        }
    }

    /**
     * Validation on insert
     */
    public override void onValidate() {
        for(Contact contact : (List<Contact>) Records) {
            // Email format validation
            if(String.isNotBlank(contact.Email) &&
               !Pattern.matches('^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}$', contact.Email)) {
                contact.Email.addError('Invalid email format');
            }

            // Required field validation
            if(String.isBlank(contact.LastName)) {
                contact.LastName.addError('Last Name is required');
            }
        }
    }

    /**
     * Validation on update with comparison to old values
     */
    public override void onValidate(Map<Id, SObject> existingRecords) {
        for(Contact contact : (List<Contact>) Records) {
            Contact oldContact = (Contact) existingRecords.get(contact.Id);

            // Example: Prevent email change if contact is verified
            if(oldContact.Email_Verified__c && contact.Email != oldContact.Email) {
                contact.Email.addError('Cannot change verified email');
            }
        }
    }

    /**
     * Before insert logic
     */
    public override void onBeforeInsert() {
        // Add before insert logic
        normalizePhoneNumbers();
    }

    /**
     * After insert logic
     */
    public override void onAfterInsert() {
        // Add after insert logic
        // e.g., Create related records, send notifications
    }

    /**
     * Before update logic
     */
    public override void onBeforeUpdate(Map<Id, SObject> existingRecords) {
        // Add before update logic
        normalizePhoneNumbers();
    }

    /**
     * After update logic
     */
    public override void onAfterUpdate(Map<Id, SObject> existingRecords) {
        // Add after update logic
        // e.g., Sync to external systems
    }

    // ═══════════════════════════════════════════════════════════
    // DOMAIN METHODS
    // ═══════════════════════════════════════════════════════════

    /**
     * Normalize phone numbers to standard format
     */
    private void normalizePhoneNumbers() {
        for(Contact contact : (List<Contact>) Records) {
            if(String.isNotBlank(contact.Phone)) {
                contact.Phone = contact.Phone.replaceAll('[^0-9]', '');
            }
        }
    }

    /**
     * Update mailing address from account
     * @param accountsById Map of Accounts by Id
     */
    public void syncMailingAddressFromAccount(Map<Id, Account> accountsById) {
        for(Contact contact : (List<Contact>) Records) {
            Account acc = accountsById.get(contact.AccountId);
            if(acc != null && acc.BillingStreet != null) {
                contact.MailingStreet = acc.BillingStreet;
                contact.MailingCity = acc.BillingCity;
                contact.MailingState = acc.BillingState;
                contact.MailingPostalCode = acc.BillingPostalCode;
                contact.MailingCountry = acc.BillingCountry;
            }
        }
    }
}
───────────────────────────────────────────────────────────────

Interface: IContacts.cls (generated)
Test Class: ContactsTest.cls (generated)
```

### service <name>: Generate Service

```
SERVICE PATTERN: ContactService
═══════════════════════════════════════════════════════════════

Generated: force-app/main/default/classes/ContactService.cls

/**
 * Service class for Contact-related business operations
 * Contains all high-level business logic
 *
 * @group Service
 */
public with sharing class ContactService {

    /**
     * Creates contacts for the given accounts
     * @param accountIds Account IDs to create contacts for
     * @param contactData Map of account ID to contact details
     * @return List of created Contact IDs
     */
    public static List<Id> createContactsForAccounts(
        Set<Id> accountIds,
        Map<Id, ContactData> contactData
    ) {
        // Validate input
        if(accountIds == null || accountIds.isEmpty()) {
            throw new ContactServiceException('Account IDs are required');
        }

        // Query accounts via Selector
        List<Account> accounts = AccountSelector.newInstance().selectById(accountIds);

        // Build contacts
        List<Contact> contactsToCreate = new List<Contact>();
        for(Account acc : accounts) {
            ContactData data = contactData.get(acc.Id);
            if(data != null) {
                contactsToCreate.add(new Contact(
                    AccountId = acc.Id,
                    FirstName = data.firstName,
                    LastName = data.lastName,
                    Email = data.email
                ));
            }
        }

        // Use Unit of Work for DML
        fflib_ISObjectUnitOfWork uow = Application.UnitOfWork.newInstance();
        uow.registerNew(contactsToCreate);
        uow.commitWork();

        // Return created IDs
        List<Id> createdIds = new List<Id>();
        for(Contact c : contactsToCreate) {
            createdIds.add(c.Id);
        }
        return createdIds;
    }

    /**
     * Transfers contacts between accounts
     * @param contactIds Contacts to transfer
     * @param targetAccountId Target account
     */
    public static void transferContacts(Set<Id> contactIds, Id targetAccountId) {
        // Query contacts
        List<Contact> contacts = ContactSelector.newInstance().selectById(contactIds);

        // Apply domain logic
        Contacts domain = new Contacts(contacts);
        for(Contact c : contacts) {
            c.AccountId = targetAccountId;
        }

        // Commit changes
        fflib_ISObjectUnitOfWork uow = Application.UnitOfWork.newInstance();
        uow.registerDirty(contacts);
        uow.commitWork();
    }

    /**
     * Merges duplicate contacts
     * @param masterContactId The contact to keep
     * @param duplicateContactIds Contacts to merge and delete
     */
    public static void mergeDuplicates(Id masterContactId, Set<Id> duplicateContactIds) {
        // Implementation
    }

    /**
     * DTO for contact creation
     */
    public class ContactData {
        public String firstName;
        public String lastName;
        public String email;
        public String phone;
    }

    /**
     * Custom exception for service errors
     */
    public class ContactServiceException extends Exception {}
}
───────────────────────────────────────────────────────────────

Interface: IContactService.cls (generated)
Test Class: ContactServiceTest.cls (generated)
```

### uow: Generate Unit of Work

```
UNIT OF WORK PATTERN
═══════════════════════════════════════════════════════════════

The Unit of Work pattern manages all DML operations in a single transaction.

Generated: Application.cls (with UoW configuration)

public class Application {

    // Unit of Work configuration
    public static final fflib_Application.UnitOfWorkFactory UnitOfWork =
        new fflib_Application.UnitOfWorkFactory(
            new List<SObjectType>{
                Account.SObjectType,
                Contact.SObjectType,
                Opportunity.SObjectType,
                Task.SObjectType,
                // Add objects in order of DML dependency
            }
        );

    // Selector configuration
    public static final fflib_Application.SelectorFactory Selector =
        new fflib_Application.SelectorFactory(
            new Map<SObjectType, Type>{
                Account.SObjectType => AccountSelector.class,
                Contact.SObjectType => ContactSelector.class,
                Opportunity.SObjectType => OpportunitySelector.class
            }
        );

    // Domain configuration
    public static final fflib_Application.DomainFactory Domain =
        new fflib_Application.DomainFactory(
            Application.Selector,
            new Map<SObjectType, Type>{
                Account.SObjectType => Accounts.Constructor.class,
                Contact.SObjectType => Contacts.Constructor.class,
                Opportunity.SObjectType => Opportunities.Constructor.class
            }
        );

    // Service configuration
    public static final fflib_Application.ServiceFactory Service =
        new fflib_Application.ServiceFactory(
            new Map<Type, Type>{
                IAccountService.class => AccountService.class,
                IContactService.class => ContactService.class
            }
        );
}

USAGE EXAMPLE:
───────────────────────────────────────────────────────────────
// Create Unit of Work
fflib_ISObjectUnitOfWork uow = Application.UnitOfWork.newInstance();

// Register operations
Account acc = new Account(Name = 'Test');
uow.registerNew(acc);

Contact con = new Contact(LastName = 'Test');
uow.registerNew(con, Contact.AccountId, acc); // Relationship!

// Commit all in single transaction
uow.commitWork();
```

### all <object>: Generate All Patterns

Generate complete pattern suite for an object:

```
FULL PATTERN SUITE: Invoice__c
═══════════════════════════════════════════════════════════════

Generating all enterprise patterns for Invoice__c...

Files Created:
├── Selector Layer
│   ├── InvoiceSelector.cls
│   ├── IInvoiceSelector.cls
│   └── InvoiceSelectorTest.cls
│
├── Domain Layer
│   ├── Invoices.cls
│   ├── IInvoices.cls
│   └── InvoicesTest.cls
│
├── Service Layer
│   ├── InvoiceService.cls
│   ├── IInvoiceService.cls
│   └── InvoiceServiceTest.cls
│
├── Trigger
│   ├── InvoiceTrigger.trigger
│   ├── InvoiceTriggerHandler.cls
│   └── InvoiceTriggerHandlerTest.cls
│
└── Application Factory Update
    └── Application.cls (updated with Invoice bindings)

Total: 12 files generated

[Deploy All] [Run Tests] [View Files]
```

## Best Practices

```
ENTERPRISE PATTERN GUIDELINES
═══════════════════════════════════════════════════════════════

SELECTOR:
├── All SOQL queries go here
├── Use inherited sharing for flexibility
├── Cache field lists for performance
├── Support query factory for composition
└── Return strongly typed collections

DOMAIN:
├── All validation logic goes here
├── All field defaulting goes here
├── Trigger handler delegates to Domain
├── Use with sharing by default
└── Contains behavior, not orchestration

SERVICE:
├── High-level business operations
├── Transaction boundary lives here
├── Calls Selectors, Domains, UoW
├── Stateless static methods
└── Exception handling and logging

UNIT OF WORK:
├── All DML operations
├── Handles record relationships
├── Single commit per transaction
├── Maintains insertion order
└── Supports partial commits
```

## Integration

Works well with:
- `/siftcoder:apex` - Analyze existing code
- `/siftcoder:sf-test` - Generate comprehensive tests
- `/siftcoder:sf-architect` - Visualize architecture
