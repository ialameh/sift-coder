---
description: Salesforce integration setup - Named Credentials, External Credentials, OAuth, REST callouts
argument-hint: <type> [api-url] [--oauth|--basic|--jwt]
allowed-tools: Read, Write, Edit, Glob, Grep, Bash
---

# /siftcoder:sf-connect - Salesforce Integration Setup

Setup external API integrations in Salesforce. Configure Named Credentials, External Credentials, Auth Providers, and generate callout classes.

## Usage

```
/siftcoder:sf-connect rest <api-url>       - Setup REST API callout
/siftcoder:sf-connect named-cred <name>    - Create Named Credential
/siftcoder:sf-connect external-cred        - Create External Credential
/siftcoder:sf-connect oauth <provider>     - Setup OAuth flow
/siftcoder:sf-connect auth-provider        - Create Auth Provider
/siftcoder:sf-connect external-service     - Register External Service
/siftcoder:sf-connect analyze              - Analyze existing integrations
/siftcoder:sf-connect                      - List current integrations
```

## Instructions

### Default: List Current Integrations

```
SALESFORCE INTEGRATIONS
═══════════════════════════════════════════════════════════════

NAMED CREDENTIALS:
┌─────────────────────────────────────────────────────────────┐
│ Name              │ Endpoint                 │ Auth Type    │
├─────────────────────────────────────────────────────────────┤
│ Stripe_API        │ https://api.stripe.com   │ OAuth 2.0    │
│ Twilio_API        │ https://api.twilio.com   │ Basic Auth   │
│ Internal_ERP      │ https://erp.company.com  │ JWT Bearer   │
└─────────────────────────────────────────────────────────────┘

EXTERNAL CREDENTIALS:
├── Stripe_External_Credential (OAuth 2.0 Client Credentials)
├── Twilio_External_Credential (Basic Auth)
└── ERP_External_Credential (JWT Bearer)

AUTH PROVIDERS:
├── Stripe_Auth_Provider
└── Google_Auth_Provider

CALLOUT CLASSES:
├── StripeService.cls
├── TwilioService.cls
└── ERPIntegrationService.cls

REMOTE SITE SETTINGS:
├── Stripe_API (https://api.stripe.com)
├── Twilio_API (https://api.twilio.com)
└── ERP_API (https://erp.company.com)

[Add Integration] [Test Connection] [View Logs]
```

### rest <api-url>: Setup REST API Integration

**Step 1: Analyze API**

```
REST API INTEGRATION: https://api.stripe.com
═══════════════════════════════════════════════════════════════

Analyzing API endpoint...

API DETECTION:
├── Provider: Stripe
├── Base URL: https://api.stripe.com
├── API Version: v1 (detected from URL pattern)
├── Auth Type: OAuth 2.0 (detected)
└── Rate Limits: Standard Stripe limits

RECOMMENDED SETUP:
┌─────────────────────────────────────────────────────────────┐
│ Authentication: OAuth 2.0 Client Credentials               │
│                                                             │
│ Components to create:                                       │
│ ├── External Credential: Stripe_External_Credential        │
│ ├── Named Credential: Stripe_API                           │
│ ├── Permission Set: Stripe_Integration_Access              │
│ ├── Apex Classes: StripeService, StripeCallout             │
│ └── Test Classes: StripeServiceTest                        │
└─────────────────────────────────────────────────────────────┘

[Proceed with Setup] [Customize] [Cancel]
```

**Step 2: Generate Components**

