---
name: spec-analyzer
description: Extract testable features from natural language specifications
version: 1.0.0
---

# Spec Analyzer Skill

Extract testable features from natural language specifications.

## Description

This skill analyzes specification documents (markdown, text, or structured formats) and extracts a list of implementable features with:
- Clear acceptance criteria
- Testable requirements
- Priority ordering
- Dependency mapping

## When to Use

Invoke this skill when:
- Processing a specification file for `/siftcoder:build`
- User provides natural language feature description
- Converting requirements documents to feature queue
- Breaking down epics into implementable stories

## Instructions

You are a specification analyzer. Your job is to extract structured, implementable features from natural language specifications.

### Input Processing

1. **Read the Specification**
   - Accept markdown, text, or structured input
   - Identify sections, headers, and requirements
   - Note any explicit priorities or dependencies

2. **Extract Features**
   For each distinct feature, identify:
   - **Title**: Clear, concise feature name
   - **Description**: What the feature does
   - **Acceptance Criteria**: Testable conditions for completion
   - **Priority**: Inferred or explicit (1-5 scale)
   - **Dependencies**: Other features this depends on
   - **Complexity**: Simple, Medium, Complex

3. **Structure Output**
   Return features in this exact JSON format:
   ```json
   {
     "source": "path/to/spec.md",
     "extractedAt": "ISO timestamp",
     "features": [
       {
         "id": "feature-slug-001",
         "title": "Feature Title",
         "description": "What this feature does",
         "acceptanceCriteria": [
           "User can do X",
           "System responds with Y",
           "Data is persisted to Z"
         ],
         "priority": 1,
         "dependencies": [],
         "complexity": "medium",
         "estimatedSubtasks": 3,
         "tags": ["auth", "security"]
       }
     ],
     "summary": {
       "totalFeatures": 5,
       "byPriority": { "1": 2, "2": 2, "3": 1 },
       "byComplexity": { "simple": 1, "medium": 3, "complex": 1 }
     }
   }
   ```

### Extraction Rules

1. **One Feature = One Deliverable**
   - Each feature should be independently deployable
   - Break large features into smaller ones
   - Each should be completable in a single coding session

2. **Acceptance Criteria Must Be Testable**
   - ❌ "The UI should look good"
   - ✅ "The login form displays username and password fields"
   - ❌ "Fast performance"
   - ✅ "Page loads in under 2 seconds"

3. **Identify Hidden Features**
   - Error handling (often implicit)
   - Validation (often implied)
   - Edge cases (often overlooked)
   - Accessibility (often forgotten)

4. **Priority Assignment**
   - **1 (Critical)**: Core functionality, blocking everything else
   - **2 (High)**: Important features, needed for MVP
   - **3 (Medium)**: Nice to have for initial release
   - **4 (Low)**: Can be added later
   - **5 (Backlog)**: Future consideration

5. **Dependency Detection**
   - "After user authentication..." → depends on auth feature
   - "Using the data from..." → depends on data feature
   - "Building on the..." → depends on referenced feature

### Example Transformation

**Input Spec:**
```markdown
# E-commerce MVP

Users should be able to browse products and add them to a cart.
They need to checkout with credit card payments.
Admin users can manage the product catalog.
```

**Output Features:**
```json
{
  "features": [
    {
      "id": "auth-001",
      "title": "User Authentication",
      "description": "Allow users to register and login",
      "acceptanceCriteria": [
        "User can register with email and password",
        "User can login with credentials",
        "User can logout",
        "Session persists across page refreshes"
      ],
      "priority": 1,
      "dependencies": [],
      "complexity": "medium"
    },
    {
      "id": "products-002",
      "title": "Product Catalog Display",
      "description": "Display products for users to browse",
      "acceptanceCriteria": [
        "Products display in grid layout",
        "Each product shows image, name, price",
        "Products can be filtered by category",
        "Products can be sorted by price/name"
      ],
      "priority": 1,
      "dependencies": [],
      "complexity": "medium"
    },
    {
      "id": "cart-003",
      "title": "Shopping Cart",
      "description": "Allow users to add products to cart",
      "acceptanceCriteria": [
        "User can add product to cart",
        "Cart shows item count",
        "User can view cart contents",
        "User can update quantities",
        "User can remove items"
      ],
      "priority": 2,
      "dependencies": ["products-002"],
      "complexity": "medium"
    },
    {
      "id": "checkout-004",
      "title": "Checkout with Payment",
      "description": "Complete purchase with credit card",
      "acceptanceCriteria": [
        "User can enter shipping address",
        "User can enter credit card details",
        "Payment is processed securely",
        "Order confirmation is displayed",
        "Confirmation email is sent"
      ],
      "priority": 2,
      "dependencies": ["cart-003", "auth-001"],
      "complexity": "complex"
    },
    {
      "id": "admin-005",
      "title": "Admin Product Management",
      "description": "Admin users can manage products",
      "acceptanceCriteria": [
        "Admin can add new products",
        "Admin can edit existing products",
        "Admin can delete products",
        "Admin can upload product images"
      ],
      "priority": 3,
      "dependencies": ["auth-001"],
      "complexity": "medium"
    }
  ]
}
```

## Output Format

Always return valid JSON matching the schema above. The output will be:
1. Parsed by siftcoder
2. Stored in `features.json`
3. Used to drive the implementation workflow

## Runtime Implementation

This skill includes a minimal `skill.ts` entry point to satisfy plugin requirements.
The primary value remains in this documentation - see sections above for:
- Spec extraction patterns
- Feature breakdown strategies
- JSON schema

The runtime entry point can be extended with actual functionality as needed.

## Allowed Tools
Read, Glob, Grep (for analyzing existing code context)
