# Skills

A skill in SiftCoder is a markdown file under `skills/<category>/<name>/SKILL.md` that bundles a focused workflow — read these inputs, run these tools, produce this output. Claude loads the relevant skill when you invoke a slash command, when you describe a task that matches a skill's description, or when one skill calls another. Skills differ from Claude Code's built-in skills in two ways: most are SiftCoder-specific (Salesforce work, memory primitives, SiftCoder workflow contracts), and many ground their behaviour in the memory daemon — they read past patterns, write captured decisions, or reason over the project's own history.

The fastest way to find the right skill is to grep this page or skim the table below. Every skill is listed exactly once. The slash command in the table is what you type in Claude Code; the source path is what you read if you want to see the prompt that drives the skill. Where two skills overlap (`fix` vs `debug`, `security` vs `comply`, `agent` vs `swarm`) the body of each section explicitly compares them — read both before reaching for either.

96 skills total across 12 categories. The categories below match the directory layout under `skills/`. Skills that don't fit cleanly (a `siftcoder` skill that lives in `meta/` but reads more like workflow) are placed where the source actually puts them, with a cross-reference where useful.

---

## Skim table

| Slash command | Anchor |
|---|---|
| `/siftcoder:add-feature` | [add-feature](#add-feature) |
| `/siftcoder:analyze` | [analyze](#analyze) |
| `/siftcoder:api` | [api](#api) |
| `/siftcoder:archaeologist` | [archaeologist](#archaeologist) |
| `/siftcoder:blast-radius` | [blast-radius](#blast-radius) |
| `/siftcoder:bridge` | [bridge](#bridge) |
| `/siftcoder:budget` | [budget](#budget) |
| `/siftcoder:build` | [build](#build) |
| `/siftcoder:build-fix` | [build-fix](#build-fix) |
| `/siftcoder:chaos` | [chaos](#chaos) |
| `/siftcoder:checkpoint` | [checkpoint](#checkpoint) |
| `/siftcoder:chroot` | [chroot](#chroot) |
| `/siftcoder:codemap` | [codemap](#codemap) |
| `/siftcoder:codemap-diff` | [codemap-diff](#codemap-diff) |
| `/siftcoder:codemap-export` | [codemap-export](#codemap-export) |
| `/siftcoder:codemap-fast` | [codemap-fast](#codemap-fast) |
| `/siftcoder:codemap-trust` | [codemap-trust](#codemap-trust) |
| `/siftcoder:comply` | [comply](#comply) |
| `/siftcoder:compress` | [compress](#compress) |
| `/siftcoder:compression` | [compression](#compression) |
| `/siftcoder:continue` | [continue](#continue) |
| `/siftcoder:debug` | [debug](#debug) |
| `/siftcoder:document` | [document](#document) |
| `/siftcoder:dream` | [dream](#dream) |
| `/siftcoder:duck` | [duck](#duck) |
| `/siftcoder:empathy` | [empathy](#empathy) |
| `/siftcoder:empathy` | [empathy](#empathy) |
| `/siftcoder:examples` | [examples](#examples) |
| `/siftcoder:feasibility` | [feasibility](#feasibility) |
| `/siftcoder:fix` | [fix](#fix) |
| `/siftcoder:fortune` | [fortune](#fortune) |
| `/siftcoder:fuzz-mind` | [fuzz-mind](#fuzz-mind) |
| `/siftcoder:gap-analysis` | [gap-analysis](#gap-analysis) |
| `/siftcoder:ghost` | [ghost](#ghost) |
| `/siftcoder:handoff` | [handoff](#handoff) |
| `/siftcoder:heal` | [heal](#heal) |
| `/siftcoder:ideate` | [ideate](#ideate) |
| `/siftcoder:improve-spec` | [improve-spec](#improve-spec) |
| `/siftcoder:integrate` | [integrate](#integrate) |
| `/siftcoder:invariant` | [invariant](#invariant) |
| `/siftcoder:investigate` | [investigate](#investigate) |
| `/siftcoder:knowledge` | [knowledge](#knowledge) |
| `/siftcoder:local-llm-setup` | [local-llm-setup](#local-llm-setup) |
| `/siftcoder:memory-usage` | [memory-usage](#memory-usage) |
| `/siftcoder:migrate` | [migrate](#migrate) |
| `/siftcoder:monitor` | [monitor](#monitor) |
| `/siftcoder:monitor` | [monitor](#monitor) |
| `/siftcoder:narrator` | [narrator](#narrator) |
| `/siftcoder:onboard` | [onboard](#onboard) |
| `/siftcoder:optimize` | [optimize](#optimize) |
| `/siftcoder:oracle` | [oracle](#oracle) |
| `/siftcoder:pair` | [pair](#pair) |
| `/siftcoder:pattern-learn` | [pattern-learn](#pattern-learn) |
| `/siftcoder:pattern-search` | [pattern-search](#pattern-search) |
| `/siftcoder:pause` | [pause](#pause) |
| `/siftcoder:perf` | [perf](#perf) |
| `/siftcoder:polyglot` | [polyglot](#polyglot) |
| `/siftcoder:preview` | [preview](#preview) |
| `/siftcoder:prompt` | [prompt](#prompt) |
| `/siftcoder:prompt` | [prompt](#prompt) |
| `/siftcoder:quality-check` | [quality-check](#quality-check) |
| `/siftcoder:refactor` | [refactor](#refactor) |
| `/siftcoder:reverse-prompt` | [reverse-prompt](#reverse-prompt) |
| `/siftcoder:reverse-spec` | [reverse-spec](#reverse-spec) |
| `/siftcoder:review` | [review](#review) |
| `/siftcoder:ripple` | [ripple](#ripple) |
| `/siftcoder:schema-migrate` | [schema-migrate](#schema-migrate) |
| `/siftcoder:search` | [search](#search) |
| `/siftcoder:security` | [security](#security) |
| `/siftcoder:session-eval` | [session-eval](#session-eval) |
| `/siftcoder:sf-agentforce` | [sf-agentforce](#sf-agentforce) |
| `/siftcoder:sf-apex` | [sf-apex](#sf-apex) |
| `/siftcoder:sf-architect` | [sf-architect](#sf-architect) |
| `/siftcoder:sf-comply` | [sf-comply](#sf-comply) |
| `/siftcoder:sf-cpq` | [sf-cpq](#sf-cpq) |
| `/siftcoder:sf-deploy` | [sf-deploy](#sf-deploy) |
| `/siftcoder:sf-einstein` | [sf-einstein](#sf-einstein) |
| `/siftcoder:sf-flow` | [sf-flow](#sf-flow) |
| `/siftcoder:sf-lwc` | [sf-lwc](#sf-lwc) |
| `/siftcoder:sf-security` | [sf-security](#sf-security) |
| `/siftcoder:sf-test` | [sf-test](#sf-test) |
| `/siftcoder:siftcoder` | [siftcoder](#siftcoder) |
| `/siftcoder:siftcoder` | [siftcoder](#siftcoder) |
| `/siftcoder:smart-retry` | [smart-retry](#smart-retry) |
| `/siftcoder:spec-from-stories` | [spec-from-stories](#spec-from-stories) |
| `/siftcoder:surprise-me` | [surprise-me](#surprise-me) |
| `/siftcoder:sync` | [sync](#sync) |
| `/siftcoder:sync` | [sync](#sync) |
| `/siftcoder:tdd` | [tdd](#tdd) |
| `/siftcoder:team` | [team](#team) |
| `/siftcoder:test` | [test](#test) |
| `/siftcoder:timewarp` | [timewarp](#timewarp) |
| `/siftcoder:trace` | [trace](#trace) |
| `/siftcoder:update-codemaps` | [update-codemaps](#update-codemaps) |
| `/siftcoder:update-docs` | [update-docs](#update-docs) |
| `/siftcoder:wizard` | [wizard](#wizard) |

---

## Coding

### `/siftcoder:add-feature` { #add-feature }

_Source: `skills/coding/add-feature/SKILL.md`_


**One-line purpose.** Bolt a new capability onto an existing project without rewriting the world.

Runs a memory pass for prior decisions about the area, finds the closest existing feature to mirror, then ships the smallest slice behind a flag where the change is user-facing. Touches: the production files for the slice, a flag-on and flag-off test pair, and a changelog entry only when surface area moves.

**When to reach for it:** adding a second sort order to a list endpoint, or wiring a new notification channel into the existing dispatcher.

**Why over alternatives:** smaller than `/build` (no spec phase, no acceptance ceremony) and bigger than `/fix` (which refuses to expand scope at all). Default flag-off plus a named rollback path is what keeps it from drifting into a refactor.

**Invocation:** ```/siftcoder:add-feature add CSV export to the reports list```

### `/siftcoder:fix` { #fix }

_Source: `skills/coding/fix/SKILL.md`_


**One-line purpose.** Reproduce, root-cause, patch, regression-test, stop.

Demands a deterministic repro before any code changes. Runs `mem_search` on the symptom, states a hypothesis with file:line evidence, applies the smallest change that targets the cause, and writes a regression test that fails on the old code. Touches: one production file (usually), one test file, no adjacent cleanup.

**When to reach for it:** a user reports `TypeError: cannot read 'id' of undefined` from the orders page and you have a stack trace.

**Why over alternatives:** `/debug` surfaces diagnosis without applying anything. `/investigate` is read-only and produces a report. `/heal` retries multiple strategies across build/test/lint. `/build-fix` only handles compiler/bundler errors. `/fix` is the bounded patch with a regression test attached.

**Invocation:** ```/siftcoder:fix orders page crashes when customer has no shipping address```

### `/siftcoder:investigate` { #investigate }

_Source: `skills/coding/investigate/SKILL.md`_


**One-line purpose.** Read-only diagnosis with a hypothesis tree and an evidence ledger.

States the question in one line, builds three to five ranked hypotheses each with confirm/rule-out evidence requirements, then collects evidence in priority order until one is confirmed or all are ruled out. Touches: nothing. Output is a structured report saved to memory.

**When to reach for it:** "why does the nightly job sometimes fail at 3am?" before you know enough to fix anything.

**Why over alternatives:** `/fix` requires a known cause and patches code. `/debug` surfaces a quick diagnosis on a single error. `/investigate` is the long-form, multi-hypothesis read-only mode that refuses to touch source even when tempted — the discipline is the value.

**Invocation:** ```/siftcoder:investigate why does export latency spike on Mondays```

### `/siftcoder:debug` { #debug }

_Source: `skills/coding/debug/SKILL.md`_


**One-line purpose.** Pick the right diagnostic mode for the failure shape and surface ranked candidates.

Six sub-modes — `error`, `trace`, `repro`, `bisect`, `trace-call`, `log` — each with its own short procedure. Quotes errors verbatim, distinguishes the fault frame from the report frame on stack traces, and removes any instrumentation it added. Touches: temp instrumentation that gets cleaned up, otherwise nothing.

**When to reach for it:** you have a stack trace and need to know which frame is the real culprit, or you want to git-bisect the commit that introduced a flaky test.

**Why over alternatives:** `/fix` applies patches; `/debug` only diagnoses. `/investigate` runs a longer multi-hypothesis pass; `/debug` is the targeted quick read on a specific failure. `/heal` and `/build-fix` apply changes; `/debug` hands you ranked fix candidates and stops.

**Invocation:** ```/siftcoder:debug trace <paste stack trace here>```

### `/siftcoder:refactor` { #refactor }

_Source: `skills/coding/refactor/SKILL.md`_


**One-line purpose.** Same behaviour, better structure — with tests as the contract.

Enforces an 80% line-coverage gate on the target before any restructuring; if you're under, it writes tests first. Names the smell, plans the target shape in under 100 words, then runs extract-before-rename-before-move, one verb-noun step per commit, tests green after every step.

**When to reach for it:** the order processor is a 400-line method that needs splitting into validate/price/persist before anyone can add tax handling cleanly.

**Why over alternatives:** `/fix` changes behaviour to correct a bug. `/optimize` changes behaviour-equivalent code to make it faster against a metric. `/zen` aggressively deletes. `/refactor` is the disciplined behaviour-preserving structural pass that refuses to mix in feature changes.

**Invocation:** ```/siftcoder:refactor split OrderProcessor.process into validate/price/persist```

### `/siftcoder:optimize` { #optimize }

_Source: `skills/coding/optimize/SKILL.md`_


**One-line purpose.** Measure, profile the actual hotspot, change one thing, re-measure, stop.

Refuses to start without a baseline metric and a numeric goal (`p95 < 200ms`, not "faster"). Profiles with the right tool per stack, applies one minimal change to the identified hotspot, re-measures, and reverts if the metric didn't move. Touches: one production file usually, plus a perf regression test for the win.

**When to reach for it:** the dashboard endpoint is at 1.2s p95 and product wants 300ms.

**Why over alternatives:** `/perf` produces a baseline report and stops; `/optimize` consumes that baseline and drives a fix. Run `/perf` first when you don't have numbers, then `/optimize` once you do. `/refactor` doesn't care about timing; `/optimize` revolves around it.

**Invocation:** ```/siftcoder:optimize dashboard endpoint p95 < 300ms```

### `/siftcoder:perf` { #perf }

_Source: `skills/coding/perf/SKILL.md`_


**One-line purpose.** Dedicated profiling pass that produces a baseline report — no code changes.

Picks the metric that matters (wall, CPU, memory, allocations, query count, network, p95), runs a deterministic workload at least five times, names the top five hotspots by self-time, and captures the baseline to memory so future runs detect regression. Touches: nothing in source; writes a report and a memory entry.

**When to reach for it:** before any optimisation work starts, or when someone says "the API feels slow" and you have no numbers.

**Why over alternatives:** `/optimize` assumes you already have a baseline and a target — it changes code. `/perf` is the measurement step that feeds `/optimize`. Single-run timing checks aren't this skill; multi-iteration p50/p95/p99 with a named workload is.

**Invocation:** ```/siftcoder:perf measure /api/reports under 50 RPS for 60s```

### `/siftcoder:test` { #test }

_Source: `skills/coding/test/SKILL.md`_


**One-line purpose.** Multi-modal test generation — picks unit/integration/e2e/property/mutation/coverage/bulk per intent.

Reads the target and the neighbouring tests so the generated style matches what's already in the repo. Enumerates behaviours (happy path, edges, errors, transitions), decides what to mock at the I/O boundary, and runs a mutation-test sample on a couple of the generated tests to verify they actually fail on broken code.

**When to reach for it:** filling coverage gaps on a module that already has logic, or scaffolding integration tests against a real DB.

**Why over alternatives:** `/tdd` is the discipline — red-green-refactor, refuses production code without a failing test first. `/test` is the production tool that generates tests for code that already exists or for new code at any time. Use TDD for new behaviour; use `/test` for filling gaps and integration scaffolds. They compose.

**Invocation:** ```/siftcoder:test unit src/auth/middleware.ts```

### `/siftcoder:tdd` { #tdd }

_Source: `skills/coding/tdd/SKILL.md`_


**One-line purpose.** Strict red-green-refactor with non-negotiable ordering.

One test at a time. Test must actually fail with the right failure mode before any production code is written. Simplest code to green, then refactor only while green. Each cycle gets one behaviour, one test, one minimal implementation step.

**When to reach for it:** new behaviour where you want guaranteed test coverage and a tight design feedback loop.

**Why over alternatives:** `/test` generates tests for existing or new code in any of seven modes — it doesn't enforce write-the-test-first. `/tdd` refuses to write production code before a failing test exists, full stop. The order is the value; if you don't want the order, use `/test`.

**Invocation:** ```/siftcoder:tdd implement Discount.applyTo with stacking rules```

### `/siftcoder:build` { #build }

_Source: `skills/coding/build/SKILL.md`_


**One-line purpose.** Spec → acceptance criteria → tests → code → verify → docs, with no skipped steps.

Surfaces ambiguities in the spec before any code is written, runs a memory pass for prior decisions, gets you to confirm the test names that would prove this works, then implements one acceptance criterion at a time. Touches: a coordinated set of new files and tests, plus changelog entries for user-visible changes.

**When to reach for it:** the user hands you a spec for a new payment provider integration or a new admin page and expects working code.

**Why over alternatives:** `/add-feature` is incremental — it mirrors an existing pattern and ships a slice. `/build` is for greenfield-shaped work where alignment on success criteria has to happen up front. `/fix` and `/refactor` aren't building anything new.

**Invocation:** ```/siftcoder:build implement Stripe webhook receiver per docs/specs/stripe.md```

### `/siftcoder:build-fix` { #build-fix }

_Source: `skills/coding/build-fix/SKILL.md`_


**One-line purpose.** Auto-resolve build errors with the smallest possible diff.

Captures full build output, classifies the first failure (type error, module not found, syntax, linker, bundler config, codegen out of date), proposes a minimal-diff fix, applies it, re-runs. Caps at two attempts on the same strategy before escalating. Touches: usually one source file or one config file.

**When to reach for it:** `tsc` is failing after a dependency bump and you want it green again with no `@ts-ignore` smells.

**Why over alternatives:** `/heal` is broader — it handles build, test, lint, and typecheck failures with three distinct strategies. `/build-fix` only handles build errors and only with minimal-diff. `/fix` is for runtime bugs with regression tests. If `/build-fix` can't get it green in two tries, escalate to `/heal`.

**Invocation:** ```/siftcoder:build-fix```

### `/siftcoder:heal` { #heal }

_Source: `skills/coding/heal/SKILL.md`_


**One-line purpose.** Self-healing loop across build/test/lint/typecheck — three distinct strategies, then bail.

Classifies the failure, applies the most-likely fix, re-runs. If the same error comes back, switches to a different angle (different file, different abstraction). Caps at three strategies per failure and five failures per session, then surfaces a full diagnosis to the user. Refuses to weaken tests or disable checks to make CI green.

**When to reach for it:** local checks are red across multiple categories after a merge and you want automatic recovery before bringing in a human.

**Why over alternatives:** `/build-fix` is single-purpose and minimal-diff for build errors only. `/fix` is bounded to one bug with a regression test. `/smart-retry` retries an operation with strategy variation but doesn't run the broader build/test/lint loop. `/heal` is the multi-strategy recovery harness with hard caps.

**Invocation:** ```/siftcoder:heal```

### `/siftcoder:smart-retry` { #smart-retry }

_Source: `skills/workflow/smart-retry/SKILL.md`_


**One-line purpose.** Retry a failed operation with a different strategy each time, ranked by memory.

Classifies the failure as transient / definitive / configuration. Transient gets naive retry with backoff. Definitive gets three distinct strategies — different file, different angle, different abstraction — with each strategy citing the memory entry that justifies its rank. Successful strategy is captured so the next similar error tries it first.

**When to reach for it:** a deploy step or test that failed once for an unclear reason and you want a structured second attempt instead of mashing rerun.

**Why over alternatives:** naive retry treats every failure as transient. `/heal` is broader — it runs across build/test/lint and tries three strategies in sequence. `/smart-retry` is the focused single-operation retry that refuses to repeat what already failed and ranks strategies by what worked historically.

**Invocation:** ```/siftcoder:smart-retry deploy to staging```

### `/siftcoder:pair` { #pair }

_Source: `skills/coding/pair/SKILL.md`_


**One-line purpose.** Approve-each-step interactive mode — propose, preview, wait, apply, verify, next.

Every change is shown as a preview block (diff or pseudo-diff) with files touched and a risk note. User chooses accept / edit / reject. After apply, a single small verification (one test, one file read-back) before moving on. Never batches. Never applies silently, even for trivial edits.

**When to reach for it:** risky areas, complex refactors, or when you want to learn from each step instead of getting a finished diff dumped on you.

**Why over alternatives:** default mode applies changes when capable. `/build` and `/add-feature` run end-to-end. `/pair` slows the loop down to one decision per step — the discipline is the value when you don't trust the area or want to teach yourself the codebase.

**Invocation:** ```/siftcoder:pair refactor PaymentService into smaller pieces```

## Integrations

### `/siftcoder:bridge` { #bridge }

_Source: `skills/integrations/bridge/SKILL.md`_


**One-line purpose.** Design the connection between two separately-owned codebases, repos, or teams.

Inventories both sides (surface, stack, data model, auth, ops cadence), maps the boundary, runs a gap analysis on shape/auth/version/load mismatches, picks one integration pattern with the others rejected on the record, and produces a bridge spec covering contract, auth, failure modes, observability, and versioning. Read-only on both sides during analysis.

**When to reach for it:** wiring an internal billing service to a partner's order platform, or connecting two business units' Salesforce orgs.

**Why over alternatives:** `/integrate` designs one source-to-sink integration inside a single mental model. `/bridge` adds the cross-codebase concerns — governance, version-skew, deploy-cadence mismatch, identity translation. Same-repo modules belong in `/refactor`, not here.

**Invocation:** ```/siftcoder:bridge billing-service to partner orders API```

### `/siftcoder:api` { #api }

_Source: `skills/integrations/api/SKILL.md`_


**One-line purpose.** API design that forces a decision on each load-bearing axis before any code lands.

Eight axes: style (REST/GraphQL/gRPC), versioning, auth, error shape, idempotency, pagination, rate limit, spec format. Each gets a choice plus a one-line rationale in a decisions table. Spec is written first (OpenAPI 3.1 / SDL / proto), code is generated from spec, contract tests assert the spec.

**When to reach for it:** designing a new public API or formalising an internal one that's grown beyond ad-hoc.

**Why over alternatives:** writing endpoints first and retrofitting a spec is the default failure mode — versioning policy gets bolted on after the first incident. `/api` puts the eight decisions on paper before code, so future-you doesn't re-decide them under pressure. Webhook receivers go through `/sf-webhook` instead.

**Invocation:** ```/siftcoder:api design v1 of the reports API```

### `/siftcoder:migrate` { #migrate }

_Source: `skills/integrations/migrate/SKILL.md`_


**One-line purpose.** Data migration with snapshot, plan, execute, verify, rollback — and a captured audit trail.

Schema-diffs source against sink field by field (direct / transformed / dropped / new), verifies reference data exists in target, picks a strategy (big-bang, dual-write, backfill+delta), and writes step-by-step rollback before any write happens. Old data is kept N days post-cutover. Touches: a migration plan doc, the cutover scripts, validation queries, and a memory entry for audit.

**When to reach for it:** moving users from a legacy DB to a new one, or migrating a Salesforce org's data model after a schema change.

**Why over alternatives:** single-record changes are direct DML. `/schema migrate` handles schema-only moves. `/migrate` is for data moves where snapshot-first, reference-data verification, and per-step rollback are mandatory — skip those and you get an incident.

**Invocation:** ```/siftcoder:migrate users from legacy_db to identity_service```

### `/siftcoder:integrate` { #integrate }

_Source: `skills/integrations/integrate/SKILL.md`_


**One-line purpose.** Design one integration between two systems, picking the pattern first.

Pattern matrix — sync request-reply, async fire-forget, pub/sub, batch, CDC, streaming — chosen against volume, latency, loss tolerance, and ordering requirements. Then auth, idempotency strategy, retry policy with dead-letter, observability (correlation ids, latency histograms, error rates), and schema versioning. Output is a plan plus producer/consumer scaffolds.

**When to reach for it:** a new downstream consumer of order events, or wiring a CRM to an analytics warehouse.

**Why over alternatives:** `/bridge` is the cross-codebase variant with governance and identity translation. `/api` designs the contract surface; `/integrate` designs the wiring that uses such a contract. Same-process function calls aren't integrations and don't need this.

**Invocation:** ```/siftcoder:integrate order events into analytics warehouse```

## UX

### `/siftcoder:ideate` { #ideate }

_Source: `skills/ux/ideate/SKILL.md`_


**One-line purpose.** Memory-grounded feature ideas for the current project — not generic brainstorming.

Runs a memory pass to skim already-explored, rejected, or in-flight ideas, then a repo pass for what the product actually does and where users feel friction. Generates two portfolios — three safe and three asymmetric ideas — each with title, distinguishing claim, impact, risk, evidence (file path or memory id), smallest slice, and a kill criterion. Picks one dark horse and one compounding bet.

**When to reach for it:** "what should we build next quarter" or "how could we extend the export feature" with the actual repo as ground truth.

**Why over alternatives:** generic brainstorming produces "add a dashboard" without hooks into the codebase. `/surprise-me` generates fresh project concepts, not features for an existing repo. `/ideate` is the option set with evidence and sequencing for what's already shipping.

**Invocation:** ```/siftcoder:ideate ways to extend the reports module```

### `/siftcoder:reverse-prompt` { #reverse-prompt }

_Source: `skills/ux/reverse-prompt/SKILL.md`_


**One-line purpose.** Generate a single conversational prompt that would rebuild the current project from scratch.

Three modes. Quick is just the structure (file tree, top-level names, ~500 tokens). Deep is full understanding — architecture, key files, data flow, conventions, ~3-5k tokens. Focus is one feature only with surrounding context. Caches by fingerprint of the top-level tree and manifest hash for 24 hours.

**When to reach for it:** handoff to a contractor, spec extraction for a rewrite, or onboarding a new contributor with a single tight document.

**Why over alternatives:** `cat`-ing files into a prompt loses synthesis. `/onboard` is interactive walk-through. `/reverse-prompt` is the one-shot prompt-shaped artefact you can paste into another agent and have it rebuild your repo.

**Invocation:** ```/siftcoder:reverse-prompt deep```

### `/siftcoder:surprise-me` { #surprise-me }

_Source: `skills/ux/surprise-me/SKILL.md`_


**One-line purpose.** Novel project concepts for a side project / weekend build — not features for the current repo.

Five ideas across three creativity axes (cross-pollinate, subtraction, constraint-driven), one memory-mining idea pulled from unfinished thoughts, one wildcard. Each gets a 72-hour path with first commit, MVP slice, demo moment, hardest unknown, and a kill test. Honors flags like `--salesforce`, `--tiny` (under 200 LOC), and `--learning <tech>`.

**When to reach for it:** "I'm bored, give me something to build this weekend" or "what should I build to learn Rust".

**Why over alternatives:** `/ideate` extends the current repo with grounded feature options. `/surprise-me` produces fresh repo concepts. Refuses todo apps, chatbots, personal sites, and anything the user has obviously already built.

**Invocation:** ```/siftcoder:surprise-me --tiny --learning rust```

## Review

### `/siftcoder:review` { #review }

_Source: `skills/review/review/SKILL.md`_


**One-line purpose.** Project-context-aware PR review — memory-grounded and convention-extracting.

Diffs the change, runs `mem_search` on every touched file/symbol to flag contradictions with prior captured decisions, extracts conventions from neighbouring code (import order, error handling, test patterns), and checks module boundaries. Output separates blockers, should-fixes, and approved areas with memory ids cited.

**When to reach for it:** "does this PR match how we do things in this repo" or "are we contradicting a decision from three months ago".

**Why over alternatives:** built-in `/review` is excellent at general best-practice and OWASP-style findings. This skill adds the local context — prior decisions, project-specific conventions, what's load-bearing in this codebase. Use both: built-in for breadth, this for depth.

**Invocation:** ```/siftcoder:review PR #482```

### `/siftcoder:security` { #security }

_Source: `skills/review/security/SKILL.md`_


**One-line purpose.** Stack-aware security review with incident memory and threat-model awareness.

Detects the stack (Node/Python/Apex/etc), pulls prior incidents from memory via `mem_search { kind: "incident" }`, loads the project threat model or infers top three threats from stack and domain, then runs stack-tailored rule sets (prototype pollution and JWT misuse for Node; SOQL injection and FLS bypass for Apex). Findings carry severity, evidence with file:line, reproduction where applicable, and a specific fix.

**When to reach for it:** pre-merge security check on a PR that touches auth, data access, or external callouts.

**Why over alternatives:** built-in `/security-review` covers OWASP top 10 generically. This skill adds stack-specific patterns and incident memory — "we had a SQLi here in 2024" elevates related code automatically. `/sf-security` is the Salesforce-only deeper variant. Combine built-in for breadth with this for depth.

**Invocation:** ```/siftcoder:security review the auth refactor on this branch```

wrote 23 skills to /tmp/skills-chunk-2.md

## Workflow

### `/siftcoder:siftcoder` { #siftcoder }

_Source: `skills/meta/siftcoder/SKILL.md`_


**One-line purpose.** Picks the right SiftCoder skill for a vague request.

This is the meta-router. It reads the user's intent, walks a fixed lookup table of phrasings ("build me X", "fix this", "investigate why"), and dispatches to the matching skill instead of solving the problem itself. No files written; output is a one-line decision plus the next invocation.

**When to reach for it:** the user types something like "I'd like to clean up the auth module" and you're not sure whether that's `refactor`, `zen`, `empathy`, or `archaeologist`. Or when onboarding a teammate who hasn't memorised the skill list.

**Why over alternatives:** vanilla CC will guess organically and often pick a generic path. This skill makes the routing explicit, surfaces ambiguity, and asks once before committing — so the right skill runs the first time.

**Invocation:** `/siftcoder "I want to make this code easier to read"`

---

### `/siftcoder:continue` { #continue }

_Source: `skills/workflow/continue/SKILL.md`_


**One-line purpose.** Resumes from a `/pause` with verified state.

Reads `pause-<id>.json` from `.siftcoder/checkpoints/`, runs `mem_get` and `mem_search` for activity since the pause, and checks `git log --since=<pause.createdAt>` for code drift. Produces a resume proposal with the original hypothesis, dead ends still relevant, and one concrete next step. Marks the memory entry `status: resumed`.

**When to reach for it:** you paused yesterday on a tricky migration thread. Today, before diving back in, you want to know if a teammate touched the same files overnight or if the constraints you discovered still hold.

**Why over alternatives:** a bare `git log` plus scrolling old chat misses the dead-end list (the highest-value pause artifact). This skill resurfaces those explicitly so you don't re-explore them.

**Invocation:** `/continue pause-1746121800` or `/continue` (most recent)

---

### `/siftcoder:pause` { #pause }

_Source: `skills/workflow/pause/SKILL.md`_


**One-line purpose.** Freezes session state with the thinking, not just the todos.

Distils the last ~20 turns into seven structured fields: open question, progress, hypothesis, dead ends, constraints, next step, memory pin. Writes `pause-<ts>.json` to `.siftcoder/checkpoints/` and pins a high-priority memory entry with `kind: pause` so the next session retrieves it on prompt submit.

**When to reach for it:** you're 90 minutes deep into chasing a flaky test, you've ruled out three causes, and you need to step away. You don't want tomorrow-you to re-rule-out the same three.

**Why over alternatives:** native task tracking captures todos. It doesn't capture dead ends or the constraint you discovered ("can't use X because Y"). That context is the part that's expensive to recover from chat scrollback.

**Invocation:** `/pause "auth refactor — stuck on JWT rotation"`

---

### `/siftcoder:handoff` { #handoff }

_Source: `skills/workflow/handoff/SKILL.md`_


**One-line purpose.** End-of-session brief shaped for the next reader.

Aggregates the session into Done / In progress / Blocked / Discovered / Recommended-next sections, with audience-aware detail (self vs teammate vs fresh CC session). Pulls commit SHAs from `git log --since=<session-start>` and references any active `/pause` IDs. Captures the handoff itself with `kind: handoff` so future "what's the status of X" queries hit it.

**When to reach for it:** end of a Friday sprint where you want a teammate to pick up Monday without a 30-minute catch-up call. Or generating a project brief for a fresh CC session two weeks from now.

**Why over alternatives:** asking CC "summarise what we did" produces prose. Handoff produces the structured Done/Blocked/Discovered shape, which is the only form a busy reader actually scans.

**Invocation:** `/handoff teammate` or `/handoff self`

---

### `/siftcoder:session-eval` { #session-eval }

_Source: `skills/workflow/session-eval/SKILL.md`_


**One-line purpose.** Post-session retrospective that feeds the knowledge base.

Pulls the conversation transcript, tools called, errors encountered, and memory hits/misses for a span. Sorts observations into patterns, anti-patterns, tool gaps, skill gaps, and memory gaps — each with concrete file/moment citations. Recommends `/pattern-learn` calls and new skill stubs but doesn't auto-create them.

**When to reach for it:** after a multi-hour session where you noticed yourself repeating a workaround. The eval names it as a pattern candidate, so future sessions can lift it from memory instead of rediscovering.

**Why over alternatives:** CC will retrospect on request but won't distinguish a pattern from a one-off, and won't surface memory misses (questions you answered from code that should have been retrievable). Memory misses are the gold.

**Invocation:** `/session-eval` or `/session-eval "since last commit"`

---

### `/siftcoder:checkpoint` { #checkpoint }

_Source: `skills/workflow/checkpoint/SKILL.md`_


**One-line purpose.** Named savepoint with intent, scope, and memory pins alongside the SHA.

Writes `<id>.json` to `.siftcoder/checkpoints/` via `src/services/state.ts`. Captures HEAD SHA (or stash if dirty), a copy of `.siftcoder/scope.json`, the top-N memory items by recency, and the user's reason. Restore creates a worktree (never an in-place checkout) and resurfaces the pinned memory.

**When to reach for it:** before a high-risk refactor where you want a clean rollback that preserves not just the code state but the scope and memory context you'd built up.

**Why over alternatives:** `git tag` captures commit + name. A checkpoint additionally captures scope and pinned memory. When you restore six weeks later, the intent layer tells you why this point mattered — a tag can't.

**Invocation:** `/checkpoint save pre-auth-refactor "before the JWT rename"`

---

### `/siftcoder:preview` { #preview }

_Source: `skills/workflow/preview/SKILL.md`_


**One-line purpose.** Diff-before-apply gate with explicit risk surfacing.

Plans the edits without applying. Renders unified diff grouped by file, then a risk block (files touched, LOC delta, tests affected, public API changes, migration concerns). Three options: accept, edit, reject. On accept, applies and runs tests/lint/typecheck.

**When to reach for it:** you asked CC to "rename `User` to `Account` across the auth module" and the change spans 30 files. You want to see the actual diff and the risk axes before anything touches disk.

**Why over alternatives:** CC defaults to applying when capable. `/pair` is per-step interactive. Preview is per-change — one diff, one decision, with the risk axes that a bare diff doesn't surface (public API? migration?).

**Invocation:** `/preview "rename User to Account across auth/"`

---

### `/siftcoder:sync` { #sync }

_Source: `skills/meta/sync/SKILL.md`_


**One-line purpose.** Sends local SiftCoder state to a backup or federation peer.

Snapshots the memory store at a consistent point-in-time, runs PII redaction via `src/memory/privacy.ts`, computes hash + size, transfers to the chosen target (local tarball, S3/GCS/Azure/Wasabi, or another SiftCoder install), verifies the remote hash, and writes a line to `~/.siftcoder/sync.ndjson`.

**When to reach for it:** you're switching laptops and want yesterday's memory + checkpoints on the new one. Or your team is federating memories across installs and the nightly sync needs to run.

**Why over alternatives:** `rsync` or a manual `tar` skips the redaction step and the post-transfer hash verify. Both are easy to skip until something corrupts silently. The discipline (redact, verify, ledger) is the value.

**Invocation:** `/sync s3://my-bucket/siftcoder/` or `/sync local`

---

### `/siftcoder:monitor` { #monitor }

_Source: `skills/meta/monitor/SKILL.md`_


**One-line purpose.** Health monitoring config for the daemon and external deps.

Audits what's currently monitoring (the built-in `monitors/memory-daemon-health.mjs` pings UDS every 30s, writes to `~/.siftcoder/health.ndjson`). Recommends additions based on stack — Ollama latency, Anthropic rate-limit, disk space on the memory store, WAL size. Authors custom monitors as `monitors/<name>.mjs` following the existing pattern, then aggregates a weekly digest.

**When to reach for it:** your daemon went down silently overnight and you only noticed when retrieval started failing. You want a probe + alert before the next outage.

**Why over alternatives:** ad-hoc `ping` scripts work but don't aggregate or persist. Plugin has no native monitor system; this skill provides the structured pattern (lightweight, append-only ndjson, fail-silent on probe crash).

**Invocation:** `/monitor audit` or `/monitor add ollama-latency`

---

### `/siftcoder:chroot` { #chroot }

_Source: `skills/workflow/chroot/SKILL.md`_


**One-line purpose.** Tighter file-access jail than `/scope` — explicit list, not glob patterns.

User passes glob patterns (with negations like `!src/auth/secrets/**`). `ChrootManager.setChroot` in `src/services/chroot.ts` expands them to an explicit file list at jail-set time and persists that list to `.siftcoder/chroot.json`. Tooling calls `checkFile(path)` to enforce. Files added to disk after the jail is set are NOT auto-included.

**When to reach for it:** you're doing a deep refactor on exactly twelve files and you want the AI blocked from drifting into a thirteenth — even one matching the same glob.

**Why over alternatives:** `/scope` is pattern-based and stays flexible as new files appear. Chroot is rigid by design. Use chroot when rigidity is the feature, not the bug.

**Invocation:** `/chroot set "src/auth/**/*.ts" "!src/auth/secrets/**"`

---

### `/siftcoder:compress` { #compress }

_Source: `skills/meta/compression/SKILL.md`_


**One-line purpose.** Output compression mode with preserved load-bearing detail.

Toggles a session-wide style: `lite`, `full` (default compact), `ultra` (fragments OK), `dense` (audits with all evidence kept), `handoff` (structured state block), `commit`, `review`, or `off`. Drops articles, hedging, pleasantries; keeps file paths, error messages, version numbers, commands, and any security/safety caveats verbatim. If the `sift-compress` companion plugin is installed, this skill defers to its hooks for cross-compaction persistence.

**When to reach for it:** long sessions where the chat is eating context budget faster than the actual work. Or when piping output to another agent that prefers terse input.

**Why over alternatives:** "be concise" instructions degrade over a long session. This skill names the mode explicitly and lists the compress-vs-keep rules so behaviour is auditable.

**Invocation:** `/compress dense` or `/compress off`

---

### `/siftcoder:prompt` { #prompt }

_Source: `skills/meta/prompt/SKILL.md`_


**One-line purpose.** Crafts a prompt — for a SiftCoder skill, a generic LLM, or a person.

Three modes: `for-skill` (turns vague intent into the right `/siftcoder:<skill>` invocation by routing through the meta decision tree), `for-llm` (generic prompt engineering: clear task, structured input, explicit output shape), `for-person` (audience + goal + decision needed + deadline). Output is copy-paste ready, not advice about how to write prompts.

**When to reach for it:** you're about to ask an Opus session for a long analysis and want the prompt tightened first. Or you're writing a PR review request to a teammate and want it framed for action.

**Why over alternatives:** CC will help write a prompt but tends to lecture. This skill produces the actual text in one shot, mode-aware.

**Invocation:** `/prompt for-llm "analyse this Apex trigger for governor-limit risk"`

---

### `/siftcoder:empathy` { #empathy }

_Source: `skills/quality/empathy/SKILL.md`_


**One-line purpose.** Reviews code from the next reader's perspective and ranks friction by reader pain.

Pick a reader persona (default: "engineer joining the team next week, has 2 hours to orient"). Score each file/function 1-5 on naming, length, indentation depth, implicit context, surprises, doc coverage. Multiply by use-frequency to get the top-10 friction list. Recommend smallest-change-highest-impact fixes — a rename beats a refactor, a comment beats a rename if naming would break ABI.

**When to reach for it:** you've inherited a 50k-line Apex codebase with no Selector/Domain layer and you need to know what's actually hurting new hires versus what just *looks* ugly.

**Why over alternatives:** linters flag style. `/zen` chases elegance. Empathy weights by who hits the friction and how often, so you fix the painful hot path first instead of the elegant cold path.

**Invocation:** `/empathy "src/auth/" reader=new-hire`

---

### `/siftcoder:examples` { #examples }

_Source: `commands/examples.md`_


**One-line purpose.** Real session traces showing skills in action.

Pointer command. Surfaces curated traces from `docs/EXAMPLES.md` — bug fix with memory grounding, Salesforce architecture review, surprise-me weekend ideation, pause + resume across sessions, codemap-trust pre-flight, memory-grounded ideate. The argument filters traces by topic.

**When to reach for it:** you've installed SiftCoder, read the architecture doc, and want to see what an actual `/oracle` → `/fix` → `/checkpoint` chain looks like in someone else's transcript before trying it on your own code.

**Why over alternatives:** the per-skill SKILL.md tells you the contract. Examples show how the contracts compose across a real session — useful when you're picking which skills to chain.

**Invocation:** `/examples pause` or `/examples`

---

## Reasoning

### `/siftcoder:archaeologist` { #archaeologist }

_Source: `skills/reasoning/archaeologist/SKILL.md`_


**One-line purpose.** Triangulates git history, memory, and current usage to explain why code exists.

Three passes: `mem_search` (or `mem_why`) for prior decisions; `git log --follow -p` and `git log -S "<symbol>"` for the introducing commit; `Grep` for current callers. Synthesises one paragraph naming origin, evolution, current dependents, and whether the code is still earning its keep. Cites SHAs, summary IDs, file:line. Read-only.

**When to reach for it:** you find a 200-line Apex method with a comment that says "DO NOT DELETE" and no other context. You want to know whether the warning is still load-bearing.

**Why over alternatives:** `git blame` shows the current author, not the original reasoning. Memory alone may be stale. The interesting cases are where memory and git disagree — only triangulation surfaces those.

**Invocation:** `/archaeologist "src/auth/legacy.ts:45"`

---

### `/siftcoder:duck` { #duck }

_Source: `skills/reasoning/duck/SKILL.md`_


**One-line purpose.** Rubber-duck mode — the user explains, the AI asks one question at a time and refuses to solve.

Inverts the normal solver default. Sets the contract up front ("I won't fix this; you will"), then asks one specific question per turn — probing for hand-waves, unstated assumptions, skipped steps, hidden invariants. Stops piling on the moment the user says "oh, I see it."

**When to reach for it:** you're stuck on a bug that you suspect is in your mental model rather than the code. Explaining it to the AI forces decomposition that reading silently doesn't.

**Why over alternatives:** CC's default is to leap to the answer. Duck withholds it on purpose. The breakthrough comes from your explanation, not the AI's analysis — which is the point of rubber-duck debugging.

**Invocation:** `/duck "this token refresh is firing twice"`

---

### `/siftcoder:ghost` { #ghost }

_Source: `skills/reasoning/ghost/SKILL.md`_


**One-line purpose.** Implements an alternative version in isolation, then compares honestly to main.

Crystallises the variant in one sentence ("what if we used X instead of Y"), creates a worktree (`git worktree add ../ghost-<topic>`), branch, or `.ghost.<ext>` placeholder file. Implements the variant inside isolation, runs the same tests, measures LOC/perf/readability against main side-by-side, and produces a verdict — merge candidate or scratch — with a cleanup command.

**When to reach for it:** you're genuinely uncertain whether a different data model would simplify the codebase, and you need to see both shapes side-by-side before committing.

**Why over alternatives:** vanilla "let me try a refactor" almost always leaks half-merged state into main. Ghost enforces the isolation + cleanup contract so explorations stay explorations.

**Invocation:** `/ghost "what if Order owned LineItems instead of Cart"`

---

### `/siftcoder:oracle` { #oracle }

_Source: `skills/reasoning/oracle/SKILL.md`_


**One-line purpose.** Predicts the next 1-3 likely actions from recent activity plus memory patterns.

Reads last ~10 turns, current branch, last commits, current open file. Runs `mem_search` for similar past contexts and looks at what the user did *after* being in this state historically. Outputs three ranked hypotheses with confidence (low/med/high) and the suggested invocation. Surface only — never executes.

**When to reach for it:** you're at the start of a session, you know there's something obvious to do next, but you can't quite name it. Oracle names it from your history.

**Why over alternatives:** CC responds to what you ask. Oracle proactively names what you'd likely ask, grounded in *your* prior sessions — not a generic recommendation.

**Invocation:** `/oracle`

---

### `/siftcoder:dream` { #dream }

_Source: `skills/reasoning/dream/SKILL.md`_


**One-line purpose.** Unconstrained generative exploration with no shipping intent.

Frames the topic, generates 5-10 ideas across counterfactual / maximalist / inversion / borrowed / absurd lenses, rates each with a "heat" emoji from gut. Captures the session as `kind: dream` so it doesn't pollute decision-search later. Refuses to do feasibility analysis or write code — that kills the dream.

**When to reach for it:** stuck in a should-we-ship-X-or-Y rut and you need to widen the option space before committing.

**Why over alternatives:** CC defaults to grounded, practical responses. `/ideate` is memory-grounded and practical. Dream is the explicit permission to be unconstrained — different mode, different output.

**Invocation:** `/dream "what if our scheduler had no fixed cadence"`

---

### `/siftcoder:fortune` { #fortune }

_Source: `skills/reasoning/fortune/SKILL.md`_


**One-line purpose.** Forecasts which tech debt will hurt, ranked by severity × probability ÷ time-to-pain.

Inventories debt signals (TODO/FIXME comments, long functions, files with > 5 distinct authors, low coverage + high churn, deprecation warnings, pinned old deps, commented-out code). Scores each on 1-5 severity, 1-5 probability of biting in next 6 months, weeks-to-pain. Decay-weights by recent commit activity. Outputs the top 10 plus a *cold list* — debt that's safe to leave.

**When to reach for it:** quarterly debt-paydown planning. You have a stack of TODOs and need to know which three will actually cost you something soon.

**Why over alternatives:** listing every TODO is what every linter does. The ranking — and the cold list naming what to leave alone — is the value.

**Invocation:** `/fortune "src/billing/"`

---

### `/siftcoder:narrator` { #narrator }

_Source: `skills/reasoning/narrator/SKILL.md`_


**One-line purpose.** Code-to-story translation with layered detail, gated by audience pull.

Picks an audience mode (non-tech, mixed, tech) — asks once if unspecified. Top layer is 1-3 sentences in plain English, outcome-focused, no code. Layer 2 (offered, not pushed) names architecture without code. Layer 3 (offered) gives actual files and functions. Stops when the audience stops asking.

**When to reach for it:** stakeholder demo where the PM wants to know what the new feature does, but might pull on the architecture if they're curious. You don't want to dump tech detail before they ask.

**Why over alternatives:** CC defaults to a tech depth it guesses from cues, often wrong. Narrator forces explicit audience selection plus pull-don't-push layering — cleanly stops at the right level.

**Invocation:** `/narrator "checkout flow" audience=non-tech`

---

## Spec

### `/siftcoder:spec-from-stories` { #spec-from-stories }

_Source: `skills/spec/spec-from-stories/SKILL.md`_


**One-line purpose.** Recovers a coherent spec from a pile of user stories or tickets.

User pastes 3-15 related stories. Skill clusters them by capability, distils the underlying capability per cluster, maps each story to a slice, surfaces gaps (capability requires X but no story addresses it) and overlaps (multiple stories saying the same thing). Output is a standard spec — overview, actors, behaviour, AC — with each AC backlinked to the originating story IDs.

**When to reach for it:** PM dropped 12 Linear tickets in the channel and asked "is this a coherent feature?" You want to know what the underlying capability is and what's missing.

**Why over alternatives:** CC will summarise stories as a list. It won't cluster by capability, surface outliers, or backlink ACs to source stories — which is the part that makes the spec auditable back to the request.

**Invocation:** `/spec-from-stories STORY-1 STORY-2 ...`

---

### `/siftcoder:improve-spec` { #improve-spec }

_Source: `skills/spec/improve-spec/SKILL.md`_


**One-line purpose.** Annotates a spec in place with ambiguities, testable AC, and edge cases.

Reads the spec, quotes sections back, sweeps for unbounded quantifiers ("fast", "many"), passive voice hiding actors, missing units, tense ambiguity. For each behaviour bullet, proposes 1-3 testable acceptance criteria tagged unit/integration/manual. Enumerates edge cases (empty/null, large input, concurrency, downstream failures, auth boundaries, time boundaries). Adds a non-goals section if missing. Annotates inline; doesn't rewrite the user's voice.

**When to reach for it:** you have a draft PRD and you want to know what a careful reviewer would flag before you send it to engineering.

**Why over alternatives:** CC critiques on request but produces prose. This skill produces structured annotations that map cleanly to spec sections — easier to act on.

**Invocation:** `/improve-spec docs/specs/buy-now.md`

---

### `/siftcoder:reverse-spec` { #reverse-spec }

_Source: `skills/spec/reverse-spec/SKILL.md`_


**One-line purpose.** Extracts a spec FROM existing code with confidence labels.

Walks the public surface (entry points, params, return shapes, side effects), aggregates test names as one-line behaviour assertions, names triggers and outcomes for each non-trivial code branch. Synthesises a spec in the same shape `improve-spec` produces. Every claim labelled with confidence: high (test-backed), medium (code-only), low (inferred from comment). AC lines cite the test file:line.

**When to reach for it:** you've inherited an undocumented service and need a spec for compliance evidence — or for a migration where the target team is asking "what does this thing actually do?"

**Why over alternatives:** CC will summarise code. It won't separate test-backed claims from code-only inference — and that distinction matters when the spec is going to an auditor.

**Invocation:** `/reverse-spec "src/services/billing/"`

---

### `/siftcoder:gap-analysis` { #gap-analysis }

_Source: `skills/spec/gap-analysis/SKILL.md`_


**One-line purpose.** Names what was promised but not built, with severity and effort.

Establishes a target (spec doc, AC checklist, architecture diagram, prior implementation in another repo) and an actual (current code, tests, docs, ops). Matches item by item — present ✓, partial ⚠, missing ✗. Severity per gap: blocker / high / medium / low. Effort estimate per gap. Cites both target quote and actual evidence (or "not found in <searched paths>").

**When to reach for it:** mid-migration where you need to know which capabilities from the legacy system aren't yet rebuilt — and which are partial enough to be dangerous.

**Why over alternatives:** vanilla "compare these two" produces prose. Gap-analysis produces a target ↔ actual matrix with severity that feeds prioritisation directly.

**Invocation:** `/gap-analysis target=docs/specs/billing.md actual=src/billing/`

---

### `/siftcoder:feasibility` { #feasibility }

_Source: `skills/spec/feasibility/SKILL.md`_


**One-line purpose.** One-page go/no-go memo with three-point estimates and a forced recommendation.

Restates the proposal in one sentence (if it doesn't fit, scope is too broad — split). Effort in best/likely/worst buckets. Risk register: top 3-5 risks with probability, impact, mitigation, owner. Confidence (low/med/high) with the driver named — has similar work been done? `mem_search` for prior outcomes adjusts confidence. Recommendation: GO / NO-GO / GO-with-conditions. Picks one — never punts.

**When to reach for it:** lead engineer asks "can we ship X by EOQ?" and you need a one-pager for the next standup, not a technical study.

**Why over alternatives:** CC will discuss feasibility. It will hedge. This skill forces three estimates plus a single recommendation, which turns the discussion into a decision.

**Invocation:** `/feasibility "migrate billing from Stripe to Adyen by Q3"`

## Quality

### `/siftcoder:blast-radius` { #blast-radius }

_Source: `skills/quality/blast-radius/SKILL.md`_


**One-line purpose.** Pre-merge damage assessment scored on five axes.

The skill categorises a change (local, module, cross-cutting, infra, external-facing), then probes data, availability, security, trust, and reversibility on a 0-3 scale. Output is a short report listing existing safeguards per non-zero axis and concrete pre-merge gates plus post-merge metrics to watch.

**When to reach for it:** before merging a schema migration, or when a small-looking diff touches an auth path.

**Why over alternatives:** `/ripple` answers "what else needs to change"; blast-radius answers "what breaks if this is wrong". The two pair, they don't substitute.

**Invocation:** ```/siftcoder:blast-radius PR #482 — token refresh path```

### `/siftcoder:chaos` { #chaos }

_Source: `skills/quality/chaos/SKILL.md`_


**One-line purpose.** Stack-aware failure-injection scenarios with expected behaviour and observability assertions.

Detects the actual dependencies (DBs, queues, caches, external APIs), brainstorms slow / down / wrong / flaky / partial failure modes, and emits a runbook keyed by priority. Each scenario names a trigger, expected UX, expected observability signal, and recovery path.

**When to reach for it:** preparing a game day, or before adding a new external dependency to a P0 path.

**Why over alternatives:** `/siftcoder:test` writes assertions for known behaviour; `/fuzz-mind` mines edge inputs; `/invariant` surfaces unstated contracts. Chaos targets infrastructure failure modes, not input space.

**Invocation:** ```/siftcoder:chaos payments service```

### `/siftcoder:comply` { #comply }

_Source: `skills/quality/comply/SKILL.md`_


**One-line purpose.** Control-mapped compliance review against SOC2, HIPAA, GDPR, or PCI-DSS.

Picks the framework, walks each named control, and maps to file:line evidence (or flags missing evidence as a gap). Output is per-control status (implemented / partial / gap) with severity, remediation effort, and a roll-up summary.

**When to reach for it:** pre-audit dry run, or scoping the work before kicking off a SOC2 Type 2.

**Why over alternatives:** `/siftcoder:security` is a lighter ad-hoc pass that flags vulnerabilities without naming controls. Comply is framework-shaped — it produces output an auditor can consume.

**Invocation:** ```/siftcoder:comply soc2 --scope CC6```

### `/siftcoder:empathy` { #empathy }

_Source: `skills/quality/empathy/SKILL.md`_


**One-line purpose.** Cognitive-load review from the next reader's perspective.

Picks a reader persona (default: new hire with two hours), probes naming, length, indentation, implicit context, surprise, and doc coverage. Each finding gets a 1-5 pain score weighted by use-frequency, and recommendations skew toward smallest-change-highest-impact (rename beats refactor).

**When to reach for it:** before onboarding someone, or when a module keeps eating reviewer time.

**Why over alternatives:** `/review` checks correctness on a PR. `/siftcoder:zen` chases elegance. Empathy ranks by reader pain, not architectural taste.

**Invocation:** ```/siftcoder:empathy src/billing/```

### `/siftcoder:fuzz-mind` { #fuzz-mind }

_Source: `skills/quality/fuzz-mind/SKILL.md`_


**One-line purpose.** Targeted adversarial test inputs that aim at unstated invariants.

Reads a function, mines its implicit assumptions (length, numeric ranges, encoding, time, concurrency, file presence), and generates the ten inputs most likely to expose bugs. Writes tests with explicit expected behaviour and runs them; failures are reported as findings.

**When to reach for it:** hardening a parser, validating a serialisation boundary, or shaking out a function before exposing it as a public API.

**Why over alternatives:** `/test` writes coverage for known behaviour; `/chaos` injects infra failures; `/invariant` documents contracts. Fuzz-mind beats random fuzzing because it targets the structure that random inputs rarely reach.

**Invocation:** ```/siftcoder:fuzz-mind src/parsers/csv.ts```

### `/siftcoder:invariant` { #invariant }

_Source: `skills/quality/invariant/SKILL.md`_


**One-line purpose.** Surface implicit contracts and turn them into types, asserts, or docs.

Walks code looking for seams — unchecked indexing, unnarrowed casts, ordering assumptions, timezone or encoding assumptions — and infers the rule the code silently follows. Picks enforcement (compile-time first, runtime assert second, doc last) and applies the smallest change.

**When to reach for it:** stabilising a hot path, or before extracting code into a shared library.

**Why over alternatives:** `/test` exercises behaviour; `/fuzz-mind` finds bugs with adversarial inputs; `/chaos` covers infra. Invariant makes hidden rules legible without changing behaviour.

**Invocation:** ```/siftcoder:invariant src/scheduler/queue.ts```

### `/siftcoder:polyglot` { #polyglot }

_Source: `skills/quality/polyglot/SKILL.md`_


**One-line purpose.** Cross-language consistency check at boundary points.

Maps every language-crossing boundary (HTTP, queue messages, shared config, env vars, generated bindings), extracts the contract on each side, and flags drift — typos, type mismatches, casing inconsistencies, optionality mismatches. Recommends codegen for high-volume boundaries, validation for the rest.

**When to reach for it:** TS frontend talking to a Python backend, or a Bash deploy script reading config a Go service writes.

**Why over alternatives:** `/codemap` documents structure within a language. Polyglot lives at the wire, where conventions break.

**Invocation:** ```/siftcoder:polyglot --boundaries http,env```

### `/siftcoder:ripple` { #ripple }

_Source: `skills/quality/ripple/SKILL.md`_


**One-line purpose.** Change-impact map before you commit a signature change.

Walks the call graph from the symbol or schema you're changing, categorises hits as producers / consumers / tests / docs / generated, and adds a one-hop transitive pass. Pulls memory for prior similar changes so the pre-flight checklist includes items past misses surfaced.

**When to reach for it:** renaming a public method, changing an endpoint shape, or moving a config key.

**Why over alternatives:** `/blast-radius` rates damage if a change is buggy. Ripple enumerates the touch points so the change is correct in the first place.

**Invocation:** ```/siftcoder:ripple mem_search```

### `/siftcoder:timewarp` { #timewarp }

_Source: `skills/quality/timewarp/SKILL.md`_


**One-line purpose.** Reconstruct past codebase state in a worktree without touching current work.

Takes a SHA, date, ref, or "before X" expression and creates a git worktree at that point. Reproduces the build, answers the question, optionally diffs against current, and removes the worktree on exit.

**When to reach for it:** "what did this look like before the auth refactor", or reproducing a bug that exists at v1.0.7 but not main.

**Why over alternatives:** `git checkout <sha>` in the active workspace blows away uncommitted state. Timewarp enforces worktree isolation and cleanup.

**Invocation:** ```/siftcoder:timewarp before "auth refactor"```

## Docs

### `/siftcoder:codemap` { #codemap }

_Source: `skills/docs/codemap/SKILL.md`_


**One-line purpose.** Evidence-based codebase doc with confidence labels per module.

Surveys top-level structure, inventories each module (LOC, coverage, last-touched, public API, deps), draws a mermaid dependency graph, and surfaces hotspots where high churn meets low coverage. Confidence labels (high / med / low) come with reasoning, not vibes.

**When to reach for it:** writing or refreshing `ARCHITECTURE.md` for a real codebase.

**Why over alternatives:** `/codemap-fast` is the same idea time-bounded. `/document` covers other doc types (API ref, runbook). Codemap is the architecture flavour with measured signals.

**Invocation:** ```/siftcoder:codemap```

### `/siftcoder:codemap-diff` { #codemap-diff }

_Source: `skills/docs/codemap-diff/SKILL.md`_


**One-line purpose.** Semantic diff between two refs — module, API, dep, and graph deltas.

Worktrees both refs (or one + active), runs `/codemap` on each, then compares modules added or removed, public API changes, dependency edges, and external deps. Emits migration notes whenever the public API changed.

**When to reach for it:** release notes, post-rebase sanity check, or comparing a feature branch to main before merge.

**Why over alternatives:** `git diff` is line-level and misses architectural shape. Codemap-diff stays at module + API granularity.

**Invocation:** ```/siftcoder:codemap-diff main feature/services```

### `/siftcoder:codemap-export` { #codemap-export }

_Source: `skills/docs/codemap-export/SKILL.md`_


**One-line purpose.** Machine-readable JSON codemap for downstream tooling.

Runs the codemap pass internally and serialises to a versioned schema (modules with LOC, coverage, deps, confidence; graph edges; hotspots) at `codemap.json`. Schema is `version: '1'` and field names are stable.

**When to reach for it:** feeding a dashboard, drift monitor, or CI check that needs structured codebase metadata.

**Why over alternatives:** `/codemap` produces markdown for humans. Export is the same data for tools.

**Invocation:** ```/siftcoder:codemap-export --out artifacts/codemap.json```

### `/siftcoder:codemap-fast` { #codemap-fast }

_Source: `skills/docs/codemap-fast/SKILL.md`_


**One-line purpose.** Thirty-second top-level orientation for an unfamiliar repo.

Lists top-level dirs, reads `package.json` (or equivalent), and assigns a one-line description per directory — inferred from README or naming, with the inferred ones flagged. No diagrams, no deep reads, time-bounded.

**When to reach for it:** first thirty seconds in a repo you've never seen.

**Why over alternatives:** `/codemap` is the deep version that takes minutes. Fast is the "tell me what's here" pass; if you need more, it points you to the full codemap.

**Invocation:** ```/siftcoder:codemap-fast```

### `/siftcoder:codemap-trust` { #codemap-trust }

_Source: `skills/docs/codemap-trust/SKILL.md`_


**One-line purpose.** Per-module trust scores from coverage, churn, bus factor, incidents, deps, and type strictness.

Extracts each signal via Bash (coverage report, git log, type-check output), scores 0-5, aggregates, and names the strongest positive and negative for each module. Modules under 3 land in a risk register with mitigations.

**When to reach for it:** picking which module to harden next, or telling a new team where the dragons live.

**Why over alternatives:** `/codemap` describes structure. Codemap-trust ranks modules by how much you can rely on them — different question.

**Invocation:** ```/siftcoder:codemap-trust```

### `/siftcoder:document` { #document }

_Source: `skills/docs/document/SKILL.md`_


**One-line purpose.** Generate doc-type-aware documentation (architecture, API, user manual, technical, runbook, migration).

Picks the document type, runs a source pass tuned to that type (code reads, test names, incident memory, changelog), and writes to that type's expected shape. Every claim cites file:line, commit, or memory id; examples in API docs are runnable.

**When to reach for it:** writing a runbook from incident memory, or an API ref from codegen output.

**Why over alternatives:** `/codemap` is one specific doc type (architecture). Document spans the rest and enforces audience-matched shape.

**Invocation:** ```/siftcoder:document runbook --topic "daemon restart"```

### `/siftcoder:update-codemaps` { #update-codemaps }

_Source: `skills/docs/update-codemaps/SKILL.md`_


**One-line purpose.** Refresh architecture diagrams incrementally, only redrawing what drifted.

Locates existing mermaid sources or ASCII trees, detects drift since last generation (added or removed dirs, > 30% LOC change, new external deps), and edits only the affected diagrams. Verifies each depicted node still exists before committing.

**When to reach for it:** after a structural refactor, when the diagrams in `ARCHITECTURE.md` no longer match.

**Why over alternatives:** regenerating from scratch loses manual annotations. This skill keeps annotations and only redraws the changed parts.

**Invocation:** ```/siftcoder:update-codemaps```

### `/siftcoder:update-docs` { #update-docs }

_Source: `skills/docs/update-docs/SKILL.md`_


**One-line purpose.** Detect and fix doc-vs-code drift one claim at a time.

Inventories README, ARCHITECTURE, `docs/`, CHANGELOG, and public-API comments; mines each claim (paths, symbols, commands, version numbers, config keys); and verifies against the live repo. Each stale claim gets a suggested fix that the user approves before it lands.

**When to reach for it:** after any rename, path move, or config-schema change.

**Why over alternatives:** generated docs (typedoc, swagger) regen via tool. Update-docs handles hand-curated markdown, where rot is invisible until someone reads.

**Invocation:** ```/siftcoder:update-docs```

## Knowledge

### `/siftcoder:knowledge` { #knowledge }

_Source: `skills/knowledge/knowledge/SKILL.md`_


**One-line purpose.** Whole-store memory inventory — what's known, what's drifting, what's new.

Snapshots totals by kind (decisions, patterns, incidents, refactors), clusters summaries semantically, classifies hot / warm / cold by retrieval recency, and samples each cluster to flag stale entries (file gone, symbol missing). Compares to the previous snapshot when one exists.

**When to reach for it:** weekly or monthly memory hygiene; never auto-prunes.

**Why over alternatives:** `mem_search` answers one query. `/search` federates code + memory + docs for one query. Knowledge takes inventory of the entire memory store.

**Invocation:** ```/siftcoder:knowledge```

### `/siftcoder:memory-usage` { #memory-usage }

_Source: `skills/knowledge/memory-usage/SKILL.md`_


**One-line purpose.** Reference for how to actually use the memory MCP tools.

Documents `mem_search`, `mem_get`, `mem_timeline`, `mem_why`, and `mem_drain` — when to pick which, the search-before-assume habit, the verify-before-acting habit, and the "don't dump raw results to the user" rule. Loads automatically when a query needs memory.

**When to reach for it:** any session where the user references prior decisions ("why is X this way", "what did we decide").

**Why over alternatives:** this is the playbook the other knowledge skills assume. It's not a workflow itself — it's the manual.

**Invocation:** loaded automatically; no slash command surfaced for direct invocation.

### `/siftcoder:pattern-learn` { #pattern-learn }

_Source: `skills/knowledge/pattern-learn/SKILL.md`_


**One-line purpose.** Extract a reusable pattern from concrete code and capture it with provenance.

Takes a commit, file, PR, or chat block; distils a 2-4 word name, the problem it solves, a code template with placeholders, when-to-use triggers, and an explicit anti-trigger. Captures to memory with `kind: pattern` so future `mem_search` retrieves it.

**When to reach for it:** after writing the second or third instance of the same shape — that's when it earns being a pattern.

**Why over alternatives:** writing it in a doc loses provenance. Pattern-learn keeps the link from pattern to source.

**Invocation:** ```/siftcoder:pattern-learn --source HEAD```

### `/siftcoder:pattern-search` { #pattern-search }

_Source: `skills/knowledge/pattern-search/SKILL.md`_


**One-line purpose.** Find captured patterns relevant to current work.

Runs `mem_search { kind: pattern, k: 5 }` on the user's intent expressed as a problem, verifies each hit still applies (paths exist, syntax current), and recommends apply, adapt, or "no match — consider `/pattern-learn` afterwards".

**When to reach for it:** "have we got a pattern for paginated query results", or before reinventing a bulk-safe trigger handler.

**Why over alternatives:** general `mem_search` returns everything; `/search` federates sources. Pattern-search filters to the captured-pattern subset.

**Invocation:** ```/siftcoder:pattern-search "OAuth callback"```

### `/siftcoder:search` { #search }

_Source: `skills/knowledge/search/SKILL.md`_


**One-line purpose.** Federated search across code, memory, and docs with one query.

Parses the query, dispatches `Grep` over the project, `mem_search` over memory, and another `Grep` over `docs/` and root markdown. Merges with reciprocal rank fusion, applies a recency boost to memory hits only, and emits the top ten with explicit `[code]`, `[mem]`, or `[docs]` labels.

**When to reach for it:** "find every reference to `mem_why`" — code, captured decisions, and docs in one shot.

**Why over alternatives:** `Grep` is code-only and exact. `mem_search` is memory-only. `/knowledge` curates the memory store, doesn't query. Search is the one-query-three-sources hybrid; `/archaeologist` (in chunk 2) goes deeper on git history specifically.

**Invocation:** ```/siftcoder:search "rate limiter"```

wrote 22 skills to /tmp/skills-chunk-4.md (quality: 9, docs: 8, knowledge: 5)

## Salesforce

### `/siftcoder:sf-agentforce` { #sf-agentforce }

_Source: `skills/salesforce/salesforce-agentforce/SKILL.md`_


**One-line purpose.** Build Agentforce agents, topics, actions, and prompt templates with the right metadata shapes.

The skill walks through action authoring (Apex, Flow, or prompt-template), enforces strict input/output schemas so the Atlas reasoning engine can dispatch them, and produces the `genAiPlugin`/`genAiFunction`/`genAiPromptTemplate` metadata files plus a test plan with eval cases. It also keeps Trust Layer policy (PII masking, audit, retention) in the loop rather than letting it drift.

**When to reach for it:** spinning up a new Service agent topic with three Apex actions, or moving a hardcoded prompt into a grounded prompt template.

**Why over alternatives:** plain CC will write Apex but won't know that Atlas needs deterministic action signatures or that prompt actions must ground from records, not invented data.

**Invocation:** ```/siftcoder:sf-agentforce add ServiceAgent action LookupContract```

### `/siftcoder:sf-apex` { #sf-apex }

_Source: `skills/salesforce/salesforce-apex/SKILL.md`_


**One-line purpose.** Apex domain rules — bulk-safety, FFLib patterns, governor limits, CRUD/FLS, test discipline.

Provides the patterns CC should enforce (no SOQL/DML in loops, `with sharing` default, FFLib Selector/Domain/Service/UnitOfWork past trivial size) plus a governor-limits cheat sheet, security checklist, and test-factory rules. The skill is read alongside Plan/Explore/general-purpose; it does not write code by itself.

**When to reach for it:** any time you're touching `.cls` or `.trigger` files and want the rule set applied consistently.

**Why over alternatives:** generic coding skills miss Apex-specific footguns like trigger-body logic, hardcoded record-type ids, or `try { } catch (Exception e) { }` swallowing.

**Invocation:** ```/siftcoder:sf-apex review src/classes/PaymentProcessor.cls```

### `/siftcoder:sf-architect` { #sf-architect }

_Source: `skills/salesforce/salesforce-architecture/SKILL.md`_


**One-line purpose.** Org-level architecture review — capacity, sharing, integrations, tech debt.

Runs a structured pass: capacity table (storage, users, custom objects, API calls, async slots) with soft-signal thresholds; sharing/security review across OWD through Apex managed sharing; integration-pattern picks (sync vs platform events vs Pub/Sub); tech-debt scoring against coverage, trigger count, Flow count, hardcoded ids. Produces a one-page summary, risk register, and roadmap with Mermaid diagrams.

**When to reach for it:** quarterly health check on a mature org, or due-diligence before an M&A integration.

**Why over alternatives:** CC will write SF code but won't naturally produce the capacity/risk/roadmap shape with the right thresholds baked in.

**Invocation:** ```/siftcoder:sf-architect review```

### `/siftcoder:sf-comply` { #sf-comply }

_Source: `skills/salesforce/salesforce-comply/SKILL.md`_


**One-line purpose.** Industry-cloud compliance mapping — HIPAA, FedRAMP, FINRA, FERPA — to Salesforce config.

Detects the industry cloud (Health, FSC, Public Sector, Education) from project metadata, fetches the relevant control set, and maps each control to org configuration: sharing model, Shield Encryption, field-level audit, login policies, retention. Output flags each control as implemented, partial, or gap with cited evidence.

**When to reach for it:** Health Cloud audit, FedRAMP Moderate readiness, or a FINRA control review on FSC.

**Why over alternatives:** vs the generic `/security` skill (chunk 2) — that one runs OWASP across any stack and won't know Salesforce-specific evidence. `sf-comply` cites sharing rules, profile metadata, FLS, Shield encryption schemes — the things an SF auditor actually wants. Use both for regulated SF orgs.

**Invocation:** ```/siftcoder:sf-comply hipaa```

### `/siftcoder:sf-cpq` { #sf-cpq }

_Source: `skills/salesforce/salesforce-cpq/SKILL.md`_


**One-line purpose.** CPQ (Steelbrick) work — bundles, price rules, quote templates, approvals, amendments.

Knows the calculator pipeline (Configurator → Pre-Calc → Calc → Post-Calc → On Save) and the typical workflows: adding products to a bundle, building price rules with correct evaluation order, structuring quote templates with conditional sections. Flags Revenue Cloud as the migration target for greenfield work and estimates effort if the org is moving.

**When to reach for it:** debugging why a discount isn't applying, or designing a multi-product bundle with subscription pricing.

**Why over alternatives:** CC won't know Twin Field semantics, Discount Schedule patterns, or that Apex triggers on `SBQQ__QuoteLine__c` clash with the calculator order.

**Invocation:** ```/siftcoder:sf-cpq price-rule QuoteLine.Discount```

### `/siftcoder:sf-deploy` { #sf-deploy }

_Source: `skills/salesforce/salesforce-deploy/SKILL.md`_


**One-line purpose.** Deploy SF metadata via the `sf` CLI — validate, preview, deploy, rollback strategy.

Wraps the standard sfdx flow: `sf org login web`, `project deploy validate` with `RunLocalTests`, `project deploy preview` to see adds/changes/deletes, then `quick` deploy from a validated job-id. Covers test-level picks per environment, common deploy errors (destructive change order, coverage failures, profile FLS diffs), and the "no native rollback" reality with practical mitigation patterns.

**When to reach for it:** preparing a production deploy, or chasing a `Cannot find component` error from a sandbox push.

**Why over alternatives:** CC will run `sf` commands but won't naturally validate-then-preview-then-quick or warn about test-level mismatches per target env.

**Invocation:** ```/siftcoder:sf-deploy validate --target-org uat```

### `/siftcoder:sf-einstein` { #sf-einstein }

_Source: `skills/salesforce/salesforce-einstein/SKILL.md`_


**One-line purpose.** Einstein Discovery, Prediction Builder, NBA, Prompt Builder — model lifecycle with bias and Trust Layer review.

Runs Discovery model setup (target field, dataset, fit metrics, drift monitoring), prompt-template authoring across the five template types (Field/Email/Sales-Email/Flex/Record-Summary), and embedding into Lightning pages or Flows. Bias review is part of the quality gate, not optional. Flags Einstein Bots as legacy and routes new chatbot work to Agentforce.

**When to reach for it:** building a churn-prediction Discovery model, or surfacing a Record Summary prompt on the Account page.

**Why over alternatives:** CC discusses ML generically; this skill knows Discovery model fit metrics, Prompt Builder template types, and Einstein capacity per edition.

**Invocation:** ```/siftcoder:sf-einstein discovery churn```

### `/siftcoder:sf-flow` { #sf-flow }

_Source: `skills/salesforce/salesforce-flow/SKILL.md`_


**One-line purpose.** Flow Builder discipline — bulk-safe patterns, fault paths, Before-Save vs After-Save trade-offs.

Walks through record-triggered flow construction with bulkified bodies (Get → Loop → Add to collection → single DML at end), mandatory fault paths on every DML, sub-flow consolidation for reuse, and Apex test classes that verify behaviour at 200+ records. Calls out Process Builder migration and the multiple-flow-per-object ordering trap.

**When to reach for it:** rebuilding a Process Builder rule as Flow, or fixing a flow that fails on bulk inserts.

**Why over alternatives:** CC will draw flow diagrams but won't enforce DML-at-end discipline, fault-path coverage, or the Before-Save same-record-only constraint.

**Invocation:** ```/siftcoder:sf-flow record-triggered Account before-save```

### `/siftcoder:sf-lwc` { #sf-lwc }

_Source: `skills/salesforce/salesforce-lwc/SKILL.md`_


**One-line purpose.** Lightning Web Component patterns — wires, events, lifecycle, performance, jest testing.

Covers reactive `@wire` params with `$` binding, `refreshApex` after DML, event composition (when `composed: true` is needed), the lifecycle order with the `_initialized` guard for `renderedCallback`, mutable state re-assignment for reactivity, and jest mocking via `registerLdsTestWireAdapter` / `createApexTestWireAdapter`. Common bugs section names the four most frequent ones with fixes.

**When to reach for it:** building a new LWC that wires an Apex method, or chasing a "wire not firing" symptom.

**Why over alternatives:** CC writes JS but won't know LWC's shadow-DOM event boundaries or that primitives no longer need `@track`.

**Invocation:** ```/siftcoder:lwc create accountSummary```

### `/siftcoder:sf-security` { #sf-security }

_Source: `skills/salesforce/salesforce-security/SKILL.md`_


**One-line purpose.** SF-specific security review — sharing, CRUD/FLS, SOQL injection, callout secrets, Shield Encryption.

Runs per-stack-layer threat modelling: Apex (SOQL injection, sharing leaks, secrets in code), LWC/VF (XSS, `@AuraEnabled` exposure), config (OWD, profile permissions, Named Credentials), integrations (HMAC on inbound, Named Cred on outbound). Findings cite file:line, severity, repro, and fix. Cross-references prior incident memory.

**When to reach for it:** pre-prod security pass on an Apex+LWC feature, or chasing a sharing-bypass complaint.

**Why over alternatives:** built-in `/security-review` runs OWASP generically. This one knows `with sharing` discipline, `WITH SECURITY_ENFORCED`, Shield capacity, and the LWC/VF-specific XSS variants. Run both for full coverage.

**Invocation:** ```/siftcoder:sf-security review src/classes/```

### `/siftcoder:sf-test` { #sf-test }

_Source: `skills/salesforce/salesforce-test/SKILL.md`_


**One-line purpose.** Apex test generation, data factories, sandbox sanitisation, coverage analysis.

Enforces 75% hard floor / 85% PR floor, behaviour-coverage over line-coverage, one factory per object pattern with bulk-by-default `Integer n` params, 200-record bulk verification, `Test.startTest()`/`stopTest()` discipline, and `System.runAs(...)` for setup-object DML. Includes sandbox masking patterns for full-copy refreshes and HTTP callout mocking via `Test.setMock`.

**When to reach for it:** raising coverage on a class touched in a PR, or writing the first test for a new trigger.

**Why over alternatives:** CC will write tests but won't naturally bulkify factories, mock at 200, or catch `MIXED_DML_OPERATION` traps.

**Invocation:** ```/siftcoder:sf-test generate src/classes/OrderProcessor.cls```

### `/siftcoder:schema-migrate` { #schema-migrate }

_Source: `skills/salesforce/schema-migrate/SKILL.md`_


**One-line purpose.** SF metadata migration plan — diff, risk, pre-deploy transform, rollback, reconciliation.

Per-object diff (fields added/removed/type-changed, relationships, picklists, validation rules), risk classification (breaking/lossy/safe), pre-deploy data transforms for lossy changes, validation+preview+deploy sequence, post-deploy reconciliation queries, and explicit per-change rollback (flagging non-reversible changes loudly). Different from `/migrate` which moves data rows.

**When to reach for it:** changing an Industry text field to a picklist, or shrinking a field length on a populated object.

**Why over alternatives:** CC will deploy metadata on request but won't structure the diff×risk×pre-deploy×rollback shape with reconciliation queries.

**Invocation:** ```/siftcoder:schema-migrate plan force-app/main/default/objects/Account```

## Meta

### `/siftcoder:analyze` { #analyze }

_Source: `skills/meta/analyze/SKILL.md`_


**One-line purpose.** Generic structured analysis with mode picks — complexity, churn, risk, dep-health, naming, surface-area.

User picks a mode (or the skill picks based on phrasing), the right tool runs (`eslint --rule complexity`, `git log --shortstat`, `npm audit`), top 10 results are ranked with mode-relevant scores and concrete recommendations. Surfaces; does not auto-fix. Mode discipline is the point — readability uses Flesch-Kincaid for prose, cognitive load for code, never one for the other.

**When to reach for it:** "what are the most complex functions in this repo", or "which files churn the most".

**Why over alternatives:** plain CC analysis tends to give vague aggregate scores; this skill ranks per-item with named refactors.

**Invocation:** ```/siftcoder:analyze complexity```

### `/siftcoder:budget` { #budget }

_Source: `skills/meta/budget/SKILL.md`_


**One-line purpose.** Token and USD budget tracking with warnings, reports, and optimisation recommendations.

Backed by the `Budget` class in `src/services/tokens.ts`. Sub-modes: `set <limit>`, `status`, `report` (per skill/agent/model), `optimise` (recommends model downsizing, prompt caching, output compression, Ollama substitution with estimated savings). Persists to `~/.siftcoder/budget.json`. Warn at 80%, hard-stop at 100%.

**When to reach for it:** kicking off a long `/autonomous` run, or wondering where last week's tokens went.

**Why over alternatives:** CC has no native budget tracking. Useful when token spend can grow unboundedly.

**Invocation:** ```/siftcoder:budget set 1000000 session```

### `/siftcoder:compression` { #compression }

_Source: `skills/meta/compression/SKILL.md`_


**One-line purpose.** Output compression mode — drops filler, keeps signal (commands, paths, errors, decisions).

Modes: lite, full (default), ultra, dense, handoff, commit, review, off. Drops pleasantries, hedge words, articles when clarity holds. Keeps technical terms, code blocks, error messages, file paths, version numbers, risk labels exact. Never compresses security warnings, irreversible-action confirmations, or final user-facing instructions. Persists across the session.

**When to reach for it:** long sessions where you want terse engineering output, or producing a handoff block for another agent.

**Why over alternatives:** generic "be brief" instructions lose the discipline. This mode-set keeps causality and evidence intact.

**Invocation:** ```/siftcoder:compress dense```

### `/siftcoder:local-llm-setup` { #local-llm-setup }

_Source: `skills/meta/local-llm-setup/SKILL.md`_


**One-line purpose.** Wire up Ollama as the SiftCoder summarisation/embedding backend to cut steady-state token cost ~50×.

Walks through Ollama install (brew or curl), pulls `nomic-embed-text` for embeddings and `llama3.2:3b` or `llama3.1:8b` for summaries, verifies via `curl /api/tags`, runs `siftcoder setup`, sets env (`SIFTCODER_DRAIN_BACKEND=ollama`, `SIFTCODER_EMBEDDER=ollama`). Troubleshoots low-confidence escalation, embedding-dim mismatches, WSL host reachability.

**When to reach for it:** first-time SiftCoder setup, or after API costs spiked.

**Why over alternatives:** the cascade is documented in scattered places — this skill is the single happy path.

**Invocation:** ```/siftcoder:local-llm-setup```

### `/siftcoder:monitor` { #monitor }

_Source: `skills/meta/monitor/SKILL.md`_


**One-line purpose.** Health monitoring for the SiftCoder daemon, memory store, and external deps.

Pairs with `monitors/` directory. Built-in `memory-daemon-health.mjs` pings the UDS every 30s and writes `~/.siftcoder/health.ndjson`. The skill audits what's running, recommends additions per stack (Ollama latency, Anthropic rate-limit, disk space, WAL size), authors custom monitors in the existing pattern, and produces a weekly digest.

**When to reach for it:** after a daemon hang, or before relying on SiftCoder for a long autonomous run.

**Why over alternatives:** CC has no native plugin monitoring; this is the framework.

**Invocation:** ```/siftcoder:monitor audit```

### `/siftcoder:onboard` { #onboard }

_Source: `skills/meta/onboard/SKILL.md`_


**One-line purpose.** First-session SiftCoder walkthrough — opinionated, single happy path, < 5 min to working.

Detects state (plugin installed, Ollama running, Anthropic key set, daemon up, project `.siftcoder/` present), recommends one path based on what's there, runs `siftcoder setup` and starts the daemon, optionally backfills from prior CC transcripts, ends with a real first task suggestion (`/siftcoder:reverse-prompt quick`).

**When to reach for it:** brand-new install, or onboarding a teammate.

**Why over alternatives:** detect-don't-ask discipline beats long menus. CC has no native plugin onboarding.

**Invocation:** ```/siftcoder:onboard```

### `/siftcoder:prompt` { #prompt }

_Source: `skills/meta/prompt/SKILL.md`_


**One-line purpose.** Craft a copy-paste-ready prompt — for a SiftCoder skill, an LLM, or a person.

Three modes: for-skill (intent → right `/siftcoder:<skill>` invocation with args), for-llm (clear task, structured input, explicit output shape, constraints, examples), for-person (audience, goal, decision needed, deadline, team-norm tone). Output is the prompt itself, not advice about prompts.

**When to reach for it:** "rephrase this for the AI", or drafting a PR-review request to a teammate.

**Why over alternatives:** generic prompt-engineering advice produces lectures; this produces text you can paste.

**Invocation:** ```/siftcoder:prompt for-llm "extract dates from messy text"```

### `/siftcoder:quality-check` { #quality-check }

_Source: `skills/meta/quality-check/SKILL.md`_


**One-line purpose.** On-demand format + lint + type-check (and optionally tests) — replaces always-on hooks.

Detects tooling at project root (prettier, eslint, tsc, mypy, ruff, cargo, sf code-analyzer) and runs them in parallel via Bash, reporting a compact summary. Tests skipped unless asked. Fixes failures unless told report-only. Prior plugins ran this on every Write/Edit and added 3.5min of latency per edit; this is the deliberate-trigger replacement.

**When to reach for it:** "is this clean?" after a chunk of edits, or right before commit.

**Why over alternatives:** PostToolUse-hook chains are too slow per edit; this lets you batch.

**Invocation:** ```/siftcoder:quality```

### `/siftcoder:siftcoder` { #siftcoder }

_Source: `skills/meta/siftcoder/SKILL.md`_


**One-line purpose.** Meta decision tree — "which SiftCoder skill applies to what I just said".

Quick triage table maps natural-language phrasings ("fix this bug", "review this PR", "is it secure", "what does this do") to the right skill in `coding/`, `review/`, `quality/`, `reasoning/`, `salesforce/`, etc. When ambiguous, asks once and commits. Always hands off — never solves in the meta skill.

**When to reach for it:** unsure which command fits, or training someone on the skill catalogue.

**Why over alternatives:** CC chooses paths organically. This is the explicit decision tree for users who want the official answer.

**Invocation:** ```/siftcoder:siftcoder "I want to know what could break"```

### `/siftcoder:sync` { #sync }

_Source: `skills/meta/sync/SKILL.md`_


**One-line purpose.** Push local SiftCoder state (memory, patterns, checkpoints) to backup or team peer.

Targets: local tarball (`~/Backups/siftcoder/<ts>.tar.gz`), cloud bucket (S3/GCS/Azure/Wasabi with user creds), team federation peer. Pre-flight snapshots memory at a consistent point, applies redaction via `src/memory/privacy.ts`, computes hash. Transfer with retry. Verify hash post-transfer. Logs every sync to `~/.siftcoder/sync.ndjson`.

**When to reach for it:** weekly backup, or sharing captured patterns across machines.

**Why over alternatives:** CC has no native sync. Discipline (redact, verify, ledger) is the value.

**Invocation:** ```/siftcoder:sync s3://my-bucket/siftcoder```

### `/siftcoder:team` { #team }

_Source: `skills/meta/team/SKILL.md`_


**One-line purpose.** Team-knowledge federation — share patterns and decisions across teammates' SiftCoder installs.

Picks topology (centralised shared daemon vs federated per-user with sync), sets pattern visibility (`private` / `team` / `public`), wires decision broadcasting at a priority threshold, enforces PII redaction at workspace boundaries. Federation is opt-in; local memory works without it.

**When to reach for it:** standing up SiftCoder across a four-person team that wants shared captured patterns.

**Why over alternatives:** CC has no native cross-user memory. SiftCoder's engine supports it; this skill provides operational discipline.

**Invocation:** ```/siftcoder:team setup federated```

### `/siftcoder:trace` { #trace }

_Source: `skills/meta/trace/SKILL.md`_


**One-line purpose.** Post-hoc audit — what the assistant did, what it considered, why it picked one option.

Walks the last N turns, lists tool calls + outcomes, memory queries, subagent dispatches, user-visible output. Annotates decision points with named alternatives ("Chose investigate over fix because phrasing was diagnostic"). Lists memory writes for the audit trail.

**When to reach for it:** post-incident review, or trust-building with a user new to AI dev.

**Why over alternatives:** CC executes; tracing isn't natural to its output. This skill produces it explicitly.

**Invocation:** ```/siftcoder:trace last-20```

### `/siftcoder:wizard` { #wizard }

_Source: `skills/meta/wizard/SKILL.md`_


**One-line purpose.** Guided multi-step interactive flow — one decision per step, branches on answers, summary before apply.

Built-ins: `memory-setup` (Ollama probe + Anthropic key + scope), `salesforce-onboard` (sfdx + deploy targets + test policy), `release-prep` (version + changelog + tag), `migration` (backfill + verification). Each step poses one decision with 2-4 named options, default highlighted, consequences explicit. User can `^C` anywhere; prior decisions saved to memory for resume.

**When to reach for it:** first-time complex setup, or release prep where you want a checklist that gates the next step.

**Why over alternatives:** vs `/focus` (advisory attention narrowing) and `/scope` (memory-side filtering) and `/chroot` in workflow (hard write boundary) — wizard is per-decision dialogue, not attention or boundary control. `/focus` softly narrows what the assistant pays attention to; `/scope` filters memory retrieval; `/chroot` (workflow) hard-blocks Write/Edit outside a path. Wizard is for setup/exploration where each answer changes what's asked next.

**Invocation:** ```/siftcoder:wizard memory-setup```

wrote 25 skills to /tmp/skills-chunk-3.md (salesforce: 12, meta: 13)

---

## Writing your own skill

If a workflow you do twice a week isn't covered, write a skill. Three things you need:

1. A directory under `skills/<category>/<your-skill>/`.
2. A `SKILL.md` with frontmatter (name, description, allowed-tools) and a body that tells Claude what to do step by step.
3. Optional: a matching `commands/<your-skill>.md` if you want a `/siftcoder:<your-skill>` slash command, plus a `commands/mem.md`-style argument-hint if you want sub-actions.

The fastest path is to copy an existing skill close to what you want and edit it. `skills/coding/fix/SKILL.md` is a good template for a workflow skill. `skills/salesforce/salesforce-deploy/SKILL.md` is a good template for a domain skill that wraps a CLI. The `siftplugin:skill` slash command (from the SiftPlugin sibling project) scaffolds the directory and frontmatter for you.

After writing, run `/siftplugin:lint` to validate frontmatter shape, then test by invoking the skill in a real session and watching whether Claude reaches for it without prompting. If it doesn't, the description is probably too vague — Claude picks skills by matching their description against the user's intent, so the description has to read like the user's question.