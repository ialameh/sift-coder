# Security Scanner Skill

Comprehensive security analysis for codebases.

## Invocation
This skill is invoked by `/siftcoder:security` or when security analysis is needed.

## Capabilities

### 1. Secret Detection

Detect leaked secrets using pattern matching:

**Supported Providers (50+):**

| Category | Patterns |
|----------|----------|
| AWS | Access Key ID, Secret Access Key, Session Token |
| GCP | Service Account Key, API Key |
| Azure | Storage Key, Connection String, SAS Token |
| GitHub | Personal Access Token, OAuth Token |
| Stripe | Secret Key, Publishable Key, Webhook Secret |
| Twilio | Account SID, Auth Token |
| SendGrid | API Key |
| Slack | Bot Token, Webhook URL |
| Discord | Bot Token, Webhook |
| Database | PostgreSQL, MySQL, MongoDB, Redis URLs |
| Generic | API keys, passwords, tokens, private keys |

**Detection Process:**
```
1. Load secret patterns (regex + entropy)
2. Scan all text files (exclude binaries, node_modules, etc.)
3. For each match:
   a. Verify it's not a false positive (test keys, examples)
   b. Calculate entropy (high entropy = more likely real)
   c. Check if in .gitignore (still report but lower priority)
   d. Extract context (surrounding code)
4. Deduplicate findings
5. Sort by severity
```

**False Positive Reduction:**
- Skip files in .gitignore
- Detect test/example patterns (AKIAEXAMPLE, test_key, etc.)
- Check for placeholder patterns (YOUR_KEY_HERE, xxx, etc.)
- Entropy analysis (random strings vs. readable text)

---

### 2. Dependency Vulnerability Scanning

**Supported Package Managers:**

| Manager | Lock File | Database |
|---------|-----------|----------|
| npm | package-lock.json | npm audit / OSV |
| yarn | yarn.lock | yarn audit / OSV |
| pnpm | pnpm-lock.yaml | pnpm audit / OSV |
| pip | requirements.txt, Pipfile.lock | pip-audit / OSV |
| poetry | poetry.lock | pip-audit / OSV |
| go | go.sum | govulncheck / OSV |
| cargo | Cargo.lock | cargo-audit / OSV |
| composer | composer.lock | Symfony checker |
| bundler | Gemfile.lock | bundler-audit |

**Analysis Process:**
```
1. Detect package manager from lock file
2. Parse dependencies (direct + transitive)
3. Query vulnerability database (OSV.dev API or local)
4. Map CVEs to packages
5. Calculate severity (CVSS score)
6. Find upgrade paths
7. Identify breaking changes
```

**Output Structure:**
```json
{
  "packageManager": "npm",
  "totalDependencies": 156,
  "directDependencies": 23,
  "vulnerabilities": [
    {
      "package": "lodash",
      "installedVersion": "4.17.20",
      "vulnerableVersions": "<4.17.21",
      "fixedVersion": "4.17.21",
      "severity": "critical",
      "cvss": 9.8,
      "cve": "CVE-2021-23337",
      "title": "Prototype Pollution",
      "description": "...",
      "path": ["package.json", "lodash"],
      "isDirect": true,
      "fixCommand": "npm update lodash"
    }
  ]
}
```

---

### 3. OWASP Top 10 Analysis

**A01: Broken Access Control**
```
Patterns:
- Missing authorization checks
- Direct object references without validation
- CORS misconfiguration
- Path traversal vulnerabilities

Detection:
- Look for routes without auth middleware
- Find direct DB queries with user input IDs
- Check CORS configuration (* origins)
- Detect ../ patterns in file operations
```

**A02: Cryptographic Failures**
```
Patterns:
- Weak hashing algorithms (MD5, SHA1 for passwords)
- Hardcoded encryption keys
- Missing HTTPS enforcement
- Weak random number generation

Detection:
- crypto.createHash('md5')
- Hardcoded key variables
- http:// URLs in production config
- Math.random() for security purposes
```

**A03: Injection**
```
Patterns:
- SQL injection (string concatenation in queries)
- NoSQL injection (unsanitized operators)
- Command injection (exec with user input)
- XSS (innerHTML, dangerouslySetInnerHTML)
- Template injection
- LDAP injection

Detection:
- db.query(`SELECT ... ${var}`)
- { $where: userInput }
- exec(`command ${userInput}`)
- element.innerHTML = userInput
```

