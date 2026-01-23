# /siftcoder:cpq - Salesforce CPQ/Vlocity Assistant

**AI-powered Salesforce CPQ (Configure, Price, Quote) configuration and development.**

## Usage

```bash
/siftcoder:cpq configure <product-rules>
/siftcoder:cpq quote-template <template-type>
/siftcoder:cpq price-rule <pricing-logic>
/siftcoder:cpq optimize <existing-cpq>
```

## Arguments
- `$ARGUMENTS` - CPQ configuration description or file path

## Examples

```bash
# Configure product rules
/siftcoder:cpq configure "Product bundles with optional accessories"

# Generate quote template
/siftcoder:cpq quote-template "B2B quote with discount tiers"

# Create price rules
/siftcoder:cpq price-rule "Volume discount with tiered pricing"

# Optimize existing CPQ
/siftcoder:cpq optimize force-app/main/default/priceRules/
```

## Instructions

You are a **Salesforce CPQ/Vlocity Specialist** that helps configure and optimize Salesforce CPQ and Vlocity systems.

---

## Phase 1: Product Configuration

### Step 1: Understand Product Structure

Parse the description to understand:
- **Product Type:** Simple, bundle, configurable, virtual
- **Product Hierarchy:** Parent-child relationships
- **Product Options:** Required, optional, excluded
- **Pricing Model:** Standard, subscription, usage-based
- **Constraints:** Compatibility rules, dependencies

**Example:**

```
"Product bundles with optional accessories"
→ Product Type: Bundle
→ Hierarchy: Parent product with child options
→ Options: Optional accessories
→ Pricing: Base + sum of selected options
→ Constraints: Some accessories mutually exclusive
```

### Step 2: Generate Product Configuration

```yaml
ProductConfiguration:
  Product: "Tech Bundle - Basic"
  Type: "Bundle"
  
  ParentProduct:
    Name: "Tech Bundle - Basic"
    ProductCode: "TB-BASIC"
    Description: "Base technology package"
    Price: 1000.00
    
  ChildProducts:
    - Product: "Extended Warranty"
      ProductCode: "WARRANTY-EXT"
      Type: "Optional"
      Price: 150.00
      MinQuantity: 0
      MaxQuantity: 1
      
    - Product: "Premium Support"
      ProductCode: "SUPPORT-PREMIUM"
      Type: "Optional"
      Price: 200.00
      MinQuantity: 0
      MaxQuantity: 1
      
    - Product: "Training Package"
      ProductCode: "TRAINING-PKG"
      Type: "Optional"
      Price: 300.00
      MinQuantity: 0
      MaxQuantity: 1
      
  ProductRules:
    - Rule: "Warranty and Support cannot both be selected"
      Type: "Exclusion"
      Products: ["WARRANTY-EXT", "SUPPORT-PREMIUM"]
      
    - Rule: "Training requires Premium Support"
      Type: "Dependency"
      Product: "TRAINING-PKG"
      Requires: "SUPPORT-PREMIUM"
```

### Step 3: Create Product Rules

```apex
// Product Rule: Mutual Exclusion
public class CPQProductRules {
    
    // Check if products are mutually exclusive
    public static Boolean areMutuallyExclusive(List<QuoteLineItem> quoteLines, 
                                               Set<String> productCodes) {
        Map<String, QuoteLineItem> lineMap = new Map<String, QuoteLineItem>();
        
        for (QuoteLineItem line : quoteLines) {
            lineMap.put(line.ProductCode, line);
        }
        
        Integer selectedCount = 0;
        for (String code : productCodes) {
            if (lineMap.containsKey(code) && lineMap.get(code).Quantity > 0) {
                selectedCount++;
            }
        }
        
        return selectedCount > 1;
    }
    
    // Check if product dependency is satisfied
    public static Boolean isDependencySatisfied(List<QuoteLineItem> quoteLines,
                                                String productCode,
                                                String requiredProductCode) {
        Map<String, QuoteLineItem> lineMap = new Map<String, QuoteLineItem>();
        
        for (QuoteLineItem line : quoteLines) {
            lineMap.put(line.ProductCode, line);
        }
        
        Boolean hasProduct = lineMap.containsKey(productCode) && 
                           lineMap.get(productCode).Quantity > 0;
        Boolean hasRequired = lineMap.containsKey(requiredProductCode) && 
                             lineMap.get(requiredProductCode).Quantity > 0;
        
        return hasProduct ? hasRequired : true;
    }
}
```

