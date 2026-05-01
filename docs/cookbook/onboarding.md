# Onboarding a new repo

You've cloned a project. You're going to work on it for the next month. You want SiftCoder to start remembering this codebase from day one, not a week later when you finally get around to setting it up.

This recipe walks through the first week of working on a fresh checkout. The example is a small Node project — say, a Fastify API with about 60 source files, owned by another team, that you've been asked to add a feature to. The same shape works for any codebase; the proportions just change.

## Day 1 — install and capture the existing trail

You have two relevant prior states. First, your existing Claude Code transcripts may already cover the project (someone on the team used Claude here before, or you yourself opened the repo last month and forgot). Second, your local machine has — or doesn't have — the SiftCoder plugin and the daemon.

Step one — install the plugin if it isn't already.

```bash
git clone https://github.com/ialameh/sift-coder.git
cd sift-coder
npm install
npm run build
```

Then in Claude Code, register it:

```
/plugin install /path/to/sift-coder
```

Step two — set up Ollama if you want local-LLM offload (recommended; a 16 GB laptop runs fine with `llama3.2:3b` and `nomic-embed-text`).

```bash
brew install ollama && brew services start ollama
ollama pull llama3.2:3b nomic-embed-text
```

Step three — onboard. There's a wizard for this:

```
/siftcoder:onboard
```

The wizard probes your environment (Ollama? Anthropic key? daemon running?) and proposes a single happy path. Confirm and it sets up `~/.siftcoder/`, starts the daemon for the current workspace, and writes a starter scope file to `.siftcoder/scope.json` that scopes writes to your repo root.

Step four — backfill from prior transcripts.

```bash
node bin/siftcoder.mjs backfill
```

This is the step most users skip and regret. The backfill scans `~/.claude/projects/<encoded-cwd>/*.jsonl` for prior Claude Code sessions in this workspace and replays them through the same capture path that live tool calls go through. Five minutes of scanning gives you weeks of prior context — what files were touched, what bugs were chased, what patterns were tried.

If this is genuinely the first time anyone has used Claude on this repo, the backfill returns zero events and that's fine. If it returns hundreds, that's the gold you want.

Step five — verify capture is working. Open a Claude Code session in the repo, ask it to read a file, and run:

```
/siftcoder:mem status
```

You should see the events counter ticking. If it isn't, see [Troubleshooting](../operations/troubleshooting.md) — almost always it's the daemon not running or the hooks not registered.

## Day 1 — first real interaction

Now do something real. The point on day one isn't to set up infrastructure forever; it's to get to working state and let capture happen in the background while you get oriented.

A common move on a new codebase:

```
/siftcoder:reverse-prompt quick
```

This walks the codebase and produces a single conversational prompt that would rebuild the project from scratch. Think of it as "the README the original author would have written if they'd known you were going to read it." It takes a few minutes and the output is captured to memory, so when you ask Claude later "what's the architecture of this thing?" the prompt-rebuilder context surfaces.

Another good early move:

```
/siftcoder:codemap-fast
```

Quick structural scan — directory layout, modules, main entry points. Faster than `codemap` (the deep version), and enough for orientation. The output goes into memory along with everything else.

By end of day 1 you should have:

- The daemon running
- A backfill done (or confirmed empty)
- A scope file at `.siftcoder/scope.json`
- One or two real interactions captured (a reverse-prompt, a codemap-fast, or just opening files)

Stop. Tomorrow is real work.

## Days 2-7 — let capture happen, do your job

This is the boring part of the recipe and the most important one. You don't need to do anything special. Just work on the codebase like you normally would. Open files, read code, run tests, write the feature, fix the bugs, commit the changes. Claude Code's hooks fire on every tool call. The daemon collects, summarises, and embeds in the background.

A few things that will happen and what to do about them:

**The daemon log fills up.** That's normal. Look at it occasionally:

```bash
tail -f ~/.siftcoder/default/logs/<workspace>.ndjson
```

If the consolidator is throwing errors (Ollama unreachable, model not pulled, etc.) you'll see them here.

**The web UI is useful.** Open it once or twice during the week to see what's been captured:

```
/siftcoder:mem web
```

Browse the events list. You'll see a roughly chronological view of what you and Claude did together. Click into a summary to see the events it consolidates and the provenance edges. This is how you internalise what the memory store actually holds.

**Suggestions start surfacing.** By day three or four, when you ask Claude something, it'll pull relevant prior memories into its context automatically. Things like "we already grepped for this last week — here's what came up." That's the whole point. The first day or two it's silent because there's nothing to surface yet.

