# Slash commands

Every command lives in `commands/<name>.md`. Loading a command sets its frontmatter as policy (allowed tools, argument hint) and the body as the prompt. Most commands are thin shells that hand off to a skill — the skill is where the workflow lives. A handful are first-class (multi-verb dispatchers, scaffolders, wrappers).

The full set is large because SiftCoder treats slash commands as the primary user surface — every workflow gets one.

## Full index

| Command | Description |
|---|---|
| `/siftcoder:add-feature` | Incremental new capability — smaller than `build`, bigger than `fix`. |
| `/siftcoder:agent` | Full agentic loop — planner → coder → qa-reviewer → qa-fixer with rollback. |
| `/siftcoder:analyze` | Generic analysis with structured output (readability, risk, churn). |
| `/siftcoder:apex-patterns` | Generate FFLib Selector / Domain / Service / UnitOfWork. |
| `/siftcoder:api` | API design — REST/GraphQL/gRPC, versioning, idempotency, pagination. |
| `/siftcoder:archaeologist` | Why does this exist? Triangulate git, memory, code. |
| `/siftcoder:autonomous` | Long-running unattended runs with checkpoint/cost/time caps. |
| `/siftcoder:blast-radius` | Pre-merge "what could go wrong if this is buggy". |
| `/siftcoder:bridge` | Cross-codebase integration analysis — gap map, pattern pick, bridge spec. |
| `/siftcoder:budget` | Token/cost budget tracking. |
| `/siftcoder:build-fix` | Auto-resolve build errors with minimal-diff fix. |
| `/siftcoder:build` | Spec-first feature build. |
| `/siftcoder:chaos` | Failure-scenario design for resilience testing. |
| `/siftcoder:checkpoint` | Save a named savepoint with intent + scope + memory pin. |
| `/siftcoder:chroot` | Tighter file-access jail than `/scope` — explicit file list. |
| `/siftcoder:codemap` | Evidence-based codebase documentation. |
| `/siftcoder:codemap-diff` | Compare two refs/branches semantically. |
| `/siftcoder:codemap-export` | Export codemap as machine-readable JSON. |
| `/siftcoder:codemap-fast` | ~30s structural scan of an unfamiliar repo. |
| `/siftcoder:codemap-trust` | Confidence/risk per module. |
| `/siftcoder:comply` | Compliance review (SOC2/HIPAA/GDPR/PCI). |
| `/siftcoder:compress` | Toggle output compression. |
| `/siftcoder:config` | Interactive config wrapper. |
| `/siftcoder:continue` | Resume from `/pause`. |
| `/siftcoder:debug` | Generic debugging — error analysis, repro, bisect. |
| `/siftcoder:document` | Generate documentation in a named shape. |
| `/siftcoder:dream` | Unconstrained generative exploration. |
| `/siftcoder:duck` | Rubber-duck mode — AI asks, you explain. |
| `/siftcoder:empathy` | Cognitive-load measurement. |
| `/siftcoder:examples` | Real session traces. |
| `/siftcoder:feasibility` | Go/no-go memo on a proposed change. |
| `/siftcoder:fix` | Bounded-scope bug fix with regression test. |
| `/siftcoder:focus` | Narrow attention to a feature/file set (advisory). |
| `/siftcoder:fortune` | Tech-debt forecast — which debt is about to bite. |
| `/siftcoder:fuzz-mind` | Adversarial edge-case test generation. |
| `/siftcoder:gap-analysis` | Inventory of what's missing — spec→impl. |
| `/siftcoder:ghost` | "What if we did X instead" — alternative branch exploration. |
| `/siftcoder:handoff` | End-of-session deliverable for the next person. |
| `/siftcoder:heal` | Self-healing build/test loop. |
| `/siftcoder:help` | SiftCoder help index. |
| `/siftcoder:ideate` | Memory-aware feature ideation for current project. |
| `/siftcoder:improve-spec` | Polish a spec — testable AC, ambiguities surfaced. |
| `/siftcoder:integrate` | Two-system integration design. |
| `/siftcoder:invariant` | Discover and externalise implicit invariants. |
| `/siftcoder:investigate` | Read-only diagnosis. |
| `/siftcoder:knowledge` | Org/project-wide knowledge curation. |
| `/siftcoder:lwc` | Lightning Web Component create/debug/wire/event. |
| `/siftcoder:lwc-debug` | Dispatch lwc-debugger agent. |
| `/siftcoder:mem` | Memory daemon multi-verb (start/stop/status/drain/info/web/…). |
| `/siftcoder:migrate` | Data migration with verify + rollback. |
| `/siftcoder:monitor` | Health monitoring setup. |
| `/siftcoder:narrator` | Code-to-story translation for non-engineers. |
| `/siftcoder:onboard` | First-time SiftCoder setup walk. |
| `/siftcoder:optimize` | Profile-driven performance fix. |
| `/siftcoder:oracle` | Predictive intent inference. |
| `/siftcoder:organize-project` | Assess + improve folder/file layout (user-approved). |
| `/siftcoder:pair` | Per-edit approval mode. |
| `/siftcoder:pattern-learn` | Save reusable pattern from recent work. |
| `/siftcoder:pattern-list` | List captured patterns. |
| `/siftcoder:pattern-search` | Find captured patterns. |
| `/siftcoder:pause` | Freeze session state with rich resumption context. |
| `/siftcoder:perf` | Dedicated performance profiling. |
| `/siftcoder:polyglot` | Cross-language consistency. |
| `/siftcoder:preview` | Diff-before-apply discipline. |
| `/siftcoder:prompt` | Craft a better prompt. |
| `/siftcoder:quality` | On-demand format/lint/typecheck. |
| `/siftcoder:refactor` | Same behaviour, better structure (test-coverage-gated). |
| `/siftcoder:reverse-prompt` | Generate a single prompt that rebuilds this project. |
| `/siftcoder:reverse-spec` | Extract spec FROM existing code. |
| `/siftcoder:review` | SiftCoder-shaped code review (memory-aware). |
| `/siftcoder:ripple` | "If I change X, what else changes". |
| `/siftcoder:schema` | SF schema management — objects, fields, ERD. |
| `/siftcoder:schema-migrate` | SF schema migration with deploy plan + rollback. |
| `/siftcoder:scope` | Edit `.siftcoder/scope.json`. |
| `/siftcoder:search` | Federated search — code + memory + docs. |
| `/siftcoder:security` | Security review with project framing. |
| `/siftcoder:session-eval` | Post-session evaluation + pattern extraction. |
| `/siftcoder:sf-agentforce` | Salesforce Agentforce work. |
| `/siftcoder:sf-architect` | SF org-level architecture review. |
| `/siftcoder:sf-comply` | SF industry-cloud compliance. |
| `/siftcoder:sf-connect` | SF Named Credentials / External Credentials / OAuth. |
| `/siftcoder:sf-cpq` | Salesforce CPQ. |
| `/siftcoder:sf-debug` | SF debug log analysis. |
| `/siftcoder:sf-deploy` | SF deploy — validate/deploy/diff/rollback. |
| `/siftcoder:sf-einstein` | Salesforce Einstein. |
| `/siftcoder:sf-flow` | Salesforce Flow Builder. |
| `/siftcoder:sf-package` | Unlocked packages, versioning, deps. |
| `/siftcoder:sf-security` | SF-specific security review. |
| `/siftcoder:sf-test` | SF test generation + coverage. |
| `/siftcoder:sf-webhook` | SF inbound webhooks (Apex REST + HMAC). |
| `/siftcoder:siftcoder` | Meta — "which SiftCoder skill should I use for X". |
| `/siftcoder:smart-retry` | Retry with a different strategy. |
| `/siftcoder:spec-from-stories` | Derive spec from user stories/tickets. |
| `/siftcoder:status` | Quick status (wraps `mem status`). |
| `/siftcoder:surprise-me` | Brand-new side-project ideas. |
| `/siftcoder:swarm` | Parallel subagent dispatch with conflict gates. |
| `/siftcoder:sync` | Sync state to remote backup or team federation. |
| `/siftcoder:tdd` | Strict red-green-refactor. |
| `/siftcoder:team` | Team knowledge sharing. |
| `/siftcoder:test` | Multi-modal test generation. |
| `/siftcoder:timewarp` | Reconstruct codebase state at a past commit. |
| `/siftcoder:trace` | Surface what AI did during a session. |
| `/siftcoder:update-codemaps` | Regenerate diagrams after structural changes. |
| `/siftcoder:update-docs` | Sync docs to code. |
| `/siftcoder:use-cases` | Use-cases by developer/problem/task size. |
| `/siftcoder:wizard` | Guided multi-step interactive flow. |
| `/siftcoder:zen` | Aggressive simplification — delete-as-default. |

