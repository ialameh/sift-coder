# Getting Started with SiftCoder

**Your journey to autonomous multi-agent coding workflows**

Welcome to SiftCoder! This guide will help you get up and running quickly, whether you're building a new project, maintaining existing code, or exploring novel AI-powered development tools.

---

## What is SiftCoder?

SiftCoder is a comprehensive AI-powered development assistant for Claude Code that provides:

- **103 specialized commands** across all development workflows
- **11 specialized AI agents** (Planner, Coder, Investigator, Documenter, QA Reviewer, QA Fixer)
- **Autonomous workflows** that plan, code, review, and fix automatically
- **Smart boundaries** to protect your codebase
- **Novel AI features** like rubber duck debugging, ghost mode, and predictive intent

Unlike typical plugins that give suggestions, SiftCoder **does the work** while you stay in control.

---

## 5-Minute Overview

### What You Can Do

| Task | Command | Time |
|------|---------|------|
| Build a new project from spec | `/build <spec>` | 5-30 min |
| Add a feature to existing app | `/add-feature "description"` | 5-20 min |
| Investigate a bug (safely) | `/investigate "issue"` | 2-10 min |
| Fix with boundaries | `/fix "issue"` | 5-15 min |
| Generate architecture docs | `/document architecture` | 2-10 min |
| Run security scan | `/security scan` | 5-15 min |
| Generate tests | `/test generate <file>` | 2-10 min |

### How It Works

```
1. You provide a task or specification
   ↓
2. SiftCoder creates an implementation plan
   ↓
3. Agents collaborate: Plan → Code → Review → Fix
   ↓
4. Quality gates run automatically
   ↓
5. You review and approve
   ↓
6. Changes are applied with checkpoints for rollback
```

**You stay in control** with `/pause`, `/continue`, `/status`, and `/rollback` commands.

---

## Quick Start Paths

Choose the path that matches your situation:

### Path A: I'm Building Something New

**Start here**: [Quick Start Guide](quick-start.md)

```bash
# 1. Create a specification file
cat > my-project-spec.md << 'EOF'
# My Project

## Features
- User authentication with email/password
- Dashboard with charts
- Admin panel for user management
EOF

# 2. Build it
/siftcoder:build my-project-spec.md

# 3. Watch as SiftCoder:
#    - Analyzes the spec
#    - Creates a plan
#    - Implements each feature
#    - Writes tests
#    - Runs quality checks
```

