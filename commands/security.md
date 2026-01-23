# /siftcoder:security - Security Analysis & Vulnerability Detection

Comprehensive security scanning for your codebase.

## Usage

```
/siftcoder:security [subcommand]
```

## Subcommands

| Subcommand | Description |
|------------|-------------|
| `scan` | Full security audit (default) |
| `secrets` | Detect leaked secrets, API keys, tokens |
| `deps` | Dependency vulnerability analysis |
| `owasp` | OWASP Top 10 vulnerability check |
| `report` | Generate security report |

## Arguments
- `$ARGUMENTS` - Subcommand and optional flags

## Instructions

You are performing security analysis on the codebase. Security issues are CRITICAL and must be reported clearly with remediation guidance.

---

## Phase 0: Interactive Setup

**Use AskUserQuestion tool:**
```
Question: "What type of security scan do you want to run?"
Header: "Scan Type"
Options:
- "Full Scan (Recommended)" - "Complete security audit: secrets, deps, code patterns"
- "Quick Scan" - "Fast check for common issues (~2 min)"
- "Secrets Only" - "Focus on leaked credentials and API keys"
- "Dependencies Only" - "Check for vulnerable packages"
```

**Use AskUserQuestion tool:**
```
Question: "How should I handle findings?"
Header: "Action"
Options:
- "Report Only (Recommended)" - "Generate report without changes"
- "Auto-fix Safe Issues" - "Fix obvious issues (e.g., remove console.log with secrets)"
- "Interactive" - "Ask before each fix"
```

---

## Subcommand: scan (Full Security Audit)

### Phase 1: Secret Detection

```
SCANNING FOR SECRETS...

Patterns checking:
├── API Keys (AWS, GCP, Azure, Stripe, etc.)
├── Private Keys (RSA, SSH, PGP)
├── Tokens (JWT, OAuth, Bearer)
├── Passwords (hardcoded, in configs)
├── Connection Strings (database, redis)
└── Webhooks & Endpoints (sensitive URLs)
```

**Detection Patterns:**
```
# AWS
AKIA[0-9A-Z]{16}
aws_secret_access_key\s*=\s*['\"][A-Za-z0-9/+=]{40}['\"]

# Generic API Keys
['\"]?[aA][pP][iI][-_]?[kK][eE][yY]['\"]?\s*[:=]\s*['\"][A-Za-z0-9_-]{20,}['\"]

# Private Keys
-----BEGIN (RSA |DSA |EC |OPENSSH )?PRIVATE KEY-----

# JWT
eyJ[A-Za-z0-9_-]*\.eyJ[A-Za-z0-9_-]*\.[A-Za-z0-9_-]*

# Database URLs
(postgres|mysql|mongodb|redis):\/\/[^\s'"]+

# Passwords
['\"]?password['\"]?\s*[:=]\s*['\"][^'"]{8,}['\"]
```

**Output:**
```
SECRET DETECTION RESULTS

CRITICAL (2 findings):
├── src/config/aws.ts:15
│   Type: AWS Secret Key
│   Value: aws_secret_access_key = "wJalrXU..."  (redacted)
│   Risk: Full AWS account access
│   Fix: Move to environment variable
│
└── .env.example:8
    Type: Database Password
    Value: DB_PASSWORD=production123
    Risk: Example file committed with real password
    Fix: Replace with placeholder

WARNING (1 finding):
└── src/utils/api.ts:42
    Type: Hardcoded API endpoint
    Value: https://api.internal.company.com
    Risk: Internal URL exposed
    Fix: Move to environment config
```

### Phase 2: Dependency Vulnerabilities

```
SCANNING DEPENDENCIES...

Package Manager: [npm/pip/go/cargo]
Lock File: [package-lock.json/etc]
```

**Analysis:**
1. Parse dependency lock file
2. Check against vulnerability databases
3. Identify transitive vulnerabilities
4. Calculate severity scores

**Output:**
```
DEPENDENCY VULNERABILITIES

CRITICAL (1):
├── lodash@4.17.20
│   CVE: CVE-2021-23337
│   Severity: CRITICAL (9.8)
│   Description: Prototype pollution in lodash
│   Fixed in: 4.17.21
│   Path: package.json → lodash
│   Fix: npm update lodash

HIGH (2):
├── axios@0.21.0
│   CVE: CVE-2021-3749
│   Severity: HIGH (7.5)
│   Description: ReDoS vulnerability
│   Fixed in: 0.21.2
│
└── node-fetch@2.6.0
    CVE: CVE-2022-0235
    Severity: HIGH (8.0)
    Description: Exposure of sensitive information

MEDIUM (3):
└── [collapsed - run with --verbose for details]

Total: 156 dependencies scanned
Vulnerable: 6 (1 critical, 2 high, 3 medium)
```

### Phase 3: Code Pattern Analysis (OWASP)

```
ANALYZING CODE PATTERNS...

Checking for:
├── A01: Broken Access Control
├── A02: Cryptographic Failures
├── A03: Injection (SQL, NoSQL, Command, XSS)
├── A04: Insecure Design
├── A05: Security Misconfiguration
├── A06: Vulnerable Components (covered in deps)
├── A07: Authentication Failures
├── A08: Software Integrity Failures
├── A09: Logging Failures
└── A10: Server-Side Request Forgery (SSRF)
```

**Detection Examples:**

