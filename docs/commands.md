# Commands

All 107 slash commands grouped by what they do. Each command is a thin wrapper over a skill or agent — see [skills.md](skills.md) for the underlying workflow contracts.

## Memory

| Command | Action |
|---|---|
| `/siftcoder:mem` | Memory entry point. Subcommands: `setup`, `start`, `status`, `drain`, `web`, `backfill`, `check` |

## Coding workflows

| Command | When to run |
|---|---|
| `/siftcoder:build` | Build a new feature from a spec |
| `/siftcoder:add-feature` | Add a feature to existing code |
| `/siftcoder:fix` | Bounded fix for an issue |
| `/siftcoder:investigate` | Read-only diagnosis |
| `/siftcoder:heal` | Self-healing loop on build/test failures |
| `/siftcoder:tdd` | Write tests first, then code |
| `/siftcoder:pair` | Step-by-step pair-programming mode |
| `/siftcoder:refactor` | Behaviour-preserving structural cleanup |
| `/siftcoder:optimize` | Performance pass |
| `/siftcoder:zen` | Aggressive simplification |
| `/siftcoder:debug` | Generic debugging (error/trace/repro/bisect/log) |
| `/siftcoder:build-fix` | Minimal-diff build-error resolution |
| `/siftcoder:perf` | Multi-iteration profiling, top-N hotspot Pareto |
| `/siftcoder:test` | Multi-modal test gen (unit/integration/e2e/property/mutation) |

## Quality + review

| Command | When to run |
|---|---|
| `/siftcoder:review` | Memory-aware code review |
| `/siftcoder:security` | Security review |
| `/siftcoder:quality` | On-demand format + lint + type-check + tests |
| `/siftcoder:comply` | Compliance-mapped review |
| `/siftcoder:chaos` | AI-designed failure scenarios |
| `/siftcoder:fuzz-mind` | Adversarial test-case generation |
| `/siftcoder:invariant` | Discover implicit invariants |
| `/siftcoder:empathy` | Detect frustrating UX/code patterns |
| `/siftcoder:ripple` | Change-impact visualization |
| `/siftcoder:timewarp` | State-reconstruction debugging |
| `/siftcoder:blast-radius` | Predict impact of a change |
| `/siftcoder:polyglot` | Cross-language consistency check |

## Reasoning + ideation

| Command | When to run |
|---|---|
| `/siftcoder:archaeologist` | Deep code-history intelligence |
| `/siftcoder:oracle` | Predict the next thing you'll do |
| `/siftcoder:ghost` | Explore "what-if" alternative implementations |
| `/siftcoder:duck` | Rubber-duck debugging — Socratic questioning |
| `/siftcoder:dream` | Generative exploration without constraints |
| `/siftcoder:fortune` | Tech-debt risk forecasting |
| `/siftcoder:narrator` | Narrate code as a story |
| `/siftcoder:ideate` | Memory-grounded brainstorming |
| `/siftcoder:surprise-me` | Novel project ideas |
| `/siftcoder:reverse-prompt` | Generate the prompt that would rebuild this project (Quick / Deep / Focus modes) |
| `/siftcoder:reverse-spec` | Reverse-engineer a spec from existing code |

## Workflow + state

| Command | Action |
|---|---|
| `/siftcoder:autonomous` | Long unattended run |
| `/siftcoder:swarm` | Parallel subagent dispatch |
| `/siftcoder:agent` | Full plan → code → review → fix pipeline |
| `/siftcoder:pause` | Pause the active workflow |
| `/siftcoder:continue` | Resume a paused workflow |
| `/siftcoder:handoff` | Persist context for next session |
| `/siftcoder:checkpoint` | Save/restore named checkpoint |
| `/siftcoder:session-eval` | Evaluate this session's patterns |
| `/siftcoder:smart-retry` | Try different approach after failure |
| `/siftcoder:preview` | Show diff before applying changes |
| `/siftcoder:scope` | Manage file boundaries |
| `/siftcoder:chroot` | Glob-pattern file jail |
| `/siftcoder:focus` | Narrow attention to a feature/file set |
| `/siftcoder:organize-project` | Project structure assessment + reorg |

## Spec + planning

