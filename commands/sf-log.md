---
description: Salesforce custom logging - Platform Events, logging framework, real-time monitoring
argument-hint: <action> [level|query] [--setup|--monitor]
allowed-tools: Read, Write, Edit, Glob, Grep, Bash
---

# /siftcoder:sf-log - Custom Logging Framework

Setup a robust custom logging framework using Platform Events. Logs survive transaction rollbacks and support real-time monitoring.

## Usage

```
/siftcoder:sf-log setup                - Setup Platform Event logging
/siftcoder:sf-log create <level>       - Create log entry
/siftcoder:sf-log monitor              - Real-time log monitor
/siftcoder:sf-log query [filter]       - Query historical logs
/siftcoder:sf-log export               - Export logs to file
/siftcoder:sf-log clean [days]         - Clean old log records
/siftcoder:sf-log                      - Logging overview
```

## Instructions

### Default: Logging Overview

```
SALESFORCE LOGGING OVERVIEW
═══════════════════════════════════════════════════════════════

WHY CUSTOM LOGGING?
├── System.debug is lost after execution
├── Debug logs have size limits (20MB)
├── Need historical log data
├── Need real-time monitoring
└── Need to survive transaction rollbacks

ARCHITECTURE:
┌─────────────────────────────────────────────────────────────┐
│                                                             │
│   Apex Code                                                 │
│      │                                                      │
│      │  Logger.log('ERROR', 'Payment failed', context);    │
│      │                                                      │
│      ▼                                                      │
│   Platform Event (Log_Event__e)                            │
│      │                                                      │
│      │  Survives rollback!                                  │
│      │                                                      │
│      ├──────────────┬──────────────┐                       │
│      ▼              ▼              ▼                        │
│   Trigger        Flow          External                     │
│   (Store)     (Alert)        (Splunk)                      │
│      │                                                      │
│      ▼                                                      │
│   Application_Log__c                                        │
│   (Queryable History)                                       │
│                                                             │
└─────────────────────────────────────────────────────────────┘

[Setup Framework] [View Logs] [Configure Alerts]
```

### setup: Setup Platform Event Logging

