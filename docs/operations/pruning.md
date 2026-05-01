# Pruning

Memory accumulates. Most of it stays useful — the summary of how you fixed a flaky test in March is the same summary you want next March when the test flakes again. But some of it becomes redundant (you fixed the same bug seven times across seven branches), some of it becomes stale (you summarised a file that no longer exists), and some of it was never useful (a one-off Bash invocation captured because the hook fires unconditionally).

Pruning is the operation that cleans this up. It is bounded, optional, and safe by design.

## The two pruning paths

There are two distinct mechanisms.

**Automatic dedup.** The dedup consolidator in `src/memory/daemon/consolidator.ts` runs every five minutes (`intervalMs: 5 * 60 * 1000`) and looks for pairs of summaries with cosine similarity ≥ 0.95. When it finds a pair, it marks the older one as superseded by the newer one — recording an edge in the supersedes graph rather than deleting the row. Superseded rows are de-prioritised in retrieval (they still exist, but they rank lower) and never re-considered for further deduplication.

This runs without your involvement. You don't need to schedule it, you don't need to confirm anything, and you can't break things by leaving it on. It is conservative — 0.95 cosine is a high bar, so only near-identical summaries are caught. The tradeoff is that it misses semi-redundant pairs that a human would clearly call duplicates. That's where the curator comes in.

**Curated pruning.** The `memory-curator` agent at `agents/memory-curator.md` is a Sonnet-backed librarian that does the harder calls — clusters at 0.92 cosine, looks for stale references, finds orphans with no provenance edges, surfaces contradictions. It produces a report and waits for your confirmation before deleting anything.

## What the curator considers

From `agents/memory-curator.md`, the agent looks for five things:

1. **Duplicates.** Cosine > 0.92 within the same week. Within each cluster, keep the most-cited (most provenance edges) and most-recent; demote the rest.

2. **Contradictions.** Summaries about the same topic with opposite stances, or `contradicts` edges from the dedup pass. These are *surfaced* — the curator never auto-resolves a contradiction, because the resolution is usually "the newer one is correct, but it's worth knowing why we changed our minds," and only you can answer that.

3. **Stale references.** Summaries about files or symbols that no longer exist in the repo. The curator checks via `grep`; if the referenced path is gone, the summary is flagged stale. Stale doesn't mean useless — sometimes you want to remember why a file *used to* exist — so flagging is a recommendation, not a deletion.

4. **Orphans.** Summaries with zero provenance edges and zero retrieval hits in the last 30 days. These are the strongest deletion candidates: nothing references them, nobody (Claude or you) has searched for them, and they're not part of any reasoning chain.

5. **Pinned exemption.** Summaries marked `pinned: true` are skipped entirely. If you've pinned something, the curator leaves it alone, even if it would otherwise meet a deletion criterion.

## The bounded-scope guarantee

The curator's tool list is `Bash, Read`. It does not have `Write` or `Edit`. It can run shell commands (`grep` for stale references, `siftcoder` CLI calls) and read files, but it cannot modify your code. The deletions it ultimately performs go through the `siftcoder mem prune --confirm` command, which only operates on the memory database — `events`, `summaries`, `summary_embeddings`, and the relationship tables.

It cannot:

- Delete files in your repo.
- Modify `.gitignore`, `package.json`, or any other config.
- Touch the WAL.
- Cross workspace boundaries (it operates only on the workspace identified by `CLAUDE_PROJECT_DIR`).

This is enforced by the agent's tool allowlist and by the CLI's scope, not by trust. Even a misbehaving curator literally cannot reach your code.

## Running it

```
/siftcoder:mem prune --confirm
```

The slash command (`commands/mem.md`) dispatches the `memory-curator` agent first, lets it produce its report, and then runs `siftcoder mem prune --confirm` to execute the deletions. Without `--confirm`, the agent generates a report but no destructive action runs — useful for "just tell me what you'd do."

A typical session looks like:

```
$ /siftcoder:mem prune

[memory-curator]
Inventoried 412 summaries across 14 sessions.

Dupes merged candidates: 18 (count + 3 examples)
  - "auth/middleware.ts null-check fix" appears 4 times, June 8/12/15/22 — keep most recent
  - "webhook signature verify HMAC mismatch" appears 3 times, all in June — keep first (most-cited)
  - "Apex trigger limit handler patterns" appears 2 times, 2 days apart — keep most recent

Contradictions surfaced: 2
  - "use FFLib Selector for all SOQL" (March) vs "skip Selector for trigger handlers" (May)
    -> awaiting user review

Stale flagged: 7
  - "src/legacy/auth.ts:42 token validator" — file no longer exists
  - "src/scratch/poc.ts" entire session — directory deleted
  - ...

Orphans found: 23
  Recommended prune count: 41 (18 dupes + 23 orphans, contradictions deferred)

Run `siftcoder mem prune --confirm` to execute, or specify a smaller list.
```

