# SiftCoder

**Autonomous Multi-Agent Coding Workflows for Claude Code**

[![Version](https://img.shields.io/badge/version-1.0.0-blue.svg)](https://github.com/ialameh/sift-coder)
[![License](https://img.shields.io/badge/license-MIT-green.svg)](LICENSE)
[![Claude Code](https://img.shields.io/badge/Claude%20Code-Plugin-purple.svg)](https://claude.ai)
[![Website](https://img.shields.io/badge/website-siftcoder.com-brightgreen.svg)](https://www.siftcoder.com)

SiftCoder is the most comprehensive AI-powered software engineering assistant for Claude Code. It provides **90+ specialized commands** across development, testing, documentation, security, debugging, and Salesforce-specific workflows.

**BUILD** new projects, **MAINTAIN** existing code safely, **DOCUMENT** everything, **IDEATE** new features, **SECURE** your code, **TEST** intelligently, **REVIEW** automatically, **DEBUG** faster, **REFACTOR** safely, **OPTIMIZE** performance, **MIGRATE** seamlessly, **EXPLORE** "what-if" scenarios, **PREDICT** developer intent, **ANALYZE** change impact, and more - all with specialized AI agents that plan, code, review, and fix automatically.

## 🌟 Why SiftCoder?

### Unlike Any Other Plugin
SiftCoder isn't just a collection of commands—it's a **revolutionary approach to AI-assisted development** that combines:

- **🤖 Multi-Agent Architecture**: Specialized AI agents (Planner, Coder, Investigator, Documenter, QA Reviewer, QA Fixer) collaborate on your tasks
- **🔄 Autonomous Workflows**: Plan → Code → Review → Fix cycles run automatically while you focus on what matters
- **🛡️ Smart Boundaries**: Protect your codebase with scoped file modifications—only what you approve gets changed
- **💾 Session Persistence**: Pause, resume, and handoff between sessions with full context preservation
- **🔮 Novel AI Features**: Rubber duck debugging, ghost mode for "what-if" exploration, predictive intent, and more

### Built for Real Development
SiftCoder handles **real-world complexity** that other tools can't:
- Legacy codebases with thousands of files
- Salesforce development (Apex, LWC, schemas, deployment)
- Security scanning (OWASP Top 10, secrets, dependencies)
- Performance optimization and profiling
- Test generation with mutation testing
- Architecture diagrams and documentation

---

## Table of Contents

- [Features](#features)
- [Documentation](#documentation)
- [Installation](#installation)
  - [Method 1: Git Clone (Recommended)](#method-1-git-clone-recommended)
  - [Method 2: Direct Plugin Load](#method-2-direct-plugin-load-development)
  - [Method 3: Local Marketplace](#method-3-local-marketplace)
  - [Method 4: Manual Installation](#method-4-manual-installation)
- [Quick Start](#quick-start)
- [Core Concepts](#core-concepts)
  - [Multi-Agent System](#multi-agent-system)
  - [Autonomous Workflows](#autonomous-workflows)
  - [Safety & Boundaries](#safety--boundaries)
  - [State Persistence](#state-persistence)
- [Complete Command Reference](#complete-command-reference)
  - [BUILD Workflow](#build-workflow---new-development)
  - [MAINTAIN Workflow](#maintain-workflow---existing-code)
  - [DOCUMENT Workflow](#document-workflow---documentation-generation)
  - [UNDERSTAND Workflow](#understand-workflow---knowledge-capture)
  - [ANALYZE Workflow](#analyze-workflow---spec-vs-code-comparison)
  - [SECURE Workflow](#secure-workflow---security-analysis)
  - [TEST Workflow](#test-workflow---intelligent-testing)
  - [REVIEW Workflow](#review-workflow---code-review-automation)
  - [DEBUG Workflow](#debug-workflow---debugging-assistant)
  - [REFACTOR Workflow](#refactor-workflow---safe-refactoring)
  - [API Workflow](#api-workflow---api-development)
  - [PERF Workflow](#perf-workflow---performance-analysis)
  - [MIGRATE Workflow](#migrate-workflow---migration-assistant)
  - [LEARN Workflow](#learn-workflow---knowledge--learning)
  - [MONITOR Workflow](#monitor-workflow---production-insights)
  - [COMPLY Workflow](#comply-workflow---compliance--governance)
  - [INTEGRATE Workflow](#integrate-workflow---external-services)
  - [AUTONOMOUS Workflow](#autonomous-workflow---self-improving)
  - [WORKFLOW CONTROL](#workflow-control)
  - [SESSION & STATE](#session--state)
  - [COST & EFFICIENCY](#cost--efficiency)
  - [CREATIVE & NOVEL](#creative--novel---ai-powered-insights)
  - [SALESFORCE DEVELOPMENT](#salesforce-development)
- [Configuration](#configuration)
- [Progressive Enhancement](#progressive-enhancement)
- [Troubleshooting](#troubleshooting)
- [License](#license)

---

## 📖 Documentation

Comprehensive documentation is available in the [`documentation/`](./documentation) folder with multiple navigation paths:

- **[Getting Started](./documentation/01-getting-started/)** - New user overview, quick start, installation
- **[Command Reference](./documentation/02-command-reference/)** - All 103 commands organized by category and alphabetically
- **[Skills Reference](./documentation/03-skills-reference/)** - 22 specialized skills explained
- **[Agents Reference](./documentation/04-agents-reference/)** - 11 AI agents and their capabilities
- **[Workflows](./documentation/05-workflows/)** - Step-by-step workflow guides
- **[Use Cases](./documentation/06-use-cases/)** - Real-world scenarios by developer type, task, and problem
- **[Decision Guides](./documentation/07-decision-guides/)** - Interactive decision trees to find the right command
- **[Best Practices](./documentation/09-best-practices/)** - Workflow patterns and safety techniques
- **[Advanced Topics](./documentation/10-advanced-topics/)** - Customization and expert-level techniques
- **[Glossary](./documentation/11-glossary/)** - Terms and concepts
- **[Appendices](./documentation/12-appendices/)** - Reference tables and cheatsheets

**Quick Links:**
- 📚 [Full Documentation](./documentation/README.md)
- 🚀 [Quick Start Guide](./documentation/01-getting-started/quick-start.md)
- 🌳 [Command Decision Tree](./documentation/07-decision-guides/choosing-the-right-command.md)
- 📋 [Command Cheatsheet](./documentation/12-appendices/index.md#command-cheatsheet)

---

## 🚀 What Makes SiftCoder Different

### Autonomous Workflows That Actually Work
Most plugins give you suggestions. SiftCoder **does the work**:

1. **Plan** - Break down complex tasks into subtasks
2. **Code** - Implement each subtask with proper testing
3. **Quality Gates** - Auto-run formatters, linters, type checkers
4. **Review** - QA agent validates implementation
5. **Fix** - Auto-fix any issues found
6. **Continue** - Move to next task automatically

You stay in control with `/pause`, `/continue`, `/status` commands.

### Safe Exploration Before Modification
```
Investigate First → Understand the Problem → Define Boundaries → Fix Safely
```

- **Investigate Mode**: Read-only exploration of issues without touching code
- **Scope Management**: Explicitly whitelist files for modification
- **Blast Radius Analysis**: Verify changes won't affect protected areas
- **Preview Changes**: See diffs before applying

### Novel AI Features You Won't Find Elsewhere

| Feature | What It Does | Why It Matters |
|---------|--------------|----------------|
| **Rubber Duck Debugging** | AI asks YOU questions, you discover solutions | Teaches you to think better |
| **Ghost Mode** | Explore "what-if" scenarios safely | Test ideas without breaking code |
| **Predictive Intent** | Anticipates what you'll do next | Saves time on repetitive tasks |
| **Code Archaeology** | Understand WHY code exists | Learn from past decisions |
| **Technical Debt Fortune Telling** | Predict when debt will bite | Prioritize what matters |
| **Change Impact Visualization** | See ripples before changing | Prevent unexpected breakage |
| **State Reconstruction Debugging** | Time-travel for app state | Debug impossible-to-reproduce bugs |
| **Developer Pain Detection** | Find frustrating code | Fix problems before complaints |

---

## 📚 Features

### Core Capabilities
- **90+ Slash Commands**: Comprehensive coverage for all software engineering tasks
- **Multi-Agent Architecture**: Specialized agents for planning, coding, reviewing, fixing, investigating, and documenting
- **Autonomous Workflows**: Plan → Code → Review → Fix cycles that run automatically
- **Smart Boundaries**: Protect files from accidental modification with scope management
- **Session Persistence**: Checkpoints, handoffs, and cross-session memory
- **Self-Healing Loops**: Automatically fix build, test, and lint failures

### Specialized Domains
- **Salesforce Development**: 15+ commands for Apex, LWC, schemas, deployment, and architecture
- **Security Analysis**: OWASP checks, secret detection, dependency scanning
- **API Development**: OpenAPI generation, validation, mocking, client SDKs
- **Performance Optimization**: Static analysis, profiling, benchmarking, bundle analysis

### Novel AI Features
- **Rubber Duck Debugging**: Socratic questioning to help you solve problems
- **Ghost Mode**: Explore "what-if" scenarios without touching real code
- **Predictive Intent**: Anticipates what you're about to do before you ask
- **Code Archaeology**: Deep history intelligence beyond git blame
- **Technical Debt Fortune Telling**: Predict when debt becomes problematic
- **Prompt Helper**: Interactive assistant that guides you to craft perfect prompts for any SiftCoder command (generate or improve existing prompts)
- **Self-Healing Loops**: Automatically fix build/test/lint failures with up to 3 retries
- **Test-Driven Development**: Write tests first, then generate code that passes them
- **Parallel Agent Swarms**: Run multiple agents on independent tasks simultaneously

### Specialized Domains
- **Salesforce Development**: 15+ commands for Apex, LWC, schemas, deployment, and architecture
- **Security Analysis**: OWASP checks, secret detection, dependency scanning
- **API Development**: OpenAPI generation, validation, mocking, client SDKs
- **Performance Optimization**: Static analysis, profiling, benchmarking, bundle analysis

---

## 💡 Use Cases

### For Solo Developers
- **"I inherited a legacy codebase and don't know where to start"**
  ```bash
  /siftcoder:understand --deep
  /siftcoder:investigate "Payment flow is broken"
  /siftcoder:fix "Fix payment processing"
  ```

- **"I need to add authentication but don't want to break anything"**
  ```bash
  /siftcoder:add-feature "Add JWT authentication with refresh tokens"
  /siftcoder:test generate src/auth/
  /siftcoder:security owasp
  ```

### For Teams
- **"Our tests are flaky and coverage is low"**
  ```bash
  /siftcoder:test flaky
  /siftcoder:test coverage
  /siftcoder:heal test
  ```

- **"We need to document our system architecture"**
  ```bash
  /siftcoder:document architecture
  /siftcoder:reverse-spec
  /siftcoder:gap-analysis spec.md
  ```

### For Salesforce Developers
- **"I need to create an LWC component with tests"**
  ```bash
  /siftcoder:lwc create accountList
  /siftcoder:lwc test accountList
  /siftcoder:sf-test-data generate Account
  ```

- **"My Apex code has governor limit issues"**
  ```bash
  /siftcoder:apex analyze
  /siftcoder:apex bulkify
  /siftcoder:sf-debug log
  ```

### For Debugging Complex Issues
- **"This bug only happens in production and I can't reproduce it"**
  ```bash
  /siftcoder:timewarp "User checkout flow at 2025-01-15 14:30"
  /siftcoder:monitor errors
  /siftcoder:debug reproduce
  ```

- **"I made a change and broke something unexpected"**
  ```bash
  /siftcoder:debug bisect "Tests started failing"
  /siftcoder:blast-radius
  /siftcoder:rollback <checkpoint-name>
  ```

---

---

## Installation

> **Note:** SiftCoder is **not available via npm marketplace**. Installation requires cloning the Git repository and building locally.

### Prerequisites
- Claude Code CLI installed and configured
- Node.js 18+ and npm installed
- Git installed
- Restart Claude Code after installation

### Method 1: Git Clone (Recommended)

Clone the repository, install dependencies, and build:

```bash
# Clone the repository
git clone https://github.com/ialameh/sift-coder.git
cd sift-coder

# Install dependencies (automatic on first run if skipped)
npm install

# Build the project
npm run build

# Navigate to the plugin directory in Claude Code and run:
/plugin
```

**What happens when you run `/plugin`:**
- Claude Code installs the plugin to its cache directory
- On first session start, the plugin automatically checks for dependencies
- If `node_modules` is missing, it runs `npm install` automatically
- You may see a brief pause on first run while dependencies are installed

### Method 2: Direct Plugin Load (Development)

For development and testing, load the plugin directly:

```bash
# Clone and install
git clone https://github.com/ialameh/sift-coder.git
cd sift-coder
npm install
npm run build

# Run Claude Code with the plugin
claude --plugin-dir /path/to/sift-coder
```

### Method 3: Local Marketplace

1. **Create a local marketplace directory structure:**
```bash
mkdir -p /path/to/local-marketplace/.claude-plugin
mkdir -p /path/to/local-marketplace/plugins
```

2. **Clone sift-coder to the plugins directory:**
```bash
git clone https://github.com/ialameh/sift-coder.git /path/to/local-marketplace/plugins/sift-coder
cd /path/to/local-marketplace/plugins/sift-coder

# Optional: Pre-install dependencies (will be done automatically on first run)
npm install --ignore-scripts
npm run build
```

3. **Create the marketplace.json file:**
```bash
cat > /path/to/local-marketplace/.claude-plugin/marketplace.json << 'EOF'
{
  "name": "local-marketplace",
  "owner": {
    "name": "Local",
    "email": "local@local.dev"
  },
  "homepage": "https://github.com/ialameh/sift-coder",
  "plugins": [
    {
      "name": "sift-coder",
      "source": "./plugins/sift-coder",
      "description": "Autonomous multi-agent coding workflows",
      "version": "1.0.0",
      "author": {
        "name": "Sam Alameh"
      },
      "category": "development"
    }
  ]
}
EOF
```

4. **Add the marketplace and install the plugin:**
```bash
# In Claude Code:
/plugin marketplace add /path/to/local-marketplace
/plugin install sift-coder@local-marketplace
```

5. **Restart Claude Code to load the plugin**

**Note:** If you skip the `npm install` step in step 2, the plugin will automatically install dependencies on first run (may cause a brief pause).

### Method 4: Manual Installation

1. **Copy plugin to Claude's plugin cache:**
```bash
mkdir -p ~/.claude/plugins/cache/local/sift-coder/1.0.0
cp -r /path/to/sift-coder/* ~/.claude/plugins/cache/local/sift-coder/1.0.0/
cp -r /path/to/sift-coder/.claude-plugin ~/.claude/plugins/cache/local/sift-coder/1.0.0/
```

2. **Register in installed_plugins.json:**

Add to `~/.claude/plugins/installed_plugins.json`:
```json
{
  "sift-coder@local": [
    {
      "scope": "user",
      "installPath": "/Users/YOUR_USERNAME/.claude/plugins/cache/local/sift-coder/1.0.0",
      "version": "1.0.0",
      "installedAt": "2026-01-13T00:00:00.000Z",
      "lastUpdated": "2026-01-13T00:00:00.000Z"
    }
  ]
}
```

3. **Enable in settings.json:**

Add to `~/.claude/settings.json`:
```json
{
  "enabledPlugins": {
    "sift-coder@local": true
  }
}
```

4. **Restart Claude Code**

### Verifying Installation

After installation, verify by running:
```bash
/plugin list
```

You should see `sift-coder` in the list of installed plugins. All 90+ commands will be available as `/siftcoder:*` or `/sift-coder:*`.

---

## Quick Start

### Build a New Project from Specification
```bash
/siftcoder:build path/to/spec.md
```
Creates a complete project from your specification file with automatic planning, implementation, and testing.

### Add a Feature to Existing Application
```bash
/siftcoder:add-feature "Add user authentication with OAuth"
```
Analyzes your codebase, creates an implementation plan, and builds the feature.

### Investigate a Bug (Safe, Read-Only)
```bash
/siftcoder:investigate "Payments fail for amounts over $1000"
```
Safely explores the codebase to understand the issue without making any modifications.

### Fix with Defined Boundaries
```bash
/siftcoder:fix "Payments fail for amounts over $1000"
```
Fixes the issue while respecting file boundaries - only modifies files you explicitly allow.

### Generate Documentation
```bash
/siftcoder:document architecture
```
Generates comprehensive Mermaid diagrams showing your system architecture.

### Run Security Scan
```bash
/siftcoder:security scan
```
Performs a complete security audit including OWASP Top 10, secret detection, and dependency vulnerabilities.

### Interactive Pair Programming
```bash
/siftcoder:pair
```
Enters pair programming mode where the AI suggests changes and you approve each step.

---

## Core Concepts

### Multi-Agent System

Sift-Coder uses specialized agents for different roles:

| Agent | Role | Capabilities |
|-------|------|--------------|
| **Planner** | Creates implementation plans | Read-only code analysis, task breakdown |
| **Coder** | Executes coding tasks | All development tools, file modifications |
| **QA Reviewer** | Validates implementations | Tests, code review, quality checks |
| **QA Fixer** | Fixes identified issues | Problem resolution, refactoring |
| **Investigator** | Safe issue investigation | Read-only exploration, root cause analysis |
| **Documenter** | Generates documentation | All documentation tools, diagram generation |

Each agent has specific permissions and tools available, ensuring separation of concerns and safety.

### Autonomous Workflows

The default workflow automatically cycles through:

1. **Plan** - Break down the task into subtasks
2. **Code** - Implement each subtask
3. **Quality Gates** - Run formatters, linters, type checkers
4. **Review** - QA agent validates the implementation
5. **Fix** - Address any issues found
6. **Continue** - Move to next task automatically

Control the workflow with:
- `/siftcoder:pause` - Stop auto-continuation
- `/siftcoder:continue` or `/siftcoder:resume` - Resume workflow
- `/siftcoder:status` - See current progress

### Safety & Boundaries

When fixing issues, Sift-Coder enforces strict boundaries:

```
MODIFIABLE: Files explicitly added to scope
PROTECTED: Everything else (locked from modification)
```

Any attempt to modify protected files is blocked by pre-tool hooks.

**Managing Scope:**
```bash
/siftcoder:scope show              # View current boundaries
/siftcoder:scope add src/file.ts   # Add file to modifiable list
/siftcoder:scope remove src/file.ts # Protect a file
/siftcoder:blast-radius            # Verify changes are contained
```

### State Persistence

All workflow state is stored in `.claude/siftcoder-state/`:

| File | Purpose |
|------|---------|
| `features.json` | Feature queue with status |
| `current-task.json` | Active task details |
| `boundaries.json` | Current scope (modifiable/protected files) |
| `knowledge/` | Learned patterns and gotchas |
| `implementation-log.jsonl` | Event log (JSONL format) |
| `checkpoints/` | Named restore points |
| `config.json` | User configuration |

---

## Complete Command Reference

### BUILD Workflow - New Development

Create new projects and add features to existing applications.

| Command | Description |
|---------|-------------|
| `/siftcoder:build <spec>` | Create a new project from a specification file. Analyzes the spec, creates an implementation plan, and builds the entire project with tests. |
| `/siftcoder:add-feature <description>` | Add a new feature to an existing application. Analyzes the codebase, plans the implementation, and codes the feature. |
| `/siftcoder:organize-project <path>` | Organize an existing project folder into the Sift monorepo structure with proper directory organization. |
| `/siftcoder:features list` | Show the current feature queue and their implementation status. |

**Examples:**
```bash
# Build from specification
/siftcoder:build ./specs/todo-app.md

# Add authentication feature
/siftcoder:add-feature "Add JWT-based authentication with refresh tokens"

# Add a UI component
/siftcoder:add-feature "Create a data table component with sorting and pagination"
```

---

### MAINTAIN Workflow - Existing Code

Safely investigate and fix issues in existing codebases.

| Command | Description |
|---------|-------------|
| `/siftcoder:investigate <issue>` | **Safe read-only investigation** - Explores the codebase to understand an issue without making any modifications. Perfect for understanding bugs before fixing. |
| `/siftcoder:fix <issue>` | **Bounded fix** - Fixes an issue with scope limits. Only modifies files explicitly added to the modifiable scope. |
| `/siftcoder:optimize <area>` | Performance optimization and refactoring for a specific area of the codebase. |
| `/siftcoder:scope show` | View current file boundaries - which files can be modified and which are protected. |
| `/siftcoder:scope add <file>` | Add a file to the modifiable list, allowing it to be changed. |
| `/siftcoder:scope remove <file>` | Protect a file from modification by removing it from the modifiable list. |
| `/siftcoder:blast-radius` | Verify that a fix doesn't affect protected areas. Shows potential impact of changes. |

**Examples:**
```bash
# Investigate a bug (safe, read-only)
/siftcoder:investigate "Users can't log in after password reset"

# Fix with boundaries
/siftcoder:fix "Memory leak in the websocket connection handler"

# Optimize performance
/siftcoder:optimize "Database query performance in the reports module"

# Manage scope
/siftcoder:scope add src/auth/login.ts
/siftcoder:scope show
```

---

### DOCUMENT Workflow - Documentation Generation

Generate comprehensive documentation for your codebase.

| Command | Description |
|---------|-------------|
| `/siftcoder:document code [path]` | Generate inline documentation - docstrings, comments, and type annotations for code files. |
| `/siftcoder:document user-manual` | Create end-user documentation explaining how to use the application. |
| `/siftcoder:document architecture` | Generate system architecture diagrams in Mermaid format showing components, data flow, and relationships. |
| `/siftcoder:document technical` | Create technical documentation including API reference, deployment guides, and operations manuals. |

**Examples:**
```bash
# Document a specific file
/siftcoder:document code src/services/payment.ts

# Generate architecture diagrams
/siftcoder:document architecture

# Create user manual
/siftcoder:document user-manual
```

---

### UNDERSTAND Workflow - Knowledge Capture

Analyze and capture deep understanding of your project.

| Command | Description |
|---------|-------------|
| `/siftcoder:understand` | Analyze the project and capture understanding of its structure, patterns, and architecture. |
| `/siftcoder:understand --deep` | Thorough analysis including dependency graphs, data flows, and Mermaid diagrams. |
| `/siftcoder:reverse-spec` | Generate a specification document from existing code - reverse engineer requirements from implementation. |

**Examples:**
```bash
# Quick understanding
/siftcoder:understand

# Deep analysis with diagrams
/siftcoder:understand --deep

# Generate spec from code
/siftcoder:reverse-spec --area src/checkout
```

---

### ANALYZE Workflow - Spec vs Code Comparison

Bidirectional analysis between specifications and implementation.

| Command | Description |
|---------|-------------|
| `/siftcoder:analyze "<goal>" --pattern "<glob>"` | **NEW** Sequential file analysis with insight extraction. Process multiple files (transcripts, emails, logs) to extract patterns, prioritize, and generate summaries. Auto-checkpoints prevent data loss. |
| `/siftcoder:gap-analysis <spec>` | Compare specification against code to find gaps and extras. Identifies missing implementations and undocumented features. |
| `/siftcoder:ideate <spec>` | Analyze specification and suggest missing features. Available in 3 levels of depth. |
| `/siftcoder:improve-spec` | Enhance specification quality with testable criteria, clearer requirements, and better structure. |

**Analysis Modes:**
- **Quick** - Structure matching only (~2 min)
- **Standard** - + Semantic matching with vectors (~10 min)
- **Deep** - + Full code reading per requirement (~30 min)

**Ideation Levels:**
- **Level 1 (Quick)** - Spec gap analysis, missing essentials (5-10 min)
- **Level 2 (Standard)** - + Market research, competitor analysis, UX best practices (15-30 min)
- **Level 3 (Deep)** - + SEO trends, user personas, innovation opportunities (45-90 min)

**Examples:**
```bash
# Find gaps between spec and code
/siftcoder:gap-analysis ./specs/requirements.md

# Generate feature ideas
/siftcoder:ideate spec.md --level 2

# Improve specification
/siftcoder:improve-spec ./specs/draft.md
```

---

### SECURE Workflow - Security Analysis

Comprehensive security scanning and vulnerability detection.

| Command | Description |
|---------|-------------|
| `/siftcoder:security scan` | Full security audit covering all security categories. |
| `/siftcoder:security secrets` | Detect leaked API keys, passwords, tokens, and other sensitive data in the codebase. |
| `/siftcoder:security deps` | Scan dependencies for known vulnerabilities using CVE databases. |
| `/siftcoder:security owasp` | Check for OWASP Top 10 vulnerabilities including injection, XSS, authentication issues. |

**Examples:**
```bash
# Full security scan
/siftcoder:security scan

# Check for secrets
/siftcoder:security secrets

# Dependency vulnerabilities
/siftcoder:security deps

# OWASP compliance
/siftcoder:security owasp
```

---

### TEST Workflow - Intelligent Testing

Generate, analyze, and improve tests.

| Command | Description |
|---------|-------------|
| `/siftcoder:test generate <file>` | Generate comprehensive tests for a file including happy path, edge cases, error handling, and security tests. |
| `/siftcoder:test coverage` | Analyze test coverage and identify gaps in testing. |
| `/siftcoder:test quality` | Assess test effectiveness - are tests actually testing meaningful behavior? |
| `/siftcoder:test flaky` | Detect and fix flaky tests that pass/fail inconsistently. |
| `/siftcoder:test mutate` | Run mutation testing to verify test robustness - tests that don't catch mutations need improvement. |

**Examples:**
```bash
# Generate tests for a service
/siftcoder:test generate src/services/auth.ts

# Find coverage gaps
/siftcoder:test coverage

# Fix flaky tests
/siftcoder:test flaky

# Mutation testing
/siftcoder:test mutate src/utils/
```

---

### REVIEW Workflow - Code Review Automation

Automated code review and history analysis.

| Command | Description |
|---------|-------------|
| `/siftcoder:review pr <url>` | Review a pull request - analyze changes, identify issues, suggest improvements. |
| `/siftcoder:review diff` | Review currently staged changes before committing. |
| `/siftcoder:review checklist` | Generate a review checklist for the current changes. |
| `/siftcoder:review history <file>` | Understand why code exists by analyzing git history and evolution. |

**Examples:**
```bash
# Review a PR
/siftcoder:review pr https://github.com/org/repo/pull/123

# Review staged changes
/siftcoder:review diff

# Understand file history
/siftcoder:review history src/legacy/processor.ts
```

---

### DEBUG Workflow - Debugging Assistant

Tools for understanding and resolving issues.

| Command | Description |
|---------|-------------|
| `/siftcoder:debug error "<msg>"` | Analyze an error message - explain what it means and suggest fixes. |
| `/siftcoder:debug stacktrace` | Parse and explain a stack trace, identifying the root cause. |
| `/siftcoder:debug reproduce` | Help reproduce an issue with specific steps and conditions. |
| `/siftcoder:debug bisect` | Find the breaking commit using binary search through git history. |
| `/siftcoder:debug trace` | Trace code execution path to understand flow. |

**Examples:**
```bash
# Analyze error
/siftcoder:debug error "TypeError: Cannot read property 'id' of undefined"

# Explain stack trace
/siftcoder:debug stacktrace

# Find breaking commit
/siftcoder:debug bisect "tests/auth.test.ts fails"
```

---

### REFACTOR Workflow - Safe Refactoring

Safe, systematic code improvements.

| Command | Description |
|---------|-------------|
| `/siftcoder:refactor suggest` | Find refactoring opportunities - code smells, duplication, complexity. |
| `/siftcoder:refactor extract` | Extract a function or component from existing code. |
| `/siftcoder:refactor rename` | Safe cross-codebase rename with all references updated. |
| `/siftcoder:refactor debt` | Technical debt analysis with prioritized recommendations. |

**Examples:**
```bash
# Find opportunities
/siftcoder:refactor suggest

# Extract a function
/siftcoder:refactor extract "the validation logic in handleSubmit"

# Rename across codebase
/siftcoder:refactor rename oldFunctionName newFunctionName

# Analyze tech debt
/siftcoder:refactor debt
```

---

### API Workflow - API Development

Tools for designing, documenting, and validating APIs.

| Command | Description |
|---------|-------------|
| `/siftcoder:api document` | Generate OpenAPI/Swagger specification from code. |
| `/siftcoder:api validate` | Validate implementation against OpenAPI specification. |
| `/siftcoder:api breaking` | Detect breaking changes between API versions. |
| `/siftcoder:api mock` | Generate a mock server from API specification. |
| `/siftcoder:api client` | Generate client SDK in various languages. |

**Examples:**
```bash
# Generate OpenAPI spec
/siftcoder:api document

# Check for breaking changes
/siftcoder:api breaking ./openapi-v1.yaml ./openapi-v2.yaml

# Generate mock server
/siftcoder:api mock

# Generate TypeScript client
/siftcoder:api client --language typescript
```

---

### PERF Workflow - Performance Analysis

Performance profiling and optimization.

| Command | Description |
|---------|-------------|
| `/siftcoder:perf analyze` | Static performance analysis - identify potential bottlenecks without running code. |
| `/siftcoder:perf profile` | Runtime profiling guidance - how to profile and interpret results. |
| `/siftcoder:perf benchmark` | Create benchmarks for critical code paths. |
| `/siftcoder:perf bundle` | Analyze bundle size for frontend applications. |

**Examples:**
```bash
# Static analysis
/siftcoder:perf analyze src/services/

# Bundle analysis
/siftcoder:perf bundle

# Create benchmarks
/siftcoder:perf benchmark src/utils/transform.ts
```

---

### MIGRATE Workflow - Migration Assistant

Safe migrations for dependencies and frameworks.

| Command | Description |
|---------|-------------|
| `/siftcoder:migrate upgrade` | Upgrade dependencies safely with compatibility checking. |
| `/siftcoder:migrate framework` | Framework migration assistance (e.g., React Class to Hooks). |
| `/siftcoder:migrate database` | Generate database migrations from schema changes. |
| `/siftcoder:migrate breaking` | Detect breaking changes in dependencies. |

**Examples:**
```bash
# Upgrade dependencies
/siftcoder:migrate upgrade

# Migrate framework
/siftcoder:migrate framework "React 17 to React 18"

# Generate DB migrations
/siftcoder:migrate database
```

---

### LEARN Workflow - Knowledge & Learning

Interactive learning and onboarding tools.

| Command | Description |
|---------|-------------|
| `/siftcoder:learn codebase` | Interactive codebase tour - guided exploration of the project. |
| `/siftcoder:learn onboard` | Generate onboarding documentation for new team members. |
| `/siftcoder:learn explain <file>` | Deep explanation of a file - what it does, why it exists, how it works. |
| `/siftcoder:learn journey` | Follow a user flow through the code (e.g., "login to checkout"). |

**Examples:**
```bash
# Interactive tour
/siftcoder:learn codebase

# Explain complex file
/siftcoder:learn explain src/core/engine.ts

# Follow user journey
/siftcoder:learn journey "user clicks checkout button"
```

---

### MONITOR Workflow - Production Insights

Tools for understanding production behavior.

| Command | Description |
|---------|-------------|
| `/siftcoder:monitor logs` | Analyze log patterns and anomalies. |
| `/siftcoder:monitor errors` | Cluster and analyze production errors. |
| `/siftcoder:monitor alerts` | Alert fatigue analysis - identify noisy alerts. |
| `/siftcoder:monitor health` | System health assessment and recommendations. |

---

### COMPLY Workflow - Compliance & Governance

Compliance checking and governance tools.

| Command | Description |
|---------|-------------|
| `/siftcoder:comply licenses` | Audit dependency licenses for compatibility. |
| `/siftcoder:comply sbom` | Generate Software Bill of Materials. |
| `/siftcoder:comply gdpr` | GDPR and privacy compliance checking. |
| `/siftcoder:comply standards` | Check against coding standards and conventions. |

---

### INTEGRATE Workflow - External Services

Integration with external tools and services.

| Command | Description |
|---------|-------------|
| `/siftcoder:integrate github` | Set up GitHub/GitLab integration. |
| `/siftcoder:integrate issues` | Sync with issue trackers (Jira, Linear, etc.). |
| `/siftcoder:integrate slack` | Configure Slack notifications. |
| `/siftcoder:integrate ci` | Set up CI/CD pipeline configuration. |

---

### AUTONOMOUS Workflow - Self-Improving

Self-healing and parallel execution capabilities.

| Command | Description |
|---------|-------------|
| `/siftcoder:heal` | **Self-healing loop** - Automatically run build/test/lint and fix failures. Retries up to 3 times with different approaches. |
| `/siftcoder:heal build` | Run build and auto-fix any failures. |
| `/siftcoder:heal test` | Run tests and auto-fix failing tests. |
| `/siftcoder:heal lint` | Run linter and auto-fix issues. |
| `/siftcoder:smart-retry` | Learn from failures and try different approaches automatically. |
| `/siftcoder:swarm start <tasks>` | **Parallel agent execution** - Run multiple agents on independent tasks simultaneously with conflict detection. |
| `/siftcoder:tdd <feature>` | **Test-driven generation** - Write tests first, then generate code that passes them. |

**Examples:**
```bash
# Self-heal everything
/siftcoder:heal

# Fix build issues
/siftcoder:heal build

# TDD workflow
/siftcoder:tdd "user registration with email verification"

# Parallel execution
/siftcoder:swarm start "add login page, add signup page, add password reset"
```

---

### WORKFLOW CONTROL

Control the autonomous workflow.

| Command | Description |
|---------|-------------|
| `/siftcoder:status` | Show current progress, active task, and resume context. |
| `/siftcoder:pause` | Pause auto-continuation - workflow stops after current task. |
| `/siftcoder:continue` | Resume workflow from where you left off. |
| `/siftcoder:resume` | Alias for `/siftcoder:continue`. |
| `/siftcoder:focus <target>` | Focus on a specific feature, area, or file set. |
| `/siftcoder:pair` | Enter **interactive pair programming mode** - AI suggests, you approve each step. |
| `/siftcoder:missing` | Check what's not yet implemented from spec or feature queue. |
| `/siftcoder:prompt` | **Prompt Helper** - Interactive guide to craft perfect prompts for any SiftCoder command. Answer questions and get production-ready prompts. |
| `/siftcoder:prompt improve "<prompt>"` | **Improve existing prompts** - Analyze prompt quality, get score, receive enhanced version with missing details. |

---

### SESSION & STATE

Manage session state and checkpoints.

| Command | Description |
|---------|-------------|
| `/siftcoder:checkpoint` | Save a named checkpoint with full context for later restoration. |
| `/siftcoder:checkpoint save <name>` | Save checkpoint with specific name. |
| `/siftcoder:checkpoint restore <name>` | Restore to a named checkpoint. |
| `/siftcoder:checkpoint list` | List all available checkpoints. |
| `/siftcoder:handoff` | Session memory for cross-session continuity - persist context across Claude Code sessions. |
| `/siftcoder:preview` | Preview changes before applying - show diff with approval step. |
| `/siftcoder:trace` | View execution trace - see what AI did, why, and alternative approaches considered. |
| `/siftcoder:rollback <id>` | Rollback to a specific checkpoint. |

---

### COST & EFFICIENCY

Track and optimize token usage.

| Command | Description |
|---------|-------------|
| `/siftcoder:budget` | View current token/cost usage and statistics. |
| `/siftcoder:budget set <tokens>` | Set a token budget for the current session. |
| `/siftcoder:budget optimize` | Get suggestions for reducing token usage. |

---

### CREATIVE & NOVEL - AI-Powered Insights

Innovative AI features that go beyond traditional development tools.

| Command | Description |
|---------|-------------|
| `/siftcoder:duck` | **AI Rubber Duck Debugging** - Forces YOU to explain the code. The AI asks probing Socratic questions instead of giving answers, helping you discover the solution yourself. |
| `/siftcoder:empathy` | **Developer Pain Point Detection** - Finds frustrating code and measures cognitive load. Identifies code that causes developer suffering before they complain. |
| `/siftcoder:ghost` | **Parallel Universe Exploration** - Explore "what-if" architectural changes safely. Test alternative implementations, compare approaches, and apply or discard without touching real code. |
| `/siftcoder:oracle` | **Predictive Intent Engine** - Anticipates what you're about to do before you ask based on patterns and context. |
| `/siftcoder:timewarp` | **State Reconstruction Debugging** - Reconstruct exact application state at any point in history for debugging. |
| `/siftcoder:archaeologist` | **Deep Code History Intelligence** - Understand why code exists beyond git blame. Discovers the full story of how code evolved. |
| `/siftcoder:narrator` | **Code-to-Story Translation** - Converts code into narrative explanations for any audience - PMs, executives, new developers. |
| `/siftcoder:dream` | **Generative Exploration Mode** - AI generates creative solutions without constraints, then filters to feasible implementations. |
| `/siftcoder:invariant` | **Automatic Contract Mining** - Discovers implicit invariants in your code and generates explicit assertions. |
| `/siftcoder:chaos` | **Intelligent Chaos Engineering** - Generates architecture-aware failure scenarios tailored to your specific system. |
| `/siftcoder:fuzz-mind` | **Intelligent Edge Case Generation** - AI-generated adversarial test cases targeting code weak points. |
| `/siftcoder:ripple` | **Change Impact Visualization** - See how a change ripples through your entire system before making it. |
| `/siftcoder:fortune` | **Technical Debt Fortune Telling** - Predicts which tech debt will cause problems and when based on patterns. |
| `/siftcoder:polyglot` | **Cross-Language Intelligence** - Ensures consistency across TypeScript, Python, Go, SQL, and other languages in polyglot projects. |
| `/siftcoder:zen` | **Minimalist Code Mode** - Aggressively simplifies code, removing every non-essential line. |

**Examples:**
```bash
# Rubber duck debugging
/siftcoder:duck "I can't figure out why the cache is stale"

# Explore architectural change
/siftcoder:ghost "what if we switched to event sourcing"

# Predict impact
/siftcoder:ripple "renaming the User model to Account"

# Find frustrating code
/siftcoder:empathy

# Code archaeology
/siftcoder:archaeologist src/legacy/magic_numbers.ts
```

---

### SALESFORCE DEVELOPMENT

Comprehensive Salesforce development commands for Apex, LWC, schemas, and deployment.

#### Apex Development

| Command | Description |
|---------|-------------|
| `/siftcoder:apex` | Apex code analysis - find anti-patterns, bulkification issues, governor limit violations. |
| `/siftcoder:apex analyze` | Deep analysis of Apex code for issues. |
| `/siftcoder:apex bulkify` | Convert non-bulk code to bulk-safe patterns. |
| `/siftcoder:apex-patterns` | Generate enterprise Apex patterns - FFLib, Selector, Domain, Service, Unit of Work. |

#### Lightning Web Components

| Command | Description |
|---------|-------------|
| `/siftcoder:lwc` | Create, analyze, and test Lightning Web Components. |
| `/siftcoder:lwc create <name>` | Create a new LWC with best practices. |
| `/siftcoder:lwc wire` | Set up wire adapters correctly. |
| `/siftcoder:lwc test` | Generate Jest tests for LWC. |
| `/siftcoder:lwc-debug` | Debug LWC issues - wire problems, lifecycle hooks, performance, component state. |

#### Schema Management

| Command | Description |
|---------|-------------|
| `/siftcoder:schema` | Create and manage Salesforce objects, fields, and relationships. |
| `/siftcoder:schema create` | Create new custom objects or fields. |
| `/siftcoder:schema erd` | Generate Entity Relationship Diagram. |
| `/siftcoder:schema-migrate` | Schema migration management - plan, diff, deploy, rollback schema changes. |

#### Integration & Webhooks

| Command | Description |
|---------|-------------|
| `/siftcoder:sf-connect` | Set up Named Credentials, External Credentials, OAuth configuration. |
| `/siftcoder:sf-webhook` | Create inbound webhook endpoints with HMAC verification and Platform Event publishing. |

#### Testing & Data

| Command | Description |
|---------|-------------|
| `/siftcoder:sf-test` | Comprehensive Apex test generation - coverage analysis, bulk testing, mocking. |
| `/siftcoder:sf-test-data` | Test data management - factories, seed data, data sanitization. |

#### Debugging & Logging

| Command | Description |
|---------|-------------|
| `/siftcoder:sf-debug` | Debug log analysis - parse logs, identify bottlenecks, governor limit tracking. |
| `/siftcoder:sf-log` | Set up custom logging framework with Platform Events and real-time monitoring. |

#### Deployment & Packaging

| Command | Description |
|---------|-------------|
| `/siftcoder:sf-deploy` | Deployment management - validate, deploy, diff between orgs, rollback, CI/CD setup. |
| `/siftcoder:sf-package` | Unlocked package development - versioning, dependencies, namespace management. |

#### Architecture

| Command | Description |
|---------|-------------|
| `/siftcoder:sf-architect` | Architecture tools - data model diagrams, capacity planning, integration patterns. |
| `/siftcoder:sf-architect-review` | Architecture review - security, scalability, governor limits, sharing model analysis. |

**Examples:**
```bash
# Analyze Apex for issues
/siftcoder:apex analyze force-app/main/default/classes/

# Generate FFLib patterns
/siftcoder:apex-patterns AccountDomain

# Create LWC with tests
/siftcoder:lwc create accountSelector

# Debug LWC wire issues
/siftcoder:lwc-debug wire accountComponent

# Schema ERD
/siftcoder:schema erd

# Deploy with validation
/siftcoder:sf-deploy validate

# Architecture review
/siftcoder:sf-architect-review
```

---

## Configuration

Edit `.claude/siftcoder-state/config.json` to customize behavior:

```json
{
  "mode": "autonomous",
  "autoContinue": true,
  "maxIterations": 10,
  "autoCommit": true,
  "qualityGates": {
    "format": true,
    "lint": true,
    "typeCheck": true,
    "tests": true
  },
  "healing": {
    "maxRetries": 3,
    "autoLintFix": true,
    "addToGotchas": true,
    "respectBoundaries": true,
    "escalateAfterMax": true
  }
}
```

### Configuration Options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `mode` | string | `"autonomous"` | Workflow mode: `"autonomous"`, `"interactive"`, `"pair"` |
| `autoContinue` | boolean | `true` | Automatically continue to next task after completing one |
| `maxIterations` | number | `10` | Maximum iterations for fix/heal loops |
| `autoCommit` | boolean | `true` | Automatically commit after successful changes |
| `qualityGates.format` | boolean | `true` | Run formatter after code changes |
| `qualityGates.lint` | boolean | `true` | Run linter after code changes |
| `qualityGates.typeCheck` | boolean | `true` | Run type checker after code changes |
| `qualityGates.tests` | boolean | `true` | Run tests after code changes |
| `healing.maxRetries` | number | `3` | Maximum retries for self-healing |
| `healing.autoLintFix` | boolean | `true` | Automatically apply lint fixes |

---

## Progressive Enhancement

### Tier 1: Core Plugin (Works Immediately)

Everything in this plugin works out of the box with no external dependencies. All 90+ commands are available immediately after installation.

### Tier 2: siftcoder-mcp (Optional)

For enhanced semantic search and knowledge management:

```bash
npm install -g @siftcoder/mcp
```

Adds:
- **LanceDB vector search** for semantic code understanding
- **Ollama embeddings** for local AI-powered search
- Configured via `.mcp.json`

### Tier 3: ContextDigger (Optional)

If you have ContextDigger installed separately, Sift-Coder integrates with it for:
- **100x faster codebase scanning**
- **Automatic area discovery**
- **Mermaid diagram generation**
- **Governance budgets**

---

## Plugin Structure

```
sift-coder/
├── .claude-plugin/
│   └── plugin.json           # Plugin manifest (required)
├── commands/                  # 88 .md files defining slash commands
│   ├── siftcoder.md
│   ├── build.md
│   ├── fix.md
│   ├── investigate.md
│   └── ...
├── agents/                    # Agent role definitions
│   ├── coder.md
│   ├── documenter.md
│   ├── investigator.md
│   ├── planner.md
│   ├── qa-fixer.md
│   └── qa-reviewer.md
├── skills/                    # 10 specialized skills
│   ├── diagram-generator/
│   ├── gap-analyzer/
│   ├── market-researcher/
│   ├── organize-project/
│   ├── pattern-detector/
│   ├── quality-gates/
│   ├── security-scanner/
│   ├── seo-researcher/
│   ├── siftcoder-workflow/
│   ├── spec-analyzer/
│   └── ux-analyzer/
├── hooks/
│   └── hooks.json            # Hook configurations
├── scripts/
│   ├── boundary-enforcer.sh  # Enforce file scope limits
│   ├── inject-knowledge.sh   # Load learned patterns
│   ├── should-continue.sh    # Check auto-continuation
│   └── quality-gates/
│       ├── format.sh
│       ├── lint.sh
│       └── type-check.sh
├── .mcp.json                 # MCP server configs (optional)
└── README.md
```

---

## Troubleshooting

### Plugin Not Loading

1. **Verify plugin.json is valid JSON** (no trailing commas, correct format)
2. **Ensure plugin.json only has required fields:** `name`, `description`, `version`, `author`
3. **Check that hooks.json is valid JSON**
4. **Restart Claude Code** after installation

### Commands Not Appearing

1. Run `/plugin list` to verify installation
2. Check that `commands/` directory contains `.md` files
3. Verify `enabledPlugins` includes your plugin in `~/.claude/settings.json`

### Hooks Not Firing

1. Verify `hooks/hooks.json` syntax is correct
2. Check script permissions: `chmod +x scripts/*.sh`
3. Use `${CLAUDE_PLUGIN_ROOT}` for script paths in hooks

### Scope/Boundary Errors

1. Run `/siftcoder:scope show` to see current boundaries
2. Add files with `/siftcoder:scope add <file>`
3. Check `.claude/siftcoder-state/boundaries.json`

### State Issues

1. Clear state: `rm -rf .claude/siftcoder-state/`
2. Reinitialize with next command
3. Check file permissions in `.claude/` directory

---

## Contributing

Contributions are welcome! Please see the repository for guidelines.

## Author

**Sam Alameh** ([@ialameh](https://github.com/ialameh))

## License

MIT License - see [LICENSE](LICENSE) for details.

---

## Links

- **📚 Documentation**: [./documentation/](./documentation/) - Complete plugin documentation with guides and references
- **🌐 Website**: [https://www.siftcoder.com](https://www.siftcoder.com) - Full documentation, examples, and guides
- **📦 Repository**: [https://github.com/ialameh/sift-coder](https://github.com/ialameh/sift-coder)
- **🐛 Issues**: [https://github.com/ialameh/sift-coder/issues](https://github.com/ialameh/sift-coder/issues)
- **🤖 Claude Code**: [https://claude.ai](https://claude.ai)
- **📝 Blog**: [https://www.siftcoder.com/blog](https://www.siftcoder.com/blog) - In-depth articles on features and workflows

---

## Quick Command Reference

### Most Used Commands
```bash
/siftcoder:build <spec>              # Build from specification
/siftcoder:add-feature <desc>        # Add feature to existing code
/siftcoder:fix <issue>               # Fix with boundaries
/siftcoder:investigate <issue>       # Safe read-only investigation
/siftcoder:document architecture     # Generate architecture diagrams
/siftcoder:test generate <file>      # Generate comprehensive tests
/siftcoder:security scan             # Full security audit
/siftcoder:prompt                    # Get help crafting prompts
/siftcoder:status                    # Show current progress
```

### Workflow Control
```bash
/siftcoder:pause                     # Stop auto-continuation
/siftcoder:continue                  # Resume workflow
/siftcoder:checkpoint save <name>    # Save restore point
/siftcoder:checkpoint restore <name> # Restore to checkpoint
/siftcoder:scope show                # View file boundaries
```

### Salesforce Commands
```bash
/siftcoder:apex analyze              # Analyze Apex code
/siftcoder:lwc create <name>         # Create LWC with tests
/siftcoder:schema erd                # Generate entity diagrams
/siftcoder:sf-deploy validate        # Validate deployment
```

---