Most entries are pass-throughs of the form:

```
---
description: <skill> workflow — see corresponding skills/*/<skill>/SKILL.md
allowed-tools: Read, Edit, Write, Bash, Grep, Glob
---
```

The body resolves to "invoke the matching skill, pass `$ARGUMENTS` as topic". The interesting ones — multi-verb dispatchers and scaffolders — are below.

---

## `/siftcoder:mem`

**Signature**: `/siftcoder:mem <action> [args]`

**Allowed tools**: `Bash` only — this is a CLI wrapper, nothing else.

**What it's for**: Single entry point for daemon operations. One slash, ten verbs.

| Action | Effect |
|---|---|
| `start` | Spawn the daemon detached (idempotent). |
| `stop` | Stop the daemon for this workspace. |
| `status` | Health, counts, backend cascade choices. |
| `info [--json]` | Full runtime details — version, pid/uptime, paths, backends, counts, db size. |
| `version` | Print version only. |
| `check` | Verify reachable; auto-start if not. |
| `setup` | Interactive first-time setup. |
| `drain [batch]` | Force a drain pass (default `batch=32`). |
| `backfill [source]` | Backfill from past Claude Code transcripts. |
| `web` | Print web UI URL. |
| `list` | List recent summaries. |
| `prune --confirm` | Run memory-curator agent and prune flagged rows. |

