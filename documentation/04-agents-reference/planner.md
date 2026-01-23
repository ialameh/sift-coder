# Agent: Planner

**Creates detailed implementation plans before coding**

---

## Overview
- **Role**: Planning specialist
- **Type**: Planning
- **Tools**: Read, Grep, Glob, Bash (Read-only)
- **Permission Mode**: Plan (read-only)

---

## Responsibilities

- Break down features into granular subtasks
- Explore codebase for existing patterns
- Design implementation approaches
- Create structured plans

---

## When This Agent Is Invoked

This agent is invoked when:

- `/build` needs to plan feature implementation
- `/add-feature` needs to understand integration points
- Complex tasks need breakdown
- Architecture decisions are needed

---

## What This Agent Does

### 1. Understand Requirements

- Read specification or issue description
- Identify acceptance criteria
- Note constraints and dependencies

### 2. Explore Codebase

- Use Grep, Glob, Read to understand patterns
- Find related code that will be affected
- Identify coding conventions
- Note testing patterns

### 3. Design Solution

- Consider architecture
- Identify integration points
- Plan for edge cases
- Consider security implications

### 4. Create Subtasks

Break down work into granular subtasks:
- Each subtask: 30min-2hr
- Clear acceptance criteria
- Ordered by dependencies
- Grouped into phases

---

## Output Format

```json
{
  "summary": "Brief description",
  "patterns_to_follow": ["List patterns"],
  "files_to_modify": ["path/to/file1.ts"],
  "files_to_create": ["path/to/new-file.ts"],
  "phases": [
    {
      "name": "Phase 1: Setup",
      "subtasks": [
        {
          "id": "subtask-001",
          "title": "Create base structure",
          "description": "What to do",
          "acceptance_criteria": ["Done when..."],
          "files": ["src/feature.ts"],
          "dependencies": []
        }
      ]
    }
  ],
  "risks": ["Potential challenges"],
  "testing_strategy": "How to verify"
}
```

---

## Best Practices

- **Prefer incremental progress** over large changes
- **Keep subtasks focused** - one concern per subtask
- **Follow existing patterns** - don't introduce new conventions
- **Consider testing** - include test files in the plan
- **Be specific** - vague plans lead to poor implementations

---

## Constraints

- **READ-ONLY** - Cannot modify files
- Focus on WHAT to do, not HOW
- If requirements are unclear, note the ambiguity
- Plan will be executed by Coder agent

---

## Example

Creating a plan for "Add user authentication":

```json
{
  "summary": "Implement JWT-based authentication",
  "patterns_to_follow": [
    "Services in src/services/",
    "Routes in src/routes/",
    "Middleware in src/middleware/"
  ],
  "files_to_modify": ["src/routes/index.ts"],
  "files_to_create": [
    "src/services/auth.ts",
    "src/middleware/auth.ts",
    "src/routes/auth.ts"
  ],
  "phases": [
    {
      "name": "Phase 1: Auth Service",
      "subtasks": [
        {
          "id": "auth-001",
          "title": "Create auth service",
          "acceptance_criteria": [
            "register() creates user",
            "login() returns JWT",
            "verify() validates token"
          ]
        }
      ]
    }
  ]
}
```

---

## See Also

- [Agent: Coder](coder.md) - Executes the plan
- [Agent: QA Reviewer](qa-reviewer.md) - Validates implementation
- [Command: /build](../02-command-reference/by-category/build-workflow.md#build)
