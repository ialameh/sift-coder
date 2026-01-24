---
name: seo-researcher
description: Research search trends, keywords, and user intent to inform feature development and content strategy
version: 1.0.0
---

# SEO Researcher Skill

Research search trends, keywords, and user intent to inform feature development and content strategy.

## Invocation
This skill is invoked by `/siftcoder:ideate` at Level 3 or can be used standalone.

## Capabilities

### 1. Keyword Research

**Research Process:**
1. Identify seed keywords from spec/domain
2. Expand with related terms
3. Analyze search volume and competition
4. Identify long-tail opportunities

**Output Format:**
```
KEYWORD ANALYSIS

Primary Keywords:
┌─────────────────────────┬────────────┬─────────────┬──────────┐
│ Keyword                 │ Volume/mo  │ Competition │ Intent   │
├─────────────────────────┼────────────┼─────────────┼──────────┤
│ [keyword 1]             │ [X]K       │ High/Med/Low│ [type]   │
│ [keyword 2]             │ [X]K       │ High/Med/Low│ [type]   │
│ [keyword 3]             │ [X]K       │ High/Med/Low│ [type]   │
└─────────────────────────┴────────────┴─────────────┴──────────┘

Long-Tail Opportunities:
├── "[long phrase 1]" - [volume] - Low competition
├── "[long phrase 2]" - [volume] - Low competition
└── "[long phrase 3]" - [volume] - Low competition

Question Keywords (People Also Ask):
├── "How to [X]?" - [volume]
├── "What is [X]?" - [volume]
├── "Why does [X]?" - [volume]
└── "[X] vs [Y]?" - [volume]
```

### 2. Search Intent Analysis

**Intent Categories:**
- **Informational**: User wants to learn something
- **Navigational**: User looking for specific site/page
- **Transactional**: User wants to buy/sign up
- **Commercial Investigation**: User comparing options

**Output Format:**
```
SEARCH INTENT MAPPING

Informational Queries (Content Opportunities):
├── "[query]" → Blog post: "[Title idea]"
├── "[query]" → Tutorial: "[Title idea]"
└── "[query]" → FAQ section

Transactional Queries (Conversion Pages):
├── "[query]" → Landing page: [Focus]
├── "[query]" → Pricing page optimization
└── "[query]" → Sign-up flow entry point

Commercial Investigation (Comparison Content):
├── "[query]" → Comparison page: "[Product] vs alternatives"
├── "[query]" → Feature showcase page
└── "[query]" → Case studies / testimonials

Feature-Driven Search Opportunities:
├── "[feature keyword]" - Build [feature] to rank for this
├── "[feature keyword]" - [Feature] addresses this search
└── "[feature keyword]" - Content + feature combination
```

### 3. Trend Analysis

**Research Methods:**
- Google Trends data
- Social media trending topics
- Industry news and announcements
- Seasonal patterns

**Output Format:**
```
SEARCH TREND ANALYSIS

Rising Searches (YoY Growth):
├── "[term 1]" - +[X]% - [Insight]
├── "[term 2]" - +[X]% - [Insight]
└── "[term 3]" - +[X]% - [Insight]

Declining Searches:
├── "[term 1]" - -[X]% - [What's replacing it]
└── "[term 2]" - -[X]% - [Market shift]

Seasonal Patterns:
├── [Month]: Peak for "[term]"
├── [Month]: Peak for "[term]"
└── [Month]: Low season for "[term]"

Emerging Topics:
├── [Topic 1] - Early stage trend
│   └── Feature opportunity: [Idea]
├── [Topic 2] - Growing rapidly
│   └── Content opportunity: [Idea]
└── [Topic 3] - Mainstream soon
    └── Competitive timing: [Recommendation]
```

### 4. Competitor SEO Analysis

