---
description: Extract reusable patterns from recent work
argument-hint: <pattern-name> [category]
allowed-tools: Read, Write, Edit, Bash, Task
---

# /pattern-extract - Extract Reusable Patterns

Extracts reusable patterns from the current session and saves to knowledge base.

## Usage

```
/pattern-extract "pattern name" [category]

Examples:
  /pattern-extract "Supabase query error handling"
  /pattern-extract "TypeScript async promise pattern" best_practice
  /pattern-extract "React useEffect dependency issue" debugging
```

## Categories

- `error_resolution` - Solutions to common errors
- `debugging` - Debugging techniques and approaches
- `workaround` - Temporary workarounds for known issues
- `best_practice` - Recommended coding practices
- `refactoring` - Code refactoring patterns
- `architecture` - Architectural patterns and decisions

## Process

### Phase 1: Pattern Identification
1. Analyze recent code changes and problem-solving
2. Identify the core pattern used
3. Extract the problem-solution pair

### Phase 2: Pattern Extraction
For pattern: **$ARGUMENTS**

1. **Problem Statement**
   - What was the issue?
   - What error messages or symptoms occurred?
   - What was the context?

2. **Solution**
   - What was the fix?
   - What code changes were made?
   - What dependencies were involved?

3. **Code Example** (optional)
   - Extract relevant code snippet
   - Add comments explaining key points

4. **Tags**
   - Technology tags (typescript, react, supabase, etc.)
   - Concept tags (async, validation, auth, etc.)

### Phase 3: Pattern Storage
1. Use the LearningService to save the pattern
2. Pattern is stored in `.claude/siftcoder-state/knowledge/patterns.json`
3. Service assigns unique ID based on pattern name
4. Timestamp and metadata are added

### Phase 4: Pattern Suggestions
1. Search for similar existing patterns
2. Suggest potential applications
3. Show related patterns

## Example Pattern

```json
{
  "id": "supabase-query-error-handling",
  "name": "Supabase query error handling",
  "category": "error_resolution",
  "problem": "Supabase queries were throwing unhandled errors when data didn't exist",
  "solution": "Use { count: 'exact', head: true } for existence checks and handle errors gracefully with try-catch",
  "code_example": "const { data, error } = await supabase\n  .from('users')\n  .select('id')\n  .eq('id', userId)\n  .single();\n\nif (error) {\n  if (error.code === 'PGRST116') {\n    // Not found\n    return null;\n  }\n  throw error;\n}",
  "tags": ["supabase", "error-handling", "typescript"],
  "created_at": "2025-01-24T10:00:00Z"
}
```

## Tips & Hints

```
WHAT TO LEARN FROM A SESSION:

✅ Good pattern candidates:
  → Error resolutions that took time to figure out
  → Workarounds for framework/library bugs
  → Performance optimizations
  → Security patterns (auth, validation, sanitization)
  → API integration patterns
  → State management patterns

❌ Skip these:
  → One-off fixes specific to this project
  → Temporary debugging code
  → Framework basics (well-documented elsewhere)
  → Personal preference patterns (not best practices)

GOOD PATTERNS:

Error Resolution:
  "How I fixed X error when doing Y"
  "Z library returns undefined, here's the workaround"

Best Practices:
  "Type-safe error handling in async functions"
  "Centralized API error handling"

Debugging:
  "How to trace memory leaks in Node.js"
  "Debugging race conditions in async code"

FINDING SIMILAR PATTERNS:

  /pattern-search "supabase"
  → Shows existing Supabase-related patterns

  /pattern-list
  → Shows all patterns in knowledge base

AFTER SAVING A PATTERN:

  /pattern-suggest "typescript async promise"
  → Get pattern suggestions for current context
```

---

## Now: Extract Pattern

For pattern: **$ARGUMENTS**

1. Ask me for:
   - Problem description (what was the issue?)
   - Solution (how was it fixed?)
   - Code example (optional)

2. Extract and structure the pattern

3. Save to knowledge base using LearningService

4. Show similar patterns that might be useful

Ready to extract the pattern. Please describe:
- What was the problem?
- How was it solved?
- Any code example to include?
