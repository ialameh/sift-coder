# /siftcoder:help - Comprehensive Help & Guidance

Your guide to siftcoder - the autonomous multi-agent coding system.

## Usage

```
/siftcoder:help [topic]
```

## Arguments
- `$ARGUMENTS` - Optional topic: `workflows`, `commands`, `agents`, `examples`, `faq`, or specific command name

## Instructions

You are the siftcoder help assistant. Provide friendly, comprehensive guidance based on what the user needs.

---

## Phase 1: Determine Help Needed

If no topic specified, show the interactive help menu:

**Use AskUserQuestion tool:**
```
Question: "What would you like help with?"
Header: "Help Topic"
Options:
- "Getting Started" - "New to siftcoder? Start here!"
- "Browse Commands" - "See all available commands with examples"
- "Understand Workflows" - "BUILD, MAINTAIN, DOCUMENT, IDEATE explained"
- "See Examples" - "Real-world usage examples"
```

---

## Getting Started Guide

If user selects "Getting Started" or runs `/siftcoder:help start`:

```
WELCOME TO SIFTCODER

siftcoder is your autonomous coding assistant that can:
├── BUILD new projects from specifications
├── MAINTAIN existing code safely with boundaries
├── DOCUMENT your codebase automatically
└── IDEATE new features with market research

HOW IT WORKS

siftcoder uses specialized AI agents:
┌─────────────┬────────────────────────────────────┐
│ Agent       │ What it does                       │
├─────────────┼────────────────────────────────────┤
│ Planner     │ Creates implementation plans       │
│ Coder       │ Writes the actual code             │
│ QA Reviewer │ Validates everything works         │
│ QA Fixer    │ Fixes any issues found             │
│ Investigator│ Safely explores bugs (read-only)   │
│ Documenter  │ Generates documentation            │
└─────────────┴────────────────────────────────────┘

RECOMMENDED FIRST COMMANDS

For a new project:
  /siftcoder:ideate "describe what you want to build"

For existing code:
  /siftcoder:understand

To explore safely:
  /siftcoder:investigate "describe the issue"

NEED MORE HELP?

  /siftcoder:help commands    - See all commands
  /siftcoder:help examples    - Real usage examples
  /siftcoder:wizard           - Guided walkthrough
```

---

## Command Reference

If user selects "Browse Commands" or runs `/siftcoder:help commands`:

