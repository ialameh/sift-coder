---
description: Salesforce webhook handling - create inbound webhook endpoints with HMAC verification
argument-hint: <action> [name] [--secure|--platform-event]
allowed-tools: Read, Write, Edit, Glob, Grep, Bash
---

# /siftcoder:sf-webhook - Webhook Handler Setup

Create secure inbound webhook endpoints in Salesforce. Generate REST resources, HMAC verification, and Platform Event integration.

## Usage

```
/siftcoder:sf-webhook create <name>    - Create webhook endpoint
/siftcoder:sf-webhook secure <name>    - Add HMAC verification
/siftcoder:sf-webhook test <name>      - Generate test utilities
/siftcoder:sf-webhook list             - List existing webhooks
/siftcoder:sf-webhook analyze          - Analyze webhook security
/siftcoder:sf-webhook                  - Show webhook guide
```

## Instructions

### Default: Webhook Implementation Guide

```
SALESFORCE WEBHOOK GUIDE
═══════════════════════════════════════════════════════════════

WEBHOOK ARCHITECTURE:
┌─────────────────────────────────────────────────────────────┐
│                                                             │
│   External System                                           │
│        │                                                    │
│        │ POST /services/apexrest/webhook/stripe            │
│        ▼                                                    │
│   ┌─────────────────────────────────────────────────────┐  │
│   │            Salesforce REST Resource                  │  │
│   │                                                      │  │
│   │  1. Verify HMAC Signature                           │  │
│   │  2. Parse JSON Payload                              │  │
│   │  3. Validate Event Type                             │  │
│   │  4. Process or Queue Event                          │  │
│   │  5. Return 200 OK                                    │  │
│   └─────────────────────────────────────────────────────┘  │
│        │                                                    │
│        ▼                                                    │
│   Platform Event / Queueable / Direct Processing           │
│                                                             │
└─────────────────────────────────────────────────────────────┘

BEST PRACTICES:
├── Always verify webhook signatures (HMAC)
├── Return 200 quickly, process async
├── Log all incoming webhooks
├── Handle retries (idempotency)
└── Use Platform Events for reliability

[Create Webhook] [View Examples] [Security Checklist]
```

### create <name>: Create Webhook Endpoint

**Step 1: Gather Requirements**

```
WEBHOOK CREATION: Stripe
═══════════════════════════════════════════════════════════════

Configuration:
├── Name: Stripe Webhook
├── URL: /services/apexrest/webhook/stripe
├── Method: POST
├── Security: HMAC-SHA256 verification
├── Processing: Platform Event (async)
└── Events: payment_intent.succeeded, customer.created

Generating files...
```

**Step 2: Generate Webhook Handler**

