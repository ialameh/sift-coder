# Comparison Method — V1 ↔ V3 plugin audit

How to credibly compare the legacy SiftCoder plugin (V1) against this rewrite (V3). Two reusable artefacts:

1. **Role catalogue** — the human roles you'd staff for an enterprise comparison
2. **Master prompt template** — what to paste into Claude / GPT / Gemini for an LLM-driven comparison

Both share the same 12-axis scoring frame so role outputs and prompt outputs can be aggregated.

---

## TL;DR — solo-dev fast path

Don't have a team? Run **one role hat at a time** against three axes each, or paste the master prompt below.

### Minimum viable trio (3 roles, ~half a day)

1. **Plugin / framework architect** — manifest, plugin model, hook contracts, MCP integration
2. **TS / Node tech lead** — code quality, build, tests, deps
3. **Business analyst** — feature-parity matrix + migration risk

### 5-line prompt (solo)

```
Compare V1 at <V1_ROOT> vs V3 at <V3_ROOT>. Score each on a 0–5 scale across:
plugin-model, surface (skills/commands/agents), hooks, memory, services, tests,
docs, domain, security, migration, perf, release-readiness. Cite file:line for
every claim. Output: per-axis V1 vs V3 + delta + evidence + recommendation.
End with go/no-go for v1.0.0.
```

That alone produces a usable audit. Read on if you want depth.

---

## 12-axis comparison frame

Every credible comparison covers these. Anything outside is noise; anything missing is a gap.

| # | Axis | What's measured |
|---|---|---|
| 1 | **Plugin model alignment** | `.claude-plugin/plugin.json`, `.mcp.json`, `settings.json`, `hooks/hooks.json`, `monitors/`, `bin/` — modern Claude Code conventions vs legacy ad-hoc |
| 2 | **Surface inventory** | counts + quality of skills, slash-commands, subagents; consolidation vs sprawl |
| 3 | **Hook discipline** | events covered, blocking budget per hook, failure mode (silent/blocking), redundancy, vendor leak |
| 4 | **Memory / state architecture** | daemon, MCP server, retrieval (RRF, decay), provenance graph, dual-backend SQLite, namespace isolation |
| 5 | **Backing services quality** | TypeScript strictness, deletion justification per dropped V1 service, opaque-JS leakage |
| 6 | **Test coverage + CI** | unit/integration test counts, coverage %, CI matrix (OS × Node), smoke tests |
| 7 | **Documentation** | README length + structure, hand-curated vs auto-gen rot, ARCHITECTURE/CONTRIBUTING/CHANGELOG presence |
| 8 | **Domain depth** | Salesforce: Apex/LWC/Schema/Deploy/Architecture + platform skills (Agentforce, Einstein, CPQ, Comply, Flow, Security) |
| 9 | **Security + scope enforcement** | scope.json/chroot, secrets posture, hook supply chain, redaction, threat model |
| 10 | **Migration story** | V1 → V3 backfill tool, breaking-change documentation, deprecation comms, namespace coexistence |
| 11 | **Performance + cost** | hook latency, daemon ping latency, local-LLM offload (Ollama), token cost reduction |
| 12 | **Public-release readiness** | LICENSE, CONTRIBUTING, CHANGELOG, issue templates, SECURITY.md, code of conduct |

Score each axis 0–5 for V1 and V3 separately. The delta is the comparison.

---

## Role catalogue (12 roles, ranked by criticality)

For each: title, what they review, output shape, the V3 skill/agent that supports them, and the pass/fail signal they own.

### 1. Plugin / framework architect — *seniority: principal*

**Owns:** axes 1, 3.

**Reviews:**
- `.claude-plugin/plugin.json` — manifest correctness, version, declared paths
- `.mcp.json` — MCP server registration, env wiring
- `hooks/hooks.json` + every `hooks/**/*.mjs` — event coverage, matchers, timeouts
- `settings.json` — defaults schema, override layering
- `monitors/` — daemon health observability
- `bin/` — CLI plugin entry shape

**Output:** a written architecture diff. For each component: V1 shape vs V3 shape, breaking changes for plugin consumers, migration steps.

**V3 skills/agents that support:** `skills/docs/codemap/SKILL.md`, `skills/docs/codemap-diff/SKILL.md`, `agents/planner.md`.

**Pass/fail signal:** does V3 use modern Claude Code plugin conventions where V1 didn't? Is hook discipline measurably better (latency, blocking)?

---

### 2. Senior agentic-tooling engineer — *seniority: staff*

