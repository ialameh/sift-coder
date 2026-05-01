# Architecture

`/siftcoder:sf-architect` is the highest-level Salesforce skill in the pack. It dispatches the `salesforce-architect` agent to produce a written assessment of an org — capacity, security, integrations, tech debt, and a roadmap. Read-only by design. The output is a document you can share with leadership, drop into a project README, or use as a baseline for a quarterly review.

This chapter covers the agent itself, the supporting skills (`org-comparison-tool`, `repo-vs-deployed-analyzer`), and walks through a worked example of using them for a quarterly review.

## What the agent produces

A single markdown report with these sections:

1. **Executive summary** — three to five lines that someone non-technical can read.
2. **Capacity table** — current usage versus org limits. Storage, active users, custom objects, API calls, async slots, triggers per object, flows per object.
3. **Top 3 risks** — severity-ranked, each with mitigation steps.
4. **Top 3 wins** — things the org is doing well, called out so they don't get refactored away accidentally.
5. **Risk register** — the full list of findings with severity, evidence, and recommended action.
6. **Roadmap** — quick wins (one sprint), structural fixes (one quarter), strategic bets (one year).
7. **Diagrams** — Mermaid for the data model, integration topology, and environment topology.

The agent is read-only. It does not modify metadata. It does not deploy. It writes a report.

## Capacity — the early-warning signals

Salesforce orgs hit a capacity wall before they hit a hard limit. The agent flags soft signals at thresholds well below the hard cap:

| Limit class | Soft signal at |
|---|---|
| Storage (data + file) | 70% utilisation |
| Active users | 80% of license cap |
| Custom objects | 80% of edition cap |
| API calls | sustained > 60% of 24h limit |
| Async Apex slots | > 50% concurrent |
| Workflow/Flow per object | 5+ active |
| Triggers per object | > 1 (use a single dispatcher) |

If your org crosses any of these, the report flags it and recommends a path. Custom-object cap means consolidating models or upgrading edition. API-call sustained pressure means shifting to bulk patterns or pub/sub. Multiple active triggers per object means moving to a dispatcher pattern (the `apex-patterns` skill handles this).

## Security and sharing

The architect runs the security skill's rules (`with sharing` discipline, CRUD/FLS, Named Credentials) but adds the org-level config layer:

- Org-wide defaults — Private as the floor for sensitive objects.
- Role hierarchy — depth, breadth, places where it bypasses sharing.
- Permission sets vs profiles — profiles should hold baseline access only; differentiation goes in permission sets.
- Permission set group drift — explicit grants outliving the role they were created for.

For a security-flavoured review, run `/siftcoder:sf-architect --scope security`. The output is the same shape but every finding is security-related. Useful right before an audit.

## Integration patterns

The agent reads `force-app` for outbound callouts, inbound REST/SOAP services, Platform Events, Change Data Capture subscribers, and Pub/Sub API consumers. It maps them to the standard integration patterns:

| Pattern | When | How |
|---|---|---|
| Request-Reply (sync) | UI needs the answer now | Apex callout via Named Credential |
| Fire-and-forget | downstream can be slow or unavailable | Platform Events, Change Data Capture |
| Batch sync | high volume, off-hours | Bulk API 2.0 from MuleSoft / Fivetran / etc |
| Pub/sub | many subscribers, real-time | Pub/Sub API (gRPC) |
| Composite | multiple ops in one round-trip | Composite REST |

Mismatches show up in the risk register. Synchronous callouts to a slow downstream service are flagged because they consume Apex CPU during peak; batch syncs that should be event-driven are flagged for the same reason.

## Tech-debt heuristics

The report scores the org against a handful of objective measures:

- Apex coverage (target: > 85%)
- Active triggers per object (target: ≤ 1, dispatcher pattern)
- Active Flows per object (target: ≤ 3, consolidate)
- Custom fields per object (review at > 200, dangerous at > 500)
- Hardcoded ids in code or Flow (target: 0)
- Unmanaged metadata diff between orgs (target: 0 unintended)

The last one — unmanaged drift — is where `repo-vs-deployed-analyzer` and `org-comparison-tool` come in.

## `repo-vs-deployed-analyzer`

This skill compares your local source repository against what's actually running in a target org. The two are supposed to match. They never quite do.

`/repo-vs-deployed-analyzer --target-org production` reads:

- Local source from `force-app/`
- Live metadata from the target org via `sf project retrieve`
- The diff

Output is a list of components where source and org disagree:

- **In source, not in org** — code that hasn't been deployed (or was rolled back).
- **In org, not in source** — config drift, usually from someone editing in the org UI (the classic "I just made one small fix in production" path).
- **Different in source vs org** — where someone modified the org and someone else modified source independently.

Drift is unavoidable — admins make changes in setup, support engineers patch a flow at 2am — but it should be visible. The skill produces the visibility. Run it before every release and run it at the start of every quarterly review.

