# /siftcoder:optimize - Optimization Workflow

Refactor or optimize code with safety boundaries and regression testing.

## Usage

```
/siftcoder:optimize <area-or-file> [--type <type>]
```

## Arguments
- `$ARGUMENTS` - Target area/file and optional optimization type

## Optimization Types

- `performance` - Improve execution speed, reduce memory usage
- `refactor` - Improve code structure without changing behavior
- `cleanup` - Remove dead code, fix code smells
- `security` - Fix security vulnerabilities
- `accessibility` - Improve a11y compliance
- `bundle` - Reduce bundle size (frontend)

## Instructions

You are optimizing existing code. This workflow is similar to `/siftcoder:fix` with boundaries, but focused on improvement rather than bug fixes.

### Phase 1: Analysis

1. **Identify Target Area**
   ```
   🔍 OPTIMIZATION TARGET

   Area: [specified area or file]
   Type: [optimization type]

   Analyzing...
   ```

2. **Profile/Analyze** (based on type)
   - Performance: Look for N+1 queries, unnecessary loops, memory leaks
   - Refactor: Identify code smells, long methods, tight coupling
   - Cleanup: Find dead code, unused imports, deprecated patterns
   - Security: Scan for vulnerabilities (injection, XSS, etc.)
   - Bundle: Analyze imports, tree-shaking opportunities

3. **Generate Findings**
   ```
   📊 ANALYSIS RESULTS

   Optimization Opportunities (5):
   ├── [HIGH] N+1 query in getUserOrders() - src/services/orders.ts:45
   ├── [HIGH] Unbounded loop in processItems() - src/utils/batch.ts:23
   ├── [MED] Duplicate code in validators - src/validators/*.ts
   ├── [LOW] Unused import in utils - src/utils/helpers.ts:3
   └── [LOW] Magic numbers in config - src/config.ts:12-15

   Estimated Impact:
   ├── Performance: 40% improvement in order queries
   └── Maintainability: Reduced code duplication
   ```

### Phase 2: Boundary Definition

1. **Define Scope**
   ```
   ┌─────────────────────────────────────────────────┐
   │ OPTIMIZATION SCOPE                             │
   │                                                 │
   │ MODIFIABLE (4 files):                          │
   │ ├── src/services/orders.ts                     │
   │ ├── src/utils/batch.ts                         │
   │ ├── src/validators/orderValidator.ts           │
   │ └── src/validators/userValidator.ts            │
   │                                                 │
   │ PROTECTED (everything else):                   │
   │ └── All other files           🔒               │
   │                                                 │
   │ MUST PASS TESTS:                               │
   │ ├── src/tests/orders.test.ts                   │
   │ └── src/tests/validators.test.ts               │
   └─────────────────────────────────────────────────┘

   [Approve Scope] [Expand] [Reduce]
   ```

2. **Create Checkpoint**
   - Git commit current state
   - Store rollback ref in current-task.json

### Phase 3: Implementation

1. **Invoke Planner** with optimization context
   - Generate refactoring plan
   - Order changes to minimize risk
   - Identify test requirements

2. **Execute Changes** (Coder Agent)
   - One optimization at a time
   - Run tests after each change
   - Boundary enforcement active

3. **Validate** (QA Reviewer)
   - Behavior unchanged (tests pass)
   - Optimization goals met
   - No new issues introduced

### Phase 4: Verification

1. **Regression Test**
   ```
   🧪 REGRESSION TESTING

   Target Area Tests:
   ├── orders.test.ts .............. ✓ 23/23
   └── validators.test.ts .......... ✓ 15/15

   Related Tests:
   ├── checkout.test.ts ............ ✓ 31/31
   └── api.test.ts ................. ✓ 42/42

   ✅ NO REGRESSIONS
   ```

2. **Before/After Comparison** (if applicable)
   ```
   📈 OPTIMIZATION RESULTS

   Performance:
   ├── Before: 450ms average query time
   └── After:  120ms average query time (73% improvement)

   Code Quality:
   ├── Before: 3 code smells, 2 duplications
   └── After:  0 code smells, 0 duplications

   Bundle Size:
   ├── Before: 245kb
   └── After:  198kb (19% reduction)
   ```

### Phase 5: Completion

1. **Summary**
   ```
   ✅ OPTIMIZATION COMPLETE

   Changes Made (4 files):
   ├── src/services/orders.ts - Added batch query
   ├── src/utils/batch.ts - Fixed unbounded loop
   ├── src/validators/orderValidator.ts - Extracted base class
   └── src/validators/userValidator.ts - Extended base class

   Optimizations Applied:
   ├── [HIGH] N+1 query → Batch query
   ├── [HIGH] Unbounded loop → Paginated processing
   └── [MED] Duplicate code → Base class extraction

   All tests passing. No regressions.
   ```

2. **Update Knowledge**
   - Store optimization patterns discovered
   - Log to implementation-log.jsonl

## Safety Features

- **Boundary Enforcement**: Cannot modify files outside scope
- **Regression Testing**: All related tests must pass
- **Incremental Changes**: One optimization at a time
- **Checkpoint**: Can rollback entire optimization

## Allowed Tools
Read, Write, Edit, Bash, Glob, Grep, Task (for subagents)

## Subagents Used
- **Investigator**: Analyze optimization opportunities (read-only)
- **Planner**: Plan optimization approach
- **Coder**: Implement optimizations
- **QA Reviewer**: Verify no regressions
