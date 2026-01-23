---
description: Salesforce debug log analysis - parse logs, identify bottlenecks, governor limits
argument-hint: <action> [log-file|class] [--limits|--performance]
allowed-tools: Read, Write, Edit, Glob, Grep, Bash
---

# /siftcoder:sf-debug - Debug Log Analysis

Parse and analyze Salesforce debug logs. Identify performance bottlenecks, governor limit consumption, and execution flow issues.

## Usage

```
/siftcoder:sf-debug log <class>        - Setup debug logging
/siftcoder:sf-debug analyze <log>      - Analyze debug log file
/siftcoder:sf-debug limits             - Check governor limits
/siftcoder:sf-debug trace <user>       - Enable trace flags
/siftcoder:sf-debug event <name>       - Debug platform events
/siftcoder:sf-debug tail               - Stream live debug logs
/siftcoder:sf-debug                    - Debug overview and guide
```

## Instructions

### Default: Debug Overview

```
SALESFORCE DEBUGGING GUIDE
═══════════════════════════════════════════════════════════════

QUICK COMMANDS:
├── Enable debug logging:
│   sf apex tail log --target-org myOrg
│
├── Download recent logs:
│   sf apex log list
│   sf apex log get --log-id <id>
│
├── Run with debug output:
│   sf apex run --file script.apex --target-org myOrg
│
└── Set trace flag:
│   sf apex log tail --debug-level FINEST

DEBUG LEVELS:
┌─────────────────────────────────────────────────────────────┐
│ Level     │ Description                    │ Use Case       │
├─────────────────────────────────────────────────────────────┤
│ NONE      │ No logging                     │ Production     │
│ ERROR     │ Only errors                    │ Basic monitor  │
│ WARN      │ Warnings and errors            │ Light debug    │
│ INFO      │ Key information                │ Standard debug │
│ DEBUG     │ Detailed information           │ Deep debug     │
│ FINE      │ Finer-grained detail           │ Troubleshoot   │
│ FINER     │ Even more detail               │ Deep analysis  │
│ FINEST    │ Everything                     │ Full trace     │
└─────────────────────────────────────────────────────────────┘

[Enable Logging] [Tail Logs] [Analyze Recent]
```

### analyze <log>: Analyze Debug Log

**Step 1: Parse Debug Log**

Read and parse the debug log file.

**Step 2: Generate Analysis Report**

```
DEBUG LOG ANALYSIS
═══════════════════════════════════════════════════════════════

Log File: debug-log-2026-01-12.txt
Size: 2.4 MB
Duration: 4,523 ms

EXECUTION SUMMARY
─────────────────────────────────────────────────────────────

├── Total Time: 4,523 ms
│   ├── Apex CPU Time: 2,100 ms (46%)
│   ├── Database Time: 1,800 ms (40%)
│   ├── Callout Time: 623 ms (14%)
│   └── Other: <1%
│
├── Transaction Type: Trigger (Account)
├── User: admin@company.com
└── Request ID: 4_AABB_123

GOVERNOR LIMITS CONSUMPTION
─────────────────────────────────────────────────────────────

Limit                    Used      Max        %      Status
─────────────────────────────────────────────────────────────
SOQL Queries             45        100       45%    ⚠️ Warning
SOQL Rows                8,500     50,000    17%    ✓ OK
DML Statements           12        150       8%     ✓ OK
DML Rows                 245       10,000    2%     ✓ OK
CPU Time                 2,100ms   10,000ms  21%    ✓ OK
Heap Size                3.2 MB    6 MB      53%    ⚠️ Warning
Callouts                 5         100       5%     ✓ OK
Future Calls             2         50        4%     ✓ OK
Queueable Jobs           1         50        2%     ✓ OK

⚠️ WARNINGS:
├── SOQL at 45% - Consider optimizing queries
└── Heap at 53% - Monitor for large data volumes

SOQL QUERY ANALYSIS
─────────────────────────────────────────────────────────────

TOP 5 SLOWEST QUERIES:

1. 1,200 ms - Line 234 (AccountSelector.cls)
   SELECT Id, Name, Industry, ...
   FROM Account
   WHERE Custom_Field__c = 'value'
   ├── Rows Returned: 2,500
   ├── Index Used: None ⚠️
   └── Recommendation: Add custom index on Custom_Field__c

2. 450 ms - Line 89 (ContactSelector.cls)
   SELECT Id, Name, Email, AccountId, ...
   FROM Contact
   WHERE AccountId IN :accountIds
   ├── Rows Returned: 500
   ├── Index Used: AccountId (Standard)
   └── Status: Optimal ✓

3. 89 ms - Lines 156-189 (N+1 QUERY DETECTED!)
   SELECT Id, Email FROM Contact WHERE Id = :contactId
   ├── Called: 34 times in loop ⚠️
   ├── Total Rows: 34
   └── Recommendation: Query all IDs before loop

4-5. [Additional queries...]

N+1 QUERY DETECTION
─────────────────────────────────────────────────────────────

⚠️ POTENTIAL N+1 PATTERN at lines 156-189

Code Pattern:
```
for (Account acc : accounts) {
    // QUERY IN LOOP - BAD!
    Contact c = [SELECT Id, Email FROM Contact
                 WHERE AccountId = :acc.Id LIMIT 1];
}
```

Recommendation:
```
// Query BEFORE loop
Map<Id, Contact> contactsByAccount = new Map<Id, Contact>();
for (Contact c : [SELECT Id, Email, AccountId
                  FROM Contact
                  WHERE AccountId IN :accountIds]) {
    contactsByAccount.put(c.AccountId, c);
}

