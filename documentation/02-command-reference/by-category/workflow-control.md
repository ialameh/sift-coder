# WORKFLOW CONTROL Commands

**Control the autonomous workflow**

The WORKFLOW CONTROL category contains 8 commands for controlling autonomous workflows, managing progress, and getting help.

---

## Commands Overview

| Command | Purpose | Difficulty | Time |
|---------|---------|------------|------|
| [`/status`](#status) | Show current progress | ⭐ Beginner | 1 min |
| [`/pause`](#pause) | Pause auto-continuation | ⭐ Beginner | 1 min |
| [`/continue`](#continue) | Resume workflow | ⭐ Beginner | 1 min |
| [`/resume`](#resume) | Alias for continue | ⭐ Beginner | 1 min |
| [`/focus`](#focus) | Focus on specific feature/area | ⭐ Beginner | 1 min |
| [`/pair`](#pair) | Interactive pair programming | ⭐⭐ Intermediate | Ongoing |
| [`/missing`](#missing) | Check unimplemented features | ⭐ Beginner | 2-5 min |
| [`/prompt`](#prompt) | Interactive prompt helper | ⭐ Beginner | 2-10 min |
| [`/prompt improve`](#prompt-improve) | Improve existing prompts | ⭐ Beginner | 2-5 min |
| [`/examples`](#examples) | Show usage examples | ⭐ Beginner | 1 min |
| [`/help`](#help) | Show help information | ⭐ Beginner | 1 min |
| [`/surprise-me`](#surprise-me) | Random helpful command | ⭐ Beginner | 2-5 min |
| [`/agent`](#agent) | Run specific agent directly | ⭐⭐ Intermediate | Varies |
| [`/scope`](#scope) | Manage file boundaries | ⭐ Beginner | 1 min |
| [`/knowledge`](#knowledge) | Query learned patterns | ⭐ Beginner | 1 min |
| [`/consolidate`](#consolidate) | Consolidate duplicate code | ⭐⭐ Intermediate | 10-20 min |

---

## /status

Show current progress, active task, and resume context.

### Quick Overview
- **Purpose**: Check workflow progress
- **Difficulty**: ⭐ Beginner
- **Time Estimate**: 1 min
- **Mode**: Read-only

### Syntax

```bash
/siftcoder:status
```

### Examples

```bash
/siftcoder:status
```

**Output:**
```
📊 Current Status

WORKFLOW: BUILD
   Mode: Autonomous
   Status: In Progress

FEATURE: User Authentication
   Progress: 3/5 subtasks (60%)
   ✅ Create data model
   ✅ Implement service layer
   ✅ Build UI component
   🔄 Add routing (in progress)
   ⏳ Write tests (queued)

BOUNDARIES:
   Modifiable: src/auth/*, src/components/auth/*
   Protected: Everything else

NEXT STEPS:
   → Complete routing subtask
   → Write tests
   → QA validation

PAUSED: No
   Auto-continue: Enabled
```

---

## /pause

Pause auto-continuation - workflow stops after current task.

### Quick Overview
- **Purpose**: Stop auto-continuation
- **Difficulty**: ⭐ Beginner
- **Time Estimate**: 1 min
- **Mode**: Control

### Syntax

```bash
/siftcoder:pause
```

**Use when:**
- You need to review progress
- You want to make manual changes
- You're stepping away from work

---

## /continue

Resume workflow from where you left off.

### Quick Overview
- **Purpose**: Resume paused workflow
- **Difficulty**: ⭐ Beginner
- **Time Estimate**: 1 min
- **Mode**: Control

### Syntax

```bash
/siftcoder:continue
# or
/siftcoder:resume
```

---

## /pair

Enter interactive pair programming mode where AI suggests changes and you approve each step.

### Quick Overview
- **Purpose**: Interactive pair programming
- **Difficulty**: ⭐⭐ Intermediate
- **Time Estimate**: Ongoing
- **Mode**: Interactive

### When to Use This Command

✅ **Use this when:**
- You want to collaborate with AI
- Learning new patterns
- Complex decisions needed
- Want to review each change

### Syntax

```bash
/siftcoder:pair
```

---

## /prompt

**Prompt Helper** - Interactive guide to craft perfect prompts for any SiftCoder command. Answer questions and get production-ready prompts.

### Quick Overview
- **Purpose**: Get help crafting prompts
- **Difficulty**: ⭐ Beginner
- **Time Estimate**: 2-10 min
- **Mode**: Interactive

### Syntax

```bash
/siftcoder:prompt
```

### Examples

```bash
/siftcoder:prompt
```

**Interactive session:**
```
📝 Prompt Helper

Q1: What do you want to do?
   A: Fix a bug

Q2: What type of bug?
   A: Login is broken

Q3: When did this start?
   A: After password reset

Q4: Any error messages?
   A: "Invalid token" error

✅ Perfect prompt generated:

/siftcoder:investigate "Users can't log in after password reset with error 'Invalid token'"

This prompt includes:
✓ Specific issue (login after password reset)
✓ Error message (Invalid token)
✓ Context (when it started)

Would you like to run this prompt? [Y/n]
```

---

## /prompt improve

Improve existing prompts - analyze prompt quality, get score, receive enhanced version.

### Quick Overview
- **Purpose**: Improve existing prompts
- **Difficulty**: ⭐ Beginner
- **Time Estimate**: 2-5 min
- **Mode**: Read-only (with output)

### Syntax

```bash
/siftcoder:prompt improve "your prompt here"
```

### Examples

```bash
/siftcoder:prompt improve "Fix auth bug"
```

**Output:**
```
📝 Prompt Analysis

ORIGINAL PROMPT:
"Fix auth bug"

QUALITY SCORE: 3/10

ISSUES:
❌ Too vague
❌ No context
❌ No error details
❌ Doesn't say when it started

IMPROVED PROMPT:
"Fix authentication bug where users can't log in after password reset.
Error message: 'Invalid token'.
Started happening after deployment on 2025-01-20.
Affected files: src/services/auth.ts (from investigation)"

QUALITY SCORE: 9/10

IMPROVEMENTS:
✓ Specific issue identified
✓ Error message included
✓ Timeline provided
✓ Context from investigation

Would you like to run the improved prompt? [Y/n]
```

---

## /missing

Check what's not yet implemented from spec or feature queue.

### Quick Overview
- **Purpose**: Check unimplemented features
- **Difficulty**: ⭐ Beginner
- **Time Estimate**: 2-5 min
- **Mode**: Read-only

### Syntax

```bash
/siftcoder:missing
```

---

## /focus

Focus on a specific feature, area, or file set. Restricts workflow to specified scope.

### Quick Overview
- **Purpose**: Focus workflow on specific area
- **Difficulty**: ⭐ Beginner
- **Time Estimate**: 1 min
- **Mode**: Control

### Syntax

```bash
/siftcoder:focus <target>
```

**Examples:**

```bash
# Focus on specific feature
/siftcoder:focus feature-auth

# Focus on directory
/siftcoder:focus src/payment/

# Focus on file set
/siftcoder:focus "src/auth/* src/components/auth/*"
```

---

## /scope

Manage file modification boundaries for fix/optimize workflows.

### Quick Overview
- **Purpose**: Manage file boundaries
- **Difficulty**: ⭐ Beginner
- **Time Estimate**: 1 min
- **Mode**: Varies

### Syntax

```bash
/siftcoder:scope <action> [file-path]
```

**Actions:**
- `show` - Display current boundaries
- `add <file>` - Add file to modifiable list
- `remove <file>` - Protect a file from modification
- `suggest` - AI suggests appropriate scope

**See full documentation in [MAINTAIN Workflow](maintain-workflow.md#scope).**

---

## /knowledge

Query learned patterns and gotchas from previous sessions.

### Quick Overview
- **Purpose**: Query learned knowledge
- **Difficulty**: ⭐ Beginner
- **Time Estimate**: 1 min
- **Mode**: Read-only

### Syntax

```bash
/siftcoder:knowledge <query>
```

**Examples:**

```bash
# Show all patterns
/siftcoder:knowledge patterns

# Show gotchas
/siftcoder:knowledge gotchas

# Search for specific pattern
/siftcoder:knowledge "error handling"
```

---

## /surprise-me

Random helpful command or tip based on current context.

### Quick Overview
- **Purpose**: Discover new commands
- **Difficulty**: ⭐ Beginner
- **Time Estimate**: 2-5 min
- **Mode**: Read-only

### Syntax

```bash
/siftcoder:surprise-me
```

### Examples

```bash
/siftcoder:surprise-me
```

**Output:**
```
🎲 Random Suggestion

Did you know about this command?

/siftcoder:ripple "change description"

Visualize how a change ripples through your entire system
before making it. Perfect for:
→ Refactoring (what breaks if I rename this?)
→ Architecture changes (impact assessment)
→ API changes (breaking change detection)

Try it: /siftcoder:ripple "Rename User model to Account"
```

---

## Workflow Examples

### Pause and Resume Workflow

```bash
# 1. Check status
/siftcoder:status

# 2. Pause if needed
/siftcoder:pause

# 3. Make manual changes or review

# 4. Resume
/siftcoder:continue
```

### Get Help Crafting Prompts

```bash
# Interactive prompt builder
/siftcoder:prompt

# Or improve existing prompt
/siftcoder:prompt improve "my vague prompt"
```

---

## See Also

- [SESSION & STATE](../session-state.md) - Checkpoints and state management
- [Decision Guide](../../07-decision-guides/choosing-the-right-command.md) - Which command to use
