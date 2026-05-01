# Salesforce

A confession before anything else: SiftCoder ships with a Salesforce domain pack because the author works in Salesforce every day. Most of the workflows in this section started life as something he reached for at his actual job, found wanting, and rebuilt as a skill. None of them are speculative. Each one is a thing that has saved an afternoon or stopped a deploy from breaking production at least once.

That bias is worth flagging. If you don't work in Salesforce, this whole tab is dead weight in your sidebar — skip it. The rest of the guide is platform-neutral and you lose nothing by ignoring this corner.

If you do work in Salesforce, you've probably already noticed that generic LLMs are *almost* good enough for the platform but never quite. They know what `with sharing` is. They'll write a trigger for you. But they'll also happily write SOQL inside a loop, hand you `system.runAs(adminUser)` in a test that's supposed to verify a non-admin path, and recommend `RunAllTestsInOrg` for a fifteen-minute deploy when `RunLocalTests` would do it in two. The platform has too many small, sharp rules for a model trained on the open internet to internalise them. SiftCoder fills the gap with explicit skill files that the model reads when the topic comes up.

## What's in the pack

Twelve domain skills under `skills/salesforce/`:

- `salesforce-apex` — class structure, governor limits, bulk safety, FFLib enterprise patterns
- `salesforce-lwc` — wire adapters, lifecycle hooks, events, perf, jest patterns
- `salesforce-deploy` — `sf` CLI usage, validate vs deploy, test levels, rollback honesty
- `salesforce-architecture` — capacity planning, sharing model, integration patterns, tech debt
- `salesforce-test` — test data factories, `Test.startTest`, mocking, bulk verification
- `salesforce-flow` — Flow design, automation conversion, fault paths
- `salesforce-cpq` — quote line, price rule, product rule patterns
- `salesforce-agentforce` — agent action design, prompt templates, action invocation
- `salesforce-einstein` — prediction integration, GenAI feature wiring
- `salesforce-security` — sharing, CRUD/FLS, callout security, secrets, OWASP-on-Salesforce
- `salesforce-comply` — HIPAA / FedRAMP / industry-specific overlays
- `schema-migrate` — object/field/relationship migration with diff, risk, and rollback

Four agents under `agents/`:

- `salesforce-architect` — read-only org review with a real risk register
- `apex-bulkifier` — narrow refactor agent that takes one row-by-row class and makes it batch-safe
- `lwc-debugger` — wire / lifecycle / state diagnosis without touching files yet
- `memory-curator` — store maintenance (not Salesforce-specific, but ships with this pack because the SF skills generate a lot of memory)

Plus the slash-command wrappers (`/siftcoder:apex-patterns`, `/siftcoder:sf-deploy`, `/siftcoder:sf-architect`, `/siftcoder:sf-security`, `/siftcoder:lwc`, `/siftcoder:lwc-debug`, `/siftcoder:schema`, `/siftcoder:schema-migrate`, and a dozen others) that let you invoke a skill directly without waiting for the trigger description to fire.

## Trade-offs of the pack vs. plain Claude

Be honest about what you give up by routing through these skills.

**You give up speed on tiny questions.** Asking "what does `with sharing` do" through `/siftcoder:sf-security` is overkill. The skill is structured for a real review, not a one-line definition. For trivia, just ask Claude directly.

**You give up flexibility.** The skills are opinionated. They will tell you to use FFLib for non-trivial domains. They will refuse to write SOQL in a loop even if you ask nicely. If your shop has a different standard — say, you've banned FFLib because of the dependency footprint — the skill will fight you. That's solvable (project-level overrides in `.siftcoder/config.json` and an additional skill that captures *your* house style) but it isn't free.

**You gain a shared baseline.** Two engineers using these skills produce code that looks like the same engineer wrote it. Every Apex class follows the same structure. Every LWC handles the same wire-adapter error path. That consistency matters more on a team than any single rule the skill enforces.

**You gain memory of decisions.** The architecture review you ran last quarter is in the memory store. When you run `/siftcoder:sf-architect` again, the previous report is surfaced first and the new one builds on it instead of starting from scratch. This compounds.

## What to read

Each chapter is a workflow with a worked example. Read in roughly this order if you're new:

1. [Apex patterns](apex-patterns.md) — the most-touched skill. FFLib, bulk safety, common pitfalls.
2. [Schema](schema.md) — schema and `schema-migrate`. ERD, field-add, lookup migrations.
3. [Deploy](deploy.md) — the `sf` CLI flow. Validate, deploy, quick-deploy, the sad truth about rollback.
4. [Security](security.md) — CRUD/FLS reviews, sharing audits, the security lens of the architect agent.
5. [LWC](lwc.md) — wire adapters, lifecycle, the wire-not-firing debugging walkthrough.
6. [Architecture](architecture.md) — capacity, multi-org strategy, the org-comparison and repo-vs-deployed tools.

If you're not new, the chapters are independent — jump to whichever matches today's problem.

## Where the pack ends and Salesforce begins

A few things are *not* in this pack and won't be:

- A replacement for the `sf` CLI itself. SiftCoder calls `sf`; it does not reimplement deployment.
- Anything that needs a paid Salesforce service (Code Analyzer beyond what its CLI exposes, Shield queries against a live org without your auth, etc.). The pack runs against your local checkout and the orgs you've already authenticated to.
- Live debugging into a sandbox. You still need the standard Apex log retrieval (`sf apex log get`) for that — though `/siftcoder:sf-debug` parses the logs once you have them.
- Salesforce DX project scaffolding. Use `sf project generate` for a new project. SiftCoder picks up from there.

The boundary is roughly: Salesforce gives you the tools and the org, SiftCoder makes Claude better at *using* those tools. It does not replace them.

## A note on the rest of the guide

If you find yourself wanting general-purpose memory or workflow advice while reading these chapters — "wait, how does the memory daemon actually decide what's relevant?" or "what's the difference between `/siftcoder:fix` and `/siftcoder:debug`?" — head back to [Foundations](../foundations/mental-model.md) and [Reference](../reference/slash-commands.md). The Salesforce pack sits on top of all that machinery; understanding the layer below makes the layer above make more sense.

Onward to [Apex patterns](apex-patterns.md).
