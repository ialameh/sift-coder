# CREATIVE & NOVEL Commands

**AI-powered insights and creative tools**

The CREATIVE & NOVEL workflow contains 15 unique AI features that go beyond traditional development tools - from rubber duck debugging to ghost mode exploration to predictive intent.

---

## Commands Overview

| Command | Purpose | Difficulty | Time |
|---------|---------|------------|------|
| [`/duck`](#duck) | AI rubber duck debugging | ⭐ Beginner | 5-15 min |
| [`/ghost`](#ghost) | Parallel universe exploration | ⭐⭐ Intermediate | 10-20 min |
| [`/oracle`](#oracle) | Predictive intent engine | ⭐ Beginner | 1 min |
| [`/archaeologist`](#archaeologist) | Deep code history intelligence | ⭐⭐ Intermediate | 10-20 min |
| [`/timewarp`](#timewarp) | State reconstruction debugging | ⭐⭐⭐ Advanced | 15-30 min |
| [`/narrator`](#narrator) | Code-to-story translation | ⭐ Beginner | 5-10 min |
| [`/dream`](#dream) | Generative exploration mode | ⭐⭐ Intermediate | 15-30 min |
| [`/invariant`](#invariant) | Automatic contract mining | ⭐⭐ Intermediate | 10-20 min |
| [`/chaos`](#chaos) | Intelligent chaos engineering | ⭐⭐⭐ Advanced | 20-40 min |
| [`/fuzz-mind`](#fuzz-mind) | Intelligent edge case generation | ⭐⭐ Intermediate | 10-20 min |
| [`/ripple`](#ripple) | Change impact visualization | ⭐ Beginner | 2-5 min |
| [`/fortune`](#fortune) | Technical debt fortune telling | ⭐⭐ Intermediate | 10-15 min |
| [`/polyglot`](#polyglot) | Cross-language intelligence | ⭐⭐ Intermediate | 5-15 min |
| [`/empathy`](#empathy) | Developer pain point detection | ⭐⭐ Intermediate | 10-20 min |
| [`/zen`](#zen) | Minimalist code mode | ⭐⭐ Intermediate | 5-15 min |

---

## /duck

AI Rubber Duck Debugging - forces YOU to explain the code. The AI asks probing Socratic questions instead of giving answers, helping you discover the solution yourself.

### Quick Overview
- **Purpose**: Socratic questioning for problem-solving
- **Difficulty**: ⭐ Beginner
- **Time Estimate**: 5-15 min
- **Mode**: Interactive

### When to Use This Command

✅ **Use this when:**
- Stuck on a problem
- Want to discover the solution yourself
- Need to think through complex logic
- Learning and understanding code

### Syntax

```bash
/siftcoder:duck "I'm stuck on..."
```

### Examples

```bash
/siftcoder:duck "I can't figure out why the cache is always stale"
```

**Interactive session:**
```
🦆 Rubber Duck Debugging: Cache Issue

Q1: When does the cache get populated?
   A: After database queries

Q2: When does the cache get invalidated?
   A: Hmm... I don't think we invalidate it

Q3: What happens when data changes in the database?
   A: Oh! We never update the cache!

💡 Discovery: Cache needs invalidation on data changes!

Your solution: Add cache invalidation hooks after database writes
```

---

## /ghost

Parallel Universe Exploration - explore "what-if" architectural changes safely. Test alternative implementations without touching real code.

### Quick Overview
- **Purpose**: Safe "what-if" exploration
- **Difficulty**: ⭐⭐ Intermediate
- **Time Estimate**: 10-20 min
- **Mode**: Read-only (parallel exploration)

### When to Use This Command

✅ **Use this when:**
- Considering architectural changes
- Want to compare approaches
- Testing ideas without risk
- Exploring refactoring options

### Syntax

```bash
/siftcoder:ghost "What if we..."
```

### Examples

```bash
/siftcoder:ghost "What if we switched from REST to GraphQL"
```

**Output:**
```
👻 Parallel Universe: REST → GraphQL Migration

EXPLORING ALTERNATE REALITY...

Current Architecture (REST):
├── /api/users
├── /api/posts
└── /api/comments

Proposed Architecture (GraphQL):
├── Single endpoint: /graphql
├── Schema with User, Post, Comment types
└── Resolvers for data fetching

CHANGES REQUIRED:
├── Create GraphQL schema (20 types)
├── Write resolvers (15 functions)
├── Update client queries (25 components)
└── Remove REST endpoints (30 routes)

BENEFITS:
✓ Reduced over-fetching
✓ Single round-trip for related data
✓ Type-safe client queries

RISKS:
✗ 2-3 week migration
✗ Learning curve for team
✗ Need GraphQL monitoring

RECOMMENDATION:
Worth exploring if:
→ Over-fetching is a problem
→ Complex nested data requirements
→ Team willing to learn GraphQL
```

---

## /oracle

Predictive Intent Engine - anticipates what you're about to do before you ask based on patterns and context.

### Quick Overview
- **Purpose**: Predict next action
- **Difficulty**: ⭐ Beginner
- **Time Estimate**: 1 min
- **Mode**: Read-only

### Syntax

```bash
/siftcoder:oracle
```

### Examples

```bash
/siftcoder:oracle
```

**Output:**
```
🔮 Predictive Intent

Based on context, you might want to:

1. /test generate src/services/payment.ts
   → You just modified payment service
   → Tests don't exist yet

2. /document code src/services/payment.ts
   → New code needs documentation

3. /security scan
   → Payment handling is security-sensitive

Would you like me to run one of these?
```

---

## /ripple

Change Impact Visualization - see how a change ripples through your entire system before making it.

### Quick Overview
- **Purpose**: Visualize change impact
- **Difficulty**: ⭐ Beginner
- **Time Estimate**: 2-5 min
- **Mode**: Read-only

### Syntax

```bash
/siftcoder:ripple "proposed change"
```

### Examples

```bash
/siftcoder:ripple "Renaming User model to Account"
```

**Output:**
```
🌊 Change Impact: User → Account

DIRECT IMPACT (5 files):
  ✓ src/models/User.ts
  ✓ src/services/userService.ts
  ✓ src/api/users.ts
  ✓ src/components/UserProfile.tsx
  ✓ tests/user.test.ts

INDIRECT IMPACT (12 files):
  → src/auth/jwt.ts (references User.id)
  → src/admin/dashboard.ts (queries User)
  → src/reports/userReport.ts (imports User)
  ...

BREAKING CHANGES:
  🚨 API: /api/users/* → /api/accounts/*
  🚨 Database: users table → accounts table
  🚨 Type: User → Account in TypeScript

ESTIMATED WORK:
  Files to modify: 17
  Tests to update: 23
  Migration script: Yes
  Breaking change: Yes

RISK: HIGH
```

---

## /archaeologist

Deep Code History Intelligence - understand WHY code exists beyond git blame. Discovers the full story of how code evolved.

### Quick Overview
- **Purpose**: Deep code history analysis
- **Difficulty**: ⭐⭐ Intermediate
- **Time Estimate**: 10-20 min
- **Mode**: Read-only

### Syntax

```bash
/siftcoder:archaeologist <file>
```

---

## /fortune

Technical Debt Fortune Telling - predicts which tech debt will cause problems and when based on patterns.

### Quick Overview
- **Purpose**: Predict tech debt impact
- **Difficulty**: ⭐⭐ Intermediate
- **Time Estimate**: 10-15 min
- **Mode**: Read-only

### Syntax

```bash
/siftcoder:fortune
```

### Examples

```bash
/siftcoder:fortune
```

**Output:**
```
🔮 Technical Debt Fortune Telling

PREDICTIONS:

🚨 HIGH RISK (will break in 1-3 months):

1. src/legacy/payment.js
   Debt: Using deprecated payment API
   Prediction: API deprecation will break payments
   Timeline: ~2 months (API shutdown April 2025)
   Action: Migrate to new API now

2. src/utils/regex.js
   Debt: Copy-pasted regex patterns
   Prediction: Maintenance nightmare when rules change
   Timeline: ~1 month (new compliance rules)
   Action: Centralize regex configuration

⚠️  MEDIUM RISK (will cause issues in 3-6 months):

3. Database schema (users table)
   Debt: No indexes on frequently queried columns
   Prediction: Performance degradation as data grows
   Timeline: ~4 months (at 100K rows)
   Action: Add indexes before data growth

RECOMMENDATIONS:
→ Prioritize payment API migration
→ Add database indexes
→ Refactor regex patterns
```

---

## /empathy

Developer Pain Point Detection - finds frustrating code and measures cognitive load. Identifies code that causes developer suffering before they complain.

### Quick Overview
- **Purpose**: Find frustrating code
- **Difficulty**: ⭐⭐ Intermediate
- **Time Estimate**: 10-20 min
- **Mode**: Read-only

### Syntax

```bash
/siftcoder:empathy
```

### Examples

```bash
/siftcoder:empathy
```

**Output:**
```
💗 Developer Pain Point Detection

ANALYZING codebase for cognitive load...

HIGH PAIN AREAS (cognitive load: 9/10):

1. src/utils/dataTransformer.ts
   Pain: "Spaghetti code" - 800-line function
   Issues:
   → Too many branching paths (23)
   → Deep nesting (8 levels)
   → Mixed concerns (validation + transformation + persistence)
   Impact: Changes take hours, risky to modify

   Recommendation: Break into smaller functions

2. src/config/index.ts
   Pain: "Configuration hell" - 150 env vars
   Issues:
   → No grouping or structure
   → Unclear naming (flag1, flag2, temp_var)
   → Missing documentation
   Impact: Onboarding takes weeks

   Recommendation: Group config, add docs

MEDIUM PAIN (cognitive load: 6-8):

3. src/components/DataTable.tsx
   Pain: "Prop drilling" - 47 props
   Issues:
   → Too many responsibilities
   → Hard to track data flow

   Recommendation: Use context or composition
```

---

## Workflow Examples

### Creative Problem Solving

```bash
# 1. Get unstuck with rubber ducking
/siftcoder:duck "Stuck on cache invalidation"

# 2. Explore alternative approaches
/siftcoder:ghost "What if we used Redis instead"

# 3. Check impact of change
/siftcoder:ripple "Replace cache with Redis"
```

### Technical Debt Analysis

```bash
# 1. Find pain points
/siftcoder:empathy

# 2. Predict what will break
/siftcoder:fortune

# 3. Understand why code exists
/siftcoder:archaeologist src/legacy/problematic.ts
```

---

## See Also

- [DEBUG Workflow](debug-workflow.md) - Traditional debugging
- [REFACTOR Workflow](refactor-workflow.md) - Code improvement
- [Advanced Topics](../../10-advanced-topics/index.md) - Novel AI deep dive
