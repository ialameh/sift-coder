# Building a pattern library

Most engineers have a private pattern library in their head. The way you structure tests in your favourite language. The retry-with-backoff helper you keep rewriting. The shape of an error class hierarchy you reach for when a project gets serious. Twenty patterns deep, and most of them never get written down because writing them down feels like overhead.

The pattern skills (`pattern-learn`, `pattern-search`, `pattern-list`) exist to make capturing a pattern lighter than writing a Stack Overflow answer about it, and to make retrieval automatic — when Claude is doing a thing where one of your patterns applies, the pattern surfaces in the prompt context.

This recipe walks through building up a small personal pattern library across a few projects.

## What counts as a pattern

A pattern is concrete, named, and reusable. Three tests:

- **Concrete.** "Use SOLID principles" is not a pattern. "Test data factory: `TestDataFactory.createAccounts(N) returns List<Account>` with sane defaults you can override" is a pattern.
- **Named.** It has a 2-4 word identifier. "Test data factory." "Bulk-safe trigger handler." "Retry with jitter."
- **Reusable.** You've used it more than once, or you intend to. One-off code is not a pattern.

The skill enforces these rules. If you try to capture something too vague, it pushes back.

## Capturing a pattern

`/siftcoder:pattern-learn` captures from a source — recent commit, file, PR, or chat block. The skill walks you through naming, distillation, and storage. It's quick (under a minute) but it forces structure.

Example. You're finishing a feature in a Node API. The retry helper you wrote feels generally useful. Capture it:

```
/siftcoder:pattern-learn "src/utils/retry.ts as a pattern - exponential backoff with jitter, configurable cap"
```

The skill reads the file. It produces:

```
Pattern:    Retry with jitter
Problem:    Outbound HTTP calls fail intermittently; need backoff that avoids
            thundering-herd retries.

Shape:
  ```ts
  async function retryWithJitter<T>(
    fn: () => Promise<T>,
    opts: { maxAttempts: number; baseMs: number; capMs: number }
  ): Promise<T> {
    for (let i = 0; i < opts.maxAttempts; i++) {
      try {
        return await fn();
      } catch (e) {
        if (i === opts.maxAttempts - 1) throw e;
        const delay = Math.min(opts.capMs, opts.baseMs * Math.pow(2, i));
        const jittered = delay * (0.5 + Math.random() * 0.5);
        await sleep(jittered);
      }
    }
    throw new Error('unreachable');
  }
  ```

When to use:
  - Outbound calls to a flaky service
  - Background jobs that should self-heal
  - Anything where you'd reach for `setTimeout(fn, retryDelay)`

When NOT to use:
  - Synchronous user-facing requests (degrade UX; show error instead)
  - Operations that aren't idempotent

Source:     src/utils/retry.ts (commit a3b2c1d)
Captured:   pattern:retry-with-jitter
            search via mem_search { query: "retry backoff jitter" }
```

That's the entry. The skill stores it in the memory database with `kind: pattern` and provenance edges back to the source file. It's now searchable.

## Searching for a pattern

A few weeks later, on a different project, you're writing an integration that calls a flaky third-party API. You vaguely remember writing a retry helper but you're not sure where.

```
/siftcoder:pattern-search "retry"
```

The skill searches `kind: pattern` entries:

```
Found 2 patterns:

  pattern:retry-with-jitter
    Outbound HTTP calls fail intermittently; need backoff that avoids
    thundering-herd retries.
    Source: <previous-project>/src/utils/retry.ts (commit a3b2c1d)

  pattern:circuit-breaker-stub
    Stub a downstream that's flaky in tests; cycles through OK/FAIL/OK
    based on call count.
    Source: <other-project>/test/helpers/circuit.ts (commit f0e9d8c)
```

