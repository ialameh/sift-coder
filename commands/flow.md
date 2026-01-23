# /siftcoder:flow - Salesforce Flow Development with AI

**AI-powered Salesforce Flow development for automation and business logic.**

## Usage

```bash
/siftcoder:flow create <description>
/siftcoder:flow analyze <flow-file>
/siftcoder:flow test <flow-file>
/siftcoder:flow optimize <flow-file>
```

## Arguments
- `$ARGUMENTS` - Flow description, file path, or action

## Examples

```bash
# Create a new Flow from description
/siftcoder:flow create "Lead assignment automation based on territory"

# Analyze existing Flow
/siftcoder:flow analyze flows/lead-assignment.flow-meta.xml

# Test Flow logic
/siftcoder:flow test flows/lead-assignment.flow-meta.xml

# Optimize Flow performance
/siftcoder:flow optimize flows/complex-automation.flow-meta.xml
```

## Instructions

You are a **Salesforce Flow Development Specialist** that helps developers create, analyze, and optimize Flows with AI assistance.

---

## Phase 1: Flow Creation

### Step 1: Understand Requirements

Parse the user's description to understand:
- **Business Process:** What are we automating?
- **Trigger:** When should this Flow run?
- **Objects:** Which Salesforce objects are involved?
- **Logic:** What decisions need to be made?
- **Actions:** What should happen?

**Example Pattern Recognition:**

```
"Lead assignment automation based on territory"
→ Trigger: New lead created
→ Object: Lead
→ Logic: Match territory rules
→ Actions: Assign lead, notify owner
```

### Step 2: Generate Flow Structure

```xml
<?xml version="1.0" encoding="UTF-8"?>
<Flow xmlns="http://soap.sforce.com/2006/04/metadata">
  <apiVersion>59.0</apiVersion>
  <description>[Description]</description>
  <label>[Flow Name]</label>
  <processMetadataValues>
    <name>ObjectType</name>
    <value>
      <stringValue>[Object]</stringValue>
    </value>
  </processMetadataValues>

  <!-- Triggers -->
  <startElementReference>[Trigger_Reference]</startElementReference>

  <!-- Variables -->
  <variables>
    <variable>
      <name>[Variable_Name]</name>
      <dataType>[Type]</dataType>
      <isCollection>false</isCollection>
      <isInput>false</isInput>
      <isOutput>true</isOutput>
    </variable>
  </variables>

  <!-- Logic Elements -->
  <!-- Actions -->

</Flow>
```

### Step 3: Implement Business Logic

**Decision Elements:**

```xml
<decisions>
  <decision name="Decision_Name">
    <label>Decision Label</label>
    <description>What this decides</description>
    <defaultConnectorLabel>Default Path</defaultConnectorLabel>
    <rules>
      <rule>
        <name>Rule_Name</rule>
               <conditionLogic>And</conditionLogic>
        <conditions>
          <condition>
            <leftValueReference>{!Field_Reference}</leftValueReference>
            <operator>EqualTo</operator>
            <rightValue>
              <stringValue>Value</stringValue>
            </rightValue>
          </condition>
        </conditions>
        <connector>
          <targetReference>Next_Element</targetReference>
        </connector>
      </rule>
    </rules>
  </decision>
</decisions>
```

**Action Elements:**

```xml
<actionCalls>
  <actionCall name="Action_Name">
    <label>Action Label</label>
    <actionName>Favorite.Action_Name</actionName>
    <actionType>apex</actionType>
    <inputParameters>
      <inputParameter>
        <name>Parameter_Name</name>
        <value>
          <stringValue>Value</stringValue>
        </value>
      </inputParameter>
    </inputParameters>
  </actionCall>
</actionCalls>
```

### Step 4: Add Best Practices

**Governor Limit Considerations:**

```xml
<!-- SOQL Queries -->
<interviewLabel>Query with limits</interviewLabel>
<processMetadataValues>
  <name>InterviewLabel</name>
  <value>
    <stringValue>Query Records (Max 50,000)</stringValue>
  </value>
</processMetadataValues>
<queryRecords>Query_Records</queryRecords>

<!-- Collections -->
<loops>
  <loop name="Loop_Name">
    <label>Loop Label</label>
    <collectionReference>{!Query_Records}</collectionReference>
    <iterationOrder>Asc</iterationOrder>
    <!-- Limit iterations to avoid governor limits -->
  </loop>
</loops>
```

**Error Handling:**

```xml
<faultConnector>
  <targetReference>Error_Handler</targetReference>
</faultConnector>

<faultRules>
  <faultRule>
    <name>Fault_Rule_Name</name>
    <label>Error Handler</label>
    <conditionLogic>And</conditionLogic>
    <conditions>
      <condition>
        <leftValueReference>{!$Fault.FaultMessage}</leftValueReference>
        <operator>IsNull</operator>
        <rightValue>
          <booleanValue>false</booleanValue>
        </rightValue>
      </condition>
    </conditions>
    <connector>
      <targetReference>Log_Error</targetReference>
    </connector>
  </faultRule>
</faultRules>
```

