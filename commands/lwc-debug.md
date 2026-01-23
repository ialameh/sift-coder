---
description: LWC debugging - wire issues, lifecycle, performance, component state analysis
argument-hint: <mode> [component] [--trace|--performance]
allowed-tools: Read, Write, Edit, Glob, Grep, Bash
---

# /siftcoder:lwc-debug - LWC Debugging Tools

Specialized debugging for Lightning Web Components. Diagnose wire adapter issues, trace lifecycle hooks, analyze performance, and debug reactive state.

## Usage

```
/siftcoder:lwc-debug component <name>  - Debug specific component
/siftcoder:lwc-debug wire              - Debug wire service issues
/siftcoder:lwc-debug lifecycle         - Trace lifecycle hooks
/siftcoder:lwc-debug performance       - Performance analysis
/siftcoder:lwc-debug state <component> - Analyze reactive state
/siftcoder:lwc-debug events            - Debug event propagation
/siftcoder:lwc-debug                   - General LWC debugging guide
```

## Instructions

### Default: General Debugging Guide

```
LWC DEBUGGING GUIDE
═══════════════════════════════════════════════════════════════

COMMON ISSUES AND SOLUTIONS:

1. COMPONENT NOT RENDERING
   ┌─────────────────────────────────────────────────────────┐
   │ Symptoms: Blank component, no errors                    │
   ├─────────────────────────────────────────────────────────┤
   │ Check:                                                  │
   │ ├── meta.xml: isExposed="true"?                        │
   │ ├── meta.xml: Correct targets defined?                 │
   │ ├── HTML: Valid template syntax?                       │
   │ └── JS: Constructor throwing error?                    │
   │                                                         │
   │ Debug:                                                  │
   │ └── console.log in connectedCallback()                 │
   └─────────────────────────────────────────────────────────┘

2. DATA NOT DISPLAYING
   ┌─────────────────────────────────────────────────────────┐
   │ Symptoms: Component renders, data empty                 │
   ├─────────────────────────────────────────────────────────┤
   │ Check:                                                  │
   │ ├── @wire: Is parameter reactive ($prefix)?            │
   │ ├── @wire: Is Apex method cacheable=true?              │
   │ ├── Apex: Does method return data?                     │
   │ └── Permissions: Does user have access?                │
   │                                                         │
   │ Debug:                                                  │
   │ @wire(getData, { id: '$recordId' })                    │
   │ wiredData({ data, error }) {                           │
   │     console.log('data:', JSON.stringify(data));        │
   │     console.log('error:', JSON.stringify(error));      │
   │ }                                                       │
   └─────────────────────────────────────────────────────────┘

3. CHANGES NOT REFLECTING
   ┌─────────────────────────────────────────────────────────┐
   │ Symptoms: Property updates, UI doesn't change          │
   ├─────────────────────────────────────────────────────────┤
   │ Check:                                                  │
   │ ├── Object/Array: Using @track?                        │
   │ ├── Assignment: Creating new reference?                │
   │ └── Template: Correct property binding?                │
   │                                                         │
   │ Fix (Object reactivity):                               │
   │ // Wrong: this.contact.Name = 'New Name';              │
   │ // Right: this.contact = { ...this.contact,            │
   │ //                         Name: 'New Name' };         │
   │                                                         │
   │ Fix (Array reactivity):                                │
   │ // Wrong: this.items.push(newItem);                    │
   │ // Right: this.items = [...this.items, newItem];       │
   └─────────────────────────────────────────────────────────┘

4. EVENT NOT FIRING
   ┌─────────────────────────────────────────────────────────┐
   │ Symptoms: Handler not called                           │
   ├─────────────────────────────────────────────────────────┤
   │ Check:                                                  │
   │ ├── Event name: lowercase only (onmyevent)?           │
   │ ├── Handler: Correct syntax in template?               │
   │ ├── Bubbling: Need bubbles: true?                      │
   │ └── Shadow DOM: Need composed: true?                   │
   │                                                         │
   │ Debug in child:                                         │
   │ const evt = new CustomEvent('myevent', {...});         │
   │ console.log('Dispatching:', evt.type);                 │
   │ this.dispatchEvent(evt);                               │
   │                                                         │
   │ Debug in parent:                                        │
   │ handleMyEvent(event) {                                 │
   │     console.log('Event received:', event.detail);      │
   │ }                                                       │
   └─────────────────────────────────────────────────────────┘
```

