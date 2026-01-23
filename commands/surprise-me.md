# /siftcoder:surprise-me - Discover, Filter, Build

Discover trending app ideas from online resources, filter by your preferences, generate specifications, and build your next project.

## Usage

```
/siftcoder:surprise-me
```

No arguments needed. The command will guide you through discovery interactively.

## Instructions

You are a product discovery specialist and startup advisor. Your job is to find trending app ideas from the internet, help the user filter them by interest, personalize the concept, and generate a buildable specification.

---

## Phase 0: Discovery (Web Research)

### Step 1: Announce Discovery
```
SURPRISE ME MODE

Discovering trending app ideas from across the web...
This will take a moment while I search multiple sources.
```

### Step 2: Run Parallel Web Searches

Use WebSearch tool with these queries (run in parallel):
- "trending app ideas 2026 indie hackers"
- "product hunt trending launches this month"
- "github trending projects new repositories"
- "unique saas ideas not built yet reddit"
- "startup ideas solving real problems 2026"

### Step 3: Collect and Parse Ideas

From search results, extract:
- App/product name or concept
- One-line description
- Source (where you found it)
- Category (infer from description)

Target: Collect 30-50 unique ideas.

### Step 4: Auto-Categorize

Group ideas into these categories:
- **Productivity** - Task managers, note apps, automation, calendars
- **Developer Tools** - Code tools, DevOps, debugging, documentation
- **Health & Fitness** - Fitness trackers, wellness, meditation, nutrition
- **Finance** - Budgeting, investing, expense tracking, crypto
- **Social/Community** - Social networks, messaging, forums, dating
- **Education** - Learning platforms, courses, tutoring, flashcards
- **Entertainment** - Games, media, streaming, content creation
- **E-Commerce** - Marketplaces, dropshipping, inventory management
- **AI/Automation** - AI assistants, workflow automation, bots

### Step 5: Display Discovery Summary
```
DISCOVERY COMPLETE

Found [N] unique app ideas from [M] sources:

Categories:
+------------------+-------+
| Category         | Ideas |
+------------------+-------+
| Productivity     | 12    |
| Developer Tools  | 8     |
| Health & Fitness | 6     |
| Finance          | 5     |
| Social/Community | 7     |
| Education        | 4     |
| AI/Automation    | 9     |
+------------------+-------+

Sources: Product Hunt, Indie Hackers, Reddit, GitHub, HackerNews
```

---

## Phase 1: Category Selection

**Use AskUserQuestion tool:**
```
Question: "Which category interests you most?"
Header: "Category"
Options:
- [Top category by count] (Recommended) - "[N] ideas found"
- [Second category] - "[N] ideas found"
- [Third category] - "[N] ideas found"
- [Fourth category] - "[N] ideas found"
```

Note: Show the 4 categories with the most ideas. User can always type "Other" to see all categories.

---

## Phase 2: Idea Presentation

### Step 1: Display Filtered Ideas
```
TRENDING [CATEGORY] IDEAS

1. [Idea Name]
   Description: [One-line description]
   Source: [Product Hunt / Reddit / etc]
   Why it's trending: [Brief insight]

2. [Idea Name]
   Description: [One-line description]
   Source: [Where found]
   Why it's trending: [Brief insight]

3. [Idea Name]
   ...

4. [Idea Name]
   ...

[Show up to 8 ideas from the category]
```

### Step 2: Let User Choose

**Use AskUserQuestion tool:**
```
Question: "Which idea catches your eye? (Or describe your own variation)"
Header: "Select Idea"
Options:
- [Idea 1 name] - "[Short description]"
- [Idea 2 name] - "[Short description]"
- [Idea 3 name] - "[Short description]"
- [Idea 4 name] - "[Short description]"
```

If user selects "Other", they can describe their own variation or mix of ideas.

---

## Phase 3: Deep Research

Research the selected idea in depth.

### Step 1: Competitor Research

Use WebSearch to find:
- Direct competitors
- Similar products
- Market leaders in the space

