# SiftCoder Plugin Configuration

**Configuration options and customization**

---

## Configuration File

Location: `.claude/siftcoder-state/config.json`

### Default Configuration

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

---

## Configuration Options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `mode` | string | `"autonomous"` | Workflow mode |
| `autoContinue` | boolean | `true` | Auto-continue to next task |
| `maxIterations` | number | `10` | Max iterations for fix/heal |
| `autoCommit` | boolean | `true` | Auto-commit after successful changes |
| `qualityGates.format` | boolean | `true` | Run formatter after code changes |
| `qualityGates.lint` | boolean | `true` | Run linter after code changes |
| `qualityGates.typeCheck` | boolean | `true` | Run type checker after code changes |
| `qualityGates.tests` | boolean | `true` | Run tests after code changes |
| `healing.maxRetries` | number | `3` | Maximum retries for self-healing |
| `healing.autoLintFix` | boolean | `true` | Automatically apply lint fixes |
| `healing.escalateAfterMax` | boolean | `true` | Escalate after max retries |

---

## Workflow Modes

### Autonomous Mode (Default)

```json
{
  "mode": "autonomous"
}
```

- Plan → Code → Review → Fix automatically
- Best for: Standard feature development, building from specs
- Requires: Minimal intervention

### Interactive Mode

```json
{
  "mode": "interactive"
}
```

- Each step requires approval
- Best for: Learning, complex decisions
- Requires: More user involvement

### Pair Mode

```json
{
  "mode": "pair"
}
```

- AI suggests, you approve each step
- Best for: Learning, collaboration
- Requires: Active participation

---

## Quality Gates

Configure which quality checks run:

```json
{
  "qualityGates": {
    "format": true,      // Prettier, Black, etc.
    "lint": true,        // ESLint, Pylint, etc.
    "typeCheck": true,   // TypeScript, mypy, etc.
    "tests": true,       // Jest, Pytest, etc.
    "custom": []         // Custom commands
  }
}
```

---

## Healing Configuration

Control self-healing behavior:

```json
{
  "healing": {
    "maxRetries": 3,              // Max fix attempts
    "autoLintFix": true,          // Auto-apply lint fixes
    "addToGotchas": true,         // Learn from failures
    "respectBoundaries": true,    // Honor file boundaries
    "escalateAfterMax": true,     // Escalate if can't fix
    "strategies": [               # Fix strategies to try
      "alternativeApproach",
      "simplifyLogic",
      "addLogging"
    ]
  }
}
```

---

## Customization

### Adding Custom Quality Gates

```json
{
  "qualityGates": {
    "custom": [
      "npm run custom-check",
      "python -m pylint src/",
      "rubocop src/"
    ]
  }
}
```

### Environment-Specific Config

Create environment-specific overrides:

```json
{
  "development": {
    "qualityGates": {
      "tests": false
    }
  },
  "production": {
    "qualityGates": {
      "tests": true
    }
  }
}
```

---

## See Also

- [Core Concepts](../01-getting-started/core-concepts.md) - Multi-agent architecture
- [Workflow Control](../02-command-reference/by-category/workflow-control.md) - Control workflows
- [Session & State](../02-command-reference/by-category/session-state.md) - Manage state
