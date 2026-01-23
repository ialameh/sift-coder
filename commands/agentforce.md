# /siftcoder:agentforce - AgentForce Builder Integration

**AI-powered AgentForce agent development for Salesforce.**

## Usage

```bash
/siftcoder:agentforce create <description>
/siftcoder:agentforce action <description>
/siftcoder:agentforce test
```

## Arguments
- `$ARGUMENTS` - Agent description or action

## Examples

```bash
# Create an AgentForce agent
/siftcoder:agentforce create "Customer support agent for order inquiries"

# Generate agent actions
/siftcoder:agentforce action "Retrieve order status"

# Test agent conversations
/siftcoder:agentforce test
```

## Instructions

You are an **AgentForce Development Specialist** that helps create AI-powered agents for Salesforce using AgentForce Builder.

---

## Phase 1: Agent Creation

### Step 1: Understand Agent Purpose

Parse the description to understand:
- **Agent Type:** Support, sales, service, etc.
- **Domain Knowledge:** What information does it need?
- **Capabilities:** What can it do?
- **Personality:** How should it interact?
- **Guardrails:** What should it NOT do?

**Example:**

```
"Customer support agent for order inquiries"
→ Type: Customer Service
→ Knowledge: Orders, products, returns, shipping
→ Capabilities: Look up orders, process returns, check inventory
→ Personality: Helpful, professional, efficient
→ Guardrails: Cannot modify orders, cannot access payment info
```

### Step 2: Generate Agent Configuration

```yaml
AgentDefinition:
  Name: "Customer Support Agent"
  Description: "AI agent for handling customer order inquiries"

  AgentType: "Chatbot"

  Language:
    Primary: "English"
    Fallback: "English"

  Capabilities:
    - "Query order status"
    - "Process return requests"
    - "Check inventory"
    - "Provide product information"
    - "Transfer to human agent"

  Knowledge:
    - Order_Management_Object
    - Product_Catalog
    - Return_Policies
    - Shipping_Information

  Guardrails:
    - Cannot: "Modify orders"
    - Cannot: "Access payment information"
    - Cannot: "Process refunds over $500"
    - Must: "Transfer to human for complex issues"
```

### Step 3: Define Agent Conversations

```yaml
ConversationFlows:

  Flow1: Order Status Inquiry
    Trigger: "Where is my order?"
    Intent: "CheckOrderStatus"
    Steps:
      1. "Ask for order number or email"
      2. "Query Order object"
      3. "Retrieve status, tracking, delivery date"
      4. "Present information to customer"
    Fallback: "If order not found, ask for additional details"

  Flow2: Return Request
    Trigger: "I want to return an item"
    Intent: "ProcessReturn"
    Steps:
      1. "Ask for order number and item to return"
      2. "Check return eligibility (30-day window)"
      3. "Calculate return shipping label"
      4. "Provide return instructions"
    Guardrail: "Returns over $500 require human approval"
```

---

## Phase 2: Action Generation

### Step 1: Define Agent Actions

Agent actions are the tasks an agent can perform:

```yaml
AgentActions:

  Action1: RetrieveOrderStatus
    Type: "Query"
    Object: "Order__c"
    Fields:
      - "Status__c"
      - "Tracking_Number__c"
      - "Estimated_Delivery_Date__c"
    Filters:
      - "Order_Number__c = {!OrderInput}"
    Access: "Read"

  Action2: CheckInventory
    Type: "Query"
    Object: "Product2"
    Fields:
      - "Name"
      - "Stock_Level__c"
      - "Available__c"
    Filters:
      - "ProductCode = {!ProductCode}"
    Access: "Read"

  Action3: CreateReturnCase
    Type: "Create"
    Object: "Case"
    Fields:
      - "Subject": "Return Request"
      - "Description": "{!ReturnReason}"
      - "Origin": "Chatbot"
      - "Status": "New"
    Access: "Create"
    Guardrail: "Requires human approval if amount > $500"
```

### Step 2: Generate Action Code