// Use map IN loop
for (Account acc : accounts) {
    Contact c = contactsByAccount.get(acc.Id);
}
```

DML ANALYSIS
─────────────────────────────────────────────────────────────

DML Operations:
├── INSERT: 3 operations, 45 records
├── UPDATE: 8 operations, 180 records
├── DELETE: 1 operation, 20 records
└── Total: 12 operations, 245 records

DML in Loop Detection: None found ✓

EXECUTION FLOW
─────────────────────────────────────────────────────────────

AccountTrigger (BEFORE_UPDATE)
├── 0ms    │ Trigger start
├── 5ms    │ AccountTriggerHandler.run()
├── 15ms   │ └── beforeUpdate()
├── 234ms  │     └── AccountSelector.selectByIds() [SLOW]
├── 250ms  │     └── validateChanges()
├── 280ms  │     └── enrichData()
├── 1200ms │     └── externalValidation() [CALLOUT]
└── 1250ms │ Trigger complete

AccountTrigger (AFTER_UPDATE)
├── 1251ms │ Trigger start
├── 1260ms │ AccountTriggerHandler.run()
├── 1275ms │ └── afterUpdate()
├── 1890ms │     └── syncToExternalSystem() [CALLOUT]
├── 2100ms │     └── createAuditRecords()
└── 2150ms │ Trigger complete

CALLOUT ANALYSIS
─────────────────────────────────────────────────────────────

Callout 1: externalValidation
├── URL: callout:External_API/validate
├── Method: POST
├── Duration: 623 ms
├── Status: 200 OK
└── Response Size: 2.4 KB

Callout 2: syncToExternalSystem
├── URL: callout:ERP_API/accounts
├── Method: PUT
├── Duration: 540 ms
├── Status: 200 OK
└── Response Size: 1.1 KB

RECOMMENDATIONS
─────────────────────────────────────────────────────────────

1. [HIGH] Add custom index on Account.Custom_Field__c
   └── Expected improvement: 800ms+ reduction

2. [HIGH] Fix N+1 query at lines 156-189
   └── Expected improvement: 33 SOQL queries saved

3. [MEDIUM] Consider async processing for callouts
   └── Move to Queueable to improve UX

4. [LOW] Review heap usage for bulk scenarios
   └── Monitor when processing >1000 records

[Export Report] [Compare to Baseline] [Apply Fixes]
```

### limits: Check Governor Limits

