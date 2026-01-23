---
description: Lightning Web Component development - create, analyze, wire adapters, events, Jest tests
argument-hint: <action> <component> [--wire|--imperative|--test]
allowed-tools: Read, Write, Edit, Glob, Grep, Bash
---

# /siftcoder:lwc - Lightning Web Components

Create, analyze, and debug Lightning Web Components with best practices. Generates complete component scaffolding with wire adapters, event handling, and Jest tests.

## Usage

```
/siftcoder:lwc create <name>          - Create new LWC with best practices
/siftcoder:lwc analyze <component>    - Analyze LWC for issues
/siftcoder:lwc wire <apex-method>     - Generate wire adapter code
/siftcoder:lwc imperative <method>    - Generate imperative Apex call
/siftcoder:lwc event <name>           - Create custom event pattern
/siftcoder:lwc test <component>       - Generate Jest tests
/siftcoder:lwc convert-aura <aura>    - Convert Aura to LWC
/siftcoder:lwc                        - Analyze all LWCs in project
```

## Instructions

### create <name>: Create New LWC

**Step 1: Determine Component Requirements**

Ask or infer:
- Component purpose
- Data source (wire/imperative)
- Parent/child relationships
- Events needed

**Step 2: Generate Component Files**

```
LWC CREATED: accountList
═══════════════════════════════════════════════════════════════

Directory: force-app/main/default/lwc/accountList/

Files Generated:

1. accountList.html
───────────────────────────────────────────────────────────────
<template>
    <lightning-card title="Accounts" icon-name="standard:account">
        <!-- Loading State -->
        <template lwc:if={isLoading}>
            <lightning-spinner alternative-text="Loading..." size="medium">
            </lightning-spinner>
        </template>

        <!-- Error State -->
        <template lwc:if={error}>
            <div class="slds-text-color_error slds-p-around_medium">
                <lightning-icon icon-name="utility:error" size="small"></lightning-icon>
                <span class="slds-m-left_x-small">{errorMessage}</span>
            </div>
        </template>

        <!-- Data Display -->
        <template lwc:if={hasData}>
            <lightning-datatable
                key-field="Id"
                data={accounts}
                columns={columns}
                onrowaction={handleRowAction}
                show-row-number-column
                hide-checkbox-column>
            </lightning-datatable>
        </template>

        <!-- Empty State -->
        <template lwc:if={isEmpty}>
            <div class="slds-p-around_medium slds-text-align_center">
                <p class="slds-text-body_regular">No accounts found</p>
            </div>
        </template>

        <!-- Footer Actions -->
        <div slot="footer">
            <lightning-button label="Refresh" onclick={handleRefresh}></lightning-button>
            <lightning-button label="New Account" variant="brand" onclick={handleNew}></lightning-button>
        </div>
    </lightning-card>
</template>
───────────────────────────────────────────────────────────────

2. accountList.js
───────────────────────────────────────────────────────────────
import { LightningElement, wire, track } from 'lwc';
import { ShowToastEvent } from 'lightning/platformShowToastEvent';
import { refreshApex } from '@salesforce/apex';
import { NavigationMixin } from 'lightning/navigation';
import getAccounts from '@salesforce/apex/AccountController.getAccounts';

const COLUMNS = [
    { label: 'Name', fieldName: 'Name', type: 'text', sortable: true },
    { label: 'Industry', fieldName: 'Industry', type: 'text' },
    { label: 'Phone', fieldName: 'Phone', type: 'phone' },
    { label: 'Website', fieldName: 'Website', type: 'url' },
    {
        type: 'action',
        typeAttributes: {
            rowActions: [
                { label: 'View', name: 'view' },
                { label: 'Edit', name: 'edit' }
            ]
        }
    }
];

export default class AccountList extends NavigationMixin(LightningElement) {
    @track accounts = [];
    @track error;

    columns = COLUMNS;
    wiredAccountsResult;

    // ═══════════════════════════════════════════════════════════
    // WIRE ADAPTER
    // ═══════════════════════════════════════════════════════════

    @wire(getAccounts)
    wiredAccounts(result) {
        this.wiredAccountsResult = result;
        const { data, error } = result;

        if (data) {
            this.accounts = data;
            this.error = undefined;
        } else if (error) {
            this.error = error;
            this.accounts = [];
            this.showErrorToast('Error loading accounts', this.errorMessage);
        }
    }

    // ═══════════════════════════════════════════════════════════
    // GETTERS
    // ═══════════════════════════════════════════════════════════

    get isLoading() {
        return !this.wiredAccountsResult?.data && !this.wiredAccountsResult?.error;
    }

    get hasData() {
        return this.accounts && this.accounts.length > 0;
    }

    get isEmpty() {
        return !this.isLoading && !this.error && (!this.accounts || this.accounts.length === 0);
    }

    get errorMessage() {
        return this.error?.body?.message || this.error?.message || 'Unknown error';
    }

    // ═══════════════════════════════════════════════════════════
    // EVENT HANDLERS
    // ═══════════════════════════════════════════════════════════

    handleRefresh() {
        refreshApex(this.wiredAccountsResult);
    }

    handleNew() {
        this[NavigationMixin.Navigate]({
            type: 'standard__objectPage',
            attributes: {
                objectApiName: 'Account',
                actionName: 'new'
            }
        });
    }

    handleRowAction(event) {
        const action = event.detail.action;
        const row = event.detail.row;

        switch (action.name) {
            case 'view':
                this.navigateToRecord(row.Id, 'view');
                break;
            case 'edit':
                this.navigateToRecord(row.Id, 'edit');
                break;
            default:
                break;
        }
    }

    // ═══════════════════════════════════════════════════════════
    // NAVIGATION
    // ═══════════════════════════════════════════════════════════

    navigateToRecord(recordId, actionName) {
        this[NavigationMixin.Navigate]({
            type: 'standard__recordPage',
            attributes: {
                recordId: recordId,
                objectApiName: 'Account',
                actionName: actionName
            }
        });
    }

    // ═══════════════════════════════════════════════════════════
    // TOAST NOTIFICATIONS
    // ═══════════════════════════════════════════════════════════

    showErrorToast(title, message) {
        this.dispatchEvent(new ShowToastEvent({
            title: title,
            message: message,
            variant: 'error'
        }));
    }

    showSuccessToast(title, message) {
        this.dispatchEvent(new ShowToastEvent({
            title: title,
            message: message,
            variant: 'success'
        }));
    }
}
───────────────────────────────────────────────────────────────

3. accountList.css
───────────────────────────────────────────────────────────────
:host {
    display: block;
}

.slds-text-color_error {
    display: flex;
    align-items: center;
}
───────────────────────────────────────────────────────────────

4. accountList.js-meta.xml
───────────────────────────────────────────────────────────────
<?xml version="1.0" encoding="UTF-8"?>
<LightningComponentBundle xmlns="http://soap.sforce.com/2006/04/metadata">
    <apiVersion>59.0</apiVersion>
    <isExposed>true</isExposed>
    <targets>
        <target>lightning__RecordPage</target>
        <target>lightning__AppPage</target>
        <target>lightning__HomePage</target>
    </targets>
    <targetConfigs>
        <targetConfig targets="lightning__RecordPage">
            <objects>
                <object>Account</object>
            </objects>
        </targetConfig>
    </targetConfigs>
</LightningComponentBundle>
───────────────────────────────────────────────────────────────

5. __tests__/accountList.test.js
───────────────────────────────────────────────────────────────
[Jest test scaffolding - see test command]
───────────────────────────────────────────────────────────────

Apex Controller Generated:
├── AccountController.cls
└── AccountControllerTest.cls

[Deploy to Org] [Open in VS Code] [Run Tests]
```

