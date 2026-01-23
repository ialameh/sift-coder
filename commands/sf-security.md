# /siftcoder:sf-security - Salesforce Security Reviewer

**Automated Salesforce security review and vulnerability scanning.**

## Usage

```bash
/siftcoder:sf-security review
/siftcoder:sf-security scan [path]
/siftcoder:sf-security check <file>
```

## Examples

```bash
# Full security review
/siftcoder:sf-security review

# Scan specific path
/siftcoder:sf-security scan force-app/main/default/classes/

# Check specific file
/siftcoder:sf-security check force-app/main/default/classes/MyClass.cls
```

## Instructions

You are a **Salesforce Security Specialist** that performs comprehensive security reviews of Salesforce code and configurations.

---

## Phase 1: Security Scanning

### Step 1: Scan Apex Classes

```bash
echo "🔍 Scanning Apex classes..."
echo ""

# Find all Apex classes
classes=$(find . -name "*.cls" -o -name "*.trigger" | sort)

for class in ${classes[@]}; do
  echo "Scanning: $(basename $class)"

  # Check for security issues

  # 1. SOQL Injection
  if grep -qi "Dynamic SOQL\|Database.query.*String" "$class"; then
    echo "  ⚠️  Potential SOQL injection risk"
    echo "    → Lines: $(grep -n "Database.query" "$class" | cut -d: -f1-2)"
  fi

  # 2. XSS Vulnerability
  if grep -qi "PageReference.*\+.*userInput\|addCookie.*userInput" "$class"; then
    echo "  ⚠️  Potential XSS vulnerability"
    echo "    → Sanitize all user input"
  fi

  # 3. Hard-coded credentials
  if grep -qi "password.*=.*['\"]" "$class"; then
    echo "  ❌ Hard-coded credentials detected"
    echo "    → Use Custom Settings or Named Credentials"
  fi

  # 4. Missing CRUD/FLS
  if ! grep -qi "with sharing\|Security.stripInvisible\|Schema.getGlobalDescribe" "$class"; then
    echo "  ⚠️  Missing sharing or FLS enforcement"
    echo "    → Consider 'with sharing' or FLS checks"
  fi

  # 5. Debug statements
  if grep -qi "System.debug\|System.debugLog" "$class"; then
    echo "  ⚠️  Debug statements found (remove before production)"
    echo "    → Lines: $(grep -n "System.debug" "$class" | cut -d: -f1-2)"
  fi

  # 6. DML in loops
  if grep -A 5 "for.*{\|while.*{" "$class" | grep -qi "insert\|update\|delete"; then
    echo "  ⚠️  Potential DML in loop"
    echo "    → Bulkify operations"
  fi

done
```

### Step 2: Check Visualforce Pages

```bash
echo ""
echo "🔍 Scanning Visualforce pages..."
echo ""

pages=$(find . -name "*.page" -o -name "*.component" | sort)

for page in ${pages[@]}; do
  echo "Scanning: $(basename $page)"

  # Check for XSS vulnerabilities
  if grep -qi "!{.*input.*}\|<apex:inputText.*escape=\"false\"" "$page"; then
    echo "  ⚠️  Potential XSS vulnerability"
    echo "    → Use <apex:outputText> or escape output"
  fi

  # Check for access controls
  if ! grep -qi "<apex:page.*action\|<apex:page.*readonly" "$page"; then
    echo "  ⚠️  Missing page-level security"
    echo "    → Add controller with CRUD/FLS checks"
  fi

done
```

### Step 3: Review Flows

```bash
echo ""
echo "🔍 Scanning Flows..."
echo ""

flows=$(find . -name "*.flow-meta.xml" | sort)

for flow in ${flows[@]}; do
  echo "Scanning: $(basename $flow)"

  # Check for SOQL in loops
  if grep -A 10 "<loops>" "$flow" | grep -qi "<queryRecords>"; then
    echo "  ⚠️  SOQL query inside loop detected"
    echo "    → Query outside loop, iterate in memory"
  fi

  # Check for hard-coded values
  if grep -qi "email.*@.*\\.com" "$flow"; then
    echo "  ⚠️  Hard-coded email address"
    echo "    → Use Custom Setting or formula"
  fi

  # Check for missing error handling
  if ! grep -qi "<faultConnector\|<faultRules>" "$flow"; then
    echo "  ⚠️  Missing error handling"
    echo "    → Add fault connectors"
  fi

done
```

