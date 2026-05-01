# Skills catalogue

Skills are Claude Code's reusable workflow units. SiftCoder ships sixty-plus, organised by family. Each one is a directory under `skills/<family>/<name>/` containing a `SKILL.md` (frontmatter + body) and optional supporting files.

The frontmatter `description` is the trigger — it's what the harness scans for to decide whether to load the skill. The body is the actual workflow contract.

You don't have to invoke skills directly; most are wrapped in a `/siftcoder:*` command. But knowing they exist is half the value — most people use ten and never discover the other fifty.

## How to read this catalogue

Each entry has:

- **Name** — the skill's `name:` from frontmatter, also the matching slash command.
- **Source** — absolute path to the SKILL.md.
- **Purpose** — one sentence drawn from the description.
- **Use it when** — the moment to reach for it.

## Coding (`skills/coding/`)

Workflows that touch source code.

### add-feature
- **Source**: `/Users/sam/Documents/Plugins/SiftCoder/skills/coding/add-feature/SKILL.md`
- **Purpose**: Add a new capability to an existing project, behind a flag where appropriate, with rollback.
- **Use it when**: you're extending an existing module — smaller than `build`, bigger than `fix`.

### build
- **Source**: `/Users/sam/Documents/Plugins/SiftCoder/skills/coding/build/SKILL.md`
- **Purpose**: Spec-first feature build — alignment on success before code.
- **Use it when**: user hands you a spec and expects working code.

### build-fix
- **Source**: `/Users/sam/Documents/Plugins/SiftCoder/skills/coding/build-fix/SKILL.md`
- **Purpose**: Auto-resolve build errors with a minimal-diff fix.
- **Use it when**: compiler/linker/bundler is failing and you want one targeted patch (not a multi-strategy retry like `/heal`).

### debug
- **Source**: `/Users/sam/Documents/Plugins/SiftCoder/skills/coding/debug/SKILL.md`
- **Purpose**: Generic debugging — error analysis, repro, bisect, trace.
- **Use it when**: a bug is loud (stack trace, wrong output) but the cause isn't obvious yet.

### fix
- **Source**: `/Users/sam/Documents/Plugins/SiftCoder/skills/coding/fix/SKILL.md`
- **Purpose**: Bounded-scope bug fix with regression test. Refuses to expand into refactor.
- **Use it when**: the bug is understood and the patch is small.

### heal
- **Source**: `/Users/sam/Documents/Plugins/SiftCoder/skills/coding/heal/SKILL.md`
- **Purpose**: Self-healing build/test/lint loop — retries with **different** strategies each time.
- **Use it when**: red CI and you want automatic recovery, bounded by a retry count.

### investigate
- **Source**: `/Users/sam/Documents/Plugins/SiftCoder/skills/coding/investigate/SKILL.md`
- **Purpose**: Read-only diagnosis — evidence ledger and hypothesis tree.
- **Use it when**: you want to understand before changing. Almost always before `/fix` if root cause is unclear.

### optimize
- **Source**: `/Users/sam/Documents/Plugins/SiftCoder/skills/coding/optimize/SKILL.md`
- **Purpose**: Performance work — measure-first, profile-driven.
- **Use it when**: you have a target metric and a measured baseline. Refuses to optimise without one.

### pair
- **Source**: `/Users/sam/Documents/Plugins/SiftCoder/skills/coding/pair/SKILL.md`
- **Purpose**: One change at a time, user accepts/edits/rejects each before next.
- **Use it when**: high-trust slow mode — sensitive code, learning, deliberate review.

### perf
- **Source**: `/Users/sam/Documents/Plugins/SiftCoder/skills/coding/perf/SKILL.md`
- **Purpose**: Dedicated profiling — wall, CPU, memory, alloc, query count, network.
- **Use it when**: you want measurement and reporting, not a fix. Pair with `/optimize` after.

### refactor
- **Source**: `/Users/sam/Documents/Plugins/SiftCoder/skills/coding/refactor/SKILL.md`
- **Purpose**: Same behaviour, better structure. Test-coverage gated. Extract-then-rename ordering.
- **Use it when**: structural cleanup. Refuses to mix in bug fixes or feature work.

### tdd
- **Source**: `/Users/sam/Documents/Plugins/SiftCoder/skills/coding/tdd/SKILL.md`
- **Purpose**: Strict red-green-refactor.
- **Use it when**: you want the discipline enforced — production code only after a failing test exists.

