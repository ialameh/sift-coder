# Multi-agent refactors

There's a class of refactor where the work is genuinely parallel. Renaming a function across two hundred files. Updating an import path everywhere. Migrating every component in a feature directory from one library to another. The files don't talk to each other. The work in each file is the same shape. A human engineer would batch them, hold them all in their head as one task, and get tired around file thirty.

Multi-agent dispatch is what happens when you let several Claude agents work on disjoint slices of that batch in parallel, with file-locking and conflict detection on top. `/siftcoder:swarm` and `/siftcoder:agent` are the entry points. This recipe walks through when they help, when they don't, and a worked example of using them on a large rename.

## What `/siftcoder:swarm` actually does

`swarm` is a workflow contract that wraps native parallel `Task` dispatch with discipline. It does four things:

1. **Decomposes** the umbrella task into independent slices. If slice B depends on slice A's output, swarm refuses; you sequence them instead.
2. **Isolates** each slice in its own git worktree (or a less ideal branch, or scratch files for read-only work). Writes from one slice can't collide with writes from another.
3. **Dispatches** subagents in parallel. All `Task` calls go out in a single assistant message — that's how parallelism works in Claude Code.
4. **Merges** with a documented strategy. Conflict resolution plans are written before the dispatch, not during.

The orchestration is its own thing. The native parallel `Task` capability lets you fire multiple agents at once. Swarm adds the discipline around it — isolation, merge strategy, verification gates — so the parallel work doesn't create a conflict tar pit.

## When swarming wins

Truly independent work. The signals to look for:

- The slices touch disjoint files. (Not different functions in the same file. Different files.)
- Each slice has the same shape — "do X to file Y" — applied across a list of Ys.
- The slices don't read each other's output mid-flight.
- The total work would take you more than an hour serially.

Concrete examples that fit:

- Codebase-wide rename of a function across 200 files.
- Migrating every test file from one mocking library to another.
- Updating import paths after a package refactor.
- Generating documentation pages for every module in a 50-module codebase (when each page is independent).

## When swarming loses

Intertwined work. The signals:

- The slices share files. Two agents writing to the same file is a race condition with extra steps.
- Each slice's output is input to another slice. (Sequence them; don't parallelise them.)
- The work requires global reasoning that can't be sliced.
- Slice count is small (under three or four). The orchestration overhead exceeds the parallelism benefit.

Examples that don't fit:

- Refactoring a file's internals — one file, can't be parallelised meaningfully.
- A migration where each step depends on the previous one's working state.
- A bug fix that spans an entire call chain — the agents would need shared mental model.
- "Improve the architecture of this module" — too vague to slice cleanly.

If you find yourself trying to force a non-parallel task through swarm, stop. Use `/siftcoder:autonomous` (sequential, single-agent, long-running) or `/siftcoder:agent` (single explicit subagent, isolated) instead.

## `/siftcoder:agent` versus `/siftcoder:swarm`

The two commands sit at different points on the same spectrum.

**`/siftcoder:agent`** — full agentic refactor by a single subagent. Planner → coder → qa-reviewer → qa-fixer pipeline. Long-running, sequential, isolated in a worktree. Good for one big chunk of work that needs deep reasoning.

**`/siftcoder:swarm`** — multiple subagents in parallel on independent slices. Each slice runs the same kind of agent (or different ones) but the slices don't talk. Good when the work decomposes cleanly.

A common pattern is `agent` to plan and pilot one slice, then `swarm` to apply the same change across the rest. Use `agent` for the hard cases, `swarm` for the boring ones.

## Worked example: renaming `getUserToken` to `getAuthToken` across 200 files

You have a Node monorepo. There's a function `getUserToken` exported from a shared package and used everywhere. The team has decided it should be `getAuthToken` (the function returns auth tokens, not user tokens; the name has been wrong for years). Two hundred files reference it.

A find-and-replace would handle most of them, but some files have additional context — call sites that need their parameter shape changed, places where the rename is a chance to also remove an unused arg, tests that mock the function and need their mocks updated. You want each call site reasoned about, not blindly substituted.

This fits swarm. Here's the flow.

### Step one — survey the work

Before swarming, get an inventory.

```
/siftcoder:swarm plan "rename getUserToken to getAuthToken across the codebase"
```

The skill greps, finds 213 references in 197 files, groups them by pattern (importer, mocker, direct caller, test), and proposes a slicing:

```
Goal: rename getUserToken → getAuthToken (213 refs, 197 files)

Slicing proposal:
  S1 — packages/shared (1 file: source of truth + tests)              SEQUENCE FIRST
  S2 — apps/api (87 files: direct callers, simple)                    PARALLEL
  S3 — apps/web (62 files: imports + 4 places with prop drilling)     PARALLEL
  S4 — apps/admin (38 files: 2 mocks need shape update)               PARALLEL
  S5 — packages/integrations (10 files: mock + integration tests)     PARALLEL

Total slices: 5
S1 runs first (it changes the signature; later slices need it merged)
S2-S5 run in parallel after S1 lands
```