```
LOGGING FRAMEWORK SETUP
═══════════════════════════════════════════════════════════════

Generating logging framework components...

1. Platform Event: Log_Event__e
───────────────────────────────────────────────────────────────
force-app/main/default/objects/Log_Event__e/Log_Event__e.object-meta.xml

<?xml version="1.0" encoding="UTF-8"?>
<CustomObject xmlns="http://soap.sforce.com/2006/04/metadata">
    <deploymentStatus>Deployed</deploymentStatus>
    <eventType>HighVolume</eventType>
    <label>Log Event</label>
    <pluralLabel>Log Events</pluralLabel>
    <publishBehavior>PublishImmediately</publishBehavior>
</CustomObject>

Fields:
├── Level__c (Picklist: ERROR, WARN, INFO, DEBUG)
├── Category__c (Text, 100)
├── Message__c (Long Text, 32000)
├── Context__c (Long Text, 32000) - JSON context
├── Class_Name__c (Text, 255)
├── Method_Name__c (Text, 255)
├── Line_Number__c (Number)
├── User_Id__c (Text, 18)
├── Transaction_Id__c (Text, 36)
└── Timestamp__c (DateTime)
───────────────────────────────────────────────────────────────

2. Log Storage Object: Application_Log__c
───────────────────────────────────────────────────────────────
force-app/main/default/objects/Application_Log__c/

Fields: (same as Platform Event)
+ Id, CreatedDate (standard)
+ Retention policy: 90 days
───────────────────────────────────────────────────────────────

3. Logger Utility Class
───────────────────────────────────────────────────────────────
force-app/main/default/classes/Logger.cls

/**
 * Centralized logging utility using Platform Events
 *
 * Usage:
 *   Logger.error('Payment failed', ex, context);
 *   Logger.info('Order processed', orderMap);
 *   Logger.debug('Variable value', data);
 */
public class Logger {

    // Log levels
    public enum Level { ERROR, WARN, INFO, DEBUG }

    // Current transaction ID (for correlating logs)
    private static String transactionId;

    // Batch logs for bulk publish
    private static List<Log_Event__e> pendingLogs = new List<Log_Event__e>();

    /**
     * Log an error with exception details
     */
    public static void error(String message, Exception ex) {
        error(message, ex, null);
    }

    public static void error(String message, Exception ex, Map<String, Object> context) {
        Map<String, Object> fullContext = context != null ?
            context : new Map<String, Object>();

        if (ex != null) {
            fullContext.put('exceptionType', ex.getTypeName());
            fullContext.put('exceptionMessage', ex.getMessage());
            fullContext.put('stackTrace', ex.getStackTraceString());
            fullContext.put('lineNumber', ex.getLineNumber());
        }

        log(Level.ERROR, message, fullContext);
    }

    /**
     * Log a warning
     */
    public static void warn(String message) {
        log(Level.WARN, message, null);
    }

    public static void warn(String message, Map<String, Object> context) {
        log(Level.WARN, message, context);
    }

    /**
     * Log informational message
     */
    public static void info(String message) {
        log(Level.INFO, message, null);
    }

    public static void info(String message, Map<String, Object> context) {
        log(Level.INFO, message, context);
    }

    /**
     * Log debug message
     */
    public static void debug(String message) {
        log(Level.DEBUG, message, null);
    }

    public static void debug(String message, Map<String, Object> context) {
        log(Level.DEBUG, message, context);
    }

    /**
     * Core logging method
     */
    public static void log(Level level, String message, Map<String, Object> context) {
        // Also write to System.debug for immediate visibility
        System.debug(LoggingLevel.valueOf(level.name()), message);

        // Get calling class/method info from stack trace
        String stackTrace = new DmlException().getStackTraceString();
        Map<String, String> caller = parseStackTrace(stackTrace);

        // Create Platform Event
        Log_Event__e logEvent = new Log_Event__e(
            Level__c = level.name(),
            Category__c = caller.get('className'),
            Message__c = message,
            Context__c = context != null ?
                JSON.serialize(context).left(32000) : null,
            Class_Name__c = caller.get('className'),
            Method_Name__c = caller.get('methodName'),
            Line_Number__c = Integer.valueOf(caller.get('lineNumber')),
            User_Id__c = UserInfo.getUserId(),
            Transaction_Id__c = getTransactionId(),
            Timestamp__c = DateTime.now()
        );

        // Add to batch
        pendingLogs.add(logEvent);

        // Auto-publish if batch size reached or ERROR level
        if (pendingLogs.size() >= 100 || level == Level.ERROR) {
            flush();
        }
    }

    /**
     * Publish all pending logs
     */
    public static void flush() {
        if (pendingLogs.isEmpty()) {
            return;
        }

        List<Database.SaveResult> results = EventBus.publish(pendingLogs);

        for (Integer i = 0; i < results.size(); i++) {
            if (!results[i].isSuccess()) {
                System.debug(LoggingLevel.ERROR,
                    'Failed to publish log: ' + results[i].getErrors()[0].getMessage());
            }
        }

        pendingLogs.clear();
    }

    /**
     * Get/create transaction ID for correlating logs
     */
    private static String getTransactionId() {
        if (transactionId == null) {
            transactionId = generateUUID();
        }
        return transactionId;
    }

    /**
     * Generate UUID for transaction ID
     */
    private static String generateUUID() {
        Blob b = Crypto.generateAesKey(128);
        String h = EncodingUtil.convertToHex(b);
        return h.substring(0, 8) + '-' +
               h.substring(8, 12) + '-' +
               h.substring(12, 16) + '-' +
               h.substring(16, 20) + '-' +
               h.substring(20);
    }

    /**
     * Parse stack trace to get calling class/method
     */
    private static Map<String, String> parseStackTrace(String stackTrace) {
        Map<String, String> result = new Map<String, String>{
            'className' => 'Unknown',
            'methodName' => 'Unknown',
            'lineNumber' => '0'
        };

        if (String.isBlank(stackTrace)) {
            return result;
        }

        // Skip Logger class entries, find actual caller
        List<String> lines = stackTrace.split('\n');
        for (String line : lines) {
            if (!line.contains('Logger.') && line.contains('Class.')) {
                // Parse: Class.ClassName.methodName: line X, column Y
                Pattern p = Pattern.compile('Class\\.([^\\.]+)\\.([^:]+): line (\\d+)');
                Matcher m = p.matcher(line);
                if (m.find()) {
                    result.put('className', m.group(1));
                    result.put('methodName', m.group(2));
                    result.put('lineNumber', m.group(3));
                    break;
                }
            }
        }

        return result;
    }
}
───────────────────────────────────────────────────────────────

4. Platform Event Trigger (Store Logs)
───────────────────────────────────────────────────────────────
force-app/main/default/triggers/LogEventTrigger.trigger

trigger LogEventTrigger on Log_Event__e (after insert) {
    LogEventHandler.handleLogs(Trigger.new);
}
───────────────────────────────────────────────────────────────

5. Log Event Handler
───────────────────────────────────────────────────────────────
force-app/main/default/classes/LogEventHandler.cls

public class LogEventHandler {

    public static void handleLogs(List<Log_Event__e> events) {
        List<Application_Log__c> logsToInsert = new List<Application_Log__c>();

        for (Log_Event__e event : events) {
            // Check log level filter (could use Custom Metadata)
            if (shouldLog(event.Level__c)) {
                logsToInsert.add(new Application_Log__c(
                    Level__c = event.Level__c,
                    Category__c = event.Category__c,
                    Message__c = event.Message__c,
                    Context__c = event.Context__c,
                    Class_Name__c = event.Class_Name__c,
                    Method_Name__c = event.Method_Name__c,
                    Line_Number__c = event.Line_Number__c,
                    User__c = event.User_Id__c,
                    Transaction_Id__c = event.Transaction_Id__c,
                    Log_Timestamp__c = event.Timestamp__c
                ));
            }
        }

        if (!logsToInsert.isEmpty()) {
            // Use Database.insert with allOrNone=false
            // to avoid losing logs due to validation errors
            Database.insert(logsToInsert, false);
        }
    }

    private static Boolean shouldLog(String level) {
        // Get minimum log level from Custom Metadata
        String minLevel = getMinimumLogLevel();

        Map<String, Integer> levelOrder = new Map<String, Integer>{
            'DEBUG' => 1,
            'INFO' => 2,
            'WARN' => 3,
            'ERROR' => 4
        };

        return levelOrder.get(level) >= levelOrder.get(minLevel);
    }

    private static String getMinimumLogLevel() {
        // Could read from Custom Metadata
        return 'INFO'; // Default: INFO and above
    }
}
───────────────────────────────────────────────────────────────

6. Log Viewer Lightning Component
───────────────────────────────────────────────────────────────
[LWC component for real-time log viewing - optional]
───────────────────────────────────────────────────────────────

FILES GENERATED:
├── objects/Log_Event__e/
├── objects/Application_Log__c/
├── classes/Logger.cls
├── classes/LogEventHandler.cls
├── triggers/LogEventTrigger.trigger
└── lwc/logViewer/ (optional)

USAGE EXAMPLE:
───────────────────────────────────────────────────────────────
public class PaymentService {

    public static void processPayment(Payment__c payment) {
        Logger.info('Processing payment', new Map<String, Object>{
            'paymentId' => payment.Id,
            'amount' => payment.Amount__c
        });

        try {
            // Process payment...

            Logger.info('Payment successful', new Map<String, Object>{
                'paymentId' => payment.Id,
                'transactionId' => result.transactionId
            });

        } catch (Exception e) {
            Logger.error('Payment failed', e, new Map<String, Object>{
                'paymentId' => payment.Id
            });
            throw e;
        } finally {
            Logger.flush(); // Ensure logs are published
        }
    }
}
───────────────────────────────────────────────────────────────

[Deploy Framework] [Configure Alerts] [Test Logging]
```