### test
- **Source**: `/Users/sam/Documents/Plugins/SiftCoder/skills/coding/test/SKILL.md`
- **Purpose**: Multi-modal test generation — unit, integration, e2e, property, mutation.
- **Use it when**: you want tests now, not the discipline. `/tdd` is the discipline; `/test` is the production tool.

### zen
- **Source**: `/Users/sam/Documents/Plugins/SiftCoder/skills/coding/zen/SKILL.md`
- **Purpose**: Aggressive simplification — delete-as-default.
- **Use it when**: the codebase has accreted scaffolding, abstractions earning nothing, dead branches.

## Knowledge (`skills/knowledge/`)

Memory-store and pattern operations.

### memory-usage
- **Source**: `/Users/sam/Documents/Plugins/SiftCoder/skills/knowledge/memory-usage/SKILL.md`
- **Purpose**: Surface SiftCoder's MCP tools (`mem_search`, `mem_get`, `mem_timeline`, `mem_why`, `mem_drain`) and how to query them.
- **Use it when**: "what did we decide about X", "why is X this way", "find prior discussion of Y".

### knowledge
- **Source**: `/Users/sam/Documents/Plugins/SiftCoder/skills/knowledge/knowledge/SKILL.md`
- **Purpose**: Whole-store curation — what's known, what's drifting stale, what's new since last review.
- **Use it when**: periodic hygiene of the memory store, not a single query.

### pattern-learn
- **Source**: `/Users/sam/Documents/Plugins/SiftCoder/skills/knowledge/pattern-learn/SKILL.md`
- **Purpose**: Extract a reusable pattern from recent work and store it.
- **Use it when**: "save this approach", "remember this", "learn from this commit".

### pattern-search
- **Source**: `/Users/sam/Documents/Plugins/SiftCoder/skills/knowledge/pattern-search/SKILL.md`
- **Purpose**: Find captured patterns relevant to current work.
- **Use it when**: starting work and you suspect there's a prior pattern. Searches `kind:pattern`.

### search
- **Source**: `/Users/sam/Documents/Plugins/SiftCoder/skills/knowledge/search/SKILL.md`
- **Purpose**: Federated search across code + memory + docs simultaneously.
- **Use it when**: you don't know which surface holds the answer. One query, three sources, deduplicated ranking.

## Salesforce (`skills/salesforce/`)

Industry-specific. Most pair with a `/siftcoder:sf-*` command and an agent.

### salesforce-apex
- **Source**: `/Users/sam/Documents/Plugins/SiftCoder/skills/salesforce/salesforce-apex/SKILL.md`
- **Purpose**: Apex code — classes, triggers, batch, queueable, REST/SOAP. FFLib patterns, bulkification, governor limits, security.
- **Use it when**: any Apex work where bulk safety, sharing, or test data factories matter.

### salesforce-lwc
- **Source**: `/Users/sam/Documents/Plugins/SiftCoder/skills/salesforce/salesforce-lwc/SKILL.md`
- **Purpose**: Lightning Web Components — wires, events, lifecycle, performance, testing.
- **Use it when**: anything LWC. Backed by `/siftcoder:lwc` and the `lwc-debugger` agent.

### salesforce-flow
- **Source**: `/Users/sam/Documents/Plugins/SiftCoder/skills/salesforce/salesforce-flow/SKILL.md`
- **Purpose**: Flow Builder — record-triggered, screen, scheduled, platform-event, autolaunched. Bulk safety, error handling, performance.
- **Use it when**: building or auditing a Flow.

### salesforce-deploy
- **Source**: `/Users/sam/Documents/Plugins/SiftCoder/skills/salesforce/salesforce-deploy/SKILL.md`
- **Purpose**: Metadata deploy — `package.xml`, validate, deploy, diff, rollback, scratch orgs, sandboxes, prod.
- **Use it when**: any sfdx deploy. Backed by `/siftcoder:sf-deploy`.

### salesforce-test
- **Source**: `/Users/sam/Documents/Plugins/SiftCoder/skills/salesforce/salesforce-test/SKILL.md`
- **Purpose**: Apex test generation, test data factories, sandbox sanitisation.
- **Use it when**: writing or improving Apex test coverage. Backed by `/siftcoder:sf-test`.