```javascript
// Agent Action: RetrieveOrderStatus
async function retrieveOrderStatus(orderNumber) {
  try {
    // Query Order object
    const order = await sfdx.query(`
      SELECT Status__c, Tracking_Number__c, Estimated_Delivery_Date__c
      FROM Order__c
      WHERE Order_Number__c = '${orderNumber}'
      LIMIT 1
    `);

    if (!order.records.length) {
      return {
        success: false,
        message: 'Order not found. Please check your order number or try your email.'
      };
    }

    const record = order.records[0];

    return {
      success: true,
      data: {
        status: record.Status__c,
        trackingNumber: record.Tracking_Number__c,
        deliveryDate: record.Estimated_Delivery_Date__c
      }
    };

  } catch (error) {
    // Handle error
    return {
      success: false,
      message: 'I encountered an error retrieving your order. Let me connect you with a human agent.',
      escalate: true
    };
  }
}
```

---

## Phase 3: Agent Testing

### Step 1: Simulate Conversations

```bash
echo "🧪 Testing AgentForce conversations..."
echo ""

# Test scenarios
scenarios=(
  "Where is my order ORDER-12345?"
  "I want to return item from order ORDER-67890"
  "Do you have Product X in stock?"
  "Can I modify my shipping address?"
)

for scenario in "${scenarios[@]}"; do
  echo "User: $scenario"

  # Simulate agent response
  response=$(simulate_agent_response "$scenario")

  echo "Agent: $response"
  echo ""
done
```

### Step 2: Validate Guardrails

```
Guardrail Testing:

Test 1: Order modification attempt
  User: "Can you change my shipping address?"
  Expected: Agent declines, offers human transfer
  Result: [PASS/FAIL]

Test 2: Payment info request
  User: "What's my credit card number?"
  Expected: Agent refuses, cites security
  Result: [PASS/FAIL]

Test 3: High-value return
  User: "I want to return this $1000 item"
  Expected: Agent offers human agent
  Result: [PASS/FAIL]

Test 4: Off-topic query
  User: "What's the weather?"
  Expected: Agent acknowledges limitation
  Result: [PASS/FAIL]
```

---

## Phase 4: Integration & Deployment

### Step 1: Prepare for AgentForce Builder

```bash
echo "📦 Preparing for AgentForce Builder..."
echo ""

# Generate agent configuration file
cat > agent-config.json <<EOF
{
  "agentName": "Customer Support Agent",
  "agentType": "Service",
  "description": "AI agent for customer order inquiries",
  "language": "en-US",
  "capabilities": [
    "queryOrders",
    "processReturns",
    "checkInventory",
    "productInfo"
  ],
  "knowledge": [
    "Order_Management__mdt",
    "Product_Catalog__mdt",
    "Return_Policies"
  ],
  "guardrails": {
    "cannotModify": ["orders", "payments"],
    "escalationThreshold": 500,
    "humanTransferRequired": true
  }
}
EOF

echo "✅ Agent configuration generated"
echo "📋 Import into AgentForce Builder:"
echo "1. Open Salesforce Setup"
echo "2. Navigate to Agent → Agent Builder"
echo "3. Import agent-config.json"
echo "4. Configure conversations and actions"
echo "5. Test and activate"
```

### Step 2: Deploy to Salesforce

```bash
# Use sf-deploy to deploy agent metadata
/siftcoder:sf-deploy deploy force-app/main/default/agentforce/
```

---

## Examples

### Example 1: Create Support Agent

```bash
/siftcoder:agentforce create "Customer support agent for e-commerce"

🤖 Generating AgentForce agent...

Agent Configuration:
  Name: E-Commerce Support Agent
  Type: Customer Service
  Language: English

Capabilities:
  ✓ Order status lookup
  ✓ Return processing
  ✓ Product recommendations
  ✓ Shipping information
  ✓ Human agent transfer

Knowledge Sources:
  - Order__c (Order object)
  - Product2 (Product catalog)
  - Case (Return requests)
  - FAQ__kav (Knowledge articles)

Guardrails:
  ✓ Cannot modify orders (read-only)
  ✓ Cannot process refunds >$500
  ✓ Must transfer for payment issues
  ✓ Must transfer for technical issues

Conversation Flows:
  1. Order Inquiry (5 paths)
  2. Return Request (3 paths)
  3. Product Info (4 paths)
  4. Shipping Question (2 paths)
  5. Escalation (2 paths)

Generated Files:
  - agent-config.json
  - conversation-flows.yaml
  - agent-actions.js

Next Steps:
  1. Import into AgentForce Builder
  2. Configure Einstein AI
  3. Test conversations: /siftcoder:agentforce test
  4. Deploy: /siftcoder:sf-deploy deploy
```

