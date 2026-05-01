# Deploy

`sf-deploy` is the thinnest of the Salesforce skills, on purpose. The `sf` CLI already does the work; the skill's job is to remind you of the discipline around it — validate first, preview the diff, pick the right test level, and don't pretend you have a rollback when you don't.

This chapter walks through the full flow with a worked example, and is honest about what Salesforce gives you for rollback (not much) and how to compensate.

## The shape of `/siftcoder:sf-deploy`

The slash command takes a subaction:

- `/siftcoder:sf-deploy validate` — runs `sf project deploy validate` against the target org. No commits, but does run tests.
- `/siftcoder:sf-deploy preview` — runs `sf project deploy preview` to show adds/changes/deletes against the target.
- `/siftcoder:sf-deploy deploy` — full deploy. Validates first unless `--quick` is passed.
- `/siftcoder:sf-deploy quick <jobId>` — quick-deploy from a previously validated validation id.
- `/siftcoder:sf-deploy rollback` — deploys the previous git tag's metadata to the target. (See "rollback honesty" below.)

Each subcommand reads the rules from `skills/salesforce/salesforce-deploy/SKILL.md` and applies them automatically. You don't have to remember "production needs `RunLocalTests`" — the skill will refuse to start a production deploy without it.

## Validate vs deploy vs quick-deploy

The three modes confuse new Salesforce engineers, and the skill makes them explicit.

**Validate** runs the deploy *almost* end-to-end. It compiles, executes tests, and checks every metadata change for compatibility — but it does not commit. The result is a job id you can hold for up to ten days. Validation is what you do before a production deploy. Run it the night before, get the job id, sleep on it, quick-deploy in the morning.

**Deploy** is validate + commit. For sandboxes this is usually the right move — you don't have a maintenance window to protect and the validation overhead is wasted time.

**Quick-deploy** takes a previously-validated job id and commits without re-running tests. This is *the* production deploy path. Validation runs the tests; quick-deploy applies the change. The two-step gives you a window to coordinate (announce maintenance, freeze the org, line up support) without having to wait for tests during the actual change window.

The skill enforces the rule: production deploys go validate → quick-deploy. Direct `deploy` to production is blocked unless you pass `--allow-direct` and confirm.

## Test execution levels — pick the right one

`sf project deploy` accepts `--test-level`. Four options, and the wrong choice can cost you an hour:

| Level | When to use |
|---|---|
| `NoTestRun` | Sandboxes only. Fastest. Production deploys reject this. |
| `RunSpecifiedTests --tests T1,T2` | Validating a tightly-scoped change. Five-minute deploy instead of forty. |
| `RunLocalTests` | Required for production. Runs all tests in the org *except* managed-package tests. |
| `RunAllTestsInOrg` | Compliance audits, GxP-validated orgs. Runs literally everything including managed packages. Expect long runtimes. |

