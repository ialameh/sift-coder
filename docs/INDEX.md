# SiftCoder Documentation Index

Master table of contents for the `docs/` tree.

## Start here (in order)

| Doc | Length | When to read |
|---|---|---|
| [README.md](../README.md) | 250 lines | First — what SiftCoder is, install, what ships |
| [docs/USAGE.md](USAGE.md) | day-to-day | After install — daily patterns |
| [docs/CONFIG.md](CONFIG.md) | reference | When tuning settings.json or env vars |
| [docs/TROUBLESHOOTING.md](TROUBLESHOOTING.md) | reference | When something breaks |

## By role

### New user
1. [README.md](../README.md)
2. [docs/USAGE.md](USAGE.md)
3. [docs/EXAMPLES.md](EXAMPLES.md) — real session traces
4. [docs/USE-CASES.md](USE-CASES.md) — when to use what

### Salesforce developer
1. [docs/SALESFORCE.md](SALESFORCE.md) — domain reference
2. [skills/salesforce/](../skills/salesforce/) — 12 platform skills
3. [agents/salesforce-architect.md](../agents/salesforce-architect.md), [apex-bulkifier.md](../agents/apex-bulkifier.md), [lwc-debugger.md](../agents/lwc-debugger.md)

### Migrating from V1
1. [docs/MIGRATION.md](MIGRATION.md) — V1 → V3 command/agent/hook delta
2. [docs/REPLACEMENT-CONTRACT.md](REPLACEMENT-CONTRACT.md) — V2-replaces-V1 stance
3. `siftcoder backfill --from-v2` — data migration tool

### Plugin contributor
1. [CONTRIBUTING.md](../CONTRIBUTING.md)
2. [ARCHITECTURE.md](../ARCHITECTURE.md) — design contract
3. [docs/MEMORY.md](MEMORY.md) — memory engine deep dive
4. [docs/API.md](API.md) — MCP tools reference

### Auditor / reviewer
1. [docs/V1-V3-DEEP-COMPARISON.md](V1-V3-DEEP-COMPARISON.md) — V1 vs V3 verdict (12 axes scored)
2. [docs/COMPARISON-METHOD.md](COMPARISON-METHOD.md) — methodology + master prompt
3. [docs/QUALITY-GATE.md](QUALITY-GATE.md) — V3 self-review
4. [docs/FINAL-REPORT.md](FINAL-REPORT.md) — V3 rebuild closing report
5. [docs/V1-V2-AUDIT.md](V1-V2-AUDIT.md) — forensic V1 audit
6. [SECURITY.md](../SECURITY.md) — threat model + disclosure

## By capability

### Memory
- [docs/MEMORY.md](MEMORY.md) — engine architecture (RRF, decay, provenance)
- [docs/API.md](API.md) — MCP tools (`mem_search`, `mem_get`, `mem_timeline`, `mem_why`, `mem_drain`)
- [skills/knowledge/memory-usage/SKILL.md](../skills/knowledge/memory-usage/SKILL.md) — how to use mem tools

### Local LLM
- [skills/meta/local-llm-setup/SKILL.md](../skills/meta/local-llm-setup/SKILL.md) — Ollama setup + models
- [docs/PERFORMANCE.md](PERFORMANCE.md) — token cost model + latency expectations

### Safety
- [SECURITY.md](../SECURITY.md) — threat model + disclosure
- [skills/workflow/scope/SKILL.md](../skills/workflow/scope/SKILL.md) — boundary enforcement
- [skills/workflow/chroot/SKILL.md](../skills/workflow/chroot/SKILL.md) — file jail

### Quality
- [skills/meta/quality-check/SKILL.md](../skills/meta/quality-check/SKILL.md) — on-demand quality gates
- [skills/review/review/SKILL.md](../skills/review/review/SKILL.md), [review/security/SKILL.md](../skills/review/security/SKILL.md)
- [agents/qa-reviewer.md](../agents/qa-reviewer.md), [qa-fixer.md](../agents/qa-fixer.md), [tester.md](../agents/tester.md)

### Workflow
- [skills/workflow/agent/SKILL.md](../skills/workflow/agent/SKILL.md) — full plan→code→review→fix pipeline
- [skills/workflow/autonomous/SKILL.md](../skills/workflow/autonomous/SKILL.md) — long unattended runs
- [skills/workflow/swarm/SKILL.md](../skills/workflow/swarm/SKILL.md) — parallel subagent dispatch
- [agents/orchestrator.md](../agents/orchestrator.md) — multi-agent coordinator

## All docs

- [README.md](../README.md) — overview
- [ARCHITECTURE.md](../ARCHITECTURE.md) — design contract
- [CONTRIBUTING.md](../CONTRIBUTING.md) — contributor guide
- [CHANGELOG.md](../CHANGELOG.md) — version history
- [LICENSE](../LICENSE) — MIT
- [SECURITY.md](../SECURITY.md) — threat model + disclosure
- [CODE_OF_CONDUCT.md](../CODE_OF_CONDUCT.md)
- [docs/USAGE.md](USAGE.md) — daily patterns
- [docs/CONFIG.md](CONFIG.md) — settings reference
- [docs/MEMORY.md](MEMORY.md) — memory engine deep dive
- [docs/API.md](API.md) — MCP tools reference
- [docs/PERFORMANCE.md](PERFORMANCE.md) — token cost + latency
- [docs/SALESFORCE.md](SALESFORCE.md) — Salesforce reference
- [docs/TROUBLESHOOTING.md](TROUBLESHOOTING.md) — common issues
- [docs/MIGRATION.md](MIGRATION.md) — V1 → V3 upgrade
- [docs/EXAMPLES.md](EXAMPLES.md) — real session traces
- [docs/USE-CASES.md](USE-CASES.md) — when to use what
- [docs/COMPARISON-METHOD.md](COMPARISON-METHOD.md) — V1 vs V3 audit method
- [docs/V1-V3-DEEP-COMPARISON.md](V1-V3-DEEP-COMPARISON.md) — V1 vs V3 verdict
- [docs/V1-V2-AUDIT.md](V1-V2-AUDIT.md) — forensic V1 audit
- [docs/REPLACEMENT-CONTRACT.md](REPLACEMENT-CONTRACT.md) — V2 replaces V1
- [docs/QUALITY-GATE.md](QUALITY-GATE.md) — V3 self-review
- [docs/FINAL-REPORT.md](FINAL-REPORT.md) — V3 rebuild closing report
- [docs/INDEX.md](INDEX.md) — this file
