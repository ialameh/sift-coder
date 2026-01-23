# Choosing the Right Command

**Interactive decision guide to find the perfect command for your task**

Not sure which command to use? Answer a few questions to find the right command.

---

## Quick Decision Tree

### I want to...

#### Create Something New

| I want to... | Use this command | Learn more |
|--------------|------------------|------------|
| Build a complete project from scratch | `/build <spec>` | [BUILD Workflow](../02-command-reference/by-category/build-workflow.md) |
| Add a feature to existing code | `/add-feature <description>` | [BUILD Workflow](../02-command-reference/by-category/build-workflow.md) |
| Generate a new API | `/api document` | [API Workflow](../02-command-reference/by-category/api-workflow.md) |
| Create tests for code | `/test generate <file>` | [TEST Workflow](../02-command-reference/by-category/test-workflow.md) |
| Generate documentation | `/document architecture` | [DOCUMENT Workflow](../02-command-reference/by-category/document-workflow.md) |

#### Fix or Maintain Code

| I want to... | Use this command | Learn more |
|--------------|------------------|------------|
| Investigate a bug (safely) | `/investigate <issue>` | [MAINTAIN Workflow](../02-command-reference/by-category/maintain-workflow.md) |
| Fix a bug with boundaries | `/fix <issue>` | [MAINTAIN Workflow](../02-command-reference/by-category/maintain-workflow.md) |
| Optimize performance | `/optimize <area>` | [PERF Workflow](../02-command-reference/by-category/perf-workflow.md) |
| Refactor code | `/refactor suggest` | [REFACTOR Workflow](../02-command-reference/by-category/refactor-workflow.md) |
| Migrate dependencies | `/migrate upgrade` | [MIGRATE Workflow](../02-command-reference/by-category/migrate-workflow.md) |

#### Understand Code

| I want to... | Use this command | Learn more |
|--------------|------------------|------------|
| Understand the codebase | `/understand` | [UNDERSTAND Workflow](../02-command-reference/by-category/understand-workflow.md) |
| Generate spec from code | `/reverse-spec` | [UNDERSTAND Workflow](../02-command-reference/by-category/understand-workflow.md) |
| Explain a file | `/learn explain <file>` | [LEARN Workflow](../02-command-reference/by-category/learn-workflow.md) |
| Follow a user flow | `/learn journey <flow>` | [LEARN Workflow](../02-command-reference/by-category/learn-workflow.md) |
| Semantic code search | `/search <query>` | [UNDERSTAND Workflow](../02-command-reference/by-category/understand-workflow.md) |

#### Test & Quality

| I want to... | Use this command | Learn more |
|--------------|------------------|------------|
| Generate tests | `/test generate <file>` | [TEST Workflow](../02-command-reference/by-category/test-workflow.md) |
| Check test coverage | `/test coverage` | [TEST Workflow](../02-command-reference/by-category/test-workflow.md) |
| Fix flaky tests | `/test flaky` | [TEST Workflow](../02-command-reference/by-category/test-workflow.md) |
| Run mutation testing | `/test mutate` | [TEST Workflow](../02-command-reference/by-category/test-workflow.md) |
| Security scan | `/security scan` | [SECURE Workflow](../02-command-reference/by-category/secure-workflow.md) |

#### Salesforce Development

| I want to... | Use this command | Learn more |
|--------------|------------------|------------|
| Analyze Apex code | `/apex analyze` | [Salesforce](../02-command-reference/by-category/salesforce-development.md) |
| Create LWC component | `/lwc create <name>` | [Salesforce](../02-command-reference/by-category/salesforce-development.md) |
| Generate schema diagrams | `/schema erd` | [Salesforce](../02-command-reference/by-category/salesforce-development.md) |
| Deploy to Salesforce | `/sf-deploy validate` | [Salesforce](../02-command-reference/by-category/salesforce-development.md) |

#### Control Workflow

| I want to... | Use this command | Learn more |
|--------------|------------------|------------|
| Check progress | `/status` | [Workflow Control](../02-command-reference/by-category/workflow-control.md) |
| Pause workflow | `/pause` | [Workflow Control](../02-command-reference/by-category/workflow-control.md) |
| Resume workflow | `/resume` | [Workflow Control](../02-command-reference/by-category/workflow-control.md) |
| Save checkpoint | `/checkpoint save <name>` | [Session & State](../02-command-reference/by-category/session-state.md) |
| Rollback changes | `/rollback <checkpoint>` | [Session & State](../02-command-reference/by-category/session-state.md) |

#### Novel AI Features

