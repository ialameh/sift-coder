# SiftCoder Documentation

**Autonomous Multi-Agent Coding Workflows for Claude Code**

Welcome to the comprehensive SiftCoder documentation. This is your gateway to 103 specialized commands, 22 skills, and 11 AI agents that transform how you build, maintain, and understand software.

---

## Where Do I Start?

### I'm New to SiftCoder
Start here: [Getting Started Guide](01-getting-started/index.md)
- Installation in 2 minutes
- Your first command
- Core concepts explained

### I Have a Specific Task
Find the right command: [Decision Guide](07-decision-guides/choosing-the-right-command.md)
- "I want to..." style questions
- Interactive decision tree
- Command recommendations

### I Want to Browse Commands
See all commands: [Command Reference](02-command-reference/index.md)
- By category (21 workflow categories)
- Alphabetically (A-Z index)
- With examples and use cases

### I'm a Salesforce Developer
Jump to: [Salesforce Development](02-command-reference/by-category/salesforce-development.md)
- Apex, LWC, Schema, Deployment
- 16 specialized commands
- Architecture and testing

### I Want to Learn Advanced Features
Explore: [Advanced Topics](10-advanced-topics/index.md)
- Novel AI features (duck, ghost, oracle, timewarp)
- Multi-agent orchestration
- Performance optimization

---

## Quick Navigation

### By Documentation Type

| Section | Description | Link |
|---------|-------------|------|
| **Getting Started** | New user guides, installation, quick start | [Guide](01-getting-started/index.md) |
| **Command Reference** | All 103 commands organized by category | [Reference](02-command-reference/index.md) |
| **Skills Reference** | 22 specialized skills explained | [Reference](03-skills-reference/index.md) |
| **Agents Reference** | 11 AI agents and their roles | [Reference](04-agents-reference/index.md) |
| **Workflows** | Step-by-step workflow guides | [Guides](05-workflows/index.md) |
| **Use Cases** | Real-world usage scenarios | [Examples](06-use-cases/index.md) |
| **Decision Guides** "Which command should I use?" | [Helper](07-decision-guides/choosing-the-right-command.md) |
| **Integration** | CI/CD, GitHub, Slack, monitoring | [Setup](08-integration/index.md) |
| **Best Practices** | Workflow patterns, safety, testing | [Tips](09-best-practices/index.md) |
| **Advanced Topics** | Performance, customization, extension | [Deep Dive](10-advanced-topics/index.md) |
| **Glossary** | Terms and concepts | [Terms](11-glossary/index.md) |
| **Appendices** | Reference tables, cheatsheets | [Appendix](12-appendices/index.md) |

### By User Type

| I am a... | Start Here | Key Commands |
|-----------|------------|--------------|
| **Solo Developer** | [Use Case Guide](06-use-cases/by-developer-type/solo-developer.md) | `/build`, `/add-feature`, `/fix`, `/document` |
| **Salesforce Developer** | [Salesforce Guide](06-use-cases/by-developer-type/salesforce-developer.md) | `/apex`, `/lwc`, `/schema`, `/sf-deploy` |
| **Full-Stack Developer** | [Full-Stack Guide](06-use-cases/by-developer-type/fullstack-developer.md) | `/build`, `/api`, `/test`, `/security` |
| **Team Lead** | [Team Development](06-use-cases/by-developer-type/team-lead.md) | `/review`, `/document`, `/test`, `/monitor` |
| **New to SiftCoder** | [Quick Start](01-getting-started/quick-start.md) | `/prompt`, `/help`, `/understand` |

### By Task Type

| I want to... | Go To | Key Command |
|--------------|-------|-------------|
| **Build a new project** | [New Project Guide](06-use-cases/by-task-type/new-project.md) | `/build <spec>` |
| **Fix a bug safely** | [Bug Fixing Guide](06-use-cases/by-task-type/debugging-production.md) | `/investigate` → `/fix` |
| **Add a feature** | [Add Feature Guide](06-use-cases/by-task-type/adding-features.md) | `/add-feature "description"` |
| **Generate documentation** | [Documentation Guide](06-use-cases/by-task-type/documentation-generation.md) | `/document architecture` |
| **Run security scan** | [Security Guide](06-use-cases/by-task-type/security-audit.md) | `/security scan` |
| **Improve test coverage** | [Testing Guide](06-use-cases/by-task-type/testing-coverage.md) | `/test coverage` |
| **Understand legacy code** | [Legacy Code Guide](06-use-cases/by-task-type/legacy-codebase.md) | `/understand --deep` |

