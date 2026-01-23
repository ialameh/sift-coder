# Appendices

**Reference tables, cheatsheets, and supplementary documentation**

---

## Available Appendices

1. [Command Cheatsheet](#command-cheatsheet) - Quick reference for all commands
2. [Workflow Comparison Tables](#workflow-comparison) - Compare workflows by use case
3. [Keyboard Shortcuts](#keyboard-shortcuts) - Time-saving shortcuts
4. [File Structure Reference](#file-structure) - State and configuration files
5. [Error Messages](#error-messages) - Common errors and solutions
6. [Performance Tips](#performance-tips) - Optimization strategies

---

## Command Cheatsheet

### Essential Commands

| Category | Command | Quick Use |
|----------|---------|-----------|
| **BUILD** | `/build <spec>` | Build from spec |
| | `/add-feature <desc>` | Add feature |
| **MAINTAIN** | `/investigate <issue>` | Explore issue |
| | `/fix <issue>` | Fix with boundaries |
| **UNDERSTAND** | `/understand` | Analyze codebase |
| | `/search <query>` | Semantic search |
| **DOCUMENT** | `/document architecture` | Generate diagrams |
| **TEST** | `/test generate <file>` | Generate tests |
| **SECURE** | `/security scan` | Full audit |
| **CONTROL** | `/status` | Check progress |
| | `/pause` | Stop workflow |
| | `/resume` | Continue workflow |
| **NOVEL AI** | `/duck <issue>` | Rubber duck |
| | `/ghost <idea>` | What-if exploration |
| | `/ripple <change>` | Impact visualization |

---

### Salesforce Quick Reference

| Task | Command |
|------|---------|
| Analyze Apex | `/apex analyze` |
| Create LWC | `/lwc create <name>` |
| Schema ERD | `/schema erd` |
| Deploy | `/sf-deploy validate` |

---

## Workflow Comparison Tables

### By Goal

| Goal | Best Workflow | Commands |
|------|--------------|----------|
| **New project** | BUILD | `/build <spec>` |
| **Add feature** | BUILD | `/add-feature <desc>` |
| **Fix bug** | MAINTAIN | `/investigate` → `/fix` |
| **Generate docs** | DOCUMENT | `/document architecture` |
| **Security audit** | SECURE | `/security scan` |
| **Add tests** | TEST | `/test generate` |

### By Experience Level

| Level | Recommended Commands |
|-------|-------------------|
| **Beginner** | `/understand`, `/status`, `/help`, `/prompt` |
| **Intermediate** | `/add-feature`, `/document code`, `/test generate` |
| **Advanced** | `/build`, `/heal`, `/swarm`, `/autonomous` |

---

## File Structure Reference

### State Files

```
.claude/siftcoder-state/
├── features.json              # Feature queue with status
├── current-task.json          # Active task details
├── boundaries.json            # Current scope (modifiable/protected)
├── knowledge/                 # Learned patterns and gotchas
├── implementation-log.jsonl    # Event log
├── checkpoints/               # Named restore points
├── diagrams/                  # Generated diagrams
└── config.json               # User configuration
```

### Project Structure

```
project-root/
├── commands/                   # Command definitions (.md files)
├── agents/                     # Agent definitions (.md files)
├── skills/                     # Skills (SKILL.md files)
├── hooks/                      # Hook configurations
├── scripts/                    # Utility scripts
└── documentation/              # This documentation
```

---

## Error Messages

### "Plugin Not Loading"

**Problem:** Commands not appearing after installation

**Solution:**
1. Run `/plugin list` to verify
2. Check `enabledPlugins` in `~/.claude/settings.json`
3. Restart Claude Code

### "Scope/Boundary Errors"

**Problem:** Can't modify files during `/fix`

**Solution:**
```bash
/siftcoder:scope show
/siftcoder:scope add the-file.ts
```

### "Build Taking Too Long"

**Problem:** Build seems stuck

**Solution:**
```bash
/siftcoder:status
/siftcoder:pause
```

### "Tests Failing After Fix"

**Problem:** Protected area tests failing

**Solution:**
```bash
/siftcoder:blast-radius
# Fix affected too much
```

---

## Performance Tips

### Token Optimization

```bash
# Check usage
/siftcoder:budget

# Set budget
/siftcoder:budget set 50000

# Optimize
/siftcoder:budget optimize
```

### Context Management

```bash
# Focus on specific area
/siftcoder:focus src/payment/

# Reduces context, saves tokens
```

### Parallel Execution

```bash
# Run independent tasks in parallel
/siftcoder:swarm start "task1, task2, task3"
```

---

## See Also

- [Getting Started](../01-getting-started/index.md) - New to SiftCoder?
- [Troubleshooting](../01-getting-started/troubleshooting.md) - Having issues?
- [Command Reference](../02-command-reference/index.md) - All commands
