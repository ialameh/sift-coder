---
name: siftcoder
description: Use as a meta-skill — "which SiftCoder skill should I use for X". Decision tree across families. Use when user is unsure which specific skill applies.
---

# siftcoder (meta)

Decision tree across SiftCoder skill families. Use when the user has a goal but isn't sure which skill fits.

## Quick triage

| User says | Skill |
|---|---|
| "build me X" | coding/build |
| "fix this bug" | coding/fix |
| "test this" | coding/tdd  |
| "investigate why" | coding/investigate or reasoning/archaeologist |
| "refactor" | coding/refactor |
| "make it faster" | coding/optimize |
| "make it simpler" | coding/zen |
| "review this PR" | review/review (with built-in /review) |
| "is it secure" | review/security or built-in /security-review |
| "is it compliant" | quality/comply or salesforce/salesforce-comply |
| "what does this do" | reasoning/narrator |
| "why does this exist" | reasoning/archaeologist |
| "find the pattern" | knowledge/pattern-search |
| "save this pattern" | knowledge/pattern-learn |
| "what could break" | quality/blast-radius or quality/chaos |
| "find edge cases" | quality/fuzz-mind |
| "show me what changed" | docs/codemap-diff |
| "explain how this works for a non-eng" | reasoning/narrator |
| "ideas for next features" | ux/ideate |
| "new project ideas" | ux/surprise-me |
| "spec this out" | spec/improve-spec or spec/spec-from-stories |
| "what's missing" | spec/gap-analysis |
| "is this doable" | spec/feasibility |
| "memory capture this" | knowledge/pattern-learn or `mem_drain` |
| "memory query" | `mem_search` (MCP tool, no skill needed) |
| "Salesforce X" | salesforce/* |

## Method

1. **Listen.** What did the user actually say?
2. **Match.** Use the table above as a starting point.
3. **Ambiguous?** Ask: "Sounds like you want X — should I use the `<skill>` skill, or is it more like Y?"
4. **Hand off.** Don't solve in this skill — invoke the matched skill.

## Rules

- **Don't solve in meta.** Always hand off to the specific skill.
- **One skill at a time.** Don't try to apply 3.
- **When ambiguous, ask once.** Then commit.
- **Memory the matches.** Future similar phrasings auto-route.

## Anti-patterns

- Doing the work in the meta skill
- Inventing a skill that doesn't exist
- Hedging ("could be A or B")

## Value over native CC

CC chooses paths organically. This skill is the **explicit decision tree** — useful when the user wants the "official" SiftCoder skill for their phrasing. Speeds discovery.
