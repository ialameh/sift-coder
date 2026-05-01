# Use cases

When to reach for SiftCoder, organised by who you are and what you're doing.

## By developer type

### Solo full-stack dev
- **Daily:** memory captures everything; `/siftcoder:ideate` for next features; `/siftcoder:tdd` for new code
- **Weekly:** `/siftcoder:knowledge` for memory hygiene; `/siftcoder:codemap-trust` to know what's stable
- **One-off:** `/siftcoder:reverse-prompt` when handing off a project

### Salesforce admin / dev
- **Daily:** `/siftcoder:sf-deploy validate` before every deploy; `/siftcoder:apex-patterns` for FFLib scaffolding
- **Per-org:** `/siftcoder:sf-architect` for quarterly review; `/siftcoder:salesforce-security` before audit
- **Domain-specific:** `/siftcoder:sf-agentforce` / `sf-einstein` / `sf-cpq` / `sf-flow`

### Senior engineer / tech lead
- **Per PR:** `/siftcoder:review` (memory-grounded) + native `/review`; `/siftcoder:blast-radius` for risk
- **Per quarter:** `/siftcoder:codemap-trust`; `/siftcoder:fortune` for tech-debt forecasting
- **Mentoring:** `/siftcoder:duck` to coach junior thinking; `/siftcoder:archaeologist` to teach context

### Engineering manager / PM
- **Per spec:** `/siftcoder:improve-spec` then `/siftcoder:gap-analysis` after build
- **Per release:** `/siftcoder:handoff` for stakeholder updates
- **Strategic:** `/siftcoder:feasibility` for new features; `/siftcoder:fortune` for risk reports

### Compliance / security engineer
- **Per audit:** `/siftcoder:comply` + `/siftcoder:salesforce-comply` (industry clouds)
- **Per PR (risk-flagged):** `/siftcoder:security` + native `/security-review` + `/siftcoder:salesforce-security`

## By problem type

### "I'm stuck"
- `/siftcoder:duck` — rubber-duck through it (AI asks, you answer)
- `/siftcoder:investigate` — read-only diagnosis if there's a concrete bug
- `/siftcoder:ideate` — if stuck on what to do next

### "Something's broken"
- `/siftcoder:fix` — bounded fix
- `/siftcoder:heal` — multi-strategy auto-recovery
- `/siftcoder:investigate` — diagnose first if cause unclear

### "I'm joining a new project"
- `/siftcoder:onboard` (if SiftCoder is fresh) → then `/siftcoder:reverse-prompt` (project map)
- `/siftcoder:codemap-fast` for quick orientation
- `/siftcoder:codemap` for deep map
- `/siftcoder:codemap-trust` for "where's the risk"

### "I'm leaving / handing off"
- `/siftcoder:handoff` — structured end-of-session note
- `/siftcoder:reverse-prompt deep` — single-prompt project rebuild

### "I want to ship something new"
- `/siftcoder:improve-spec` (if spec exists) → `/siftcoder:planner` agent → `/siftcoder:build`
- `/siftcoder:tdd` for test-first discipline
- `/siftcoder:add-feature` for incremental on existing

### "I want to ship faster"
- `/siftcoder:autonomous` — long unattended runs (with safety brakes)
- `/siftcoder:swarm` — parallel subagents on independent tasks

### "I want to ship safer"
- `/siftcoder:scope` — bound where AI can write
- `/siftcoder:chroot` — explicit file-list jail
- `/siftcoder:preview` — diff-before-apply
- `/siftcoder:pair` — approve-each-step

### "I want to learn from past sessions"
- `/siftcoder:trace` — see what AI did and why
- `/siftcoder:session-eval` — extract patterns + lessons
- `/siftcoder:knowledge` — whole-store curation

### "I want creative ideas"
- `/siftcoder:ideate` — for current project (memory-grounded)
- `/siftcoder:surprise-me` — for new projects
- `/siftcoder:dream` — unconstrained exploration

### "I want to refactor"
- `/siftcoder:refactor` — same-behaviour structural change
- `/siftcoder:zen` — aggressive simplification
- `/siftcoder:optimize` — performance-driven
- `/siftcoder:ghost` — explore "what if we did X" in isolation

## By task size

### One-line change
- Direct edit; no skill needed
- Optional: `/siftcoder:preview` if user wants approval gate

### Single-file change (~100 LOC)
- `/siftcoder:fix` or `/siftcoder:add-feature` depending on shape
- `/siftcoder:tdd` if quality matters

### Multi-file change (~1000 LOC)
- `/siftcoder:planner` agent → `/siftcoder:coder` agent
- `/siftcoder:scope` to bound
- `/siftcoder:swarm` if parts are independent

### Whole-system change (refactor / migration)
- `/siftcoder:checkpoint` first
- `/siftcoder:planner` for structured plan
- `/siftcoder:autonomous` if hours-scale
- `/siftcoder:migrate` if data is involved

## By time of day

### Start of session
- `/siftcoder:mem status` — daemon healthy?
- `/siftcoder:continue` — resume from `/pause` if applicable

### Mid-session
- Skills auto-load by trigger description; you don't have to invoke

### End of session
- `/siftcoder:handoff` — structured note
- `/siftcoder:pause` — if mid-thought (different from handoff)
- `/siftcoder:mem drain` — force-summarise pending

### Weekly hygiene
- `/siftcoder:knowledge` — memory curation
- `/siftcoder:mem prune` — dispatches memory-curator agent

## When NOT to use SiftCoder

- One-off questions Claude Code answers natively — use native
- Pure code review (general best-practice) — built-in `/review`
- Pure security scan (OWASP) — built-in `/security-review`
- Trivial tasks where overhead exceeds value
