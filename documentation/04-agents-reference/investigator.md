# Agent: Investigator

**Safe exploration of issues without touching code**

---

## Overview
- **Role**: Issue investigation
- **Type**: Investigation
- **Tools**: Read, Grep, Glob, Bash (Read-only)
- **Permission Mode**: Read-only

---

## Responsibilities

- Safely explore codebase to understand issues
- Identify root causes
- Find affected files
- Suggest boundaries for fixes

---

## When This Agent Is Invoked

This agent is invoked when:

- `/investigate` command is run
- Root cause analysis is needed
- Understanding unfamiliar code
- Before fixing bugs

---

## What This Agent Does

### 1. Issue Analysis

- Parse issue description
- Identify key terms and context
- Determine search strategy

### 2. Codebase Exploration

- Search for relevant code patterns
- Trace execution paths
- Identify data flows

### 3. Root Cause Analysis

- Analyze findings
- Identify root cause
- List affected files

### 4. Boundary Suggestions

- Suggest modifiable files
- Identify protected areas
- Provide fix recommendations

---

## Output Format

```
🔍 Investigating: [issue]

📍 Root Cause Identified
   File: path/to/file.ts:line
   Issue: Description of problem

📁 Affected Files
   ✓ path/to/file.ts     (modifiable)
   ✗ other/file.ts        (protected - not related)

💡 Suggested Boundaries
   Modifiable: [files]
   Protected: Everything else

🔧 Recommended Fix
   [Fix suggestion]

🔗 Execution Path
   [How code flows to the problem]
```

---

## Best Practices

- **Be thorough** - Explore all possibilities
- **Be safe** - Never modify files
- **Document findings** - Show evidence
- **Suggest conservatively** - Better to over-suggest scope

---

## Constraints

- **READ-ONLY** - Cannot modify files
- Cannot make any changes to codebase
- Must document all findings with evidence

---

## Example

Investigating "Login fails after password reset":

```
🔍 Investigating: Login fails after password reset

📍 Root Cause Identified
   File: src/services/auth.ts:45-52
   Issue: Token expiration check uses wrong timezone

📁 Affected Files
   ✓ src/services/auth.ts     (modifiable)
   ✗ src/routes/auth.ts       (protected)
   ✗ src/models/user.ts       (protected)

💡 Suggested Boundaries
   Modifiable: src/services/auth.ts
   Protected: Everything else

🔧 Recommended Fix
   Change: expiresAt < now → expiresAt < now.utc()

🔗 Execution Path
   login() → validateToken() → checkExpiration()
                         ↑
                    Bug location
```

---

## See Also

- [Command: /investigate](../02-command-reference/by-category/maintain-workflow.md#investigate)
- [Agent: Coder](coder.md) - Implements fixes
- [Command: /fix](../02-command-reference/by-category/maintain-workflow.md#fix)