```
GENERATING INTEGRATION COMPONENTS
═══════════════════════════════════════════════════════════════

1. External Credential (force-app/main/default/externalCredentials/)
───────────────────────────────────────────────────────────────
Stripe_External_Credential.externalCredential-meta.xml

<?xml version="1.0" encoding="UTF-8"?>
<ExternalCredential xmlns="http://soap.sforce.com/2006/04/metadata">
    <label>Stripe External Credential</label>
    <authenticationProtocol>Oauth</authenticationProtocol>
    <externalCredentialParameters>
        <parameterName>ClientId</parameterName>
        <parameterType>AuthParameter</parameterType>
    </externalCredentialParameters>
    <externalCredentialParameters>
        <parameterName>ClientSecret</parameterName>
        <parameterType>AuthParameter</parameterType>
    </externalCredentialParameters>
</ExternalCredential>
───────────────────────────────────────────────────────────────

2. Named Credential (force-app/main/default/namedCredentials/)
───────────────────────────────────────────────────────────────
Stripe_API.namedCredential-meta.xml

<?xml version="1.0" encoding="UTF-8"?>
<NamedCredential xmlns="http://soap.sforce.com/2006/04/metadata">
    <label>Stripe API</label>
    <endpoint>https://api.stripe.com</endpoint>
    <principalType>NamedUser</principalType>
    <protocol>Oauth</protocol>
    <externalCredential>Stripe_External_Credential</externalCredential>
    <generateAuthorizationHeader>true</generateAuthorizationHeader>
    <allowMergeFieldsInHeader>false</allowMergeFieldsInHeader>
    <allowMergeFieldsInBody>false</allowMergeFieldsInBody>
</NamedCredential>
───────────────────────────────────────────────────────────────

3. Service Class (force-app/main/default/classes/)
───────────────────────────────────────────────────────────────
StripeService.cls

/**
 * Service class for Stripe API integration
 * Uses Named Credential: Stripe_API
 */
public with sharing class StripeService {

    private static final String NAMED_CREDENTIAL = 'callout:Stripe_API';

    /**
     * Create a payment intent
     * @param amount Amount in cents
     * @param currency Currency code (e.g., 'usd')
     * @return PaymentIntent response
     */
    public static PaymentIntentResponse createPaymentIntent(Integer amount, String currency) {
        HttpRequest req = new HttpRequest();
        req.setEndpoint(NAMED_CREDENTIAL + '/v1/payment_intents');
        req.setMethod('POST');
        req.setHeader('Content-Type', 'application/x-www-form-urlencoded');
        req.setBody('amount=' + amount + '&currency=' + currency);

        HttpResponse res = sendRequest(req);
        return (PaymentIntentResponse) JSON.deserialize(
            res.getBody(),
            PaymentIntentResponse.class
        );
    }

    /**
     * Get customer by ID
     * @param customerId Stripe customer ID
     * @return Customer response
     */
    public static CustomerResponse getCustomer(String customerId) {
        HttpRequest req = new HttpRequest();
        req.setEndpoint(NAMED_CREDENTIAL + '/v1/customers/' + customerId);
        req.setMethod('GET');

        HttpResponse res = sendRequest(req);
        return (CustomerResponse) JSON.deserialize(
            res.getBody(),
            CustomerResponse.class
        );
    }

    /**
     * Create a new customer
     * @param email Customer email
     * @param name Customer name
     * @return Customer response
     */
    public static CustomerResponse createCustomer(String email, String name) {
        HttpRequest req = new HttpRequest();
        req.setEndpoint(NAMED_CREDENTIAL + '/v1/customers');
        req.setMethod('POST');
        req.setHeader('Content-Type', 'application/x-www-form-urlencoded');
        req.setBody('email=' + EncodingUtil.urlEncode(email, 'UTF-8') +
                    '&name=' + EncodingUtil.urlEncode(name, 'UTF-8'));

        HttpResponse res = sendRequest(req);
        return (CustomerResponse) JSON.deserialize(
            res.getBody(),
            CustomerResponse.class
        );
    }

    /**
     * Send HTTP request with error handling
     */
    private static HttpResponse sendRequest(HttpRequest req) {
        Http http = new Http();
        HttpResponse res;

        try {
            res = http.send(req);
        } catch (CalloutException e) {
            throw new StripeException('Callout failed: ' + e.getMessage(), e);
        }

        if (res.getStatusCode() >= 400) {
            ErrorResponse error = (ErrorResponse) JSON.deserialize(
                res.getBody(),
                ErrorResponse.class
            );
            throw new StripeException(
                'Stripe API Error: ' + error.error.message,
                res.getStatusCode()
            );
        }

        return res;
    }

    // ═══════════════════════════════════════════════════════════
    // RESPONSE CLASSES
    // ═══════════════════════════════════════════════════════════

    public class PaymentIntentResponse {
        public String id;
        public Integer amount;
        public String currency_x; // 'currency' is reserved
        public String status;
        public String client_secret;
    }

    public class CustomerResponse {
        public String id;
        public String email;
        public String name;
        public Long created;
    }

    public class ErrorResponse {
        public ErrorDetail error;
    }

    public class ErrorDetail {
        public String type;
        public String message;
        public String code;
    }

    public class StripeException extends Exception {
        public Integer statusCode;

        public StripeException(String message, Integer statusCode) {
            this(message);
            this.statusCode = statusCode;
        }
    }
}
───────────────────────────────────────────────────────────────

4. Test Class
───────────────────────────────────────────────────────────────
StripeServiceTest.cls

@isTest
private class StripeServiceTest {

    @isTest
    static void testCreatePaymentIntent() {
        // Setup mock
        Test.setMock(HttpCalloutMock.class, new StripeMock());

        Test.startTest();
        StripeService.PaymentIntentResponse response =
            StripeService.createPaymentIntent(1000, 'usd');
        Test.stopTest();

        System.assertNotEquals(null, response.id);
        System.assertEquals(1000, response.amount);
    }

    @isTest
    static void testGetCustomer() {
        Test.setMock(HttpCalloutMock.class, new StripeMock());

        Test.startTest();
        StripeService.CustomerResponse response =
            StripeService.getCustomer('cus_test123');
        Test.stopTest();

        System.assertEquals('cus_test123', response.id);
    }

    // Mock class
    private class StripeMock implements HttpCalloutMock {
        public HttpResponse respond(HttpRequest req) {
            HttpResponse res = new HttpResponse();
            res.setStatusCode(200);

            if (req.getEndpoint().contains('payment_intents')) {
                res.setBody('{"id":"pi_test","amount":1000,"currency":"usd","status":"requires_payment_method"}');
            } else if (req.getEndpoint().contains('customers')) {
                res.setBody('{"id":"cus_test123","email":"test@test.com","name":"Test"}');
            }

            return res;
        }
    }
}
───────────────────────────────────────────────────────────────

5. Permission Set
───────────────────────────────────────────────────────────────
Stripe_Integration_Access.permissionset-meta.xml

<?xml version="1.0" encoding="UTF-8"?>
<PermissionSet xmlns="http://soap.sforce.com/2006/04/metadata">
    <label>Stripe Integration Access</label>
    <description>Access to Stripe API integration</description>
    <classAccesses>
        <apexClass>StripeService</apexClass>
        <enabled>true</enabled>
    </classAccesses>
    <externalCredentialPrincipalAccesses>
        <enabled>true</enabled>
        <externalCredentialPrincipal>Stripe_External_Credential - Admin</externalCredentialPrincipal>
    </externalCredentialPrincipalAccesses>
</PermissionSet>
───────────────────────────────────────────────────────────────

FILES CREATED: 6
├── externalCredentials/Stripe_External_Credential.externalCredential-meta.xml
├── namedCredentials/Stripe_API.namedCredential-meta.xml
├── classes/StripeService.cls
├── classes/StripeService.cls-meta.xml
├── classes/StripeServiceTest.cls
└── permissionsets/Stripe_Integration_Access.permissionset-meta.xml

POST-DEPLOYMENT STEPS:
1. Deploy metadata: sf project deploy start --source-dir force-app
2. In Setup > Named Credentials > External Credentials:
   - Add Principal: "Admin" with OAuth credentials
   - Enter Client ID and Client Secret
3. Assign Permission Set to integration users
4. Test: Run StripeServiceTest

[Deploy Now] [Add More Endpoints] [Generate Webhook Handler]
```

