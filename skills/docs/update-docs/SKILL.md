---
name: update-docs
description: Use to keep docs in sync with code. Detects doc-vs-code drift, surfaces stale claims, applies updates. "Update the docs", "docs are out of date", "sync docs to code".
---

# update-docs

Doc-sync workflow. Doc rot is invisible until someone reads. Mine the rot; fix it.

## Method

1. **Inventory docs.** README, ARCHITECTURE, docs/, CHANGELOG, comments-on-public-API. Skip generated.
2. **Per doc, mine claims:**
   - File paths mentioned → check existence
   - Symbol names mentioned → grep repo
   - Commands mentioned → verify they exist (in package.json scripts, in commands/, in code)
   - Version numbers → match current
   - Configuration keys → match settings.json schema
3. **Find drift.** Each broken claim = stale.
4. **For each stale claim:**
   - Verify it's stale (don't just trust regex)
   - Find current truth
   - Propose update
5. **Apply** approved updates. **Don't blanket-update.** Per-claim review.

## Output shape

```
Docs reviewed:    <count files>
Claims checked:   <count>

Drift found:

  README.md:42      "Run `npm run sync`"
                    Reality: package.json has no `sync` script
                    Suggested: drop the line | OR add the script
                    
  docs/MEMORY.md:15 "src/memory/v2/...""
                    Reality: path doesn't exist; current is src/memory/
                    Suggested: update path

  ARCHITECTURE.md:88 "uses Redis for caching"
                    Reality: code uses in-memory Map; no Redis dep
                    Suggested: remove the line OR add Redis

Approve which to apply: 1, 2, both...
```

## Rules

- **Each finding is reviewed.** Doc updates have human gate.
- **Verify before claiming stale.** False positives erode trust.
- **Suggest, don't assume.** "Update path" might mean "move the code", not "change the doc".
- **Capture findings to memory** so re-runs don't reprobe known good areas.

## Anti-patterns

- Bulk find-replace across all docs without per-claim review
- Removing claims without checking if the underlying code should exist
- Updating docs that are actively being rewritten by someone
- Treating wishlist items in docs as drift

## When NOT to use

- Generated docs (typedoc, swagger-ui) — regen, don't manual-update
- Active doc-write in progress — wait until landed
- One-line README typo — direct edit

## Subagent dispatch

- `Explore` for the source verification
- `Grep` heavily for symbol/path checks
- Memory MCP to skip already-verified areas

## Value over native CC

CC will update a doc on request. CC won't naturally inventory all claims and verify each. The systematic claim-by-claim check IS the value.
