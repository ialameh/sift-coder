# Apex patterns

The `apex-patterns` skill is the workhorse of the Salesforce pack. It encodes the structural rules — Selector / Domain / Service / UnitOfWork from FFLib, plus trigger-handler discipline and bulk safety — that separate Apex you can maintain from Apex that quietly accumulates governor-limit time bombs.

This chapter is about *when* to reach for each pattern, *how* to invoke the skill, and what the skill will and won't do for you.

## When patterns earn their keep

There's a spectrum. On one end is a 200-line Apex utility class that wraps a single REST callout. Wrapping that in a Service interface, a UnitOfWork, and a Domain class is theatre — the abstraction has nothing to abstract. On the other end is an Order processing pipeline that touches Order, OrderItem, Pricebook, and four custom objects, runs as part of a checkout flow, gets called from triggers, batch jobs, and an external API. That one needs structure or it will rot.

The skill's rule of thumb:

- **Controller-only or utility-only** — under ~200 lines, single object, single entry point. Just write the class.
- **Trigger-handler** — anything in a trigger. Move logic to a handler class immediately. The trigger body should be ten lines: dispatch by context to handler methods.
- **FFLib enterprise patterns** (Selector / Domain / Service / UnitOfWork) — multi-object workflows, anything that runs from more than one entry point, anything where you've found yourself writing the same SOQL in three places.

If you're unsure, default to trigger-handler. It's the cheap upgrade. FFLib is the expensive upgrade — pay for it when the domain justifies it.

## How to invoke the skill

Three ways.

**Implicitly via topic.** Ask Claude to "build an OrderProcessingService" or "refactor this trigger to use a handler" and the skill auto-loads from its description. You don't need to mention it.

**Explicitly via slash command.** `/siftcoder:apex-patterns` with a subcommand:

- `/siftcoder:apex-patterns selector Account` — scaffolds `AccountsSelector.cls` extending `fflib_SObjectSelector`.
- `/siftcoder:apex-patterns domain Order` — generates `Orders.cls` (domain class) plus a factory.
- `/siftcoder:apex-patterns service OrderProcessing` — generates the service interface, an implementation, and a locator entry.
- `/siftcoder:apex-patterns uow Order,OrderItem,Pricebook` — generates `Application.cls` with the UnitOfWork registration for those objects.

Each subcommand also generates a paired test class. The test classes are stubs — they compile and have one passing assertion — but they're shaped correctly for you to fill in.

**As a review pass.** "Review `OrderProcessor.cls` against `apex-patterns`" — the skill rules are applied as a checklist against existing code, returning a list of structural issues without rewriting anything.

## A worked example: the Quote-to-Order service

Imagine you've been asked to build a service that, given an approved Quote, creates an Order with OrderItems, applies pricing rules, and fires a Platform Event for downstream sync. It's called from a button on the Quote page (LWC → `@AuraEnabled` Apex), from a batch job that processes quotes that came in via API overnight, and from a trigger on Quote that fires when status flips to `Approved`.

This is exactly the case FFLib was designed for. Three entry points, four objects, business rules that need to be testable in isolation.

Step one — selectors. `QuotesSelector.cls`, `QuoteLinesSelector.cls`, `OrdersSelector.cls`, `OrderItemsSelector.cls`. Each one isolates SOQL for its object. Field lists go in the selector, not in the service. If three different services need Quote.Total__c, they all read it through `QuotesSelector.selectByIdWithLines(ids)` instead of writing the SOQL three times.

```bash
/siftcoder:apex-patterns selector Quote
/siftcoder:apex-patterns selector QuoteLine
/siftcoder:apex-patterns selector Order
/siftcoder:apex-patterns selector OrderItem
```

Step two — domain classes. `Quotes.cls` and `Orders.cls`. Domain classes hold *behaviour that belongs to a record*. `Quotes.applyApprovalRules()` is on the domain class. `Orders.markFulfilled()` is on the domain class. Things that operate on a single object's invariants live here.

Step three — the service. `QuoteToOrderService.cls`, with an interface `IQuoteToOrderService` so it can be mocked. The service is *cross-object* logic: take quotes, build orders, link line items, publish the event. Critically, the service operates on collections, not single records — `convertQuotes(Set<Id> quoteIds)`, never `convertQuote(Id quoteId)`.