**Output Format:**
```
COMPETITOR SEO ANALYSIS

[Competitor Name]:
├── Domain Authority: [Score]
├── Top Ranking Keywords:
│   ├── "[keyword]" - Position [X]
│   ├── "[keyword]" - Position [X]
│   └── "[keyword]" - Position [X]
├── Content Strategy:
│   ├── Blog posts: [Frequency]
│   ├── Topics: [Main themes]
│   └── Top performing: "[Title]"
├── Backlink Profile:
│   ├── Total backlinks: [X]
│   └── Notable sources: [Sites]
└── SEO Gaps:
    └── Keywords they don't rank for: [List]

Competitive Opportunities:
├── Keywords to target: [List with rationale]
├── Content gaps: [Topics not covered]
└── Technical advantages: [Speed, mobile, etc.]
```

### 5. Feature-SEO Mapping

**Connect features to search demand:**

```
FEATURE-SEO OPPORTUNITIES

High-Impact Features (Strong Search Demand):
├── Feature: [Name]
│   ├── Target Keywords: "[kw1]", "[kw2]"
│   ├── Monthly Search Volume: [Total]
│   ├── Current Competition: [Assessment]
│   ├── Content Strategy: [How to rank]
│   └── SEO Value: HIGH
│
├── Feature: [Name]
│   └── ...

Medium-Impact Features:
├── Feature: [Name]
│   └── ...

Low Search Demand (Build for Users, Not SEO):
├── Feature: [Name]
│   └── Rationale: [Why still valuable]
```

### 6. Content Strategy Recommendations

```
CONTENT STRATEGY

Pillar Content (Cornerstone Pages):
├── "[Topic 1]" - Ultimate guide format
│   └── Target keywords: [List]
├── "[Topic 2]" - Comprehensive resource
│   └── Target keywords: [List]

Supporting Content (Blog/Resources):
├── Week 1: "[Title]" - [Target keyword]
├── Week 2: "[Title]" - [Target keyword]
├── Week 3: "[Title]" - [Target keyword]
└── Week 4: "[Title]" - [Target keyword]

Link Building Opportunities:
├── Resource pages in [niche]
├── Guest posting targets: [Sites]
├── Broken link opportunities: [Strategy]
└── Industry directories: [List]

Technical SEO Checklist:
├── [ ] Page speed optimization
├── [ ] Mobile-first indexing ready
├── [ ] Structured data (Schema.org)
├── [ ] XML sitemap
├── [ ] Robots.txt optimization
├── [ ] Canonical tags
├── [ ] Internal linking strategy
└── [ ] Image optimization (WebP, lazy loading)
```

## Research Workflow

1. **Seed Keyword Generation**
   - Extract terms from spec
   - Brainstorm user search behavior
   - List competitor brand terms

2. **Search Query Expansion**
   ```
   Web searches to run:
   - "[domain] keywords"
   - "[domain] search trends 2025"
   - "what people search for [domain]"
   - "[competitor] SEO analysis"
   - "Google Trends [domain]"
   ```

3. **Analyze Results**
   - Volume estimation (relative if exact unavailable)
   - Competition assessment
   - Intent classification

4. **Map to Features**
   - Connect keywords to product capabilities
   - Identify feature gaps from search demand
   - Prioritize by search volume + fit

5. **Strategy Formulation**
   - Content calendar recommendations
   - Feature prioritization by SEO value
   - Technical requirements

## Tools Used
- WebSearch - Keyword and trend research
- WebFetch - Competitor analysis
- Read/Write - Report generation

## Runtime Implementation

This skill includes a minimal `skill.ts` entry point to satisfy plugin requirements.
The primary value remains in this documentation - see sections above for:
- SEO research patterns
- Keyword analysis workflows
- Best practices

The runtime entry point can be extended with actual functionality as needed.

## Quality Guidelines

- **Use relative estimates** when exact data unavailable
- **Explain methodology** for volume/competition assessments
- **Consider local vs global** search patterns
- **Account for search engine diversity** (not just Google)
- **Balance SEO with user value** - don't build for bots only
- **Note data freshness** - search trends change rapidly
