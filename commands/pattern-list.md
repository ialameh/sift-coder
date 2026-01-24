---
description: List all patterns in knowledge base
allowed-tools: Read, Bash, Task
---

# /pattern-list - List Pattern Knowledge Base

List all patterns stored in the knowledge base with filtering options.

## Usage

```
/pattern-list [category]

Examples:
  /pattern-list
  /pattern-list error_resolution
  /pattern-list best_practice
```

## Categories

- `error_resolution` - Solutions to common errors
- `debugging` - Debugging techniques and approaches
- `workaround` - Temporary workarounds for known issues
- `best_practice` - Recommended coding practices
- `refactoring` - Code refactoring patterns
- `architecture` - Architectural patterns and decisions

## Example Output

```
📚 Pattern Knowledge Base
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Total patterns: 24

error_resolution (8):
  • Supabase query error handling
  • TypeScript module resolution
  • Docker volume permissions
  • AWS Lambda timeout issues
  • React useEffect cleanup
  • MongoDB connection pooling
  • WebSocket reconnection strategy
  • Git merge conflict resolution

debugging (4):
  • Memory leak detection in Node.js
  • Race condition debugging
  • React render optimization
  • Async stack trace analysis

best_practice (7):
  • Type-safe error handling
  • API response standardization
  • Environment variable management
  • TypeScript utility types
  • React component composition
  • Testing strategies for async code
  • Security headers configuration

workaround (3):
  • Next.js static generation issue
  • Webpack HSE bug
  • Node.js ESM import warning

refactoring (2):
  • Extract service layer
  • Consolidate API clients

architecture (0):
  (no patterns in this category)

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Filter by category:
  /pattern-list error_resolution

Get pattern details:
  /pattern-get <pattern-id>

Search patterns:
  /pattern-search <keyword>
```

---

## Now: List Patterns

**$ARGUMENTS**

Using LearningService to list patterns...