| I want to... | Use this command | Learn more |
|--------------|------------------|------------|
| Rubber duck debugging | `/duck <issue>` | [Creative & Novel](../02-command-reference/by-category/creative-novel.md) |
| Explore "what-if" scenarios | `/ghost <idea>` | [Creative & Novel](../02-command-reference/by-category/creative-novel.md) |
| Predict change impact | `/ripple <change>` | [Creative & Novel](../02-command-reference/by-category/creative-novel.md) |
| Understand code history | `/archaeologist <file>` | [Creative & Novel](../02-command-reference/by-category/creative-novel.md) |
| Predict tech debt impact | `/fortune` | [Creative & Novel](../02-command-reference/by-category/creative-novel.md) |

---

## Interactive Flow

### Step 1: What is your primary goal?

#### A. Create Something New
Go to [Step 2A](#step-2a-create-something-new)

#### B. Fix or Maintain Code
Go to [Step 2B](#step-2b-fix-or-maintain-code)

#### C. Understand Code
Go to [Step 2C](#step-3c-understand-code)

#### D. Test & Quality
Go to [Step 2D](#step-2d-test--quality)

#### E. Salesforce Development
Go to [Step 2E](#step-2e-salesforce-development)

#### F. Explore Creative AI
Go to [Step 2F](#step-2f-explore-creative-ai)

---

### Step 2A: Create Something New

#### Starting from scratch?

**YES** → Use `/build <spec>`
- Creates complete project from specification
- Generates tests, documentation
- Runs quality gates

**NO** (adding to existing code) → Use `/add-feature <description>`
- Analyzes existing codebase
- Follows established patterns
- Safe integration

#### Building an API?

**YES** → Use `/api document`
- Generates OpenAPI specification
- Creates endpoints
- Documentation included

**NO** → Continue below

#### Need tests for existing code?

**YES** → Use `/test generate <file>`
- Comprehensive test suite
- Happy path, edge cases, errors
- Security tests included

**NO** → Use `/document architecture`
- Architecture diagrams
- System documentation
- Data flow visualization

---

### Step 2B: Fix or Maintain Code

#### Know what's broken?

**NO** → Use `/investigate <issue>`
- Read-only exploration
- Identifies root cause
- Suggests boundaries
- **Safe - no code changes**

**YES** → Continue below

#### Want to fix it yourself with safety?

**YES** → Use `/fix <issue>`
- Respects file boundaries
- Only modifies approved files
- Protected files locked
- Blast radius validation

**NO** → Use `/pair`
- Interactive pair programming
- AI suggests, you approve
- Step-by-step collaboration

#### Performance issues?

**YES** → Use `/optimize <area>`
- Static analysis
- Profiling guidance
- Benchmarking

**NO** → Continue below

#### Code smells or debt?

**YES** → Use `/refactor suggest`
- Finds refactoring opportunities
- Safe renaming
- Extract methods

**NO** → Use `/understand`
- Analyze codebase
- Identify patterns
- Understand architecture

---

### Step 2C: Understand Code

#### New to the codebase?

**YES** → Use `/understand`
- Quick overview
- Architecture summary
- Main components

**NO** → Continue below

#### Want detailed diagrams?

**YES** → Use `/understand --deep`
- Dependency graphs
- Data flows
- Mermaid diagrams

**NO** → Continue below

#### Explain a specific file?

**YES** → Use `/learn explain <file>`
- Deep file explanation
- Why it exists
- How it works

**NO** → Continue below

#### Follow a user flow?

**YES** → Use `/learn journey <flow>`
- Trace through code
- See execution path
- Data transformations

**NO** → Use `/search <query>`
- Semantic search
- Find related code
- Vector-based matching

---

### Step 2D: Test & Quality

#### Need to generate tests?

**YES** → Use `/test generate <file>`
- Unit tests
- Integration tests
- Edge cases
- Error handling

**NO** → Continue below

#### Tests flaky?

**YES** → Use `/test flaky`
- Detect flaky tests
- Fix race conditions
- Stabilize tests

**NO** → Continue below

#### Check coverage?

**YES** → Use `/test coverage`
- Coverage gaps
- Missing test scenarios
- Recommendations

**NO** → Continue below

#### Security concerns?

**YES** → Use `/security scan`
- OWASP Top 10
- Secret detection
- Dependency vulnerabilities

**NO** → Use `/review diff`
- Review staged changes
- Identify issues
- Suggest improvements

---

### Step 2E: Salesforce Development

#### Apex development?

**YES** → Use `/apex analyze`
- Anti-pattern detection
- Bulkification issues
- Governor limits

**NO** → Continue below

#### LWC components?

**YES** → Use `/lwc create <name>`
- Component with tests
- Best practices
- Wire adapters

**NO** → Continue below

#### Schema changes?

**YES** → Use `/schema erd`
- Entity diagrams
- Relationships
- Field details

**NO** → Continue below

#### Deploying changes?

**YES** → Use `/sf-deploy validate`
- Validate deployment
- Check for breaking changes
- Test coverage

**NO** → Use `/sf-architect-review`
- Architecture review
- Security analysis
- Governor limits

---

### Step 2F: Explore Creative AI

#### Stuck on a problem?

**YES** → Use `/duck <issue>`
- AI asks YOU questions
- Socratic method
- You discover the solution

**NO** → Continue below

#### Explore "what-if" scenarios?

**YES** → Use `/ghost <idea>`
- Parallel universe
- No code changes
- Compare approaches

**NO** → Continue below

#### About to make a change?

**YES** → Use `/ripple <change>`
- See impact ripples
- Files affected
- Breakage risk

**NO** → Continue below

#### Confusing legacy code?

**YES** → Use `/archaeologist <file>`
- Why code exists
- Historical context
- Past attempts

**NO** → Use `/oracle`
- Predicts your intent
- Anticipates next action
- Saves time

---

## Command Comparison Tables

### Investigate vs Fix

| Aspect | `/investigate` | `/fix` |
|--------|---------------|--------|
| **Mode** | Read-only | Write-enabled |
| **Code changes** | None | Bounded |
| **Use when** | Understanding the issue | Fixing the issue |
| **Safety** | Completely safe | Safe with boundaries |
| **Output** | Root cause, affected files | Fixed code |
| **Best practice** | Run first | Run after investigate |

**Recommendation**: Always run `/investigate` first, then `/fix`.

### Build vs Add Feature

| Aspect | `/build` | `/add-feature` |
|--------|----------|----------------|
| **Starting point** | Specification file | Existing codebase |
| **Scope** | Complete project | Single feature |
| **Code analysis** | New patterns | Follows existing |
| **Best for** | New projects | Adding to existing |
| **Time** | 30 min - 2 hours | 10 min - 1 hour |

### Understand vs Learn

| Aspect | `/understand` | `/learn` |
|--------|---------------|----------|
| **Scope** | Entire codebase | Specific area |
| **Depth** | Overview to deep | Focused explanation |
| **Output** | Architecture, patterns | Detailed explanations |
| **Use when** | New to project | Learning specific code |

### Document Types

| Type | Command | Output | Use When |
|------|---------|--------|----------|
| **Code** | `/document code [path]` | Inline docs | Documenting source code |
| **Architecture** | `/document architecture` | Diagrams | System design docs |
| **User Manual** | `/document user-manual` | End-user guide | User documentation |
| **Technical** | `/document technical` | API/ops docs | Developer documentation |

---

## Common Scenarios

### Scenario 1: New to a Team

```
1. /understand              # Get overview
2. /learn journey "login"   # Follow key flow
3. /document code src/      # Document undocumented code
```

### Scenario 2: Bug in Production

```
1. /investigate "bug"       # Find root cause
2. /fix "bug"               # Fix with boundaries
3. /blast-radius            # Verify containment
4. /test generate           # Add tests
```

### Scenario 3: Adding Authentication

```
1. /add-feature "Add JWT auth"
2. /security owasp          # Security check
3. /test generate src/auth/ # Generate tests
4. /document technical      # API docs
```

### Scenario 4: Legacy Codebase

```
1. /understand --deep       # Full analysis
2. /test coverage           # Check coverage
3. /refactor suggest        # Find improvements
4. /document architecture   # Generate docs
```

### Scenario 5: Salesforce Development

```
1. /apex analyze            # Check Apex code
2. /lwc create component    # Create LWC
3. /schema erd              # Schema diagram
4. /sf-deploy validate      # Validate deployment
```

---

## Still Not Sure?

### Use the Prompt Helper

```bash
/siftcoder:prompt
```

Interactive prompt builder that:
1. Asks you questions about your task
2. Understands your context
3. Generates the perfect command
4. Provides usage examples

### Improve an Existing Prompt

```bash
/siftcoder:prompt improve "your prompt here"
```

Analyzes your prompt and provides:
- Quality score
- Missing details
- Improved version
- Expected outcomes

---

## Related Documentation

- [Command Reference](../02-command-reference/index.md) - All 103 commands
- [Quick Start Guide](../01-getting-started/quick-start.md) - First steps
- [Workflow Guides](../05-workflows/index.md) - Step-by-step workflows
- [Use Cases](../06-use-cases/index.md) - Real-world examples

---

**Need more help?** → [Prompt Helper](../02-command-reference/by-category/workflow-control.md#prompt)
