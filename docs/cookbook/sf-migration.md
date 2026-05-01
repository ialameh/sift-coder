# Salesforce migration

Big Salesforce migrations are unlike normal feature work. They span weeks. They mix metadata changes, data transformations, automation conversions, and security reviews. They have to keep working in production while the migration runs. They cross at least three or four of the SiftCoder skills covered elsewhere in the guide.

This recipe is the integration layer — how to use the schema, automation, deploy, and architecture skills together across a multi-week project, with the memory store as the backbone that keeps the whole thing coherent.

The example is a real shape: an org migrating from Workflow Rules to Cloud Flows. The customer has 47 active workflow rules across 12 objects, accumulated over six years. Salesforce has long since deprecated workflow rules in favour of Flow. The migration is overdue.

## Phase 0 — survey

Before touching anything, get a baseline. Two or three days of read-only work.

### Inventory

```
/siftcoder:sf-architect --target-org production --scope automation
```

The architect agent runs scoped to automation. Output:

- Capacity table for automation (active rules per object, active flows per object, async slots usage).
- A list of every active workflow rule with the object, criteria, and immediate actions.
- A list of process builders (probably also slated for migration, since those are deprecated too).
- Tech debt observations specific to automation.

The report is captured to memory. That's your phase-0 baseline. You'll diff against it at the end.

### Repo-vs-deployed check

```
/repo-vs-deployed-analyzer --target-org production
```

Make sure your local source actually matches the org. Drift is common and a migration project that starts from a stale source baseline ends in confusion. Reconcile any drift before phase 1.

### Org comparison if you have a clean reference

If you have a recently-refreshed sandbox or another org with cleaner automation:

```
/org-comparison-tool --org-a production --org-b clean-sandbox
```

This shows where production has accumulated cruft that a cleaner org doesn't have. Optional but useful.

### Capture the plan

Write a phase-0 note that captures the scope as you understand it:

```
/siftcoder:dig-note "Workflow → Flow migration. 47 rules, 12 objects, 6 years accumulated. Plan: phase 1 conversion in sandbox, phase 2 staged production rollout by object, phase 3 decommission."
```

That note becomes the anchor that subsequent retrievals will find.

## Phase 1 — convert in a sandbox

This is where the `automation-converter` skill earns its keep. It takes workflow rules and produces equivalent Flows, with the gotchas explicit.

### One object at a time

Don't try to do all 47 in one go. Start with one. Pick the simplest object — usually one with two or three rules and obvious logic.

```
/automation-converter --object Contact --target-org dev-sandbox
```

The skill reads the workflow rules on Contact, analyses the criteria and immediate actions, and produces:

- A Flow definition (`.flow-meta.xml`) that replicates the behaviour.
- Notes on what doesn't translate cleanly. (Workflow rules have subtle semantics that Flow handles differently — recursion behaviour, evaluation order, criteria-met-once-and-forevermore quirks.)
- Test scenarios you should verify.

You review. You deploy to the sandbox:

```
/siftcoder:sf-deploy validate --target-org dev-sandbox --source-dir force-app/main/default/flows
/siftcoder:sf-deploy deploy --target-org dev-sandbox
```

You verify the Flow fires. You compare its behaviour to the workflow rule on a sample record. If they match, great. If not, the converter's "doesn't translate cleanly" notes usually explain why; you adjust the Flow and re-deploy.

### Activity logging

A real migration adds something the original workflow rules didn't have: logging. When the new Flow fires, it should write an entry to a custom object (`Migration_Activity__c` or similar) so you can compare what the Flow did versus what the workflow rule did. This is the safety net for phase 2 — you'll be able to see in production whether the Flow's behaviour matches the legacy rule's.

The `automation-converter` skill includes activity logging by default. Each generated Flow has a "log entry" element that writes to a custom object. The schema for that object is part of the migration's scaffolding.

### Iterate across objects

Repeat for each object. The skill captures patterns as it works — by the time you're on object 5, retrievals of "automation-converter Contact" surface the lessons from objects 1-4. Common gotchas (a particular field that always has subtle behaviour, a recursion pattern that's hidden in the workflow rule's criteria) get learned across the migration.

Expect this phase to take a week or two depending on rule complexity. Some objects will be five-minute jobs. A couple will require half a day each because the workflow rule's behaviour is genuinely tangled and the equivalent Flow needs careful design.

### End of phase 1 — baseline check

When all rules are converted in the sandbox, run the architect again:

```
/siftcoder:sf-architect --target-org dev-sandbox --scope automation
```