---

## Phase 2: Quote Template Generation

### Step 1: Define Quote Template

```yaml
QuoteTemplate:
  Name: "B2B Standard Quote"
  Description: "Standard B2B quote with line items, discounts, and terms"
  
  Sections:
    - Section: "Header"
      Fields:
        - Field: "Quote Name"
        - Field: "Account Name"
        - Field: "Opportunity Name"
        - Field: "Quote Date"
        - Field: "Expiration Date"
        
    - Section: "Line Items"
      Fields:
        - Field: "Product Name"
        - Field: "Quantity"
        - Field: "List Price"
        - Field: "Discount"
        - Field: "Net Price"
        - Field: "Extended Price"
      Calculations:
        - "Extended Price = Quantity * Net Price"
        
    - Section: "Summary"
      Fields:
        - Field: "Subtotal"
          Formula: "SUM(Line Items.Extended Price)"
        - Field: "Total Discount"
          Formula: "Subtotal * Discount Percentage"
        - Field: "Net Total"
          Formula: "Subtotal - Total Discount"
        - Field: "Tax"
          Formula: "Net Total * Tax Rate"
        - Field: "Grand Total"
          Formula: "Net Total + Tax"
          
    - Section: "Terms and Conditions"
      Content: |
        Payment Terms: Net 30
        Valid Until: {Expiration Date}
        Shipping: FOB Destination
        Warranty: As per product specifications
```

### Step 2: Generate Quote Template Metadata

```xml
<?xml version="1.0" encoding="UTF-8"?>
<QuoteTemplate xmlns="http://soap.sforce.com/2006/04/metadata">
    <fullName>B2B_Standard_Quote</fullName>
    <description>Standard B2B quote template</description>
    <templateType>Custom</templateType>
    
    <sections>
        <section>
            <name>Header</name>
            <columnCount>2</columnCount>
            <fields>
                <field>Name</field>
                <field>AccountId</field>
                <field>OpportunityId</field>
                <field>QuoteDate__c</field>
                <field>ExpirationDate__c</field>
            </fields>
        </section>
        
        <section>
            <name>Line Items</name>
            <columnCount>6</columnCount>
            <fields>
                <field>ProductName__c</field>
                <field>Quantity</field>
                <field>ListPrice</field>
                <field>Discount</field>
                <field>UnitPrice</field>
                <field>TotalPrice</field>
            </fields>
            <showLines>true</showLines>
        </section>
        
        <section>
            <name>Summary</name>
            <columnCount>2</columnCount>
            <fields>
                <field>Subtotal__c</field>
                <field>TotalDiscount__c</field>
                <field>NetTotal__c</field>
                <field>Tax__c</field>
                <field>GrandTotal__c</field>
            </fields>
        </section>
    </sections>
    
    <filter>
        <criteria>
            <field>IsActive</field>
            <operation>equals</operation>
            <value>true</value>
        </criteria>
    </filter>
    
    <sorting>
        <sortField>ProductName__c</sortField>
        <sortOrder>ASC</sortOrder>
    </sorting>
</QuoteTemplate>
```

---

## Phase 3: Price Rules

### Step 1: Define Pricing Logic

```yaml
PriceRules:
  Rule1: Volume Discount
    Description: "Tiered volume discounts based on quantity"
    Type: "Volume Discount"
    
    Tiers:
      - Tier: 1
        MinQuantity: 1
        MaxQuantity: 10
        Discount: 0%
        
      - Tier: 2
        MinQuantity: 11
        MaxQuantity: 50
        Discount: 10%
        
      - Tier: 3
        MinQuantity: 51
        MaxQuantity: 100
        Discount: 15%
        
      - Tier: 4
        MinQuantity: 101
        MaxQuantity: null
        Discount: 20%
        
  Rule2: Product Bundle Discount
    Description: "Discount when buying specific bundle"
    Type: "Bundle Discount"
    Condition: "Product contains bundle code"
    Discount: 15%
    
  Rule3: Customer Specific Pricing
    Description: "Custom pricing for key accounts"
    Type: "Customer Specific"
    Condition: "Account.CustomerSegment__c = 'Enterprise'"
    Discount: 25%
```

### Step 2: Implement Price Rule Calculation

