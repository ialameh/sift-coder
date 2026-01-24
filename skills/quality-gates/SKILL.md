---
name: quality-gates
description: Automated code quality validation with configurable checks
version: 1.0.0
---

# Quality Gates Skill

Automated code quality validation with configurable checks.

## Description

This skill runs quality checks on code changes and reports results. It integrates with project-specific tooling and provides consistent validation across the siftcoder workflow.

## When to Use

Invoke this skill when:
- Code has been written or modified
- Before marking a subtask as complete
- During QA review phase
- User requests manual quality check

## Instructions

You are a quality gate runner. Your job is to validate code changes against project quality standards.

### Quality Checks Available

1. **Format Check**
   - Prettier (JS/TS/JSON/MD/CSS)
   - Black (Python)
   - gofmt (Go)
   - rustfmt (Rust)

2. **Lint Check**
   - ESLint (JS/TS)
   - Flake8/Pylint (Python)
   - golangci-lint (Go)
   - Clippy (Rust)

3. **Type Check**
   - TypeScript (tsc)
   - mypy (Python)
   - Go compiler

4. **Test Check**
   - Jest/Vitest (JS/TS)
   - Pytest (Python)
   - go test (Go)
   - cargo test (Rust)

5. **Security Check** (if available)
   - npm audit
   - Semgrep
   - Bandit (Python)

### Execution Flow

1. **Detect Project Type**
   ```
   Detecting project configuration...
   ├── package.json → Node.js project
   ├── tsconfig.json → TypeScript enabled
   ├── .prettierrc → Prettier configured
   └── jest.config.js → Jest for testing
   ```

2. **Run Configured Checks**
   ```
   🔍 QUALITY GATES

   [1/4] Format Check (Prettier)
         Running: npx prettier --check src/
         Result: ✓ All files formatted

   [2/4] Lint Check (ESLint)
         Running: npx eslint src/ --format json
         Result: ⚠️ 2 warnings, 0 errors
         - src/utils.ts:15 - Unused variable 'temp'
         - src/api.ts:42 - Prefer const over let

   [3/4] Type Check (TypeScript)
         Running: npx tsc --noEmit
         Result: ✓ No type errors

   [4/4] Test Check (Jest)
         Running: npx jest --passWithNoTests
         Result: ✓ 47 tests passing
   ```

3. **Generate Report**
   ```json
   {
     "timestamp": "2026-01-10T15:30:00Z",
     "checks": {
       "format": { "status": "pass", "tool": "prettier" },
       "lint": {
         "status": "warn",
         "tool": "eslint",
         "warnings": 2,
         "errors": 0,
         "issues": [
           { "file": "src/utils.ts", "line": 15, "message": "Unused variable" }
         ]
       },
       "typeCheck": { "status": "pass", "tool": "tsc" },
       "tests": { "status": "pass", "tool": "jest", "passed": 47, "failed": 0 }
     },
     "summary": {
       "passed": 3,
       "warned": 1,
       "failed": 0,
       "blocked": false
     }
   }
   ```

### Blocking vs Non-Blocking

**Blocking (stops workflow):**
- Any type errors
- Any lint errors (not warnings)
- Any test failures
- Security vulnerabilities (high/critical)

**Non-Blocking (warns but continues):**
- Format issues (auto-fixed when possible)
- Lint warnings
- Low/medium security issues

### Auto-Fix Capabilities

When possible, automatically fix issues:
```
🔧 AUTO-FIX APPLIED

Format:
├── src/utils.ts - Reformatted
└── src/api.ts - Reformatted

Lint (auto-fixable):
└── src/config.ts - Fixed import order

Re-running checks after fixes...
```

### Configuration Detection

The skill respects project configuration:
- `.prettierrc` / `prettier.config.js`
- `.eslintrc` / `eslint.config.js`
- `tsconfig.json`
- `jest.config.js` / `vitest.config.ts`
- `pyproject.toml` (for Python projects)

### Per-Project Overrides

Read from `.claude/siftcoder-state/config.json`:
```json
{
  "qualityGates": {
    "format": true,
    "lint": true,
    "typeCheck": true,
    "tests": true,
    "security": false,
    "blockOnWarnings": false
  }
}
```

## Output Format

Return structured result:
```json
{
  "passed": true|false,
  "blocked": true|false,
  "checks": { ... },
  "summary": "All quality gates passed" | "Blocked: 2 type errors",
  "autoFixed": ["file1.ts", "file2.ts"]
}
```

## Runtime Implementation

This skill includes a minimal `skill.ts` entry point to satisfy plugin requirements.
The primary value remains in this documentation - see sections above for:
- Quality gate patterns
- Configuration detection
- Auto-fix capabilities

The runtime entry point can be extended with actual functionality as needed.

## Allowed Tools
Bash, Read, Glob