Compare with the phase-0 baseline (it's in memory; the architect surfaces it automatically). The new report should show:

- Workflow rules: still 47 (you haven't deactivated yet — that's phase 3).
- Flows: 47 new ones, paired with the rules.
- Net automation count: roughly doubled. That's expected during transition.

Tag the milestone:

```
/siftcoder:dig-note "Phase 1 complete: 47 Flows in dev-sandbox, paired with workflow rules, activity logging in place."
```

## Phase 2 — staged production rollout

This is the high-risk phase. You're going to put the new Flows into production *in addition to* the existing workflow rules, run them in parallel, watch the activity log, and only deactivate the workflow rules once the Flows have proven themselves.

### Per-object rollout

Pick one object. Validate the deploy:

```
/siftcoder:sf-deploy validate --target-org production --source-dir force-app/main/default/flows/Contact_*
```

Deploy via quick-deploy:

```
/siftcoder:sf-deploy quick <jobId> --target-org production
```

The Flow is now live. Both the new Flow and the old workflow rule fire on every triggering event. The new Flow logs to `Migration_Activity__c`. The old workflow rule does not.

### Watch the activity log

For one full business day, monitor `Migration_Activity__c`. You're looking for:

- The Flow firing the right number of times (compare with how many records hit the workflow rule's criteria).
- The Flow's actions matching what the workflow rule would have done.
- Any unexpected errors logged.

If the comparison checks out, the Flow is verified. Move to the next object.

If it doesn't — say the Flow fires twice when the workflow rule fired once — back out by deactivating the Flow. The workflow rule is still active; nothing is broken in production. Investigate (`/siftcoder:investigate "Flow firing twice on Contact update"`), fix, redeploy.

### Capture per-object verification

After each object's verification:

```
/siftcoder:dig-note "Phase 2: Contact migrated to Flow successfully; 1 day verification clean; 247 firings in log; matches workflow rule count exactly"
```

This builds a per-object audit trail. If something breaks two months from now, the trail explains what was verified when.

Plan for this phase to take two to three weeks. You're going to have one or two objects that misbehave; budget for the investigation time.

## Phase 3 — decommission

Once every Flow has been verified and run for at least a week in parallel with the workflow rule, deactivate the workflow rules. The Flow is now the sole automation.

### Deactivation

Workflow rule deactivation is a metadata change. Modify the `.workflow-meta.xml` files to set `active=false`, deploy, validate.

```
/siftcoder:sf-deploy validate --target-org production --source-dir force-app/main/default/workflows
/siftcoder:sf-deploy quick <jobId> --target-org production
```

After this deploy, only the Flows are active.

### Activity log review

The `Migration_Activity__c` records are now just operational data — they tell you the Flow fired. You can either keep them (useful for debugging) or archive them (purge after 90 days; the migration justification for keeping them is gone).

### Schema cleanup

If you added any temporary fields or objects for the migration (the activity log, transitional flags), schedule them for deprecation. The `schema-migrate` skill handles the data-preserving removal.

```
/siftcoder:schema-migrate plan "remove Migration_Activity__c after 90 day retention"
```

Output is a phased plan: data archive → metadata removal → reconciliation.

### Final architect review

```
/siftcoder:sf-architect --target-org production --scope automation
```

Compare with phase-0 and phase-1-end. The expected delta:

- Workflow rules: 47 → 0 (active count).
- Flows: 47 (all converted).
- Capacity: approximately neutral (Flows are slightly more efficient than workflow rules but not dramatically).
- Tech debt: significantly reduced (workflow rules were a deprecated technology; you're now on the supported platform).

Tag the closeout:

```
/siftcoder:dig-note "Migration complete. 47 workflow rules retired. All Flows live, verified, monitored. Activity log scheduled for purge in 90 days."
```

## Phase 4 — knowledge transfer

The last phase that often gets skipped. The migration is done; the knowledge of *how* it was done lives in three places: the captured memory, the git log, and your head. Make the head part redundant.

### Generate documentation

```
/siftcoder:document architecture --scope automation
```

The documenter agent reads the current state, the git history of the migration, and the captured memory, and produces a written narrative: what was migrated, when, why, what gotchas were encountered, what verification was done. This is the document you hand to the next engineer who asks "wait, how does Contact automation work now?"

### Pattern capture

If the migration produced reusable patterns — a Flow design pattern, a verification approach, a logging convention — capture them:

```
/siftcoder:pattern-learn "the activity-logging pattern we used for migration verification"
```

These patterns can be reused for the next deprecated-feature migration (process builders, when those finally have to go; record types, if they ever get rationalised; and so on).

### Final memory state

By this point, the memory store has a complete narrative of the migration:

- Phase 0 baseline (1 architect report).
- Phase 1 conversions (47 conversion records, with the gotchas captured).
- Phase 2 verifications (47 deploy events + 47 verification notes).
- Phase 3 decommission (1 batch metadata change).
- Phase 4 closeout (final architect report, generated docs, captured patterns).

A search for "workflow flow migration 2026" returns the entire arc. If something breaks in 2027 because of this work, the trail is there to follow.

## Why the recipe shape matters

Salesforce migrations fail more often than they should because the project gets owned by one person, the trail lives in their head, they get pulled to another priority, and three months later nobody knows what was migrated and what wasn't. The recipe — phases with explicit captures at the end of each — makes the project resilient to that pattern. Anyone with access to the memory store can pick up where the previous engineer left off, by searching memory for the most recent phase's tag.

## Skills used

A reference of the skills the recipe touches:

- `automation-converter` — workflow → Flow conversion.
- `salesforce-architect` — automation-scoped architecture review.
- `repo-vs-deployed-analyzer` — drift detection between source and org.
- `org-comparison-tool` — pairwise comparison.
- `salesforce-deploy` — validate, quick-deploy, all standard sf CLI flow.
- `schema-migrate` — for the cleanup of migration scaffolding.
- `pattern-learn` — capture reusable patterns from the migration.
- `document` — produce the closeout doc.
- `dig-note` — phase markers throughout.

That's most of the SF pack used in service of one project. The point of the recipe is showing that they compose — each skill has a narrow job, but stringing them in the right order produces a multi-week project plan that's actually executable.

## Adapting for other migrations

The same shape — phase 0 survey, phase 1 sandbox conversion, phase 2 production rollout, phase 3 decommission, phase 4 knowledge — fits other Salesforce migrations:

- Process Builder → Flow.
- Aura → LWC.
- Apex code modernisation (e.g. moving to FFLib enterprise patterns).
- Multi-org consolidation post-merger.

The skill names change. The phase structure doesn't.

## Cross-references

- [Schema](../salesforce/schema.md) — for the data-preserving cleanup in phase 3.
- [Deploy](../salesforce/deploy.md) — the deploy mechanics throughout.
- [Architecture](../salesforce/architecture.md) — the orchestrating skill for phase 0 and 4.
- [Patterns](patterns.md) — for the pattern capture in phase 4.
