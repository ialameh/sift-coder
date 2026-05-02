# Slash commands

Slash commands in Claude Code are markdown files. The frontmatter declares which tools the command is allowed to call and an argument hint for the picker; the body is the prompt that gets pushed into the conversation when you type the slash. There is no plugin runtime in between — when you type `/siftcoder:fix`, Claude Code finds `commands/fix.md`, applies its frontmatter as policy for the next turn, and feeds the body into the model with `$ARGUMENTS` substituted for whatever you typed after the command name. The `siftcoder:` prefix is just the plugin's namespace; every file in `commands/` becomes `/siftcoder:<filename>` automatically. A handful of commands are first-class — they have argument grammars, sub-actions, and direct shell calls (`mem`, `sf-deploy`, `apex-patterns`, `lwc`, `quality`, `status`, `compress`, `budget`, `bridge`, `narrator`, `surprise-me`, `ideate`, `wizard`, `reverse-prompt`, `debug`, `perf`, `test`, `build-fix`, `schema`, `schema-migrate`, `sf-test`, `sf-debug`, `sf-connect`, `sf-package`, `sf-webhook`, `sf-architect`, `lwc-debug`, `pattern-list`, `focus`, `organize-project`). The rest are pointers — a few lines of frontmatter and a one-liner that hands `$ARGUMENTS` to a same-named skill in `skills/`. SiftCoder also exposes a few non-namespaced helpers used by the broader plugin ecosystem (`/init`, `/review`, `/security-review`, `/commit`); those live in upstream Claude Code or other plugins and aren't part of this index, but you'll see them in your picker alongside the SiftCoder set.

This page is the full reference. Every command file under `commands/` is here, exactly once, organised by what you're trying to do rather than alphabetically. If you know the command's name, the index table below jumps you to its section.

## Index

