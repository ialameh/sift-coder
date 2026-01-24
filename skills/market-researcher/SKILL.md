---
name: market-researcher
description: Conduct comprehensive market research including competitor analysis, market trends, and user demand signals
version: 1.0.0
---

# Market Researcher Skill

Conduct comprehensive market research including competitor analysis, market trends, and user demand signals.

## Invocation
This skill is invoked by `/siftcoder:ideate` at Level 2+ or can be used standalone.

## Capabilities

### 1. Competitor Analysis

**Process:**
1. Identify top competitors via web search
2. Analyze their feature sets
3. Map strengths and weaknesses
4. Identify differentiation opportunities

**Output Format:**
```
COMPETITOR ANALYSIS

[Competitor Name]
├── Website: [URL]
├── Category: [Direct/Indirect competitor]
├── Pricing Model: [Free/Freemium/Paid/Enterprise]
├── Target Audience: [Who they serve]
├── Key Features:
│   ├── [Feature 1] - [Quality: Good/Average/Poor]
│   ├── [Feature 2] - [Quality]
│   └── [Feature 3] - [Quality]
├── Unique Selling Points:
│   └── [What makes them stand out]
├── Weaknesses:
│   ├── [User complaints from reviews]
│   └── [Missing features]
└── Market Position: [Leader/Challenger/Niche]
```

### 2. Market Size & Trends

**Research Sources:**
- Industry reports (search for "[domain] market size 2025")
- News articles on market growth
- Funding announcements in the space
- Job posting trends (indicates growth)

**Output Format:**
```
MARKET OVERVIEW

Industry: [Name]
Market Size: $[X]B (2025) → $[Y]B (2030 projected)
CAGR: [X]%
Growth Drivers:
├── [Driver 1]
├── [Driver 2]
└── [Driver 3]

Key Trends:
├── [Trend 1] - [Impact on product]
├── [Trend 2] - [Impact on product]
└── [Trend 3] - [Impact on product]

Market Segments:
├── [Segment 1] - [Size/Growth]
├── [Segment 2] - [Size/Growth]
└── [Segment 3] - [Size/Growth]
```

### 3. User Demand Signals

**Research Methods:**
- Reddit/forum discussions (pain points, feature requests)
- Product review analysis (G2, Capterra, ProductHunt)
- Social media sentiment
- Support/FAQ pages of competitors (common issues)

**Output Format:**
```
USER DEMAND SIGNALS

Most Requested Features (from reviews/forums):
├── [Feature 1] - Mentioned [X] times
├── [Feature 2] - Mentioned [X] times
└── [Feature 3] - Mentioned [X] times

Common Pain Points:
├── "[Quote from user]" - [Frequency: Common/Occasional]
├── "[Quote from user]" - [Frequency]
└── "[Quote from user]" - [Frequency]

Satisfaction Drivers:
├── [What users love about existing solutions]
└── [What makes them switch products]

Churn Reasons:
├── [Why users leave competitors]
└── [Missing features that cause churn]
```

### 4. Pricing Intelligence

**Output Format:**
```
PRICING LANDSCAPE

Competitor Pricing:
├── [Competitor 1]
│   ├── Free Tier: [Features]
│   ├── Pro: $[X]/mo - [Features]
│   └── Enterprise: $[X]/mo - [Features]
├── [Competitor 2]
│   └── ...

Price Sensitivity:
├── Low End: $[X]/mo (feature-limited)
├── Mid Market: $[X-Y]/mo (standard)
└── Premium: $[X]+/mo (full-featured)

Pricing Model Trends:
├── [Model 1] - [% of competitors using]
└── [Model 2] - [% of competitors using]

Recommended Positioning:
└── [Price point] with [key differentiator]
```

### 5. Market Gap Analysis

**Output Format:**
```
MARKET GAPS & OPPORTUNITIES

Underserved Segments:
├── [Segment 1] - [Why underserved]
└── [Segment 2] - [Why underserved]

Feature Gaps:
├── [Feature nobody does well]
├── [Feature with poor implementations]
└── [Feature only in expensive tiers]

Blue Ocean Opportunities:
├── [Opportunity 1]
│   ├── Description: [What it is]
│   ├── Why Exists: [Market blind spot]
│   └── Validation: [Evidence of demand]
└── [Opportunity 2]
    └── ...
```

## Research Workflow

1. **Define Domain**
   - Identify industry/category
   - List known competitors
   - Define target audience

2. **Web Research**
   ```
   Search queries to run:
   - "[domain] software market size 2025"
   - "[domain] app competitors comparison"
   - "best [domain] tools reddit"
   - "[competitor] reviews G2"
   - "[domain] software pricing"
   - "[domain] industry trends"
   ```

3. **Synthesize Findings**
   - Cross-reference multiple sources
   - Identify patterns and consensus
   - Note conflicting information
   - Highlight high-confidence vs speculative insights

4. **Generate Insights**
   - Actionable recommendations
   - Prioritized opportunities
   - Risk assessment

## Tools Used
- WebSearch - Market research queries
- WebFetch - Detailed page analysis
- Read/Write - Report generation

## Runtime Implementation

This skill includes a minimal `skill.ts` entry point to satisfy plugin requirements.
The primary value remains in this documentation - see sections above for:
- Market research patterns
- Analysis workflows
- Best practices

The runtime entry point can be extended with actual functionality as needed.

## Quality Guidelines

- **Cite sources** when making claims
- **Distinguish facts from speculation**
- **Provide confidence levels** for estimates
- **Update research date** - market data ages quickly
- **Consider geographic differences** in markets