```
SIFTCODER COMMAND REFERENCE

siftcoder has 18 command categories covering the complete
software engineering lifecycle.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 UNDERSTAND - Capture Knowledge
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

/siftcoder:understand
  Analyze your codebase and capture patterns, architecture,
  and gotchas for future sessions.

  Examples:
    /siftcoder:understand
    /siftcoder:understand --deep
    /siftcoder:understand --area src/components

/siftcoder:reverse-spec
  Generate a specification document from existing code.
  Useful for documentation or rebuilding in new tech.

  Examples:
    /siftcoder:reverse-spec
    /siftcoder:reverse-spec --format json
    /siftcoder:reverse-spec --area src/api

/siftcoder:reverse-prompt
  Generate a single ~150-word conversational prompt that
  would rebuild this project from scratch via any AI agent.
  Quick, deep, and focus modes. Local cache.

  Examples:
    /siftcoder:reverse-prompt
    /siftcoder:reverse-prompt --mode deep
    /siftcoder:reverse-prompt --focus "the auth flow"
    /siftcoder:reverse-prompt --repo <github-url>

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 BUILD - New Development
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

/siftcoder:build <spec>
  Create a new project from a specification file.

  Examples:
    /siftcoder:build ./SPEC.md
    /siftcoder:build "A todo app with user auth"

/siftcoder:add-feature <description>
  Add a feature to an existing project. Detects your
  coding patterns and follows them.

  Examples:
    /siftcoder:add-feature "Add dark mode toggle"
    /siftcoder:add-feature "User profile page with avatar upload"

/siftcoder:features
  Manage the feature queue.

  Examples:
    /siftcoder:features list
    /siftcoder:features add "New feature idea"

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 MAINTAIN - Existing Code (Safe)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

/siftcoder:investigate <issue>
  SAFE: Read-only investigation. Cannot modify any files.
  Perfect for understanding bugs before fixing.

  Examples:
    /siftcoder:investigate "Why do payments fail over $1000?"
    /siftcoder:investigate "Login sometimes shows blank screen"

/siftcoder:fix <issue>
  Fix an issue with BOUNDARIES. Only modifies files you approve.
  Protected files cannot be changed.

  Examples:
    /siftcoder:fix "Payment overflow bug"
    /siftcoder:fix "Memory leak in image upload"

/siftcoder:optimize <area>
  Refactor or improve performance in a specific area.

  Examples:
    /siftcoder:optimize src/utils
    /siftcoder:optimize "database queries"

/siftcoder:scope
  Manage which files can be modified during fixes.

  Examples:
    /siftcoder:scope show
    /siftcoder:scope add src/payment.ts
    /siftcoder:scope remove src/auth.ts

/siftcoder:blast-radius
  Verify your changes don't break protected areas.
  Runs tests on files outside your scope.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 DOCUMENT - Documentation
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

/siftcoder:document <type>
  Generate documentation automatically.

  Types:
    code          - Docstrings, comments, inline docs
    user-manual   - End-user documentation
    architecture  - Mermaid diagrams, code maps
    technical     - API docs, deployment guides

  Examples:
    /siftcoder:document code
    /siftcoder:document architecture
    /siftcoder:document user-manual

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 IDEATE - Feature Discovery
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

/siftcoder:ideate <spec-or-description>
  Analyze specs and suggest features with market research.
  Interactive - asks what you need.

  Examples:
    /siftcoder:ideate ./my-spec.md
    /siftcoder:ideate "I want to build a fitness app"
    /siftcoder:ideate "E-commerce platform for handmade goods"

/siftcoder:surprise-me
  Don't know what to build? Let siftcoder discover trending
  app ideas from the web, filter by your interests, and
  generate a complete spec ready to build.

  Flow: Web research -> Categories -> Filter -> Personalize
        -> Generate spec -> Optional immediate build

  Examples:
    /siftcoder:surprise-me

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 ANALYZE - Spec vs Code
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

/siftcoder:gap-analysis <spec>
  Find gaps between spec and code (bidirectional).
  Finds missing implementations AND undocumented features.

  Examples:
    /siftcoder:gap-analysis ./SPEC.md

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 SECURE - Security Analysis
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

/siftcoder:security scan
  Full security audit - secrets, deps, OWASP patterns.

/siftcoder:security secrets
  Detect leaked API keys, passwords, tokens.

/siftcoder:security deps
  Scan dependencies for vulnerabilities.

/siftcoder:security owasp
  Check for OWASP Top 10 vulnerabilities.

  Examples:
    /siftcoder:security scan
    /siftcoder:security secrets --fix

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 TEST - Intelligent Testing
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

/siftcoder:test generate <file>
  Generate tests for a file or function.

/siftcoder:test coverage
  Analyze coverage gaps with prioritization.

/siftcoder:test quality
  Assess if tests are actually effective.

/siftcoder:test flaky
  Find and fix flaky tests.

  Examples:
    /siftcoder:test generate src/services/auth.ts
    /siftcoder:test coverage

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 REVIEW - Code Review Automation
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

/siftcoder:review pr <url>
  Comprehensive PR review - security, bugs, style.

/siftcoder:review diff
  Review your staged changes before commit.

/siftcoder:review checklist
  Generate project-specific review checklist.

  Examples:
    /siftcoder:review pr https://github.com/org/repo/pull/123
    /siftcoder:review diff

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 DEBUG - Debugging Assistant
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

/siftcoder:debug error "<message>"
  Analyze an error message and find solutions.

/siftcoder:debug stacktrace
  Parse and explain a stack trace.

/siftcoder:debug bisect
  Find the commit that introduced a bug.

  Examples:
    /siftcoder:debug error "Cannot read property 'map' of undefined"
    /siftcoder:debug bisect "Login page crashes"

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 REFACTOR - Safe Refactoring
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

/siftcoder:refactor suggest
  Find code smells and refactoring opportunities.

/siftcoder:refactor debt
  Analyze and prioritize technical debt.

/siftcoder:refactor extract
  Extract function/component safely.

/siftcoder:refactor rename
  Safe cross-codebase rename.

  Examples:
    /siftcoder:refactor suggest
    /siftcoder:refactor debt

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 API - API Development Suite
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

/siftcoder:api document
  Generate OpenAPI spec from code.

/siftcoder:api validate
  Validate implementation against spec.

/siftcoder:api breaking
  Detect breaking changes between versions.

/siftcoder:api mock
  Generate mock server for testing.

  Examples:
    /siftcoder:api document
    /siftcoder:api breaking v1.0.0 v2.0.0

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 PERF - Performance Analysis
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

/siftcoder:perf analyze
  Find performance issues - N+1 queries, memory leaks.

/siftcoder:perf bundle
  Analyze and optimize bundle size.

/siftcoder:perf benchmark
  Create performance benchmarks.

  Examples:
    /siftcoder:perf analyze
    /siftcoder:perf bundle

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 MIGRATE - Migration Assistant
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

/siftcoder:migrate upgrade
  Upgrade dependencies safely with impact analysis.

/siftcoder:migrate framework
  Migrate frameworks (e.g., React 17 → 18).

/siftcoder:migrate database
  Generate database migrations from schema changes.

  Examples:
    /siftcoder:migrate upgrade
    /siftcoder:migrate framework react@18

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 LEARN - Knowledge & Learning
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

/siftcoder:learn codebase
  Interactive tour of the codebase.

/siftcoder:learn onboard
  Generate onboarding documentation.

/siftcoder:learn explain <file>
  Deep explanation of any file.

/siftcoder:learn journey "<flow>"
  Follow a user flow through the code.

  Examples:
    /siftcoder:learn codebase
    /siftcoder:learn journey "checkout process"

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 MONITOR - Production Insights
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

/siftcoder:monitor logs <file>
  Analyze log patterns and anomalies.

/siftcoder:monitor errors
  Cluster and diagnose production errors.

/siftcoder:monitor alerts
  Reduce alert fatigue with analysis.

  Examples:
    /siftcoder:monitor logs /var/log/app.log
    /siftcoder:monitor errors

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 COMPLY - Compliance & Governance
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

/siftcoder:comply licenses
  Audit dependency licenses for compatibility.

/siftcoder:comply sbom
  Generate Software Bill of Materials.

/siftcoder:comply gdpr
  Check GDPR/privacy compliance.

  Examples:
    /siftcoder:comply licenses
    /siftcoder:comply sbom

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 INTEGRATE - External Services
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

/siftcoder:integrate github
  Set up GitHub automation (labels, CODEOWNERS, etc).

/siftcoder:integrate issues
  Sync with issue trackers (Linear, Jira).

/siftcoder:integrate slack
  Set up Slack notifications.

/siftcoder:integrate ci
  Configure CI/CD pipelines.

  Examples:
    /siftcoder:integrate github
    /siftcoder:integrate ci github-actions

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 UTILITY
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

/siftcoder:status      - Show current progress
/siftcoder:pause       - Pause autonomous workflow
/siftcoder:resume      - Resume paused workflow
/siftcoder:rollback    - Rollback to checkpoint
/siftcoder:knowledge   - Query learned patterns
/siftcoder:help        - This help system
/siftcoder:examples    - See real usage examples
/siftcoder:wizard      - Guided walkthrough
```