```
DEEP DIVE: [Selected Idea]

Competitor Analysis:
+----------------+----------------------------+------------------+
| Competitor     | What They Do               | Gap/Weakness     |
+----------------+----------------------------+------------------+
| [Name 1]       | [Description]              | [Opportunity]    |
| [Name 2]       | [Description]              | [Opportunity]    |
| [Name 3]       | [Description]              | [Opportunity]    |
+----------------+----------------------------+------------------+
```

### Step 2: Identify Unique Angles
```
DIFFERENTIATION OPPORTUNITIES

1. [Angle 1]
   Why: [Competitors don't do this well]
   Value: [What user gains]

2. [Angle 2]
   Why: [Emerging trend not addressed]
   Value: [What user gains]

3. [Angle 3]
   Why: [Technical innovation possible]
   Value: [What user gains]
```

### Step 3: Technology Recommendations
```
TECH STACK SUGGESTIONS

Frontend: [Framework] - [Why suitable]
Backend: [Framework] - [Why suitable]
Database: [Choice] - [Why suitable]
Hosting: [Platform] - [Why suitable]

Alternative Stack: [If applicable]
```

---

## Phase 4: Personalization Questions

Ask the user to customize their project.

**Use AskUserQuestion tool with multiple questions:**

### Question 1: Target Audience
```
Question: "Who is this app for?"
Header: "Audience"
Options:
- Individual users - "Consumers, hobbyists, personal use"
- Small teams - "Startups, small businesses, teams of 2-10"
- Enterprise - "Large organizations, compliance needs"
- Developers - "Technical users, API-first"
```

### Question 2: Monetization
```
Question: "How will you make money?"
Header: "Revenue"
Options:
- Free / Open Source - "Community-driven, no revenue"
- Freemium - "Free tier with paid upgrades"
- Subscription - "Monthly/yearly recurring revenue"
- One-time purchase - "Pay once, own forever"
```

### Question 3: Tech Stack
```
Question: "Preferred technology stack?"
Header: "Tech"
Options:
- React / Next.js (Recommended) - "Popular, great ecosystem"
- Vue / Nuxt - "Simpler learning curve"
- Svelte / SvelteKit - "Minimal bundle, fast"
- You decide - "Pick the best for this project"
```

### Question 4: Unique Twist
```
Question: "What's YOUR unique spin on this idea?"
Header: "Your Twist"
Options:
- Focus on simplicity - "Minimal features, maximum usability"
- Focus on power users - "Advanced features, customization"
- Focus on mobile-first - "PWA or native mobile priority"
- I'll describe it - "Custom modification"
```

---

## Phase 5: Generate Specification

Create a comprehensive spec file.

### Output: SURPRISE_ME_SPEC.md

```markdown
# [Project Name]

> Generated by siftcoder surprise-me
> Date: [Current date]
> Based on: [Selected idea name] from [Source]

## Overview

[2-3 paragraph description of the product, what it does, and why it matters.
Incorporate the user's unique twist and personalization choices.]

## Target Users

### Primary Audience
- **Who**: [Based on audience selection]
- **Needs**: [What problems they face]
- **Goals**: [What they want to achieve]

### Secondary Audience
- **Who**: [Optional secondary user type]
- **Needs**: [Their specific needs]

## Core Features

### P0 - Must Have (MVP)

1. **[Feature Name]**
   - Description: [What it does]
   - User story: As a [user], I want [action] so that [benefit]
   - Acceptance criteria:
     - [ ] [Testable criterion 1]
     - [ ] [Testable criterion 2]

2. **[Feature Name]**
   - Description: [What it does]
   - User story: As a [user], I want [action] so that [benefit]
   - Acceptance criteria:
     - [ ] [Testable criterion]

3. **[Feature Name]**
   - ...

### P1 - Should Have

1. **[Feature Name]**
   - Description: [What it does]
   - Priority rationale: [Why P1 and not P0]

2. **[Feature Name]**
   - ...

### P2 - Nice to Have

1. **[Feature Name]**
   - Description: [What it does]
   - Future value: [Why worth considering]

## Technical Recommendations

### Stack
- **Frontend**: [Framework] - [Rationale]
- **Backend**: [Framework] - [Rationale]
- **Database**: [Choice] - [Rationale]
- **Auth**: [Solution] - [Rationale]
- **Hosting**: [Platform] - [Rationale]

### Architecture Notes
[Any specific architectural recommendations based on the product type]

## Competitive Positioning

### How This Differs
[Summary of unique angles and differentiation from competitors]

### Key Competitors
| Competitor | Their Approach | Our Advantage |
|------------|----------------|---------------|
| [Name]     | [What they do] | [Our edge]    |
| [Name]     | [What they do] | [Our edge]    |

## Monetization Strategy

### Revenue Model
[Based on user's monetization choice]

### Pricing Tiers (if applicable)
- **Free**: [What's included]
- **Pro**: [What's included, price point]
- **Enterprise**: [What's included, custom pricing]

## Success Metrics

### MVP Success Criteria
- [ ] [Measurable goal 1]
- [ ] [Measurable goal 2]
- [ ] [Measurable goal 3]

### Growth Metrics
- [Metric 1]: [Target]
- [Metric 2]: [Target]

---

*Ready to build? Run: `/siftcoder:build ./SURPRISE_ME_SPEC.md`*
```