```javascript
// A03: SQL Injection
const query = `SELECT * FROM users WHERE id = ${userId}`  // VULNERABLE
// Fix: Use parameterized queries

// A03: Command Injection
exec(`ls ${userInput}`)  // VULNERABLE
// Fix: Use execFile with args array

// A03: XSS
innerHTML = userInput  // VULNERABLE
// Fix: Use textContent or sanitize

// A07: Weak Password Hashing
const hash = md5(password)  // VULNERABLE
// Fix: Use bcrypt or argon2

// A10: SSRF
fetch(userProvidedUrl)  // VULNERABLE
// Fix: Validate URL against allowlist
```

**Output:**
```
CODE PATTERN ANALYSIS

A03 - INJECTION (4 findings):

CRITICAL: SQL Injection
├── File: src/api/users.ts:45
├── Code: db.query(`SELECT * FROM users WHERE id = ${req.params.id}`)
├── Risk: Database compromise, data exfiltration
└── Fix: Use parameterized query: db.query('SELECT * FROM users WHERE id = $1', [req.params.id])

HIGH: Command Injection
├── File: src/utils/files.ts:23
├── Code: exec(`convert ${filename} output.png`)
├── Risk: Remote code execution
└── Fix: Use execFile('convert', [filename, 'output.png'])

MEDIUM: XSS Risk
├── File: src/components/Comment.tsx:18
├── Code: dangerouslySetInnerHTML={{ __html: comment }}
├── Risk: Cross-site scripting
└── Fix: Sanitize with DOMPurify or use textContent

A07 - AUTHENTICATION (2 findings):

HIGH: Weak Password Hashing
├── File: src/auth/password.ts:12
├── Code: crypto.createHash('md5').update(password)
├── Risk: Passwords easily crackable
└── Fix: Use bcrypt: await bcrypt.hash(password, 12)
```

### Phase 4: Security Report Generation

```
SECURITY REPORT GENERATED

┌─────────────────────────────────────────────────────────────┐
│ SECURITY SCORE: 62/100 (Needs Improvement)                  │
│                                                             │
│ ██████████████░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░│
│                                                             │
│ Critical: 3    High: 4    Medium: 6    Low: 8               │
└─────────────────────────────────────────────────────────────┘

PRIORITY FIXES:

1. [CRITICAL] Remove AWS credentials from src/config/aws.ts
   → Move to environment variables immediately
   → Rotate the exposed credentials

2. [CRITICAL] Fix SQL injection in src/api/users.ts
   → Use parameterized queries
   → Review all database queries

3. [CRITICAL] Update lodash to 4.17.21+
   → npm update lodash
   → Verify no breaking changes

FULL REPORT: .claude/siftcoder-state/security/report-2026-01-10.md
```

---

## Subcommand: secrets

Focused secret detection only:

```
/siftcoder:security secrets [--fix]
```

Scans for:
- API keys (50+ providers)
- Private keys and certificates
- Passwords and tokens
- Connection strings
- Webhook URLs

With `--fix`:
- Suggests .gitignore additions
- Creates .env.example with placeholders
- Offers to add pre-commit hooks

---

## Subcommand: deps

Dependency-focused scan:

```
/siftcoder:security deps [--update]
```

With `--update`:
- Generates safe update commands
- Groups by breaking/non-breaking
- Creates branch for updates

---

## Subcommand: owasp

OWASP Top 10 focused analysis:

```
/siftcoder:security owasp [--category A01-A10]
```

Deep dive into specific OWASP categories with:
- Educational explanations
- Code examples (vulnerable vs fixed)
- Testing guidance

---

## Output Files

### `.claude/siftcoder-state/security/report-{date}.md`

Full markdown report with all findings.

### `.claude/siftcoder-state/security/findings.json`

Machine-readable findings:
```json
{
  "scanDate": "2026-01-10T12:00:00Z",
  "score": 62,
  "findings": [
    {
      "id": "SEC-001",
      "type": "secret",
      "severity": "critical",
      "file": "src/config/aws.ts",
      "line": 15,
      "description": "AWS Secret Key exposed",
      "fix": "Move to environment variable",
      "cwe": "CWE-798"
    }
  ]
}
```

---

## Integration with Other Commands

After security scan:
- `/siftcoder:fix` - Fix security issues with boundaries
- `/siftcoder:review` - Include security in code reviews
- `/siftcoder:comply` - Map to compliance frameworks

---

## Tips & Hints

```
SECURITY SCANNING BEST PRACTICES

Before committing:
  → Run /siftcoder:security secrets
  → Add pre-commit hook for secret detection
  → Never commit .env files

Regular maintenance:
  → Run /siftcoder:security deps weekly
  → Update dependencies promptly
  → Monitor CVE databases

Code review:
  → Include security checklist
  → Watch for injection patterns
  → Verify authentication logic

CI/CD integration:
  → Run security scan on every PR
  → Block merge on critical findings
  → Generate SARIF for GitHub Security

SEVERITY LEVELS

CRITICAL: Immediate action required
  → Exposed credentials (rotate NOW)
  → Remote code execution
  → Authentication bypass

HIGH: Fix within 24 hours
  → SQL/command injection
  → Weak cryptography
  → Sensitive data exposure

MEDIUM: Fix within 1 week
  → XSS vulnerabilities
  → CSRF issues
  → Information disclosure

LOW: Fix when convenient
  → Missing security headers
  → Verbose error messages
  → Minor misconfigurations
```

---

## Skills Used
- **security-scanner** - Pattern detection and analysis
- **vulnerability-db** - CVE and advisory lookup

## Allowed Tools
Read, Grep, Glob, Bash, Task, Write, AskUserQuestion