You read it, decide whether to confirm, and re-run with `--confirm`:

```
$ /siftcoder:mem prune --confirm
Pruned 41 summaries. 7 stale flagged but retained (use --include-stale to delete).
```

Stale items are intentionally not pruned by default — see "When stale isn't dead" below.

## When to run it

**Active project, monthly.** The first of each month, before standup, run the curator. It takes one to three minutes depending on how much you've worked. The cleanup is meaningful — you'll typically remove 5–15% of summaries in a heavy-use workspace and noticeably tighten retrieval.

**Archived project, never.** A project you haven't touched in three months doesn't need pruning. The summaries are already aged out by the decay function — they rank low in retrieval anyway, they cost nothing in storage (under 1 MiB usually), and the moment you come back to the project you'll want every shred of context. Pruning an archive saves nothing and risks deleting the one summary that would have unlocked your re-onboarding next year.

**Right after a big refactor.** You renamed half your files, deleted a directory, restructured the package layout. Most of your summaries now reference paths that don't exist. Run the curator to flag them as stale, but think hard before pruning — see below.

**Never as a routine catch-all for "the database feels big."** SQLite handles 100k+ rows without sweating. Database size is a non-issue; you'd notice retrieval quality going down before you'd notice disk usage going up. Don't prune to free space; prune to remove noise.

## When stale isn't dead

The curator flags summaries about deleted files as stale. But "stale" doesn't mean "deletable." Two cases where stale matters:

**You renamed, didn't delete.** `auth/middleware.ts` became `src/auth/middleware.ts`. The summary references the old path. The curator's `grep` will fail to find the old path, flag it stale, and recommend deletion. But the summary's *content* is still relevant — the bug it describes still exists in the new location, the fix pattern still applies. The right action is to leave the summary alone or rewrite it to reference the new path; the wrong action is to prune.

**You deleted, but the lessons remain.** You ripped out a feature six months ago. The summaries about that feature reference files that genuinely no longer exist. They're stale by every metric — but they capture decisions ("we removed this because of perf cost X, after trying Y and Z"), and that history is exactly what you want when someone proposes adding the feature back next year.

The curator surfaces stale-ness; it does not auto-delete. The `--include-stale` flag exists if you want to override, but use it with full awareness.

## The dedup-merge-prune flow in detail

Internally the curator runs the equivalent of:

1. **Dedup** — pull all summaries, embed them (or use cached embeddings), cluster by cosine ≥ 0.92 within a week-window. Within each cluster, mark the keepers (most provenance edges, then most recent) and the demotes.

2. **Merge** — for each cluster, optionally rewrite the keeper to incorporate any unique information from the demotes. This is where Sonnet earns its keep — a 3B Ollama model would dumb-merge, while Sonnet can produce a single summary that subsumes the cluster's information without losing detail.

3. **Prune** — for the demotes, plus any orphans that pass the heuristics, mark them for deletion. The actual delete is gated on `--confirm`.

The merge step is the reason this is an agent task and not a SQL script. Pure dedup (the cosine threshold work) could be a cron job; the merge requires judgment about which information to preserve, and that's an LLM call.

## Tradeoffs

**Pruning is destructive.** Once a summary is deleted, it's gone. The underlying event row in the `events` table still exists (pruning operates on `summaries`, not `events`), so technically you could re-summarise from the source — but the embedding is gone, the provenance edges are gone, and any retrieval that used to surface that summary will now surface its surviving neighbours instead. There's no undo. Confirm before you confirm.

**Pruning is optional.** You can run SiftCoder for years without ever pruning and the only consequence is slightly noisier retrieval and slightly larger SQLite files. The system is designed so that doing nothing is a valid strategy. Do not feel pressured to maintain a clean memory database the way you maintain a clean codebase — the failure modes are different.

**Curator costs are real but small.** The curator pass uses Sonnet, which is paid. A workspace with a few thousand summaries pulls maybe 50–100k tokens for a full pass, which is measured in cents. Run monthly; don't run hourly.

**It is not a security tool.** If you suspect a secret got captured (the redactor missed something), do not rely on the curator to find it. Use `sqlite3` and `grep` directly on the database, find the row, delete it, and file a redactor bug. The curator looks for redundancy, not sensitivity.

The right mental model: pruning is dental hygiene for an active project's memory. Skip it for a year and your retrieval gets slowly less precise; do it monthly and you barely notice the difference, but the database stays sharp.