Implementation is `node $CLAUDE_PLUGIN_ROOT/bin/siftcoder.mjs $ARGUMENTS`. `prune` uniquely dispatches to the `memory-curator` agent first, then runs deletes only on explicit `--confirm`.

**Examples**:
```
/siftcoder:mem status
/siftcoder:mem info --json
/siftcoder:mem drain 64
/siftcoder:mem backfill transcripts
```

---

## `/siftcoder:investigate`

**Signature**: `/siftcoder:investigate [topic]`

**What it's for**: Read-only diagnosis. Hypothesis-driven, evidence-cited. Produces an evidence ledger and hypothesis tree. Does not touch the code.

Always start here before `/fix` if root cause is unclear. The skill enforces:

1. State the question in one line.
2. Memory pass — has this been investigated before?
3. List 3-5 hypotheses, ordered by likelihood.
4. Evidence per hypothesis (line numbers, log lines, behaviour).
5. Conclusion + suggested next step.

Pairs with the `investigator` agent (`agents/investigator.md`).

**Example**: `/siftcoder:investigate why is checkout latency p99 spiking on Tuesdays`

---

## `/siftcoder:fix`

**Signature**: `/siftcoder:fix [bug]`

**What it's for**: Bounded-scope bug fix. Root-cause-first. Adds a regression test before declaring done. Refuses to expand into refactor.

The skill's discipline:

1. Reproduce — get the failure to a deterministic command line.
2. Memory pass — has this been fixed before? Did the prior fix regress?
3. Hypothesise + verify before patching.
4. Smallest patch that addresses the cause (not the symptom).
5. Regression test that fails before, passes after.

**Example**: `/siftcoder:fix the rate-limiter throws on empty bodies`

---

## `/siftcoder:add-feature`

**Signature**: `/siftcoder:add-feature [feature]`

**What it's for**: Add a new capability to an existing project. Smaller than `build` (no full spec), bigger than `fix`. Behind a feature flag where appropriate, with rollback path.

Skill enforces: scope statement → impact map (call graph + ripple) → flag plan → implementation → tests → smoke.

---

## `/siftcoder:tdd`

**Signature**: `/siftcoder:tdd [unit]`

**What it's for**: Strict red-green-refactor. Refuses to write production code before a failing test exists.

Per unit:
1. **Red**. One test asserting desired behaviour. Run, **must fail**.
2. **Green**. Simplest code that passes. Hardcoded values fine if tests permit.
3. **Refactor**. Improve structure, all tests still green.
4. Repeat.

If you slip and write code first, the skill calls it out — that's the contract.

---

## `/siftcoder:review`

**Signature**: `/siftcoder:review [scope]`