---

## Workflow Explanation

If user selects "Understand Workflows" or runs `/siftcoder:help workflows`:

```
SIFTCODER WORKFLOWS EXPLAINED

┌─────────────────────────────────────────────────────────┐
│                    UNDERSTAND                            │
│                        ↓                                 │
│    Captures patterns, architecture, gotchas              │
│    Stores knowledge for all future sessions              │
└─────────────────────────────────────────────────────────┘
                         ↓
┌─────────────────────────────────────────────────────────┐
│                      IDEATE                              │
│                        ↓                                 │
│    Analyzes specs → Market research → UX analysis        │
│    Suggests features with prioritization                 │
└─────────────────────────────────────────────────────────┘
                         ↓
┌─────────────────────────────────────────────────────────┐
│                      BUILD                               │
│                        ↓                                 │
│    Planner → Coder → QA Reviewer → QA Fixer             │
│    Autonomous loop until feature complete                │
└─────────────────────────────────────────────────────────┘
                         ↓
┌─────────────────────────────────────────────────────────┐
│                    MAINTAIN                              │
│                        ↓                                 │
│    Investigate (safe) → Fix (bounded) → Validate        │
│    Protected files CANNOT be modified                    │
└─────────────────────────────────────────────────────────┘
                         ↓
┌─────────────────────────────────────────────────────────┐
│                    DOCUMENT                              │
│                        ↓                                 │
│    Code docs → User manuals → Architecture diagrams     │
│    Keeps documentation in sync with code                 │
└─────────────────────────────────────────────────────────┘


TYPICAL PROJECT LIFECYCLE

1. New Project:
   /siftcoder:ideate "my idea"     ← Get feature suggestions
   /siftcoder:build spec.md        ← Build it
   /siftcoder:document architecture ← Document it

2. Existing Project:
   /siftcoder:understand           ← Learn the codebase
   /siftcoder:add-feature "..."    ← Add features
   /siftcoder:investigate "bug"    ← Explore issues safely
   /siftcoder:fix "bug"            ← Fix with boundaries

3. Maintenance:
   /siftcoder:optimize src/        ← Improve code
   /siftcoder:document code        ← Update docs
   /siftcoder:blast-radius         ← Verify nothing broke
```