### monitor: Real-time Log Monitor

```
REAL-TIME LOG MONITOR
═══════════════════════════════════════════════════════════════

Subscribing to Log_Event__e...

LIVE LOGS:
───────────────────────────────────────────────────────────────
[10:30:45] INFO  | PaymentService.processPayment
                 | Processing payment
                 | {"paymentId": "a01xx...", "amount": 1500.00}

[10:30:46] INFO  | PaymentService.processPayment
                 | Payment successful
                 | {"paymentId": "a01xx...", "transactionId": "txn_123"}

[10:30:48] ERROR | OrderService.createOrder
                 | Order creation failed
                 | {"exceptionType": "System.DmlException",
                 |  "exceptionMessage": "FIELD_CUSTOM_VALIDATION..."}

[10:30:50] WARN  | IntegrationService.syncData
                 | Retry attempt 2 of 3
                 | {"endpoint": "callout:ERP_API", "retryIn": 5000}

───────────────────────────────────────────────────────────────
Filter: [All Levels] | [Last 1 hour] | [Search: ________]

Press Ctrl+C to stop monitoring
```

### query [filter]: Query Historical Logs

```
LOG QUERY
═══════════════════════════════════════════════════════════════

Query: Level = 'ERROR' AND CreatedDate = TODAY

RESULTS (25 records):
───────────────────────────────────────────────────────────────
ID              TIME      LEVEL  CLASS                MESSAGE
───────────────────────────────────────────────────────────────
a02xx00001234   10:30:48  ERROR  OrderService         Order creation failed
a02xx00001233   10:15:22  ERROR  PaymentProcessor     Gateway timeout
a02xx00001232   09:45:10  ERROR  IntegrationService   Callout failed
a02xx00001231   09:30:05  ERROR  BatchProcessor       Heap limit exceeded
a02xx00001230   08:55:33  ERROR  TriggerHandler       Validation error
... (20 more)

AGGREGATE BY CLASS:
├── OrderService: 8 errors
├── PaymentProcessor: 6 errors
├── IntegrationService: 5 errors
└── Others: 6 errors

[Export Results] [View Details] [Create Alert]
```

## Integration

Works well with:
- `/siftcoder:sf-debug` - System debug logs
- `/siftcoder:apex` - Add logging to code
- `/siftcoder:sf-connect` - External log aggregation
