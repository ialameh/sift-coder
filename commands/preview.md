---
description: Preview changes before applying - show diff with approval step
argument-hint: [--apply|--reject|--partial]
allowed-tools: Read, Bash, Glob, Grep, AskUserQuestion
---

# /siftcoder:preview - Diff Preview Before Apply

Show exactly what changes will be made before applying them, with line-by-line approval options.

## Usage

```
/siftcoder:preview                   - Preview pending changes
/siftcoder:preview --apply           - Apply all previewed changes
/siftcoder:preview --reject          - Reject all pending changes
/siftcoder:preview --partial         - Interactive line-by-line approval
```

## How It Works

When siftcoder is about to make changes, it can show a preview first instead of applying immediately.

### Enable Preview Mode

Set in config or per-command:

```json
// .claude/siftcoder-state/config.json
{
  "previewMode": true,
  "previewThreshold": 10  // Preview if more than 10 lines changed
}
```

Or per-command:
```
/siftcoder:fix "login bug" --preview
```

## Instructions

### Default: Show Pending Changes

Read pending changes from `.claude/siftcoder-state/pending-changes.json`:

```
╔══════════════════════════════════════════════════════════════╗
║                    CHANGE PREVIEW                            ║
╚══════════════════════════════════════════════════════════════╝

Summary: 3 files, 47 lines changed (+32, -15)

┌─ FILE 1: src/auth/login.ts ──────────────────────────────────┐
│  Lines: +18, -8                                              │
└──────────────────────────────────────────────────────────────┘

@@ -40,12 +40,22 @@ export async function login(email: string, password: string) {
   const user = await findUserByEmail(email);

-  if (!user) {
-    throw new Error('User not found');
-  }
+  if (!user) {
+    logger.warn('Login attempt for non-existent user', { email });
+    throw new AuthError('INVALID_CREDENTIALS', 'Invalid email or password');
+  }

-  const valid = await verifyPassword(password, user.passwordHash);
-  if (!valid) {
-    throw new Error('Invalid password');
-  }
+  const valid = await verifyPassword(password, user.passwordHash);
+  if (!valid) {
+    await incrementFailedAttempts(user.id);
+    logger.warn('Failed login attempt', { userId: user.id });
+
+    if (await isAccountLocked(user.id)) {
+      throw new AuthError('ACCOUNT_LOCKED', 'Account locked. Try again later.');
+    }
+
+    throw new AuthError('INVALID_CREDENTIALS', 'Invalid email or password');
+  }
+
+  await resetFailedAttempts(user.id);

   return createSession(user);
 }

┌─ FILE 2: src/auth/errors.ts ─────────────────────────────────┐
│  Lines: +12, -0 (new file)                                   │
└──────────────────────────────────────────────────────────────┘

+export class AuthError extends Error {
+  constructor(
+    public code: string,
+    message: string
+  ) {
+    super(message);
+    this.name = 'AuthError';
+  }
+}
+
+export type AuthErrorCode = 'INVALID_CREDENTIALS' | 'ACCOUNT_LOCKED';

┌─ FILE 3: src/auth/lockout.ts ────────────────────────────────┐
│  Lines: +2, -7                                               │
└──────────────────────────────────────────────────────────────┘

@@ -15,10 +15,5 @@ export async function isAccountLocked(userId: string): Promise<boolean> {
   const attempts = await getFailedAttempts(userId);
-  if (attempts >= 5) {
-    const lastAttempt = await getLastAttemptTime(userId);
-    const lockoutEnd = lastAttempt + LOCKOUT_DURATION;
-    return Date.now() < lockoutEnd;
-  }
-  return false;
+  return attempts >= MAX_ATTEMPTS && !isLockoutExpired(userId);
 }

───────────────────────────────────────────────────────────────

Actions:
  [A] Apply all changes
  [R] Reject all changes
  [P] Partial - choose per file/hunk
  [E] Edit - modify before applying
```

### With `--apply`

Apply all pending changes:

```
APPLYING CHANGES

[1/3] src/auth/login.ts ... Applied
[2/3] src/auth/errors.ts ... Applied (created)
[3/3] src/auth/lockout.ts ... Applied

All changes applied successfully.

Pending changes cleared.
```

