# SECURE Workflow Commands

**Security scanning and vulnerability detection**

The SECURE workflow contains commands for comprehensive security analysis - from OWASP Top 10 checks to secret detection to dependency vulnerability scanning.

---

## Commands Overview

| Command | Purpose | Difficulty | Time |
|---------|---------|------------|------|
| [`/security scan`](#security-scan) | Full security audit | ⭐⭐ Intermediate | 5-15 min |
| [`/security secrets`](#security-secrets) | Detect leaked secrets | ⭐ Beginner | 2-5 min |
| [`/security deps`](#security-deps) | Dependency vulnerabilities | ⭐ Beginner | 2-5 min |
| [`/security owasp`](#security-owasp) | OWASP Top 10 checks | ⭐⭐ Intermediate | 5-10 min |

---

## /security scan

Perform a complete security audit including OWASP Top 10, secret detection, and dependency vulnerabilities.

### Quick Overview
- **Purpose**: Full security audit
- **Difficulty**: ⭐⭐ Intermediate
- **Time Estimate**: 5-15 min
- **Mode**: Read-only

### When to Use This Command

✅ **Use this when:**
- Pre-deployment security check
- Regular security audits
- After significant code changes
- Compliance requirements

### Syntax

```bash
/siftcoder:security scan
```

### Examples

```bash
/siftcoder:security scan
```

**Output:**
```
🔒 Security Scan - Full Audit

SCANNING...
  ✓ Code analysis (245 files)
  ✓ Dependency check (156 packages)
  ✓ Secret detection (regex patterns)
  ✓ Configuration review

RESULTS:

🚨 CRITICAL (2):
  1. Hardcoded API key in src/config/api.ts:23
  2. SQL injection vulnerability in src/models/user.ts:67

⚠️  HIGH (5):
  1. Outdated package: lodash < 4.17.21 (CVE-2021-23337)
  2. Missing CORS headers
  3. Weak password policy

📋 Summary:
  Critical: 2
  High: 5
  Medium: 12
  Low: 8

Run individual commands for details:
→ /security secrets    - See all secrets
→ /security owasp      - OWASP details
→ /security deps       - Dependency issues
```

---

## /security secrets

Detect leaked API keys, passwords, tokens, and other sensitive data in the codebase.

### Quick Overview
- **Purpose**: Secret detection
- **Difficulty**: ⭐ Beginner
- **Time Estimate**: 2-5 min
- **Mode**: Read-only

### Syntax

```bash
/siftcoder:security secrets
```

### Examples

```bash
/siftcoder:security secrets
```

**Output:**
```
🔑 Secret Detection

SCANNING for secrets...

FOUND (6):

1. API Key
   File: src/config/api.ts:23
   Pattern: sk_live_51M...
   Type: Stripe API Key

2. Database Password
   File: .env.example:5
   Pattern: password=HardcodedPass123
   Type: Database credential

3. JWT Secret
   File: src/auth/jwt.ts:12
   Pattern: secret-key-123
   Type: JWT signing key

RECOMMENDATIONS:
→ Move secrets to environment variables
→ Use .env for local development
→ Add .env to .gitignore
→ Rotate leaked credentials
```

---

## /security deps

Scan dependencies for known vulnerabilities using CVE databases.

### Quick Overview
- **Purpose**: Dependency vulnerability scanning
- **Difficulty**: ⭐ Beginner
- **Time Estimate**: 2-5 min
- **Mode**: Read-only

### Syntax

```bash
/siftcoder:security deps
```

### Examples

```bash
/siftcoder:security deps
```

**Output:**
```
📦 Dependency Vulnerability Scan

SCANNING 156 packages...

VULNERABLE PACKAGES (3):

1. lodash@4.17.20
   Severity: HIGH
   CVE: CVE-2021-23337
   Fix: Upgrade to 4.17.21

2. axios@0.21.1
   Severity: MEDIUM
   CVE: CVE-2021-3749
   Fix: Upgrade to 0.21.2

3. minimist@1.2.5
   Severity: LOW
   CVE: CVE-2020-7598
   Fix: Upgrade to 1.2.6

REMEDIATION:
→ npm audit fix
→ Review breaking changes before upgrading
```

---

## /security owasp

Check for OWASP Top 10 vulnerabilities including injection, XSS, authentication issues.

### Quick Overview
- **Purpose**: OWASP Top 10 vulnerability check
- **Difficulty**: ⭐⭐ Intermediate
- **Time Estimate**: 5-10 min
- **Mode**: Read-only

### Syntax

```bash
/siftcoder:security owasp
```

### Examples

```bash
/siftcoder:security owasp
```

**Output:**
```
🛡️ OWASP Top 10 Check

A01:2021 – Broken Access Control
  ⚠️  Missing authorization on /api/admin/users
  ⚠️  No rate limiting on login endpoint

A03:2021 – Injection
  🚨 SQL injection in user search (src/models/user.ts:67)
  🚨 No input sanitization on form inputs

A02:2021 – Cryptographic Failures
  ⚠️  Storing passwords in plain text
  ⚠️  Using MD5 for password hashing

A04:2021 – Insecure Design
  ⚠️  No account lockout after failed logins
  ⚠️  Security questions (knowledge-based auth)

A05:2021 – Security Misconfiguration
  ⚠️  CORS allows all origins (*)
  ⚠️  Debug mode enabled in production
  ⚠️  Default credentials still configured

A07:2021 – Identification and Authentication Failures
  ⚠️  Passwords don't enforce complexity
  ⚠️  Session IDs don't expire

RECOMMENDATIONS:
→ Use parameterized queries for SQL
→ Implement proper password hashing (bcrypt/argon2)
→ Add rate limiting
→ Configure CORS properly
→ Enable HTTPS only
```

---

## Workflow Examples

### Pre-Deployment Security Check

```bash
# Full security scan before deployment
/siftcoder:security scan

# Fix critical issues, then re-run
/siftcoder:security owasp
/siftcoder:security secrets
```

### Continuous Security Monitoring

```bash
# Add to CI/CD pipeline
/siftcoder:security deps    # Check dependencies
/siftcoder:security secrets # Check for secrets
```

---

## See Also

- [TEST Workflow](test-workflow.md) - Security testing
- [REVIEW Workflow](review-workflow.md) - Security code review
- [COMPLY Workflow](comply-workflow.md) - Compliance checking
