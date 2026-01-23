# Command Reference Template

**Standard template for documenting SiftCoder commands**

Use this template when creating documentation for individual commands. This ensures consistency across all 103 commands.

---

## Template Structure

```markdown
# /siftcoder:command-name

## Quick Overview
- **Purpose**: One-line summary of what the command does
- **Difficulty**: ⭐ Beginner | ⭐⭐ Intermediate | ⭐⭐⭐ Advanced
- **Time Estimate**: X min
- **Mode**: Read-only | Write-enabled | Autonomous

## When to Use This Command

✅ **Use this when:**
- Clear criterion 1
- Clear criterion 2
- Clear criterion 3

❌ **Don't use when:**
- Anti-pattern 1
- Anti-pattern 2

🔄 **Alternatives:**
- `/other-command` - For [situation]
- `/another-command` - For [situation]

## Syntax

```bash
/siftcoder:command <required-arg> [optional-arg]
```

**Arguments:**
- `arg1`: Description
- `arg2`: Description (default: value)

## How It Works

[Step-by-step process of what the command does]

### Phase 1: [Phase Name]
- Step 1
- Step 2

### Phase 2: [Phase Name]
- Step 1
- Step 2

## Examples

### Basic Example

```bash
/siftcoder:command "example"
```

**Context**: When to use this

**Output**: What you'll see

### Advanced Example

```bash
/siftcoder:command "example" --option
```

**Context**: When to use this

**Output**: What you'll see

### Real-World Example

**Scenario**: [Real-world situation]

```bash
/siftcoder:command "real example"
```

**Result**: [What happened]

## What This Command Does

[Detailed explanation of the command's workflow]

### Input Processing
[How the command processes input]

### Analysis Performed
[What analysis is done]

### Output Generated
[What output is produced]

## Integration

### Skills Used
- [Skill name] - [What it does]
- [Skill name] - [What it does]

### Agents Invoked
- **Agent Name** - [Role in workflow]
- **Agent Name** - [Role in workflow]

### Related Commands
- `/related-command` - [Relationship]
- `/another-command` - [Relationship]

### Prerequisites
- [What you need before running]
- [Any setup required]

## Configuration

[Configuration options if applicable]

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `option` | type | default | Description |

## Tips & Best Practices

✅ **DO:**
- Best practice 1
- Best practice 2
- Best practice 3

❌ **DON'T:**
- Anti-pattern 1
- Anti-pattern 2
- Anti-pattern 3

💡 **PRO TIP:**
- Advanced tip that saves time or avoids issues

## Troubleshooting

| Issue | Solution |
|-------|----------|
| Problem description | Solution steps |
| Another problem | Solution steps |

## Output Examples

### Successful Execution

```
[Example of successful output]
```

### Error Cases

```
[Example of error output with explanation]
```

## See Also

- [Workflow: X](../../05-workflows/y.md)
- [Use Case: Z](../../06-use-cases/by-task-type/z.md)
- [Related Command](../other-command.md)
- [Skill: Name](../../03-skills-reference/skill-name.md)
```

---

## Required Sections Checklist

Every command document MUST include:

- [x] Quick Overview (purpose, difficulty, time, mode)
- [x] When to Use This Command (criteria and alternatives)
- [x] Syntax (with arguments)
- [x] How It Works (step-by-step process)
- [x] Examples (at least 2: basic and advanced)
- [x] Integration (skills, agents, related commands)
- [x] Tips & Best Practices (DO, DON'T, PRO TIP)
- [x] Troubleshooting (common issues)
- [x] See Also (cross-references)

---

## Difficulty Ratings

| Rating | Description | Target Audience |
|--------|-------------|-----------------|
| ⭐ Beginner | Simple, straightforward | New users, common tasks |
| ⭐⭐ Intermediate | Multiple steps, some complexity | Comfortable users, specific tasks |
| ⭐⭐⭐ Advanced | Complex, requires knowledge | Experienced users, specialized tasks |

## Time Estimates

| Estimate | Description |
|----------|-------------|
| 1-5 min | Quick commands, simple operations |
| 5-15 min | Standard commands, typical operations |
| 15-30 min | Complex commands, deep analysis |
| 30+ min | Multi-phase workflows, large projects |

## Modes

| Mode | Description | Example Commands |
|------|-------------|------------------|
| **Read-only** | No code changes, safe exploration | `/investigate`, `/understand` |
| **Write-enabled** | Makes code changes with safety | `/fix`, `/add-feature` |
| **Autonomous** | Runs workflow automatically | `/build`, `/siftcoder` |

---

## Cross-Reference Guidelines

### Related Commands

Link to commands that are:
- Similar in functionality
- Often used together
- Alternatives for different situations
- Prerequisites or follow-ups

### Workflows

Link to workflow guides that show:
- Step-by-step usage
- Real-world scenarios
- Best practices in context

### Use Cases

Link to use cases that demonstrate:
- Real-world applications
- Problem-solving examples
- Industry-specific usage

### Skills & Agents

Link to:
- Skills that the command uses
- Agents that the command invokes
- Related capabilities

---

## Example: Filled Template

Here's an example of how to fill this template for `/siftcoder:investigate`:

```markdown
# /siftcoder:investigate

## Quick Overview
- **Purpose**: Safely explore codebase to understand issues without making changes
- **Difficulty**: ⭐ Beginner
- **Time Estimate**: 5-15 min
- **Mode**: Read-only

## When to Use This Command

✅ **Use this when:**
- You need to understand a bug before fixing it
- You're new to a codebase and need exploration
- You want root cause analysis without risk
- You need to identify affected files

❌ **Don't use when:**
- You already understand the issue
- You're ready to make changes (use `/fix` instead)

🔄 **Alternatives:**
- `/understand` - For general codebase exploration
- `/fix` - For fixing the issue after investigation
- `/learn explain` - For deep file explanation

## Syntax

```bash
/siftcoder:investigate <issue-description>
```

**Arguments:**
- `issue-description`: Description of the issue to investigate

## How It Works

### Phase 1: Issue Analysis
- Parse the issue description
- Identify key terms and context
- Determine search strategy

### Phase 2: Codebase Exploration
- Search for relevant code patterns
- Trace execution paths
- Identify data flows

### Phase 3: Root Cause Analysis
- Analyze findings
- Identify root cause
- List affected files

### Phase 4: Boundary Suggestions
- Suggest modifiable files
- Identify protected areas
- Provide fix recommendations

## Examples

### Basic Example

```bash
/siftcoder:investigate "Users can't log in after password reset"
```

**Context**: Authentication issue in production

**Output**:
```
🔍 Investigating: Users can't log in after password reset

📍 Root Cause Identified
   File: src/services/auth.ts:45-52
   Issue: Token expiration check uses wrong timezone

📁 Affected Files
   ✓ src/services/auth.ts     (modifiable)
   ✗ src/routes/auth.ts       (protected - not related)

💡 Suggested Boundaries
   Modifiable: src/services/auth.ts
   Protected: Everything else
```

## Integration

### Skills Used
- `semantic-codebase-search` - Finds relevant code
- `pattern-detector` - Identifies code patterns

### Agents Invoked
- **Investigator** - Read-only exploration and analysis

### Related Commands
- `/fix` - Fix the issue after investigation
- `/scope` - Manage file boundaries
- `/understand` - Broader codebase understanding

### Prerequisites
- Codebase should be accessible
- No special setup required

## Tips & Best Practices

✅ **DO:**
- Always investigate before fixing unfamiliar issues
- Review the suggested boundaries carefully
- Check the affected files list

❌ **DON'T:**
- Skip investigation if you're unsure of the root cause
- Modify files suggested as protected

💡 **PRO TIP:**
Use investigation results to create precise boundaries for the `/fix` command, reducing risk of unintended changes.

## Troubleshooting

| Issue | Solution |
|-------|----------|
| No root cause found | Provide more specific issue description |
| Too many files affected | Narrow the issue description |
| Can't understand findings | Use `/learn explain` on specific files |

## See Also

- [Workflow: Investigate & Fix](../../05-workflows/investigate-fix.md)
- [Use Case: Debugging Production](../../06-use-cases/by-task-type/debugging-production.md)
- [Command: /fix](fix.md)
- [Agent: Investigator](../../04-agents-reference/investigator.md)
```

---

## Usage Guidelines

1. **Copy this template** for each new command document
2. **Fill in all required sections** using the checklist
3. **Use consistent formatting** (tables, code blocks, headers)
4. **Include real examples** from actual command usage
5. **Add cross-references** to related documentation
6. **Test all examples** to ensure they work
7. **Update when command changes**

---

## File Naming

Place command documentation in:
```
documentation/02-command-reference/by-category/[category].md
```

For category organization, see [Command Reference Index](../02-command-reference/index.md).

---

## Related Templates

- [Skill Reference Template](./skill-reference-template.md)
- [Agent Reference Template](./agent-reference-template.md)
- [Workflow Template](./workflow-template.md)
