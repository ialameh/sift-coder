# Use Case: Security Vulnerabilities

**Finding and fixing security issues**

---

## Overview

Security vulnerabilities require prompt identification, systematic fixing, and validation. SiftCoder provides comprehensive security scanning and safe fixing workflows.

---

## Security Workflow

### Step 1: Security Scan

```bash
# 1. Run full security scan
/siftcoder:security scan

# Output:
# 🔒 SECURITY SCAN RESULTS:
#
# 🚨 CRITICAL: SQL Injection
#    File: src/api/users.ts:45
#    Impact: Attackers can execute arbitrary SQL
#
# ⚠️ HIGH: Hardcoded API Key
#    File: src/config.ts:12
#    Impact: Credentials exposed in source code
#
# ⚠️ MEDIUM: Missing Authorization
#    File: src/routes/admin.ts:78
#    Impact: Unauthorized admin access possible

# 2. Check for secrets
/siftcoder:security secrets

# 3. Check dependencies
/siftcoder:security deps
```

### Step 2: Prioritize and Fix

```bash
# 4. Fix critical issues first
/siftcoder:investigate "SQL injection in users endpoint"
/siftcoder:fix "SQL injection vulnerability"

# 5. Set boundaries for safety
/siftcoder:scope add src/api/users.ts
/siftcoder:blast-radius
```

### Step 3: Validate

```bash
# 6. Re-scan to verify fix
/siftcoder:security scan

# 7. Run tests
npm test

# 8. Check for regressions
/siftcoder:blast-radius
```

---

## Common Vulnerabilities

### OWASP Top 10

#### 1. SQL Injection

```bash
# Detect
/siftcoder:security scan

# Investigate
/siftcoder:investigate "SQL injection"

# Fix (uses parameterized queries)
/siftcoder:fix "SQL injection vulnerability"

# Verify
/siftcoder:security scan
```

#### 2. Broken Authentication

```bash
# Detect
/siftcoder:security scan

# Find issues
- Weak password requirements
- Session fixation
- Missing logout

# Fix
/siftcoder:fix "Implement secure authentication"

# Verify
npm run test:auth
```

#### 3. Sensitive Data Exposure

```bash
# Detect
/siftcoder:security secrets

# Find secrets
- API keys in code
- Database credentials
- JWT secrets

# Fix
/siftcoder:fix "Move secrets to environment variables"

# Verify
/siftcoder:security secrets
```

#### 4. XML External Entities (XXE)

```bash
# Detect
/siftcoder:security scan

# Investigate
/siftcoder:investigate "XML parsing vulnerabilities"

# Fix
/siftcoder:fix "Disable XXE in XML parser"

# Verify
npm test
```

#### 5. Broken Access Control

```bash
# Detect
/siftcoder:security scan

# Find issues
- Missing authorization checks
- CORS misconfiguration
- Insecure direct object references

# Fix
/siftcoder:fix "Add authorization middleware"

# Verify
npm run test:security
```

#### 6. Security Misconfiguration

```bash
# Detect
/siftcoder:security scan

# Find issues
- Default credentials
- Debug mode enabled
- Verbose error messages

# Fix
/siftcoder:fix "Secure configuration"

# Verify
/siftcoder:security scan
```

#### 7. Cross-Site Scripting (XSS)

```bash
# Detect
/siftcoder:security scan

# Investigate
/siftcoder:investigate "XSS vulnerability"

# Fix (sanitize input)
/siftcoder:fix "XSS vulnerability"

# Verify
npm run test:xss
```

#### 8. Insecure Deserialization

```bash
# Detect
/siftcoder:security scan

# Investigate
/siftcoder:investigate "Unsafe deserialization"

# Fix
/siftcoder:fix "Implement safe deserialization"

# Verify
npm test
```

#### 9. Using Components with Known Vulnerabilities

```bash
# Detect
/siftcoder:security deps

# Output:
# ⚠️ VULNERABLE DEPENDENCIES:
#
# lodash < 4.17.21 (HIGH)
#   - Prototype pollution
#   - Fix: Upgrade to 4.17.21
#
# minimist < 1.2.6 (HIGH)
#   - Prototype pollution
#   - Fix: Upgrade to 1.2.6

# Fix
npm audit fix
/siftcoder:fix "Upgrade vulnerable dependencies"

# Verify
npm audit
```

