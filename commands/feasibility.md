# /siftcoder:feasibility - Commercial Feasibility Analysis

**Analyze commercial viability, market potential, and competitive requirements.**

## Usage

```bash
/siftcoder:feasibility [path]
```

## Arguments
- `$ARGUMENTS` - Optional path to analyze (defaults to current directory)

## Examples

```bash
# Analyze current project
/siftcoder:feasibility

# Analyze specific project
/siftcoder:feasibility ./my-startup

# Generate detailed report
/siftcoder:feasibility --detailed
```

## Instructions

You are a **Business Analyst** that assesses commercial viability and market potential.

---

## Phase 1: Project Understanding

### Step 1: Analyze Value Proposition

```bash
# Extract purpose from README
if [ -f "README.md" ]; then
  purpose=$(grep -A 5 "## Overview\|## What" README.md | head -10)
fi

# Detect problem being solved
if grep -qi "authentication\|auth" README.md 2>/dev/null; then
  domain="Authentication/Security"
elif grep -qi "payment\|billing" README.md 2>/dev/null; then
  domain="Fintech/Payments"
elif grep -qi "ecommerce\|shop\|store" README.md 2>/dev/null; then
  domain="E-commerce"
fi
```

### Step 2: Identify End Users

```
Target User Analysis:

Primary Users:
- Who: [Developer/Admin/End Customer/Business]
- Role: [Job title or function]
- Pain Points: [What problems they face]
- Goals: [What they want to achieve]

Secondary Users:
- Who: [Stakeholders/Managers/etc.]
- Relationship: [How they interact with primary users]

User Segments:
- Enterprise: [Large organizations]
- SMB: [Small/medium businesses]
- Individual: [Solo developers/users]
```

---

## Phase 2: Market Analysis

### Step 1: Market Size Assessment

```
Market Sizing:

TAM (Total Addressable Market):
- Definition: [Everyone who could use this]
- Estimate: [Market size in users/$]

SAM (Serviceable Addressable Market):
- Definition: [Users you can reach]
- Estimate: [Realistic market size]

SOM (Serviceable Obtainable Market):
- Definition: [Users you can capture in 3-5 years]
- Estimate: [Initial target market]

Growth Rate:
- Current: [Market growth %]
- Projected: [Future growth]
```

### Step 2: Competitive Landscape

```
Competitor Analysis:

Direct Competitors:
1. [Competitor 1]
   - Strengths: [What they do well]
   - Weaknesses: [Where they fall short]
   - Market Share: [If known]

2. [Competitor 2]
   - ...

Indirect Competitors:
- [Alternative solutions]
- [Manual processes]
- [In-house solutions]

Competitive Moat:
- [Your unique advantages]
- [Barriers to entry]
- [Sustainable differentiation]
```

---

## Phase 3: Feasibility Assessment

### Step 1: Technical Feasibility

```
Technical Assessment:

Complexity: [Low/Medium/High]

Key Requirements:
- [ ] [Requirement 1]
- [ ] [Requirement 2]
- [ ] [Requirement 3]

Technical Risks:
- [Risk 1]: [Mitigation]
- [Risk 2]: [Mitigation]

Development Effort:
- Team Size: [X developers]
- Timeline: [X months]
- Budget: [Estimated cost]
```

### Step 2: Commercial Viability

```
Business Model Analysis:

Revenue Model:
- [ ] Subscription (SaaS)
- [ ] Freemium
- [ ] One-time purchase
- [ ] Usage-based
- [ ] Enterprise licensing

Pricing Strategy:
- Competitor-based: [Price range]
- Value-based: [Justification]
- Tiered: [Good/Better/Best]

Unit Economics:
- CAC (Customer Acquisition Cost): [Estimate]
- LTV (Lifetime Value): [Estimate]
- LTV:CAC Ratio: [Target > 3:1]

Break-even Analysis:
- Monthly costs: [Infrastructure, team, etc.]
- Payback period: [Months to profitability]
```

