# Workflow: Security Review

**Complete security audit workflow for vulnerability detection**

---

## Overview

This workflow guides you through performing a comprehensive security audit:

1. Full security scan (OWASP Top 10, secrets, dependencies)
2. Vulnerability analysis
3. Remediation planning
4. Fix validation

**Time Estimate:** 15 min - 1 hour

**Difficulty:** ⭐⭐ Intermediate

---

## Prerequisites

- [ ] Existing codebase
- [ ] SiftCoder plugin loaded
- [ ] No special setup required

---

## Step-by-Step Workflow

### Step 1: Run Full Security Scan

```bash
/siftcoder:security scan
```

**What happens:**
```
🔒 Security Scan - Full Audit

SCANNING...
  ✓ Code analysis (245 files)
  ✓ Dependency check (156 packages)
  ✓ Secret detection
  ✓ Configuration review

RESULTS:

🚨 CRITICAL (2):
  1. Hardcoded API key in src/config/api.ts:23
  2. SQL injection vulnerability in src/models/user.ts:67

⚠️  HIGH (5):
  1. Outdated package: lodash < 4.17.21
  2. Missing CORS headers
  3. Weak password policy

📋 Summary:
  Critical: 2
  High: 5
  Medium: 12
  Low: 8
```

### Step 2: Review Specific Categories

#### Secrets Detection

```bash
/siftcoder:security secrets
```

**Finds:**
- API keys
- Passwords
- Tokens
- Certificates

#### OWASP Top 10

```bash
/siftcoder:security owasp
```

**Checks:**
- Injection attacks
- Broken authentication
- Sensitive data exposure
- XSS vulnerabilities
- Security misconfiguration

#### Dependency Vulnerabilities

```bash
/siftcoder:security deps
```

**Scans:**
- CVE databases
- Known vulnerabilities
- Outdated packages

### Step 3: Prioritize and Plan

Organize findings by severity:

**Priority Order:**
1. **CRITICAL** - Fix immediately
2. **HIGH** - Fix this week
3. **MEDIUM** - Fix this sprint
4. **LOW** - Fix when convenient

### Step 4: Fix Vulnerabilities

#### Option A: Fix Critical Issues Manually

```bash
# For hardcoded secrets
/siftcoder:fix "Remove hardcoded API key from src/config/api.ts"

# For SQL injection
/siftcoder:fix "Add parameterized queries to src/models/user.ts"
```

#### Option B: Update Dependencies

```bash
# Update vulnerable packages
npm audit fix

# Review changes
npm audit
```

#### Option C: Use Self-Healing

```bash
/siftcoder:heal
```

Will automatically attempt to fix issues.

### Step 5: Re-scan and Validate

```bash
/siftcoder:security scan
```

**Verify:**
- Previous issues resolved
- No new issues introduced
- Coverage improved

---

## Commands Reference

| Command | Purpose |
|---------|---------|
| `/security scan` | Full security audit |
| `/security secrets` | Detect leaked secrets |
| `/security owasp` | OWASP Top 10 check |
| `/security deps` | Dependency vulnerabilities |

---

## Security Checklist

### Before Production

- [ ] No hardcoded secrets
- [ ] All inputs validated
- [ ] SQL injection protection
- [ ] XSS protection enabled
- [ ] Authentication robust
- [ ] HTTPS enforced
- [ ] Dependencies up to date
- [ ] Error messages don't leak info

### Regular Audits

- [ ] Monthly security scans
- [ ] Dependency updates
- [ ] Secret detection
- [ ] Access review

---

## Example: Complete Workflow

```bash
# 1. Full scan
/siftcoder:security scan

# 2. Review critical issues
# Found: Hardcoded API key

# 3. Fix it
/siftcoder:fix "Remove hardcoded API key"

# 4. Update dependencies
npm audit fix

# 5. Re-scan
/siftcoder:security scan

# 6. Verify resolved
✅ Critical: 0
✅ High: 2 (acceptable)
```

---

## Best Practices

### Proactive Security

✅ **DO:**
- Run security scans regularly
- Fix critical issues immediately
- Keep dependencies updated
- Use environment variables for secrets

❌ **DON'T:**
- Ignore security warnings
- Commit secrets to repo
- Use outdated packages
- Skip security reviews

### Secrets Management

✅ **DO:**
- Use `.env` files
- Add `.env` to `.gitignore`
- Use secret scanning
- Rotate compromised credentials

❌ **DON'T:**
- Hardcode secrets
- Commit `.env` files
- Share screenshots with secrets
- Reuse passwords

---

## See Also

- [Command: /security](../02-command-reference/by-category/secure-workflow.md)
- [Use Case: Security Audit](../06-use-cases/by-task-type/security-audit.md)