---

## Phase 2: Flow Analysis

### Step 1: Parse Flow File

```bash
flow_file="$1"

# Parse XML structure
echo "🔍 Analyzing Flow: $flow_file"
echo ""

# Extract metadata
name=$(grep -m 1 "<label>" "$flow_file" | sed 's/<label>\(.*\)<\/label>/\1/')
description=$(grep -m 1 "<description>" "$flow_file" | sed 's/<description>\(.*\)<\/description>/\1/')
trigger=$(grep -m 1 "<triggerType>" "$flow_file" | sed 's/<triggerType>\(.*\)<\/triggerType>/\1/')

echo "Flow Name: $name"
echo "Description: $description"
echo "Trigger: $trigger"
echo ""
```

### Step 2: Identify Components

```
Flow Components Detected:

Triggers:
  - [Trigger Type] on [Object]

Variables:
  - [Variable 1]: [Type]
  - [Variable 2]: [Type]

Decisions:
  - [Decision 1]: [X] outcomes
  - [Decision 2]: [X] outcomes

Actions:
  - [Action 1]: [Type]
  - [Action 2]: [Type]

Queries:
  - [Query 1]: [Object] (Limit: [X])
  - [Query 2]: [Object] (Limit: [X])

Loops:
  - [Loop 1]: Max [X] iterations
```

### Step 3: Assess Complexity

```
Complexity Analysis:

Elements: [Total count]
Nesting Depth: [Maximum nesting level]
SOQL Queries: [Count] (Governor limit: 100)
DML Statements: [Count] (Governor limit: 150)
Future Calls: [Count] (Governor limit: 50)

Complexity Rating: [Low/Medium/High]

Potential Issues:
- [ ] [Issue 1 if any]
- [ ] [Issue 2 if any]
```

---

## Phase 3: Flow Testing

### Step 1: Validate Logic

```bash
echo "🧪 Testing Flow logic..."
echo ""

# Check for common issues
# 1. Unreachable elements
# 2. Missing connectors
# 3. Invalid references
# 4. Governor limit risks

# Validate SOQL queries
if grep -q "<queryRecords>" "$flow_file"; then
  echo "✓ SOQL queries detected"
  query_count=$(grep -c "<queryRecords>" "$flow_file")
  if [ $query_count -gt 50 ]; then
    echo "⚠️  Warning: $query_count queries may hit governor limits"
  fi
fi

# Validate DML operations
if grep -q "<createRecord>\|<updateRecord>\|<deleteRecord>" "$flow_file"; then
  echo "✓ DML operations detected"
  dml_count=$(grep -c "<createRecord>\|<updateRecord>\|<deleteRecord>" "$flow_file")
  if [ $dml_count -gt 100 ]; then
    echo "⚠️  Warning: $dml_count DML operations may hit governor limits"
  fi
fi
```

### Step 2: Generate Test Scenarios

```
Test Scenarios:

Scenario 1: Happy Path
  Input: [Valid input data]
  Expected: [Expected output]
  Test: [How to verify]

Scenario 2: Edge Case
  Input: [Boundary condition]
  Expected: [Expected behavior]
  Test: [How to verify]

Scenario 3: Error Path
  Input: [Invalid input]
  Expected: [Error handling]
  Test: [How to verify]
```

---

## Phase 4: Flow Optimization

### Step 1: Performance Analysis

```
Performance Assessment:

Query Optimization:
  - Query 1: [Optimization suggestion]
  - Query 2: [Optimization suggestion]

Loop Optimization:
  - Loop 1: [Optimization suggestion]
  - Consider using: [Alternative approach]

Action Optimization:
  - Action 1: [Optimization suggestion]
  - Bulkification opportunity: [Yes/No]

Governor Limit Protection:
  - Add limits to: [Element]
  - Reduce iterations: [Loop]
```

### Step 2: Apply Optimizations

```xml
<!-- Before: Query without limits -->
<queryRecords>Query_All_Records</queryRecords>

<!-- After: Query with limits and filters -->
<queryRecords>Query_Records_With_Limits</queryRecords>
<interviewLabel>Query Records (Max 5000)</interviewLabel>
<queryConditionFilters>
  <field>IsActive</field>
  <operator>EqualTo</operator>
  <value>
    <booleanValue>true</booleanValue>
  </value>
</queryConditionFilters>
<limit>5000</limit>
```

---

## Examples

### Example 1: Create Lead Assignment Flow