### named-cred <name>: Create Named Credential

```
NAMED CREDENTIAL: Internal_ERP
═══════════════════════════════════════════════════════════════

Configuration Options:

AUTHENTICATION TYPE:
┌─────────────────────────────────────────────────────────────┐
│ [1] OAuth 2.0 Client Credentials (Recommended)             │
│ [2] OAuth 2.0 JWT Bearer                                   │
│ [3] Basic Authentication                                    │
│ [4] API Key (Header)                                        │
│ [5] Certificate                                             │
│ [6] No Authentication                                       │
└─────────────────────────────────────────────────────────────┘

Selected: [2] OAuth 2.0 JWT Bearer

ENDPOINT CONFIGURATION:
├── Base URL: https://erp.company.com/api
├── API Version Path: /v2
└── Full Endpoint: https://erp.company.com/api/v2

JWT CONFIGURATION:
├── Token Endpoint: https://erp.company.com/oauth/token
├── Subject: integration@company.com
├── Audience: https://erp.company.com
├── Token Validity: 3600 seconds
└── Certificate: Will use Salesforce certificate

Generated Files:
├── Internal_ERP_External_Credential.externalCredential-meta.xml
├── Internal_ERP.namedCredential-meta.xml
└── certificates/Internal_ERP_Cert.crt (placeholder)

SETUP INSTRUCTIONS:
1. Generate JWT signing certificate in Setup > Certificate and Key Management
2. Upload public key to ERP system
3. Deploy metadata
4. Configure External Credential Principal with certificate
```

### oauth <provider>: Setup OAuth Flow