**Owns:** axes 2, 3 (overlap with role 1), 11.

**Reviews:**
- Whether V3 leverages native CC subagents (`Task`, `Plan`, `Explore`, `general-purpose`) instead of reimplementing
- Skill autoload trigger descriptions — quality + uniqueness
- MCP wire protocol correctness (length-prefixed framing, `kind` discriminator)
- `inject-memories` PreCompact pattern — preserves memory across compaction?
- Hook performance budgets (capture-observation ≤ 250 ms, etc.)

**Output:** a "leverage report" — for each V3 design choice, is it additive over native CC or a duplicate?

**V3 skills/agents that support:** `skills/reasoning/oracle/SKILL.md`, `skills/reasoning/archaeologist/SKILL.md`, `skills/meta/siftcoder/SKILL.md`.

**Pass/fail signal:** zero reimplementations of native CC capability.

---

### 3. TypeScript / Node tech lead — *seniority: staff*

**Owns:** axes 5, 6, partial 11.

**Reviews:**
- `tsconfig.json` — strict mode, `noImplicitAny`, `noUnusedLocals/Parameters`
- `package.json` — deps, devDeps, no jest+vitest mix, engines
- `eslint`/`prettier` configs
- `vitest.config.ts` — coverage gates
- `.github/workflows/ci.yml` — matrix
- Per-module: LOC, test-to-source ratio, error handling patterns
- V1's `dist/services/*.js` — was each one ported, dropped, or replaced? Why?

**Output:** a code-quality scorecard per module + a "dropped services justification" table.

**V3 skills/agents that support:** `skills/docs/codemap-trust/SKILL.md`, `skills/meta/analyze/SKILL.md`, `skills/meta/quality-check/SKILL.md`.

**Pass/fail signal:** all retained code is read, tested, type-safe. All dropped code has a stated reason.

---

### 4. Database / storage SME — *seniority: senior+*

**Owns:** axis 4.

**Reviews:**
- `src/memory/storage/schema.ts` + `storage.ts` — schema correctness
- Dual-backend (better-sqlite3 + node-sqlite3-wasm) parity tests
- Retrieval — RRF formula, Ebbinghaus decay, candidate pool sizing
- `src/memory/provenance.ts` — edge types, BFS depth limits
- `src/memory/daemon/wal.ts` — write-ahead log durability
- `src/memory/migration/v2-import.ts` — id remapping correctness, idempotency

**Output:** schema-diff report + retrieval-quality assessment + migration-correctness audit.

**V3 skills/agents that support:** `skills/spec/reverse-spec/SKILL.md`, `agents/investigator.md`.

**Pass/fail signal:** schema parity preserved; migration is idempotent and lossless.

---

### 5. Security engineer — *seniority: senior+*

**Owns:** axis 9.

**Reviews:**
- `hooks/pre-tool-use/boundary-enforcer.mjs` + scope.json semantics
- `src/services/chroot.ts` — file jail correctness
- `src/memory/privacy.ts` — PII redaction
- Secrets posture — any hardcoded keys/tokens? `.env` patterns?
- Supply chain — pinned vs ^x.y.z deps, audit output
- Webhook scaffolds — HMAC verification, replay window
- V1 vendor leak (`vendor/sift-compress/`) — extracted? Or still bundled?

**Output:** security findings table — severity (critical/high/medium/low/info), evidence (file:line), reproduction, fix.

**V3 skills/agents that support:** `skills/review/security/SKILL.md`, `skills/salesforce/salesforce-security/SKILL.md`, built-in `/security-review`.

**Pass/fail signal:** no critical or high findings unaddressed before public flip.

---

### 6. Salesforce SME — *seniority: principal*

**Owns:** axis 8.

**Reviews:**
- `skills/salesforce/*` — accuracy of Apex / LWC / Schema / Deploy / Test rules
- Platform skills — Agentforce / Einstein / CPQ / Flow / Comply / Security correctness
- `agents/salesforce-architect.md`, `agents/apex-bulkifier.md`, `agents/lwc-debugger.md` — methodology accuracy
- `commands/sf-*` and `apex-patterns`/`lwc`/`schema` — surface coverage

**Output:** domain-accuracy report — per skill, is the rule set current with Salesforce 2026 best practice?

**V3 skills/agents that support:** itself — this role validates the SF skill family.

**Pass/fail signal:** zero outdated rules on critical surfaces (sharing model, governor limits, deploy flow, FLS/CRUD).

---

### 7. DevEx / DX product manager — *seniority: senior*

**Owns:** axes 2, 7.

