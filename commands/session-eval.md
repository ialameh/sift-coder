---
description: Evaluate session for extractable patterns
allowed-tools: Read, Write, Edit, Bash, Task
---

# /session-eval - Evaluate Session for Patterns

Analyzes the current session to identify extractable patterns and suggests knowledge base entries.

## Usage

```
/session-eval

Analyzes the current session and suggests patterns to save.
```

## Process

### Phase 1: Session Analysis
1. Collect session data:
   - Tool calls made
   - Files modified
   - Errors encountered
   - Commands run

2. Identify pattern candidates:
   - Error resolutions
   - Workarounds discovered
   - Best practices applied
   - Debugging approaches used

### Phase 2: Pattern Matching
1. Search knowledge base for similar patterns
2. Identify gaps (what's not documented)
3. Prioritize by:
   - Time spent solving
   - Reusability potential
   - Complexity level

### Phase 3: Pattern Suggestions
Display:
- Suggested patterns from this session
- Related existing patterns
- Action items to save patterns

## Example Output

```
🧠 Session Evaluation - Pattern Extraction
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

📊 Session Summary:
  Tool calls: 47
  Files modified: 8
  Errors encountered: 3
  Commands run: 12

🔍 Pattern Candidates Found:

  1. Error Resolution: "Supabase auth timeout"
     Time spent: ~15 minutes
     Reusability: HIGH
     Problem: Supabase auth calls timing out after 30s
     Solution: Increase timeout and add retry logic

     Save this pattern?
     → /pattern-extract "Supabase auth timeout" error_resolution

  2. Best Practice: "Type-safe error handling"
     Time spent: ~8 minutes
     Reusability: MEDIUM
     Problem: Throwing plain errors lost type information
     Solution: Create custom error classes with types

     Save this pattern?
     → /pattern-extract "Type-safe error handling" best_practice

  3. Workaround: "Next.js static generation issue"
     Time spent: ~20 minutes
     Reusability: LOW (specific to this project)
     Problem: Static generation failing for dynamic routes
     Solution: Use getServerSideProps instead

     Skip: Too project-specific

💡 Related Existing Patterns:

  1. "Supabase query error handling"
     Similar to: Pattern candidate #1
     Location: .claude/siftcoder-state/knowledge/patterns.json

  2. "TypeScript async error patterns"
     Similar to: Pattern candidate #2
     Location: .claude/siftcoder-state/knowledge/patterns.json

📋 Action Items:

  [ ] Save "Supabase auth timeout" pattern
  [ ] Save "Type-safe error handling" pattern
  [ ] Review related patterns for additional insights

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

💡 Tips:
  → Focus on patterns with HIGH reusability
  → Skip project-specific workarounds
  → Check existing patterns before saving new ones
```

## Tips & Hints

```
WHEN TO RUN SESSION EVALUATION:

✅ Good times:
  → After completing a feature
  → After solving a difficult bug
  → Before ending a work session
  → When you learned something new

❌ Skip when:
  → Only made trivial changes
  → Just exploring code
  → Running quick experiments

MAKING THE MOST OF PATTERNS:

Quality over quantity:
  → Save patterns that took time to figure out
  → Focus on reusable solutions
  → Skip obvious or well-documented things

Good pattern descriptions:
  → Problem: Clear description of the issue
  → Solution: Step-by-step fix
  → Code: Relevant example with comments

Pattern maintenance:
  → Review patterns periodically
  → Update when better solutions found
  → Delete obsolete patterns

INTEGRATION WITH WORKFLOW:

  /session-eval
  → See pattern suggestions

  /pattern-extract "Name" category
  → Save the pattern

  /pattern-search "keyword"
  → Find existing patterns

  /pattern-list
  → Browse all patterns
```

---

## Now: Evaluate Session

Let me analyze the current session for extractable patterns...

1. Collect session data
2. Identify pattern candidates
3. Match against existing knowledge
4. Suggest actions

Running evaluation...
