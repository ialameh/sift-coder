# Agents

Agents are sub-Claude personas dispatched via the Task tool. Each one ships as `agents/<name>.md` — frontmatter declares its model, tool grants, and trigger description; the body is the system prompt.

SiftCoder ships fourteen agents. They pair with skills and with the multi-step commands (`/agent`, `/swarm`). Most are **read-mostly or read-only** by design — production-changes happen through `coder`, `qa-fixer`, `apex-bulkifier`, and `documenter`.

## Index

| Agent | Model | Tools | Mode |
|---|---|---|---|
| `analyst` | sonnet | Read, Grep, Glob, WebFetch, Bash | Read-only |
| `apex-bulkifier` | sonnet | Read, Edit, Grep, Glob, Bash | Read-write (Apex only) |
| `bridge-analyzer` | sonnet | Read, Grep, Glob, Bash, WebFetch | Read-only |
| `coder` | sonnet | Read, Edit, Write, Bash, Grep, Glob | Read-write |
| `documenter` | sonnet | Read, Edit, Write, Grep, Glob, Bash | Read-write (docs only) |
| `investigator` | sonnet | Read, Grep, Glob, Bash, WebFetch | Read-only |
| `lwc-debugger` | sonnet | Read, Grep, Glob, Bash, Edit | Read-mostly |
| `memory-curator` | sonnet | Bash, Read | Read-write (memory rows only) |
| `orchestrator` | sonnet | Read, Bash, Grep, Glob | Read-only |
| `planner` | sonnet | Read, Grep, Glob, Bash, WebFetch | Read-only |
| `qa-fixer` | sonnet | Read, Edit, Write, Bash, Grep, Glob | Read-write (QA-bounded) |
| `qa-reviewer` | sonnet | Read, Grep, Glob, Bash | Read-only |
| `reviewer` | sonnet | Read, Grep, Glob, Bash, WebFetch | Read-only |
| `salesforce-architect` | sonnet | Read, Grep, Glob, Bash, WebFetch | Read-only |
| `tester` | sonnet | Read, Edit, Write, Grep, Glob, Bash | Read-write (tests only) |

All ship with `model: sonnet` — that's the deliberate choice for most reasoning work. If you need cheaper, set `model: haiku` in your project's overlay; for harder reasoning, lift to `opus`. There's no per-agent automatic model selection.

---

## `analyst`

**Source**: `/Users/sam/Documents/Plugins/SiftCoder/agents/analyst.md`
**Tools**: Read, Grep, Glob, WebFetch, Bash
**Model**: sonnet

Non-code analyst. Reads specs, PRDs, user research, support tickets, sales transcripts, log dumps, CSV/JSON datasets. Extracts insight; finds patterns; surfaces contradictions. Sibling to `investigator`, which targets code.

**Use it when**: the input is *not* source — a Notion doc, a transcript, a CSV of complaints, a Linear export.

---

## `apex-bulkifier`

**Source**: `/Users/sam/Documents/Plugins/SiftCoder/agents/apex-bulkifier.md`
**Tools**: Read, Edit, Grep, Glob, Bash
**Model**: sonnet

Targeted Apex bulkification specialist. Only job: find SOQL/DML in loops; refactor to bulk-safe collections; preserve behaviour. Returns a diff and a justification. Refuses unrelated changes.

**Use it when**: a code review flagged "this isn't bulk-safe" and you want a surgical fix.

---

## `bridge-analyzer`

**Source**: `/Users/sam/Documents/Plugins/SiftCoder/agents/bridge-analyzer.md`
**Tools**: Read, Grep, Glob, Bash, WebFetch
**Model**: sonnet

Cross-codebase integration architect. Maps two repos (or services). Generates a gap inventory, picks an integration pattern, drafts a bridge spec. Read-only on both sides.

**Use it when**: paired with `/siftcoder:bridge` — two repos that need to talk and you're scoping the contract.

---

## `coder`

**Source**: `/Users/sam/Documents/Plugins/SiftCoder/agents/coder.md`
**Tools**: Read, Edit, Write, Bash, Grep, Glob
**Model**: sonnet

Senior implementer. One job: implement an approved plan, exactly. Surfaces deviations for user approval before deviating; refuses silent scope creep.

**Use it when**: dispatched by `/siftcoder:agent` after the planner's output is approved. You can also use it standalone with a hand-written plan.

---

## `documenter`

**Source**: `/Users/sam/Documents/Plugins/SiftCoder/agents/documenter.md`
**Tools**: Read, Edit, Write, Grep, Glob, Bash
**Model**: sonnet

Generates docs in *named shapes* — architecture, API ref, user manual, technical, runbook, migration. Cites every claim. Pairs with the `document` skill.

**Use it when**: you've already decided which shape; you want it filled with grounded evidence.

---

## `investigator`

**Source**: `/Users/sam/Documents/Plugins/SiftCoder/agents/investigator.md`
**Tools**: Read, Grep, Glob, Bash, WebFetch
**Model**: sonnet