**Reviews:**
- README — length, structure, time-to-first-success
- Skill discoverability — would a new user find the right skill from natural language?
- Command naming — friction, sprawl, mnemonics
- Onboarding flow (`siftcoder setup` + `mem-setup` + first task suggestion)
- `docs/EXAMPLES.md` + `docs/USE-CASES.md` — realistic vs synthetic

**Output:** UX score + friction map. Top 5 friction points.

**V3 skills/agents that support:** `skills/quality/empathy/SKILL.md`, `skills/docs/codemap-fast/SKILL.md`, `skills/reasoning/narrator/SKILL.md`.

**Pass/fail signal:** new user lands a working session in ≤ 5 minutes.

---

### 8. Business analyst (BA) — *seniority: senior*

**Owns:** axis 10. Cross-cuts all axes for user-impact translation.

**Reviews:**
- V1 feature inventory — every command, skill, agent, hook
- V3 feature inventory — same
- Per-feature matrix: present in V1? present in V3? renamed? merged? dropped? replaced?
- Migration tool — `siftcoder backfill --from-v2` — completeness, dry-run output
- Breaking-change communications — `docs/MIGRATION.md`, `CHANGELOG.md`

**Output:** feature-parity matrix (CSV-shaped), migration risk register, user-impact summary by persona (admin, dev, end user).

**V3 skills/agents that support:** `skills/spec/gap-analysis/SKILL.md`, `skills/spec/feasibility/SKILL.md`, `skills/quality/blast-radius/SKILL.md`.

**Pass/fail signal:** every V1 feature is tracked to keep / merged / replaced / dropped with stated rationale.

---

### 9. Technical writer / docs lead — *seniority: senior*

**Owns:** axis 7.

**Reviews:**
- `README.md` — length, freshness, accuracy
- `ARCHITECTURE.md` — design completeness
- `CONTRIBUTING.md` — onboarding for contributors
- `CHANGELOG.md` — keep-a-changelog format, useful diff
- `docs/*` — coverage, freshness, no doc-rot

**Output:** doc audit — per file: keep / refresh / rewrite / delete. Identify drift between docs and current code.

**V3 skills/agents that support:** `skills/docs/update-docs/SKILL.md`, `agents/documenter.md`.

**Pass/fail signal:** zero stale claims (file paths, command names, version numbers).

---

### 10. QA / test lead — *seniority: senior*

**Owns:** axis 6.

**Reviews:**
- Test files vs source files ratio per module
- Coverage report — line / branch / function / statement
- CI matrix coverage — OS × Node version × backend (native + WASM)
- Smoke test (`scripts/smoke.mjs`) — coverage of daemon + hooks + MCP + backfill
- Flake history (CI logs)

**Output:** test-quality scorecard + gap list of uncovered behaviours.

**V3 skills/agents that support:** `agents/qa-reviewer.md`, `agents/qa-fixer.md`, `agents/tester.md`.

**Pass/fail signal:** ≥ 90% coverage on retained code; smoke 100% green; no skipped tests.

---

### 11. Release manager — *seniority: senior*

**Owns:** axis 12.

**Reviews:**
- LICENSE present and correct (MIT)
- CONTRIBUTING.md — clear contributor expectations
- CHANGELOG.md — Unreleased + dated versions
- Issue / PR templates in `.github/`
- `SECURITY.md` — vuln-disclosure path
- Code of Conduct
- Tag strategy + npm publish gates
- Rollback plan if v1.0.0 turns out broken

**Output:** release-readiness checklist — ✓ / ✗ per item with remediation effort.

**V3 skills/agents that support:** `skills/workflow/checkpoint/SKILL.md`, `skills/workflow/handoff/SKILL.md`, `skills/quality/blast-radius/SKILL.md`.

**Pass/fail signal:** zero red items on the public-release checklist.

---

### 12. End-user / power-user representative — *seniority: any*

**Owns:** cross-cuts axes 2, 7, 11 from real-workflow lens.

**Reviews:**
- Does the skill surface map to actual daily workflows?
- Are commands invocable by phrasings real users would use?
- Is the local-LLM-cost story real (test on Ollama)?
- Do skills produce useful output on real projects (their own)?

**Output:** narrative report — "I tried task X with V3, here's what happened". Wins, friction, surprises.

**V3 skills/agents that support:** `skills/ux/surprise-me/SKILL.md`, `skills/ux/ideate/SKILL.md`, `skills/coding/pair/SKILL.md`.