| Command | One-liner | Category |
|---|---|---|
| [`/siftcoder:mem`](#siftcodermem) | Daemon control — start/stop/status/drain/info/web/prune | Memory and search |
| [`/siftcoder:status`](#siftcoderstatus) | Daemon + memory + scope + focus snapshot in one screen | Memory and search |
| [`/siftcoder:search`](#siftcodersearch) | Federated search across code, memory, docs | Memory and search |
| [`/siftcoder:knowledge`](#siftcoderknowledge) | Curate org/project-wide knowledge bundles | Memory and search |
| [`/siftcoder:archaeologist`](#siftcoderarchaeologist) | Why does this exist? Triangulate git, memory, code | Memory and search |
| [`/siftcoder:trace`](#siftcodertrace) | Surface what AI did during a session | Memory and search |
| [`/siftcoder:timewarp`](#siftcodertimewarp) | Reconstruct codebase state at a past commit | Memory and search |
| [`/siftcoder:ripple`](#siftcoderripple) | If I change X, what else changes | Memory and search |
| [`/siftcoder:blast-radius`](#siftcoderblast-radius) | Pre-merge "what could go wrong if this is buggy" | Memory and search |
| [`/siftcoder:codemap`](#siftcodercodemap) | Evidence-based codebase documentation | Memory and search |
| [`/siftcoder:codemap-fast`](#siftcodercodemap-fast) | ~30s structural scan of an unfamiliar repo | Memory and search |
| [`/siftcoder:codemap-diff`](#siftcodercodemap-diff) | Compare two refs/branches semantically | Memory and search |
| [`/siftcoder:codemap-export`](#siftcodercodemap-export) | Export codemap as machine-readable JSON | Memory and search |
| [`/siftcoder:codemap-trust`](#siftcodercodemap-trust) | Confidence and risk per module | Memory and search |
| [`/siftcoder:update-codemaps`](#siftcoderupdate-codemaps) | Regenerate diagrams after structural changes | Memory and search |
| [`/siftcoder:pattern-learn`](#siftcoderpattern-learn) | Save a reusable pattern from recent work | Memory and search |
| [`/siftcoder:pattern-search`](#siftcoderpattern-search) | Find captured patterns by query | Memory and search |
| [`/siftcoder:pattern-list`](#siftcoderpattern-list) | List captured patterns | Memory and search |
| [`/siftcoder:add-feature`](#siftcoderadd-feature) | Incremental new capability — smaller than build, bigger than fix | Daily workflow |
| [`/siftcoder:fix`](#siftcoderfix) | Bounded-scope bug fix with regression test | Daily workflow |
| [`/siftcoder:investigate`](#siftcoderinvestigate) | Read-only diagnosis — hypothesis, evidence, conclusion | Daily workflow |
| [`/siftcoder:debug`](#siftcoderdebug) | Generic debugging — error/trace/repro/bisect/log | Daily workflow |
| [`/siftcoder:review`](#siftcoderreview) | SiftCoder-shaped code review (memory-aware) | Daily workflow |
| [`/siftcoder:tdd`](#siftcodertdd) | Strict red-green-refactor discipline | Daily workflow |
| [`/siftcoder:refactor`](#siftcoderrefactor) | Same behaviour, better structure (test-coverage-gated) | Daily workflow |
| [`/siftcoder:optimize`](#siftcoderoptimize) | Profile-driven performance fix | Daily workflow |
| [`/siftcoder:perf`](#siftcoderperf) | Dedicated performance profiling | Daily workflow |
| [`/siftcoder:test`](#siftcodertest) | Multi-modal test generation — unit, integration, e2e, property, mutation | Daily workflow |
| [`/siftcoder:build`](#siftcoderbuild) | Spec-first feature build | Daily workflow |
| [`/siftcoder:build-fix`](#siftcoderbuild-fix) | Auto-resolve build errors with minimal-diff fix | Daily workflow |
| [`/siftcoder:heal`](#siftcoderheal) | Self-healing build/test loop | Daily workflow |
| [`/siftcoder:smart-retry`](#siftcodersmart-retry) | Retry with a different strategy | Daily workflow |
| [`/siftcoder:quality`](#siftcoderquality) | On-demand format / lint / typecheck | Daily workflow |
| [`/siftcoder:ideate`](#siftcoderideate) | Memory-aware feature ideation for current project | Planning and ideation |
| [`/siftcoder:surprise-me`](#siftcodersurprise-me) | Brand-new side-project ideas | Planning and ideation |
| [`/siftcoder:dream`](#siftcoderdream) | Unconstrained generative exploration | Planning and ideation |
| [`/siftcoder:fortune`](#siftcoderfortune) | Tech-debt forecast — which debt is about to bite | Planning and ideation |
| [`/siftcoder:oracle`](#siftcoderoracle) | Predictive intent inference | Planning and ideation |
| [`/siftcoder:feasibility`](#siftcoderfeasibility) | Go/no-go memo on a proposed change | Planning and ideation |
| [`/siftcoder:gap-analysis`](#siftcodergap-analysis) | Inventory of what's missing — spec to impl | Planning and ideation |
| [`/siftcoder:spec-from-stories`](#siftcoderspec-from-stories) | Derive a spec from user stories or tickets | Planning and ideation |
| [`/siftcoder:improve-spec`](#siftcoderimprove-spec) | Polish a spec — testable AC, surface ambiguity | Planning and ideation |
| [`/siftcoder:reverse-spec`](#siftcoderreverse-spec) | Extract spec FROM existing code | Planning and ideation |
| [`/siftcoder:narrator`](#siftcodernarrator) | Code-to-story translation for non-engineers | Planning and ideation |
| [`/siftcoder:agent`](#siftcoderagent) | Full agentic loop — planner, coder, qa-reviewer, qa-fixer with rollback | Multi-agent |
| [`/siftcoder:swarm`](#siftcoderswarm) | Parallel subagent dispatch with conflict gates | Multi-agent |
| [`/siftcoder:autonomous`](#siftcoderautonomous) | Long-running unattended runs with checkpoint and budget caps | Multi-agent |
| [`/siftcoder:pair`](#siftcoderpair) | Per-edit approval mode | Multi-agent |
| [`/siftcoder:duck`](#siftcoderduck) | Rubber-duck mode — AI asks, you explain | Multi-agent |
| [`/siftcoder:ghost`](#siftcoderghost) | "What if we did X instead" — alternative branch exploration | Multi-agent |
| [`/siftcoder:zen`](#siftcoderzen) | Aggressive simplification — delete-as-default | Multi-agent |
| [`/siftcoder:handoff`](#siftcoderhandoff) | End-of-session deliverable for the next person | Multi-agent |
| [`/siftcoder:continue`](#siftcodercontinue) | Resume from a paused session | Multi-agent |
| [`/siftcoder:pause`](#siftcoderpause) | Freeze session state with rich resumption context | Multi-agent |
| [`/siftcoder:security`](#siftcodersecurity) | Security review with project framing | Quality and review |
| [`/siftcoder:comply`](#siftcodercomply) | Compliance review (SOC2, HIPAA, GDPR, PCI) | Quality and review |
| [`/siftcoder:chaos`](#siftcoderchaos) | Failure-scenario design for resilience testing | Quality and review |
| [`/siftcoder:fuzz-mind`](#siftcoderfuzz-mind) | Adversarial edge-case test generation | Quality and review |
| [`/siftcoder:invariant`](#siftcoderinvariant) | Discover and externalise implicit invariants | Quality and review |
| [`/siftcoder:monitor`](#siftcodermonitor) | Health monitoring setup | Quality and review |
| [`/siftcoder:session-eval`](#siftcodersession-eval) | Post-session evaluation and pattern extraction | Quality and review |
| [`/siftcoder:empathy`](#siftcoderempathy) | Cognitive-load measurement | Quality and review |
| [`/siftcoder:analyze`](#siftcoderanalyze) | Generic analysis with structured output | Quality and review |
| [`/siftcoder:apex-patterns`](#siftcoderapex-patterns) | Generate FFLib Selector / Domain / Service / UoW | Salesforce |
| [`/siftcoder:schema`](#siftcoderschema) | Salesforce schema management | Salesforce |
| [`/siftcoder:schema-migrate`](#siftcoderschema-migrate) | Salesforce schema migration with deploy plan and rollback | Salesforce |
| [`/siftcoder:sf-deploy`](#siftcodersf-deploy) | Salesforce deploy — validate / deploy / diff / rollback | Salesforce |
| [`/siftcoder:sf-test`](#siftcodersf-test) | Salesforce test generation and coverage | Salesforce |
| [`/siftcoder:sf-architect`](#siftcodersf-architect) | Salesforce org-level architecture review | Salesforce |
| [`/siftcoder:sf-security`](#siftcodersf-security) | Salesforce-specific security review | Salesforce |
| [`/siftcoder:sf-debug`](#siftcodersf-debug) | Salesforce debug log analysis | Salesforce |
| [`/siftcoder:sf-comply`](#siftcodersf-comply) | Salesforce industry-cloud compliance | Salesforce |
| [`/siftcoder:sf-connect`](#siftcodersf-connect) | Named Credentials, External Credentials, OAuth | Salesforce |
| [`/siftcoder:sf-cpq`](#siftcodersf-cpq) | Salesforce CPQ work | Salesforce |
| [`/siftcoder:sf-flow`](#siftcodersf-flow) | Salesforce Flow Builder | Salesforce |
| [`/siftcoder:sf-agentforce`](#siftcodersf-agentforce) | Salesforce Agentforce work | Salesforce |
| [`/siftcoder:sf-einstein`](#siftcodersf-einstein) | Salesforce Einstein | Salesforce |
| [`/siftcoder:sf-package`](#siftcodersf-package) | Unlocked packages, versioning, dependencies | Salesforce |
| [`/siftcoder:sf-webhook`](#siftcodersf-webhook) | Inbound webhooks — Apex REST + HMAC | Salesforce |
| [`/siftcoder:lwc`](#siftcoderlwc) | Lightning Web Component create/debug/wire/event | Salesforce |
| [`/siftcoder:lwc-debug`](#siftcoderlwc-debug) | Dispatch the lwc-debugger agent | Salesforce |
| [`/siftcoder:document`](#siftcoderdocument) | Generate documentation in a named shape | Documentation |
| [`/siftcoder:update-docs`](#siftcoderupdate-docs) | Sync docs to code | Documentation |
| [`/siftcoder:organize-project`](#siftcoderorganize-project) | Assess and improve folder/file layout | Project structure |
| [`/siftcoder:focus`](#siftcoderfocus) | Narrow attention to a feature/file set (advisory) | Project structure |
| [`/siftcoder:scope`](#siftcoderscope) | Edit `.siftcoder/scope.json` (enforced) | Project structure |
| [`/siftcoder:chroot`](#siftcoderchroot) | Tighter file-access jail than scope | Project structure |
| [`/siftcoder:polyglot`](#siftcoderpolyglot) | Cross-language consistency | Project structure |
| [`/siftcoder:integrate`](#siftcoderintegrate) | Two-system integration design | Project structure |
| [`/siftcoder:migrate`](#siftcodermigrate) | Data migration with verify and rollback | Project structure |
| [`/siftcoder:bridge`](#siftcoderbridge) | Cross-codebase integration analysis | Project structure |
| [`/siftcoder:api`](#siftcoderapi) | API design — REST/GraphQL/gRPC | Project structure |
| [`/siftcoder:sync`](#siftcodersync) | Sync state to remote backup or team federation | Project structure |
| [`/siftcoder:preview`](#siftcoderpreview) | Diff-before-apply discipline | Project structure |
| [`/siftcoder:checkpoint`](#siftcodercheckpoint) | Save a named savepoint with intent + scope + memory pin | Project structure |
| [`/siftcoder:team`](#siftcoderteam) | Team knowledge sharing | Project structure |
| [`/siftcoder:onboard`](#siftcoderonboard) | First-time SiftCoder setup walk | Orientation and meta |
| [`/siftcoder:help`](#siftcoderhelp) | SiftCoder help index | Orientation and meta |
| [`/siftcoder:config`](#siftcoderconfig) | Interactive config wrapper | Orientation and meta |
| [`/siftcoder:wizard`](#siftcoderwizard) | Guided multi-step interactive flow | Orientation and meta |
| [`/siftcoder:examples`](#siftcoderexamples) | Real session traces | Orientation and meta |
| [`/siftcoder:use-cases`](#siftcoderuse-cases) | Use-cases by developer / problem / task size | Orientation and meta |
| [`/siftcoder:compress`](#siftcodercompress) | Toggle output compression | Orientation and meta |
| [`/siftcoder:prompt`](#siftcoderprompt) | Craft a better prompt | Orientation and meta |
| [`/siftcoder:reverse-prompt`](#siftcoderreverse-prompt) | Generate a single prompt that rebuilds this project | Orientation and meta |
| [`/siftcoder:budget`](#siftcoderbudget) | Token and cost budget tracking | Orientation and meta |
| [`/siftcoder:siftcoder`](#siftcodersiftcoder) | Decision-tree skill — "which SiftCoder skill should I use for X" | Orientation and meta |

That is 107 entries, matching the count of files in `commands/`.

---

## Memory and search

These are the commands you reach for when you need to know something — about the codebase, about your own past sessions, about how a system fits together. None of them write production code; most are read-only.

### `/siftcoder:mem`

**The single entry point for the memory daemon.** One command, ten verbs, all of them shelling out to `bin/siftcoder.mjs`. This is the only command in SiftCoder where the body is a `Bash` invocation rather than a prompt for the LLM — it's a thin CLI wrapper.

The verbs split into three groups: lifecycle (`start`, `stop`, `check`, `setup`), inspection (`status`, `info`, `version`, `list`, `web`), and maintenance (`drain`, `backfill`, `prune`). Lifecycle verbs talk to the systemd-style supervisor; inspection verbs talk to the daemon over its Unix domain socket; maintenance verbs typically open the SQLite file directly.

| Action | Effect |
|---|---|
| `start` | Spawn the daemon detached. Idempotent — safe to call when already running. |
| `stop` | Stop the daemon for this workspace. Other workspaces' daemons continue. |
| `status` | Health, event/summary/embedding counts, backend cascade choices. |
| `info [--json]` | Full runtime details — version, pid, uptime, namespace, workspace key, paths, backends, db size. |
| `version` | Print version only. |
| `check` | Verify reachable; auto-start if not. Used by hooks. |
| `setup` | Interactive first-time setup — Ollama probe, Anthropic key, defaults. |
| `drain [batch]` | Force a consolidation pass (default batch=32). |
| `backfill [source]` | Replay past Claude Code transcripts into the store. |
| `web` | Print the web UI URL. |
| `list` | List recent summaries on stdout. |
| `prune --confirm` | Run the memory-curator agent and prune flagged rows. Requires explicit `--confirm`. |

**Reach for it when** the daemon is misbehaving, you want to inspect what was captured, or you need to bootstrap memory from old transcripts after installing SiftCoder for the first time. `mem backfill` is especially useful right after install — it pulls in months of past work so the memory pass on day one isn't an empty set.

**Why over `/siftcoder:status`?** `status` is a snapshot meant for humans glancing at the bar — it summarises daemon, memory, focus, and scope in one view. `mem status` is the same data without the focus/scope overlay, plus the backend cascade. Use `status` for "how healthy is everything", `mem status` when you suspect the daemon specifically.

```
/siftcoder:mem status
/siftcoder:mem info --json
/siftcoder:mem drain 64
/siftcoder:mem backfill transcripts
/siftcoder:mem prune --confirm
```

Sample output for `status`:

```
daemon:    running (pid 41273, up 3h12m)
namespace: default
workspace: a3f1c2b4d5e6
events:    18,432 total — 0 raw, 18,432 summarised
summaries: 6,108
embeddings:6,108 (up to date)
backends:  summarise=ollama:llama3.2:3b  embed=ollama:nomic-embed-text
```

### `/siftcoder:status`

**Quick orientation snapshot — daemon, memory, focus, scope, workspace.** Wraps `mem status` and adds the project-level state (active focus profile, active scope file). Read-only. Two seconds.

Use it at the start of a session to verify nothing is broken before you start typing real work, and at the end to confirm the day's events made it into summaries. It's the closest thing SiftCoder has to a `git status` for memory.

**Why not just `/siftcoder:mem status`?** `status` adds focus and scope on top — the things that affect what Claude can see and write. If `mem status` is "the daemon view", `status` is "the developer view".

```
/siftcoder:status
```

```
daemon:    running (pid 41273)
events:    18,432  summaries: 6,108  embeddings: 6,108
focus:     auth-rewrite (src/auth/**, tests/auth/**)
scope:     src/**, tests/**, docs/**
workspace: a3f1c2b4d5e6 (default)
```

### `/siftcoder:search`

**Federated search across code, memory, and docs in one query.** Hits Grep over the working tree, the `mem_search` MCP tool over summaries, and the markdown under `docs/` — fuses the results with reciprocal rank fusion, and labels each hit by source. Pass `--code`, `--memory`, or `--docs` to restrict to one leg.

**When to reach for it:** you remember discussing the rate limiter last month but you can't remember whether the conversation was a code change, a doc, or just a chat — `search "rate limiter token bucket"` finds all three at once.

**Why over `/siftcoder:knowledge`?** `search` is for finding hits. `knowledge` is for curating a body of knowledge — extracting durable facts from the messy transcript, pinning them, organising them by topic. Use `search` to ask a question; use `knowledge` when you want to package the answer.

**Why over `/siftcoder:archaeologist`?** `search` returns ranked hits. `archaeologist` reconstructs causality — why does this particular line of code exist, who introduced it, what discussion led to it. `search` is breadth, `archaeologist` is depth on a single artefact.

```
/siftcoder:search "rate limiter token bucket"
/siftcoder:search "JWT migration" --memory
```

Sample output shape:

```
[code]   src/middleware/rate.ts:42  — TokenBucket implementation
[mem]    2025-04-12 — discussed switching from leaky bucket to token bucket
[docs]   docs/architecture/rate-limiting.md — design doc
```

### `/siftcoder:knowledge`

**Curate org/project-wide knowledge bundles — extract durable facts from messy session memory and organise them by topic.** Pointer to the `knowledge` skill. Where memory is the firehose, knowledge is the library: hand-curated, topic-tagged, stable across sessions.

Reach for it when you've spent a week wrestling with a problem and want to crystallise what you learned into something the next person (or future you) can read in five minutes without scrolling through three days of transcripts.

```
/siftcoder:knowledge "auth token rotation lessons"
```

Output is a markdown bundle saved to `docs/knowledge/` with citations back to the originating sessions. See `skills/knowledge/knowledge/SKILL.md`.

### `/siftcoder:archaeologist`

**Why does this line exist? Triangulates git blame, captured memory, and code to reconstruct the decision.** Pointer to the `archaeologist` skill. Picks a target (line, function, file, config flag), pulls the surrounding history, and writes a narrative explaining the why.

The skill's discipline is to avoid speculation — every claim cites a commit, a captured session, or an explicit comment. If the trail goes cold, it says so.

**Reach for it when** you're staring at a weird-looking guard clause that nobody on the team remembers writing, and you want to know whether deleting it is safe before you do.

```
/siftcoder:archaeologist src/auth/middleware.ts:42
```

Output is a short narrative with citations. See `skills/coding/archaeologist/SKILL.md`.

### `/siftcoder:trace`

**Surface what AI did during a session — every Write, every command, every decision.** Pointer to the `trace` skill. Reads from `events` and `summaries` for the current session and renders a chronological view, optionally filtered by tool or path.

Useful at the end of a long autonomous run when you want to know what actually happened without rolling the transcript. Pairs with `/siftcoder:session-eval` — `trace` is the timeline, `session-eval` is the post-mortem.

```
/siftcoder:trace --since "2h ago"
/siftcoder:trace --paths "src/auth/**"
```

See `skills/coding/trace/SKILL.md`.

### `/siftcoder:timewarp`

**Reconstruct codebase state at a past commit, then ask questions of it.** Pointer to the `timewarp` skill. Takes a commit ref or a date, checks out a worktree (read-only), and answers questions in the context of that historical state without disturbing your working tree.

**Reach for it when** a regression appeared between two releases and you want to read the old code as it was, not as it is now. Or when you're writing release notes and want to know what changed.

```
/siftcoder:timewarp v1.4.0 "how did the auth middleware handle missing tokens"
```

See `skills/coding/timewarp/SKILL.md`.

### `/siftcoder:ripple`

**If I change X, what else changes — direct + transitive.** Pointer to the `ripple` skill. Walks call graphs, type references, and configuration consumers from a chosen seed and produces a list of every site that would have to be updated.

The output is structured: direct callers, transitive callers, configuration consumers, test files, documentation. Each leg has its own confidence rating.

**Reach for it before** renaming anything user-visible (a field, a public function, a config key) so you know the cost up front.

```
/siftcoder:ripple "rename UserToken.expiry to UserToken.expires_at"
```

See `skills/coding/ripple/SKILL.md`.

### `/siftcoder:blast-radius`

**Pre-merge "what could go wrong if this is buggy" assessment.** Pointer to the `blast-radius` skill. Looks at the staged diff, identifies the systems it touches, and produces a worst-case impact map: what fails, who notices, how it gets discovered.

Different from `ripple`, which traces *correctness* impact — what other code has to change. `blast-radius` traces *operational* impact — what breaks if the change is wrong.

**Reach for it before** merging a change to anything in the auth, billing, or data-write path. Or anything where you can't trivially roll back.

```
/siftcoder:blast-radius
```

See `skills/coding/blast-radius/SKILL.md`.

### `/siftcoder:codemap`

**Evidence-based codebase documentation — modules, contracts, dependencies, surface area.** Pointer to the `codemap` skill. Crawls the repo, extracts structure, and writes a navigable doc with diagrams. Slow (minutes) but thorough.

**Reach for it when** you're inheriting a codebase and want a real map before you start editing, or when onboarding a new engineer and you want them to read something that isn't five years out of date.

```
/siftcoder:codemap
/siftcoder:codemap --scope "src/payments/**"
```

See `skills/coding/codemap/SKILL.md`.

### `/siftcoder:codemap-fast`

**Same shape as `codemap` but ~30 seconds instead of minutes.** Skips deep analysis; produces a structural skeleton (directories, top-level modules, public surfaces) without contracts or call graphs.

**Why over `codemap`?** When you've just cloned a repo and want a sketch before you start asking real questions. The fast version is good enough for orientation; you upgrade to the full `codemap` once you know what you care about.

```
/siftcoder:codemap-fast
```

See `skills/coding/codemap-fast/SKILL.md`.

### `/siftcoder:codemap-diff`

**Compare two refs or branches semantically — not as a git diff but as a structural diff.** Renders modules added, removed, renamed; contracts changed; dependencies introduced or removed. The structural changelog you wish git produced.

**Reach for it when** doing a release-notes pass on a long-lived feature branch, or when reviewing a refactor PR where the textual diff is too large to read.

```
/siftcoder:codemap-diff main..feature/refactor-auth
```

See `skills/coding/codemap-diff/SKILL.md`.

### `/siftcoder:codemap-export`

**Dump the codemap as machine-readable JSON.** For piping into other tools — your own review scripts, a static-site generator, an LLM summary downstream.

```
/siftcoder:codemap-export --out codemap.json
```

See `skills/coding/codemap-export/SKILL.md`.

### `/siftcoder:codemap-trust`

**Per-module confidence and risk rating.** Pointer to the `codemap-trust` skill. For each module, it assigns a confidence (how sure are we this works?) and a risk (how bad if it doesn't?), grounded in test coverage, churn, recent bugs, and complexity.

**Reach for it before** an autonomous run touches a part of the codebase you don't know — a low-trust module is a sign to add tests first, or to widen the human-in-the-loop window.

```
/siftcoder:codemap-trust
```

See `skills/coding/codemap-trust/SKILL.md`.

### `/siftcoder:update-codemaps`

**Regenerate the diagrams in your codemap after structural changes.** Faster than re-running `codemap` from scratch — only refreshes the diagrams, leaves the prose alone.

```
/siftcoder:update-codemaps
```

See `skills/coding/update-codemaps/SKILL.md`.

### `/siftcoder:pattern-learn`

**Save a reusable pattern from recent work.** Looks at the last few captured sessions, identifies a structure that recurred, and saves it as a tagged pattern. The pattern stays in memory and is retrievable by name or by query.

**Reach for it when** you've just done something twice in a row that felt repetitive — `pattern-learn "command-with-rollback"` saves the shape so the third time you can pull it out instead of inventing again.

```
/siftcoder:pattern-learn "rest endpoint with HMAC verify"
```

See `skills/knowledge/pattern-learn/SKILL.md`.

### `/siftcoder:pattern-search`

**Find a captured pattern by query.** Same retrieval pipeline as `mem_search` but restricted to `kind=pattern`.

```
/siftcoder:pattern-search "webhook signature"
```

See `skills/knowledge/pattern-search/SKILL.md`.

### `/siftcoder:pattern-list`

**List all captured patterns.** Calls `mem_search { kind: "pattern" }` directly. Useful to see what you have before deciding whether to reuse or invent.

```
/siftcoder:pattern-list --family salesforce --limit 20
```

---

## Daily workflow

The commands you'll type most days. Most of them are pointers to skills under `skills/coding/`, but the discipline each enforces is what differentiates them — read those before you decide which one to use.

### `/siftcoder:add-feature`

**Add a new capability to an existing project — smaller than `build`, bigger than `fix`.** Pointer to the `add-feature` skill. Enforces a sequence: scope statement, impact map (call graph + ripple), feature-flag plan, implementation, tests, smoke run.

The skill refuses to expand into a refactor; if reorganisation is needed, it's surfaced as a follow-up task instead of folded in.

**Reach for it when** the work is "users should also be able to X". Not a bug. Not a from-scratch project. A capability that fits inside the existing architecture and needs to be wired through.

**Why over `/siftcoder:build`?** `build` runs a full spec-first cycle — discovery, spec, plan, implementation. Use it for net-new modules. `add-feature` skips the spec phase and assumes the architecture already exists.

**Why over `/siftcoder:fix`?** `fix` refuses to add capability — it's bug-only. If users are reporting "this is broken", that's `fix`. If they're reporting "this is missing", that's `add-feature`.

```
/siftcoder:add-feature "add SMS as a 2FA channel alongside TOTP"
```

### `/siftcoder:fix`

**Bounded-scope bug fix with regression test.** Pointer to the `fix` skill. Root-cause-first. The skill enforces:

1. Reproduce — get the failure to a deterministic command line.
2. Memory pass — has this been fixed before? Did the prior fix regress?
3. Hypothesise + verify before patching.
4. Smallest patch that addresses the cause, not the symptom.
5. Regression test that fails before, passes after.

The contract is "smallest patch + regression test". If the work expands beyond that, the skill stops and asks whether to switch into refactor or add-feature mode.

**Reach for it when** you have a reproducible bug and you want it gone with the least possible risk. Production hotfix territory, but also "this test has been red for two days".

**Why over `/siftcoder:debug`?** `debug` is diagnostic — it parses errors, traces stacks, finds the introducing commit, but it doesn't write the patch. `fix` does both — diagnoses *and* patches. Use `debug` when you don't yet know what's wrong; use `fix` when you have a reproducible bug and want it gone.

**Why over `/siftcoder:investigate`?** `investigate` is read-only. It produces an evidence ledger and a hypothesis tree — no code changes. `fix` writes the patch. The usual chain is `investigate` → `fix`: investigate first when root cause is unclear, then fix once you know what to do.

**Why over `/siftcoder:heal`?** `heal` is the multi-strategy retry loop for "the build is broken and I don't yet know why". It tries fixes, runs tests, backs out if they don't work, tries again. `fix` is hypothesis-driven and surgical. Use `heal` when you want to throw automation at a flaky build; use `fix` when you have a real bug that needs thinking through.

**Why over `/siftcoder:build-fix`?** `build-fix` is build-error-specific — type errors, missing imports, compilation failures. It's the narrow, fast fixer. `fix` is the general-purpose bug fixer.

```
/siftcoder:fix "rate limiter throws on empty bodies"
```

### `/siftcoder:investigate`

**Read-only diagnosis. Hypothesis-driven, evidence-cited.** Pointer to the `investigate` skill. Produces an evidence ledger and hypothesis tree. Does not touch the code.

The skill enforces:

1. State the question in one line.
2. Memory pass — has this been investigated before?
3. List 3-5 hypotheses, ordered by likelihood.
4. Evidence per hypothesis (line numbers, log lines, behaviour).
5. Conclusion + suggested next step.

**Reach for it when** you don't yet have a reproducer, or you have a theory but not yet evidence. Always before `/fix` if root cause is unclear.

**Example:** `/siftcoder:investigate "checkout latency p99 spikes on Tuesdays"`

Sample output shape:

```
Question: Why does p99 checkout latency spike on Tuesdays?

Hypotheses:
1. (45%) Tuesday batch job in the same DB instance.
   Evidence: cron_jobs table shows weekly_reconcile at Tue 09:00 UTC;
   p99 spike matches at 09:02-09:14 UTC in the last 8 weeks.
2. (30%) Marketing email burst → traffic spike on Tuesday morning.
   Evidence: marketing_send.log shows weekly campaign Tue 09:00 UTC.
3. (20%) ...

Suggested next step: read the weekly_reconcile job and check whether
it holds row locks on orders. If so, that's the cause.
```

### `/siftcoder:debug`

**Generic debugging — error analysis, stack trace parsing, repro design, git bisect, code tracing.** Has six sub-modes:

| Sub-mode | Effect |
|---|---|
| `error <quoted>` | Parse error message, classify, surface fix candidates. |
| `trace <stack>` | Map stack frames to source, find fault frame. |
| `repro <issue>` | Design deterministic reproduction. |
| `bisect <good> <bad>` | Find introducing commit (`git bisect`). |
| `trace-call <symbol>` | Instrument execution path; auto-clean instrumentation. |
| `log <pattern>` | Extract correlated events from a log dump. |

**Reach for it when** you have a symptom and need a tool that matches the shape of the question. Stack trace? `debug trace`. Error message? `debug error`. Don't know when it broke? `debug bisect`.

**Why over `/siftcoder:investigate`?** `debug` runs tools (parses logs, runs bisect, instruments code). `investigate` is a thinking discipline — hypothesise, gather evidence, conclude. Often you'll use both: `debug` to gather data, `investigate` to interpret it.

**Why over `/siftcoder:sf-debug`?** `sf-debug` is Salesforce-specific — it parses Apex debug logs, tracks governor limits, etc. `debug` is the general-purpose one.

```
/siftcoder:debug error "TypeError: Cannot read property 'id' of undefined"
/siftcoder:debug bisect v1.4.0 HEAD
/siftcoder:debug trace-call computeDiscount
```

### `/siftcoder:review`

**SiftCoder-shaped code review — memory-aware, project-aware.** Pointer to the `review` skill. Pulls prior decisions on similar code via `mem_search` and frames the review against project conventions, not just generic best-practice.

Complementary to the upstream `/review` command (which covers general best-practice). Use this one when reviewing code in a project that has specific conventions you've already discussed.

**Reach for it when** reviewing your own diff before pushing, or someone else's PR if you want a memory-aware critique. The skill won't approve a change if it conflicts with a prior decision still in memory.

**Why over `/siftcoder:security`?** `review` is broad — readability, conventions, error handling, tests. `security` is narrow — auth, data flow, input validation, secrets. Use both for high-stakes changes.

**Why over `/siftcoder:comply`?** `comply` is checklist-based against a specific framework (SOC2, HIPAA, GDPR, PCI). `review` is judgement-based.

```
/siftcoder:review
/siftcoder:review src/auth/middleware.ts
```

### `/siftcoder:tdd`

**Strict red-green-refactor.** Pointer to the `tdd` skill. Refuses to write production code before a failing test exists.

Per unit:

1. **Red.** One test asserting desired behaviour. Run, *must fail*.
2. **Green.** Simplest code that passes. Hardcoded values fine if tests permit.
3. **Refactor.** Improve structure, all tests still green.
4. Repeat.

If you slip and write code first, the skill calls it out — that's the contract.

**Reach for it when** you want the discipline. The classic "I have a clear spec for one unit and I want to evolve it test-first."

**Why over `/siftcoder:test`?** `test` is for *adding tests* to existing code (unit, integration, e2e, property, mutation, coverage). `tdd` is the *discipline* — tests-first, code-second. They're orthogonal; you can do TDD using `test` to generate the failing tests.

```
/siftcoder:tdd "PercentageDiscount: applies, caps at 100, refuses negative"
```

### `/siftcoder:refactor`

**Same behaviour, better structure — test-coverage-gated.** Pointer to the `refactor` skill. Refuses to refactor code without test coverage; first measures coverage, adds tests if needed, then refactors with the tests as the safety net.

**Reach for it when** you want to reshape something without changing what it does — extracting a function, splitting a class, renaming, simplifying. The coverage gate is non-negotiable: refactoring without tests is just hoping.

```
/siftcoder:refactor "extract OrderTotalCalculator from CartService"
```

### `/siftcoder:optimize`

**Profile-driven performance fix.** Pointer to the `optimize` skill. Refuses to optimise without a measurement first — runs `perf` (or accepts a baseline), identifies a hotspot, applies a fix, re-measures.

**Why over `/siftcoder:perf`?** `perf` measures and reports. `optimize` measures and *fixes*. The pair is `perf → optimize`: measure, then change.

```
/siftcoder:optimize "checkout endpoint p99"
```

### `/siftcoder:perf`

**Dedicated performance profiling — measure, profile, identify hotspots.** Multi-iteration, deterministic-workload, top-N hotspots. Output is a baseline plus a Pareto-ranked hotspot list.

The metric is configurable: `wall`, `cpu`, `mem`, `allocs`, `queries`, `net`. Default is wall time.

```
/siftcoder:perf checkout-endpoint --metric queries
```

Sample output:

```
baseline:  p50 124ms  p95 412ms  p99 1180ms  (n=1000)
hotspots:
  1. ProductRepo.findByIds  (32% wall, 540 SQL queries) — N+1 in line 84
  2. PriceCalculator.compute (18% wall, ~ 0 SQL)        — nested loop, line 51
  3. CartItem.toDTO          (11% wall, ~ 0 SQL)        — JSON serialise per item
```

### `/siftcoder:test`

**Multi-modal test generation — unit, integration, e2e, property, mutation, coverage, bulk.**

| Mode | Effect |
|---|---|
| `unit <target>` | Fast, isolated tests with full mocks. |
| `integration <target>` | Tests that hit the real boundaries (DB, external service double). |
| `e2e <target>` | End-to-end through the public surface. |
| `property <target>` | Property-based tests (fast-check / hypothesis / etc). |
| `mutation <target>` | Mutation testing — change the code, see if tests still pass; weak tests get flagged. |
| `coverage` | Coverage report, gap list. |
| `bulk <target>` | Salesforce bulk-pattern tests (200-record collections). |

**Why over `/siftcoder:tdd`?** `test` *generates* tests. `tdd` is the discipline of writing them first.

**Why over `/siftcoder:fuzz-mind`?** `fuzz-mind` generates *adversarial* edge cases — the test cases you'd never think of. `test property` generates property-based tests with a known invariant. They're complementary.

```
/siftcoder:test unit src/orders/OrderService.ts
/siftcoder:test mutation src/auth
/siftcoder:test coverage
```

### `/siftcoder:build`

**Spec-first feature build.** Pointer to the `build` skill. Runs the full discovery → spec → plan → implementation cycle. The heaviest of the building commands; the most likely to take an hour.

**Why over `/siftcoder:add-feature`?** `add-feature` skips the spec phase. `build` insists on a spec — useful when the work is large enough that "I'll figure it out" is too risky. Roughly: `add-feature` for a one-day capability, `build` for a week-long subsystem.

**Why over `/siftcoder:agent`?** `agent` is the autonomous version — once you have a plan, `agent` executes it without you. `build` keeps a human in the loop at each phase boundary.

```
/siftcoder:build "session-cookie auth replacing JWT"
```

### `/siftcoder:build-fix`

**Auto-resolve build errors with the smallest possible diff.** Classifies the first failure (cascade-pruned), hypothesises a minimal fix, applies, re-runs. Caps at 2 attempts; on the third, escalates to `/siftcoder:heal`.

**Reach for it when** the build went red with an obvious type error, a missing import, or a test snapshot drift. The kind of thing you'd fix in 30 seconds if you were watching.

**Why over `/siftcoder:heal`?** `build-fix` is bounded — 2 attempts, minimal diff, no architectural reshaping. `heal` is unbounded — multi-strategy retry loop. Start with `build-fix`; if it bails, `heal` takes over.

```
/siftcoder:build-fix
/siftcoder:build-fix "npm test"
```

Sample output:

```
attempt 1:
  classified: "Cannot find name 'UserToken'" (missing import)
  fix: add `import { UserToken } from './types'` to src/auth/jwt.ts
  result: build green
done.
```

### `/siftcoder:heal`

**Self-healing build/test loop.** Pointer to the `heal` skill. Multi-strategy: tries the obvious fix, runs the build; if still red, tries a different angle; if still red, backs out the change and tries again from a different starting point.

**Reach for it when** the build has been red for an hour and you want to throw automation at it for fifteen minutes before going manual. Heal is happy to fail — it backs out and reports rather than leaving you in a worse state.

**Why over `/siftcoder:smart-retry`?** `smart-retry` is generic — for any failed operation. `heal` is build/test-specific.

```
/siftcoder:heal
```

### `/siftcoder:smart-retry`

**Retry the last failed operation with a different strategy.** Pointer to the `smart-retry` skill. Looks at what failed, why, and chooses a different angle on the next attempt — not just running the same command again.

**Reach for it when** something failed once and you suspect a transient or strategy-mismatch — a flaky test, a rate-limited API, a too-broad search. `smart-retry` mutates the parameters before retrying.

```
/siftcoder:smart-retry
```

### `/siftcoder:quality`

**On-demand format / lint / type-check.** Implements the `quality-check` skill. Runs the project's tooling in parallel, summarises with file:line citations.

| Flag | Effect |
|---|---|
| `--tests` | Also run the project test suite (slow; opt-in). |
| `--fix` | Auto-fix what's safe (`prettier --write`, `eslint --fix`). |
| `--report-only` | Surface findings, don't apply fixes. |

For Salesforce projects (presence of `sfdx-project.json`) it additionally runs `sf project deploy validate --source-dir force-app` and `sf code-analyzer run -t force-app`.

**Reach for it before** a commit, or when you want to know "is the project clean right now" without running every test.

```
/siftcoder:quality --fix
/siftcoder:quality --tests
```

---

## Planning and ideation

The thinking commands. Most are pointers to skills under `skills/reasoning/` or `skills/ux/`. They produce documents, not code.

### `/siftcoder:ideate`

**Memory-aware feature ideation for the current project.** Won't re-suggest ideas you've already rejected — pulls them out of memory first and excludes them.

Output is two portfolios (Safe / Asymmetric) plus one Dark Horse, each idea with file/feature citations and impact/risk.

**Reach for it when** you have free Friday afternoon hours and want to know what's worth building next, given everything you've already discussed.

```
/siftcoder:ideate
/siftcoder:ideate "ways to reduce cold-start latency"
```

### `/siftcoder:surprise-me`

**Brand-new side-project ideas — not features for current repo.** Memory-aware (won't propose what you've already built). Five ideas across creativity axes (cross-pollinate, subtraction, constraint-driven, memory-mining, wildcard) plus one explicit recommendation.

| Flag | Effect |
|---|---|
| `--salesforce` | Restrict to sfdx-shaped ideas (LWC, Flow, Apex, AppExchange). |
| `--tiny` | < 200 LOC budget. |
| `--learning <tech>` | Vehicle for learning a specific technology. |

**Why over `/siftcoder:ideate`?** `ideate` is for the current project. `surprise-me` is for net-new side projects.

```
/siftcoder:surprise-me --tiny --learning rust
```

### `/siftcoder:dream`

**Unconstrained generative exploration.** Pointer to the `dream` skill. No memory pass, no project grounding, no realism filter — pure brainstorm. Use sparingly.

**Reach for it when** every other ideation command has produced realistic-but-boring suggestions and you want to break the frame.

```
/siftcoder:dream "what if observability was a database query language"
```

### `/siftcoder:fortune`

**Tech-debt forecast — which debt is about to bite.** Pointer to the `fortune` skill. Looks at churn, complexity, recent bug clusters, and predicts where the next painful incident will originate.

**Reach for it during** roadmap planning to bias work toward the things that are about to fail rather than the things that are merely ugly.

```
/siftcoder:fortune
```

### `/siftcoder:oracle`

**Predictive intent inference.** Pointer to the `oracle` skill. Given a partial action (a half-edited file, a paused thought), predicts what you're trying to do and offers to complete it.

**Reach for it when** you've started something but the path forward isn't obvious — `oracle` reads the breadcrumbs (recent edits, recent search terms, the partial diff) and proposes the likely next step.

```
/siftcoder:oracle
```

### `/siftcoder:feasibility`

**Go/no-go memo on a proposed change.** Produces a structured assessment: is this technically doable, what's the cost, what blocks it, what risks attend. Read-only — no code changes.

**Reach for it when** product asks "can we do X by Friday" and you want a defensible answer rather than a gut estimate.

```
/siftcoder:feasibility "switch from REST to GraphQL on the public API by end of quarter"
```

### `/siftcoder:gap-analysis`

**Inventory of what's missing — spec vs implementation.** Reads a spec or set of stories, walks the implementation, and lists what isn't yet built.

**Reach for it before** declaring a feature done, or when picking up a half-finished branch.

```
/siftcoder:gap-analysis docs/specs/auth-rewrite.md
```

### `/siftcoder:spec-from-stories`

**Derive a spec from user stories or tickets.** Reads a set of stories (markdown, Jira export, plain text), extracts requirements, deduplicates, and writes a spec.

**Reach for it when** product gives you a stack of stories and you need a single coherent document the team can reason about.

```
/siftcoder:spec-from-stories tickets/sprint-42/*.md
```

### `/siftcoder:improve-spec`

**Polish a spec — make acceptance criteria testable, surface ambiguities.** Reads an existing spec, asks Socratic questions ("what does *fast* mean here?"), rewrites the AC into testable form.

**Reach for it when** you have a draft spec but it reads like prose and you need to hand it to engineering as a contract.

```
/siftcoder:improve-spec docs/specs/checkout.md
```

### `/siftcoder:reverse-spec`

**Extract a spec FROM existing code.** Walks the implementation and writes the spec it would have been built from. Useful when you inherit code with no documentation.

**Why over `/siftcoder:codemap`?** `codemap` documents structure (modules, contracts). `reverse-spec` documents *intent* (what was this code supposed to do, as inferred from what it does).

```
/siftcoder:reverse-spec src/billing
```

### `/siftcoder:narrator`

**Code-to-story translation for non-engineers, mixed audiences, layered detail.**

| Mode | Audience |
|---|---|
| `non-tech` | Board / PM / customer. Analogies + outcomes. No code. |
| `mixed` | Eng manager / lead. Architecture-level. Light code. |
| `tech` | Peer engineer new to area. Real code, patterns named. |

Layered output — the top is plain English; deeper layers expand on user pull.

**Reach for it when** you have to explain a system upward (to leadership), sideways (to PM), or inward (to a new hire) and you want the shape of the explanation to match the audience.

```
/siftcoder:narrator non-tech "the rate limiter"
```

---

## Multi-agent

Commands that orchestrate multiple agents, sub-sessions, or paused/resumed state. Most live under `skills/workflow/`.

### `/siftcoder:agent`

**Full agentic loop — planner → coder → qa-reviewer → qa-fixer with checkpoint and rollback.** This is SiftCoder's flagship command: end-to-end, with the human approving the plan and the agent doing everything else.

The pre-flight requires a clean tree, a defined `/scope`, and a `/checkpoint` tag (autocreated). The pipeline:

1. **Plan** (planner agent) — evidence ledger, risk register, rollback path.
2. **User approval** of the plan.
3. **Execute** (orchestrator + coder) — parallel where independent.
4. **QA review** (qa-reviewer) — pass/fail vs acceptance criteria.
5. **Fix gaps** (qa-fixer) — bounded to the QA report.
6. **Verify + report.**

Rollback is one `git reset --hard cp-<id>` away.

**Reach for it when** the work is large enough that you don't want to babysit, but coherent enough that a single plan can describe it. "Migrate auth from JWT to session cookies." "Reorganise the Apex Service layer to use FFLib." "Add SMS 2FA across the auth, billing, and notifications domains."

**Why over `/siftcoder:swarm`?** `agent` is one cohesive plan with phases. `swarm` is N parallel independent tasks. If the work decomposes into parts that don't share state, swarm is faster. If the parts do share state, agent's serial-where-needed orchestration is safer.

**Why over `/siftcoder:autonomous`?** `autonomous` is unattended (long-running, budget-capped, no human in the loop after kickoff). `agent` requires the user to approve the plan before execute. Use `autonomous` for overnight / weekend runs you trust; use `agent` for day-job work where you want a checkpoint.

```
/siftcoder:agent "migrate auth from JWT to session cookies"
```

### `/siftcoder:swarm`

**Dispatch multiple parallel subagents on independent tasks. Discipline around isolation, conflict resolution, merge strategy.** Wraps native parallel `Task` dispatch with structured gates.

Use it when you have ≥2 tasks that don't share state — e.g. "fix the test suite" and "update three unrelated docs". The skill enforces an isolation contract: each task gets its own working directory or scope, and conflicts at merge time are surfaced rather than silently resolved.

**Reach for it when** you have a backlog of small, independent chores and want them done in parallel. Or when you want to fan out an analysis (run `codemap-trust` on each of three modules at once).

```
/siftcoder:swarm "1. fix lint errors in src/api  2. update docs/api/*.md  3. add tests for OrderService"
```

### `/siftcoder:autonomous`

**Long-running unattended runs with checkpoint, cost, and time caps.** Pointer to the `autonomous` skill. Designed for "kick this off, walk away, come back tomorrow".

The discipline is bounded autonomy: explicit budget (tokens, dollars, wall-clock), checkpoint cadence (so you can rewind), and a stop-condition (success criteria + time-out + cost cap, whichever fires first).

**Reach for it when** the work is well-scoped, not blocking, and would be tedious to babysit. Think: "regenerate codemaps across all 30 modules", "convert all `var` to `let/const` across the repo", "process this 10k-line dataset cleanup".

**Why over `/siftcoder:agent`?** `agent` requires plan approval. `autonomous` runs without you. Trade-off: less control, more leverage.

```
/siftcoder:autonomous "regenerate every codemap, commit per module" --budget 5USD --max 4h
```

### `/siftcoder:pair`

**Per-edit approval mode.** Pointer to the `pair` skill. Each Write or Edit pauses for your approval before applying. Slow on purpose.

**Reach for it when** the code is high-stakes and you want eyes on every change — production hotfix, a regulated codebase, a refactor in someone else's module.

```
/siftcoder:pair
```

### `/siftcoder:duck`

**Rubber-duck mode — AI asks, you explain.** The role inversion: instead of you asking, the duck asks pointed questions and you answer. By the time you've explained the problem, you usually know the answer.

**Reach for it when** you're stuck and not sure why. The questions force you to articulate what you don't yet know.

```
/siftcoder:duck "checkout latency p99 spike"
```

### `/siftcoder:ghost`

**"What if we did X instead" — alternative branch exploration.** Pointer to the `ghost` skill. Forks a hypothetical branch in conversation only, explores the alternative, reports trade-offs vs the current direction. No code is written; the ghost branch is purely analytical.

**Reach for it when** you've committed to one approach but have a nagging "what about Y" — `ghost` lets you explore Y without abandoning X.

```
/siftcoder:ghost "what if we used server-sent events instead of WebSockets"
```

### `/siftcoder:zen`

**Aggressive simplification. Delete-as-default.** Pointer to the `zen` skill. Removes dead code, abstractions that don't earn their keep, scaffolding from "we might need this".

Pairs well with `/siftcoder:invariant` — first surface the assumptions, then delete what doesn't serve them.

**Reach for it when** the codebase has accreted complexity and you want a pass that cuts before adding. Quarterly, not weekly.

```
/siftcoder:zen src/api
```

### `/siftcoder:handoff`

**End-of-session deliverable for the next person.** Pointer to the `handoff` skill. Writes a structured doc: what was done, what's left, where the bodies are buried, how to run things.

**Reach for it when** you're ending a long session and someone else (including future you) will continue tomorrow. The handoff doc replaces the "let me re-orient for an hour" tax.

```
/siftcoder:handoff
```

### `/siftcoder:continue`

**Resume from a paused session.** Pointer to the `continue` skill. Reads the most recent `pause` artefact, restores context, picks up where it left off.

```
/siftcoder:continue
```

### `/siftcoder:pause`

**Freeze session state with rich resumption context.** Pointer to the `pause` skill. Writes a structured doc of in-flight state: what was being worked on, what was blocking, what to do next.

**Reach for it when** you're interrupted mid-task and don't want to lose the thread. Pair with `/siftcoder:continue` to resume.

```
/siftcoder:pause "switching to urgent customer ticket"
```

---

## Quality and review

Audit-style commands. Read-mostly, occasionally producing remediation notes.

### `/siftcoder:security`

**Security review with project framing.** Pointer to the `security` skill. Looks at auth, data flow, input validation, secrets handling, dependency posture. Produces a structured finding list with severity, evidence, and remediation.

**Reach for it before** shipping a feature that touches auth, payments, PII, or external integrations.

**Why over `/siftcoder:review`?** `review` is broad. `security` is narrow and adversarial — assumes attacker intent.

**Why over `/siftcoder:comply`?** `security` is judgement-based. `comply` is checklist-based against a specific framework.

```
/siftcoder:security src/auth
```

### `/siftcoder:comply`

**Compliance review against a named framework.** Pointer to the `comply` skill. Frameworks: SOC2, HIPAA, GDPR, PCI-DSS. Outputs a checklist with evidence per item.

**Reach for it during** an audit prep, or when a customer asks for a SOC2 attestation and you want to know where you actually stand.

```
/siftcoder:comply soc2
/siftcoder:comply gdpr src/users
```

### `/siftcoder:chaos`

**Failure-scenario design for resilience testing.** Pointer to the `chaos` skill. Identifies failure modes (network partition, dependency timeout, partial outage, malformed input) and writes the test cases that exercise them.

**Reach for it when** the system is "supposed to" handle failure gracefully and you want evidence rather than belief.

**Why over `/siftcoder:fuzz-mind`?** `fuzz-mind` generates edge-case *inputs*. `chaos` generates failure-mode *scenarios* — the inputs are normal but the environment is hostile.

```
/siftcoder:chaos "checkout flow with payment provider timeouts"
```

### `/siftcoder:fuzz-mind`

**Adversarial edge-case test generation.** Pointer to the `fuzz-mind` skill. Generates the inputs you wouldn't think of: empty strings, max-length strings, Unicode, leading whitespace, nulls in unexpected places.

**Reach for it when** you've written the happy-path tests and want a second pass against weirdness.

```
/siftcoder:fuzz-mind src/parsers/csv.ts
```

### `/siftcoder:invariant`

**Discover and externalise implicit invariants.** Pointer to the `invariant` skill. Reads code, finds the unstated rules ("the cart never has negative quantities", "user IDs are always lowercase"), and surfaces them as explicit assertions or property-test predicates.

**Reach for it before** a refactor — if you don't know the invariants, you'll break them.

```
/siftcoder:invariant src/cart
```

### `/siftcoder:monitor`

**Health monitoring setup.** Pointer to the `monitor` skill. Identifies what should be monitored (latency, error rate, saturation), writes the dashboards or alert rules in your stack's format, and proposes thresholds.

**Reach for it after** a feature ships, before you walk away from it.

```
/siftcoder:monitor src/checkout
```

### `/siftcoder:session-eval`

**Post-session evaluation and pattern extraction.** Pointer to the `session-eval` skill. Reads what happened in the session, judges it (what went well, what went sideways), and offers to extract any reusable patterns into the pattern store.

Pairs with `/siftcoder:trace` — `trace` is the timeline, `session-eval` is the post-mortem.

```
/siftcoder:session-eval
```

### `/siftcoder:empathy`

**Cognitive-load measurement.** Pointer to the `empathy` skill. Reads code from the perspective of a new reader and reports the cognitive cost — variables to track, concepts to hold, indirection to follow.

**Reach for it when** you've been told the code is "hard to read" and you want a structured account of why, not just a vibe.

```
/siftcoder:empathy src/billing/InvoiceCalculator.ts
```

### `/siftcoder:analyze`

**Generic analysis with structured output.** Pointer to the `analyze` skill. The Swiss-army knife: pick a target and a dimension (readability, churn, risk, dependency depth), and the skill produces a report in that shape.

**Reach for it when** none of the more specific commands fits and you need a written analysis with citations.

```
/siftcoder:analyze "churn vs coverage in src/api"
```

---

## Salesforce

The Salesforce-specific commands. Most are first-class scaffolders or wrappers around the `sf` CLI; a handful are pointers to domain-specific skills.

### `/siftcoder:apex-patterns`

**Generate FFLib enterprise patterns — Selector / Domain / Service / UnitOfWork.**

| Sub-action | Generates |
|---|---|
| `selector <Object>` | `<Object>sSelector.cls` extending `fflib_SObjectSelector`. |
| `domain <Object>` | `<Object>s.cls` (domain class) + factory. |
| `service <Name>` | `<Name>Service.cls` interface + impl + locator. |
| `uow [objects]` | `Application.cls` with the UnitOfWork registration. |

Each generation includes a test class. Naming and bulk-safety rules come from `skills/salesforce-apex/SKILL.md`.

**Reach for it when** starting a new module in an FFLib-shaped Apex codebase. Saves an hour of boilerplate.

```
/siftcoder:apex-patterns selector Account
/siftcoder:apex-patterns service OrderProcessing
/siftcoder:apex-patterns uow Account,Contact,Order__c
```

### `/siftcoder:schema`

**Salesforce schema management — objects, fields, ERDs.**

| Sub-action | Effect |
|---|---|
| `object <Name>` | Create custom object metadata (Name field, security defaults). |
| `field <Object> <FieldName> <Type>` | Add a custom field. |
| `erd [--scope <objects>]` | Generate Mermaid ERD from current metadata. |
| `migrate` | Diff + plan a schema change (delegates to schema-migrate). |

Generates source-format metadata. Deploy via `/siftcoder:sf-deploy validate`.

```
/siftcoder:schema object Subscription__c
/siftcoder:schema field Account RenewalDate__c Date
/siftcoder:schema erd --scope Account,Opportunity,Order
```

### `/siftcoder:schema-migrate`

**Salesforce metadata schema migration — diff, plan, deploy, rollback.** Risk-classifies each change (breaking / lossy / safe), schedules pre-deploy data transforms, runs validation deploy, reconciles after, and produces an explicit rollback strategy per change.

**Why over `/siftcoder:migrate`?** `schema-migrate` is for *metadata* (objects, fields, validation rules). `migrate` is for *data* (rows, records). Different rollback strategies.

```
/siftcoder:schema-migrate diff --target-org prod
/siftcoder:schema-migrate plan
/siftcoder:schema-migrate deploy --target-org staging
```

### `/siftcoder:sf-deploy`

**Salesforce deploy — validate / deploy / preview / quick / rollback.** Wraps the `sf` CLI deploy flow.

| Sub-action | Effect |
|---|---|
| `validate` | `sf project deploy validate --source-dir force-app --test-level RunLocalTests`. |
| `preview` | Show diffs vs target org before deploy. |
| `deploy` | Full deploy (validates first unless `--quick`). |
| `quick <jobId>` | Quick-deploy from a previously validated job id. |
| `rollback` | Deploy the previous git tag to the target org. |

Always preview before production. Always `--test-level RunLocalTests` for prod.

```
/siftcoder:sf-deploy validate --target-org staging
/siftcoder:sf-deploy preview --target-org prod
/siftcoder:sf-deploy quick 0Af... --target-org prod
```

### `/siftcoder:sf-test`

**Salesforce test generation, coverage, bulk patterns.**

| Sub-action | Effect |
|---|---|
| `generate <ClassName>` | Test class scaffolded with TestDataFactory + bulk pattern. |
| `coverage` | `sf apex run test --code-coverage`; surface classes < 75%. |
| `run [class]` | Run a specific test class. |
| `factory <Object>` | Generate or update TestDataFactory entries for an object. |

Uses the `apex-bulkifier` agent for bulk-safety verification of code under test.

```
/siftcoder:sf-test generate OrderProcessingServiceTest
/siftcoder:sf-test coverage
/siftcoder:sf-test factory Subscription__c
```

### `/siftcoder:sf-architect`

**Salesforce org-level architecture review.** Dispatches the `salesforce-architect` agent. Read-only. Produces a written assessment grounded in actual metadata.

Output sections: executive summary, capacity table, top-3 risks / top-3 wins, full risk register, roadmap (quick / structural / strategic), Mermaid diagrams (data model, integration topology, environments).

**Reach for it when** you've inherited an org and need to know its shape, or when planning the next quarter and you want a defensible "here's where we are" doc.

```
/siftcoder:sf-architect --target-org prod
```

### `/siftcoder:sf-security`

**Salesforce-specific security review.** Pointer to `salesforce-security` skill. Covers CRUD/FLS, sharing rules, with sharing vs without sharing, named credentials hygiene, custom-setting protection, formula injection, SOQL injection, etc.

**Why over `/siftcoder:security`?** General `/security` doesn't know about CRUD/FLS or sharing rules. Use `sf-security` for SF-platform reviews.

```
/siftcoder:sf-security force-app/main/default/classes
```

### `/siftcoder:sf-debug`

**Salesforce debug log analysis.**

| Sub-action | Effect |
|---|---|
| `parse <logfile>` | Parse a downloaded debug log; surface SOQL count, DML count, CPU spikes, callout latency. |
| `tail` | `sf apex tail-log` against the configured user. |
| `limits` | Fetch a recent log and report governor-limit utilisation per phase. |

Output: timeline view + top-5 hotspots with line citations.

```
/siftcoder:sf-debug parse logs/apex.log
/siftcoder:sf-debug tail
/siftcoder:sf-debug limits
```

### `/siftcoder:sf-comply`

**Salesforce industry-cloud compliance.** Pointer to `salesforce-comply` skill. Handles industry-specific requirements: Health Cloud (HIPAA-aligned), Financial Services Cloud, Public Sector, etc.

```
/siftcoder:sf-comply hipaa force-app/main/default
```

### `/siftcoder:sf-connect`

**Named Credentials, External Credentials, OAuth flows.** Always prefer Named Credentials over hardcoded URLs in Apex.

| Sub-action | Effect |
|---|---|
| `named-cred <name> --url <url>` | Create Named Credential metadata. |
| `external-cred <name>` | Create External Credential. |
| `oauth <name>` | Set up Auth Provider + OAuth flow. |

Generates source-format metadata; commit and deploy via `sf-deploy`.

```
/siftcoder:sf-connect named-cred StripeAPI --url https://api.stripe.com
/siftcoder:sf-connect oauth Salesforce_to_HubSpot
```

### `/siftcoder:sf-cpq`

**Salesforce CPQ work — bundles, options, price rules, search filters.** Pointer to the `salesforce-cpq` skill. CPQ has specific bulk-safety, recursion, and cache patterns that don't apply to vanilla Apex.

```
/siftcoder:sf-cpq "audit price rule recursion in OpportunityLineItem trigger"
```

### `/siftcoder:sf-flow`

**Salesforce Flow Builder.** Pointer to the `salesforce-flow` skill. Covers screen flows, record-triggered flows, autolaunched flows, subflows. Bulkification, error handling, fault paths.

```
/siftcoder:sf-flow "design a record-triggered flow for new Lead conversion"
```

### `/siftcoder:sf-agentforce`

**Salesforce Agentforce work.** Pointer to the `salesforce-agentforce` skill. Agent topics, actions, prompt templates, deployment.

```
/siftcoder:sf-agentforce "design a service agent for support case triage"
```

### `/siftcoder:sf-einstein`

**Salesforce Einstein.** Pointer to the `salesforce-einstein` skill. Predictions, classifications, NBA, prompt templates.

```
/siftcoder:sf-einstein "build a churn prediction model on Account"
```

### `/siftcoder:sf-package`

**Unlocked packages — versioning, dependencies.**

| Sub-action | Effect |
|---|---|
| `create <name>` | Create unlocked package. |
| `version create` | Create new package version (validates, runs tests). |
| `version list` | List package versions. |
| `install <version-id> --target-org <alias>` | Install. |
| `uninstall <package-id> --target-org <alias>` | Uninstall. |

Default to unlocked over managed for in-house packages.

```
/siftcoder:sf-package create CoreServices
/siftcoder:sf-package version create
```

### `/siftcoder:sf-webhook`

**Inbound webhook endpoints — Apex REST + HMAC verification.** Generates the full surface: `@RestResource` class, HMAC signature verify (`Crypto.computeHmac('hmacSHA256', ...)`), secret loaded from Named Credential or Custom Setting (never hardcoded), idempotency check (`X-Idempotency-Key`), replay-attack protection (timestamp window), test class with valid + invalid signature cases.

```
/siftcoder:sf-webhook StripeEventReceiver --hmac-header X-Stripe-Signature --secret-name StripeSigningKey
```

After generation, deploy with `/siftcoder:sf-deploy validate`.

### `/siftcoder:lwc`

**Lightning Web Component create / debug / wire / event.**

| Sub-action | Effect |
|---|---|
| `create <name>` | Scaffold HTML + JS + CSS + meta + jest test. |
| `debug <name>` | Dispatch the `lwc-debugger` agent on the named component. |
| `wire <name> <adapter>` | Generate or refactor a wire adapter binding. |
| `event <name>` | Generate event-dispatch boilerplate (composed/bubbles defaults). |

```
/siftcoder:lwc create accountSummary
/siftcoder:lwc wire accountSummary getAccountById
/siftcoder:lwc debug accountSummary
```

### `/siftcoder:lwc-debug`

**LWC-specific debugging — wires, lifecycle, reactivity, perf.** Dispatches the `lwc-debugger` agent. Walks the lifecycle (constructor → connectedCallback → wires → renderedCallback), forms hypotheses, finds evidence, proposes a minimal fix.

**Why over `/siftcoder:lwc debug`?** They're roughly the same — `lwc debug` routes here. The standalone command is convenient for chaining.

**Why over `/siftcoder:debug`?** Generic `/debug` doesn't understand LWC's wire lifecycle, reactivity rules, or shadow DOM. Use `lwc-debug` for any "my LWC isn't rendering / firing / updating" question.

```
/siftcoder:lwc-debug accountSummary
```

---

## Documentation

### `/siftcoder:document`

**Generate documentation in a named shape.** Pointer to the `document` skill. Pick a target (file, module, function) and a shape (API reference, tutorial, architecture note, runbook), and the skill writes it.

```
/siftcoder:document src/auth/middleware.ts api-reference
/siftcoder:document src/billing tutorial
```

### `/siftcoder:update-docs`

**Sync docs to code.** Pointer to the `update-docs` skill. Reads existing docs, compares to current code, finds drift (function signatures changed, examples broken, sections referencing removed code), and updates.

**Reach for it before** publishing — the docs almost always lag the code.

```
/siftcoder:update-docs
/siftcoder:update-docs docs/api/
```

---

## Project structure

Commands that touch project layout, scope, or cross-system concerns.

### `/siftcoder:organize-project`

**Assess and improve folder/file/naming layout. User-approved per group.** Diagnoses sprawl, proposes a project-type-appropriate layout, applies only on granular accept.

| Sub-action | Effect |
|---|---|
| `assess` | Diagnose only. Read-only. |
| `apply` | Apply approved changes. |

```
/siftcoder:organize-project assess
/siftcoder:organize-project apply
```

### `/siftcoder:focus`

**Narrow attention to a feature/file set (advisory).** Different from `/scope` — `focus` biases memory retrieval and Claude's attention; `scope` enforces what can be written.

| Sub-action | Effect |
|---|---|
| `set <name> <patterns>` | Set a focus profile. |
| `status` | Show current focus. |
| `clear` | Remove focus. |
| `extend` | Add patterns to existing focus. |

```
/siftcoder:focus set auth-rewrite "src/auth/**,tests/auth/**"
/siftcoder:focus status
/siftcoder:focus clear
```

### `/siftcoder:scope`

**Edit `.siftcoder/scope.json` — enforced.** Pointer to the `scope` skill. The boundary file is read by the `PreToolUse` hook on every Write/Edit; outside-of-scope writes are blocked.

**Why over `/siftcoder:focus`?** `focus` is advisory (biases retrieval). `scope` is enforced (blocks writes). Use `scope` to prevent accidents; use `focus` to nudge attention.

**Why over `/siftcoder:chroot`?** `scope` accepts globs (`src/**`). `chroot` accepts an explicit file list — tighter, less convenient, more paranoid.

```
/siftcoder:scope
```

### `/siftcoder:chroot`

**Tighter file-access jail than `/scope` — explicit file list.** Pointer to the `chroot` skill. When even `src/auth/**` feels too broad, `chroot` lets you whitelist exactly the files Claude can touch.

**Reach for it when** doing a hot patch on a regulated codebase or working in a junior-engineer-pairing mode where you don't trust the agent with anything broader.

```
/siftcoder:chroot "src/auth/middleware.ts,tests/auth/middleware.test.ts"
```

### `/siftcoder:polyglot`

**Cross-language consistency.** Pointer to the `polyglot` skill. For projects with multiple languages, ensures the same concept (a User type, a Money struct, a config schema) is represented consistently.

```
/siftcoder:polyglot "Money type across TS frontend and Go backend"
```

### `/siftcoder:integrate`

**Two-system integration design.** Pointer to the `integrate` skill. Reads the two systems, designs the contract (auth, retry, idempotency, observability), writes the spec.

**Why over `/siftcoder:bridge`?** `integrate` is for two systems where you control both. `bridge` is for cross-codebase analysis — often where you control one and integrate with the other.

**Why over `/siftcoder:api`?** `api` designs *one* surface. `integrate` designs the conversation between *two*.

```
/siftcoder:integrate "checkout service → fulfilment service"
```

### `/siftcoder:migrate`

**Data migration with verify and rollback.** Pointer to the `migrate` skill. Plans the migration (batch size, throttle, verify queries), runs it idempotently, verifies row counts and checksums, exposes a rollback path.

**Why over `/siftcoder:schema-migrate`?** `migrate` is for *data*. `schema-migrate` is for *metadata* (Salesforce-specific).

```
/siftcoder:migrate "users.email → users.email_lowercase, batch 10k"
```

### `/siftcoder:bridge`

**Cross-codebase integration analysis — gap map, pattern pick, bridge spec.** Read-only on both sides. Output: structured bridge spec with contract, auth, failure modes, observability, versioning, implementation plan per side.

Dispatches the `bridge-analyzer` agent.

```
/siftcoder:bridge ~/projects/our-api ~/projects/their-api "swap our auth for theirs"
```

### `/siftcoder:api`

**API design — REST/GraphQL/gRPC, versioning, idempotency, pagination.** Pointer to the `api` skill. Produces the contract, the example requests/responses, the failure-mode table, and the versioning plan.

```
/siftcoder:api "POST /v2/orders — REST, idempotency-key required"
```

### `/siftcoder:sync`

**Sync state to remote backup or team federation.** Pointer to the `sync` skill. Pushes captured memory to a remote target (S3 backup, team-shared store, encrypted archive). The team-federation case is on the roadmap; backup works today.

```
/siftcoder:sync backup s3://my-bucket/siftcoder-backups/
```

### `/siftcoder:preview`

**Diff-before-apply discipline.** Pointer to the `preview` skill. Shows the proposed change as a diff and waits for confirmation before applying. Different from `/pair` — `pair` is global session-wide; `preview` is per-action.

```
/siftcoder:preview
```

### `/siftcoder:checkpoint`

**Save a named savepoint with intent + scope + memory pin.** Pointer to the `checkpoint` skill. Combines `git tag cp-<id>` with a memory-pinned summary of the current state, so rewinding restores both code and context.

Used as a precondition by `/siftcoder:agent`.

```
/siftcoder:checkpoint "before-auth-refactor"
```

### `/siftcoder:team`

**Team knowledge sharing.** Pointer to the `team` skill. Curates and shares memory bundles with teammates — exports approved knowledge, imports incoming bundles, manages namespacing.

Pre-roadmap for full multi-user; the export/import path works today.

```
/siftcoder:team export "auth-rewrite knowledge"
```

---

## Orientation and meta

Commands you reach for to navigate SiftCoder itself.

### `/siftcoder:onboard`

**First-time SiftCoder setup walk.** Pointer to the `onboard` skill. Walks through daemon start, backend choice (Ollama vs Anthropic), backfill of past transcripts, scope file creation. The "did you do the basics" command.

**Reach for it** the first time you install SiftCoder, or when bringing a teammate up. It's idempotent — safe to re-run.

```
/siftcoder:onboard
```

### `/siftcoder:help`

**SiftCoder help index — orientation, command discovery, doc pointers.** Surfaces the top entry points by intent (memory ops, Salesforce, generic coding, quality, ideas) plus the doc index.

For deep help, use the upstream `/help`.

```
/siftcoder:help
/siftcoder:help "salesforce"
```

### `/siftcoder:config`

**Interactive config wrapper — wraps `siftcoder setup` plus `settings.json` editing.** Three actions:

| Action | Effect |
|---|---|
| `setup` | Interactive walkthrough (Ollama probe, Anthropic key, defaults). |
| `show` | Print the effective config (env + project + user-global + plugin defaults layered). |
| `edit` | Open `~/.siftcoder/config.json` in your editor. |

```
/siftcoder:config setup
/siftcoder:config show
/siftcoder:config edit
```

### `/siftcoder:wizard`

**Guided multi-step interactive flow.** Built-in wizards for `memory-setup`, `salesforce-onboard`, `release-prep`, `migration`. Or pass a custom flow description.

The discipline is one decision at a time; final summary before any apply. Use it when the work is large enough that "go figure it out" doesn't help and you want to be walked through the decision tree.

```
/siftcoder:wizard memory-setup
/siftcoder:wizard release-prep
/siftcoder:wizard "add Stripe webhook endpoint to a Salesforce org"
```

### `/siftcoder:examples`

**Real session traces — pointer to `docs/EXAMPLES.md`.** Browse worked examples (bug fix with memory grounding, Salesforce architecture review, surprise-me ideation, pause and resume, codemap-trust pre-flight, memory-grounded ideate).

```
/siftcoder:examples
/siftcoder:examples "salesforce"
```

### `/siftcoder:use-cases`

**Use-cases by developer / problem / task size — pointer to `docs/USE-CASES.md`.** When you don't know which command fits, this is the lookup.

```
/siftcoder:use-cases
/siftcoder:use-cases "stuck"
```

### `/siftcoder:compress`

**Toggle output compression mode.** Modes: `lite`, `full`, `ultra`, `dense`, `handoff`, `commit`, `review`, `off`. Default `full`. Persists for the session.

If the `sift-compress` companion plugin is installed, defers to it for cross-session mode state. Otherwise applies the rules inline.

```
/siftcoder:compress dense
/siftcoder:compress off
```

### `/siftcoder:prompt`

**Craft a better prompt.** Pointer to the `prompt` skill. Reads what you're trying to ask, suggests a clearer phrasing, optionally re-runs with the improved version.

**Reach for it when** Claude misunderstood and you want to iterate on the prompt rather than the answer.

```
/siftcoder:prompt "I want to refactor the cart"
```

### `/siftcoder:reverse-prompt`

**Generate a single conversational prompt that rebuilds this project from scratch.** Three modes:

| Mode | Output size |
|---|---|
| `quick` | File tree + names only (~500 tokens). |
| `deep` | Full architecture + conventions (~3-5k tokens, default). |
| `focus <area>` | One feature with surrounding context (~1-2k tokens). |

Caches by project fingerprint at `~/.siftcoder/reverse-prompt-cache/`.

**Reach for it when** you want to spawn a sister agent on a different machine with the same understanding of this project, or when you want a single self-contained prompt to paste into a fresh session.

```
/siftcoder:reverse-prompt deep
/siftcoder:reverse-prompt focus auth
```

### `/siftcoder:budget`

**Token + cost budget tracking and optimisation.** Backed by the `Budget` class in `src/services/tokens.ts`.

| Sub-mode | Effect |
|---|---|
| `set <limit>` | Set token or USD budget (defaults to session scope). |
| `status` | Current consumption and projection. |
| `report` | Historical usage by skill / agent / model. |
| `optimise` | Recommend savings (model downsize, caching, Ollama, compression). |

```
/siftcoder:budget set 5USD
/siftcoder:budget status
/siftcoder:budget optimise
```

### `/siftcoder:siftcoder`

**Decision-tree skill — "which SiftCoder skill should I use for X".** Meta-command. Describe the situation and the skill returns a recommended command (or chain of commands).

```
/siftcoder:siftcoder "I inherited a Salesforce org and don't know where to start"
```

Sample shape:

```
For unfamiliar Salesforce org orientation, the chain is:
1. /siftcoder:codemap-fast        # 30s structural sketch
2. /siftcoder:sf-architect        # full architecture review
3. /siftcoder:codemap-trust       # confidence/risk per module
4. /siftcoder:focus set <area>    # narrow to highest-priority module
```

---

## Composing commands

Slash commands are useful one at a time but their full power shows when you chain them. The capture-then-retrieve loop means later commands benefit from earlier ones automatically — every `/investigate` writes to memory, and the next `/ideate` can pull from it without you doing anything. The chains below are the ones that come up most often. Keep them in your back pocket; you'll find yourself running them in roughly this order without thinking about it after a week.

A note on the mechanics: nothing about chaining is automated. There is no DAG, no `&&`, no orchestrator that runs the next command for you. You type each one. The chains are habits, not pipelines. The only thing the system does for you is remember — once you've run `/investigate` on a topic, the next command in the chain benefits from the captured evidence even though you didn't pass it explicitly.

**Adding a new feature.** `/siftcoder:codemap-fast` to orient (skip if you know the codebase) → `/siftcoder:investigate` to understand the area you're touching → `/siftcoder:plan` is not a real command; instead `/siftcoder:improve-spec` if a draft exists or `/siftcoder:add-feature` directly → `/siftcoder:test unit` to add coverage → `/siftcoder:review` for a memory-aware critique → `/siftcoder:quality --tests` before commit. If the feature is large enough to warrant a checkpoint, drop a `/siftcoder:checkpoint` between investigate and add-feature.

**Diagnosing a regression.** `/siftcoder:debug bisect <good> <bad>` to find the introducing commit → `/siftcoder:investigate` to understand why the commit caused the symptom → `/siftcoder:fix` to patch with a regression test → `/siftcoder:quality --tests` to confirm green. If the bisect is slow, run `/siftcoder:autonomous` on the bisect step.

**Onboarding to an unfamiliar Salesforce org.** `/siftcoder:onboard` (if first-time SiftCoder use) → `/siftcoder:codemap-fast` for structure → `/siftcoder:sf-architect` for an architectural read → `/siftcoder:codemap-trust` to know which modules to be careful with → `/siftcoder:focus set` on the area you'll start in → `/siftcoder:handoff` at the end of the day so tomorrow-you starts oriented.

**Refactoring a module.** `/siftcoder:invariant` to surface the unstated rules → `/siftcoder:test coverage` to know what's tested → if coverage is thin, `/siftcoder:test unit` to fill gaps → `/siftcoder:checkpoint` so you can rewind → `/siftcoder:refactor` itself → `/siftcoder:review` to confirm the shape is better → `/siftcoder:quality --tests` to confirm behaviour is preserved.

**Shipping with confidence.** `/siftcoder:ripple` on the diff to know what else might need to change → `/siftcoder:blast-radius` to know what could break → `/siftcoder:security` if auth/data is involved → `/siftcoder:comply <framework>` if a compliance lens applies → `/siftcoder:monitor` to set up alerts before you walk away → `/siftcoder:handoff` if someone else is on call.

**Weekend ideation to Monday spec.** Friday afternoon: `/siftcoder:fortune` to see what tech debt is about to bite, `/siftcoder:ideate` to brainstorm fixes given the project's actual history, `/siftcoder:dream` if you want to break frame and consider radical alternatives. Pause for the weekend with `/siftcoder:pause "ideation thread"`. Monday morning: `/siftcoder:continue`, pick one idea, run `/siftcoder:feasibility` to pressure-test it, then `/siftcoder:improve-spec` to polish the AC. By midday Monday you have something engineering can plan against, and the trail back to the original ideation is captured in memory if anyone asks "why did we pick this".

The loop pattern across all of these: read first (codemap, investigate, archaeologist), think next (improve-spec, ghost, ideate), do third (add-feature, fix, refactor), verify last (review, quality, security). Memory makes the read step faster every time you do it. That is the whole point — the second time you investigate the rate limiter, the captured evidence from the first time is already in your context. By the third time you don't even reach for `investigate`; the memory pass on the prompt surfaces the prior conclusion before Claude does any new thinking. The commands are designed so that *your habit of using them at all* is what compounds, not any single command's cleverness.

---

rewrote slash-commands.md to ~11200 words covering 107 commands