### salesforce-security
- **Source**: `/Users/sam/Documents/Plugins/SiftCoder/skills/salesforce/salesforce-security/SKILL.md`
- **Purpose**: SF-specific security — sharing model, CRUD/FLS, callout security, secrets, Shield, OWASP-on-SF.
- **Use it when**: security review of a SF org. Beats built-in `/security-review` for SF specifics.

### salesforce-architecture
- **Source**: `/Users/sam/Documents/Plugins/SiftCoder/skills/salesforce/salesforce-architecture/SKILL.md`
- **Purpose**: Org-level architecture — capacity, sharing, integrations, multi-org strategy, tech debt.
- **Use it when**: scoping a SF programme or doing a periodic architecture review.

### salesforce-cpq
- **Source**: `/Users/sam/Documents/Plugins/SiftCoder/skills/salesforce/salesforce-cpq/SKILL.md`
- **Purpose**: CPQ — products, price/product rules, quote templates, advanced approvals, contracts/amendments/renewals.
- **Use it when**: working with CPQ or evaluating Revenue Cloud migration.

### salesforce-agentforce
- **Source**: `/Users/sam/Documents/Plugins/SiftCoder/skills/salesforce/salesforce-agentforce/SKILL.md`
- **Purpose**: Agentforce — Topics, Actions, prompt templates, Atlas reasoning, Trust Layer, agent testing.
- **Use it when**: building or testing an Agentforce agent.

### salesforce-einstein
- **Source**: `/Users/sam/Documents/Plugins/SiftCoder/skills/salesforce/salesforce-einstein/SKILL.md`
- **Purpose**: Einstein — Discovery, Predictions, NBA, legacy bots, prompt builder, model management.
- **Use it when**: any Einstein work. Includes guidance on the bot-to-Agentforce migration path.

### salesforce-comply
- **Source**: `/Users/sam/Documents/Plugins/SiftCoder/skills/salesforce/salesforce-comply/SKILL.md`
- **Purpose**: Industry-cloud compliance — Health (HIPAA), FSC (regulatory), Public Sector (FedRAMP/CJIS), Education.
- **Use it when**: regulated SF deployments.