---

## Specific Command Help

If user runs `/siftcoder:help <command-name>`:

Read the command file and provide a detailed explanation with:
1. What it does
2. When to use it
3. Example usage
4. Common options
5. Related commands

---

## FAQ

If user runs `/siftcoder:help faq`:

```
FREQUENTLY ASKED QUESTIONS

Q: Will siftcoder break my code?
A: The MAINTAIN workflow uses boundaries. You specify which
   files can be modified. Everything else is PROTECTED and
   cannot be changed. Use /siftcoder:investigate first for
   read-only exploration.

Q: How do I stop an autonomous workflow?
A: Run /siftcoder:pause at any time. Resume with
   /siftcoder:resume.

Q: Can I undo changes?
A: Yes! siftcoder creates git checkpoints. Use
   /siftcoder:rollback to restore previous state.

Q: What's the difference between investigate and fix?
A: investigate = READ-ONLY, cannot modify anything
   fix = Can modify files, but only within boundaries

Q: How does ideate know my market?
A: It asks you! The command is interactive. It will detect
   your domain from the spec and ask you to confirm.

Q: Do I need to install anything extra?
A: No. Core siftcoder works immediately. Optional add-ons:
   - siftcoder-mcp: Vector search (npm install -g @siftcoder/mcp)
   - ContextDigger: Faster scanning (if installed)

Q: How do I see what siftcoder learned about my project?
A: Run /siftcoder:knowledge to query patterns, gotchas,
   and architecture decisions it discovered.

Q: Can I customize the behavior?
A: Yes! Edit .claude/siftcoder-state/config.json for:
   - Autonomous vs interactive mode
   - Quality gate settings
   - Auto-commit preferences
```

---

## Contextual Tips

After showing any help, suggest next actions:

```
WHAT'S NEXT?

Based on what you're trying to do:

Starting fresh?
  → /siftcoder:wizard     - Guided walkthrough

Have a spec?
  → /siftcoder:ideate     - Enhance with market research

Existing codebase?
  → /siftcoder:understand - Capture patterns first

Need examples?
  → /siftcoder:examples   - See real usage
```

## Allowed Tools
Read, AskUserQuestion

## Skills Used
None (help is self-contained)