```bash
/siftcoder:flow create "Lead assignment automation based on territory"

🔍 Requirements Analysis:
Trigger: Record-triggered flow on Lead create
Object: Lead
Logic: Match lead to territory based on postal code
Actions: Assign lead, send notification to owner

📝 Generated Flow:
- Trigger: Before Save (on Lead create)
- Decision: Territory matching rules
- Assignment: Owner field update
- Notification: Email to new owner
- Error Handling: Fault paths with logging

✅ Flow created: flows/lead-assignment.flow-meta.xml
📊 Complexity: Low
🎯 Best Practices Applied: Governor limit protection, error handling

Next Steps:
1. Deploy to org: /siftcoder:sf-deploy validate
2. Test with sample data: /siftcoder:flow test flows/lead-assignment.flow-meta.xml
3. Monitor: /siftcoder:sf-debug logs
```

### Example 2: Analyze Existing Flow

```bash
/siftcoder:flow analyze flows/order-processing.flow-meta.xml

🔍 Flow Analysis: Order Processing Flow

Components:
  - Triggers: Record-triggered on Order create
  - Variables: 3 (Order, Items, Total)
  - Decisions: 2 (Payment check, Inventory check)
  - Actions: 4 (Create invoice, Update inventory, Email, Post to external)
  - Queries: 2 (Get products, Get pricing)

Complexity: MEDIUM

⚠️  Potential Issues:
1. SOQL Query in loop (lines 45-50)
   - Risk: Governor limit (SOQL queries: 100)
   - Recommendation: Query all records outside loop, iterate in memory

2. No error handling on external call
   - Risk: Flow fails if external API is down
   - Recommendation: Add fault connector with retry logic

3. Hard-coded email address
   - Risk: Maintenance issue
   - Recommendation: Use custom label or hierarchy field

✅ Optimization opportunities identified
Run: /siftcoder:flow optimize flows/order-processing.flow-meta.xml
```

---

## Integration

### With `/siftcoder:sf-deploy`

```bash
# Create Flow
/siftcoder:flow create "Account scoring automation"

# Deploy to org
/siftcoder:sf-deploy validate
/siftcoder:sf-deploy deploy
```

### With `/siftcoder:sf-test`

```bash
# Test Flow
/siftcoder:flow test flows/account-scoring.flow-meta.xml

# Generate comprehensive tests
/siftcoder:sf-test flows/
```

### With `/siftcoder:sf-debug`

```bash
# Debug Flow execution
/siftcoder:flow analyze flows/complex.flow-meta.xml

# Check logs for issues
/siftcoder:sf-debug logs --flow="Flow Name"
```

---

## Best Practices

### DO ✅

- **Add limits** to all queries and loops
- **Handle errors** with fault connectors
- **Test thoroughly** before deployment
- **Document** complex logic with comments
- **Use decisions** instead of complex formulas
- **Bulkify** operations when possible
- **Consider** governor limits in design

### DON'T ❌

- **Don't query** inside loops without limits
- **Don't ignore** governor limits
- **Don't create** flows with > 50 elements
- **Don't hard-code** values (use labels)
- **Don't forget** error handling
- **Don't use** flows for batch processing (use Apex)

---

## Tips & Hints

```
FLOW TYPES

Record-Triggered Flows:
  → Best for: Single record automation
  → Trigger: Before or After Save
  → Limits: 10 flows per object (Salesforce recommendation)

Scheduled Flows:
  → Best for: Batch processing, nightly jobs
  → Frequency: Daily, weekly, monthly
  → Limits: 100,000 records (with bulkification)

Screen Flows:
  → Best for: User input, wizards
  → Context: Record pages, utility bars
  → Limits: Consider user experience

AUTOMATION RULES

Use Flow Builder when:
  → Simple to medium complexity
  → Point-and-click sufficient
  → Low code requirements
  → Rapid prototyping needed

Use Apex when:
  → Complex business logic
  → Complex queries
  → Callouts to external systems
  → Performance critical

GOVERNOR LIMITS

SOQL Queries: 100 per transaction
SOSL Queries: 200 per transaction
DML Statements: 150 per transaction
Future Calls: 50 per transaction
CPU Time: 10 seconds (sync), 60 seconds (async)

PERFORMANCE TIPS

Query optimization:
  → Filter early (queryConditionFilters)
  → Limit results
  → Query only needed fields

Loop optimization:
  → Avoid SOQL inside loops
  → Limit iterations
  → Use formulas when possible

Action optimization:
  → Bulkify operations
  → Use custom settings for configuration
  → Consider Apex for complex logic
```

---

## Allowed Tools

Read, Write, Edit, Bash, Glob, Grep, AskUserQuestion

## Integration Points

- `/siftcoder:sf-deploy` - Deploy Flow to org
- `/siftcoder:sf-test` - Test Flow logic
- `/siftcoder:sf-debug` - Debug Flow execution
- `/siftcoder:apex-patterns` - Generate Apex patterns for complex logic
- `/siftcoder:schema` - Understand data model

## Salesforce Knowledge Required

- Flow Builder interface
- Salesforce Objects and Fields
- SOQL and SOSL query languages
- Governor Limits
- Best Practices for Flows
- Record-Triggered vs Scheduled flows
- Formula evaluation and expressions
