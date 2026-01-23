# Skill: Pattern Detector

**Detect and document code patterns, conventions, and architectural styles**

---

## Overview
- **Purpose**: Analyze codebases to identify coding patterns, naming conventions, and architectural approaches
- **Type**: Analysis
- **Invoked By**: `/add-feature`, `/understand`, `/build`

---

## What This Skill Does

The Pattern Detector skill analyzes an existing codebase to identify:

1. **Naming Conventions**
   - File naming (kebab-case, camelCase, PascalCase, snake_case)
   - Variable naming
   - Function naming
   - Class naming
   - Constants

2. **File Organization**
   - Flat vs nested structure
   - Feature-based vs type-based organization
   - Test file location
   - Index file usage

3. **Architectural Patterns**
   - MVC, MVVM, Clean Architecture
   - Repository pattern
   - Service layer
   - Factory pattern
   - Dependency injection

4. **Code Style**
   - Import ordering
   - Export style (named vs default)
   - Function style (arrow vs keyword)
   - Error handling approach
   - Async patterns

5. **Testing Patterns**
   - Test naming conventions
   - Describe/it structure
   - Mock patterns
   - Test data setup

---

## When This Skill Is Used

This skill is automatically invoked when:

- Adding features to existing code (`/add-feature`)
- Running `/understand` to analyze codebase
- Building projects that need to match existing patterns
- User wants to understand project conventions

---

## Detection Process

### 1. Scan File Structure

```
Analyzing project structure...

Directory Pattern:
src/
├── components/     # UI components
├── services/       # Business logic
├── repositories/   # Data access
├── utils/          # Helpers
├── types/          # TypeScript types
└── tests/          # Test files

Organization: Type-based
```

### 2. Sample Code Analysis

Read representative files:
- 2-3 component files
- 2-3 service files
- 2-3 test files
- Configuration files

### 3. Extract Patterns

```
Detected Patterns:

Naming:
├── Files: kebab-case (user-service.ts)
├── Functions: camelCase (getUserById)
├── Classes: PascalCase (UserService)
├── Constants: UPPER_SNAKE (MAX_RETRIES)
└── Interfaces: I-prefix (IUserRepository)

Imports:
├── Order: external → internal → relative
├── Style: named imports preferred
└── Index: barrel exports in each directory

Functions:
├── Style: arrow functions for handlers
├── Async: async/await (not .then())
└── Returns: explicit return types

Error Handling:
├── Pattern: custom error classes
├── Logging: structured JSON logs
└── Recovery: retry with exponential backoff

Testing:
├── Location: __tests__ directories
├── Naming: *.test.ts
├── Structure: describe → it blocks
└── Mocks: jest.mock() at top
```

---

## Output Format

```json
{
  "projectType": "typescript-react",
  "framework": "React 18 + TypeScript",
  "patterns": {
    "naming": {
      "files": "kebab-case",
      "variables": "camelCase",
      "functions": "camelCase",
      "classes": "PascalCase",
      "constants": "UPPER_SNAKE_CASE"
    },
    "fileOrganization": {
      "style": "type-based",
      "testLocation": "__tests__ directories",
      "indexFiles": true
    },
    "architecture": {
      "pattern": "clean-architecture",
      "layers": ["presentation", "application", "infrastructure"]
    },
    "codeStyle": {
      "imports": {
        "order": ["external", "internal", "relative"],
        "style": "named"
      },
      "functions": {
        "style": "arrow",
        "asyncPattern": "async-await"
      }
    },
    "testing": {
      "framework": "jest",
      "naming": "*.test.ts",
      "structure": "describe-it"
    }
  }
}
```

---

## Pattern Compliance Check

When generating new code, the skill verifies:

- [ ] File named correctly
- [ ] Variables follow convention
- [ ] Imports ordered correctly
- [ ] Function style matches
- [ ] Error handling follows pattern
- [ ] Tests structured correctly

---

## Integration

### Commands Using This Skill
- `/add-feature` - Ensures new code matches existing patterns
- `/understand` - Documents detected patterns
- `/build` - Follows patterns when building new projects

### Related Skills
- `spec-analyzer` - Extracts features from specs
- `siftcoder-workflow` - Orchestrates multi-agent workflows

### Storage
Patterns are stored in:
- `.claude/siftcoder-state/knowledge/patterns.json`

This allows patterns to persist across sessions.

---

## Examples

### Adding a Feature with Pattern Detection

```bash
/siftcoder:add-feature "Add user notifications"
```

**Process:**
1. Pattern detector analyzes codebase
2. Identifies patterns (file naming, imports, etc.)
3. Coder agent follows detected patterns exactly
4. New code matches existing style

### Understanding a Codebase

```bash
/siftcoder:understand
```

**Output includes detected patterns:**
```
Patterns Detected (15):
├── Naming: camelCase functions, PascalCase components
├── Imports: External → Internal → Relative
├── Errors: Custom error classes with codes
├── Async: async/await with try/catch
└── Tests: Co-located with .test.ts suffix
```

---

## See Also

- [Command: /add-feature](../02-command-reference/by-category/build-workflow.md#add-feature)
- [Command: /understand](../02-command-reference/by-category/understand-workflow.md#understand)
- [Skill: Spec Analyzer](spec-analyzer.md)
