# /siftcoder:autonomous-run

**Execute Approved Autonomous Manifest**

## Description

Executes the project autonomously using the previously approved permission manifest. Runs completely unattended through all phases (planning, coding, QA, documentation) until the project is fully complete.

## Usage

```
/siftcoder:autonomous-run
```

## Prerequisites

Must run `/siftcoder:autonomous <spec-file>` first to create the manifest.

## What It Does

1. **Loads** the approved manifest from `.claude/siftcoder-state/autonomous-manifest.json`
2. **Verifies** all permissions and boundaries
3. **Executes** all project phases without interruption:
   - **Planning**: Analyze specs, break down tasks, create plan
   - **Coding**: Implement features, make technical decisions, run quality gates
   - **QA**: Run tests, check coverage, validate quality gates
   - **Documentation**: Generate docs, create guides, write API docs
4. **Creates checkpoints** at each phase for recovery
5. **Logs all decisions** with rationale for review
6. **Handles failures** based on manifest strategy (retry/rollback/stop/log_continue)
7. **Verifies completion criteria** before marking done
8. **Generates execution report** with full summary

## Example

```bash
/siftcoder:autonomous-run
```

Output:
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
    "checkpoints_created": [
      "after-planning",
      "after-coding",
      "after-qa",
      "after-documentation"
    ],
    "errors_encountered": [],
    "decisions_made": [
      {
        "timestamp": "2026-01-16T10:35:00Z",
        "decision": "Chose React for UI framework",
        "rationale": "Spec requires component-based UI, React has best ecosystem support"
      },
      {
        "timestamp": "2026-01-16T10:42:00Z",
        "decision": "Used SQLite for database",
        "rationale": "Simple file-based storage, no server setup needed"
      },
      {
        "timestamp": "2026-01-16T11:15:00Z",
        "decision": "Targeted 80% test coverage",
        "rationale": "Industry standard for business applications"
      }
    ]
  },
  "completion_status": {
    "phase": "done",
    "success": true
  }
}
```

## Failure Handling

Based on the `failure_handling` setting in your manifest:

### **retry** (Default)
- Automatically retries up to 3 times
- Uses different approach on each retry
- Backtracks to previous phase if needed
```
❌ Error: Test failed
🔄 Auto-retry triggered...
   Retry 1/3...
```

### **rollback**
- Rolls back to last checkpoint
- Stops execution
- Waits for manual intervention
```
❌ Error: Lint failed
⏪ Rolling back to: after-coding
⏸️  Execution stopped. Review and retry.
```

### **stop**
- Stops immediately
- Preserves current state
- Waits for manual intervention
```
❌ Error: Build failed
⏸️  Execution stopped at: coding phase
   Review error and fix manually, then re-run.
```

### **log_continue**
- Logs error
- Continues execution
- Shows errors in final report
```
⚠️  Error logged, continuing...
   (Error will appear in execution report)
```

## Checkpoints

Automatic checkpoints are created at each phase:

| Checkpoint | Phase | State |
|------------|-------|-------|
| `after-planning` | Planning | Task breakdown complete |
| `after-coding` | Coding | Features implemented |
| `after-qa` | QA | Tests passing |
| `after-documentation` | Documentation | Docs complete |

**To manually rollback to a checkpoint:**
```bash
/siftcoder:checkpoint restore after-coding
```

## Interrupting Execution

**To pause during execution:**
```bash
/siftcoder:pause
```

**To resume after pause:**
```bash
/siftcoder:continue
```

**To stop execution completely:**
```
Ctrl+C
```

State is preserved, can resume with `/siftcoder:autonomous-run` again.

## Customizing Execution

Before running, you can modify the manifest:

```bash
# Edit the manifest
nano .claude/siftcoder-state/autonomous-manifest.json

# Example changes:
# - Add more protected patterns for safety
# - Adjust resource limits
# - Change failure handling strategy
# - Customize completion criteria

# Then run
/siftcoder:autonomous-run
```

## Common Modifications

### **Stricter Safety Boundaries**
```json
{
  "boundaries": {
    "protected_patterns": [
      "node_modules/*",
      ".git/*",
      "package.json",
      "tsconfig.json",
      ".env.example"
    ]
  }
}
```

### **Limit Resource Usage**
```json
{
  "boundaries": {
    "resource_limits": {
      "max_execution_time_minutes": 15,
      "max_memory_mb": 1024
    }
  }
}
```

### **Change Failure Strategy**
```json
{
  "failure_handling": "stop"  // Instead of "retry"
}
```

### **Relax Completion Criteria**
```json
{
  "completion_criteria": {
    "documentation_complete": false  // Don't require docs
  }
}
```

## What SiftCoder Decides Autonomously

Based on `decision_authority` in manifest:

✅ **Tech stack**: Frameworks, libraries, runtimes
✅ **Architecture**: Patterns, folder structure, modules
✅ **Versions**: Latest stable (unless spec specifies)
✅ **Code style**: Conventions matching existing code
✅ **Testing**: Framework, coverage targets (typically 80%)
✅ **Error handling**: Patterns based on language best practices

**All decisions are logged** in the execution report with rationale.

## Verification After Completion

After execution completes:

### 1. **Review Execution Report**
```bash
cat .claude/siftcoder-state/execution-report.json | jq '.'
```

### 2. **Check Decisions Made**
```bash
cat .claude/siftcoder-state/execution-report.json | jq '.execution_summary.decisions_made[]'
```

### 3. **Verify Completion Criteria**
```bash
# Run tests
npm test

# Check quality gates
npm run lint
npm run format:check
npm run type-check

# Try building
npm run build
```

### 4. **Review Generated Code**
- Check implementation matches spec
- Verify quality of code
- Ensure tests are adequate
- Confirm documentation is clear

## Troubleshooting

### **"No manifest found"**
**Problem**: Haven't created manifest yet
**Solution**: Run `/siftcoder:autonomous <spec-file>` first

### **"Execution failed at phase X"**
**Problem**: Error during execution
**Solution**:
- Check execution report for error details
- Review last checkpoint
- Adjust failure_handling strategy
- Fix issue and retry

### **"Too many decisions I disagree with"**
**Problem**: SiftCoder made unexpected choices
**Solution**:
- Review decisions in execution report
- Update spec to be more specific
- Re-run with updated spec
- Or use `/siftcoder:build` for guided mode

### **"Completion criteria not met"**
**Problem**: Project marked complete but you disagree
**Solution**:
- Review what was verified
- Adjust completion_criteria in manifest
- Run `/siftcoder:autonomous-run` again

## Best Practices

### ✅ **Before First Run**
- Review manifest carefully
- Start with smaller projects
- Adjust boundaries to match comfort level
- Choose appropriate failure handling

### ✅ **During Execution**
- Let it run unattended (that's the point!)
- Check logs periodically if curious
- Don't interrupt unless necessary

### ✅ **After Completion**
- Review all decisions made
- Verify completion criteria manually
- Learn from SiftCoder's choices
- Provide feedback for improvements

## Safety Features

✅ **Boundary enforcement**: Can't touch protected files
✅ **Resource limits**: Prevents runaway execution
✅ **Checkpoints**: Automatic state preservation
✅ **Permission validation**: Every operation checks manifest
✅ **Execution report**: Complete audit trail
✅ **Failure recovery**: Multiple strategies available

## See Also

- `/siftcoder:autonomous` - Create permission manifest
- `/siftcoder:pause` - Pause execution
- `/siftcoder:continue` - Resume after pause
- `/siftcoder:checkpoint` - Manage checkpoints
- [Full Autonomous Mode Documentation](../skills/autonomous/SKILL.md)