### analyze <component>: Analyze LWC

**Step 1: Read Component Files**

**Step 2: Analyze for Issues**

```
LWC ANALYSIS: contactForm
═══════════════════════════════════════════════════════════════

COMPONENT INFO:
├── Type: Form Component
├── Files: 4 (html, js, css, meta.xml)
├── Size: 245 lines total
├── Wire Adapters: 1
├── Imperative Calls: 2
└── Custom Events: 1

ISSUES FOUND:

CRITICAL:
├── [Line 45] Direct DOM manipulation
│   Code: this.template.querySelector('.input').value = '';
│   Fix: Use tracked property instead
│
├── [Line 78] Missing error handling
│   Code: createContact({ contact: this.contact })
│   Fix: Add .catch() or try/catch block

HIGH:
├── [Line 23] Reactive property not tracked
│   Code: contact = {};
│   Fix: @track contact = {} for object reactivity
│
├── [meta.xml] isExposed false but used on page
│   Fix: Set isExposed="true"

MEDIUM:
├── [Line 56] Hardcoded string
│   Code: 'Error creating contact'
│   Fix: Use Custom Label for i18n
│
├── [CSS] !important usage
│   Fix: Increase specificity instead

BEST PRACTICES:
├── Consider splitting into smaller components
├── Add JSDoc comments for public API
├── Use constants for repeated values
└── Add aria-labels for accessibility

SUGGESTIONS:
┌─────────────────────────────────────────────────────────────┐
│ [Fix Critical Issues] [Generate Tests] [View Best Practices]│
└─────────────────────────────────────────────────────────────┘
```

