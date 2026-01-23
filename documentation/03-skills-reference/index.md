# Skills Reference

**22 specialized skills for SiftCoder workflows**

Skills are specialized capabilities that commands can invoke. They encapsulate specific functionality like generating diagrams, analyzing code patterns, or detecting security issues.

---

## Skills Overview

| Skill | Type | Purpose |
|-------|------|---------|
| `autonomous` | Workflow | Core autonomous orchestration |
| `agentic-executor` | Execution | Execute tasks through agents |
| `siftcoder-workflow` | Workflow | Multi-agent workflow coordination |
| `pattern-detector` | Analysis | Detect code patterns and conventions |
| `semantic-codebase-search` | Search | Vector-based semantic code search |
| `gap-analyzer` | Analysis | Compare spec vs code for gaps |
| `spec-analyzer` | Analysis | Extract features from specifications |
| `diagram-generator` | Documentation | Generate Mermaid diagrams |
| `document` | Documentation | Generate various documentation types |
| `quality-gates` | Quality | Run format, lint, type-check |
| `security-scanner` | Security | Scan for security vulnerabilities |
| `test-generator` | Testing | Generate comprehensive tests |
| `coverage-analyzer` | Testing | Analyze test coverage gaps |
| `mutation-tester` | Testing | Run mutation testing |
| `market-researcher` | Analysis | Market and competitor research |
| `seo-researcher` | Analysis | SEO and keyword research |
| `ux-analyzer` | Analysis | UX analysis and recommendations |
| `website-builder` | Specialized | Build websites from codebase |
| `website-sync` | Specialized | Sync website to hosting |
| `organize-project` | Organization | Organize to Sift structure |
| `prompt-helper` | Helper | Interactive prompt building |

---

## By Type

### Workflow Skills

| Skill | Description |
|-------|-------------|
| `autonomous` | Core autonomous workflow orchestration |
| `agentic-executor` | Execute tasks through specialized agents |
| `siftcoder-workflow` | Multi-agent workflow coordination with Plan → Code → Review → Fix |

### Analysis Skills

| Skill | Description |
|-------|-------------|
| `pattern-detector` | Detect coding patterns, conventions, architecture styles |
| `semantic-codebase-search` | Vector-based semantic search through codebase |
| `gap-analyzer` | Compare specification against code to find gaps |
| `spec-analyzer` | Extract features, acceptance criteria from specs |
| `market-researcher` | Market analysis, competitor research |
| `seo-researcher` | SEO trends, keyword research |
| `ux-analyzer` | UX analysis, usability recommendations |

### Documentation Skills

| Skill | Description |
|-------|-------------|
| `diagram-generator` | Generate Mermaid diagrams (architecture, data flow, ERD) |
| `document` | Generate code docs, user manuals, architecture, technical docs |

### Quality Skills

| Skill | Description |
|-------|-------------|
| `quality-gates` | Run formatters, linters, type checkers, tests |
| `security-scanner` | OWASP Top 10, secret detection, dependency scanning |

### Testing Skills

| Skill | Description |
|-------|-------------|
| `test-generator` | Generate comprehensive test suites |
| `coverage-analyzer` | Find test coverage gaps |
| `mutation-tester` | Run mutation testing for test effectiveness |

### Specialized Skills

| Skill | Description |
|-------|-------------|
| `website-builder` | Build websites from codebase analysis |
| `website-sync` | Sync generated websites to hosting |
| `organize-project` | Organize projects to Sift monorepo structure |
| `prompt-helper` | Interactive prompt building assistance |

---

## How Skills Work

### Skill Invocation

Commands invoke skills through the Skill tool:

```
Command → Skill → Agent(s) → Result
```

**Example:**
```
/build → spec-analyzer → Extract features
      → planner → Create plan
      → coder → Implement
      → qa-reviewer → Validate
```

### Skill Capabilities

Each skill has:
- **Purpose**: What it does
- **Input**: What it needs
- **Output**: What it produces
- **Tools**: What it can use
- **Related Commands**: Which commands use it

---

## See Also

- [Command Reference](../02-command-reference/index.md) - Commands that use these skills
- [Agents Reference](../04-agents-reference/index.md) - Agents invoked by skills