## `org-comparison-tool`

Where `repo-vs-deployed-analyzer` compares source against one org, `org-comparison-tool` compares two orgs against each other. Useful when:

- You have multiple production orgs (post-merger, multi-region) and want to see where they've diverged.
- You're debugging a "works in sandbox, fails in UAT" issue and want to know what's different about the orgs.
- You're standing up a new sandbox and want to validate it matches the source-of-truth org.

`/org-comparison-tool --org-a production --org-b uat` produces a structured diff of objects, fields, validation rules, flows, classes, profiles, and permission sets. The output is similar to `repo-vs-deployed-analyzer` but pairwise instead of one-versus-source.

## Worked example: a quarterly org review

You run a Salesforce org for a mid-sized company. Eighty users, six years old, originally a sales org now expanded to support and finance. Your CIO has asked for a state-of-the-org review. Here's the flow.

Step one — make sure your local source is in sync.

```bash
git checkout main
git pull
sf project retrieve start --source-dir force-app --target-org production
git status
```

If the retrieve produces a non-empty diff, that's drift right there. Either commit it (someone made changes that should be in source) or revert it (someone made changes that shouldn't have happened). Either way, decide before continuing.

Step two — run repo-vs-deployed.

```bash
/repo-vs-deployed-analyzer --target-org production
```

The skill produces a list of drift items. You read it, you decide what to do with each, and you commit the source updates so the next steps work against an accurate baseline.

Step three — run the architect.

```bash
/siftcoder:sf-architect --target-org production
```

The agent reads the metadata, queries the org for capacity stats (with your auth), runs the heuristics, and writes the report. Takes ten to fifteen minutes for a moderately complex org.

You read the report. The executive summary says:

> Six-year-old sales-and-support org, 247 active users, 89 custom objects. Apex coverage at 71% (below target). Three custom objects approaching field-count danger zone (>400 fields each). Integration topology has two synchronous callouts that should be event-driven. Org-wide defaults appropriate for the data model. Top three risks: Apex coverage, field saturation on Account/Contact/Case, synchronous integration to legacy ERP.

Step four — share the report. The output is markdown. Drop it in your wiki, your project README, or share it with leadership. The risk register is the part executives care about. The roadmap is the part the engineering team cares about.

Step five — capture to memory. The agent writes the report to a file, but the *event* — that this review happened, on this date, with these findings — is captured to the memory store automatically. Three months later when you run the next quarterly review:

```bash
/siftcoder:sf-architect --target-org production
```

…the agent surfaces the previous report first. The new report can then be a *delta*: what changed since last quarter, what's improved, what's gotten worse, what new risks appeared. The compounding effect of having last quarter's report in context makes each subsequent review better than the one before it.

Step six — pick the work. You translate the roadmap into actual tickets. Quick wins go into the next sprint. Structural fixes go into the quarter plan. Strategic bets go into the annual roadmap.

That's the cycle. Quarterly. The first one is the most painful because the org is being seen for the first time; the second is half the effort because most of what changed is incremental; the third onward is a maintenance rhythm rather than a fire drill.

## When to skip the architect

A few cases where the agent is overkill:

- **A specific bug.** Use `/siftcoder:investigate` or `/siftcoder:sf-debug` instead.
- **A specific class review.** Use `/siftcoder:sf-security` or `/siftcoder:apex-patterns review` instead.
- **A new project on a new org.** There's nothing to review. Run it after six months of usage.
- **Tiny orgs.** A 200-user org with twenty custom objects and a single integration doesn't need a quarterly architect review. Run it once a year.

## How the agent grounds itself

A note on what the agent reads versus what it makes up. The agent has access to:

- The local sfdx project (read via `Read`, `Glob`, `Grep`).
- The target org via `sf` CLI calls (read via `Bash`).
- Memory of previous reviews (read via `mem_search`, `mem_get`).

It does *not* have access to:

- Slack conversations.
- Tickets in Jira/Linear.
- Whatever's in your team's heads.
- Any data from outside the workspace.

If the report says "this org has X" — X exists in the metadata or in a memory citation. If you read the report and a finding doesn't match reality, either the finding is wrong (push back; the agent can be re-run) or your understanding is out of date (the metadata says the thing exists). The agent's rule is "no claim without evidence" — that's the leverage.

## Cross-references

- [Schema](schema.md) — for the metadata-level diff that grounds the architect's data-model section.
- [Deploy](deploy.md) — for what to do with the roadmap items once they're scoped.
- [Security](security.md) — for the security-scoped variant of this review.
- The agent body is at `agents/salesforce-architect.md`. The skill is at `skills/salesforce/salesforce-architecture/SKILL.md`.

That closes the Salesforce tab. Onward to the [Cookbook](../cookbook/index.md), where the recipes mix domains.
