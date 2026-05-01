# Capturing a debugging session

Most debugging sessions disappear into the air five minutes after they end. You chased a bug for three hours, you found the cause, you wrote a one-line fix, you closed the laptop. A week later the bug shows up again — different symptom, same underlying cause — and you start the chase from zero because the trail is gone.

This recipe is about not losing the trail. The mechanics are: use `/siftcoder:investigate` for hypothesis-driven analysis (it captures automatically), tag the session with `/siftcoder:dig-note` when you want a marker, and come back via `mem_search` or `/siftcoder:dig-history` later.

## The shape of a captured investigation

`/siftcoder:investigate` is not a fix command. It's read-only by contract. You point it at a question and it produces a written report — hypothesis tree, evidence collected, conclusion, recommended next action. It does not modify code. The report lives in the memory store with provenance edges to every file and command it referenced.

The discipline forced by the workflow is the value. You can't ramble. You have to state the question in one line. You have to enumerate hypotheses before testing them. You have to cite evidence (file:line, log line, command output) for every claim. The result is a record that survives.

A typical invocation:

```
/siftcoder:investigate "CI build fails intermittently with 'Cannot read property json of undefined' in the integration tests, only on the merge queue runner, only after midnight UTC"
```

The skill produces:

```
Question:   CI build fails intermittently with 'Cannot read property json of undefined' in
            integration tests, only on merge queue runner, only after midnight UTC.

Method:     Reviewed last 30 days of CI runs, read the test setup, read the integration
            test code, traced the assertion path.

Hypotheses:
  H1 [ruled-out] — Test data contamination from prior run
     Evidence: tests/setup.ts line 14 truncates DB before each suite; verified.
  H2 [confirmed] — Timezone-dependent test fixture expects UTC date but runner uses local
     Evidence: tests/integration/orders.spec.ts line 67 uses `new Date()`; runner is
               configured with TZ=America/New_York; after midnight UTC = late evening
               local; date crosses day boundary; fixture asserts date matches stored value.
  H3 [inconclusive] — Network flake in fixture loading
     Evidence: no network calls in this path; ruled out functionally.

Conclusion: H2 confirmed. Test uses local-time `new Date()` to compute "today's orders"
            but compares to a fixture that pre-computes "today" at the time the test was
            written, in UTC. After UTC midnight, runner local clock and fixture local
            clock are on different dates.

Next:       Replace `new Date()` in test with explicit UTC date construction, or freeze
            time in test setup with a fixed date.

Captured:   summary:1247
```

That report is now in memory. The events that produced it (every Read, every Grep, every Bash command) are linked as provenance.

## Worked example: a flaky CI failure tracked across three days

This is a real shape, abstracted slightly. Tuesday morning a test starts failing intermittently. By Thursday afternoon it's resolved. The trail is captured throughout, because that's the recipe.

### Tuesday morning

The CI build for your repo fails. Not consistently — once out of every four or five runs. The symptom is the same each time: an integration test for the orders module throws `TypeError: Cannot read property 'json' of undefined`. Locally, the test passes every time.

You don't have time to dig in right now (you have a meeting in 15 minutes). But you don't want this to disappear into the bug-tracker void. So:

```
/siftcoder:investigate "intermittent CI failure: orders integration test throws 'Cannot read property json of undefined'; locally passes; appears ~1/5 CI runs"
```

The skill takes about two minutes. It reads the test, reads the failing CI logs (you paste them in or it pulls from the configured CI), forms three hypotheses (timing, env diff, network flake), gathers initial evidence on each, and concludes that none of them are confirmed yet — it needs more data, specifically logs from a few more failing runs.

The report is captured. You add a marker:

```
/siftcoder:dig-note "tracking flaky CI failure; need 3-4 more failing runs before next investigation pass"
```

The note is also captured. Now go to your meeting.

### Tuesday afternoon

Three more CI runs fail with the same error. Now you have data. Re-run the investigation:

```
/siftcoder:investigate "follow up on flaky CI failure - have 4 logs now"
```

The skill recognises the topic from memory, surfaces the previous report ("we investigated this Tuesday morning, conclusion was 'needs more data'") and continues from there. You paste the four logs. The skill compares them, finds a pattern: every failure has a timestamp between 23:50 UTC and 00:30 UTC. The local-time machine is on a date boundary.

Hypothesis ranking shifts. Timing is now the leading candidate. The skill asks you to confirm by reading `tests/integration/orders.spec.ts` and looking for date logic.

You read it. There's a `new Date()` call. You confirm. The skill marks H2 confirmed (timezone-dependent fixture). Recommended next: fix the test to use UTC.

But you don't have time to fix it now (it's 4pm and you have a code review). Tag and stop:

