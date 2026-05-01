# Examples

Real session traces showing SiftCoder skills in action.

## Example: bug fix with memory grounding

```
> the orders sometimes ship before payment clears, fix it

[siftcoder] auto-loaded: coding/fix
mem_search { "orders payment clearing" } → 2 hits
  - decision: "use Stripe webhook for payment confirmation" (mem id: summary:142)
  - incident: "race condition in OrderService.markPaid → race fix in #234" (summary:201)

[fix skill] reproducing...
> what's the failing case?
< the test in tests/orders/checkout.test.ts:42 — sometimes passes, sometimes fails

[fix skill] hypothesis: race between webhook handler and timer-based status check
[fix skill] verifying...
< adding console.log in OrderService.markPaid:67
< running test 10x: 8 pass, 2 fail with overlap log

[fix skill] confirmed. patching...
[fix skill] patch applied to src/orders/OrderService.ts:67 (lock around status update)
[fix skill] regression test added: tests/orders/concurrent-payment.test.ts:15
[fix skill] full suite: 412/412 ✓

Captured to memory: the lock pattern + the prior incident link
```

## Example: Salesforce architecture review

```
/siftcoder:sf-architect

[salesforce-architect agent] read-only org review starting
[salesforce-architect] inventory: 47 objects, 312 fields, 23 profiles, 8 permsets, 14 flows
[salesforce-architect] applying skills/salesforce-architecture rules

Top 3 risks:
  1. [HIGH] OWD on Account__c is Public Read/Write — PII exposure
  2. [MED] 3 active triggers on Opportunity (consolidation needed)
  3. [MED] Apex test coverage at 78% — below 85% soft target

Top 3 wins:
  1. All callouts use Named Credentials ✓
  2. with sharing on 100% of Apex classes ✓
  3. Permission Set Group strategy in place

Roadmap:
  Quick:        Tighten Account__c OWD + sharing rule (~4 hours)
  Structural:   Trigger consolidation via dispatcher (~3 days)
  Strategic:    Sharing model audit by external SF security partner

Captured to memory: full report at summary:891
```

## Example: surprise-me for a weekend project

```
/siftcoder:surprise-me --tiny

[surprise-me skill] generating, ≤ 200 LOC budget

5 ideas:

1. **Ascii city builder** — parse a JSON spec, render a city skyline
   Stack: pure node, no deps. 80 LOC.
   First commit: parse + render flat-roof buildings.

2. **Prompt cache visualizer** — feed Claude API logs, show cache-hit heatmap
   Stack: node + d3 standalone. 150 LOC.
   First commit: parse one log, render hit/miss bars.

3. **Tiny SAT solver** — DPLL on CNF, no SMT
   Stack: pure node. 200 LOC.
   First commit: parser for DIMACS format.

4. **OAuth callback forwarder** — a 50-line localhost listener for OAuth dev
   Stack: pure node. 50 LOC.
   First commit: open browser to URL → catch callback → print code.

5. **Markdown trail of breadcrumbs** — auto-generate breadcrumb-style nav for /docs
   Stack: pure node. 120 LOC.
   First commit: read docs/, produce sidebar.json.

If I had to pick: **OAuth callback forwarder** — you build a bunch of integrations (memory shows 7 in last 90d); this saves you 5 minutes every time.

Want me to scaffold? Just `siftplugin:new` if it's a CC plugin, or a fresh node project otherwise.
```

## Example: pause + resume across sessions

```
[Monday 4pm]
/siftcoder:pause
  Open question: how to migrate auth from JWT to session cookies w/o breaking API consumers
  Progress so far:
    ✓ inventoried API consumers (6 internal, 2 external)
    ✓ confirmed external consumers can support either
  Hypothesis at pause: dual-mode for 30 days, then JWT-deprecate
  Dead ends: tried single-flag rollout — broke X
  Constraints: no consumer downtime
  Next step: prototype dual-mode middleware
  
  Saved as: pause-1746121800

[Tuesday 9am]
/siftcoder:continue

  Resuming: pause-1746121800 (from yesterday 4pm)
  
  Original open question: <as above>
  Since pause: 3 commits, no new constraints, no new memory items
  Dead ends still relevant: 1
  Constraints still hold: 1
  
  Proposed next step: prototype dual-mode middleware
  Confirm to proceed?
> yes
```

## Example: codemap-trust shipping pre-flight

```
/siftcoder:codemap-trust

Trust scores:

  src/memory/         ⭐⭐⭐⭐⭐  (5/5)  high cov, recent activity, no incidents
  src/core/           ⭐⭐⭐⭐⭐  (5/5)  100% cov, recent
  src/services/       ⭐⭐⭐⭐☆  (4/5)  ported recently, some deps haven't run in CI
  src/utils/          ⭐⭐⭐⭐⭐  (5/5)
  src/llm/            ⭐⭐☆☆☆  (2/5)  empty stubs only — placeholder

Risk register:
  src/llm/            unimplemented; flag for Phase E completion
                      Mitigation: scope out + complete stubs OR document as TODO

Trends:
  - Strong test culture across kept modules
  - One module needs completion before public release
```

## Example: ideate using prior memory

```
> what should we build next for siftcoder

/siftcoder:ideate

[ideate skill] memory pass...
mem_search { "siftcoder roadmap" } → 4 hits
  - already-built: memory engine, Salesforce skills, MCP, hooks
  - already-explored: cloud sync (rejected — security review nightmare)
  - in-progress: nothing
  - recently mentioned: better backfill from prior install

Safe portfolio (3):
  1. backfill — ports prior memory; well-scoped, ~2 days. Mem: prior code in dist/
  2. Trace dashboard — visualise mem_why graph in web UI; ~3 days
  3. CI mode — run skills as CI gates (review/security/quality on PRs)

Asymmetric portfolio (3):
  1. Memory federation across teammates — high upside, requires privacy review
  2. Local model selector w/ cost tracker — switch summariser model based on confidence trend
  3. Skill marketplace — community-contributed skills + signed verification

Dark horse:
  → Decision-graph navigation in chat: "show me decisions about X" returns interactive graph
    Why dark horse: mem_why already produces the data; UI is the missing piece
    Memory shows you've referenced graph thinking 5x in last 30d but never built UI

Want me to /schedule a deeper investigation on any?
```