### schema-migrate
- **Source**: `/Users/sam/Documents/Plugins/SiftCoder/skills/salesforce/schema-migrate/SKILL.md`
- **Purpose**: SF schema migration — object/field/relationship metadata changes with deploy plan + rollback.
- **Use it when**: schema changes (NOT data — that's `/migrate`).

## Documentation (`skills/docs/`)

Generation, drift detection, refresh.

### codemap
- **Source**: `/Users/sam/Documents/Plugins/SiftCoder/skills/docs/codemap/SKILL.md`
- **Purpose**: Evidence-based codebase documentation — components, responsibilities, interconnections.
- **Use it when**: you need a real map, not a guess.

### codemap-fast
- **Source**: `/Users/sam/Documents/Plugins/SiftCoder/skills/docs/codemap-fast/SKILL.md`
- **Purpose**: ~30s structural scan of an unfamiliar repo.
- **Use it when**: first contact, want a top-level shape only.

### codemap-diff
- **Source**: `/Users/sam/Documents/Plugins/SiftCoder/skills/docs/codemap-diff/SKILL.md`
- **Purpose**: Compare two refs/branches semantically.
- **Use it when**: "what's different between branches" — architectural, not lines.

### codemap-trust
- **Source**: `/Users/sam/Documents/Plugins/SiftCoder/skills/docs/codemap-trust/SKILL.md`
- **Purpose**: Confidence/risk per module.
- **Use it when**: "where's the risk concentrated", "which parts can I trust".

### codemap-export
- **Source**: `/Users/sam/Documents/Plugins/SiftCoder/skills/docs/codemap-export/SKILL.md`
- **Purpose**: Export the codemap as machine-readable JSON.
- **Use it when**: feeding the map into downstream tooling.

### document
- **Source**: `/Users/sam/Documents/Plugins/SiftCoder/skills/docs/document/SKILL.md`
- **Purpose**: Generate documentation in a named shape — code ref, user manual, architecture, technical deep-dive.
- **Use it when**: you know which shape you want and you want it filled with grounded evidence.

### update-docs
- **Source**: `/Users/sam/Documents/Plugins/SiftCoder/skills/docs/update-docs/SKILL.md`
- **Purpose**: Doc-vs-code drift detection + applied updates.
- **Use it when**: "docs are out of date".

### update-codemaps
- **Source**: `/Users/sam/Documents/Plugins/SiftCoder/skills/docs/update-codemaps/SKILL.md`
- **Purpose**: Regenerate architecture/component diagrams after structural changes.
- **Use it when**: post-refactor, the diagrams lie.

## Quality (`skills/quality/`)

Pre-merge confidence.

### blast-radius
- **Source**: `/Users/sam/Documents/Plugins/SiftCoder/skills/quality/blast-radius/SKILL.md`
- **Purpose**: "What could go wrong if this change is buggy" — distinct from `ripple` ("what else needs to change").
- **Use it when**: pre-merge gut check.

### ripple
- **Source**: `/Users/sam/Documents/Plugins/SiftCoder/skills/quality/ripple/SKILL.md`
- **Purpose**: "If I change X, what else changes" — call graph + tests + docs + memory.
- **Use it when**: about to change a public function/signature/schema/API.

### chaos
- **Source**: `/Users/sam/Documents/Plugins/SiftCoder/skills/quality/chaos/SKILL.md`
- **Purpose**: Failure-scenario design — DB outage, slow downstream, partial deploy, region failover.
- **Use it when**: resilience review or pre-prod hardening.

### comply
- **Source**: `/Users/sam/Documents/Plugins/SiftCoder/skills/quality/comply/SKILL.md`
- **Purpose**: SOC2/HIPAA/GDPR/PCI-style review — controls mapped to code, gaps surfaced.
- **Use it when**: audit prep or org-specific control review.

### empathy
- **Source**: `/Users/sam/Documents/Plugins/SiftCoder/skills/quality/empathy/SKILL.md`
- **Purpose**: Cognitive-load measurement — friction map ranked by reader pain.
- **Use it when**: "this codebase is hard to read" — outputs refactor candidates by user pain, not architectural elegance.

### fuzz-mind
- **Source**: `/Users/sam/Documents/Plugins/SiftCoder/skills/quality/fuzz-mind/SKILL.md`
- **Purpose**: Adversarial edge-case test inputs targeting actual code paths.
- **Use it when**: random fuzzing wastes cycles; AI reads the function and writes inputs that violate its assumptions.

### invariant
- **Source**: `/Users/sam/Documents/Plugins/SiftCoder/skills/quality/invariant/SKILL.md`
- **Purpose**: Discover and externalise implicit contracts.
- **Use it when**: "what does this silently assume" — outputs runtime asserts, type narrowings, doc additions.

### polyglot
- **Source**: `/Users/sam/Documents/Plugins/SiftCoder/skills/quality/polyglot/SKILL.md`
- **Purpose**: Cross-language consistency — naming, types, API shape, error contracts across TS/Python/HCL/Bash.
- **Use it when**: a multi-runtime codebase.

### timewarp
- **Source**: `/Users/sam/Documents/Plugins/SiftCoder/skills/quality/timewarp/SKILL.md`
- **Purpose**: Reconstruct past state via git worktree — read-only.
- **Use it when**: "what did this look like 3 weeks ago".

## Reasoning (`skills/reasoning/`)

Thinking-shaped workflows.

### archaeologist
- **Source**: `/Users/sam/Documents/Plugins/SiftCoder/skills/reasoning/archaeologist/SKILL.md`
- **Purpose**: "Why does this exist" — triangulates git history + memory + code.
- **Use it when**: code looks weird and you suspect a story.

### duck
- **Source**: `/Users/sam/Documents/Plugins/SiftCoder/skills/reasoning/duck/SKILL.md`
- **Purpose**: Rubber-duck — AI asks probing questions; user explains step-by-step.
- **Use it when**: stuck on a tricky problem and want the inverse of normal AI mode.

### dream
- **Source**: `/Users/sam/Documents/Plugins/SiftCoder/skills/reasoning/dream/SKILL.md`
- **Purpose**: Unconstrained generative exploration. Output is ideas, not code.
- **Use it when**: brainstorm phase, explicitly not for shipping.

### fortune
- **Source**: `/Users/sam/Documents/Plugins/SiftCoder/skills/reasoning/fortune/SKILL.md`
- **Purpose**: Tech-debt forecast — severity decay, recently-touched debt is hotter.
- **Use it when**: "what's about to bite us".

### ghost
- **Source**: `/Users/sam/Documents/Plugins/SiftCoder/skills/reasoning/ghost/SKILL.md`
- **Purpose**: "What if we did X instead" — counterfactual designs on a scratch branch.
- **Use it when**: weighing alternatives without committing.

### narrator
- **Source**: `/Users/sam/Documents/Plugins/SiftCoder/skills/reasoning/narrator/SKILL.md`
- **Purpose**: Code-to-story translation — layered detail, plain English on top, expand on request.
- **Use it when**: explaining to non-engineers or mixed audiences.

### oracle
- **Source**: `/Users/sam/Documents/Plugins/SiftCoder/skills/reasoning/oracle/SKILL.md`
- **Purpose**: Predictive intent inference — "what would I likely want next" based on memory patterns.
- **Use it when**: handoffs or session resumption.

## Review (`skills/review/`)

### review
- **Source**: `/Users/sam/Documents/Plugins/SiftCoder/skills/review/review/SKILL.md`
- **Purpose**: SiftCoder-shaped code review — memory-aware, project-convention-aware.
- **Use it when**: PR review where prior decisions matter. Built-in `/review` for general; this for project-specific.

### security
- **Source**: `/Users/sam/Documents/Plugins/SiftCoder/skills/review/security/SKILL.md`
- **Purpose**: Security review with project-specific framing — prior incidents, stack-aware patterns.
- **Use it when**: complement built-in `/security-review` with project memory.

## Spec (`skills/spec/`)

Requirements lifecycle.

### improve-spec
- **Source**: `/Users/sam/Documents/Plugins/SiftCoder/skills/spec/improve-spec/SKILL.md`
- **Purpose**: Polish a spec — testable AC, ambiguities, missing edge cases. Marks up; doesn't rewrite.
- **Use it when**: spec exists but isn't sharp enough.

### feasibility
- **Source**: `/Users/sam/Documents/Plugins/SiftCoder/skills/spec/feasibility/SKILL.md`
- **Purpose**: Go/no-go memo — effort, risk, confidence on one page.
- **Use it when**: scoping decisions, not exhaustive technical study.

### gap-analysis
- **Source**: `/Users/sam/Documents/Plugins/SiftCoder/skills/spec/gap-analysis/SKILL.md`
- **Purpose**: Inventory of what's missing — spec→implementation, target→actual.
- **Use it when**: comparing intent vs reality with severity + effort estimates.

### reverse-spec
- **Source**: `/Users/sam/Documents/Plugins/SiftCoder/skills/spec/reverse-spec/SKILL.md`
- **Purpose**: Extract a spec FROM existing code.
- **Use it when**: legacy systems, undocumented modules, post-hoc compliance evidence.

### spec-from-stories
- **Source**: `/Users/sam/Documents/Plugins/SiftCoder/skills/spec/spec-from-stories/SKILL.md`
- **Purpose**: Aggregate user stories/tickets into a spec with testable AC.
- **Use it when**: PM hands you forty Jira issues that are really one capability.

## Integrations (`skills/integrations/`)

Two-system work.

### api
- **Source**: `/Users/sam/Documents/Plugins/SiftCoder/skills/integrations/api/SKILL.md`
- **Purpose**: API design — versioning, error shape, auth, idempotency, pagination, rate limits.
- **Use it when**: designing or auditing an external interface.

### bridge
- **Source**: `/Users/sam/Documents/Plugins/SiftCoder/skills/integrations/bridge/SKILL.md`
- **Purpose**: Design the bridge between two distinct codebases or services.
- **Use it when**: two repos that need to interoperate. Pairs with `bridge-analyzer` agent.

### integrate
- **Source**: `/Users/sam/Documents/Plugins/SiftCoder/skills/integrations/integrate/SKILL.md`
- **Purpose**: Two-system integration — pattern selection (sync/async/event/batch), error handling, idempotency, observability.
- **Use it when**: pattern not yet picked.

### migrate
- **Source**: `/Users/sam/Documents/Plugins/SiftCoder/skills/integrations/migrate/SKILL.md`
- **Purpose**: Data migration — plan, execute, verify, rollback. Memory captures the run for audit.
- **Use it when**: cross-system data move (NOT schema — `/schema-migrate`).

## Workflow (`skills/workflow/`)

Loops, gates, savepoints.

### agent
- **Source**: `/Users/sam/Documents/Plugins/SiftCoder/skills/workflow/agent/SKILL.md`
- **Purpose**: Full agentic pipeline — planner → coder → qa-reviewer → qa-fixer with rollback.
- **Use it when**: multi-file refactor or feature where the loop matters.

### swarm
- **Source**: `/Users/sam/Documents/Plugins/SiftCoder/skills/workflow/swarm/SKILL.md`
- **Purpose**: Parallel subagent dispatch with isolation, conflict resolution, merge strategy.
- **Use it when**: ≥2 independent tasks.

### autonomous
- **Source**: `/Users/sam/Documents/Plugins/SiftCoder/skills/workflow/autonomous/SKILL.md`
- **Purpose**: Long-running unattended runs with checkpoint, cost cap, time cap, rollback gates.
- **Use it when**: explicit long-haul; not a substitute for native subagent dispatch on bounded tasks.

### checkpoint
- **Source**: `/Users/sam/Documents/Plugins/SiftCoder/skills/workflow/checkpoint/SKILL.md`
- **Purpose**: Save a named savepoint with intent + scope + memory pin. Restorable.
- **Use it when**: before a risky change.

### chroot
- **Source**: `/Users/sam/Documents/Plugins/SiftCoder/skills/workflow/chroot/SKILL.md`
- **Purpose**: Tighter file-access jail than `/scope` — explicit file list, not glob patterns.
- **Use it when**: "only touch these 12 files".

### scope
- **Source**: `/Users/sam/Documents/Plugins/SiftCoder/skills/workflow/scope/SKILL.md`
- **Purpose**: Define/show/modify `.siftcoder/scope.json` — the boundary-enforcer's input.
- **Use it when**: bounding where AI can write.

### focus
- **Source**: `/Users/sam/Documents/Plugins/SiftCoder/skills/workflow/focus/SKILL.md`
- **Purpose**: Narrow attention to a feature/file set — advisory, not enforced.
- **Use it when**: helping memory + retrieval prioritise an area without locking writes.

### preview
- **Source**: `/Users/sam/Documents/Plugins/SiftCoder/skills/workflow/preview/SKILL.md`
- **Purpose**: Diff-before-apply discipline.
- **Use it when**: risk areas, sensitive files.

### pause
- **Source**: `/Users/sam/Documents/Plugins/SiftCoder/skills/workflow/pause/SKILL.md`
- **Purpose**: Freeze session state with rich resumption context.
- **Use it when**: need to step away mid-task. Pair with `/continue`.

### continue
- **Source**: `/Users/sam/Documents/Plugins/SiftCoder/skills/workflow/continue/SKILL.md`
- **Purpose**: Resume from `/pause` — injects relevant memory and proposes next step.
- **Use it when**: returning to paused work.

### handoff
- **Source**: `/Users/sam/Documents/Plugins/SiftCoder/skills/workflow/handoff/SKILL.md`
- **Purpose**: End-of-session deliverable — what was done, what's next, blockers.
- **Use it when**: closing out for the day or another person.

### organize-project
- **Source**: `/Users/sam/Documents/Plugins/SiftCoder/skills/workflow/organize-project/SKILL.md`
- **Purpose**: Assess + improve project structure — folder layout, file placement, naming.
- **Use it when**: structural rot. User approves before any moves.

### session-eval
- **Source**: `/Users/sam/Documents/Plugins/SiftCoder/skills/workflow/session-eval/SKILL.md`
- **Purpose**: Post-session evaluation + pattern extraction.
- **Use it when**: "what did we learn".

### smart-retry
- **Source**: `/Users/sam/Documents/Plugins/SiftCoder/skills/workflow/smart-retry/SKILL.md`
- **Purpose**: Retry with a different strategy — memory-aware so it doesn't repeat what already failed.
- **Use it when**: previous attempt failed; want a structured next try.

## Meta (`skills/meta/`)

About SiftCoder itself.

### siftcoder
- **Source**: `/Users/sam/Documents/Plugins/SiftCoder/skills/meta/siftcoder/SKILL.md`
- **Purpose**: "Which SiftCoder skill should I use for X" — decision tree across families.
- **Use it when**: unsure which specific skill applies.

### onboard
- **Source**: `/Users/sam/Documents/Plugins/SiftCoder/skills/meta/onboard/SKILL.md`
- **Purpose**: First-time SiftCoder setup — Ollama probe, daemon start, scope, optional backfill. Single happy path.
- **Use it when**: brand-new user/project.

### local-llm-setup
- **Source**: `/Users/sam/Documents/Plugins/SiftCoder/skills/meta/local-llm-setup/SKILL.md`
- **Purpose**: Set up Ollama, choose models, wire env, verify.
- **Use it when**: reducing token cost or troubleshooting drain/embedding.

### wizard
- **Source**: `/Users/sam/Documents/Plugins/SiftCoder/skills/meta/wizard/SKILL.md`
- **Purpose**: Guided multi-step interactive flows — first-time setup, complex configuration.
- **Use it when**: per-decision approval (vs `/pair`'s per-edit approval).

### prompt
- **Source**: `/Users/sam/Documents/Plugins/SiftCoder/skills/meta/prompt/SKILL.md`
- **Purpose**: Craft a better prompt — for skills, for an LLM, or for a person.
- **Use it when**: "help me write a prompt", "rephrase this for the AI".

### compression
- **Source**: `/Users/sam/Documents/Plugins/SiftCoder/skills/meta/compression/SKILL.md`
- **Purpose**: Output compression rules. Wraps the optional `sift-compress` companion plugin if installed.
- **Use it when**: "be terse", "drop filler".

### budget
- **Source**: `/Users/sam/Documents/Plugins/SiftCoder/skills/meta/budget/SKILL.md`
- **Purpose**: Token + cost budget tracking with overrun warnings. Backed by `Budget` class.
- **Use it when**: explicit cost ceilings.

### quality-check
- **Source**: `/Users/sam/Documents/Plugins/SiftCoder/skills/meta/quality-check/SKILL.md`
- **Purpose**: On-demand format/lint/typecheck/tests, run together.
- **Use it when**: "is this clean?", "any issues?" — replaces chained quality gates.

### analyze
- **Source**: `/Users/sam/Documents/Plugins/SiftCoder/skills/meta/analyze/SKILL.md`
- **Purpose**: Generic structured analysis — readability, complexity, risk, performance, churn, dep health.
- **Use it when**: you want a multi-mode analytical report.

### monitor
- **Source**: `/Users/sam/Documents/Plugins/SiftCoder/skills/meta/monitor/SKILL.md`
- **Purpose**: Health monitoring for daemon, store, external deps (Ollama, Anthropic).
- **Use it when**: pairing with `monitors/` directory configurations.

### sync
- **Source**: `/Users/sam/Documents/Plugins/SiftCoder/skills/meta/sync/SKILL.md`
- **Purpose**: Sync local state to remote backup or team federation. PII-redaction-aware.
- **Use it when**: backup or team sharing.

### team
- **Source**: `/Users/sam/Documents/Plugins/SiftCoder/skills/meta/team/SKILL.md`
- **Purpose**: Team knowledge sharing — shared workspaces, captured patterns, federation hygiene.
- **Use it when**: rolling SiftCoder out beyond one developer.

### trace
- **Source**: `/Users/sam/Documents/Plugins/SiftCoder/skills/meta/trace/SKILL.md`
- **Purpose**: Surface what AI did — actions taken, alternatives considered, why choices made.
- **Use it when**: "what did you do and why".

## UX (`skills/ux/`)

Ideation surface.

### ideate
- **Source**: `/Users/sam/Documents/Plugins/SiftCoder/skills/ux/ideate/SKILL.md`
- **Purpose**: Memory-aware feature ideation — pulls prior decisions, avoids re-suggesting rejected ideas.
- **Use it when**: "what should I build next" for the current project.

### surprise-me
- **Source**: `/Users/sam/Documents/Plugins/SiftCoder/skills/ux/surprise-me/SKILL.md`
- **Purpose**: Brand-new project ideas — not features for an existing repo.
- **Use it when**: weekend build, side project.

### reverse-prompt
- **Source**: `/Users/sam/Documents/Plugins/SiftCoder/skills/ux/reverse-prompt/SKILL.md`
- **Purpose**: Single conversational prompt that would rebuild the current project. Three modes — Quick / Deep / Focus.
- **Use it when**: capturing the project as a regenerable artifact.

## Reading order

If you're new: `meta/siftcoder` (decision tree), then `meta/onboard` (setup), then `knowledge/memory-usage` (the MCP tools). Everything else lights up as you need it.
