---
name: debug
description: Use for generic debugging — error analysis, stack trace parsing, issue reproduction, git bisect, code tracing. Different from /sf-debug (Salesforce-specific). Pairs with /investigate skill (read-only diagnosis).
---

# debug

Generic debugging discipline. Picks the right diagnostic tool for the failure shape.

## Sub-modes

- **error <message>** — parse error, find probable file:line, surface known fix patterns
- **trace <stack>** — parse a stack trace, map to source, identify the actual fault frame
- **repro <issue>** — design a deterministic reproduction case
- **bisect <good> <bad>** — git bisect to find the introducing commit
- **trace-call <symbol>** — instrument execution path through the symbol; remove after
- **log <pattern>** — grep / parse logs to find correlated events

## Method (per mode)

### error
1. Quote the error verbatim
2. Identify error class (compiler / runtime / framework / network / domain)
3. Find probable origin — file:line from the message, or grep
4. Memory pass — has this error been hit before
5. Surface: probable cause + 1-3 likely fixes ranked by evidence

### trace (stack trace)
1. Parse top-down, find first non-library frame
2. Map source-mapped lines to actual code
3. Identify the **fault frame** vs the **report frame** (where it manifested vs where it caused)
4. Surface: file:line, function, likely cause

### repro
1. Identify the inputs and state preconditions
2. Reduce to minimal failing case
3. Output: a single command + state setup that fails reliably
4. Save the repro as a test if appropriate

### bisect
1. `git bisect start; git bisect bad <ref>; git bisect good <ref>`
2. Per step: build + run repro test
3. Output: the introducing commit + 1-paragraph cause analysis

### trace-call
1. Add minimal logging at entry/exit + key branches
2. Run the failing case
3. Compare expected vs actual sequence
4. **Remove** all instrumentation before declaring done

### log
1. Identify correlation key (request id, user id, timestamp)
2. Grep / awk to extract events for the key
3. Build timeline; find anomaly

## Output shape

```
Mode:           <error | trace | repro | bisect | trace-call | log>
Symptom:        <quoted>

Diagnosis:
  Cause:        <likely cause, evidence-cited>
  Fault frame:  <file:line>
  Confidence:   <high | med | low>

Fix candidates (ranked):
  1. <fix> — <evidence>
  2. <fix>
  3. <fix>

Reproduction:   <command or steps to reliably trigger>

Captured:       <memory id>
```

## Rules

- **Don't apply fixes here.** debug surfaces; `/fix` applies.
- **Quote errors verbatim.** Don't paraphrase.
- **Distinguish fault frame from report frame.** Stack traces lie about origin.
- **Remove instrumentation.** trace-call adds logs; debug must remove them by end.
- **Memory pass mandatory.** Repeat errors should be one-step fixes via prior memory.

## Anti-patterns

- Pattern-matching to a generic error class without verifying file:line
- Jumping to fix before reproducing
- Leaving `console.log` in code after trace-call
- Ignoring memory of similar past errors

## When NOT to use

- Salesforce-specific debug → `/siftcoder:sf-debug`
- Performance issue → `/siftcoder:optimize`
- Architecture question → `/siftcoder:investigate`
- Fix is obvious → `/siftcoder:fix` directly

## Subagent dispatch

- `investigator` agent for hypothesis-tracking diagnosis
- `Explore` for codebase mapping when fault location unclear
- `Bash` for bisect and log analysis
- Memory MCP for prior-error lookup

## Value over native CC

CC will debug on request. CC won't naturally distinguish fault vs report frame, enforce instrumentation cleanup, or produce ranked fix candidates with evidence. The structure IS the value.
