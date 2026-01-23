---
description: Generate documentation - code, user-manual, architecture, or technical
argument-hint: <code|user-manual|architecture|technical> [path]
allowed-tools: Read, Write, Edit, Bash, Glob, Grep, Task
---

# siftcoder Document - Documentation Generation

## Documentation Type

**$ARGUMENTS**

## Available Types

### `code [path]`
Generate inline code documentation:
- Docstrings for functions/classes
- Inline comments for complex logic
- README.md for directories
- Type annotations

### `user-manual`
Generate end-user documentation:
- Getting Started guide
- Feature descriptions
- FAQ section
- Troubleshooting guide

### `architecture`
Generate architecture documentation:
- System overview diagram (Mermaid)
- Component diagrams
- Data flow diagrams
- Dependency graphs
- Folder structure with descriptions

### `technical`
Generate technical/ops documentation:
- API Reference
- Deployment Guide
- Configuration Guide
- Ops Runbook
- Security Documentation

## Process

### Step 1: Analyze Target
- Scan the codebase or specified path
- Identify what needs documentation
- Check for existing documentation patterns

### Step 2: Generate Documentation
Invoke the **siftcoder-documenter** agent to:
- Create appropriate documentation
- Generate diagrams where applicable
- Follow project conventions

### Step 3: Output
- Create files in appropriate locations
- Update existing docs if present
- Generate diagrams in Mermaid format

## Output Locations

- **Code docs**: Inline in source files + README.md
- **User manual**: `docs/user-guide/`
- **Architecture**: `docs/architecture/` + diagrams
- **Technical**: `docs/technical/`

## Diagram Formats

Architecture diagrams are generated as:
- `.mmd` - Mermaid source (git-friendly)
- `.svg` - Rendered image (if mermaid-cli available)

## Now: Generate Documentation

Based on type `$1`, invoking appropriate documentation workflow...