The skill defaults to `RunLocalTests` for production, `RunSpecifiedTests` for the targeted sandbox case (it'll inspect your changeset and pick the right tests automatically), and `NoTestRun` only when you explicitly ask.

## Pre-deploy diff

Before any non-trivial deploy, run:

```bash
sf project deploy preview --source-dir force-app --target-org uat
```

This is what the skill calls automatically when you run `/siftcoder:sf-deploy preview`. It produces a list of:

- **Components to add** — new metadata not in the target.
- **Components to change** — metadata that differs.
- **Components to delete** — only if you have a `destructiveChanges.xml` in scope.
- **Components ignored** — files in source that won't be deployed (e.g. things explicitly excluded).

Read the preview before pulling the trigger. Specifically, scan for:

- Surprises in the change list (you didn't expect to deploy `MyOldFlow.flow-meta.xml` — why is it there?)
- Profile/permission set changes (these often pick up edits made directly in a sandbox UI)
- Validation rule changes (silent activation can change what your users can save)

Anything that surprises you, fix in source before deploying. The preview is the cheap moment to catch it.

## Rollback honesty

Salesforce does not have a native rollback. There is no "deploy --undo." This is one of the platform's sharpest edges and pretending otherwise just gets people hurt.

What you actually have:

1. **Git as the system of record.** Tag every successful production deploy with `prod-YYYYMMDD-HHMM`. If a deploy goes bad, the rollback is to deploy the *previous* tag. This works for code and most metadata. It does *not* recover deleted records or restore picklist values you removed.

2. **Validation of the previous version.** Before deploying, validate the *previous* tag against the target org (you can do this in parallel with the new deploy's preparation). If the new deploy fails, you have a validated job id ready to quick-deploy as a rollback.

3. **Pre-deploy snapshots.** For risky changes, `sf project retrieve start --metadata Account,Contact,...` saves a copy of the current metadata. If something goes sideways, you have the previous version on disk to redeploy.

4. **Data backups.** For schema migrations that lose data on rollback (type narrowing, picklist value deletion, field removal), backups happen at the *data* layer, not the metadata layer. The skill flags any change where rollback would lose data and recommends `sf data export tree` or a full data backup before proceeding.

`/siftcoder:sf-deploy rollback` automates option 1 — deploy the previous tag — but it doesn't pretend it's universal. It will refuse to run if the previous tag's diff against the current org includes anything classified as breaking by the schema-migrate skill, and it'll tell you which changes need manual handling.

## Targeted vs full deploys

Two strategies, and both are right depending on context.

**Full deploys** push everything in `force-app/` to the org. They're slow but they catch drift — anything that's been changed directly in the org without going through source. For weekly release branches into UAT, full deploys are the safer choice.

**Targeted deploys** push only the components you care about (`--source-dir force-app/main/default/classes/MyClass.cls`). Faster, but they don't catch drift. Use them for hotfixes where you need to ship a single class change and don't want a forty-minute deploy.

The skill defaults to targeted for development (it figures out the changeset from `git diff`) and full for release branches. You can override either way.

## A worked example: deploying a feature branch to UAT

You've finished a feature on `feature/quote-to-order` and want to deploy it to the UAT sandbox. Here's the flow.

Step one — make sure source is clean.

```bash
git checkout feature/quote-to-order
git pull
git status   # clean working tree
```

Step two — run the preview. The skill picks up the branch diff against `main` and asks the org what's different.

```bash
/siftcoder:sf-deploy preview --target-org uat
```

The preview lists 12 components: 4 classes (the new selectors, the service, and the trigger handler), the trigger itself, an LWC, and 6 metadata changes (a new field on Quote, two picklist value adds, three permission set updates).

You scan the list. Everything's expected. Move on.

Step three — validate.

```bash
/siftcoder:sf-deploy validate --target-org uat --test-level RunLocalTests
```

The skill submits the validation and tails the job. It reports:

```
Validation: 0Af1A00000... (queued)
Validation: 0Af1A00000... (running, 12 components, 47 tests)
Validation: 0Af1A00000... (passed in 4m 12s — 47/47 tests, 87% coverage)
Job id: 0Af1A00000abc123
```

Step four — quick-deploy.

```bash
/siftcoder:sf-deploy quick 0Af1A00000abc123 --target-org uat
```

The skill applies the validated change. Total deploy time: under thirty seconds (no test run; the validation already covered them).

Step five — smoke test. The skill suggests a smoke test based on the changeset: run the UI button on a sample Quote in UAT, confirm an Order is created, confirm the Platform Event was published. It can't run the smoke test for you (it doesn't have UI access), but it gives you the steps and tracks them in the deploy memory.

Step six — tag the source.

```bash
git tag uat-2026-05-02-quote-to-order
git push --tags
```

The skill captures the deploy event to memory. A week later when someone asks "when did the Quote-to-Order changes go to UAT?" — `mem_search { query: "quote to order uat deploy" }` returns the answer with the job id and the changeset.

## Common deploy errors and what they mean

The skill recognises a handful of cryptic errors and translates them:

- **`Cannot find component`** — usually a destructive-change ordering issue. Something in the deploy references a component that's also being deleted; reorder so deletes happen after.
- **`Test coverage failure`** — production needs ≥75% per class. Run `sf apex run test --code-coverage` locally to find the offender.
- **`Field not visible`** — profile or permission set diff. Source has the field but the deploying profile doesn't grant access. Fix in profile/permset metadata or use `--ignore-warnings` if you're sure.
- **`InvalidCrossReference`** — a referenced record id (often in a default value or a custom-metadata reference) doesn't exist in the target org. Fix the reference or import the missing record first.

## CI/CD integration

A pattern that survives contact with reality:

1. PR opens → skill runs `/siftcoder:sf-deploy validate` against the integration sandbox. Job id captured to the PR.
2. PR merges → skill takes the validated job id and quick-deploys to integration.
3. Release branch cuts → validation against UAT, captured.
4. UAT signs off → quick-deploy to production from the captured job id.

This keeps validation cost paid once per change, with quick-deploys being effectively instantaneous. Run it for two weeks before relying on it in production; CI subtleties (the GitHub runner's `sf` CLI version, the auth file format, the sandbox auth lifetime) tend to surface gradually.

## Cross-references

- [Schema migrations](schema.md) for the data side of deploys.
- [Architecture](architecture.md) for `repo-vs-deployed-analyzer`, which finds drift between source and the target org.
- The full skill body is at `skills/salesforce/salesforce-deploy/SKILL.md`.

Next: [security review](security.md).