### wire <apex-method>: Generate Wire Adapter

```
WIRE ADAPTER: getContactsByAccount
═══════════════════════════════════════════════════════════════

For Apex method:
@AuraEnabled(cacheable=true)
public static List<Contact> getContactsByAccount(Id accountId) {...}

Generated Wire Code:
───────────────────────────────────────────────────────────────

// Import
import getContactsByAccount from '@salesforce/apex/ContactController.getContactsByAccount';

// Property for caching wire result (for refreshApex)
wiredContactsResult;

// Wire adapter with dynamic parameter
@wire(getContactsByAccount, { accountId: '$recordId' })
wiredContacts(result) {
    this.wiredContactsResult = result;
    const { data, error } = result;

    if (data) {
        this.contacts = data;
        this.error = undefined;
    } else if (error) {
        this.error = error;
        this.contacts = [];
        console.error('Error loading contacts:', JSON.stringify(error));
    }
}

// Refresh method
handleRefresh() {
    return refreshApex(this.wiredContactsResult);
}

───────────────────────────────────────────────────────────────

NOTES:
├── cacheable=true required for @wire
├── $ prefix makes parameter reactive
├── Store result for refreshApex support
└── Always handle both data and error

[Copy to Clipboard] [Insert into Component]
```

### imperative <method>: Generate Imperative Call

```
IMPERATIVE CALL: createContact
═══════════════════════════════════════════════════════════════

For Apex method:
@AuraEnabled
public static Id createContact(Contact contact) {...}

Generated Imperative Code:
───────────────────────────────────────────────────────────────

// Import
import createContact from '@salesforce/apex/ContactController.createContact';
import { ShowToastEvent } from 'lightning/platformShowToastEvent';

// Async/Await Pattern (Recommended)
async handleSave() {
    this.isLoading = true;

    try {
        const contactId = await createContact({ contact: this.contact });

        this.dispatchEvent(new ShowToastEvent({
            title: 'Success',
            message: 'Contact created successfully',
            variant: 'success'
        }));

        // Dispatch custom event for parent
        this.dispatchEvent(new CustomEvent('contactcreated', {
            detail: { id: contactId }
        }));

        // Reset form
        this.resetForm();

    } catch (error) {
        this.dispatchEvent(new ShowToastEvent({
            title: 'Error creating contact',
            message: error.body?.message || error.message,
            variant: 'error'
        }));
    } finally {
        this.isLoading = false;
    }
}

// Promise Pattern (Alternative)
handleSavePromise() {
    this.isLoading = true;

    createContact({ contact: this.contact })
        .then(contactId => {
            this.showSuccessToast('Contact created');
            this.dispatchEvent(new CustomEvent('contactcreated', {
                detail: { id: contactId }
            }));
        })
        .catch(error => {
            this.showErrorToast('Error', error.body?.message);
        })
        .finally(() => {
            this.isLoading = false;
        });
}

───────────────────────────────────────────────────────────────

NOTES:
├── Use imperative for DML operations (non-cacheable)
├── Always show loading indicator
├── Handle errors with user-friendly messages
├── Use finally to reset loading state
└── Consider dispatching events for parent components
```

### event <name>: Create Custom Event

