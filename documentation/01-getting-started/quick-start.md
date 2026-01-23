# Quick Start Guide

**Your first 5 minutes with SiftCoder**

This guide gets you up and running with SiftCoder immediately. Choose your scenario and follow the steps.

---

## Choose Your Scenario

- [Scenario A: Building a New Project](#scenario-a-building-a-new-project)
- [Scenario B: Working with Existing Code](#scenario-b-working-with-existing-code)
- [Scenario C: Salesforce Development](#scenario-c-salesforce-development)
- [Scenario D: Just Exploring](#scenario-d-just-exploring)

---

## Scenario A: Building a New Project

**Goal**: Create a complete project from a specification.

### Step 1: Create a Specification

Create a file `my-project-spec.md`:

```markdown
# My Todo App

## Features
- Create, read, update, delete todos
- User authentication with email/password
- Persistent storage
- Simple web UI

## Technical Preferences
- Backend: Node.js with Express
- Frontend: React
- Database: MongoDB
- Testing: Jest
```

### Step 2: Build It

```bash
/siftcoder:build my-project-spec.md
```

### What Happens Next?

1. **Spec Analysis** (1-2 min)
   - Extracts features from spec
   - Identifies dependencies
   - Creates feature queue

2. **Planning** (2-5 min)
   - Explores existing code patterns
   - Designs implementation approach
   - Breaks into subtasks

3. **Implementation** (10-30 min per feature)
   - Implements each subtask
   - Writes tests
   - Runs quality gates (format, lint, type-check)

4. **Quality Assurance** (2-5 min)
   - Validates acceptance criteria
   - Runs comprehensive tests
   - Fixes any issues found

### During the Build

**Check progress:**
```bash
/siftcoder:status
```

**Pause if needed:**
```bash
/siftcoder:pause
```

**Resume later:**
```bash
/siftcoder:resume
```

**Save checkpoint:**
```bash
/siftcoder:checkpoint save after-feature-1
```

### After the Build

**Generate documentation:**
```bash
/siftcoder:document architecture
/siftcoder:document code
```

**Add more features:**
```bash
/siftcoder:add-feature "Add file upload for todo attachments"
```

---

## Scenario B: Working with Existing Code

**Goal**: Understand, maintain, and add features to existing code.

### Step 1: Understand Your Codebase

```bash
/siftcoder:understand
```

**Output:**
```
🔍 Analyzing project...

📊 Project Overview
   Type: nodejs
   Framework: Express
   Database: PostgreSQL
   Testing: Jest

🏗️ Architecture
   ├── src/
   │   ├── routes/         # API endpoints (12 files)
   │   ├── services/       # Business logic (8 files)
   │   ├── models/         # Data models (5 files)
   │   └── middleware/     # Express middleware (3 files)
   ├── tests/
   └── package.json

🔗 Dependencies
   - express: HTTP server
   - pg: PostgreSQL client
   - jest: Test framework
   - bcrypt: Password hashing

💡 Patterns Detected
   - Async/await throughout
   - Service layer for business logic
   - Centralized error handling
```

### Step 2: Add a Feature

```bash
/siftcoder:add-feature "Add password reset functionality with email tokens"
```

**What happens:**
1. Analyzes codebase for patterns
2. Creates implementation plan
3. Shows you the plan for approval
4. Implements each subtask
5. Writes tests
6. Runs quality gates

### Step 3: Investigate and Fix Bugs

**Investigate (read-only, safe):**
```bash
/siftcoder:investigate "Users can't log in after password reset"
```

**Output:**
```
🔍 Investigating issue...

📍 Root Cause Identified
   File: src/services/auth.ts:45-52
   Issue: Token expiration check uses wrong timezone

📁 Affected Files
   ✓ src/services/auth.ts     (modifiable)
   ✗ src/routes/auth.ts       (protected - not related)
   ✗ src/models/user.ts       (protected - not related)

💡 Suggested Boundaries
   Modifiable: src/services/auth.ts
   Protected: Everything else

🔧 Recommended Fix
   Change: expiresAt < now → expiresAt < now.utc()
```

**Fix with boundaries:**
```bash
/siftcoder:fix "Users can't log in after password reset"
```

**Verify containment:**
```bash
/siftcoder:blast-radius
```

---

## Scenario C: Salesforce Development

**Goal**: Salesforce-specific development workflows.

### Analyze Apex Code

```bash
/siftcoder:apex analyze force-app/main/default/classes/
```

**Finds:**
- Anti-patterns (SOQL in loops, hardcoded IDs)
- Bulkification issues
- Governor limit violations
- Security risks (sharing violations)

### Create LWC with Tests

```bash
/siftcoder:lwc create accountList
```

**Creates:**
- Component HTML
- Component JavaScript
- CSS styles
- Jest test file
- Metadata XML

**Test it:**
```bash
/siftcoder:lwc test accountList
```

### Generate Schema ERD

```bash
/siftcoder:schema erd
```

**Generates:**
- Entity Relationship Diagram
- All custom objects
- Relationships and lookups
- Field details

### Deploy with Validation

```bash
/siftcoder:sf-deploy validate
```

**Validates:**
- No breaking changes
- All tests pass
- Coverage requirements met
- Metadata valid

[Full Salesforce Guide](../02-command-reference/by-category/salesforce-development.md)

---

## Scenario D: Just Exploring

**Goal**: Try out SiftCoder's unique AI features.

### Rubber Duck Debugging

**AI asks YOU questions to help you discover the solution:**

```bash
/siftcoder:duck "I can't figure out why the cache is always stale"
```

**Interactive session:**
```
🦆 Rubber Duck Debugging: Cache Issue

Q1: When does the cache get populated?
   A: After database queries

Q2: When does the cache get invalidated?
   A: Hmm... I don't think we invalidate it

Q3: What happens when data changes in the database?
   A: Oh! We never update the cache!

💡 Discovery: Cache needs invalidation on data changes!
```

### Ghost Mode - Explore "What If" Scenarios

```bash
/siftcoder:ghost "What if we switched from REST to GraphQL"
```

**Explores:**
- Architecture changes needed
- Code modifications
- Performance impact
- Migration strategy
- Risks and benefits

**No actual code is changed** - it's a parallel exploration!

### Predict Change Impact

```bash
/siftcoder:ripple "Renaming User model to Account"
```

**Shows:**
- All files that reference User
- Database migrations needed
- API breaking changes
- Test files to update
- Documentation to update

### Code Archaeology

```bash
/siftcoder:archaeologist src/legacy/magic_numbers.ts
```

**Discovers:**
- WHY the code exists
- Historical context
- Past attempts to change it
- Business rules encoded
- Safe refactoring path

---

## Command Reference Card

### Most Common Commands

| Task | Command | Description |
|------|---------|-------------|
| Build project | `/build <spec>` | Create from specification |
| Add feature | `/add-feature <desc>` | Add to existing code |
| Investigate bug | `/investigate <issue>` | Read-only exploration |
| Fix bug | `/fix <issue>` | Bounded fix |
| Understand code | `/understand` | Codebase analysis |
| Document | `/document architecture` | Generate diagrams |
| Test | `/test generate <file>` | Generate tests |
| Security | `/security scan` | Full audit |
| Status | `/status` | Check progress |
| Pause | `/pause` | Stop workflow |
| Resume | `/resume` | Continue workflow |

### Novel AI Commands

| Feature | Command | What It Does |
|---------|---------|--------------|
| Rubber Duck | `/duck` | AI asks you questions |
| Ghost Mode | `/ghost` | What-if exploration |
| Predict Intent | `/oracle` | Anticipates next action |
| Archaeology | `/archaeologist` | Why code exists |
| Fortune Teller | `/fortune` | Predicts tech debt impact |
| Change Impact | `/ripple` | See ripples before change |
| Time Travel Debug | `/timewarp` | Reconstruct past state |
| Pain Detection | `/empathy` | Find frustrating code |

---

## What's Next?

### Learn Core Concepts

[Core Concepts Guide](core-concepts.md)
- Multi-agent architecture
- Autonomous workflows
- Safety & boundaries
- State persistence

### Explore All Commands

[Command Reference](../02-command-reference/index.md)
- All 103 commands
- By category
- Alphabetical index

### See Real Workflows

[Workflow Guides](../05-workflows/index.md)
- Building new projects
- Investigating and fixing bugs
- Generating documentation
- Adding features safely

---

## Tips for Success

### Start Small

- First time? Use `/understand` on a simple project
- Test with `/add-feature` for small changes
- Build trust before using `/build` on large specs

### Use Investigate First

**Best practice workflow:**
```bash
/siftcoder:investigate "issue"  # Understand the problem
/siftcoder:fix "issue"          # Fix with boundaries
/siftcoder:blast-radius         # Verify containment
```

### Check Progress

```bash
/siftcoder:status              # Always know what's happening
```

### Save Checkpoints

```bash
/siftcoder:checkpoint save before-risky-change
```

If something goes wrong:
```bash
/siftcoder:rollback before-risky-change
```

### Use the Prompt Helper

Not sure what to type?
```bash
/siftcoder:prompt
```

Interactive prompt builder helps you craft the perfect command.

---

## Troubleshooting

### Command Not Found

1. Check installation: `/plugin list`
2. Restart Claude Code
3. Verify plugin is enabled

### Workflow Stuck

1. `/status` - Check what's happening
2. `/pause` - Stop auto-continuation
3. Review and `/resume` or `/rollback`

### Scope Issues

```bash
/siftcoder:scope show          # View boundaries
/siftcoder:scope add <file>    # Approve file
```

### Need More Help?

- [Troubleshooting Guide](troubleshooting.md)
- [Decision Guide](../07-decision-guides/choosing-the-right-command.md)
- [GitHub Issues](https://github.com/ialameh/sift-coder/issues)

---

## Related Documentation

- [Getting Started](index.md) - Overview and paths
- [Installation](installation.md) - Detailed installation
- [Core Concepts](core-concepts.md) - Multi-agent architecture
- [Configuration](configuration.md) - Customize behavior
- [Troubleshooting](troubleshooting.md) - Common issues

---

**Continue to**: [Core Concepts](core-concepts.md) or [Command Reference](../02-command-reference/index.md)