**Pass/fail signal:** representative is willing to switch from V1 to V3 in their daily workflow.

---

## Role × axis matrix (RACI-style)

R = responsible, A = accountable, C = consulted, I = informed.

| Axis | 1 Arch | 2 Agentic eng | 3 TS lead | 4 DB SME | 5 Sec eng | 6 SF SME | 7 DX PM | 8 BA | 9 Tech writer | 10 QA | 11 Release | 12 End user |
|---|---|---|---|---|---|---|---|---|---|---|---|---|
| 1. Plugin model | **A** | R | C | I | C | I | I | I | I | C | C | I |
| 2. Surface inventory | C | R | C | I | I | C | **A** | R | I | C | I | C |
| 3. Hook discipline | **A** | R | C | I | R | I | C | I | I | C | C | I |
| 4. Memory / state | C | R | C | **A** | C | I | I | I | I | C | I | I |
| 5. Services quality | C | C | **A** | C | C | I | I | I | I | C | I | I |
| 6. Tests + CI | C | C | R | C | I | I | I | I | I | **A** | C | I |
| 7. Documentation | C | I | I | I | I | C | R | C | **A** | I | C | C |
| 8. Domain depth | I | I | I | I | I | **A** | C | C | C | C | I | C |
| 9. Security | C | C | C | I | **A** | C | I | I | I | C | C | I |
| 10. Migration | C | C | C | C | C | C | C | **A** | R | C | R | C |
| 11. Performance + cost | R | **A** | C | C | I | I | C | I | I | C | I | C |
| 12. Release readiness | C | I | C | I | C | I | C | C | C | C | **A** | C |

No axis is orphaned. Every axis has exactly one accountable role.

---

## Master prompt — full version

Drop into Claude / GPT / Gemini. Replace `${V1_ROOT}` and `${V3_ROOT}` with absolute paths.

```
You are acting as three roles simultaneously: a senior Claude Code plugin
architect, a staff agentic-tooling engineer, and a business analyst with
domain depth in TypeScript / Node / Salesforce.

Compare two plugin codebases:
  V1 (legacy):  ${V1_ROOT}
  V3 (rewrite): ${V3_ROOT}

Method (mandatory):
  1. Read each codebase's manifest, hook config, MCP config, settings, README,
     CHANGELOG, and one representative file per major directory.
  2. Score every axis below on 0–5 for V1 and V3 separately. Cite file:line
     for every score (no score without a citation).
  3. Identify breaking changes for V1 users.
  4. Flag silent regressions — capability lost in V3 with no replacement.
  5. End with a go / no-go recommendation for V3 v1.0.0 public release.

Axes (score V1 0–5, score V3 0–5, delta = V3 - V1):
  1. Plugin model alignment (.claude-plugin/, .mcp.json, settings.json,
     hooks/hooks.json, monitors/, bin/)
  2. Surface inventory (skills, commands, agents — count + quality + sprawl)
  3. Hook discipline (events covered, blocking budget per hook,
     failure mode, vendor leak)
  4. Memory / state architecture (daemon, MCP server, retrieval, provenance,
     storage backends, namespace isolation)
  5. Backing services quality (TypeScript strictness, deletion justification
     per dropped service)
  6. Test coverage + CI (unit + integration count, coverage %, CI matrix,
     smoke tests)
  7. Documentation (README structure, ARCHITECTURE, CONTRIBUTING, CHANGELOG,
     hand-curated vs auto-gen rot)
  8. Domain depth (Salesforce skills accuracy + breadth)
  9. Security + scope enforcement (scope.json, secrets, supply chain,
     redaction, threat model)
 10. Migration story (V1 → V3 backfill tool, breaking-change docs, namespace
     coexistence)
 11. Performance + cost (hook latency, daemon ping, local-LLM offload,
     token cost reduction)
 12. Public-release readiness (LICENSE, CONTRIBUTING, CHANGELOG, issue
     templates, SECURITY.md)

Output (markdown, in this exact order):

  # Plugin comparison: V1 vs V3

  ## Executive summary
  ≤ 200 words. Top finding. Bottom line.

  ## Per-axis scorecard
  | Axis | V1 | V3 | Δ | Evidence | Risk | Recommendation |
  |---|---|---|---|---|---|---|
  (one row per axis with file:line citations)

  ## Top 5 wins for V3
  Each item: claim + evidence + impact.

  ## Top 5 risks for V3
  Each item: risk + likelihood + impact + mitigation + owner role.

  ## Silent regressions (capability lost without replacement)
  List each. If none: say "none detected" explicitly.

  ## Migration impact for existing V1 users
  - User personas affected (admin / dev / end user)
  - Breaking changes
  - Migration steps
  - Estimated effort per persona

  ## Pre-release blockers
  Numbered list. Each item: blocker + remediation + estimated effort.

  ## Recommendation
  GO | NO-GO | GO with conditions: <list>

Rules (non-negotiable):
  - Every claim cites file:line. No bare assertions.
  - Distinguish "removed because duplicate of native Claude Code" from
    "removed by accident or oversight."
  - If V1 has a feature V3 lacks, classify: replaced (cite replacement) /
    obsolete (cite reason) / regression (flag).
  - Flag any V3 deps with security advisories.
  - Use the actual files in the repos. Do not fabricate paths.
```