## End of week — review, prune, configure

Friday afternoon, do a review. Twenty minutes well spent.

Step one — what got captured?

```
/siftcoder:mem info
```

You'll see counts: events, summaries, embeddings, total bytes on disk. For a normal week, expect anywhere from a few hundred to a few thousand events depending on intensity. Anything in the millions and something's wrong (capture loop, runaway test suite spamming `Read` on the same files).

Step two — open the web UI and skim. Look for:

- **Repetition.** If you see twenty captures of "Read README.md" — fine, but the summaries should consolidate them. If they're all separate summaries, the consolidator is being lazy. Force a drain:

  ```
  /siftcoder:mem drain 32
  ```

- **Sensitive content that leaked through.** The redaction patterns are good but not perfect. If you see API keys or tokens that the redactor missed, that's a bug — file an issue and prune those events:

  ```
  /siftcoder:memory-curator prune --query "<the leaked thing>"
  ```

- **Captures from outside the project.** Shouldn't happen — workspaces are scoped — but if you see anything weird, the workspace key may be confused (symlinks, multi-root setups).

Step three — set up a project-level scope file. The starter `.siftcoder/scope.json` allows writes to the entire repo root. For most projects you want tighter:

```json
{
  "version": 1,
  "writeAllow": [
    "src/**",
    "test/**",
    "*.md",
    "package.json"
  ],
  "writeDeny": [
    "node_modules/**",
    "dist/**",
    ".env*"
  ]
}
```

The boundary enforcer (`PreToolUse` hook) blocks `Write` and `Edit` outside `writeAllow`, even if Claude tries. This is your accidental-edit safety net. Worth tightening as the project takes shape.

Step four — commit `.siftcoder/scope.json` to the repo. Yes, commit it. The scope file describes *what is and isn't editable in this codebase*, which is a property of the codebase, not the engineer. Other team members benefit from the same constraint.

Don't commit `.siftcoder/config.json` or anything else under `.siftcoder/` — those hold per-user state. Add to `.gitignore`:

```
.siftcoder/*
!.siftcoder/scope.json
```

## A small worked example

Here's a condensed version of a real first week with a fresh Node API checkout.

**Monday morning.** Cloned the repo, ran `npm install`, ran the test suite to confirm it passes. Total interactions with Claude: opened three files to get oriented. Memory store has 8 events, no summaries yet (they take 30 seconds to start consolidating).

**Monday afternoon.** Asked Claude to help me find where authentication is enforced. It greps, reads four middleware files, finds the JWT validator. Memory now has 18 events, 3 summaries.

**Tuesday.** Asked Claude to add a new endpoint. It reads the existing endpoint patterns, scaffolds the new one, writes a test. I tweak. We commit. Memory has 47 events, 9 summaries. The summaries include things like "auth is JWT-validated in `src/middleware/auth.ts`, requires `Authorization: Bearer <token>`, throws 401 on missing or expired."

**Wednesday.** A test starts failing intermittently. I ask Claude to investigate. `/siftcoder:investigate` runs hypothesis-driven analysis, finds it's a timing issue with the JWT expiry mocking. We fix. Memory has 89 events, 14 summaries. The investigation report is in there as a single summary with provenance edges back to the test files.

**Thursday.** Same test breaks again differently. Search:

```
mem_search { query: "JWT expiry timing test" }
```

Top hit: Wednesday's investigation. Claude reads it, recognises this is a different manifestation of the same underlying issue, proposes a different fix. Saves an hour.

**Friday.** Review. The web UI shows everything captured. I prune three events that contain a test fixture with a fake (but suspicious-looking) credit card number. I commit `.siftcoder/scope.json`. I write a one-paragraph note to my memory:

```
/siftcoder:dig-note "starting feature X next week; auth context is already in memory, see investigation summaries 14 and 23"
```

Next week, when I open this repo again and Claude greets me with "ready to continue," it has all of this as context.

## What this buys you long-term

The first week feels like a small overhead. The payoff isn't visible until week three, when you've forgotten what Tuesday's debugging session concluded and `mem_search` returns it in two seconds. By month two, every "wait, didn't we already...?" gets answered. By month six, the new engineer who joins the team can run a backfill on your transcripts and get most of your context without you having to spend a day onboarding them.

The recipe is simple: install, backfill, scope, work, review. The trick is doing it the first day instead of the third week.
