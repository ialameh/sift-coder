# REVIEW Workflow

**Code review automation**

---

## Overview

The REVIEW workflow contains 4 commands for automated code review.

---

## Commands Overview

| Command | Purpose | Difficulty | Time |
|---------|---------|------------|------|
| `/review pr <url>` | Review pull request | ⭐⭐ Intermediate | 10-20 min |
| `/review diff` | Review staged changes | ⭐ Beginner | 5-10 min |
| `/review checklist` | Generate review checklist | ⭐ Beginner | 2-5 min |
| `/review history <file>` | Understand code evolution | ⭐⭐ Intermediate | 10-20 min |

---

## /review pr

Review a pull request - analyze changes, identify issues, suggest improvements.

```bash
/siftcoder:review pr https://github.com/org/repo/pull/123
```

---

## /review diff

Review currently staged changes before committing.

```bash
/siftcoder:review diff
```

---

## /review history

Understand why code exists by analyzing git history and evolution.

```bash
/siftcoder:review history src/legacy/processor.ts
```

---

## See Also

- [Agent: QA Reviewer](../../04-agents-reference/qa-reviewer.md) - QA validation agent