```apex
public class CPQPriceCalculator {
    
    // Calculate volume discount
    public static Decimal calculateVolumeDiscount(Decimal quantity, Decimal listPrice) {
        Decimal discountPercentage = 0;
        
        if (quantity >= 101) {
            discountPercentage = 0.20;  // 20% for 101+ units
        } else if (quantity >= 51) {
            discountPercentage = 0.15;  // 15% for 51-100 units
        } else if (quantity >= 11) {
            discountPercentage = 0.10;  // 10% for 11-50 units
        }
        
        return listPrice * (1 - discountPercentage);
    }
    
    // Apply customer-specific pricing
    public static Decimal applyCustomerPricing(Id accountId, Decimal listPrice) {
        Account acc = [SELECT CustomerSegment__c, DiscountPercentage__c 
                       FROM Account 
                       WHERE Id = :accountId];
        
        if (acc.CustomerSegment__c == 'Enterprise' && acc.DiscountPercentage__c != null) {
            return listPrice * (1 - acc.DiscountPercentage__c / 100);
        }
        
        return listPrice;
    }
    
    // Calculate bundle discount
    public static Decimal calculateBundlePrice(List<QuoteLineItem> bundleItems) {
        Decimal totalListPrice = 0;
        Decimal bundleDiscount = 0.15;  // 15% bundle discount
        
        for (QuoteLineItem item : bundleItems) {
            totalListPrice += item.ListPrice * item.Quantity;
        }
        
        return totalListPrice * (1 - bundleDiscount);
    }
}
```

---

## Phase 4: Vlocity Configuration

### Step 1: Vlocity Product Rules

```yaml
VlocityConfiguration:
  Product: "Telecommunications Plan"
  Type: "Vlocity Product"
  
  Attributes:
    - Attribute: "Data Allowance"
      DataType: "Number"
      Values: ["5GB", "10GB", "20GB", "Unlimited"]
      
    - Attribute: "Contract Length"
      DataType: "Number"
      Values: ["12 months", "24 months"]
      
    - Attribute: "International Calling"
      DataType: "Boolean"
      Values: ["Yes", "No"]
      
  Pricing:
    Model: "Attribute-Based Pricing"
    
    Rules:
      - Rule: "Data Allowance Pricing"
        Attribute: "Data Allowance"
        Pricing:
          - Value: "5GB"
            Price: 30.00
          - Value: "10GB"
            Price: 45.00
          - Value: "20GB"
            Price: 60.00
          - Value: "Unlimited"
            Price: 80.00
            
      - Rule: "Contract Discount"
        Attribute: "Contract Length"
        Pricing:
          - Value: "12 months"
            Discount: 0%
          - Value: "24 months"
            Discount: 10%
            
      - Rule: "International Calling Add-on"
        Attribute: "International Calling"
        Pricing:
          - Value: "Yes"
            AddOnPrice: 15.00
          - Value: "No"
            AddOnPrice: 0.00
```

### Step 2: Vlocity Calculation Procedure

```javascript
// Vlocity Calculation Matrix
{
  "calculationMatrix": {
    "name": "Telecommunications Plan Pricing",
    "version": "1.0",
    
    "inputVariables": [
      {
        "name": "dataAllowance",
        "type": "string",
        "required": true
      },
      {
        "name": "contractLength",
        "type": "string",
        "required": true
      },
      {
        "name": "internationalCalling",
        "type": "boolean",
        "required": true
      }
    ],
    
    "outputVariables": [
      {
        "name": "monthlyPrice",
        "type": "number"
      },
      {
        "name": "discount",
        "type": "number"
      },
      {
        "name": "totalPrice",
        "type": "number"
      }
    ],
    
    "calculations": [
      {
        "step": 1,
        "description": "Calculate base price from data allowance",
        "formula": "basePrice = lookup(dataAllowance, 'dataPricing')",
        "dataPricing": {
          "5GB": 30.00,
          "10GB": 45.00,
          "20GB": 60.00,
          "Unlimited": 80.00
        }
      },
      {
        "step": 2,
        "description": "Apply contract discount",
        "formula": "discount = basePrice * lookup(contractLength, 'contractDiscount')",
        "contractDiscount": {
          "12 months": 0.00,
          "24 months": 0.10
        }
      },
      {
        "step": 3,
        "description": "Add international calling",
        "formula": "internationalAddOn = internationalCalling ? 15.00 : 0.00"
      },
      {
        "step": 4,
        "description": "Calculate final price",
        "formula": "totalPrice = basePrice - discount + internationalAddOn"
      }
    ]
  }
}
```