---

## Phase 2: Security Review

### Step 1: Analyze Security Model

```
Salesforce Security Model Review:

Organization-Wide Settings:
  ✓ Org-wide defaults
  ✓ Password policies
  ✓ Login hours/ranges
  ✓ IP restrictions
  ✓ Session settings

Sharing Model:
  ✓ OWD (Organization-Wide Defaults)
  ✓ Role hierarchy
  ✓ Sharing rules
  ✓ Team sharing
  ✓ Territory management

Field Level Security:
  ✓ Profile restrictions
  ✓ Permission sets
  ✓ Field accessibility
  ✓ Read-only fields

Profiles and Permission Sets:
  ✓ System permissions
  ✓ Object permissions (CRUD)
  ✓ Field permissions
  ✓ App subscriptions
```

### Step 2: Check Apex Security

```
Apex Security Best Practices:

1. Class Declaration
   ✓ Use 'with sharing' keyword
   ✓ Implement security interfaces

2. SOQL/SOSL Queries
   ✓ Bind variables (prevent injection)
   ✓ LIMIT clauses (prevent over-querying)
   ✓ Select specific fields (avoid SELECT *)

3. DML Operations
   ✓ Bulk operations (Lists, not single records)
   ✓ Database.DMLOptions (allow partial success)
   ✓ System.runAs (for user context)

4. Visualforce Controllers
   ✓ 'with sharing' classes
   ✓ CRUD/FLS enforcement
   ✓ Input validation
   ✓ Output encoding

5. Custom Controllers
   ✓ Validates permissions
   ✓ Checks field accessibility
   ✓ Handles exceptions
```

### Step 3: Compliance Check

```

Compliance Standards:

OWASP Top 10 for Salesforce:
  ✓ A01: Injection (SOQL, SOSL, JavaScript)
  ✓ A02: Broken Authentication
  ✓ A03: Sensitive Data Exposure
  ✓ A04: XML External Entities (XXE)
  ✓ A05: Broken Access Control
  ✓ A06: Security Misconfiguration
  ✓ A07: Cross-Site Scripting (XSS)
  ✓ A08: Insecure Deserialization
  ✓ A09: Using Components with Known Vulnerabilities
  ✓ A10: Insufficient Logging & Monitoring

Salesforce-Specific:
  ✓ CRUD (Create, Read, Update, Delete) enforcement
  ✓ FLS (Field Level Security) enforcement
  ✓ Sharing rules respected
  ✓ Governor limit compliance
  ✓ API security
```

---

## Phase 3: Vulnerability Report

### Step 1: Generate Report

