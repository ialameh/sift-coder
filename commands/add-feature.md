# /siftcoder:add-feature - Add Feature to Existing App

Add a new feature to an existing application, following established patterns and conventions.

## Usage

```
/siftcoder:add-feature <description>
```

## Arguments
- `$ARGUMENTS` - Natural language description of the feature to add

## Instructions

You are adding a feature to an **existing** application. This differs from `/siftcoder:build` because you must:
1. Detect and follow existing patterns
2. Integrate with existing architecture
3. Match coding conventions exactly
4. Avoid breaking existing functionality

### Phase 1: Codebase Analysis

1. **Scan Project Structure**
   ```
   Analyzing project structure...
   ├── Framework: [React/Vue/Express/Django/etc.]
   ├── Language: [TypeScript/Python/Go/etc.]
   ├── Architecture: [MVC/Clean/Hexagonal/etc.]
   └── Test Framework: [Jest/Pytest/etc.]
   ```

2. **Detect Patterns** (invoke pattern-detector skill)
   - Naming conventions (camelCase, snake_case, etc.)
   - File organization patterns
   - Import/export patterns
   - Error handling patterns
   - Logging patterns

3. **Identify Integration Points**
   - Where does this feature fit?
   - What existing modules will it interact with?
   - What database tables/models are relevant?
   - What API endpoints exist?

### Phase 2: Feature Planning

1. **Create Feature Entry**
   - Generate feature ID
   - Add to features.json
   - Set status to "in_progress"

2. **Invoke Planner Agent** with context:
   ```
   EXISTING PATTERNS:
   [Detected patterns from Phase 1]

   INTEGRATION POINTS:
   [Identified integration points]

   FEATURE REQUEST:
   [User's feature description]

   CONSTRAINTS:
   - Follow existing naming conventions
   - Match existing code style exactly
   - Integrate with existing modules
   - Add tests following existing test patterns
   ```

3. **Display Plan for Approval**
   ```
   📋 FEATURE PLAN: [feature-id]

   Changes Required:
   ├── New Files (3):
   │   ├── src/components/NewFeature.tsx
   │   ├── src/services/newFeature.ts
   │   └── src/tests/newFeature.test.ts
   │
   ├── Modified Files (2):
   │   ├── src/App.tsx (add route)
   │   └── src/services/index.ts (export)
   │
   └── Subtasks (5):
       1. Create data model
       2. Implement service layer
       3. Build UI component
       4. Add routing
       5. Write tests

   Detected Patterns Applied:
   ├── Naming: camelCase for files, PascalCase for components
   ├── Tests: Co-located with source files
   └── Services: Repository pattern with interfaces

   [Approve] [Modify] [Cancel]
   ```

### Phase 3: Implementation

1. **Execute Coder Agent** for each subtask
   - Coder follows detected patterns exactly
   - Creates code matching existing style
   - Integrates with existing modules

2. **Run Quality Gates**
   - Format with project's formatter
   - Lint with project's linter
   - Type check
   - Run existing tests (no regressions)

3. **QA Review**
   - Verify feature works
   - Check pattern compliance
   - Ensure no regressions

### Phase 4: Completion

1. **Summary Report**
   ```
   ✅ FEATURE ADDED: [feature-id]

   Files Created (3):
   ├── src/components/NewFeature.tsx
   ├── src/services/newFeature.ts
   └── src/tests/newFeature.test.ts

   Files Modified (2):
   ├── src/App.tsx
   └── src/services/index.ts

   Tests: 12 new, 47 existing (all passing)

   Pattern Compliance: ✓ All patterns followed
   ```

2. **Update State**
   - Mark feature complete
   - Log to implementation-log.jsonl
   - Store any new patterns discovered

## Pattern Detection Checklist

Before implementing, detect:
- [ ] File naming convention
- [ ] Variable naming convention
- [ ] Function naming convention
- [ ] Directory structure pattern
- [ ] Import ordering pattern
- [ ] Error handling pattern
- [ ] Logging pattern
- [ ] Test file location pattern
- [ ] Test naming pattern
- [ ] Comment/documentation style

## Allowed Tools
Read, Write, Edit, Bash, Glob, Grep, Task (for subagents)

## Subagents Used
- **Planner**: Creates implementation plan following patterns
- **Coder**: Implements matching existing style
- **QA Reviewer**: Validates pattern compliance
- **QA Fixer**: Fixes any deviations
