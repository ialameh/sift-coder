# SESSION & STATE

**Manage session state and checkpoints**

---

## Overview

Commands for managing workflow state, checkpoints, and cross-session continuity.

---

## Commands Overview

| Command | Purpose | Difficulty | Time |
|---------|---------|------------|------|
| `/checkpoint` | Save/restore checkpoints | ⭐ Beginner | 1 min |
| `/handoff` | Cross-session memory | ⭐⭐ Intermediate | 2 min |
| `/rollback <id>` | Rollback to checkpoint | ⭐ Beginner | 1 min |
| `/preview` | Preview changes before applying | ⭐⭐ Intermediate | 5 min |
| `/trace` | View execution trace | ⭐ Beginner | 2 min |

---

## /checkpoint

Save and restore named checkpoints with full context.

### Save Checkpoint

```bash
/siftcoder:checkpoint save before-risky-change
```

### Restore Checkpoint

```bash
/siftcoder:checkpoint restore before-risky-change
```

### List Checkpoints

```bash
/siftcoder:checkpoint list
```

**Output:**
```
📝 Available Checkpoints:

1. before-risky-change
   Created: 2026-01-15 10:30:00
   Description: Before refactoring payment service

2. after-feature-1
   Created: 2026-01-15 11:45:00
   Description: Completed user authentication
```

---

## /handoff

Session memory for cross-session continuity - persist context across Claude Code sessions.

```bash
/siftcoder:handoff
```

**Saves:**
- Current workflow state
- Feature queue status
- Learned patterns
- Configuration

---

## /rollback

Rollback to a specific checkpoint.

```bash
/siftcoder:rollback before-risky-change
```

**Restores:**
- File system state
- Feature queue
- Workflow state

---

## /preview

Preview changes before applying - show diff with approval step.

```bash
/siftcoder:preview
```

**Output:**
```
👁️ Preview Changes

FILES TO MODIFY:

src/payment/service.ts
────────────────────────────────────────
@@ -15,7 +15,9 @@
-   amount: number
+   amount: number
+   currency: string

 private processPayment() {
-   const charge = await stripe.charges.create({
+   const charge = await stripe.charges.create({
+     amount: this.amount * 100,
+     currency: this.currency.toLowerCase()
    });
 }

[APPROVE] [REJECT] [MODIFY]
```

---

## /trace

View execution trace - see what AI did, why, and alternatives considered.

```bash
/siftcoder:trace
```

**Output:**
```
📊 Execution Trace

TASK: Add user authentication
Started: 2026-01-15 10:00:00
Completed: 2026-01-15 10:45:00

STEPS:
1. Planner Agent (2 min)
   → Analyzed requirements
   → Created 5 subtasks
   → Estimated 30 min each

2. Coder Agent - Subtask 1 (8 min)
   → Created auth service
   → Files: src/auth/service.ts
   → Tests: 12 passing

3. Coder Agent - Subtask 2 (12 min)
   → Created auth routes
   → Files: src/routes/auth.ts
   → Tests: 8 passing

ALTERNATIVES CONSIDERED:
- JWT vs sessions → Chose JWT (stateless)
- Local auth vs SSO → Chose local (MVP)

DECISIONS MADE:
- Used bcrypt for password hashing (industry standard)
- 7-day session expiration (balance UX/security)
```

---

## Use Cases

### Save Before Risky Changes

```bash
# 1. Save checkpoint
/siftcoder:checkpoint save before-refactor

# 2. Make changes
[some risky refactoring]

# 3. If issues, rollback
/siftcoder:rollback before-refactor
```

### Resume Later

```bash
# 1. Before leaving, save handoff
/siftcoder:handoff

# 2. Next day, resume
/siftcoder:resume
```

### Preview Before Applying

```bash
# See what will change
/siftcoder:preview

# Approve if good
[Changes applied]

# Or reject
[Changes discarded]
```

---

## See Also

- [Workflow Control](./workflow-control.md) - Control workflows
- [COST & EFFICIENCY](./cost-efficiency.md) - Token tracking