### component <name>: Debug Specific Component

**Step 1: Find and Read Component Files**

**Step 2: Analyze and Report Issues**

```
COMPONENT DEBUG: contactForm
═══════════════════════════════════════════════════════════════

COMPONENT STRUCTURE:
├── contactForm.html (45 lines)
├── contactForm.js (120 lines)
├── contactForm.css (20 lines)
└── contactForm.js-meta.xml

DEPENDENCY ANALYSIS:
├── Imports:
│   ├── lwc: LightningElement, wire, track, api
│   ├── apex: createContact, getContactTypes
│   └── platform: ShowToastEvent
│
├── Wire Adapters: 2
│   ├── @wire(getContactTypes) → contactTypes
│   └── @wire(getRecord, ...) → recordData
│
└── Imperative Calls: 1
    └── createContact() in handleSave()

POTENTIAL ISSUES:

[ISSUE 1] Wire Adapter Parameter Not Reactive
├── Location: Line 34
├── Code: @wire(getRecord, { recordId: this.recordId })
├── Problem: 'this.recordId' is not reactive
└── Fix: Use '$recordId' for reactive binding
    @wire(getRecord, { recordId: '$recordId' })

[ISSUE 2] Missing Error Handling
├── Location: Line 78-85
├── Code:
│   async handleSave() {
│       const result = await createContact({...});
│       // No try/catch!
│   }
└── Fix: Wrap in try/catch with toast notification

[ISSUE 3] Direct DOM Query
├── Location: Line 92
├── Code: this.template.querySelector('input').value
├── Problem: Breaks encapsulation, may fail
└── Fix: Use tracked property binding instead

STATE ANALYSIS:
├── @api properties: recordId
├── @track properties: contact, errors
├── Private properties: isLoading
└── Computed getters: hasErrors, isFormValid

RECOMMENDATIONS:
1. Add loading state to handleSave()
2. Clear form after successful save
3. Add input validation before submit
4. Consider splitting into smaller components

[Apply Auto-Fixes] [Add Debug Logging] [Generate Tests]
```

### wire: Debug Wire Service Issues

```
WIRE SERVICE DEBUGGING
═══════════════════════════════════════════════════════════════

WIRE ADAPTER CHECKLIST:
┌─────────────────────────────────────────────────────────────┐
│ □ Apex method has @AuraEnabled(cacheable=true)             │
│ □ Parameter names match exactly                             │
│ □ Reactive parameters use $ prefix                         │
│ □ Wire function handles both data AND error                │
│ □ Result stored for refreshApex support                    │
└─────────────────────────────────────────────────────────────┘

DEBUGGING TECHNIQUES:

1. LOG WIRE RESULTS
───────────────────────────────────────────────────────────────
@wire(getAccounts, { searchKey: '$searchTerm' })
wiredAccounts(result) {
    console.log('Wire called with searchTerm:', this.searchTerm);
    console.log('Result:', JSON.stringify(result));

    this.wiredResult = result; // Store for refresh

    if (result.data) {
        console.log('Data received:', result.data.length, 'records');
        this.accounts = result.data;
        this.error = undefined;
    } else if (result.error) {
        console.error('Wire error:', JSON.stringify(result.error));
        this.error = result.error;
        this.accounts = [];
    }
}
───────────────────────────────────────────────────────────────

2. CHECK APEX METHOD
───────────────────────────────────────────────────────────────
// Verify in Developer Console:
AccountController.getAccounts('test');

// Or add debug logging:
@AuraEnabled(cacheable=true)
public static List<Account> getAccounts(String searchKey) {
    System.debug('getAccounts called with: ' + searchKey);
    List<Account> results = [SELECT Id, Name FROM Account
                             WHERE Name LIKE :('%' + searchKey + '%')];
    System.debug('Returning ' + results.size() + ' accounts');
    return results;
}
───────────────────────────────────────────────────────────────

3. VERIFY PERMISSIONS
───────────────────────────────────────────────────────────────
Check:
├── Profile/Permission Set has Apex Class Access
├── User has Object/Field Level Security
├── Sharing rules allow record access
└── WITH SECURITY_ENFORCED in query (if used)
───────────────────────────────────────────────────────────────

COMMON WIRE ERRORS:

"Insufficient access" or empty data:
└── Check: User permissions, sharing rules

"Unknown wire adapter":
└── Check: Import statement correct, method exists

Wire never fires:
└── Check: Reactive parameter has value (not undefined)

Wire fires multiple times:
└── This is normal! Wire re-fires when params change
```

