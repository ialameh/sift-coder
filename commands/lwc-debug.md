---
description: LWC-specific debugging — wires, lifecycle, reactivity, perf. Dispatches the lwc-debugger agent. See agents/lwc-debugger.md
argument-hint: <component-name>
allowed-tools: Read, Edit, Bash, Grep, Glob
---

# /siftcoder:lwc-debug

Diagnose LWC issues. Walks the lifecycle (constructor → connectedCallback → wires → renderedCallback), forms hypotheses, finds evidence, proposes minimal fix.

`$ARGUMENTS` is the component name (or path).

See `agents/lwc-debugger.md` and `skills/salesforce/salesforce-lwc/SKILL.md`.
