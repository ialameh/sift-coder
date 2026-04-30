---
name: fortune
description: Use to predict where tech debt will hurt. "Which of these will become a problem", "what's about to bite us", "tech debt forecast". Severity decay model — older debt is heavier; recently touched debt is hotter.
---

# fortune

Tech-debt forecasting. Names which pieces of debt will most likely cause pain, ranked by predicted impact × probability × time-to-pain.

## Method

1. **Inventory.** Walk the repo or named area for debt signals:
   - TODO / FIXME / HACK / XXX comments
   - Long functions (> 50 LOC)
   - Files modified by &gt; 5 distinct authors
   - Files with low test coverage and high churn
   - Deprecation warnings unhandled
   - Pinned old dep versions (semver-major behind)
   - Commented-out code
   - Commented "remove once X" without follow-up
2. **Score each.** For every debt item:
   - **Severity** (1-5): how bad if it bites
   - **Probability** (1-5): how likely to bite in next 6 months — based on churn, blast radius, deprecation deadlines
   - **Time-to-pain** (weeks): when it'll likely matter
3. **Decay weight.** Recent commits to the area = hotter. Untouched-for-2-years and isolated = colder.
4. **Rank.** Top 10 by `severity × probability / time_to_pain`.
5. **Fix-cost estimate** for each top item: hours/days to address.

## Output shape

```
Area:    <repo or path>
Inventory: <N debt items found>

Top 10 fortune-tellings:

#1  [SxP] <severity>x<probability>  ETA: <weeks>  Cost: <hours/days>
    <one-line description>
    Where: <file:line>
    Why it'll bite: <evidence>

#2  ...
...

Cold list (debt that's probably fine to leave):
  - <count> items
```

## Rules

- Predictions cite evidence. "Will probably break" → "will probably break because <churn metric / dep version / deprecation deadline>".
- Don't recommend fixing all — that's not the point. The point is **prioritising**.
- Cold list matters too — naming what's safe to leave is half the value.
- Capture the report to memory; future fortune calls compare against it (did predictions hold?).

## Anti-patterns

- Listing every TODO without ranking
- Generic "could be a problem" without timing or evidence
- Recommending immediate rewrite of top-1 (often not warranted; just flag)
- Ignoring cold-list items (they need a name too)

## When NOT to use

- After a fix — debt forecast right after fixing isn't useful
- For a single file — overkill; just scan it manually
- Pre-launch crunch — fortune-telling is a strategic exercise, not tactical

## Subagent dispatch

- `Explore` for the inventory pass
- `Bash` for `git log --shortstat` / churn analysis
- Built-in `/security-review` may overlap on security-related debt — combine reports

## Value over native CC

CC will list debt if asked. CC won't naturally rank by impact × probability × time-to-pain or maintain cold-list discipline. The ranking IS the value.