The skill identifies that S1 must run first because it changes what's exported. Then S2-S5 are parallel. Five slices is comfortable; the skill notes that pushing past three or four parallel slices starts to risk cap exhaustion in Claude Code, so this is at the upper end.

### Step two — run S1 sequentially

```
/siftcoder:agent "rename getUserToken to getAuthToken in packages/shared; update tests"
```

The full agent pipeline: planner produces a written plan, coder implements, qa-reviewer validates, qa-fixer addresses any issues. Worktree-isolated. Output is a branch `agent/rename-shared-2026-05-02`.

You review. The change is right. Merge.

### Step three — swarm S2-S5

Now the parallel part:

```
/siftcoder:swarm dispatch "apply rename to apps/api,apps/web,apps/admin,packages/integrations"
```

The skill produces:

```
Dispatch matrix:
  T1  [worktree-a]  apps/api               → general-purpose
  T2  [worktree-b]  apps/web               → general-purpose
  T3  [worktree-c]  apps/admin             → general-purpose
  T4  [worktree-d]  packages/integrations  → general-purpose

Launching 4 agents in parallel...
```

All four `Task` calls go out in one assistant message. The agents run concurrently. You wait. Don't try to monitor them mid-flight — reading their transcripts pulls them back into your context window, which defeats the point.

After ten or fifteen minutes (depending on slice size and Claude Code's load), all four return. Each has a worktree with the changes applied.

### Step four — verify and merge

```
/siftcoder:swarm verify
```

Per slice:
- Tests run and pass in the slice's worktree.
- Lint passes.
- Typecheck passes.

Then merge. The skill defines a merge order — typically the smallest slice first to surface conflicts early. With four disjoint slices that don't share files, conflicts are unlikely, but the skill checks anyway:

```
Merge plan:
  T4 → main (10 files, no conflicts)             ✓
  T3 → main (38 files, no conflicts)             ✓
  T1 → main (87 files, no conflicts)             ✓
  T2 → main (62 files, 1 conflict in apps/web/package.json — manual)
```

A conflict in `package.json` because two slices both updated a version (a managed-dep upgrade was in flight). You resolve manually. Re-run tests. All green.

### Step five — final verification

```
/siftcoder:swarm verify --final
```

Run the full test suite at the repo root. Run lint at the repo root. Run typecheck at the repo root. If any of these break despite per-slice tests passing, that's a cross-slice issue — usually a missed reference somewhere. Find it, fix it, commit.

In the example, everything passes. Total elapsed time: about an hour. Doing it serially with one agent would have been three or four hours; doing it by hand would have been most of a day. The work captured to memory; if a similar rename happens later, the precedent is searchable.

## File-locking and isolation

The recipe relies on each slice running in its own git worktree. Worktrees are the cleanest isolation Claude Code offers — separate directory, separate `git status`, no chance of two agents writing to the same path. The orchestrator skill creates them, hands each slice to its agent, and on merge consolidates the branches.

The fallback is branches in the main repo. Less clean — agents share a working directory, and if one agent's `Bash` command does `cd` weirdly, things can collide. The skill defaults to worktrees and only falls back if your repo doesn't support them (rare; pre-2.5 git, some monorepo setups with submodule weirdness).

A third level — scratch files (`<filename>.ghost.<ext>`) — exists for purely read-only or experimental work. The `ghost` skill uses this. Swarm doesn't, because swarm is shaped for committing real changes.

## Anti-patterns

A few traps the skill avoids:

**Launching too many agents.** Past three or four, Claude Code's parallel-task ceiling matters. The skill caps at four by default; override via the dispatch matrix if you've tested higher counts on your setup.

**Reading agent transcripts mid-flight.** Doing this pulls the subagent's working context into your main context window, defeating the parallel-context savings. Watch the dispatch matrix's status line; don't read the agent transcripts until they finish.

**Predicting results before they land.** While agents are running, the skill returns status updates only. Don't fabricate "it looks like T2 is going to finish first" — wait for the actual return.

**Sequencing dependent slices as parallel.** If slice B references slice A's output (e.g. A renames a function and B updates callers), they're sequential. Force them through swarm and you'll merge B's worktree expecting A's change to already be there, except it isn't, and tests fail.

## When the recipe doesn't help

- **Single-file refactors.** Use `/siftcoder:refactor`.
- **Two-or-three slice work.** Just dispatch them sequentially; the swarm overhead isn't worth it.
- **Refactors where each slice's output informs the next.** Use `/siftcoder:autonomous` instead — single agent, sequential, with checkpoints between phases.
- **Anything where you genuinely need to think while the work happens.** Swarm is autopilot; if you're not comfortable with that for the task, use a more interactive workflow.

## Cross-references

- `swarm`: `skills/workflow/swarm/SKILL.md`
- `agent`: `skills/workflow/agent/SKILL.md`
- The `orchestrator` agent under `agents/orchestrator.md` is the multi-agent coordinator behind both.