#### 10. Insufficient Logging & Monitoring

```bash
# Detect
/siftcoder:security scan

# Add logging
/siftcoder:add-feature "Security event logging"

# Add monitoring
/siftcoder:add-feature "Security monitoring"

# Verify
[Test logging and monitoring]
```

---

## Dependency Security

### Scanning Dependencies

```bash
# 1. Scan for vulnerabilities
/siftcoder:security deps

# 2. Check for outdated packages
npm outdated

# 3. Review license compliance
/siftcoder:security deps --licenses
```

### Fixing Vulnerable Dependencies

```bash
# 1. Automatic fix
npm audit fix

# 2. Manual upgrade
npm update package-name

# 3. Verify compatibility
npm test
/siftcoder:blast-radius
```

---

## Secrets Management

### Finding Secrets

```bash
# 1. Scan for secrets
/siftcoder:security secrets

# Finds:
# - API keys
# - Database credentials
# - JWT secrets
# - Private keys
# - Access tokens
```

### Removing Secrets

```bash
# 2. Remove secrets from code
/siftcoder:fix "Move secrets to environment variables"

# 3. Add to .gitignore
echo ".env" >> .gitignore
echo "*.key" >> .gitignore

# 4. Remove from git history
git filter-branch --force --index-filter \
  "git rm --cached --ignore-unmatch .env" \
  --prune-empty --tag-name-filter cat -- --all

# 5. Rotate exposed secrets
[Generate new credentials]
```

---

## Secure Development Workflow

### Pre-Commit Security Checks

```bash
# 1. Setup pre-commit hook
/siftcoder:add-feature "Security pre-commit hook"

# 2. Configure checks
{
  "qualityGates": {
    "security": {
      "scan": true,
      "secrets": true,
      "deps": true
    }
  }
}

# 3. Auto-scan on commit
git commit
# [Security scan runs automatically]
```

### Pre-Deployment Security

```bash
# 1. Full security scan
/siftcoder:security scan

# 2. OWASP checklist
/siftcoder:security owasp

# 3. Dependency check
/siftcoder:security deps

# 4. Secrets scan
/siftcoder:security secrets

# 5. Fix any issues
/siftcoder:fix "Security issues"

# 6. Re-scan
/siftcoder:security scan

# 7. Deploy only if clean
if [no issues]; then
  npm run deploy
fi
```

---

## Example: Fixing SQL Injection

```bash
# Step 1: Scan
/siftcoder:security scan

# Output:
# 🚨 SQL INJECTION VULNERABILITY
# File: src/api/users.ts:45
# Code: `SELECT * FROM users WHERE id = ${userId}`
# Impact: Attackers can execute arbitrary SQL

# Step 2: Investigate
/siftcoder:investigate "SQL injection in users endpoint"

# Step 3: Set boundaries
/siftcoder:scope add src/api/users.ts

# Step 4: Fix
/siftcoder:fix "SQL injection vulnerability"

# Fix applied:
# Before: `SELECT * FROM users WHERE id = ${userId}`
# After: `SELECT * FROM users WHERE id = $1`, [userId]

# Step 5: Verify
npm test
/siftcoder:blast-radius

# Step 6: Re-scan
/siftcoder:security scan

# Output:
# ✅ No SQL injection vulnerabilities found
```

---

## Security Best Practices

### ✅ DO

- Run security scans regularly
- Fix vulnerabilities immediately
- Use parameterized queries
- Enable security headers
- Implement rate limiting
- Log security events
- Keep dependencies updated
- Use environment variables for secrets
- Enable CORS properly
- Implement CSRF protection

### ❌ DON'T

- Commit secrets to git
- Use eval() on user input
- Disable security checks
- Ignore vulnerability warnings
- Use default credentials
- Expose stack traces
- Trust user input
- Skip authorization checks
- Use weak encryption
- Disable HTTPS

---

## Quick Reference

| Task | Command |
|------|---------|
| **Full scan** | `/security scan` |
| **Find secrets** | `/security secrets` |
| **Check deps** | `/security deps` |
| **OWASP check** | `/security owasp` |
| **Fix issue** | `/fix "security issue"` |

---

## See Also

- [Workflow: Security Review](../../05-workflows/security-review.md)
- [Command: Security](../../02-command-reference/by-category/secure-workflow.md)
- [Best Practices: Safety First](../../09-best-practices/index.md)
