# Agents Reference

**11 specialized AI agents for SiftCoder workflows**

Agents are specialized AI roles that collaborate on tasks. Each agent has specific tools, permissions, and responsibilities.

---

## Agents Overview

| Agent | Role | Type | Tools |
|-------|------|------|-------|
| **Planner** | Creates implementation plans | Planning | Read-only (Read, Grep, Glob, Bash) |
| **Coder** | Implements code | Implementation | Full development (Read, Write, Edit, Bash, etc.) |
| **Investigator** | Explores issues safely | Investigation | Read-only |
| **Documenter** | Generates documentation | Documentation | Documentation tools |
| **QA Reviewer** | Validates implementations | Quality Assurance | Testing, review tools |
| **QA Fixer** | Fixes identified issues | Problem Resolution | Full development tools |
| **Reviewer** | Code review automation | Review | Read, Grep, Glob |
| **Tester** | Test generation and execution | Testing | Full testing tools |
| **Semantic Searcher** | Semantic code search | Search | Vector search tools |
| **Bridge Analyzer** | Cross-codebase integration | Integration | Read, Grep, Glob, Bash |
| **Orchestrator** | Multi-agent coordination | Coordination | Task invocation |

---

## Agent Details

### Planner Agent

**Role:** Creates detailed implementation plans before coding

**When Invoked:**
- Before building new features
- Before fixing complex issues
- For architecture decisions

**Capabilities:**
- Explore codebase for patterns
- Design implementation approach
- Break down into subtasks
- Create task dependencies

**Tools:** Read, Grep, Glob, Bash (Read-only)

**Output:** Structured JSON plan with subtasks

**Cannot:** Modify files (read-only for safety)

---

### Coder Agent

**Role:** Implements coding tasks

**When Invoked:**
- After planning phase
- For each subtask
- When QA finds issues

**Capabilities:**
- Write and edit code
- Create tests
- Follow patterns
- Integrate with existing code

**Tools:** Full development tools (Read, Write, Edit, Bash, Task, etc.)

**Output:** Implemented code with tests

---

### Investigator Agent

**Role:** Safe exploration of issues

**When Invoked:**
- Bug investigation
- Root cause analysis
- Understanding unfamiliar code

**Capabilities:**
- Read-only code exploration
- Root cause identification
- Affected file mapping
- Boundary suggestions

**Tools:** Read, Grep, Glob, Bash (Read-only)

**Output:** Investigation report with findings

**Cannot:** Modify files (completely safe)

---

### Documenter Agent

**Role:** Generates documentation

**When Invoked:**
- After feature completion
- For code documentation
- For architecture diagrams

**Capabilities:**
- Generate inline docs
- Create diagrams
- Write user guides
- Generate API docs

**Tools:** Documentation tools (Read, Write, diagram generation)

**Output:** Documentation files and diagrams

---

### QA Reviewer Agent

**Role:** Validates implementations

**When Invoked:**
- After code implementation
- Before completion
- For quality gates

**Capabilities:**
- Run tests
- Review code
- Check patterns
- Validate acceptance criteria

**Tools:** Testing and review tools

**Output:** Validation report with issues

---

### QA Fixer Agent

**Role:** Fixes identified issues

**When Invoked:**
- When QA Reviewer finds problems
- For issue resolution
- Before completion

**Capabilities:**
- Fix bugs
- Refactor code
- Update tests
- Run quality gates

**Tools:** Full development tools

**Output:** Fixed code

---

## Agent Collaboration

### Typical Workflow

```
1. Planner → Creates plan
              ↓
2. Coder → Implements code
            ↓
3. QA Reviewer → Validates
                  ↓ (if issues)
4. QA Fixer → Fixes
              ↓
5. QA Reviewer → Re-validates
                     ↓ (if passes)
6. Next subtask
```

### Multi-Agent Collaboration

**Example: Building a Feature**

```
┌─────────────┐
│   Planner   │ Creates plan
└──────┬──────┘
       ↓
┌─────────────┐
│   Coder     │ Implements
└──────┬──────┘
       ↓
┌─────────────┐
│QA Reviewer  │ Finds issues
└──────┬──────┘
       ↓
┌─────────────┐
│  QA Fixer   │ Fixes issues
└──────┬──────┘
       ↓
┌─────────────┐
│QA Reviewer  │ Validates
└─────────────┘
       ↓ (if approved)
   Complete!
```

---

## Agent Permissions

### Read-Only Agents

These agents CANNOT modify files:

- **Planner** - Planning only
- **Investigator** - Investigation only
- **Reviewer** - Code review only
- **Semantic Searcher** - Search only
- **Bridge Analyzer** - Analysis only

### Write-Enabled Agents

These agents CAN modify files:

- **Coder** - Implementation
- **Documenter** - Documentation
- **QA Fixer** - Issue resolution
- **Tester** - Test creation

---

## See Also

- [Command Reference](../02-command-reference/index.md) - Commands that invoke agents
- [Skills Reference](../03-skills-reference/index.md) - Skills used by agents
