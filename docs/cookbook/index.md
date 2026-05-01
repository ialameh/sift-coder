# Cookbook

The rest of the guide explains *what each piece does*. This tab is different — each chapter walks through a real workflow end-to-end. Onboarding a new repo. Capturing a debugging session you'll want back next week. Doing a multi-agent refactor without losing the plot. Running a Salesforce migration in phases.

A recipe is not a feature reference. It's "here's a thing I actually did, in order, with the commands I ran and what I saw." If a feature doesn't help in the recipe, the recipe doesn't mention it. If a feature helps but only on one line, the recipe spends one line on it.

## What's here

[Onboarding a repo](onboarding.md) — what to do in the first week with a fresh checkout, including the often-skipped backfill step that lets SiftCoder hydrate from your existing Claude Code transcripts.

[Capturing a debugging session](debugging.md) — using `/siftcoder:investigate` to keep your hypothesis tree on disk, tagging memories with `dig-note`, and coming back to the trail three days later via `dig-history` or `mem_search`.

[Building a pattern library](patterns.md) — `pattern-learn`, `pattern-search`, `pattern-list`. How a handful of named patterns compound into a personal style guide that shows up in retrieval when you need it.

[Multi-agent refactors](swarm.md) — `/siftcoder:swarm` and `/siftcoder:agent`. When parallel agents win, when they lose, and the file-locking discipline that keeps them from colliding.

[Ghost mode](ghost.md) — `/siftcoder:ghost` for solo coding without LLM input. Why a senior engineer might want capture and retrieval but not pair-programming.

[Salesforce migration](sf-migration.md) — a multi-week migration project broken into phases, mixing the schema, data, automation, and deployment skills.

## How to read these

Each recipe assumes you've installed SiftCoder and the daemon is running. If that isn't true yet, [the quickstart](../quickstart/index.md) is five minutes and gets you to the starting line.

Recipes are written from a single point of view — usually a person at a keyboard with a problem — rather than as a reference. They include the false starts and the moments where you'd reasonably stop and think. That makes them longer than a feature page would be, but the goal is to show the *shape* of the workflow, not just the names of the commands.

A recipe that includes Salesforce will be marked. The non-Salesforce recipes are platform-agnostic.