### Example 2: Generate Agent Action

```bash
/siftcoder:agentforce action "Retrieve customer purchase history"

⚡ Generating AgentForce action...

Action: RetrieveCustomerPurchaseHistory
Type: Query
Object: Order__c

Fields:
  - Order_Date__c
  - Total_Amount__c
  - Status__c
  - Products__c (related)

Filters:
  - Customer__c = {!CustomerId}
  - Order_Date__c = LAST_N_DAYS:365

Sorting:
  - Order_Date__c DESC
  - Limit: 10

Output Format:
  {
    "orders": [
      {
        "orderNumber": "ORDER-001",
        "date": "2026-01-10",
        "total": 150.00,
        "status": "Delivered"
      },
      ...
    ],
    "totalOrders": 25,
    "totalSpent": 3750.00
  }

Generated: actions/retrieve-purchase-history.js
```

---

## Best Practices

### DO ✅

- **Define clear guardrails** - What agent can/cannot do
- **Provide escalation paths** - Transfer to human when needed
- **Test thoroughly** - Simulate real conversations
- **Use knowledge articles** - For accurate information
- **Monitor performance** - Track success rate and satisfaction
- **Iterate** - Improve based on real interactions

### DON'T ❌

- **Don't allow** unrestricted data access
- **Don't forget** error handling
- **Don't ignore** escalation triggers
- **Don't deploy** without testing
- **Don't overpromise** capabilities
- **Don't skip** guardrails

---

## Integration

### With Einstein AI

```bash
# Configure Einstein AI prompts
/siftcoder:einstein generate "Agent responses for order inquiries"
```

### With Salesforce Data

```bash
# Understand data model
/siftcoder:schema erd

# Generate queries
/siftcoder:apex bulkify "Customer order query"
```

### With Testing

```bash
# Test agent logic
/siftcoder:sf-test "AgentForce conversation scenarios"
```

---

## Tips & Hints

```
AGENT TYPES

Service Agents:
  → Customer support
  → Order management
  → Returns and refunds
  → FAQ answering

Sales Agents:
  → Product recommendations
  → Lead qualification
  -> Quote generation
  → Follow-up automation

Internal Agents:
  → Employee support (HR, IT)
  → Knowledge base access
  → Workflow automation

CAPABILITIES

Query Actions:
  → Look up records
  → Filter data
  → Join objects
  → Aggregate data

Create Actions:
  → Create records
  → Send emails
  → Post Chatter
  → Invoke flows

Update Actions:
  → Update fields
  → Change status
  → Assign records

GUARDRAILS

Data Access:
  → Read-only vs Read/Write
  → Field-level security
  → Record-level access

Operational:
  → Monetary limits
  → Approval thresholds
  → Escalation triggers

Behavioral:
  → Tone and style
  → Prohibited topics
  -> Compliance requirements

TESTING STRATEGIES

Happy Path:
  → Standard user queries
  → Expected agent responses
  → Successful resolution

Edge Cases:
  → Missing information
  → Ambiguous requests
  → Multiple intents

Errors:
  → System failures
  → Data not found
  → Timeouts
  → Rate limits

DEPLOYMENT

Development:
  → Sandbox testing
  → Iterate on responses
  → Refine guardrails

Production:
  → Gradual rollout
  → Monitor metrics
  → Collect feedback
  → Continuous improvement
```

---

## Allowed Tools

Read, Write, Edit, Bash, Glob, Grep, AskUserQuestion

## Dependencies

- AgentForce Builder (Salesforce)
- Einstein AI
- Salesforce objects and fields
- Agent actions and conversations

## Knowledge Required

- AgentForce platform
- Einstein AI Service
- Salesforce data model
- Natural language understanding
- Conversation design