```
FILES GENERATED:
═══════════════════════════════════════════════════════════════

1. REST Resource (force-app/main/default/classes/)
───────────────────────────────────────────────────────────────
StripeWebhookResource.cls

/**
 * REST endpoint for Stripe webhook events
 * URL: /services/apexrest/webhook/stripe
 *
 * Security: HMAC-SHA256 signature verification
 * Processing: Async via Platform Events
 */
@RestResource(urlMapping='/webhook/stripe/*')
global with sharing class StripeWebhookResource {

    private static final String WEBHOOK_SECRET_NAME = 'Stripe_Webhook_Secret';

    @HttpPost
    global static void handlePost() {
        RestRequest req = RestContext.request;
        RestResponse res = RestContext.response;

        try {
            // Get raw body and signature
            String payload = req.requestBody.toString();
            String signature = req.headers.get('Stripe-Signature');

            // Log incoming webhook
            logWebhook('Stripe', payload, signature);

            // Verify signature
            if (!verifySignature(payload, signature)) {
                res.statusCode = 401;
                res.responseBody = Blob.valueOf('{"error": "Invalid signature"}');
                return;
            }

            // Parse event
            StripeEvent event = (StripeEvent) JSON.deserialize(
                payload,
                StripeEvent.class
            );

            // Publish to Platform Event for async processing
            Stripe_Webhook_Event__e platformEvent = new Stripe_Webhook_Event__e(
                Event_Id__c = event.id,
                Event_Type__c = event.type,
                Payload__c = payload,
                Received_At__c = DateTime.now()
            );

            Database.SaveResult result = EventBus.publish(platformEvent);

            if (result.isSuccess()) {
                res.statusCode = 200;
                res.responseBody = Blob.valueOf('{"status": "received"}');
            } else {
                res.statusCode = 500;
                res.responseBody = Blob.valueOf('{"error": "Failed to queue event"}');
            }

        } catch (Exception e) {
            System.debug(LoggingLevel.ERROR, 'Webhook error: ' + e.getMessage());
            res.statusCode = 500;
            res.responseBody = Blob.valueOf('{"error": "' + e.getMessage() + '"}');
        }
    }

    /**
     * Verify Stripe webhook signature (HMAC-SHA256)
     */
    private static Boolean verifySignature(String payload, String signatureHeader) {
        if (String.isBlank(signatureHeader)) {
            return false;
        }

        // Get webhook secret from Custom Metadata
        String webhookSecret = getWebhookSecret();
        if (String.isBlank(webhookSecret)) {
            System.debug(LoggingLevel.ERROR, 'Webhook secret not configured');
            return false;
        }

        // Parse signature header: t=timestamp,v1=signature
        Map<String, String> sigParts = parseSignatureHeader(signatureHeader);
        String timestamp = sigParts.get('t');
        String expectedSig = sigParts.get('v1');

        if (String.isBlank(timestamp) || String.isBlank(expectedSig)) {
            return false;
        }

        // Check timestamp (prevent replay attacks, 5 min tolerance)
        Long timestampLong = Long.valueOf(timestamp);
        Long currentTime = DateTime.now().getTime() / 1000;
        if (Math.abs(currentTime - timestampLong) > 300) {
            System.debug(LoggingLevel.WARN, 'Webhook timestamp too old');
            return false;
        }

        // Compute expected signature
        String signedPayload = timestamp + '.' + payload;
        Blob hmac = Crypto.generateMac(
            'HmacSHA256',
            Blob.valueOf(signedPayload),
            Blob.valueOf(webhookSecret)
        );
        String computedSig = EncodingUtil.convertToHex(hmac);

        return expectedSig.equals(computedSig);
    }

    private static Map<String, String> parseSignatureHeader(String header) {
        Map<String, String> result = new Map<String, String>();
        for (String part : header.split(',')) {
            String[] kv = part.split('=');
            if (kv.size() == 2) {
                result.put(kv[0].trim(), kv[1].trim());
            }
        }
        return result;
    }

    private static String getWebhookSecret() {
        // Retrieve from Custom Metadata or Custom Setting
        Webhook_Config__mdt config = [
            SELECT Secret__c FROM Webhook_Config__mdt
            WHERE DeveloperName = :WEBHOOK_SECRET_NAME
            LIMIT 1
        ];
        return config?.Secret__c;
    }

    private static void logWebhook(String source, String payload, String signature) {
        // Insert log record (consider async)
        Integration_Log__c log = new Integration_Log__c(
            Source__c = source,
            Direction__c = 'Inbound',
            Payload__c = payload.left(131072), // Max long text
            Received_At__c = DateTime.now()
        );
        insert log;
    }

    // ═══════════════════════════════════════════════════════
    // EVENT CLASSES
    // ═══════════════════════════════════════════════════════

    public class StripeEvent {
        public String id;
        public String type;
        public Long created;
        public Map<String, Object> data;
    }
}
───────────────────────────────────────────────────────────────

2. Platform Event (force-app/main/default/objects/)
───────────────────────────────────────────────────────────────
Stripe_Webhook_Event__e.object-meta.xml

<?xml version="1.0" encoding="UTF-8"?>
<CustomObject xmlns="http://soap.sforce.com/2006/04/metadata">
    <deploymentStatus>Deployed</deploymentStatus>
    <eventType>HighVolume</eventType>
    <label>Stripe Webhook Event</label>
    <pluralLabel>Stripe Webhook Events</pluralLabel>
    <publishBehavior>PublishAfterCommit</publishBehavior>
</CustomObject>

Fields:
├── Event_Id__c (Text, 255)
├── Event_Type__c (Text, 100)
├── Payload__c (Long Text Area, 131072)
└── Received_At__c (DateTime)
───────────────────────────────────────────────────────────────

3. Platform Event Trigger
───────────────────────────────────────────────────────────────
StripeWebhookEventTrigger.trigger

trigger StripeWebhookEventTrigger on Stripe_Webhook_Event__e (after insert) {
    StripeWebhookEventHandler.handle(Trigger.new);
}
───────────────────────────────────────────────────────────────

4. Event Handler
───────────────────────────────────────────────────────────────
StripeWebhookEventHandler.cls

/**
 * Handles Stripe webhook events asynchronously
 */
public with sharing class StripeWebhookEventHandler {

    public static void handle(List<Stripe_Webhook_Event__e> events) {
        List<Payment__c> paymentsToCreate = new List<Payment__c>();
        List<Account> accountsToUpdate = new List<Account>();

        for (Stripe_Webhook_Event__e event : events) {
            try {
                switch on event.Event_Type__c {
                    when 'payment_intent.succeeded' {
                        paymentsToCreate.add(processPaymentSuccess(event));
                    }
                    when 'customer.created' {
                        // Handle customer creation
                        processCustomerCreated(event);
                    }
                    when 'invoice.paid' {
                        // Handle invoice payment
                        processInvoicePaid(event);
                    }
                    when else {
                        System.debug('Unhandled event type: ' + event.Event_Type__c);
                    }
                }
            } catch (Exception e) {
                // Log error but don't fail entire batch
                System.debug(LoggingLevel.ERROR,
                    'Error processing event ' + event.Event_Id__c + ': ' + e.getMessage()
                );
            }
        }

        // Bulk DML
        if (!paymentsToCreate.isEmpty()) {
            insert paymentsToCreate;
        }
    }

    private static Payment__c processPaymentSuccess(Stripe_Webhook_Event__e event) {
        // Parse payload and create Payment record
        Map<String, Object> payload = (Map<String, Object>)
            JSON.deserializeUntyped(event.Payload__c);

        Map<String, Object> data = (Map<String, Object>) payload.get('data');
        Map<String, Object> paymentIntent = (Map<String, Object>) data.get('object');

        return new Payment__c(
            Stripe_Payment_Intent_Id__c = (String) paymentIntent.get('id'),
            Amount__c = ((Decimal) paymentIntent.get('amount')) / 100,
            Status__c = 'Completed',
            Payment_Date__c = Date.today()
        );
    }

    private static void processCustomerCreated(Stripe_Webhook_Event__e event) {
        // Implementation
    }

    private static void processInvoicePaid(Stripe_Webhook_Event__e event) {
        // Implementation
    }
}
───────────────────────────────────────────────────────────────

5. Custom Metadata Type (for webhook secrets)
───────────────────────────────────────────────────────────────
Webhook_Config__mdt

Fields:
├── Secret__c (Text, Encrypted, 255)
└── Active__c (Checkbox)

Record:
└── Stripe_Webhook_Secret (configure in Setup)
───────────────────────────────────────────────────────────────

6. Test Class
───────────────────────────────────────────────────────────────
StripeWebhookResourceTest.cls

@isTest
private class StripeWebhookResourceTest {

    @isTest
    static void testValidWebhook() {
        // Setup
        String payload = '{"id":"evt_test","type":"payment_intent.succeeded",...}';
        String timestamp = String.valueOf(DateTime.now().getTime() / 1000);
        String signature = generateTestSignature(payload, timestamp);

        // Create mock request
        RestRequest req = new RestRequest();
        req.requestBody = Blob.valueOf(payload);
        req.headers.put('Stripe-Signature', 't=' + timestamp + ',v1=' + signature);
        req.httpMethod = 'POST';
        req.requestURI = '/services/apexrest/webhook/stripe';

        RestContext.request = req;
        RestContext.response = new RestResponse();

        // Test
        Test.startTest();
        StripeWebhookResource.handlePost();
        Test.stopTest();

        // Verify
        System.assertEquals(200, RestContext.response.statusCode);
    }

    private static String generateTestSignature(String payload, String timestamp) {
        String secret = 'whsec_test_secret';
        String signedPayload = timestamp + '.' + payload;
        Blob hmac = Crypto.generateMac('HmacSHA256',
            Blob.valueOf(signedPayload), Blob.valueOf(secret));
        return EncodingUtil.convertToHex(hmac);
    }
}
───────────────────────────────────────────────────────────────

SETUP STEPS:
1. Deploy metadata: sf project deploy start
2. Configure webhook secret in Custom Metadata
3. Add Site/Community URL to Stripe webhook config
4. Set endpoint: https://[domain]/services/apexrest/webhook/stripe
5. Test with Stripe CLI: stripe trigger payment_intent.succeeded

[Deploy] [Configure Secret] [Test Webhook]
```

