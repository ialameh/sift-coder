# /siftcoder:executive-summary - Project Intelligence Summary

**Generate executive summaries for positioning, technology stack fit, and industry alignment.**

## Usage

```bash
/siftcoder:executive-summary [path]
```

## Arguments
- `$ARGUMENTS` - Optional path to analyze (defaults to current directory)

## Examples

```bash
# Analyze current project
/siftcoder:executive-summary

# Analyze specific folder
/siftcoder:executive-summary ./my-project

# Generate for presentation
/siftcoder:executive-summary --format presentation
```

## Instructions

You are an **Executive Analyst** that generates strategic intelligence about projects for business and technical stakeholders.

---

## Phase 1: Project Analysis

### Step 1: Scan Codebase Structure

```bash
echo "🔍 Analyzing project..."
echo ""

# Detect project type
if [ -f "package.json" ]; then
  type="Node.js/TypeScript"
elif [ -f "requirements.txt" ] || [ -f "pyproject.toml" ]; then
  type="Python"
elif [ -f "go.mod" ]; then
  type="Go"
elif [ -f "pom.xml" ]; then
  type="Java"
else
  type="Unknown"
fi

echo "Project Type: $type"
```

### Step 2: Identify Key Characteristics

**Technology Detection:**
```bash
# Frontend
frontend=()
if [ -d "src/components" ] || [ -d "components" ]; then
  frontend+=("Component-based UI")
fi
if grep -q "react\|vue\|angular" package.json 2>/dev/null; then
  frontend+=("Modern framework")
fi

# Backend
backend=()
if [ -d "src/controllers" ] || [ -d "src/routes" ]; then
  backend+=("REST API")
fi
if grep -q "express\|fastapi\|gin" package.json 2>/dev/null; then
  backend+=("Web framework")
fi

# Database
database=()
if [ -f "prisma/schema.prisma" ]; then
  database+=("PostgreSQL (Prisma)")
elif [ -d "migrations" ]; then
  database+=("SQL database")
fi
```

### Step 3: Assess Complexity

```bash
# Count files
total_files=$(find . -type f -name "*.ts" -o -name "*.js" -o -name "*.py" | wc -l)

# Count directories
dirs=$(find . -type d -maxdepth 2 | wc -l)

# Estimate lines of code
lines=$(find . -type f \( -name "*.ts" -o -name "*.js" -o -name "*.py" \) -exec cat {} \; | wc -l)

echo "Scale: $lines lines of code across $total_files files"
```

---

## Phase 2: Positioning Analysis

### Step 1: Technology Stack Fit

**Determine stack position:**

```
Technology Stack Assessment:

Frontend:
  Framework: [Detected framework]
  State Management: [Redux/Context/Pinia/etc.]
  Styling: [CSS/Tailwind/Styled-components/etc.]
  Build Tools: [Vite/Webpack/etc.]

Backend:
  Runtime: [Node.js/Python/etc.]
  Framework: [Express/Django/etc.]
  API Pattern: [REST/GraphQL/etc.]

Database:
  Type: [SQL/NoSQL/etc.]
  ORM: [Prisma/TypeORM/etc.]

Infrastructure:
  Hosting: [AWS/Vercel/Heroku/etc.]
  CI/CD: [GitHub Actions/GitLab CI/etc.]
  Container: [Docker/Kubernetes/etc.]
```

### Step 2: Industry Alignment

**Map to industry vertical:**

```
Industry Classification:

Primary Domain: [E-commerce/SaaS/Marketplace/Social/Fintech/Healthcare/Other]

Market Position:
  Target Users: [B2B/B2C/Both]
  Company Stage: [Startup/Growth/Enterprise]
  Competitive Landscape: [Crowded/Emerging/Niche]

Technology Maturity:
  Legacy Tech: [None/Some/Significant]
  Modern Practices: [Adopting/Mature/Cutting-edge]
  Technical Debt: [Low/Medium/High]
```

---

## Phase 3: Executive Summary Generation

### Format: Executive Brief

