# Security

Salesforce security is layered to a degree that surprises people coming from generic web stacks. There's the org-wide default. There's the role hierarchy. There are sharing rules, manual sharing, Apex sharing, implicit sharing. There's profile-level CRUD, field-level security, permission sets, permission set groups. There's `with sharing` and `without sharing` at the Apex layer, and inside a class there's `Security.stripInaccessible` and `WITH SECURITY_ENFORCED` for query-time enforcement. Everything overlaps; everything has exceptions.

The two skills covered here — `sf-security` and `sf-comply` — exist because generic security review (Claude's built-in `/security-review`, OWASP cheat sheets, etc.) doesn't know any of that. They'll catch SQL injection. They won't catch a `without sharing` annotation that exposes another user's records.

## What `sf-security` does

`/siftcoder:sf-security` runs a structured review across four layers of your project:

1. **Apex layer.** SOQL injection, CRUD/FLS bypass, sharing-keyword discipline, secrets in code.
2. **LWC / Visualforce layer.** XSS in `lwc:dom="manual"` and Visualforce expressions, `@AuraEnabled` exposure, insecure remote actions.
3. **Configuration layer.** Org-wide defaults too permissive, `View All Data` / `Modify All Data` on non-admin profiles, permission set drift, missing Named Credentials.
4. **Integration layer.** Outbound callouts that hardcode URLs/tokens, inbound webhooks without HMAC, REST/SOAP services missing auth.

Each finding gets a severity (`critical | high | medium | low`), an evidence citation (file path + line), a reproduction hint where applicable, and a fix. No "consider reviewing" — every finding is actionable.

The skill is invoked directly:

```bash
/siftcoder:sf-security
```

…or scoped to a single area:

```bash
/siftcoder:sf-security src/classes/PaymentController.cls
```

…or as part of a broader architecture review through the `salesforce-architect` agent (covered in the next chapter).

## CRUD/FLS — the boring rule that catches everything

Salesforce gives you object-level (CRUD: Create / Read / Update / Delete) and field-level security as a configuration concern. Profiles and permission sets grant a user permission to read `Account.Email`. But Apex code, by default, *runs in system mode* — it sees and modifies whatever the code asks for, regardless of the running user's permissions.

This is fine when the code is admin-only background work. It is a data leak when the code backs a UI surface. A user without `Read` on `Account.Email` shouldn't be able to call your `@AuraEnabled` method and get the Email back, but if your Apex doesn't enforce CRUD/FLS, that's exactly what happens.

Two ways to enforce:

**Query-time** with `WITH SECURITY_ENFORCED`:

```apex
List<Account> accs = [
    SELECT Id, Name, Email FROM Account
    WHERE Industry = :ind
    WITH SECURITY_ENFORCED
];
```

If the running user lacks Read on `Email`, the query *throws* — explicitly, with a clear error. You catch it, you return a graceful response.

**DML-time** with `Security.stripInaccessible`:

```apex
SObjectAccessDecision decision = Security.stripInaccessible(
    AccessType.UPDATABLE,
    accountsFromUI
);
update decision.getRecords();
```

Strips fields the user can't update *before* the DML happens. The DML succeeds for the parts the user is allowed to change; the rest is silently dropped.

The skill flags any `@AuraEnabled` method or REST endpoint whose Apex body issues SOQL or DML without one of these enforcements. It generates the rewrite, with the appropriate `try/catch` for `SecurityException` if you went the SECURITY_ENFORCED route.

## `with sharing`, `without sharing`, `inherited sharing`

The keyword on a class declaration determines whether row-level sharing rules apply.

- **`with sharing`** — the running user only sees records they have access to via the sharing model.
- **`without sharing`** — system mode; sees all records.
- **`inherited sharing`** — uses whichever the calling context uses; defaults to `with` if called directly.

The skill's rule is simple: **`with sharing` is the default**, and any `without sharing` declaration needs a comment explaining why. If you find yourself writing `without sharing` to make a query work, that's a smell — usually means the user genuinely shouldn't have access and you're papering over a permissions issue. Find the actual fix.

The skill flags every `without sharing` class without a justifying comment, and asks for one. It also flags `inherited sharing` classes whose call sites all run `with sharing` (in which case `inherited` is unnecessary indirection).

## SOQL injection

Apex string concatenation into SOQL is the Salesforce equivalent of string concatenation into SQL. Don't do it.

The dangerous pattern:

```apex
String filter = req.params.get('filter');
String q = 'SELECT Id FROM Account WHERE Name = \'' + filter + '\'';
List<Account> accs = Database.query(q);
```

A request with `filter=' OR Id != null UNION SELECT...` bypasses the Name filter entirely.

The fix is bind variables:

```apex
String filter = req.params.get('filter');
List<Account> accs = Database.queryWithBinds(
    'SELECT Id FROM Account WHERE Name = :filter',
    new Map<String, Object>{ 'filter' => filter },
    AccessLevel.USER_MODE
);
```

The skill flags every `Database.query(stringConcatenation)` and rewrites to `queryWithBinds`. It also notices `String.escapeSingleQuotes` — that's a defence in depth but not a substitute for binding.

## Sharing model — when to audit

The architecture chapter goes deeper on this, but a quick note here: `/siftcoder:sf-security` reviews the *code* surface; the sharing model lives in *config* (org-wide defaults, sharing rules, role hierarchy, permission sets). The skill spot-checks config:

- Org-wide default for sensitive objects (target: Private)
- `View All Data` / `Modify All Data` permission grants outside admin profiles
- Permission set group drift (a permset still granted from a role someone left)

But a thorough sharing audit needs the architect agent and access to the live org. Use `/siftcoder:sf-architect --scope security` for that.

## Worked example: reviewing `PaymentController`

You've inherited a payment-handling class. Your job is to make sure it's safe to expose to the new mobile app's API. The class is 230 lines, uses `without sharing`, and has a couple of `Database.query` calls that look like they take user input.

Step one — run the skill, scoped.

```bash
/siftcoder:sf-security src/classes/PaymentController.cls
```

Output:

```
Org / project: my-checkout-org

Findings:

  [CRITICAL]  SOQL injection at PaymentController.cls:42
    Evidence:  query string built via concatenation of req.params.get('filter')
    Repro:     POST /apex/payment?filter=' OR Id != null UNION SELECT Id FROM PaymentToken__c--
    Fix:       use Database.queryWithBinds(query, bindVars, AccessLevel.USER_MODE)

  [HIGH]      without sharing on PaymentController without rationale
    Evidence:  src/classes/PaymentController.cls:14
    Risk:      privileged data exposure to non-admin users
    Fix:       change to with sharing OR document rationale + reviewer approval

  [HIGH]      Named Credential not used for outbound callout
    Evidence:  src/classes/PaymentController.cls:127 — hardcoded https://api.stripe.com
                + apiKey field on a Custom Setting
    Fix:       create Named Credential 'Stripe_Live'; replace hardcoded URL + key

  [MEDIUM]    Missing CRUD check before DML
    Evidence:  src/classes/PaymentController.cls:182 — update PaymentToken__c
                without Schema.SObjectType.PaymentToken__c.IsUpdateable check
    Fix:       use Security.stripInaccessible(AccessType.UPDATABLE, ...) before update

  [LOW]       System.debug at line 95 logs full request body
    Evidence:  src/classes/PaymentController.cls:95
    Risk:      debug logs may include card details if request is malformed
    Fix:       redact sensitive fields before logging or remove debug

Summary:  Critical: 1   High: 2   Medium: 1   Low: 1
```

Step two — fix in priority order. The skill produces a rewrite for each finding.

For the SOQL injection, the rewrite swaps the concatenation for bind vars. You apply it. The test class for `PaymentController` already exists; you add a test that POSTs the malicious filter and asserts a clean rejection.

For the `without sharing`, you read the class. The reason it was `without sharing` is that the original author wanted to query records owned by other users (refund processing). The actual fix isn't to change the keyword — it's to keep `without sharing` *and add a comment explaining why* and an explicit Apex managed-sharing line that grants the running user temporary access. The skill accepts a documented `without sharing` and clears the finding.

For the Named Credential, you create one in setup (or in source via `.namedCredential-meta.xml`), replace the hardcoded URL and key, and confirm the callout still works in a sandbox.

For the CRUD check, you wrap the DML with `Security.stripInaccessible`. Your tests need to cover both the case where the user has Update on PaymentToken__c (positive) and the case where they don't (the DML should be a no-op, not throw).

For the `System.debug`, you decide based on context. In a production deploy you'd remove it. If you keep it, you redact the card number with a regex.

Step three — re-run the skill. All findings cleared. Capture the review to memory:

```
/siftcoder:sf-security src/classes/PaymentController.cls
[no findings — captured: review:payment-controller-2026-05-02]
```

A week later when you're touching the class again, `mem_search { query: "payment controller security review" }` returns this report. The next review starts where this one ended.

## `sf-comply` — when the rules are external

`/siftcoder:sf-comply` is a thin overlay on top of `sf-security` that maps findings to specific compliance frameworks: HIPAA, FedRAMP, PCI-DSS, SOC 2. It doesn't check fundamentally different things — it presents the same findings under a different lens, with the relevant framework citations.

If you're in a regulated industry, run `/siftcoder:sf-comply --framework hipaa` after `/siftcoder:sf-security` and treat the output as audit prep. The skill produces:

- A control-mapping table (your finding → which framework control it relates to)
- A summary suitable for an auditor (sanitised, no actual code in the output)
- A list of controls the framework requires that your project hasn't yet addressed

The skill is honest about which controls it *can't* check (anything that lives outside source — physical security, training records, vendor management). It marks those `manual-attestation-required`.

## The `sf-architect` security lens

If you want a security-flavoured architecture review rather than a code-level review, `/siftcoder:sf-architect --scope security` runs the architect agent with the security skill loaded. Output is the standard architecture report (executive summary, capacity table, risks, roadmap) but every finding is security-shaped.

Use this quarterly. Use the code-level `sf-security` per change.

## Cross-references

- [Architecture](architecture.md) — the broader org review.
- [Apex patterns](apex-patterns.md) — overlaps on `with sharing` and bulk-safe patterns.
- The full skill body is at `skills/salesforce/salesforce-security/SKILL.md`.

Next: [the LWC chapter](lwc.md).