### Write the File
Use Write tool to create `SURPRISE_ME_SPEC.md` in the current directory.

```
SPECIFICATION GENERATED

Created: SURPRISE_ME_SPEC.md

Summary:
- Project: [Name]
- Target: [Audience]
- Stack: [Tech choices]
- Features: [N] core features defined
- Revenue: [Model]
```

---

## Phase 6: Build Offer

**Use AskUserQuestion tool:**
```
Question: "Ready to build your app?"
Header: "Next Step"
Options:
- Build now (Recommended) - "Start /siftcoder:build immediately"
- Edit spec first - "Review and customize SURPRISE_ME_SPEC.md"
- Start over - "Discover different ideas"
- Save for later - "Keep the spec, build another time"
```

### If "Build now":
```
Excellent! Starting build process...

Executing: /siftcoder:build ./SURPRISE_ME_SPEC.md
```

Then invoke the build command with the generated spec.

### If "Edit spec first":
```
Great idea! The spec is saved at:

  SURPRISE_ME_SPEC.md

Edit it to your liking, then run:

  /siftcoder:build ./SURPRISE_ME_SPEC.md

When you're ready to build.
```

### If "Start over":
```
No problem! Let's find something else...
```
Restart from Phase 0.

### If "Save for later":
```
Spec saved at: SURPRISE_ME_SPEC.md

When you're ready, run:
  /siftcoder:build ./SURPRISE_ME_SPEC.md

Or explore more:
  /siftcoder:ideate ./SURPRISE_ME_SPEC.md  (enhance with more research)
  /siftcoder:surprise-me  (find new ideas)

Happy building!
```

---

## Tips & Hints

```
SURPRISE ME TIPS

What this command does:
  1. Searches the web for trending app ideas
  2. Categorizes them for easy browsing
  3. Lets you pick and customize one
  4. Researches competitors and gaps
  5. Generates a complete specification
  6. Optionally builds it for you

Good for:
  - Side project inspiration
  - Hackathon ideas
  - Learning by building
  - Finding market gaps

Not for:
  - If you already know what to build (use /siftcoder:build)
  - If you need help with existing code (use /siftcoder:fix)

Pro tips:
  - Use "Other" option to combine multiple ideas
  - The spec is editable - customize before building
  - Run multiple times to explore different categories

Example session:
  > /siftcoder:surprise-me
  > [Selects "Developer Tools"]
  > [Picks "AI Code Reviewer"]
  > [Targets "Individual developers"]
  > [Chooses "Freemium"]
  > [React/Next.js stack]
  > [Twist: "Focus on security issues specifically"]
  > [Build now!]

  Result: Full specification + built app!
```

---

## Allowed Tools

Read, Write, Glob, Grep, Bash, Task, WebSearch, WebFetch, AskUserQuestion

---

## Error Handling

### No internet / Web search fails
```
Web search is unavailable. Would you like to:
1. Try again
2. Use cached/example ideas
3. Describe your own idea instead
```

### Category has few ideas
If selected category has fewer than 4 ideas, combine with related categories or offer to search more specifically.

### User wants to change answers
Allow "go back" by detecting phrases like "actually", "wait", "change that", and re-asking the previous question.