---

## Most Common Commands

### Build New Projects
```bash
/siftcoder:build path/to/spec.md          # Build from specification
/siftcoder:add-feature "Add OAuth"        # Add feature to existing app
/siftcoder:organize-project ./path        # Organize to Sift structure
```

### Maintain Existing Code
```bash
/siftcoder:investigate "Bug description"  # Read-only investigation
/siftcoder:fix "Bug description"          # Bounded fix with scope limits
/siftcoder:scope show                     # View modifiable files
```

### Generate Documentation
```bash
/siftcoder:document architecture          # Architecture diagrams
/siftcoder:document code src/             # Inline documentation
/siftcoder:document user-manual           # End-user guide
```

### Test & Quality
```bash
/siftcoder:test generate src/auth.ts      # Generate tests
/siftcoder:test coverage                  # Find coverage gaps
/siftcoder:security scan                  # Full security audit
```

### Workflow Control
```bash
/siftcoder:status                         # Check progress
/siftcoder:pause                          # Stop auto-continuation
/siftcoder:resume                         # Continue workflow
/siftcoder:prompt                         # Get help crafting prompts
```

---

## Core Concepts

### Multi-Agent Architecture

SiftCoder uses specialized AI agents that collaborate on your tasks:

| Agent | Role | Tools Available |
|-------|------|-----------------|
| **Planner** | Creates implementation plans | Read-only exploration |
| **Coder** | Implements code changes | Full development tools |
| **Investigator** | Explores issues safely | Read-only analysis |
| **Documenter** | Generates documentation | Documentation tools |
| **QA Reviewer** | Validates implementations | Testing, review tools |
| **QA Fixer** | Fixes identified issues | Problem resolution |

### Autonomous Workflows

The default workflow cycles automatically:
1. **Plan** - Break down task into subtasks
2. **Code** - Implement with tests
3. **Quality Gates** - Run format, lint, type-check
4. **Review** - QA validates implementation
5. **Fix** - Address any issues found
6. **Continue** - Move to next task

Use `/pause`, `/continue`, `/status` to control the workflow.

### Safety & Boundaries

When fixing issues, SiftCoder enforces strict boundaries:
- **MODIFIABLE**: Files you explicitly approve
- **PROTECTED**: Everything else (locked from modification)

Commands:
- `/scope show` - View current boundaries
- `/scope add <file>` - Allow modifications
- `/blast-radius` - Verify changes are contained

---

## Command Categories

SiftCoder has 21 workflow categories:

### Core Workflows
- [**BUILD**](02-command-reference/by-category/build-workflow.md) - New project development
- [**MAINTAIN**](02-command-reference/by-category/maintain-workflow.md) - Safe bug fixing
- [**DOCUMENT**](02-command-reference/by-category/document-workflow.md) - Documentation generation
- [**UNDERSTAND**](02-command-reference/by-category/understand-workflow.md) - Codebase analysis

### Quality & Security
- [**SECURE**](02-command-reference/by-category/secure-workflow.md) - Security scanning
- [**TEST**](02-command-reference/by-category/test-workflow.md) - Intelligent testing
- [**REVIEW**](02-command-reference/by-category/review-workflow.md) - Code review automation
- [**COMPLY**](02-command-reference/by-category/comply-workflow.md) - Compliance checking

### Development
- [**DEBUG**](02-command-reference/by-category/debug-workflow.md) - Debugging assistant
- [**REFACTOR**](02-command-reference/by-category/refactor-workflow.md) - Safe refactoring
- [**API**](02-command-reference/by-category/api-workflow.md) - API development
- [**PERF**](02-command-reference/by-category/perf-workflow.md) - Performance analysis

### Advanced
- [**MIGRATE**](02-command-reference/by-category/migrate-workflow.md) - Migration assistance
- [**LEARN**](02-command-reference/by-category/learn-workflow.md) - Knowledge & learning
- [**MONITOR**](02-command-reference/by-category/monitor-workflow.md) - Production insights
- [**INTEGRATE**](02-command-reference/by-category/integrate-workflow.md) - External services

### Special
- [**AUTONOMOUS**](02-command-reference/by-category/autonomous-workflow.md) - Self-improving loops
- [**CREATIVE & NOVEL**](02-command-reference/by-category/creative-novel.md) - AI-powered insights
- [**SALESFORCE**](02-command-reference/by-category/salesforce-development.md) - Salesforce development

