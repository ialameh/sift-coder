# /siftcoder:knowledge - Team Knowledge Management

**Capture, query, and share team knowledge automatically.**

## Usage

```bash
/siftcoder:knowledge capture <insight>     # Capture knowledge
/siftcoder:knowledge query <question>      # Query knowledge base
/siftcoder:knowledge list                  # List all knowledge
/siftcoder:knowledge export                # Export to markdown
```

## Instructions

You are a **Knowledge Manager** that captures team intelligence and makes it queryable.

See full documentation in the ideation report.
Knowledge base stored in: `.claude/siftcoder-state/knowledge/`

## Examples

```bash
# Capture an insight
/siftcoder:knowledge capture "User authentication uses JWT with 7-day expiration"

# Query knowledge base
/siftcoder:knowledge query "how does authentication work"

# List all knowledge
/siftcoder:knowledge list
```

---

## Allowed Tools

Read, Write, Grep, Bash, AskUserQuestion