---

## Phase 4: Recommendations

### Go/No-Go Decision

```
Feasibility Verdict: [GO / NO-GO / PROCEED WITH CAUTION]

Confidence Level: [High / Medium / Low]

Key Factors:
✅ [Strength 1]
✅ [Strength 2]
⚠️  [Concern 1]
❌ [Blocker 1] (if any)

Requirements for Success:
1. [Must-have 1]
2. [Must-have 2]
3. [Must-have 3]
```

### Strategic Recommendations

```

Market Entry Strategy:

Phase 1 (0-6 months):
- Focus: [Initial target segment]
- Goal: [Proof of concept, first users]
- Metrics: [KPIs to track]

Phase 2 (6-18 months):
- Focus: [Expansion]
- Goal: [Growth milestones]
- Metrics: [Growth KPIs]

Phase 3 (18+ months):
- Focus: [Scale/Exit]
- Goal: [Long-term vision]
- Metrics: [Business health]

Competitive Requirements:
1. [Must-have feature 1]
2. [Must-have feature 2]
3. [Must-have capability 1]

Differentiation Strategy:
- [Your unique value prop]
- [Why customers will choose you]
- [Sustainable advantage]
```

---

## Example Output

```markdown
# Commercial Feasibility Analysis: Sift-Coder Plugin

## Executive Summary
**Verdict:** ✅ GO - High commercial potential
**Confidence:** High
**Market:** AI Developer Tools

## Market Opportunity

### Market Size
- **TAM:** 30M developers worldwide × $50/mo = $18B/year
- **SAM:** AI tool adopters (84%) = $15B/year
- **SOM:** 1% market share = $150M/year realistic target

### Growth Rate
- AI coding assistants: 72% YoY growth
- Market projected $40B by 2030
- Strong tailwinds from AI adoption

## Competitive Analysis

### Direct Competitors
1. **Cursor** ($20/mo)
   - Strengths: Repo-wide refactoring, IDE-native
   - Weaknesses: IDE-only (no CLI), fewer features
   - Market: Rapidly growing

2. **GitHub Copilot** ($10/mo)
   - Strengths: GitHub integration, autonomous agent
   - Weaknesses: GitHub lock-in, less comprehensive
   - Market: Market leader

### Competitive Advantages
✅ Most comprehensive (91 commands vs ~30)
✅ Semantic search (unique differentiator)
✅ Salesforce specialization (niche but valuable)
✅ CLI-first (complements IDE tools)
✅ Creative AI features (no competitor has)

## Business Model

### Revenue Model
**Recommended:** Freemium + Paid tiers

- **Free:** 50 core commands (generate usage)
- **Pro ($29/mo):** All commands + semantic search
- **Team ($99/mo):** Team features + onboarding
- **Enterprise:** Custom pricing + support

### Unit Economics
- **CAC:** ~$100 (content marketing, organic growth)
- **LTV:** ~$600/year × 2 years = $1,200
- **LTV:CAC:** 12:1 (excellent)

### Break-even
- Monthly costs: ~$5K (hosting, support)
- Payback: ~200 Pro users or ~50 Team users
- Timeline: 6-12 months

## Technical Feasibility

### Complexity: Medium
- Existing: 91 commands, ~3K lines
- Maintenance: Low (markdown-based)
- Scale: Linear growth

### Requirements
✅ Minimal backend (CLI plugin)
✅ Low infrastructure costs
✅ No heavy computing
✅ Easy distribution

### Risks
⚠️ Claude Code dependency (mitigation: multi-platform)
⚠️ Competition (mitigation: differentiation)
⚠️ Open source alternatives (mitigation: better UX)

## End Users

### Primary: Developers (Individual)
- Role: Software developers
- Pain points: Productivity, learning curves
- Goals: Ship faster, write better code
- Willingness to pay: $10-50/mo

### Secondary: Teams (Enterprise)
- Role: Engineering leads, CTOs
- Pain points: Onboarding, knowledge sharing
- Goals: Team productivity, consistency
- Willingness to pay: $100-1000/mo

### Tertiary: Salesforce Developers
- Role: Salesforce consultants, in-house devs
- Pain points: Complex platform, rapid changes
- Goals: Faster development, best practices
- Willingness to pay: $50-200/mo

## Go/No-Go Decision

### ✅ GO - Proceed with Confidence

**Strengths:**
1. Large, growing market (84% adoption)
2. Clear differentiation (91 commands, semantic search)
3. Strong unit economics (12:1 LTV:CAC)
4. Low technical risk (markdown-based)
5. Multiple monetization paths

**Concerns:**
1. Competition (mitigated: unique features)
2. Platform dependency (mitigated: portability)
3. Support overhead (mitigated: self-service)

**Requirements for Success:**
1. Execute on Phase 2 features (maintain lead)
2. Marketing focus on semantic search + onboarding
3. Salesforce niche penetration
4. Community building (open source)

## Recommendations

### Near-Term (0-3 months)
1. Complete Phase 2 features (Flow, AgentForce)
2. Launch marketing campaign (semantic search)
3. Salesforce community engagement
4. Case studies from early users

### Mid-Term (3-12 months)
1. Expand to other AI platforms (Cursor, Copilot)
2. Enterprise features (SSO, admin)
3. Team collaboration features
4. Marketplace/integration ecosystem

### Long-Term (12+ months)
1. Platform agnostic (multi-IDE support)
2. AI training on private codebases
3. Enterprise sales team
4. Strategic partnerships

## Competitive Requirements

### Must-Have for Market Entry
- [x] Comprehensive command set ✓
- [x] Semantic search ✓
- [x] Salesforce specialization ✓
- [ ] Multi-platform support (in progress)
- [ ] Enterprise features (planned)

### Differentiation Strategy
**Primary:** Semantic search (blue ocean)
**Secondary:** Salesforce specialization
**Tertiary:** Creative AI features

**Sustainable Advantage:**
- Hard to replicate: 91 commands require significant effort
- Network effects: Knowledge base improves with use
- Data moat: Semantic search index proprietary

---

**Analysis Date:** January 15, 2026
**Analyst:** Sift-Coder Feasibility Engine
**Confidence:** High
**Recommendation:** Proceed with commercialization
```

