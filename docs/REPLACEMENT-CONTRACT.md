# V2 Replacement Contract

V2 does not preserve V1 command compatibility. It must preserve V1 value.

## Value That Must Exist

| V1 value | V2 replacement surface |
|---|---|
| Build/fix/add/refactor/test workflows | `skills/coding/*`, thin commands, disciplined `planner`/`coder`/`tester` agents |
| Investigation/debugging | `skills/coding/investigate`, `skills/coding/fix`, `investigator` agent, memory search |
| Review/security/quality | `skills/review/*`, `skills/quality/*`, `/siftcoder:quality` |
| Autonomous work | `skills/workflow/autonomous`, `swarm`, `checkpoint`, `handoff`, `scope`, `smart-retry` |
| Salesforce development | `skills/salesforce/*`, Salesforce agents and commands |
| Memory/pattern learning | `siftcoder-memory` MCP, `/siftcoder:mem`, knowledge skills |
| Documentation/codemaps/specs | `skills/docs/*`, `skills/spec/*` |
| Ideation/project ideas | advanced `ideate` and `surprise-me` skills |
| Compression | advanced `compression` skill plus optional companion plugin |

## Removal Rule

Delete a feature only when one of these is true:

- Native Claude Code already does it and SiftCoder adds no stricter contract.
- It is a thin alias with no user value and no discoverability value.
- It cannot be tested, explained, or tied to a real workflow.
- It creates runtime cost or risk larger than its benefit.

Keep a feature when it adds at least one:

- persistent memory grounding,
- domain expertise,
- evidence-led output,
- scope/cost/time safety,
- repeatable workflow structure,
- better ideation/compression/decision quality.

## Current Product Shape

V2 is a broad workflow plugin, not a tiny memory-only plugin. The architecture should say that plainly:

- 84 skills are acceptable if each carries a real workflow contract.
- 87 commands are acceptable if they stay thin and point to maintained skills.
- 12 agents are acceptable if each has a stricter contract than native general-purpose dispatch.

The bar is value density, not minimum file count.