**A04: Insecure Design**
```
Patterns:
- Missing rate limiting
- No account lockout
- Unlimited file uploads
- Missing input validation

Detection:
- Auth routes without rate limiter
- No failed login counter
- Missing file size/type checks
- No schema validation
```

**A05: Security Misconfiguration**
```
Patterns:
- Debug mode in production
- Default credentials
- Verbose error messages
- Missing security headers
- Unnecessary features enabled

Detection:
- DEBUG=true, NODE_ENV=development
- admin/admin, root/root patterns
- Stack traces in error responses
- Missing helmet/security middleware
```

**A07: Authentication Failures**
```
Patterns:
- Weak password requirements
- Missing MFA
- Session fixation
- Credential stuffing vulnerability

Detection:
- Password regex too permissive
- No 2FA implementation
- Session ID not regenerated on login
- No rate limiting on login
```

**A08: Software Integrity Failures**
```
Patterns:
- Unsigned updates
- Untrusted CI/CD
- Dependency confusion
- Missing SRI for CDN resources

Detection:
- Missing integrity attributes on scripts
- Private package names matching public
- Unsigned commits/releases
```

**A09: Logging Failures**
```
Patterns:
- Sensitive data in logs
- Missing audit logs
- No log integrity protection
- Insufficient logging

Detection:
- console.log(password), logger.info(token)
- No login/logout logging
- Missing security event logging
```

**A10: SSRF**
```
Patterns:
- Unvalidated URL fetching
- Internal service exposure
- Cloud metadata access

Detection:
- fetch(userUrl), axios.get(userInput)
- Missing URL allowlist
- 169.254.169.254 access possible
```

---

### 4. Security Scoring

Calculate overall security score (0-100):

```
Base Score: 100

Deductions:
- Critical finding: -15 points each
- High finding: -8 points each
- Medium finding: -4 points each
- Low finding: -1 point each

Bonuses:
- Security headers configured: +5
- Dependencies up to date: +5
- Pre-commit hooks: +3
- Security tests exist: +5

Minimum: 0
Maximum: 100
```

**Score Interpretation:**
```
90-100: Excellent - Minor improvements only
80-89:  Good - Address high/critical issues
60-79:  Needs Improvement - Security debt accumulating
40-59:  Poor - Significant vulnerabilities
0-39:   Critical - Immediate action required
```

---

### 5. Remediation Guidance

For each finding, provide:

1. **What**: Clear description of the vulnerability
2. **Why**: Risk and potential impact
3. **Where**: Exact file and line
4. **How**: Step-by-step fix instructions
5. **Verify**: How to confirm the fix works

**Example:**
```markdown
## Finding: SQL Injection (CRITICAL)

**What:** User input directly concatenated into SQL query

**Why:** Attacker can:
- Extract all database data
- Modify or delete records
- Bypass authentication
- Potentially execute system commands

**Where:** `src/api/users.ts:45`

**Current Code:**
```javascript
const user = await db.query(`SELECT * FROM users WHERE id = ${req.params.id}`);
```

**Fixed Code:**
```javascript
const user = await db.query('SELECT * FROM users WHERE id = $1', [req.params.id]);
```

**Verify:**
1. Test with normal input: `/api/users/123`
2. Test with injection: `/api/users/1 OR 1=1`
3. Should return single user, not all users
```

---

## Integration Points

### Pre-commit Hook
```bash
#!/bin/bash
# .git/hooks/pre-commit
claude --skill siftcoder:security-scanner --mode secrets
if [ $? -ne 0 ]; then
    echo "Security check failed. Commit blocked."
    exit 1
fi
```

### CI/CD Integration
```yaml
# .github/workflows/security.yml
- name: Security Scan
  run: |
    claude --skill siftcoder:security-scanner --output sarif

- name: Upload SARIF
  uses: github/codeql-action/upload-sarif@v2
  with:
    sarif_file: security-results.sarif
```

---

## Runtime Implementation

This skill includes a minimal `skill.ts` entry point to satisfy plugin requirements.
The primary value remains in this documentation - see sections above for:
- Security scanning patterns
- Vulnerability detection
- Remediation guidance

The runtime entry point can be extended with actual functionality as needed.

## Tools Used
- Grep, Glob - Pattern scanning
- Bash - Package manager commands
- Read - File analysis
- Write - Report generation
- WebFetch - CVE database queries (if needed)