| Command | Action |
|---|---|
| `/siftcoder:improve-spec` | Make a spec more testable |
| `/siftcoder:spec-from-stories` | Generate spec from user stories |
| `/siftcoder:gap-analysis` | Find gaps between spec and implementation |
| `/siftcoder:reverse-spec` | Spec from existing code |
| `/siftcoder:feasibility` | Feasibility assessment |

## Knowledge

| Command | Action |
|---|---|
| `/siftcoder:knowledge` | Browse the local knowledge base |
| `/siftcoder:search` | Federated search (code + memory + docs) |
| `/siftcoder:pattern-learn` | Extract reusable patterns from recent work |
| `/siftcoder:pattern-search` | Search patterns by intent |
| `/siftcoder:pattern-list` | List all known patterns |

## Documentation

| Command | Action |
|---|---|
| `/siftcoder:document` | Generate doc by type (code, user-manual, architecture, technical) |
| `/siftcoder:update-docs` | Sync existing docs with code |
| `/siftcoder:codemap` | Evidence-based codebase documentation |
| `/siftcoder:codemap-fast` | Quick structural scan |
| `/siftcoder:codemap-diff` | Behavioural diff between branches |
| `/siftcoder:codemap-trust` | Code confidence + risk assessment |
| `/siftcoder:codemap-export` | Machine-readable codemap export |
| `/siftcoder:update-codemaps` | Refresh architecture diagrams |

## Salesforce

| Command | Action |
|---|---|
| `/siftcoder:apex-patterns` | Generate enterprise Apex patterns (FFLib, Selector, Domain, Service, UoW) |
| `/siftcoder:lwc` | Lightning Web Component scaffolding + analysis |
| `/siftcoder:lwc-debug` | LWC wire/lifecycle/state diagnosis |
| `/siftcoder:schema` | Object/field/relationship management + ERD |
| `/siftcoder:schema-migrate` | Schema migration with risk classification |
| `/siftcoder:sf-architect` | Org-level architecture review |
| `/siftcoder:sf-deploy` | Validate / deploy / diff / rollback |
| `/siftcoder:sf-test` | Comprehensive test gen + coverage |
| `/siftcoder:sf-flow` | Flow design + workflow conversion |
| `/siftcoder:sf-cpq` | CPQ configuration assistance |
| `/siftcoder:sf-agentforce` | Agentforce setup |
| `/siftcoder:sf-einstein` | Einstein integration |
| `/siftcoder:sf-comply` | Compliance review |
| `/siftcoder:sf-security` | Security audit |
| `/siftcoder:sf-debug` | Debug-log analysis |
| `/siftcoder:sf-package` | Unlocked package management |
| `/siftcoder:sf-connect` | Named/External Credentials, OAuth |
| `/siftcoder:sf-webhook` | Inbound webhook scaffold w/ HMAC |

## Integrations

| Command | Action |
|---|---|
| `/siftcoder:api` | OpenAPI generation/validation/mocking |
| `/siftcoder:integrate` | Integrate two services |
| `/siftcoder:migrate` | Data/code migration |
| `/siftcoder:bridge` | Cross-codebase integration analysis |

## Meta

| Command | Action |
|---|---|
| `/siftcoder:siftcoder` | Main orchestrator |
| `/siftcoder:onboard` | Onboarding walkthrough |
| `/siftcoder:prompt` | Interactive prompt-crafting helper |
| `/siftcoder:wizard` | Multi-step interactive flow |
| `/siftcoder:status` | Show current siftcoder progress |
| `/siftcoder:help` | Help index |
| `/siftcoder:config` | Configure siftcoder settings |
| `/siftcoder:examples` | Browse session traces |
| `/siftcoder:use-cases` | When to use what |
| `/siftcoder:trace` | View execution trace |
| `/siftcoder:analyze` | Non-code text/data analysis |
| `/siftcoder:compress` | Activate output compression |
| `/siftcoder:budget` | Token/cost budget tracking |
| `/siftcoder:monitor` | Health monitoring config |
| `/siftcoder:team` | Team knowledge sharing |
| `/siftcoder:sync` | Sync knowledge to cloud |

## See also

- [skills.md](skills.md) — workflow contracts behind each command
- [agents.md](agents.md) — agents dispatched by orchestrating commands
- [usage.md](USAGE.md) — typical day-to-day command patterns
