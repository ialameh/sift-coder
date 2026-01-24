---
description: Fix build errors automatically
argument-hint: [build-command]
allowed-tools: Read, Write, Edit, Bash, Task
---

# /build-fix - Automated Build Error Resolution

Analyzes build errors and provides minimal-diff fix suggestions.

## Usage

```
/build-fix [build-command]

Examples:
  /build-fix
  /build-fix "npm run build"
  /build-fix "tsc --noEmit"
```

## Process

### Phase 1: Build Execution
1. Run build command (default: npm run build)
2. Capture all output
3. Parse errors and warnings

### Phase 2: Error Analysis
1. Categorize errors by type
2. Identify error codes
3. Extract error context

### Phase 3: Fix Suggestions
1. Generate minimal fix for each error
2. Prioritize by severity
3. Provide code examples

### Phase 4: Display Results
1. Group by priority
2. Show actionable suggestions
3. Offer to apply fixes

## Example Output

```
🔨 Running build: npm run build

❌ Build failed with 15 errors

🔴 HIGH PRIORITY:

  src/services/auth.ts:45:12
    Property 'userId' does not exist on type 'SessionData'.
    💡 Add property to type definition or check property exists.

  src/components/UserProfile.tsx:23:18
    Object is possibly 'undefined'.
    💡 Add optional chaining (?.) or type guard.
    Code:
      // Add optional chaining
      user?.profile?.name

🟡 MEDIUM PRIORITY:

  src/api/client.ts:67:8
    Argument of type 'string' is not assignable to parameter of type 'number'.
    💡 Check types or add type assertion.

  src/utils/helpers.ts:12:5
    Function call cycle detected.
    💡 Break circular references or use lazy evaluation.

🟢 LOW PRIORITY:

  src/types/index.ts:34:3
    Type is not assignable to expected type.
    💡 Verify type compatibility or use type assertion.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

💡 Quick Actions:

  Fix specific error:
    → Show me the code for src/services/auth.ts:45

  Apply fix:
    → Add optional chaining to src/components/UserProfile.tsx:23

  Explain error code:
    → What does TS2532 mean?

  Retry build:
    → Run build again to check fixes
```

## Error Categories

**Type Errors** (Medium Priority):
- TS2304: Cannot find name
- TS2339: Property does not exist
- TS2532: Object is possibly undefined
- TS2322: Type is not assignable

**Syntax Errors** (High Priority):
- TS1002: Unterminated string literal
- TS1005: '}' expected
- TS1086: ';' expected

**Import Errors** (High Priority):
- TS2307: Cannot find module
- TS2305: Module has no exported member

**Config Errors** (High Priority):
- TS5023: Unknown compiler option
- TS6053: File is not a module

## Tips & Hints

```

COMMON PATTERNS:

"Object is possibly undefined"
  → Add optional chaining: obj?.prop
  → Add null check: if (obj) { }
  → Add type guard: if (obj !== null)
  → Use non-null assertion: obj! (risky)

"Property does not exist on type"
  → Add property to interface/type
  → Use type assertion: (obj as any).prop
  → Check spelling
  → Extend interface declaration

"Cannot find module"
  → Install package: npm install package-name
  → Check import path
  → Add .js extension for ESM
  → Check tsconfig.json paths

"Type is not assignable"
  → Check type compatibility
  → Use type assertion: value as Type
  → Add type guard
  → Fix type definition

FIX STRATEGIES:

Quick wins (low risk):
  → Optional chaining for null checks
  → Type assertions (as Type)
  → Fix typos

Medium risk:
  → Add type guards
  → Extend type definitions
  → Fix import paths

High risk (review carefully):
  → Non-null assertions (!)
  → Cast to any
  → Disable linter rules

WORKFLOW:

1. Run /build-fix
2. Review high priority errors
3. Apply fixes one at a time
4. Re-run build after each fix
5. Move to medium/low priority

WHEN TO USE:

✅ Good times:
  → After refactoring
  → After dependency updates
  → When introducing strict types
  → Before committing code

❌ Not needed:
  → For runtime errors
  → For logic bugs
  → For test failures
  → During prototyping

AUTOMATION:

Integrate with CI:
  → Run build in pre-commit hook
  → Fail PRs on build errors
  → Auto-fix trivial errors

Examples:
  husky: npm run build before commit
  GitHub Actions: validate on push
  ESLint: auto-fix on save
```

---

## Now: Fix Build Errors

**$ARGUMENTS**

Using BuildFixService to analyze and fix build errors...

1. Running build command
2. Analyzing errors
3. Generating fix suggestions
4. Displaying actionable fixes

Starting build fix...
