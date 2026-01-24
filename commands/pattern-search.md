---
description: Search knowledge base patterns
argument-hint: <search-query>
allowed-tools: Read, Bash, Task
---

# /pattern-search - Search Pattern Knowledge Base

Search for patterns in the knowledge base by keyword, tag, or category.

## Usage

```
/pattern-search <query>

Examples:
  /pattern-search "supabase"
  /pattern-search "error handling"
  /pattern-search "async promise"
```

## Search Behavior

Searches across:
- Pattern names
- Problem descriptions
- Solution text
- Tags
- Context notes

## Example Results

```
🔍 Pattern Search: "supabase"
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Found 3 patterns:

  1. Supabase query error handling [error_resolution]
     Problem: Supabase queries were throwing unhandled errors...
     Solution: Use { count: 'exact', head: true } for existence...
     Tags: supabase, error-handling, typescript

  2. Supabase auth timeout workaround [workaround]
     Problem: Supabase auth calls timing out after 30s...
     Solution: Increase timeout and add retry logic...
     Tags: supabase, auth, timeout

  3. Supabase RLS pattern [best_practice]
     Problem: Row Level Security policies too restrictive...
     Solution: Use separate policies for read vs write...
     Tags: supabase, rls, security

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

View pattern details:
  /pattern-get supabase-query-error-handling

Use pattern in code:
  → Review solution section
  → Copy code example if provided
  → Adapt to your context
```

---

## Now: Search Patterns

Searching for: **$ARGUMENTS**

Using LearningService to search patterns...