### secure <name>: Add HMAC Verification

```
WEBHOOK SECURITY: Adding HMAC-SHA256 Verification
═══════════════════════════════════════════════════════════════

HMAC Verification Pattern:
───────────────────────────────────────────────────────────────

/**
 * Generic HMAC verification utility
 */
public class WebhookSecurity {

    /**
     * Verify HMAC-SHA256 signature
     * @param payload Raw request body
     * @param signature Provided signature
     * @param secret Webhook secret
     * @return True if signature is valid
     */
    public static Boolean verifyHmacSha256(
        String payload,
        String signature,
        String secret
    ) {
        Blob hmac = Crypto.generateMac(
            'HmacSHA256',
            Blob.valueOf(payload),
            Blob.valueOf(secret)
        );
        String computed = EncodingUtil.convertToHex(hmac);

        // Constant-time comparison to prevent timing attacks
        return constantTimeEquals(signature, computed);
    }

    /**
     * Verify with timestamp (prevents replay attacks)
     */
    public static Boolean verifyWithTimestamp(
        String payload,
        String signature,
        String timestamp,
        String secret,
        Integer toleranceSeconds
    ) {
        // Check timestamp freshness
        Long timestampLong = Long.valueOf(timestamp);
        Long currentTime = DateTime.now().getTime() / 1000;

        if (Math.abs(currentTime - timestampLong) > toleranceSeconds) {
            return false;
        }

        // Verify signature
        String signedPayload = timestamp + '.' + payload;
        return verifyHmacSha256(signedPayload, signature, secret);
    }

    /**
     * Constant-time string comparison
     * Prevents timing attacks
     */
    private static Boolean constantTimeEquals(String a, String b) {
        if (a == null || b == null || a.length() != b.length()) {
            return false;
        }

        Integer result = 0;
        for (Integer i = 0; i < a.length(); i++) {
            result |= a.charAt(i) ^ b.charAt(i);
        }
        return result == 0;
    }
}
───────────────────────────────────────────────────────────────

PROVIDER-SPECIFIC PATTERNS:

STRIPE:
Header: Stripe-Signature: t=timestamp,v1=signature
Signed: timestamp + '.' + payload

GITHUB:
Header: X-Hub-Signature-256: sha256=signature
Signed: payload (raw body)

TWILIO:
Header: X-Twilio-Signature
Signed: URL + sorted params

SHOPIFY:
Header: X-Shopify-Hmac-Sha256
Signed: payload (base64 encoded)

[Generate for Stripe] [Generate for GitHub] [Custom Provider]
```

