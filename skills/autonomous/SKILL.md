# SiftCoder Full Autonomous Mode

**"Fire & Forget" autonomous project completion**

## Overview

SiftCoder Full Autonomous Mode provides complete hands-off project execution:
1. Ask ALL permission questions upfront
2. Create permission manifest
3. Run completely autonomously until project is fully complete
4. Make all technical decisions using best practices
5. Provide detailed execution log for review afterward

## When to Use

- ✅ You have a complete specification
- ✅ You trust SiftCoder to make technical decisions
- ✅ You want unattended execution
- ✅ You have time to review the permission manifest upfront
- ✅ You want to review the complete execution log afterward

## When NOT to Use

- ❌ You need to see each change as it happens (use `/siftcoder:pair` instead)
- ❌ You're uncertain about technical approach (use `/siftcoder:build` instead)
- ❌ You want to learn from the process (use guided mode instead)
- ❌ The specification is incomplete or ambiguous

## Usage

### Step 1: Create Permission Manifest

```bash
/siftcoder:autonomous <spec-file>
```

This will:
1. Analyze your project specification
2. Ask all permission questions upfront
3. Create `.claude/siftcoder-state/autonomous-manifest.json`
4. Wait for your review and approval

**Example:**
```bash
/siftcoder:autonomous project-spec.md
```

**Output:**
```
🔍 Analyzing project specification...

📋 Project Analysis Complete
   Type: nodejs
   Estimated Scope: medium

🔐 Operational Permissions Required:

The following operations will be performed during autonomous execution:

  ✓ Create, modify, and delete files
  ✓ Run shell commands (tests, builds, scripts)
  ✓ Install project dependencies (npm, pip, cargo, etc.)
  ✓ Perform Git operations (commit, push, branches)
  ✓ Make external API calls if needed

💡 To approve these permissions, a manifest will be created.
   Review and approve the manifest before autonomous execution begins.

🛡️  Safety Boundaries:

Default boundaries (will be saved to manifest):
  • Modifiable: Current project directory
  • Protected: node_modules/, .git/, build/, dist/
  • Max file size: 1MB
  • Max execution time: 30 minutes per operation
  • Max memory: 2GB

💡 These can be adjusted in the manifest before approval.

🧠 Decision-Making Authority:

SiftCoder will autonomously make the following technical decisions:

  • Tech stack choices (when not specified)
  • Architecture patterns and folder structure
  • Library versions (latest stable unless specified)
  • Code style conventions (when none exist)
  • Testing approach and coverage targets
  • Error handling strategies

💡 All decisions follow industry best practices.
   Decisions will be logged for review after completion.

🏁 Completion Criteria:

Project will be considered complete when:

  ✓ All specification items implemented
  ✓ All tests passing
  ✓ Quality gates passing (format, lint, type-check)
  ✓ Documentation complete
  ✓ Project builds successfully

⚠️  Failure Handling:

If something goes wrong during autonomous execution:

  1) Stop and wait for human intervention
  2) Auto-retry with different approach (max 3 attempts)
  3) Rollback to last checkpoint and stop
  4) Log error and continue

💡 Default: Option 2 (Auto-retry)
   This can be changed in the manifest.

✅ Permission manifest created!
   Location: .claude/siftcoder-state/autonomous-manifest.json

📝 Next Steps:
   1. Review the manifest file
   2. Approve by running: /siftcoder:autonomous-run
   3. SiftCoder will execute autonomously until project is complete
```

### Step 2: Review and Approve Manifest

Review the manifest file:
```bash
cat .claude/siftcoder-state/autonomous-manifest.json
```

**Example Manifest:**
```json
{
  "project_root": "/path/to/project",
  "spec_file": "project-spec.md",
  "timestamp": "2026-01-16T10:30:00Z",
  "permissions": {
    "file_operations": true,
    "run_commands": true,
    "install_dependencies": true,
    "git_operations": true,
    "external_apis": false,
    "destructive_operations": false
  },
  "boundaries": {
    "modifiable_patterns": ["./*"],
    "protected_patterns": ["node_modules/*", ".git/*"],
    "max_file_size_mb": 1,
    "resource_limits": {
      "max_execution_time_minutes": 30,
      "max_memory_mb": 2048
    }
  },
  "decision_authority": {
    "tech_stack_choices": true,
    "architecture_patterns": true,
    "library_versions": true,
    "code_style": true,
    "testing_approach": true,
    "error_handling": true
  },
  "completion_criteria": {
    "all_specs_implemented": true,
    "all_tests_passing": true,
    "quality_gates_passing": true,
    "documentation_complete": true,
    "buildable_deployable": true
  },
  "failure_handling": "retry"
}
```

