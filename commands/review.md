# /siftcoder:review - Automated Code Review

Comprehensive code review automation for PRs, diffs, and code changes.

## Usage

```
/siftcoder:review [subcommand] [target]
```

## Subcommands

| Subcommand | Description |
|------------|-------------|
| `pr` | Review a pull request (default) |
| `diff` | Review staged/unstaged changes |
| `file` | Deep review of specific file |
| `checklist` | Generate review checklist |
| `history` | Understand why code was written |

## Arguments
- `$ARGUMENTS` - Subcommand, PR URL/number, or file path

## Instructions

You are a senior engineer performing thorough code review. Be constructive, specific, and actionable. Catch bugs before they reach production.

---

## Phase 0: Interactive Setup

**Use AskUserQuestion tool:**
```
Question: "What would you like me to review?"
Header: "Target"
Options:
- "Pull Request" - "Review a GitHub/GitLab PR"
- "My Changes" - "Review staged and unstaged changes"
- "Specific File" - "Deep dive into one file"
- "Generate Checklist" - "Create review checklist for this codebase"
```

**Use AskUserQuestion tool:**
```
Question: "How thorough should the review be?"
Header: "Depth"
Options:
- "Standard (Recommended)" - "Security, bugs, style, performance"
- "Quick" - "Critical issues only (~2 min)"
- "Comprehensive" - "Include architecture, tests, docs"
```

---

## Subcommand: pr

### Phase 1: PR Context Gathering

```
GATHERING PR CONTEXT...

PR: #123 - Add user authentication
Author: @developer
Branch: feature/auth → main
Files changed: 12
Lines: +450 / -23
```

**Context Analysis:**
1. Fetch PR metadata (title, description, labels)
2. Get file diff
3. Identify related issues/tickets
4. Check CI status
5. Review previous comments

```
PR CONTEXT

Title: Add user authentication with OAuth2
Description: Implements Google and GitHub OAuth...

Related:
├── Issue: #89 - Users cannot log in
├── Depends on: PR #120 (merged)
└── Blocks: PR #125

CI Status:
├── Tests: ✓ Passing
├── Lint: ✓ Passing
├── Build: ✓ Passing
└── Security: ⚠ 1 warning

Previous Reviews:
└── @senior-dev: "LGTM on auth flow, please add tests"
```

### Phase 2: Automated Review

```
REVIEWING CODE CHANGES...
```

**Review Categories:**

#### Security Review
```
SECURITY

✓ PASS: No hardcoded secrets detected
✓ PASS: Input validation present
✓ PASS: SQL injection protected (parameterized queries)

⚠ WARNING: src/auth/oauth.ts:45
  CSRF token not validated on callback
  Risk: Cross-site request forgery
  Suggestion: Validate state parameter matches session

⚠ WARNING: src/auth/session.ts:23
  Session cookie missing secure flags
  Risk: Session hijacking on HTTP
  Suggestion: Add { secure: true, httpOnly: true, sameSite: 'strict' }
```

#### Bug Detection
```
POTENTIAL BUGS

❌ BUG: src/auth/login.ts:67
  ```javascript
  if (user = await findUser(email)) {  // Assignment, not comparison!
  ```
  Fix: Use === for comparison

❌ BUG: src/auth/token.ts:34
  ```javascript
  const expiry = Date.now() + 3600;  // Missing * 1000!
  ```
  Token expires in 3.6 seconds, not 1 hour
  Fix: Date.now() + 3600 * 1000

⚠ POSSIBLE BUG: src/auth/oauth.ts:89
  ```javascript
  } catch (e) {
    return null;  // Silently swallowing error
  }
  ```
  Consider: Log error, return specific error type
```