```
GOVERNOR LIMITS REFERENCE
═══════════════════════════════════════════════════════════════

SYNCHRONOUS LIMITS:
┌─────────────────────────────────────────────────────────────┐
│ Limit                          │ Value                      │
├─────────────────────────────────────────────────────────────┤
│ SOQL Queries                   │ 100                        │
│ SOQL Query Rows Retrieved      │ 50,000                     │
│ SOSL Queries                   │ 20                         │
│ DML Statements                 │ 150                        │
│ DML Rows                       │ 10,000                     │
│ Heap Size                      │ 6 MB                       │
│ CPU Time                       │ 10,000 ms                  │
│ Callouts                       │ 100                        │
│ Callout Timeout (single)       │ 120 seconds                │
│ Callout Total Timeout          │ 120 seconds                │
│ Future Calls                   │ 50                         │
│ Queueable Jobs                 │ 50                         │
│ sendEmail Invocations          │ 10                         │
│ Push Notification Calls        │ 10                         │
└─────────────────────────────────────────────────────────────┘

ASYNCHRONOUS LIMITS (Batch/Future/Queueable):
┌─────────────────────────────────────────────────────────────┐
│ Limit                          │ Value                      │
├─────────────────────────────────────────────────────────────┤
│ SOQL Queries                   │ 200                        │
│ Heap Size                      │ 12 MB                      │
│ CPU Time                       │ 60,000 ms                  │
└─────────────────────────────────────────────────────────────┘

APEX CODE TO CHECK LIMITS:
───────────────────────────────────────────────────────────────
System.debug('SOQL: ' + Limits.getQueries() + '/' + Limits.getLimitQueries());
System.debug('DML: ' + Limits.getDmlStatements() + '/' + Limits.getLimitDmlStatements());
System.debug('CPU: ' + Limits.getCpuTime() + '/' + Limits.getLimitCpuTime());
System.debug('Heap: ' + Limits.getHeapSize() + '/' + Limits.getLimitHeapSize());
───────────────────────────────────────────────────────────────
```

### trace <user>: Enable Trace Flags

```
TRACE FLAG SETUP
═══════════════════════════════════════════════════════════════

Setting up trace flag for user: admin@company.com

CURRENT TRACE FLAGS:
├── None active

DEBUG LEVEL OPTIONS:
┌─────────────────────────────────────────────────────────────┐
│ [1] SFDC_DevConsole (Standard)                             │
│     Apex: DEBUG, DB: INFO, System: INFO                    │
│                                                             │
│ [2] Detailed_Debug (Custom)                                │
│     Apex: FINEST, DB: FINEST, Callout: FINEST              │
│                                                             │
│ [3] Performance_Analysis                                    │
│     Apex: INFO, DB: INFO, System: FINE                     │
│                                                             │
│ [4] Custom (Configure levels)                              │
└─────────────────────────────────────────────────────────────┘

SETTING TRACE FLAG:
───────────────────────────────────────────────────────────────
sf apex log tail --target-org myOrg --debug-level Detailed_Debug
───────────────────────────────────────────────────────────────

OR via Tooling API:
───────────────────────────────────────────────────────────────
// Create trace flag (expires in 30 minutes)
TraceFlag tf = new TraceFlag();
tf.TracedEntityId = '005xx000001xxxxx'; // User ID
tf.DebugLevelId = '7dl...'; // Debug Level ID
tf.StartDate = DateTime.now();
tf.ExpirationDate = DateTime.now().addMinutes(30);

[Enable Standard] [Enable Detailed] [Custom Setup]
```

### tail: Stream Live Debug Logs

```bash
# Stream debug logs in real-time
sf apex tail log --target-org myOrg --color

# With debug level
sf apex tail log --target-org myOrg --debug-level FINEST

# Filter by user
sf apex tail log --target-org myOrg --skip-trace-flag
```