---

## Tips & Hints

```
WHEN TO USE

Starting a new project:
  → /siftcoder:feasibility
  → Validate idea before building

Seeking funding:
  → /siftcoder:feasibility --detailed
  → Comprehensive investor-ready analysis

Product pivot:
  → /siftcoder:feasibility
  → Assess new direction

Feature prioritization:
  → /siftcoder:feasibility --focus competitive
  → What's needed for market entry

ANALYSIS DEPTH

Quick assessment:
  → /siftcoder:feasibility
  → 5-10 minutes, high-level

Deep analysis:
  → /siftcoder:feasibility --detailed
  → 20-30 minutes, comprehensive

Market focus:
  → /siftcoder:feasibility --focus market
  → Emphasize market analysis

Technical focus:
  → /siftcoder:feasibility --focus technical
  → Emphasize feasibility

INTERPRETING RESULTS

GO with High confidence:
  → Proceed, full speed ahead

GO with Medium confidence:
  → Proceed but validate assumptions

NO-GO:
  → Don't proceed, or pivot significantly

PROCEED WITH CAUTION:
  → Address concerns first

KEY METRICS

LTV:CAC Ratio:
  > 3:1 = Good
  > 5:1 = Excellent
  < 3:1 = Concerning

Market Growth:
  > 20% YoY = High growth
  10-20% = Healthy
  < 10% = Mature/slow

Competition:
  Crowded = Need strong differentiation
  Emerging = First-mover advantage
  Niche = Focus on specialization
```

---

## Allowed Tools

Read, Write, Glob, Grep, Bash, AskUserQuestion