### lifecycle: Trace Lifecycle Hooks

```
LWC LIFECYCLE DEBUGGING
═══════════════════════════════════════════════════════════════

LIFECYCLE ORDER:
┌─────────────────────────────────────────────────────────────┐
│ 1. constructor()                                            │
│    └── Component instance created                          │
│                                                             │
│ 2. @wire methods receive data                              │
│    └── Wire adapters fire before DOM ready                 │
│                                                             │
│ 3. connectedCallback()                                      │
│    └── Component inserted into DOM                         │
│                                                             │
│ 4. renderedCallback()                                       │
│    └── DOM fully rendered (fires each render!)             │
│                                                             │
│ 5. disconnectedCallback()                                   │
│    └── Component removed from DOM                          │
└─────────────────────────────────────────────────────────────┘

DEBUG INSTRUMENTATION:
───────────────────────────────────────────────────────────────
export default class MyComponent extends LightningElement {

    constructor() {
        super();
        console.log('[LIFECYCLE] constructor - component created');
        console.log('[LIFECYCLE] this.recordId:', this.recordId);
    }

    @api recordId;

    @wire(getRecord, { recordId: '$recordId' })
    wiredRecord(result) {
        console.log('[LIFECYCLE] @wire getRecord fired');
        console.log('[LIFECYCLE] recordId was:', this.recordId);
        console.log('[LIFECYCLE] result:', JSON.stringify(result));
    }

    connectedCallback() {
        console.log('[LIFECYCLE] connectedCallback - inserted into DOM');
        console.log('[LIFECYCLE] this.recordId:', this.recordId);
        console.log('[LIFECYCLE] this.template:', this.template);
    }

    renderedCallback() {
        console.log('[LIFECYCLE] renderedCallback - DOM rendered');
        // WARNING: This fires on EVERY render!
        // Use a flag to run code only once:
        if (!this.hasRendered) {
            this.hasRendered = true;
            console.log('[LIFECYCLE] First render complete');
        }
    }

    disconnectedCallback() {
        console.log('[LIFECYCLE] disconnectedCallback - removed from DOM');
        // Clean up: remove event listeners, cancel timers
    }

    errorCallback(error, stack) {
        console.error('[LIFECYCLE] errorCallback - child error caught');
        console.error('[LIFECYCLE] Error:', error.message);
        console.error('[LIFECYCLE] Stack:', stack);
    }
}
───────────────────────────────────────────────────────────────

COMMON LIFECYCLE ISSUES:

"Cannot read property of undefined" in constructor:
└── @api properties not set yet - use connectedCallback

DOM query returns null in connectedCallback:
└── DOM not rendered yet - use renderedCallback

Infinite loop in renderedCallback:
└── renderedCallback fires on every render - use guard flag

Event listeners not cleaned up:
└── Add removeEventListener in disconnectedCallback
```

### performance: Performance Analysis