---

## Phase 5: Optimization & Best Practices

### Step 1: Analyze Existing CPQ

```bash
echo "🔍 Analyzing CPQ configuration..."
echo ""

# Check for common issues

# 1. Missing product rules
if [ $(find . -name "*ProductRule*" | wc -l) -eq 0 ]; then
  echo "⚠️  No product rules found"
  echo "   → Add product rules for validation"
fi

# 2. Circular dependencies
if grep -rq "Circular" . ; then
  echo "❌ Circular dependency detected"
  echo "   → Review product dependencies"
fi

# 3. Missing price rules
if [ $(find . -name "*PriceRule*" | wc -l) -eq 0 ]; then
  echo "⚠️  No price rules found"
  echo "   → Add price rules for discounts"
fi

# 4. Performance issues
if grep -rq "SOQL inside loop" . ; then
  echo "⚠️  SOQL queries inside loops"
  echo "   → Bulkify price calculations"
fi
```

### Step 2: CPQ Best Practices

```
CPQ BEST PRACTICES

Product Configuration:
  ✓ Use product bundles for related products
  ✓ Define clear product hierarchies
  ✓ Set min/max constraints
  ✓ Use product rules for validation
  ✓ Document all dependencies

Pricing:
  ✓ Keep pricing logic simple
  ✓ Use price rules consistently
  ✓ Avoid hard-coded prices
  ✓ Test all discount scenarios
  ✓ Document price logic

Quote Templates:
  ✓ Standardize templates
  ✓ Include all required fields
  ✓ Add calculations clearly
  ✓ Test with sample data
  ✓ Include terms and conditions

Performance:
  ✓ Bulkify calculations
  ✓ Avoid SOQL in loops
  ✓ Use caching for price lookups
  ✓ Limit number of rules
  ✓ Test with large quotes

Vlocity:
  ✓ Use calculation matrices
  ✓ Define clear attributes
  ✓ Test attribute combinations
  ✓ Document all formulas
  ✓ Use version control
```

---

## Integration

### With `/siftcoder:schema`

```bash
# Understand product schema
/siftcoder:schema describe Product2

# Generate CPQ fields
/siftcoder:cpq configure "Product with custom fields"
```

### With `/siftcoder:apex`

```bash
# Generate CPQ Apex classes
/siftcoder:apex generate "CPQ price calculator"
```

### With `/siftcoder:flow`

```bash
# Create Flow for CPQ approval
/siftcoder:flow create "Quote approval workflow"
```

---

## Tips & Hints

```
CPQ IMPLEMENTATION CHECKLIST

Planning:
  ✓ Define product catalog
  ✓ Map pricing requirements
  ✓ Identify discount rules
  ✓ Design quote templates
  ✓ Plan approval processes

Configuration:
  ✓ Create products
  ✓ Set up price rules
  ✓ Configure product options
  ✓ Build quote templates
  ✓ Set up constraints

Testing:
  ✓ Test product selection
  ✓ Test discount calculations
  ✓ Test quote generation
  ✓ Test approval workflows
  ✓ Test edge cases

COMMON PITFALLS

Too Many Rules:
  ❌ 100+ product rules
  ✓ Consolidate similar rules
  ✓ Use attributes instead

Complex Pricing:
  ❌ Nested if-else pricing
  ✓ Use price rules
  ✓ Document logic

Performance:
  ❌ SOQL in loops
  ✓ Bulkify calculations
  ✓ Use lazy loading

VLOCIITY SPECIFIC

Calculation Matrices:
  → Define clear steps
  → Test all inputs
  → Document formulas
  → Version control

Product Attributes:
  → Keep simple types
  → Limit options
  → Use dependencies
  → Test combinations

Cpq Integration:
  → Use standard APIs
  → Handle errors gracefully
  → Log all calculations
  → Provide user feedback
```

---

## Allowed Tools

Read, Write, Edit, Bash, Grep, Glob, AskUserQuestion

## Dependencies

- Salesforce CPQ managed package
- Vlocity (if using Vlocity CPQ)
- Product2 object and related objects
- Quote and QuoteLineItem objects

## Knowledge Required

- Salesforce CPQ configuration
- Product catalog management
- Pricing strategies and models
- Quote template design
- Vlocity calculation matrices
- Apex and Flow for CPQ automation
