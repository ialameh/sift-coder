# Skill: Spec Analyzer

**Extract testable features from natural language specifications**

---

## Overview
- **Purpose**: Parse specifications and extract implementable features
- **Type**: Analysis
- **Invoked By**: `/build`, `/ideate`, `/improve-spec`

---

## What This Skill Does

Analyzes specification documents (markdown, text, or structured formats) and extracts:

1. **Features with Clear Titles**
   - Concise feature names
   - Descriptive explanations

2. **Testable Acceptance Criteria**
   - Specific conditions for completion
   - Measurable requirements
   - Verifiable outcomes

3. **Priority Ordering**
   - Critical features (blocking)
   - High priority (MVP)
   - Medium priority (nice to have)
   - Low priority (future)

4. **Dependency Mapping**
   - Features that depend on others
   - Execution order
   - Blocking relationships

5. **Complexity Estimation**
   - Simple, Medium, Complex
   - Estimated subtasks
   - Time estimates

---

## When This Skill Is Used

This skill is invoked when:

- Building from specification (`/build`)
- Analyzing requirements (`/gap-analysis`)
- Generating feature ideas (`/ideate`)
- Improving specs (`/improve-spec`)

---

## Extraction Process

### 1. Read the Specification

Accepts input in various formats:
- Markdown files
- Text documents
- Structured formats (JSON, YAML)

Identifies:
- Sections and headers
- Requirements
- Priorities (explicit or inferred)

### 2. Extract Features

For each distinct feature:

```json
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
```

### 3. Structure Output

Returns features in JSON format:

```json
{
  "source": "path/to/spec.md",
  "extractedAt": "2026-01-15T10:30:00Z",
  "features": [...],
  "summary": {
    "totalFeatures": 5,
    "byPriority": { "1": 2, "2": 2, "3": 1 },
    "byComplexity": { "simple": 1, "medium": 3, "complex": 1 }
  }
}
```

---

## Extraction Rules

### 1. One Feature = One Deliverable

Each feature should be:
- Independently deployable
- Completable in a single coding session
- Testable on its own

Break large features into smaller ones.

### 2. Acceptance Criteria Must Be Testable

❌ **Bad:** "The UI should look good"
✅ **Good:** "The login form displays username and password fields"

❌ **Bad:** "Fast performance"
✅ **Good:** "Page loads in under 2 seconds"

### 3. Identify Hidden Features

Often overlooked but important:
- Error handling
- Input validation
- Edge cases
- Accessibility

### 4. Priority Assignment

- **1 (Critical)**: Core functionality, blocking everything else
- **2 (High)**: Important features, needed for MVP
- **3 (Medium)**: Nice to have for initial release
- **4 (Low)**: Can be added later
- **5 (Backlog)**: Future consideration

### 5. Dependency Detection

Look for language cues:
- "After user authentication..." → depends on auth
- "Using the data from..." → depends on data feature
- "Building on the..." → depends on referenced feature

---

## Example Transformation

### Input Spec

```markdown
# E-commerce MVP

Users should be able to browse products and add them to a cart.
They need to checkout with credit card payments.
Admin users can manage the product catalog.
```

### Output Features

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
    }
  ]
}
```

---

## Integration

### Commands Using This Skill
- `/build` - Extracts features from spec
- `/gap-analysis` - Compares spec to code
- `/ideate` - Analyzes spec for improvement

### Output Storage
Features are stored in:
- `.claude/siftcoder-state/features.json`

Used to drive the implementation workflow.

---

## Examples

### Building from Specification

```bash
/siftcoder:build project-spec.md
```

**Process:**
1. Spec analyzer extracts features
2. Features prioritized by dependencies
3. Each feature broken into subtasks
4. Implementation proceeds in order

### Generating Ideas

```bash
/siftcoder:ideate project-spec.md
```

**Uses spec analyzer to:**
- Understand existing requirements
- Identify gaps
- Suggest improvements
- Add competitor analysis

---

## See Also

- [Command: /build](../02-command-reference/by-category/build-workflow.md#build)
- [Command: /gap-analysis](../02-command-reference/by-category/analyze-workflow.md#gap-analysis)
- [Command: /improve-spec](../02-command-reference/by-category/analyze-workflow.md#improve-spec)
