---
description: Minimalist Code Mode - Aggressively simplifies code, removing every non-essential line
argument-hint: <file-or-area> [--preview|--apply|--extreme]
allowed-tools: Read, Write, Edit, Bash, Glob, Grep, Task
---

# /siftcoder:zen - Minimalist Code Mode

Aggressively simplifies code by removing every non-essential line. Embrace the art of deletion.

## Usage

```
/siftcoder:zen <file>                  - Analyze simplification potential
/siftcoder:zen --preview               - Preview changes without applying
/siftcoder:zen --apply                 - Apply simplifications
/siftcoder:zen --extreme               - Maximum simplification
```

## Philosophy

```
"Perfection is achieved not when there is nothing more to add,
 but when there is nothing left to take away."
 - Antoine de Saint-Exupéry

"The best code is no code at all."
 - Jeff Atwood

Every line of code:
  • Must be maintained
  • Can contain bugs
  • Must be understood
  • Takes time to read

Zen mode asks: "Is this line truly necessary?"

If the answer is no, it's deleted.
If the answer is maybe, it's probably no.
```

## Instructions

### Default: Analyze Simplification Potential

```
/siftcoder:zen src/utils/helpers.ts
```

```
ZEN ANALYSIS
═══════════════════════════════════════════════════════════════

File: src/utils/helpers.ts
Current: 847 lines, 47 functions
Potential: 156 lines, 20 functions

Reduction: 82% 🎯


┌─ UNUSED CODE ────────────────────────────────────────────────┐
│                                                               │
│  12 functions are never called:                              │
│  ├── formatDateLong() - 0 usages                            │
│  ├── parseQueryStringOld() - 0 usages                       │
│  ├── debugLog() - 0 usages (commented out callsites)        │
│  ├── validateEmailOld() - 0 usages                          │
│  ├── [+8 more...]                                           │
│                                                               │
│  These can be safely deleted.                                │
│  Lines recovered: 234                                         │
│                                                               │
└───────────────────────────────────────────────────────────────┘


┌─ DUPLICATE CODE ─────────────────────────────────────────────┐
│                                                               │
│  8 functions are duplicates with slight variations:          │
│                                                               │
│  formatDate() and formatDateShort()                          │
│  ├── Difference: date format string only                    │
│  ├── Merge into: formatDate(date, format = 'short')         │
│  └── Lines recovered: 15                                     │
│                                                               │
│  validateEmail() and validateEmailStrict()                   │
│  ├── Difference: strict adds TLD check                      │
│  ├── Merge into: validateEmail(email, strict = false)       │
│  └── Lines recovered: 18                                     │
│                                                               │
│  [+6 more pairs...]                                          │
│                                                               │
│  Total lines recovered: 89                                   │
│                                                               │
└───────────────────────────────────────────────────────────────┘


┌─ OVER-ENGINEERED CODE ───────────────────────────────────────┐
│                                                               │
│  processUserData() - 120 lines → 15 lines possible          │
│  ─────────────────────────────────────────────────────────   │
│                                                               │
│  Current: Class with 5 methods, factory pattern, observers   │
│  Reality: Called once, always same config                    │
│  Simplified: Single function, inline config                  │
│                                                               │
│  Before (120 lines):                                          │
│    class UserDataProcessor {                                 │
│      private config: ProcessorConfig;                        │
│      private observers: Observer[] = [];                     │
│      constructor(config: ProcessorConfig) { ... }            │
│      addObserver(obs: Observer) { ... }                      │
│      removeObserver(obs: Observer) { ... }                   │
│      process(data: UserData) { ... }                        │
│      private validate(data: UserData) { ... }               │
│      private transform(data: UserData) { ... }              │
│    }                                                          │
│    const factory = new ProcessorFactory();                   │
│    const processor = factory.create(defaultConfig);          │
│    export const processUserData = (d) => processor.process(d)│
│                                                               │
│  After (15 lines):                                            │
│    export function processUserData(data: UserData) {         │
│      if (!data.email || !data.name) {                       │
│        throw new Error('Invalid user data');                │
│      }                                                        │
│      return {                                                 │
│        ...data,                                               │
│        email: data.email.toLowerCase(),                      │
│        createdAt: new Date()                                 │
│      };                                                       │
│    }                                                          │
│                                                               │
│  Lines recovered: 105                                         │
│  Readability: Much improved                                   │
│  Functionality: Identical                                     │
│                                                               │
└───────────────────────────────────────────────────────────────┘


┌─ ONE-LINER WRAPPERS ─────────────────────────────────────────┐
│                                                               │
│  5 functions just wrap another function:                     │
│                                                               │
│  // Current                                                   │
│  export function getFullName(user: User) {                   │
│    return `${user.firstName} ${user.lastName}`;             │
│  }                                                            │
│                                                               │
│  // Recommendation: Inline at callsites (only 3 usages)     │
│  // Or keep if used in 5+ places                            │
│                                                               │
│  Lines recovered: 25                                          │
│                                                               │
└───────────────────────────────────────────────────────────────┘


┌─ DEAD BRANCHES ──────────────────────────────────────────────┐
│                                                               │
│  Code that can never execute:                                │
│                                                               │
│  if (process.env.LEGACY_MODE) { ... }                       │
│  ├── LEGACY_MODE is never set                               │
│  ├── This code is dead                                       │
│  └── Lines recovered: 45                                     │
│                                                               │
│  catch (e) { /* istanbul ignore next */ }                   │
│  ├── 8 empty catch blocks                                   │
│  ├── Either handle errors or let them propagate             │
│  └── Lines recovered: 16                                     │
│                                                               │
└───────────────────────────────────────────────────────────────┘


┌─ COMMENTED CODE ─────────────────────────────────────────────┐
│                                                               │
│  Commented-out code is not documentation.                    │
│  It's clutter that confuses future readers.                  │
│                                                               │
│  Found: 34 blocks of commented code                          │
│  Git preserves history. Delete the comments.                 │
│                                                               │
│  Lines recovered: 156                                         │
│                                                               │
└───────────────────────────────────────────────────────────────┘


ZEN SUMMARY
═══════════════════════════════════════════════════════════════

  Category              Lines Recovered
  ─────────────────────────────────────
  Unused functions      234
  Duplicates            89
  Over-engineering      105
  One-liner wrappers    25
  Dead branches         61
  Commented code        156
  Other simplifications 21
  ─────────────────────────────────────
  TOTAL                 691 lines (82%)

  Before: 847 lines, 47 functions
  After:  156 lines, 20 functions

  Benefits:
    • 5x easier to understand
    • 5x fewer potential bugs
    • 5x faster to modify
    • Onboarding: hours → minutes

[Preview Changes] [Apply Zen] [Extreme Mode] [Keep Bloat]
```