```
CUSTOM EVENT: recordselected
═══════════════════════════════════════════════════════════════

Generated Event Pattern:
───────────────────────────────────────────────────────────────

// In Child Component (dispatcher)
// ═══════════════════════════════════════════════════════════

handleSelection(event) {
    const selectedRecord = this.records[event.target.dataset.index];

    // Create and dispatch custom event
    const recordSelectedEvent = new CustomEvent('recordselected', {
        detail: {
            recordId: selectedRecord.Id,
            recordName: selectedRecord.Name,
            record: selectedRecord
        },
        bubbles: false,     // Set true to bubble up DOM
        composed: false     // Set true to cross shadow boundary
    });

    this.dispatchEvent(recordSelectedEvent);
}

───────────────────────────────────────────────────────────────

// In Parent Component (handler)
// ═══════════════════════════════════════════════════════════

// HTML
<c-child-component onrecordselected={handleRecordSelected}>
</c-child-component>

// JavaScript
handleRecordSelected(event) {
    const { recordId, recordName, record } = event.detail;

    console.log('Selected record:', recordId);

    // Process the selected record
    this.selectedRecordId = recordId;
    this.selectedRecord = record;
}

───────────────────────────────────────────────────────────────

EVENT NAMING CONVENTIONS:
├── All lowercase: recordselected (not recordSelected)
├── Handler prefix: on + eventname = onrecordselected
├── Descriptive but concise names
└── No hyphens in event names

WHEN TO USE BUBBLING:
├── bubbles: true - Event travels up DOM tree
├── composed: true - Event crosses shadow DOM boundary
├── Both true - Event reaches lightning-app-page
└── Both false (default) - Event stays in immediate parent
```

### test <component>: Generate Jest Tests

```
JEST TESTS: accountList
═══════════════════════════════════════════════════════════════

Generated: __tests__/accountList.test.js
───────────────────────────────────────────────────────────────

import { createElement } from 'lwc';
import AccountList from 'c/accountList';
import getAccounts from '@salesforce/apex/AccountController.getAccounts';

// Mock Apex method
jest.mock(
    '@salesforce/apex/AccountController.getAccounts',
    () => ({ default: jest.fn() }),
    { virtual: true }
);

// Mock data
const MOCK_ACCOUNTS = [
    { Id: '001xx000003DGQAAA4', Name: 'Test Account 1', Industry: 'Technology' },
    { Id: '001xx000003DGQBAA4', Name: 'Test Account 2', Industry: 'Healthcare' }
];

describe('c-account-list', () => {

    afterEach(() => {
        // Clean up DOM
        while (document.body.firstChild) {
            document.body.removeChild(document.body.firstChild);
        }
        jest.clearAllMocks();
    });

    // ═══════════════════════════════════════════════════════
    // POSITIVE TESTS
    // ═══════════════════════════════════════════════════════

    it('displays accounts when data is returned', async () => {
        getAccounts.mockResolvedValue(MOCK_ACCOUNTS);

        const element = createElement('c-account-list', {
            is: AccountList
        });
        document.body.appendChild(element);

        // Wait for wire adapter
        await Promise.resolve();

        const datatable = element.shadowRoot.querySelector('lightning-datatable');
        expect(datatable).not.toBeNull();
        expect(datatable.data.length).toBe(2);
    });

    it('displays account names correctly', async () => {
        getAccounts.mockResolvedValue(MOCK_ACCOUNTS);

        const element = createElement('c-account-list', {
            is: AccountList
        });
        document.body.appendChild(element);

        await Promise.resolve();

        const datatable = element.shadowRoot.querySelector('lightning-datatable');
        expect(datatable.data[0].Name).toBe('Test Account 1');
    });

    // ═══════════════════════════════════════════════════════
    // LOADING STATE
    // ═══════════════════════════════════════════════════════

    it('displays spinner while loading', () => {
        // Don't resolve the promise yet
        getAccounts.mockReturnValue(new Promise(() => {}));

        const element = createElement('c-account-list', {
            is: AccountList
        });
        document.body.appendChild(element);

        const spinner = element.shadowRoot.querySelector('lightning-spinner');
        expect(spinner).not.toBeNull();
    });

    // ═══════════════════════════════════════════════════════
    // ERROR HANDLING
    // ═══════════════════════════════════════════════════════

    it('displays error message when fetch fails', async () => {
        getAccounts.mockRejectedValue({
            body: { message: 'Error loading accounts' }
        });

        const element = createElement('c-account-list', {
            is: AccountList
        });
        document.body.appendChild(element);

        await Promise.resolve();
        await Promise.resolve(); // Two ticks for error

        const errorDiv = element.shadowRoot.querySelector('.slds-text-color_error');
        expect(errorDiv).not.toBeNull();
    });

    // ═══════════════════════════════════════════════════════
    // EMPTY STATE
    // ═══════════════════════════════════════════════════════

    it('displays empty state when no accounts', async () => {
        getAccounts.mockResolvedValue([]);

        const element = createElement('c-account-list', {
            is: AccountList
        });
        document.body.appendChild(element);

        await Promise.resolve();

        const emptyMessage = element.shadowRoot.querySelector('.slds-text-align_center');
        expect(emptyMessage).not.toBeNull();
        expect(emptyMessage.textContent).toContain('No accounts found');
    });

    // ═══════════════════════════════════════════════════════
    // USER INTERACTIONS
    // ═══════════════════════════════════════════════════════

    it('calls refresh when button clicked', async () => {
        getAccounts.mockResolvedValue(MOCK_ACCOUNTS);

        const element = createElement('c-account-list', {
            is: AccountList
        });
        document.body.appendChild(element);

        await Promise.resolve();

        const refreshButton = element.shadowRoot.querySelector('lightning-button[label="Refresh"]');
        refreshButton.click();

        // Verify refresh was triggered
        expect(getAccounts).toHaveBeenCalledTimes(2);
    });
});
───────────────────────────────────────────────────────────────

TEST COVERAGE:
├── Positive path: Data loaded successfully
├── Loading state: Spinner displayed
├── Error handling: Error message shown
├── Empty state: No data message
└── User interactions: Button clicks

[Run Tests] [Add More Cases] [View Coverage]
```