#### Logic Review
```
LOGIC ISSUES

⚠ ISSUE: src/auth/permissions.ts:23
  ```javascript
  if (user.role === 'admin' || user.role === 'superadmin') {
    // Admin check
  }
  ```
  Consider: Use role hierarchy or Set for maintainability
  ```javascript
  const ADMIN_ROLES = new Set(['admin', 'superadmin']);
  if (ADMIN_ROLES.has(user.role)) {
  ```

⚠ ISSUE: src/auth/login.ts:45
  Rate limiting not implemented for login attempts
  Risk: Brute force attacks possible
  Suggestion: Add rate limiting middleware
```

#### Performance Review
```
PERFORMANCE

⚠ WARNING: src/auth/users.ts:34
  ```javascript
  const users = await db.query('SELECT * FROM users');
  return users.find(u => u.email === email);
  ```
  Problem: Loading all users into memory
  Fix: Use WHERE clause in query

⚠ WARNING: src/auth/oauth.ts:56
  HTTP request inside loop
  Consider: Batch requests or use Promise.all
```

#### Style & Consistency
```
STYLE

ℹ SUGGESTION: src/auth/login.ts
  Inconsistent error handling pattern
  Lines 23, 45, 67 use different approaches
  Consider: Standardize on one pattern

ℹ SUGGESTION: src/auth/session.ts
  Magic numbers: 3600, 86400
  Consider: Extract to named constants
  ```javascript
  const SESSION_DURATION = 3600; // 1 hour
  const REMEMBER_ME_DURATION = 86400 * 30; // 30 days
  ```

ℹ SUGGESTION: src/auth/oauth.ts
  Function `handleOAuthCallback` is 85 lines
  Consider: Extract into smaller functions
```

#### Test Coverage
```
TEST COVERAGE

❌ MISSING: src/auth/oauth.ts
  No tests for OAuth callback handler
  This is a critical authentication path

❌ MISSING: src/auth/token.ts
  Token refresh logic untested

✓ GOOD: src/auth/login.ts
  Tests exist with good coverage

⚠ INSUFFICIENT: src/auth/permissions.ts
  Only happy path tested
  Missing: invalid roles, edge cases
```

### Phase 3: Review Summary

```
CODE REVIEW COMPLETE
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

VERDICT: REQUEST CHANGES

┌─────────────────────────────────────────────────────────────┐
│ Summary                                                     │
│                                                             │
│ ❌ Bugs: 2 (must fix)                                       │
│ ⚠ Security: 2 warnings                                      │
│ ⚠ Performance: 2 issues                                     │
│ ℹ Style: 3 suggestions                                      │
│ 📝 Tests: 2 missing                                         │
└─────────────────────────────────────────────────────────────┘

MUST FIX BEFORE MERGE:

1. [BUG] Assignment instead of comparison (login.ts:67)
2. [BUG] Token expiry calculation wrong (token.ts:34)
3. [SECURITY] Add CSRF validation (oauth.ts:45)
4. [SECURITY] Add secure cookie flags (session.ts:23)

SHOULD FIX:

5. [PERF] N+1 query in user lookup (users.ts:34)
6. [TEST] Add OAuth callback tests
7. [TEST] Add token refresh tests

NICE TO HAVE:

8. [STYLE] Standardize error handling
9. [STYLE] Extract magic numbers
10. [STYLE] Break up large function

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

APPROVAL STATUS: ❌ Changes Requested

Copy-paste for PR comment:
---
## Code Review

### Must Fix
- [ ] `login.ts:67` - Bug: Using = instead of === in condition
- [ ] `token.ts:34` - Bug: Token expires in seconds, not hours
- [ ] `oauth.ts:45` - Security: CSRF validation missing
- [ ] `session.ts:23` - Security: Cookie security flags missing

### Should Fix
- [ ] `users.ts:34` - Performance: Query optimization needed
- [ ] Add tests for OAuth callback
- [ ] Add tests for token refresh

### Suggestions
- Standardize error handling pattern
- Extract magic numbers to constants
- Consider breaking up `handleOAuthCallback`

Overall the authentication flow looks solid! Just need to address the security issues and bugs above before this can be merged.
---
```

---

## Subcommand: diff

```
/siftcoder:review diff
```

Reviews staged and unstaged changes:

```
REVIEWING LOCAL CHANGES...

Staged changes: 3 files
Unstaged changes: 2 files

[Same review format as PR review]

PRE-COMMIT RECOMMENDATIONS:

Before committing:
1. Fix bug in utils.ts:23
2. Add test for new function
3. Run: npm test

Ready to commit:
→ git add -p  # Stage selectively
→ git commit -m "Add user validation"
```

---

## Subcommand: file

```
/siftcoder:review file src/auth/oauth.ts
```

Deep dive single file review:

```
DEEP FILE REVIEW

File: src/auth/oauth.ts
Lines: 245
Complexity: HIGH
Last modified: 3 days ago by @developer

ARCHITECTURE:
├── Well-structured OAuth2 flow
├── Good separation of concerns
└── Missing: Token refresh handling

FUNCTION-BY-FUNCTION:

1. initializeOAuth (lines 12-34)
   Quality: ✓ Good
   Notes: Clear initialization, proper error handling

2. handleOAuthCallback (lines 36-120)
   Quality: ⚠ Needs improvement
   Issues:
   ├── Too long (85 lines)
   ├── Mixed responsibilities
   ├── Error handling inconsistent
   Suggestion: Extract into:
   ├── validateCallback()
   ├── exchangeCodeForToken()
   └── createUserSession()

3. refreshToken (lines 122-156)
   Quality: ❌ Critical issues
   Issues:
   ├── No error handling
   ├── Race condition possible
   └── No retry logic

[Continues for all functions...]

HISTORICAL CONTEXT:

This file has been modified 23 times.
Recent changes:
├── 3 days ago: Added GitHub provider
├── 2 weeks ago: Fixed token storage
└── 1 month ago: Initial OAuth implementation

Related issues:
├── #89: Login failures - FIXED
├── #102: Token refresh broken - OPEN
└── #115: Add Apple sign-in - TODO

AUTHORS:
├── @developer: 60% of code
├── @senior-dev: 30% of code
└── @intern: 10% of code
```

---

## Subcommand: checklist

```
/siftcoder:review checklist
```

Generates project-specific review checklist:

```
GENERATING REVIEW CHECKLIST...

Based on:
├── Project type: TypeScript React + Express
├── Patterns detected: Repository pattern, hooks
├── Previous issues: Security, performance
└── Team preferences: From CLAUDE.md

REVIEW CHECKLIST

## Security
- [ ] No hardcoded secrets or API keys
- [ ] Input validation on all endpoints
- [ ] SQL/NoSQL injection prevention
- [ ] XSS prevention (no dangerouslySetInnerHTML)
- [ ] CSRF protection on mutations
- [ ] Rate limiting on sensitive endpoints
- [ ] Proper authentication checks
- [ ] Authorization verified for resources

## Code Quality
- [ ] No console.log in production code
- [ ] Error handling is consistent
- [ ] No TODO/FIXME without issue link
- [ ] Functions under 50 lines
- [ ] No magic numbers (use constants)
- [ ] Proper TypeScript types (no `any`)

## Performance
- [ ] No N+1 queries
- [ ] No unnecessary re-renders (React)
- [ ] Large lists are virtualized
- [ ] Images are optimized
- [ ] API calls are debounced/throttled

## Testing
- [ ] New code has tests
- [ ] Edge cases covered
- [ ] Error scenarios tested
- [ ] No flaky tests introduced

## Documentation
- [ ] Public APIs documented
- [ ] Complex logic has comments
- [ ] README updated if needed
- [ ] Breaking changes noted

## Project-Specific (learned)
- [ ] Follows repository pattern
- [ ] Uses custom hooks for logic
- [ ] Imports sorted correctly
- [ ] Matches existing naming conventions

Saved to: .claude/siftcoder-state/review/checklist.md
```

---

## Subcommand: history

```
/siftcoder:review history src/auth/oauth.ts
```

Understand why code exists:

```
CODE HISTORY ANALYSIS

File: src/auth/oauth.ts
Created: 2025-08-15 by @developer

EVOLUTION:

v1 (2025-08-15): Initial OAuth with Google
├── Commit: abc123
├── PR: #45 "Add Google OAuth"
└── Why: Basic authentication needed for MVP

v2 (2025-09-01): Add error handling
├── Commit: def456
├── PR: #67 "Fix OAuth errors"
├── Issue: #62 "Users see blank screen on OAuth fail"
└── Why: Production bug, users getting stuck

v3 (2025-10-15): Add GitHub provider
├── Commit: ghi789
├── PR: #89 "Add GitHub OAuth"
└── Why: Feature request from users

v4 (2025-11-20): Security hardening
├── Commit: jkl012
├── PR: #110 "Security audit fixes"
├── Issue: #105 "Security audit findings"
└── Why: Penetration test found CSRF vulnerability

CURRENT KNOWN ISSUES:
├── #102: Token refresh not working reliably
├── #115: Apple sign-in requested
└── #120: Session timeout too short

WHY IS THIS CODE HERE?

Line 45-67: CSRF validation
├── Added in v4 (security hardening)
├── Required by: Security audit
└── Related: Issue #105

Line 89-95: Retry logic
├── Added in v2 (error handling)
├── Why: Network failures caused OAuth to fail
└── Related: Issue #62

Line 120-130: Token storage in Redis
├── Added in v3 (GitHub provider)
├── Why: Needed shared storage for load balancing
└── Related: PR #89

TRIBAL KNOWLEDGE:

- OAuth state must be validated before ANY processing
- Token refresh has race condition, use mutex (TODO)
- GitHub API has lower rate limits, cache aggressively
- Google tokens expire faster than documented
```

---

## Output Files

- `.claude/siftcoder-state/review/pr-{number}.md` - PR review report
- `.claude/siftcoder-state/review/checklist.md` - Review checklist
- `.claude/siftcoder-state/review/history/{file}.md` - File history

---

## Tips & Hints

```
CODE REVIEW BEST PRACTICES

As a reviewer:
  → Be specific - point to exact lines
  → Be constructive - suggest solutions
  → Prioritize - mark severity clearly
  → Be kind - critique code, not people

Common issues to watch for:
  → Security: injection, auth bypass, secrets
  → Bugs: off-by-one, null refs, race conditions
  → Performance: N+1, memory leaks, blocking I/O
  → Maintainability: complexity, duplication

Review efficiency:
  → Start with the PR description
  → Understand the context first
  → Review tests to understand intent
  → Focus on logic, not style (automate style)

REVIEW CATEGORIES

❌ MUST FIX: Bugs, security issues, broken functionality
⚠ SHOULD FIX: Performance, missing tests, error handling
ℹ SUGGESTION: Style, refactoring, nice-to-haves

ASKING FOR CONTEXT

Not sure why code exists?
  → /siftcoder:review history <file>
  → Check git blame
  → Look at related issues/PRs
  → Ask the author (last resort)
```

---

## Integration

After review:
- `/siftcoder:fix` - Fix identified issues
- `/siftcoder:test generate` - Add missing tests
- `/siftcoder:security` - Deep security scan

---

## Skills Used
- **code-reviewer** - Review logic and patterns
- **security-scanner** - Security analysis
- **pattern-detector** - Consistency checks

## Allowed Tools
Read, Grep, Glob, Bash, Task, Write, AskUserQuestion