---

## Prompt variants

### Short (exec summary, ~2 pages)

Use when audience is leadership / non-technical. Drop the per-axis matrix; keep summary, top wins, top risks, recommendation.

```
Compare V1 (${V1_ROOT}) and V3 (${V3_ROOT}). 2-page exec summary:
- 200-word headline
- Top 5 wins for V3 (with evidence)
- Top 5 risks for V3 (with mitigations)
- Migration impact summary
- Go / no-go recommendation for v1.0.0

Rules: cite file:line, no fabrication, end with explicit recommendation.
```

### Medium (the full master prompt above)

Use for tech-lead / engineering review.

### Deep (per-file forensic)

Use when shipping requires a defensible audit trail. Add this directive to the master prompt:

```
ADDITIONAL: produce a per-file change log. For every TS file in V3 src/,
state: ported from V1 (file:line) | new in V3 | rewritten from V1 (justification).
For every dropped V1 service, state: replaced by (V3 path or native CC) |
deleted with reason.
```

---

## Workflow recipes — chaining V3 skills to produce the comparison

Don't have time to staff 12 humans? Chain V3's existing skills to produce the comparison output without writing new code.

### Recipe A — fast comparison (~30 minutes)

```
1. /siftcoder:codemap-fast on V1 → save output as v1-map.md
2. /siftcoder:codemap-fast on V3 → save output as v3-map.md
3. /siftcoder:codemap-diff between v1-map.md and v3-map.md → diff report
4. /siftcoder:gap-analysis with target=V1 inventory, actual=V3 → gap list
5. Run the medium master prompt above with the three reports as input context
```

### Recipe B — deep comparison (~half a day)

```
1. /siftcoder:codemap on V1 (full)  → V1 baseline
2. /siftcoder:codemap on V3 (full)  → V3 baseline
3. /siftcoder:codemap-diff          → semantic diff
4. /siftcoder:codemap-trust on V3   → V3 module risk scores
5. /siftcoder:reverse-spec on V1    → recovered V1 spec
6. /siftcoder:reverse-spec on V3    → recovered V3 spec
7. /siftcoder:gap-analysis (V1 spec → V3 impl)
8. /siftcoder:archaeologist on each V1 component dropped → why-it-existed audit
9. /siftcoder:blast-radius on V3 → migration risk for V1 users
10. /siftcoder:polyglot if cross-lang boundaries differ
11. /siftcoder:salesforce-architect agent for SF axis (if applicable)
12. Master prompt with all reports as input → final comparison
```

### Recipe C — hand-off to a human team

```
1. Run Recipe B → produces a comparison draft
2. Hand draft + this method doc to:
   - Architect (axes 1, 3, 11)
   - Tech lead (axes 5, 6)
   - BA (axis 10)
3. They sign off or escalate concerns
4. Optional: full 12-role review for high-stakes orgs
```

---

## How this doc relates to other V3 artefacts

- `docs/QUALITY-GATE.md` — V3 self-review using the same axis frame
- `docs/FINAL-REPORT.md` — V3 rebuild engagement closing report
- `docs/MIGRATION.md` — V1 user-facing migration guide
- `docs/USE-CASES.md` — when to reach for which skill in normal use

This document is the **methodology** for producing comparison reports. It does not produce the report — it tells you how to.

---

## What this method does NOT do

- It does not produce the actual V1 vs V3 report (run the prompt or the recipe to get one)
- It does not automate role hand-offs (a future `plugin-compare` skill could)
- It does not validate vendor / supply-chain CVEs (use `npm audit` + `/security`)
- It does not replace human judgement on UX or domain accuracy — those need real users / SMEs

---

## Document version

- 1.0 — 2026-05-01 — initial method, 12 axes, 12 roles, master prompt + 3 variants + 3 recipes