### convert-aura <aura>: Convert Aura to LWC

```
AURA TO LWC CONVERSION
═══════════════════════════════════════════════════════════════

Converting: aura/ContactList to lwc/contactList

CHANGES:
├── Component Bundle
│   ├── ContactList.cmp → contactList.html
│   ├── ContactListController.js → contactList.js
│   ├── ContactListHelper.js → (merged into .js)
│   └── ContactList.css → contactList.css

SYNTAX CONVERSIONS:
│
├── Attributes → Properties
│   <aura:attribute name="contacts" type="List"/>
│   →
│   @track contacts = [];
│
├── Aura Handlers → Event Listeners
│   <aura:handler name="init" action="{!c.doInit}"/>
│   →
│   connectedCallback() { this.loadContacts(); }
│
├── Aura Methods → Wire/Imperative
│   var action = component.get("c.getContacts");
│   →
│   @wire(getContacts) wiredContacts;
│
├── Expressions → Template Directives
│   <aura:if isTrue="{!v.showSpinner}">
│   →
│   <template lwc:if={showSpinner}>
│
├── Iteration
│   <aura:iteration items="{!v.contacts}" var="con">
│   →
│   <template for:each={contacts} for:item="con">
│
└── Events
│   var evt = $A.get("e.force:navigateToSObject");
│   →
│   this[NavigationMixin.Navigate]({...});

[View Full Conversion] [Apply Changes] [Manual Review Items]
```

## Quick Reference

```
LWC LIFECYCLE HOOKS
═══════════════════════════════════════════════════════════════

constructor()        - Component created, no DOM access
connectedCallback()  - Component inserted into DOM
renderedCallback()   - Component rendered (called each render)
disconnectedCallback() - Component removed from DOM
errorCallback()      - Error in descendant component

DECORATORS
═══════════════════════════════════════════════════════════════

@api        - Public property/method (parent can set)
@track      - Reactive property (object/array changes)
@wire       - Connect to Salesforce data

TEMPLATE DIRECTIVES
═══════════════════════════════════════════════════════════════

lwc:if={condition}      - Conditional rendering
lwc:elseif={condition}  - Else if
lwc:else                - Else block
for:each={array}        - Iteration
for:item="item"         - Iterator variable
key={uniqueId}          - Required for iteration
```

## Integration

Works well with:
- `/siftcoder:lwc-debug` - Debug LWC issues
- `/siftcoder:apex` - Generate Apex controllers
- `/siftcoder:sf-test` - Generate comprehensive tests