### Command: `--apply`

Apply simplifications:

```
/siftcoder:zen src/utils/helpers.ts --apply
```

```
APPLYING ZEN
═══════════════════════════════════════════════════════════════

Creating checkpoint before zen...
  ✓ Checkpoint: pre-zen-helpers

Simplifying src/utils/helpers.ts...

  [1/7] Removing 12 unused functions...
        ✓ formatDateLong() deleted
        ✓ parseQueryStringOld() deleted
        [... 10 more ...]

  [2/7] Merging 8 duplicate function pairs...
        ✓ formatDate + formatDateShort → formatDate
        ✓ validateEmail + validateEmailStrict → validateEmail
        [... 6 more ...]

  [3/7] Simplifying over-engineered code...
        ✓ processUserData: 120 lines → 15 lines

  [4/7] Inlining one-liner wrappers...
        ✓ getFullName inlined at 3 callsites
        [... 4 more ...]

  [5/7] Removing dead branches...
        ✓ LEGACY_MODE block removed
        ✓ 8 empty catch blocks removed

  [6/7] Deleting commented code...
        ✓ 34 comment blocks removed

  [7/7] Final cleanup...
        ✓ Removed unused imports
        ✓ Cleaned up whitespace


ZEN COMPLETE
═══════════════════════════════════════════════════════════════

  Before: 847 lines
  After:  156 lines
  Deleted: 691 lines (82%)

  Running tests...
    ✓ 47 tests pass
    ✓ No functionality changed

  The file is now enlightened. 🧘

  Restore if needed:
    /siftcoder:checkpoint restore pre-zen-helpers
```

### Command: `--extreme`

Maximum simplification (dangerous but fun):

```
/siftcoder:zen src/utils/ --extreme
```

```
EXTREME ZEN MODE
═══════════════════════════════════════════════════════════════

⚠️  WARNING: Extreme mode is aggressive

This will:
  • Delete all code with <3 usages
  • Inline everything possible
  • Remove all abstractions
  • Eliminate all "just in case" code

Proceed? [yes/I understand the risks]


EXTREME SIMPLIFICATION
─────────────────────────────────────────────────────────────────

utils/ directory:

  Before:
    15 files
    2,340 lines
    89 exported functions

  After:
    3 files
    312 lines
    23 exported functions

  Deleted entirely:
    • logger.ts (use console directly)
    • config.ts (inline the 3 values used)
    • validation.ts (merged into helpers)
    • types.ts (inline types at usage)
    [+8 more files...]

  Surviving files:
    • helpers.ts (156 lines)
    • dates.ts (87 lines)
    • format.ts (69 lines)


EXTREME RESULTS
═══════════════════════════════════════════════════════════════

  87% reduction achieved
  Philosophy: "Do we REALLY need this?"
  Answer was usually: No.

  If tests fail, you'll know what was actually needed.
  If tests pass, you had 87% dead weight.

[Apply Extreme] [Preview First] [Return to Sanity]
```

## The Zen Principles

```
THE WAY OF ZEN CODE

1. DELETE FIRST
   Before improving code, ask if it should exist.

2. ONE OBVIOUS WAY
   If there are two ways to do something, pick one.

3. NO FUTURE-PROOFING
   Don't write code for requirements you don't have.

4. INLINE OVER ABSTRACT
   Abstraction has a cost. Pay it only when necessary.

5. READABLE OVER CLEVER
   The next reader is you in 6 months. Be kind.

6. LESS IS MORE
   A 50-line file is worth ten 500-line files.
```

## Configuration

```json
{
  "zen": {
    "minUsagesBeforeKeep": 3,
    "maxFunctionLines": 30,
    "deleteCommentedCode": true,
    "inlineOneLiners": true,
    "preservePublicAPI": true,
    "backupFirst": true
  }
}
```

## Integration

Works well with:
  • `/siftcoder:empathy` - Find code that needs zen
  • `/siftcoder:checkpoint` - Save before zen
  • `/siftcoder:refactor` - More careful refactoring
  • `/siftcoder:test` - Verify nothing broke