### analyze: Analyze Webhook Security

```
WEBHOOK SECURITY ANALYSIS
═══════════════════════════════════════════════════════════════

SCANNING WEBHOOK ENDPOINTS...

ENDPOINTS FOUND:
├── /services/apexrest/webhook/stripe
├── /services/apexrest/webhook/github
└── /services/apexrest/webhook/legacy

SECURITY ASSESSMENT:

/services/apexrest/webhook/stripe
├── ✓ HMAC Verification: Implemented
├── ✓ Timestamp Check: 5 min tolerance
├── ✓ Async Processing: Platform Events
├── ✓ Error Handling: Try-catch with logging
└── ✓ Test Coverage: 89%

/services/apexrest/webhook/github
├── ✓ HMAC Verification: Implemented
├── ⚠️ No Timestamp Check: Replay attack possible
├── ✓ Async Processing: Queueable
├── ✓ Error Handling: Basic
└── ⚠️ Test Coverage: 67%

/services/apexrest/webhook/legacy
├── ✗ No HMAC Verification: CRITICAL
├── ✗ No Timestamp Check
├── ✗ Sync Processing: May timeout
├── ⚠️ Error Handling: Partial
└── ✗ Test Coverage: 23%

RECOMMENDATIONS:

[CRITICAL] legacy webhook - Add signature verification
└── Anyone with the URL can send fake webhooks!

[HIGH] github webhook - Add timestamp validation
└── Vulnerable to replay attacks

[MEDIUM] Increase test coverage on all webhooks

SECURITY CHECKLIST:
┌─────────────────────────────────────────────────────────────┐
│ □ All webhooks verify signatures                           │
│ □ Timestamps validated (5 min tolerance)                   │
│ □ Secrets stored in Custom Metadata (encrypted)            │
│ □ Process async to avoid timeouts                          │
│ □ Log all incoming webhooks                                │
│ □ Handle duplicates (idempotency)                          │
│ □ Return 200 quickly, process later                        │
│ □ Test coverage > 75%                                       │
└─────────────────────────────────────────────────────────────┘

[Fix Critical Issues] [Generate Security Report]
```

## Integration

Works well with:
- `/siftcoder:sf-connect` - Setup outbound integrations
- `/siftcoder:sf-log` - Log webhook events
- `/siftcoder:sf-test` - Generate test coverage