```
/siftcoder:dig-note "ROOT CAUSE confirmed: tests/integration/orders.spec.ts line 67 - new Date() vs UTC fixture. Fix tomorrow."
```

Two summaries in memory now: the original investigation, the follow-up. Both linked.

### Wednesday — distraction

You don't get to it. Other priorities. The CI keeps flaking but only at night, so the day team doesn't see it.

### Thursday morning

Time to fix. You don't remember the details — you remember "something about UTC and a test." Search:

```
mem_search { query: "CI flaky orders test UTC" }
```

Top hit: Tuesday afternoon's investigation report with the line number and the fix recommendation. You read it. Two minutes later you know exactly what to change.

You apply the fix:

```
/siftcoder:fix "tests/integration/orders.spec.ts uses new Date() but should use UTC; replace with explicit UTC construction"
```

The fix workflow makes the change, runs the tests locally, commits. The investigation summaries are linked as context — the fix references the prior analysis.

You push. CI runs. CI passes (it's daytime; you'll see whether it still flakes overnight).

### Thursday night

Watch the CI dashboard at midnight. Three runs straddling the UTC boundary. All pass. Fix confirmed.

Add a final note:

```
/siftcoder:dig-note "fix confirmed: orders test was using local-time new Date() vs UTC fixture; replaced with explicit UTC. Three midnight runs passed."
```

### Friday — coming back

You're working on a different test, in a different module, that does something similar with dates. You vaguely remember "we had a date thing recently."

```
mem_search { query: "date timezone test" }
```

The orders investigation surfaces. You read it. You apply the same fix preemptively. You don't get bitten twice.

That's the cycle. Investigation → tag → distraction → search → resolution → tag. The memory store is the one that doesn't forget.

## Tools by name

A quick reference of the commands used:

- **`/siftcoder:investigate`** — read-only hypothesis-driven analysis. Produces a structured report. Captured to memory.
- **`/siftcoder:dig-note`** — attach a free-text note to the current area. Useful as a marker between investigation passes.
- **`/siftcoder:dig-history`** — browse the dig timeline for the current area. Time-ordered, with markers visible.
- **`/siftcoder:dig-search`** — search across all dig notes (a subset of `mem_search` scoped to dig events).
- **`mem_search`** — the general memory search MCP tool. Hits everything: events, summaries, notes, patterns. Use this when you don't remember the topic precisely.

The dig family is shaped for "this is an ongoing investigation that I want to come back to in chunks over days." `mem_search` is shaped for "I think we did something about X some time recently."

## What gets captured automatically vs. what you tag

Capture happens on every tool call. If you opened a file, that's captured. If you ran a Bash command, that's captured. The summarising step groups related events into searchable summaries.

What you don't get for free:

- **Why** you opened those files (was this a feature? a bug hunt? exploratory?)
- **The conclusion** of an investigation that didn't run through `/siftcoder:investigate`
- **Markers** for "this matters, surface it later"

That's what tags are for. A `dig-note` is essentially a one-line summary you write yourself, and it gets the same retrieval treatment as automatic summaries.

The rule of thumb: tag when you'd want to find it again. Don't tag every minor moment. The signal-to-noise ratio of tags matters; if you tag everything, retrieval starts surfacing the wrong things.

## Coming back days later

The most useful thing about captured investigations is they survive context window resets and laptop reboots. A few patterns:

**"What did we conclude about X?"** — `mem_search { query: "X conclusion" }` or `mem_search { query: "X" }` and look at the summaries. The investigation report is shaped to be the top hit because its summary is dense and cites everything.

**"Did we already investigate this?"** — Run `/siftcoder:investigate` on the topic again. The skill will surface prior investigations on the same area before starting a new one. If there is one, you can either continue it or start fresh.

**"What did I do last Tuesday?"** — `mem_timeline { id: <some_id_from_tuesday> }` returns a window of summaries around that point. Useful when you remember roughly when something happened but not what.

**"Why does this code look this way?"** — `mem_why { id: <summary_id> }` returns the provenance chain. If a summary cites a particular file, `mem_why` shows the events that fed that summary, including the decisions and discussions.

The point isn't to use every command on every problem. It's to know that the trail exists and to reach for it before re-deriving from scratch. The first time you use it on a real bug and skip an hour of re-investigation is the moment it becomes a habit.

## When the recipe doesn't help

A few cases where this approach is overkill:

- **Trivial bugs.** The error message tells you the line; the fix is one character. Don't dignify it with an investigation.
- **Bugs you fix in under five minutes.** Capture happens automatically; that's enough.
- **Bugs in code you'll never touch again.** Throw-away scripts, one-off ETL jobs. Move on.

The recipe earns its keep on bugs that take hours, or that recur, or that touch parts of the codebase you'll keep working with. Those are the ones where a captured trail compounds.
