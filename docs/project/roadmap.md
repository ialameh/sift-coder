# Roadmap

What's planned, what's in progress, what's recently shipped, and — equally important — what is explicitly not planned. The honest version, not the marketing version.

This page is updated alongside the changelog. If something is missing or wrong, please [open an issue](https://github.com/ialameh/sift-coder/issues).

## Recently shipped

The last few releases give a sense of pace and shape. Full detail in the [changelog](../changelog/).

**1.0.8 (2026-05-02)** — added the `siftcoder info` CLI subcommand and `/siftcoder:mem info` slash variant. One-screen runtime snapshot: package version, plugin manifest version, Node version, install root, namespace, workspace key, daemon state, socket and DB paths, web URL, backend availability, and event/summary/embedding counts. Supports `--json` for piping. The motivation was that "is this thing actually working?" used to require running four separate commands.

**1.0.7 (2026-05-02)** — fixed a bug where `siftcoder backfill` was broken end-to-end. The CLI was sending the RPC frame with the wrong shape, the daemon never had a `backfill` handler implemented, and the `replay.ts` integration was missing. Backfill from existing Claude Code transcripts now works as documented in the [onboarding recipe](../cookbook/onboarding.md). 5-minute timeout because transcript scans can take a while on busy projects.

**1.0.6 (2026-05-01)** — renamed the default namespace from `v3` to `default`. The `v3` marker was a leftover from internal naming during the rebuild; it was confusing public users who saw `"namespace": "v3"` in status output and thought it meant something. State now lives at `~/.siftcoder/default/` instead of `~/.siftcoder/v3/`. Auto-migration on first run; idempotent; no data loss.

**1.0.1 through 1.0.5 (2026-05-01)** — a series of hotfixes addressing install reliability. The pattern was that plugin marketplace installs work differently from `npm install` from a clone, and the early releases assumed the latter. The hotfixes added an `ensure-built` hook that detects missing or stale `dist/`, runs `npm install` and `npx tsc` if needed, and falls back to a clear error banner if the auto-fix can't recover. Native binding probe was also strengthened to catch the Node-25-vs-better-sqlite3-prebuild-mismatch case. Installs are now meaningfully more robust.

**1.0.0 (2026-05-01)** — initial public release. Memory engine with UDS RPC, dual SQLite backends, RRF retrieval, decay, provenance graph. 96 skills, 107 commands, 15 agents, 7 active hooks. Salesforce domain pack (12 skills, 4 agents). MCP server. Web UI. ~50× steady-state token cost reduction via Ollama offload. Boundary enforcement, PII redaction, scope-aware writes.

## In progress

A short list of work currently underway or staged. These are not promises — they're best-current-guesses about where time will go.

**Cross-machine memory sync (`/siftcoder:mem-sync`).** Memory currently lives at `~/.siftcoder/<namespace>/workspaces/<key>/` on a single machine. Continuity between a laptop and a desktop is the most-requested feature in issues. The design notes in `IDEAS.md` favour starting with rsync over SSH (no new infrastructure) with a path to layer rclone for cloud-hosted backends. The hard problem is concurrent-writer semantics — two machines capturing simultaneously and then trying to merge. The current plan is to ship the single-active-machine case first (push from laptop, pull from desktop, last-write-wins) and document the limit; the merge case is a later phase. Encryption story decided per backend (SSH transport handles transit; rest is per-disk for rsync, age-encrypted for cloud).

**Reranker improvement.** The current TF-IDF reranker is a placeholder. Real options are local (`bge-reranker-v2-m3` via Ollama or Transformers.js, ~250MB, ~50ms/pair on M1), hosted (Cohere rerank-v3 or Voyage AI rerank-2), or self-hosted via Claude as cross-encoder (already partially in `claude-reranker.ts`). No timeline on this; the placeholder is good enough that the urgency is low.

**Eval gate in CI.** Run `mineGolden + evaluate` from `cli.js eval` on each PR. Recall@5 floor 0.6, MRR floor 0.4. Catches retrieval regressions before they merge. Mostly tooling work.

**Schema migration test fixtures.** Backend matrix tests (`backends.test.ts`) cover same-version. There are no tests for upgrading from v1 → v2 schema. Should add fixture DBs at known schema versions and verify `Storage` opens them clean.

## Wanted but unowned

Things that would clearly help, where the question is sustained engineering time rather than design:

**Presidio PII redaction.** The hand-rolled regex in `src/memory/privacy.ts` covers common cases (AWS keys, GitHub PATs, Bearer tokens, JWT, email, phone, etc.) but misses multi-line keys, custom secret formats, and base64-wrapped tokens. Microsoft Presidio (Python sidecar) or a comparable JS library would be more robust. The architectural question is whether the redaction layer can tolerate a Python sidecar (probably yes, behind a flag).

**OpenTelemetry exporter.** The `Logger` writes ndjson today. Wiring an OTLP exporter as an alternative sink would let users running Grafana / Honeycomb / Datadog ingest SiftCoder events directly. Mostly mechanical.

**HMAC cookie auth for the web bridge.** The current token-in-URL scheme works but leaks via Referer headers and browser history. Replace with an HMAC-signed httpOnly SameSite=Strict cookie set on initial GET. Security improvement; not urgent because the bridge is bound to 127.0.0.1, but worth doing.

**Team-shared memory.** Beyond cross-machine sync (one user, two machines), the multi-user case — a team sharing relevant memories from a project — is regularly requested. This is a much larger design question than the cross-machine case. It involves access control, shared keys, conflict resolution at scale, and a server component (which the project has explicitly avoided so far). No commitment; it's on the wishlist.

If any of these are blocking your team, opening an issue with concrete usage detail helps prioritise. Sponsorship of specific features is also welcome and accelerates work in proportion to the support.

## Explicitly not planned

Some things are recurring suggestions that are *not* on the roadmap, and the roadmap is more useful when those are named.

**A hosted SaaS version.** SiftCoder is intentionally local-first. Memory data lives on the user's laptop because that's the simplest, cheapest, and most defensible privacy story. A hosted version would require a server, which would require auth, which would require a billing model, which would require a company. The project is run by one person as a side effort, and this is not going to change.

**Cross-LLM support.** SiftCoder is a Claude Code plugin. The hooks integrate with Claude Code's lifecycle. The MCP server speaks Claude Code's protocol. Porting to other coding assistants (Cursor, Copilot, Continue, etc.) would mean re-implementing the integration layer for each, which is more engineering work than the project can sustain. The memory engine itself is portable in principle (it's TypeScript over SQLite), but no work is planned in this direction.

**Replacing the `sf` CLI.** The Salesforce skills wrap and discipline the `sf` CLI. They do not reimplement deployment, retrieval, or org auth. If `sf` doesn't support what you need, the answer is to file a bug with Salesforce, not to ask SiftCoder to recreate the functionality.

**Live debugging into a sandbox.** The Salesforce debug skill parses logs you've already retrieved (`sf apex log get`). It does not attach to a running org or stream logs in real time. Real-time log streaming is a Salesforce CLI feature (`sf apex tail log`) and integrating it as a streaming source is a meaningful architectural change that hasn't been justified by demand.

**Full-codebase semantic search.** SiftCoder's memory is about *interactions* — what you and Claude did together. It is not a vector index of every file in your repository. If you want full-codebase semantic search, you want a different tool (Sourcegraph, GitHub's own semantic search, etc.). The line between "remember our work" and "index everything" is intentional.

**Auto-memory between unrelated projects.** Workspaces are scoped to per-repo memory by design. Memory does not cross between unrelated projects. If you want patterns or knowledge from project A available in project B, capture them as patterns (`pattern-learn`) — patterns are surfaced in retrieval across all your workspaces. Bulk auto-sharing is intentionally not the model.

## How decisions get made

Roadmap items move from "wanted" to "in progress" based on three factors:

1. **Maintainer time.** This is a side project for one person. Sustainable pace matters more than feature velocity.
2. **User signal.** Issues and discussions show what people actually hit. Features with multiple independent issue threads tend to move up.
3. **Architectural fit.** Some features are easy in the current architecture; others require structural changes. Easy ones land first, structural ones wait until the architecture is ready or until the demand justifies the rework.

There is no quarterly roadmap committee. There is no published feature deadline. If you need a specific feature on a specific timeline, the path is sponsorship or a contributed PR — not advocacy in issues.

## Where contributors are most useful

Concrete pointers for "I want to help, where should I start":

**Documentation.** This guide has gaps. Real recipes from real users — different languages, different stacks, weird edge cases — are valuable and easy to merge if the writing is good.

**Skills.** The skill system is the easiest contribution surface. If you have a workflow that the existing skills don't cover, write a `SKILL.md` and PR it. The bar for inclusion is "does this help more than one person." Generic skills (debugging, refactoring) face a higher bar than domain skills (Salesforce-flavoured workflows, language-specific patterns) because the generics are crowded.

**Bug reports with reproductions.** Most issues are filed with vague descriptions. A bug report with the exact command, the exact output, the OS, and the version is gold and tends to get fixed quickly.

**Test coverage on edge cases.** The coverage gates are high (90% lines, 85% branches) but coverage isn't quality. Tests around edge cases — large files, malformed configs, weird Unicode in captured content — are areas where coverage is statistically high but real failures still slip through.

**Performance regressions.** If something used to be fast and now isn't, that's high-priority. Benchmarks live in `tests/perf/` and PRs that add benchmarks for paths that don't have them are welcome.

The contributing guide ([CONTRIBUTING.md](../contributing/)) has the procedural details — branch naming, commit style, what CI checks for, how to add a skill or a hook.
