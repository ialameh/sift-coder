# SiftCoder Glossary

**Terms and concepts used throughout SiftCoder**

---

## A

### Agent
Specialized AI role that performs specific tasks. SiftCoder has 11 agents: Planner, Coder, Investigator, Documenter, QA Reviewer, QA Fixer, Reviewer, Tester, Semantic Searcher, Bridge Analyzer, Orchestrator.

### Autonomous Workflow
Plan → Code → Review → Fix cycle that runs automatically while you focus on other things.

---

## B

### Blast Radius
Verification that a fix doesn't affect protected areas of the codebase. Uses `/blast-radius` command.

### Boundaries
File modification limits enforced during fix operations. Modifiable files can be changed; protected files cannot.

### Bulkification
Converting Salesforce code to work with bulk operations and avoid governor limits.

---

## C

### Checkpoint
Named restore point with full context saved for later restoration.

### Code Smell
Indicator of poor code quality: long functions, duplicate code, magic numbers, etc.

---

## D

### Dependency Graph
Visual representation of how modules/packages depend on each other.

### Documenter Agent
Agent specialized in generating documentation, diagrams, and guides.

---

## F

### Feature Queue
Ordered list of features to implement, tracked in `.claude/siftcoder-state/features.json`.

---

## G

### Gap Analysis
Comparing specification against code to find missing features and undocumented extras.

### Governor Limits
Salesforce resource limits (150 SOQL queries, 150 DML statements, etc.).

### Ghost Mode
Explore "what-if" architectural changes without touching real code.

---

## I

### Investigator Agent
Read-only agent that explores codebases to understand issues safely.

---

## M

### Mermaid Diagram
Text-based diagram format for visualizing architecture, data flows, and relationships.

### Multi-Agent System
Architecture using specialized agents for different roles (planning, coding, reviewing, fixing).

---

## O

### OWASP Top 10
Standard security awareness document listing top web application security risks.

---

## P

### Pattern Detection
Analyzing codebase to identify naming conventions, architectural patterns, and coding style.

### Planner Agent
Creates implementation plans by exploring codebase and breaking down features into subtasks.

---

## Q

### QA Fixer Agent
Fixes issues identified by QA Reviewer in a minimal, focused way.

### QA Reviewer Agent
Validates implementations against acceptance criteria and identifies issues.

### Quality Gates
Automatic checks (format, lint, type-check, tests) that run after code changes.

---

## R

### Rubber Duck Debugging
AI asks YOU questions to help you discover solutions yourself.

### Root Cause Analysis
Process of identifying the fundamental cause of a problem.

---

## S

### Scope Management
Defining which files can be modified (modifiable) and which are protected during fixes.

### Semantic Search
Finding code by meaning rather than exact keywords using vector embeddings.

### Self-Healing Loop
Automatically running build/test/lint and fixing failures with up to 3 retries.

### SiftCoder
Autonomous multi-agent coding workflow system for Claude Code.

### Spec Analyzer
Extracts structured features from natural language specifications.

### Swagger
OpenAPI specification format for API documentation.

---

## T

### Test-Driven Development (TDD)
Writing tests first, then generating code that passes them.

### Timewarp
State reconstruction debugging - reconstruct exact app state at any point in history.

---

## U

### Understanding
Capturing knowledge about codebase structure, patterns, and architecture.

---

## V

### Vector Embeddings
Numerical representations of code/text that enable semantic search.

---

## W

### Workflow Control
Commands for managing autonomous workflows: `/status`, `/pause`, `/continue`, `/focus`.

---

---

**See Also:**
- [Command Reference](../02-command-reference/index.md)
- [Skills Reference](../03-skills-reference/index.md)
- [Agents Reference](../04-agents-reference/index.md)
