---
name: investigate
description: Use when the user wants to understand a bug, behaviour, performance issue, or codebase area without making changes yet. READ-ONLY mode. Produces an evidence ledger and a hypothesis tree.
---

# investigate

Read-only diagnosis. Hypothesis-driven. Evidence-cited. Produces a written report — does NOT touch the code.

## Method

1. **Question.** State the question in one line. Without a precise question, you'll wander.
2. **Memory pass.** Has this been investigated before? If so, surface that report and ask whether to re-run or update.
3. **Hypothesis tree.** List 3-5 hypotheses, ordered by likelihood. Each gets:
   - Statement
   - Evidence-needed-to-confirm
   - Evidence-needed-to-rule-out
4. **Evidence collection.** For each hypothesis, gather evidence in order. Stop when one is confirmed or all are ruled out.
5. **Report.** Findings + remaining unknowns + recommended next action.

## Output shape

```
Question:   <one line>
Method:     <brief — what was checked>

Hypotheses:
  H1 [confirmed|ruled-out|inconclusive] — <statement>
     Evidence: <bullets, file:line citations>
  H2 [...] — ...
  H3 [...] — ...

Conclusion: <one paragraph>
Next:       <recommended action, OR another investigation needed>
Captured:   <summary written to memory>
```

## Rules

- **Read-only. No `Edit`, no `Write`.** If you find yourself wanting to change code, stop and surface the recommendation — don't do it.
- Every hypothesis claim cites evidence (file:line, log line, command output).
- Inconclusive is a valid result. Say so.
- No "could be" or "might be" without follow-up. Either confirm or rule out, or mark as needs-more-data.

## Anti-patterns

- Investigation that drifts into a fix (separate workflows)
- Hypothesis-free wandering ("let me just look around")
- "I think" without "because <evidence>"
- One hypothesis tested → declared root cause without ruling out others

## When NOT to use

- You already know the cause and just need to fix — `/siftcoder:fix`
- You need to add a feature — `/siftcoder:add-feature`
- You want a generated story-shape explanation — `/siftcoder:narrator`

## Subagent dispatch

- `investigator` agent (read-only, hypothesis-tracking)
- `Explore` for codebase mapping
- `archaeologist` skill if the question is "why does this exist"

## Memory capture

The report itself is captured as a summary with provenance edges to the files and symbols referenced. Future "did we investigate X" queries return this.
