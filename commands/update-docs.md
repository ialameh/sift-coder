---
description: Generate documentation automatically
allowed-tools: Read, Write, Edit, Bash, Task
---

# /update-docs - Automatic Documentation Generation

Generates project documentation including contributor guides, runbooks, and API docs.

## Usage

```
/update-docs [type]

Types:
  all           Generate all documentation (default)
  contributor   Generate contributor guide
  runbook       Generate runbook
  api           Generate API documentation
```

## Process

### Phase 1: Analysis
1. Scan project structure
2. Extract package.json information
3. Identify scripts and dependencies
4. Analyze source code patterns

### Phase 2: Documentation Generation
1. **Contributor Guide** (CONTRIBUTING.md)
   - Quick start instructions
   - Available scripts
   - Project structure
   - Development workflow

2. **Runbook** (RUNBOOK.md)
   - Common tasks
   - Troubleshooting
   - Deployment procedures
   - Maintenance tasks

3. **API Documentation** (API.md)
   - Service interfaces
   - Function signatures
   - Type definitions
   - Usage examples

### Phase 3: Output
1. Save to `docs/` directory
2. Display generated files
3. Show next steps

## Example Output

```
📚 Generating documentation...

  → Generating contributor guide...
    ✅ docs/CONTRIBUTING.md

  → Generating runbook...
    ✅ docs/RUNBOOK.md

  → Generating API documentation...
    ✅ docs/API.md

✅ Documentation generated successfully

📂 Generated files:
  • docs/CONTRIBUTING.md - Guide for new contributors
  • docs/RUNBOOK.md - Operational procedures
  • docs/API.md - API reference

💡 Next steps:
  → Review generated documentation
  → Customize for your project
  → Add project-specific details
  → Commit to repository
```

## What Gets Generated

### Contributor Guide
- Quick start setup
- Prerequisites
- Available npm scripts
- Project structure overview
- Development workflow
- Code style guidelines

### Runbook
- Common tasks (tests, build, lint)
- Troubleshooting guides
- Deployment procedures
- Maintenance tasks
- Rollback instructions

### API Documentation
- Service interfaces
- Exported functions
- Type definitions
- Usage examples

## Tips & Hints

```

DOCUMENTATION BEST PRACTICES:

✅ Include in generated docs:
  → Setup instructions
  → Common workflows
  → Troubleshooting steps
  → API references

✅ Add manually after generation:
  → Project-specific details
  → Architecture decisions
  → Code examples
  → Screenshots/diagrams

✅ Keep documentation:
  → Concise and scannable
  → Up to date with code
  → Easy to navigate
  → Example-driven

CUSTOMIZATION:

After running /update-docs:
  1. Review each generated file
  2. Add project-specific context
  3. Include real examples
  4. Add diagrams where helpful
  5. Link related documents

AUTOMATION:

Add to CI/CD:
  → Generate docs on commit
  → Check docs are up to date
  → Alert when code drifts from docs

Pre-commit hooks:
  → Update API docs when source changes
  → Verify examples still work

INTEGRATION:

Combine with other commands:
  /update-docs
  /update-codemaps
  /pattern-extract "Documentation pattern"

Documentation as code:
  → Version control with code
  → Review in PRs
  → Test examples
```

---

## Now: Generate Documentation

Using DocService to generate documentation...

1. Analyzing project structure
2. Extracting information from package.json
3. Scanning source files
4. Generating documentation

Starting documentation generation...
