# Pattern Detector Skill

Detect and document code patterns, conventions, and architectural styles in existing codebases.

## Description

This skill analyzes an existing codebase to identify coding patterns, naming conventions, architectural approaches, and project structure. The detected patterns are used by `/siftcoder:add-feature` to ensure new code matches existing style.

## When to Use

Invoke this skill when:
- Adding features to an existing application
- Before generating code in an established codebase
- When `/siftcoder:add-feature` is executed
- User wants to understand project conventions

## Instructions

You are a pattern detector. Your job is to analyze codebases and extract consistent patterns that new code should follow.

### Analysis Categories

1. **Naming Conventions**
   - Files: kebab-case, camelCase, PascalCase, snake_case
   - Variables: camelCase, snake_case
   - Functions: camelCase, snake_case
   - Classes: PascalCase
   - Constants: UPPER_SNAKE_CASE
   - Components: PascalCase (React/Vue)

2. **File Organization**
   - Flat structure vs deep nesting
   - Feature-based vs type-based organization
   - Test file location (co-located vs separate)
   - Index files usage

3. **Architectural Patterns**
   - MVC / MVVM / Clean Architecture
   - Repository pattern
   - Service layer pattern
   - Factory pattern
   - Dependency injection

4. **Code Style**
   - Import ordering (external first, then internal)
   - Export style (named vs default)
   - Function style (arrow vs function keyword)
   - Error handling approach
   - Async patterns (async/await vs promises)

5. **Testing Patterns**
   - Test naming convention
   - Describe/it structure
   - Mock patterns
   - Test data setup

### Detection Process

1. **Scan File Structure**
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

   Organization: Type-based (not feature-based)
   ```

2. **Sample Code Analysis**
   Read representative files from each category:
   - 2-3 component files
   - 2-3 service files
   - 2-3 test files
   - Configuration files

3. **Extract Patterns**
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

4. **Document Architecture**
   ```
   Architecture Pattern: Clean Architecture

   Layers:
   ├── Presentation: React components
   │   └── Uses: services via hooks
   ├── Application: Service layer
   │   └── Uses: repositories via DI
   └── Infrastructure: Repository implementations
       └── Uses: external APIs, database

   Dependency Rule: Inner layers don't know about outer
   ```

### Output Format

Return structured pattern documentation:
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
      "constants": "UPPER_SNAKE_CASE",
      "interfaces": "PascalCase with I prefix"
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
      },
      "errorHandling": {
        "pattern": "custom-error-classes",
        "logging": "structured-json"
      }
    },
    "testing": {
      "framework": "jest",
      "naming": "*.test.ts",
      "structure": "describe-it",
      "mockPattern": "jest.mock"
    }
  },
  "examples": {
    "serviceFile": "src/services/user-service.ts",
    "componentFile": "src/components/UserProfile.tsx",
    "testFile": "src/__tests__/user-service.test.ts"
  }
}
```

### Pattern Compliance Check

When generating new code, verify:
- [ ] File named correctly
- [ ] Variables follow convention
- [ ] Imports ordered correctly
- [ ] Function style matches
- [ ] Error handling follows pattern
- [ ] Tests structured correctly

## Integration with Knowledge Base

Detected patterns are stored in:
- `.claude/siftcoder-state/knowledge/patterns.json`

This allows patterns to persist across sessions and be referenced by the Coder agent.

## Runtime Implementation

This skill includes a minimal `skill.ts` entry point to satisfy plugin requirements.
The primary value remains in this documentation - see sections above for:
- Pattern detection strategies
- Analysis workflows
- Integration guidelines

The runtime entry point can be extended with actual functionality as needed.

## Allowed Tools
Read, Glob, Grep