**Adjust if needed:**
- Change permissions to `false` if you don't want certain operations
- Add more protected patterns to increase safety
- Adjust resource limits for your environment
- Change `failure_handling` strategy
- Customize completion criteria

### Step 3: Execute Autonomously

Once you're satisfied with the manifest:
```bash
/siftcoder:autonomous-run
```

**What Happens:**
1. SiftCoder loads the approved manifest
2. Executes all project phases without interruption
3. Makes all technical decisions autonomously
4. Creates checkpoints at each phase
5. Logs all decisions and actions
6. Continues until completion or unrecoverable error
7. Generates execution report

**Output During Execution:**
```
🚀 Starting Autonomous Execution

📋 Permission Manifest Loaded
   Created: 2026-01-16T10:30:00Z
   Spec: project-spec.md

Permissions:
   • File Operations: ✓
   • Run Commands: ✓
   • Install Dependencies: ✓
   • Git Operations: ✓
   • External APIs: ✗
   • Destructive Operations: ✗

Safety Boundaries:
   • Modifiable: ./*
   • Protected: node_modules/*, .git/*

📋 Phase 1: Planning
   Analyzing specifications...
   Breaking down into tasks...
   Creating execution plan...
   💾 Checkpoint saved: after-planning

💻 Phase 2: Coding
   Implementing features...
   Making technical decisions...
   Running quality gates...
   💾 Checkpoint saved: after-coding

✅ Phase 3: Quality Assurance
   Running tests...
   Checking coverage...
   Validating quality gates...
   ✓ All tests must pass before proceeding
   💾 Checkpoint saved: after-qa

📚 Phase 4: Documentation
   Generating documentation...
   Creating usage guides...
   Writing API docs...
   ✓ Documentation must be complete
   💾 Checkpoint saved: after-documentation

🏁 Verifying Completion Criteria

   ✓ All spec items implemented
   ✓ All tests passing
   ✓ Quality gates passing (format, lint, type-check)
   ✓ Documentation complete
   ✓ Project builds successfully

✅ Project Complete!

Summary:
  • Checkpoints Created: 4
  • Errors Encountered: 0
  • Decisions Made: 15
  • Total Iterations: 1

📄 Execution report saved: .claude/siftcoder-state/execution-report.json

✨ Autonomous execution completed successfully!
```

## Permission Manifest Options

### Permissions Section

| Permission | Description | When Needed |
|------------|-------------|-------------|
| `file_operations` | Create, modify, delete files | Always needed |
| `run_commands` | Run shell commands, tests, builds | If tests/builds required |
| `install_dependencies` | npm install, pip install, etc. | If project has dependencies |
| `git_operations` | Commit, push, branches | If Git workflow needed |
| `external_apis` | Make external API calls | If integration required |
| `destructive_operations` | Delete files, run migrations | If destructive changes needed |

### Boundaries Section

| Setting | Description | Default |
|---------|-------------|---------|
| `modifiable_patterns` | What can be changed | `["./*"]` |
| `protected_patterns` | What cannot be changed | `["node_modules/*", ".git/*"]` |
| `max_file_size_mb` | Max file size limit | `1` |
| `max_execution_time_minutes` | Time limit per operation | `30` |
| `max_memory_mb` | Memory limit | `2048` |

### Decision Authority Section

| Authority | Description | What It Allows |
|-----------|-------------|----------------|
| `tech_stack_choices` | Choose frameworks/libraries | Pick React vs Vue, Express vs Fastify |
| `architecture_patterns` | Decide structure | MVC, clean architecture, etc. |
| `library_versions` | Choose versions | Use latest stable versions |
| `code_style` | Define conventions | Naming, formatting, patterns |
| `testing_approach` | Testing strategy | Unit vs integration, coverage targets |
| `error_handling` | Error strategy | Try/catch patterns, error boundaries |

### Completion Criteria Section

| Criterion | Description | Verification |
|-----------|-------------|--------------|
| `all_specs_implemented` | All spec items done | Checkbox verification |
| `all_tests_passing` | All tests pass | Run test suite |
| `quality_gates_passing` | Format, lint, type-check | Run quality gates |
| `documentation_complete` | Docs written | Check doc coverage |
| `buildable_deployable` | Builds successfully | Run build command |

### Failure Handling Options

| Option | Behavior | When to Use |
|--------|----------|-------------|
| `stop` | Stop and wait for human | When you want to review failures |
| `retry` | Auto-retry 3 times | When transient errors expected |
| `rollback` | Rollback to last checkpoint | When you want clean state |
| `log_continue` | Log and continue | When you want resilient execution |

## Execution Report

After completion, review `.claude/siftcoder-state/execution-report.json`:

```json
{
  "manifest_path": ".claude/siftcoder-state/autonomous-manifest.json",
  "execution_summary": {
    "started_at": "2026-01-16T10:30:00Z",
    "completed_at": "2026-01-16T12:45:00Z",
    "total_phases": 4,
    "total_iterations": 1,
    "checkpoints_created": ["after-planning", "after-coding", "after-qa", "after-documentation"],
    "errors_encountered": [],
    "decisions_made": [
      {
        "timestamp": "2026-01-16T10:35:00Z",
        "decision": "Chose React for UI framework",
        "rationale": "Spec requires component-based UI, React has best ecosystem support"
      }
    ]
  },
  "completion_status": {
    "phase": "done",
    "success": true
  }
}
```

## Best Practices

### 1. **Review Manifest Carefully**
- Take time to understand what permissions you're granting
- Adjust boundaries to match your comfort level
- Customize decision authority based on your preferences

### 2. **Start with Smaller Projects**
- Test autonomous mode on smaller specs first
- Build trust in SiftCoder's decision-making
- Gradually increase project complexity

### 3. **Keep Specifications Complete**
- More complete specs = fewer autonomous decisions needed
- Ambiguous specs = more decisions logged for review
- Unclear requirements may lead to unexpected outcomes

### 4. **Review Execution Report**
- Check all decisions made during execution
- Verify completion criteria were met
- Learn from SiftCoder's technical choices

### 5. **Use Checkpoints for Recovery**
- If something goes wrong, checkpoints are saved
- Can rollback to any checkpoint manually
- Review intermediate state at each phase

## Safety Features

### ✅ Boundary Enforcement
- Protected files cannot be modified
- File size limits prevent excessive changes
- Resource limits prevent runaway execution

### ✅ Checkpoint System
- Automatic checkpoints at each phase
- Can rollback to any checkpoint
- Full state preservation

### ✅ Permission Validation
- Every operation checks manifest permissions
- No operation exceeds granted authority
- Clear audit trail of all actions

### ✅ Error Handling
- Configurable failure strategies
- Automatic retry with exponential backoff
- Rollback capability for recovery

## Examples

### Example 1: Simple Web App

**Spec (`webapp-spec.md`):**
```markdown
# Todo App

Build a simple todo application with:
- Create, read, update, delete todos
- Persistent storage
- Simple web UI
```

**Command:**
```bash
/siftcoder:autonomous webapp-spec.md
```

**Autonomous Decisions:**
1. Framework: Chose vanilla JS (no framework needed for simple app)
2. Storage: Chose localStorage (browser-based, no backend needed)
3. UI: Chose simple HTML/CSS (minimal complexity)
4. Testing: Chose Jest with 80% coverage (standard practice)

### Example 2: REST API

**Spec (`api-spec.md`):**
```markdown
# User Management API

Build a REST API for user management:
- Create, read, update, delete users
- JWT authentication
- Input validation
- Unit tests
```

**Command:**
```bash
/siftcoder:autonomous api-spec.md
```

**Autonomous Decisions:**
1. Runtime: Chose Node.js with Express (most common for REST APIs)
2. Database: Chose SQLite (simple, file-based, no server needed)
3. Auth: Chose JWT with bcrypt (industry standard)
4. Validation: Chose Zod (type-safe validation)
5. Testing: Chose Supertest for API tests (standard for Express)

## Troubleshooting

### Manifest Creation Failed

**Problem**: Can't create manifest
**Solution**:
- Verify spec file exists and is readable
- Check you have write permissions in project directory
- Ensure `.claude/siftcoder-state/` can be created

### Execution Failed Mid-Phase

**Problem**: Stopped during execution
**Solution**:
- Check execution report for error details
- Review last checkpoint to see state before failure
- Adjust failure_handling strategy and retry

### Too Many Autonomous Decisions

**Problem**: SiftCoder made decisions you disagree with
**Solution**:
- Review execution report to see all decisions
- Update spec to be more specific
- Re-run with updated spec
- Or use `/siftcoder:build` for guided mode instead

### Completion Criteria Not Met

**Problem**: Project marked complete but you disagree
**Solution**:
- Review execution report for what was verified
- Adjust completion_criteria in manifest
- Run `/siftcoder:autonomous-run` again (will resume)

## Comparison with Other Modes

| Mode | Permission Timing | User Involvement | Best For |
|------|------------------|------------------|----------|
| **Autonomous** | Upfront, one-time | None (review after) | Complete specs, trusted execution |
| **Build** | Per-feature | Minimal (approvals) | Standard feature development |
| **Pair** | Per-step | High (collaborative) | Learning, complex decisions |
| **Fix** | Per-change | Minimal | Bug fixes with scope control |

## See Also

- `/siftcoder:build` - Guided feature building
- `/siftcoder:pair` - Interactive pair programming
- `/siftcoder:fix` - Scoped bug fixing
- `/siftcoder:preview` - Preview changes before applying