```bash
/siftcoder:apex-patterns service QuoteToOrder
```

Step four — UnitOfWork. The service builds up `Order` and `OrderItem` records in memory, registers them with the UoW, and at the end calls `uow.commitWork()`. That's a single transaction with the DML rolled into one operation per object — three DML statements regardless of whether you're processing one quote or two thousand.

```bash
/siftcoder:apex-patterns uow Order,OrderItem
```

Step five — the trigger. The trigger on Quote does *one thing*: dispatches to the handler.

```apex
trigger QuoteTrigger on Quote (after update) {
    new QuoteTriggerHandler().run();
}
```

The handler decides whether the status flipped to Approved, collects the relevant ids, and calls the service. The trigger never grows past those three lines. The handler is testable. The service is mockable. The selectors are reused. The same service powers the LWC button, the batch job, and the trigger — three call sites, one implementation.

That's what the patterns buy you. It's a lot of files for a simple feature, but a year later when someone asks "where does Quote-to-Order pricing happen" the answer is one class instead of "look through these four triggers and the controller and that one batch job."

## Bulk-safety reminders

The skill enforces a few rules that catch the most common governor-limit failures:

- **No SOQL inside a loop.** Ever. The skill flags any `[SELECT ...]` inside `for (...)` and rewrites to a pre-loop query keyed by id.
- **No DML inside a loop.** Same rule. Build a list inside the loop, DML it once outside.
- **Triggers must handle 200 records.** Test classes need at least one bulk path inserting/updating 200 records to verify.
- **Recursive trigger guards.** A static `Set<Id> alreadyProcessed` at the handler level. The skill includes the boilerplate.

These are not negotiable in the skill output. If you ask for "a simple version that just handles one record" the skill will still write it bulk-safe. The bulk-safe version is not significantly harder to write; the painful version is the one that ships and then breaks under load three months later.

## Common pitfalls the skill flags

**Recursion.** Trigger A updates Account, which fires trigger B on Account, which updates the original record, which fires trigger A again. Use a static guard set keyed by record id, cleared per transaction.

**Mixed-DML.** You can't insert a setup object (User, Profile, Group, Role, etc.) and a non-setup object in the same transaction. The fix is `System.runAs(user)` blocks for setup, or `@future` to push the non-setup DML out of the current transaction. The skill detects mixed-DML in tests and warns.

**Hardcoded record-type ids.** They differ by org. Always look them up via `Schema.SObjectType.X.getRecordTypeInfosByDeveloperName().get('Y').getRecordTypeId()`. The skill rewrites hardcoded ids when it sees them.

**Swallowed exceptions.** `catch (Exception e) {}` is the silent killer of debug logs. The skill replaces empty catches with at minimum a `System.debug(LoggingLevel.ERROR, e)` and ideally a custom error sObject insert.

**`SeeAllData=true` in tests.** Default to `false`. Use a `TestDataFactory` for setup. The skill scaffolds the factory if one isn't present.

## When *not* to reach for the skill

Patterns are not a substitute for thinking. A few cases where the skill should be skipped:

- **One-off scripts.** Anonymous Apex you'll run once and throw away doesn't need a service interface.
- **Highly performance-critical batch.** Sometimes the abstraction layers cost CPU you can't spare. Profile first; if the UoW commit is hot, drop down to direct DML and document the reason in a comment.
- **Tiny custom apps.** A 300-line org with two custom objects and one trigger doesn't need FFLib. The skill knows this — it'll tell you to skip.
- **You're learning.** If you've never written a Selector class, generate one once with the skill, then write the next one by hand. The skill is a productivity tool, not a substitute for understanding the patterns.

## Cross-references

- The `apex-bulkifier` agent (under `agents/apex-bulkifier.md`) is a narrow refactor agent that takes a single row-by-row class and converts it to bulk-safe form. Use it when you've inherited a class that violates the rules; use the skill when you're writing fresh code.
- The [security chapter](security.md) overlaps — `with sharing`, CRUD/FLS, and SOQL injection are all enforced there too.
- The [test pack](../reference/skills.md#sf-test) includes the test data factory templates the skill references.

The next chapter walks through schema work — adding fields, migrating relationships, generating ERDs from metadata.
