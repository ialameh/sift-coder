---
description: Generative Exploration Mode - AI dreams creative solutions without constraints, then filters to feasible
argument-hint: "<goal or problem>" [--wild|--practical|--compare]
allowed-tools: Read, Write, Glob, Grep, Task, WebSearch, AskUserQuestion
---

# /siftcoder:dream - Generative Exploration Mode

Let AI "dream" creative solutions without constraints. Explore wild ideas, then filter back to reality. Unlock innovation through unconstrained thinking.

## Usage

```
/siftcoder:dream "<goal>"              - Generate creative solutions
/siftcoder:dream --wild                - Maximum creativity, ignore constraints
/siftcoder:dream --practical           - Creative but grounded
/siftcoder:dream --compare             - Compare dream to current reality
```

## Philosophy

```
Constraints kill creativity.

When you ask "How do I improve X?", you get incremental ideas.
When you ask "What if X was magical?", you get breakthroughs.

Dream mode works in three phases:

  1. DREAM - Generate ideas without any constraints
     (Ignore: budget, time, technology, feasibility)

  2. FILTER - Assess each dream against reality
     (Consider: effort, risk, impact)

  3. BRIDGE - Find paths from current to dreamed

The best features started as "impossible" dreams.
```

## Instructions

### Default: Dream About a Goal

```
/siftcoder:dream "Make user onboarding magical"
```

```
DREAM MODE ACTIVATED
═══════════════════════════════════════════════════════════════

Goal: Make user onboarding magical

Entering creative space...
Constraints: SUSPENDED
Imagination: UNLIMITED

Dreaming...


DREAM #1: "The Personality Genie"
─────────────────────────────────────────────────────────────────

What if onboarding knew your personality before you told it?

Imagine:
  • User clicks "Get Started"
  • AI analyzes their first 3 micro-interactions:
    - How fast they click (impatient vs. careful)
    - Where their eyes go first (data vs. visuals)
    - How they hover over options (decisive vs. exploratory)
  • Onboarding morphs in real-time:
    - Impatient users: "Skip to essentials" button appears
    - Careful users: Detailed tooltips auto-expand
    - Visual users: More screenshots, less text

The Result:
  Every user feels like it was designed specifically for them.
  No two onboarding flows are exactly alike.

Feasibility Check:
  Technology: Exists (behavior tracking, ML classification)
  Effort: HIGH (2-3 weeks ML work, A/B testing)
  Impact: POTENTIALLY HUGE (personalization is sticky)
  Score: 72% feasible


DREAM #2: "Time Travel Tutorial"
─────────────────────────────────────────────────────────────────

What if we showed users their FUTURE before teaching them?

Imagine:
  • Before any tutorial starts, we show:
    "In 10 minutes, you'll be able to do THIS"
  • A 15-second video shows them confidently using the feature
  • It's actually THEM (generated with their name/avatar)
  • They see their own success before achieving it

The Psychology:
  • Visualization increases follow-through by 45%
  • Users commit because they've "seen" themselves succeed
  • Gamification through aspiration, not points

Feasibility Check:
  Technology: Simple (video + text personalization)
  Effort: LOW (1-2 days, mostly content creation)
  Impact: HIGH (motivation is often the bottleneck)
  Score: 91% feasible


DREAM #3: "The Companion Spirit"
─────────────────────────────────────────────────────────────────

What if users had an AI companion that grew with them?

Imagine:
  • Day 1: A friendly avatar greets them by name
  • As they learn, the companion learns too:
    "Oh, you're a visual learner! Let me show you differently"
  • The companion has personality:
    - Celebrates wins: "You just did something 90% of users don't!"
    - Notices struggle: "This trips up everyone. Want my secret?"
  • It persists across sessions:
    "Welcome back! You were learning about exports yesterday"

The Magic:
  Users form emotional connection with the product.
  They come back to see their companion, not just use the tool.

Feasibility Check:
  Technology: LLM-based, context memory
  Effort: MEDIUM (2-3 weeks, careful UX)
  Impact: DIFFERENTIATION (no competitor has this)
  Score: 68% feasible


DREAM #4: "Onboarding Olympics"
─────────────────────────────────────────────────────────────────

What if onboarding was a real-time competition?

Imagine:
  • You're not alone - you're in a "class" with 10 other new users
  • Live leaderboard: "Sarah is 2 steps ahead of you"
  • Team challenges: "Your cohort is top 10% this week!"
  • Real human connection:
    - Chat with your "classmates"
    - Help each other, earn "mentor" badges
  • Graduation ceremony when everyone completes

The Result:
  Social pressure (positive) drives completion.
  Built-in community from day one.
  Users arrive with friends already made.

Feasibility Check:
  Technology: Real-time infrastructure, matchmaking
  Effort: HIGH (4-6 weeks, complex systems)
  Impact: VIRAL (social features spread organically)
  Score: 45% feasible (but highest potential)


DREAM #5: "Achievement Unlocked Onboarding"
─────────────────────────────────────────────────────────────────

What if every step unlocked a REAL feature, not a badge?

Imagine:
  • Complete profile → Dark mode unlocked
  • First project created → Templates unlocked
  • Invite a friend → Collaboration features unlocked
  • All onboarding done → "Pro tools" unlocked for a week

The Difference:
  Most gamification is fake (badges, points, confetti).
  This is REAL - you're earning actual product value.
  It reframes onboarding from "chore" to "treasure hunt."

Feasibility Check:
  Technology: Feature flags + progress tracking
  Effort: LOW (1-2 days, mostly config)
  Impact: MEDIUM-HIGH (proven psychology)
  Score: 91% feasible


═══════════════════════════════════════════════════════════════
DREAM ANALYSIS
═══════════════════════════════════════════════════════════════

Feasibility Ranking:
  1. Dream #5: Achievement Unlocked (91%)  ← QUICK WIN
  2. Dream #2: Time Travel Tutorial (91%)  ← QUICK WIN
  3. Dream #1: Personality Genie (72%)
  4. Dream #3: Companion Spirit (68%)
  5. Dream #4: Onboarding Olympics (45%)

Impact vs Effort Matrix:

     HIGH │  #4●              #3●
  IMPACT  │       #1●
          │                #5● #2●
     LOW  │
          └─────────────────────────
            LOW    EFFORT    HIGH

Recommendation:
  START WITH: #5 and #2 (high impact, low effort)
  THEN: #1 (medium effort, differentiating)
  DREAM BIG: #4 (high effort, but unique in market)


[Build Dream #5] [Build Dream #2] [Explore #4 More] [Dream Again]
```

