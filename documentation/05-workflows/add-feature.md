# Workflow: Add Feature to Existing Code

**Add new functionality to an existing codebase while following established patterns**

---

## Overview

This workflow guides you through adding features to existing code with:

1. Pattern detection (match existing style)
2. Implementation planning
3. Code generation following conventions
4. Quality validation

**Time Estimate:** 30 min - 2 hours

**Difficulty:** ⭐⭐ Intermediate

---

## Why This Workflow?

**Challenges adding to existing code:**
- Matching existing code style
- Integrating with architecture
- Following conventions
- Not breaking existing functionality

**SiftCoder approach:**
- Detects patterns first
- Plans integration carefully
- Generates matching code
- Validates with tests

---

## Prerequisites

- [ ] Existing codebase
- [ ] Clear feature description
- [ ] SiftCoder plugin loaded

---

## Step-by-Step Workflow

### Step 1: Understand Existing Patterns (Optional but Recommended)

```bash
/siftcoder:understand
```

**Output:**
```
🔍 Analyzing project...

Patterns Detected:
├── Naming: camelCase functions, PascalCase components
├── Imports: External → Internal → Relative
├── Tests: Co-located with .test.ts suffix
├── Error handling: Custom error classes
└── Async: async/await with try/catch

Architecture: Clean Architecture
Layers: Presentation → Application → Infrastructure
```

### Step 2: Add Feature

```bash
/siftcoder:add-feature "Feature description"
```

**Example:**
```bash
/siftcoder:add-feature "Add user notifications with email and in-app alerts"
```

**What happens:**

```
🔍 Analyzing codebase...
   Detected: React + Express, TypeScript
   Patterns: Service layer, repository pattern

📋 Feature Plan: user-notifications

Changes Required:
├── New Files (4):
│   ├── src/services/notification.service.ts
│   ├── src/repositories/notification.repository.ts
│   ├── src/components/NotificationList.tsx
│   └── src/components/NotificationItem.tsx
│
├── Modified Files (2):
│   ├── src/App.tsx (add notification routes)
│   └── src/services/index.ts (export notification service)
│
└── Subtasks (6):
    1. Create notification model
    2. Implement notification service
    3. Create repository layer
    4. Build UI components
    5. Add routing
    6. Write tests

Detected Patterns Applied:
├── Naming: camelCase for files, PascalCase for components
├── Tests: Co-located with source
├── Services: Repository pattern with interfaces
└── Error handling: Custom error classes

[Approve] [Modify] [Cancel]
```

### Step 3: Monitor Progress

```bash
/siftcoder:status
```

**Track:**
- Current subtask
- Progress percentage
- Any issues found

### Step 4: Review Implementation

After completion, review what was added:

```bash
# Check new files
git status
git diff --staged

# Run tests
npm test
```

---

## Commands Used

| Command | Purpose |
|---------|---------|
| `/understand` | Detect patterns (optional) |
| `/add-feature <desc>` | Add feature to existing code |
| `/status` | Check progress |
| `/pause` | Stop to review |
| `/resume` | Continue |

---

## Tips & Best Practices

### Before Adding Feature

✅ **DO:**
- Run `/understand` first to detect patterns
- Be specific about feature requirements
- Describe integration points

❌ **DON'T:**
- Skip pattern detection
- Use vague descriptions
- Forget to mention dependencies

### During Implementation

✅ **DO:**
- Monitor progress
- Pause to review if needed
- Check tests pass

❌ **DON'T:**
- Interrupt unnecessarily
- Skip quality gates

### After Implementation

✅ **DO:**
- Review the code
- Test manually
- Document new code

❌ **DON'T:**
- Assume it works
- Skip testing
- Leave undocumented

---

## Troubleshooting

### Issue: Wrong pattern detected

**Solution:**
- Manual code review
- Provide pattern hints in feature description
- Update code to match pattern

### Issue: Tests failing

**Solution:**
- Let QA Fixer handle it (automatic)
- If persists, manual review needed
- Check `/status` for details

### Issue: Too many files created

**Solution:**
- Pause with `/pause`
- Review what's needed
- Remove unnecessary files
- Resume with `/resume`

---

## Example: Complete Workflow

```bash
# 1. Understand patterns (recommended)
/siftcoder:understand

# 2. Add feature
/siftcoder:add-feature "Add password reset with email tokens"

# 3. Check progress
/siftcoder:status

# 4. If all good, tests pass
npm test

# 5. Review changes
git diff

# 6. Commit
git add .
git commit -m "Add password reset feature"
```

---

## Complex Features

For features requiring multiple files or complex integration:

### 1. Detailed Description

```bash
/siftcoder:add-feature "Add multi-factor authentication with:
- SMS verification codes
- Backup codes
- TOTP support (Google Authenticator)
- QR code setup
"
```

### 2. Review Plan Carefully

The plan will show:
- All files to create
- Integration points
- Dependencies

**Review before approving:**
- Is this what you want?
- Are there too many files?
- Can it be simplified?

### 3. Consider Phased Approach

For very complex features, break into smaller additions:

```bash
# Phase 1: Basic MFA
/siftcoder:add-feature "Add SMS-based MFA"

# Phase 2: Enhance
/siftcoder:add-feature "Add TOTP support to MFA"
```

---

## See Also

- [Command: /add-feature](../02-command-reference/by-category/build-workflow.md#add-feature)
- [Command: /understand](../02-command-reference/by-category/understand-workflow.md#understand)
- [Workflow: Build New Project](build-new-project.md)
- [Skill: Pattern Detector](../03-skills-reference/pattern-detector.md)