You read the first one. The shape is in the skill output. You copy the function (or have Claude port it to the new project's conventions). Two minutes from "I should write a retry helper" to "I have one."

## Inventorying

`/siftcoder:pattern-list` shows the full catalogue:

```
Patterns (12):

  Apex / Salesforce (4)
    test-data-factory     — create N records w/ overridable defaults
    bulk-safe-trigger     — handler dispatch w/ recursion guard
    selector-base         — FFLib selector w/ field defaults
    api-mock-shape        — mock callout for unit tests

  TypeScript / Node (5)
    retry-with-jitter     — exponential backoff w/ jitter
    typed-error-base      — error class hierarchy w/ codes
    fastify-route-shape   — route + schema + handler structure
    pino-logger-bound     — logger w/ child context for request id
    test-fixture-builder  — fluent builder for test inputs

  General (3)
    git-trailer-co-author — commit trailer for paired work
    pr-template-shape     — sections in PR description that we always want
    runbook-skeleton      — structure of a runbook for incidents
```

This is your library. Twelve entries is small enough to skim, large enough to be useful. As it grows, `pattern-search` becomes the primary access path; `pattern-list` is for the "what's in here" view.

## A worked example: building up a library across three projects

This is the pattern of how a personal library actually grows. It is not "spend a Saturday writing down everything you know."

### Project A — Salesforce org work

Three months in, you've written half a dozen useful Apex utilities. You capture three of them as patterns:

- `test-data-factory` — your standard `TestDataFactory.createAccounts(N)` etc.
- `bulk-safe-trigger` — the handler skeleton you reach for.
- `selector-base` — your FFLib selector starting point.

Total time spent capturing: about ten minutes across three sessions. They're now in memory under namespace `default`.

### Project B — Node API work

Different domain, different codebase. You write a retry helper and a typed error base. Capture both:

- `retry-with-jitter`
- `typed-error-base`

Two more patterns. Now you have five.

### Project C — back to Salesforce, different org

You start a new Salesforce project. You're building a trigger. `pattern-search "trigger"` returns `bulk-safe-trigger` from Project A. You apply it. You don't have to remember the recursion-guard idiom; the pattern has it. Three minutes saved.

While you're at it, you notice you've now reached for `bulk-safe-trigger` enough times that it's worth refining. You update it (capture is once per pattern; subsequent captures update the existing entry):

```
/siftcoder:pattern-learn "update bulk-safe-trigger - add the dml-mode guard we use for after-update vs before-insert"
```

The pattern is now slightly better. Future retrievals get the better version.

### Project D — a teammate's project

A colleague asks for help with a flaky test fixture. You vaguely remember writing something. Search:

```
/siftcoder:pattern-search "fixture builder"
```

`test-fixture-builder` from a different project surfaces. You share the shape. They adopt it.

Patterns travel between projects. The memory store is per-workspace, but `pattern-search` can be scoped to the current workspace or expanded to the namespace level. By default it searches the current workspace; pass `--namespace` to expand.

## When patterns surface automatically

The thing that makes the pattern library worth keeping is that retrieval is automatic. When you ask Claude to "build a retry helper for this API" — Claude calls `mem_search` (or hooks inject memories) and the `retry-with-jitter` pattern is high in the results. Claude reads it, recognises it as an existing house pattern, and uses it as the basis for the new code.

You don't have to explicitly invoke the pattern. It surfaces because it's in memory and the retrieval ranks it as relevant.

This is the compounding effect of keeping a library. The more patterns you have, the more often retrieval surfaces one, and the less you re-derive code from scratch. After a year of capturing roughly one pattern a week, you have fifty patterns. Most decisions are "apply pattern X" rather than "design from blank page." The patterns aren't replacing your judgment — they're encoding judgments you've already made.

## What makes a bad pattern

The skill rejects a few shapes:

- **Generic advice.** "Use SOLID principles." Not a pattern. Not retrievable.
- **One-off code without intent to reuse.** "This is the code I wrote for this exact bug." Not a pattern.
- **Patterns without a when-NOT-to-use.** Every pattern needs an anti-trigger. "Use this for retries" without "but not for user-facing requests" leads to misapplication.
- **Patterns no one will retrieve.** If the description doesn't match how anyone (you included) would search for it, the pattern is invisible. The skill prompts for descriptive keywords as part of capture.

The discipline is light but real. Five-minute captures that won't survive search are worse than no capture.

## Cross-references

- `pattern-learn`: `skills/knowledge/pattern-learn/SKILL.md`
- `pattern-search`: `skills/knowledge/pattern-search/SKILL.md`
- `pattern-list`: thin wrapper that calls `mem_search` with `kind: pattern`.

The pattern skills are the same shape as memory more generally — capture, retrieval, decay, provenance — just scoped to `kind: pattern`. Everything you can do with memory in general (`mem_why`, `mem_timeline`) works on patterns too. They're just memory entries with a tag.

## A note on team patterns

Patterns are personal by default. Each engineer's memory store is theirs. Sharing happens manually right now — export a pattern (`mem_get { id: "pattern:..." }` and copy), or paste the pattern shape into a team wiki. Cross-machine and team-shared memory is on the [roadmap](../project/roadmap.md) but not in the box.

Until then, the model is: each engineer builds their own library, with the occasional "you should grab this pattern" sharing in code review or PR comments. That's actually fine for most teams — patterns are usually a personal style choice, and homogenising them across a team via tooling can flatten useful diversity. Capture yours; let your teammates capture theirs.