### Command: `--wild`

Maximum creativity mode:

```
/siftcoder:dream "revolutionize code review" --wild
```

```
WILD DREAM MODE
═══════════════════════════════════════════════════════════════

All constraints removed. Dreaming without limits...


WILD DREAM: "The Code Theatre"
─────────────────────────────────────────────────────────────────

What if code review was a live performance?

  • Code changes become "scenes" in a play
  • Variables are "actors" with personalities
  • The diff is "narrated" with dramatic tension:
    "And then... the authentication token EXPIRED!"
  • Reviewers are the audience, giving standing ovations
    or throwing tomatoes (emoji reactions)

Why it's wild: It reimagines review as entertainment
Why it might work: Engagement through novelty


WILD DREAM: "Quantum Code Review"
─────────────────────────────────────────────────────────────────

What if code existed in superposition until reviewed?

  • Multiple alternative implementations exist simultaneously
  • Reviewers don't approve/reject - they "observe"
  • Observation collapses possibilities to the best one
  • Bad alternatives are never "rejected" - they never existed
  • No egos hurt, no arguments

Why it's wild: Fundamentally different mental model
Why it might work: Removes adversarial nature of review


WILD DREAM: "Future Review"
─────────────────────────────────────────────────────────────────

What if we reviewed code FROM THE FUTURE?

  • AI simulates running this code for 1 year
  • Shows what will break, what will scale, what will frustrate
  • "In 6 months, this function will have 47 callers
    and that hardcoded value will cause 3 bugs"
  • Reviewers see consequences before they happen

Why it's wild: Requires predicting the future
Why it might work: We have patterns, we could extrapolate


[All wild dreams have <30% immediate feasibility but contain
seeds of innovation that could be simplified into real features]
```

### Command: `--practical`

Grounded creativity:

```
/siftcoder:dream "reduce checkout friction" --practical
```

```
PRACTICAL DREAM MODE
═══════════════════════════════════════════════════════════════

Creative but constrained to implementable ideas...


PRACTICAL DREAM #1: "One-Tap Checkout Memory"
─────────────────────────────────────────────────────────────────

Current: Users enter payment info every time
Dream: Remember EVERYTHING from last successful checkout

  • Shipping address pre-filled
  • Payment method pre-selected (last used)
  • Even product preferences remembered:
    "You usually choose gift wrapping"

Implementation:
  • 2-3 days work
  • Store encrypted checkout preferences
  • Add "Use same as last time" quick button

Impact: Reduce checkout time by 60%
Feasibility: 95%


[More practical dreams...]
```

## Configuration

```json
{
  "dream": {
    "defaultMode": "balanced",
    "minDreams": 5,
    "maxDreams": 10,
    "showFeasibility": true,
    "includeWildIdeas": true,
    "researchEnabled": true
  }
}
```

## Integration

Works well with:
  • `/siftcoder:ideate` - Market research for dreams
  • `/siftcoder:ghost` - Explore dream implementations
  • `/siftcoder:build` - Build the chosen dream
  • `/siftcoder:tdd` - Test-drive dream features