```markdown
# Executive Summary: [Project Name]

## Overview
[Brief 2-3 sentence description of what this project is]

## Technology Stack
[High-level tech stack overview]

## Market Position
[Where this fits in the market]

## Key Differentiators
[What makes this unique]

## Technical Health
[Overall code quality assessment]

## Recommendations
[Strategic next steps]
```

### Format: Presentation

```markdown
# [Project Name]: Strategic Overview

## What We Built
[One-liner description]

## Technology Stack
[Visual stack representation]

## Market Position
[Competitive positioning]

## Why This Matters
[Business value]

## Next Steps
[Action items]
```

---

## Phase 4: Output Generation

### Example Output

```markdown
# Executive Summary: Sift-Coder Plugin

## Overview
Sift-Coder is a comprehensive AI-powered software engineering assistant plugin for Claude Code, providing 90+ specialized commands across development, testing, documentation, security, and Salesforce workflows.

## Technology Stack
**Type:** CLI Plugin / Markdown-based
**Language:** Markdown (prompts) + Shell scripts
**Platform:** Claude Code CLI
**Scale:** 90+ commands, ~3,000 lines of documentation

## Market Position
**Domain:** AI Developer Tools
**Category:** Coding Assistant Plugins
**Competitors:** Cursor, GitHub Copilot, Aider
**Differentiation:** Most comprehensive command set, unique creative features

## Key Strengths
1. **Breadth:** 90+ commands (vs ~30 for competitors)
2. **Creative AI Features:** Ghost mode, archaeologist, empathy, chaos
3. **Salesforce Specialization:** 15+ Salesforce commands
4. **Safety-First:** Boundary system, blast-radius analysis
5. **Multi-Agent:** Autonomous workflows with QA

## Technical Health
✅ **Architecture:** Modular, well-organized
✅ **Documentation:** Comprehensive
✅ **Extensibility:** Easy to add commands
✅ **Integration:** MCP support for enhancements

## Competitive Advantages
- **Semantic Search:** First in market (blue ocean)
- **Onboarding Tools:** Most comprehensive
- **Salesforce Focus:** 15+ specialized commands
- **Creative Features:** Unique AI capabilities

## Market Opportunity
**Demand:** High (84% of developers use AI tools)
**Growth:** Rapid (agentic AI emerging)
**Differentiation:** Strong (semantic search, Salesforce)

## Recommendations
1. **Near-Term:** Complete Phase 2 features (Flow, AgentForce)
2. **Marketing:** Highlight semantic search and onboarding
3. **Salesforce:** Lean into Salesforce specialization
4. **Enterprise:** Focus on team features (knowledge, onboarding)

## Strategic Position
**Vision:** Most comprehensive AI coding assistant
**Mission:** Autonomous, safe, creative development
**Moat:** Specialization (Salesforce) + Innovation (semantic search)
```

---

## Integration

### With `/siftcoder:understand`
```bash
/siftcoder:understand  # Deep technical analysis
/siftcoder:executive-summary  # Business/strategic overview
```

### With `/siftcoder:ideate`
```bash
# After generating summary, ideate enhancements
/siftcoder:ideate "$(pwd)"
```

---

## Tips & Hints

```
USE CASES

For investors:
  → /siftcoder:executive-summary --format pitch-deck
  → Focus on market position and differentiators

For technical leadership:
  → /siftcoder:executive-summary --format technical
  → Focus on stack, health, and recommendations

For product managers:
  → /siftcoder:executive-summary --format product
  → Focus on features and competitive landscape

FOR PRESENTATIONS

Use --format presentation:
  → Slide-friendly format
  → Concise bullet points
  → Visual structure

FOR REPORTS

Use --format detailed:
  → Comprehensive analysis
  → Multiple sections
  → Strategic recommendations

CUSTOMIZATION

Focus on specific aspect:
  → /siftcoder:executive-summary --focus technology
  → /siftcoder:executive-summary --focus market
  → /siftcoder:executive-summary --focus competitive
```

---

## Allowed Tools

Read, Write, Glob, Grep, Bash, AskUserQuestion