### With `--reject`

Discard all pending changes:

```
REJECTING CHANGES

All 3 pending changes discarded.

No files modified.
```

### With `--partial`

Interactive approval per file or hunk:

```
PARTIAL APPROVAL MODE

File 1/3: src/auth/login.ts (+18, -8)

Hunk 1/2:
@@ -40,8 +40,12 @@
-  if (!user) {
-    throw new Error('User not found');
-  }
+  if (!user) {
+    logger.warn('Login attempt for non-existent user', { email });
+    throw new AuthError('INVALID_CREDENTIALS', 'Invalid email or password');
+  }

Apply this hunk? [Y]es / [N]o / [E]dit / [S]kip file / [Q]uit
> Y

Hunk 2/2:
@@ -48,7 +52,15 @@
-  const valid = await verifyPassword(password, user.passwordHash);
-  if (!valid) {
-    throw new Error('Invalid password');
-  }
+  const valid = await verifyPassword(password, user.passwordHash);
+  if (!valid) {
+    await incrementFailedAttempts(user.id);
+    ...
+  }

Apply this hunk? [Y]es / [N]o / [E]dit / [S]kip file / [Q]uit
> Y

File 2/3: src/auth/errors.ts (new file, +12 lines)

Apply entire file? [Y]es / [N]o / [E]dit
> Y

File 3/3: src/auth/lockout.ts (+2, -7)

Apply this change? [Y]es / [N]o / [E]dit
> N

───────────────────────────────────────────────────────────────

PARTIAL APPLY COMPLETE

Applied:
  ✓ src/auth/login.ts (2 hunks)
  ✓ src/auth/errors.ts (new file)

Rejected:
  ✗ src/auth/lockout.ts

Remaining rejected changes saved to:
  .claude/siftcoder-state/rejected-changes.json
```

## Preview State Storage

### Pending Changes Format

`.claude/siftcoder-state/pending-changes.json`:

```json
{
  "createdAt": "2026-01-12T...",
  "reason": "fix: login error handling",
  "files": [
    {
      "path": "src/auth/login.ts",
      "action": "modify",
      "hunks": [
        {
          "startLine": 40,
          "endLine": 52,
          "oldContent": "...",
          "newContent": "...",
          "context": "login function error handling"
        }
      ]
    },
    {
      "path": "src/auth/errors.ts",
      "action": "create",
      "content": "..."
    }
  ],
  "summary": {
    "filesChanged": 3,
    "linesAdded": 32,
    "linesRemoved": 15
  }
}
```

## Integration with Workflows

### In Fix Mode

```
/siftcoder:fix "login bug" --preview

# ... siftcoder analyzes and proposes changes ...

PROPOSED FIX (Preview Mode)

Changes would affect 3 files:
  src/auth/login.ts (+18, -8)
  src/auth/errors.ts (+12, new)
  src/auth/lockout.ts (+2, -7)

Changes staged for preview. Run:
  /siftcoder:preview          - See full diff
  /siftcoder:preview --apply  - Apply changes
  /siftcoder:preview --reject - Discard changes
```

### In Build Mode

When `previewMode: true` in config, each subtask stages changes for review:

```
SUBTASK 3/7: Add error handling

Changes prepared (preview mode):
  2 files, 24 lines

/siftcoder:preview to review
/siftcoder:preview --apply to continue
```

## Tips

```
PREVIEW MODE TIPS

When to use preview:
  - First time using siftcoder on a codebase
  - Making changes to critical files
  - When you want to learn what AI is doing
  - Building trust before going fully autonomous

Threshold setting:
  previewThreshold: 10   - Preview if >10 lines (recommended)
  previewThreshold: 0    - Always preview (learning mode)
  previewThreshold: 100  - Only preview large changes

Keyboard shortcuts in partial mode:
  Y - Yes, apply this
  N - No, reject this
  E - Edit before applying
  S - Skip rest of file
  Q - Quit, apply nothing more

After rejecting:
  Rejected changes are saved
  You can review why they were rejected
  Inform siftcoder of patterns to avoid
```
