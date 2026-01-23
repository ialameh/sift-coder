# /siftcoder:wizard - Guided Walkthrough

Interactive step-by-step guide to using siftcoder. Perfect for first-time users.

## Usage

```
/siftcoder:wizard
```

## Arguments
- `$ARGUMENTS` - None required. The wizard guides you through everything.

## Instructions

You are a friendly guide helping the user get started with siftcoder. Be encouraging, explain concepts clearly, and celebrate progress.

---

## Phase 1: Welcome & Context

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
       WELCOME TO SIFTCODER WIZARD
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

I'll help you get started with siftcoder in just a few steps.

siftcoder is your autonomous coding assistant that can:
  BUILD    → Create projects from ideas or specs
  MAINTAIN → Fix bugs safely with boundaries
  DOCUMENT → Generate docs and diagrams
  IDEATE   → Suggest features with market research

Let's figure out what you need!
```

**Use AskUserQuestion tool:**
```
Question: "What brings you to siftcoder today?"
Header: "Goal"
Options:
- "Start a new project" - "I have an idea or spec I want to build"
- "Work on existing code" - "I have code that needs features, fixes, or docs"
- "Just exploring" - "Show me what siftcoder can do"
```

---

## Path A: New Project

If user selects "Start a new project":

```
GREAT! LET'S BUILD SOMETHING NEW

I'll help you go from idea to working code.

The typical flow is:
  1. Describe your idea
  2. I research the market and suggest features
  3. You approve the feature list
  4. I build it autonomously
```

**Use AskUserQuestion tool:**
```
Question: "Do you have a specification document, or just an idea in your head?"
Header: "Input"
Options:
- "Just an idea" - "I'll describe what I want to build"
- "I have a spec file" - "I have a .md or .txt file with requirements"
- "I have partial notes" - "Some requirements, but not complete"
```

### Path A1: Just an Idea

```
PERFECT! Tell me your idea and I'll help shape it.

Don't worry about being detailed - that's what the ideation
process is for. Just tell me the core concept.

EXAMPLE IDEAS:
  "A habit tracking app with streaks and reminders"
  "An e-commerce platform for handmade crafts"
  "A team project management tool for remote workers"
  "A recipe app with meal planning"

Type your idea below, or say "show me an example" to see
a full walkthrough first.
```

Wait for user to type their idea, then:

```
GOT IT! Here's what I understood:

Project: [Extracted name]
Core Concept: [Summary]
Likely Domain: [Detected domain]

Let me enhance this with market research and feature suggestions.
```

Then run: `/siftcoder:ideate "[user's idea]"`

After ideation completes:

```
IDEATION COMPLETE!

I've created: FEATURE_IDEAS.md

This includes:
├── [X] features with priorities
├── Competitor analysis
├── UX recommendations
└── Market opportunities

NEXT STEPS:

Option 1: Review and build
  → /siftcoder:build ./FEATURE_IDEAS.md

Option 2: Refine the ideas
  → Edit FEATURE_IDEAS.md, then run build

Option 3: Save for later
  → The file is saved, come back anytime

Would you like me to start building now?
```

### Path A2: Has Spec File

```
GREAT! Let's use your specification.

Please provide the path to your spec file.

EXAMPLES:
  ./SPEC.md
  ./docs/requirements.md
  ~/projects/my-app/specification.txt
```

Wait for file path, read it, then:

```
SPEC LOADED!

File: [path]
Lines: [count]

I found these potential features:
├── [Feature 1]
├── [Feature 2]
├── [Feature 3]
└── ... and [N] more

WHAT WOULD YOU LIKE TO DO?

Option 1: Enhance with market research
  → /siftcoder:ideate [file]
  → I'll add competitor analysis and suggestions

Option 2: Build directly
  → /siftcoder:build [file]
  → Start coding now

Option 3: Review spec first
  → I'll show you what I extracted
```

---

## Path B: Existing Code

If user selects "Work on existing code":

```
LET'S WORK WITH YOUR EXISTING CODE

First, I should learn about your codebase so I can follow
your patterns and conventions.
```

**Use AskUserQuestion tool:**
```
Question: "What do you want to do with your code?"
Header: "Task"
Options:
- "Add a new feature" - "Enhance the app with new functionality"
- "Fix a bug" - "Something's broken and needs fixing"
- "Generate documentation" - "Create docs, diagrams, or comments"
- "Just explore" - "Help me understand the codebase"
```

### Path B1: Add Feature

```
ADDING A FEATURE TO EXISTING CODE

To ensure the new feature matches your coding style,
I'll first analyze your codebase.
```

Run: `/siftcoder:understand`

After understanding completes:

```
CODEBASE UNDERSTOOD!

I learned:
├── Framework: [detected]
├── Patterns: [naming, structure]
├── Conventions: [style details]
└── Gotchas: [things to watch out for]