```
LIVE DEBUG LOG STREAM
═══════════════════════════════════════════════════════════════

Streaming logs for: admin@company.com
Press Ctrl+C to stop

───────────────────────────────────────────────────────────────
[2026-01-12 10:30:45] EXECUTION_STARTED
[2026-01-12 10:30:45] CODE_UNIT_STARTED|AccountTrigger
[2026-01-12 10:30:45] METHOD_ENTRY|AccountTriggerHandler.run
[2026-01-12 10:30:45] SOQL_EXECUTE_BEGIN|[34]|SELECT Id, Name FROM Account
[2026-01-12 10:30:45] SOQL_EXECUTE_END|[34]|Rows:5
[2026-01-12 10:30:45] USER_DEBUG|[45]|DEBUG|Processing 5 accounts
[2026-01-12 10:30:46] DML_BEGIN|[67]|Op:Update|Type:Account|Rows:5
[2026-01-12 10:30:46] DML_END|[67]
[2026-01-12 10:30:46] CODE_UNIT_FINISHED|AccountTrigger
[2026-01-12 10:30:46] EXECUTION_FINISHED

SUMMARY: 1 SOQL, 1 DML, 0 Callouts, 0 Errors
───────────────────────────────────────────────────────────────
```

### event <name>: Debug Platform Events

```
PLATFORM EVENT DEBUGGING
═══════════════════════════════════════════════════════════════

Event: Order_Event__e

RECENT EVENTS (Last 24 hours):
┌─────────────────────────────────────────────────────────────┐
│ Time          │ Replay ID │ Status    │ Subscriber         │
├─────────────────────────────────────────────────────────────┤
│ 10:30:45      │ 12345     │ Published │ -                   │
│ 10:30:46      │ 12345     │ Delivered │ OrderEventTrigger   │
│ 10:30:47      │ 12345     │ Processed │ OrderEventTrigger   │
│ 10:28:12      │ 12344     │ Published │ -                   │
│ 10:28:13      │ 12344     │ Failed    │ OrderEventTrigger   │
└─────────────────────────────────────────────────────────────┘

FAILED EVENT DETAILS (Replay ID: 12344):
├── Error: System.DmlException
├── Message: FIELD_CUSTOM_VALIDATION_EXCEPTION
├── Stack Trace: OrderEventHandler line 45
└── Payload: {"orderId": "a01...", "status": "SHIPPED"}

DEBUG PLATFORM EVENTS:
───────────────────────────────────────────────────────────────
// Subscribe to events in Developer Console
// Debug > Open Execute Anonymous Window

// Or use Event Monitoring
SELECT Id, EventUuid, CreatedDate, ErrorMessage
FROM PlatformEventUsageMetric
WHERE EventType = 'Order_Event__e'
ORDER BY CreatedDate DESC
LIMIT 100
───────────────────────────────────────────────────────────────

[View Failed Events] [Replay Event] [Check Subscribers]
```

## Common Debug Patterns

```
DEBUGGING PATTERNS
═══════════════════════════════════════════════════════════════

1. DEBUG LOGGING IN APEX
───────────────────────────────────────────────────────────────
// Basic debug
System.debug('Variable value: ' + myVar);

// With log level
System.debug(LoggingLevel.ERROR, 'Critical error: ' + e.getMessage());

// JSON serialize for complex objects
System.debug('Account: ' + JSON.serializePretty(acc));

// Limits tracking
System.debug('SOQL: ' + Limits.getQueries() + '/' + Limits.getLimitQueries());

2. EXCEPTION DEBUGGING
───────────────────────────────────────────────────────────────
try {
    // risky code
} catch (Exception e) {
    System.debug(LoggingLevel.ERROR, 'Exception Type: ' + e.getTypeName());
    System.debug(LoggingLevel.ERROR, 'Message: ' + e.getMessage());
    System.debug(LoggingLevel.ERROR, 'Stack: ' + e.getStackTraceString());
    System.debug(LoggingLevel.ERROR, 'Line: ' + e.getLineNumber());
    throw e; // re-throw after logging
}

3. CALLOUT DEBUGGING
───────────────────────────────────────────────────────────────
HttpRequest req = new HttpRequest();
System.debug('Request URL: ' + req.getEndpoint());
System.debug('Request Body: ' + req.getBody());

HttpResponse res = http.send(req);
System.debug('Response Status: ' + res.getStatusCode());
System.debug('Response Body: ' + res.getBody());
───────────────────────────────────────────────────────────────
```

## Integration

Works well with:
- `/siftcoder:apex` - Fix issues found in logs
- `/siftcoder:sf-test` - Debug failing tests
- `/siftcoder:sf-log` - Custom logging framework