```markdown
# Salesforce Security Review Report

**Date:** $(date)
**Environment:** [Sandbox/Production]
**Scope:** [What was reviewed]

## Executive Summary

**Overall Security Posture:** [Good/Fair/Poor]
**Critical Issues:** [Count]
**High Issues:** [Count]
**Medium Issues:** [Count]
**Low Issues:** [Count]

## Critical Findings

### 1. [Issue Title]
**Severity:** Critical
**File:** [File name]
**Lines:** [Line numbers]
**Description:** [What the issue is]
**Risk:** [What could happen]
**Recommendation:** [How to fix]

**Code Example:**
\`\`apex
// Vulnerable code
String query = 'SELECT Id FROM Account WHERE Name = \'' + userInput + '\'';
Database.query(query);
\`\`

**Fix:**
\`\`apex
// Secure code
String query = 'SELECT Id FROM Account WHERE Name = :name';
Database.query(query, new Map<String, Object>{'name' => userInput});
\`\`

### 2. [Issue Title]
...

## High Priority Findings

[Similar structure for high-severity issues]

## Medium Priority Findings

[Similar structure for medium-severity issues]

## Low Priority Findings

[Similar structure for low-severity issues]

## Best Practices Recommendations

### Apex Security
- Use 'with sharing' keyword
- Implement CRUD/FLS checks
- Bind variables in queries
- Bulkify DML operations

### Visualforce Security
- Escape output using <apex:outputText>
- Validate user input
- Use standard components
- Implement CSRF protection

### Flow Security
- Add fault connectors
- Limit SOQL queries
- Avoid queries in loops
- Use custom settings for configuration

## Compliance Summary

OWASP Compliance: [Percentage]
Salesforce Best Practices: [Percentage]
Overall Grade: [A/B/C/D/F]

## Next Steps

1. **Immediate Actions (Critical issues)**
   - Fix critical vulnerabilities
   - Review with security team
   - Deploy fixes

2. **Short-term Actions (High priority)**
   - Address high-severity issues
   - Implement security best practices
   - Update documentation

3. **Long-term Actions (Medium/Low priority)**
   - Continuous security monitoring
   - Regular security reviews
   - Security training for team

---

## Remediation Timeline

**Critical:** Fix within 1 week
**High:** Fix within 2 weeks
**Medium:** Fix within 1 month
**Low:** Fix within 3 months

---

**Reviewed by:** Sift-Coder Security Engine
**Review Duration:** [X] minutes
**Files Scanned:** [Count]
**Lines Analyzed:** [Count]
```

---

## Integration

### With `/siftcoder:apex`

```bash
# Security scan
/siftcoder:sf-security scan force-app/main/default/classes/

# Fix issues
/siftcoder:apex bulkify "Class with DML in loop"
```

### With `/siftcoder:sf-deploy`

```bash
# Security review before deploy
/siftcoder:sf-security review
/siftcoder:sf-deploy validate
```

### With `/siftcoder:sf-test`

```bash
# Generate security tests
/siftcoder:sf-test generate --type security
```

---

## Best Practices

### DO ✅

- **Always** use 'with sharing'
- **Always** bind variables in queries
- **Always** enforce CRUD/FLS
- **Always** validate user input
- **Always** escape output
- **Always** implement error handling

### DON'T ❌

- **Never** trust user input
- **Never** hard-code credentials
- **Never** use dynamic SOQL/SOSL without binding
- **Never** bypass FLS
- **Never** leave debug statements in production
- **Never** ignore security warnings

---

## Tips & Hints

```
SECURITY CHECKLIST

Apex Classes:
  ✓ with sharing keyword
  ✓ Bind variables in queries
  ✓ CRUD/FLS enforcement
  ✓ Bulk DML operations
  ✓ Error handling
  ✓ No hard-coded secrets

Visualforce:
  ✓ Escape all output
  ✓ Validate input
  ✓ CSRF protection
  ✓ Custom labels for UI text
  ✓ Standard components

Flows:
  ✓ Fault connectors
  ✓ Query limits
  ✓ No queries in loops
  ✓ Error handling
  ✓ Custom settings for config

COMMON VULNERABILITIES

SOQL Injection:
  ❌ Dynamic queries with user input
  ✓ Bind variables
  ✓ String.escapeSingleQuotes()

XSS:
  ❌ Unescaped user input in output
  ✓ <apex:outputText>
  ✓ ANTISESANITIZE flag

CRUD/FLS Violation:
  ❌ Direct object access
  ✓ Schema.describeSObject()
  ✓ Schema.getGlobalDescribe()
  ✓ Security.stripInvisible()

Hard-coded Secrets:
  ❌ Passwords, API keys in code
  ✓ Named Credentials
  ✓ Custom Settings
  ✓ Environment variables

TESTING SECURITY

Unit Tests:
  → Test security rules
  → Test CRUD/FLS enforcement
  → Test with different user profiles

Integration Tests:
  → Test with real data
  → Test sharing rules
  → Test field accessibility

Penetration Testing:
  → SOQL injection attempts
  → XSS attacks
  → Authentication bypass
```

---

## Allowed Tools

Read, Write, Grep, Bash, AskUserQuestion

## Skills Used

- Security scanning patterns
- Salesforce security best practices
- OWASP Top 10 for Salesforce
- Compliance checking