Diagnostician. Read-only. Hypothesis-driven. Evidence-cited. Pairs with the `investigate` skill.

**Use it when**: a bug, performance issue, or behaviour mystery. Refuses to write code; produces an evidence ledger and ranked hypotheses instead.

---

## `lwc-debugger`

**Source**: `/Users/sam/Documents/Plugins/SiftCoder/agents/lwc-debugger.md`
**Tools**: Read, Grep, Glob, Bash, Edit
**Model**: sonnet

LWC specialist. Isolates causes for wire-adapter no-fires, lifecycle-ordering bugs, reactivity misses, performance regressions. Read-mostly — proposes fixes, doesn't blanket-rewrite.

**Use it when**: dispatched by `/siftcoder:lwc debug <name>` or directly when an LWC is misbehaving and the cause isn't obvious.

---

## `memory-curator`

**Source**: `/Users/sam/Documents/Plugins/SiftCoder/agents/memory-curator.md`
**Tools**: Bash, Read
**Model**: sonnet

Librarian for the memory store. Dedupes, merges, prunes. Read-write but **bounded** — operates only on memory rows, not user code.

**Use it when**: `/siftcoder:mem prune --confirm`. Periodically (monthly is plenty) or when search results feel cluttered.

---

## `orchestrator`

**Source**: `/Users/sam/Documents/Plugins/SiftCoder/agents/orchestrator.md`
**Tools**: Read, Bash, Grep, Glob
**Model**: sonnet

Multi-agent orchestrator. Takes a plan, turns it into safe parallel agent dispatch with file-locking, dependency batching, and conflict detection. Spawns workers, merges results.

**Use it when**: dispatched internally by `/siftcoder:agent` and `/siftcoder:swarm`. You don't usually call it directly.

---

## `planner`

**Source**: `/Users/sam/Documents/Plugins/SiftCoder/agents/planner.md`
**Tools**: Read, Grep, Glob, Bash, WebFetch
**Model**: sonnet

Senior planner. Produces plans engineers can execute without re-deciding what's been decided — evidence ledger, risk register, rollback path. Read-only. Beats the native Plan agent for project-context-aware design with memory grounding.

**Use it when**: any non-trivial change. The first step in `/siftcoder:agent`.

---

## `qa-fixer`

**Source**: `/Users/sam/Documents/Plugins/SiftCoder/agents/qa-fixer.md`
**Tools**: Read, Edit, Write, Bash, Grep, Glob
**Model**: sonnet

Fix-only implementer. The qa-reviewer report is the scope contract — refuses to expand beyond it. Pairs with `qa-reviewer`.

**Use it when**: after `qa-reviewer` flags issues; you want bounded fixes, not a re-architect.

---

## `qa-reviewer`

**Source**: `/Users/sam/Documents/Plugins/SiftCoder/agents/qa-reviewer.md`
**Tools**: Read, Grep, Glob, Bash
**Model**: sonnet

QA reviewer. Validates implementation against acceptance criteria. Runs tests, checks behaviour vs AC, produces structured pass/fail report. Read-only.

**Use it when**: the third stage of `/siftcoder:agent`. Also runnable on demand to AC-check a feature you didn't build with the agent.

---

## `reviewer`

**Source**: `/Users/sam/Documents/Plugins/SiftCoder/agents/reviewer.md`
**Tools**: Read, Grep, Glob, Bash, WebFetch
**Model**: sonnet

Code reviewer with deep project context awareness. Memory-aware (prior decisions), convention-aware. Complementary to native `/review` — that one covers general best-practice; this one covers project specifics.

**Use it when**: `/siftcoder:review` for PR or pending change review.

---

## `salesforce-architect`

**Source**: `/Users/sam/Documents/Plugins/SiftCoder/agents/salesforce-architect.md`
**Tools**: Read, Grep, Glob, Bash, WebFetch
**Model**: sonnet

Principal Salesforce architect. Honest, evidence-based assessments grounded in actual org metadata visible in the workspace. Capacity, sharing, integrations, tech debt. Read-only — written assessment, never modifies metadata.

**Use it when**: `/siftcoder:sf-architect` for a periodic org review.

---

## `tester`

**Source**: `/Users/sam/Documents/Plugins/SiftCoder/agents/tester.md`
**Tools**: Read, Edit, Write, Grep, Glob, Bash
**Model**: sonnet

Test specialist. Writes tests that assert *behaviour*, not implementation. Knows when to mock vs not. Pairs with `tdd` and `fuzz-mind` skills.

**Use it when**: dedicated test-generation pass — usually via `/siftcoder:test` or as the second half of a TDD loop.

---

## Why all sonnet?

The agents target reasoning quality with predictable cost. Haiku is too rough for plan/review/architect work; opus is overkill for most. The model stays uniform so the orchestrator can dispatch in parallel without tuning per-agent. Override in your project overlay if your cost or quality target differs.
