# /siftcoder:autonomous

**SiftCoder Full Autonomous Mode - "Fire & Forget"**

## Description

Creates a permission manifest for fully autonomous project execution. All permission questions are asked upfront, then SiftCoder runs completely unattended until the project is fully complete.

## Usage

```
/siftcoder:autonomous <spec-file>
```

## Arguments

- `spec-file` (required): Path to project specification file

## What It Does

1. **Analyzes** your project specification
2. **Detects** what operations will be needed
3. **Asks ALL permission questions upfront**:
   - File operations (create, modify, delete)
   - Command execution (tests, builds, scripts)
   - Dependency installation (npm, pip, cargo)
   - Git operations (commits, push, branches)
   - External API calls
   - Destructive operations (deletes, migrations)
4. **Collects safety boundaries**:
   - Modifiable file patterns
   - Protected file patterns
   - Resource limits (time, memory)
5. **Defines decision authority**:
   - Tech stack choices
   - Architecture patterns
   - Library versions
   - Code style conventions
   - Testing approach
   - Error handling strategies
6. **Establishes completion criteria**:
   - All specs implemented
   - All tests passing
   - Quality gates passing
   - Documentation complete
   - Buildable/deployable
7. **Creates** `.claude/siftcoder-state/autonomous-manifest.json`
8. **Waits** for your review and approval

## Next Steps

After manifest is created:

1. **Review** the manifest file:
   ```bash
   cat .claude/siftcoder-state/autonomous-manifest.json
   ```

2. **Adjust** if needed (optional):
   - Change permissions to `false` to restrict operations
   - Add more protected patterns for safety
   - Adjust resource limits
   - Customize completion criteria
   - Change failure handling strategy

3. **Approve and run**:
   ```
   /siftcoder:autonomous-run
   ```

## Example

```bash
/siftcoder:autonomous project-spec.md
```

Output:
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

💡 To approve these permissions, a manifest will be created.
   Review and approve the manifest before autonomous execution begins.

🛡️  Safety Boundaries:
  • Modifiable: Current project directory
  • Protected: node_modules/, .git/, build/, dist/

🧠 Decision-Making Authority:
SiftCoder will autonomously make technical decisions following best practices.

🏁 Completion Criteria:
  ✓ All specification items implemented
  ✓ All tests passing
  ✓ Quality gates passing
  ✓ Documentation complete
  ✓ Project builds successfully

✅ Permission manifest created!
   Location: .claude/siftcoder-state/autonomous-manifest.json

📝 Next Steps:
   1. Review the manifest file
   2. Approve by running: /siftcoder:autonomous-run
   3. SiftCoder will execute autonomously until project is complete
```

## Manifest Example

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

## When to Use

✅ **Perfect for:**
- Complete, well-defined specifications
- Trusted execution environment
- Hands-off project completion
- Time-boxed execution
- Review-after approach

❌ **NOT suitable for:**
- Learning how SiftCoder works (use `/siftcoder:pair`)
- Collaborative decision-making (use `/siftcoder:build`)
- Seeing each change as it happens (use `/siftcoder:preview`)
- Incomplete or ambiguous specifications

## Safety Features

✅ **Boundary enforcement**: Protected files cannot be modified
✅ **Resource limits**: Prevents runaway execution
✅ **Checkpoints**: Automatic state preservation at each phase
✅ **Permission validation**: Every operation checks manifest
✅ **Execution report**: Complete audit trail for review

## See Also

- `/siftcoder:autonomous-run` - Execute approved manifest
- `/siftcoder:build` - Guided feature building
- `/siftcoder:pair` - Interactive pair programming
- [Full Documentation](./skills/autonomous/SKILL.md)