**What it's for**: SiftCoder-shaped code review. Memory-aware (prior decisions, project conventions). Complementary to built-in `/review` — that one covers general best-practice, this one covers project-specific.

Pairs with the `reviewer` agent. Pulls prior decisions on similar code via `mem_search`.

---

## `/siftcoder:agent`

**Signature**: `/siftcoder:agent [goal-or-spec]`

**What it's for**: End-to-end agentic loop — planner → coder → qa-reviewer → qa-fixer with checkpoint and rollback.

Pre-flight requires clean tree, a defined `/scope`, and a `/checkpoint` tag (autocreated). The pipeline:

1. **Plan** (planner agent) — evidence ledger, risk register, rollback path.
2. **User approval** of the plan.
3. **Execute** (orchestrator + coder) — parallel where independent.
4. **QA review** (qa-reviewer) — pass/fail vs acceptance criteria.
5. **Fix gaps** (qa-fixer) — bounded to QA report.
6. **Verify + report**.

Rollback is one `git reset --hard cp-<id>` away.

**Example**: `/siftcoder:agent migrate auth from JWT to session cookies`

---

## `/siftcoder:swarm`

**Signature**: `/siftcoder:swarm [tasks]`

**What it's for**: Dispatch multiple parallel subagents on independent tasks. Discipline around isolation, conflict resolution, merge strategy. Wraps native parallel `Task` dispatch with structured gates.

Use when you have ≥2 tasks that don't share state — e.g. "fix the test suite" and "update three unrelated docs".

---

## `/siftcoder:lwc`

**Signature**: `/siftcoder:lwc [create|debug|wire|event] <componentName>`

**What it's for**: LWC scaffolding and debugging.

| Subaction | Effect |
|---|---|
| `create <name>` | Scaffold HTML + JS + CSS + meta + jest test. |
| `debug <name>` | Dispatch the `lwc-debugger` agent on the component. |
| `wire <name> <adapter>` | Generate or refactor a wire adapter binding. |
| `event <name>` | Generate event-dispatch boilerplate (`composed/bubbles` defaults). |

Pulls rules from `skills/salesforce/salesforce-lwc/SKILL.md`.

---

## `/siftcoder:sf-deploy`

**Signature**: `/siftcoder:sf-deploy [validate|deploy|preview|quick|rollback] [--target-org <alias>]`

**What it's for**: Wraps the standard sfdx deploy flow.

| Subaction | Effect |
|---|---|
| `validate` | `sf project deploy validate --source-dir force-app --test-level RunLocalTests` |
| `preview` | Show diffs vs target org before deploy. |
| `deploy` | Full deploy (validates first unless `--quick`). |
| `quick <jobId>` | Quick-deploy from a previously validated job id. |
| `rollback` | Deploy the previous git tag to the target org. |

Always preview before production. Always `--test-level RunLocalTests` for prod.

---

## `/siftcoder:apex-patterns`

**Signature**: `/siftcoder:apex-patterns [selector|domain|service|uow] <ObjectOrName>`

**What it's for**: Scaffold FFLib enterprise patterns.

| Subaction | Generates |
|---|---|
| `selector <Object>` | `<Object>sSelector.cls` extending `fflib_SObjectSelector` |
| `domain <Object>` | `<Object>s.cls` (domain class) + factory |
| `service <Name>` | `<Name>Service.cls` interface + impl + locator |
| `uow [objects]` | `Application.cls` with the UnitOfWork registration |

Includes test classes. Pulls naming and bulk-safety from `skills/salesforce/salesforce-apex/SKILL.md`.

---

## `/siftcoder:zen`

**Signature**: `/siftcoder:zen [scope]`

**What it's for**: Aggressive simplification. Delete-as-default. Removes dead code, abstractions that don't earn their keep, scaffolding from when "we might need this".

Pairs well with `/siftcoder:invariant` — first surface the assumptions, then delete what doesn't serve them.

---

## Pattern: skill pass-through commands

For commands not detailed above, the file is roughly:

```markdown
---
description: <name> workflow — see corresponding skills/*/<name>/SKILL.md
allowed-tools: Read, Edit, Write, Bash, Grep, Glob
---

# /siftcoder:<name>

Direct invocation of the `<name>` skill. See the skill body for the full workflow contract.

$ARGUMENTS is passed as topic/scope to the skill.
```

The actual workflow lives in the skill — see [Skills](skills.md).