---

## Novel AI Features

SiftCoder includes unique AI features you won't find elsewhere:

| Feature | What It Does | Command |
|---------|--------------|---------|
| **Rubber Duck Debugging** | AI asks YOU questions to help you discover solutions | `/duck` |
| **Ghost Mode** | Explore "what-if" scenarios without touching real code | `/ghost` |
| **Predictive Intent** | Anticipates what you're about to do | `/oracle` |
| **Code Archaeology** | Understand WHY code exists beyond git blame | `/archaeologist` |
| **Technical Debt Fortune Telling** | Predict when debt will cause problems | `/fortune` |
| **Change Impact Visualization** | See ripples before changing | `/ripple` |
| **State Reconstruction Debugging** | Time-travel for app state | `/timewarp` |
| **Developer Pain Detection** | Find frustrating code | `/empathy` |

[Explore all Novel AI features](02-command-reference/by-category/creative-novel.md)

---

## Salesforce Development

Comprehensive Salesforce development support:

| Area | Commands |
|------|----------|
| **Apex** | `/apex`, `/apex analyze`, `/apex bulkify`, `/apex-patterns` |
| **LWC** | `/lwc`, `/lwc create`, `/lwc test`, `/lwc-debug` |
| **Schema** | `/schema`, `/schema create`, `/schema erd` |
| **Integration** | `/sf-connect`, `/sf-webhook` |
| **Testing** | `/sf-test`, `/sf-test-data` |
| **Deployment** | `/sf-deploy`, `/sf-package` |
| **Architecture** | `/sf-architect`, `/sf-architect-review` |

[Salesforce Development Guide](02-command-reference/by-category/salesforce-development.md)

---

## Getting Help

### Not Sure Which Command to Use?

Use the interactive decision guide:
[Choosing the Right Command](07-decision-guides/choosing-the-right-command.md)

### Need Help Crafting a Prompt?

Use the Prompt Helper:
```bash
/siftcoder:prompt                    # Interactive prompt builder
/siftcoder:prompt improve "my prompt"  # Improve existing prompt
```

### Want to Understand Your Codebase?

```bash
/siftcoder:understand                # Quick overview
/siftcoder:understand --deep         # With diagrams
/siftcoder:reverse-spec              # Generate spec from code
```

### Something Not Working?

Check the [Troubleshooting Guide](01-getting-started/troubleshooting.md) or search the [Command Reference](02-command-reference/index.md).

---

## Documentation Structure

```
documentation/
├── README.md                           # ← You are here
├── 01-getting-started/                 # Installation, quick start, concepts
├── 02-command-reference/               # All 103 commands
│   ├── by-category/                    # 21 workflow categories
│   └── alphabetical/                   # A-Z index
├── 03-skills-reference/                # 22 specialized skills
├── 04-agents-reference/                # 11 AI agents
├── 05-workflows/                       # Step-by-step guides
├── 06-use-cases/                       # Real-world scenarios
│   ├── by-developer-type/              # Role-based guides
│   ├── by-task-type/                   # Task-based guides
│   └── by-problem-type/                # Problem-based guides
├── 07-decision-guides/                 # "Which command?" helpers
├── 08-integration/                     # CI/CD, GitHub, Slack
├── 09-best-practices/                  # Workflow patterns, safety
├── 10-advanced-topics/                 # Performance, customization
├── 11-glossary/                        # Terms and concepts
├── 12-appendices/                      # Reference tables
└── templates/                          # Documentation templates
```

---

## Next Steps

1. **New User?** → [Getting Started](01-getting-started/index.md)
2. **Have a task?** → [Decision Guide](07-decision-guides/choosing-the-right-command.md)
3. **Browse commands** → [Command Reference](02-command-reference/index.md)
4. **See examples** → [Use Cases](06-use-cases/index.md)

---

## Links

- **Website**: [https://www.siftcoder.com](https://www.siftcoder.com)
- **Repository**: [https://github.com/ialameh/sift-coder](https://github.com/ialameh/sift-coder)
- **Issues**: [https://github.com/ialameh/sift-coder/issues](https://github.com/ialameh/sift-coder/issues)
- **Blog**: [https://www.siftcoder.com/blog](https://www.siftcoder.com/blog)

---

**SiftCoder v1.0.0** | MIT License | By [Sam Alameh](https://github.com/ialameh)