[Full guide: Building a New Project](quick-start.md#building-a-new-project)

---

### Path B: I Have Existing Code

**Start here**: [Working with Existing Codebases](quick-start.md#working-with-existing-code)

```bash
# 1. Understand what you have
/siftcoder:understand

# 2. Add a feature safely
/siftcoder:add-feature "Add password reset functionality"

# 3. Or investigate and fix a bug
/siftcoder:investigate "Login fails after password change"
/siftcoder:fix "Login fails after password change"
```

[Full guide: Working with Existing Code](quick-start.md#working-with-existing-code)

---

### Path C: I'm a Salesforce Developer

**Start here**: [Salesforce Development Quick Start](quick-start.md#salesforce-development)

```bash
# Analyze Apex code
/siftcoder:apex analyze force-app/main/default/classes/

# Create LWC with tests
/siftcoder:lwc create accountList
/siftcoder:lwc test accountList

# Generate schema diagrams
/siftcoder:schema erd
```

[Full guide: Salesforce Development](../02-command-reference/by-category/salesforce-development.md)

---

### Path D: I Just Want to Explore

**Start here**: [Exploring SiftCoder Features](quick-start.md#exploring-siftcoder)

```bash
# Get help crafting a prompt
/siftcoder:prompt

# Rubber duck debugging (AI asks YOU questions!)
/siftcoder:duck "I can't figure out this caching issue"

# Explore "what-if" scenarios
/siftcoder:ghost "What if we switched to event sourcing"

# Predict change impact
/siftcoder:ripple "Renaming User model to Account"
```

[Full guide: Novel AI Features](../02-command-reference/by-category/creative-novel.md)

---

## Installation

> **Important:** SiftCoder is **not available via npm marketplace**. Installation requires cloning the Git repository and building locally.

### Prerequisites
- Claude Code CLI installed and configured
- Node.js 18+ and npm installed
- Git installed

### Install SiftCoder

```bash
# 1. Clone the repository
git clone https://github.com/ialameh/sift-coder.git
cd sift-coder

# 2. Install dependencies
npm install

# 3. Build the project
npm run build

# 4. In Claude Code, run:
/plugin
```

This auto-detects and installs the plugin from the current directory.

**Verify installation:**
```bash
/plugin list
```

You should see `sift-coder` in the list.

**Restart Claude Code** to load all 103 commands.

[Full installation guide in main README](../../README.md#installation)

---

## Your First Command

Let's run your first SiftCoder command to understand your codebase:

```bash
/siftcoder:understand
```

**What happens:**
1. SiftCoder scans your project structure
2. Identifies patterns and conventions
3. Creates a summary of:
   - Project type and tech stack
   - Main components and their roles
   - Dependencies and integrations
   - Testing approach

**Expected output:**
```
🔍 Analyzing project...

📊 Project Overview
   Type: nodejs
   Framework: Express
   Testing: Jest

🏗️ Architecture
   ├── src/
   │   ├── routes/      # API endpoints
   │   ├── services/    # Business logic
   │   └── models/      # Data models
   ├── tests/
   └── package.json

💡 Patterns Detected
   - Route handlers in src/routes/
   - Services for business logic
   - Mongoose for database
```

**For deeper analysis with diagrams:**
```bash
/siftcoder:understand --deep
```

---

## Core Concepts

### 1. Multi-Agent System

SiftCoder uses specialized agents for different roles:

| Agent | Role | When Used |
|-------|------|-----------|
| **Planner** | Creates implementation plans | Breaking down features, investigating issues |
| **Coder** | Implements code | Writing code, tests, making changes |
| **Investigator** | Safe exploration | Understanding bugs, read-only analysis |
| **Documenter** | Generates documentation | Creating docs, diagrams, guides |
| **QA Reviewer** | Validates implementations | Testing, code review, quality checks |
| **QA Fixer** | Fixes issues | Resolving bugs found in review |

**Why multiple agents?**
Each agent has specific tools and permissions. The Planner can't modify files (read-only). The Coder has full development tools. This separation ensures safe, systematic workflows.

### 2. Autonomous Workflows

The default workflow runs automatically:

```
Plan → Code → Quality Gates → Review → Fix → Continue
```

- **Plan**: Break task into subtasks
- **Code**: Implement with tests
- **Quality Gates**: Run format, lint, type-check
- **Review**: QA validates against acceptance criteria
- **Fix**: Address any issues found
- **Continue**: Move to next subtask automatically

**Control the workflow:**
```bash
/siftcoder:pause                    # Stop after current task
/siftcoder:status                   # Check progress
/siftcoder:resume                   # Continue workflow
/siftcoder:checkpoint save my-point  # Save restore point
```

### 3. Safety & Boundaries

When fixing issues, SiftCoder enforces strict boundaries:

```
MODIFIABLE: Files you explicitly approve
PROTECTED:   Everything else (locked)
```

**How it works:**
1. `/investigate` identifies affected files
2. You approve which files can be modified
3. `/fix` works ONLY within approved files
4. Pre-tool hooks block attempts to modify protected files

**Manage scope:**
```bash
/siftcoder:scope show                # View boundaries
/siftcoder:scope add src/auth.ts     # Approve file
/siftcoder:blast-radius              # Verify no unintended changes
```

### 4. State Persistence

All workflow state is saved to `.claude/siftcoder-state/`:

| File | Purpose |
|------|---------|
| `features.json` | Feature queue with status |
| `current-task.json` | Active task details |
| `boundaries.json` | Current scope (modifiable/protected) |
| `knowledge/` | Learned patterns and gotchas |
| `checkpoints/` | Named restore points |

**Checkpoints for rollback:**
```bash
/siftcoder:checkpoint save before-fix
/siftcoder:rollback before-fix
```

---

## Common Workflows

### Workflow 1: Investigate and Fix a Bug

**Safe, systematic bug fixing**

```bash
# 1. Investigate (read-only, no changes)
/siftcoder:investigate "Payments fail for amounts over $1000"

# 2. Review findings
#    - Root cause identified
#    - Affected files listed
#    - Suggested boundaries shown

# 3. Fix with boundaries
/siftcoder:fix "Payments fail for amounts over $1000"
#    Only modifies files you approve

# 4. Verify containment
/siftcoder:blast-radius
#    Ensures protected areas still work
```

[Full guide: Bug Fixing Workflow](../05-workflows/investigate-fix.md)

---

### Workflow 2: Add a Feature

**Adding new functionality safely**

```bash
# 1. Add a feature
/siftcoder:add-feature "Add JWT authentication with refresh tokens"

# 2. SiftCoder:
#    - Analyzes codebase for patterns
#    - Creates implementation plan
#    - Gets your approval
#    - Implements each subtask
#    - Runs quality gates
#    - Tests the implementation
#    - Fixes any issues found

# 3. Check progress
/siftcoder:status

# 4. Pause if needed
/siftcoder:pause
```

[Full guide: Adding Features](../05-workflows/add-feature.md)

---

### Workflow 3: Generate Documentation

**Automated documentation generation**

```bash
# Architecture diagrams
/siftcoder:document architecture

# Inline code documentation
/siftcoder:document code src/services/

# End-user manual
/siftcoder:document user-manual

# Technical/ops documentation
/siftcoder:document technical
```

[Full guide: Documentation Generation](../05-workflows/generate-documentation.md)

---

## What's Next?

### Learn by Doing

1. **[Quick Start Guide](quick-start.md)** - First 5 minutes with SiftCoder
2. **[Installation Guide](installation.md)** - Detailed installation options
3. **[Core Concepts](core-concepts.md)** - Deep dive into multi-agent architecture
4. **[Configuration](configuration.md)** - Customize SiftCoder behavior

### Explore Commands

1. **[Command Reference](../02-command-reference/index.md)** - All 103 commands
2. **[Decision Guide](../07-decision-guides/choosing-the-right-command.md)** - "Which command do I use?"
3. **[By Category](../02-command-reference/by-category/)** - Browse 21 workflow categories

### Real-World Examples

1. **[Use Cases](../06-use-cases/index.md)** - Real-world scenarios
2. **[Workflows](../05-workflows/index.md)** - Step-by-step guides
3. **[Best Practices](../09-best-practices/index.md)** - Workflow patterns

---

## Getting Help

### Not Sure Which Command to Use?

```bash
/siftcoder:prompt
```

Interactive prompt builder that asks questions and generates the perfect command for your task.

### Want to Understand Something?

```bash
/siftcoder:understand                # Codebase overview
/siftcoder:learn explain path/to/file # Deep file explanation
/siftcoder:learn journey "login to checkout" # Follow a flow
```

### Something Not Working?

Check the [Troubleshooting Guide](troubleshooting.md) or search the documentation.

---

## Progressive Learning

### Level 1: Foundation (You are here)
- Installation and first command
- Core concepts
- Basic workflows

**Next**: [Quick Start Guide](quick-start.md)

### Level 2: Proficient
- All 103 commands
- Workflow control
- Advanced features

**Next**: [Command Reference](../02-command-reference/index.md)

### Level 3: Advanced
- Novel AI features
- Custom agents
- Performance optimization

**Next**: [Advanced Topics](../10-advanced-topics/index.md)

---

## Related Documentation

- [Quick Start](quick-start.md) - Your first 5 minutes
- [Installation](installation.md) - Detailed installation guide
- [Core Concepts](core-concepts.md) - Multi-agent architecture explained
- [Configuration](configuration.md) - Customizing SiftCoder
- [Troubleshooting](troubleshooting.md) - Common issues and solutions

---

**Continue to**: [Quick Start Guide](quick-start.md)