```
LWC PERFORMANCE ANALYSIS
═══════════════════════════════════════════════════════════════

PERFORMANCE CHECKLIST:
┌─────────────────────────────────────────────────────────────┐
│ □ Minimize wire adapters (consolidate queries)             │
│ □ Use cacheable=true for read-only data                    │
│ □ Avoid renderedCallback work (fires every render)         │
│ □ Use getters instead of tracked computed values           │
│ □ Lazy load child components with lwc:if                   │
│ □ Debounce user input before wire calls                    │
│ □ Use virtual scrolling for large lists                    │
└─────────────────────────────────────────────────────────────┘

PROFILING TECHNIQUES:

1. CONSOLE TIMING
───────────────────────────────────────────────────────────────
connectedCallback() {
    console.time('Component Init');
    this.loadData();
    console.timeEnd('Component Init');
}

async loadData() {
    console.time('Data Fetch');
    this.data = await fetchData();
    console.timeEnd('Data Fetch');

    console.time('Data Processing');
    this.processedData = this.processData(this.data);
    console.timeEnd('Data Processing');
}
───────────────────────────────────────────────────────────────

2. RENDER TRACKING
───────────────────────────────────────────────────────────────
renderCount = 0;

renderedCallback() {
    this.renderCount++;
    console.log(`Render #${this.renderCount}`);

    // Alert if excessive renders
    if (this.renderCount > 10) {
        console.warn('Excessive renders detected!');
    }
}
───────────────────────────────────────────────────────────────

3. MEMORY MONITORING
───────────────────────────────────────────────────────────────
// Chrome DevTools > Performance > Memory

disconnectedCallback() {
    // Clean up to prevent leaks
    this.data = null;
    this.largeArray = null;
    window.removeEventListener('resize', this.handleResize);
}
───────────────────────────────────────────────────────────────

OPTIMIZATION PATTERNS:

DEBOUNCE INPUT (Reduce wire calls):
───────────────────────────────────────────────────────────────
handleSearchInput(event) {
    const searchTerm = event.target.value;

    // Clear previous timeout
    clearTimeout(this.searchTimeout);

    // Wait 300ms before firing wire
    this.searchTimeout = setTimeout(() => {
        this.searchKey = searchTerm; // This triggers wire
    }, 300);
}
───────────────────────────────────────────────────────────────

LAZY LOAD COMPONENTS:
───────────────────────────────────────────────────────────────
<template>
    <!-- Heavy component only loads when needed -->
    <template lwc:if={showChart}>
        <c-heavy-chart-component data={chartData}>
        </c-heavy-chart-component>
    </template>

    <lightning-button label="Show Chart" onclick={loadChart}>
    </lightning-button>
</template>
───────────────────────────────────────────────────────────────

VIRTUAL SCROLLING (Large lists):
───────────────────────────────────────────────────────────────
// Instead of rendering 1000 rows, render visible ones only
// Use lightning-datatable which has built-in virtualization
<lightning-datatable
    data={largeDataset}
    columns={columns}
    key-field="id"
    enable-infinite-loading
    onloadmore={loadMoreData}>
</lightning-datatable>
───────────────────────────────────────────────────────────────
```

### state <component>: Analyze Reactive State

```
REACTIVE STATE ANALYSIS: contactEditor
═══════════════════════════════════════════════════════════════

STATE MAP:
┌─────────────────────────────────────────────────────────────┐
│ PROPERTY          │ DECORATOR │ REACTIVE │ ISSUE           │
├─────────────────────────────────────────────────────────────┤
│ recordId          │ @api      │ Yes      │ -               │
│ contact           │ @track    │ Partial  │ Deep mutations  │
│ errors            │ @track    │ Yes      │ -               │
│ isLoading         │ (none)    │ Yes*     │ -               │
│ originalContact   │ (none)    │ No       │ Intentional     │
│ validationRules   │ (none)    │ No       │ Should be const │
└─────────────────────────────────────────────────────────────┘
* Primitive values are reactive without @track

REACTIVITY ISSUES FOUND:

[ISSUE] Deep Object Mutation (Line 67)
├── Code: this.contact.Phone = event.target.value;
├── Problem: Object property mutation doesn't trigger re-render
└── Fix: Create new object reference
    this.contact = {
        ...this.contact,
        Phone: event.target.value
    };

[ISSUE] Array Push (Line 89)
├── Code: this.errors.push(newError);
├── Problem: Array mutation doesn't trigger re-render
└── Fix: Create new array
    this.errors = [...this.errors, newError];

RECOMMENDED STATE PATTERN:
───────────────────────────────────────────────────────────────
// Centralized state update method
updateContact(field, value) {
    this.contact = {
        ...this.contact,
        [field]: value
    };
    this.validateField(field, value);
}

// In template handlers
handlePhoneChange(event) {
    this.updateContact('Phone', event.target.value);
}
───────────────────────────────────────────────────────────────
```

### events: Debug Event Propagation

```
EVENT PROPAGATION DEBUGGING
═══════════════════════════════════════════════════════════════

EVENT FLOW VISUALIZATION:
┌─────────────────────────────────────────────────────────────┐
│  lightning-app-page (App)                                   │
│  │                                                          │
│  └──▶ c-parent-component                                   │
│       │                                                     │
│       └──▶ c-child-component                               │
│            │                                                │
│            └──▶ [Event Dispatched Here]                    │
│                                                             │
│  With bubbles: false, composed: false (default):           │
│  └── Event stops at c-parent-component                     │
│                                                             │
│  With bubbles: true, composed: false:                      │
│  └── Event bubbles to c-parent shadow root                 │
│                                                             │
│  With bubbles: true, composed: true:                       │
│  └── Event crosses shadow DOM to lightning-app-page        │
└─────────────────────────────────────────────────────────────┘

DEBUG EVENT DISPATCH:
───────────────────────────────────────────────────────────────
// In child component
handleClick() {
    const eventDetail = { id: this.recordId, name: this.name };

    console.log('[EVENT] Creating event: recordselected');
    console.log('[EVENT] Detail:', JSON.stringify(eventDetail));

    const event = new CustomEvent('recordselected', {
        detail: eventDetail,
        bubbles: false,
        composed: false
    });

    console.log('[EVENT] Dispatching from:', this.template.host.tagName);
    this.dispatchEvent(event);
    console.log('[EVENT] Dispatch complete');
}
───────────────────────────────────────────────────────────────

DEBUG EVENT HANDLING:
───────────────────────────────────────────────────────────────
// In parent component
// Template: <c-child onrecordselected={handleRecordSelected}>

connectedCallback() {
    console.log('[EVENT] Parent connectedCallback');
    console.log('[EVENT] Looking for child component...');
}

handleRecordSelected(event) {
    console.log('[EVENT] Event received in parent!');
    console.log('[EVENT] event.type:', event.type);
    console.log('[EVENT] event.detail:', JSON.stringify(event.detail));
    console.log('[EVENT] event.target:', event.target.tagName);
    console.log('[EVENT] event.currentTarget:', event.currentTarget.tagName);
}
───────────────────────────────────────────────────────────────

COMMON EVENT ISSUES:

Handler not called:
├── Check: Event name is all lowercase
├── Check: Handler attribute is on + eventname
├── Check: bubbles/composed settings match needs
└── Check: Handler method exists and is spelled correctly

Wrong event.target:
├── event.target = element that dispatched event
└── event.currentTarget = element with handler attached

Event detail is undefined:
└── Check: detail object passed in CustomEvent constructor
```

## Quick Debug Commands

```bash
# Check Apex class access
sf apex list --target-org myOrg | grep ContactController

# Test Apex method directly
sf apex run -f scripts/apex/testMethod.apex

# View debug logs
sf apex tail log

# Clear LWC cache
sf lightning lwc test -c
```

## Integration

Works well with:
- `/siftcoder:lwc` - Create components
- `/siftcoder:sf-debug` - Debug Apex side
- `/siftcoder:sf-test` - Generate tests
