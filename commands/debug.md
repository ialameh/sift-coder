---
description: Generic debugging — error analysis, stack trace parsing, repro, git bisect, code tracing. Different from /sf-debug (Salesforce-specific). See skills/coding/debug/SKILL.md
argument-hint: [error|trace|repro|bisect|trace-call|log] [args]
allowed-tools: Read, Bash, Grep, Glob, Edit
---

# /siftcoder:debug

Pick a sub-mode:

- `error <quoted>` — parse, classify, surface fix candidates
- `trace <stack>` — map stack frames to source, find fault frame
- `repro <issue>` — design deterministic reproduction
- `bisect <good> <bad>` — find introducing commit
- `trace-call <symbol>` — instrument execution path (auto-cleaned)
- `log <pattern>` — extract correlated events from log dump

See `skills/coding/debug/SKILL.md` for full workflow contract.
