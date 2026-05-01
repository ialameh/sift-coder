---
name: wizard
description: Use for guided multi-step interactive flows — first-time setup, complex configuration, exploratory workflows. AI presents steps; user advances by answering. Different from /pair (per-edit approval) — wizard is per-decision.
---

# wizard

Multi-step interactive flow. AI guides; user answers. Each step gates the next.

## When this differs from /pair

- `/pair` — approve-each-edit during code work
- `/wizard` — answer-per-decision during configuration / exploration / setup

## Method

1. **Define the flow.** Wizard begins by stating the goal + total step count.
2. **Per step:**
   - Pose **one** decision in plain language
   - Surface 2-4 named options (default highlighted)
   - Show consequences of each option
   - Wait for user pick
3. **Branch on answer.** Subsequent steps depend on prior answers — wizards have decision trees, not linear scripts.
4. **Summary before final apply.** All decisions reviewed; user confirms.
5. **Apply** the cumulative configuration / produce the output.

## Output shape per step

```
Wizard: <flow name>
Step 2 of 5

Decision: Where should the memory daemon store data?

  1. Default (~/.siftcoder/) — recommended for most users
  2. Custom path (you'll be asked next)
  3. In-project (.siftcoder/) — useful for ephemeral sandboxes

Pick (1-3):
```

## Built-in wizards

- **memory-setup** — first-time daemon setup w/ Ollama probe + Anthropic key + scope
- **salesforce-onboard** — sfdx project setup w/ deploy targets + test policy
- **release-prep** — version bump + changelog + tag + checklist before public push
- **migration** — backfill walkthrough w/ verification

## Rules

- **One decision per step.** Stacking dilutes attention.
- **Defaults named.** "Recommended" or equivalent on the safe option.
- **Consequences explicit.** "Picking X means Y won't work" beats hidden trade-offs.
- **Final summary mandatory.** Don't apply silently after step N.
- **Cancel anywhere.** User can `^C` or "stop" without losing prior decisions (saved to memory for resume).

## Anti-patterns

- Leading questions that nudge toward one answer
- Decisions hidden inside option text
- Skipping summary because "it's obvious"
- Auto-advancing past a step the user didn't answer

## When NOT to use

- User already knows the answer — direct command
- Single decision — ask once, no wizard
- Time-critical — wizards take time to traverse

## Subagent dispatch

- None — wizard is direct user dialogue
- May invoke other skills for the actual apply step at the end

## Value over native CC

CC will ask follow-up questions. CC won't naturally enforce structured decision-tree wizards with consequences-named options + summary-before-apply. The structure IS the value.