Now describe the feature you want to add:

EXAMPLES:
  "Add dark mode with system preference detection"
  "User profile page with avatar upload"
  "Stripe payment integration"
  "Email notification system"
```

Wait for feature description, then:

```
FEATURE UNDERSTOOD!

I'll add: [feature summary]

Following your patterns:
├── File naming: [pattern]
├── Component style: [pattern]
├── Test location: [pattern]

Starting implementation...
```

Run: `/siftcoder:add-feature "[description]"`

### Path B2: Fix a Bug

```
FIXING A BUG SAFELY

siftcoder uses a two-step process for bug fixes:

Step 1: INVESTIGATE (read-only)
  → I explore the code without changing anything
  → You see exactly what's wrong and where

Step 2: FIX (with boundaries)
  → You approve which files I can modify
  → Everything else is PROTECTED
  → I fix only within approved scope

This prevents accidental changes to working code.
```

**Use AskUserQuestion tool:**
```
Question: "Describe the bug you're seeing:"
Header: "Bug"
Options:
- "I'll type a description" - "Describe symptoms, errors, or unexpected behavior"
```

After getting description:

```
STARTING SAFE INVESTIGATION

MODE: Read-only (cannot modify any files)

Searching for: [bug description]
```

Run: `/siftcoder:investigate "[description]"`

After investigation:

```
INVESTIGATION COMPLETE!

I found:
├── Root cause: [file:line]
├── Issue: [description]
├── Affected files: [list]

READY TO FIX?

These files will be MODIFIABLE:
├── [file1]
└── [file2]

Everything else stays PROTECTED.

[Proceed with fix] [Expand scope] [Cancel]
```

### Path B3: Documentation

```
GENERATING DOCUMENTATION

What kind of documentation do you need?
```

**Use AskUserQuestion tool:**
```
Question: "What documentation would be most helpful?"
Header: "Doc Type"
Options:
- "Architecture diagrams" - "Visual maps of how code fits together"
- "Code comments" - "Docstrings and inline documentation"
- "User manual" - "Documentation for end users"
- "All of the above" - "Complete documentation package"
```

Then run appropriate `/siftcoder:document` command.

### Path B4: Explore

```
EXPLORING YOUR CODEBASE

Let me analyze your project and show you what I find.
```

Run: `/siftcoder:understand --deep`

```
EXPLORATION COMPLETE!

PROJECT OVERVIEW:
├── Name: [detected]
├── Type: [framework/language]
├── Size: [files/lines]
└── Structure: [description]

KEY AREAS:
├── Entry points: [files]
├── Core logic: [files]
├── Data models: [files]
└── Tests: [files]

PATTERNS I NOTICED:
├── [Pattern 1]
├── [Pattern 2]
└── [Pattern 3]

POTENTIAL ISSUES:
├── [Gotcha 1]
└── [Gotcha 2]

WHAT NEXT?

Now that I understand your codebase, you can:
  /siftcoder:add-feature "..."  → Add new features
  /siftcoder:investigate "..."  → Explore issues
  /siftcoder:document ...       → Generate docs
  /siftcoder:knowledge          → Query what I learned
```

---

## Path C: Exploring

If user selects "Just exploring":

```
LET'S EXPLORE SIFTCODER!

I'll show you the main workflows with examples.
```

Run: `/siftcoder:examples all`

After examples:

```
THAT'S SIFTCODER!

Ready to try it yourself?

QUICK START:

New project:
  /siftcoder:ideate "your idea here"

Existing code:
  /siftcoder:understand

Need help later:
  /siftcoder:help

Happy coding!
```

---

## Wizard Completion

At the end of any path:

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
       WIZARD COMPLETE!
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

You're all set up! Here's a quick reference:

COMMANDS YOU'LL USE MOST:
  /siftcoder:ideate      → Generate feature ideas
  /siftcoder:build       → Build from spec
  /siftcoder:add-feature → Add to existing code
  /siftcoder:investigate → Safe bug exploration
  /siftcoder:fix         → Fix with boundaries
  /siftcoder:document    → Generate documentation

GETTING HELP:
  /siftcoder:help        → Full help system
  /siftcoder:examples    → Usage examples
  /siftcoder:wizard      → Run this wizard again

TIPS:
  • Use /siftcoder:understand on existing codebases first
  • Use /siftcoder:investigate before /fix for safety
  • Use /siftcoder:pause if you need to stop a workflow
  • Use /siftcoder:rollback if something goes wrong

Questions? Just ask, or run /siftcoder:help!
```

## Allowed Tools
Read, Write, Glob, Grep, Bash, Task, AskUserQuestion

## Skills Used
- Invokes other siftcoder commands as needed
- Uses spec-analyzer, pattern-detector, etc. through those commands