```
OAUTH SETUP: Google
═══════════════════════════════════════════════════════════════

OAuth 2.0 Configuration:

PROVIDER SETTINGS:
├── Provider Type: Google
├── Consumer Key: [To be configured in Setup]
├── Consumer Secret: [To be configured in Setup]
├── Authorize Endpoint: https://accounts.google.com/o/oauth2/v2/auth
├── Token Endpoint: https://oauth2.googleapis.com/token
├── Default Scopes: openid profile email
└── Callback URL: https://[your-domain].my.salesforce.com/services/authcallback/Google

GENERATED: Google_Auth_Provider.authprovider-meta.xml
───────────────────────────────────────────────────────────────
<?xml version="1.0" encoding="UTF-8"?>
<AuthProvider xmlns="http://soap.sforce.com/2006/04/metadata">
    <friendlyName>Google</friendlyName>
    <providerType>Google</providerType>
    <executionUser>[Admin User]</executionUser>
    <consumerKey>[Configure in Setup]</consumerKey>
    <consumerSecret>[Configure in Setup]</consumerSecret>
    <defaultScopes>openid profile email</defaultScopes>
    <errorUrl>/apex/AuthError</errorUrl>
    <authorizeUrl>https://accounts.google.com/o/oauth2/v2/auth</authorizeUrl>
    <tokenUrl>https://oauth2.googleapis.com/token</tokenUrl>
</AuthProvider>
───────────────────────────────────────────────────────────────

POST-SETUP:
1. Create OAuth credentials in Google Cloud Console
2. Add callback URL to authorized redirect URIs
3. Configure Consumer Key/Secret in Setup > Auth. Providers
4. Test authentication flow
```

### analyze: Analyze Existing Integrations

```
INTEGRATION ANALYSIS
═══════════════════════════════════════════════════════════════

HEALTH CHECK:

Named Credentials:
├── ✓ Stripe_API - Connected, last used 2h ago
├── ✓ Twilio_API - Connected, last used 1d ago
└── ⚠️ Legacy_API - Not used in 90 days

External Credentials:
├── ✓ Stripe_External_Credential - Token valid
├── ✓ Twilio_External_Credential - Credentials set
└── ⚠️ Legacy_External_Credential - Token expired

Callout Classes:
├── StripeService.cls
│   ├── Methods: 5
│   ├── Uses Named Credential: ✓
│   ├── Error Handling: ✓
│   └── Test Coverage: 92%
│
├── TwilioService.cls
│   ├── Methods: 3
│   ├── Uses Named Credential: ✓
│   ├── Error Handling: ✓
│   └── Test Coverage: 88%
│
└── LegacyIntegration.cls
    ├── Methods: 8
    ├── Uses Named Credential: ✗ (hardcoded URL!)
    ├── Error Handling: Partial
    └── Test Coverage: 45%

ISSUES FOUND:

[CRITICAL] LegacyIntegration.cls - Hardcoded Credentials
├── Line 23: String endpoint = 'https://api.legacy.com';
├── Line 24: String apiKey = 'sk_live_xxx...';
└── Fix: Migrate to Named Credential

[HIGH] Legacy_External_Credential - Expired Token
└── Action: Refresh OAuth token or re-authorize

[MEDIUM] Legacy_API - Unused Named Credential
└── Consider: Remove if no longer needed

RECOMMENDATIONS:
1. Migrate LegacyIntegration.cls to use Named Credentials
2. Add comprehensive error handling
3. Increase test coverage to 75%+
4. Document all integration endpoints

[Fix Issues] [Generate Report] [Migrate Legacy]
```

## Authentication Reference

```
SALESFORCE CALLOUT AUTHENTICATION
═══════════════════════════════════════════════════════════════

OAUTH 2.0 CLIENT CREDENTIALS (Server-to-Server)
├── Best for: Backend API integrations
├── Token: Auto-refreshed by Salesforce
└── Setup: External Credential + Named Credential

OAUTH 2.0 JWT BEARER
├── Best for: Google, Azure AD, custom IdP
├── Token: Generated from certificate
└── Setup: Certificate + Auth Provider

BASIC AUTHENTICATION
├── Best for: Simple APIs, legacy systems
├── Credentials: Username + Password
└── Setup: Named Credential (Per User or Named Principal)

API KEY (Header/Query)
├── Best for: Simple public APIs
├── Token: Static key in header
└── Setup: Named Credential with merge field

CERTIFICATE (mTLS)
├── Best for: High security, banking APIs
├── Auth: Client certificate
└── Setup: Certificate + Named Credential
```

## Integration

Works well with:
- `/siftcoder:sf-webhook` - Handle inbound webhooks
- `/siftcoder:apex` - Build service classes
- `/siftcoder:sf-debug` - Debug callout issues
